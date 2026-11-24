import React, { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';

function GitCommitModal({ isOpen, onClose }) {
  const { tasks, dispatchCommit } = useTaskContext();
  const { user } = useAuth();

  const activeTasks = tasks.filter((t) => t.status !== 'Done');

  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [author, setAuthor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAuthor(user?.username || 'developer');
      setResult(null);
      setError('');
      if (activeTasks.length > 0) {
        const first = activeTasks[0];
        setSelectedTaskId(first.taskId || first.id);
        setCommitMessage(`${first.taskId || 'TASK'}: completed ${first.title.toLowerCase()}`);
      } else {
        setSelectedTaskId('');
        setCommitMessage('General repository update');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleTaskChange = (e) => {
    const val = e.target.value;
    setSelectedTaskId(val);
    if (!val) {
      setCommitMessage('');
      return;
    }
    const matched = activeTasks.find((t) => (t.taskId || t.id) === val);
    if (matched) {
      setCommitMessage(`${matched.taskId || 'TASK'}: completed ${matched.title.toLowerCase()}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      setError('Please provide a commit message');
      return;
    }

    setSubmitting(true);
    setError('');
    setResult(null);

    try {
      const res = await dispatchCommit({
        commitMessage: commitMessage.trim(),
        author: author.trim() || user?.username || 'developer',
        branch: branch.trim() || 'main'
      });
      setResult(res);
    } catch (err) {
      setError(err.message || 'Failed to execute commit and push');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" role="dialog" aria-modal="true" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🌿</span> Commit & Push to GitHub
          </h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">×</button>
        </div>

        {result ? (
          <div style={{ padding: '1.25rem' }}>
            <div
              style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                padding: '1.2rem',
                marginBottom: '1rem',
                borderRadius: '2px'
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#166534', fontSize: '1.05rem' }}>
                🎉 {result.pushSuccess ? 'Pushed to GitHub Successfully!' : 'Commit Created!'}
              </h3>
              <p style={{ margin: '0 0 0.75rem 0', color: '#1f2937', fontSize: '0.9rem' }}>
                {result.message}
              </p>
              {result.commitHash && (
                <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '0.75rem' }}>
                  <strong>Commit SHA: </strong>
                  <code>#{result.commitHash}</code>
                </div>
              )}
              {result.commitUrl && (
                <a
                  href={result.commitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem'
                  }}
                >
                  View Commit on GitHub ↗
                </a>
              )}
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              The matching task has been automatically moved to <strong>Done</strong> with full Git verification.
            </p>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
            {error && (
              <div role="alert" className="api-error" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="task-select" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                Select Active Task to Complete:
              </label>
              <select
                id="task-select"
                className="form-input"
                value={selectedTaskId}
                onChange={handleTaskChange}
                disabled={submitting}
              >
                {activeTasks.length === 0 ? (
                  <option value="">(No active tasks - all are Done!)</option>
                ) : (
                  <>
                    {activeTasks.map((t) => (
                      <option key={t.id || t._id} value={t.taskId || t.id}>
                        [{t.taskId || 'TASK'}] {t.title} ({t.status})
                      </option>
                    ))}
                    <option value="">-- Custom commit (no specific task) --</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="commit-msg-input" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                Commit Message: <span style={{ color: 'var(--danger-color)' }}>*</span>
              </label>
              <input
                id="commit-msg-input"
                type="text"
                className="form-input"
                placeholder="e.g. TASK-101: implemented feature and updated tests"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                required
                disabled={submitting}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Tip: Including <code>TASK-XXX</code> or the task's title advances the task to <strong>Done</strong>.
              </span>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="commit-branch-input" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Branch:
                </label>
                <input
                  id="commit-branch-input"
                  type="text"
                  className="form-input"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="commit-author-input" style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                  Author:
                </label>
                <input
                  id="commit-author-input"
                  type="text"
                  className="form-input"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-color)',
                border: '2px solid var(--border-color)',
                padding: '0.75rem',
                marginBottom: '1.25rem',
                fontSize: '0.78rem',
                color: 'var(--text-muted)'
              }}
            >
              <strong>💡 Terminal Tip:</strong> You can also commit directly from your command line:
              <br />
              <code style={{ display: 'block', margin: '0.35rem 0', padding: '0.3rem 0.5rem', background: '#ffffff', border: '1px solid var(--border-color)' }}>
                git commit -m &quot;TASK-101: your commit message&quot;
              </code>
              SprintStack&apos;s local Git post-commit hook automatically advances the task to <strong>Done</strong>!
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ background: '#10b981', borderColor: '#059669', color: '#ffffff' }}
                disabled={submitting}
              >
                {submitting ? 'Committing & Pushing...' : '🚀 Commit & Push to GitHub'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default GitCommitModal;
