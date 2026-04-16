# CareSync

CareSync is a clinic management system consisting of a **React Native / Expo** mobile app backed by a **Node.js + Express.js** REST API and a **MongoDB Atlas** database. Patients can register, browse doctors, book appointments, and view their medical records and prescriptions. Doctors and clinic administrators manage availability, records, and prescriptions through dedicated interfaces.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Mobile App Setup](#3-mobile-app-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
  - [Backend](#backend)
  - [Mobile App](#mobile-app)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Patients](#patients)
  - [Doctors](#doctors)
  - [Appointments](#appointments)
  - [Medical Records](#medical-records)
  - [Prescriptions](#prescriptions)
- [Role Permissions](#role-permissions)
- [License](#license)

---

## Features

| Role    | Capabilities |
|---------|-------------|
| **Patient** | Register & log in · View and edit profile · Browse doctor list · Book appointments · View medical records & prescriptions |
| **Doctor** | View patient records · Create and update medical records · Create, update, and refill prescriptions · Manage appointment statuses |
| **Admin** | Full CRUD on patients, doctors, appointments, medical records, and prescriptions · Search patients |

---

## Tech Stack

### Backend (`caresync-backend`)
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB Atlas (via Mongoose) |
| Authentication | JSON Web Tokens (JWT) |
| File / Image Upload | Multer + Cloudinary |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
| Testing | Jest + Supertest |

### Mobile App (`caresync-mobile`)
| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.73 + Expo SDK 50 |
| Navigation | React Navigation v6 (Native Stack + Bottom Tabs) |
| HTTP Client | Axios |
| State / Auth | React Context API + AsyncStorage |
| Image / Doc Picker | expo-image-picker, expo-document-picker |

---

## Project Structure

```
CareSync/
├── caresync-backend/
│   ├── config/          # Database connection
│   ├── controllers/     # Route handler logic
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── doctorController.js
│   │   ├── medicalRecordController.js
│   │   ├── patientController.js
│   │   └── prescriptionController.js
│   ├── middleware/      # Auth, upload, rate-limit middleware
│   ├── models/          # Mongoose schemas
│   │   ├── Appointment.js
│   │   ├── Doctor.js
│   │   ├── MedicalRecord.js
│   │   ├── Patient.js
│   │   ├── Prescription.js
│   │   └── User.js
│   ├── routes/          # Express routers
│   ├── utils/           # Helper utilities
│   ├── __tests__/       # Jest test suites
│   ├── .env.example     # Environment variable template
│   └── server.js        # App entry point
│
└── caresync-mobile/
    ├── src/
    │   ├── api/         # Axios API client modules
    │   ├── context/     # AuthContext (token + user state)
    │   ├── navigation/  # AppNavigator (stack + tab navigators)
    │   └── screens/
    │       ├── auth/           # LoginScreen, RegisterScreen
    │       ├── appointment/    # AppointmentBookScreen, AppointmentListScreen
    │       ├── doctor/         # DoctorListScreen, DoctorDetailScreen
    │       ├── medicalRecord/  # MedicalRecordListScreen, MedicalRecordDetailScreen
    │       ├── patient/        # PatientListScreen, PatientProfileScreen, PatientEditScreen
    │       └── prescription/   # PrescriptionListScreen, PrescriptionDetailScreen
    ├── App.js
    └── app.json
```

---

## Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later
- **MongoDB Atlas** account (free tier is sufficient)
- **Cloudinary** account (for image/document storage)
- **Expo CLI** — install globally: `npm install -g expo-cli`
- A physical device or emulator/simulator running Android or iOS

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/AnjaleeWijesinghe/CareSync.git
cd CareSync
```

### 2. Backend Setup

```bash
cd caresync-backend
npm install
```

Copy the environment variable template and fill in your values:

```bash
cp .env.example .env
```

See [Environment Variables](#environment-variables) for details.

### 3. Mobile App Setup

```bash
cd ../caresync-mobile
npm install
```

Open `src/api/` (or wherever the base URL is configured) and point it at your running backend (e.g. `http://<your-local-ip>:5000`).

---

## Environment Variables

Create a `.env` file inside `caresync-backend/` based on `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/caresync?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

| Variable | Description |
|----------|-------------|
| `PORT` | Port the Express server listens on (default `5000`) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign and verify JWT tokens |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Running the Application

### Backend

```bash
cd caresync-backend

# Production
npm start

# Development (auto-reload with nodemon)
npm run dev
```

The API will be available at `http://localhost:5000`. A health-check endpoint at `GET /` returns:

```json
{ "success": true, "message": "CareSync API is running" }
```

### Mobile App

```bash
cd caresync-mobile
npm start          # Opens Expo Dev Tools in the browser
# or
npx expo start
```

Scan the QR code with the **Expo Go** app on your device, or press `a` for Android emulator / `i` for iOS simulator.

---

## Running Tests

Backend tests use **Jest** and **Supertest**:

```bash
cd caresync-backend
npm test
```

---

## API Reference

All routes are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | Public | Register a new user (`name`, `email`, `password`, optional `role`) |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `GET` | `/api/auth/me` | Required | Get the currently authenticated user |
| `POST` | `/api/auth/logout` | Required | Log out |

### Patients

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `GET` | `/api/patients/search` | admin | Search patients by query |
| `GET` | `/api/patients/me` | patient | Get own patient profile |
| `POST` | `/api/patients` | patient, admin | Create patient profile (supports photo upload) |
| `GET` | `/api/patients` | admin | List all patients |
| `GET` | `/api/patients/:id` | patient, admin | Get a patient by ID |
| `PUT` | `/api/patients/:id` | patient, admin | Update a patient (supports photo upload) |
| `DELETE` | `/api/patients/:id` | admin | Delete a patient |

### Doctors

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/doctors` | admin | Create a doctor (supports photo upload) |
| `GET` | `/api/doctors` | Public | List all doctors |
| `GET` | `/api/doctors/:id` | Public | Get a doctor by ID |
| `GET` | `/api/doctors/:id/slots` | Required | Get available time slots for a doctor |
| `PUT` | `/api/doctors/:id` | admin | Update a doctor (supports photo upload) |
| `DELETE` | `/api/doctors/:id` | admin | Delete a doctor |

### Appointments

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/appointments` | patient | Book an appointment (`doctorId`, `date`, `timeSlot`) |
| `GET` | `/api/appointments` | admin | List all appointments |
| `GET` | `/api/appointments/my` | patient | List the current patient's appointments |
| `GET` | `/api/appointments/:id` | Required | Get a single appointment |
| `PATCH` | `/api/appointments/:id/status` | doctor, admin | Update appointment status |
| `DELETE` | `/api/appointments/:id` | patient, admin | Cancel an appointment |

### Medical Records

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/records` | doctor, admin | Create a record (`patientId`, `diagnosis`; supports document upload) |
| `GET` | `/api/records` | admin | List all records |
| `GET` | `/api/records/me` | patient | List own records |
| `GET` | `/api/records/patient/:patientId` | doctor, admin | List records for a specific patient |
| `GET` | `/api/records/:id` | Required | Get a single record |
| `PUT` | `/api/records/:id` | doctor, admin | Update a record (supports document upload) |
| `DELETE` | `/api/records/:id` | admin | Delete a record |

### Prescriptions

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| `POST` | `/api/prescriptions` | doctor, admin | Create a prescription (`patientId`, `medicines[]`) |
| `GET` | `/api/prescriptions` | admin | List all prescriptions |
| `GET` | `/api/prescriptions/my` | patient | List own prescriptions |
| `GET` | `/api/prescriptions/:id` | Required | Get a single prescription |
| `PUT` | `/api/prescriptions/:id` | doctor, admin | Update a prescription |
| `PATCH` | `/api/prescriptions/:id/refill` | doctor, admin | Increment refill count |
| `DELETE` | `/api/prescriptions/:id` | admin, doctor | Delete a prescription |

---

## Role Permissions

| Action | patient | doctor | admin |
|--------|:-------:|:------:|:-----:|
| Register / Login | ✅ | ✅ | ✅ |
| Manage own patient profile | ✅ | — | ✅ |
| Browse doctors | ✅ | ✅ | ✅ |
| Manage doctors | — | — | ✅ |
| Book appointment | ✅ | — | — |
| View own appointments | ✅ | — | — |
| Update appointment status | — | ✅ | ✅ |
| View all appointments | — | — | ✅ |
| Create / update medical record | — | ✅ | ✅ |
| View own records | ✅ | — | — |
| Create / update prescription | — | ✅ | ✅ |
| View own prescriptions | ✅ | — | — |
| Full admin access | — | — | ✅ |

---

## License

This project is licensed under the terms of the [LICENSE](LICENSE) file included in this repository.
