import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (isLogin) {
      if (!identifier.trim())
        errors.identifier = "Email or username is required.";
      if (!password) errors.password = "Password is required.";
    } else {
      if (!username.trim()) errors.username = "Username is required.";
      else if (username.trim().length < 3)
        errors.username = "Username must be at least 3 characters.";
      if (!email.trim()) errors.email = "Email is required.";
      else if (!email.includes("@"))
        errors.email = "Enter a valid email address.";
      if (!password) errors.password = "Password is required.";
      else if (password.length < 6)
        errors.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    let res;
    if (isLogin) {
      res = await login(identifier, password);
    } else {
      res = await register(username, email, password);
    }
    if (!res.success) {
      setError(res.message);
    }
  };

  return (
    <div
      className="container d-flex align-items-center justify-content-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="card shadow" style={{ width: "100%", maxWidth: "440px" }}>
        <div className="card-body p-4">
          <h2 className="card-title text-center mb-1 fw-bold">SprintStack</h2>
          <p className="text-center text-muted mb-4">
            {isLogin ? "Sign in to your board" : "Create a new account"}
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            {isLogin ? (
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Email or Username
                </label>
                <input
                  type="text"
                  className={`form-control ${fieldErrors.identifier ? "is-invalid" : ""}`}
                  placeholder="Enter email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                {fieldErrors.identifier && (
                  <div className="text-danger small mt-1">
                    {fieldErrors.identifier}
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <input
                    type="text"
                    className={`form-control ${fieldErrors.username ? "is-invalid" : ""}`}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  {fieldErrors.username && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.username}
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input
                    type="email"
                    className={`form-control ${fieldErrors.email ? "is-invalid" : ""}`}
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {fieldErrors.email && (
                    <div className="text-danger small mt-1">
                      {fieldErrors.email}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="mb-3">
              <label className="form-label fw-semibold">Password</label>
              <input
                type="password"
                className={`form-control ${fieldErrors.password ? "is-invalid" : ""}`}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <div className="text-danger small mt-1">
                  {fieldErrors.password}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold">
              {isLogin ? "Login" : "Register"}
            </button>
          </form>

          <div className="text-center mt-3">
            <span className="text-muted">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}{" "}
            </span>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
                setFieldErrors({});
              }}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
