# Project Context & Guidelines for AI Agents: KisanSetu

> **SIH Problem Statement ID:** 26032  
> **Application Name:** KisanSetu  
> **Platform Description:** Multilingual Smart Procurement Management Platform connecting Farmers, Procurement Centre Staff, and Administrators.

---

## 1. Planning Documentation Index

Refer to the canonical specification documents in `/docs/` for deep architectural details before writing or editing code:

- [`PRODUCT.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/PRODUCT.md): Product vision, user roles, feature scope, and assumptions.
- [`ARCHITECTURE.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/ARCHITECTURE.md): System architecture, technical stack, folder structure, and real-time algorithms.
- [`DATABASE.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/DATABASE.md): PostgreSQL schema, table definitions, enums, indexes, and ER diagram.
- [`USER-FLOWS.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/USER-FLOWS.md): Detailed sequence diagrams and operational journeys for Farmer, Staff, and Admin.
- [`I18N.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/I18N.md): Multilingual strategy, dictionary structure, and language extension guide.
- [`SECURITY.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/SECURITY.md): RBAC matrix, Row Level Security (RLS) policies, and QR code token verification.
- [`DEMO.md`](file:///c:/Users/ASHA/OneDrive/Documents/KisanSetu/docs/DEMO.md): SIH Hackathon demonstration script, seed data plan, and key differentiators.

---

## 2. Core Engineering Rules & Directives

### 2.1 Technology Stack Rules
- **Framework:** Next.js (App Router with TypeScript).
- **Styling:** Tailwind CSS + shadcn/ui primitives. Use custom harmonious agricultural color palette (Earthy greens, clean darks, amber badges).
- **Backend Services:** Supabase (PostgreSQL, Auth, Realtime, Storage).
- **Form & Data Validation:** Zod schemas for all client & server inputs.

### 2.2 UI & UX Rules
- **Farmer First:** Mobile-first layout, large touch targets (minimum 44x44px), high contrast for sunlight readability, clear status icons.
- **Staff Workflow:** Single-click operational actions, fast camera scanning for QR tokens, automated MSP calculations.
- **Admin Insights:** Clean visual heatmaps, clear data visualizations using Recharts/Lucide.
- **Zero Fake Integrations:** Build actual working state machines, DB queries, and WebSockets. Never use mock static timeout delays disguised as live APIs.

### 2.3 i18n & Translation Rules
- **No Hardcoded User-Facing Text:** All UI labels, error messages, button text, and status tags MUST use translation keys via the i18n helper (`t('domain.key')`).
- **Dynamic Content:** Database entity names (crops, notice titles) must support multi-column or JSON localized field lookup.

### 2.4 Security & RLS Rules
- Enforce strict TypeScript types.
- Ensure Supabase Row Level Security (RLS) policies are respected in Server Actions and database migrations.
- Verify user roles (`FARMER`, `CENTRE_STAFF`, `ADMIN`) before performing privileged actions.
