import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  AlertTriangle,
  Paperclip,
  Calendar,
  Clock,
  User,
  GitCommit
} from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function TaskViewModal({ task, onClose }) {
  const { user } = useAuth();
  if (!task) return null;

  const isImage =
    task.attachment &&
    (task.attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(task.attachment));

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '0.85rem', background: 'var(--accent-black)', color: '#fff', padding: '0.15rem 0.45rem' }}>
              {task.taskId || 'TASK'}
            </span>
            <h2 className="modal-title">{task.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="task-view-content" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span className={`priority-badge ${task.priority}`}>{task.priority} Priority</span>
            <span className="category-badge">{task.category}</span>
            <span className="category-badge" style={{ background: 'var(--bg-color)', color: 'var(--text-color)' }}>
              Status: <strong>{task.status}</strong>
            </span>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Description</h4>
            <div style={{ background: 'var(--bg-color)', padding: '1rem', border: '2px solid var(--border-color)', minHeight: '80px', whiteSpace: 'pre-wrap' }}>
              {task.description || <em style={{ color: 'var(--text-muted)' }}>No description provided.</em>}
            </div>
          </div>

          {/* Commit Info if Done */}
          {task.status === 'Done' && task.commitInfo && (
            <div style={{ marginBottom: '1.5rem', background: '#f0fdf4', border: '2px solid #86efac', padding: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: '800', color: '#166534', marginBottom: '0.25rem' }}>
                <GitCommit size={15} />
                <span>Verified by Commit #{task.commitInfo.commitHash}</span>
              </div>
              <p style={{ fontStyle: 'italic', color: '#1f2937', fontSize: '0.85rem', margin: '0.25rem 0' }}>
                &ldquo;{task.commitInfo.commitMessage}&rdquo;
              </p>
              <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
                Author: @{task.commitInfo.author || 'committer'} &bull; {task.commitInfo.committedAt ? new Date(task.commitInfo.committedAt).toLocaleString() : ''}
              </span>
            </div>
          )}

          <div className="form-row" style={{ marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Assigned To</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {task.assignee ? (
                  <>
                    <div 
                      className="task-assignee-avatar" 
                      style={{ 
                        position: 'relative', right: 'auto', bottom: 'auto',
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
                    <strong>@{task.assignee}</strong>
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                )}
              </div>
            </div>
            
            <div style={{ flex: 1 }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Timeline</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {task.createdAt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}>
                    <Clock size={12} />
                    <span>Added: <strong>{formatDate(task.createdAt)}</strong></span>
                  </span>
                )}
                {task.dueDate && (
                  <span className={isOverdue ? 'overdue-text' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.82rem' }}>
                    <Calendar size={12} />
                    <span>Due: <strong>{formatDate(task.dueDate)}</strong></span>
                    {isOverdue && <AlertTriangle size={12} color="var(--accent-red)" />}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>Attachment</h4>
            {isImage ? (
              <a href={task.attachment} target="_blank" rel="noreferrer">
                <img src={task.attachment} alt="Attachment Preview" style={{ maxWidth: '100%', maxHeight: '300px', border: '2px solid var(--border-color)' }} />
              </a>
            ) : task.attachment ? (
              <a 
                href={task.attachment} 
                download={task.attachmentName || 'downloaded_file'} 
                className="file-preview-chip" 
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
              >
                <Paperclip size={13} />
                <span>{task.attachmentName || 'Download File'}</span>
              </a>
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No attachments</span>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Close Details</button>
        </div>
      </div>
    </div>
  );
}

export default TaskViewModal;
