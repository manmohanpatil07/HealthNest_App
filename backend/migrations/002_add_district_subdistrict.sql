-- ====================================================================
-- HealthNest: Non-destructive migration for District and Sub-district
-- Module 3: Hospital Finder - Administrative Location Filters
-- ====================================================================

-- 1. Add optional district column if not exists
ALTER TABLE hospitals
ADD COLUMN district VARCHAR(100) NULL AFTER city;

-- 2. Add optional sub_district column if not exists
ALTER TABLE hospitals
ADD COLUMN sub_district VARCHAR(100) NULL AFTER district;

-- 3. Add indexing to optimize multi-level location filtering
ALTER TABLE hospitals
ADD INDEX idx_hospitals_state_district (state, district),
ADD INDEX idx_hospitals_sub_district (sub_district);

