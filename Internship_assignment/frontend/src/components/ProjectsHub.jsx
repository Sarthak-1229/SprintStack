import UserAvatar from './UserAvatar';
import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Key,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  GitBranch,
  Folder,
  ArrowRight,
  X,
  AlertTriangle,
  Trash2,
  Edit3
} from 'lucide-react';
import './ProjectsHub.css';

function ProjectsHub({ onSelectProject }) {
  const { projects, currentProject, selectProject, createProject, joinProject, deleteProject, updateProject, loading } = useProject();
  const { user } = useAuth();

  const [joinCode, setJoinCode] = useState('');
  const [joinStatus, setJoinStatus] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectRepo, setNewProjectRepo] = useState('');
  const [createError, setCreateError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);

  // Delete Project Confirmation Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Edit Project Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRepo, setEditRepo] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = user?.role === 'admin';

  const handleOpenDelete = (proj, e) => {
    e.stopPropagation();
    setProjectToDelete(proj);
    setDeleteError('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    setDeleteError('');
    const res = await deleteProject(projectToDelete.id || projectToDelete._id);
    setDeleteLoading(false);
    if (res.success) {
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    } else {
      setDeleteError(res.message || 'Failed to delete project');
    }
  };

  const handleOpenEdit = (proj, e) => {
    e.stopPropagation();
    setEditingProject(proj);
    setEditName(proj.name || '');
    setEditDesc(proj.description || '');
    setEditRepo(proj.githubRepo || '');
    setEditError('');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Project name is required');
      return;
    }
    setEditLoading(true);
    setEditError('');
    const res = await updateProject(editingProject.id || editingProject._id, {
      name: editName.trim(),
      description: editDesc.trim(),
      githubRepo: editRepo.trim()
    });
    setEditLoading(false);
    if (res.success) {
      setEditModalOpen(false);
      setEditingProject(null);
    } else {
      setEditError(res.message || 'Failed to update project');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoinStatus({ loading: true, error: null, message: null });
    const res = await joinProject(joinCode.trim());
    if (res.success) {
      setJoinStatus({ loading: false, error: null, message: `Joined ${res.project.name} successfully!` });
      setJoinCode('');
      if (onSelectProject) onSelectProject('board');
    } else {
      setJoinStatus({ loading: false, error: res.message, message: null });
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError('Project name is required');
      return;
    }

    setCreateError('');
    const res = await createProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim(),
      githubRepo: newProjectRepo.trim()
    });

    if (res.success) {
      setModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectRepo('');
      if (onSelectProject) onSelectProject('board');
    } else {
      setCreateError(res.message);
    }
  };

  const copyToClipboard = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="projects-hub-container">
      {/* Top Banner */}
      <div className="hub-header-card">
        <div className="hub-header-info">
          <div className="hub-badge">PROJECT SESSIONS & MULTI-WORKSPACE</div>
          <h2 className="hub-title">Project Command Hub</h2>
          <p className="hub-subtitle">
            Segregated workspaces, unique team invitation codes, and real-time Git traceability.
          </p>
        </div>

        <div className="hub-header-actions">
          {isAdmin ? (
            <button
              className="hub-action-btn primary"
              onClick={() => setModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>Create New Project</span>
            </button>
          ) : (
            <span className="member-role-hint" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={14} color="var(--accent-red, #E1251B)" />
              <span>Admins create projects. As a Team Member, enter a code below to join!</span>
            </span>
          )}
        </div>
      </div>

      {/* Join Project Bar */}
      <div className="join-project-card">
        <div className="join-icon">
          <Key size={26} color="var(--accent-blue, #0056A3)" />
        </div>
        <div className="join-form-wrapper">
          <h3 className="join-title">Join Project via Team Code</h3>
          <p className="join-desc">
            Enter the unique uppercase project code generated by your project administrator.
          </p>
          <form onSubmit={handleJoin} className="join-form">
            <input
              type="text"
              placeholder="e.g. PRJ-9042"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="join-input"
              maxLength={12}
            />
            <button
              type="submit"
              className="join-submit-btn"
              disabled={joinStatus?.loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>{joinStatus?.loading ? 'Joining...' : 'Enter Project'}</span>
              <ArrowRight size={14} />
            </button>
          </form>

          {joinStatus?.error && (
            <div className="join-message error" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertTriangle size={14} />
              <span>{joinStatus.error}</span>
            </div>
          )}
          {joinStatus?.message && (
            <div className="join-message success" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Check size={14} />
              <span>{joinStatus.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="projects-section-header">
          <h3 className="section-title">Your Active Workspaces ({projects.length})</h3>
        </div>

        {loading ? (
          <div className="hub-loading">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="hub-empty-state">
            <div className="empty-icon">
              <Folder size={40} color="var(--accent-black)" />
            </div>
            <h4>No active projects found</h4>
            <p>
              {isAdmin
                ? "You haven't created any projects yet. Click 'Create New Project' above to get started!"
                : "You haven't joined any project yet. Ask your project admin for a 6-character team code!"}
            </p>
            {isAdmin && (
              <button
                className="hub-action-btn primary"
                onClick={() => setModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={15} />
                <span>Create First Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {projects.map((proj) => {
              const isCurrent = currentProject?.id === proj.id;
              const isOwner = proj.ownerUsername === user?.username;
              const total = proj.totalTasks || 0;
              const done = proj.doneTasks || 0;
              const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div
                  key={proj.id}
                  className={`project-hub-card ${isCurrent ? 'current-active' : ''}`}
                  onClick={() => {
                    selectProject(proj);
                    if (onSelectProject) onSelectProject('board');
                  }}
                >
                  {/* Top Bar with Code */}
                  <div className="project-card-top">
                    <div className="code-copy-group" onClick={(e) => copyToClipboard(proj.code, e)}>
                      <span className="code-label">TEAM CODE:</span>
                      <span className="code-value">{proj.code}</span>
                      <button className="copy-icon-btn" title="Copy Team Code">
                        {copiedCode === proj.code ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span
                        className={`project-role-tag ${isOwner ? 'owner' : 'member'}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px' }}
                      >
                        {isOwner ? <ShieldCheck size={11} /> : <Zap size={11} />}
                        <span>{isOwner ? 'LEAD / OWNER' : 'MEMBER'}</span>
                      </span>

                      {(isOwner || isAdmin) && (
                        <div className="card-actions-quick" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="card-quick-btn edit"
                            title="Edit Project Details & Repository"
                            onClick={(e) => handleOpenEdit(proj, e)}
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            className="card-quick-btn delete"
                            title="Delete Project & Workspaces"
                            onClick={(e) => handleOpenDelete(proj, e)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h4 className="project-name">{proj.name}</h4>
                  <p className="project-description">
                    {proj.description || 'No project description provided.'}
                  </p>

                  {/* GitHub Repo */}
                  {proj.githubRepo ? (
                    <div className="project-repo-link" onClick={(e) => e.stopPropagation()}>
                      <GitBranch size={13} className="repo-icon" />
                      <a href={proj.githubRepo} target="_blank" rel="noreferrer">
                        {proj.githubRepo.replace(/^https?:\/\/github.com\//, '')}
                      </a>
                    </div>
                  ) : (
                    <div className="project-repo-link" onClick={(e) => e.stopPropagation()} style={{ color: 'var(--text-muted, #888)' }}>
                      <GitBranch size={13} className="repo-icon" />
                      <span style={{ fontSize: '0.78rem' }}>No repo linked</span>
                      {(isOwner || isAdmin) && (
                        <button
                          onClick={(e) => handleOpenEdit(proj, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--accent-blue, #0056A3)',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.78rem',
                            marginLeft: '0.4rem'
                          }}
                        >
                          + Connect
                        </button>
                      )}
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="project-task-stats">
                    <div className="task-stats-label">
                      <span>Task Completion</span>
                      <span className="stats-numbers">{done} / {total} Done ({progressPct}%)</span>
                    </div>
                    <div className="project-progress-track">
                      <div
                        className="project-progress-fill"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer with Team Members & CTA */}
                  <div className="project-card-footer">
                    <div className="team-avatars">
                      <span className="team-label">Team:</span>
                      <div className="avatars-row" style={{ display: 'flex', alignItems: 'center' }}>
                        {proj.members && proj.members.slice(0, 4).map((m, idx) => (
                          <div key={idx} style={{ marginLeft: idx > 0 ? '-6px' : 0 }} title={`${m.username} (${m.role})`}>
                            <UserAvatar username={m.username} avatarUrl={m.avatar} size={24} />
                          </div>
                        ))}
                        {proj.members && proj.members.length > 4 && (
                          <div className="member-avatar-chip more">
                            +{proj.members.length - 4}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="enter-board-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectProject(proj);
                        if (onSelectProject) onSelectProject('board');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>{isCurrent ? 'Active Board' : 'Open Board'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create New Project */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal-content hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Project Workspace</h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>
                <X size={15} />
              </button>
            </div>

            {createError && (
              <div className="modal-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="modal-form">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="auth-input"
                  placeholder="e.g. Distributed Task Scheduler"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Scope & Description</label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="auth-input"
                  placeholder="Describe the project objectives, tech stack, and milestones..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Repository URL (Optional)</label>
                <input
                  type="text"
                  value={newProjectRepo}
                  onChange={(e) => setNewProjectRepo(e.target.value)}
                  className="auth-input"
                  placeholder="https://github.com/owner/repository or repo-name"
                />
                <span className="field-hint">
                  Linked repo will receive git commits and trigger automated task completion.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>Generate Project & Code</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Project Confirmation */}
      {deleteModalOpen && projectToDelete && (
        <div className="modal-backdrop" onClick={() => !deleteLoading && setDeleteModalOpen(false)}>
          <div className="modal-content hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-red, #E1251B)' }}>
                <AlertTriangle size={18} />
                <span>Delete Project Workspace</span>
              </h3>
              <button
                className="modal-close-btn"
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            {deleteError && (
              <div className="modal-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="modal-warning-box">
              <p>
                Are you sure you want to permanently delete project <strong>{projectToDelete.name}</strong> [{projectToDelete.code}]?
              </p>
              <p style={{ marginTop: '0.5rem', fontWeight: 'bold', color: 'var(--accent-red, #E1251B)' }}>
                ⚠️ This action cannot be undone. All tasks, sprint boards, and commit history for this project will be deleted immediately.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-cancel-btn"
                disabled={deleteLoading}
                onClick={() => setDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-danger-btn"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
              >
                <Trash2 size={14} />
                <span>{deleteLoading ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Project */}
      {editModalOpen && editingProject && (
        <div className="modal-backdrop" onClick={() => !editLoading && setEditModalOpen(false)}>
          <div className="modal-content hub-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Edit3 size={18} />
                <span>Edit Project Details & Repository</span>
              </h3>
              <button
                className="modal-close-btn"
                disabled={editLoading}
                onClick={() => setEditModalOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            {editError && (
              <div className="modal-error-banner" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertTriangle size={15} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="modal-form">
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="auth-input"
                  placeholder="e.g. Distributed Task Scheduler"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Scope & Description</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="auth-input"
                  placeholder="Describe the project objectives, tech stack, and milestones..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Connected GitHub Repository</label>
                <input
                  type="text"
                  value={editRepo}
                  onChange={(e) => setEditRepo(e.target.value)}
                  className="auth-input"
                  placeholder="https://github.com/owner/repository or repo-name"
                />
                <span className="field-hint">
                  Link an exact GitHub repository URL. Commits made will automatically transition linked tasks to DONE.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  disabled={editLoading}
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={editLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <span>{editLoading ? 'Saving...' : 'Save Changes'}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectsHub;
