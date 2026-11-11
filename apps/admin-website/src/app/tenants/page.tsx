"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface Tenant {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  building_name: string;
  city: string;
  room_bed: string;
  rent: number;
  kyc_status: "Verified" | "Pending";
  status: "Active" | "Vacated";
  joined_date: string;
}

const INITIAL_TENANTS: Tenant[] = [
  {
    id: "TNT-2026-001",
    full_name: "Kunal Sen",
    email: "kunal.sen@example.com",
    mobile: "+91 98123 45670",
    building_name: "Greenfield Co-living",
    city: "Bangalore",
    room_bed: "Room 102 - Bed A",
    rent: 9500,
    kyc_status: "Verified",
    status: "Active",
    joined_date: "2026-07-01"
  },
  {
    id: "TNT-2026-002",
    full_name: "Rohan Das",
    email: "rohan.das@example.com",
    mobile: "+91 98123 45671",
    building_name: "Greenfield Co-living",
    city: "Bangalore",
    room_bed: "Room 204 - Bed B",
    rent: 9500,
    kyc_status: "Pending",
    status: "Active",
    joined_date: "2026-07-05"
  },
  {
    id: "TNT-2026-003",
    full_name: "Shruti Hegde",
    email: "shruti.h@example.com",
    mobile: "+91 98123 45672",
    building_name: "Cyber City Haven",
    city: "Hyderabad",
    room_bed: "Room 305 - Bed A",
    rent: 11000,
    kyc_status: "Verified",
    status: "Active",
    joined_date: "2026-06-15"
  },
  {
    id: "TNT-2026-004",
    full_name: "Aditya Roy",
    email: "aditya.roy@example.com",
    mobile: "+91 98123 45673",
    building_name: "Heights Residency",
    city: "Mumbai",
    room_bed: "Room 101 - Bed A",
    rent: 12500,
    kyc_status: "Verified",
    status: "Active",
    joined_date: "2026-07-10"
  },
  {
    id: "TNT-2026-005",
    full_name: "Anjali Gupta",
    email: "anjali.g@example.com",
    mobile: "+91 98123 45674",
    building_name: "Orchard Nest Stays",
    city: "Delhi",
    room_bed: "Room 408 - Bed C",
    rent: 8000,
    kyc_status: "Verified",
    status: "Active",
    joined_date: "2026-07-01"
  },
  {
    id: "TNT-2026-006",
    full_name: "Megha Rawat",
    email: "megha.r@example.com",
    mobile: "+91 98123 45675",
    building_name: "Royal Palms PG",
    city: "Chennai",
    room_bed: "Room 12 - Bed A",
    rent: 8500,
    kyc_status: "Pending",
    status: "Vacated",
    joined_date: "2026-04-10"
  }
];

export default function TenantsRoute() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [kycFilter, setKycFilter] = useState("All");

  // Detail view/Edit state
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Omit<Tenant, "id" | "joined_date">>({
    full_name: "",
    email: "",
    mobile: "",
    building_name: "",
    city: "",
    room_bed: "",
    rent: 0,
    kyc_status: "Pending",
    status: "Pending" as any
  });

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.building_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || t.status === statusFilter;
      const matchesKyc = kycFilter === "All" || t.kyc_status === kycFilter;

      return matchesSearch && matchesStatus && matchesKyc;
    });
  }, [tenants, searchQuery, statusFilter, kycFilter]);

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditForm({
      full_name: tenant.full_name,
      email: tenant.email,
      mobile: tenant.mobile,
      building_name: tenant.building_name,
      city: tenant.city,
      room_bed: tenant.room_bed,
      rent: tenant.rent,
      kyc_status: tenant.kyc_status,
      status: tenant.status
    });
    setIsEditing(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTenant) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === selectedTenant.id ? { ...t, ...editForm } : t
        )
      );
      setIsEditing(false);
      setSelectedTenant(null);
    }
  };

  const handleToggleKyc = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, kyc_status: t.kyc_status === "Verified" ? "Pending" : "Verified" }
          : t
      )
    );
  };

  const handleToggleVacated = (id: string) => {
    setTenants((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "Active" ? "Vacated" : "Active" }
          : t
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to remove tenant ${id}?`)) {
      setTenants((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <AdminShell>
      <div className="tenants-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Tenants" }
              ]}
            />
            <h2 className="page-title">Tenants Directory</h2>
            <p className="page-subtitle">Unified registry to inspect tenant profile metadata, assigned co-living beds, and KYC statuses.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Tenants</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Name, Email, Property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Rent Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Tenants</option>
                <option value="Active">Active</option>
                <option value="Vacated">Vacated</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="kycFilter">KYC Status</label>
              <select
                id="kycFilter"
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
              >
                <option value="All">All KYC</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button
              className="btn-reset"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
                setKycFilter("All");
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
                  <th>Tenant ID</th>
                  <th>Tenant Name</th>
                  <th>Contact Info</th>
                  <th>Property Name</th>
                  <th>Room Assigned</th>
                  <th className="text-right">Monthly Rent</th>
                  <th>KYC Status</th>
                  <th>Tenant Status</th>
                  <th>Date Joined</th>
                  <th className="text-center">Action Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length > 0 ? (
                  filteredTenants.map((t) => (
                    <tr key={t.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{t.id}</td>
                      <td>
                        <strong className="text-dark">{t.full_name}</strong>
                      </td>
                      <td className="text-sm">
                        <div>{t.email}</div>
                        <div className="text-muted font-mono">{t.mobile}</div>
                      </td>
                      <td>{t.building_name}</td>
                      <td>{t.room_bed}</td>
                      <td className="text-right font-mono">₹{t.rent.toLocaleString("en-IN")}</td>
                      <td>
                        <Badge variant={t.kyc_status === "Verified" ? "success" : "warning"}>
                          {t.kyc_status}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={t.status === "Active" ? "success" : "neutral"}>
                          {t.status}
                        </Badge>
                      </td>
                      <td className="text-sm font-mono text-muted">{t.joined_date}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => handleToggleKyc(t.id)}
                          >
                            Toggle KYC
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-edit"
                            onClick={() => handleEditClick(t)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-suspend"
                            onClick={() => handleToggleVacated(t.id)}
                          >
                            {t.status === "Active" ? "Vacate" : "Activate"}
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-delete"
                            onClick={() => handleDelete(t.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="table-empty-row">
                      No tenants match your search filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditing && !!selectedTenant}
          onClose={() => {
            setIsEditing(false);
            setSelectedTenant(null);
          }}
          title={`Edit Tenant: ${selectedTenant?.id}`}
          size="lg"
        >
          {selectedTenant && (
            <form onSubmit={handleEditSave} className="owner-form">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mobile">Mobile Number</label>
                  <input
                    id="mobile"
                    type="text"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="buildingName">Building Name</label>
                  <input
                    id="buildingName"
                    type="text"
                    value={editForm.building_name}
                    onChange={(e) => setEditForm({ ...editForm, building_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="roomBed">Room Assigned</label>
                  <input
                    id="roomBed"
                    type="text"
                    value={editForm.room_bed}
                    onChange={(e) => setEditForm({ ...editForm, room_bed: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rent">Rent Rate (₹)</label>
                  <input
                    id="rent"
                    type="number"
                    value={editForm.rent}
                    onChange={(e) => setEditForm({ ...editForm, rent: parseInt(e.target.value, 10) })}
                    required
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setSelectedTenant(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
