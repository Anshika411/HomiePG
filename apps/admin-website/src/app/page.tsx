"use client";

import React, { useState, useEffect } from "react";
import AdminShell from "../components/AdminShell";
import logoHorizontal from "../assets/logo-horizontal.png";
import Link from "next/link";

interface DashboardStats {
  totalOwners: number;
  totalBuildings: number;
  totalBookings: number;
  activeStays: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOwners: 12,
    totalBuildings: 34,
    totalBookings: 812,
    activeStays: 489
  });

  // Fetch from supabase backend if running, else use mocks
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005";
        const res = await fetch(`${apiBase}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && !data.error) {
          setStats({
            totalOwners: data.totalOwners || 12,
            totalBuildings: data.totalBuildings || 34,
            totalBookings: data.totalBookings || 812,
            activeStays: Math.round((data.totalBookings || 812) * 0.6)
          });
        }
      } catch (err) {
        console.log("Using mock offline statistics");
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminShell>
      <div className="dashboard-view">
        {/* Banner */}
        <section className="hero-banner">
          <img src={logoHorizontal.src} alt="HomiePG Banner" className="brand-banner-img" />
          <h2>Global Platform Management Console</h2>
          <p className="subtitle">Operational cockpit for audit pipelines, remote verification, and co-living metrics.</p>
        </section>

        {/* Dynamic Stats Cards */}
        <div className="stats-row">
          <div className="stat-card">
            <h3>Registered Owners</h3>
            <div className="stat-number">{stats.totalOwners}</div>
            <p className="stat-meta">Active property portfolios</p>
          </div>
          <div className="stat-card">
            <h3>Active Buildings</h3>
            <div className="stat-number">{stats.totalBuildings}</div>
            <p className="stat-meta">Verified active locations</p>
          </div>
          <div className="stat-card">
            <h3>Total Bookings</h3>
            <div className="stat-number">{stats.totalBookings}</div>
            <p className="stat-meta">Co-living stays booked</p>
          </div>
          <div className="stat-card">
            <h3>Active Stays</h3>
            <div className="stat-number text-secondary">{stats.activeStays}</div>
            <p className="stat-meta">Tenants currently checked-in</p>
          </div>
        </div>

        {/* Action Panels Grid */}
        <div className="dashboard-grid">
          {/* Panel: Recent Onboarding Alerts */}
          <div className="admin-panel-card grid-card">
            <div className="panel-header">
              <h3>Onboarding Moderation Queue</h3>
              <Link href="/tasks" className="panel-link">View All Tasks</Link>
            </div>
            <p className="panel-subtitle">On-site inspections and location reviews requiring remote audit review.</p>

            <ul className="alerts-list">
              <li className="alert-item warning">
                <div className="alert-content">
                  <strong>TSK-010-02: Video Walkthrough Review</strong>
                  <p>Building: Greenfield Co-living, Pune. Assigned: Platform Manager.</p>
                </div>
                <span className="badge status-pending">Pending Review</span>
              </li>
              <li className="alert-item warning">
                <div className="alert-content">
                  <strong>TSK-006-03: PAN/GST Verification</strong>
                  <p>Owner: Sneha Reddy. Assigned: Platform Manager.</p>
                </div>
                <span className="badge status-pending">Verification Check</span>
              </li>
              <li className="alert-item success">
                <div className="alert-content">
                  <strong>TSK-009-01: GPS Location Match</strong>
                  <p>Building: Heights Residency, Bangalore. Status: Approved.</p>
                </div>
                <span className="badge status-approved">Approved</span>
              </li>
            </ul>
          </div>

          {/* Panel: Operational Quick Links */}
          <div className="admin-panel-card grid-card quick-actions-panel">
            <h3>Operations Checklist</h3>
            <p className="panel-subtitle">Quick links to standard moderator work queues.</p>
            <div className="actions-shortcut-grid">
              <Link href="/owners" className="shortcut-btn">
                <span className="shortcut-icon">👥</span>
                <strong>Manage Owners</strong>
                <p>Onboard and audit PG Operators</p>
              </Link>
              <Link href="/tasks" className="shortcut-btn">
                <span className="shortcut-icon">✅</span>
                <strong>Review Task Queue</strong>
                <p>Approve GPS & Video uploads</p>
              </Link>
              <Link href="/properties" className="shortcut-btn">
                <span className="shortcut-icon">🏢</span>
                <strong>Buildings Registry</strong>
                <p>Inspect registered assets</p>
              </Link>
              <Link href="/bookings" className="shortcut-btn">
                <span className="shortcut-icon">📅</span>
                <strong>Bookings Registry</strong>
                <p>Audit stays and reservations</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
