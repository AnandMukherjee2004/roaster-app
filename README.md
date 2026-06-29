# Attendance Manager

Team attendance tracking system for Team Leads and Admins.

## Setup

### 1. Install PostgreSQL
If not already installed, download from https://www.postgresql.org/download/windows/

### 2. Create the database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE attendance_db;
```

### 3. Configure environment
Copy `.env.example` to `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/attendance_db"
NEXTAUTH_SECRET="any-random-string-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Run migrations
```bash
npx prisma migrate dev --name init
```

### 5. Seed the database
```bash
npm run db:seed
```

### 6. Start the app
```bash
npm run dev
```

Open http://localhost:3000

## Demo Accounts

| Role  | Email               | Password |
|-------|---------------------|----------|
| Admin | admin@company.com   | admin123 |
| TL 1  | tl1@company.com     | tl123    |
| TL 2  | tl2@company.com     | tl123    |

## Features

- **TL Dashboard** — mark agents Present/Absent, bulk mark all, date picker (up to 7 days back), submit/update attendance
- **Admin Dashboard** — view all agents with attendance status, filter by TL or date, summary cards
- **History** — browse past attendance records by date
- **Auth** — NextAuth.js with credentials, JWT sessions, route protection via middleware
