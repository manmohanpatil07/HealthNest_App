# Module-3: Hospital Finder Module

## 1. Module Purpose

The Hospital Finder Module allows an authenticated user to find nearby hospitals, search by a selected location, filter hospitals by PM-JAY status, view approximate distance, and open detailed hospital information including address, hospital type, PM-JAY status, phone number when available, and directions. The module is available from the user side and does not require a separate hospital account or hospital login. It uses the `hospitals` table for hospital data, device location with latitude/longitude for location-based searching, and a map/directions service for navigation. PM-JAY status must only be presented as verified when supported by a trusted source, as specified in the architecture.

## 2. Pages / Screens in this module

The architecture defines two screens for the Hospital Finder Module:

1. `HospitalFinderScreen.js`
2. `HospitalDetailsScreen.js`

These screens are located under:

```text
mobile/src/screens/hospitals/
├── HospitalFinderScreen.js
└── HospitalDetailsScreen.js
```

### Screen navigation flow

```text
User
  |
  v
Hospital Finder
  |
  +----------------------+
  |                      |
  v                      v
Current Location     Select City/Area
  |                      |
  +----------+-----------+
             |
             v
      Hospital API / DB
             |
             v
      Nearby Hospitals
             |
             v
       Hospital List
             |
             v
   Hospital Details
       |          |
       v          v
     Call     Directions
```

The Hospital Finder is accessed from the User Module and does not have its own login.

---

## 3. For each screen: what data is shown, what actions the user can take

### 3.1 HospitalFinderScreen.js

#### Data shown

- Current/selected location.
- Latitude and longitude when needed internally.
- Hospital name.
- Address.
- City.
- State.
- Pincode when available.
- Hospital type when available.
- Approximate distance.
- PM-JAY status.
- Phone availability when applicable.

Relevant exact `hospitals` columns:

```text
hospital_id
hospital_name
address
city
state
pincode
hospital_type
phone
latitude
longitude
pmjay_status
verified_at
created_at
```

#### Actions

The user can:

1. Allow location access.
2. Use current device location.
3. Select a city/area manually.
4. Search nearby hospitals.
5. Filter hospitals by PM-JAY status.
6. Refresh hospital results.
7. Select a hospital.
8. Open `HospitalDetailsScreen.js`.
9. Retry after a failed request.
10. Change the selected location.

#### Search flow

```text
HospitalFinderScreen.js
        |
        +--> Current location
        |        |
        |        v
        |   latitude/longitude
        |
        +--> Selected city/area
                 |
                 v
          hospitalService.js
                 |
                 v
              REST API
                 |
                 v
              MySQL
                 |
                 v
          Hospital results
```

For PM-JAY filtering, use the database column:

```text
pmjay_status
```

The UI should distinguish stored PM-JAY status from verified status. `verified_at` can be used to represent whether verification information exists.

---

### 3.2 HospitalDetailsScreen.js

#### Data shown

Display the selected hospital's available information:

- `hospital_name`
- `address`
- `city`
- `state`
- `pincode`
- `hospital_type`
- `phone` when available
- `latitude`
- `longitude`
- `pmjay_status`
- `verified_at` when relevant
- Approximate distance

#### Actions

The user can:

1. View hospital details.
2. Call the hospital when `phone` is available.
3. Open directions using the map/directions service.
4. Return to the hospital list.
5. Search for another hospital.
6. View PM-JAY status.

#### Call flow

```text
Hospital Details
      |
      v
Call
      |
      v
Device Phone Application
```

If `phone` is `NULL` or unavailable, the Call action should be disabled or hidden.

#### Directions flow

```text
Hospital Details
      |
      v
Directions
      |
      v
Hospital latitude/longitude
      |
      v
Map / Directions Service
```

Directions should only be opened when usable `latitude` and `longitude` are available.

---

## 4. Component List (what React components are needed)

Create reusable components under:

```text
mobile/src/components/
```

### `HospitalCard.js`

Displays one hospital in the results list:

- `hospital_name`
- `address`
- `city`
- `state`
- `hospital_type`
- Approximate distance
- `pmjay_status`

Action:

- Open hospital details.

### `HospitalStatusBadge.js`

Displays PM-JAY status, for example:

```text
PM-JAY Verified
PM-JAY Not Verified
PM-JAY Not Available
```

The actual state must be based on `pmjay_status` and available verification information.

### `HospitalSearchBar.js`

Provides:

- City/area search.
- Clear search.
- Submit search.
- Selected-location display.

### `HospitalFilter.js`

Provides the PM-JAY filter:

```text
PM-JAY Hospitals
```

which maps to:

```text
pmjay_status = TRUE
```

### `LocationButton.js`

Handles:

- Location permission.
- Current location.
- Latitude/longitude.
- Loading state.
- Permission errors.

### `HospitalDetailsCard.js`

Displays:

- `hospital_name`
- `address`
- `city`
- `state`
- `pincode`
- `hospital_type`
- `phone`
- `pmjay_status`

### `DistanceBadge.js`

Displays approximate distance, for example:

```text
3.2 km away
```

### `CallButton.js`

Shows the Call action when `phone` is available.

### `DirectionsButton.js`

Opens the map/directions service using `latitude` and `longitude`.

### `LoadingSpinner.js`

Used while:

- Location is loading.
- Hospitals are loading.
- Details are loading.
- Results are refreshing.

### `ErrorMessage.js`

Displays location, network, API, and data errors.

### `EmptyState.js`

Displays messages such as:

```text
No hospitals found for this location.
```

### Suggested component structure

```text
mobile/src/components/
├── HospitalCard.js
├── HospitalStatusBadge.js
├── HospitalSearchBar.js
├── HospitalFilter.js
├── LocationButton.js
├── HospitalDetailsCard.js
├── DistanceBadge.js
├── CallButton.js
├── DirectionsButton.js
├── LoadingSpinner.js
├── ErrorMessage.js
└── EmptyState.js
```

---

## 5. MySQL queries needed (list the main data operations)

The Hospital Finder uses the exact `hospitals` table from the architecture.

### `hospitals` columns

```text
hospital_id
hospital_name
address
city
state
pincode
hospital_type
phone
latitude
longitude
pmjay_status
verified_at
created_at
```

Hospitals are independent and do not have a login.

### 5.1 Get hospitals by city and state

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
    verified_at,
    created_at
FROM hospitals
WHERE city = ?
  AND state = ?
ORDER BY hospital_name ASC;
```

### 5.2 Search hospitals by city

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
    verified_at,
    created_at
FROM hospitals
WHERE city = ?
ORDER BY hospital_name ASC;
```

### 5.3 Get PM-JAY hospitals

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
    verified_at,
    created_at
FROM hospitals
WHERE pmjay_status = TRUE
ORDER BY hospital_name ASC;
```

### 5.4 Get PM-JAY hospitals by city and state

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
    verified_at,
    created_at
FROM hospitals
WHERE city = ?
  AND state = ?
  AND pmjay_status = TRUE
ORDER BY hospital_name ASC;
```

### 5.5 Get one hospital by `hospital_id`

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
    verified_at,
    created_at
FROM hospitals
WHERE hospital_id = ?
LIMIT 1;
```

### 5.6 Location-based hospital search

The architecture specifies device location, latitude/longitude, and approximate distance. A simple MVP can retrieve hospitals using their stored coordinates and calculate distance.

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
    verified_at,
    created_at,
    (
        6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
        )
    ) AS distance_km
FROM hospitals
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
HAVING distance_km <= ?
ORDER BY distance_km ASC;
```

Parameters:

```text
1. User latitude
2. User longitude
3. User latitude
4. Maximum search radius in kilometres
```

### 5.7 Location-based PM-JAY hospital search

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
    verified_at,
    created_at,
    (
        6371 * ACOS(
            COS(RADIANS(?))
            * COS(RADIANS(latitude))
            * COS(RADIANS(longitude) - RADIANS(?))
            + SIN(RADIANS(?))
            * SIN(RADIANS(latitude))
        )
    ) AS distance_km
FROM hospitals
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND pmjay_status = TRUE
HAVING distance_km <= ?
ORDER BY distance_km ASC;
```

### 5.8 Hospital API

The architecture gives this example:

```text
GET /api/hospitals?latitude=19.07&longitude=72.87
```

The MVP can additionally support:

```text
GET /api/hospitals?latitude=19.07&longitude=72.87&pmjay=true
```

The backend must validate all query parameters before using them in SQL.

### 5.9 Main database operations

```text
SELECT hospitals by city/state
SELECT hospitals by PM-JAY status
SELECT nearby hospitals using latitude/longitude
SELECT nearby PM-JAY hospitals
SELECT one hospital by hospital_id
```

There are no hospital-side INSERT, UPDATE, or DELETE operations in this MVP because hospitals do not have their own login and the architecture does not define hospital administration.

---

## 6. Validation rules

### 6.1 Location validation

- Latitude must be numeric.
- Longitude must be numeric.
- Latitude must be between `-90` and `90`.
- Longitude must be between `-180` and `180`.
- Invalid coordinates must not be sent to the API.
- If location permission is denied, allow manual city/area selection.

### 6.2 Hospital ID validation

For hospital details:

- `hospital_id` is required.
- `hospital_id` must be a valid integer.
- The hospital must exist in `hospitals`.
- Return a controlled not-found response when it does not exist.

### 6.3 City/state validation

- City must not be empty.
- State must not be empty when both are required.
- Trim leading/trailing whitespace.
- Avoid excessively long input.
- Use parameterized SQL.

### 6.4 PM-JAY filter validation

The filter should accept a controlled boolean:

```text
true
false
```

It maps to:

```text
pmjay_status
```

Do not concatenate the filter directly into SQL.

### 6.5 Hospital data validation

According to the architecture:

- `hospital_name` is required.
- `address` is required.
- `city` is required.
- `state` is required.
- `pincode` may be `NULL`.
- `hospital_type` may be `NULL`.
- `phone` may be `NULL`.
- `latitude` may be `NULL`.
- `longitude` may be `NULL`.
- `pmjay_status` defaults to `FALSE`.
- `verified_at` may be `NULL`.
- `created_at` is automatically stored.

### 6.6 PM-JAY verification validation

The application must not claim that PM-JAY status is verified unless supported by a trusted source. The architecture specifically requires trusted-source support for verified PM-JAY status.

Use:

```text
pmjay_status
verified_at
```

to represent the stored status and available verification information.

### 6.7 Phone validation

Before enabling Call:

- Check that `phone` is not `NULL`.
- Check that it is not empty.
- Use the device phone application.
- Handle devices where the phone application cannot be opened.

### 6.8 Directions validation

Before opening directions:

- Check that `latitude` is not `NULL`.
- Check that `longitude` is not `NULL`.
- Validate coordinate ranges.
- Show a fallback message if coordinates are unavailable.

### 6.9 API validation

The backend must validate:

- Latitude.
- Longitude.
- Search radius.
- PM-JAY filter.
- City/state.
- `hospital_id`.

All SQL queries must use parameters rather than unsafe string concatenation.

---

## 7. Edge cases to handle

### 7.1 Location edge cases

1. User denies location permission.
2. Location permission is permanently denied.
3. GPS/location service is disabled.
4. Device cannot determine location.
5. Location request times out.
6. Latitude is missing.
7. Longitude is missing.
8. Coordinates are invalid.
9. User selects a location manually.
10. User changes the selected location.
11. User moves to another location while the screen is open.

### 7.2 Hospital search edge cases

1. No hospitals found nearby.
2. No hospitals found for the selected city.
3. No PM-JAY hospitals found.
4. Hospital API is unavailable.
5. Network connection is lost.
6. Backend returns an error.
7. Database query fails.
8. Search returns many hospitals.
9. Search radius is too small.
10. Search radius is invalid.
11. Duplicate hospital results are returned.
12. Hospital data is incomplete.

### 7.3 Hospital data edge cases

1. `pincode` is `NULL`.
2. `hospital_type` is `NULL`.
3. `phone` is `NULL`.
4. `latitude` is `NULL`.
5. `longitude` is `NULL`.
6. `pmjay_status` is `FALSE`.
7. `verified_at` is `NULL`.
8. Hospital name is very long.
9. Address is very long.
10. PM-JAY status exists but verification information is unavailable.
11. Hospital record is removed after the list loads.

### 7.4 Hospital details edge cases

1. Invalid `hospital_id`.
2. Hospital no longer exists.
3. Details API fails.
4. Phone cannot be called.
5. Coordinates are missing.
6. Map/directions application is unavailable.
7. User returns to the hospital list.
8. User opens multiple hospital details screens quickly.
9. Hospital information loads slowly.

### 7.5 PM-JAY edge cases

1. `pmjay_status = FALSE`.
2. `pmjay_status = TRUE` but `verified_at = NULL`.
3. Verification information is unavailable.
4. No PM-JAY hospitals match the location.
5. Hospital has no PM-JAY information.

The application must not invent PM-JAY eligibility when the stored data does not support it.

### 7.6 UI edge cases

1. Show loading state while fetching hospitals.
2. Show empty state when no results exist.
3. Show retry after network failure.
4. Keep hospital cards usable on small Android screens.
5. Handle long hospital names.
6. Handle long addresses.
7. Prevent repeated API calls from rapid button presses.
8. Preserve selected location while viewing details.
9. Refresh results when location changes.
10. Disable Call when `phone` is unavailable.
11. Disable Directions when coordinates are unavailable.

---

## 8. Build order (what to build first inside this module)

### Step 1 — Prepare the `hospitals` table

Create/verify the exact architecture table:

```text
hospitals
├── hospital_id
├── hospital_name
├── address
├── city
├── state
├── pincode
├── hospital_type
├── phone
├── latitude
├── longitude
├── pmjay_status
├── verified_at
└── created_at
```

Add development seed data.

Goal:

```text
MySQL
  ↓
hospitals
```

### Step 2 — Build `hospitalService.js`

Create:

```text
mobile/src/services/hospitalService.js
```

Use Axios for:

```text
GET /api/hospitals
```

Support:

- latitude
- longitude
- PM-JAY filter
- city/area search
- hospital details

Goal:

```text
Mobile
  ↓
hospitalService.js
  ↓
REST API
```

### Step 3 — Build the Hospital API

Implement backend hospital routes/controllers/services.

Core API:

```text
GET /api/hospitals
```

Example:

```text
GET /api/hospitals?latitude=...&longitude=...
```

PM-JAY example:

```text
GET /api/hospitals?latitude=...&longitude=...&pmjay=true
```

Also implement hospital details by `hospital_id`.

Goal:

```text
Hospital API
  ↓
Validate parameters
  ↓
MySQL
  ↓
Hospital results
```

### Step 4 — Build location functionality

Create:

```text
LocationButton.js
```

Implement:

- Location permission.
- Current latitude.
- Current longitude.
- Loading state.
- Permission-denied handling.
- Location-error handling.

Goal:

```text
Device
  ↓
Current Location
  ↓
latitude + longitude
```

### Step 5 — Build `HospitalFinderScreen.js`

Add:

```text
HospitalSearchBar
LocationButton
HospitalFilter
HospitalCard
HospitalStatusBadge
DistanceBadge
LoadingSpinner
ErrorMessage
EmptyState
```

Implement:

```text
Get location
    ↓
Hospital API
    ↓
Hospital list
    ↓
Display results
```

### Step 6 — Add PM-JAY filtering

Use:

```text
pmjay_status
```

to filter:

```text
PM-JAY Hospitals
```

Use:

```text
verified_at
```

when displaying verification information.

Goal:

```text
All Hospitals
      ↓
PM-JAY Filter
      ↓
PM-JAY Hospital List
```

### Step 7 — Add approximate distance

Use:

```text
latitude
longitude
```

for both the user's location and hospital coordinates.

Goal:

```text
Current Location
      +
Hospital Coordinates
      ↓
Approximate Distance
```

### Step 8 — Build `HospitalDetailsScreen.js`

Add:

```text
HospitalDetailsCard
CallButton
DirectionsButton
HospitalStatusBadge
```

Display:

```text
Hospital Name
Address
City
State
Pincode
Hospital Type
Phone
PM-JAY Status
```

Goal:

```text
Hospital List
     ↓
Hospital Details
```

### Step 9 — Add Call functionality

Implement:

```text
CallButton.js
```

Enable it only when:

```text
phone
```

is available.

### Step 10 — Add Directions functionality

Implement:

```text
DirectionsButton.js
```

Use:

```text
latitude
longitude
```

to open the map/directions service.

Handle missing coordinates.

### Step 11 — Add manual city/area search

Allow the user to select a city/area when current location is unavailable or not preferred.

```text
Hospital Finder
      ↓
Select City/Area
      ↓
Hospital API
      ↓
MySQL
      ↓
Hospital List
```

### Step 12 — Add error and empty states

Test:

```text
No hospitals
No PM-JAY hospitals
Location denied
Location unavailable
Network error
API error
Hospital not found
No phone
No coordinates
Map unavailable
```

### Step 13 — Connect to User Dashboard

The architecture defines a Hospital Finder shortcut on the User Dashboard.

```text
User Dashboard
      ↓
Hospital Finder
      ↓
Search
      ↓
Hospital Details
```

### Step 14 — Test with Postman

Test:

```text
GET /api/hospitals
GET /api/hospitals?latitude=...&longitude=...
GET /api/hospitals?latitude=...&longitude=...&pmjay=true
```

Test invalid:

```text
Latitude
Longitude
hospital_id
PM-JAY value
Search radius
```

Verify parameterized SQL.

### Step 15 — Final Android testing

Test the complete flow:

```text
User Login
    ↓
User Dashboard
    ↓
Hospital Finder
    ↓
Current Location / City Search
    ↓
Hospital List
    ↓
PM-JAY Filter
    ↓
Hospital Details
    ├── Call
    └── Directions
```

Verify:

- Navigation.
- Location permission.
- Manual location search.
- Hospital results.
- PM-JAY filtering.
- Approximate distance.
- Hospital details.
- Call when a phone number exists.
- Directions when coordinates exist.
- Missing-data handling.
- Network/API error handling.

---

## Final Module Structure

```text
mobile/
└── src/
    ├── screens/
    │   └── hospitals/
    │       ├── HospitalFinderScreen.js
    │       └── HospitalDetailsScreen.js
    │
    ├── components/
    │   ├── HospitalCard.js
    │   ├── HospitalStatusBadge.js
    │   ├── HospitalSearchBar.js
    │   ├── HospitalFilter.js
    │   ├── LocationButton.js
    │   ├── HospitalDetailsCard.js
    │   ├── DistanceBadge.js
    │   ├── CallButton.js
    │   ├── DirectionsButton.js
    │   ├── LoadingSpinner.js
    │   ├── ErrorMessage.js
    │   └── EmptyState.js
    │
    └── services/
        └── hospitalService.js

backend/
└── src/
    ├── controllers/
    │   └── hospitalController.js
    ├── routes/
    │   └── hospitalRoutes.js
    ├── services/
    │   └── hospitalService.js
    └── config/
        └── database.js

database/
├── schema.sql
└── seed.sql
```

## Architecture Constraints for Module 3

This module must remain within the architecture defined in `ARCHITECTURE.md`:

- Frontend: React Native + JavaScript.
- Navigation: React Navigation.
- API communication: Axios.
- Backend: Node.js + Express.js + JavaScript.
- Database: MySQL.
- Hospital table: `hospitals`.
- Hospitals do not have their own login.
- Hospital Finder is available from the user side.
- Use device location and latitude/longitude for nearby hospital search.
- Use a map/directions service for directions.
- Display approximate distance.
- Display PM-JAY status.
- Only mark PM-JAY status as verified when supported by a trusted source.
- Display phone number when available.
- No hospital admin module.
- No hospital login.
- No hospital-side CRUD interface is introduced by this module.
- Keep the implementation simple and student-friendly.
- The project should remain within this architecture unless a later requirement specifically requires an additional technology.


---

## Expo Implementation Notes

- The mobile frontend uses **Expo + React Native + JavaScript**, not React Native CLI.
- Preserve the existing user-side navigation and screen/component structure.
- Keep React Navigation; do not introduce Expo Router.
- Use `npx expo install` for Expo SDK/native packages.
- Use an Expo-compatible location solution for current location and request permissions correctly.
- Use `npx expo start` for normal development; use an Expo development build and `npx expo run:android` when required by native dependencies.
- Do not add a hospital login/admin module or change the `hospitals` table.
- Only show PM-JAY verification when trusted verification information exists.
- Follow `EXPO_SETUP_AND_TESTING.md` for setup, device networking, and testing.
