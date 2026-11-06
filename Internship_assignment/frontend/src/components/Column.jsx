import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Lock,
  Plus
} from 'lucide-react';
import TaskCard from './TaskCard';

function Column({ col, tasks, onAddTask, onEditTask, onViewTask, canAddTask }) {
  const isDoneColumn = col.id === 'Done';

  const renderEmptyIcon = () => {
    switch (col.id) {
      case 'To Do':
        return <ClipboardList size={26} color="var(--text-muted)" />;
      case 'In Progress':
        return <Clock size={26} color="var(--text-muted)" />;
      case 'Done':
        return <CheckCircle2 size={26} color="#16a34a" />;
      default:
        return <ClipboardList size={26} color="var(--text-muted)" />;
    }
  };

  return (
    <div className={`column-container ${col.cssClass}`}>
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-dot" />
          <h2 className="column-title" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>{col.label}</span>
            {isDoneColumn && <Lock size={12} color="var(--accent-black)" />}
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
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={14} />
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
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Lock size={10} />
            <span>COMMIT ONLY</span>
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
                <div className="column-empty-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.35rem' }}>
                  {renderEmptyIcon()}
                </div>
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
