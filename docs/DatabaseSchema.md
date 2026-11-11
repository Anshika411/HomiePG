# HomiePG - Database Schema Specification

This document outlines the Postgres database tables, types, relationships, and Row-Level Security (RLS) policies implemented in Supabase.

---

## 1. Custom Types & Enums

### 1.1. `user_role`
- `super_admin`
- `pg_owner`
- `tenant`

### 1.2. `bed_status`
- `Available`
- `Occupied`
- `Reserved`
- `Maintenance`

### 1.3. `booking_status`
- `Pending`
- `Approved`
- `Rejected`
- `Cancelled`
- `Completed`

### 1.4. `expense_category`
- `Electricity`
- `Water`
- `Salary`
- `Internet`
- `Repairs`
- `Grocery`
- `Cleaning`

---

## 2. Table Schemas

### 2.1. `profiles`
Holds general profile information. Placed in the public schema, synchronized with Supabase Auth users.
- `id` (UUID, Primary Key, references auth.users)
- `role` (user_role, default 'tenant')
- `name` (text, not null)
- `email` (text, unique, not null)
- `mobile` (text, unique)
- `photo` (text, optional URL)
- `status` (text, default 'active')
- `created_at` (timestamp with time zone, default now())

### 2.2. `pg_owners`
Properties belonging to owners.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `profile_id` (UUID, unique, references profiles(id) ON DELETE CASCADE)
- `company_name` (text)
- `gst_number` (text)
- `pan_number` (text)
- `aadhaar` (text)
- `verification_status` (text, default 'pending')
- `subscription_plan` (text, default 'free')
- `created_at` (timestamp with time zone, default now())

### 2.3. `buildings`
PG property locations.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `owner_id` (UUID, references pg_owners(id) ON DELETE CASCADE)
- `building_name` (text, not null)
- `address` (text, not null)
- `latitude` (numeric)
- `longitude` (numeric)
- `city` (text, not null)
- `state` (text, not null)
- `pincode` (text, not null)
- `gender_type` (text, not null) -- 'Men', 'Women', 'Unisex'
- `description` (text)
- `security_deposit` (numeric, default 0)
- `monthly_rent_starting` (numeric, default 0)
- `created_at` (timestamp with time zone, default now())

### 2.4. `floors`
Floors in each building.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `floor_number` (integer, not null)
- `floor_name` (text, not null)

### 2.5. `rooms`
Rooms on each floor.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `floor_id` (UUID, references floors(id) ON DELETE CASCADE)
- `room_number` (text, not null)
- `room_type` (text, not null) -- e.g., '1-Sharing', '2-Sharing', '3-Sharing', 'Private'
- `capacity` (integer, not null)
- `rent` (numeric, not null)
- `attached_bathroom` (boolean, default false)
- `ac` (boolean, default false)
- `created_at` (timestamp with time zone, default now())

### 2.6. `beds`
Beds in each room.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `room_id` (UUID, references rooms(id) ON DELETE CASCADE)
- `bed_number` (text, not null)
- `status` (bed_status, default 'Available')
- `rent` (numeric) -- Optional custom rent override for specific beds
- `available_from` (date, default current_date)
- `tenant_id` (UUID) -- Assigned tenant profile ID (populated when status = 'Occupied')

### 2.7. `tenants`
The tenancy contracts mapping profiles to beds.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `profile_id` (UUID, unique, references profiles(id) ON DELETE CASCADE)
- `owner_id` (UUID, references pg_owners(id) ON DELETE CASCADE)
- `building_id` (UUID, references buildings(id) ON DELETE SET NULL)
- `room_id` (UUID, references rooms(id) ON DELETE SET NULL)
- `bed_id` (UUID, references beds(id) ON DELETE SET NULL)
- `joining_date` (date, default current_date)
- `expected_leave_date` (date)
- `actual_leave_date` (date)
- `deposit` (numeric, default 0)
- `monthly_rent` (numeric, default 0)
- `status` (text, default 'active') -- 'active', 'notice_period', 'left'

### 2.8. `tenant_documents`
Verification files for KYC.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `tenant_id` (UUID, references tenants(id) ON DELETE CASCADE)
- `document_type` (text, not null) -- 'Aadhaar', 'PAN', 'Passport', 'Driving License'
- `document_number` (text, not null)
- `file_url` (text, not null)
- `verified` (boolean, default false)

### 2.9. `bookings`
Pre-tenancy reservation applications.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `tenant_profile_id` (UUID, references profiles(id) ON DELETE CASCADE)
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `room_id` (UUID, references rooms(id) ON DELETE CASCADE)
- `bed_id` (UUID, references beds(id) ON DELETE CASCADE)
- `booking_date` (date, default current_date)
- `move_in_date` (date, not null)
- `booking_status` (booking_status, default 'Pending')
- `advance_amount` (numeric, default 0)

### 2.10. `rent_payments`
Historical monthly payments for tenants.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `tenant_id` (UUID, references tenants(id) ON DELETE CASCADE)
- `month` (text, not null) -- e.g., '2026-06'
- `amount` (numeric, not null)
- `due_date` (date, not null)
- `payment_date` (date)
- `payment_method` (text) -- 'UPI', 'Cash', 'Bank Transfer'
- `transaction_id` (text)
- `receipt_url` (text)
- `status` (text, default 'Pending') -- 'Pending', 'Paid', 'Overdue'

### 2.11. `expenses`
Property expenses.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `owner_id` (UUID, references pg_owners(id) ON DELETE CASCADE)
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `category` (expense_category, not null)
- `amount` (numeric, not null)
- `expense_date` (date, default current_date)
- `bill_url` (text)
- `remarks` (text)

### 2.12. `employees`
Staff details.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `owner_id` (UUID, references pg_owners(id) ON DELETE CASCADE)
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `employee_name` (text, not null)
- `designation` (text, not null)
- `salary` (numeric, not null)
- `joining_date` (date, default current_date)
- `status` (text, default 'active')

### 2.13. `amenities`
System list of general amenities.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `name` (text, unique, not null)

### 2.14. `building_amenities`
Mapping table between buildings and amenities.
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `amenity_id` (UUID, references amenities(id) ON DELETE CASCADE)
- **Primary Key**: (`building_id`, `amenity_id`)

### 2.15. `building_images`
Image gallery for the public website.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `image_url` (text, not null)
- `display_order` (integer, default 0)

### 2.16. `reviews`
Building ratings and reviews.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `tenant_id` (UUID, references tenants(id) ON DELETE CASCADE)
- `building_id` (UUID, references buildings(id) ON DELETE CASCADE)
- `rating` (integer, check (rating >= 1 and rating <= 5))
- `review` (text)
- `created_at` (timestamp with time zone, default now())

### 2.17. `notifications`
User alert inbox.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `receiver_profile_id` (UUID, references profiles(id) ON DELETE CASCADE)
- `title` (text, not null)
- `message` (text, not null)
- `read` (boolean, default false)
- `created_at` (timestamp with time zone, default now())

### 2.18. `bed_status_history` [ENHANCEMENT]
Historical status changes to track analytics and audits.
- `id` (UUID, Primary Key, default gen_random_uuid())
- `bed_id` (UUID, references beds(id) ON DELETE CASCADE)
- `status` (bed_status, not null)
- `tenant_id` (UUID) -- references profiles(id) or tenants(id) of occupant at that time
- `notes` (text) -- reason, e.g. "Tenancy Started", "Cleaning", "Repair"
- `changed_at` (timestamp with time zone, default now())

---

## 3. Database Triggers & Automatic Actions

### 3.1. Auth Sync (`handle_new_user`)
A trigger on `auth.users` fires on `INSERT` to automatically add a record to public `profiles` using details from the auth user (metadata, email).

### 3.2. Bed History Automated Logging (`log_bed_status_change`)
A trigger on `beds` fires on `INSERT` or `UPDATE` (when the `status` or `tenant_id` changes) to automatically insert a log entry into `bed_status_history`. This ensures complete history logs are created under-the-hood without application code needing to write to two tables manually.
