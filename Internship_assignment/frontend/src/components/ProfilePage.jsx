import React, { useState, useRef } from 'react';
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
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import './ProfilePage.css';

const AVATAR_PRESETS = [
  { label: 'Bot Lead', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=sarthak' },
  { label: 'Frontend Dev', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=alex' },
  { label: 'Adventurer', url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=coder' },
  { label: 'Pixel Hacker', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=matrix' },
  { label: 'Tech Pro', url: 'https://api.dicebear.com/7.x/thumbs/svg?seed=developer' },
  { label: 'Cyberpunk', url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=star' }
];

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
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [newSkill, setNewSkill] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  const fileInputRef = useRef(null);

  // Compute live statistics for current user
  const myAssignedTasks = tasks.filter((t) => t.assignee === user?.username);
  const myDoneTasks = myAssignedTasks.filter((t) => t.status === 'Done');
  const myInProgressTasks = myAssignedTasks.filter((t) => t.status === 'In Progress');
  const completionRate = myAssignedTasks.length > 0
    ? Math.round((myDoneTasks.length / myAssignedTasks.length) * 100)
    : 0;

  // Handle local image file upload & compression
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

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

  const handleApplyCustomUrl = (e) => {
    e.preventDefault();
    if (customAvatarUrl.trim()) {
      setAvatar(customAvatarUrl.trim());
      setCustomAvatarUrl('');
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSaveStatus({ loading: true, message: null, error: null });

    const res = await updateProfile({
      fullName,
      userType,
      institutionOrCompany,
      branchOrDepartment,
      yearOrExperience,
      bio,
      githubUsername,
      skills,
      avatar
    });

    if (res.success) {
      setSaveStatus({ loading: false, message: 'Profile & Avatar updated across workspace!', error: null });
      setIsEditing(false);
      setTimeout(() => setSaveStatus(null), 3500);
    } else {
      setSaveStatus({ loading: false, message: null, error: res.message });
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="profile-container">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFile}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Profile Header Hero */}
      <div className="profile-hero-card">
        <div className="hero-left">
            <div className="hero-avatar-wrapper" style={{ position: 'relative' }}>
              <div className="profile-avatar-giant">
                <UserAvatar
                  username={user?.username}
                  avatarUrl={avatar}
                  size={80}
                  showBorder={false}
                />
              </div>
              <button
                type="button"
                className="avatar-quick-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Upload new profile picture"
              >
                <Camera size={14} />
              </button>
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

            <div className="hero-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button
                className="profile-edit-toggle-btn"
                onClick={() => setIsEditing(!isEditing)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {isEditing ? <X size={14} /> : <Edit3 size={14} />}
                <span>{isEditing ? 'Cancel Editing' : 'Edit Profile & Avatar'}</span>
              </button>
              {avatar !== (user?.avatar || '') && (
                <button
                  className="profile-quick-save-btn"
                  onClick={() => handleSaveProfile()}
                  style={{
                    background: 'var(--accent-red, #E1251B)',
                    color: '#ffffff',
                    border: '2px solid var(--accent-black, #1D1D1D)',
                    fontFamily: 'inherit',
                    fontWeight: '900',
                    fontSize: '0.78rem',
                    padding: '0.4rem 0.8rem',
                    cursor: 'pointer',
                    boxShadow: '2px 2px 0 var(--accent-black, #1D1D1D)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <Save size={13} />
                  <span>Save New Avatar</span>
                </button>
              )}
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
                  {/* Profile Avatar Selection Section */}
                  <div className="form-group avatar-selection-group" style={{ background: '#f8fafc', padding: '1.25rem', border: '2px solid var(--accent-black, #1D1D1D)', marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ImageIcon size={15} />
                      <span>Profile Image (Avatar across Kanban & Team)</span>
                    </label>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                      <UserAvatar username={user?.username} avatarUrl={avatar} size={54} />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="auth-btn-secondary"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: '0.45rem 0.85rem',
                            background: 'var(--accent-yellow, #F0D700)',
                            border: '2px solid var(--accent-black, #1D1D1D)',
                            fontFamily: 'inherit',
                            fontWeight: '800',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <Camera size={13} />
                          <span>Upload Local Photo</span>
                        </button>

                        {avatar && (
                          <button
                            type="button"
                            onClick={() => setAvatar('')}
                            style={{
                              padding: '0.45rem 0.85rem',
                              background: '#ffffff',
                              border: '2px solid var(--accent-black, #1D1D1D)',
                              fontFamily: 'inherit',
                              fontWeight: '800',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                          >
                            <RotateCcw size={13} />
                            <span>Reset to Initial</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Preset Avatars */}
                    <div style={{ marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                        Instant Developer Presets:
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                        {AVATAR_PRESETS.map((preset, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setAvatar(preset.url)}
                            className={`preset-avatar-chip ${avatar === preset.url ? 'active' : ''}`}
                            title={preset.label}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.2rem 0.5rem',
                              background: avatar === preset.url ? '#fef08a' : '#ffffff',
                              border: avatar === preset.url ? '2px solid var(--accent-black)' : '1px solid #94a3b8',
                              cursor: 'pointer',
                              fontSize: '0.72rem',
                              fontWeight: '800'
                            }}
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              style={{ width: '18px', height: '18px', borderRadius: '50%' }}
                            />
                            <span>{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Direct URL input */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="url"
                        placeholder="Or enter direct image URL (e.g. GitHub avatar, Gravatar)..."
                        value={customAvatarUrl}
                        onChange={(e) => setCustomAvatarUrl(e.target.value)}
                        className="auth-input"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCustomUrl}
                        style={{
                          background: 'var(--accent-black)',
                          color: '#ffffff',
                          border: '2px solid var(--accent-black)',
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.8rem',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Set URL
                      </button>
                    </div>
                  </div>

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
                        className="add-skill-btn"
                        onClick={handleAddSkill}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Plus size={13} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="profile-save-btn"
                    disabled={saveStatus?.loading}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Save size={16} />
                    <span>{saveStatus?.loading ? 'Saving Profile...' : 'Save Profile & Avatar'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Security & Workflow Track */}
            <div className="profile-security-card">
              <h3 className="section-heading" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={18} />
                <span>Developer Account Status</span>
              </h3>

                <div className="security-info-box">
                  <div className="security-item">
                      <span className="sec-label">Account Privilege:</span>
                      <span className="sec-value highlight">
                        {isAdmin ? 'Project Administrator & Owner' : 'Verified Team Member'}
                      </span>
                  </div>
                  <div className="security-item">
                    <span className="sec-label">Authentication Status:</span>
                    <span className="sec-value">Active JWT Session</span>
                  </div>
                  <div className="security-item">
                    <span className="sec-label">Git Commit Verification:</span>
                    <span className="sec-value">Enabled via Webhook & Terminal</span>
                  </div>
                  <div className="security-item">
                    <span className="sec-label">Primary Organization:</span>
                    <span className="sec-value">{institutionOrCompany || 'SprintStack Global'}</span>
                  </div>
                </div>

                    <div className="profile-tips-box">
                      <h4>Git-Ops Workflow Tip</h4>
                      <p>
                        When pushing code for any assigned task, include the Task ID in your commit message
                        (e.g., <code>git commit -m "TASK-102: Added responsive grid layout"</code>).
                        Our automated commit hook will instantly verify your work and mark it as <strong>Done</strong>!
                      </p>
                    </div>
                </div>
              </div>
            </div>
            );
}

            export default ProfilePage;
