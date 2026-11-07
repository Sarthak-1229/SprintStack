import React, { useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { TaskProvider } from "./context/TaskContext";
import Navbar from "./components/Navbar";

const TaskBoard = lazy(() => import("./components/TaskBoard"));
const ProjectsHub = lazy(() => import("./components/ProjectsHub"));
const GitIntegration = lazy(() => import("./components/GitIntegration"));
const ProfilePage = lazy(() => import("./components/ProfilePage"));
const AuthPage = lazy(() => import("./components/AuthPage"));

function ModuleFallback() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "360px",
        gap: "0.85rem",
        fontFamily: "monospace",
        fontWeight: "800",
        color: "var(--accent-black, #1D1D1D)",
      }}
    >
      <div
        style={{
          width: "36px",
          height: "36px",
          border: "3.5px solid var(--accent-black, #1D1D1D)",
          borderTopColor: "var(--accent-blue, #0056A3)",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <span style={{ fontSize: "0.8rem", letterSpacing: "0.08em" }}>
        INITIALIZING MODULE...
      </span>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("board"); // 'board' | 'projects' | 'git' | 'profile'

  if (!user) {
    return (
      <Suspense fallback={<ModuleFallback />}>
        <AuthPage />
      </Suspense>
    );
  }

  return (
    <ProjectProvider>
      <TaskProvider>
        <div className="app-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="main-content-area">
            <Suspense fallback={<ModuleFallback />}>
              {activeTab === "board" && (
                <TaskBoard onNavigateTab={setActiveTab} />
              )}
              {activeTab === "projects" && (
                <ProjectsHub onSelectProject={setActiveTab} />
              )}
              {activeTab === "git" && (
                <GitIntegration />
              )}
              {activeTab === "profile" && (
                <ProfilePage />
              )}
            </Suspense>
          </main>
        </div>
      </TaskProvider>
    </ProjectProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
