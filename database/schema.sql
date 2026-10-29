-- HealthNest Database Schema
-- Compatible with MySQL (XAMPP Server)

CREATE DATABASE IF NOT EXISTS healthnest_db;
USE healthnest_db;

-- Drop tables if they already exist (reverse dependency order)
DROP TABLE IF EXISTS qr_access;
DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS health_records;
DROP TABLE IF EXISTS hospitals;
DROP TABLE IF EXISTS providers;
DROP TABLE IF EXISTS users;

-- 1. users Table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NULL,
    password_hash VARCHAR(255) NULL,
    date_of_birth DATE NULL,
    gender VARCHAR(20) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    blood_group VARCHAR(10) NULL,
    profile_image_url VARCHAR(500) NULL,
    emergency_contact VARCHAR(15) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. providers Table
CREATE TABLE providers (
    provider_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    mobile VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NULL,
    password_hash VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) DEFAULT 'healthcare_provider',
    clinic_name VARCHAR(150) NULL,
    city VARCHAR(100) NULL,
    state VARCHAR(100) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. health_records Table
CREATE TABLE health_records (
    record_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    record_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_health_records_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3b. health_record_attachments Table
CREATE TABLE health_record_attachments (
    attachment_id INT AUTO_INCREMENT PRIMARY KEY,
    record_id INT NOT NULL,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_attachment_record FOREIGN KEY (record_id) REFERENCES health_records(record_id) ON DELETE CASCADE,
    CONSTRAINT fk_hr_attachment_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. documents Table
CREATE TABLE documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(200) NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 5. vaccinations Table
CREATE TABLE vaccinations (
    vaccination_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vaccine_name VARCHAR(150) NOT NULL,
    vaccination_date DATE NOT NULL,
    next_due_date DATE NULL,
    notes TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vaccinations_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. qr_access Table
CREATE TABLE qr_access (
    access_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider_id INT NULL,
    access_token VARCHAR(255) UNIQUE NOT NULL,
    permission VARCHAR(30) DEFAULT 'view',
    expires_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_access_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_qr_access_provider FOREIGN KEY (provider_id) REFERENCES providers(provider_id) ON DELETE SET NULL
);

-- 7. hospitals Table
CREATE TABLE hospitals (
    hospital_id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NULL,
    sub_district VARCHAR(100) NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(10) NULL,
    hospital_type VARCHAR(50) NULL,
    phone VARCHAR(20) NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    pmjay_status BOOLEAN DEFAULT FALSE,
    verified_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
