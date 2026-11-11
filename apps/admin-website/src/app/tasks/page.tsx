"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface AuditTask {
  id: string;
  type: string;
  property_name: string;
  owner_name: string;
  submitted_date: string;
  status: "Pending Audit" | "Approved" | "Rejected";
  notes?: string;
}

const INITIAL_TASKS: AuditTask[] = [
  {
    id: "TSK-001",
    type: "Walkthrough Video Review",
    property_name: "Heights Residency",
    owner_name: "Rahul Verma",
    submitted_date: "2026-07-12",
    status: "Pending Audit",
    notes: "Please inspect safety fire exits in the layout."
  },
  {
    id: "TSK-002",
    type: "GPS Coordinate Match",
    property_name: "Heights Residency",
    owner_name: "Rahul Verma",
    submitted_date: "2026-07-12",
    status: "Pending Audit"
  },
  {
    id: "TSK-003",
    type: "PAN & GST Legal Match",
    property_name: "Heights Residency",
    owner_name: "Rahul Verma",
    submitted_date: "2026-07-11",
    status: "Pending Audit"
  },
  {
    id: "TSK-004",
    type: "Walkthrough Video Review",
    property_name: "Royal Palms PG",
    owner_name: "Ananya Iyer",
    submitted_date: "2026-07-10",
    status: "Pending Audit",
    notes: "Review safety clearances for the main lobby."
  },
  {
    id: "TSK-005",
    type: "GPS Coordinate Match",
    property_name: "Greenfield Co-living",
    owner_name: "Amit Sharma",
    submitted_date: "2026-07-09",
    status: "Approved"
  }
];

export default function TasksRoute() {
  const router = useRouter();
  const [tasks, setTasks] = useState<AuditTask[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedTask, setSelectedTask] = useState<AuditTask | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.owner_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Pending" && t.status === "Pending Audit") ||
        (statusFilter === "Approved" && t.status === "Approved") ||
        (statusFilter === "Rejected" && t.status === "Rejected");

      return matchesSearch && matchesStatus;
    });
  }, [tasks, searchQuery, statusFilter]);

  const handleApproveTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Approved" } : t))
    );
    setSelectedTask(null);
  };

  const handleRejectTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Rejected" } : t))
    );
    setSelectedTask(null);
  };

  return (
    <AdminShell>
      <div className="tasks-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Verification Tasks" }
              ]}
            />
            <h2 className="page-title">Verification Tasks Queue</h2>
            <p className="page-subtitle">Onboarding audits mapped to GPS logs and walk-through videos. Platforms managers audit tasks remotely.</p>
          </div>
        </div>

        {/* Filter panel */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Verification Tasks</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Property, Owner or Type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Audit Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Tasks</option>
                <option value="Pending">Pending Audit</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
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

        {/* Tasks Data Table */}
        <div className="table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Verification Type</th>
                  <th>Target Building</th>
                  <th>Owner Name</th>
                  <th>Date Submitted</th>
                  <th>Audit Status</th>
                  <th className="text-center">Action Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{task.id}</td>
                      <td>
                        <strong>{task.type}</strong>
                      </td>
                      <td>{task.property_name}</td>
                      <td>{task.owner_name}</td>
                      <td className="font-mono text-sm">{task.submitted_date}</td>
                      <td>
                        <Badge
                          variant={
                            task.status === "Approved"
                              ? "success"
                              : task.status === "Rejected"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => setSelectedTask(task)}
                          >
                            Inspect Details
                          </button>
                          {task.status === "Pending Audit" && (
                            <>
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-approve"
                                onClick={() => handleApproveTask(task.id)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-tbl-action btn-tbl-delete"
                                onClick={() => handleRejectTask(task.id)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="table-empty-row">
                      No tasks found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspect Task Modal */}
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Verification Details: ${selectedTask?.id}`}
          size="md"
        >
          {selectedTask && (
            <div className="task-review-modal" style={{ textAlign: "left" }}>
              <div className="info-list" style={{ marginBottom: "1.5rem" }}>
                <div className="info-item">
                  <span className="info-label">Verification Type</span>
                  <span className="info-value font-bold">{selectedTask.type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Target Building</span>
                  <span className="info-value">{selectedTask.property_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Submitted by</span>
                  <span className="info-value">{selectedTask.owner_name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date Submitted</span>
                  <span className="info-value font-mono">{selectedTask.submitted_date}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Current Audit Status</span>
                  <span className="info-value">
                    <Badge
                      variant={
                        selectedTask.status === "Approved"
                          ? "success"
                          : selectedTask.status === "Rejected"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {selectedTask.status}
                    </Badge>
                  </span>
                </div>
              </div>

              {selectedTask.notes && (
                <div 
                  className="notes-container" 
                  style={{ 
                    background: "rgba(255, 255, 255, 0.03)", 
                    padding: "1rem", 
                    borderRadius: "8px", 
                    border: "1px solid var(--glass-border)",
                    marginBottom: "1.5rem"
                  }}
                >
                  <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>
                    Auditor Notes:
                  </strong>
                  <p style={{ fontSize: "0.95rem" }}>{selectedTask.notes}</p>
                </div>
              )}

              <div 
                className="audit-visual-box"
                style={{ 
                  height: "180px", 
                  background: "rgba(15, 23, 42, 0.5)", 
                  border: "1px dashed var(--glass-border)",
                  borderRadius: "10px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <span style={{ fontSize: "2rem" }}>🔬</span>
                <span className="text-dark font-bold">Audit Assets Attached</span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", padding: "0 1rem" }}>
                  GPS positioning locks match listed address. PAN identity verification is verified remotely.
                </p>
              </div>

              <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                <button className="btn-cancel" onClick={() => setSelectedTask(null)}>
                  Close
                </button>
                {selectedTask.status === "Pending Audit" && (
                  <>
                    <button 
                      className="btn-tbl-action btn-tbl-delete" 
                      onClick={() => handleRejectTask(selectedTask.id)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}
                    >
                      Reject Audit
                    </button>
                    <button 
                      className="btn-tbl-action btn-tbl-approve" 
                      onClick={() => handleApproveTask(selectedTask.id)}
                      style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}
                    >
                      Approve Audit
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
