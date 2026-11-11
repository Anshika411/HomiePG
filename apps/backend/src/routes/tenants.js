const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// 1. Get my KYC documents (Tenant)
router.get("/kyc", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    // Find tenant profile first (can be pending or active)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!tenant) return res.status(200).json([]);

    const { data, error } = await supabase
      .from("tenant_documents")
      .select("*")
      .eq("tenant_id", tenant.id);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Submit/Upload KYC Document (Tenant)
router.post("/kyc", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { document_type, document_number, file_url } = req.body;
  if (!document_type || !document_number || !file_url) {
    return res.status(400).json({ error: "Missing required KYC fields" });
  }

  try {
    // Find tenant profile (can be pending or active)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!tenant) {
      return res.status(400).json({ error: "Active or pending tenancy record not found. Please select a bed first." });
    }

    const { data, error } = await supabase
      .from("tenant_documents")
      .insert([
        {
          tenant_id: tenant.id,
          document_type,
          document_number,
          file_url,
          verified: false
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

// 3. Request Move-out / Checkout (Tenant)
router.post("/checkout-request", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { expected_leave_date } = req.body;
  if (!expected_leave_date) {
    return res.status(400).json({ error: "expected_leave_date required" });
  }

  try {
    // Find tenant profile (must be active or notice_period)
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, status")
      .eq("profile_id", req.user.id)
      .single();

    if (!tenant) {
      return res.status(400).json({ error: "Active tenancy record not found." });
    }

    if (tenant.status === "left") {
      return res.status(400).json({ error: "Tenant has already checked out." });
    }

    const { data, error } = await supabase
      .from("tenants")
      .update({
        status: "notice_period",
        expected_leave_date
      })
      .eq("id", tenant.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Get my current active stay details (Tenant)
router.get("/my-stay", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tenants")
      .select("*, buildings(building_name, address), rooms(room_number, rent, room_type), beds!tenants_bed_id_fkey(bed_number)")
      .eq("profile_id", req.user.id)
      .single();

    if (error) {
      console.error("[my-stay error]", error);
      return res.status(200).json(null);
    }
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Get pending KYC documents for owner's buildings (Owner)
router.get("/pending-kyc", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) {
      return res.status(404).json({ error: "Owner profile not found" });
    }

    const { data: buildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("owner_id", owner.id);

    const buildingIds = (buildings || []).map(b => b.id);
    if (buildingIds.length === 0) return res.status(200).json([]);

    const { data, error } = await supabase
      .from("tenant_documents")
      .select(`
        *,
        tenants (
          id,
          building_id,
          profiles (
            name,
            email
          )
        )
      `)
      .eq("verified", false);

    if (error) throw error;

    // Filter matching active owner's buildings
    const filtered = (data || []).filter(doc => doc.tenants && buildingIds.includes(doc.tenants.building_id));
    res.status(200).json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Approve or Reject KYC document (Owner)
router.post("/verify-kyc/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'approve' or 'reject'
  try {
    const verifiedStatus = action === "approve";
    const { data, error } = await supabase
      .from("tenant_documents")
      .update({ verified: verifiedStatus })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json({ message: `KYC document ${verifiedStatus ? "approved" : "rejected"} successfully!`, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get active residents under owner's buildings (Owner)
// GET /api/tenants/owner-residents
router.get("/owner-residents", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data: owner } = await supabase.from("pg_owners").select("id").eq("profile_id", req.user.id).single();
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data: buildings } = await supabase.from("buildings").select("id").eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);
    if (buildingIds.length === 0) return res.json([]);

    const { data: residents, error } = await supabase
      .from("tenants")
      .select(`
        *,
        buildings ( building_name ),
        rooms ( room_number, rent ),
        beds:beds!bed_id ( bed_number ),
        profiles ( name, email ),
        tenant_documents ( id, document_type, document_number, file_url, verified )
      `)
      .in("building_id", buildingIds)
      .eq("status", "active");

    if (error) throw error;

    // Get ratings
    const { data: ratings } = await supabase
      .from("tenant_ratings")
      .select("*")
      .eq("owner_id", owner.id);

    const ratingsMap = {};
    (ratings || []).forEach(r => {
      ratingsMap[r.tenant_profile_id] = r;
    });

    const formatted = (residents || []).map(res => ({
      id: res.id,
      profileId: res.profile_id,
      name: res.profiles?.name || "Unknown Resident",
      email: res.profiles?.email || "",
      buildingName: res.buildings?.building_name || "PG Property",
      roomNumber: res.rooms?.room_number || "—",
      rent: res.rooms?.rent || 0,
      bedNumber: res.beds?.bed_number || "—",
      moveInDate: res.joining_date,
      rating: ratingsMap[res.profile_id]?.rating || 5,
      behaviour: ratingsMap[res.profile_id]?.behaviour || "good",
      paysOnTime: ratingsMap[res.profile_id]?.pays_on_time !== false,
      noComplaints: ratingsMap[res.profile_id]?.no_complaints !== false,
      notes: ratingsMap[res.profile_id]?.notes || "",
      status: res.status,
      deposit: res.deposit || 0,
      expectedLeaveDate: res.expected_leave_date || null,
      kycDocuments: res.tenant_documents || []
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Submit tenant rating / performance feedback (Owner)
// POST /api/tenants/:profileId/rating
router.post("/:profileId/rating", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { profileId } = req.params;
  const { rating, behaviour, pays_on_time, no_complaints, notes } = req.body;
  try {
    const { data: owner } = await supabase.from("pg_owners").select("id").eq("profile_id", req.user.id).single();
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data, error } = await supabase
      .from("tenant_ratings")
      .upsert([{
        owner_id: owner.id,
        tenant_profile_id: profileId,
        rating: parseInt(rating, 10),
        behaviour: behaviour || "good",
        pays_on_time: !!pays_on_time,
        no_complaints: !!no_complaints,
        notes
      }], { onConflict: "owner_id,tenant_profile_id" })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Get roommate profile list for active stay room (Tenant)
// GET /api/tenants/roommates
router.get("/roommates", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    // 1. Get current tenant stay details
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, room_id")
      .eq("profile_id", req.user.id)
      .single();

    if (tErr || !tenant || !tenant.room_id) {
      return res.json([]); // Return empty list if tenant doesn't have an active stay
    }

    // 2. Query all other active tenants in same room
    const { data: roommates, error: rErr } = await supabase
      .from("tenants")
      .select("id, profile_id, beds!tenants_bed_id_fkey(bed_number)")
      .eq("room_id", tenant.room_id)
      .eq("status", "active")
      .neq("profile_id", req.user.id);

    if (rErr) throw rErr;
    if (!roommates || roommates.length === 0) {
      return res.json([]);
    }

    // 3. Resolve profile details (names, emails, habits) for these roommates
    const roommateProfileIds = roommates.map(r => r.profile_id);
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, email, photo")
      .in("id", roommateProfileIds);

    if (pErr) throw pErr;

    // 4. Map them together, adding mock lifestyle habits deterministic based on profile ID
    const formattedRoommates = roommates.map(r => {
      const profile = (profiles || []).find(p => p.id === r.profile_id) || { full_name: "Roommate", email: "" };
      
      // Generate deterministic lifestyle attributes based on profile ID hash
      const idHash = (profile.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const sleep = idHash % 2 === 0 ? "Night Owl" : "Early Bird";
      const food = idHash % 3 === 0 ? "Veg" : idHash % 3 === 1 ? "Non-Veg" : "Any";
      const clean = idHash % 2 === 0 ? "Very Clean" : "Moderate";

      return {
        id: r.id,
        name: profile.full_name,
        email: profile.email,
        photo: profile.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        bed_number: r.beds?.bed_number || "?",
        habits: { sleep, food, clean }
      };
    });

    res.json(formattedRoommates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Process tenant checkout / settlement (Owner)
// POST /api/tenants/:id/checkout
router.post("/:id/checkout", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { actual_leave_date, bed_status } = req.body;
  const targetBedStatus = ["Available", "Maintenance"].includes(bed_status) ? bed_status : "Available";
  const leaveDate = actual_leave_date || new Date().toISOString().split("T")[0];

  try {
    // 1. Fetch tenant details
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("id, bed_id, status")
      .eq("id", id)
      .single();

    if (tErr || !tenant) {
      return res.status(404).json({ error: "Tenant record not found" });
    }

    const bedId = tenant.bed_id;

    // 2. Update tenant status and actual leave date
    const { data: updatedTenant, error: uErr } = await supabase
      .from("tenants")
      .update({
        status: "left",
        actual_leave_date: leaveDate
      })
      .eq("id", id)
      .select()
      .single();

    if (uErr) throw uErr;

    // 3. Release the bed and set its status
    if (bedId) {
      const { error: bErr } = await supabase
        .from("beds")
        .update({
          status: targetBedStatus,
          tenant_id: null
        })
        .eq("id", bedId);

      if (bErr) throw bErr;
    }

    res.json({ success: true, tenant: updatedTenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
