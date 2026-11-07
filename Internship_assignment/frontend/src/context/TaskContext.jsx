import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useProject } from './ProjectContext';

const TaskContext = createContext();

export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const { token, user } = useAuth();
  const { currentProject } = useProject();

  const [tasks, setTasks] = useState(() => {
    try {
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        const cached = localStorage.getItem(`sprintstack_tasks_${savedProjectId}`);
        return cached ? JSON.parse(cached) : [];
      }
      return [];
    } catch {
      return [];
    }
  });
  const [commits, setCommits] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ruleAlert, setRuleAlert] = useState(null);
  const [commitCelebration, setCommitCelebration] = useState(null);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  const normalizeTask = (t) => ({ ...t, id: t._id?.toString() || t.id?.toString() });

  // Fetch tasks via REST for current project
  const fetchTasks = useCallback(async () => {
    if (!token || !currentProject?.id) {
      setTasks([]);
      return;
    }
    try {
      if (tasks.length === 0) setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/projects/${currentProject.id}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map(normalizeTask);
        setTasks(normalized);
        try {
          localStorage.setItem(`sprintstack_tasks_${currentProject.id}`, JSON.stringify(normalized));
        } catch { }
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    } finally {
      setLoading(false);
    }
  }, [token, currentProject?.id, BACKEND_URL, tasks.length]);

  // Fetch commits for current project
  const fetchCommits = useCallback(async () => {
    if (!token || !currentProject?.id) {
      setCommits([]);
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${currentProject.id}/commits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCommits(data);
      }
    } catch (e) {
      console.error('Error fetching commits:', e);
    }
  }, [token, currentProject?.id, BACKEND_URL]);

  // Socket setup
  useEffect(() => {
    if (!token) return;

    const newSocket = io(BACKEND_URL, {
      auth: { token }
    });

    setSocket(newSocket);

    newSocket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
    });

    newSocket.on('error:rule', (data) => {
      setRuleAlert(data.message);
    });

    // Realtime events
    newSocket.on('sync:tasks', (initialTasks) => {
      setTasks(initialTasks.map(normalizeTask));
    });

    newSocket.on('task:created', (newTask) => {
      const norm = normalizeTask(newTask);
      setTasks((prev) => {
        if (prev.some((t) => t.id === norm.id)) return prev;
        return [...prev, norm];
      });
    });

    newSocket.on('task:updated', (updatedTask) => {
      const norm = normalizeTask(updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === norm.id ? norm : t)));
    });

    newSocket.on('task:moved', (movedTask) => {
      const norm = normalizeTask(movedTask);
      setTasks((prev) => prev.map((t) => (t.id === norm.id ? norm : t)));
    });

    newSocket.on('task:deleted', (taskId) => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    });

    newSocket.on('task:completed_by_commit', (data) => {
      setCommitCelebration({
        taskId: data.task.taskId,
        title: data.task.title,
        commitHash: data.commitHash,
        commitMessage: data.commitMessage,
        author: data.author
      });
    });

    newSocket.on('git:new_commit', (newCommit) => {
      setCommits((prev) => [newCommit, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, BACKEND_URL]);

  // Join active project room
  useEffect(() => {
    if (socket && currentProject?.id) {
      socket.emit('join:project', currentProject.id);
      fetchTasks();
      fetchCommits();

      return () => {
        socket.emit('leave:project', currentProject.id);
      };
    }
  }, [socket, currentProject?.id, fetchTasks, fetchCommits]);

  // Task Actions
  const createTask = async (taskData) => {
    if (!currentProject?.id) return { success: false, message: 'No project selected' };

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${currentProject.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task');

      return { success: true, task: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const updateTask = async (taskData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks/${taskData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(taskData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');

      return { success: true, task: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const moveTask = async (id, targetStatus) => {
    const task = tasks.find((t) => t.id === id);
    const taskIdLabel = task?.taskId || 'This task';

    // STRICT CHECK: Cannot manually move to Done!
    if (targetStatus === 'Done') {
      setRuleAlert(
        `⛔ [${taskIdLabel}] cannot be manually moved to 'Done'. Done status is strictly commit-gated! Push a Git commit with "${taskIdLabel}" in the message, or use the Git Automation terminal.`
      );
      return;
    }

    // Optimistic local update for To Do <-> In Progress
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: targetStatus } : t))
    );

    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks/${id}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: targetStatus })
      });
      const data = await res.json();
      if (!res.ok) {
        // Revert on error
        fetchTasks();
        setRuleAlert(data.message || 'Failed to move task');
      }
    } catch (err) {
      fetchTasks();
      setRuleAlert(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete task');
      return { success: true };
    } catch (err) {
      alert(err.message);
      return { success: false, message: err.message };
    }
  };

  // Dispatch / Simulate Git Commit
  const simulateCommit = async ({ commitMessage, author, branch }) => {
    if (!currentProject?.id) return { success: false, message: 'No project selected' };

    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/${currentProject.id}/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          commitMessage,
          author: author || user?.username,
          branch: branch || 'main'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to process commit');

      return { success: true, ...data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        commits,
        loading,
        ruleAlert,
        setRuleAlert,
        commitCelebration,
        setCommitCelebration,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        fetchTasks,
        fetchCommits,
        simulateCommit
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
