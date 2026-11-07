import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(() => {
    try {
      const saved = localStorage.getItem('sprintstack_current_project');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!currentProject);
  const [error, setError] = useState(null);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

  const fetchProjects = useCallback(async () => {
    if (!token) {
      setProjects([]);
      setCurrentProject(null);
      setLoading(false);
      return;
    }

    try {
      if (!currentProject) setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch projects');

      setProjects(data);

      // Select active project from localStorage or default to first
      const savedProjectId = localStorage.getItem('currentProjectId');
      const found = data.find((p) => p.id === savedProjectId);
      if (found) {
        setCurrentProject(found);
        localStorage.setItem('sprintstack_current_project', JSON.stringify(found));
      } else if (data.length > 0) {
        setCurrentProject(data[0]);
        localStorage.setItem('currentProjectId', data[0].id);
        localStorage.setItem('sprintstack_current_project', JSON.stringify(data[0]));
      } else {
        setCurrentProject(null);
        localStorage.removeItem('sprintstack_current_project');
      }
    } catch (err) {
      console.error('Projects fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, BACKEND_URL, currentProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectProject = (project) => {
    setCurrentProject(project);
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
      localStorage.setItem('sprintstack_current_project', JSON.stringify(project));
    } else {
      localStorage.removeItem('currentProjectId');
      localStorage.removeItem('sprintstack_current_project');
    }
  };

  const createProject = async ({ name, description, githubRepo }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, description, githubRepo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create project');

      await fetchProjects();
      selectProject(data);
      return { success: true, project: data };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const joinProject = async (code) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/projects/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join project');

      await fetchProjects();
      selectProject(data.project);
      return { success: true, message: data.message, project: data.project };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        currentProject,
        selectProject,
        loading,
        error,
        fetchProjects,
        createProject,
        joinProject
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

