import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const TaskContext = createContext();
export const useTaskContext = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BACKEND_URL = (
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"
  ).replace(/\/$/, "");

  const getHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const normalizeTask = (t) => ({
    ...t,
    id: t._id?.toString() || t.id?.toString(),
  });

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/tasks`, {
        headers: getHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data.map(normalizeTask));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (taskData) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create task");
      }
      const newTask = await response.json();
      setTasks((prev) => [...prev, normalizeTask(newTask)]);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const updateTask = async (updatedTask) => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/api/tasks/${updatedTask.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            category: updatedTask.category,
            status: updatedTask.status,
            assignee: updatedTask.assignee,
            dueDate: updatedTask.dueDate,
          }),
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to update task");
      }
      const updated = await response.json();
      const normalized = normalizeTask(updated);
      setTasks((prev) =>
        prev.map((t) => (t.id === normalized.id ? normalized : t))
      );
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const moveTask = async (id, status) => {
    // Optimistic local update
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        // Revert on failure
        await fetchTasks();
        throw new Error("Failed to move task");
      }
      const updated = await response.json();
      const normalized = normalizeTask(updated);
      setTasks((prev) =>
        prev.map((t) => (t.id === normalized.id ? normalized : t))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete task");
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        error,
        createTask,
        updateTask,
        moveTask,
        deleteTask,
        fetchTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};
