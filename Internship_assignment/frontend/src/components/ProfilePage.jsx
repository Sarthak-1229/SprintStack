import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTaskContext } from '../context/TaskContext';
import { useProject } from '../context/ProjectContext';
import {
  ShieldCheck,
  Zap,
  GraduationCap,
  Briefcase,
  Edit3,
  X,
  CheckCircle2,
  AlertTriangle,
  Save,
  ExternalLink,
  Plus,
  Lock,
  Sparkles
} from 'lucide-react';
import './ProfilePage.css';

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { tasks } = useTaskContext();
  const { projects } = useProject();

  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Form fields initialized with user profile
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [userType, setUserType] = useState(user?.userType || 'student');
  const [institutionOrCompany, setInstitutionOrCompany] = useState(user?.institutionOrCompany || '');
  const [branchOrDepartment, setBranchOrDepartment] = useState(user?.branchOrDepartment || '');
  const [yearOrExperience, setYearOrExperience] = useState(user?.yearOrExperience || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [githubUsername, setGithubUsername] = useState(user?.githubUsername || '');
  const [skills, setSkills] = useState(user?.skills || ['React', 'NodeJS', 'Git']);
  const [newSkill, setNewSkill] = useState('');

  // Compute live statistics for current user
  const myAssignedTasks = tasks.filter((t) => t.assignee === user?.username);
  const myDoneTasks = myAssignedTasks.filter((t) => t.status === 'Done');
  const myInProgressTasks = myAssignedTasks.filter((t) => t.status === 'In Progress');
  const completionRate = myAssignedTasks.length > 0
    ? Math.round((myDoneTasks.length / myAssignedTasks.length) * 100)
    : 0;

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveStatus({ loading: true, message: null, error: null });

    const res = await updateProfile({
      fullName,
      userType,
      institutionOrCompany,
      branchOrDepartment,
      yearOrExperience,
      bio,
      githubUsername,
      skills
    });

    if (res.success) {
      setSaveStatus({ loading: false, message: 'Profile updated successfully!', error: null });
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus({ loading: false, message: null, error: res.message });
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="profile-container">
      {/* Profile Header Hero */}
      <div className="profile-hero-card">
        <div className="hero-left">
          <div className="profile-avatar-giant">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-identity">
            <div className="profile-badge-row">
              <span className={`profile-role-tag ${isAdmin ? 'admin' : 'member'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {isAdmin ? <ShieldCheck size={11} /> : <Zap size={11} />}
                <span>{isAdmin ? 'SYSTEM ADMIN / PROJECT LEAD' : 'TEAM MEMBER / DEVELOPER'}</span>
              </span>
              <span className="profile-type-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                {userType === 'student' ? <GraduationCap size={11} /> : <Briefcase size={11} />}
                <span>{userType === 'student' ? 'Academic Student' : 'Working Professional'}</span>
              </span>
            </div>
            <h2 className="profile-name">{fullName || user?.username}</h2>
            <span className="profile-handle">@{user?.username} &bull; {user?.email}</span>
            <p className="profile-bio-text">
              {bio || 'No developer bio provided yet. Click "Edit Profile" to add your technical background!'}
            </p>
          </div>
        </div>

        <div className="hero-right">
          <button
            className="profile-edit-toggle-btn"
            onClick={() => setIsEditing(!isEditing)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isEditing ? <X size={14} /> : <Edit3 size={14} />}
            <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {saveStatus?.message && (
        <div className="profile-alert success" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle2 size={16} />
          <span>{saveStatus.message}</span>
        </div>
      )}
      {saveStatus?.error && (
        <div className="profile-alert error" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <AlertTriangle size={16} />
          <span>{saveStatus.error}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="profile-metrics-grid">
        <div className="metric-box box-blue">
          <span className="metric-label">Active Projects</span>
          <span className="metric-number">{projects.length}</span>
          <span className="metric-sub">Joined Workspaces</span>
        </div>

        <div className="metric-box box-yellow">
          <span className="metric-label">Assigned Tasks</span>
          <span className="metric-number">{myAssignedTasks.length}</span>
          <span className="metric-sub">{myInProgressTasks.length} currently In Progress</span>
        </div>

        <div className="metric-box box-red">
          <span className="metric-label">Git Commit Completions</span>
          <span className="metric-number">{myDoneTasks.length}</span>
          <span className="metric-sub">Verified via commit logs</span>
        </div>

        <div className="metric-box box-black">
          <span className="metric-label">Completion Velocity</span>
          <span className="metric-number">{completionRate}%</span>
          <span className="metric-sub">Target fulfillment</span>
        </div>
      </div>

      {/* Profile Details or Edit Form */}
      <div className="profile-body-grid">
        {/* Left: Background Details */}
        <div className="profile-details-card">
          <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {userType === 'student' ? <GraduationCap size={18} /> : <Briefcase size={18} />}
            <span>{userType === 'student' ? 'Academic / Student Profile' : 'Employment Profile'}</span>
          </h3>

          {!isEditing ? (
            <div className="details-view-list">
              <div className="detail-item">
                <span className="detail-key">
                  {userType === 'student' ? 'University / College:' : 'Company / Organization:'}
                </span>
                <span className="detail-val">{institutionOrCompany || 'Not specified'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-key">
                  {userType === 'student' ? 'Degree & Branch:' : 'Department & Title:'}
                </span>
                <span className="detail-val">{branchOrDepartment || 'Not specified'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-key">
                  {userType === 'student' ? 'Year / Semester:' : 'Years of Experience:'}
                </span>
                <span className="detail-val">{yearOrExperience || 'Not specified'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-key">GitHub Identity:</span>
                <span className="detail-val">
                  {githubUsername ? (
                    <a
                      href={`https://github.com/${githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="github-profile-link"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <span>github.com/{githubUsername}</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : (
                    'Not linked'
                  )}
                </span>
              </div>

              {/* Skills Display */}
              <div className="detail-skills-section">
                <span className="detail-key">Technical Competencies:</span>
                <div className="skills-badge-wrap">
                  {skills.length > 0 ? (
                    skills.map((s, idx) => (
                      <span key={idx} className="skill-pill">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="no-skills-text">No skills added yet</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Editing Form */
            <form onSubmit={handleSaveProfile} className="profile-edit-form">
              <div className="form-group">
                <label className="form-label">Profile Track</label>
                <div className="track-toggle">
                  <button
                    type="button"
                    className={`track-btn ${userType === 'student' ? 'active' : ''}`}
                    onClick={() => setUserType('student')}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <GraduationCap size={14} />
                    <span>Student</span>
                  </button>
                  <button
                    type="button"
                    className={`track-btn ${userType === 'professional' ? 'active' : ''}`}
                    onClick={() => setUserType('professional')}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                  >
                    <Briefcase size={14} />
                    <span>Working Professional</span>
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="e.g. Sarthak B"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {userType === 'student' ? 'University / College' : 'Company / Workplace'}
                  </label>
                  <input
                    type="text"
                    value={institutionOrCompany}
                    onChange={(e) => setInstitutionOrCompany(e.target.value)}
                    className="auth-input"
                    placeholder={userType === 'student' ? 'e.g. MIT College of Engineering' : 'e.g. Google / Microsoft'}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    {userType === 'student' ? 'Branch / Specialization' : 'Job Title / Role'}
                  </label>
                  <input
                    type="text"
                    value={branchOrDepartment}
                    onChange={(e) => setBranchOrDepartment(e.target.value)}
                    className="auth-input"
                    placeholder={userType === 'student' ? 'e.g. Computer Engineering' : 'e.g. Senior Backend Engineer'}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {userType === 'student' ? 'Year / Semester' : 'Experience Level'}
                  </label>
                  <input
                    type="text"
                    value={yearOrExperience}
                    onChange={(e) => setYearOrExperience(e.target.value)}
                    className="auth-input"
                    placeholder={userType === 'student' ? 'e.g. TY (Semester 6)' : 'e.g. 4+ Years'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">GitHub Username</label>
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="auth-input"
                  placeholder="e.g. sarthak-1229"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Developer Bio & Summary</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="auth-input"
                  placeholder="Tell your team about your coding interests and current projects..."
                />
              </div>

              {/* Skills Editor */}
              <div className="form-group">
                <label className="form-label">Technical Skills & Stacks</label>
                <div className="skills-badge-wrap editable">
                  {skills.map((s, idx) => (
                    <span key={idx} className="skill-pill editable">
                      {s}
                      <button
                        type="button"
                        className="skill-remove-btn"
                        onClick={() => handleRemoveSkill(s)}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="add-skill-row">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add skill (e.g. Docker, TypeScript)"
                    className="auth-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="add-skill-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Plus size={13} />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="form-save-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-save"
                  disabled={saveStatus?.loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Save size={13} />
                  <span>{saveStatus?.loading ? 'Saving Changes...' : 'Save Profile Updates'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right: Security & Account Info */}
        <div className="profile-security-card">
          <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Lock size={16} />
            <span>Account & Access Info</span>
          </h3>
          <div className="security-info-list">
            <div className="security-item">
              <span className="sec-label">Role Privilege:</span>
              <span className={`sec-value ${isAdmin ? 'admin' : 'member'}`}>
                {isAdmin ? 'System Administrator (Full Management)' : 'Team Member (Task Execution & Commits)'}
              </span>
            </div>

            <div className="security-item">
              <span className="sec-label">Authentication ID:</span>
              <span className="sec-value code">{user?.id || 'N/A'}</span>
            </div>

            <div className="security-item">
              <span className="sec-label">Active Session:</span>
              <span className="sec-value active-dot">Verified JWT Bearer</span>
            </div>
          </div>

          <div className="security-tip-box">
            <span className="tip-title" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Zap size={13} />
              <span>Traceability Note:</span>
            </span>
            <p className="tip-text">
              Every commit you push with a Task ID (e.g., <code>TASK-101</code>) attributes your operator username directly to the task audit logs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
