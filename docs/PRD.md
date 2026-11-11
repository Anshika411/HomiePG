# HomiePG - Product Requirement Document (PRD)

## 1. Executive Summary
HomiePG is a modern, bed-level PG (Paying Guest) and Co-Living Management Platform designed for three primary audiences:
- **Super Admins**: Platform operators who manage global state, subscription billing for owners, and platform-wide verifications.
- **PG Owners**: Property managers who own buildings, configure floors, rooms, and beds, manage tenants, track payments, monitor expenses, and employ staff.
- **Tenants**: Residents looking for accommodation who search for PGs, book specific beds, complete KYC, pay monthly rent, and raise complaints or check out.

The platform is structured as a monorepo consisting of:
- **apps/backend**: Express.js API server (JavaScript) connecting to Supabase Postgres.
- **apps/marketing-website**: Vite + React.js SPA (JavaScript) for public search and marketing.
- **apps/admin-website**: Vite + React.js SPA (JavaScript) for super-admin dashboard.
- **apps/tenant-app**: React Native with Expo (JavaScript) for resident-facing features.
- **apps/owner-app**: React Native with Expo (JavaScript) for owner-facing operations.
- **apps/admin-app**: React Native with Expo (JavaScript) for super-admin dashboard operations on-the-go.

---

## 2. User Roles & Permissions

| Role | Description | Access Rights |
| :--- | :--- | :--- |
| **Super Admin** | System operator. | Full access to all buildings, owners, verification workflows, global billing, and audit logs. |
| **PG Owner** | Property owner/manager. | Complete control over their own properties (Buildings, Floors, Rooms, Beds), tenant contracts, payments, staff, and expenses. Cannot access other owners' data. |
| **Tenant** | Resident / Applicant. | Read-only access to available properties. Write access to their own bookings, profiles, documents (KYC), and payment receipts. |

---

## 3. Core Features

### 3.1. Bed-Level Inventory Management
Unlike traditional property management software that operates at a room or flat level, HomiePG operates at the **bed level**.
- **Building Hierarchy**: Company -> Owner -> Buildings -> Floors -> Rooms -> Beds.
- **Bed Statuses**: `Available`, `Occupied`, `Reserved`, `Maintenance`.
- **Bed Status History**: Automatical audit trail of every status transition for analytics, vacancy timelines, and audit compliance.

### 3.2. Tenant Onboarding & KYC
- Automated tenant registration and profile completion.
- KYC Document Uploads (Aadhaar, PAN, etc.) stored in secure Supabase Storage Buckets.
- Owner approval workflow for submitted KYC documents.

### 3.3. Booking & Booking Management
- Direct bed-level booking via the Tenant App or Public Website.
- Security deposit/advance payment tracking.
- Status workflow: `Pending` -> `Approved`/`Rejected` -> `Completed` (Move-in) / `Cancelled`.

### 3.4. Rent Payment & Billing
- Automated monthly invoice generation for tenants.
- Payment tracking with transaction IDs, monthly receipts, and status (`Paid`, `Pending`, `Overdue`).
- Secure digital receipts upload/viewing.

### 3.5. Operations & Expense Tracking
- **Expense Log**: Categorized spending (Electricity, Water, Salary, Internet, Repairs, Grocery, Cleaning) tied to specific buildings.
- **Employee Directory**: Keep track of building-specific staff, designation, and salaries.
- **Amenities Configuration**: Map specific amenities (WiFi, Power Backup, Lift, Food, RO Water) to buildings.

---

## 4. Key Workflows & Business Rules

### 4.1. The Check-In / Booking Flow
1. Tenant searches public website and finds a building.
2. Selects floor, room type (AC/Non-AC, sharing capacity), and selects a specific **Available** bed.
3. Submits booking request along with advance deposit.
4. Bed status changes to `Reserved` (or remains `Available` but locked for bookings temporarily).
5. PG Owner reviews tenant profile and KYC.
6. Owner approves booking -> Tenant moves in on `move_in_date`.
7. Tenant status changes to `Active`. Bed status changes to `Occupied`. `bed_status_history` logs the occupancy event.

### 4.2. Monthly Billing Cycle
1. On the 1st of each month, rent invoices are created for all active tenants.
2. Notifications are dispatched to tenants' accounts.
3. Tenant pays via app, inputs transaction ID, and uploads receipt screenshot.
4. PG Owner validates the payment and marks status as `Paid`.

### 4.3. Check-Out / Move-Out Flow
1. Tenant submits move-out request with `expected_leave_date`.
2. Owner inspects room, computes final dues or deposit refunds.
3. Once completed, tenant status changes to `Checked Out`, bed status is reset to `Available` (or `Maintenance` if cleaning is needed), and `actual_leave_date` is logged.

---

## 5. Security & Privacy
- **Row-Level Security (RLS)** is enforced at the database layer (Supabase) to guarantee that PG Owners can only query/mutate their own property data, and tenants can only see their own private information.
- Files uploaded (KYC, receipts) are stored in private Supabase Storage buckets, guarded by corresponding RLS policies.
