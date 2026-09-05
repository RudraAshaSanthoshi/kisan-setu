# Security & Compliance Framework: KisanSetu

> Comprehensive security specification detailing authentication, Row Level Security (RLS), RBAC matrix, and data privacy safeguards.

---

## 1. Authentication & Role-Based Access Control (RBAC)

KisanSetu employs **Supabase Auth** paired with PostgreSQL **Custom JWT Claims** to enforce strict identity verification and role-based permissions across API endpoints, Server Actions, and client routes.

### Role Permission Matrix

| Feature / Resource | FARMER | CENTRE_STAFF | ADMIN |
| :--- | :---: | :---: | :---: |
| Register & Profile Management | **Own Profile** | **Own Profile** | **All Profiles** |
| Create Produce Declaration | **Yes** | No | Read Only |
| Book Smart Procurement Slot | **Yes (Own)** | No | Read Only |
| View Live Queue | **Yes (Own Token)** | **Yes (Assigned Centre)** | **Yes (All Centres)** |
| Gate Check-In & Scan QR | No | **Yes (Assigned Centre)** | **Yes** |
| Log Weight & Quality Inspection | No | **Yes (Assigned Centre)** | **Yes** |
| Issue Procurement Slip | No | **Yes (Assigned Centre)** | **Yes** |
| View Financial Payout Status | **Own Payouts** | Assigned Centre Records | **District/Global** |
| Adjust Centre Quotas / Rates | No | No | **Full Access** |

---

## 2. Row Level Security (RLS) Database Policies

Every PostgreSQL table has `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;` enabled.

```sql
-- Example RLS Policy for Profiles
CREATE POLICY "Users can view their own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id OR auth.jwt() ->> 'role' = 'ADMIN');

-- Example RLS Policy for Produce Declarations
CREATE POLICY "Farmers manage own declarations" 
ON produce_declarations FOR ALL 
USING (auth.uid() = farmer_id OR auth.jwt() ->> 'role' = 'ADMIN');

-- Example RLS Policy for Slot Bookings
CREATE POLICY "Farmers view own bookings" 
ON slot_bookings FOR SELECT 
USING (
  auth.uid() = farmer_id 
  OR (
    auth.jwt() ->> 'role' = 'CENTRE_STAFF' 
    AND centre_id = (SELECT assigned_centre_id FROM profiles WHERE id = auth.uid())
  )
  OR auth.jwt() ->> 'role' = 'ADMIN'
);

-- Example RLS Policy for Procurement Records
CREATE POLICY "Staff create records for assigned centre" 
ON procurement_records FOR INSERT 
WITH CHECK (
  auth.jwt() ->> 'role' = 'CENTRE_STAFF' 
  AND centre_id = (SELECT assigned_centre_id FROM profiles WHERE id = auth.uid())
  OR auth.jwt() ->> 'role' = 'ADMIN'
);
```

---

## 3. QR Token Tamper Protection & Cryptographic Integrity

To prevent malicious users from creating counterfeit tokens or scanning fake QR codes at Mandi gates:
1. When a slot is booked, `slotEngine.ts` generates a HMAC-SHA256 signature combining `booking_id`, `farmer_id`, `centre_id`, `booking_date`, and a secret server key.
2. The payload string embedded in the QR code is formatted as:
   $$\text{QR Payload} = \text{Base64}(\text{booking\_id} \mathbin{\Vert} \text{token\_code} \mathbin{\Vert} \text{timestamp} \mathbin{\Vert} \text{HMAC\_SHA256\_Signature})$$
3. Staff check-in scanner decrypts and validates the HMAC signature before accepting vehicle entry. Fake or altered tokens are immediately rejected.

---

## 4. Input Validation & Defense-in-Depth

- **Server Actions & API Routes:** All incoming request payloads are strictly parsed using **Zod** schemas prior to database execution.
- **XSS & Injection Protection:** Next.js automatic React escaping, sanitized HTML, and parameterized SQL queries via Supabase ORM prevent XSS and SQL injection.
- **Rate Limiting:** Next.js Middleware applies rate limits on OTP generation and slot booking calls (max 5 booking attempts per minute per IP/user) to prevent denial-of-service or slot hoarding.

---

## 5. Data Privacy & Aadhaar Safeguards

- No full Aadhaar numbers are stored in the database. Only the anonymized last 4 digits (`aadhaar_last4`) are stored for identity confirmation.
- Phone numbers are encrypted at rest where required by regional compliance standards.
