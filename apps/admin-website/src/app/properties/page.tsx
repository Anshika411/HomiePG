"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface Building {
  id: string;
  name: string;
  owner_name: string;
  city: string;
  total_beds: number;
  occupied_beds: number;
  is_verified: boolean;
  latitude: number;
  longitude: number;
  video_url: string;
}

const INITIAL_BUILDINGS: Building[] = [
  {
    id: "BLD-001",
    name: "Greenfield Co-living",
    owner_name: "Amit Sharma",
    city: "Bangalore",
    total_beds: 120,
    occupied_beds: 98,
    is_verified: true,
    latitude: 12.9716,
    longitude: 77.5946,
    video_url: "https://example.com/assets/video1.mp4"
  },
  {
    id: "BLD-002",
    name: "Heights Residency",
    owner_name: "Rahul Verma",
    city: "Mumbai",
    total_beds: 45,
    occupied_beds: 32,
    is_verified: false,
    latitude: 19.0760,
    longitude: 72.8777,
    video_url: "https://example.com/assets/video2.mp4"
  },
  {
    id: "BLD-003",
    name: "Orchard Nest Stays",
    owner_name: "Priya Patel",
    city: "Delhi",
    total_beds: 250,
    occupied_beds: 210,
    is_verified: true,
    latitude: 28.6139,
    longitude: 77.2090,
    video_url: "https://example.com/assets/video3.mp4"
  },
  {
    id: "BLD-004",
    name: "Royal Palms PG",
    owner_name: "Ananya Iyer",
    city: "Chennai",
    total_beds: 80,
    occupied_beds: 45,
    is_verified: false,
    latitude: 13.0827,
    longitude: 80.2707,
    video_url: "https://example.com/assets/video4.mp4"
  },
  {
    id: "BLD-005",
    name: "Cyber City Haven",
    owner_name: "Rajesh Khanna",
    city: "Hyderabad",
    total_beds: 180,
    occupied_beds: 140,
    is_verified: true,
    latitude: 17.3850,
    longitude: 78.4867,
    video_url: "https://example.com/assets/video5.mp4"
  }
];

export default function PropertiesRoute() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>(INITIAL_BUILDINGS);
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("All");

  // Selection states for audit tools
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [auditType, setAuditType] = useState<"gps" | "video" | null>(null);

  const uniqueCities = useMemo(() => {
    const cities = buildings.map((b) => b.city);
    return ["All", ...Array.from(new Set(cities))];
  }, [buildings]);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesSearch =
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.owner_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCity = cityFilter === "All" || b.city === cityFilter;

      return matchesSearch && matchesCity;
    });
  }, [buildings, searchQuery, cityFilter]);

  const handleToggleVerify = (id: string) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_verified: !b.is_verified } : b))
    );
  };

  return (
    <AdminShell>
      <div className="properties-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Properties" }
              ]}
            />
            <h2 className="page-title">Properties Registry</h2>
            <p className="page-subtitle">Global registry of verified buildings, co-living locations, and portfolios.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Buildings</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by ID, Name or Owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="cityFilter">City Location</label>
              <select
                id="cityFilter"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              >
                {uniqueCities.map((city) => (
                  <option key={city} value={city}>
                    {city === "All" ? "All Cities" : city}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn-reset"
              onClick={() => {
                setSearchQuery("");
                setCityFilter("All");
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
                  <th>Building ID</th>
                  <th>Building Name</th>
                  <th>Owner Name</th>
                  <th>City</th>
                  <th className="text-right">Beds Capacity</th>
                  <th className="text-right">Occupied Beds</th>
                  <th>Verification Status</th>
                  <th className="text-center">Audit Audits</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.length > 0 ? (
                  filteredBuildings.map((building) => (
                    <tr key={building.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{building.id}</td>
                      <td>
                        <strong className="text-dark">{building.name}</strong>
                      </td>
                      <td>{building.owner_name}</td>
                      <td>{building.city}</td>
                      <td className="text-right font-mono">{building.total_beds}</td>
                      <td className="text-right font-mono">{building.occupied_beds}</td>
                      <td>
                        <Badge variant={building.is_verified ? "success" : "warning"}>
                          {building.is_verified ? "Verified" : "Pending Audit"}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => {
                              setSelectedBuilding(building);
                              setAuditType("gps");
                            }}
                          >
                            GPS coordinates
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-edit"
                            onClick={() => {
                              setSelectedBuilding(building);
                              setAuditType("video");
                            }}
                          >
                            Video Walkthrough
                          </button>
                          <button
                            type="button"
                            className={`btn-tbl-action ${building.is_verified ? "btn-tbl-suspend" : "btn-tbl-approve"}`}
                            onClick={() => handleToggleVerify(building.id)}
                          >
                            {building.is_verified ? "Revoke" : "Verify"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty-row">
                      No buildings match the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Popups */}
        <Modal
          isOpen={!!selectedBuilding && !!auditType}
          onClose={() => {
            setSelectedBuilding(null);
            setAuditType(null);
          }}
          title={
            auditType === "gps"
              ? `GPS Coordinates Geofencing: ${selectedBuilding?.name}`
              : `Walk-through Video Verification: ${selectedBuilding?.name}`
          }
          size="md"
        >
          {selectedBuilding && auditType === "gps" && (
            <div className="gps-audit-details" style={{ textAlign: "left" }}>
              <div className="info-list" style={{ marginBottom: "1.5rem" }}>
                <div className="info-item">
                  <span className="info-label">Latitude</span>
                  <span className="info-value font-mono">{selectedBuilding.latitude}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Longitude</span>
                  <span className="info-value font-mono">{selectedBuilding.longitude}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Audit Method</span>
                  <span className="info-value text-secondary">Platform Manager Remote Match</span>
                </div>
              </div>
              <div 
                className="gps-map-placeholder" 
                style={{ 
                  height: "200px", 
                  background: "rgba(15, 23, 42, 0.4)", 
                  border: "1px dashed var(--glass-border)", 
                  borderRadius: "10px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <span style={{ fontSize: "2rem" }}>📍</span>
                <span className="text-highlight font-mono" style={{ fontSize: "0.95rem" }}>
                  {selectedBuilding.latitude}, {selectedBuilding.longitude}
                </span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  GPS Coordinates verify geofencing match with physical building address.
                </p>
              </div>
            </div>
          )}

          {selectedBuilding && auditType === "video" && (
            <div className="video-audit-details">
              <div 
                className="video-box-placeholder"
                style={{ 
                  height: "240px", 
                  background: "rgba(15, 23, 42, 0.4)", 
                  border: "1px dashed var(--glass-border)", 
                  borderRadius: "10px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexDirection: "column",
                  gap: "0.5rem",
                  marginBottom: "1.5rem"
                }}
              >
                <span style={{ fontSize: "3.5rem" }}>🎬</span>
                <span className="text-dark font-bold">Property Verification Video</span>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", padding: "0 1.5rem", textAlign: "center" }}>
                  Uploaded walkthrough file: <code>{selectedBuilding.id}_onboarding.mp4</code>. Inspect safety exits and room dimensions.
                </p>
              </div>
              <div className="status-ind-item" style={{ justifyContent: "center" }}>
                <span>Walkthrough Audit State:</span>
                <Badge variant={selectedBuilding.is_verified ? "success" : "warning"}>
                  {selectedBuilding.is_verified ? "Approved" : "Awaiting Remote Approval"}
                </Badge>
              </div>
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
            <button
              className="btn-primary"
              onClick={() => {
                setSelectedBuilding(null);
                setAuditType(null);
              }}
            >
              Close Audit Panel
            </button>
          </div>
        </Modal>
      </div>
    </AdminShell>
  );
}
