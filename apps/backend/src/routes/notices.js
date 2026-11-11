const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

async function getOwner(profileId) {
  const { data } = await supabase.from("pg_owners").select("id").eq("profile_id", profileId).single();
  return data;
}

// GET /api/notices?building_id=
router.get("/", requireAuth, requireRole(["owner", "super_admin", "tenant"]), async (req, res) => {
  try {
    let query = supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(50);
    if (req.query.building_id) query = query.eq("building_id", req.query.building_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notices
router.post("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { building_id, title, message, category } = req.body;
    if (!title || !message) return res.status(400).json({ error: "title and message required" });

    const { data, error } = await supabase
      .from("notices")
      .insert([{ owner_id: owner.id, building_id, title, message, category: category || "general" }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notices/:id
router.delete("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { error } = await supabase.from("notices").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notices/tenant
router.get("/tenant", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    const { data: tenant, error: tErr } = await supabase
      .from("tenants")
      .select("building_id")
      .eq("profile_id", req.user.id)
      .single();

    if (tErr || !tenant || !tenant.building_id) {
      return res.json([]); // Return empty if not checked in
    }

    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("building_id", tenant.building_id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
