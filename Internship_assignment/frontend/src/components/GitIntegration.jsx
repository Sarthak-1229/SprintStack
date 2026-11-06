import UserAvatar from './UserAvatar';
import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import {
  GitCommit,
  FolderGit2,
  GitBranch,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Terminal as TerminalIcon,
  CheckCircle2,
  Clock,
  Code2
} from 'lucide-react';
import './GitIntegration.css';

function GitIntegration() {
  const { currentProject } = useProject();
  const { tasks, commits, simulateCommit } = useTaskContext();
  const { user, token } = useAuth();

  const [selectedTask, setSelectedTask] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [activeSetupTab, setActiveSetupTab] = useState('terminal'); // 'terminal' | 'localhook' | 'curl' | 'github'

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const webhookUrl = currentProject
    ? `${BACKEND_URL}/api/projects/${currentProject.id}/webhook`
    : `${BACKEND_URL}/api/projects/:projectId/webhook`;

  const commitApiUrl = currentProject
    ? `${BACKEND_URL}/api/projects/${currentProject.id}/commit`
    : `${BACKEND_URL}/api/projects/:projectId/commit`;

  // Tasks eligible for completion (In Progress or To Do)
  const activeTasks = tasks.filter((t) => t.status !== 'Done');

  const handleSelectTask = (e) => {
    const tid = e.target.value;
    setSelectedTask(tid);
    if (tid && !customMsg.includes(tid)) {
      setCustomMsg(`${tid}: `);
    }
  };

  const handleCommitSubmit = async (e) => {
    e.preventDefault();
    if (!customMsg.trim()) return;

    setIsPushing(true);
    setLastResult(null);

    const res = await simulateCommit({
      commitMessage: customMsg.trim(),
      author: user?.username || 'developer',
      branch
    });

    setIsPushing(false);
    if (res.success) {
      setLastResult({
        success: true,
        message: res.message,
        matched: res.matchedTaskIds,
        commit: res.commitLog
      });
      setCustomMsg('');
      setSelectedTask('');
    } else {
      setLastResult({
        success: false,
        message: res.message || 'Failed to dispatch commit'
      });
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const localHookCode = `#!/bin/sh
# SprintStack Local Git Hook (.git/hooks/post-commit)
COMMIT_MSG=$(git log -1 --pretty=%B)
COMMIT_HASH=$(git log -1 --pretty=%h)
AUTHOR=$(git log -1 --pretty=%an)

curl -s -X POST "${commitApiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token || '<YOUR_TOKEN>'}" \\
  -d "{\\"commitMessage\\":\\"$COMMIT_MSG\\",\\"commitHash\\":\\"$COMMIT_HASH\\",\\"author\\":\\"$AUTHOR\\"}" > /dev/null
`;

  const curlTestSnippet = `curl -X POST "${commitApiUrl}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token || '<TOKEN>'}" \\
  -d '{"commitMessage":"TASK-102: verified from terminal","author":"${user?.username || 'dev'}"}'`;

  const copyLocalHook = () => {
    navigator.clipboard.writeText(localHookCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlTestSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  if (!currentProject) {
    return (
      <div className="git-container empty">
        <div className="git-empty-card">
          <div className="git-icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <GitCommit size={48} color="var(--accent-black)" />
          </div>
          <h3>No Active Project Selected</h3>
          <p>Please select or join a project from the Projects Hub to view its Git automation console.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="git-container">
      {/* Banner */}
      <div className="git-header-card">
        <div className="git-header-left">
          <span className="git-badge">AUTOMATED CI/CD & TRACEABILITY</span>
          <h2 className="git-title">Git & GitHub Pipeline</h2>
          <p className="git-subtitle">
            Commit-gated task transitions for project <strong>{currentProject.name}</strong> [{currentProject.code}]
          </p>
        </div>

        <div className="git-repo-pill">
          <FolderGit2 size={15} className="repo-icon" />
          <span className="repo-url">
            {currentProject.githubRepo || 'https://github.com/SprintStack/project-repo'}
          </span>
        </div>
      </div>

      <div className="git-grid">
        {/* Left Column: Unified Git Automation Console */}
        <div className="git-left-panel">
          <div className="git-console-card">
            {/* Top Navigation Tabs */}
            <div className="git-console-nav">
              <button
                type="button"
                className={`git-console-tab ${activeSetupTab === 'terminal' ? 'active terminal-mode' : ''}`}
                onClick={() => setActiveSetupTab('terminal')}
              >
                <TerminalIcon size={14} />
                <span>In-Browser Simulator</span>
              </button>

              <button
                type="button"
                className={`git-console-tab ${activeSetupTab === 'localhook' ? 'active' : ''}`}
                onClick={() => setActiveSetupTab('localhook')}
              >
                <FolderGit2 size={14} />
                <span>Local Git Hook (.git/hooks)</span>
              </button>

              <button
                type="button"
                className={`git-console-tab ${activeSetupTab === 'curl' ? 'active' : ''}`}
                onClick={() => setActiveSetupTab('curl')}
              >
                <Code2 size={14} />
                <span>cURL Direct Test</span>
              </button>

              <button
                type="button"
                className={`git-console-tab ${activeSetupTab === 'github' ? 'active' : ''}`}
                onClick={() => setActiveSetupTab('github')}
              >
                <ExternalLink size={14} />
                <span>GitHub Webhook</span>
              </button>
            </div>

            {/* Tab 1: Terminal Push Simulator */}
            {activeSetupTab === 'terminal' && (
              <div className="terminal-card-inner">
                <div className="terminal-header">
                  <div className="terminal-buttons">
                    <span className="term-dot dot-red"></span>
                    <span className="term-dot dot-yellow"></span>
                    <span className="term-dot dot-green"></span>
                  </div>
                  <span className="terminal-title">developer@{user?.username || 'user'}: ~/repo (branch: {branch})</span>
                </div>

                <div className="terminal-body">
                  <div className="terminal-intro">
                    <p># Type a commit message mentioning the Task ID (e.g. <code>TASK-102: ...</code>).</p>
                    <p># Pushing this commit triggers the webhook and automatically marks the task as <strong>DONE</strong>.</p>
                  </div>

                  {/* Task Quick-Selector */}
                  <div className="terminal-task-select-row">
                    <label className="term-label">Quick-link an Active Task:</label>
                    <select
                      className="terminal-select"
                      value={selectedTask}
                      onChange={handleSelectTask}
                    >
                      <option value="">-- Choose task to auto-prefix --</option>
                      {activeTasks.map((t) => (
                        <option key={t.id} value={t.taskId}>
                          [{t.taskId}] {t.title} ({t.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Commit Input Form */}
                  <form onSubmit={handleCommitSubmit} className="terminal-form">
                    <div className="command-preview-line">
                      <span className="term-prompt">$ git commit -m</span>
                      <input
                        type="text"
                        required
                        value={customMsg}
                        onChange={(e) => setCustomMsg(e.target.value)}
                        className="terminal-input"
                        placeholder="e.g. TASK-102: implemented multi-project workspace tabs"
                      />
                    </div>

                    <div className="terminal-actions-bar">
                      <div className="branch-selector">
                        <span className="branch-label">Branch:</span>
                        <select
                          className="branch-select"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                        >
                          <option value="main">main</option>
                          <option value="develop">develop</option>
                          <option value="feature/kanban">feature/kanban</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="terminal-push-btn"
                        disabled={isPushing}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <Send size={13} />
                        <span>{isPushing ? 'Pushing Commit...' : 'Push Commit ($ git push)'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Feedback Result */}
                  {lastResult && (
                    <div className={`terminal-output ${lastResult.success ? 'success' : 'error'}`}>
                      {lastResult.success ? (
                        <>
                          <div className="term-out-line">✓ [remote: webhook] Commit accepted!</div>
                          <div className="term-out-line">
                            ➔ Linked Task(s): <strong>{lastResult.matched.join(', ') || 'None'}</strong> moved to <strong>Done</strong>
                          </div>
                          <div className="term-out-line">
                            ➔ Commit SHA: <code>#{lastResult.commit?.commitHash}</code>
                          </div>
                        </>
                      ) : (
                        <div className="term-out-line error">
                          <AlertTriangle size={13} style={{ display: 'inline', marginRight: '4px' }} />
                          <span>{lastResult.message}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Switcher Helper Tips */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', paddingTop: '0.4rem', borderTop: '1px dashed #374151' }}>
                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Ready for real Git?</span>
                    <button
                      type="button"
                      onClick={() => setActiveSetupTab('localhook')}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Setup Local Git Hook
                    </button>
                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>•</span>
                    <button
                      type="button"
                      onClick={() => setActiveSetupTab('curl')}
                      style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.7rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                    >
                      Direct cURL
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Local Git Hook */}
            {activeSetupTab === 'localhook' && (
              <div className="console-tab-body">
                <div className="webhook-card-header">
                  <FolderGit2 size={20} color="var(--accent-black)" className="webhook-icon" />
                  <div>
                    <h4 className="webhook-card-title">Connect Real Local Git Commits</h4>
                    <p className="webhook-card-desc">
                      Trigger automatic task completion directly from your PC terminal when typing <code>git commit</code>!
                    </p>
                  </div>
                </div>

                <div style={{ position: 'relative', margin: '0.45rem 0' }}>
                  <pre className="code-snippet-pre">
                    {localHookCode}
                  </pre>
                  <button
                    type="button"
                    className="webhook-copy-btn"
                    onClick={copyLocalHook}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {copiedScript ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedScript ? 'Copied' : 'Copy Hook'}</span>
                  </button>
                </div>

                <div className="webhook-instructions-compact">
                  <span className="instructions-title">Quick 4-Step Setup:</span>
                  <div className="instructions-grid-steps">
                    <div className="inst-step-item">
                      <span className="step-num">1</span>
                      <span>Open <code>.git/hooks/post-commit</code></span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">2</span>
                      <span>Paste script & save</span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">3</span>
                      <span>Run <code>chmod +x post-commit</code></span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">4</span>
                      <span>Commit: <code>git commit -m "TASK-XXX: ..."</code></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: cURL Direct Test */}
            {activeSetupTab === 'curl' && (
              <div className="console-tab-body">
                <div className="webhook-card-header">
                  <Code2 size={20} color="var(--accent-blue, #0056A3)" className="webhook-icon" />
                  <div>
                    <h4 className="webhook-card-title">One-Line cURL Test</h4>
                    <p className="webhook-card-desc">
                      Test commit automation immediately from your command prompt / terminal:
                    </p>
                  </div>
                </div>

                <div style={{ position: 'relative', margin: '0.45rem 0' }}>
                  <pre className="code-snippet-pre curl-snippet">
                    {curlTestSnippet}
                  </pre>
                  <button
                    type="button"
                    className="webhook-copy-btn"
                    onClick={copyCurl}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    {copiedCurl ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
                  </button>
                </div>

                <div className="curl-tip-badge">
                  <span>💡 Run this in your command terminal to test task completion for <code>TASK-102</code> without configuring git hooks.</span>
                </div>
              </div>
            )}

            {/* Tab 4: GitHub Webhook */}
            {activeSetupTab === 'github' && (
              <div className="console-tab-body">
                <div className="webhook-card-header">
                  <ExternalLink size={20} color="var(--accent-blue, #0056A3)" className="webhook-icon" />
                  <div>
                    <h4 className="webhook-card-title">Live GitHub Repository Webhook</h4>
                    <p className="webhook-card-desc">
                      Receives push events from GitHub and completes matching tasks:
                    </p>
                  </div>
                </div>

                <div className="webhook-url-box">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="webhook-url-input"
                  />
                  <button
                    type="button"
                    className="webhook-copy-btn"
                    onClick={copyWebhookUrl}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {copiedWebhook ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedWebhook ? 'Copied' : 'Copy URL'}</span>
                  </button>
                </div>

                <div className="webhook-instructions-compact">
                  <span className="instructions-title">GitHub Setup:</span>
                  <div className="instructions-grid-steps">
                    <div className="inst-step-item">
                      <span className="step-num">1</span>
                      <span>Repo Settings ➔ Webhooks ➔ Add</span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">2</span>
                      <span>Paste URL as <strong>Payload URL</strong></span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">3</span>
                      <span>Content type: <code>application/json</code></span>
                    </div>
                    <div className="inst-step-item">
                      <span className="step-num">4</span>
                      <span>Push commits with <code>TASK-XXX</code></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Commit Stream */}
        <div className="git-right-panel">
          <div className="commits-card">
            <div className="commits-card-header">
              <div className="commits-title-group">
                <h3 className="commits-title">Commit Activity Stream</h3>
                <span className="commits-count">{commits.length} commits logged</span>
              </div>
            </div>

            {commits.length === 0 ? (
              <div className="commits-empty">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <GitBranch size={36} color="var(--text-muted)" />
                </div>
                <p>No commits recorded yet for this project.</p>
                <span className="empty-sub">
                  Use the terminal on the left to push your first commit!
                </span>
              </div>
            ) : (
              <div className="commits-list">
                {commits.map((c) => (
                  <div key={c.id || c._id} className="commit-item">
                    <div className="commit-header-row">
                      <div className="commit-author-group">
                        <UserAvatar username={c.author} size={24} />
                        <span className="commit-author-name">{c.author}</span>
                      </div>

                      <span className="commit-hash" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <GitCommit size={11} />
                        <span>#{c.commitHash ? c.commitHash.substring(0, 7) : 'head'}</span>
                      </span>
                    </div>

                    <p className="commit-message-text">{c.commitMessage}</p>

                    <div className="commit-footer-row">
                      <div className="matched-tasks-tags">
                        {c.matchedTasks && c.matchedTasks.length > 0 ? (
                          c.matchedTasks.map((tid, idx) => (
                            <span key={idx} className="matched-task-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <CheckCircle2 size={11} color="#16a34a" />
                              <span>{tid} Completed</span>
                            </span>
                          ))
                        ) : (
                          <span className="no-task-tag">No task linked</span>
                        )}
                      </div>

                      <span className="commit-time" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} />
                        <span>
                          {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GitIntegration;
