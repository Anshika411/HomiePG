import React, { useState, useMemo } from "react";
import Breadcrumb from "./Breadcrumb";
import Badge from "./Badge";
import Modal from "./Modal";
import OwnerForm, { Owner } from "./OwnerForm";
import OwnerDetailsDrawer from "./OwnerDetailsDrawer";
import OwnerApprovalModal from "./OwnerApprovalModal";

// Initial Seed Data for the Dashboard Demonstration
const INITIAL_OWNERS: Owner[] = [
  {
    id: "OWN-2026-001",
    full_name: "Amit Sharma",
    email: "amit.sharma@homiepg.co",
    mobile: "+91 98765 43210",
    city: "Bangalore",
    total_buildings: 3,
    total_beds: 120,
    occupied_beds: 98,
    is_verified: true,
    status: "Active",
    created_at: "2026-01-15"
  },
  {
    id: "OWN-2026-002",
    full_name: "Rahul Verma",
    email: "rahul.v@homiepg.co",
    mobile: "+91 87654 32109",
    city: "Mumbai",
    total_buildings: 1,
    total_beds: 45,
    occupied_beds: 32,
    is_verified: false,
    status: "Pending",
    created_at: "2026-03-22"
  },
  {
    id: "OWN-2026-003",
    full_name: "Priya Patel",
    email: "priya.patel@homiepg.co",
    mobile: "+91 76543 21098",
    city: "Delhi",
    total_buildings: 5,
    total_beds: 250,
    occupied_beds: 210,
    is_verified: true,
    status: "Active",
    created_at: "2026-02-10"
  },
  {
    id: "OWN-2026-004",
    full_name: "Ananya Iyer",
    email: "ananya.iyer@homiepg.co",
    mobile: "+91 65432 10987",
    city: "Chennai",
    total_buildings: 2,
    total_beds: 80,
    occupied_beds: 45,
    is_verified: false,
    status: "Pending",
    created_at: "2026-05-18"
  },
  {
    id: "OWN-2026-005",
    full_name: "Rajesh Khanna",
    email: "rajesh.khanna@homiepg.co",
    mobile: "+91 91234 56789",
    city: "Hyderabad",
    total_buildings: 4,
    total_beds: 180,
    occupied_beds: 140,
    is_verified: true,
    status: "Active",
    created_at: "2026-04-05"
  },
  {
    id: "OWN-2026-006",
    full_name: "Sneha Reddy",
    email: "sneha.reddy@homiepg.co",
    mobile: "+91 98123 45678",
    city: "Hyderabad",
    total_buildings: 0,
    total_beds: 0,
    occupied_beds: 0,
    is_verified: false,
    status: "Pending",
    created_at: "2026-07-01"
  },
  {
    id: "OWN-2026-007",
    full_name: "Vikram Singh",
    email: "vikram.s@homiepg.co",
    mobile: "+91 88776 65544",
    city: "Pune",
    total_buildings: 2,
    total_beds: 90,
    occupied_beds: 88,
    is_verified: true,
    status: "Suspended",
    created_at: "2026-03-01"
  },
  {
    id: "OWN-2026-008",
    full_name: "Neha Gupta",
    email: "neha.gupta@homiepg.co",
    mobile: "+91 77665 54433",
    city: "Noida",
    total_buildings: 3,
    total_beds: 110,
    occupied_beds: 95,
    is_verified: true,
    status: "Active",
    created_at: "2026-06-11"
  },
  {
    id: "OWN-2026-009",
    full_name: "Arjun Mehta",
    email: "arjun.m@homiepg.co",
    mobile: "+91 99001 12233",
    city: "Bangalore",
    total_buildings: 6,
    total_beds: 300,
    occupied_beds: 245,
    is_verified: true,
    status: "Active",
    created_at: "2026-02-28"
  },
  {
    id: "OWN-2026-010",
    full_name: "Siddharth Rao",
    email: "sid.rao@homiepg.co",
    mobile: "+91 88990 01122",
    city: "Pune",
    total_buildings: 1,
    total_beds: 50,
    occupied_beds: 0,
    is_verified: false,
    status: "Pending",
    created_at: "2026-07-10"
  },
  {
    id: "OWN-2026-011",
    full_name: "Karan Johar",
    email: "karan.j@homiepg.co",
    mobile: "+91 77889 90011",
    city: "Mumbai",
    total_buildings: 4,
    total_beds: 160,
    occupied_beds: 130,
    is_verified: true,
    status: "Active",
    created_at: "2026-05-02"
  },
  {
    id: "OWN-2026-012",
    full_name: "Meera Nair",
    email: "meera.nair@homiepg.co",
    mobile: "+91 66778 89900",
    city: "Chennai",
    total_buildings: 2,
    total_beds: 75,
    occupied_beds: 70,
    is_verified: true,
    status: "Active",
    created_at: "2026-04-12"
  }
];

export default function OwnersPage({ onGoBack }: { onGoBack: () => void }) {
  const [owners, setOwners] = useState<Owner[]>(INITIAL_OWNERS);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [verificationFilter, setVerificationFilter] = useState("All");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [ownerToApprove, setOwnerToApprove] = useState<Owner | null>(null);
  
  const [viewingOwnerId, setViewingOwnerId] = useState<string | null>(null);

  const currentViewingOwner = useMemo(() => {
    return owners.find((o) => o.id === viewingOwnerId) || null;
  }, [owners, viewingOwnerId]);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract cities from dataset for filter select options dynamically
  const uniqueCities = useMemo(() => {
    const cities = owners.map(o => o.city);
    return ["All", ...Array.from(new Set(cities))].sort();
  }, [owners]);

  // Filter & Search Logic
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const matchesSearch = 
        owner.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        owner.mobile.includes(searchQuery);

      const matchesStatus = statusFilter === "All" || owner.status === statusFilter;
      const matchesCity = cityFilter === "All" || owner.city === cityFilter;
      
      let matchesVerification = true;
      if (verificationFilter === "Verified") {
        matchesVerification = owner.is_verified;
      } else if (verificationFilter === "Pending Verification") {
        matchesVerification = !owner.is_verified;
      }

      return matchesSearch && matchesStatus && matchesCity && matchesVerification;
    });
  }, [owners, searchQuery, statusFilter, cityFilter, verificationFilter]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, cityFilter, verificationFilter, itemsPerPage]);

  // Paginated display subset
  const totalPages = Math.max(1, Math.ceil(filteredOwners.length / itemsPerPage));
  const displayedOwners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOwners.slice(start, start + itemsPerPage);
  }, [filteredOwners, currentPage, itemsPerPage]);

  // Handle Add/Edit Form submission
  const handleFormSubmit = (data: Omit<Owner, "id">) => {
    if (editingOwner) {
      // Edit mode
      setOwners((prev) =>
        prev.map((o) => (o.id === editingOwner.id ? { ...o, ...data } : o))
      );
      setEditingOwner(null);
    } else {
      // Create mode
      const serial = owners.length + 1;
      const newId = `OWN-2026-${String(serial).padStart(3, "0")}`;
      const newOwner: Owner = {
        id: newId,
        ...data
      };
      setOwners((prev) => [newOwner, ...prev]);
    }
    setIsFormOpen(false);
  };

  // Trigger Onboarding Approval Workflow
  const handleApprove = (id: string) => {
    const owner = owners.find((o) => o.id === id) || null;
    setOwnerToApprove(owner);
  };

  // Confirmation Action: Approve
  const handleConfirmApprove = (id: string, remarks: string) => {
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_verified: true, status: "Active" } : o))
    );
    console.log(`Approved Owner ${id} with remarks: ${remarks}`);
  };

  // Confirmation Action: Reject (from Audit Modal)
  const handleConfirmReject = (id: string, remarks: string) => {
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_verified: false, status: "Suspended" } : o))
    );
    console.log(`Rejected Owner ${id} with remarks: ${remarks}`);
  };

  // Quick Action: Suspend
  const handleSuspend = (id: string) => {
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Suspended" } : o))
    );
  };

  // Quick Action: Reject
  const handleReject = (id: string) => {
    setOwners((prev) =>
      prev.map((o) => (o.id === id ? { ...o, is_verified: false, status: "Suspended" } : o))
    );
  };

  // Confirm and Execute Delete
  const handleDelete = () => {
    if (deleteConfirmId) {
      setOwners((prev) => prev.filter((o) => o.id !== deleteConfirmId));
      setDeleteConfirmId(null);
      // Adjust current page if last item of page was deleted
      if (displayedOwners.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCityFilter("All");
    setVerificationFilter("All");
  };

  return (
    <div className="owners-page">
      {/* Breadcrumbs & Title header */}
      <div className="page-header-row">
        <div className="breadcrumb-and-title">
          <Breadcrumb 
            items={[
              { label: "Dashboard", onClick: onGoBack },
              { label: "PG Owners" }
            ]} 
          />
          <h2 className="page-title">PG Owners Management</h2>
          <p className="page-subtitle">Manage the co-living operators, portfolios, account statuses, and KYC audits.</p>
        </div>
        <button 
          className="btn-primary btn-add-owner" 
          onClick={() => {
            setEditingOwner(null);
            setIsFormOpen(true);
          }}
        >
          <span className="btn-icon">+</span> Add Owner
        </button>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="filter-card glass-panel">
        <div className="search-group">
          <label htmlFor="search">Search Owners</label>
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              id="search"
              type="text"
              placeholder="Search by Name, ID, Email, Phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label htmlFor="statusFilter">Account Status</label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="cityFilter">City</label>
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

          <div className="filter-group">
            <label htmlFor="verificationFilter">KYC Status</label>
            <select
              id="verificationFilter"
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
            >
              <option value="All">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Pending Verification">Pending Verification</option>
            </select>
          </div>

          <button className="btn-reset" onClick={handleResetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="table-card glass-panel">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Owner ID</th>
                <th>Owner Name</th>
                <th>Mobile Number</th>
                <th>Email</th>
                <th>City</th>
                <th className="text-right">Buildings</th>
                <th className="text-right">Beds</th>
                <th className="text-right">Occupied</th>
                <th>Verification</th>
                <th>Account Status</th>
                <th>Reg. Date</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedOwners.length > 0 ? (
                displayedOwners.map((owner) => (
                  <tr key={owner.id} className="table-row-hover">
                    <td className="font-mono text-sm text-highlight">{owner.id}</td>
                    <td>
                      <strong className="text-dark">{owner.full_name}</strong>
                    </td>
                    <td className="text-sm font-mono">{owner.mobile}</td>
                    <td className="text-sm">{owner.email}</td>
                    <td>{owner.city}</td>
                    <td className="text-right font-mono">{owner.total_buildings}</td>
                    <td className="text-right font-mono">{owner.total_beds}</td>
                    <td className="text-right font-mono">
                      <span className={owner.occupied_beds === owner.total_beds && owner.total_beds > 0 ? "text-danger" : ""}>
                        {owner.occupied_beds}
                      </span>
                    </td>
                    <td>
                      <Badge variant={owner.is_verified ? "success" : "warning"}>
                        {owner.is_verified ? "Verified" : "Pending"}
                      </Badge>
                    </td>
                    <td>
                      <Badge variant={owner.status === "Active" ? "success" : owner.status === "Pending" ? "warning" : "danger"}>
                        {owner.status}
                      </Badge>
                    </td>
                    <td className="text-sm text-muted font-mono">{owner.created_at}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-tbl-action btn-tbl-view"
                          title="View Portfolio"
                           onClick={() => {
                            setViewingOwnerId(owner.id);
                          }}
                        >
                          View
                        </button>
                        
                        <button
                          type="button"
                          className="btn-tbl-action btn-tbl-edit"
                          title="Edit Details"
                          onClick={() => {
                            setEditingOwner(owner);
                            setIsFormOpen(true);
                          }}
                        >
                          Edit
                        </button>

                        {!owner.is_verified && (
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-approve"
                            title="Verify & Approve Owner"
                            onClick={() => handleApprove(owner.id)}
                          >
                            Approve
                          </button>
                        )}

                        {owner.status !== "Suspended" && (
                          <button
                            type="button"
                            className="btn-tbl-action btn-tbl-suspend"
                            title="Suspend Account"
                            onClick={() => handleSuspend(owner.id)}
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn-tbl-action btn-tbl-delete"
                          title="Delete Owner"
                          onClick={() => setDeleteConfirmId(owner.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="table-empty-row">
                    No PG Owners match the selected search criteria and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="pagination-info">
            Showing <strong className="text-dark">{filteredOwners.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{" "}
            <strong className="text-dark">
              {Math.min(currentPage * itemsPerPage, filteredOwners.length)}
            </strong>{" "}
            of <strong className="text-dark">{filteredOwners.length}</strong> owners
            
            <div className="items-per-page-selector">
              <span className="text-muted">Show:</span>
              <select 
                value={itemsPerPage} 
                onChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={15}>15 per page</option>
              </select>
            </div>
          </div>

          <div className="pagination-buttons">
            <button
              type="button"
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`btn-page btn-page-num ${page === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="btn-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingOwner ? "Modify PG Owner Account" : "Onboard New PG Owner"}
        size="lg"
      >
        <OwnerForm
          owner={editingOwner}
          onSubmit={handleFormSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* View Portfolio Dashboard Drawer */}
      <OwnerDetailsDrawer
        owner={currentViewingOwner}
        isOpen={!!viewingOwnerId}
        onClose={() => setViewingOwnerId(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onSuspend={handleSuspend}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="confirm-modal-body">
          <span className="warning-icon">⚠️</span>
          <h4>Are you absolutely sure?</h4>
          <p>
            You are about to delete the PG Owner account: <strong className="text-highlight">{deleteConfirmId}</strong>.
            This action is irreversible and will remove all associated portfolio mappings from the database.
          </p>
          <div className="confirm-modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </button>
            <button type="button" className="btn-danger-confirm" onClick={handleDelete}>
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Onboarding Verification Checklist Audit Modal */}
      <OwnerApprovalModal
        isOpen={!!ownerToApprove}
        onClose={() => setOwnerToApprove(null)}
        owner={ownerToApprove}
        onConfirmApprove={handleConfirmApprove}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
}
