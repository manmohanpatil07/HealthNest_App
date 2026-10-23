-- HealthNest Seed Data
-- Minimal development seed data for MySQL (XAMPP Server)

USE healthnest_db;

-- Insert sample User (password is 'Password123' bcrypt hash placeholder)
-- $2b$10$e8N8GZ.rC2fO97/N257z3e0H1jJ1Jt2N6Pj0pB1P2gXh5H4/mZ1m.
INSERT INTO users (
    user_id, full_name, mobile, email, password_hash, date_of_birth, gender, city, state, blood_group, emergency_contact
) VALUES (
    1,
    'Aarav Sharma',
    '9876543210',
    'aarav.sharma@example.com',
    '$2b$10$e8N8GZ.rC2fO97/N257z3e0H1jJ1Jt2N6Pj0pB1P2gXh5H4/mZ1m.',
    '1995-05-15',
    'Male',
    'Mumbai',
    'Maharashtra',
    'O+',
    '9876543211'
);

-- Insert sample Healthcare Provider
INSERT INTO providers (
    provider_id, full_name, mobile, email, password_hash, provider_type, clinic_name, city, state
) VALUES (
    1,
    'Dr. Priya Deshmukh',
    '9123456780',
    'dr.priya@example.com',
    '$2b$10$e8N8GZ.rC2fO97/N257z3e0H1jJ1Jt2N6Pj0pB1P2gXh5H4/mZ1m.',
    'healthcare_provider',
    'LifeCare Clinic',
    'Mumbai',
    'Maharashtra'
);

-- Insert sample Health Record for user 1
INSERT INTO health_records (
    record_id, user_id, record_type, title, description, record_date
) VALUES (
    1,
    1,
    'Checkup',
    'Routine Annual Health Examination',
    'Blood pressure normal 120/80, pulse 72. Recommended routine blood work.',
    '2026-09-10'
);

-- Insert sample Document for user 1
INSERT INTO documents (
    document_id, user_id, document_type, document_name, file_url
) VALUES (
    1,
    1,
    'Prescription',
    'Prescription_Routine_Sep2026.pdf',
    'https://res.cloudinary.com/demo/image/upload/sample_prescription.pdf'
);

-- Insert sample Vaccination for user 1
INSERT INTO vaccinations (
    vaccination_id, user_id, vaccine_name, vaccination_date, next_due_date, notes
) VALUES (
    1,
    1,
    'Tetanus Toxoid (TT)',
    '2026-01-15',
    '2036-01-15',
    'Routine booster dose administered.'
);

-- Insert sample QR Access token
INSERT INTO qr_access (
    access_id, user_id, provider_id, access_token, permission, expires_at
) VALUES (
    1,
    1,
    1,
    'token_sample_healthnest_access_demo',
    'view',
    '2026-12-31 23:59:59'
);

-- Insert sample Hospitals
INSERT INTO hospitals (
    hospital_id, hospital_name, address, city, state, pincode, hospital_type, phone, latitude, longitude, pmjay_status, verified_at
) VALUES 
(
    1,
    'City Care Multispeciality Hospital',
    '12, Central Avenue, Andheri West',
    'Mumbai',
    'Maharashtra',
    '400058',
    'General / Multispeciality',
    '+91-22-26200000',
    19.11970000,
    72.84680000,
    TRUE,
    '2026-01-01 10:00:00'
),
(
    2,
    'St. Jude Community Hospital',
    '45, Station Road, Bandra West',
    'Mumbai',
    'Maharashtra',
    '400050',
    'Charitable Trust',
    '+91-22-26400000',
    19.05960000,
    72.82950000,
    FALSE,
    NULL
);
