import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProjectProvider } from "./context/ProjectContext";
import { TaskProvider } from "./context/TaskContext";
import Navbar from "./components/Navbar";
import TaskBoard from "./components/TaskBoard";
import ProjectsHub from "./components/ProjectsHub";
import GitIntegration from "./components/GitIntegration";
import ProfilePage from "./components/ProfilePage";
import AuthPage from "./components/AuthPage";

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("board"); // 'board' | 'projects' | 'git' | 'profile'

  if (!user) {
    return <AuthPage />;
  }

  return (
    <ProjectProvider>
      <TaskProvider>
        <div className="app-container">
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="main-content-area">
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
