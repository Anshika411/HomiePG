# HomiePG - AI-Powered PG Operating System
## Technical Roadmap & Implementation Plan

---

## My Honest Assessment

Your 20-feature roadmap is **strategically brilliant** but needs **ruthless prioritization**. 

The risk with startups is building too many features at 60% quality. My recommendation: build **fewer features at 100% quality** that create **daily habit loops** for the owner.

The golden rule: **"Will the owner open the app every morning?"**

If yes → build it.
If no → defer it.

---

## What's Already Built ✅

| Feature | Status |
|---|---|
| Add Building / Floor / Room / Bed | ✅ Done |
| Owner Login & Auth | ✅ Done |
| Tenant Bookings (Approve/Reject) | ✅ Done |
| KYC Document Verification | ✅ Done |
| Rent Payment Tracking | ✅ Done |
| Room Image Uploads | ✅ Done |
| Collapsible Room Accordion | ✅ Done |
| Room Deletion | ✅ Done |

---

## Phase 1 — Core Daily Habit Loop (Build Next)

These 5 features will make the owner open the app **every single morning**.

---

### 1. Smart Occupancy Dashboard ⭐⭐⭐⭐⭐ [PRIORITY #1]

**What it shows:**
```
Today's Snapshot
Occupancy: 82%          Vacant Beds: 18
Revenue This Month: ₹8.2L    Due Today: ₹48,000

Expected Check-outs: 5 (this week)
New Bookings Today: 3
```

**Technical Implementation:**
- Query aggregation across `buildings → floors → rooms → beds` + `tenants` + `rent_payments`
- New backend endpoint: `GET /api/owner/dashboard-stats`
- Animated circular occupancy ring + sparkline revenue chart
- Uses existing Supabase data — **zero new tables needed**

**Effort**: 3 days

---

### 2. Rent Collection Heatmap ⭐⭐⭐⭐⭐ [PRIORITY #2]

**What it shows:**
```
June 2025 Collection
━━━━━━━━━━━━━━━━━━━━━
1  2  3  4  5  6  7
🟢 🟢 🟡 🔴 🟢 🟢 🟡

🟢 Paid  🟡 Partial  🔴 Pending
```

**Why it matters**: Owners currently have to manually check who paid. This makes it visual and instant.

**Technical Implementation:**
- New `GET /api/owner/rent-heatmap?month=6&year=2025`
- Query `rent_payments` grouped by `due_date` and `status`
- Calendar grid UI component
- **Zero new tables needed**

**Effort**: 2 days

---

### 3. Housekeeping Dashboard ⭐⭐⭐⭐⭐ [PRIORITY #3]

**What it shows:**
```
Room Status Board
━━━━━━━━━━━━━━━━━━━━━
Room 201  🟢 Ready
Room 202  🟡 Cleaning in Progress
Room 203  🔴 Needs Maintenance
Room 204  🔵 Vacant (Ready for Booking)
```

**Technical Implementation:**
- Add `housekeeping_status` column to `rooms` table:
  ```sql
  ALTER TABLE rooms ADD COLUMN housekeeping_status TEXT DEFAULT 'ready';
  -- Values: 'ready' | 'cleaning' | 'maintenance' | 'vacant_ready'
  ```
- New `PATCH /api/buildings/:id/rooms/:roomId/status` endpoint
- Owner can tap → change status inline
- **1 new column, 1 new API**

**Effort**: 2 days

---

### 4. Maintenance Analytics Dashboard ⭐⭐⭐⭐ [PRIORITY #4]

**What it shows:**
```
Recurring Issues (Last 30 Days)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WiFi Issues    ████████████ 22
Cleaning       ██████████  18
Electricity    ██████      12
Water          ████         8
```

**Technical Implementation:**
- Aggregate existing `maintenance_tickets` table by category
- New `GET /api/maintenance/analytics` endpoint
- Bar chart UI (using pure React Native SVG — no libraries)
- **Zero new tables needed** (already have maintenance_tickets)

**Effort**: 2 days

---

### 5. Expense Tracker ⭐⭐⭐⭐ [PRIORITY #5]

**What it shows:**
```
Monthly P&L
━━━━━━━━━━━━━━━━━━
Revenue:     ₹8,24,000
Expenses:   -₹5,62,000
━━━━━━━━━━━━━━━━━━
Profit:       ₹2,13,000 ✅

Breakdown:
Electricity   ₹42,000
Staff Salary  ₹85,000
Food          ₹1,20,000
Maintenance   ₹21,000
```

**Technical Implementation:**
- New table:
  ```sql
  CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES pg_owners(id),
    building_id UUID REFERENCES buildings(id),
    category TEXT, -- 'electricity' | 'salary' | 'food' | 'maintenance' | 'other'
    amount NUMERIC,
    description TEXT,
    expense_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- `POST /api/expenses`, `GET /api/expenses?month=6&year=2025`
- Donut chart + profit auto-calculation

**Effort**: 3 days

---

## Phase 2 — Premium AI Features (After Phase 1 Stabilizes)

### 6. Vacancy Prediction (AI) ⭐⭐⭐⭐⭐

**Approach**: Not a full ML model. Use rule-based prediction which *feels* like AI:
- If tenant submitted notice → predict vacancy on `notice_date + 30 days`
- If rent unpaid for 2 months → flag as "At Risk"
- If lease end date < 30 days → flag as "Likely Vacant"

**No actual ML needed** — smart rules cover 90% of cases.

**Effort**: 2 days

---

### 7. Smart Pricing Suggestions ⭐⭐⭐

**Approach**: Rule-based again:
- Occupancy > 90% → suggest +10% rent
- Occupancy < 60% → suggest -10% rent  
- Festival months (Oct, Dec) → suggest +15% surge

**Effort**: 1 day (pure frontend logic, no new backend)

---

### 8. One-Click Room Allocation ⭐⭐⭐⭐

**Logic**: When owner gets a booking request:
- Match gender ✓
- Match budget (rent ± 15%) ✓
- Match existing roommate profession (from profile) ✓
- Score and rank available rooms
- Show top 3 suggestions

**Effort**: 3 days

---

### 9. Inventory Management ⭐⭐⭐⭐

```sql
CREATE TABLE room_inventory (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES rooms(id),
  item_name TEXT,       -- 'AC', 'Fan', 'Mattress', 'Cupboard'
  status TEXT,          -- 'working' | 'damaged' | 'needs_service'
  last_checked DATE
);
```

Simple CRUD. Owner marks item status. Shows ⚠️ alert for damaged items.

**Effort**: 2 days

---

### 10. AI Business Insights ⭐⭐⭐⭐⭐

Feed data to Gemini API:
```
Prompt: "Occupancy dropped from 90% to 78% in June. 
Top complaints: WiFi (15). Revenue: ₹7.8L vs ₹8.4L last month.
Give 3 specific recommendations."

Response: 
"1. Fix WiFi — it's causing 15 complaints and likely contributing 
   to move-outs. Budget: ₹8,000 for a new router.
2. Offer 5% discount for renewals above 6 months...
3. ..."
```

**Effort**: 2 days (Gemini API integration is straightforward)

---

## Phase 3 — Operations Layer (Later)

| Feature | Effort | Impact |
|---|---|---|
| Staff Management | 1 week | High |
| Visitor QR Dashboard | 3 days | Medium |
| WhatsApp Reminders | 2 days | High |
| Notice/Announcement Push | 2 days | High |
| Resident Rating System | 1 day | Medium |
| Emergency Alert Mode | 1 day | High |
| Bed Timeline History | 3 days | Medium |
| Owner KPI Dashboard | 2 days | High |

---

## Recommended Build Order

```
Week 1:  Smart Occupancy Dashboard + Rent Heatmap
Week 2:  Housekeeping Dashboard + Maintenance Analytics
Week 3:  Expense Tracker
Week 4:  Testing, polish, and user feedback
───────────────────────────────────────────
Week 5:  Vacancy Prediction + Smart Pricing
Week 6:  One-click Room Allocation
Week 7:  Inventory Management
Week 8:  AI Business Insights (Gemini API)
```

---

## My Final Take

> **Homie PG as a "PG Operating System" is the right vision.**

The Indian PG market has zero products that combine:
- Real-time occupancy analytics
- AI-driven insights
- Automated rent collection heatmaps
- Staff and housekeeping management

**MyGate** focuses on society security. **NoBroker** is a listing platform. **Stanza** is their own brand. **Nobody** has built a white-label PG OS for independent PG owners.

That gap is your market.

> [!IMPORTANT]  
> The key differentiator is not AI — it's **daily habit loops**. An owner who opens HomiePG every morning to check occupancy and collections will never switch to a competitor.

