import React from "react";
import { useTaskContext } from "../context/TaskContext";

function TaskCard({ task, onEdit }) {
  const { deleteTask, moveTask } = useTaskContext();

  const getMovableStatuses = () => {
    const all = ["To Do", "In Progress", "Done"];
    return all.filter((s) => s !== task.status);
  };

  const priorityBadge = {
    High: "bg-danger",
    Medium: "bg-warning text-dark",
    Low: "bg-success",
  };

  return (
    <div className="card mb-3 border">
      <div className="card-body p-3">
        {/* Header: badges + actions */}
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span
              className={`badge ${priorityBadge[task.priority] || "bg-secondary"} me-1`}
            >
              {task.priority}
            </span>
            <span className="badge bg-info text-dark">{task.category}</span>
          </div>
          <div>
            <button
              className="btn btn-sm btn-outline-secondary me-1"
              onClick={() => onEdit(task)}
              title="Edit"
            >
              ✏️
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => deleteTask(task.id)}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Title */}
        <h6 className="card-title fw-bold">{task.title}</h6>

        {/* Description */}
        {task.description && (
          <p className="card-text text-muted small">{task.description}</p>
        )}

        {/* Meta info */}
        <div className="d-flex flex-wrap gap-2 mb-2 small text-muted">
          {task.assignee && <span>👤 {task.assignee}</span>}
          {task.dueDate && (
            <span
              className={
                new Date(task.dueDate) < new Date() && task.status !== "Done"
                  ? "text-danger fw-bold"
                  : ""
              }
            >
              📅 {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Move Buttons */}
        <div className="d-flex gap-2 mt-2">
          {getMovableStatuses().map((status) => (
            <button
              key={status}
              className="btn btn-sm btn-outline-primary"
              onClick={() => moveTask(task.id, status)}
            >
              Move to {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(TaskCard);
