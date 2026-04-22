# Cloveode Attendance Management System

A full-stack attendance and leave management system for **Cloveode Technologies Pvt Ltd**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Axios, Recharts |
| Backend | Node.js, Express 5, Mongoose |
| Database | MongoDB Atlas |
| Auth | JWT (7-day expiry), bcrypt |
| Email | Resend API |
| Hosting | AWS EC2 (Ubuntu), Nginx, PM2 |
| Domain | attendance.cloveode.in (SSL via Let's Encrypt) |
| External Data | Google Sheets CSV integration |

---

## Project Structure

```
node_attendance_project/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/auth.js     # JWT auth & admin middleware
│   ├── models/
│   │   ├── User.js            # User schema (name, email, password, role, profilePic)
│   │   ├── Attendance.js      # Attendance schema (user, date, checkIn, checkOut)
│   │   ├── Leave.js           # Leave schema (type, dates, status, halfDay)
│   │   ├── Holiday.js         # Holiday schema (name, date, description)
│   │   └── Update.js          # Company updates schema
│   ├── routes/
│   │   ├── authRoutes.js      # Login, user CRUD
│   │   ├── attendanceRoutes.js # Check-in/out, history, analytics, team data
│   │   ├── leaveRoutes.js     # Leave requests, stats, admin actions
│   │   ├── holidayRoutes.js   # Holiday CRUD
│   │   └── updateRoutes.js    # Company updates CRUD
│   └── utils/
│       ├── attendanceCalculator.js # Work hours calculation
│       ├── sendEmail.js           # Email notifications via Resend
│       └── sheetLeaves.js         # Google Sheet leave data fetcher
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA config (Cloveode Attendance)
│   │   ├── index.html         # App entry HTML
│   │   └── images/            # Icons and assets
│   └── src/
│       ├── components/
│       │   ├── Login.js           # Login page
│       │   ├── Dashboard.js       # Main layout with sidebar + routing
│       │   ├── MainContent.js     # Home page with greeting + summary
│       │   ├── Attendance.js      # Check-in/out + history
│       │   ├── AttendanceSheet.js # Team attendance (System + Google Sheet)
│       │   ├── LeaveRequest.js    # Leave application + balance
│       │   ├── Analytics.js       # Charts and analytics
│       │   ├── Profile.js         # User profile management
│       │   ├── Organizations.js   # Team directory
│       │   ├── Updates.js         # Company announcements
│       │   ├── Sidebar.js         # Navigation sidebar
│       │   ├── SummaryCards.js     # Dashboard stat cards
│       │   ├── ContentBlocks.js   # Dashboard content sections
│       │   ├── ProtectedRoute.js  # Auth route guard
│       │   └── admin/
│       │       ├── AdminPanel.js          # Admin dashboard
│       │       ├── AdminAttendance.js     # Manage attendance records
│       │       ├── AdminLeaveRequests.js  # Approve/reject leaves
│       │       ├── AdminEmployees.js      # User management
│       │       ├── AdminHolidays.js       # Holiday management
│       │       ├── AdminUpdates.js        # Update management
│       │       └── AdminNotifications.js  # Notification management
│       ├── context/
│       │   └── AuthContext.js     # Auth state management
│       ├── css/                   # Component stylesheets
│       └── utils/
│           └── attendanceCalculator.js # Frontend work hours calculator
```

---

## Features

### Employee Features

#### 1. Attendance (Check-in / Check-out)
- Daily check-in and check-out with one-click buttons
- IST timezone-aware date handling
- Work hours automatically calculated
- Attendance history (last 100 records)
- Current status display (checked in / not checked in)

#### 2. Attendance Sheet
- **System Records**: Monthly view of all employees' attendance from database
  - Summary view: days present, working days, attendance %, total hours, avg hours/day
  - Daily view: day-by-day grid (P/A with weekends marked)
- **Google Sheet**: Data fetched from public Google Spreadsheet (CSV)
  - Supports categories: Present (P), Absent (A), WFH, Holiday (H), Leave (L/CL/EL/SL/ML/PL)
  - Monthly tabs from Jul 2025 to May 2026

#### 3. Leave Requests
- Leave types: Casual, Sick, Emergency, Other
- Full-day and half-day support (first half / second half)
- Leave balance calculation:
  - 1.5 casual leaves per month (18 per year)
  - 6-month expiry on unused leaves
  - FIFO deduction (oldest allocations used first)
  - Google Sheet leave data integrated into balance
- View pending, approved, rejected requests
- Email notification to admins on new request

#### 4. Analytics
- **System Analytics**:
  - Daily work hours (last 7 days) - Bar chart
  - Monthly attendance (last 6 months) - Bar chart
  - This month attendance - Pie chart
  - Avg work hours by day of week (last 30 days) - Line chart
- **Google Sheet Analytics**:
  - 9-month attendance comparison across all employees
  - Per-employee monthly trend
  - Attendance ranking
  - Overall breakdown pie chart

#### 5. Other Employee Features
- Profile management with photo upload
- Team directory (Organizations page)
- Company updates/announcements feed
- Holiday calendar view

---

### Admin Features

#### 1. Leave Management
- View all pending/approved/rejected leave requests
- Approve or reject with optional admin note
- Delete processed leave requests
- Email notification sent to employee on approval/rejection

#### 2. Attendance Management
- View all employees' attendance records
- Filter by employee, month, year
- Edit check-in and check-out times
- Monthly attendance summary (days present, days on leave, total working days)
- Live "In Office" view

#### 3. Employee Management
- Create new user accounts (name, email, password, role)
- Roles: admin, employee, user
- Delete users (cannot delete self)
- View all registered users

#### 4. Holiday Management
- Create, edit, delete company holidays
- Filter by year
- Holiday name, date, and description

#### 5. Updates Management
- Create company-wide announcements
- Edit and delete updates

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | No | Login, returns JWT |
| POST | `/users` | Admin | Create user |
| GET | `/me` | Yes | Get current user |
| PATCH | `/me` | Yes | Update profile |
| GET | `/users` | Yes | List all users |
| DELETE | `/users/:id` | Admin | Delete user |

### Attendance (`/api/attendance`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/check-in` | Yes | Check in for today |
| POST | `/check-out` | Yes | Check out for today |
| GET | `/today` | Yes | Today's check-in status |
| GET | `/history` | Yes | Last 100 attendance records |
| GET | `/my-summary` | Yes | Monthly + weekly summary |
| GET | `/in-office` | Yes | Currently checked-in employees |
| GET | `/team-monthly` | Yes | All employees monthly attendance |
| GET | `/analytics` | Yes | Personal analytics data |
| GET | `/records` | Admin | Filtered attendance records |
| PATCH | `/records/:id` | Admin | Edit attendance record |
| GET | `/summary` | Admin | Monthly summary for all employees |

### Leave (`/api/leave`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | Yes | Submit leave request |
| GET | `/my` | Yes | User's leave requests |
| GET | `/my/stats` | Yes | Leave balance + stats |
| GET | `/on-leave-today` | Yes | Who's on leave today |
| GET | `/admin` | Admin | All leave requests |
| PATCH | `/admin/:id` | Admin | Approve/reject leave |
| DELETE | `/admin/:id` | Admin | Delete processed leave |

### Holidays (`/api/holidays`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | List holidays |
| GET | `/upcoming` | Yes | Next 10 holidays |
| POST | `/` | Admin | Create holiday |
| PATCH | `/:id` | Admin | Update holiday |
| DELETE | `/:id` | Admin | Delete holiday |

### Updates (`/api/updates`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Yes | Latest 20 updates |
| POST | `/` | Admin | Create update |
| PATCH | `/:id` | Admin | Edit update |
| DELETE | `/:id` | Admin | Delete update |

---

## Database Models

### User
| Field | Type | Details |
|-------|------|---------|
| name | String | Required |
| email | String | Required, unique, lowercase |
| password | String | Min 6 chars, bcrypt hashed |
| role | String | "admin" / "employee" / "user" (default: "user") |
| profilePic | String | Base64 data URL |

### Attendance
| Field | Type | Details |
|-------|------|---------|
| user | ObjectId | Reference to User |
| date | Date | IST midnight of the day |
| checkIn | Date | Check-in timestamp |
| checkOut | Date | Check-out timestamp (nullable) |
| status | String | "Present" / "Out" |

Unique index on (user, date) - one record per user per day.

### Leave
| Field | Type | Details |
|-------|------|---------|
| user | ObjectId | Reference to User |
| type | String | "casual" / "sick" / "emergency" / "other" |
| startDate | Date | Leave start |
| endDate | Date | Leave end (must be >= startDate) |
| reason | String | Reason for leave |
| status | String | "pending" / "approved" / "rejected" |
| isHalfDay | Boolean | Half-day leave flag |
| halfDaySession | String | "first_half" / "second_half" / null |
| reviewedBy | ObjectId | Admin who reviewed |
| reviewedAt | Date | Review timestamp |
| adminNote | String | Admin's note |

### Holiday
| Field | Type | Details |
|-------|------|---------|
| name | String | Holiday name |
| date | Date | Holiday date |
| description | String | Optional description |

### Update
| Field | Type | Details |
|-------|------|---------|
| title | String | Update title |
| content | String | Update content |
| createdBy | ObjectId | Reference to User |

---

## Email Notifications

Powered by **Resend API** (sender: `noreply@cloveode.in`).

| Event | Email Sent To | Subject |
|-------|--------------|---------|
| Employee requests leave | Admin emails (NOTIFY_EMAIL) | "New Leave Request from [Name]" |
| Admin approves leave | Employee's email | "Leave Approved - [Dates]" |
| Admin rejects leave | Employee's email | "Leave Rejected - [Dates]" |

---

## Google Sheets Integration

- **Public CSV URL**: Fetches attendance data from a published Google Spreadsheet
- **Monthly tabs**: Jul 2025 - May 2026 (each tab has a unique `gid`)
- **Attendance categories parsed**: P (Present), A (Absent), WFH, H (Holiday), L/CL/EL/SL/ML/PL (Leave)
- **Leave balance integration**: Backend fetches Jan 2026+ sheet data and counts leave days per employee (matched by first name)
- **Frontend views**: Both AttendanceSheet and Analytics pages can toggle between System Records and Google Sheet data

---

## Deployment Architecture

```
Browser  -->  https://attendance.cloveode.in
                    |
              Nginx (port 80/443)
              ├── / --> React build (static files)
              └── /api/ --> proxy to localhost:3004
                    |
              PM2 (Node.js backend on port 3004)
                    |
              MongoDB Atlas (cloud database)
```

| Component | Details |
|-----------|---------|
| Server | AWS EC2 t3.micro (Ubuntu 24.04) |
| Elastic IP | 34.203.59.172 |
| Web Server | Nginx (reverse proxy + static files) |
| Process Manager | PM2 (keeps backend alive) |
| SSL | Let's Encrypt (auto-renews every 90 days) |
| Domain | attendance.cloveode.in (A record in GoDaddy) |
| Database | MongoDB Atlas (free tier) |

---

## Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...@cluster.mongodb.net/attendanceDB
PORT=3004
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@cloveode.in
NOTIFY_EMAIL=admin1@gmail.com,admin2@gmail.com
FRONTEND_URL=https://attendance.cloveode.in
```

### Frontend (.env)
```
REACT_APP_API_URL=https://attendance.cloveode.in
REACT_APP_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/e/.../pub?output=csv
```

---

## User Roles

| Role | Permissions |
|------|------------|
| **admin** | Full access: manage users, approve leaves, edit attendance, manage holidays & updates |
| **employee** | Check-in/out, request leaves, view attendance, analytics, profile management |
| **user** | Basic access, view-only in some areas |

---

## Key Implementation Details

- **Timezone**: All attendance dates use IST (Asia/Kolkata). Server runs in UTC; dates are converted using `toLocaleDateString` with timezone option.
- **Work Hours Cap**: Calculator caps work hours at 18 hours to handle edge cases where check-in/check-out span midnight due to timezone issues.
- **Leave Expiry**: Casual leaves expire 6 months after allocation. FIFO deduction ensures oldest allocations are consumed first.
- **Profile Pictures**: Stored as base64 data URLs in MongoDB. Client-side resize to max 400px at JPEG quality 0.85.
- **PWA Support**: manifest.json configured for "Cloveode Attendance" installable web app.
- **Mobile Responsive**: Collapsible sidebar, responsive tables with horizontal scroll, mobile-optimized layouts.
