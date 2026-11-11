import React from "react";
import { Owner } from "./OwnerForm";
import Badge from "./Badge";

interface OwnerDetailsModalProps {
  owner: Owner;
  onClose: () => void;
}

export default function OwnerDetailsModal({ owner, onClose }: OwnerDetailsModalProps) {
  const occupancyRate = owner.total_beds > 0 ? Math.round((owner.occupied_beds / owner.total_beds) * 100) : 0;

  // Simulated verification tasks log based on Workspace Rules (remotely audited by Platform Manager)
  const simulatedTasks = [
    {
      id: `TSK-${owner.id.split("-").pop()}-01`,
      type: "GPS Location & Geo-Tagging Verification",
      description: "Match listed coordinates with physical building geofencing logs",
      status: owner.is_verified ? "Approved" : "Completed",
      updatedAt: "2026-07-10 14:32",
      auditor: "Platform Manager (Remote Audit)"
    },
    {
      id: `TSK-${owner.id.split("-").pop()}-02`,
      type: "Walk-Through Video Verification Audit",
      description: "Review safety hazards, amenities, and room dimensions via video uploads",
      status: owner.is_verified ? "Approved" : "Pending Audit",
      updatedAt: owner.is_verified ? "2026-07-11 11:15" : "2026-07-12 09:00",
      auditor: "Platform Manager (Remote Audit)"
    },
    {
      id: `TSK-${owner.id.split("-").pop()}-03`,
      type: "KYC & PAN/GST Registration Verification",
      description: "Confirm business legal names and tax filings against government APIs",
      status: owner.is_verified ? "Approved" : "Pending Verification",
      updatedAt: "2026-07-09 18:22",
      auditor: "Platform Manager (Remote Audit)"
    }
  ];

  return (
    <div className="owner-details-view">
      {/* Upper Grid - Profile Card & Portfolio Stats */}
      <div className="details-grid">
        {/* Profile Card */}
        <div className="details-card-section glass-panel">
          <h5 className="section-title">Owner Information</h5>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Owner ID</span>
              <span className="info-value text-highlight font-mono">{owner.id}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Name</span>
              <span className="info-value font-bold">{owner.full_name}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email</span>
              <span className="info-value">{owner.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Mobile</span>
              <span className="info-value">{owner.mobile}</span>
            </div>
            <div className="info-item">
              <span className="info-label">City</span>
              <span className="info-value">{owner.city}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Registered On</span>
              <span className="info-value">{owner.created_at}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Card */}
        <div className="details-card-section glass-panel">
          <h5 className="section-title">Portfolio Analytics</h5>
          
          <div className="stats-mini-grid">
            <div className="stat-mini-card">
              <span className="stat-lbl">Buildings</span>
              <span className="stat-val">{owner.total_buildings}</span>
            </div>
            <div className="stat-mini-card">
              <span className="stat-lbl">Total Beds</span>
              <span className="stat-val">{owner.total_beds}</span>
            </div>
            <div className="stat-mini-card">
              <span className="stat-lbl">Occupied Beds</span>
              <span className="stat-val">{owner.occupied_beds}</span>
            </div>
          </div>

          <div className="occupancy-section">
            <div className="occupancy-header">
              <span>Occupancy Rate</span>
              <span className="font-bold text-secondary">{occupancyRate}%</span>
            </div>
            <div className="occupancy-bar-bg">
              <div 
                className="occupancy-bar-fill" 
                style={{ width: `${occupancyRate}%`, background: `linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)` }}
              ></div>
            </div>
            <p className="occupancy-desc">
              {owner.total_beds - owner.occupied_beds} beds available out of {owner.total_beds} total portfolio capacity.
            </p>
          </div>

          <div className="status-indicator-list">
            <div className="status-ind-item">
              <span>Verification:</span>
              <Badge variant={owner.is_verified ? "success" : "warning"}>
                {owner.is_verified ? "Verified" : "Pending Verification"}
              </Badge>
            </div>
            <div className="status-ind-item">
              <span>Account Status:</span>
              <Badge variant={owner.status === "Active" ? "success" : owner.status === "Pending" ? "warning" : "danger"}>
                {owner.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section - Verification Tasks Log */}
      <div className="details-card-section tasks-log-section glass-panel">
        <h5 className="section-title">Onboarding & Verification Audit Trail</h5>
        <p className="section-subtitle">
          Onboarding tasks mapped to GPS, video verification and documentation. Platform managers audit these tasks remotely.
        </p>

        <div className="tasks-table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Task Verification Type</th>
                <th>Assigned Auditor</th>
                <th>Task Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {simulatedTasks.map((task) => (
                <tr key={task.id}>
                  <td className="font-mono text-xs">{task.id}</td>
                  <td>
                    <div>
                      <strong>{task.type}</strong>
                      <p className="task-desc">{task.description}</p>
                    </div>
                  </td>
                  <td className="text-sm text-muted">{task.auditor}</td>
                  <td>
                    <span 
                      className={`task-status-badge status-${task.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {task.status}
                    </span>
                  </td>
                  <td className="text-sm text-muted">{task.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-primary" onClick={onClose}>
          Close Details
        </button>
      </div>
    </div>
  );
}
