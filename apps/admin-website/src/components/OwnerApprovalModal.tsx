"use client";

import React, { useState, useEffect } from "react";
import { Owner } from "./OwnerForm";
import Modal from "./Modal";

interface OwnerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: Owner | null;
  onConfirmApprove: (id: string, remarks: string) => void;
  onConfirmReject: (id: string, remarks: string) => void;
}

export default function OwnerApprovalModal({
  isOpen,
  onClose,
  owner,
  onConfirmApprove,
  onConfirmReject
}: OwnerApprovalModalProps) {
  const [remarks, setRemarks] = useState("");
  const [checklist, setChecklist] = useState({
    aadhaar: true,
    pan: true,
    mobile: true,
    email: true,
    propertyDocs: true
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state when opening modal for a new owner
  useEffect(() => {
    if (owner) {
      setRemarks("");
      setChecklist({
        aadhaar: true,
        pan: true,
        mobile: true,
        email: true,
        propertyDocs: true
      });
      setErrorMsg(null);
    }
  }, [owner, isOpen]);

  if (!owner) return null;

  const handleCheckboxChange = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    setErrorMsg(null);
  };

  const handleApproveClick = () => {
    // Audit check: All items must be checked to approve
    const allChecked = Object.values(checklist).every((val) => val === true);
    if (!allChecked) {
      setErrorMsg("Verification Fail: All items in the checklist must be verified before approving.");
      return;
    }
    onConfirmApprove(owner.id, remarks);
    onClose();
  };

  const handleRejectClick = () => {
    if (!remarks.trim()) {
      setErrorMsg("Verification Fail: Remarks are required to explain the audit rejection.");
      return;
    }
    onConfirmReject(owner.id, remarks);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Owner Onboarding Audit: ${owner.full_name}`}
      size="md"
    >
      <div className="approval-workflow-container">
        {/* Owner Details Card Summary */}
        <div className="audit-details-card">
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">Owner Name</span>
            <span className="audit-detail-val font-bold">{owner.full_name}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">Owner ID</span>
            <span className="audit-detail-val font-mono">{owner.id}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">Mobile Number</span>
            <span className="audit-detail-val font-mono">{owner.mobile}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">Email Address</span>
            <span className="audit-detail-val">{owner.email}</span>
          </div>
          <div className="audit-detail-row">
            <span className="audit-detail-lbl">City Operations</span>
            <span className="audit-detail-val">{owner.city}</span>
          </div>
        </div>

        {/* Verification Checklist */}
        <div className="audit-section">
          <h5 className="audit-section-title">Remote Verification Checklist</h5>
          <p className="audit-section-desc">
            Ensure all uploaded legal credentials and metadata logs match the owner registry before approval.
          </p>

          <div className="checklist-list">
            <label className="checklist-item-row">
              <input 
                type="checkbox" 
                checked={checklist.aadhaar} 
                onChange={() => handleCheckboxChange("aadhaar")} 
              />
              <span className="checklist-custom-box" />
              <span className="checklist-lbl">Aadhaar Card Uploaded & Verified</span>
            </label>

            <label className="checklist-item-row">
              <input 
                type="checkbox" 
                checked={checklist.pan} 
                onChange={() => handleCheckboxChange("pan")} 
              />
              <span className="checklist-custom-box" />
              <span className="checklist-lbl">PAN Card Uploaded & Verified</span>
            </label>

            <label className="checklist-item-row">
              <input 
                type="checkbox" 
                checked={checklist.mobile} 
                onChange={() => handleCheckboxChange("mobile")} 
              />
              <span className="checklist-custom-box" />
              <span className="checklist-lbl">Mobile OTP Audited & Verified</span>
            </label>

            <label className="checklist-item-row">
              <input 
                type="checkbox" 
                checked={checklist.email} 
                onChange={() => handleCheckboxChange("email")} 
              />
              <span className="checklist-custom-box" />
              <span className="checklist-lbl">Email Address Audited & Verified</span>
            </label>

            <label className="checklist-item-row">
              <input 
                type="checkbox" 
                checked={checklist.propertyDocs} 
                onChange={() => handleCheckboxChange("propertyDocs")} 
              />
              <span className="checklist-custom-box" />
              <span className="checklist-lbl">Property Registry & GST Documents Verified</span>
            </label>
          </div>
        </div>

        {/* Remarks Section */}
        <div className="audit-section">
          <label htmlFor="audit-remarks-field" className="audit-section-title block-lbl">
            Audit Remarks & Notes
          </label>
          <textarea
            id="audit-remarks-field"
            className="audit-remarks-input"
            rows={3}
            placeholder="Type verification notes here... (Required for Rejections)"
            value={remarks}
            onChange={(e) => {
              setRemarks(e.target.value);
              setErrorMsg(null);
            }}
          />
        </div>

        {/* Error Messaging */}
        {errorMsg && (
          <div className="audit-error-banner">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{errorMsg}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="audit-modal-footer">
          <button 
            type="button" 
            className="btn-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          
          <button 
            type="button" 
            className="btn-tbl-action btn-tbl-delete" 
            onClick={handleRejectClick}
          >
            Reject Owner
          </button>

          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleApproveClick}
          >
            Confirm Approve
          </button>
        </div>
      </div>
    </Modal>
  );
}
