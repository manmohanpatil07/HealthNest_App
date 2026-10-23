# HealthNest — Digital Health Application

HealthNest is a mobile-first digital health platform featuring three key modules:
1. **User Module:** Medical records, prescriptions, vaccination tracking, and secure QR Health Card.
2. **Healthcare Provider Module:** Doctor/clinic dashboard to scan patient QR codes and view authorized medical summaries.
3. **Hospital Finder Module:** Geolocation-based discovery of PM-JAY (Ayushman Bharat) empanelled hospitals.

---

## Project Structure

```text
HealthNest/
├── mobile/                   # React Native (Expo) mobile frontend (JavaScript)
│   ├── src/
│   │   ├── components/       # Reusable UI widgets
│   │   ├── screens/          # Screen components (auth, user, provider, hospitals)
│   │   ├── navigation/       # React Navigation stacks (App, Auth, Main)
│   │   ├── services/         # Axios instance and API call services
│   │   ├── context/          # React Context (AuthContext)
│   │   ├── utils/            # Helper utilities
│   │   └── constants/        # App constants and design tokens
│   ├── App.js                # Mobile app root
│   └── package.json
├── backend/                  # Node.js + Express.js REST API (JavaScript)
│   ├── src/
│   │   ├── config/           # Database configuration (MySQL connection pool)
│   │   ├── controllers/      # Route controllers
│   │   ├── routes/           # Express routes
│   │   ├── middleware/       # JWT auth & role-based middleware
│   │   ├── models/           # Data models / query helpers
│   │   ├── services/         # Business logic services
│   │   ├── utils/            # Backend utility helpers
│   │   └── app.js            # Express application setup
│   ├── server.js             # HTTP server entrypoint
│   ├── .env.example          # Environment variables template
│   └── package.json
├── database/                 # MySQL database scripts (XAMPP Server)
│   ├── schema.sql            # Table definitions (users, providers, health_records, etc.)
│   └── seed.sql              # Minimal development seed data
├── .gitignore
├── ARCHITECTURE.md           # Single source of truth for technical architecture
└── README.md
```

---

## Quick Start Guide

### 1. Database Setup (MySQL / XAMPP)

1. Start **Apache** and **MySQL** in the **XAMPP Control Panel**.
2. Open **phpMyAdmin** in your browser at `http://localhost/phpmyadmin` (or use MySQL CLI).
3. Import the database schema:
   - Run the script located at `database/schema.sql`.
4. (Optional) Import seed data for development testing:
   - Run the script located at `database/seed.sql`.

---

### 2. Backend Setup (Node.js + Express)

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```
2. Ensure dependencies are installed:
   ```bash
   npm install
   ```
3. Check the `.env` file (copied from `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=healthnest_db
   DB_PORT=3306
   JWT_SECRET=healthnest_jwt_secret_key_dev_2026
   ```
4. Start the server:
   ```bash
   npm start
   ```
   *Or with automatic reloading:*
   ```bash
   npm run dev
   ```
5. Verify the health status in your browser or with curl:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "success": true,
     "message": "HealthNest Backend API is operational",
     "timestamp": "...",
     "environment": "development"
   }
   ```

---

### 3. Mobile Setup (React Native + Expo)

1. Open a terminal and navigate to `mobile/`:
   ```bash
   cd mobile
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```
3. **Run on Device or Emulator:**
   - **Android Device:** Install the **Expo Go** app from the Play Store, open your camera/Expo Go, and scan the QR code displayed in the terminal.
   - **Android Emulator:** Press `a` in the terminal with Android Studio / emulator open.
   - **Web Browser (UI preview):** Press `w` in the terminal.

> **Note for testing with a physical device:**
> In `mobile/src/services/api.js`, update `API_BASE_URL` from `localhost` to your computer's local Wi-Fi IP address (e.g., `http://192.168.1.50:5000/api`).
