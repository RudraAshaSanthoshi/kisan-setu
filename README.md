# KisanSetu: Multilingual Smart Procurement Management Platform

> **SIH Problem Statement ID:** 26032  
> **Platform Description:** Multilingual Smart Procurement Management Platform connecting Farmers, Procurement Centre Staff, and Administrators.

---

## 1. Project Architecture & Stack

- **Framework:** Next.js 15 (App Router with TypeScript)
- **Styling & UI:** Tailwind CSS, shadcn/ui primitives, Lucide Icons
- **Backend Infrastructure Boundaries:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Localization:** Extensible Indian i18n engine (`public/locales/*.json`) supporting Hindi, Punjabi, Marathi, Telugu, Tamil, Gujarati, Bengali, Kannada, English
- **Form & Validation:** Zod schemas

### Directory Blueprint
```text
KisanSetu/
├── docs/                        # Canonical Architectural Specifications
├── public/
│   └── locales/                 # Extensible i18n JSON dictionaries
├── src/
│   ├── app/                     # Next.js App Router (Layouts & Pages)
│   ├── components/
│   │   ├── ui/                  # Foundational UI Primitives (Button, Card, Input, Badge, Dialog)
│   │   ├── farmer/              # Farmer portal component module
│   │   ├── staff/               # Staff portal component module
│   │   ├── admin/               # Admin portal component module
│   │   ├── shared/              # Header, LanguageSelector, Navigation
│   │   └── providers/           # LanguageProvider context
│   ├── hooks/                   # Custom Hooks (useLanguage)
│   ├── lib/
│   │   ├── i18n/                # Localization engine & dictionary loader
│   │   ├── supabase/            # Supabase Auth/DB client & server boundaries
│   │   └── utils.ts             # CN & formatting helpers
│   ├── services/                # Business logic engines (slotEngine, queueEngine, paymentEngine)
│   └── types/                   # TypeScript interfaces
├── .env.example                 # Environment variables specification
├── AGENTS.md                    # AI Agent engineering rules
└── package.json
```

---

## 2. Installation & Running Locally

### Prerequisites
- Node.js 18.x or 20.x+
- npm 9.x+

### Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Run Type Checks & Linting:**
   ```bash
   npm run typecheck
   npm run lint
   ```

---

## 3. Environment Variables Specification

| Variable Name | Required | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase Project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase Anonymous Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | No (Server) | Supabase Admin Service Role Key |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | Optional | Default application locale (`hi`) |

---

## 4. Current Implementation Status

- [x] **Phase 1: Project Foundation (COMPLETED)**
  - Next.js 15 App Router + TypeScript + Tailwind CSS initialized.
  - Strict TypeScript & ESLint quality rules configured.
  - Foundational UI design tokens & primitive components (`Button`, `Card`, `Input`, `Badge`, `Dialog`, `Label`).
  - Modern, accessible agricultural visual identity established.
  - Extensible Indian i18n localization engine configured (embedded fallback + async dictionary loader).
  - Supabase client, server, and middleware service boundaries defined without requiring production keys.
  - Core business services (`slotEngine`, `queueEngine`, `paymentEngine`) initialized with Zod schema validation and HMAC message authentication tamper-proof token signature generator.
  - Minimal application shell running at `http://localhost:3000`.

- [ ] **Phase 2: Database Schema & Supabase Migrations (Pending)**
- [ ] **Phase 3: Farmer Portal Implementation (Pending)**
- [ ] **Phase 4: Staff Operations Portal (Pending)**
- [ ] **Phase 5: Admin Analytics & Congestion Control (Pending)**
