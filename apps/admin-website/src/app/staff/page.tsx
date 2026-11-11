"use client";

import React, { useState } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import { useRouter } from "next/navigation";

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "platform_manager";
  status: "Active" | "Suspended";
  created_at: string;
}

const INITIAL_STAFF: StaffUser[] = [
  {
    id: "STF-001",
    name: "Platform SuperAdmin",
    email: "admin@homiepg.com",
    role: "super_admin",
    status: "Active",
    created_at: "2026-01-01"
  },
  {
    id: "STF-002",
    name: "Rohan Nair",
    email: "rohan.nair@homiepg.com",
    role: "platform_manager",
    status: "Active",
    created_at: "2026-03-15"
  },
  {
    id: "STF-003",
    name: "Karan Singhal",
    email: "karan.s@homiepg.com",
    role: "platform_manager",
    status: "Active",
    created_at: "2026-04-10"
  },
  {
    id: "STF-004",
    name: "Sneha Kapur",
    email: "sneha.k@homiepg.com",
    role: "platform_manager",
    status: "Suspended",
    created_at: "2026-02-20"
  }
];

export default function StaffRoute() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffUser[]>(INITIAL_STAFF);

  const handleToggleStatus = (id: string) => {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "Active" ? "Suspended" : "Active" }
          : s
      )
    );
  };

  return (
    <AdminShell>
      <div className="staff-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Staff & Admins" }
              ]}
            />
            <h2 className="page-title">Operations Staff Directory</h2>
            <p className="page-subtitle">Manage internal system operators, platform managers and audit permissions.</p>
          </div>
        </div>

        {/* Staff Data Table */}
        <div className="table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>System Role</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th className="text-center">Permissions Action</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.id} className="table-row-hover">
                    <td className="font-mono text-sm text-highlight">{staff.id}</td>
                    <td>
                      <strong className="text-dark">{staff.name}</strong>
                    </td>
                    <td className="text-sm">{staff.email}</td>
                    <td>
                      <span className={`admin-badge`} style={{ background: staff.role === "super_admin" ? "var(--brand-orange)" : "var(--primary)" }}>
                        {staff.role === "super_admin" ? "Super Admin" : "Platform Manager"}
                      </span>
                    </td>
                    <td>
                      <Badge variant={staff.status === "Active" ? "success" : "danger"}>
                        {staff.status}
                      </Badge>
                    </td>
                    <td className="text-sm font-mono text-muted">{staff.created_at}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className={`btn-tbl-action ${
                            staff.status === "Active" ? "btn-tbl-suspend" : "btn-tbl-approve"
                          }`}
                          onClick={() => handleToggleStatus(staff.id)}
                          disabled={staff.email === "admin@homiepg.com"} // Prevent self lockout
                        >
                          {staff.status === "Active" ? "Suspend Account" : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
