const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// 1. Register a visitor pass (Tenant)
router.post("/", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { visitor_name, visit_date, visit_time, building_id, purpose } = req.body;
  if (!visitor_name || !visit_date || !building_id) {
    return res.status(400).json({ error: "visitor_name, visit_date, and building_id are required" });
  }

  try {
    // Generate a short pass code
    const pass_code = `HP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const { data, error } = await supabase
      .from("visitor_passes")
      .insert([{
        tenant_profile_id: req.user.id,
        building_id,
        visitor_name,
        visit_date,
        visit_time: visit_time || null,
        purpose: purpose || "Personal Visit",
        pass_code,
        status: "Active"
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get my visitor passes (Tenant)
router.get("/my-passes", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("visitor_passes")
      .select("*, buildings(building_name)")
      .eq("tenant_profile_id", req.user.id)
      .order("visit_date", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get visitor passes for owner's buildings (Owner)
router.get("/owner-passes", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) return res.status(200).json([]);

    const { data: buildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("owner_id", owner.id);

    const buildingIds = (buildings || []).map(b => b.id);
    if (buildingIds.length === 0) return res.status(200).json([]);

    const { data, error } = await supabase
      .from("visitor_passes")
      .select("*, buildings(building_name), profiles(name)")
      .in("building_id", buildingIds)
      .order("visit_date", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Cancel a visitor pass (Tenant)
router.put("/:id/cancel", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("visitor_passes")
      .update({ status: "Cancelled" })
      .eq("id", id)
      .eq("tenant_profile_id", req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Update visitor pass status (Check In / Check Out) (Owner/Security)
// PUT /api/visitors/:id/status
router.put("/:id/status", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { status } = req.body;
  if (!["Checked In", "Checked Out", "Active"].includes(status)) {
    return res.status(400).json({ error: "Invalid status: must be Checked In, Checked Out, or Active" });
  }
  try {
    const { data, error } = await supabase
      .from("visitor_passes")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
