# SprintStack — Git-Ops Developer Project Management System

A high-performance, multi-project task management platform engineered with a Bauhaus/Neo-brutalist aesthetic. Built with React 19, Node.js, Express, MongoDB/Mongoose, Socket.IO, and automated Git/GitHub commit traceability.

---

## Key Highlights & Innovations

1. **Role-Segregated Authentication**:
   - **Project Admin (Lead)**: Creates projects, generates 6-character team invitation codes, assigns tasks, and oversees sprint progress.
   - **Team Member (Developer / Student)**: Joins projects via team codes, inspects assigned tasks, starts work (`To Do` ➔ `In Progress`), and pushes commits to trigger automated completions.
2. **Multi-Project Workspaces & Sessions**:
   - Projects operate as segregated workspaces with sequential task IDs (`TASK-101`, `TASK-102`).
   - One-click copyable 6-character team codes (e.g. `PRJ-9042`).
   - Dynamic project switcher dropdown in the top navigation bar.
3. **Commit-Gated "Done" Column (Strict Developer Discipline)**:
   - Tasks **cannot** be dragged or clicked manually into the "Done" column.
   - The "Done" column is strictly commit-gated: only a verified Git commit containing the Task ID in its commit message will transition the task to "Done".
4. **Git Automation & Traceability**:
   - **In-App Interactive Terminal**: Run `$ git commit -m "TASK-101: ..."` directly within the application for immediate testing and evaluations.
   - **Live GitHub Webhook Endpoint**: Receives GitHub push payloads (`/api/projects/:projectId/webhook`) and updates matching tasks in real time.
   - **Local Git Hook Integration**: Ready-to-copy `.git/hooks/post-commit` script to link actual CLI `git commit` commands on your machine directly to SprintStack.
   - **Live Commit Stream**: Real-time audit log of commits, SHAs, committers, and linked task tags.
5. **Academic & Professional Developer Profiles**:
   - Dual-track profile system: **Student Mode** (University, Branch, Semester/Year, Student ID) vs. **Working Professional Mode** (Company, Title, Department, Experience).
   - Real-time productivity metrics: Active projects, assigned tasks, commit completions, and velocity percentage.
6. **Zero-Configuration MongoDB Fallback**:
   - Seamlessly connects to local MongoDB or MongoDB Atlas via `MONGODB_URI`.
   - If local MongoDB is not running, automatically starts an in-memory database server so the application runs 100% out-of-the-box!

---

## Tech Stack

- **Frontend**: React 19, Vite, Lucide Icons, @hello-pangea/dnd (Drag and Drop), Socket.IO Client
- **Styling**: Custom Bauhaus / Neo-brutalist design system with high-contrast borders and architectural grid
- **Backend**: Node.js, Express.js, Socket.IO, JWT, bcryptjs, crypto
- **Database**: MongoDB & Mongoose (with automatic in-memory fallback)

---

## Project Structure

```
Internship_assignment/
├── backend/
│   ├── models/
│   │   ├── User.js           # Roles (admin/member), student/professional profiles
│   │   ├── Project.js        # Multi-project schema, team codes, member lists
│   │   ├── Task.js           # TASK-XXX sequential IDs, commit info, status
│   │   └── CommitLog.js      # Git commit audit trail
│   ├── package.json
│   └── server.js             # REST API, Socket.IO rooms, and Git webhook handler
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Project switcher, navigation tabs, user chip
│   │   │   ├── TaskBoard.jsx     # Kanban board with commit-gated Done column & Team modal
│   │   │   ├── ProjectsHub.jsx   # Project workspace management & code entry
│   │   │   ├── GitIntegration.jsx# In-app Git terminal, webhook setup, and commit stream
│   │   │   ├── ProfilePage.jsx   # Student & Professional profile editor and metrics
│   │   │   ├── TaskCard.jsx      # Task card with TASK-ID badge and commit details
│   │   │   ├── Column.jsx        # Droppable column container with lock badge
│   │   │   ├── TaskModal.jsx     # Task creation & member assignment modal
│   │   │   ├── TaskViewModal.jsx # Detailed task inspection modal with commit SHA
│   │   │   └── AuthPage.jsx      # Role-based sign-in & registration
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication state & profile updater
│   │   │   ├── ProjectContext.jsx# Active project & team code management
│   │   │   └── TaskContext.jsx   # Real-time Socket.IO synchronization & commit dispatcher
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── MANUAL.md                 # Full user & developer instruction manual
```

---

## Running the Application

### 1. Start the Backend API
```bash
cd backend
npm install
npm start
```
*API runs on `http://localhost:5000`*

### 2. Start the Frontend App
```bash
cd frontend
npm install
npm run dev
```
*Application runs on `http://localhost:3000`*

---

## Demo Credentials (Pre-Seeded)

- **Admin Account**: `sarthak` / `sarthak_1204`
- **Team Member Account**: `alex_dev` / `password123`
- **Default Project**: `SprintStack Core System` (Team Code: `PRJ-9042`)

---

## Detailed Manual
For full instructions, role privilege tables, and step-by-step evaluation scripts, see [MANUAL.md](MANUAL.md).
