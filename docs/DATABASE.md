# Database Schema Specification: KisanSetu

> **Database Engine:** PostgreSQL (Supabase Managed)  
> **Extension Dependencies:** `uuid-ossp`, `pgcrypto`, `postgis` (optional for geospatial centre discovery)

---

## 1. Entity Relationship Diagram (ERD)

```mermaid
erdiagram
    profiles ||--o{ produce_declarations : "creates"
    profiles ||--o{ slot_bookings : "books"
    profiles ||--o{ notifications : "receives"
    procurement_centres ||--o{ slot_bookings : "hosts"
    procurement_centres ||--o{ queue_entries : "manages"
    crops ||--o{ produce_declarations : "classified_as"
    crops ||--o{ procurement_records : "graded_for"
    produce_declarations ||--o{ slot_bookings : "scheduled_in"
    slot_bookings ||--|| queue_entries : "generates"
    queue_entries ||--o| procurement_records : "results_in"
    procurement_records ||--|| payments : "triggers"
```

---

## 2. Custom Enum Types

```sql
-- User Roles
CREATE TYPE user_role AS ENUM ('FARMER', 'CENTRE_STAFF', 'ADMIN');

-- Slot Booking Status
CREATE TYPE slot_status AS ENUM ('BOOKED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- Queue Status
CREATE TYPE queue_status AS ENUM ('WAITING', 'WEIGHING', 'GRADING', 'COMPLETED', 'SKIPPED');

-- Quality Grades
CREATE TYPE quality_grade AS ENUM ('GRADE_A', 'FAQ', 'REJECTED');

-- Payment Status
CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'DISBURSED', 'FAILED');

-- Notification Channel
CREATE TYPE notif_channel AS ENUM ('IN_APP', 'SMS', 'PUSH');
```

---

## 3. Detailed Table Definitions

### 3.1 `profiles`
Extends `auth.users` with application-specific metadata.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id)` | Foreign key to Supabase Auth |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | User full name |
| `phone_number` | `VARCHAR(20)` | `UNIQUE, NOT NULL` | Mobile number for OTP & SMS |
| `role` | `user_role` | `NOT NULL, DEFAULT 'FARMER'` | User role |
| `preferred_language` | `VARCHAR(10)` | `DEFAULT 'hi'` | Preferred locale code (hi, en, pa, etc.) |
| `aadhaar_last4` | `VARCHAR(4)` | `NULL` | Anonymized Aadhaar verification |
| `assigned_centre_id` | `UUID` | `FOREIGN KEY -> procurement_centres(id)` | Required for `CENTRE_STAFF` |
| `district` | `VARCHAR(100)` | `NULL` | District name |
| `state` | `VARCHAR(100)` | `NULL` | State name |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 3.2 `procurement_centres`
Stores details of government procurement centres & mandis.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Centre unique ID |
| `centre_code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Government code (e.g., `PB-MND-001`) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Centre / Mandi name |
| `district` | `VARCHAR(100)` | `NOT NULL` | District location |
| `state` | `VARCHAR(100)` | `NOT NULL` | State location |
| `address` | `TEXT` | `NOT NULL` | Full physical address |
| `latitude` | `DECIMAL(10, 8)` | `NULL` | GPS Latitude |
| `longitude` | `DECIMAL(11, 8)` | `NULL` | GPS Longitude |
| `daily_capacity_quintals`| `INTEGER` | `NOT NULL, DEFAULT 1000` | Daily max procurement capacity |
| `operating_start_time` | `TIME` | `DEFAULT '08:00:00'` | Opening hour |
| `operating_end_time` | `TIME` | `DEFAULT '18:00:00'` | Closing hour |
| `hourly_slot_capacity` | `INTEGER` | `DEFAULT 15` | Max vehicle slots per hour |
| `is_active` | `BOOLEAN` | `DEFAULT TRUE` | Centre operational flag |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |

---

### 3.3 `crops`
Master lookup table for crops, minimum support price (MSP), and grading criteria.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Crop ID |
| `crop_code` | `VARCHAR(50)` | `UNIQUE, NOT NULL` | Code (e.g., `WHEAT_2025`, `PADDY_GRADE_A`) |
| `name_en` | `VARCHAR(100)` | `NOT NULL` | English crop name |
| `name_hi` | `VARCHAR(100)` | `NOT NULL` | Hindi crop name |
| `season` | `VARCHAR(50)` | `NOT NULL` | Season (Kharif / Rabi) |
| `msp_per_quintal` | `DECIMAL(10, 2)`| `NOT NULL` | Current Minimum Support Price (INR) |
| `max_moisture_percentage`| `DECIMAL(5, 2)`| `DEFAULT 14.00` | Standard max moisture threshold |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record timestamp |

---

### 3.4 `produce_declarations`
Declarations submitted by farmers regarding upcoming produce.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Declaration ID |
| `farmer_id` | `UUID` | `FOREIGN KEY -> profiles(id), NOT NULL` | Farmer reference |
| `crop_id` | `UUID` | `FOREIGN KEY -> crops(id), NOT NULL` | Crop reference |
| `estimated_quantity_quintals` | `DECIMAL(10, 2)` | `NOT NULL` | Quantity in quintals |
| `harvest_date` | `DATE` | `NOT NULL` | Estimated/Actual harvest date |
| `village` | `VARCHAR(150)` | `NOT NULL` | Farmer's village location |
| `status` | `VARCHAR(50)` | `DEFAULT 'ACTIVE'` | Declaration status (ACTIVE, FULFILLED, CANCELLED) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

### 3.5 `slot_bookings`
Smart slot booking tokens for procurement centres.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Booking ID |
| `token_code` | `VARCHAR(20)` | `UNIQUE, NOT NULL` | Human-readable token (e.g., `KS-2025-8841`) |
| `declaration_id` | `UUID` | `FOREIGN KEY -> produce_declarations(id)` | Linked declaration |
| `farmer_id` | `UUID` | `FOREIGN KEY -> profiles(id), NOT NULL` | Booking farmer |
| `centre_id` | `UUID` | `FOREIGN KEY -> procurement_centres(id), NOT NULL` | Target procurement centre |
| `booking_date` | `DATE` | `NOT NULL` | Scheduled date |
| `slot_start_time` | `TIME` | `NOT NULL` | Slot start time (e.g. 09:00:00) |
| `slot_end_time` | `TIME` | `NOT NULL` | Slot end time (e.g. 10:00:00) |
| `estimated_quantity_quintals` | `DECIMAL(10, 2)` | `NOT NULL` | Booked quantity |
| `vehicle_type` | `VARCHAR(50)` | `DEFAULT 'Tractor'` | Vehicle (Tractor, Trolley, Mini-Truck) |
| `vehicle_number` | `VARCHAR(30)` | `NULL` | Registration number |
| `status` | `slot_status` | `DEFAULT 'BOOKED'` | Booking lifecycle state |
| `qr_code_hash` | `TEXT` | `NOT NULL` | Encrypted payload string for QR generation |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Booking timestamp |

---

### 3.6 `queue_entries`
Real-time active queue tracking table.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Queue entry ID |
| `booking_id` | `UUID` | `UNIQUE, FOREIGN KEY -> slot_bookings(id)` | Linked slot booking |
| `centre_id` | `UUID` | `FOREIGN KEY -> procurement_centres(id)` | Centre ID |
| `queue_number` | `INTEGER` | `NOT NULL` | Sequential daily queue token number |
| `status` | `queue_status` | `DEFAULT 'WAITING'` | Realtime queue state |
| `check_in_time` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Gate arrival timestamp |
| `called_time` | `TIMESTAMPTZ` | `NULL` | Called to weighbridge timestamp |
| `completed_time` | `TIMESTAMPTZ` | `NULL` | Exit/completed timestamp |

---

### 3.7 `procurement_records`
Official weight and quality inspection results entered by Centre Staff.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Procurement record ID |
| `queue_entry_id` | `UUID` | `UNIQUE, FOREIGN KEY -> queue_entries(id)` | Linked queue entry |
| `farmer_id` | `UUID` | `FOREIGN KEY -> profiles(id)` | Farmer reference |
| `centre_id` | `UUID` | `FOREIGN KEY -> procurement_centres(id)` | Centre reference |
| `crop_id` | `UUID` | `FOREIGN KEY -> crops(id)` | Crop reference |
| `gross_weight_kg` | `DECIMAL(10, 2)` | `NOT NULL` | Total vehicle + crop weight |
| `tare_weight_kg` | `DECIMAL(10, 2)` | `NOT NULL` | Empty vehicle weight |
| `net_weight_quintals` | `DECIMAL(10, 2)` | `NOT NULL` | Net crop weight in quintals |
| `moisture_percentage`| `DECIMAL(5, 2)` | `NOT NULL` | Recorded moisture content |
| `grade` | `quality_grade` | `NOT NULL, DEFAULT 'GRADE_A'` | Assigned quality grade |
| `rate_per_quintal` | `DECIMAL(10, 2)` | `NOT NULL` | Applied MSP / rate |
| `total_payout_amount` | `DECIMAL(12, 2)` | `NOT NULL` | Net calculated payout (INR) |
| `staff_id` | `UUID` | `FOREIGN KEY -> profiles(id)` | Staff member who verified |
| `remarks` | `TEXT` | `NULL` | Inspector notes |
| `recorded_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record timestamp |

---

### 3.8 `payments`
Tracks financial payment disincentives & bank transfer statuses.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Payment ID |
| `procurement_record_id` | `UUID` | `UNIQUE, FOREIGN KEY -> procurement_records(id)` | Linked record |
| `farmer_id` | `UUID` | `FOREIGN KEY -> profiles(id)` | Beneficiary farmer |
| `amount` | `DECIMAL(12, 2)` | `NOT NULL` | Payable amount (INR) |
| `transaction_ref` | `VARCHAR(100)` | `UNIQUE, NULL` | Bank UTR / Reference ID |
| `payment_status` | `payment_status` | `DEFAULT 'PENDING'` | Current status |
| `disbursed_at` | `TIMESTAMPTZ` | `NULL` | Bank disbursement confirmation time |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record timestamp |

---

### 3.9 `notifications`
Notification log for SMS & App notifications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Notification ID |
| `user_id` | `UUID` | `FOREIGN KEY -> profiles(id)` | Recipient user |
| `title_key` | `VARCHAR(100)` | `NOT NULL` | i18n title key |
| `body_key` | `VARCHAR(100)` | `NOT NULL` | i18n body key |
| `params` | `JSONB` | `DEFAULT '{}'::jsonb` | Dynamic replacement variables |
| `channel` | `notif_channel` | `DEFAULT 'IN_APP'` | Channel used |
| `is_read` | `BOOLEAN` | `DEFAULT FALSE` | Read receipt |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Creation timestamp |

---

## 4. Key Database Indexes & Optimizations

```sql
-- Indexes for fast query lookup & filtering
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_centres_district ON procurement_centres(district);
CREATE INDEX idx_slot_bookings_date_centre ON slot_bookings(centre_id, booking_date, slot_start_time);
CREATE INDEX idx_queue_entries_centre_status ON queue_entries(centre_id, status);
CREATE INDEX idx_procurement_records_farmer ON procurement_records(farmer_id);
CREATE INDEX idx_payments_farmer_status ON payments(farmer_id, payment_status);
```
