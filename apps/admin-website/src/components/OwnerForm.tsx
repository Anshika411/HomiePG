import React, { useState, useEffect } from "react";

export interface Owner {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  city: string;
  total_buildings: number;
  total_beds: number;
  occupied_beds: number;
  is_verified: boolean;
  status: "Active" | "Pending" | "Suspended";
  created_at: string;
}

interface OwnerFormProps {
  owner?: Owner | null;
  onSubmit: (ownerData: any) => void;
  onCancel: () => void;
}

const CITIES = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Pune", "Chennai", "Kolkata", "Noida", "Gurugram"];

export default function OwnerForm({ owner, onSubmit, onCancel }: OwnerFormProps) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    mobile: "",
    city: "Bangalore",
    total_buildings: 0,
    total_beds: 0,
    occupied_beds: 0,
    is_verified: false,
    status: "Pending" as "Active" | "Pending" | "Suspended",
    created_at: new Date().toISOString().split("T")[0]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (owner) {
      setFormData({
        full_name: owner.full_name,
        email: owner.email,
        mobile: owner.mobile,
        city: owner.city,
        total_buildings: owner.total_buildings,
        total_beds: owner.total_beds,
        occupied_beds: owner.occupied_beds,
        is_verified: owner.is_verified,
        status: owner.status,
        created_at: owner.created_at.split("T")[0]
      });
    }
  }, [owner]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    
    if (type === "number") {
      finalValue = value === "" ? 0 : parseInt(value, 10);
    } else if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue
    }));

    // Clear error
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name.trim()) newErrors.full_name = "Full Name is required";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email Address is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    const mobileRegex = /^[+]?[0-9\s-]{10,15}$/;
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile Number is required";
    } else if (!mobileRegex.test(formData.mobile)) {
      newErrors.mobile = "Invalid mobile number format (e.g. +91 9876543210)";
    }

    if (formData.total_buildings < 0) {
      newErrors.total_buildings = "Cannot be negative";
    }

    if (formData.total_beds < 0) {
      newErrors.total_beds = "Cannot be negative";
    }

    if (formData.occupied_beds < 0) {
      newErrors.occupied_beds = "Cannot be negative";
    }

    if (formData.occupied_beds > formData.total_beds) {
      newErrors.occupied_beds = "Occupied beds cannot exceed total beds";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="owner-form">
      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="full_name">Owner Full Name *</label>
          <input
            id="full_name"
            type="text"
            name="full_name"
            placeholder="e.g. Amit Sharma"
            value={formData.full_name}
            onChange={handleChange}
            className={errors.full_name ? "input-error" : ""}
          />
          {errors.full_name && <span className="error-text">{errors.full_name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="e.g. amit.sharma@example.com"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="mobile">Mobile Number *</label>
          <input
            id="mobile"
            type="text"
            name="mobile"
            placeholder="e.g. +91 98765 43210"
            value={formData.mobile}
            onChange={handleChange}
            className={errors.mobile ? "input-error" : ""}
          />
          {errors.mobile && <span className="error-text">{errors.mobile}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="city">Operating City *</label>
          <select id="city" name="city" value={formData.city} onChange={handleChange}>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="created_at">Registration Date *</label>
          <input
            id="created_at"
            type="date"
            name="created_at"
            value={formData.created_at}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="total_buildings">Total Buildings</label>
          <input
            id="total_buildings"
            type="number"
            name="total_buildings"
            min="0"
            value={formData.total_buildings}
            onChange={handleChange}
            className={errors.total_buildings ? "input-error" : ""}
          />
          {errors.total_buildings && <span className="error-text">{errors.total_buildings}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="total_beds">Total Beds</label>
          <input
            id="total_beds"
            type="number"
            name="total_beds"
            min="0"
            value={formData.total_beds}
            onChange={handleChange}
            className={errors.total_beds ? "input-error" : ""}
          />
          {errors.total_beds && <span className="error-text">{errors.total_beds}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="occupied_beds">Occupied Beds</label>
          <input
            id="occupied_beds"
            type="number"
            name="occupied_beds"
            min="0"
            value={formData.occupied_beds}
            onChange={handleChange}
            className={errors.occupied_beds ? "input-error" : ""}
          />
          {errors.occupied_beds && <span className="error-text">{errors.occupied_beds}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="status">Account Status *</label>
          <select id="status" name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>

        <div className="form-group full-width checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_verified"
              checked={formData.is_verified}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_verified: e.target.checked }))
              }
            />
            <span>Mark PG Owner as verified (KYC & Documents Approved)</span>
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          {owner ? "Save Changes" : "Add PG Owner"}
        </button>
      </div>
    </form>
  );
}
