"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface MaintenanceTicket {
  id: string;
  category: string;
  property_name: string;
  tenant_name: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  assigned_staff: string;
  created_at: string;
  status: "Open" | "In Progress" | "Resolved";
  description: string;
}

const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: "TKT-001",
    category: "Plumbing",
    property_name: "Greenfield Co-living",
    tenant_name: "Kunal Sen",
    severity: "High",
    assigned_staff: "Rohan Nair",
    created_at: "2026-07-12",
    status: "Open",
    description: "Leaking pipe in washroom of Room 102 causing minor flooding."
  },
  {
    id: "TKT-002",
    category: "Wi-Fi Connectivity",
    property_name: "Heights Residency",
    tenant_name: "Aditya Roy",
    severity: "Medium",
    assigned_staff: "Karan Singhal",
    created_at: "2026-07-12",
    status: "Open",
    description: "Wi-Fi speeds are extremely slow in Room 101, dropping constantly."
  },
  {
    id: "TKT-003",
    category: "Electrical",
    property_name: "Cyber City Haven",
    tenant_name: "Shruti Hegde",
    severity: "Critical",
    assigned_staff: "Rohan Nair",
    created_at: "2026-07-11",
    status: "In Progress",
    description: "Sparking in main light socket of Room 305. High hazard alert."
  },
  {
    id: "TKT-004",
    category: "Housekeeping",
    property_name: "Orchard Nest Stays",
    tenant_name: "Anjali Gupta",
    severity: "Low",
    assigned_staff: "Unassigned",
    created_at: "2026-07-10",
    status: "Open",
    description: "Regular cleaning requested for Room 408 (dusting and floor mopping)."
  },
  {
    id: "TKT-005",
    category: "AC Maintenance",
    property_name: "Cyber City Haven",
    tenant_name: "Rajesh Khanna",
    severity: "High",
    assigned_staff: "Karan Singhal",
    created_at: "2026-07-09",
    status: "Resolved",
    description: "Air conditioner in Room 302 not cooling. Serviced and resolved."
  }
];

const STAFF_LIST = ["Unassigned", "Rohan Nair", "Karan Singhal", "Sneha Kapur", "Aniket Saxena"];

export default function MaintenanceRoute() {
  const router = useRouter();
  const [tickets, setTickets] = useState<MaintenanceTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  const [selectedTicket, setSelectedTicket] = useState<MaintenanceTicket | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenant_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesSeverity = severityFilter === "All" || t.severity === severityFilter;

      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [tickets, searchQuery, statusFilter, severityFilter]);

  const handleUpdateStatus = (id: string, newStatus: "Open" | "In Progress" | "Resolved") => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleAssignStaff = (id: string, staffName: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, assigned_staff: staffName } : t))
    );
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => prev ? { ...prev, assigned_staff: staffName } : null);
    }
  };

  const handleDeleteTicket = (id: string) => {
    if (confirm(`Are you sure you want to delete ticket ${id}?`)) {
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setSelectedTicket(null);
    }
  };

  return (
    <AdminShell>
      <div className="maintenance-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Support Tickets" }
              ]}
            />
            <h2 className="page-title">Support & Maintenance Tickets</h2>
            <p className="page-subtitle">Inspect property issues, track resolution statuses, and assign operations maintenance teams.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Tickets</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Category, Property or Tenant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Ticket Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="severityFilter">Severity</label>
              <select
                id="severityFilter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="All">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <button
              className="btn-reset"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setSeverityFilter("All");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Data Table Section */}
        <div className="table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Category</th>
                  <th>Property Location</th>
                  <th>Tenant Name</th>
                  <th>Severity</th>
                  <th>Assigned Staff</th>
                  <th>Date Logged</th>
                  <th>Ticket Status</th>
                  <th className="text-center">Action Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length > 0 ? (
                  filteredTickets.map((t) => (
                    <tr key={t.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{t.id}</td>
                      <td>
                        <strong>{t.category}</strong>
                      </td>
                      <td>{t.property_name}</td>
                      <td>{t.tenant_name}</td>
                      <td>
                        <Badge
                          variant={
                            t.severity === "Critical" || t.severity === "High"
                              ? "danger"
                              : t.severity === "Medium"
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {t.severity}
                        </Badge>
                      </td>
                      <td>
                        <span className={t.assigned_staff === "Unassigned" ? "text-danger" : "text-bold"}>
                          {t.assigned_staff}
                        </span>
                      </td>
                      <td className="text-sm font-mono text-muted">{t.created_at}</td>
                      <td>
                        <Badge
                          variant={
                            t.status === "Resolved"
                              ? "success"
                              : t.status === "In Progress"
                              ? "info"
                              : "warning"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => setSelectedTicket(t)}
                          >
                            Inspect Details
                          </button>
                          
                          {t.status !== "Resolved" && (
                            <button
                              type="button"
                              className="btn-tbl-action btn-tbl-approve"
                              onClick={() => handleUpdateStatus(t.id, "Resolved")}
                            >
                              Resolve
                            </button>
                          )}

                          {t.status === "Open" && (
                            <button
                              type="button"
                              className="btn-tbl-action btn-tbl-edit"
                              onClick={() => handleUpdateStatus(t.id, "In Progress")}
                            >
                              Work On
                            </button>
                          )}

                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-delete"
                            onClick={() => handleDeleteTicket(t.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="table-empty-row">
                      No support tickets found matching your query filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspect Details Modal */}
        <Modal
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          title={`Support Ticket Audit: ${selectedTicket?.id}`}
          size="lg"
        >
          {selectedTicket && (
            <div className="task-review-modal" style={{ textAlign: "left" }}>
              <div className="info-list" style={{ marginBottom: "1.5rem" }}>
                <div className="info-item">
                  <span className="info-label">Category / Issue</span>
                  <span className="info-value font-bold">{selectedTicket.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Property Location</span>
                  <span className="info-value">{selectedTicket.property_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Submitted by Tenant</span>
                  <span className="info-value">{selectedTicket.tenant_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date Submitted</span>
                  <span className="info-value font-mono">{selectedTicket.created_at}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Severity Level</span>
                  <span className="info-value">
                    <Badge variant={selectedTicket.severity === "Critical" ? "danger" : "warning"}>
                      {selectedTicket.severity}
                    </Badge>
                  </span>
                </div>
              </div>

              <div 
                className="notes-container" 
                style={{ 
                  background: "rgba(255, 255, 255, 0.03)", 
                  padding: "1.25rem", 
                  borderRadius: "10px", 
                  border: "1px solid var(--glass-border)",
                  marginBottom: "1.5rem"
                }}
              >
                <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
                  Issue Description:
                </strong>
                <p style={{ fontSize: "0.95rem", lineHeight: "1.4" }}>{selectedTicket.description}</p>
              </div>

              <div className="form-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="form-group">
                  <label htmlFor="modalStatus">Update Ticket Status</label>
                  <select
                    id="modalStatus"
                    value={selectedTicket.status}
                    onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value as any)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="modalStaff">Assign Operational Staff</label>
                  <select
                    id="modalStaff"
                    value={selectedTicket.assigned_staff}
                    onChange={(e) => handleAssignStaff(selectedTicket.id, e.target.value)}
                  >
                    {STAFF_LIST.map((staff) => (
                      <option key={staff} value={staff}>
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setSelectedTicket(null)}>
                  Close
                </button>
                <button
                  className="btn-tbl-action btn-tbl-delete"
                  onClick={() => handleDeleteTicket(selectedTicket.id)}
                  style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}
                >
                  Delete Ticket
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
