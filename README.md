# SprintStack

A Kanban board task management system built as a Web Technology university assignment using the standard MERN stack and Bootstrap 5.

## Tech Stack (University Syllabus Aligned)

- **Frontend**: HTML5, Bootstrap 5 (CDN), ReactJS (Vite)
- **Backend**: NodeJS, ExpressJS, RESTful APIs
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & bcryptjs

## Key Features

- **Standard REST API**: Full CRUD operations (`GET`, `POST`, `PUT`, `DELETE`) with JSON responses.
- **Pure React State Management**: Synchronized via asynchronous `fetch` calls without WebSockets.
- **Button-Driven Status Transitions**: Tasks are moved between columns ("To Do", "In Progress", "Done") via explicit `PUT` requests rather than external drag-and-drop libraries.
- **Bootstrap 5 UI**: Fully responsive layout using the standard Bootstrap 5 grid system (`container`, `row`, `col`), cards, buttons, badges, and modals.
- **Strict Validation**:
  - **Client-Side**: React validation displaying Bootstrap `text-danger` alerts for missing required fields.
  - **Server-Side**: Express route validation enforcing field constraints and returning `400 Bad Request` with structured JSON error messages.

## How to Run Locally

### 1. Backend Setup
```bash
cd Internship_assignment/backend
npm install
npm start
```
*Runs on `http://localhost:5000`.*

### 2. Frontend Setup
```bash
cd Internship_assignment/frontend
npm install
npm run dev
```
*Runs on `http://localhost:3000`.*
