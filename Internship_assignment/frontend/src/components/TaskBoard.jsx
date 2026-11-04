import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import Column from './Column';
import TaskModal from './TaskModal';
import TaskViewModal from './TaskViewModal';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', cssClass: 'column-todo', emptyIcon: '📋', emptyText: 'No tasks pending' },
  { id: 'In Progress', label: 'In Progress', cssClass: 'column-inprogress', emptyIcon: '⚡', emptyText: 'Nothing in progress' },
  { id: 'Done', label: 'Done', cssClass: 'column-done', emptyIcon: '✅', emptyText: 'No completed tasks' },
];

function ProgressChart({ tasks }) {
  const total = tasks.length;
  const counts = {
    'To Do': tasks.filter((t) => t.status === 'To Do').length,
    'In Progress': tasks.filter((t) => t.status === 'In Progress').length,
    Done: tasks.filter((t) => t.status === 'Done').length,
  };
  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="chart-section">
      <div className="stat-card todo">
        <div className="stat-card-label">To Do</div>
        <div className="stat-card-value">{counts['To Do']}</div>
      </div>
      <div className="stat-card inprogress">
        <div className="stat-card-label">In Progress</div>
        <div className="stat-card-value">{counts['In Progress']}</div>
      </div>
      <div className="stat-card done">
        <div className="stat-card-label">Done (Git Verified)</div>
        <div className="stat-card-value">{counts['Done']}</div>
      </div>
      <div className="stat-card total">
        <div className="stat-card-label">Total Tasks</div>
        <div className="stat-card-value">{total}</div>
      </div>

      <div className="chart-bar-container">
        <h3>Sprint Progress</h3>
        {[
          { key: 'To Do', cls: 'todo', label: 'To Do' },
          { key: 'In Progress', cls: 'inprogress', label: 'In Progress' },
          { key: 'Done', cls: 'done', label: 'Done' },
        ].map(({ key, cls, label }) => (
          <div className="progress-bar-row" key={key}>
            <span className="progress-bar-label">{label}</span>
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill ${cls}`}
                style={{ width: `${pct(counts[key])}%` }}
              />
            </div>
            <span className="progress-bar-count">{counts[key]}</span>
          </div>
        ))}
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', fontWeight: 'bold' }}>
          {pct(counts['Done'])}% completed via commit automation
        </div>
      </div>
    </div>
  );
}

function TaskBoard({ onNavigateTab }) {
  const {
    tasks,
    moveTask,
    ruleAlert,
    setRuleAlert,
    commitCelebration,
    setCommitCelebration
  } = useTaskContext();
  const { user } = useAuth();
  const { currentProject } = useProject();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);
  const [defaultColumn, setDefaultColumn] = useState('To Do');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [copiedCode, setCopiedCode] = useState(false);

  const isAdmin =
    user?.role === 'admin' ||
    user?.username === 'sarthak' ||
    user?.username === currentProject?.ownerUsername;

  const myTasksCount = tasks.filter((t) => t.assignee === user?.username).length;

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Trigger status transition via context (which enforces the commit-gate for 'Done')
    moveTask(draggableId, destination.droppableId);
  };

  const openAddModal = (columnId = 'To Do') => {
    setEditingTask(null);
    setDefaultColumn(columnId === 'Done' ? 'To Do' : columnId);
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const openViewModal = (task) => {
    setViewingTask(task);
  };

  const copyProjectCode = () => {
    if (currentProject?.code) {
      navigator.clipboard.writeText(currentProject.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeFilter === 'High Priority' && t.priority !== 'High') return false;
    if (activeFilter === 'Overdue') {
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done';
      if (!isOverdue) return false;
    }
    if (activeFilter === 'Assigned to Me' && t.assignee !== user?.username) return false;
    if (activeFilter === 'Bugs' && t.category !== 'Bug') return false;
    return true;
  });

  if (!currentProject) {
    return (
      <div className="task-board-wrapper" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ background: '#ffffff', border: '3.5px solid var(--accent-black)', padding: '3rem', maxWidth: '600px', margin: '0 auto', boxShadow: '8px 8px 0 var(--accent-black)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>
            No Active Project Selected
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Create a project or enter a team code in the Projects Hub to start managing your sprint board.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('projects')}
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '900' }}
          >
            Go to Projects Hub ➔
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="task-board-main-container" style={{ padding: '0 2rem 2.5rem 2rem' }}>
      {/* Project Banner Bar */}
      <div
        className="project-context-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff',
          border: '3px solid var(--accent-black)',
          boxShadow: '4px 4px 0 var(--accent-black)',
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--accent-black)' }}>
                {currentProject.name}
              </h2>
              <button
                onClick={copyProjectCode}
                title="Click to copy team invitation code"
                style={{
                  background: 'var(--accent-yellow, #F0D700)',
                  border: '1.5px solid var(--accent-black)',
                  padding: '0.2rem 0.6rem',
                  fontWeight: '900',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>TEAM CODE: {currentProject.code}</span>
                <span>{copiedCode ? '✓' : '📋'}</span>
              </button>
            </div>
            {currentProject.description && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {currentProject.description}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Members Avatars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8f9fa', padding: '0.35rem 0.6rem', border: '1.5px solid var(--accent-black)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>TEAM:</span>
            <div style={{ display: 'flex' }}>
              {currentProject.members && currentProject.members.slice(0, 5).map((m, idx) => (
                <div
                  key={idx}
                  title={`@${m.username} (${m.role})`}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--accent-black)',
                    color: '#ffffff',
                    border: '1.5px solid #ffffff',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: idx > 0 ? '-6px' : 0
                  }}
                >
                  {m.username.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {isAdmin && (
            <button
              className="btn btn-primary"
              id="add-task-header-btn"
              onClick={() => openAddModal('To Do')}
              style={{ fontWeight: '900', padding: '0.55rem 1rem' }}
            >
              + Create & Assign Task
            </button>
          )}
        </div>
      </div>

      {/* Rule Alert Banner (e.g., when attempting manual drag to Done) */}
      {ruleAlert && (
        <div
          className="rule-alert-banner"
          style={{
            background: '#fee2e2',
            border: '3px solid var(--accent-red)',
            boxShadow: '4px 4px 0 var(--accent-black)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontWeight: '700',
            fontSize: '0.88rem',
            color: '#991b1b'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⛔</span>
            <span>{ruleAlert}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('git')}
              style={{
                background: 'var(--accent-yellow, #F0D700)',
                border: '2px solid var(--accent-black)',
                fontWeight: '900',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Open Git Terminal ➔
            </button>
            <button
              onClick={() => setRuleAlert(null)}
              style={{
                background: '#ffffff',
                border: '2px solid var(--accent-black)',
                fontWeight: '900',
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Commit Celebration Banner */}
      {commitCelebration && (
        <div
          className="commit-celebration-banner"
          style={{
            background: '#ecfdf5',
            border: '3px solid #10b981',
            boxShadow: '4px 4px 0 var(--accent-black)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🎉</span>
            <div>
              <span style={{ fontWeight: '900', color: '#065f46', display: 'block' }}>
                Git Commit Verified! [{commitCelebration.taskId}] has been automatically completed!
              </span>
              <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                Commit #{commitCelebration.commitHash} by @{commitCelebration.author}: &ldquo;{commitCelebration.commitMessage}&rdquo;
              </span>
            </div>
          </div>
          <button
            onClick={() => setCommitCelebration(null)}
            style={{
              background: '#ffffff',
              border: '2px solid var(--accent-black)',
              fontWeight: '900',
              padding: '0.35rem 0.6rem',
              cursor: 'pointer'
            }}
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div
        className="board-controls"
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <input
          type="text"
          placeholder="🔍 Search tasks by title or keyword..."
          className="form-input search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '320px', marginBottom: 0, border: '2.5px solid var(--accent-black)' }}
        />
        <div className="filter-chips" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'Assigned to Me', 'High Priority', 'Overdue', 'Bugs'].map((f) => (
            <button
              key={f}
              className={`btn ${activeFilter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveFilter(f)}
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.82rem',
                border: '2px solid var(--accent-black)',
                boxShadow: activeFilter === f ? '2px 2px 0 var(--accent-black)' : 'none'
              }}
            >
              {f === 'Assigned to Me' ? `👤 My Tasks (${myTasksCount})` : f}
            </button>
          ))}
        </div>
      </div>

      {/* Board & Metrics */}
      <div className="task-board-wrapper">
        <ProgressChart tasks={filteredTasks} />

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-board-container">
            {COLUMNS.map((col) => {
              const columnTasks = filteredTasks.filter((t) => t.status === col.id);

              return (
                <Column
                  key={col.id}
                  col={col}
                  tasks={columnTasks}
                  canAddTask={isAdmin}
                  onAddTask={() => openAddModal(col.id)}
                  onEditTask={openEditModal}
                  onViewTask={openViewModal}
                />
              );
            })}
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      {modalOpen && (
        <TaskModal
          onClose={() => setModalOpen(false)}
          editingTask={editingTask}
          defaultColumn={defaultColumn}
        />
      )}
      {viewingTask && (
        <TaskViewModal task={viewingTask} onClose={() => setViewingTask(null)} />
      )}
    </div>
  );
}

export default TaskBoard;
