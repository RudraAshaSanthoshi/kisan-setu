-- ============================================================================
-- KisanSetu Seed / Demo Data Script
-- SIH Problem Statement ID: 26032
-- Description: Fictional benchmark crops, MSP rates, procurement centres, & initial capacity logs.
-- IMPORTANT: This seed data is strictly for prototype demonstration & evaluation purposes.
-- ============================================================================

-- 1. SEED MASTER CROPS (Official MSP Benchmarks for 2024-2025 Kharif & Rabi)
INSERT INTO public.crops (id, crop_code, name_en, name_hi, season, msp_per_quintal, max_moisture_percentage, is_active)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'WHEAT_2025', 'Wheat (Gehun)', 'गेहूं', 'Rabi', 2275.00, 14.00, TRUE),
    ('c1000000-0000-0000-0000-000000000002', 'PADDY_GRADE_A', 'Paddy Grade A (Dhan)', 'धान ग्रेड-ए', 'Kharif', 2203.00, 17.00, TRUE),
    ('c1000000-0000-0000-0000-000000000003', 'MUSTARD_2025', 'Mustard (Sarson)', 'सरसों', 'Rabi', 5650.00, 8.00, TRUE),
    ('c1000000-0000-0000-0000-000000000004', 'GRAM_2025', 'Gram (Chana)', 'चना', 'Rabi', 5440.00, 10.00, TRUE),
    ('c1000000-0000-0000-0000-000000000005', 'MAIZE_2025', 'Maize (Makka)', 'मक्का', 'Kharif', 2090.00, 15.00, TRUE)
ON CONFLICT (crop_code) DO UPDATE SET
    msp_per_quintal = EXCLUDED.msp_per_quintal,
    updated_at = NOW();

-- 2. SEED PROCUREMENT CENTRES (Punjab Mandis)
INSERT INTO public.procurement_centres (id, centre_code, name, district, state, address, latitude, longitude, daily_capacity_quintals, hourly_slot_capacity, is_active)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'PB-MND-001', 'Khanna Main Grain Mandi', 'Ludhiana', 'Punjab', 'GT Road, Khanna, Ludhiana, Punjab 141401', 30.7046, 76.2230, 2500, 25, TRUE),
    ('b1000000-0000-0000-0000-000000000002', 'PB-MND-002', 'Ludhiana West Mandi', 'Ludhiana', 'Punjab', 'Ferozepur Road, Ludhiana, Punjab 141001', 30.9010, 75.8573, 1800, 18, TRUE),
    ('b1000000-0000-0000-0000-000000000003', 'PB-MND-003', 'Samrala Mandi Centre', 'Ludhiana', 'Punjab', 'Chandigarh Road, Samrala, Ludhiana, Punjab 141114', 30.8355, 76.1924, 1200, 12, TRUE),
    ('b1000000-0000-0000-0000-000000000004', 'PB-MND-004', 'Jagraon Grain Market', 'Ludhiana', 'Punjab', 'Moga Road, Jagraon, Ludhiana, Punjab 142026', 30.7845, 75.4746, 1500, 15, TRUE)
ON CONFLICT (centre_code) DO UPDATE SET
    daily_capacity_quintals = EXCLUDED.daily_capacity_quintals,
    updated_at = NOW();

-- 3. SEED INITIAL CAPACITY LOGS
INSERT INTO public.centre_capacity_logs (centre_id, log_timestamp, active_vehicles_count, hourly_throughput_quintals, estimated_wait_duration_mins, congestion_level)
VALUES
    ('b1000000-0000-0000-0000-000000000001', NOW() - INTERVAL '1 hour', 8, 220.00, 15, 'GREEN'),
    ('b1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 12, 180.00, 25, 'YELLOW'),
    ('b1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour', 4, 100.00, 10, 'GREEN');
