const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

async function getOwner(profileId) {
  const { data } = await supabase
    .from("pg_owners")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  return data;
}

// ─────────────────────────────────────────────────────────────────
// GET /api/tasks
// ─────────────────────────────────────────────────────────────────
router.get("/", requireAuth, requireRole(["platform_manager", "super_admin", "owner", "property_manager"]), async (req, res) => {
  try {
    const { role } = req.user; // populated by requireAuth middleware
    let query = supabase.from("verification_tasks").select("*, buildings(building_name, address, city)");

    // If it's a PG Owner, restrict to tasks associated with their buildings
    if (role === "owner" || role === "pg_owner") {
      const owner = await getOwner(req.user.id);
      if (!owner) return res.status(403).json({ error: "Not an owner" });

      const { data: ownerBuildings } = await supabase
        .from("buildings")
        .select("id")
        .eq("owner_id", owner.id);

      const bIds = (ownerBuildings || []).map(b => b.id);
      query = query.in("building_id", bIds);
    }

    // Apply optional filters
    if (req.query.building_id) query = query.eq("building_id", req.query.building_id);
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.task_type) query = query.eq("task_type", req.query.task_type);
    if (req.query.assigned_to) query = query.eq("assigned_to", req.query.assigned_to);

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/tasks
// ─────────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole(["platform_manager", "super_admin"]), async (req, res) => {
  try {
    const { building_id, task_type, assigned_to, status } = req.body;
    if (!building_id || !task_type) {
      return res.status(400).json({ error: "building_id and task_type required" });
    }

    const { data, error } = await supabase
      .from("verification_tasks")
      .insert([
        {
          building_id,
          task_type,
          assigned_to: assigned_to || null,
          status: status || "pending"
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// PATCH /api/tasks/:id
// ─────────────────────────────────────────────────────────────────
router.patch("/:id", requireAuth, requireRole(["platform_manager", "super_admin", "property_manager"]), async (req, res) => {
  try {
    const { status, assigned_to, audit_notes, video_url, latitude, longitude } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
    if (audit_notes !== undefined) updateData.audit_notes = audit_notes;
    if (video_url !== undefined) updateData.video_url = video_url;
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null) {
      updateData.gps_coordinates = `(${latitude},${longitude})`;
    }

    // Perform update
    const { data, error } = await supabase
      .from("verification_tasks")
      .update(updateData)
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) throw error;

    // Automatic onboarding verification flow trigger:
    // If this task is updated to 'approved', verify if all other tasks for this building are approved.
    if (status === "approved") {
      const { data: allTasks } = await supabase
        .from("verification_tasks")
        .select("id, status")
        .eq("building_id", data.building_id);

      const allApproved = (allTasks || []).every(t => t.id === req.params.id ? true : t.status === "approved");

      if (allApproved) {
        // Fetch the building's owner ID
        const { data: building } = await supabase
          .from("buildings")
          .select("owner_id")
          .eq("id", data.building_id)
          .single();

        if (building) {
          // Update the owner's verification status
          await supabase
            .from("pg_owners")
            .update({ verification_status: "verified" })
            .eq("id", building.owner_id);
        }
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
