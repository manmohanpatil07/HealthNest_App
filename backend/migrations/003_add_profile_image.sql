-- ====================================================================
-- HealthNest: Non-destructive migration for User Profile Image
-- Module 1: User Profile - Profile Picture URL Field
-- ====================================================================

-- 1. Add optional profile_image_url column if not exists
ALTER TABLE users
ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER blood_group;

