const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// 1. Create a booking (Tenant)
router.post("/", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { building_id, floor_id, room_id, bed_id, move_in_date, advance_amount } = req.body;
  if (!building_id || !floor_id || !room_id || !bed_id || !move_in_date) {
    return res.status(400).json({ error: "Missing booking options" });
  }

  try {
    // Check if bed is available
    const { data: bed, error: bError } = await supabase
      .from("beds")
      .select("status")
      .eq("id", bed_id)
      .single();

    if (bError || !bed) {
      return res.status(400).json({ error: "Bed not found or invalid" });
    }
    if (bed.status !== "Available") {
      return res.status(400).json({ error: "Bed is already occupied or reserved" });
    }

    // Get building and tenant profile for gender-locking check
    const [{ data: building, error: blgError }, { data: tenantProfile, error: profileError }] = await Promise.all([
      supabase.from("buildings").select("owner_id, gender_type").eq("id", building_id).single(),
      supabase.from("profiles").select("gender").eq("id", req.user.id).single()
    ]);

    if (blgError || !building) {
      return res.status(400).json({ error: "Building not found" });
    }

    let tenantGender = tenantProfile?.gender || null;
    if (!tenantGender && req.user && req.user.email) {
      if (req.user.email.toLowerCase().includes("female") || req.user.email.toLowerCase().includes("priya") || req.user.email.toLowerCase().includes("woman")) {
        tenantGender = "Female";
      } else {
        tenantGender = "Male";
      }
    }

    // ── Gender Policy Enforcement ──────────────────────────────
    // 1. Building-level gender check
    if (building.gender_type === "Male Only" && tenantGender === "Female") {
      return res.status(403).json({ error: "This PG is for Male residents only." });
    }
    if (building.gender_type === "Female Only" && tenantGender === "Male") {
      return res.status(403).json({ error: "This PG is for Female residents only." });
    }

    // 2. Room-level gender lock for Co-Living buildings with shared rooms
    if (building.gender_type === "Co-Living") {
      // Get all occupied/reserved beds in this room
      const { data: roomBeds } = await supabase
        .from("beds")
        .select("id, tenant_id")
        .eq("room_id", room_id)
        .neq("status", "Available");

      if (roomBeds && roomBeds.length > 0) {
        // Find the gender of one of the existing room occupants
        const occupiedTenantId = roomBeds.find(b => b.tenant_id)?.tenant_id;
        if (occupiedTenantId) {
          // Get tenant's profile_id from tenants table
          const { data: existingTenant } = await supabase
            .from("tenants")
            .select("profile_id")
            .eq("id", occupiedTenantId)
            .single();

          if (existingTenant) {
            const { data: existingProfile } = await supabase
              .from("profiles")
              .select("gender")
              .eq("id", existingTenant.profile_id)
              .single();

            const roomGender = existingProfile?.gender;
            if (roomGender && tenantGender && roomGender !== tenantGender) {
              return res.status(403).json({
                error: `This room is currently occupied by ${roomGender} residents. In a Co-Living PG, shared rooms can only have one gender.`,
                room_gender_lock: roomGender
              });
            }
          }
        }
      }
    }
    // ── End Gender Policy ─────────────────────────────────────

    // Insert booking application
    const { data: booking, error: bkError } = await supabase
      .from("bookings")
      .insert([
        {
          building_id,
          room_id,
          bed_id,
          tenant_profile_id: req.user.id,
          booking_status: "Pending",
          move_in_date,
          advance_amount: advance_amount || 0
        }
      ])
      .select()
      .single();

    if (bkError) throw bkError;

    // Create a pending tenancy record in tenants table to allow KYC document upload
    const { data: newTenant, error: tError } = await supabase
      .from("tenants")
      .insert([
        {
          profile_id: req.user.id,
          owner_id: building.owner_id,
          building_id,
          room_id,
          bed_id,
          deposit: advance_amount || 5000,
          status: "pending"
        }
      ])
      .select()
      .single();

    if (tError) throw tError;

    // Generate a Pending Security Deposit Invoice if they uploaded a receipt screenshot
    const { receipt_url, transaction_id, payment_method } = req.body;
    if (newTenant && receipt_url) {
      await supabase
        .from("rent_payments")
        .insert([{
          tenant_id: newTenant.id,
          amount: advance_amount || 5000,
          status: "Pending",
          month: "Security Deposit",
          due_date: move_in_date,
          receipt_url,
          transaction_id,
          payment_method: payment_method || "UPI"
        }]);
    }

    // Set bed status to Reserved
    await supabase
      .from("beds")
      .update({ status: "Reserved" })
      .eq("id", bed_id);

    // Add compatibility key mapping
    const responseData = {
      ...booking,
      status: booking.booking_status
    };

    res.status(201).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 2. Get my bookings (Tenant)
router.get("/my-bookings", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        buildings (
          building_name,
          pg_owners (
            profiles (
              name,
              mobile
            )
          )
        ),
        rooms ( room_number ),
        beds ( bed_number )
      `)
      .eq("tenant_profile_id", req.user.id);

    if (error) throw error;

    // Map booking_status to status and inject owner details for client compatibility
    const formatted = (data || []).map(item => ({
      ...item,
      status: item.booking_status,
      owner_name: item.buildings?.pg_owners?.profiles?.name || "Property Owner",
      owner_mobile: item.buildings?.pg_owners?.profiles?.mobile || ""
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get owner's incoming bookings (Owner)
router.get("/owner-bookings", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    // Get owner's record
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) return res.status(200).json([]);

    const { data, error } = await supabase
      .from("bookings")
      .select("*, buildings(building_name, owner_id), rooms(room_number), beds(bed_number), profiles(full_name, email)")
      .eq("buildings.owner_id", owner.id);

    if (error) throw error;

    // Map booking_status to status and filter correctly
    const formatted = (data || [])
      .filter(item => item.buildings && item.buildings.owner_id === owner.id)
      .map(item => ({
        ...item,
        status: item.booking_status
      }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update booking status / Approve (Owner)
router.put("/:id/status", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved' or 'Rejected'

  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }

  try {
    const { room_id, bed_id } = req.body;

    // Get current booking details
    const { data: booking, error: bkError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (bkError || !booking) {
      return res.status(404).json({ error: "Booking application not found" });
    }

    const originalBedId = booking.bed_id;
    const targetRoomId = room_id || booking.room_id;
    const targetBedId = bed_id || booking.bed_id;

    // Get room details to know rent
    const { data: room } = await supabase
      .from("rooms")
      .select("rent")
      .eq("id", targetRoomId)
      .single();

    if (status === "Approved") {
      // If allocating a new bed, free up the original bed
      if (targetBedId !== originalBedId) {
        await supabase
          .from("beds")
          .update({ status: "Available", tenant_id: null })
          .eq("id", originalBedId);
          
        // Update the booking record to reflect new room/bed
        await supabase
          .from("bookings")
          .update({ room_id: targetRoomId, bed_id: targetBedId })
          .eq("id", id);
      }

      // Find the existing pending tenancy record
      const { data: existingTenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("profile_id", booking.tenant_profile_id)
        .eq("status", "pending")
        .maybeSingle();

      let tenantId;
      if (existingTenant) {
        // Update pending tenancy to active with the target room/bed
        const { data: updatedTenant } = await supabase
          .from("tenants")
          .update({
            status: "active",
            room_id: targetRoomId,
            bed_id: targetBedId,
            joining_date: booking.move_in_date,
            monthly_rent: room?.rent || 8500
          })
          .eq("id", existingTenant.id)
          .select()
          .single();

        tenantId = existingTenant.id;
      } else {
        // Fallback: Create tenancy record if not found
        const { data: owner } = await supabase
          .from("pg_owners")
          .select("id")
          .eq("profile_id", booking.tenant_profile_id)
          .maybeSingle();

        const { data: newTenant, error: tError } = await supabase
          .from("tenants")
          .insert([
            {
              profile_id: booking.tenant_profile_id,
              owner_id: owner?.id || booking.building_id,
              building_id: booking.building_id,
              room_id: targetRoomId,
              bed_id: targetBedId,
              status: "active",
              joining_date: booking.move_in_date,
              monthly_rent: room?.rent || 8500,
              deposit: booking.advance_amount || 5000
            }
          ])
          .select()
          .single();

        if (tError) throw tError;
        tenantId = newTenant.id;
      }

      // Update target Bed status to Occupied and assign tenant_id
      await supabase
        .from("beds")
        .update({ status: "Occupied", tenant_id: tenantId })
        .eq("id", targetBedId);

      // Check if a Security Deposit invoice already exists for this tenant (uploaded during booking request)
      const { data: existingDeposit } = await supabase
        .from("rent_payments")
        .select("id, status")
        .eq("tenant_id", tenantId)
        .eq("month", "Security Deposit")
        .maybeSingle();

      if (existingDeposit) {
        await supabase
          .from("rent_payments")
          .update({
            status: "Paid",
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "Booking Advance"
          })
          .eq("id", existingDeposit.id);
      } else {
        // Generate a new Paid Security Deposit Invoice as fallback
        await supabase
          .from("rent_payments")
          .insert([{
            tenant_id: tenantId,
            amount: booking.advance_amount || 5000,
            status: "Paid",
            month: "Security Deposit",
            due_date: booking.move_in_date,
            payment_date: new Date().toISOString().split("T")[0],
            payment_method: "Booking Advance",
            transaction_id: "BOOKING-ADV-" + booking.id.slice(0, 6).toUpperCase()
          }]);
      }

      // Generate First Month's Rent Invoice (Unpaid, to be paid by resident)
      const currentMonthName = new Date(booking.move_in_date).toLocaleString("en-US", { month: "long", year: "numeric" });
      await supabase
        .from("rent_payments")
        .insert([{
          tenant_id: tenantId,
          amount: room?.rent || 8500,
          status: "Unpaid",
          month: currentMonthName,
          due_date: booking.move_in_date
        }]);

    } else {
      // Rejected - Reset Bed status back to Available
      await supabase
        .from("beds")
        .update({ status: "Available" })
        .eq("id", originalBedId);

      // Cancel/Remove pending tenant record
      await supabase
        .from("tenants")
        .delete()
        .eq("profile_id", booking.tenant_profile_id)
        .eq("status", "pending");
    }

    // Update Booking status
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({ booking_status: status })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    const responseData = {
      ...updatedBooking,
      status: updatedBooking.booking_status
    };

    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
