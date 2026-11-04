import React, { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import './GitIntegration.css';

function GitIntegration() {
  const { currentProject } = useProject();
  const { tasks, commits, simulateCommit } = useTaskContext();
  const { user } = useAuth();

  const [selectedTask, setSelectedTask] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [branch, setBranch] = useState('main');
  const [isPushing, setIsPushing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const webhookUrl = currentProject
    ? `${BACKEND_URL}/api/projects/${currentProject.id}/webhook`
    : `${BACKEND_URL}/api/projects/:projectId/webhook`;

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

  if (!currentProject) {
    return (
      <div className="git-container empty">
        <div className="git-empty-card">
          <div className="git-icon">🐙</div>
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
          <span className="repo-icon">📂</span>
          <span className="repo-url">
            {currentProject.githubRepo || 'https://github.com/SprintStack/project-repo'}
          </span>
        </div>
      </div>

      <div className="git-grid">
        {/* Left Column: Interactive Terminal & Dispatcher */}
        <div className="git-left-panel">
          <div className="terminal-card">
            <div className="terminal-header">
              <div className="terminal-buttons">
                <span className="term-dot dot-red"></span>
                <span className="term-dot dot-yellow"></span>
                <span className="term-dot dot-green"></span>
              </div>
              <span className="terminal-title">developer@{user?.username}: ~/repo (branch: {branch})</span>
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
                  >
                    {isPushing ? 'Pushing Commit...' : '🚀 Push Commit ($ git push)'}
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
                        ➔ Linked Task(s): <strong>{lastResult.matched.join(', ') || 'None'}</strong> moved to <strong>Done</strong> ✅
                      </div>
                      <div className="term-out-line">
                        ➔ Commit SHA: <code>#{lastResult.commit?.commitHash}</code>
                      </div>
                    </>
                  ) : (
                    <div className="term-out-line error">❌ {lastResult.message}</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* GitHub Webhook Info Card */}
          <div className="webhook-info-card">
            <div className="webhook-card-header">
              <span className="webhook-icon">🌐</span>
              <div>
                <h4 className="webhook-card-title">Live GitHub Repository Webhook</h4>
                <p className="webhook-card-desc">
                  Connect your real GitHub repository settings to this webhook URL:
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
              <button className="webhook-copy-btn" onClick={copyWebhookUrl}>
                {copiedWebhook ? '✓ Copied' : '📋 Copy URL'}
              </button>
            </div>

            <div className="webhook-instructions">
              <span className="instructions-title">GitHub Setup Instructions:</span>
              <ol className="instructions-list">
                <li>Go to your GitHub repo ➔ <strong>Settings</strong> ➔ <strong>Webhooks</strong> ➔ <strong>Add webhook</strong>.</li>
                <li>Paste the Webhook URL above into the <strong>Payload URL</strong> field.</li>
                <li>Set <strong>Content type</strong> to <code>application/json</code>.</li>
                <li>Under "Which events would you like to trigger this webhook?", select <strong>Just the push event</strong>.</li>
                <li>Click <strong>Add webhook</strong>. Now whenever someone pushes a commit with <code>TASK-XXX</code>, it auto-updates!</li>
              </ol>
            </div>
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
                <span className="empty-stream-icon">🪵</span>
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
                        <span className="commit-avatar">
                          {c.author ? c.author.charAt(0).toUpperCase() : 'D'}
                        </span>
                        <span className="commit-author-name">{c.author}</span>
                      </div>

                      <span className="commit-hash">
                        #{c.commitHash ? c.commitHash.substring(0, 7) : 'head'}
                      </span>
                    </div>

                    <p className="commit-message-text">{c.commitMessage}</p>

                    <div className="commit-footer-row">
                      <div className="matched-tasks-tags">
                        {c.matchedTasks && c.matchedTasks.length > 0 ? (
                          c.matchedTasks.map((tid, idx) => (
                            <span key={idx} className="matched-task-badge">
                              ✓ {tid} Completed
                            </span>
                          ))
                        ) : (
                          <span className="no-task-tag">No task linked</span>
                        )}
                      </div>

                      <span className="commit-time">
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
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
