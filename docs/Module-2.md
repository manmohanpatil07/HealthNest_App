# Module-2: Healthcare Provider Module

## 1. Module Purpose

The Healthcare Provider Module allows a healthcare provider, representing the MVP's Doctor / Clinic Staff role, to securely log in, scan a patient's QR health access code, verify authorization through the backend, and view only the patient information that has been authorized for access. The provider is primarily read-only in this MVP and can view basic patient information, blood group, emergency information, allergies if stored/shared, health records, prescriptions, and medical reports. The QR code must contain a secure access identifier/token rather than complete medical information, and the backend must validate the provider's JWT, QR token, expiry, permission, and requested resource before returning patient data. This module uses the architecture's React Native + JavaScript frontend, Node.js + Express.js backend, MySQL database, JWT/bcrypt authentication, and QR scanning flow.

## 2. Pages / Screens in this module

The Healthcare Provider Module contains the following screens:

1. `LoginScreen.js`
2. `ProviderDashboardScreen.js`
3. `ScanQRScreen.js`
4. `PatientDetailsScreen.js`

### Screen navigation flow

```text
Healthcare Provider
        |
        v
LoginScreen.js
        |
        v
ProviderDashboardScreen.js
        |
        v
ScanQRScreen.js
        |
        v
QR Access Token
        |
        v
Backend Authorization
        |
        v
PatientDetailsScreen.js
        |
        v
Read-only Patient Information
```

`LoginScreen.js` is shared by the authentication flow and is used by the Healthcare Provider role for login. The provider-specific screens are located under:

```text
mobile/src/screens/provider/
```

as defined in the architecture.

---

## 3. For each screen: what data is shown, what actions the user can take

### 3.1 LoginScreen.js

#### Data shown

The provider login screen should show:

- Mobile number or email used for provider login
- Password
- Login button
- Error message area
- Loading state while authentication is in progress

After successful login, the backend returns a JWT and the provider role.

Example authentication response:

```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "role": "healthcare_provider",
  "userId": 101
}
```

The exact response should follow the authentication architecture, with the provider role returned for role-based navigation.

#### Actions

The provider can:

- Enter mobile number/email.
- Enter password.
- Click Login.
- Submit credentials to `POST /api/auth/login`.
- Receive and store the JWT after successful authentication.
- Open the Provider Dashboard after successful login.
- See an error if credentials are invalid.
- Logout later from the provider dashboard.

#### Backend security

Login must be handled by the Express backend. Passwords must not be stored as plain text. The architecture specifies bcrypt for password hashing and JWT for authenticated API requests.

---

### 3.2 ProviderDashboardScreen.js

#### Data shown

The dashboard should display:

- Provider full name
- Clinic name, when available
- Provider type
- Mobile/email information when appropriate
- City and state when available
- Scan Patient QR action
- Logout action
- Basic provider status/session information

Provider data comes from the `providers` table.

Relevant `providers` columns:

- `provider_id`
- `full_name`
- `mobile`
- `email`
- `provider_type`
- `clinic_name`
- `city`
- `state`
- `created_at`

#### Actions

The provider can:

- View provider information.
- Open `ScanQRScreen.js`.
- Scan a patient's QR code.
- Logout.
- Return to the provider dashboard after viewing patient information.

The provider dashboard should not provide patient-editing functions because the architecture states that the provider is primarily read-only in this MVP.

---

### 3.3 ScanQRScreen.js

#### Data shown

The screen should show:

- QR scanner camera view
- Scanner instructions
- Scan status
- Loading state while the token is being validated
- Error message when scanning/authorization fails
- Option to retry scanning

The QR should contain a secure access identifier/token rather than the patient's complete medical information.

The scanned value should be treated as an `access_token` and sent to the backend for validation.

#### Actions

The provider can:

1. Open the QR scanner.
2. Scan the patient's QR code.
3. Extract the QR access token.
4. Send the token to the backend.
5. Wait for backend authorization.
6. Open `PatientDetailsScreen.js` when access is valid.
7. Retry when the QR code is invalid, expired, or unauthorized.

#### Authorization flow

```text
Provider
   |
   v
Scan QR
   |
   v
QR access token
   |
   v
Express API
   |
   +--> Validate JWT
   |
   +--> Validate QR token
   |
   +--> Check expiry
   |
   +--> Check permission
   |
   v
qr_access
   |
   v
Authorized User Data
   |
   v
PatientDetailsScreen.js
```

The provider app must not directly query MySQL. All access must go through the backend API.

---

### 3.4 PatientDetailsScreen.js

#### Data shown

After successful QR authorization, the provider can view the patient information permitted by the QR access.

Possible patient information supported by the architecture includes:

#### Basic profile information

From `users`:

- `user_id`
- `full_name`
- `mobile` when appropriate
- `email` when appropriate
- `date_of_birth`
- `gender`
- `city`
- `state`
- `blood_group`
- `emergency_contact`

#### Health records

From `health_records`:

- `record_id`
- `user_id`
- `record_type`
- `title`
- `description`
- `record_date`
- `created_at`

#### Documents

From `documents`:

- `document_id`
- `user_id`
- `document_type`
- `document_name`
- `file_url`
- `uploaded_at`

Documents can include prescriptions and medical reports. The architecture specifies that the actual files are stored in cloud/file storage and only metadata plus the file URL are stored in MySQL.

#### Vaccination information

From `vaccinations`:

- `vaccination_id`
- `user_id`
- `vaccine_name`
- `vaccination_date`
- `next_due_date`
- `notes`
- `created_at`

#### QR authorization information

From `qr_access`:

- `access_id`
- `user_id`
- `provider_id`
- `access_token`
- `permission`
- `expires_at`
- `created_at`

The raw `access_token` should not be unnecessarily displayed to the provider after validation.

#### Actions

The provider can:

- View authorized patient profile information.
- View authorized health records.
- View authorized prescriptions/reports.
- View authorized vaccination information.
- Open/view a permitted document using its stored file URL.
- Return to the provider dashboard.
- Scan another patient QR.

The provider cannot:

- Edit patient profile information.
- Add patient health records.
- Delete patient health records.
- Edit patient documents.
- Delete patient documents.
- Modify vaccination records.

This keeps the provider role read-only as defined in the architecture.

---

## 4. Component List (what React components are needed)

The following reusable React Native components can be created under:

```text
mobile/src/components/
```

### Authentication components

#### `AppButton.js`

Reusable button for:

- Login
- Scan Patient QR
- Retry
- Logout
- Back/navigation actions

#### `AppInput.js`

Reusable input component for:

- Mobile/email
- Password
- Other provider form fields if required

#### `PasswordInput.js`

Password input with secure text entry and optional show/hide password action.

#### `LoadingSpinner.js`

Used while:

- Login is processing
- QR token is being validated
- Patient information is loading
- Documents are loading

#### `ErrorMessage.js`

Displays API, authentication, QR scanning, and authorization errors.

---

### Provider dashboard components

#### `ProviderProfileCard.js`

Displays:

- `full_name`
- `provider_type`
- `clinic_name`
- `city`
- `state`

#### `ProviderInfoRow.js`

Reusable row for provider information such as mobile and email.

#### `DashboardActionCard.js`

Reusable dashboard action card for:

- Scan Patient QR
- Other permitted provider actions

#### `ConfirmationDialog.js`

Used before logout.

---

### QR scanning components

#### `QRScannerView.js`

Handles the camera/scanner UI.

Responsibilities:

- Open scanner
- Detect QR
- Return scanned token
- Prevent repeated scans while processing

#### `ScanStatusMessage.js`

Shows:

- Scanning
- Validating
- Authorized
- Invalid QR
- Expired QR
- Unauthorized access

---

### Patient details components

#### `PatientProfileCard.js`

Displays authorized patient profile information.

#### `HealthRecordCard.js`

Displays one health record:

- `record_type`
- `title`
- `description`
- `record_date`

#### `DocumentCard.js`

Displays:

- `document_type`
- `document_name`
- `uploaded_at`

and provides a view/open action for the stored `file_url`.

#### `VaccinationCard.js`

Displays:

- `vaccine_name`
- `vaccination_date`
- `next_due_date`
- `notes`

#### `SectionHeader.js`

Reusable section title for:

- Patient Information
- Health Records
- Documents
- Vaccinations

#### `EmptyState.js`

Displays when the authorized patient has no available records/documents/vaccinations.

---

### Suggested provider component structure

```text
mobile/src/components/
├── AppButton.js
├── AppInput.js
├── PasswordInput.js
├── LoadingSpinner.js
├── ErrorMessage.js
├── ConfirmationDialog.js
├── ProviderProfileCard.js
├── ProviderInfoRow.js
├── DashboardActionCard.js
├── QRScannerView.js
├── ScanStatusMessage.js
├── PatientProfileCard.js
├── HealthRecordCard.js
├── DocumentCard.js
├── VaccinationCard.js
├── SectionHeader.js
└── EmptyState.js
```

---

## 5. MySQL queries needed (list the main data operations)

The provider module mainly performs authentication, provider profile retrieval, QR authorization checks, and read-only retrieval of authorized user data.

All SQL queries should use parameterized queries to prevent SQL injection.

### 5.1 Provider login lookup

Find a provider using the login identifier.

```sql
SELECT
    provider_id,
    full_name,
    mobile,
    email,
    password_hash,
    provider_type,
    clinic_name,
    city,
    state,
    created_at
FROM providers
WHERE mobile = ?
LIMIT 1;
```

If the application supports provider email login as well, the backend can use:

```sql
SELECT
    provider_id,
    full_name,
    mobile,
    email,
    password_hash,
    provider_type,
    clinic_name,
    city,
    state,
    created_at
FROM providers
WHERE email = ?
LIMIT 1;
```

The returned `password_hash` is verified using bcrypt. The password hash must not be returned to the mobile application.

---

### 5.2 Get provider profile

```sql
SELECT
    provider_id,
    full_name,
    mobile,
    email,
    provider_type,
    clinic_name,
    city,
    state,
    created_at
FROM providers
WHERE provider_id = ?
LIMIT 1;
```

---

### 5.3 Validate QR access token

The QR token must be matched against `qr_access`.

```sql
SELECT
    access_id,
    user_id,
    provider_id,
    access_token,
    permission,
    expires_at,
    created_at
FROM qr_access
WHERE access_token = ?
LIMIT 1;
```

The backend must then verify:

- The token exists.
- The token belongs to the expected provider when provider-specific authorization is used.
- `permission` allows viewing.
- `expires_at` is either `NULL` or has not expired.
- The requesting provider's JWT is valid.

---

### 5.4 Validate QR access with provider and expiry

A stronger authorization query can perform the provider and expiry checks together:

```sql
SELECT
    access_id,
    user_id,
    provider_id,
    permission,
    expires_at,
    created_at
FROM qr_access
WHERE access_token = ?
  AND provider_id = ?
  AND permission = 'view'
  AND (expires_at IS NULL OR expires_at > NOW())
LIMIT 1;
```

If this query returns no row, access should be denied.

---

### 5.5 Get authorized patient profile

After the `qr_access` record returns a valid `user_id`:

```sql
SELECT
    user_id,
    full_name,
    mobile,
    email,
    date_of_birth,
    gender,
    city,
    state,
    blood_group,
    emergency_contact,
    created_at,
    updated_at
FROM users
WHERE user_id = ?
LIMIT 1;
```

Only information permitted by the application's sharing rules should be returned to the provider.

---

### 5.6 Get authorized patient health records

```sql
SELECT
    record_id,
    user_id,
    record_type,
    title,
    description,
    record_date,
    created_at
FROM health_records
WHERE user_id = ?
ORDER BY record_date DESC, created_at DESC;
```

This operation is read-only for the provider.

---

### 5.7 Get authorized patient documents

```sql
SELECT
    document_id,
    user_id,
    document_type,
    document_name,
    file_url,
    uploaded_at
FROM documents
WHERE user_id = ?
ORDER BY uploaded_at DESC;
```

The provider can view permitted prescriptions/reports, but cannot modify their database records.

---

### 5.8 Get authorized patient vaccinations

```sql
SELECT
    vaccination_id,
    user_id,
    vaccine_name,
    vaccination_date,
    next_due_date,
    notes,
    created_at
FROM vaccinations
WHERE user_id = ?
ORDER BY vaccination_date DESC, created_at DESC;
```

---

### 5.9 Get all authorized patient data

For the patient details API, the backend can perform separate queries for:

```text
1. users
2. health_records
3. documents
4. vaccinations
```

The backend should first validate `qr_access` and obtain the authorized `user_id`. Only after successful authorization should these queries run.

---

### 5.10 Provider write operations

The provider module should not perform patient-data INSERT, UPDATE, or DELETE operations in this MVP.

There is therefore no provider-side query such as:

```text
INSERT INTO health_records
UPDATE health_records
DELETE FROM health_records
INSERT INTO documents
UPDATE documents
DELETE FROM documents
INSERT INTO vaccinations
UPDATE vaccinations
DELETE FROM vaccinations
```

Patient data management remains on the user side.

---

### 5.11 Main provider API operations

The SQL operations above support APIs such as:

```text
POST /api/auth/login
GET /api/provider/profile
GET /api/provider/patient/:id
```

For QR-based access, the preferred flow is:

```text
POST /api/provider/scan-qr
```

with the scanned `access_token` sent to the backend.

The backend should then:

```text
JWT validation
    ↓
Provider role validation
    ↓
QR token validation
    ↓
Expiry validation
    ↓
Permission validation
    ↓
Find user_id
    ↓
Read authorized patient data
```

---

## 6. Validation rules

### 6.1 Provider login validation

#### Mobile

- Required when mobile login is used.
- Must contain a valid mobile number format.
- Must not exceed the `VARCHAR(15)` database limit.
- Provider mobile must be unique in `providers`.

#### Email

- Optional because `providers.email` is nullable.
- If supplied, validate basic email format.
- Must be unique in `providers`.

#### Password

- Required for password login.
- Never store plain-text passwords.
- Compare the entered password with `password_hash` using bcrypt.
- Never send `password_hash` to the mobile application.

---

### 6.2 Provider identity validation

Every protected provider API request must:

1. Receive a JWT.
2. Verify the JWT signature.
3. Verify that the identity is valid.
4. Verify the role is `healthcare_provider`.
5. Confirm the provider exists in `providers`.
6. Continue only when authorization succeeds.

Frontend screen hiding alone is not sufficient for security.

---

### 6.3 QR token validation

The scanned QR value must:

- Be present.
- Be treated as an access token.
- Match `qr_access.access_token`.
- Be associated with a valid `user_id`.
- Have permitted `permission`.
- Not be expired when `expires_at` is set.
- Be used by an authenticated healthcare provider.
- Respect the provider relationship represented by `provider_id`.

The complete medical information must never be stored directly inside the QR code.

---

### 6.4 Patient data validation

Before returning patient data:

- Confirm the patient exists in `users`.
- Confirm the QR authorization is valid.
- Return only authorized information.
- Do not expose unrelated users' records.
- Ensure all `health_records`, `documents`, and `vaccinations` queries use the authorized `user_id`.

---

### 6.5 Document validation

For documents returned to the provider:

- Verify that the document belongs to the authorized `user_id`.
- Do not expose documents belonging to another user.
- Use the stored `file_url`.
- Do not allow the provider to modify or delete the document.
- If the file cannot be opened, show an error instead of crashing the app.

---

### 6.6 Read-only provider validation

The backend must reject provider attempts to:

- Create patient health records.
- Update patient health records.
- Delete patient health records.
- Create patient documents.
- Update patient documents.
- Delete patient documents.
- Create patient vaccinations.
- Update patient vaccinations.
- Delete patient vaccinations.
- Update patient profile information.

This restriction must be enforced by backend authorization, not only by hiding buttons in React Native.

---

## 7. Edge cases to handle

### Authentication edge cases

1. Wrong mobile/email or password.
2. Provider account does not exist.
3. Provider JWT is missing.
4. Provider JWT is expired.
5. Provider JWT is invalid.
6. JWT role is not `healthcare_provider`.
7. Provider record has been removed after login.
8. Network failure during login.
9. Backend unavailable.
10. Multiple login attempts.

### QR scanning edge cases

1. QR code is unreadable.
2. QR code contains invalid data.
3. QR code does not contain a valid `access_token`.
4. QR token does not exist in `qr_access`.
5. QR token has expired.
6. QR token has `permission` that does not allow viewing.
7. QR token belongs to another provider when provider-specific authorization is required.
8. QR token belongs to a user that no longer exists.
9. Camera permission is denied.
10. Camera is unavailable.
11. Same QR is scanned repeatedly.
12. Provider navigates away while token validation is in progress.
13. Network failure occurs after scanning.
14. Backend returns an authorization error.

### Patient data edge cases

1. Patient profile exists but some optional fields are `NULL`.
2. Patient has no health records.
3. Patient has no documents.
4. Patient has no vaccination records.
5. A health record contains a `NULL` description.
6. A document file URL is unavailable or broken.
7. A patient has many health records and the screen becomes too long.
8. A patient has many documents.
9. A patient has many vaccination records.
10. Patient data is partially unavailable because of a backend/database error.
11. Provider tries to access a patient without valid QR authorization.
12. Provider tries to access another user's data by changing an ID manually.

### Privacy and security edge cases

1. Do not put complete medical data in the QR code.
2. Do not return `password_hash`.
3. Do not trust a `user_id` supplied by the mobile app without validating authorization.
4. Do not allow a provider to bypass QR authorization by directly calling patient APIs.
5. Do not allow a provider to access another user's documents using a guessed `document_id`.
6. Expired QR access must be rejected.
7. Invalid or missing JWT must be rejected.
8. Role checks must be performed on the backend.
9. Sensitive API responses should be sent only over HTTPS.
10. Avoid logging full access tokens or sensitive patient information unnecessarily.

### UI edge cases

1. Loading spinner while API requests are running.
2. Empty state when no records are available.
3. Retry option after network errors.
4. Back navigation after patient details.
5. Screen should remain usable on small Android displays.
6. Long patient names and clinic names should not break the layout.
7. Long document names should be truncated safely.
8. Dates should be displayed consistently.
9. Scanner should stop after a successful scan to avoid duplicate API calls.
10. Logout should clear the local authentication state/token.

---

## 8. Build order (what to build first inside this module)

Build the Healthcare Provider Module in the following order.

### Step 1 — Provider authentication foundation

Build:

```text
LoginScreen.js
AuthContext.js
authService.js
api.js
```

Implement:

- Provider login UI.
- `POST /api/auth/login`.
- JWT handling.
- bcrypt password verification.
- Role returned by backend.
- Provider session storage.
- Logout.

Goal:

```text
Provider → Login → JWT → Provider session
```

---

### Step 2 — Backend authentication and role middleware

Build/verify:

```text
backend/src/middleware/authMiddleware.js
backend/src/middleware/roleMiddleware.js
```

Implement:

- JWT verification.
- Provider identity extraction.
- `healthcare_provider` role enforcement.
- Unauthorized response handling.

Goal:

```text
JWT
 ↓
authMiddleware
 ↓
roleMiddleware
 ↓
healthcare_provider
```

---

### Step 3 — Provider profile API

Build:

```text
ProviderDashboardScreen.js
```

Implement:

- Provider profile API.
- Provider information query from `providers`.
- Provider profile card.
- Logout button.
- Scan Patient QR button.

Goal:

```text
Provider Dashboard
 ├── Provider information
 ├── Scan Patient QR
 └── Logout
```

---

### Step 4 — QR scanner

Build:

```text
ScanQRScreen.js
QRScannerView.js
ScanStatusMessage.js
```

Implement:

- Camera permission.
- QR scanning.
- Extract `access_token`.
- Prevent duplicate scans.
- Loading state.
- Error state.
- Retry action.

Goal:

```text
Camera → QR → access_token
```

---

### Step 5 — QR authorization API

Build the backend QR validation flow.

Implement:

```text
JWT validation
      ↓
Provider role validation
      ↓
access_token lookup
      ↓
provider_id validation
      ↓
permission validation
      ↓
expires_at validation
      ↓
user_id
```

Use `qr_access` with the exact architecture columns:

```text
access_id
user_id
provider_id
access_token
permission
expires_at
created_at
```

Goal:

```text
Valid QR → Authorized user_id
Invalid QR → Access denied
```

---

### Step 6 — Patient profile retrieval

Build:

```text
PatientDetailsScreen.js
PatientProfileCard.js
```

Retrieve authorized patient data from `users`.

Display only information allowed by the application's authorization rules.

Goal:

```text
QR authorization
      ↓
user_id
      ↓
users
      ↓
Patient Profile
```

---

### Step 7 — Health records display

Build:

```text
HealthRecordCard.js
```

Retrieve data from `health_records`.

Implement:

- List records.
- Sort newest first.
- Empty state.
- Read-only display.

Goal:

```text
Authorized user_id
      ↓
health_records
      ↓
Read-only Health Records
```

---

### Step 8 — Documents and prescriptions/reports

Build:

```text
DocumentCard.js
```

Retrieve data from `documents`.

Implement:

- Document list.
- Document type.
- Document name.
- Upload date.
- Open/view action using `file_url`.
- File error handling.

Remember:

```text
Actual file → Cloud/File Storage
Metadata + file_url → MySQL documents
```

---

### Step 9 — Vaccination information

Build:

```text
VaccinationCard.js
```

Retrieve data from `vaccinations`.

Display:

- Vaccine name.
- Vaccination date.
- Next due date.
- Notes.

Keep the provider view read-only.

---

### Step 10 — Complete patient details screen

Combine:

```text
PatientProfileCard
        ↓
Health Records
        ↓
Documents
        ↓
Vaccinations
```

Add:

- Section headers.
- Loading states.
- Empty states.
- Error handling.
- Back button.
- Scan Another Patient action.

---

### Step 11 — Security testing

Test the backend with Postman.

Verify:

```text
Valid provider JWT + valid QR
        → Access allowed

Invalid JWT
        → Access denied

User JWT + provider endpoint
        → Access denied

Expired QR
        → Access denied

Wrong provider_id
        → Access denied

Invalid access_token
        → Access denied

Valid QR but non-view permission
        → Access denied
```

Also test that a provider cannot directly access another user's data by changing IDs.

---

### Step 12 — UI and integration testing

Test the complete flow on Android Emulator or a physical Android device:

```text
Provider Login
      ↓
Provider Dashboard
      ↓
Scan Patient QR
      ↓
QR Validation
      ↓
Patient Details
      ├── Profile
      ├── Health Records
      ├── Documents
      └── Vaccinations
```

Finally verify:

- Navigation works.
- Loading states work.
- Error messages work.
- Camera permission works.
- QR scanning works.
- Unauthorized access is blocked.
- Patient information is read-only.
- Logout clears the provider session.

---

## Final Module Structure

```text
mobile/
└── src/
    ├── screens/
    │   ├── auth/
    │   │   └── LoginScreen.js
    │   │
    │   └── provider/
    │       ├── ProviderDashboardScreen.js
    │       ├── ScanQRScreen.js
    │       └── PatientDetailsScreen.js
    │
    ├── components/
    │   ├── AppButton.js
    │   ├── AppInput.js
    │   ├── PasswordInput.js
    │   ├── LoadingSpinner.js
    │   ├── ErrorMessage.js
    │   ├── ConfirmationDialog.js
    │   ├── ProviderProfileCard.js
    │   ├── ProviderInfoRow.js
    │   ├── DashboardActionCard.js
    │   ├── QRScannerView.js
    │   ├── ScanStatusMessage.js
    │   ├── PatientProfileCard.js
    │   ├── HealthRecordCard.js
    │   ├── DocumentCard.js
    │   ├── VaccinationCard.js
    │   ├── SectionHeader.js
    │   └── EmptyState.js
    │
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   └── qrService.js
    │
    └── context/
        └── AuthContext.js

backend/
└── src/
    ├── controllers/
    ├── routes/
    ├── middleware/
    │   ├── authMiddleware.js
    │   └── roleMiddleware.js
    ├── models/
    ├── services/
    └── config/
        └── database.js
```

## Architecture Constraints for Module 2

This module must remain within the architecture defined in `ARCHITECTURE.md`:

- Frontend: React Native + JavaScript.
- Navigation: React Navigation.
- API communication: Axios.
- Backend: Node.js + Express.js + JavaScript.
- Database: MySQL.
- Authentication: JWT + bcrypt + HTTPS.
- QR: secure access identifier/token.
- Provider role: Doctor / Clinic Staff represented by the single `healthcare_provider` role.
- Provider access: primarily read-only.
- Patient information: returned only after backend authorization.
- No separate Doctor login.
- No separate Hospital login.
- No Admin login.
- No direct provider-to-MySQL access.
- No full medical data inside the QR code.
- No provider-side patient record modification in this MVP.

The module should stay within this architecture unless a later requirement specifically requires an additional technology.


---

## Expo Implementation Notes

- The mobile frontend uses **Expo + React Native + JavaScript**, not React Native CLI.
- Keep `LoginScreen.js` shared with the existing authentication flow and preserve all Module 1 functionality.
- Keep React Navigation; do not introduce Expo Router.
- Use `npx expo install` for Expo SDK/native packages and verify packages against the chosen Expo SDK.
- Camera/QR scanning must use a package compatible with Expo. Use Expo Go only if the chosen scanner is supported; otherwise use an Expo development build.
- Start with `npx expo start`; use `npx expo run:android` when a local native development build is required.
- Do not change provider authorization, the `providers`/`qr_access` schema, or the provider's read-only permissions.
- Follow `EXPO_SETUP_AND_TESTING.md` for the project setup and test sequence.
