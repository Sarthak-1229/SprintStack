import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

function Column({ col, tasks, onAddTask, onEditTask, onViewTask, canAddTask }) {
  const isDoneColumn = col.id === 'Done';

  return (
    <div className={`column-container ${col.cssClass}`}>
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-dot" />
          <h2 className="column-title">
            {isDoneColumn ? 'Done 🔒' : col.label}
          </h2>
          <span className="task-count">{tasks.length}</span>
        </div>

        {/* Add task button only on To Do / In Progress, and only for Admins */}
        {!isDoneColumn && canAddTask && (
          <button
            className="add-task-btn"
            id={`add-task-btn-${col.id.replace(/\s+/g, '-').toLowerCase()}`}
            onClick={onAddTask}
            title={`Add task to ${col.label}`}
            aria-label={`Add task to ${col.label}`}
          >
            +
          </button>
        )}

        {isDoneColumn && (
          <span
            className="commit-lock-badge"
            title="Tasks in this column are completed strictly via Git commit containing the Task ID"
            style={{
              fontSize: '0.65rem',
              fontWeight: '900',
              background: '#fef08a',
              border: '1px solid var(--accent-black)',
              padding: '0.15rem 0.4rem',
              letterSpacing: '0.5px'
            }}
          >
            COMMIT ONLY
          </span>
        )}
      </div>

      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="column-empty">
                <span className="column-empty-icon">{col.emptyIcon}</span>
                <span>{col.emptyText}</span>
                {isDoneColumn && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Push a commit with Task ID to complete
                  </span>
                )}
              </div>
            )}

            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onView={() => onViewTask(task)}
              />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default React.memo(Column);
