# SprintStack - Web Technology Assignment

A Kanban board task management system built strictly aligned with university Web Technology syllabus using HTML5, Bootstrap 5, ReactJS, NodeJS, ExpressJS, REST APIs, and MongoDB.

## Tech Stack

- **Frontend**: HTML5, CSS3, Bootstrap 5 (CDN), ReactJS (Vite)
- **Backend**: NodeJS, ExpressJS, RESTful API
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & bcryptjs

## Key Features

1. **Standard RESTful API**: Full CRUD operations (`GET`, `POST`, `PUT`, `DELETE`) with JSON responses.
2. **Pure React State Management**: Managed using React hooks and standard `fetch` calls without WebSockets.
3. **Button-Driven Status Transitions**: Tasks are moved between columns ("To Do", "In Progress", "Done") via explicit `PUT` requests rather than external drag-and-drop libraries.
4. **Bootstrap 5 UI**: Fully responsive layout using the standard Bootstrap 5 grid system (`container`, `row`, `col`), cards, buttons, badges, and modals.
5. **Strict Validation**:
   - **Client-Side**: React validation displaying Bootstrap `text-danger` alerts for missing required fields.
   - **Server-Side**: Express route validation enforcing field constraints and returning `400 Bad Request` with structured JSON error messages.

## Project Structure

```
Internship_assignment/
├── backend/
│   ├── models/
│   │   ├── Task.js           # Task schema (title, description, status, priority, category, assignee, dueDate)
│   │   └── User.js           # User schema (username, email, password)
│   ├── .env.example          # Environment variables template
│   ├── package.json          # Express, Mongoose, bcryptjs, jsonwebtoken, cors, dotenv
│   └── server.js             # Pure RESTful Express API with CRUD & validation
└── frontend/
    ├── index.html            # Bootstrap 5 CDN integration
    ├── package.json          # React 19, React-DOM, Vite
    ├── vite.config.js
    └── src/
        ├── App.jsx           # Main application routing & auth check
        ├── main.jsx          # React DOM root render
        ├── index.css         # Minimal styling
        ├── components/
        │   ├── AuthPage.jsx  # Login/Register with Bootstrap & validation
        │   ├── Column.jsx    # Bootstrap column container
        │   ├── TaskBoard.jsx # Kanban board with Bootstrap grid & navbar
        │   ├── TaskCard.jsx  # Task card with "Move to" status buttons
        │   └── TaskModal.jsx # Create/Edit task modal with Bootstrap & validation
        └── context/
            ├── AuthContext.jsx # Authentication state & API calls
            └── TaskContext.jsx # REST API state management (fetch)
```

## Running the Application

### 1. Backend
```bash
cd backend
npm install
npm start
```
Default port: `5000`

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Default port: `3000`
