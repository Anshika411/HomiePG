const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// Helper: get owner record
async function getOwner(profileId) {
  const { data } = await supabase.from("pg_owners").select("id").eq("profile_id", profileId).single();
  return data;
}

// ─────────────────────────────────────────────────────────────────
// EXPENSES
// ─────────────────────────────────────────────────────────────────

// GET /api/expenses?building_id=&month=6&year=2025
router.get("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { building_id, month, year } = req.query;
    const now = new Date();
    const m = parseInt(month || now.getMonth() + 1, 10);
    const y = parseInt(year || now.getFullYear(), 10);
    const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
    const monthEnd = `${y}-${String(m).padStart(2, "0")}-${new Date(y, m, 0).getDate()}`;

    let query = supabase
      .from("expenses")
      .select("*")
      .eq("owner_id", owner.id)
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd)
      .order("expense_date", { ascending: false });

    if (building_id) query = query.eq("building_id", building_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by category and map remarks to description for frontend compatibility
    const categoryTotals = {};
    const formattedExpenses = (data || []).map(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + parseFloat(e.amount || 0);
      return {
        ...e,
        description: e.remarks || ""
      };
    });
    const totalAmount = (data || []).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    res.json({ expenses: formattedExpenses, totalAmount, categoryTotals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses
router.post("/", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { building_id, category, amount, description, expense_date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: "category and amount required" });

    const { data, error } = await supabase
      .from("expenses")
      .insert([{
        owner_id: owner.id,
        building_id,
        category,
        amount: parseFloat(amount),
        remarks: description,
        expense_date: expense_date || new Date().toISOString().split("T")[0]
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Map response for compatibility
    res.status(201).json({
      ...data,
      description: data.remarks || ""
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { error } = await supabase.from("expenses").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
