import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import {
  FolderGit2,
  ChevronDown,
  ChevronUp,
  Plus,
  LayoutDashboard,
  GitCommit,
  User,
  ShieldCheck,
  Zap,
  LogOut,
  FolderKanban
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import './Navbar.css';

function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const { currentProject, projects, selectProject } = useProject();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="navbar-container">
      {/* Brand & Project Selector */}
      <div className="navbar-brand-section">
        <div className="navbar-logo" onClick={() => setActiveTab('board')} style={{ cursor: 'pointer' }}>
          <img src="/logo.jpg" alt="SprintStack Logo" className="navbar-brand-logo" />
          <div className="logo-text-group">
            <h1 className="logo-title">SprintStack</h1>
            <span className="logo-tagline">DevOps Workflow</span>
          </div>
        </div>

        {/* Project Switcher Pill */}
        <div className="project-switcher-container">
          <button
            className="project-switcher-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title="Switch Active Project"
          >
            <FolderKanban size={15} className="project-icon" />
            <div className="project-info">
              <span className="project-label">PROJECT:</span>
              <span className="project-current-name">
                {currentProject ? currentProject.name : 'No Project Selected'}
              </span>
            </div>
            {currentProject && (
              <span className="project-code-badge">{currentProject.code}</span>
            )}
            <span className="dropdown-arrow">
              {dropdownOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
          </button>

          {dropdownOpen && (
            <div className="project-dropdown-menu">
              <div className="dropdown-header">
                <span>SWITCH WORKSPACE</span>
              </div>
              <div className="dropdown-list">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    className={`dropdown-item ${currentProject?.id === p.id ? 'active' : ''}`}
                    onClick={() => {
                      selectProject(p);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="item-name">{p.name}</span>
                    <span className="item-code">{p.code}</span>
                  </button>
                ))}
              </div>
              <div className="dropdown-footer">
                <button
                  className="dropdown-action-btn"
                  onClick={() => {
                    setActiveTab('projects');
                    setDropdownOpen(false);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                >
                  <Plus size={13} />
                  <span>Manage & Join Projects</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="navbar-tabs">
        <button
          className={`nav-tab-btn ${activeTab === 'board' ? 'active' : ''}`}
          onClick={() => setActiveTab('board')}
        >
          <LayoutDashboard size={15} className="tab-icon" />
          <span className="tab-text">Task Board</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderGit2 size={15} className="tab-icon" />
          <span className="tab-text">Projects Hub</span>
          <span className="tab-badge">{projects.length}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'git' ? 'active' : ''}`}
          onClick={() => setActiveTab('git')}
        >
          <GitCommit size={15} className="tab-icon" />
          <span className="tab-text">Git Automation</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <User size={15} className="tab-icon" />
          <span className="tab-text">Profile</span>
        </button>
      </nav>

      {/* User Section & Logout */}
      <div className="navbar-user-section">
        <div
          className="user-pill"
          onClick={() => setActiveTab('profile')}
          title="Click to view profile"
          style={{ cursor: 'pointer' }}
        >
          <div className="user-avatar-circle" style={{ border: 'none', background: 'transparent' }}>
            <UserAvatar username={user?.username} avatarUrl={user?.avatar} size={28} showBorder={true} />
          </div>
          <div className="user-meta">
            <span className="user-name">{user?.username}</span>
            <span className={`role-badge ${isAdmin ? 'admin' : 'member'}`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {isAdmin ? <ShieldCheck size={11} /> : <Zap size={11} />}
              <span>{isAdmin ? 'ADMIN' : 'MEMBER'}</span>
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={logout} title="Sign Out" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>Exit</span>
          <LogOut size={13} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
