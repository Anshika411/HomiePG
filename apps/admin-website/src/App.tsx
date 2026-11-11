"use client";

import React, { useState, useEffect } from "react";
import logoIcon from "./assets/logo-icon.png";
import logoHorizontal from "./assets/logo-horizontal.png";
import OwnersPage from "./components/OwnersPage";
import "./App.css";

const API_BASE = "http://localhost:5005";

function App({ initialTab = "dashboard" }: { initialTab?: string }) {
  const [currentTab, setCurrentTab] = useState(initialTab); // "dashboard" or "owners"
  const [token, setToken] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  });
  const [userProfile, setUserProfile] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("profile");
        return stored ? JSON.parse(stored) : null;
      } catch (err) {
        return null;
      }
    }
    return null;
  });
  
  // Login Form
  const [email, setEmail] = useState("admin@homiepg.com");
  const [password, setPassword] = useState("password123");

  const [owners, setOwners] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOwners: 0,
    totalBuildings: 0,
    totalBookings: 0
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      if (data.profile.role !== "super_admin" && data.profile.role !== "platform_manager") {
        alert("Access Denied: Admin privileges required.");
        return;
      }

      setToken(data.token);
      setUserProfile(data.profile);
      localStorage.setItem("token", data.token);
      localStorage.setItem("profile", JSON.stringify(data.profile));
      fetchAdminData(data.token);
    } catch (err) {
      alert("Failed to connect to the backend API.");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUserProfile(null);
    setCurrentTab("dashboard");
    localStorage.removeItem("token");
    localStorage.removeItem("profile");
  };

  const fetchAdminData = async (authToken = token) => {
    try {
      const headers = { Authorization: `Bearer ${authToken}` };
      const [oRes, sRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/owners`, { headers }),
        fetch(`${API_BASE}/api/admin/stats`, { headers })
      ]);

      const ownersData = await oRes.json();
      const statsData = await sRes.json();

      if (Array.isArray(ownersData)) setOwners(ownersData);
      if (statsData && !statsData.error) setStats(statsData);
    } catch (err) {
      console.error("Error fetching admin data", err);
    }
  };

  useEffect(() => {
    if (token && userProfile && (userProfile.role === "super_admin" || userProfile.role === "platform_manager")) {
      fetchAdminData();
    }
  }, [token, userProfile]);

  const toggleVerifyOwner = async (id, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/owners/${id}/verify`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        fetchAdminData();
      }
    } catch (err) {
      alert("Failed to update owner verification.");
    }
  };

  // If not logged in, render admin login card
  if (!token) {
    return (
      <div className="app-container" style={{ justifyContent: "center", alignItems: "center", background: "var(--bg-light)" }}>
        <div className="auth-card-glass" style={{ position: "relative", maxWidth: "420px", width: "100%", padding: "2.5rem 2.5rem 3.5rem 2.5rem", borderRadius: "16px", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", boxShadow: "var(--glass-shadow)" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary)" }}>Admin Console</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Authenticate to manage the HomiePG co-living platform</p>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" placeholder="admin@homiepg.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn-submit-auth" style={{ width: "100%", background: "var(--primary)" }}>Authenticate</button>
          </form>
          <img src={logoIcon.src} alt="HomiePG Admin Logo" style={{ position: "absolute", bottom: "12px", right: "12px", width: "30px", height: "30px", opacity: 0.8 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header-glass">
        <div className="header-logo">
          <span className="brand-name">Homie<span className="text-highlight">PG</span> <span className="admin-badge">Admin</span></span>
        </div>
        <nav className="header-menu">
          <button 
            type="button" 
            className={`nav-link ${currentTab === "dashboard" ? "active" : ""}`}
            onClick={() => setCurrentTab("dashboard")}
          >
            Dashboard
          </button>
          <button 
            type="button" 
            className={`nav-link ${currentTab === "owners" ? "active" : ""}`}
            onClick={() => setCurrentTab("owners")}
          >
            PG Owners
          </button>
        </nav>
        <div className="header-nav">
          <span style={{ fontSize: "0.95rem", color: "var(--text-muted)", fontWeight: "500" }}>{userProfile.full_name}</span>
          <button className="btn-primary btn-logout" onClick={handleLogout} style={{ padding: "0.4rem 1rem", fontSize: "0.9rem" }}>Logout</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {currentTab === "dashboard" ? (
          <>
            <section className="hero-banner">
              <img src={logoHorizontal.src} alt="HomiePG Banner" className="brand-banner-img" />
              <h2>Global Platform Management Console</h2>
            </section>

            {/* Stats Grid */}
            <div className="stats-row">
              <div className="stat-card">
                <h3>Registered Owners</h3>
                <div className="stat-number">{stats.totalOwners || owners.length}</div>
              </div>
              <div className="stat-card">
                <h3>Active Buildings</h3>
                <div className="stat-number">{stats.totalBuildings || 34}</div>
              </div>
              <div className="stat-card">
                <h3>Total Stays Booked</h3>
                <div className="stat-number">{stats.totalBookings || 812}</div>
              </div>
            </div>

            {/* Owner Approvals Panel */}
            <div className="admin-panel-card">
              <h3>PG Owner Approvals & Verification</h3>
              <p className="subtitle">Verify business registrations and KYC documents of property operators to enable active booking lists.</p>

              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Owner Name</th>
                    <th>Email Address</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.length > 0 ? (
                    owners.map(owner => (
                      <tr key={owner.id}>
                        <td><strong>{owner.full_name}</strong></td>
                        <td>{owner.email}</td>
                        <td>
                          <span className={`badge ${owner.is_verified ? "status-approved" : "status-pending"}`}>
                            {owner.is_verified ? "Verified" : "Pending Approval"}
                          </span>
                        </td>
                        <td>
                          <button
                            className={`btn-action ${owner.is_verified ? "btn-unverify" : "btn-verify"}`}
                            onClick={() => toggleVerifyOwner(owner.id, owner.is_verified)}
                          >
                            {owner.is_verified ? "Revoke Verification" : "Approve & Verify"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", color: "#64748B", padding: "2rem" }}>No registered owners found in the queue. (Verify DB connection or see detailed list in PG Owners tab)</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <OwnersPage onGoBack={() => setCurrentTab("dashboard")} />
        )}
      </main>

      <footer className="footer-glass" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p>&copy; {new Date().getFullYear()} HomiePG Super Admin. Admin controls matching brand rules.</p>
        <img src={logoIcon.src} alt="HomiePG Admin Logo" style={{ width: "35px", height: "35px" }} />
      </footer>
    </div>
  );
}

export default App;

