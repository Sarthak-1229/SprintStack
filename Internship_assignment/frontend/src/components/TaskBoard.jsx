import UserAvatar from './UserAvatar';
import React, { useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  AlertOctagon,
  Sparkles,
  Search,
  User,
  Users,
  Plus,
  ArrowRight,
  X,
  FolderKanban,
  ShieldCheck,
  Zap
} from 'lucide-react';
import Column from './Column';
import TaskModal from './TaskModal';
import TaskViewModal from './TaskViewModal';

const COLUMNS = [
  { id: 'To Do', label: 'To Do', cssClass: 'column-todo', emptyText: 'No tasks pending' },
  { id: 'In Progress', label: 'In Progress', cssClass: 'column-inprogress', emptyText: 'Nothing in progress' },
  { id: 'Done', label: 'Done', cssClass: 'column-done', emptyText: 'No completed tasks' },
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
  const [teamModalOpen, setTeamModalOpen] = useState(false);
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
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <FolderKanban size={48} color="var(--accent-black)" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>
            No Active Project Selected
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Create a project or enter a team code in the Projects Hub to start managing your sprint board.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab && onNavigateTab('projects')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.5rem', fontSize: '0.9rem', fontWeight: '900' }}
          >
            <span>Go to Projects Hub</span>
            <ArrowRight size={15} />
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
                {copiedCode ? <Check size={11} color="#16a34a" /> : <Copy size={11} />}
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
          {/* Members Avatars Button */}
          <button
            onClick={() => setTeamModalOpen(true)}
            title="Click to view full team roster"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: '#f8f9fa',
              padding: '0.35rem 0.75rem',
              border: '2px solid var(--accent-black)',
              cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--accent-black)'
            }}
          >
            <Users size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--accent-black)' }}>
              TEAM ({currentProject.members ? currentProject.members.length : 0}):
            </span>
            <div style={{ display: 'flex' }}>
              {currentProject.members && currentProject.members.slice(0, 5).map((m, idx) => (
                <div key={idx} style={{ marginLeft: idx > 0 ? '-6px' : 0 }} title={`@${m.username} (${m.role})`}>
                  <UserAvatar username={m.username} avatarUrl={m.avatar} size={24} />
                </div>
              ))}
            </div>
          </button>

          {isAdmin && (
            <button
              className="btn btn-primary"
              id="add-task-header-btn"
              onClick={() => openAddModal('To Do')}
              style={{ fontWeight: '900', padding: '0.55rem 1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={15} />
              <span>Create & Assign Task</span>
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
            <AlertOctagon size={22} color="var(--accent-red)" style={{ flexShrink: 0 }} />
            <span>{ruleAlert}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              onClick={() => onNavigateTab && onNavigateTab('git')}
              style={{
                background: 'var(--accent-yellow, #F0D700)',
                border: '2px solid var(--accent-black)',
                fontWeight: '900',
                padding: '0.4rem 0.8rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span>Open Git Terminal</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => setRuleAlert(null)}
              style={{
                background: '#ffffff',
                border: '2px solid var(--accent-black)',
                fontWeight: '900',
                padding: '0.4rem 0.6rem',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
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
            <Sparkles size={22} color="#059669" style={{ flexShrink: 0 }} />
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <X size={13} />
            <span>Dismiss</span>
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
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search tasks by title or keyword..."
            className="form-input search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '32px', marginBottom: 0, border: '2.5px solid var(--accent-black)' }}
          />
        </div>
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
                boxShadow: activeFilter === f ? '2px 2px 0 var(--accent-black)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              {f === 'Assigned to Me' && <User size={13} />}
              <span>{f === 'Assigned to Me' ? `My Tasks (${myTasksCount})` : f}</span>
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

      {/* Team Roster Modal */}
      {teamModalOpen && (
        <div className="modal-backdrop" onClick={() => setTeamModalOpen(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '560px', padding: '1.75rem' }}
          >
            <div className="modal-header" style={{ marginBottom: '1.25rem', borderBottom: '2px solid var(--accent-black)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} />
                <h3 className="modal-title">Project Team Roster</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setTeamModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8f9fa', border: '2px solid var(--accent-black)', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-muted)' }}>INVITATION CODE</span>
                <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--accent-black)' }}>
                  {currentProject.code}
                </div>
              </div>
              <button
                onClick={copyProjectCode}
                className="btn btn-primary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
              {currentProject.members && currentProject.members.map((m, idx) => {
                const memberTasks = tasks.filter((t) => t.assignee === m.username);
                const doneCount = memberTasks.filter((t) => t.status === 'Done').length;

                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: '#ffffff',
                      border: '2px solid var(--accent-black)',
                      boxShadow: '2px 2px 0 var(--accent-black)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <UserAvatar username={m.username} avatarUrl={m.avatar} size={36} />
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--accent-black)' }}>
                          @{m.username}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {memberTasks.length} tasks ({doneCount} completed)
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '900',
                        padding: '0.2rem 0.5rem',
                        border: '1.5px solid var(--accent-black)',
                        background: m.role === 'admin' ? 'var(--accent-yellow, #F0D700)' : '#e0f2fe',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {m.role === 'admin' ? <ShieldCheck size={11} /> : <Zap size={11} />}
                      <span>{m.role === 'admin' ? 'ADMIN' : 'MEMBER'}</span>
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setTeamModalOpen(false)}
                style={{ padding: '0.5rem 1.25rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TaskBoard;
