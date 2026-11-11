const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// 1. Get all verified buildings (Public search)
router.get("/", async (req, res) => {
  try {
    const { city, gender_type } = req.query;

    // Check if the request is authenticated from a PG Owner
    const authHeader = req.headers.authorization;
    let ownerId = null;
    if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer undefined" && authHeader !== "Bearer ") {
      const token = authHeader.split(" ")[1];
      try {
        const { data, error: authErr } = await supabase.auth.getUser(token);
        const user = data?.user;
        if (user && !authErr) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (profile && (profile.role === "pg_owner" || profile.role === "owner")) {
            // Fetch their PG Owner ID
            const { data: owner } = await supabase
              .from("pg_owners")
              .select("id")
              .eq("profile_id", profile.id)
              .single();
            if (owner) {
              ownerId = owner.id;
            }
          }
        }
      } catch (err) {
        console.error("Auth parsing warning:", err.message);
      }
    }

    let query = supabase.from("buildings").select("*, amenities(*)");

    if (ownerId) {
      // Owner Console query -> Filter by owner
      query = query.eq("owner_id", ownerId);
    } else {
      // Public search query -> Filter by city/gender
      if (city) query = query.eq("city", city);
      if (gender_type) query = query.eq("gender_type", gender_type);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch floors, rooms, beds, and active tenants to calculate occupancy dynamically
    const { data: floors } = await supabase.from("floors").select("id, building_id");
    const { data: rooms } = await supabase.from("rooms").select("id, floor_id");
    const { data: beds } = await supabase.from("beds").select("id, room_id");
    const { data: activeTenants } = await supabase
      .from("tenants")
      .select("id, building_id")
      .eq("status", "active");

    const enriched = (data || []).map(b => {
      const bFloors = (floors || []).filter(f => f.building_id === b.id);
      const bFloorIds = bFloors.map(f => f.id);
      const bRooms = (rooms || []).filter(r => bFloorIds.includes(r.floor_id));
      const bRoomIds = bRooms.map(r => r.id);
      const bBeds = (beds || []).filter(bd => bRoomIds.includes(bd.room_id));
      const bTenants = (activeTenants || []).filter(t => t.building_id === b.id);

      return {
        ...b,
        total_rooms: bRooms.length,
        total_beds: bBeds.length,
        occupied_beds: bTenants.length
      };
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all available amenities in system (Owner / Tenant)
// GET /api/buildings/amenities
router.get("/amenities", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("amenities")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get specific building details with floors, rooms, beds (Public or Tenant view)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data: building, error: bError } = await supabase
      .from("buildings")
      .select("*, amenities(*)")
      .eq("id", id)
      .single();

    if (bError) throw bError;

    // Fetch floors
    const { data: floors, error: fError } = await supabase
      .from("floors")
      .select("*")
      .eq("building_id", id);

    const floorIds = (floors || []).map(f => f.id);

    // Fetch rooms
    let rooms = [];
    if (floorIds.length > 0) {
      const { data: rData, error: rError } = await supabase
        .from("rooms")
        .select("*")
        .in("floor_id", floorIds);
      if (rError) throw rError;
      rooms = rData || [];
    }

    const roomIds = rooms.map(r => r.id);

    // Fetch beds
    let beds = [];
    if (roomIds.length > 0) {
      const { data: bdData, error: bdError } = await supabase
        .from("beds")
        .select("*")
        .in("room_id", roomIds);
      if (bdError) throw bdError;
      beds = bdData || [];
    }

    // Fetch all active tenants for this building
    const { data: tenantsList } = await supabase
      .from("tenants")
      .select(`
        id,
        profile_id,
        room_id,
        bed_id,
        joining_date,
        deposit,
        monthly_rent,
        profiles ( name, email, mobile )
      `)
      .eq("building_id", id)
      .eq("status", "active");

    // Fetch rent payments for these tenants to determine outstanding dues
    const tenantIds = (tenantsList || []).map(t => t.id);
    let paymentsList = [];
    if (tenantIds.length > 0) {
      const { data: pData } = await supabase
        .from("rent_payments")
        .select("tenant_id, amount, status, month, due_date")
        .in("tenant_id", tenantIds);
      paymentsList = pData || [];
    }

    // Fetch all pending/approved bookings for this building
    const { data: bookingsList } = await supabase
      .from("bookings")
      .select("id, tenant_profile_id, room_id")
      .eq("building_id", id)
      .in("booking_status", ["Pending", "Approved"]);

    const profileIds = new Set();
    (tenantsList || []).forEach(t => profileIds.add(t.profile_id));
    (bookingsList || []).forEach(b => profileIds.add(b.tenant_profile_id));

    let profilesMap = {};
    try {
      if (profileIds.size > 0) {
        const { data: profilesList } = await supabase
          .from("profiles")
          .select("id, gender, email, name")
          .in("id", Array.from(profileIds));
        (profilesList || []).forEach(p => {
          let g = p.gender;
          if (!g && p.email) {
            if (p.email.toLowerCase().includes("female") || p.email.toLowerCase().includes("priya") || (p.name && p.name.toLowerCase().includes("priya"))) {
              g = "Female";
            } else {
              g = "Male";
            }
          }
          if (g) profilesMap[p.id] = g;
        });
      }
    } catch (_) {}

    // Map each room's gender lock based on active tenants or bookings
    const roomsWithLocks = (rooms || []).map(room => {
      let genderLock = null;
      // Check active tenants in room
      const roomTenants = (tenantsList || []).filter(t => t.room_id === room.id);
      for (const t of roomTenants) {
        if (profilesMap[t.profile_id]) {
          genderLock = profilesMap[t.profile_id];
          break;
        }
      }
      // If not locked yet, check bookings in room
      if (!genderLock) {
        const roomBookings = (bookingsList || []).filter(b => b.room_id === room.id);
        for (const b of roomBookings) {
          if (profilesMap[b.tenant_profile_id]) {
            genderLock = profilesMap[b.tenant_profile_id];
            break;
          }
        }
      }
      return {
        ...room,
        gender_lock: genderLock
      };
    });

    const enrichedBeds = (beds || []).map(bd => {
      const activeTenant = (tenantsList || []).find(t => t.bed_id === bd.id);
      if (activeTenant) {
        const tenantPayments = (paymentsList || []).filter(p => p.tenant_id === activeTenant.id);
        const outstandingCount = tenantPayments.filter(p => p.status !== "Paid").length;
        const latestPayment = tenantPayments.sort((a, b) => new Date(b.due_date) - new Date(a.due_date))[0];

        return {
          ...bd,
          status: "Occupied",
          tenant_id: activeTenant.id,
          tenant: {
            id: activeTenant.id,
            profile_id: activeTenant.profile_id,
            name: activeTenant.profiles?.name || "Unknown Resident",
            email: activeTenant.profiles?.email || "",
            mobile: activeTenant.profiles?.mobile || "",
            joining_date: activeTenant.joining_date,
            deposit: activeTenant.deposit,
            monthly_rent: activeTenant.monthly_rent,
            outstanding_invoices: outstandingCount,
            latest_rent_status: latestPayment ? latestPayment.status : "No Invoice Generated",
            latest_rent_month: latestPayment ? latestPayment.month : null
          }
        };
      }
      return bd;
    });

    res.status(200).json({
      building,
      floors: floors || [],
      rooms: roomsWithLocks,
      beds: enrichedBeds
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Create a building (Owner or Admin)
router.post("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { building_name, address, city, state, pincode, postal_code, gender_type, description, security_deposit, monthly_rent_starting, latitude, longitude, amenity_ids } = req.body;
  if (!building_name || !city || !gender_type) {
    return res.status(400).json({ error: "Missing building details" });
  }

  try {
    // Find the owner record from pg_owners using req.user.id (profile ID)
    const { data: owner, error: oError } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (oError || !owner) {
      return res.status(400).json({ error: "PG Owner profile not found." });
    }

    const { data, error } = await supabase
      .from("buildings")
      .insert([
        {
          owner_id: owner.id,
          building_name,
          address: address || "",
          city,
          state: state || "",
          pincode: pincode || postal_code || "",
          gender_type,
          description: description || "",
          security_deposit: security_deposit || 0,
          monthly_rent_starting: monthly_rent_starting || 0,
          latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
          longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Save amenities if selected
    if (Array.isArray(amenity_ids) && amenity_ids.length > 0) {
      const inserts = amenity_ids.map(aId => ({
        building_id: data.id,
        amenity_id: aId
      }));
      const { error: aErr } = await supabase
        .from("building_amenities")
        .insert(inserts);
      if (aErr) throw aErr;
    }

    // Automatically insert default onboarding verification tasks for the new building
    const verificationTasks = [
      { building_id: data.id, task_type: "gps_logging", status: "pending" },
      { building_id: data.id, task_type: "video_verification", status: "pending" }
    ];
    const { error: vtErr } = await supabase
      .from("verification_tasks")
      .insert(verificationTasks);
    if (vtErr) throw vtErr;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Create a Floor (Owner/Admin)
router.post("/:buildingId/floors", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { buildingId } = req.params;
  const { floor_number } = req.body;
  if (floor_number === undefined) {
    return res.status(400).json({ error: "Missing floor number" });
  }

  try {
    const { data, error } = await supabase
      .from("floors")
      .insert([{ building_id: buildingId, floor_number }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Create a Room (Owner/Admin)
router.post("/:buildingId/floors/:floorId/rooms", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { buildingId, floorId } = req.params;
  const { room_number, room_type, max_occupancy, rent, double_sharing_rent, attached_bathroom, ac } = req.body;

  if (!room_number || !room_type || !max_occupancy) {
    return res.status(400).json({ error: "Missing room parameters" });
  }

  try {
    const { data, error } = await supabase
      .from("rooms")
      .insert([
        {
          floor_id: floorId,
          room_number,
          room_type,
          capacity: parseInt(max_occupancy, 10),
          rent: parseFloat(rent || double_sharing_rent || 0),
          attached_bathroom: !!attached_bathroom,
          ac: !!ac
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Automatically create beds matching the capacity of the room
    const bedInserts = [];
    const capacityNum = parseInt(max_occupancy, 10) || 1;
    for (let i = 1; i <= capacityNum; i++) {
      bedInserts.push({
        room_id: data.id,
        bed_number: `${i}`,
        status: "Available"
      });
    }
    if (bedInserts.length > 0) {
      await supabase.from("beds").insert(bedInserts);
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Create a Bed (Owner/Admin)
router.post("/:buildingId/floors/:floorId/rooms/:roomId/beds", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { roomId } = req.params;
  const { bed_number } = req.body;

  if (!bed_number) {
    return res.status(400).json({ error: "Missing bed number" });
  }

  try {
    const { data, error } = await supabase
      .from("beds")
      .insert([
        {
          room_id: roomId,
          bed_number,
          status: "Available"
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Update building details (Owner/Admin)
router.put("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { building_name, address, city, state, pincode, gender_type, description, security_deposit, monthly_rent_starting, latitude, longitude } = req.body;

  try {
    // Get owner's record
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) return res.status(403).json({ error: "Forbidden: Not an owner" });

    // Update building
    const { data, error } = await supabase
      .from("buildings")
      .update({
        building_name,
        address,
        city,
        state,
        pincode,
        gender_type,
        description,
        security_deposit,
        monthly_rent_starting,
        latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null
      })
      .eq("id", id)
      .eq("owner_id", owner.id) // verify ownership
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Delete a Room (Owner/Admin)
router.delete("/:buildingId/floors/:floorId/rooms/:roomId", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { roomId } = req.params;
  try {
    // Check if room has active occupants
    const { data: occupants, error: checkError } = await supabase
      .from("tenants")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "active");

    if (checkError) throw checkError;

    if (occupants && occupants.length > 0) {
      return res.status(400).json({ error: "Cannot delete room: Room has active occupants." });
    }

    // Delete dependent beds first to ensure no constraint violations
    await supabase
      .from("beds")
      .delete()
      .eq("room_id", roomId);

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("id", roomId);

    if (error) throw error;
    res.status(200).json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Update Room Housekeeping Status (Owner/Admin)
router.patch("/:buildingId/rooms/:roomId/housekeeping-status", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { roomId } = req.params;
  const { housekeeping_status } = req.body;
  const validStatuses = ["ready", "cleaning", "maintenance", "vacant_ready"];
  if (!validStatuses.includes(housekeeping_status)) {
    return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
  }
  try {
    const { data, error } = await supabase
      .from("rooms")
      .update({ housekeeping_status })
      .eq("id", roomId)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Smart Room Allocation Suggestions for a booking
// GET /api/buildings/:buildingId/room-suggestions?booking_id=&gender=&budget=
router.get("/:buildingId/room-suggestions", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { buildingId } = req.params;
  const { gender, budget } = req.query;

  try {
    const { data: floors } = await supabase.from("floors").select("id").eq("building_id", buildingId);
    const floorIds = (floors || []).map(f => f.id);
    if (floorIds.length === 0) return res.json({ suggestions: [] });

    const { data: rooms } = await supabase
      .from("rooms")
      .select("*, beds(*)")
      .in("floor_id", floorIds)
      .eq("housekeeping_status", "ready");

    const budgetNum = parseFloat(budget || 0);
    const suggestions = [];

    (rooms || []).forEach(room => {
      const availableBeds = (room.beds || []).filter(b => b.status === "Available");
      if (availableBeds.length === 0) return;

      let score = 0;
      const reasons = [];

      // Budget match (within 15%)
      if (budgetNum > 0 && room.rent) {
        const diff = Math.abs(room.rent - budgetNum) / budgetNum;
        if (diff <= 0.15) { score += 30; reasons.push("✓ Budget Match"); }
      }

      // Gender match
      if (gender && room.gender_locked) {
        if (room.gender_locked === gender) { score += 40; reasons.push(`✓ ${gender} Room`); }
        else { return; } // skip
      } else if (!room.gender_locked) {
        score += 20; reasons.push("✓ Open Room");
      }

      // Available beds bonus
      if (availableBeds.length >= 2) { score += 10; reasons.push("✓ Multiple Beds Available"); }

      suggestions.push({
        roomId: room.id,
        bedId: availableBeds[0]?.id || null,
        roomNumber: room.room_number,
        roomType: room.room_type,
        rent: room.rent,
        availableBeds: availableBeds.length,
        score,
        reasons,
        matchLabel: score >= 70 ? "Perfect Match" : score >= 40 ? "Good Match" : "Possible Match"
      });
    });

    suggestions.sort((a, b) => b.score - a.score);
    res.json({ suggestions: suggestions.slice(0, 3) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Get building amenities (Owner / Tenant)
// GET /api/buildings/:id/amenities
router.get("/:id/amenities", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("building_amenities")
      .select("amenity_id")
      .eq("building_id", id);

    if (error) throw error;
    res.json((data || []).map(ba => ba.amenity_id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Save building amenities (Owner)
// POST /api/buildings/:id/amenities
router.post("/:id/amenities", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { amenity_ids } = req.body;
  if (!Array.isArray(amenity_ids)) {
    return res.status(400).json({ error: "amenity_ids must be an array" });
  }

  try {
    // 1. Delete existing associations
    const { error: dErr } = await supabase
      .from("building_amenities")
      .delete()
      .eq("building_id", id);

    if (dErr) throw dErr;

    // 2. Insert new associations if selected
    if (amenity_ids.length > 0) {
      const inserts = amenity_ids.map(aId => ({
        building_id: id,
        amenity_id: aId
      }));

      const { error: iErr } = await supabase
        .from("building_amenities")
        .insert(inserts);

      if (iErr) throw iErr;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

