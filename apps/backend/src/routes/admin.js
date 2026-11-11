const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// 1. Get all PG owners (Admin only)
router.get("/owners", requireAuth, requireRole(["super_admin"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "owner");

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Toggle owner verification status (Admin only)
router.put("/owners/:id/verify", requireAuth, requireRole(["super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { is_verified } = req.body; // boolean

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_verified })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get global platform statistics (Admin only)
router.get("/stats", requireAuth, requireRole(["super_admin"]), async (req, res) => {
  try {
    // Count owners
    const { count: ownerCount, error: oErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner");

    // Count buildings
    const { count: buildingCount, error: bErr } = await supabase
      .from("buildings")
      .select("*", { count: "exact", head: true });

    // Count bookings
    const { count: bookingCount, error: bkErr } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true });

    if (oErr || bErr || bkErr) {
      throw new Error("Failed to compile statistics");
    }

    res.status(200).json({
      totalOwners: ownerCount || 0,
      totalBuildings: buildingCount || 0,
      totalBookings: bookingCount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
