const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

async function getOwner(profileId) {
  const { data } = await supabase.from("pg_owners").select("id").eq("profile_id", profileId).single();
  return data;
}

// ─────────────────────────────────────────────────────────────────
// STAFF CRUD
// ─────────────────────────────────────────────────────────────────

// GET /api/staff?building_id=
router.get("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    let query = supabase.from("staff").select("*").eq("owner_id", owner.id).order("name");
    if (req.query.building_id) query = query.eq("building_id", req.query.building_id);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff
router.post("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { building_id, name, role, phone, monthly_salary, join_date } = req.body;
    if (!name || !role) return res.status(400).json({ error: "name and role required" });

    const { data, error } = await supabase
      .from("staff")
      .insert([{ owner_id: owner.id, building_id, name, role, phone, monthly_salary: parseFloat(monthly_salary || 0), join_date: join_date || new Date().toISOString().split("T")[0] }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/staff/:id
router.patch("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { name, role, phone, monthly_salary, status } = req.body;
    const { data, error } = await supabase
      .from("staff")
      .update({ name, role, phone, monthly_salary: monthly_salary ? parseFloat(monthly_salary) : undefined, status })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/staff/:id
router.delete("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    await supabase.from("staff_attendance").delete().eq("staff_id", req.params.id);
    const { error } = await supabase.from("staff").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────

// GET /api/staff/:id/attendance?month=6&year=2025
router.get("/:id/attendance", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const now = new Date();
    const m = parseInt(req.query.month || now.getMonth() + 1, 10);
    const y = parseInt(req.query.year || now.getFullYear(), 10);
    const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", req.params.id)
      .gte("date", monthStart)
      .lte("date", monthEnd)
      .order("date");

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/staff/:id/attendance (mark today's attendance)
router.post("/:id/attendance", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { status, date } = req.body;
    const attendanceDate = date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("staff_attendance")
      .upsert([{ staff_id: req.params.id, date: attendanceDate, status: status || "present" }], { onConflict: "staff_id,date" })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
