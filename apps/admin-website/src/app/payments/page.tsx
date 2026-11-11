"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface Invoice {
  id: string;
  tenant_name: string;
  property_name: string;
  billing_month: string;
  rent_amount: number;
  paid_amount: number;
  due_date: string;
  status: "Paid" | "Pending Approval" | "Overdue";
}

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "INV-001",
    tenant_name: "Kunal Sen",
    property_name: "Greenfield Co-living",
    billing_month: "July 2026",
    rent_amount: 9500,
    paid_amount: 9500,
    due_date: "2026-07-05",
    status: "Paid"
  },
  {
    id: "INV-002",
    tenant_name: "Rohan Das",
    property_name: "Greenfield Co-living",
    billing_month: "July 2026",
    rent_amount: 9500,
    paid_amount: 0,
    due_date: "2026-07-05",
    status: "Pending Approval"
  },
  {
    id: "INV-003",
    tenant_name: "Shruti Hegde",
    property_name: "Cyber City Haven",
    billing_month: "July 2026",
    rent_amount: 11000,
    paid_amount: 11000,
    due_date: "2026-07-05",
    status: "Paid"
  },
  {
    id: "INV-004",
    tenant_name: "Aditya Roy",
    property_name: "Heights Residency",
    billing_month: "July 2026",
    rent_amount: 12500,
    paid_amount: 0,
    due_date: "2026-07-05",
    status: "Overdue"
  },
  {
    id: "INV-005",
    tenant_name: "Anjali Gupta",
    property_name: "Orchard Nest Stays",
    billing_month: "July 2026",
    rent_amount: 8000,
    paid_amount: 8000,
    due_date: "2026-07-05",
    status: "Paid"
  }
];

export default function PaymentsRoute() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.billing_month.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleMarkAsPaid = (id: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "Paid", paid_amount: inv.rent_amount } : inv
      )
    );
  };

  const handleSendReminder = (tenantName: string) => {
    alert(`Payment reminder notification sent successfully to ${tenantName}!`);
  };

  return (
    <AdminShell>
      <div className="payments-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Payments" }
              ]}
            />
            <h2 className="page-title">Payments & Revenue Audit</h2>
            <p className="page-subtitle">Track platform invoicing cycles, check tenant transaction records, and approve cash reconciliations.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Invoices</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Tenant, Property or Term..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Invoice Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Invoices</option>
                <option value="Paid">Paid</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
            <button
              className="btn-reset"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Table List Section */}
        <div className="table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Tenant Name</th>
                  <th>Property Location</th>
                  <th>Billing Month</th>
                  <th className="text-right">Rent Invoice Amount</th>
                  <th className="text-right">Paid Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-center">Action Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{inv.id}</td>
                      <td>
                        <strong className="text-dark">{inv.tenant_name}</strong>
                      </td>
                      <td>{inv.property_name}</td>
                      <td>{inv.billing_month}</td>
                      <td className="text-right font-mono">₹{inv.rent_amount.toLocaleString("en-IN")}</td>
                      <td className="text-right font-mono">
                        <span className={inv.paid_amount === 0 ? "text-danger" : "text-success"}>
                          ₹{inv.paid_amount.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td className="text-sm font-mono">{inv.due_date}</td>
                      <td>
                        <Badge
                          variant={
                            inv.status === "Paid"
                              ? "success"
                              : inv.status === "Overdue"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => setSelectedInvoice(inv)}
                          >
                            Inspect Invoice
                          </button>
                          
                          {inv.status !== "Paid" && (
                            <>
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-approve"
                                onClick={() => handleMarkAsPaid(inv.id)}
                              >
                                Mark Paid
                              </button>
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-suspend"
                                onClick={() => handleSendReminder(inv.tenant_name)}
                              >
                                Remind
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="table-empty-row">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Invoice Modal */}
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`HomiePG Invoice: ${selectedInvoice?.id}`}
          size="md"
        >
          {selectedInvoice && (
            <div className="invoice-receipt-view" style={{ textAlign: "left" }}>
              <div 
                className="receipt-header" 
                style={{ 
                  borderBottom: "1px dashed var(--glass-border)", 
                  paddingBottom: "1rem", 
                  marginBottom: "1rem", 
                  display: "flex", 
                  justifyContent: "space-between" 
                }}
              >
                <div>
                  <h4 style={{ margin: 0, color: "var(--primary)" }}>HomiePG Co-Living</h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Platform billing reconciliations</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>{selectedInvoice.id}</h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>Term: {selectedInvoice.billing_month}</p>
                </div>
              </div>

              <div className="info-list" style={{ marginBottom: "1.5rem" }}>
                <div className="info-item">
                  <span className="info-label">Tenant Name</span>
                  <span className="info-value font-bold">{selectedInvoice.tenant_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Assigned Property</span>
                  <span className="info-value">{selectedInvoice.property_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Payment Status</span>
                  <span className="info-value">
                    <Badge variant={selectedInvoice.status === "Paid" ? "success" : "warning"}>
                      {selectedInvoice.status}
                    </Badge>
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Due Date</span>
                  <span className="info-value font-mono">{selectedInvoice.due_date}</span>
                </div>
              </div>

              <table className="tasks-table" style={{ marginBottom: "1.5rem" }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Co-Living Monthly License Fee (Rent)</td>
                    <td className="text-right font-mono">₹{selectedInvoice.rent_amount.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr style={{ background: "rgba(255,255,255,0.02)", fontWeight: "bold" }}>
                    <td>Total Amount Due</td>
                    <td className="text-right font-mono text-highlight">₹{selectedInvoice.rent_amount.toLocaleString("en-IN")}</td>
                  </tr>
                  <tr style={{ background: "rgba(255,255,255,0.02)", fontWeight: "bold" }}>
                    <td>Amount Settled / Paid</td>
                    <td className="text-right font-mono text-secondary">₹{selectedInvoice.paid_amount.toLocaleString("en-IN")}</td>
                  </tr>
                </tbody>
              </table>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setSelectedInvoice(null)}>
                  Close Receipt
                </button>
                {selectedInvoice.status !== "Paid" && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleMarkAsPaid(selectedInvoice.id);
                      setSelectedInvoice(null);
                    }}
                  >
                    Confirm Offline Payment
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
