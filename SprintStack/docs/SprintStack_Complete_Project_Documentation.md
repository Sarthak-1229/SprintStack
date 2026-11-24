# SprintStack: Full-Stack Agile Kanban Task Management System
**Academic Subject:** Third Year (TY) Engineering — Web Technology Mini-Project  
**Architecture:** Decoupled React 19 Single Page Application (SPA) + Node.js / Express.js REST API  
**Primary Database:** MongoDB + Mongoose ODM (with Resilient Local JSON Mutex Fallback)  
**Design Philosophy:** Bauhaus Neo-Brutalism (Form Follows Function, Tactile High-Contrast UI)  
**Author:** Student Developer Engineering Documentation  
**Status:** Tested, Verified & Deployed  

---

## Table of Contents
1. [Project Overview & Problem Formulation](#1-project-overview--problem-formulation)
2. [Complete Technology Stack & Selection Rationale](#2-complete-technology-stack--selection-rationale)
3. [System Architecture & End-to-End Data Connections](#3-system-architecture--end-to-end-data-connections)
4. [Complete File-by-File Codebase Directory Audit](#4-complete-file-by-file-codebase-directory-audit)
5. [UI Architecture & Feature Mechanics (How Everything Works)](#5-ui-architecture--feature-mechanics)
6. [REST API Specification & Endpoint Documentation](#6-rest-api-specification--endpoint-documentation)
7. [Installation, Local Execution & Deployment Manual](#7-installation-local-execution--deployment-manual)
8. [Viva Voce & Technical Defense Q&A Preparation](#8-viva-voce--technical-defense-qa-preparation)
9. [Conclusion & Future Engineering Roadmap](#9-conclusion--future-engineering-roadmap)

---

## 1. Project Overview & Problem Formulation

### 1.1 What is SprintStack?
**SprintStack** is an agile sprint board and project management web application. It delivers a fluid, interactive Kanban workspace where developers, project leads, and agile operators can create, assign, prioritize, track, filter, and complete engineering tasks across the three canonical sprint stages: `To Do`, `In Progress`, and `Done`.

Unlike monolithic legacy systems, SprintStack was designed with a client-server decoupled architecture: a modern **React 19 Single Page Application (SPA)** frontend running on Vite 6 that interfaces seamlessly via asynchronous JSON REST calls to a robust **Node.js and Express.js** backend. It provides smooth drag-and-drop task movements, dynamic live sprint metrics, deadline-aware overdue alerts, inline media previews, and secure stateless JSON Web Token (JWT) user authentication.

### 1.2 The Problem We Set Out to Solve
In modern software engineering education and practical industry environments, teams consistently face a painful dilemma when organizing sprint workflows:
1. **The SaaS Monolith Bloat (Jira, ClickUp, Asana):** Commercial enterprise tools are notorious for extreme complexity. They require lengthy configuration, steep onboarding, massive memory footprints in browser tabs, and multiple mandatory form fields just to log a quick bug. For small agile teams, sprint meetings frequently stall because managing the tracking software takes longer than shipping code.
2. **The Oversimplified To-Do List Trap:** Conversely, basic checklist applications (such as Apple Reminders or standard to-do tutorials) lack Kanban workflow progression, visual priority categorization, attachment handling, multi-criteria filtering, and collaborative user assignment.
3. **The Database Dependency Bottleneck:** During academic demonstrations, hackathons, and offline reviews, applications that rigidly depend on an external cloud database or a locally running MongoDB daemon fail catastrophically when the network drops or the local service isn't started.

### 1.3 The SprintStack Solution
SprintStack bridges this gap by delivering:
- A clean, lightning-fast Kanban workflow where tasks can be created, dragged, and edited in seconds.
- An architectural fallback storage engine that runs seamlessly whether MongoDB is online or offline.
- A tactile, distraction-free Bauhaus Neo-Brutalist design that prioritizes information density, legibility, and operational clarity.

### 1.4 Design Philosophy: Bauhaus Neo-Brutalism
SprintStack purposely repudiates the bland, blurry glassmorphism and pale pastel palettes that dominate contemporary corporate software. Instead, it adopts the historic functional principles of the **Bauhaus Art Movement** combined with modern **Neo-Brutalism**:
- **Form Follows Function:** Every visual component directly communicates operational status. Nothing is decorative without reason. High contrast borders (`3px solid #1D1D1D`) and hard offset drop shadows (`4px 4px 0 #1D1D1D`) give each card tactile physical weight on the screen.
- **Primary Color Theory:** Color is used exclusively for cognitive categorization: **Bauhaus Red (#E1251B)** denotes High Priority, **Bauhaus Yellow (#F0D700)** signifies Medium Priority, and **Bauhaus Blue (#0056A3)** marks Low Priority. The canvas features an architectural dot grid background.

---

## 2. Complete Technology Stack & Selection Rationale

Every single library, framework, and tool in SprintStack was chosen deliberately after evaluating practical alternatives.

| Layer / Role | Technology Chosen | Alternative Considered | Primary Reason for Choice |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React 19 | Vanilla JS / Angular | Declarative Virtual DOM; component reusability; Hooks for local and global state. |
| **Build Tool** | Vite 6 | Webpack / Create React App | Native ESM dev server; instant 200ms cold start; optimized Rollup production builds. |
| **Drag & Drop** | @hello-pangea/dnd (18.0) | HTML5 Native DnD / react-dnd | Smooth spring physics; full React 19 / StrictMode support; touch and a11y support. |
| **Backend Runtime** | Node.js (v20+) | Python / Java Spring Boot | Unified JavaScript across stack; non-blocking event loop; fast I/O throughput. |
| **REST Framework** | Express.js (4.21) | NestJS / Fastify | Lightweight, unopinionated middleware chaining; zero boilerplate for custom handlers. |
| **Primary Database** | MongoDB + Mongoose (9.7) | PostgreSQL / MySQL | Native JSON-like BSON document model; polymorphic task attributes; clean schemas. |
| **Resilient Store** | Local JSON Engine (Mutex) | SQLite / In-Memory Mock | Zero-install out-of-the-box operation; atomic file swaps; concurrent promise chain. |
| **Authentication** | JWT + bcryptjs (3.0) | Express Sessions / Passport | Stateless verification; no server session table; salted multi-round password hashing. |
| **CSS & Design** | Bootstrap 5 + Custom CSS | Tailwind CSS / Material UI | CDN baseline reset + custom Bauhaus variables; high contrast without bloated classes. |
| **Attachment Engine** | HTML5 FileReader (Base64) | AWS S3 / Multer Disk Storage | Zero cloud storage dependency; 100% self-contained database persistence for media. |

### 2.1 Frontend: Why React 19?
For a dynamic Kanban board where cards are continually dragged between three columns, edited in modals, and filtered in real time, manual DOM manipulation in vanilla JavaScript quickly degenerates into an unmaintainable tangle of `document.querySelector` calls, broken event listeners, and unsynchronized variables.

**React 19** was selected because it solves the UI-state synchronization problem mathematically: the interface is a pure function of state (`UI = f(state)`). When a task's status changes from "To Do" to "In Progress", React's reconciliation engine calculates the minimal diff on the Virtual DOM and updates only the specific card and column containers, leaving the rest of the application completely undisturbed.

### 2.2 Build Tool: Why Vite 6 Over Webpack / CRA?
Historical React workflows relied on Create React App (CRA), which used Webpack to bundle hundreds of JavaScript modules into a gigantic memory bundle before the developer could see a single line render. CRA is now deprecated, slow (often taking 30–60 seconds to boot), and plagued by outdated dependency warnings.

**Vite 6** revolutionizes this workflow by serving source code over native browser **ES Modules (ESM)**. During development, Vite does not bundle your code at all—it lets the browser request each file on demand. Cold start takes less than 300 milliseconds. When a component file is modified, Vite's **Hot Module Replacement (HMR)** injects the updated module instantly without reloading the browser tab, preserving the user's current session state.

### 2.3 Drag-and-Drop: Why @hello-pangea/dnd?
Writing drag-and-drop using the native HTML5 Drag and Drop API is notoriously brittle: it displays awkward ghost artifacts, fails on mobile touchscreens without polyfills, and provides zero animation physics. Furthermore, Atlassian's famous `react-beautiful-dnd` library was abandoned and crashes under modern React 18/19 StrictMode.

**@hello-pangea/dnd** is an actively maintained, battle-tested community fork specifically updated for modern React. It provides physics-based drop animations, full keyboard accessibility (allowing operators to pick up cards with spacebar, navigate columns with arrow keys, and drop them seamlessly), and clean structural abstractions:
- `<DragDropContext onDragEnd={handleDragEnd}>`: Top-level coordinator that handles the drop lifecycle.
- `<Droppable droppableId="In Progress">`: Marks a column as a target drop zone and tracks hover states.
- `<Draggable draggableId={task.id} index={index}>`: Wraps the individual task card, attaching drag handles and pointer listeners.

### 2.4 Backend: Why Node.js & Express.js?
By employing Node.js across the backend, our engineering stack achieves **isomorphic JavaScript**. Developers write JavaScript on both client and server, sharing data structures, validation rules, and JSON schemas without having to translate concepts between languages (e.g., Python dictionaries or Java DTOs).

Node's non-blocking, asynchronous event loop is ideally suited for RESTful microservices. While traditional multi-threaded servers (such as Apache Tomcat or Java servlets) allocate a heavy OS thread for every incoming HTTP connection, Node.js delegates all database and file I/O to libuv worker threads, allowing a single server process to service thousands of concurrent API requests with negligible CPU and RAM consumption.

**Express.js** was chosen as the framework because of its elegant middleware pipeline. Adding CORS security, JSON body parsing, request logging, and JWT authentication guards requires only a few clear lines of code.

### 2.5 Database: Why MongoDB & Mongoose?
Agile sprint tasks are inherently semi-structured. A task may have an optional description, dynamic tags, polymorphic attachments (either an image thumbnail or a generic document), an assignee string, and due dates. Relational databases like MySQL or PostgreSQL require rigid column definitions, foreign keys, and migration scripts whenever a new field is introduced.

**MongoDB** stores data as flexible BSON documents that map directly to JavaScript objects. **Mongoose** acts as an Object Data Modeling (ODM) layer, providing strict schema guarantees, automatic validation, default timestamps, and JSON serialization helpers.

### 2.6 The Resilient Dual-Mode Architecture (Local File Fallback)
A critical engineering innovation in SprintStack is its **graceful degradation engine**. In real-world academic evaluations or quick local testing, developers frequently do not have MongoDB running locally or have an invalid connection string. In standard MERN projects, the backend immediately crashes with `MongoNetworkError`, halting the entire application.

In SprintStack, `server.js` connects to MongoDB with a short 2500ms timeout. If MongoDB is unreachable, the server catches the error, sets `useLocalStore = true`, and transparently routes all database operations (user creation, login, task updates, deletes) to an atomic JSON file at `backend/data/local-dev.json`.

**Concurrency Safety in Local File Storage:** To prevent file corruption from race conditions during concurrent HTTP requests, SprintStack serializes writes using a promise-based mutex chain (`localWrites = operation.catch(...)`) and performs **atomic file replacement**: it writes data to `local-dev.json.tmp` first, and then executes an atomic OS rename (`fs.rename`). This guarantees zero data loss or partial writes even during sudden power failure!

### 2.7 Security: Why JWT & bcryptjs?
Traditional web authentication stores session IDs in server memory or a Redis cache, requiring stateful lookups on every single incoming HTTP request. This creates scalability bottlenecks and cross-origin cookie complications.

SprintStack uses **JSON Web Tokens (JWT)** for stateless authorization. Upon successful login, the server signs a cryptographic token containing the user's ID and username with HMAC-SHA256 and a 7-day expiration. The client stores this in `localStorage` and attaches it in the `Authorization: Bearer <token>` header. The server verifies the token signature mathematically without touching the database.

Passwords are never stored in plaintext. We utilize **bcryptjs** with 10 salt rounds. bcrypt combines an adaptive key derivation function with an internal salt, rendering brute-force dictionary attacks and precomputed rainbow table lookups computationally infeasible.

---

## 3. System Architecture & The "Connections"

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|  [React 19 SPA (Vite Dev / Static Dist)]                                              |
|  +---------------------+   +---------------------+   +-----------------------------+  |
|  |     AuthContext     |   |     TaskContext     |   |    @hello-pangea/dnd        |  |
|  | (Token/User State)  |   | (Tasks/CRUD State)  |   | (DragDropContext/Droppable) |  |
|  +----------+----------+   +----------+----------+   +--------------+--------------+  |
|             |                         |                             |                 |
|             +-------------------------+-----------------------------+                 |
|                                       | (Fetch API Calls)                             |
+---------------------------------------|-----------------------------------------------+
                                        | HTTP / JSON (Port 5000)
                                        | Headers: Authorization: Bearer <token>
                                        v
+---------------------------------------------------------------------------------------+
|                                    BACKEND LAYER                                      |
|  [Node.js + Express.js REST API Server]                                               |
|  +---------------------------------------------------------------------------------+  |
|  | Middleware Pipeline: cors() -> express.json({limit: '8mb'}) -> requireAuth()   |  |
|  +---------------------------------------------------------------------------------+  |
|  | Endpoints:                                                                      |  |
|  | - /api/register & /api/login  -> bcrypt password verification & JWT token sign   |  |
|  | - /api/tasks (GET, POST)     -> listTasks(), createTask()                        |  |
|  | - /api/tasks/:id (PUT/PATCH) -> updateTask(), moveTask()                         |  |
|  | - /api/tasks/:id (DELETE)    -> removeTask()                                     |  |
|  +----------------------------------------+----------------------------------------+  |
|                                           |                                           |
|                     +---------------------+---------------------+                     |
|                     | [Database Selector: useLocalStore Flag]   |                     |
|                     +---------------------+---------------------+                     |
|                                           |                                           |
|                   IF MongoDB Connected    |    IF MongoDB Offline                     |
|                   v                       |    v                                      |
|       +-----------------------+           |        +------------------------------+   |
|       |     Mongoose ODM      |           |        | Local JSON Storage Engine    |   |
|       | (User.js & Task.js)   |           |        | (Atomic tmp file + rename)   |   |
|       +-----------+-----------+           |        +--------------+---------------+   |
+-------------------|-----------------------------------------------|-------------------+
                    |                                               |
                    v                                               v
     +------------------------------+               +-------------------------------+
     |  MongoDB Database Instance   |               | local-dev.json File on Disk   |
     | (mongodb://127.0.0.1:27017)  |               | (backend/data/local-dev.json) |
     +------------------------------+               +-------------------------------+
```

### 3.1 How Frontend Connects to Backend
1. **Base URL Resolution:** In `AuthContext.jsx` and `TaskContext.jsx`, the API root defaults to `http://localhost:5000` via `(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '')`.
2. **CORS Handshake:** Configured in `server.js` using `app.use(cors({ origin: process.env.FRONTEND_URL || '*' }))`.
3. **Stateless Authorization Injection:** Reusable `request()` helper in `TaskContext.jsx` injects `Authorization: Bearer <token>` into fetch headers automatically.

### 3.2 Drag-and-Drop State Sync Pipeline
1. User drops a card into a new column.
2. `@hello-pangea/dnd` triggers `onDragEnd({ destination, source, draggableId })`.
3. `TaskBoard.jsx` detects column change and calls `moveTask(draggableId, destination.droppableId)`.
4. `TaskContext` dispatches `PATCH /api/tasks/:id/status` with `{ status: destination.droppableId }`.
5. Express `requireAuth` validates token, database updates record, and `refreshTasks()` re-fetches latest tasks, dynamically recalculating the progress bar.

---

## 4. Complete File-by-File Codebase Directory Audit

### Backend Files
- `server.js`: Express app initialization, CORS, 8MB JSON limit, MongoDB connection with 2.5s fallback, atomic local JSON storage engine, `requireAuth` middleware, and all REST endpoints.
- `models/User.js`: Schema for users (username, email, hashed password).
- `models/Task.js`: Schema for tasks (title, description, status, priority, category, attachment, dueDate, assignee, timestamps) with custom `toJSON` id transform.
- `data/local-dev.json`: Mock database file storing users and tasks for zero-dependency local runs.
- `.env` & `.env.example`: Server port, MongoDB URI, JWT secret, and Frontend origin settings.
- `package.json`: Backend dependencies and scripts (`start`, `dev`).

### Frontend Files
- `index.html`: Entry shell with Plus Jakarta Sans font and Bootstrap 5 CDN.
- `vite.config.js`: Vite server on port 3000 with React plugin.
- `vercel.json`: Single Page Application rewrite rule routing `/(.*)` to `/index.html`.
- `src/main.jsx`: React entry point rendering `<App />` inside `<StrictMode>`.
- `src/App.jsx`: Top-level coordinator rendering `AuthPage` if unauthenticated, or `TaskBoard` wrapped in `TaskProvider` if authenticated.
- `src/context/AuthContext.jsx`: Authentication state provider managing login, register, logout, and localStorage session persistence.
- `src/context/TaskContext.jsx`: Task state manager providing CRUD operations (`createTask`, `updateTask`, `moveTask`, `deleteTask`, `refreshTasks`).
- `src/components/TaskBoard.jsx`: Dashboard layout with header, live API status dot, user profile, search bar, filter chips, `ProgressChart`, and Kanban column containers.
- `src/components/Column.jsx`: Individual Kanban column wrapping `@hello-pangea/dnd` `Droppable`, count badge, and task cards.
- `src/components/TaskCard.jsx`: Individual task item wrapped in `Draggable`, showing badges, action buttons, overdue alert, and attachment preview/download pill.
- `src/components/TaskModal.jsx`: Modal form for task creation/editing with drag-and-drop file upload zone.
- `src/components/TaskViewModal.jsx`: Detailed read-only modal for inspecting full task descriptions and attachments.
- `src/components/AuthPage.jsx`: Authentication form toggling between login and registration.
- `src/index.css`: Comprehensive Bauhaus Neo-Brutalist stylesheet with custom properties, hard shadows, and architectural dot grid.

### Testing Files
- `postman/SprintStack.postman_collection.json`: Complete automated Postman test suite with variable assertions and token propagation.

---

## 5. UI Architecture & Feature Mechanics

1. **User Authentication & Session Persistence:** Smooth login/register toggle with 7-day token caching in `localStorage`.
2. **Real-Time Backend Connectivity Monitor:** Live green/red pulsing dot indicating `API Online` or `API Offline` with automatic retry button.
3. **Live Sprint Progress Analytics (ProgressChart):** 4 stat cards (To Do, In Progress, Done, Total) and animated percentage completion bar (`Math.round(done / total * 100)`).
4. **Multi-Factor Search & Filtering:** Instant client-side filtering supporting text search, High Priority, Overdue tasks, Assigned to Me, and Bugs.
5. **Interactive Kanban Columns:** 3 workflow lanes (To Do, In Progress, Done) with drag-over dashed border animations.
6. **Task Cards & Overdue Intelligence:** Dynamic date calculation checking if `dueDate < new Date()` and `status !== 'Done'`, applying red badges and alerts.
7. **Client-Side File Attachments:** Drag-and-drop zone converting files up to 5MB into Base64 Data URLs via HTML5 `FileReader`.

---

## 6. REST API Specification

| Method | Endpoint | Auth Required | Request Body | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | None | Returns server health and active database engine. |
| `POST` | `/api/register` | No | `{ username, email, password }` | Registers user, hashes password, returns 7-day JWT. |
| `POST` | `/api/login` | No | `{ identifier, password }` | Authenticates user by username/email, returns JWT. |
| `GET` | `/api/users` | Yes | None | Returns list of registered operators. |
| `GET` | `/api/tasks` | Yes | None | Returns all tasks sorted by creation date descending. |
| `POST` | `/api/tasks` | Yes | `{ title, description, ... }` | Creates a new task. |
| `PUT` | `/api/tasks/:id` | Yes | Full task payload | Updates all fields of an existing task. |
| `PATCH` | `/api/tasks/:id/status`| Yes | `{ status }` | Updates only the status column of a task. |
| `DELETE`| `/api/tasks/:id` | Yes | None | Deletes a task by ID. |

---

## 7. Installation, Local Execution & Deployment Manual

### Backend Execution
```sh
cd backend
npm install
npm start
# Server listens on http://localhost:5000
```

### Frontend Execution
```sh
cd frontend
npm install
npm run dev
# Vite serves on http://localhost:3000
```

### Production Build & Deployment
```sh
cd frontend
npm run build
# Outputs optimized static files to frontend/dist
# Deploy dist/ to Tomcat webapps/ROOT or Vercel
```

---

## 8. Viva Voce & Technical Defense Q&A Preparation

- **Q1: Why React SPA over Multi-Page Application?**  
  *Answer:* Avoids jarring full-page reloads when dragging tasks or changing filters. React updates only modified DOM nodes via its Virtual DOM diffing.
- **Q2: How does JWT authentication protect endpoints?**  
  *Answer:* The server signs `{ id, username }` with a private secret. The client passes this in `Authorization: Bearer <token>`. The `requireAuth` middleware verifies the cryptographic signature without querying the database on every request.
- **Q3: What happens if MongoDB fails?**  
  *Answer:* SprintStack catches connection timeout after 2.5s, sets `useLocalStore = true`, and safely routes reads/writes to `backend/data/local-dev.json` using atomic temporary file swaps and a promise-chained write mutex.
- **Q4: How are file attachments handled without AWS S3?**  
  *Answer:* Files under 5MB are converted on the client into Base64 Data URLs via HTML5 `FileReader.readAsDataURL()` and stored directly in the task document.

---

## 9. Conclusion & Engineering Roadmaps
SprintStack achieves all primary objectives of the Third Year Web Technology curriculum: modular full-stack architecture, resilient dual-mode persistence, stateless security, physics-based drag-and-drop, and an accessible, high-contrast Bauhaus Neo-Brutalist interface.

Future enhancements include bidirectional WebSocket synchronization via Socket.io, subtask checklist arrays, role-based access control (RBAC), and markdown previewers for task descriptions.
