# Smart India Hackathon (SIH 26032) Demonstration Blueprint: KisanSetu

> **Purpose:** Scripted end-to-end demonstration narrative, seed data strategy, and judges walkthrough guide.

---

## 1. Demo Narrative & Persona Setup

| Role | Persona Name | Location / Context | Demo Action |
| :--- | :--- | :--- | :--- |
| **FARMER** | Ramesh Singh | Ludhiana, Punjab | Mobile browser user speaking Punjabi. Harvesting 50 Quintals Wheat. |
| **CENTRE_STAFF** | Gurpreet Singh | Khanna Grain Market (Mandi) | Tablet user handling gate intake, weighbridge, and quality verification. |
| **ADMIN** | Dr. A. K. Sharma | District Collectorate Office | Laptop user monitoring district-wide procurement analytics and congestion map. |

---

## 2. Step-by-Step Live Demo Script (5-Minute Walkthrough)

```mermaid
timeline
    title SIH 26032 Live Demo Sequence
    0:00 - 1:00 : Farmer Multilingual Onboarding & Slot Booking
    1:00 - 2:00 : Gate Arrival & QR Scanner Verification
    2:00 - 3:00 : Live Queue Engine & WebSockets Realtime Sync
    3:00 - 4:00 : Weighbridge, Quality Grading & Instant MSP Payout Slip
    4:00 - 5:00 : District Admin Congestion Analytics & Load Balancing
```

### Scene 1: Farmer Multilingual Experience (1 Min)
1. **Action:** Open application landing page on mobile view. Show instant language switch from English to **Punjabi (ਪੰਜਾਬੀ)** / **Hindi (हिन्दी)**.
2. **Highlight:** Notice how all UI headers, button text, and forms adapt instantly without reloading page.
3. **Action:** Ramesh logs in, submits produce declaration for **Wheat (50 Quintals)**, searches nearby centres, and views **Khanna Mandi** (Badge: *Green - Low Congestion*).
4. **Action:** Books slot for **10:00 AM - 11:00 AM**. Generates Token **`KS-2025-8841`** with QR Code.

### Scene 2: Gate Check-in & Realtime Queue Engine (1 Min)
1. **Action:** Switch to Staff Portal (`/staff/check-in`). Staff Gurpreet scans Ramesh's QR token using device camera.
2. **Result:** Token verified! Staff taps **"Check In Vehicle"**.
3. **Realtime WOW Factor:** Side-by-side view! The moment Gurpreet taps check-in, Ramesh's mobile app screen automatically updates via Supabase Realtime to display:
   > 🟢 **You are Checked-In!**  
   > 📍 Queue Position: **#3 in Line** | ⏱️ Estimated Wait: **20 Mins**

### Scene 3: Quality Grading, MSP Calculation & Payment Advice (1.5 Mins)
1. **Action:** Staff calls token `#KS-2025-8841` to weighbridge (`/staff/grading`).
2. **Inputs:**
   - Gross Weight: `18,500 kg` | Tare Weight: `13,500 kg` $\rightarrow$ **Net Weight: 50.00 Quintals**
   - Moisture Content: `13.2%` (Passes standard limit of 14.0%)
   - Grade: `Grade A`
3. **Result:** System automatically multiplies `50 Quintals × ₹2,275 (Wheat MSP rate)` = **₹1,13,750 Total Payout**.
4. **Action:** Tap **"Issue Digital Procurement Slip"**.
5. **Farmer Screen:** Instant digital receipt appears on Ramesh's phone with breakdown and status: **Payment Status: Processing (UTR Pending)**.

### Scene 4: District Administrator Congestion & Capacity Analytics (1.5 Mins)
1. **Action:** Switch to Admin Dashboard (`/admin/analytics`).
2. **Highlight:** District map displaying real-time metrics across 12 procurement centres:
   - Total Procurement Today: `4,850 Quintals`
   - Active Waiting Vehicles: `34`
   - Khanna Mandi status: `Normal (42% Capacity)`
   - Sirhind Mandi status: `CONGESTED (88% Capacity - Throttle Active)`
3. **Action:** Admin adjusts slot limits or triggers load-balancing alert to divert unscheduled arrivals.

---

## 3. Seed Data Specification (`seed.sql`)

The demo relies on deterministic mock seed data to ensure instant, flawless execution during judging:

- **2 Pre-configured Procurement Centres:**
  1. `Khanna Main Mandi` (District: Ludhiana, Capacity: 1500 Qtl/day)
  2. `Sirhind Grain Yard` (District: Fatehgarh Sahib, Capacity: 800 Qtl/day)
- **3 Pre-configured Crops:**
  1. `Wheat (Rabi 2025)` - MSP ₹2,275 / Qtl
  2. `Paddy Grade A (Kharif)` - MSP ₹2,320 / Qtl
  3. `Mustard (Rabi 2025)` - MSP ₹5,650 / Qtl
- **Pre-populated Queue Entries:** 2 vehicles ahead in queue to demonstrate live decrement when called.

---

## 4. Winning Differentiators for Judges Q&A

1. **"Why not just use an app like Uber/Zomato for queues?"**  
   *Answer:* Mandi procurement involves legal MSP calculations, weighbridge gross/tare validation, crop moisture inspection, and direct government bank transfers. KisanSetu integrates these operational realities into queue scheduling.
2. **"What happens if internet fails in rural mandis?"**  
   *Answer:* Digital tokens contain HMAC-signed offline payload. Farmers can present tokens without active cellular data. Staff check-ins queue locally and sync as soon as connectivity resumes.
3. **"How hard is it to add another Indian language?"**  
   *Answer:* Zero code modification required. Simply add a localized JSON dictionary file in `public/locales/` and the system dynamically loads it.
