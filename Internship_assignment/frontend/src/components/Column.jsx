import React from "react";
import TaskCard from "./TaskCard";

function Column({ col, tasks, onAddTask, onEditTask }) {
  return (
    <div className="card shadow-sm h-100">
      <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
        <span className="fw-bold">
          {col.label}{" "}
          <span className="badge bg-light text-dark ms-2">{tasks.length}</span>
        </span>
        <button
          className="btn btn-sm btn-outline-light"
          onClick={onAddTask}
          title={`Add task to ${col.label}`}
        >
          +
        </button>
      </div>
      <div className="card-body" style={{ minHeight: "200px" }}>
        {tasks.length === 0 ? (
          <p className="text-muted text-center mt-4">No tasks</p>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEditTask} />
          ))
        )}
      </div>
    </div>
  );
}

export default React.memo(Column);
