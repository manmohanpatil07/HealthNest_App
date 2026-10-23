# HealthNest — Technical Architecture

## 1. Tech Stack

The project is a mobile-first digital health application with three modules: User, Healthcare Provider, and Hospital Finder. The architecture is intentionally simple and student-friendly.

### Frontend — Expo + React Native + JavaScript
- Expo and Expo CLI for development/build commands
- React Native
- JavaScript only (no TypeScript)
- React Navigation
- Axios

Expo is the framework and development toolchain for the React Native mobile app. Use Expo-compatible package versions and `npx expo install` for Expo SDK/native packages. Keep React Navigation; do not introduce Expo Router. Do not use Vite for the native mobile application.

Use:
- `npx expo start` to start the development server.
- Expo Go for early UI testing when every required package is supported.
- `npx expo run:android` or a development build when the project needs a custom native Android application or native dependencies not available in Expo Go.

A standard Expo project may use Continuous Native Generation (CNG) and may not contain an `android/` directory until a native project is generated. Do not manually create or delete native folders without a specific need.

### Backend — Node.js + Express.js
- Node.js
- Express.js
- JavaScript
- REST API

The backend handles authentication, role checks, health-record CRUD, documents, vaccinations, QR access, hospital data, and authorization.

### Database — MySQL
- MySQL
- XAMPP SERVER

MySQL is suitable because the project contains structured relational data such as users, health records, vaccinations, providers, and hospitals.

### Authentication
- JWT
- bcrypt
- HTTPS

Passwords must never be stored as plain text. JWT is used for authenticated API requests, and bcrypt is used for password hashing.

### QR Code
The QR code should contain a secure access identifier/token rather than complete medical information. The backend validates the token and authorization before returning patient data.

### Medical Document Storage
Store actual prescription/report files in cloud/file storage (for example, Cloudinary or Firebase Storage). Store only metadata and the file URL in MySQL.

### Hospital Location
Use device location, latitude/longitude, and a map/directions service. Display hospital name, address, approximate distance, PM-JAY status, phone number when available, and directions. Only mark PM-JAY status as verified when supported by a trusted source.

### Development Tools
- Google Antigravity IDE
- Git and GitHub
- XAMPP Server
- Postman
- Android Studio
- Android Emulator or physical Android device

---

## 2. Folder Structure

```text
HealthNest/
├── mobile/
│   ├── app.json
│   ├── babel.config.js
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── screens/
│   │   │   ├── auth/
│   │   │   │   ├── LoginScreen.js
│   │   │   │   ├── RegisterScreen.js
│   │   │   │   └── OTPVerificationScreen.js
│   │   │   ├── user/
│   │   │   │   ├── DashboardScreen.js
│   │   │   │   ├── ProfileScreen.js
│   │   │   │   ├── HealthRecordsScreen.js
│   │   │   │   ├── DocumentsScreen.js
│   │   │   │   ├── VaccinationScreen.js
│   │   │   │   ├── QRHealthCardScreen.js
│   │   │   │   └── SettingsScreen.js
│   │   │   ├── provider/
│   │   │   │   ├── ProviderDashboardScreen.js
│   │   │   │   ├── ScanQRScreen.js
│   │   │   │   └── PatientDetailsScreen.js
│   │   │   └── hospitals/
│   │   │       ├── HospitalFinderScreen.js
│   │   │       └── HospitalDetailsScreen.js
│   │   ├── navigation/
│   │   │   ├── AppNavigator.js
│   │   │   ├── AuthNavigator.js
│   │   │   └── MainNavigator.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── healthRecordService.js
│   │   │   ├── vaccinationService.js
│   │   │   ├── documentService.js
│   │   │   ├── qrService.js
│   │   │   └── hospitalService.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── utils/
│   │   └── constants/
│   ├── App.js
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/database.js
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── roleMiddleware.js
│   │   ├── models/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── server.js
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── .gitignore
└── README.md
```

---

## 3. Database Schema

### users

| Column | Type | Constraints |
|---|---|---|
| user_id | INT | PK, AUTO_INCREMENT |
| full_name | VARCHAR(100) | NOT NULL |
| mobile | VARCHAR(15) | UNIQUE, NOT NULL |
| email | VARCHAR(150) | UNIQUE, NULL |
| password_hash | VARCHAR(255) | NULL |
| date_of_birth | DATE | NULL |
| gender | VARCHAR(20) | NULL |
| city | VARCHAR(100) | NULL |
| state | VARCHAR(100) | NULL |
| blood_group | VARCHAR(10) | NULL |
| emergency_contact | VARCHAR(15) | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Relationships: users 1:N health_records, documents, vaccinations, and qr_access.

### providers

A provider represents the simple MVP's Doctor / Clinic Staff role.

| Column | Type | Constraints |
|---|---|---|
| provider_id | INT | PK, AUTO_INCREMENT |
| full_name | VARCHAR(100) | NOT NULL |
| mobile | VARCHAR(15) | UNIQUE, NOT NULL |
| email | VARCHAR(150) | UNIQUE, NULL |
| password_hash | VARCHAR(255) | NOT NULL |
| provider_type | VARCHAR(50) | DEFAULT 'healthcare_provider' |
| clinic_name | VARCHAR(150) | NULL |
| city | VARCHAR(100) | NULL |
| state | VARCHAR(100) | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### health_records

| Column | Type | Constraints |
|---|---|---|
| record_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users.user_id |
| record_type | VARCHAR(50) | NOT NULL |
| title | VARCHAR(150) | NOT NULL |
| description | TEXT | NULL |
| record_date | DATE | NOT NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Relationship: users 1:N health_records.

### documents

| Column | Type | Constraints |
|---|---|---|
| document_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users.user_id |
| document_type | VARCHAR(50) | NOT NULL |
| document_name | VARCHAR(200) | NOT NULL |
| file_url | TEXT | NOT NULL |
| uploaded_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Relationship: users 1:N documents.

### vaccinations

| Column | Type | Constraints |
|---|---|---|
| vaccination_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users.user_id |
| vaccine_name | VARCHAR(150) | NOT NULL |
| vaccination_date | DATE | NOT NULL |
| next_due_date | DATE | NULL |
| notes | TEXT | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Relationship: users 1:N vaccinations.

### qr_access

| Column | Type | Constraints |
|---|---|---|
| access_id | INT | PK, AUTO_INCREMENT |
| user_id | INT | FK → users.user_id |
| provider_id | INT | FK → providers.provider_id |
| access_token | VARCHAR(255) | UNIQUE, NOT NULL |
| permission | VARCHAR(30) | DEFAULT 'view' |
| expires_at | DATETIME | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

Relationship: users 1:N qr_access N:1 providers.

### hospitals

Hospitals do not have their own login in this MVP.

| Column | Type | Constraints |
|---|---|---|
| hospital_id | INT | PK, AUTO_INCREMENT |
| hospital_name | VARCHAR(200) | NOT NULL |
| address | TEXT | NOT NULL |
| city | VARCHAR(100) | NOT NULL |
| state | VARCHAR(100) | NOT NULL |
| pincode | VARCHAR(10) | NULL |
| hospital_type | VARCHAR(50) | NULL |
| phone | VARCHAR(20) | NULL |
| latitude | DECIMAL(10,8) | NULL |
| longitude | DECIMAL(11,8) | NULL |
| pmjay_status | BOOLEAN | DEFAULT FALSE |
| verified_at | DATETIME | NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### Relationship Overview

```text
users
 ├──< health_records
 ├──< documents
 ├──< vaccinations
 └──< qr_access >── providers

hospitals (independent)
```

---

## 4. User Roles and Auth

The MVP has exactly two login roles: **User** and **Healthcare Provider**.

### User
- Register/login
- Manage profile
- Add/view health records
- Upload/view documents
- Manage vaccination records
- Generate/display QR health access
- Find PM-JAY empanelled hospitals
- Logout

### Healthcare Provider
The provider represents a doctor/clinic staff member.
- Login
- Provider dashboard
- Scan patient QR
- Verify authorized access
- View authorized patient information
- View authorized health records
- View authorized prescriptions/reports

The provider is primarily read-only in this MVP.

### No Admin Login
The demonstrated MVP has no Admin login, Hospital login, separate Doctor login, separate Laboratory login, or separate Pharmacist login.

### Authentication Flow

```text
User/Provider
      ↓
Login Screen
      ↓
POST /api/auth/login
      ↓
Express Backend
      ↓
Check credentials → MySQL
      ↓
Password verification
      ↓
Generate JWT
      ↓
Return JWT + role
      ↓
Mobile App
```

Example response:

```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "role": "user",
  "userId": 101
}
```

### Role Enforcement

Role enforcement must happen on the backend, not only in the mobile UI.

```text
JWT
 ↓
authMiddleware
 ↓
Extract identity
 ↓
roleMiddleware
 ├── user
 └── healthcare_provider
```

Example API rules:

```text
GET /api/user/profile
→ user only

POST /api/health-records
→ user only

GET /api/provider/patient/:id
→ healthcare_provider only

GET /api/hospitals
→ authenticated user
```

The backend must verify that the JWT is valid, the identity is valid, the role is permitted, and the user/provider has permission to access the requested resource.

---

## 5. Module List

### 5.1 Authentication Module
- Login
- Register
- OTP Verification
- Logout

### 5.2 User Module

**Dashboard:** health summary, recent records, upcoming vaccination, QR access, Hospital Finder shortcut.

**My Profile:** full name, mobile, email, date of birth, gender, city, state, blood group, emergency contact.

**Health Records:** add, view, delete, categorize records, and view medical history.

**Documents:** upload prescriptions and medical reports; view/download documents.

**Vaccination:** add vaccination, view history, store next due date, display upcoming vaccination.

**My QR Health Card:** generate/display QR, share selected information, and allow authorized provider access.

**Settings:** profile settings, language settings, logout.

### 5.3 Healthcare Provider Module

**Provider Dashboard:** provider profile, scan patient QR, view authorized patient information.

**Scan Patient QR:** open scanner → scan QR → send token → validate token → check authorization → display permitted information.

**Patient Details:** basic information, blood group, emergency information, allergies if stored/shared, health records, prescriptions, and medical reports.

The provider does not directly modify patient records in the MVP.

### 5.4 Hospital Finder Module

Available from the user side and does not require a separate hospital account.

**Hospital Finder:** detect/select location, search nearby hospitals, filter PM-JAY empanelled hospitals, display hospital list, display approximate distance.

**Hospital Details:** hospital name, address, hospital type, PM-JAY status, phone number if available, and directions.

---

## 6. Key Data Flows

### 6.1 Flow 1 — User Stores and Manages Health Information

```text
User
 ↓ Login
User Dashboard
 ↓
Health Records
 ↓ Add Record
React Native
 ↓ POST /api/health-records
Express.js
 ↓ Validate JWT
Authorization
 ↓
MySQL
 ↓ Save record
Response
 ↓
React Native
 ↓
Updated Health Records
```

For documents:

```text
User
 ↓
Upload Prescription/Report
 ↓
Mobile App
 ↓
File Storage
 └── File URL
       ↓
Express API
       ↓
MySQL documents table
       ↓
User can view/download document
```

### 6.2 Flow 2 — Provider Scans Patient QR

```text
Patient
 ↓ Displays QR
Healthcare Provider
 ↓ Scan QR
Mobile App
 ↓ QR access token
Express API
 ↓ Validate JWT
 ↓ Validate QR token
 ↓ Check expiry
 ↓ Check permission
qr_access
 ↓
Authorized User Data
 ├── Profile
 ├── Health Records
 ├── Documents
 └── Vaccinations
 ↓
Provider App
 ↓
Read-only Patient View
```

The QR should not contain the complete medical history. It should contain a secure access token that the backend validates.

### 6.3 Flow 3 — User Finds a PM-JAY Empanelled Hospital

```text
User
 ↓
Hospital Finder
 ↓
Get Current Location OR Select City/Area
 ↓
Hospital API / Database
 ↓
Find nearby hospitals
 ↓
Filter PM-JAY status
 ↓
Hospital List
 ├── Hospital Name
 ├── Distance
 ├── Address
 └── PM-JAY Status
 ↓
Hospital Details
 ├── Call
 └── Directions
```

Example API:

```text
GET /api/hospitals?latitude=19.07&longitude=72.87
```

Example response:

```json
[
  {
    "hospitalId": 1,
    "hospitalName": "Example Hospital",
    "address": "Example Address",
    "distance": 3.2,
    "pmjayStatus": true
  }
]
```

---

# Architecture Summary

```text
                    MOBILE APPLICATION
                React Native + JavaScript
                         │
             ┌───────────┴───────────┐
             │                       │
        User Module          Provider Module
             │                       │
             └───────────┬───────────┘
                         │
                    REST API
                         │
                         ▼
                 Node.js + Express
                         │
              ┌──────────┼──────────┐
              │          │          │
              ▼          ▼          ▼
          Auth API   Health API  Hospital API
              │          │          │
              └──────────┼──────────┘
                         │
                         ▼
                       MySQL
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
       User Health Data       Hospital Data

                 + Cloud File Storage
                 for prescriptions/reports
```

## Final Technology Decision

- **Frontend:** Expo + React Native + JavaScript
- **Backend:** Node.js + Express.js + JavaScript
- **Database:** MySQL
- **Authentication:** JWT + bcrypt
- **API:** REST API + JSON
- **QR:** QR generation + QR scanning
- **File Storage:** Cloudinary/Firebase Storage
- **Maps:** Maps SDK/API
- **Testing:** Postman
- **Version Control:** Git + GitHub

## Expo Development Commands

From the `mobile/` directory:
- `npx expo start` — start the Expo development server.
- `npx expo start --clear` — restart with Metro's cache cleared.
- `npx expo-doctor` — check Expo configuration and dependency compatibility.
- `npx expo run:android` — build/run a local Android development app when required.
- `npx expo install <package>` — install a package at a version compatible with the installed Expo SDK.

Keep the backend as Node.js + Express.js and the database as MySQL through XAMPP. Expo changes the mobile development workflow; it does not replace the backend or database.

The project should remain within this architecture unless a later requirement specifically requires an additional technology.
