# UI_INSTRUCTIONS.md

## Purpose

This file is the **strict UI source of truth** for the Digital Health Application.

The attached Figma UI ZIP was the visual/source reference used to create this document. When implementing the application in Antigravity:

- Follow this file exactly for UI/UX.
- Do not redesign, modernize, simplify, recolor, rename, or rearrange screens unless explicitly requested later.
- Treat the Figma UI implementation as the visual authority.
- `ARCHITECTURE.md` remains the authority for technical architecture, database structure, roles, and backend behavior.
- Use Expo + React Native + JavaScript for the actual mobile implementation. The Figma ZIP is a web/Vite/TypeScript implementation, so copy its **UI appearance and behavior**, not its web technology stack.
- Do not add new UI features that are not present in this file or explicitly requested later.

---

# 1. Product Identity

## App name

**HealthNest**

## Tagline

**Your trusted digital health companion**

## General visual character

The UI is:

- Clean
- Friendly
- Healthcare-focused
- Rounded
- Soft and spacious
- Mobile-first
- Light background with white cards
- Blue/teal primary visual language
- Clear section labels
- Strong but simple typography
- Minimal visual noise
- Large touch targets
- Card-based content organization

Do not introduce a dark theme except for the QR scanner screen, which intentionally uses a dark scanner UI.

---

# 2. Target Mobile Frame

Use a mobile layout matching the Figma implementation:

- Primary design width: **390px**
- Content should behave correctly on smaller Android devices.
- Use full mobile height.
- Main application shell is centered in the original Figma implementation with a maximum width of 390px.
- On real React Native, use responsive width rather than forcing a literal browser shell.
- Avoid horizontal scrolling.

Content pages generally use:

- 16px horizontal page padding for standard content
- 20px horizontal padding on some auth/header sections
- 24px or 20px spacing where visually shown
- Rounded top sheet-like sections on dashboards/auth screens

---

# 3. Typography

## Fonts

The Figma UI uses:

- Body: **Nunito**
- Headings: **DM Sans**

For React Native:

- Use Nunito for normal UI text where the font is available.
- Use DM Sans for major headings and visually emphasized titles.
- If font files are not yet configured, create the typography system so the fonts can be added without changing component sizes or layout.

## Typography characteristics

### Major screen heading

- DM Sans
- Bold
- About 18–24px depending on screen
- Primary text color `#0F172A`

### Large hero/auth heading

- DM Sans
- Bold
- About 24px

### Splash logo text

- DM Sans
- Extra bold
- About 36–40px

### Body text

- Nunito
- 12–16px depending on hierarchy
- Primary body color `#475569`

### Small supporting text

- Nunito
- 10–13px
- Usually `#64748B` or `#94A3B8`

### Section labels

Use uppercase small labels:

- Bold
- About 11–12px
- Letter spacing visually wide
- Color `#94A3B8`

Example:
`QUICK ACCESS`
`UPCOMING`
`RECENT RECORDS`
`HEALTH INFO`

---

# 4. Color System

Use these exact colors from the Figma UI.

## Primary

- Primary: `#0284C7`
- Primary dark: `#0369A1`
- Primary light: `#E0F2FE`

## Secondary / Teal

- Secondary: `#0D9488`
- Dark teal: `#065F46`
- Accent green: `#10B981`
- Success: `#22C55E`

## Status

- Danger: `#EF4444`
- Warning: `#F59E0B`

## Backgrounds

- Main user background: `#F0F9FF`
- Provider background: `#F0FDF4`
- Outer/background tone from original web shell: `#E8F4FD`
- Neutral surface: `#F8FAFC`

## Content

- Card: `#FFFFFF`
- Main text: `#0F172A`
- Secondary text: `#475569`
- Muted text: `#94A3B8`
- Very muted: `#CBD5E1`
- Border: `#E2E8F0`
- Subtle divider: `#F1F5F9`

## Common soft backgrounds

Use the exact visual families already used:

- Sky: `#F0F9FF`, `#E0F2FE`, `#E0F2FE`
- Purple: `#FAF5FF`, `#F3E8FF`, `#7C3AED`, `#6D28D9`
- Green: `#F0FDF4`, `#D1FAE5`, `#ECFDF5`
- Teal: `#F0FDFA`
- Amber: `#FFFBEB`, `#FEF3C7`
- Red: `#FEF2F2`, `#FEE2E2`
- Neutral: `#F8FAFC`, `#F1F5F9`

Do not replace these with unrelated palettes.

---

# 5. Radius System

Use rounded corners consistently.

- Small: `8px`
- Medium: `12px`
- Large: `16px`
- Extra large: `24px`

Common patterns:

- Inputs: 12px
- Standard cards: 16px
- Large CTA cards: 16–24px
- Modal bottom sheets: top corners about 24px
- Avatar: circular
- Pills/badges: fully rounded

---

# 6. Shadows and Borders

The design uses subtle shadows rather than heavy shadows.

Standard card:

- White background
- 1px border using `#E2E8F0`
- Small soft shadow

Primary CTA:

- Soft colored shadow matching its color family
- Do not use very heavy elevation

QR card:

- Stronger visual emphasis
- Gradient background
- White QR container

Avoid glassmorphism, excessive gradients, neumorphism, or large drop shadows.

---

# 7. Core Reusable Components

Implement the following reusable components with the same visual language.

## Button

Variants:

- Primary
- Secondary
- Outline
- Ghost
- Danger

### Primary

- Background `#0284C7`
- White text
- Semibold/bold
- Rounded 12px
- Soft blue shadow

### Secondary

- Background `#0D9488`
- White text
- Rounded 12px
- Soft teal shadow

### Outline

- White background
- 2px `#0284C7` border
- Text `#0284C7`
- Rounded 12px

### Ghost

- Transparent
- Primary text
- Light blue hover/pressed surface

### Danger

- Background `#EF4444`
- White text

### Button sizing

Small:
- Compact
- About 14px text
- Approx. 8px vertical / 16px horizontal padding

Medium:
- About 16px text
- Approx. 12px vertical / 20px horizontal padding

Large:
- About 18px text
- Approx. 16px vertical / 24px horizontal padding

Primary page actions usually use full width.

Pressed state:
- Slight scale-down feedback
- Do not alter layout

Disabled:
- Reduced opacity
- No interaction

Loading:
- Show spinner inside button
- Keep button dimensions stable

---

# 8. Input Component

Inputs must visually match the Figma input style.

- Full width
- White background
- 2px border
- Default border `#E2E8F0`
- Focus border `#0284C7`
- Error border red
- Rounded 12px
- About 12px vertical padding
- Main text `#0F172A`
- Placeholder `#CBD5E1`
- Label is small, bold, dark text
- Label sits above field

Input with icon:
- Left icon inside field
- Text starts after icon

Input with right icon:
- Right-side action such as password visibility

Error:
- Small red error text below field

---

# 9. Select / Dropdown

- White background
- 2px `#E2E8F0`
- Rounded 12px
- 12px vertical padding
- Dark text
- Placeholder state supported
- Chevron on right
- Focus border `#0284C7`
- Error state matches Input

---

# 10. Cards

Standard card:

- White
- Rounded 16px
- `#E2E8F0` border
- Subtle shadow
- Comfortable internal padding

Typical card padding:

- 14–20px depending on content

Interactive cards:
- Slight pressed scale/feedback
- Preserve same visual structure

---

# 11. Header

Use the shared header pattern on inner screens.

Visual rules:

- White background
- Bottom divider `#E2E8F0`
- Horizontal padding around 16px
- Large top safe-area spacing
- Title uses DM Sans
- Title around 18px
- Optional subtitle below title
- Optional right action
- Optional back button

Back button:

- 36–40px square
- Rounded 12px
- Background `#F0F9FF`
- Icon/text `#0284C7`

Do not create a second unrelated header design.

---

# 12. User Bottom Navigation

Use on User Module screens.

Exactly these five tabs:

1. Home
2. Records
3. Vaccine
4. QR Card
5. Profile

Visual behavior:

- White background
- Top border `#E2E8F0`
- Fixed at bottom
- Active icon/text: `#0284C7`
- Inactive icon/text: `#94A3B8`
- Active indicator: small blue line at bottom
- Label is very small and semibold/bold
- Each tab gets equal width

Do not add extra bottom-nav tabs.

---

# 13. Badge / Status Chip

Badges are compact, bold, rounded pills.

Variants:

### Success
- Background: `#ECFDF5`
- Text: emerald/dark green
- Border: light emerald

### Warning
- Background: `#FFFBEB`
- Text: amber/dark gold
- Border: light amber

### Danger
- Background: `#FEF2F2`
- Text: red
- Border: light red

### Info
- Background: `#E0F2FE`
- Text: blue
- Border: light blue

### PM-JAY
- Background: `#FAF5FF`
- Text: purple
- Border: light purple

---

# 14. Alerts

Use compact rounded alert cards.

### Success

- Light green background
- Green border
- Green text
- Check icon

### Error

- Light red background
- Red border
- Error/close icon

### Info

- Light blue background
- Blue border
- Info icon

Layout:

- Icon at left
- Message in middle
- Optional close button at right

---

# 15. Modal / Bottom Sheet

The Figma UI uses bottom-sheet style modals.

Requirements:

- Dim background overlay around `rgba(15,23,42,0.5)`
- Sheet attached to bottom
- White background
- Large rounded top corners
- About 24px top radius
- Internal padding about 24px
- Small horizontal drag handle at top
- Title in DM Sans bold
- Content below
- Buttons usually arranged side-by-side for confirmations

Common modal actions:

- Cancel = outline
- Confirm/save/delete = primary/secondary/danger depending on action

---

# 16. Empty / Loading / Error States

Every list-based screen should preserve the Figma visual language.

## Empty state

- Centered vertically within available section
- Large simple icon/emoji
- Bold title
- Supporting description
- Optional primary action

## Loading

- Circular spinner
- Blue or white depending on background
- Keep layout stable

## Error

- Rounded alert box
- Clear human-readable message
- Retry/action where relevant

Do not use generic browser-style error screens.

---

# 17. Splash Screen

Screen: `Splash`

Design:

- Full screen
- Gradient background:
  - `#0284C7` → `#0D9488`
- Centered branding
- White logo container
- Logo container about 96x96px
- Rounded 24px
- Large soft shadow

Branding:

`HealthNest`

- `Health` white
- `Nest` light mint `#A7F3D0`

Tagline:

`Your trusted digital health companion`

Three benefit labels:

- Secure
- Trusted
- Accessible

Use small outline icons beside them.

Bottom:

`v1.0 · Made for Health India`

Loading:

- Four small white/transparent dots
- Subtle pulsing animation

Original behavior:
- Splash transitions to User Login after approximately 2.8 seconds.

---

# 18. User Login Screen

Screen: `UserLogin`

Background:

- Main page `#F0F9FF`
- Hero/header gradient `#0284C7` → `#0D9488`

Top hero:

- Small HealthNest logo/brand
- `Welcome back 👋`
- `Sign in to your health account`
- Language selector at top right

Form:

### Mobile Number
Label:
`Mobile Number`

Placeholder:
`Enter 10-digit mobile number`

### Password
Label:
`Password`

Placeholder:
`Enter your password`

Include password visibility control.

Below:

`Forgot Password?`

Primary CTA:

`Sign In`

Divider:

`or`

Outline OTP CTA:

`Continue with OTP`

Registration prompt:

`Don't have an account?`
`Create Account`

Provider section:

- Thin divider
- Text:
  `Are you a Healthcare Provider?`
- Secondary teal button:
  `Provider Login`

Error state:

- Red alert area near top of form

Maintain the rounded top-sheet transition from the gradient hero to the light background.

---

# 19. User Registration Screen

Screen: `UserRegister`

Hero:

- Blue → teal gradient
- Back action
- Heading:
  `Create Account`
- Subtitle:
  `Join HealthNest — free, secure health records`

Form fields, in this exact order:

1. `Full Name *`
   - `Your full name`

2. `Mobile Number *`
   - `10-digit mobile number`

3. `Email (optional)`
   - `your@email.com`

4. `Date of Birth *`

5. `Gender *`
   - Select gender

6. `City`
   - `Your city`

7. `State`
   - Select state

8. `Password *`
   - `Create a strong password`

9. `Confirm Password *`
   - `Repeat your password`

Terms box:

`By registering, you agree to our Terms of Service and Privacy Policy.`

Primary button:

`Create Account`

Scrollable content is required because the form is long.

---

# 20. OTP Verification Screen

Screen: `OTPVerify`

Hero:

- Blue → teal gradient
- Back action
- OTP/security icon
- Heading:
  `Verify OTP`
- Supporting line:
  `Enter the 6-digit code sent to +91 98765 43210`

OTP input:

- Exactly 6 separate boxes
- About 48x56px each
- 12px rounded corners
- 2px border
- Active/filled border blue
- Digit centered and bold

Primary button:

`Verify OTP`

Below:

- Countdown:
  `Resend OTP in 30s`
- After timer:
  `Resend OTP`

Security note:

`Do not share this OTP with anyone. HealthNest will never ask for your OTP.`

Error state:
- Red alert above OTP boxes

---

# 21. Healthcare Provider Login

Screen: `ProviderLogin`

Provider visual identity:

- Background: `#F0FDF4`
- Hero gradient: `#0D9488` → `#065F46`

Header:

`Provider Login`

Subtitle:

`Access patient records securely`

Provider information note:

`🏥 For registered Healthcare Providers only`

Supporting text:

`Doctors, clinics, and health workers with valid provider credentials`

Fields:

### Mobile Number / Email
Placeholder:
`Enter your registered mobile or email`

### Password
Placeholder:
`Enter your password`

Password visibility action.

Secondary link:

`Forgot Password?`

Primary/secondary teal button:

`Sign In`

Small supporting provider/security text below.

---

# 22. User Dashboard

Screen: `Dashboard`

Background:

- `#F0F9FF`

Top hero:

- Blue → teal gradient
- Horizontal padding ~20px
- Top safe-area spacing

Greeting:

`Good morning,`

Name:

`Priya Sharma 👋`

Profile button:
- Circular/rounded avatar area
- Female user visual

## Health Status Card

Use semi-transparent white card over gradient.

Show:

`Health Status`

`All Good ✓`

`Last updated: Today`

Right side:

`Blood Group`

`B+`

## Quick Access

Section label:

`QUICK ACCESS`

First row, 3 cards:

- 📋 Health Records
- 📄 Documents
- 💉 Vaccination

Second row, 2 cards:

- 🪪 QR Health Card
- 🏥 Hospital Finder

Each quick-action card:

- Soft category background
- Rounded 16px
- Icon square around 44px
- Centered label
- Compact layout

## Upcoming

Section label:

`UPCOMING`

Vaccination card:

- Left amber icon
- `Vaccination Due`
- `Influenza (Flu) Vaccine`
- `Due: 15 Oct 2026`
- Warning badge:
  `3 days`

## Recent Records

Section label:

`RECENT RECORDS`

Right-side:

`View All`

Two sample records:

### Record 1
- 🩸
- Blood Test
- CBC & LFT
- 22 Sep 2026
- Saved badge

### Record 2
- 💊
- Prescription
- Fever & Cold
- 18 Sep 2026
- Saved badge

## QR CTA

Full-width gradient card:

`My QR Health Card`

Supporting text:

`Share your health info securely with providers`

Use ID-card icon and right chevron.

Bottom navigation:
- Home active

---

# 23. User Profile

Screen: `Profile`

Header:

- Title: `My Profile`
- Right action: `Edit`

Profile card:

- Large circular avatar
- `Priya Sharma`
- Badge: `User`
- Badge: `Verified ✓`

## Health Info card

Show health-specific information as compact key/value blocks.

Use white card, section label, divider rows.

Fields include:

- Blood Group
- Emergency Contact
- Other health information presented in the original layout

## Personal information card

View mode:
- Full Name
- Mobile Number
- Email
- Date of Birth
- Gender
- City
- State
- Emergency Contact

Edit mode:
- Use the same Input/Select components
- Preserve exact layout hierarchy
- Save button uses primary styling

Success state:

`Profile updated successfully!`

Logout:
- Red-tinted action
- Confirmation bottom sheet
- Title: `Logout?`
- Text:
  `You'll be signed out. Your health data stays safe and secure.`
- Buttons:
  `Cancel`
  `Logout`

Bottom navigation:
- Profile active

---

# 24. Health Records

Screen: `HealthRecords`

Header:

- Title: `Health Records`
- Subtitle:
  `{count} records`
- Right action: small primary `Add` button

Search:

Placeholder:
`Search records...`

Record list uses cards.

Supported categories and icon language:

- Blood Test → 🩸
- Prescription → 💊
- Consultation → 👨‍⚕️
- Radiology → 🔬
- Other → 📋

Each record card:

- Category badge
- Record title
- Short description
- Record date
- Delete icon

Add modal:

Title:
`Add Health Record`

Fields in order:

1. `Record Type *`
2. `Title *`
3. `Description`
4. `Record Date *`

Buttons:

`Cancel`
`Save Record`

Delete modal:

Title:
`Delete Record?`

Text:
`This record will be permanently deleted and cannot be recovered.`

Buttons:

`Cancel`
`Delete`

Success:
`Record added successfully!`

Empty state:
- 📋
- `No records found`
- `Add your first health record to get started`
- `Add Record`

Bottom navigation:
- Records active

---

# 25. Documents

Screen: `Documents`

Header:

- Title: `Documents`
- Subtitle:
  `{count} files`
- Back action

Top upload actions in a 2-column grid.

### Prescription

- Purple soft card
- 💊 icon
- `Upload Prescription`

### Report

- Sky soft card
- 🔬 icon
- `Upload Report`

Document cards:

### Prescription document

- Purple icon/background
- File name
- Prescription badge
- File size
- Upload date
- Download action
- Delete action

### Medical Report

- Sky icon/background
- File name
- Medical Report badge
- File size
- Upload date
- Download action
- Delete action

Upload progress card:

- Blue left border
- Spinner
- `Uploading document…`
- Horizontal progress bar
- Percentage text

Upload modal:

Title:
`Upload Prescription`
or
`Upload Medical Report`

File area:

- Dashed border
- Folder icon
- `Tap to choose a file`
- `PDF, JPG, PNG — Max 10 MB`

Buttons:

`Cancel`
`Upload`

Failure:
`Upload failed. Please check your connection and try again.`

Success:
`Document uploaded successfully!`

Delete modal:

Title:
`Delete Document?`

Text:
`This document will be permanently deleted.`

Bottom navigation:
- Records active

---

# 26. Vaccination

Screen: `Vaccination`

Header:

- Title: `Vaccination`
- Subtitle:
  `{count} records`
- Right action:
  `Add`

Upcoming section:

`UPCOMING`

Each upcoming vaccine card:

- Amber left border
- 💉 icon
- Vaccine name
- `Next due: {date}`
- `Due` warning badge

History section:

`VACCINATION HISTORY`

Each history card:

- Green check icon
- Vaccine name
- `Vaccinated: {date}`
- `Next due: {date}` when available
- Notes when available
- `Done` success badge

Add vaccination modal:

Title:
`Add Vaccination`

Fields:

1. `Vaccine Name *`
2. `Vaccination Date *`
3. `Next Due Date (if any)`
4. `Notes`

Buttons:

`Cancel`
`Save`

Success:
`Vaccination record added!`

Empty state:

- 💉
- `No vaccination records`
- `Add your vaccination history to keep track`
- `Add Vaccine`

Bottom navigation:
- Vaccine active

---

# 27. My QR Health Card

Screen: `QRCard`

This is a visually important screen.

Header:

`My QR Health Card`

## Main QR card

Gradient:
`#0284C7` → `#0D9488`

Show:

`HealthNest`

`Priya Sharma`

Blood badge:
`Blood: B+`

Status:
`Active`

DOB:
`15 Mar 1995`

## QR area

- White square container
- Rounded 16px
- About 180px QR visual
- Crisp high-contrast QR appearance
- Small HealthNest cross/logo mark centered
- QR is token representation, not medical data

Token:
`Token: HN-2026-4F8A-3B2C`

Expiry:
`Valid until 29 Sep 2026, 11:59 PM`

## Security information card

Amber left border.

Heading:

`🔐 Secure Access Token`

Body:

`This QR contains a secure access token — not your medical data. Healthcare providers scan this to request access. You control what they can see.`

## Information shared

Section:

`INFORMATION SHARED ON SCAN`

Rows:

- Basic profile (name, blood group)
- Emergency contact
- Active allergies (if recorded)
- Current health records (read-only)
- Vaccination history

All rows use small green confirmation icons.

Action:

`Manage Access Permissions →`

## Actions

Two columns:

- `Share QR` — outline
- `Download` — secondary teal

Regeneration action:

`Regenerate QR (invalidates current)`

## Share QR modal

Title:

`Share QR Health Card`

Three equal options:

- 💬 WhatsApp
- 📧 Email
- 🔗 Copy Link

Supporting text:

`Sharing allows one-time read-only access to your authorized health data.`

## Access Permissions modal

Title:

`Access Permissions`

Text:

`Control what healthcare providers can view when they scan your QR code.`

Toggle rows:

- Health Records
- Documents
- Vaccination History
- Emergency Info

Primary action:

`Save Settings`

Bottom navigation:
- QR Card active

---

# 28. Settings

Screen: `Settings`

Sections are white cards with compact list rows.

## Account

- 👤 Edit Profile
  - `Update personal information`
- 🔒 Change Password
  - `Update your login password`
- 📱 Change Mobile Number
  - `Update linked mobile`

## Privacy & Access

- 🪪 QR Health Card
  - `Manage access permissions`
- 🔐 Data Sharing
  - `Control your health data sharing`
- 📋 Access Logs
  - `See who accessed your data`

## Preferences

- 🌐 Language
  - `App display language`
  - Values:
    - English
    - हिन्दी
    - मराठी
- 🔔 Notifications
  - `Vaccination reminders & updates`
  - Toggle

## About

- ℹ️ About HealthNest
  - `Version 1.0.0`
- 📄 Privacy Policy
  - `How we protect your data`
- ⚖️ Terms of Service
  - `Our terms and conditions`

Logout:

- Full-width red soft button
- Logout icon
- `Logout`

Logout modal:

Title:
`Logout?`

Text:
`You'll be signed out. Your health data stays safe and secure.`

Buttons:

`Cancel`
`Logout`

Footer:

`HealthNest v1.0 · Secure Health Records`

Bottom navigation:
- Profile active

---

# 29. Hospital Finder

Screen: `HospitalFinder`

Background:

`#F0F9FF`

Header:

Title:
`Hospital Finder`

Subtitle:
`Nearby hospitals in Pune`

Back action.

Search field:

`Search hospitals or areas...`

Filter/action row:

### Current Location

- White background
- 2px neutral border
- Location icon
- `Current Location`
- Spinner while locating

### PM-JAY Only

Inactive:
- White background
- Neutral border
- Dark text

Active:
- Purple background
- Purple border
- White text
- `PM-JAY Only`

Location denied state:

Amber alert:

`📍 Location permission denied. Search by city or area name above.`

Results count:

`{count} hospitals found`

When filter is active:
`PM-JAY Filter Active`

Hospital cards:

Each card contains:

- Hospital icon
- Hospital name
- Distance on right
- Address
- Type badge
- PM-JAY badge when applicable
- Right chevron

Government hospital icon area:
- Sky background

Private hospital icon area:
- Purple background

Sample UI data from Figma:

1. Sassoon General Hospital
   - Near Pune Station, Pune
   - Government
   - 1.2 km
   - PM-JAY
   - 020-26128000

2. Ruby Hall Clinic
   - Sassoon Road, Pune
   - Private
   - 2.4 km
   - Not PM-JAY
   - 020-26163391

3. KEM Hospital
   - Rasta Peth, Pune
   - Government
   - 3.1 km
   - PM-JAY
   - 020-26123200

4. Jehangir Hospital
   - Sassoon Road, Pune
   - Private
   - 3.8 km
   - No phone shown

5. Deenanath Mangeshkar Hospital
   - Erandwane, Pune
   - Private
   - 5.5 km
   - PM-JAY
   - 020-49150500

Bottom reference note:

`Hospital data is for reference. Always verify before visiting.`

Empty state with PM-JAY filter:

`No PM-JAY hospitals found`

Supporting:
`Try searching a different area or disable the PM-JAY filter.`

Button:
`Remove PM-JAY Filter`

Empty state without filter:

`No hospitals found`

Supporting:
`Try a different search term or area.`

---

# 30. Hospital Details

Screen: `HospitalDetails`

Header:
- Dynamic hospital name
- Back action

## Hero

Government hospital:

Gradient:
`#0284C7` → `#0369A1`

Private hospital:

Gradient:
`#7C3AED` → `#6D28D9`

Hero content:

- Hospital icon
- Hospital name
- Type badge
- `✓ PM-JAY Empanelled` badge where applicable
- Address/location strip

## Chips

Show:

`📍 {distance} away`

When PM-JAY:
`PM Ayushman Bharat eligible`

## Hospital Info card

Section:

`HOSPITAL INFO`

Rows:

- Hospital Name
- Type
- City
- Address
- PM-JAY Status
- Phone

Unavailable phone:

`Not available`

PM-JAY verified value:

`Empanelled ✓`

Non-PM-JAY:

`Not empanelled`

## Actions

Two equal columns:

With phone:
- `Call Hospital`
- `Get Directions`

Without phone:
- Disabled:
  `No Phone Listed`
- `Get Directions`

Disabled button:
- Light neutral background
- Muted text/icon
- No interaction

## PM-JAY information card

Only when PM-JAY is true.

Purple card.

Heading:

`ℹ️ About PM-JAY (Ayushman Bharat)`

Supporting text may use the same visual copy shown in the Figma UI.

---

# 31. Healthcare Provider Dashboard

Screen: `ProviderDashboard`

Background:

`#F0FDF4`

Hero gradient:

`#0D9488` → `#065F46`

Header content:

`Healthcare Provider`

`Dr. Rajesh Mehta`

`General Physician · City Clinic, Pune`

Provider avatar:
- 👨‍⚕️ style

## Secure session card

Text:

`Secure Provider Session`

Supporting:

`All access is logged and consent-protected`

Badge:

`Active`

Clicking it opens session/access information modal.

## Primary CTA

Large teal gradient card:

`Scan Patient QR`

Supporting:

`Access authorized patient health information`

Large scanner icon.

This is the main action and should be visually dominant.

## Info cards

Two-column layout.

Card 1:
`Today's Scans`
`3`
`Patient records accessed`

Card 2:
`Provider ID`
`#PRV-2394`
`Verified provider`

## Recent Activity

Section:
`RECENT ACTIVITY`

Rows:

- Anita Joshi
  - Patient record · 10:32 AM
  - Accessed

- Ramesh Patil
  - Patient record · 9:15 AM
  - Accessed

- Sunita Desai
  - Patient record · Yesterday
  - Accessed

Use:
- User icon
- White card
- Success status badge

## Read-only disclaimer

Amber card:

`📋 Read-only Access`

`You can only view patient information. All access is logged and requires patient QR authorization.`

## Logout

Full-width red soft button:
`Logout`

Logout confirmation modal:
- `Logout?`
- `You'll be signed out of your provider session.`
- Cancel / Logout

## Session & Access Info modal

Title:

`Session & Access Info`

Active session card:

`✓ Active Session`

`Logged in as Dr. Rajesh Mehta · Provider ID #PRV-2394`

`Session started: Today, 9:00 AM`

Section:

`TODAY'S ACCESS LOG`

Rows:

- Anita Joshi
  - Viewed health records · 10:32 AM

- Ramesh Patil
  - Viewed vaccination history · 9:15 AM

Footer:
`All access requires patient QR consent and is permanently logged.`

Button:
`Close`

---

# 32. Provider Profile

Screen: `ProviderProfile`

Background:

`#F0FDF4`

Header:

`Provider Profile`

Back action.

Right action:
`Edit`
or
`Cancel`

Profile card:

- 👨‍⚕️ circular avatar
- `Dr. Rajesh Mehta`
- `General Physician`
- `Verified Provider`
- `#PRV-2394`

Provider details card:

Section:
`PROVIDER DETAILS`

Edit mode fields:

1. Full Name
2. Provider Type
3. Clinic / Hospital Name
4. Mobile Number
5. Email
6. City
7. State

Save action:
`Save Changes`

View mode:

Compact key/value rows:

- Full Name
- Provider Type
- Clinic Name
- Mobile
- Email
- City
- State

Provider account note:

`📋 Provider Account`

`Your account is verified. All patient access requires valid QR consent and is permanently logged for audit.`

Success:
`Profile updated successfully!`

---

# 33. Scan Patient QR

Screen: `ScanQR`

This screen intentionally uses a dark camera/scanner interface.

Background:

`#0F172A`

Top header:

- White back icon/button
- Title:
  `Scan Patient QR`
- Flash button on right

Scanner:

- Large square around 256x256px
- Four visible corner markers
- Blue default corners
- Large inner scanning area
- Dark/transparent camera surface

Idle instruction inside frame:

`Position patient's QR code within the frame`

Bottom/main instruction:

`Ask the patient to open their QR Health Card and hold it steady in front of the camera.`

Start action:

`Start Scanning`

Scanning state:

- Animated horizontal blue scan line
- Blue corner/frame pulse
- Center scan indicator
- Text:
  `Scanning and verifying…`

Success state:

- Green circle
- Check icon
- `QR Verified!`
- Green scanner corners

Invalid state:

- Red circle with X
- `Invalid QR`

Error panel:

`Invalid QR Code`

`This does not appear to be a valid HealthNest QR code. Please try again.`

Button:
`Scan Again`

Expired state:

- Amber error treatment
- `QR Code Expired`

Supporting:

`Ask the patient to regenerate their QR code from the HealthNest app.`

Button:
`Scan Again`

Bottom note:

`Patient must consent to share. Access is logged and audited.`

Flash button:
- Active state uses amber
- Inactive state uses translucent white

---

# 34. Patient Details / Authorized Provider View

Screen: `PatientDetails`

Background:

`#F0FDF4`

Header:

Title:
`Patient Details`

Subtitle:
`Read-only access`

Back action.

## Scan success banner

Teal card:

`QR Scanned Successfully`

`Health data shared by patient · Just now`

Badge:
`Verified`

## Authorization banner

Green card:

`Access Authorized via QR`

`Read-only · Expires in 24 hours · Access logged`

Badge:
`Authorized`

## Patient identity card

- Female avatar
- `Priya Sharma`
- `Female · 31 years · DOB: 15 Mar 1995`

Blood group visual:

`Blood`
`B+`

## Emergency contact

Red-tinted card:

`🚨 Emergency Contact`

`Ramesh Sharma`
`Husband`

`+91 98765 43211`

## Known allergies

Section:
`KNOWN ALLERGIES`

Pills:

- Penicillin
- Sulfa drugs

Use amber warning pills.

## Tab navigation

Use compact segmented/tab control for patient information categories.

The Figma implementation presents patient information in read-only sections.

Tabs include categories for:

- Basic Information
- Health Records
- Vaccinations
- Documents

The active tab uses teal fill and white text.
Inactive tabs use white/light background and muted text.

## Basic Information

Section label:
`BASIC INFORMATION`

Use key/value rows with subtle dividers.

## Health Records

Cards display:

- record type
- title
- date
- icon

## Vaccinations

Cards display:

- vaccine name
- vaccination date
- next date when available
- Done badge

## Documents

Cards display:

- document name
- type
- file size
- date
- view/download action

## Read-only security note

Neutral card:

`Read-only view. You cannot edit, delete, or add patient records. This access expires in 24 hours.`

Never add edit/delete controls to patient data in this provider view.

---

# 35. Navigation / Interaction Rules

Use these visual flows exactly.

## Initial

`Splash → User Login`

## User authentication

`User Login → Register`
`User Login → OTP`
`User Login → Provider Login`

Successful user authentication:

`Login/OTP → User Dashboard`

## User navigation

`Dashboard → Profile`
`Dashboard → Health Records`
`Dashboard → Documents`
`Dashboard → Vaccination`
`Dashboard → QR Health Card`
`Dashboard → Hospital Finder`

Bottom navigation:

`Home`
`Records`
`Vaccine`
`QR Card`
`Profile`

## Provider navigation

`Provider Login → Provider Dashboard`

`Provider Dashboard → Scan Patient QR`
`Provider Dashboard → Provider Profile`

`Scan Patient QR → Patient Details` only after valid/authorized scan state.

## Hospital navigation

`Hospital Finder → Hospital Details`

Use back navigation to return to previous screen.

---

# 36. Animation Rules

Animations should be subtle and preserve the original visual intent.

Use:

### Fade in
- About 300ms
- Slight upward movement

### Slide up
- About 350ms
- Used for modal/bottom-sheet entrance

### Pulse dot
- About 1.5 seconds
- Used on splash loading dots

### Scanner pulse
- About 2 seconds
- Blue soft pulse around scanner frame

### Scan line
- Continuous about 2-second cycle
- Vertical movement from top to bottom

### Press feedback
- Slight scale-down
- Fast transition
- Never cause layout shift

Avoid:

- Large page transitions
- 3D animations
- Bouncy physics
- Unnecessary motion

---

# 37. Icon Style

The original UI mixes:

- Clean outline SVG-style icons
- Small category emoji used as friendly visual cues

For implementation:

- Preserve the meaning and placement of the Figma icons.
- Prefer consistent outline icons for navigation/actions.
- Preserve emoji where they are intentionally used as visible category graphics in the Figma UI.
- Do not replace prominent visual icons with unrelated symbols.
- Keep icon sizing proportionate to the surrounding text/card.

Common icons:

- Back
- Eye/eye-off
- Plus
- Download
- Delete
- Location
- Phone
- Directions
- QR/scanner
- Shield/security
- Profile
- Documents
- Vaccination
- Hospital
- Check
- Warning
- Info
- Logout
- Language
- Notifications

---

# 38. Data / Sample Content Rules

The Figma UI uses sample/demo data to make screens look realistic.

Keep sample values visually consistent during UI implementation unless real backend data is supplied.

Primary demo user:

- Name: Priya Sharma
- Mobile: +91 98765 43210
- Email: priya@example.com
- DOB: 15 Mar 1995
- Gender: Female
- City: Pune
- State: Maharashtra
- Blood Group: B+
- Emergency contact: +91 98765 43211

Provider:

- Dr. Rajesh Mehta
- General Physician
- City Clinic, Pune
- Provider ID: #PRV-2394

Do not let placeholder/demo data change the visual layout.

---

# 39. Strict Implementation Rules

These rules are mandatory.

1. Match the Figma UI before adding functionality.
2. Do not create a new design system.
3. Do not change colors.
4. Do not change typography hierarchy.
5. Do not change card/button/input shapes.
6. Do not change screen order or navigation labels.
7. Do not add new navigation items.
8. Do not remove visible UI that exists in the Figma UI.
9. Preserve spacing and hierarchy.
10. Preserve the section-label style.
11. Preserve status badge colors and meanings.
12. Preserve error/loading/empty/success states.
13. Preserve the provider read-only visual communication.
14. Preserve the QR security explanation.
15. Preserve PM-JAY filtering and hospital UI.
16. Preserve the dark scanner screen.
17. Do not introduce unrelated healthcare features.
18. When backend data is unavailable, maintain the same visual states rather than redesigning the screen.
19. When replacing sample data with real data, keep the same component structure and dimensions.
20. Do not use web-only UI patterns in the React Native app when a native equivalent is required; reproduce the same visual appearance.

---

# 40. Architecture Boundary

The Figma ZIP is a **UI reference**, not a replacement for the technical architecture.

Keep these separate:

- UI appearance → this file
- Project structure → `ARCHITECTURE.md`
- Database schema → `ARCHITECTURE.md`
- Roles/auth rules → `ARCHITECTURE.md`
- API/backend → `ARCHITECTURE.md`

The actual mobile app must remain:

- Expo + React Native
- JavaScript (no TypeScript)
- React Navigation
- Axios

Use `npx expo start` for development and `npx expo install` for Expo SDK/native package compatibility. Use Expo Go when supported by the libraries in use; otherwise use an Expo development build. Do not introduce React Native CLI as the mobile development workflow.

The actual backend must remain:

- Node.js
- Express.js
- JavaScript
- REST API

Database:

- MySQL

Authentication:

- JWT
- bcrypt

Do not copy the Figma ZIP's Vite/React/TypeScript implementation into the Expo mobile architecture.

---

# 41. Antigravity Usage Rule

Attach this `UI_INSTRUCTIONS.md` to every implementation prompt.

When a future prompt requests a UI change:

- Modify only the requested UI area.
- Keep all other UI identical.
- Do not regenerate unrelated screens.
- Do not change global colors/typography/components unless explicitly requested.
- Reuse existing components.
- Preserve responsive behavior.
- Preserve navigation behavior.
- Preserve existing loading/error/empty states.
- Do not silently redesign anything.

For every implementation task, first compare the requested screen against this document and the existing implementation, then change only what is necessary.

---

# 42. Final Visual Acceptance Checklist

Before considering any UI implementation complete, verify:

- [ ] HealthNest branding is unchanged.
- [ ] Blue/teal palette is unchanged.
- [ ] User/provider backgrounds are correct.
- [ ] Nunito/DM Sans hierarchy is preserved.
- [ ] Cards remain white, rounded, and lightly bordered.
- [ ] Buttons use the correct variant and color.
- [ ] Inputs use 2px borders and 12px radius.
- [ ] Header structure matches.
- [ ] User bottom navigation has exactly five items.
- [ ] Dashboard card/grid structure matches.
- [ ] Health Records layout matches.
- [ ] Documents upload and list layout matches.
- [ ] Vaccination upcoming/history layout matches.
- [ ] QR card is visually prominent and secure-token focused.
- [ ] Settings uses grouped cards and compact rows.
- [ ] Hospital Finder preserves search/filter/card layout.
- [ ] Hospital Details preserves government/private hero colors.
- [ ] Provider Dashboard preserves teal layout and QR CTA.
- [ ] Provider Profile preserves profile/details structure.
- [ ] Scan QR remains dark with scanner frame.
- [ ] Patient Details remains read-only and authorization-focused.
- [ ] Modal style remains bottom-sheet based.
- [ ] Empty/loading/error states remain visually consistent.
- [ ] No unrelated feature or redesign has been introduced.

# End of UI Instructions
