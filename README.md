# 🎓 Gurukul Academy — Coaching Center Management System

A premium, modern, and highly responsive full-stack digital platform designed specifically for managing students, batches, fees, and daily operations at Gurukul Academy (Rural Coaching Center).

![React](https://img.shields.io/badge/Frontend-React-61dafb?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Framework-Express.js-000000?style=flat-square&logo=express)

---

## 🌟 Key Features

### 👨‍💼 Admin Panel
The admin dashboard is an all-in-one workstation to handle daily operations efficiently.
* **Financial Dashboard**: Keep track of expected revenue, collected fees, and pending balances in real-time.
* **Student Management**: Register students to specific batches (8th - 12th class) with customized total fee structures.
* **Payment Processing**: Process student fees via Cash, UPI, or Card, and generate **instant PDF Fee Receipts** natively in the browser.
* **WhatsApp Reminders**: Identify students with pending fees and instantly dispatch automated WhatsApp payment reminders with a single click.
* **Class-wise Attendance**: Easily switch between batches to take daily attendance using rapid "tap-to-mark" functionality.
* **Notice Board**: Broadcast important announcements directly to the student portal.
* **Master Timetable**: Construct class-specific weekly schedules and flag custom "Extra Classes".

### 👨‍🎓 Student Portal
A private, mobile-optimized hub where students can track their own progress and administrative status.
* **Performance Overview**: Track attendance percentages and pending fee records directly on the homepage.
* **Instant Notifications**: The latest operational notices are displayed immediately on the homepage dashboard.
* **Class Timetables**: View personalized schedules isolated specifically to the student's assigned batch.
* **Action Center**: Review payment histories and access upcoming testing schedules (coming soon).

---

## 🎨 UI/UX Design System
* **Fully Responsive**: Adapts seamlessly to 4K monitors, tablets, and tiny mobile screens.
* **Mobile-First Experience**: Uses a fixed frosted-glass bottom navigation bar for mobile devices, mimicking native app experiences.
* **Branded Theme**: Premium typography (Playfair Display + Poppins) with an aesthetic color palette tuned perfectly to Gurukul Academy's logo (Deep Royal Blue, Crimson, and Saffron Orange).
* **Glassmorphism & Micro-animations**: Subtle UI hover states and gradient glowing cards make the dashboard feel incredibly snappy.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Copy or clone this repository to your local machine.
2. From the project root (using npm workspaces), install all dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the application for development, run the following command in the root folder:

```bash
npm run dev
```

This uses `concurrently` to boot both the Node.js server and the React frontend simultaneously:
* **Frontend**: `http://localhost:3000`
* **Backend API**: `http://localhost:5000`

> *Note: If you run `npm run dev` and wish to stop it, use `Ctrl + C`. This may throw an expected non-zero exit code in terminal.*

### Default Credentials
* **Global Admin Login**: `admin` / `admin123`
* **Student Login**: Generated names (e.g., "Aarav Sharma" / `password123`). Check the Admin's Student Management list for exact student names.

---

## 🏗️ Technical Architecture

* **Frontend**: React.js (Create React App), React Router Dom v6, Vanilla CSS3 with Custom Properties (Tokens).
* **PDF Utility**: `jspdf` used natively on the client side for receipt generation.
* **Backend**: Express.js REST API returning standard JSON representations.
* **Database**: Currently utilizes in-memory structured arrays (`server.js`) for lightning-fast prototyping. Easily swappable to MongoDB or PostgreSQL.

---

## 🛣️ Roadmap & Planned Upgrades

- [ ] **Automated WhatsApp Reminders Setup**: Fully wire the "Send Reminder" button to a WhatsApp Business API gateway or Twilio to push real messages to parents/students.
- [ ] **Database Persistence**: Migrate the local mock arrays in `server.js` to a real NoSQL/SQL database.
- [ ] **Test Module**: Finalize the interactive routing for the Student Tests page.