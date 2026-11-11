# HomiePG - User Flows & Journeys

This document models the primary pathways for both Tenants and PG Owners through the HomiePG ecosystem.

---

## 1. Tenant User Journey

```mermaid
graph TD
    A[Public Marketing Website] -->|Search & Filter PGs| B(View PG Details, Rooms & Beds)
    B -->|Select Bed & Click Reserve| C{Auth State}
    C -->|Not Logged In| D[Sign Up / Login with OTP]
    C -->|Logged In| E[Book Bed & Pay Deposit]
    D --> E
    E -->|Upload KYC Documents| F[Booking Status: Pending]
    F -->|Owner Reviews & Approves| G[Booking Status: Approved]
    G -->|Move-in Date Arrives| H[Status: Active Tenant / Bed: Occupied]
    H -->|1st of Month| I[Receive Rent Invoice]
    I -->|Pay Rent & Upload Receipt| J[Rent Marked Paid]
    H -->|Wants to leave| K[Submit Notice Period Request]
    K -->|Owner reconciles & checks out| L[Status: Checked Out / Bed: Available]
```

### 1.1. Detailed Steps (Tenant)
1. **Search & Select**: Tenant visits the portal, filters by City, Gender Type (Boys/Girls/Unisex), budget, and room criteria (AC, Attached Bathroom).
2. **Reservation**: Sees a visual room/bed layout. Selects an "Available" bed, fills out profile data, pays the security deposit/booking advance.
3. **KYC Submission**: Uploads ID proofs (Aadhaar/PAN).
4. **Residency**: Once approved, tenant checks in. Receives automated mobile/in-app notifications for rent invoices, logs complaints, views roommate list.
5. **Check-out**: Submits expected leave date. Once cleared, system logs the checkout, updates bed history, and processes deposit return.

---

## 2. PG Owner User Journey

```mermaid
graph TD
    A[Sign Up / Register Owner Profile] --> B[Configure Company Details & GST]
    B --> C[Add Buildings]
    C --> D[Add Floors, Rooms & Beds]
    D --> E[Add Staff & Monthly Salaries]
    F[Incoming Booking Request] -->|Review KYC & Profile| G{Approve Booking?}
    G -->|No| H[Reject / Refund Advance]
    G -->|Yes| I[Approve Booking & Assign Tenant]
    I --> J[Monitor Room Occupancy]
    J -->|Log Monthly Rent Received| K[Financial Dashboard]
    J -->|Log Expenses: Internet, Grocery, Cleaning| K
```

### 2.1. Detailed Steps (Owner)
1. **Onboarding**: Owner registers, enters company details, PAN/GST numbers for verified billing.
2. **Setup Property**: Configures building profile, maps, layouts. Adds rooms, sets prices, and specifies individual beds. Maps amenities.
3. **Tenant Approval**: Receives notification of booking. Reviews the applicant's name, mobile number, and uploaded KYC documents. Approves/rejects the booking.
4. **Operations**:
   - Logs staff members (e.g. wardens, cleaners) and salaries.
   - Logs monthly bills (electricity, water, maintenance) as Expenses.
   - Reconciles tenant rent payments (marks UPI/Cash entries as Paid).
   - Monitors live occupancy rate analytics.
