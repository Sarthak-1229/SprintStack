import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthPage.css';

function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member'); // 'admin' or 'member'
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('student'); // 'student' or 'professional'
  const [institutionOrCompany, setInstitutionOrCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login(identifier, password);
      } else {
        res = await register({
          username,
          email,
          password,
          role,
          fullName,
          userType,
          institutionOrCompany
        });
      }

      if (!res.success) {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Geometric Bauhaus Icon */}
        <div className="auth-geometric-header">
          <span className="auth-shape shape-red"></span>
          <span className="auth-shape shape-yellow"></span>
          <span className="auth-shape shape-blue"></span>
        </div>

        <h1 className="auth-title">SprintStack</h1>
        <p className="auth-tagline">Automated Git-Ops & Developer Task Management</p>

        {/* Tab switch */}
        <div className="auth-mode-switch">
          <button
            type="button"
            className={`auth-mode-btn ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
            }}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="auth-error-banner">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isLogin ? (
            /* Login Form */
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="auth-input"
                placeholder="e.g. sarthak or alex_dev"
              />
            </div>
          ) : (
            /* Registration Form with Role Selection */
            <>
              {/* Role Selection Tabs */}
              <div className="role-selector-group">
                <label className="form-label">Account Role Designation:</label>
                <div className="role-options">
                  <label
                    className={`role-option-card ${role === 'member' ? 'selected' : ''}`}
                    onClick={() => setRole('member')}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      checked={role === 'member'}
                      onChange={() => setRole('member')}
                      style={{ display: 'none' }}
                    />
                    <div className="role-option-title">⚡ Team Member</div>
                    <div className="role-option-desc">
                      Join projects via code, start tasks, and commit code.
                    </div>
                  </label>

                  <label
                    className={`role-option-card ${role === 'admin' ? 'selected' : ''}`}
                    onClick={() => setRole('admin')}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      style={{ display: 'none' }}
                    />
                    <div className="role-option-title">🛡️ Project Admin</div>
                    <div className="role-option-desc">
                      Create projects, generate team codes, assign tasks.
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Operator ID (Username)</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="auth-input"
                    placeholder="e.g. dev_sarah"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="auth-input"
                    placeholder="e.g. Sarah Connor"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  placeholder="name@organization.com"
                />
              </div>

              {/* Profile Background Preview */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Profile Track</label>
                  <select
                    className="auth-input"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <option value="student">🎓 Student / Academic</option>
                    <option value="professional">💼 Working Professional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {userType === 'student' ? 'College / University' : 'Company / Organization'}
                  </label>
                  <input
                    type="text"
                    value={institutionOrCompany}
                    onChange={(e) => setInstitutionOrCompany(e.target.value)}
                    className="auth-input"
                    placeholder={userType === 'student' ? 'e.g. Stanford University' : 'e.g. Acme Tech Corp'}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Secret Passcode</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-input"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? 'Processing...'
              : isLogin
              ? 'Enter Workspace ➔'
              : `Create ${role === 'admin' ? 'Admin' : 'Member'} Account ➔`}
          </button>
        </form>

        <div className="auth-demo-helper">
          <span className="demo-title">Default Demo Credentials:</span>
          <div className="demo-row">
            <span>🛡️ Admin: <code>sarthak</code> / <code>sarthak_1204</code></span>
          </div>
          <div className="demo-row">
            <span>⚡ Member: <code>alex_dev</code> / <code>password123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
