"use client";

import React, { useState, useMemo } from "react";
import AdminShell from "../../components/AdminShell";
import Breadcrumb from "../../components/Breadcrumb";
import Badge from "../../components/Badge";
import Modal from "../../components/Modal";
import { useRouter } from "next/navigation";

interface BedInventory {
  id: string;
  property_name: string;
  room_number: string;
  sharing_type: "Single" | "Double" | "3-Sharing";
  base_rent: number;
  occupancy_status: "Occupied" | "Vacant";
  maintenance_status: "Clean" | "Under Maintenance";
}

const INITIAL_INVENTORY: BedInventory[] = [
  {
    id: "BED-001A",
    property_name: "Greenfield Co-living",
    room_number: "102",
    sharing_type: "Double",
    base_rent: 9500,
    occupancy_status: "Occupied",
    maintenance_status: "Clean"
  },
  {
    id: "BED-001B",
    property_name: "Greenfield Co-living",
    room_number: "102",
    sharing_type: "Double",
    base_rent: 9500,
    occupancy_status: "Vacant",
    maintenance_status: "Clean"
  },
  {
    id: "BED-002A",
    property_name: "Heights Residency",
    room_number: "101",
    sharing_type: "Single",
    base_rent: 12500,
    occupancy_status: "Occupied",
    maintenance_status: "Clean"
  },
  {
    id: "BED-003A",
    property_name: "Cyber City Haven",
    room_number: "305",
    sharing_type: "Double",
    base_rent: 11000,
    occupancy_status: "Occupied",
    maintenance_status: "Under Maintenance"
  },
  {
    id: "BED-004A",
    property_name: "Orchard Nest Stays",
    room_number: "408",
    sharing_type: "3-Sharing",
    base_rent: 8000,
    occupancy_status: "Vacant",
    maintenance_status: "Clean"
  }
];

export default function InventoryRoute() {
  const router = useRouter();
  const [inventory, setInventory] = useState<BedInventory[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState("");
  const [occupancyFilter, setOccupancyFilter] = useState("All");
  const [sharingFilter, setSharingFilter] = useState("All");

  const [selectedBed, setSelectedBed] = useState<BedInventory | null>(null);
  const [newRent, setNewRent] = useState(0);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch =
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.room_number.includes(searchQuery);

      const matchesOccupancy = occupancyFilter === "All" || item.occupancy_status === occupancyFilter;
      const matchesSharing = sharingFilter === "All" || item.sharing_type === sharingFilter;

      return matchesSearch && matchesOccupancy && matchesSharing;
    });
  }, [inventory, searchQuery, occupancyFilter, sharingFilter]);

  const handleToggleMaintenance = (id: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              maintenance_status:
                item.maintenance_status === "Clean" ? "Under Maintenance" : "Clean"
            }
          : item
      )
    );
  };

  const handleAdjustRentClick = (item: BedInventory) => {
    setSelectedBed(item);
    setNewRent(item.base_rent);
  };

  const handleAdjustRentSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBed) {
      setInventory((prev) =>
        prev.map((item) => (item.id === selectedBed.id ? { ...item, base_rent: newRent } : item))
      );
      setSelectedBed(null);
    }
  };

  return (
    <AdminShell>
      <div className="inventory-page">
        {/* Header Section */}
        <div className="page-header-row">
          <div className="breadcrumb-and-title">
            <Breadcrumb
              items={[
                { label: "Dashboard", onClick: () => router.push("/") },
                { label: "Room Inventory" }
              ]}
            />
            <h2 className="page-title">Room & Bed Inventory</h2>
            <p className="page-subtitle">Inspect co-living room allocations, vacant beds listings, sharing setups, and maintenance states.</p>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-card glass-panel">
          <div className="search-group">
            <label htmlFor="search">Search Beds</label>
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                id="search"
                type="text"
                placeholder="Search by Bed ID, Building or Room..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="occupancyFilter">Occupancy Status</label>
              <select
                id="occupancyFilter"
                value={occupancyFilter}
                onChange={(e) => setOccupancyFilter(e.target.value)}
              >
                <option value="All">All Beds</option>
                <option value="Occupied">Occupied</option>
                <option value="Vacant">Vacant</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="sharingFilter">Room Type</label>
              <select
                id="sharingFilter"
                value={sharingFilter}
                onChange={(e) => setSharingFilter(e.target.value)}
              >
                <option value="All">All Types</option>
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="3-Sharing">3-Sharing</option>
              </select>
            </div>
            <button
              className="btn-reset"
              onClick={() => {
                setSearchQuery("");
                setOccupancyFilter("All");
                setSharingFilter("All");
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
                  <th>Bed ID</th>
                  <th>Property Location</th>
                  <th>Room Number</th>
                  <th>Sharing Style</th>
                  <th className="text-right">Monthly Base Rent</th>
                  <th>Occupancy Status</th>
                  <th>Maintenance Status</th>
                  <th className="text-center">Action Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="font-mono text-sm text-highlight">{item.id}</td>
                      <td>
                        <strong className="text-dark">{item.property_name}</strong>
                      </td>
                      <td className="font-mono">{item.room_number}</td>
                      <td>{item.sharing_type}</td>
                      <td className="text-right font-mono">₹{item.base_rent.toLocaleString("en-IN")}</td>
                      <td>
                        <Badge variant={item.occupancy_status === "Occupied" ? "success" : "warning"}>
                          {item.occupancy_status}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={item.maintenance_status === "Clean" ? "success" : "danger"}>
                          {item.maintenance_status}
                        </Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-view"
                            onClick={() => handleToggleMaintenance(item.id)}
                          >
                            Toggle Lock
                          </button>
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-edit"
                            onClick={() => handleAdjustRentClick(item)}
                          >
                            Edit Rent
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="table-empty-row">
                      No room beds matching query filters found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rent Adjust Modal */}
        <Modal
          isOpen={!!selectedBed}
          onClose={() => setSelectedBed(null)}
          title={`Adjust Bed Rent: ${selectedBed?.id}`}
          size="sm"
        >
          {selectedBed && (
            <form onSubmit={handleAdjustRentSave} className="owner-form">
              <div className="form-group" style={{ textAlign: "left" }}>
                <label htmlFor="bedRent">Base Monthly Rate (₹)</label>
                <input
                  id="bedRent"
                  type="number"
                  value={newRent}
                  onChange={(e) => setNewRent(parseInt(e.target.value, 10))}
                  required
                  min="0"
                />
              </div>
              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button type="button" className="btn-cancel" onClick={() => setSelectedBed(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Rent Rate
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </AdminShell>
  );
}
