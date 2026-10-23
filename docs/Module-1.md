# Module 1 — User Module

## 1. Module Purpose

The User Module is the primary part of the Digital Health Application where a registered user manages basic personal and health information in one place. The module allows the user to register and log in, view a health dashboard, manage profile information, add and view health records, upload and view prescriptions and medical reports, maintain vaccination records, generate a secure QR health-access mechanism for authorized healthcare providers, find PM-JAY empanelled hospitals, and manage basic settings. The module uses the exact database structure defined in `ARCHITECTURE.md` and keeps the MVP focused on simple CRUD operations, secure authentication, authorized information sharing, and hospital discovery.

---

# 2. Pages / Screens in This Module

The User Module contains the following screens.

## 2.1 Authentication Screens

- `LoginScreen.js`
- `RegisterScreen.js`
- `OTPVerificationScreen.js`

## 2.2 User Screens

- `DashboardScreen.js`
- `ProfileScreen.js`
- `HealthRecordsScreen.js`
- `DocumentsScreen.js`
- `VaccinationScreen.js`
- `QRHealthCardScreen.js`
- `SettingsScreen.js`

## 2.3 Hospital Finder Screens

The Hospital Finder is available from the user side.

- `HospitalFinderScreen.js`
- `HospitalDetailsScreen.js`

---

# 3. Screen Details — Data and User Actions

## 3.1 LoginScreen.js

### Data shown

- Mobile number
- Password
- Login option
- OTP/login verification option where implemented
- Link/button to registration

### User actions

- Enter mobile number
- Enter password
- Request/continue with OTP where applicable
- Submit login
- Navigate to registration
- Recover/retry authentication if authentication fails

### Backend operation

```text
POST /api/auth/login
```

The backend verifies the credentials and returns a JWT and role.

---

## 3.2 RegisterScreen.js

### Data shown

The registration form should collect the fields defined in the `users` table:

- `full_name`
- `mobile`
- `email`
- `password`
- `date_of_birth`
- `gender`
- `city`
- `state`

### User actions

- Enter registration information
- Submit registration
- Continue to OTP verification where applicable
- Return to login

### Database operation

Creates a new row in `users`.

The password must be converted to `password_hash` using bcrypt before storage.

---

## 3.3 OTPVerificationScreen.js

### Data shown

- Mobile number being verified
- OTP input
- OTP verification status
- Resend OTP option
- Continue button

### User actions

- Enter OTP
- Verify OTP
- Request a new OTP
- Continue after successful verification

### Database impact

The architecture defines the `users` table but does not define a separate OTP table. Therefore, OTP storage/verification implementation is not specified by the architecture and should not introduce a new permanent database table unless the team later decides to extend the architecture.

---

## 3.4 DashboardScreen.js

### Data shown

The dashboard should provide a simple summary:

- User's `full_name`
- Basic profile/health information
- Recent health records
- Upcoming vaccination
- QR health access shortcut
- Hospital Finder shortcut

Relevant database data can come from:

- `users`
- `health_records`
- `vaccinations`

### User actions

- Open profile
- Open health records
- Open documents
- Open vaccination records
- Open QR Health Card
- Open Hospital Finder
- Open settings
- Logout

### Main queries

Retrieve the authenticated user's:

```text
users
health_records
vaccinations
```

---

## 3.5 ProfileScreen.js

### Data shown

The screen displays and edits the user's row from `users`.

| Field | Database Column |
|---|---|
| Full Name | `full_name` |
| Mobile | `mobile` |
| Email | `email` |
| Date of Birth | `date_of_birth` |
| Gender | `gender` |
| City | `city` |
| State | `state` |
| Blood Group | `blood_group` |
| Emergency Contact | `emergency_contact` |

### User actions

- View profile
- Edit profile
- Save changes

### Main database operations

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
    emergency_contact
FROM users
WHERE user_id = ?;
```

```sql
UPDATE users
SET
    full_name = ?,
    email = ?,
    date_of_birth = ?,
    gender = ?,
    city = ?,
    state = ?,
    blood_group = ?,
    emergency_contact = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```

The `mobile` field should not be changed casually because it is `UNIQUE` and is used for authentication.

---

## 3.6 HealthRecordsScreen.js

### Data shown

For each health record:

- `record_id`
- `record_type`
- `title`
- `description`
- `record_date`
- `created_at`

### User actions

- View health records
- Add health record
- View record details
- Delete health record

### Add record fields

- `record_type`
- `title`
- `description`
- `record_date`

The `user_id` must come from the authenticated user rather than from user-entered data.

### Main database operations

#### Read records

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
ORDER BY record_date DESC;
```

#### Add record

```sql
INSERT INTO health_records
(
    user_id,
    record_type,
    title,
    description,
    record_date
)
VALUES (?, ?, ?, ?, ?);
```

#### Delete record

```sql
DELETE FROM health_records
WHERE record_id = ?
AND user_id = ?;
```

The `AND user_id = ?` condition is important so one user cannot delete another user's record.

---

## 3.7 DocumentsScreen.js

### Data shown

For each document:

- `document_id`
- `document_type`
- `document_name`
- `file_url`
- `uploaded_at`

### User actions

- Upload prescription
- Upload medical report
- View document
- Download/open document

### Storage flow

The actual file should be stored in cloud/file storage.

MySQL stores:

```text
document_id
user_id
document_type
document_name
file_url
uploaded_at
```

### Main database operations

#### Read documents

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

#### Add document metadata

```sql
INSERT INTO documents
(
    user_id,
    document_type,
    document_name,
    file_url
)
VALUES (?, ?, ?, ?);
```

#### Delete document metadata

If document deletion is included in the UI:

```sql
DELETE FROM documents
WHERE document_id = ?
AND user_id = ?;
```

The cloud file should also be removed if the storage provider supports deletion.

---

## 3.8 VaccinationScreen.js

### Data shown

For each vaccination:

- `vaccination_id`
- `vaccine_name`
- `vaccination_date`
- `next_due_date`
- `notes`
- `created_at`

### User actions

- Add vaccination
- View vaccination history
- View vaccination details
- Update vaccination
- Delete vaccination
- See upcoming/next due vaccination

### Add vaccination fields

- `vaccine_name`
- `vaccination_date`
- `next_due_date`
- `notes`

### Main database operations

#### Read vaccination history

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
ORDER BY vaccination_date DESC;
```

#### Add vaccination

```sql
INSERT INTO vaccinations
(
    user_id,
    vaccine_name,
    vaccination_date,
    next_due_date,
    notes
)
VALUES (?, ?, ?, ?, ?);
```

#### Update vaccination

```sql
UPDATE vaccinations
SET
    vaccine_name = ?,
    vaccination_date = ?,
    next_due_date = ?,
    notes = ?
WHERE vaccination_id = ?
AND user_id = ?;
```

#### Delete vaccination

```sql
DELETE FROM vaccinations
WHERE vaccination_id = ?
AND user_id = ?;
```

---

## 3.9 QRHealthCardScreen.js

### Data shown

- User identity/basic information
- QR code
- QR access status
- Access expiry where applicable
- Sharing/access information

The QR should contain a secure access identifier/token rather than the user's complete medical information.

### User actions

- Generate/display QR
- Refresh/regenerate access
- Control basic sharing/access where supported
- Display the QR to a healthcare provider

### Database operations

The QR access information is stored in `qr_access`.

#### Create access record

```sql
INSERT INTO qr_access
(
    user_id,
    provider_id,
    access_token,
    permission,
    expires_at
)
VALUES (?, ?, ?, ?, ?);
```

#### Read access records

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
WHERE user_id = ?;
```

#### Revoke/delete an access record

If access revocation is implemented:

```sql
DELETE FROM qr_access
WHERE access_id = ?
AND user_id = ?;
```

### Important security rule

The QR code must not directly contain:

- Medical history
- Prescription contents
- Medical report contents
- Complete personal health information

The QR should contain the secure access token/identifier that the backend validates.

---

## 3.10 SettingsScreen.js

### Data shown

- Profile settings
- Language settings
- Logout option

### User actions

- Open/edit profile
- Select application language
- Logout

The architecture does not define a language column in `users`. Therefore, language preference should be handled as application/device state unless a future database change explicitly adds persistent language storage.

### Logout

Logout should:

1. Remove the JWT from secure local storage.
2. Clear authentication state.
3. Navigate to `LoginScreen.js`.

---

## 3.11 HospitalFinderScreen.js

### Data shown

- Hospital name
- Address
- Approximate distance
- PM-JAY status
- Available phone number

Data comes from the `hospitals` table.

### User actions

- Search hospitals
- Use current location
- Select city/area
- Filter PM-JAY hospitals
- Open hospital details
- Request directions

### Main query

For a simple city/filter search:

```sql
SELECT
    hospital_id,
    hospital_name,
    address,
    city,
    state,
    pincode,
    hospital_type,
    phone,
    latitude,
    longitude,
    pmjay_status,
    verified_at
FROM hospitals
WHERE city = ?
AND pmjay_status = TRUE
ORDER BY hospital_name ASC;
```

Nearby-distance calculation can be handled by the backend/service using `latitude` and `longitude`.

---

## 3.12 HospitalDetailsScreen.js

### Data shown

- `hospital_name`
- `address`
- `city`
- `state`
- `pincode`
- `hospital_type`
- `phone`
- `latitude`
- `longitude`
- `pmjay_status`
- `verified_at`

### User actions

- View hospital information
- Call hospital when `phone` is available
- Open directions using `latitude` and `longitude`
- Return to hospital list

### Main query

```sql
SELECT
    hospital_id,
    hospital_name,
    address,
    city,
    state,
    pincode,
    hospital_type,
    phone,
    latitude,
    longitude,
    pmjay_status,
    verified_at
FROM hospitals
WHERE hospital_id = ?;
```

---

# 4. Component List

The following reusable React Native components should be created inside:

```text
mobile/src/components/
```

## 4.1 Common Components

### `AppButton.js`

Used for:
- Save
- Add
- Delete
- Login
- Register
- Continue
- Search

### `AppInput.js`

Reusable text input with:
- Label
- Placeholder
- Error message
- Required indicator

### `LoadingSpinner.js`

Used while:
- API requests are running
- Records are loading
- Documents are uploading
- Hospital data is loading

### `ErrorMessage.js`

Displays API/network/validation errors.

### `EmptyState.js`

Used when:
- No health records exist
- No documents exist
- No vaccinations exist
- No hospitals are found

### `ConfirmationDialog.js`

Used before destructive operations such as deleting a health record or vaccination.

---

## 4.2 User Components

### `HealthSummaryCard.js`

Shows a compact dashboard health summary.

### `HealthRecordCard.js`

Displays:
- `record_type`
- `title`
- `record_date`

### `DocumentCard.js`

Displays:
- `document_type`
- `document_name`
- `uploaded_at`

### `VaccinationCard.js`

Displays:
- `vaccine_name`
- `vaccination_date`
- `next_due_date`

### `ProfileField.js`

Displays a profile field and its value.

### `QRCard.js`

Displays the user's QR code and access information.

---

## 4.3 Hospital Components

### `HospitalCard.js`

Displays:
- `hospital_name`
- Address
- Distance
- `pmjay_status`

### `HospitalStatusBadge.js`

Displays the PM-JAY status.

### `HospitalSearchBar.js`

Allows hospital search/filter input.

### `LocationButton.js`

Requests/uses device location.

---

## 4.4 Authentication Components

### `PasswordInput.js`

Password field with secure text entry.

### `OTPInput.js`

OTP entry component.

### `AuthLoadingOverlay.js`

Loading state during authentication.

---

# 5. MySQL Queries Needed

This section lists the main database operations required by the User Module.

## 5.1 Users

### Create user

```sql
INSERT INTO users
(
    full_name,
    mobile,
    email,
    password_hash,
    date_of_birth,
    gender,
    city,
    state
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);
```

### Find user by mobile

```sql
SELECT *
FROM users
WHERE mobile = ?;
```

### Find user by ID

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
WHERE user_id = ?;
```

### Update user

```sql
UPDATE users
SET
    full_name = ?,
    email = ?,
    date_of_birth = ?,
    gender = ?,
    city = ?,
    state = ?,
    blood_group = ?,
    emergency_contact = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = ?;
```

---

## 5.2 Health Records

### Create

```sql
INSERT INTO health_records
(
    user_id,
    record_type,
    title,
    description,
    record_date
)
VALUES (?, ?, ?, ?, ?);
```

### Read

```sql
SELECT *
FROM health_records
WHERE user_id = ?
ORDER BY record_date DESC;
```

### Read one record

```sql
SELECT *
FROM health_records
WHERE record_id = ?
AND user_id = ?;
```

### Delete

```sql
DELETE FROM health_records
WHERE record_id = ?
AND user_id = ?;
```

---

## 5.3 Documents

### Create metadata

```sql
INSERT INTO documents
(
    user_id,
    document_type,
    document_name,
    file_url
)
VALUES (?, ?, ?, ?);
```

### Read

```sql
SELECT *
FROM documents
WHERE user_id = ?
ORDER BY uploaded_at DESC;
```

### Delete

```sql
DELETE FROM documents
WHERE document_id = ?
AND user_id = ?;
```

---

## 5.4 Vaccinations

### Create

```sql
INSERT INTO vaccinations
(
    user_id,
    vaccine_name,
    vaccination_date,
    next_due_date,
    notes
)
VALUES (?, ?, ?, ?, ?);
```

### Read

```sql
SELECT *
FROM vaccinations
WHERE user_id = ?
ORDER BY vaccination_date DESC;
```

### Update

```sql
UPDATE vaccinations
SET
    vaccine_name = ?,
    vaccination_date = ?,
    next_due_date = ?,
    notes = ?
WHERE vaccination_id = ?
AND user_id = ?;
```

### Delete

```sql
DELETE FROM vaccinations
WHERE vaccination_id = ?
AND user_id = ?;
```

---

## 5.5 QR Access

### Create

```sql
INSERT INTO qr_access
(
    user_id,
    provider_id,
    access_token,
    permission,
    expires_at
)
VALUES (?, ?, ?, ?, ?);
```

### Read

```sql
SELECT *
FROM qr_access
WHERE user_id = ?;
```

### Validate token

```sql
SELECT
    access_id,
    user_id,
    provider_id,
    access_token,
    permission,
    expires_at
FROM qr_access
WHERE access_token = ?;
```

### Delete/revoke

```sql
DELETE FROM qr_access
WHERE access_id = ?
AND user_id = ?;
```

---

## 5.6 Hospitals

### Search by city

```sql
SELECT *
FROM hospitals
WHERE city = ?
AND pmjay_status = TRUE
ORDER BY hospital_name ASC;
```

### Get hospital by ID

```sql
SELECT *
FROM hospitals
WHERE hospital_id = ?;
```

### Search PM-JAY hospitals in a state

```sql
SELECT *
FROM hospitals
WHERE state = ?
AND pmjay_status = TRUE
ORDER BY city, hospital_name;
```

Location-based distance filtering can be handled by the backend using `latitude` and `longitude`.

---

# 6. Validation Rules

Validation should be implemented at both the mobile frontend and backend. Frontend validation improves user experience; backend validation is required for security and data integrity.

## 6.1 Registration Validation

### `full_name`

- Required
- Must not be empty
- Should contain a reasonable name length
- Reject only whitespace input

### `mobile`

- Required
- Must contain a valid mobile number format
- Maximum length must fit `VARCHAR(15)`
- Must be unique in `users`

### `email`

- Optional
- If supplied, must have valid email format
- Must be unique if stored

### `password`

- Required when password authentication is used
- Must meet the application's minimum password requirement
- Never store the plain password
- Store only bcrypt-generated `password_hash`

### `date_of_birth`

- Must be a valid date
- Should not be a future date

### `gender`

- Must use one of the values supported by the UI

### `city`

- Should not be empty when required by registration

### `state`

- Should not be empty when required by registration

---

## 6.2 Profile Validation

Validate:

- `full_name`
- `email`
- `date_of_birth`
- `gender`
- `city`
- `state`
- `blood_group`
- `emergency_contact`

`mobile` must remain unique.

---

## 6.3 Health Record Validation

### `record_type`

- Required
- Must not be empty

### `title`

- Required
- Must not be empty

### `description`

- Optional
- Apply reasonable maximum input length

### `record_date`

- Required
- Must be a valid date

---

## 6.4 Document Validation

### `document_type`

- Required

### `document_name`

- Required
- Must not be empty

### `file_url`

- Required after successful file upload

### File validation

The application should restrict:

- Allowed file types
- Maximum file size
- Invalid/corrupted files

The exact file size and allowed file types should be configured as project constants rather than hard-coded throughout the application.

---

## 6.5 Vaccination Validation

### `vaccine_name`

- Required

### `vaccination_date`

- Required
- Must be a valid date

### `next_due_date`

- Optional
- Must be a valid date when provided
- Should not be earlier than `vaccination_date`

### `notes`

- Optional
- Apply reasonable maximum length

---

## 6.6 QR Access Validation

- `access_token` must be generated securely.
- `access_token` must be unique.
- Expired access must not be accepted.
- The backend must verify the provider's identity.
- The backend must verify the `permission`.
- The QR must never expose complete medical information.

---

## 6.7 Hospital Validation

Hospital records should have:

- `hospital_name`
- `address`
- `city`
- `state`

Coordinates should be valid when supplied.

`pmjay_status` must only be set to `TRUE` when the source data supports that status.

---

# 7. Edge Cases to Handle

## 7.1 Authentication

### Wrong credentials

Display a clear error without revealing sensitive authentication details.

### Duplicate mobile number

Prevent creation of a second `users` row with the same `mobile`.

### Duplicate email

If email is supplied, handle the `UNIQUE` constraint gracefully.

### Expired/invalid JWT

- Clear authentication state.
- Send the user back to login.

### Network unavailable

Display a retry option instead of crashing the application.

---

## 7.2 Profile

### Missing optional information

Show a clear placeholder such as "Not added" instead of breaking the UI.

### Invalid date

Do not send invalid date values to the backend.

### User edits another user's profile

The backend must use the authenticated `user_id` rather than trusting a user ID supplied by the mobile client.

---

## 7.3 Health Records

### No records

Display an empty state and an "Add Health Record" action.

### Record not found

Show a friendly message instead of a blank screen.

### Unauthorized record access

The backend must reject a request where:

```text
record.user_id != authenticated_user_id
```

### Duplicate record submission

Disable the submit button while the request is being processed to reduce accidental duplicate submissions.

---

## 7.4 Documents

### Upload failure

Do not create a MySQL `documents` row if the file upload fails.

### Database save failure after successful upload

The application should either retry the metadata save or clean up the uploaded file so unused files are not left behind.

### Unsupported file

Reject the file before upload.

### Large file

Show an appropriate error and prevent the upload.

### File unavailable

If `file_url` no longer works, show a document-unavailable message rather than crashing.

---

## 7.5 Vaccinations

### No vaccination records

Show an empty state with an "Add Vaccination" action.

### Invalid due date

Reject a `next_due_date` earlier than `vaccination_date`.

### Past due vaccination

Display it as due/overdue rather than treating it as a future vaccination.

---

## 7.6 QR Health Card

### QR token expired

Reject the access request.

### QR token invalid

Do not expose patient information.

### Provider scans a QR without authorization

The backend must deny access.

### Provider scans an old QR

Validate the token against `qr_access` and its `expires_at`.

### QR scanner cannot read code

Show a retry action.

### QR contains unexpected data

Reject it safely and do not attempt to interpret arbitrary data as patient information.

---

## 7.7 Hospital Finder

### Location permission denied

Allow the user to search using city/area instead.

### GPS unavailable

Allow manual area/city search.

### No hospitals found

Show an empty state.

### Hospital has no phone number

Hide/disable the call button.

### Hospital has no coordinates

Disable directions for that hospital.

### PM-JAY status unavailable/unverified

Do not display an unverified hospital as verified.

### Hospital API/database unavailable

Show cached/static data only if the team has deliberately implemented it; otherwise show a retry message.

---

# 8. Build Order

The User Module should be developed incrementally. Each stage should be tested before moving to the next.

## Phase 1 — Project Setup

Build first:

1. Expo + React Native project
2. JavaScript and Expo configuration
3. React Navigation
4. Axios
5. Basic folder structure and `app.json`
6. Backend Node.js project
7. Express.js setup
8. MySQL database connection
9. Environment variables
10. Git repository

Expected result:

```text
Mobile App
     ↓
Express API
     ↓
MySQL
```

---

## Phase 2 — Authentication

Build:

1. `LoginScreen.js`
2. `RegisterScreen.js`
3. `OTPVerificationScreen.js`
4. `authService.js`
5. Authentication API
6. JWT generation
7. bcrypt password hashing
8. `AuthContext.js`
9. Protected navigation

Test:

- Registration
- Login
- Invalid login
- Duplicate mobile
- JWT persistence
- Logout

---

## Phase 3 — User Profile

Build:

1. `ProfileScreen.js`
2. `ProfileField.js`
3. Get user profile API
4. Update profile API
5. Profile validation

Test:

- View profile
- Edit profile
- Save profile
- Invalid data
- Unauthorized access

---

## Phase 4 — Health Records

Build:

1. `HealthRecordsScreen.js`
2. `HealthRecordCard.js`
3. Add record UI
4. Read API
5. Create API
6. Delete API
7. Empty state
8. Confirmation dialog

Test complete CRUD flow:

```text
Create → Read → View → Delete
```

---

## Phase 5 — Documents

Build:

1. `DocumentsScreen.js`
2. `DocumentCard.js`
3. File picker
4. Cloud/file storage integration
5. Document metadata API
6. Document viewing

Test:

```text
Select file
   ↓
Validate file
   ↓
Upload file
   ↓
Receive file_url
   ↓
Save metadata
   ↓
Display document
```

---

## Phase 6 — Vaccination

Build:

1. `VaccinationScreen.js`
2. `VaccinationCard.js`
3. Add vaccination
4. Update vaccination
5. Delete vaccination
6. Next due date display
7. Empty state

Test:

```text
Add → View → Update → Delete
```

---

## Phase 7 — QR Health Card

Build:

1. `QRHealthCardScreen.js`
2. `QRCard.js`
3. Secure access-token generation
4. `qr_access` database operations
5. QR generation
6. Access expiry
7. Basic sharing/access control

At this stage, the User Module will be ready to produce the QR that the Healthcare Provider Module will later scan.

---

## Phase 8 — Hospital Finder

Build:

1. `HospitalFinderScreen.js`
2. `HospitalDetailsScreen.js`
3. `HospitalCard.js`
4. `HospitalStatusBadge.js`
5. `HospitalSearchBar.js`
6. Location handling
7. Hospital search API
8. PM-JAY filtering
9. Directions action

Test:

```text
Search
  ↓
Hospital List
  ↓
Hospital Details
  ↓
Call / Directions
```

---

## Phase 9 — Dashboard Integration

After all individual features work, connect them to `DashboardScreen.js`.

Dashboard should provide shortcuts to:

```text
Dashboard
 ├── Profile
 ├── Health Records
 ├── Documents
 ├── Vaccination
 ├── QR Health Card
 ├── Hospital Finder
 └── Settings
```

---

## Phase 10 — Final Testing

Test the complete User Module:

### Authentication

- Register
- Login
- Logout
- Invalid credentials

### Profile

- View
- Update
- Validation

### Health Records

- Add
- View
- Delete
- Unauthorized access prevention

### Documents

- Upload
- View
- Download/open
- Upload failure

### Vaccinations

- Add
- View
- Update
- Delete
- Due-date validation

### QR

- Generate
- Display
- Expiry
- Invalid token

### Hospital Finder

- Search
- PM-JAY filter
- Details
- Call
- Directions
- Location denied

### Final principle

Build the User Module in this order:

```text
Setup
  ↓
Authentication
  ↓
Profile
  ↓
Health Records
  ↓
Documents
  ↓
Vaccination
  ↓
QR Health Card
  ↓
Hospital Finder
  ↓
Dashboard Integration
  ↓
Testing
```

This order keeps dependencies clear and ensures that authentication and user ownership are implemented before sensitive health data features.


---

## Expo Implementation Notes

- The mobile frontend uses **Expo + React Native + JavaScript**, not React Native CLI.
- Preserve the specified `mobile/src/` screen, component, navigation, context, and service structure.
- Use React Navigation as specified by `ARCHITECTURE.md`; do not switch to Expo Router.
- Install Expo SDK/native packages with `npx expo install <package>` so versions match the project's Expo SDK.
- Start frontend development with `npx expo start`. Use Expo Go when the required packages are supported; otherwise use an Expo development build and `npx expo run:android`.
- Do not change backend APIs, MySQL table names/columns, authentication rules, or Figma UI while adopting Expo.
- Refer to `EXPO_SETUP_AND_TESTING.md` for the clean setup, device networking, and end-to-end testing sequence.
