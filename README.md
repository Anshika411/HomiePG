# HomiePG — Modern PG & Coliving Management Platform

HomiePG is an end-to-end Paying Guest (PG) and coliving accommodation platform built as a modular monorepo. It powers every stakeholder journey across web and mobile: from tenant discovery and booking to property onboarding, room/bed inventory management, on-site task verifications, and platform governance.

---

## 🏗️ Repository Architecture

The monorepo contains 5 core applications under `apps/`:

```
HomiePG/
├── apps/
│   ├── backend/             # Node.js Express + Supabase REST API & database services (Port 5005)
│   ├── marketing-website/   # Next.js 15 App Router — Public discovery & tenant web portal (Port 3000)
│   ├── admin-website/       # Next.js 15 App Router — Super Admin & Platform Manager portal (Port 3001)
│   ├── owner-app/           # React Native / Expo 54 — PG Owner & Property Manager mobile app
│   └── tenant-app/          # React Native / Expo 54 — Tenant discovery, stay & rent mobile app
├── .env.example             # Monorepo environment blueprint reference
└── package.json             # Root npm workspace configuration & orchestration scripts
```

### Roles & Access Model
1. **Super Admin**: System governance and complete configuration control.
2. **Platform Manager**: Remote operations, KYC audits, onboarding verification task queue, and property approvals.
3. **PG Owner**: PG portfolio, room/bed configuration, pricing, and revenue analytics.
4. **Property Manager**: On-site day-to-day operations, tenant checks, and maintenance coordination.
5. **Tenant**: Search, filter, schedule visits, book beds, pay rent, and raise maintenance tickets.

> [!NOTE]
> On-site verification tasks (walkthroughs, GPS verification, audits) are modeled as flexible, assignable **Tasks** managed by Platform Managers.

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express, Supabase (`@supabase/supabase-js`, PostgreSQL), `pg`, `crypto` (AES-256), Google Gemini API (AI descriptions).
- **Web Applications**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Radix UI.
- **Mobile Applications**: React Native 0.81, Expo 54, TypeScript, Expo Location, Expo Image Picker, React Native Maps.
- **Package Management**: npm workspaces.

---

## 📋 Prerequisites

- **Node.js**: `v20.x` or higher recommended (`v18+` minimum).
- **npm**: `v9.x` or higher.
- **Expo Go App** (optional, for running mobile apps on your iOS / Android phone).
- **Supabase Account**: A free Supabase project with database credentials.

---

## 🚀 Quick Start Setup

### 1. Clone & Install Dependencies

From the repository root:

```bash
# Clone the repository
git clone https://github.com/homiepgcom-cloud/HomiePG.git
cd HomiePG

# Install dependencies across all workspace packages
npm install
```

---

### 2. Environment Variables Configuration

Copy each `.env.example` file to its active `.env` or `.env.local` file:

| Application | Template File | Destination File | Purpose |
|---|---|---|---|
| **Backend** | `apps/backend/.env.example` | `apps/backend/.env` | Database, port, encryption, dev OTP |
| **Marketing Website** | `apps/marketing-website/.env.example` | `apps/marketing-website/.env.local` | Supabase anon key, API base URL |
| **Admin Website** | `apps/admin-website/.env.example` | `apps/admin-website/.env.local` | API base URL |
| **Owner App** | `apps/owner-app/.env.example` | `apps/owner-app/.env` | Expo public API endpoint & Maps key |
| **Tenant App** | `apps/tenant-app/.env.example` | `apps/tenant-app/.env` | Expo public API endpoint & Maps key |

#### Quick copy commands (Windows PowerShell):
```powershell
Copy-Item apps\backend\.env.example apps\backend\.env
Copy-Item apps\marketing-website\.env.example apps\marketing-website\.env.local
Copy-Item apps\admin-website\.env.example apps\admin-website\.env.local
Copy-Item apps\owner-app\.env.example apps\owner-app\.env
Copy-Item apps\tenant-app\.env.example apps\tenant-app\.env
```

#### Quick copy commands (macOS / Linux):
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/marketing-website/.env.example apps/marketing-website/.env.local
cp apps/admin-website/.env.example apps/admin-website/.env.local
cp apps/owner-app/.env.example apps/owner-app/.env
cp apps/tenant-app/.env.example apps/tenant-app/.env
```

---

### 3. Detailed Environment Variables Breakdown

#### Backend (`apps/backend/.env`)
```ini
PORT=5005
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_role_key
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_PASSWORD=your_database_password
ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Authentication helpers
DEV_OTP=           # Set to e.g. 123456 to fix OTP during testing; leave blank for random OTP
SHOW_DEV_OTP=true  # Set false in production to hide dev OTP banners on clients

# AI capabilities (optional)
GEMINI_API_KEY=    # Optional Google Gemini key for generating property descriptions
```

#### Marketing Website (`apps/marketing-website/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:5005
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Admin Website (`apps/admin-website/.env.local`)
```ini
NEXT_PUBLIC_API_URL=http://localhost:5005
```

#### Mobile Apps (`apps/owner-app/.env` and `apps/tenant-app/.env`)
```ini
# When testing on Android Emulator:
# EXPO_PUBLIC_API_URL=http://10.0.2.2:5005

# When testing on physical device over same Wi-Fi LAN:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:5005

# When testing over remote/ngrok tunnel:
EXPO_PUBLIC_API_URL=http://localhost:5005

# Optional:
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

> [!TIP]
> In React Native / Expo, all client-accessible environment variables must start with the `EXPO_PUBLIC_` prefix. After changing `.env`, always restart Metro with cache cleared (`npx expo start -c`).

---

## 🏃‍♂️ Running Applications

You can run individual apps from the root directory or by navigating into the respective app folder.

### From Root Directory (Convenience Scripts)

```bash
# 1. Start Backend API Server (http://localhost:5005)
npm run dev:backend

# 2. Start Marketing Website (http://localhost:3000)
npm run dev:marketing

# 3. Start Admin Website (http://localhost:3001)
npm run dev:admin

# 4. Start Mobile Apps with Expo Tunnel
npm run tunnel:owner   # Owner app via Expo tunnel
npm run tunnel:tenant  # Tenant app via Expo tunnel
```

### Running Each App Individually

#### 1. Backend Server
```bash
cd apps/backend
npm run dev
# Optional database utilities:
# npm run migrate   # Run database migrations
# npm run seed      # Seed sample dummy data
```

#### 2. Marketing Website
```bash
cd apps/marketing-website
npm run dev
# Open http://localhost:3000
```

#### 3. Admin Website
```bash
cd apps/admin-website
npm run dev
# Open http://localhost:3001
```

#### 4. Owner Mobile App
```bash
cd apps/owner-app
npm start
# Press 'a' for Android emulator, 'i' for iOS simulator, or scan QR with Expo Go
```

#### 5. Tenant Mobile App
```bash
cd apps/tenant-app
npm start
# Press 'a' for Android emulator, 'i' for iOS simulator, or scan QR with Expo Go
```

---

## 📱 Mobile App Testing Guide

When testing on a physical phone via **Expo Go**:
1. Ensure your computer and phone are connected to the **same Wi-Fi network**.
2. Find your computer's local IP address (`ipconfig` on Windows or `ifconfig` / `ip a` on macOS/Linux).
3. Set `EXPO_PUBLIC_API_URL=http://<YOUR_LOCAL_IP>:5005` in `apps/owner-app/.env` and `apps/tenant-app/.env`.
4. Start Metro with cache cleared:
   ```bash
   npx expo start -c
   ```
5. Scan the QR code shown in your terminal using the Expo Go app.

Alternatively, use Expo's built-in tunnel mode:
```bash
npm run tunnel:owner
# or
npm run tunnel:tenant
```

---

## 👥 Demo / Sandbox Test Accounts

When running in local development or after seeding test data (`npm run seed -w homiepg-backend`), use the following accounts to test different roles and capabilities:

| Persona | Role | Email | Mobile | Default Password | Notes |
|---|---|---|---|---|---|
| **Super Admin** | `super_admin` | `admin@homiepg.com` | `9999999999` | `password123` | Full system access & governance |
| **Platform Manager** | `platform_manager` | `manager@homiepg.com` | `8888888888` | `password123` | Remote audits, KYC, task moderation |
| **PG Owner** | `owner` | `owner@homiepg.com` | `9876543210` | `password123` | Amit Sharma (Single Owner) |
| **PG Owner (Zolo)** | `owner` | `owner_zolo@homiepg.com` | `9876543220` | `password123` | Zolo Stays Operator |
| **PG Owner (Stanza)** | `owner` | `owner_stanza@homiepg.com` | `9876543230` | `password123` | Stanza Living Operator |
| **Property Manager** | `property_manager` | `propman@homiepg.com` | `7777777777` | `password123` | Suresh Pillai (On-site operations) |
| **Tenant (Male)** | `tenant` | `tenant@homiepg.com` | `9876543211` | `password123` | Rajesh Kumar (Tenant App / Web) |
| **Tenant (Female)** | `tenant` | `tenant_female@homiepg.com` | `9876543212` | `password123` | Priya Sharma (Tenant App / Web) |

> [!NOTE]
> In dev mode, OTP verification can either accept the randomly generated code shown on the demo banner or the code configured via `DEV_OTP` in `apps/backend/.env`.

---

## 🤝 Contribution Workflow

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Ensure you do not commit any `.env` files with secret production credentials (verified via `.gitignore`).
3. Commit with semantic messages (e.g. `feat: ...`, `fix: ...`).
4. Push and create a Pull Request to `contribution` or `main`.

