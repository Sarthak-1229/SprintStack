import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TaskContext = createContext();
export const useTaskContext = () => useContext(TaskContext);
const API = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const request = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Request failed');
    return data;
  }, []);

  const refreshTasks = useCallback(async () => {
    try { setTasks(await request('/api/tasks')); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { refreshTasks(); }, [refreshTasks]);

  const createTask = async (task) => { await request('/api/tasks', { method: 'POST', body: JSON.stringify(task) }); await refreshTasks(); };
  const updateTask = async (task) => { await request(`/api/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }); await refreshTasks(); };
  const moveTask = async (id, status) => { await request(`/api/tasks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); await refreshTasks(); };
  const deleteTask = async (id) => { await request(`/api/tasks/${id}`, { method: 'DELETE' }); await refreshTasks(); };

  return <TaskContext.Provider value={{ tasks, loading, error, refreshTasks, createTask, updateTask, moveTask, deleteTask }}>{children}</TaskContext.Provider>;
};
