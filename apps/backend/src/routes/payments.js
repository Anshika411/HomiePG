const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabase");
const { requireAuth, requireRole } = require("../middleware/auth");
const { encrypt, decrypt } = require("../utils/crypto");

// 1. Get my invoices (Tenant or Owner)
router.get("/invoices", requireAuth, async (req, res) => {
  try {
    let query = supabase.from("rent_payments").select(`
      *,
      tenants (
        id,
        building_id,
        buildings (
          building_name
        )
      )
    `);

    if (req.profile.role === "tenant") {
      // Find tenant ID first using profile_id (not user_id)
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id")
        .eq("profile_id", req.user.id)
        .single();

      if (!tenant) return res.status(200).json([]);
      query = query.eq("tenant_id", tenant.id);
    } else if (req.profile.role === "owner") {
      // Filter by owner's buildings
      const { data: owner } = await supabase
        .from("pg_owners")
        .select("id")
        .eq("profile_id", req.user.id)
        .single();

      if (!owner) return res.status(200).json([]);
      query = query.eq("tenants.buildings.owner_id", owner.id);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Format for client compatibility (map 'month' to 'billing_period')
    const formatted = (data || []).map(item => ({
      id: item.id,
      tenant_id: item.tenant_id,
      amount: item.amount,
      due_date: item.due_date,
      payment_date: item.payment_date,
      payment_method: item.payment_method,
      transaction_id: item.transaction_id,
      receipt_url: item.receipt_url,
      status: item.status,
      billing_period: item.month,
      buildings: item.tenants?.buildings || { building_name: "PG Accommodation" }
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Submit payment (Tenant)
router.post("/pay", requireAuth, requireRole(["tenant"]), async (req, res) => {
  const { invoice_id, amount_paid, payment_method, transaction_id, receipt_url, points_deducted } = req.body;
  if (!invoice_id || !amount_paid || !payment_method) {
    return res.status(400).json({ error: "Missing payment options" });
  }

  try {
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id, building_id")
      .eq("profile_id", req.user.id)
      .single();

    if (!tenant) {
      return res.status(400).json({ error: "Active tenant profile not found" });
    }

    // Deduct points from user_rewards if applicable
    if (points_deducted && points_deducted > 0) {
      try {
        const { data: rewardRecord } = await supabase
          .from("user_rewards")
          .select("points")
          .eq("profile_id", req.user.id)
          .single();

        const currentPoints = rewardRecord ? rewardRecord.points : 0;
        if (currentPoints >= points_deducted) {
          await supabase
            .from("user_rewards")
            .update({ points: currentPoints - points_deducted })
            .eq("profile_id", req.user.id);
        }
      } catch (err) {
        console.warn("Could not process reward points deduction", err);
      }
    }

    // Update the rent_payments record directly (we don't have a separate payments table)
    const { data: payment, error: pError } = await supabase
      .from("rent_payments")
      .update({
        payment_method,
        transaction_id: transaction_id || "",
        receipt_url: receipt_url || "",
        payment_date: new Date().toISOString().split("T")[0],
        status: "Pending" // waiting for owner verification
      })
      .eq("id", invoice_id)
      .select()
      .single();

    if (pError) throw pError;
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Verify payment (Owner/Admin)
router.put("/verify/:id", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Paid' or 'Pending' or 'Failed'

  try {
    const { data: payment, error: pError } = await supabase
      .from("rent_payments")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (pError || !payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Generate Invoice (Owner/Admin)
router.post("/invoices", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { tenant_id, amount, due_date, billing_period } = req.body;
  if (!tenant_id || !amount || !due_date) {
    return res.status(400).json({ error: "Missing invoice parameters" });
  }

  try {
    const { data, error } = await supabase
      .from("rent_payments")
      .insert([
        {
          tenant_id,
          amount,
          due_date,
          month: billing_period || new Date().toISOString().substring(0, 7),
          status: "Pending"
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

// 5. Get owner settlement details (Owner)
router.get("/settlement", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  try {
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id, company_name")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) {
      return res.status(404).json({ error: "Owner profile not found" });
    }

    let details = {
      upi_vpa: "homiepgpayments@oksbi",
      payee_name: req.profile.name || "Amit PG Properties",
      bank_account: "XXXXXXXX5912",
      bank_ifsc: "SBIN0004928"
    };

    if (owner.company_name && owner.company_name.startsWith("SETTLEMENT_JSON:")) {
      try {
        const jsonStr = owner.company_name.replace("SETTLEMENT_JSON:", "");
        const parsed = JSON.parse(jsonStr);
        details = {
          upi_vpa: decrypt(parsed.upi_vpa),
          payee_name: parsed.payee_name,
          bank_account: decrypt(parsed.bank_account),
          bank_ifsc: parsed.bank_ifsc
        };
      } catch (err) {
        console.error("Failed to parse settlement fallback data", err);
      }
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Update owner settlement details (Owner)
router.post("/settlement", requireAuth, requireRole(["owner", "super_admin"]), async (req, res) => {
  const { upi_vpa, payee_name, bank_account, bank_ifsc } = req.body;
  if (!upi_vpa || !payee_name) {
    return res.status(400).json({ error: "Missing UPI VPA or Payee Name" });
  }

  try {
    const { data: owner } = await supabase
      .from("pg_owners")
      .select("id")
      .eq("profile_id", req.user.id)
      .single();

    if (!owner) {
      return res.status(404).json({ error: "Owner profile not found" });
    }

    // Encrypt sensitive details before storing
    const encryptedDetails = JSON.stringify({
      upi_vpa: encrypt(upi_vpa),
      payee_name,
      bank_account: encrypt(bank_account),
      bank_ifsc
    });

    // Store in company_name with prefix as a robust fallback
    const { error: updateErr } = await supabase
      .from("pg_owners")
      .update({ company_name: `SETTLEMENT_JSON:${encryptedDetails}` })
      .eq("id", owner.id);

    if (updateErr) throw updateErr;

    res.status(200).json({ message: "Settlement details encrypted and saved successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Get settlement details for an invoice (Tenant or Owner)
router.get("/invoices/:id/settlement", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: invoice, error: invErr } = await supabase
      .from("rent_payments")
      .select(`
        *,
        tenants (
          building_id,
          buildings (
            owner_id
          )
        )
      `)
      .eq("id", id)
      .single();

    if (invErr || !invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const ownerId = invoice.tenants?.buildings?.owner_id;
    if (!ownerId) {
      return res.status(200).json({
        upi_vpa: "homiepgpayments@oksbi",
        payee_name: "Homie PG Properties",
        bank_account: "XXXXXXXX5912",
        bank_ifsc: "SBIN0004928"
      });
    }

    const { data: owner } = await supabase
      .from("pg_owners")
      .select("company_name")
      .eq("id", ownerId)
      .single();

    let details = {
      upi_vpa: "homiepgpayments@oksbi",
      payee_name: "Homie PG Properties",
      bank_account: "XXXXXXXX5912",
      bank_ifsc: "SBIN0004928"
    };

    if (owner && owner.company_name && owner.company_name.startsWith("SETTLEMENT_JSON:")) {
      try {
        const jsonStr = owner.company_name.replace("SETTLEMENT_JSON:", "");
        const parsed = JSON.parse(jsonStr);
        details = {
          upi_vpa: decrypt(parsed.upi_vpa),
          payee_name: parsed.payee_name,
          bank_account: decrypt(parsed.bank_account),
          bank_ifsc: parsed.bank_ifsc
        };
      } catch (err) {
        console.error("Failed to parse settlement info", err);
      }
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
