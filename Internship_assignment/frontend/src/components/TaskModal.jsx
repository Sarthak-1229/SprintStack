import React, { useState } from "react";
import { useTaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";

const PRIORITIES = ["Low", "Medium", "High"];
const CATEGORIES = ["Feature", "Bug", "Enhancement"];
const STATUSES = ["To Do", "In Progress", "Done"];

function TaskModal({ onClose, editingTask, defaultColumn }) {
  const { createTask, updateTask } = useTaskContext();
  const { user } = useAuth();

  const [title, setTitle] = useState(editingTask?.title || "");
  const [description, setDescription] = useState(
    editingTask?.description || ""
  );
  const [priority, setPriority] = useState(editingTask?.priority || "Medium");
  const [category, setCategory] = useState(editingTask?.category || "Feature");
  const [status, setStatus] = useState(
    editingTask?.status || defaultColumn || "To Do"
  );
  const [dueDate, setDueDate] = useState(
    editingTask?.dueDate
      ? new Date(editingTask.dueDate).toISOString().split("T")[0]
      : ""
  );
  const [fieldErrors, setFieldErrors] = useState({});

  const isEditing = !!editingTask;

  const validate = () => {
    const errors = {};
    if (!title.trim()) errors.title = "Task title is required.";
    if (!status) errors.status = "Status is required.";
    if (!priority) errors.priority = "Priority is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description,
      priority,
      category,
      status,
      assignee: user?.username || null,
      dueDate: dueDate || null,
    };

    if (isEditing) {
      updateTask({ ...editingTask, ...payload });
    } else {
      createTask(payload);
    }
    onClose();
  };

  return (
    <div
      className="modal d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {isEditing ? "Edit Task" : "New Task"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-body">
              {/* Title */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.title ? "is-invalid" : ""}`}
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                {fieldErrors.title && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.title}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Add more context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Priority & Category */}
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label fw-semibold">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.priority && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.priority}
                    </div>
                  )}
                </div>
                <div className="col-6">
                  <label className="form-label fw-semibold">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {fieldErrors.status && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.status}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              {/* Assignee (read-only) */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Assignee</label>
                <input
                  type="text"
                  className="form-control"
                  value={user?.username || "Unassigned"}
                  disabled
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {isEditing ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;
