const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");

// Helper: get owner record from profile
async function getOwner(profileId) {
  const { data, error } = await supabase
    .from("pg_owners")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  return error ? null : data;
}

// ─────────────────────────────────────────────────────────────────
// 1. Smart Occupancy Dashboard Stats
// GET /api/owner/dashboard-stats
// ─────────────────────────────────────────────────────────────────
router.get("/dashboard-stats", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    // Get all buildings for this owner
    const { data: buildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("owner_id", owner.id);

    const buildingIds = (buildings || []).map(b => b.id);
    if (buildingIds.length === 0) {
      return res.json({
        totalBeds: 0, occupiedBeds: 0, vacantBeds: 0, occupancyPct: 0,
        revenueThisMonth: 0, pendingRent: 0, newBookingsToday: 0,
        pendingBookings: 0, checkoutsThisWeek: 0, totalTenants: 0,
        housekeepingAlerts: 0
      });
    }

    // Get floors
    const { data: floors } = await supabase
      .from("floors")
      .select("id")
      .in("building_id", buildingIds);
    const floorIds = (floors || []).map(f => f.id);

    // Get rooms
    let rooms = [];
    if (floorIds.length > 0) {
      const { data: rData } = await supabase
        .from("rooms")
        .select("id, housekeeping_status")
        .in("floor_id", floorIds);
      rooms = rData || [];
    }
    const roomIds = rooms.map(r => r.id);

    // Get all beds
    let beds = [];
    if (roomIds.length > 0) {
      const { data: bdData } = await supabase
        .from("beds")
        .select("id, status")
        .in("room_id", roomIds);
      beds = bdData || [];
    }

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter(b => b.status === "Occupied").length;
    const vacantBeds = totalBeds - occupiedBeds;
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Revenue this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const { data: paidPayments } = await supabase
      .from("rent_payments")
      .select("amount")
      .in("building_id", buildingIds)
      .eq("status", "Paid")
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd);

    const revenueThisMonth = (paidPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // Pending rent
    const { data: pendingPayments } = await supabase
      .from("rent_payments")
      .select("amount")
      .in("building_id", buildingIds)
      .in("status", ["Pending", "Overdue"]);

    const pendingRent = (pendingPayments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    // New bookings today
    const todayStr = now.toISOString().split("T")[0];
    const { data: todayBookings } = await supabase
      .from("bookings")
      .select("id")
      .in("building_id", buildingIds)
      .gte("created_at", `${todayStr}T00:00:00`)
      .lte("created_at", `${todayStr}T23:59:59`);

    // Pending bookings
    const { data: pendingBookings } = await supabase
      .from("bookings")
      .select("id")
      .in("building_id", buildingIds)
      .eq("booking_status", "Pending");

    // Checkouts this week
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const { data: upcomingCheckouts } = await supabase
      .from("tenants")
      .select("id")
      .in("building_id", buildingIds)
      .neq("status", "left")
      .lte("expected_leave_date", weekEnd.toISOString().split("T")[0]);

    // Total active tenants
    const { data: activeTenants } = await supabase
      .from("tenants")
      .select("id")
      .in("building_id", buildingIds)
      .eq("status", "active");

    // Housekeeping alerts (rooms needing attention)
    const housekeepingAlerts = rooms.filter(r => r.housekeeping_status === "maintenance" || r.housekeeping_status === "cleaning").length;

    res.json({
      totalBeds,
      occupiedBeds,
      vacantBeds,
      occupancyPct,
      revenueThisMonth,
      pendingRent,
      newBookingsToday: (todayBookings || []).length,
      pendingBookings: (pendingBookings || []).length,
      checkoutsThisWeek: (upcomingCheckouts || []).length,
      totalTenants: (activeTenants || []).length,
      housekeepingAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. Rent Collection Heatmap
// GET /api/owner/rent-heatmap?month=6&year=2025
// ─────────────────────────────────────────────────────────────────
router.get("/rent-heatmap", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const now = new Date();
    const month = parseInt(req.query.month || now.getMonth() + 1, 10);
    const year = parseInt(req.query.year || now.getFullYear(), 10);

    const { data: buildings } = await supabase
      .from("buildings")
      .select("id")
      .eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);

    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthEnd = `${year}-${String(month).padStart(2, "0")}-${daysInMonth}`;

    const { data: payments } = await supabase
      .from("rent_payments")
      .select("id, amount, status, due_date, tenant_id")
      .in("building_id", buildingIds)
      .gte("due_date", monthStart)
      .lte("due_date", monthEnd);

    // Build day-by-day heatmap
    const heatmap = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      heatmap[dateKey] = { paid: 0, pending: 0, overdue: 0, total: 0 };
    }

    (payments || []).forEach(p => {
      const key = p.due_date;
      if (heatmap[key]) {
        heatmap[key].total++;
        if (p.status === "Paid") heatmap[key].paid++;
        else if (p.status === "Overdue") heatmap[key].overdue++;
        else heatmap[key].pending++;
      }
    });

    res.json({ month, year, daysInMonth, heatmap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. Vacancy Predictions (Rule-Based AI)
// GET /api/owner/vacancy-predictions
// ─────────────────────────────────────────────────────────────────
router.get("/vacancy-predictions", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data: buildings } = await supabase
      .from("buildings")
      .select("id, building_name")
      .eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);

    const buildingMap = {};
    (buildings || []).forEach(b => { buildingMap[b.id] = b.building_name; });

    const predictions = [];
    const today = new Date();
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(today.getDate() + 45);

    // Tenants with expected_leave_date in next 45 days
    const { data: upcomingMoveOuts } = await supabase
      .from("tenants")
      .select("id, profile_id, room_id, building_id, expected_leave_date, status")
      .in("building_id", buildingIds)
      .in("status", ["active", "notice_period"])
      .lte("expected_leave_date", thirtyDaysOut.toISOString().split("T")[0]);

    // Also flag tenants with 2+ months unpaid
    const { data: overduePayments } = await supabase
      .from("rent_payments")
      .select("tenant_id, building_id")
      .in("building_id", buildingIds)
      .eq("status", "Overdue");

    const overdueCount = {};
    (overduePayments || []).forEach(p => {
      overdueCount[p.tenant_id] = (overdueCount[p.tenant_id] || 0) + 1;
    });

    // Mark at-risk tenants
    const atRiskTenantIds = Object.entries(overdueCount)
      .filter(([, count]) => count >= 2)
      .map(([id]) => id);

    let atRiskTenants = [];
    if (atRiskTenantIds.length > 0) {
      const { data: riskData } = await supabase
        .from("tenants")
        .select("id, profile_id, room_id, building_id")
        .in("id", atRiskTenantIds)
        .eq("status", "active");
      atRiskTenants = riskData || [];
    }

    // Get room info for both lists
    const allMoveOuts = upcomingMoveOuts || [];
    const roomIds = [...new Set([...allMoveOuts.map(t => t.room_id), ...atRiskTenants.map(t => t.room_id)])];
    let roomMap = {};
    if (roomIds.length > 0) {
      const { data: rooms } = await supabase
        .from("rooms")
        .select("id, room_number")
        .in("id", roomIds);
      (rooms || []).forEach(r => { roomMap[r.id] = r.room_number; });
    }

    // Get profile names for both lists
    const profileIds = [...new Set([...allMoveOuts.map(t => t.profile_id), ...atRiskTenants.map(t => t.profile_id)])];
    let profileMap = {};
    if (profileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", profileIds);
      (profiles || []).forEach(p => { profileMap[p.id] = p.name; });
    }

    allMoveOuts.forEach(t => {
      const moveOutDate = new Date(t.expected_leave_date);
      const daysLeft = Math.ceil((moveOutDate - today) / (1000 * 60 * 60 * 24));
      const isNotice = t.status === "notice_period";
      predictions.push({
        tenantName: profileMap[t.profile_id] || "Unknown",
        roomNumber: roomMap[t.room_id] || "Unknown",
        buildingName: buildingMap[t.building_id] || "Unknown",
        predictedVacancyDate: t.expected_leave_date,
        daysUntilVacant: daysLeft,
        reason: isNotice ? "Notice Period Submitted" : "Lease End Date",
        confidence: isNotice ? "High" : "Medium"
      });
    });

    atRiskTenants.forEach(t => {
      if (!predictions.find(p => p.roomNumber === roomMap[t.room_id])) {
        predictions.push({
          tenantName: profileMap[t.profile_id] || "Unknown",
          roomNumber: roomMap[t.room_id] || "Unknown",
          buildingName: buildingMap[t.building_id] || "Unknown",
          predictedVacancyDate: null,
          daysUntilVacant: null,
          reason: `${overdueCount[t.id]} Months Rent Unpaid`,
          confidence: "Low",
          atRisk: true
        });
      }
    });

    res.json({ predictions: predictions.sort((a, b) => (a.daysUntilVacant || 999) - (b.daysUntilVacant || 999)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 4. Smart Pricing Suggestions
// GET /api/owner/pricing-suggestions
// ─────────────────────────────────────────────────────────────────
router.get("/pricing-suggestions", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data: buildings } = await supabase
      .from("buildings")
      .select("id, building_name, monthly_rent_starting")
      .eq("owner_id", owner.id);

    const suggestions = [];
    const currentMonth = new Date().getMonth() + 1;
    // Festival months in India
    const festivalMonths = [10, 11, 12, 1]; // Oct, Nov, Dec, Jan
    const isFestivalSeason = festivalMonths.includes(currentMonth);

    for (const building of buildings || []) {
      // Get occupancy
      const { data: floors } = await supabase.from("floors").select("id").eq("building_id", building.id);
      const floorIds = (floors || []).map(f => f.id);

      let totalBeds = 0, occupiedBeds = 0;
      if (floorIds.length > 0) {
        const { data: rooms } = await supabase.from("rooms").select("id").in("floor_id", floorIds);
        const roomIds = (rooms || []).map(r => r.id);
        if (roomIds.length > 0) {
          const { data: beds } = await supabase.from("beds").select("status").in("room_id", roomIds);
          totalBeds = (beds || []).length;
          occupiedBeds = (beds || []).filter(b => b.status === "Occupied").length;
        }
      }

      const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
      const currentRent = building.monthly_rent_starting || 0;
      let suggestion = null;

      if (isFestivalSeason && occupancyPct > 75) {
        suggestion = {
          type: "surge",
          reason: "Festival Season + High Demand",
          suggestedChange: "+15%",
          suggestedRent: Math.round(currentRent * 1.15),
          currentRent,
          occupancyPct,
          icon: "🎉"
        };
      } else if (occupancyPct >= 90) {
        suggestion = {
          type: "increase",
          reason: "Occupancy above 90% — high demand",
          suggestedChange: "+10%",
          suggestedRent: Math.round(currentRent * 1.1),
          currentRent,
          occupancyPct,
          icon: "📈"
        };
      } else if (occupancyPct < 60) {
        suggestion = {
          type: "discount",
          reason: "Low occupancy — attract more tenants",
          suggestedChange: "-10%",
          suggestedRent: Math.round(currentRent * 0.9),
          currentRent,
          occupancyPct,
          icon: "📉"
        };
      } else {
        suggestion = {
          type: "hold",
          reason: "Occupancy is healthy — maintain current pricing",
          suggestedChange: "0%",
          suggestedRent: currentRent,
          currentRent,
          occupancyPct,
          icon: "✅"
        };
      }

      suggestions.push({ buildingId: building.id, buildingName: building.building_name, ...suggestion });
    }

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 5. Owner KPI Dashboard
// GET /api/owner/kpi-dashboard
// ─────────────────────────────────────────────────────────────────
router.get("/kpi-dashboard", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    const { data: buildings } = await supabase.from("buildings").select("id").eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split("T")[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split("T")[0];

    // Revenue this month
    const { data: thisMonthPaid } = await supabase.from("rent_payments").select("amount").in("building_id", buildingIds).eq("status", "Paid").gte("due_date", monthStart);
    const revenueThisMonth = (thisMonthPaid || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Revenue last month
    const { data: lastMonthPaid } = await supabase.from("rent_payments").select("amount").in("building_id", buildingIds).eq("status", "Paid").gte("due_date", lastMonthStart).lte("due_date", lastMonthEnd);
    const revenueLastMonth = (lastMonthPaid || []).reduce((s, p) => s + parseFloat(p.amount || 0), 0);

    // Total expenses this month
    const { data: thisMonthExpenses } = await supabase.from("expenses").select("amount").eq("owner_id", owner.id).gte("expense_date", monthStart);
    const expensesThisMonth = (thisMonthExpenses || []).reduce((s, e) => s + parseFloat(e.amount || 0), 0);

    // Active tenants
    const { data: activeTenants } = await supabase.from("tenants").select("id, joining_date, expected_leave_date").in("building_id", buildingIds).in("status", ["active", "notice_period"]);
    const totalTenants = (activeTenants || []).length;

    // Average stay (months)
    const avgStay = totalTenants > 0
      ? Math.round(
          (activeTenants || []).reduce((sum, t) => {
            const moveIn = t.joining_date ? new Date(t.joining_date) : now;
            const diff = (now.getTime() - moveIn.getTime()) / (1000 * 60 * 60 * 24 * 30);
            return sum + diff;
          }, 0) / totalTenants
        )
      : 0;

    // Renewal rate (tenants with expected_leave_date in past who renewed)
    const { data: renewedTenants } = await supabase.from("tenants").select("id").in("building_id", buildingIds).in("status", ["active", "notice_period"]).lt("expected_leave_date", now.toISOString().split("T")[0]);
    const renewalRate = totalTenants > 0 ? Math.min(Math.round(((renewedTenants || []).length / totalTenants) * 100), 100) : 0;

    // Complaints this month
    const { data: openComplaints } = await supabase.from("maintenance_tickets").select("id, status").in("building_id", buildingIds).gte("created_at", `${monthStart}T00:00:00`);
    const totalComplaints = (openComplaints || []).length;
    const resolvedComplaints = (openComplaints || []).filter(c => c.status === "resolved" || c.status === "Resolved").length;
    const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 100;

    res.json({
      revenueThisMonth,
      revenueLastMonth,
      revenueGrowth: revenueLastMonth > 0 ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100) : 0,
      expensesThisMonth,
      profit: revenueThisMonth - expensesThisMonth,
      totalTenants,
      avgStayMonths: avgStay,
      renewalRate,
      totalComplaints,
      resolvedComplaints,
      resolutionRate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Business Insights (Gemini API / Heuristics)
// GET /api/owner/ai-insights
router.get("/ai-insights", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const owner = await getOwner(req.user.id);
    if (!owner) return res.status(403).json({ error: "Not an owner" });

    // 1. Gather metrics
    const { data: buildings } = await supabase.from("buildings").select("id, building_name").eq("owner_id", owner.id);
    const buildingIds = (buildings || []).map(b => b.id);

    if (buildingIds.length === 0) {
      return res.json({
        insights: [
          "Welcome to HomiePG! Once you add buildings, rooms, and list them for bookings, your business metrics and AI growth insights will appear here.",
          "Tip: Try adding your local coordinates when registering a property so tenants can route to your PG easily."
        ]
      });
    }

    // Occupancy
    const { data: beds } = await supabase.from("beds").select("status").in("room_id", 
      (await supabase.from("rooms").select("id").in("floor_id", 
        (await supabase.from("floors").select("id").in("building_id", buildingIds)).data?.map(f => f.id) || []
      )).data?.map(r => r.id) || []
    );
    const totalBeds = (beds || []).length;
    const occupiedBeds = (beds || []).filter(b => b.status === "Occupied").length;
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Complaints
    const { data: complaints } = await supabase.from("maintenance_tickets").select("category, status").in("building_id", buildingIds);
    const wifiComplaints = (complaints || []).filter(c => c.category === "WiFi").length;
    const cleaningComplaints = (complaints || []).filter(c => c.category === "Cleaning").length;
    const plumbingComplaints = (complaints || []).filter(c => c.category === "Plumbing" || c.category === "Water Supply").length;

    // Build context prompt
    const prompt = `You are a professional co-living business advisor in India. 
Based on these current PG business metrics, provide exactly 3 brief, bulleted, action-oriented recommendations for the PG owner:
- Current Occupancy: ${occupancyPct}% (Total Beds: ${totalBeds}, Occupied: ${occupiedBeds})
- WiFi Complaints: ${wifiComplaints}
- Cleaning Complaints: ${cleaningComplaints}
- Plumbing & Water Complaints: ${plumbingComplaints}
Please make the recommendations short, clear, and highly focused on improving revenue or resident retention.`;

    let insights = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await response.json();
        const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (geminiText) {
          insights = geminiText
            .split("\n")
            .map(line => line.replace(/^[\s*\-\u2022]+/, "").trim())
            .filter(line => line.length > 0)
            .slice(0, 3);
        }
      } catch (geminiErr) {
        console.error("Gemini API call failed, falling back to heuristics:", geminiErr);
      }
    }

    // Heuristics fallback if Gemini is not set or fails
    if (insights.length === 0) {
      if (occupancyPct < 70) {
        insights.push("💡 Occupancy is currently low (${occupancyPct}%). Consider offering a limited-time 5% discount on rent to attract incoming college students or young professionals.");
      } else {
        insights.push("📈 Occupancy is strong (${occupancyPct}%). Keep room listing prices steady, and look to offer premium add-ons (like private lockers or laundry) for extra auxiliary revenue.");
      }

      if (wifiComplaints >= 3) {
        insights.push("📶 WiFi connectivity has received ${wifiComplaints} complaints recently. Check with your ISP to upgrade bandwidth or install mesh routers to minimize move-outs.");
      } else if (cleaningComplaints >= 3) {
        insights.push("🧹 Cleaning schedule is a common complaint driver. Consider switching housekeeper shifts or establishing room checklist audits on floors.");
      } else {
        insights.push("⚡ Maintenance resolution is stable. Set up a bi-weekly checklist of in-room inventory (AC, Geysers) to catch asset issues before residents log complaints.");
      }

      insights.push("👥 Target roommate matches based on professional profiles (e.g. IT engineers with IT engineers) during room allocation to double renewal rates.");
    }

    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
