import React, { useState, useRef, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  Info,
  Paperclip,
  X,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const PRIORITIES = ['Low', 'Medium', 'High'];
const CATEGORIES = ['Feature', 'Bug', 'Design', 'Research', 'Enhancement'];
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

function TaskModal({ onClose, editingTask, defaultColumn }) {
  const { createTask, updateTask } = useTaskContext();
  const { user } = useAuth();
  const { currentProject } = useProject();

  const isAdmin =
    user?.role === 'admin' ||
    user?.username === 'sarthak' ||
    user?.username === currentProject?.ownerUsername;

  const [title, setTitle] = useState(editingTask?.title || '');
  const [description, setDescription] = useState(editingTask?.description || '');
  const [priority, setPriority] = useState(editingTask?.priority || 'Medium');
  const [category, setCategory] = useState(editingTask?.category || 'Feature');
  const [status, setStatus] = useState(
    editingTask?.status || (defaultColumn === 'Done' ? 'To Do' : defaultColumn || 'To Do')
  );
  const [attachment, setAttachment] = useState(editingTask?.attachment || null);
  const [attachmentName, setAttachmentName] = useState(editingTask?.attachmentName || '');
  const [assignee, setAssignee] = useState(editingTask?.assignee || '');
  const [membersList, setMembersList] = useState([]);
  const [dueDate, setDueDate] = useState(
    editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : ''
  );

  const [titleWarning, setTitleWarning] = useState('');
  const [fileError, setFileError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const isEditing = !!editingTask;

  useEffect(() => {
    // Collect project members
    if (currentProject?.members && currentProject.members.length > 0) {
      setMembersList(currentProject.members);
    } else {
      const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
      const token = localStorage.getItem('token');
      fetch(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          if (Array.isArray(data)) setMembersList(data);
        })
        .catch(() => { });
    }
  }, [currentProject]);

  const handleFile = (file) => {
    setFileError('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError('Unsupported file type. Use PNG, JPG, GIF, WEBP, PDF, or TXT.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File too large. Max size is 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachment(e.target.result);
      setAttachmentName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !title.trim()) {
      setTitleWarning('Warning: Task title is required! Please enter a title before creating the task.');
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
      return;
    }

    setTitleWarning('');

    const payload = {
      title: title.trim(),
      description,
      priority,
      category,
      status: editingTask?.status === 'Done' ? 'Done' : (status === 'Done' ? 'To Do' : status),
      attachment,
      attachmentName,
      assignee: assignee || null,
      dueDate: dueDate || null
    };

    if (isEditing) {
      updateTask({ ...editingTask, ...payload });
    } else {
      createTask(payload);
    }
    onClose();
  };

  const isImage =
    attachment &&
    (attachment.startsWith('data:image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment));

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 className="modal-title" id="modal-title">
              {isEditing ? `Edit Task [${editingTask.taskId || ''}]` : 'Create Project Task'}
            </h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

          <form onSubmit={handleSubmit} id="task-form" noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <div className="modal-body-scrollable">
              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-title">Task Title *</label>
                <input
                  ref={titleInputRef}
                  id="task-title"
                  className={`form-input ${titleWarning ? 'input-error' : ''}`}
                  type="text"
                  placeholder="e.g. Implement GitHub OAuth integration"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleWarning) setTitleWarning('');
                  }}
                  autoFocus
                />
                {titleWarning && (
                  <div
                    className="title-warning-banner"
                    role="alert"
                    style={{
                      marginTop: '0.35rem',
                      background: '#fee2e2',
                      border: '2px solid var(--accent-red, #E1251B)',
                      color: 'var(--accent-red, #E1251B)',
                      padding: '0.45rem 0.65rem',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                    gap: '0.35rem',
                      boxShadow: '2px 2px 0 var(--accent-black, #1D1D1D)'
                    }}
                  >
                    <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                    <span>{titleWarning}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="task-description">Task Description</label>
                <textarea
                  id="task-description"
                  className="form-textarea"
                  rows={2}
                  placeholder="Add implementation specs, acceptance criteria, or endpoint schemas…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Priority + Category */}
              <div className="form-row">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="task-category">Category</label>
                  <select
                    id="task-category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column Status & Done Note */}
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="form-label" htmlFor="task-status">Initial Stage</label>
                  <select
                    id="task-status"
                    className="form-select"
                    value={status}
                    disabled={editingTask?.status === 'Done'}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    {editingTask?.status === 'Done' && <option value="Done">Done (Verified by Commit)</option>}
                  </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Info size={11} />
                      <span>Tasks move to <strong>Done</strong> exclusively through Git commit messages.</span>
                    </span>
                </div>

                {/* Assignee & Due Date */}
                  <div className="form-row" style={{ marginTop: '0.75rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="task-assignee">Assign Team Member</label>
                      {isAdmin ? (
                        <select
                          id="task-assignee"
                          className="form-select"
                          value={assignee}
                          onChange={(e) => setAssignee(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {membersList.map((m, idx) => (
                            <option key={idx} value={m.username}>
                              @{m.username} {m.role ? `(${m.role})` : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div
                          id="task-assignee"
                          className="form-input"
                          style={{ background: '#f3f4f6', color: '#6b7280', cursor: 'not-allowed' }}
                        >
                          {assignee ? `@${assignee}` : 'Unassigned'}
                        </div>
                      )}
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="task-due-date">Due Date</label>
                      <input
                        type="date"
                        id="task-due-date"
                        className="form-input"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* File upload */}
                    <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                      <label className="form-label">Specification Attachment</label>
                      <div
                        className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                        onDragLeave={() => setDragActive(false)}
                        onDrop={handleDrop}
                        id="file-upload-zone"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="task-file-input"
                          accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt"
                          onChange={(e) => handleFile(e.target.files[0])}
                          aria-label="Upload attachment"
                        />
                        <p className="file-upload-text">
                          {attachmentName
                            ? <span><strong>{attachmentName}</strong> — drop another to replace</span>
                            : <span>Drop spec or <strong>browse</strong> file</span>
                          }
                        </p>
                      </div>
                      {fileError && <p className="file-error" role="alert" id="file-error-msg">{fileError}</p>}
                      {isImage && attachment && (
                <img src={attachment} alt="preview" className="file-preview-img" id="attachment-preview" style={{ maxHeight: '80px', marginTop: '0.4rem' }} />
                      )}
                      {attachment && !isImage && (
                          <div className="file-preview-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem' }}>
                            <Paperclip size={12} />
                            <span>{attachmentName}</span>
                          </div>
              )}
                        </div>
          </div>

                  {/* Fixed Bottom Actions Bar */}
                  <div className="modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={onClose}>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      id="submit-task-btn"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <span>{isEditing ? 'Save Changes' : 'Issue Task'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
            );
}

            export default TaskModal;
