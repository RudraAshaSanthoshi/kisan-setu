# Product Specification: KisanSetu (Smart Procurement Platform)

> **SIH Problem Statement ID:** 26032  
> **Platform Name:** KisanSetu (Kisan = Farmer, Setu = Bridge)  
> **Target Audience:** Farmers, Procurement Centre Operations Staff, Government & Mandi Administrators  

---

## 1. Executive Summary & Core Problem

Agricultural procurement in India (MSP-based grain purchasing by FCI, State Civil Supplies, and Mandis) faces severe operational inefficiencies every harvest season. Farmers arrive at procurement centres simultaneously without prior coordination, resulting in:
- **Massive Congestion & Long Delays:** Farmers wait in tractor queues for 12 to 48 hours.
- **Uncertainty & Lack of Visibility:** Zero real-time updates regarding token status, center capacity, or daily buying limits.
- **Economic Loss & Crop Deterioration:** Prolonged waiting exposes harvested crops to moisture, weather damage, and distress selling.
- **Manual & Opaque Record-Keeping:** Slow manual weighing, subjective quality grading, and delayed payment processing.
- **Language & Literacy Barriers:** Complex digital interfaces that alienate non-English/non-tech-savvy farmers.

**KisanSetu** bridges this gap by acting as a smart, multilingual procurement management network. It empowers farmers with transparent produce declarations, smart time-slot scheduling, live queue tracking, and real-time payment visibility, while giving centre staff streamlined operational tools and administrators comprehensive regional procurement analytics.

---

## 2. Product Vision & Principles

### Vision
To modernize agricultural procurement across India through a zero-friction, transparent, and multilingual digital bridge that eliminates Mandi queues, guarantees fair grading, and accelerates farmer payouts.

### Product Principles
1. **Mobile-First & Ultra-Accessible:** Optimized for low-end smartphones, low bandwidth (2G/3G), touch-friendly, high-contrast visual cues, and voice/audio assistance.
2. **India-First Multilingual Architecture:** Native support for Indian languages (Hindi, Punjabi, Marathi, Telugu, Tamil, Gujarati, Bengali, Kannada, English) with seamless runtime switching.
3. **Real Procurement Problems, Zero Fluff:** Every feature directly reduces wait times, balances centre load, or increases payout transparency. No forced or fake AI.
4. **Operational Efficiency for Staff:** High-speed verification, QR code scanning, and single-click quality/weight logging.
5. **Data Integrity & Trust:** End-to-end auditability from token issuance to bank transfer confirmation.

---

## 3. User Roles & Personas

| Role | Key Persona | Primary Goals | Key Pain Points Solved |
| :--- | :--- | :--- | :--- |
| **FARMER** | *Ramesh (Smallholder Farmer)* | Declare harvest, book preferred time slot, avoid long queues, track real-time queue position, receive instant payment confirmation. | Eliminates overnight waiting, provides price & slot certainty, offers full interface in native language. |
| **CENTRE_STAFF** | *Gurpreet (Mandis / Centre Gate In-Charge & Quality Inspector)* | Verify incoming slot tokens, log actual crop weight & moisture/quality parameters, maintain orderly throughput, minimize manual entry errors. | Prevents overcrowding at gates, automates MSP calculation, digitizes quality receipts. |
| **ADMIN** | *Dr. Sharma (District Procurement Officer)* | Monitor regional centre capacity, detect congestion hotspots, allocate procurement targets, manage crop MSP rates, track payment disbursements. | Provides live district-wide visibility, prevents supply chain bottlenecks, ensures policy compliance. |

---

## 4. Module & Feature Scope

### 4.1 Farmer Experience
- **Authentication & Profile:** Mobile OTP authentication, landholding details, bank account linkage verification, multi-language preference setup.
- **Produce Declaration:** Register crop type (e.g., Wheat, Paddy, Pulses), estimated quantity (in Quintals), harvest date, and village location.
- **Procurement Centre Discovery:** Geo-location & district filter to find nearest active procurement centres with capacity indicators (Green/Yellow/Red).
- **Smart Slot Booking:** Algorithmic slot allocation based on daily centre throughput rules; generates an offline-capable digital token with QR code.
- **Arrival Confirmation & QR Scan:** Self check-in or gate check-in upon arrival within booking window.
- **Real-Time Live Queue & ETA:** Dynamic queue position (e.g., *"3 tractors ahead of you"*) and estimated processing time counter.
- **Procurement & Payment Tracking:** Digital receipt detailing accepted weight, grade, moisture content, calculated MSP amount, and bank transfer reference status (Pending $\rightarrow$ Processing $\rightarrow$ Disbursed).

### 4.2 Centre Staff Dashboard
- **Gate Check-In & Scanner:** Rapid camera scanner / token lookup for arriving vehicles.
- **Active Queue Management:** Live board showing Checked-In, In-Weighing, Grading, and Completed status; ability to call next token.
- **Weighbridge & Quality Inspector Module:** Direct input for gross weight, tare weight, moisture content %, and grain grade (Grade A / FAQ / Rejection threshold). Auto-populates calculated payout using system MSP rates.
- **Receipt Generation:** Instant digital receipt push to farmer's mobile app and optional printable summary.

### 4.3 Admin & Operations Dashboard
- **Congestion & Capacity Heatmap:** Real-time visual tracking of active centres, daily target vs actual procurement, and queue bottlenecks.
- **Dynamic Slot Capacity Manager:** Adjust daily intake quotas per centre based on storage availability or logistics delays.
- **Crop & MSP Master Management:** Configure active procurement crops, seasons (Kharif/Rabi), MSP rates, and quality parameter limits.
- **Audit & Settlement Oversight:** Track pending vs settled payments across districts and flag anomalies.

---

## 5. Non-Functional Requirements & Constraints

- **Performance:** App launch under 1.5s on mobile networks; Realtime queue updates with $< 500\text{ms}$ latency via WebSockets.
- **Accessibility:** Minimum contrast ratio 4.5:1, dynamic font sizing, icon-heavy UI navigation for low-literacy users.
- **Scalability:** Designed to handle peak harvest traffic (thousands of simultaneous bookings per district).
- **Security:** Strict Role-Based Access Control (RBAC), Row Level Security (RLS) on all database tables, encrypted personal identifier data.

---

## 6. Assumptions & Risks

- **Assumption:** Farmers or village facilitators (Common Service Centres / CSCs) have basic smartphone access or SMS connectivity.
- **Risk:** High network instability at rural procurement centres.  
  *Mitigation:* Tokens and QR codes are generated offline on the farmer's device; staff dashboard supports queued local check-in sync.
- **Risk:** Sudden spikes in unscheduled farmer arrivals.  
  *Mitigation:* Fast-track queue priority for booked slots while reserving emergency walk-in slot quotas managed by Centre Staff.
