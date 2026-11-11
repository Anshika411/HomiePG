const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/inventory/:roomId
router.get("/:roomId", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("room_inventory")
      .select("*")
      .eq("room_id", req.params.roomId)
      .order("item_name");
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/inventory
router.post("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { room_id, building_id, item_name, status, notes } = req.body;
    if (!room_id || !item_name) return res.status(400).json({ error: "room_id and item_name required" });

    const { data, error } = await supabase
      .from("room_inventory")
      .insert([{ room_id, building_id, item_name, status: status || "working", notes }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/inventory/:id
router.patch("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { status, notes, last_checked } = req.body;
    const { data, error } = await supabase
      .from("room_inventory")
      .update({ status, notes, last_checked: last_checked || new Date().toISOString().split("T")[0] })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { error } = await supabase.from("room_inventory").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
