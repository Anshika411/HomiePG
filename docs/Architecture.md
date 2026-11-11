# HomiePG - Architecture & System Design

This document details the software architecture, repository organization, and structural decisions for the HomiePG co-living management system.

---

## 1. Monorepo Repository Structure

We organize the workspace as a monorepo separating execution context for the different applications. All backend logic is written in pure JavaScript, the website in React.js, and mobile applications in React Native with Expo.

```
pg-platform/
├── apps/
│   ├── backend/               # Node.js + Express API server (JavaScript)
│   ├── marketing-website/     # Vite + React.js SPA (JavaScript)
│   ├── admin-website/         # Vite + React.js SPA (JavaScript)
│   ├── tenant-app/            # React Native with Expo (JavaScript)
│   ├── owner-app/             # React Native with Expo (JavaScript)
│   └── admin-app/             # React Native with Expo (JavaScript)
│
├── supabase/
│   ├── migrations/            # SQL migration scripts containing DDL, RLS, and triggers
│   ├── seed/                  # Setup mock records, initial admins, amenities
│   ├── functions/             # Supabase Edge Functions (custom triggers, file uploads, automated bills)
│   └── storage/               # Policies and setup instructions for storage buckets
│
└── docs/                      # General specifications, PRD, API, Architecture maps
```

---

## 2. API Communication Layer
Unlike direct-to-database setups, all clients (Website & Mobile Apps) interact with the custom Node/Express JS backend via a REST API:

```
[React.js Website] & [Expo Mobile Apps]
             │
             ▼ (HTTP requests with JWT Authorization headers)
      [Express Backend]
             │
             ▼ (Queries using Supabase JS SDK & pg connection pool)
    [Supabase Database]
```

---

## 3. Storage Architecture

We organize file storage under **Supabase Storage Buckets**. RLS policies are applied to buckets to protect private documents:

| Bucket Name | Accessibility | Read policy | Write policy |
| :--- | :--- | :--- | :--- |
| `aadhaar/` | Private | Owner, Super Admin, Self (Tenant) | Self (Tenant) |
| `pan/` | Private | Owner, Super Admin, Self (Tenant) | Self (Tenant) |
| `building_images/` | Public | Public read | Owner (Owns Building), Super Admin |
| `receipts/` | Private | Owner, Self (Tenant), Super Admin | Self (Tenant) |
| `expense_bills/` | Private | Owner, Super Admin | Owner |
| `employee_documents/` | Private | Owner, Super Admin | Owner |
| `tenant_documents/` | Private | Owner, Super Admin, Self (Tenant) | Self (Tenant) |
| `profile_photos/` | Public | Public read | Self, Super Admin |

---

## 4. Security & Data Isolation (Supabase RLS)

To enforce clean data boundaries, each table has RLS enabled. The policies compare query request user JWT properties (specifically `auth.uid()`) to target rows. The Node/Express server acts as an authorized client or passes user jwt claims (via `supabase.auth.setSession`) to invoke RLS policies on behalf of users.
