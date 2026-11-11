const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

const TICKET_CATEGORIES = ["WiFi", "Water Supply", "Electricity", "Cleaning", "Plumbing", "Other"];

// 1. Create a maintenance ticket (Tenant)
router.post("/", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { category, description, building_id, photo_url } = req.body;
  if (!category || !description || !building_id) {
    return res.status(400).json({ error: "Missing ticket details: category, description, building_id are required" });
  }
  if (!TICKET_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Invalid category. Must be one of: ${TICKET_CATEGORIES.join(", ")}` });
  }

  try {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .insert([{
        tenant_profile_id: req.user.id,
        building_id,
        category,
        description,
        status: "Pending",
        photo_url: photo_url || null
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get my maintenance tickets (Tenant)
router.get("/my-tickets", requireAuth, requireRole(["tenant"]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .select("*, buildings(building_name)")
      .eq("tenant_profile_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Get all tickets for owner's buildings (Owner)
router.get("/owner-tickets", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
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
      .from("maintenance_tickets")
      .select("*, buildings(building_name), profiles:profiles!maintenance_tickets_tenant_profile_id_fkey(name, email)")
      .in("building_id", buildingIds)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Format response to flat profiles key structure
    const formatted = (data || []).map(t => ({
      ...t,
      profiles: t.profiles || { name: "Tenant", email: "" }
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update ticket status (Owner)
router.put("/:id/status", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["Pending", "Scheduled", "Resolved"].includes(status)) {
    return res.status(400).json({ error: "Status must be: Pending, Scheduled, or Resolved" });
  }

  try {
    const { data, error } = await supabase
      .from("maintenance_tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Maintenance Analytics (Owner)
// GET /api/maintenance/analytics?building_id=
router.get("/analytics", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data: owner } = await supabase.from("pg_owners").select("id").eq("profile_id", req.user.id).single();
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data: buildings } = await supabase.from("buildings").select("id").eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);

    let query = supabase.from("maintenance_tickets").select("category, status").in("building_id", buildingIds);
    if (req.query.building_id) query = query.eq("building_id", req.query.building_id);

    const { data: tickets, error } = await query;
    if (error) throw error;

    const categoryCount = {};
    const statusCount = { Pending: 0, Scheduled: 0, Resolved: 0 };

    (tickets || []).forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
      if (statusCount[t.status] !== undefined) statusCount[t.status]++;
    });

    const categoryBreakdown = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      total: (tickets || []).length,
      statusCount,
      categoryBreakdown
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
