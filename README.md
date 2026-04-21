# Gurukul Academy - Rural Coaching Center Management System

Full-stack web platform for managing day-to-day operations of a coaching center.
This README is written in report-ready format and can be directly reused in project documentation.
The project is built with a social mission: supporting affordable education by making coaching center operations more efficient and accessible.

## 1. Project Summary

Gurukul Academy is a role-based coaching center management application with two portals:

- Admin portal for student administration, attendance, notices, timetable, results management, and fee collection.
- Student portal for viewing personal attendance, notices, timetable, test results, and fee records.

The project currently runs as a monorepo with a React frontend and an Express backend, and it integrates heavily with WhatsApp for automated communication.

## 2. Problem Statement

Traditional coaching center operations are often managed manually using notebooks, WhatsApp chats, and spreadsheets. This causes:

- Fragmented records for attendance, fees, and test results.
- Delay in communicating notices and results to parents.
- Difficult financial tracking across batches.
- No unified student-facing view of performance and dues.

This system centralizes those workflows into a single web application while maintaining an active automated communication line via WhatsApp.

## 3. Objectives

- Provide a secure login-based system for admin and students.
- Digitize student records, attendance, notices, timetable, and test results.
- Track fee collection and pending balances per student and per batch.
- Offer a clean dashboard experience for both admin and student users.
- Automate communication via WhatsApp for fee reminders, notices, test results, and welcome messages.
- Support the cause of affordable education by reducing manual overhead and improving operational transparency.

## 4. User Roles and Access

### 4.1 Admin Role

- Login as center administrator.
- View financial summary cards and batch-wise pending fee breakdown.
- Add/delete students and trigger automated WhatsApp welcome messages.
- Record fee payments, generate PDF receipts, and trigger WhatsApp fee reminders for pending dues.
- Mark attendance by date and timetable slot.
- Post notices and broadcast them to students via WhatsApp.
- Manage test results (input marks/absences) and broadcast them via WhatsApp.
- Add/delete timetable slots with an intuitive grid-based UI.

### 4.2 Student Role

- Login with student name and password.
- View personal dashboard with attendance rate and pending fees.
- View attendance history and absence records.
- View detailed test results and performance history.
- View notices and announcements.
- View timetable filtered to own batch/subjects using a card-based grid layout.
- View fee summary and payment history.

## 5. Module Status (Implemented vs Planned)

| Module | Status | Notes |
|---|---|---|
| Authentication (Admin/Student) | Implemented | JWT-based login with role checks, bcrypt hashing |
| Student Management | Implemented | Add/delete students, batch/subject assignment |
| Fee Management | Implemented | Admin can record payments and download PDF receipts |
| Attendance Management | Implemented | Slot-based marking with subject context |
| Notice Management | Implemented | Admin publish, student view, WhatsApp broadcast |
| Timetable Management | Implemented | Admin add/delete slots, student filtered view (Grid-based UI) |
| Results Management | Implemented | Score tracking, absence tracking, WhatsApp broadcast |
| Real WhatsApp Automation | Implemented | Fully integrated via `whatsapp-web.js` with customizable templates |
| Database Persistence | Planned | Planning to use MongoDB Atlas |
| Real Deployment | Planned | AWS EC2 (backend) and Vercel (frontend) planned |

## 6. Technology Stack

### 6.1 Frontend

- React 18 (Create React App)
- React Router DOM 6
- Vanilla CSS (Custom modern styling, modern typography)
- jsPDF and jspdf-autotable for receipt generation

### 6.2 Backend

- Node.js
- Express.js
- bcryptjs (password hashing)
- jsonwebtoken (JWT auth)
- whatsapp-web.js (Core WhatsApp client integration)
- qrcode-terminal (for WhatsApp QR auth)
- cors
- dotenv

### 6.3 Repository and Tooling

- npm workspaces (root + client + server)
- concurrently (run frontend and backend together)
- nodemon (server dev mode)

## 7. High-Level Architecture

1. User interacts with React client in browser.
2. Client calls Express REST API.
3. Login API returns JWT token.
4. Token is sent in Authorization header for protected APIs.
5. Backend validates token and performs business logic.
6. The Backend initializes a headless WhatsApp Web client for communication.
7. Data is currently stored in in-memory arrays in server process.

Logical flow:
Browser (Admin/Student) -> React app -> Express API -> In-memory data store + WhatsApp Client

## 8. Project Structure

```text
.
|-- package.json
|-- README.md
|-- client/
|   |-- package.json
|   |-- public/
|   `-- src/
|       |-- components/
|       |-- pages/
|       |   |-- admin/     (Admin views: Students, Timetable, Notices, Results, etc.)
|       |   `-- student/   (Student views: Timetable, Notices, Tests, Fees)
|       `-- utils/api.js
`-- server/
      |-- package.json
      |-- server.js
      `-- whatsappClient.js
```

## 9. Core Backend Data Model (Current)

The backend uses seeded in-memory arrays, structuring data to be easily ported to MongoDB.

### 9.1 Student
- id, name, password (bcrypt hash), phoneNumber
- batch, subjects
- feesTotal, feesPaid, payments array
- attendance array (date, present, subject, timetableId)
- whatsappEvents (tracks communication history)
- Computed field: testResults (joined from Tests)

### 9.2 Notice
- id, title, content, batch, createdAt

### 9.3 Timetable Entry
- id, day, startTime, endTime, subject, teacher, batch, isExtraClass

### 9.4 Test/Result
- id, batch, subject, date, maxMarks
- results array (studentId, marks, isAbsent)

## 10. WhatsApp Integration Details

The application natively connects to WhatsApp Multi-Device to send messages without needing a paid API like Twilio or official WhatsApp Cloud API.
- **Client**: `whatsapp-web.js` running inside the Node.js backend.
- **Authentication**: Admin scans a QR code generated in the backend console.
- **Customizable Templates**: Admin can define custom text templates for Welcome, Fee Reminders, Test Results, and Notices (supporting `{{name}}`, `{{marks}}`, etc. variables).
- **History Tracking**: All outgoing WhatsApp messages are logged in the student's profile for auditing.

## 11. API Reference

Base URL (local): `http://localhost:5000`

### 11.1 Public Routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/login/admin` | Admin login |
| POST | `/login/student` | Student login |

### 11.2 Protected Routes (JWT Required)

| Method | Endpoint | Purpose |
|---|---|---|
| GET/POST | `/students` | Manage students |
| POST | `/students/:id/pay` | Record fee payment |
| POST | `/students/:id/whatsapp/fee-reminder` | Send fee reminder WhatsApp |
| POST | `/attendance` | Mark/update attendance |
| GET/POST | `/notices` | List/Create notices |
| POST | `/notices/:id/whatsapp` | Broadcast notice via WhatsApp |
| GET/POST/DELETE | `/timetable` | Manage timetable |
| GET/POST/DELETE | `/tests` | Manage test results |
| POST | `/tests/:id/whatsapp` | Broadcast test results via WhatsApp |
| GET/PUT | `/whatsapp/templates` | Manage WhatsApp message templates |

## 12. Frontend Routing Map

### 12.1 Admin Routes
- `/admin` (Dashboard)
- `/admin/students`
- `/admin/attendance`
- `/admin/notices`
- `/admin/timetable`
- `/admin/results`

### 12.2 Student Routes
- `/student` (Dashboard)
- `/student/attendance`
- `/student/notices`
- `/student/timetable`
- `/student/tests`
- `/student/fees`

## 13. Setup and Run Instructions

### 13.1 Prerequisites
- Node.js installed
- npm installed

### 13.2 Start Application
From the repository root folder:
```bash
npm install
npm run dev
```

### 13.3 WhatsApp Linking
- The backend console will log a QR code locally.
- Scan the QR code with WhatsApp installed on a mobile device (Linked Devices). Note: A separate test WhatsApp account is highly recommended.

## 14. Credentials for Seeded Data Demo

- **Admin login**:
  - username: `admin`
  - password: `admin123`
- **Student login**:
  - name: Pick a name from the admin student list (e.g. `Aarav Sharma`)
  - password: `password123`

## 15. Security and Auth Notes
- Passwords are encrypted as bcrypt hashes in memory.
- JWT tokens are required after login for protected APIs.
- Role value (admin/student) is used for route-level protection in frontend.
- Strict CORS rules enforce authorized origins in the backend.

## 16. Future Enhancements
- Integrate MongoDB/PostgreSQL for persistent data.
- Deploy to cloud (AWS EC2 + Vercel).
- Add online student payment workflow (Stripe/Razorpay).
- Add full role-based admin permissions and audit logs.
- Add automated unit and integration tests.