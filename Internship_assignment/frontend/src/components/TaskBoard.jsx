import React, { useState } from "react";
import { useTaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import Column from "./Column";
import TaskModal from "./TaskModal";

const COLUMNS = [
  { id: "To Do", label: "To Do" },
  { id: "In Progress", label: "In Progress" },
  { id: "Done", label: "Done" },
];

function TaskBoard() {
  const { tasks, loading } = useTaskContext();
  const { user, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState("To Do");

  const openAddModal = (columnId = "To Do") => {
    setEditingTask(null);
    setDefaultColumn(columnId);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "100vh" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold">📋 SprintStack</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-light">👤 {user?.username}</span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={logout}
            >
              Logout
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openAddModal("To Do")}
            >
              + New Task
            </button>
          </div>
        </div>
      </nav>

      {/* Task Columns */}
      <div className="container-fluid mt-4 px-4">
        <div className="row g-4">
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div className="col-lg-4 col-md-6" key={col.id}>
                <Column
                  col={col}
                  tasks={columnTasks}
                  onAddTask={() => openAddModal(col.id)}
                  onEditTask={openEditModal}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Modal */}
      {modalOpen && (
        <TaskModal
          onClose={() => setModalOpen(false)}
          editingTask={editingTask}
          defaultColumn={defaultColumn}
        />
      )}
    </div>
  );
}

export default TaskBoard;
