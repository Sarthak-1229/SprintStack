import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  const fetchUsers = useCallback(async (authToken) => {
    const t = authToken || token || localStorage.getItem('token');
    if (!t) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const usersList = await res.json();
        const map = {};
        usersList.forEach((u) => {
          if (u.username) {
            map[u.username] = u.avatar || '';
          }
        });
        setUsersMap(map);
      }
    } catch (e) {
      console.error('Failed to fetch users directory:', e);
    }
  }, [token, BACKEND_URL]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Verify/refresh user profile from server
        fetch(`${BACKEND_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((profile) => {
            if (profile) {
              setUser(profile);
              localStorage.setItem('user', JSON.stringify(profile));
            }
          })
          .catch(() => { });

        fetchUsers(storedToken);
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
}, [BACKEND_URL, fetchUsers]);

const login = async (identifier, password) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    fetchUsers(data.token);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const register = async (registerData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Registration failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    fetchUsers(data.token);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const updateProfile = async (profileData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Update failed');

    const updatedUser = { ...(user || {}), ...data.user };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    if (data.user?.username && data.user?.avatar !== undefined) {
      setUsersMap((prev) => ({
        ...prev,
        [data.user.username]: data.user.avatar
      }));
    }

    fetchUsers(token);
    return { success: true, message: data.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const refreshProfile = async () => {
  if (!token) return;
  try {
    const res = await fetch(`${BACKEND_URL}/api/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      fetchUsers(token);
    }
  } catch (e) {
    console.error('Failed to refresh profile', e);
  }
};

const getUserAvatar = useCallback((username) => {
  if (!username) return '';
  if (user && user.username === username && user.avatar) {
    return user.avatar;
  }
  return usersMap[username] || '';
}, [user, usersMap]);

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('currentProjectId');
  setToken(null);
  setUser(null);
  setUsersMap({});
};

return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        usersMap,
        getUserAvatar,
        fetchUsers,
        login,
        register,
        logout,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
    );
};
