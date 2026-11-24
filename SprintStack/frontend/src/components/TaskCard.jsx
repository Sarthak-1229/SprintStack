import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function TaskCard({ task, index, onEdit, onView }) {
  const { deleteTask } = useTaskContext();
  const { user } = useAuth();

  const isImage =
    task.attachment &&
    (task.attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(task.attachment));

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`task-card priority-${task.priority} ${snapshot.isDragging ? 'dragging' : ''} ${isOverdue ? 'overdue' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-testid={`task-card-${task.id}`}
          aria-label={`Task: ${task.title}`}
          onClick={onView}
          style={{ cursor: 'pointer', ...provided.draggableProps.style }}
        >
          {/* Task ID and Git Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                fontWeight: '900',
                background: 'var(--accent-black, #1D1D1D)',
                color: '#ffffff',
                padding: '0.15rem 0.45rem',
                borderRadius: '2px',
                letterSpacing: '0.5px'
              }}
              title="Task ID (use in git commit -m 'TASK-XXX: message')"
            >
              {task.taskId || 'TASK'}
            </span>
            {task.status === 'Done' && task.commitInfo?.commitHash && (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: '700',
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '2px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem'
                }}
              >
                ✓ Git Verified
              </span>
            )}
          </div>

          {/* Header row */}
          <div className="task-header">
            <div className="task-badges">
              <span className={`priority-badge ${task.priority}`} data-testid="priority-badge">
                {task.priority}
              </span>
              <span className="category-badge" data-testid="category-badge">
                {task.category}
              </span>
            </div>
            <div className="task-actions">
              <button
                className="task-action-btn edit"
                id={`edit-task-${task.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                title="Edit task"
                aria-label="Edit task"
              >
                ✏️
              </button>
              {user && (
                <button
                  className="task-action-btn delete"
                  id={`delete-task-${task.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  title="Delete task"
                  aria-label="Delete task"
                >
                  🗑
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="task-title">{task.title}</h3>

          {/* Description */}
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}

          {/* Image preview */}
          {isImage && (
            <img
              src={task.attachment}
              alt="attachment"
              className="task-attachment-preview"
            />
          )}

          {/* Commit Info Banner for Done Tasks */}
          {task.status === 'Done' && task.commitInfo && (
            <div
              className="task-commit-banner"
              style={{
                marginTop: '0.5rem',
                marginBottom: '0.5rem',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                padding: '0.4rem 0.5rem',
                fontSize: '0.72rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '800', color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>🌿</span>
                  {task.commitInfo.commitUrl ? (
                    <a
                      href={task.commitInfo.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#15803d', textDecoration: 'underline', fontWeight: 800 }}
                      title="View commit on GitHub"
                    >
                      #{task.commitInfo.commitHash ? task.commitInfo.commitHash.substring(0, 7) : 'commit'} ↗
                    </a>
                  ) : (
                    <span>#{task.commitInfo.commitHash ? task.commitInfo.commitHash.substring(0, 7) : 'commit'}</span>
                  )}
                </span>
                <span style={{ color: '#4b5563', fontSize: '0.68rem' }}>
                  by @{task.commitInfo.author || 'developer'}
                </span>
              </div>
              {task.commitInfo.commitMessage && (
                <span style={{ color: '#374151', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  &ldquo;{task.commitInfo.commitMessage}&rdquo;
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="task-footer" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {task.assignee && (
              <div 
                className="task-assignee-avatar" 
                title={`Assigned to ${task.assignee}`}
                style={{
                  border: '2px solid var(--accent-black)',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: 'var(--accent-black)',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  fontSize: '0.85rem'
                }}
              >
                {task.assignee.charAt(0).toUpperCase()}
              </div>
            )}
            {task.attachment && !isImage && (
              <a 
                href={task.attachment}
                download={task.attachmentName || 'download'}
                className="task-attachment-pill" 
                style={{ textDecoration: 'none', color: 'inherit', marginLeft: '0.5rem' }}
                onClick={(e) => e.stopPropagation()}
              >
                📎 {task.attachmentName || 'Attachment'}
              </a>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              {task.dueDate && (
                <span className={`task-date ${isOverdue ? 'overdue-text' : ''}`}>
                  🎯 Due: {formatDate(task.dueDate)}
                </span>
              )}
              {task.createdAt && (
                <span className="task-date">
                  📅 Added: {formatDate(task.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default React.memo(TaskCard);
