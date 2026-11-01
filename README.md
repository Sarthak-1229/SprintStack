# SprintStack

A real-time Kanban board built as a Web Technology assignment.

## Tech Stack

- Frontend: React.js, Vite, Custom CSS
- Backend: Node.js, Express, Socket.IO, MongoDB

## Features

- JWT Authentication
- Real-time WebSocket synchronization across clients
- Drag-and-drop task management

## How to Run Locally

1. Set up your `.env` file in the `backend/` folder with `PORT=5000`, `MONGODB_URI`, and `JWT_SECRET`.
2. Open two terminals.
3. Terminal 1 (Backend): `cd backend && npm install && npm start`
4. Terminal 2 (Frontend): `cd frontend && npm install && npm run dev`