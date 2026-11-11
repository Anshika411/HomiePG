"use client";

import React from "react";
import { Owner } from "./OwnerForm";
import Badge from "./Badge";

interface OwnerDetailsDrawerProps {
  owner: Owner | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSuspend: (id: string) => void;
}

export default function OwnerDetailsDrawer({
  owner,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onSuspend
}: OwnerDetailsDrawerProps) {
  if (!owner) return null;

  const vacantBeds = owner.total_beds - owner.occupied_beds;
  const initial = owner.full_name.charAt(0).toUpperCase();

  // Simulated managers and activities based on Owner ID
  const simulatedManagers = [
    "Rohan Nair (Property Manager)",
    "Karan Singhal (Area Operations Lead)"
  ];

  const simulatedActivities = [
    { time: "2026-07-13 14:10", text: "Remotely audited walk-through verification video" },
    { time: "2026-07-12 09:45", timeAgo: "1 day ago", text: "Matched GPS geofence coordinates audit" },
    { time: "2026-07-11 11:30", timeAgo: "2 days ago", text: "KYC Aadhaar & PAN details verified via remote logs" },
    { time: "2026-07-01 10:00", timeAgo: "12 days ago", text: "Registered account and uploaded listing portfolio" }
  ];

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? "open" : ""}`} 
        onClick={onClose} 
      />

      {/* Sliding Container */}
      <div className={`drawer-container ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h3 className="drawer-title">Owner Details Profile</h3>
            <span className="drawer-subtitle font-mono text-xs">{owner.id}</span>
          </div>
          <button 
            type="button" 
            className="btn-drawer-close-icon" 
            onClick={onClose}
            aria-label="Close drawer"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Profile Section */}
          <div className="drawer-profile-summary">
            <div className="drawer-avatar-ring">
              <div className="drawer-avatar-initials">{initial}</div>
            </div>
            <h4 className="drawer-profile-name">{owner.full_name}</h4>
            <div className="drawer-profile-badges">
              <Badge variant={owner.is_verified ? "success" : "warning"}>
                {owner.is_verified ? "Verified" : "Pending Verification"}
              </Badge>
              <Badge variant={owner.status === "Active" ? "success" : owner.status === "Pending" ? "warning" : "danger"}>
                {owner.status}
              </Badge>
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* Contact Details */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">Contact & Core Details</h5>
            <div className="drawer-info-grid">
              <div className="drawer-info-cell">
                <span className="info-label">Email Address</span>
                <span className="info-value font-bold">{owner.email}</span>
              </div>
              <div className="drawer-info-cell">
                <span className="info-label">Mobile Number</span>
                <span className="info-value font-mono">{owner.mobile}</span>
              </div>
              <div className="drawer-info-cell">
                <span className="info-label">City Operations</span>
                <span className="info-value">{owner.city}</span>
              </div>
              <div className="drawer-info-cell">
                <span className="info-label">Joined Date</span>
                <span className="info-value font-mono">{owner.created_at}</span>
              </div>
              <div className="drawer-info-cell">
                <span className="info-label">Last Account Login</span>
                <span className="info-value font-mono text-sm">2026-07-13 18:45</span>
              </div>
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* KYC Status Details */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">KYC Document Audits</h5>
            <div className="drawer-info-grid">
              <div className="drawer-info-cell">
                <span className="info-label">Aadhaar Status</span>
                <span className="info-value">
                  <Badge variant={owner.is_verified ? "success" : "warning"}>
                    {owner.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </span>
              </div>
              <div className="drawer-info-cell">
                <span className="info-label">PAN Card Status</span>
                <span className="info-value">
                  <Badge variant={owner.is_verified ? "success" : "warning"}>
                    {owner.is_verified ? "Verified" : "Pending Verification"}
                  </Badge>
                </span>
              </div>
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* Portfolio Metrics */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">Portfolio Capacities</h5>
            <div className="drawer-metrics-grid">
              <div className="metric-box">
                <span className="metric-lbl">Buildings</span>
                <span className="metric-val">{owner.total_buildings}</span>
              </div>
              <div className="metric-box">
                <span className="metric-lbl">Total Beds</span>
                <span className="metric-val">{owner.total_beds}</span>
              </div>
              <div className="metric-box">
                <span className="metric-lbl">Occupied</span>
                <span className="metric-val text-success">{owner.occupied_beds}</span>
              </div>
              <div className="metric-box">
                <span className="metric-lbl">Vacant</span>
                <span className="metric-val text-warning">{vacantBeds}</span>
              </div>
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* Property Managers */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">Assigned Local Operators</h5>
            <ul className="drawer-list font-medium">
              {simulatedManagers.map((m, idx) => (
                <li key={idx} className="drawer-list-item">
                  <span className="bullet-dot" />
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <hr className="drawer-divider" />

          {/* Recent Activity */}
          <div className="drawer-section">
            <h5 className="drawer-section-title">Recent Activity Logs</h5>
            <div className="activity-timeline">
              {simulatedActivities.map((act, idx) => (
                <div key={idx} className="activity-timeline-item">
                  <div className="timeline-node" />
                  <div className="timeline-content">
                    <p className="timeline-text">{act.text}</p>
                    <span className="timeline-time font-mono">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="drawer-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={onClose}
          >
            Close
          </button>
          
          {owner.status !== "Active" && (
            <button 
              type="button" 
              className="btn-tbl-action btn-tbl-approve" 
              onClick={() => {
                onApprove(owner.id);
                onClose();
              }}
            >
              Approve
            </button>
          )}

          {owner.status !== "Suspended" && (
            <>
              <button 
                type="button" 
                className="btn-tbl-action btn-tbl-delete" 
                onClick={() => {
                  onReject(owner.id);
                  onClose();
                }}
              >
                Reject
              </button>
              <button 
                type="button" 
                className="btn-tbl-action btn-tbl-suspend" 
                onClick={() => {
                  onSuspend(owner.id);
                  onClose();
                }}
              >
                Suspend
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
