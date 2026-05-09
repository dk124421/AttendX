# 🚀 AttendX — Smart Attendance Management System

![AttendX Logo](public/logo.svg)

**AttendX** is a premium, real-time attendance management platform designed for modern educational institutions. It streamlines the attendance process, automates student notifications, and provides deep analytical insights for administrators, teachers, and students.

> **"Track Attendance Smarter, Not Harder"**

---

## ✨ Key Features

### 🏢 Multi-Role Dashboards
*   **Admin Panel**: Full institutional control. Manage students, teachers, classes, and courses. View real-time system-wide analytics and manage global settings.
*   **Teacher Portal**: Mark attendance in seconds with real-time sync. Generate detailed reports, view class performance, and track student streaks.
*   **Student Dashboard**: Personalized view of attendance percentage, subject-wise progress, absence alerts, and academic streaks.

### 🔔 Smart Alert System
*   **Auto-Notifications**: Automated email alerts powered by Nodemailer.
*   **Consecutive Absence**: Triggered after **5 consecutive days** of absence to ensure student safety and engagement.
*   **Monthly Absence Warning**: Sent if a student exceeds **10+ days** of non-consecutive absence in a single month.
*   **Debarment Risks**: Critical alerts sent for students with **attendance below 75%**, warning them of potential debarment.
*   **Teacher Summaries**: Teachers automatically receive a summary list of students at risk within their respective classes.
*   **Parent Notifications**: Automated emails sent to parents/guardians for students with critical attendance shortfalls, keeping them informed of debarment risks.

### 🔒 Security & Authentication
*   **NextAuth Integration**: Secure session management for all user roles.
*   **Brute-force Protection**: Automatic **15-minute account lockout** after 3 failed login attempts.
*   **Security Alerts**: Immediate email notification sent to the user upon account lockout, including the **source IP address** and timestamp of the attempts.

### 📊 Advanced Analytics
*   **Visual Trends**: Interactive charts and graphs powered by **Chart.js**.
*   **Subject-wise Tracking**: Detailed breakdown of attendance across different courses.
*   **Institutional Overview**: High-level stats for admins to monitor overall attendance health.

### ⚡ Real-Time Sync
*   **WebSocket Integration**: Powered by **Socket.io** for instant updates across all panels.
*   **Live Attendance**: Updates reflect immediately on student and admin dashboards as teachers mark them.

---

## 🛠️ Tech Stack

### Frontend & UI
*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **Animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend & Database
*   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/)
*   **Real-time**: [Socket.io](https://socket.io/)
*   **Email Engine**: [Nodemailer](https://nodemailer.com/)

### Data Visualization
*   **Library**: [Chart.js](https://www.chartjs.org/) & [React-Chartjs-2](https://react-chartjs-2.js.org/)

---

## 📂 Project Structure

```text
AttendX/
├── src/
│   ├── app/                # Next.js App Router (Admin, Teacher, Student roles)
│   │   ├── admin/          # Admin Dashboard & Management
│   │   ├── teacher/        # Teacher Portal & Attendance marking
│   │   ├── student/        # Student Dashboard & Tracking
│   │   └── api/            # Serverless API Routes (Cron, Reports, Auth)
│   ├── components/         # Reusable UI Components
│   ├── lib/                # Core Logic (Supabase, Auth, Email, Alerts)
│   └── types/              # TypeScript Definitions
├── public/                 # Static Assets (Logos, Icons)
├── server.mjs              # Custom HTTP Server (Socket.io Integration)
└── supabase/               # Database Migrations & Schemas
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js 18+
*   NPM / PNPM / Bun
*   Supabase Project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dk124421/AttendX.git
   cd AttendX
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory (refer to `.env.example`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role
   NEXTAUTH_SECRET=your_secret
   SMTP_USER=your_email
   SMTP_PASS=your_app_password
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📸 Screenshots
*(Images will be added manually)*

---

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">Made with ❤️ DK</p>
