"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  tenant_name: string;
  property_name: string;
  city: string;
  room_bed: string;
  check_in: string;
  rent: number;
  status: "Paid" | "Pending" | "Failed";
}

const INITIAL_BOOKINGS: Booking[] = [
  {
    id: "BKG-001",
    tenant_name: "Kunal Sen",
    property_name: "Greenfield Co-living",
    city: "Bangalore",
    room_bed: "Room 102 - Bed A",
    check_in: "2026-07-01",
    rent: 9500,
    status: "Paid"
  },
  {
    id: "BKG-002",
    tenant_name: "Rohan Das",
    property_name: "Greenfield Co-living",
    city: "Bangalore",
    room_bed: "Room 204 - Bed B",
    check_in: "2026-07-05",
    rent: 9500,
    status: "Pending"
  },
  {
    id: "BKG-003",
    tenant_name: "Shruti Hegde",
    property_name: "Cyber City Haven",
    city: "Hyderabad",
    room_bed: "Room 305 - Bed A",
    check_in: "2026-06-15",
    rent: 11000,
    status: "Paid"
  },
  {
    id: "BKG-004",
    tenant_name: "Aditya Roy",
    property_name: "Heights Residency",
    city: "Mumbai",
    room_bed: "Room 101 - Bed A",
    check_in: "2026-07-10",
    rent: 12500,
    status: "Failed"
  },
  {
    id: "BKG-005",
    tenant_name: "Anjali Gupta",
    property_name: "Orchard Nest Stays",
    city: "Delhi",
    room_bed: "Room 408 - Bed C",
    check_in: "2026-07-01",
    rent: 8000,
    status: "Paid"
  }
];

export default function BookingsRoute() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tenant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.property_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "All" || b.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  return (
    <AdminShell>
      <div className="bookings-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Bookings" }
              ]}
            />
            <h2 className="page-title">Stays Bookings Registry</h2>
            <p className="page-subtitle">Track and audit co-living reservations, tenant payments, and check-in statuses.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Bookings</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Tenant or Property..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="statusFilter">Payment Status</label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
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

        {/* Bookings Data Table */}
        <div className="table-card glass-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Tenant Name</th>
                  <th>Property Location</th>
                  <th>City</th>
                  <th>Room Assigned</th>
                  <th>Check-In Date</th>
                  <th className="text-right">Monthly Rent</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{b.id}</td>
                      <td>
                        <strong className="text-dark">{b.tenant_name}</strong>
                      </td>
                      <td>{b.property_name}</td>
                      <td>{b.city}</td>
                      <td>{b.room_bed}</td>
                      <td className="font-mono text-sm">{b.check_in}</td>
                      <td className="text-right font-mono">₹{b.rent.toLocaleString("en-IN")}</td>
                      <td>
                        <Badge
                          variant={
                            b.status === "Paid"
                              ? "success"
                              : b.status === "Failed"
                              ? "danger"
                              : "warning"
                          }
                        >
                          {b.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty-row">
                      No bookings found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
