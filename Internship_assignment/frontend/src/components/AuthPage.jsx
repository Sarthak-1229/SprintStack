import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import './AuthPage.css';

function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member'); // 'admin' or 'member'
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('student'); // 'student' or 'professional'
  const [institutionOrCompany, setInstitutionOrCompany] = useState('');

  // Validation State
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate Login Form
  const validateLoginForm = () => {
    const errors = {};
    const trimmedId = identifier.trim();

    if (!trimmedId) {
      errors.identifier = 'Username or email address is required.';
    } else if (trimmedId.length < 3) {
      errors.identifier = 'Identifier must be at least 3 characters.';
    }

    if (!password) {
      errors.password = 'Passcode is required.';
    } else if (password.length < 6) {
      errors.password = 'Passcode must be at least 6 characters.';
    }

    return errors;
  };

  // Validate Registration Form
  const validateRegisterForm = () => {
    const errors = {};
    const trimmedUser = username.trim();
    const trimmedEmail = email.trim();

    if (!trimmedUser) {
      errors.username = 'Operator ID (username) is required.';
    } else if (trimmedUser.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(trimmedUser)) {
      errors.username = 'Username can only contain letters, numbers, and underscores.';
    }

    if (!trimmedEmail) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!password) {
      errors.password = 'Passcode is required.';
    } else if (password.length < 6) {
      errors.password = 'Passcode must be at least 6 characters.';
    }

    return errors;
  };

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
    if (error) setError('');
  };

  const handleModeSwitch = (mode) => {
    setIsLogin(mode);
    setError('');
    setFieldErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Run client-side validation
    const errors = isLogin ? validateLoginForm() : validateRegisterForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError(
        isLogin
          ? 'Please enter your username/email and passcode (min 6 characters).'
          : 'Please correct the highlighted errors before registering.'
      );
      return;
    }

    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await login(identifier.trim(), password);
      } else {
        res = await register({
          username: username.trim(),
          email: email.trim(),
          password,
          role,
          fullName: fullName.trim(),
          userType,
          institutionOrCompany: institutionOrCompany.trim()
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
        {/* Geometric Bauhaus Header */}
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
            onClick={() => handleModeSwitch(true)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-mode-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => handleModeSwitch(false)}
          >
            Register Account
          </button>
        </div>

        {error && (
            <div className="auth-error-banner" role="alert">
              <AlertTriangle size={18} className="error-icon" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
        )}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                {isLogin ? (
                  /* Login Form */
                  <div className="form-group">
                    <label className="form-label" htmlFor="login-identifier">
                      Username or Email *
                    </label>
                    <input
                      id="login-identifier"
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        clearFieldError('identifier');
                      }}
                      className={`auth-input ${fieldErrors.identifier ? 'input-error' : ''}`}
                      placeholder="e.g. sarthak or alex_dev"
                      autoFocus
                    />
                    {fieldErrors.identifier && (
                      <span className="field-error-text" role="alert">
                        <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                        <span>{fieldErrors.identifier}</span>
                      </span>
                    )}
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
                          <div className="role-option-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Zap size={15} color="var(--accent-blue, #0056A3)" />
                            <span>Team Member</span>
                          </div>
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
                          <div className="role-option-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <ShieldCheck size={15} color="var(--accent-red, #E1251B)" />
                            <span>Project Admin</span>
                          </div>
                          <div className="role-option-desc">
                            Create projects, generate team codes, assign tasks.
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="register-username">
                          Operator ID (Username) *
                        </label>
                        <input
                          id="register-username"
                          type="text"
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            clearFieldError('username');
                          }}
                          className={`auth-input ${fieldErrors.username ? 'input-error' : ''}`}
                          placeholder="e.g. dev_sarah"
                        />
                        {fieldErrors.username && (
                          <span className="field-error-text" role="alert">
                            <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                            <span>{fieldErrors.username}</span>
                          </span>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="register-fullname">
                          Full Name
                        </label>
                        <input
                          id="register-fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="auth-input"
                          placeholder="e.g. Sarah Connor"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="register-email">
                        Email Address *
                      </label>
                      <input
                        id="register-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          clearFieldError('email');
                        }}
                        className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
                        placeholder="name@organization.com"
                      />
                      {fieldErrors.email && (
                        <span className="field-error-text" role="alert">
                          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                          <span>{fieldErrors.email}</span>
                        </span>
                      )}
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
                          <option value="student">Student / Academic</option>
                          <option value="professional">Working Professional</option>
                        </select>
                      </div>
                      <div className="form-group">
                          <label className="form-label" htmlFor="register-institution">
                            {userType === 'student' ? 'College / University' : 'Company / Organization'}
                          </label>
                          <input
                            id="register-institution"
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
                  <label className="form-label" htmlFor="auth-password">
                    Secret Passcode *
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                    }}
                    className={`auth-input ${fieldErrors.password ? 'input-error' : ''}`}
                    placeholder="Min. 6 characters"
                  />
                  {fieldErrors.password && (
                    <span className="field-error-text" role="alert">
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      <span>{fieldErrors.password}</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className="auth-submit-btn"
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <span>
                    {loading
                      ? 'Processing...'
                      : isLogin
                        ? 'Enter Workspace'
                        : `Create ${role === 'admin' ? 'Admin' : 'Member'} Account`}
                  </span>
                  <ArrowRight size={16} />
                </button>
              </form>

              <div className="auth-demo-helper">
                <span className="demo-title">Default Demo Credentials:</span>
                <div className="demo-row" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={12} color="var(--accent-red, #E1251B)" />
                  <span>Admin: <code>sarthak</code> / <code>sarthak_1204</code></span>
                </div>
                <div className="demo-row" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap size={12} color="var(--accent-blue, #0056A3)" />
                  <span>Member: <code>alex_dev</code> / <code>password123</code></span>
                </div>
              </div>
          </div>
    </div>
      );
}

      export default AuthPage;
