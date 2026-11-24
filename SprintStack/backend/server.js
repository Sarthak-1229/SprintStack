require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const { randomUUID } = require('crypto');
const Task = require('./models/Task');
const User = require('./models/User');

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '8mb' }));
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-before-deploying';
const validStatuses = ['To Do', 'In Progress', 'Done'];
const validPriorities = ['Low', 'Medium', 'High'];
const validCategories = ['Feature', 'Bug', 'Design', 'Research', 'Enhancement'];
const localFile = path.join(__dirname, 'data', 'local-dev.json');
let useLocalStore = false;
let localWrites = Promise.resolve();

async function readLocalStore() {
  try { return JSON.parse(await fs.readFile(localFile, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { users: [], tasks: [] };
  }
}

function updateLocalStore(update) {
  const operation = localWrites.then(async () => {
    const state = await readLocalStore();
    const result = await update(state);
    await fs.mkdir(path.dirname(localFile), { recursive: true });
    const tempFile = `${localFile}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(state, null, 2));
    await fs.rename(tempFile, localFile);
    return result;
  });
  localWrites = operation.catch(() => { });
  return operation;
}

const safeUser = (user) => ({ id: String(user._id || user.id), username: user.username, email: user.email, password: user.password });
async function findUser(identifier) {
  if (!useLocalStore) return User.findOne({ $or: [{ username: identifier }, { email: identifier.toLowerCase() }] });
  const state = await readLocalStore();
  return state.users.find((user) => user.username.toLowerCase() === identifier.toLowerCase() || user.email === identifier.toLowerCase()) || null;
}
async function addUser(user) {
  if (!useLocalStore) return User.create(user);
  return updateLocalStore((state) => {
    const duplicate = state.users.some((entry) => entry.username.toLowerCase() === user.username.toLowerCase() || entry.email === user.email);
    if (duplicate) { const error = new Error('Username or email already exists'); error.code = 11000; throw error; }
    const saved = { ...user, id: randomUUID() };
    state.users.push(saved);
    return saved;
  });
}
async function listUsers() {
  if (!useLocalStore) return User.find({}, 'username email');
  return (await readLocalStore()).users.map(({ id, username, email }) => ({ id, username, email }));
}
async function listTasks() {
  if (!useLocalStore) return Task.find({}).sort({ createdAt: -1 });
  return (await readLocalStore()).tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
async function getNextTaskId() {
  if (!useLocalStore) {
    const count = await Task.countDocuments();
    return `TASK-${count + 101}`;
  }
  const state = await readLocalStore();
  return `TASK-${(state.tasks?.length || 0) + 101}`;
}

async function createTask(data) {
  if (!data.taskId) {
    data.taskId = await getNextTaskId();
  }
  if (!useLocalStore) return Task.create(data);
  return updateLocalStore((state) => {
    const now = new Date().toISOString();
    const task = { ...data, id: randomUUID(), createdAt: now, updatedAt: now };
    state.tasks.push(task);
    return task;
  });
}
async function updateTask(id, fields) {
  if (!useLocalStore) return Task.findByIdAndUpdate(id, fields, { new: true, runValidators: true });
  return updateLocalStore((state) => {
    const task = state.tasks.find((entry) => entry.id === id);
    if (!task) return null;
    Object.assign(task, fields, { updatedAt: new Date().toISOString() });
    return task;
  });
}
async function removeTask(id) {
  if (!useLocalStore) return Task.findByIdAndDelete(id);
  return updateLocalStore((state) => {
    const index = state.tasks.findIndex((entry) => entry.id === id);
    return index < 0 ? null : state.tasks.splice(index, 1)[0];
  });
}

function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: useLocalStore ? 'local-file' : 'mongodb' }));
app.post('/api/register', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ message: 'Username, email, and password required' });
    if (await findUser(username) || await findUser(email)) return res.status(409).json({ message: 'Username or email already exists' });
    const user = await addUser({ username, email, password: await bcrypt.hash(password, 10) });
    const token = jwt.sign({ id: String(user._id || user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, username: user.username });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Username or email already exists' });
    console.error('Registration failed:', error.message);
    res.status(500).json({ message: 'Could not register user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ message: 'Identifier and password required' });
    const user = await findUser(identifier);
    if (!user || !await bcrypt.compare(password, user.password)) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: jwt.sign({ id: String(user._id || user.id), username: user.username }, JWT_SECRET, { expiresIn: '7d' }), username: user.username });
  } catch (error) { console.error('Login failed:', error.message); res.status(500).json({ message: 'Could not log in' }); }
});
app.get('/api/users', requireAuth, async (_req, res) => {
  try { res.json(await listUsers()); } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load users' }); }
});

app.get('/api/tasks', requireAuth, async (_req, res) => {
  try { res.json(await listTasks()); } catch (error) { console.error(error); res.status(500).json({ message: 'Could not load tasks' }); }
});
app.post('/api/tasks', requireAuth, async (req, res) => {
  try {
    if (!req.body.title?.trim()) return res.status(400).json({ message: 'Title is required' });
    const task = await createTask({ ...req.body, title: req.body.title.trim() });
    res.status(201).json(task);
  } catch (error) { res.status(400).json({ message: error.message || 'Invalid task' }); }
});
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    if (!req.body.title?.trim()) return res.status(400).json({ message: 'Title is required' });
    if (req.body.status && !validStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid task status' });
    if (req.body.priority && !validPriorities.includes(req.body.priority)) return res.status(400).json({ message: 'Invalid task priority' });
    if (req.body.category && !validCategories.includes(req.body.category)) return res.status(400).json({ message: 'Invalid task category' });
    const { _id, __v, id, ...fields } = req.body;
    const task = await updateTask(req.params.id, { ...fields, title: req.body.title.trim() });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) { res.status(400).json({ message: error.message || 'Invalid task' }); }
});
app.patch('/api/tasks/:id/status', requireAuth, async (req, res) => {
  try {
    if (!validStatuses.includes(req.body.status)) return res.status(400).json({ message: 'Invalid task status' });
    const task = await updateTask(req.params.id, { status: req.body.status });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) { res.status(400).json({ message: error.message || 'Invalid task' }); }
});
app.delete('/api/tasks/:id', requireAuth, async (req, res) => {
  try {
    const task = await removeTask(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (error) { console.error(error); res.status(400).json({ message: 'Invalid task id' }); }
});

// Helper to locate git root (.git folder)
function findGitRepoRoot(startDir = __dirname) {
  let curr = path.resolve(startDir);
  while (curr) {
    if (fsSync.existsSync(path.join(curr, '.git'))) return curr;
    const parent = path.dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return null;
}

// Helper to extract default GitHub owner from git remote
function getDefaultGitOwner(repoRoot) {
  try {
    const originUrl = execSync('git remote get-url origin', { cwd: repoRoot, encoding: 'utf8' }).trim();
    const match = originUrl.match(/github\.com[/:]([^/]+)\//i);
    if (match && match[1]) return match[1];
  } catch {}
  return 'Sarthak-1229';
}

// Normalize any repository input (full URL, owner/repo, bare name, or typo like locorep -> locrep)
function normalizeGitHubRepo(repoUrl, defaultOwner = 'Sarthak-1229') {
  if (!repoUrl || typeof repoUrl !== 'string') return '';
  let clean = repoUrl.trim();
  if (!clean) return '';

  // Fix typo "locorep" -> "locrep"
  if (/locorep/i.test(clean)) {
    clean = clean.replace(/locorep/gi, 'locrep');
  }

  // SSH url -> HTTPS
  clean = clean.replace(/^git@github\.com:/, 'https://github.com/');

  // If already full http(s) URL
  if (/^https?:\/\//i.test(clean)) {
    return clean.replace(/\.git$/, '');
  }

  // If owner/repo: "Sarthak-1229/locrep"
  if (clean.includes('/')) {
    return `https://github.com/${clean.replace(/\.git$/, '')}`;
  }

  // If bare name: "locrep"
  return `https://github.com/${defaultOwner}/${clean.replace(/\.git$/, '')}`;
}

// Execute a REAL Git commit and push directly to GitHub (supports project-connected repos!)
async function executeRealGitCommitAndPush({ commitMessage, author, branch = 'main', repoUrl = '' }) {
  const repoRoot = findGitRepoRoot(__dirname);
  if (!repoRoot) {
    return {
      commitHash: Math.random().toString(36).substring(2, 9),
      fullHash: '',
      pushSuccess: false,
      pushError: 'No local .git directory found',
      repoUrl: repoUrl || '',
      commitUrl: ''
    };
  }

  try {
    const defaultOwner = getDefaultGitOwner(repoRoot);
    let originUrl = '';
    try {
      originUrl = execSync('git remote get-url origin', { cwd: repoRoot, encoding: 'utf8' }).trim();
    } catch {}

    const cleanOrigin = originUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
    const targetClean = repoUrl ? normalizeGitHubRepo(repoUrl, defaultOwner) : cleanOrigin;
    const isCurrentWorkspaceRepo = (!targetClean || targetClean.toLowerCase() === cleanOrigin.toLowerCase());
    const targetGitUrl = `${targetClean}.git`;
    const targetBranch = branch || 'main';
    const authorClean = (author || 'developer').replace(/["<>]/g, '');
    const authorStr = `${authorClean} <developer@sprintstack.local>`;

    let shortHash = '';
    let fullHash = '';
    let pushSuccess = false;
    let pushError = null;
    const token = (process.env.GIT_TOKEN || process.env.GITHUB_TOKEN || '').trim();

    if (isCurrentWorkspaceRepo) {
      // 1. Maintain a persistent COMMITS.md ledger in the Git repo
      const commitsLogFile = path.join(repoRoot, 'COMMITS.md');
      const timestamp = new Date().toISOString();
      const needsHeader = !fsSync.existsSync(commitsLogFile);
      const header = '# SprintStack Git Commit Ledger\n\n| Timestamp | Author | Commit Message |\n|---|---|---|\n';
      const logRow = `| ${timestamp} | ${author || 'developer'} | ${commitMessage.replace(/\|/g, '-')} |\n`;
      fsSync.appendFileSync(commitsLogFile, (needsHeader ? header : '') + logRow, 'utf8');

      // 2. Stage the COMMITS.md file
      spawnSync('git', ['add', 'COMMITS.md'], { cwd: repoRoot, stdio: 'pipe' });

      // 3. Make real git commit using spawnSync
      spawnSync('git', ['commit', '-m', commitMessage, `--author=${authorStr}`, '--allow-empty'], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // 4. Retrieve real git commit hashes
      try {
        shortHash = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
        fullHash = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
      } catch {
        shortHash = Math.random().toString(36).substring(2, 9);
        fullHash = shortHash;
      }

      // 5. Push to GitHub origin
      const pushRes = spawnSync('git', ['push', 'origin', `HEAD:${targetBranch}`], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 45000
      });

      if (pushRes.status === 0) {
        pushSuccess = true;
        console.log(`✓ Real Git commit #${shortHash} pushed successfully to GitHub origin on branch '${targetBranch}'!`);
      } else {
        const errOut = (pushRes.stderr || pushRes.stdout || 'Git push failed').trim();
        if (token && originUrl.includes('github.com')) {
          const authedUrl = originUrl.replace(/https:\/\/(.*@)?github\.com\//, `https://${token}@github.com/`);
          const tokenPushRes = spawnSync('git', ['push', authedUrl, `HEAD:${targetBranch}`], {
            cwd: repoRoot,
            encoding: 'utf8',
            stdio: 'pipe',
            timeout: 45000
          });
          if (tokenPushRes.status === 0) {
            pushSuccess = true;
            console.log(`✓ Real Git commit #${shortHash} pushed with token to GitHub origin on branch '${targetBranch}'!`);
          } else {
            pushError = (tokenPushRes.stderr || tokenPushRes.stdout || 'Token push failed').trim();
          }
        } else {
          pushError = errOut;
        }
      }
    } else {
      // Pushing to a different connected project repo (e.g. locrep)
      console.log(`📡 Pushing commit directly to project-connected repository: ${targetGitUrl} on branch '${targetBranch}'...`);
      const repoSlug = targetClean.split('/').pop() || 'connected-repo';

      let fetchSuccess = false;
      try {
        const fetchRes = spawnSync(
          'git',
          ['fetch', targetGitUrl, `${targetBranch}:refs/remotes/${repoSlug}/${targetBranch}`],
          { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe', timeout: 30000 }
        );
        fetchSuccess = (fetchRes.status === 0);
      } catch {}

      if (fetchSuccess) {
        try {
          const treeSha = execSync(`git rev-parse "refs/remotes/${repoSlug}/${targetBranch}^{tree}"`, { cwd: repoRoot, encoding: 'utf8' }).trim();
          const treeCommitRes = spawnSync(
            'git',
            ['commit-tree', treeSha, '-p', `refs/remotes/${repoSlug}/${targetBranch}`, '-m', commitMessage],
            {
              cwd: repoRoot,
              encoding: 'utf8',
              stdio: 'pipe',
              env: {
                ...process.env,
                GIT_AUTHOR_NAME: authorClean,
                GIT_AUTHOR_EMAIL: 'developer@sprintstack.local',
                GIT_COMMITTER_NAME: authorClean,
                GIT_COMMITTER_EMAIL: 'developer@sprintstack.local'
              }
            }
          );

          if (treeCommitRes.status !== 0) {
            throw new Error(treeCommitRes.stderr || 'commit-tree failed');
          }

          const commitSha = (treeCommitRes.stdout || '').trim();
          fullHash = commitSha;
          shortHash = commitSha.substring(0, 7);

          const pushRes = spawnSync(
            'git',
            ['push', targetGitUrl, `${commitSha}:refs/heads/${targetBranch}`],
            { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe', timeout: 45000 }
          );
          if (pushRes.status === 0) {
            pushSuccess = true;
            console.log(`✓ Real Git commit #${shortHash} pushed successfully to connected repo ${targetClean} on branch '${targetBranch}'!`);
          } else {
            pushError = (pushRes.stderr || pushRes.stdout || 'Failed to push to connected repo').trim();
            console.error(`Push to connected repo failed:`, pushError);
          }
        } catch (treeErr) {
          console.error('Error creating tree commit for connected repo:', treeErr);
          pushError = treeErr.message;
        }
      } else {
        const pushRes = spawnSync(
          'git',
          ['push', targetGitUrl, `HEAD:refs/heads/${targetBranch}`],
          { cwd: repoRoot, encoding: 'utf8', stdio: 'pipe', timeout: 45000 }
        );
        if (pushRes.status === 0) {
          pushSuccess = true;
          try {
            shortHash = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
            fullHash = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
          } catch {
            shortHash = Math.random().toString(36).substring(2, 9);
            fullHash = shortHash;
          }
        } else {
          pushError = (pushRes.stderr || pushRes.stdout || 'Failed to push to connected repo').trim();
        }
      }
    }

    const commitUrl = targetClean && fullHash ? `${targetClean}/commit/${fullHash}` : '';

    return {
      commitHash: shortHash,
      fullHash,
      pushSuccess,
      pushError,
      repoUrl: targetClean,
      commitUrl
    };
  } catch (err) {
    console.error('executeRealGitCommitAndPush error:', err);
    return {
      commitHash: Math.random().toString(36).substring(2, 9),
      fullHash: '',
      pushSuccess: false,
      pushError: err.message,
      repoUrl: repoUrl || '',
      commitUrl: ''
    };
  }
}

// Extract Task IDs from commit message (e.g. TASK-101, task 102, #103)
function extractTaskIds(message) {
  if (!message || typeof message !== 'string') return [];
  const regex = /(?:TASK|task|#)[ -]?(\d+)/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(message)) !== null) {
    matches.push(`TASK-${match[1]}`);
  }
  return [...new Set(matches)];
}

// Automatically match tasks and update them directly to Done
async function completeTasksViaCommit({ commitMessage, commitHash, author, repoUrl = '', commitUrl = '' }) {
  const matchedTaskIds = extractTaskIds(commitMessage);
  const updatedTasks = [];

  if (matchedTaskIds.length > 0) {
    for (const tid of matchedTaskIds) {
      if (!useLocalStore) {
        const tasks = await Task.find({ taskId: tid, status: { $ne: 'Done' } });
        for (const task of tasks) {
          task.status = 'Done';
          task.commitInfo = {
            commitHash,
            commitMessage,
            author: author || 'developer',
            committedAt: new Date(),
            repoUrl,
            commitUrl
          };
          await task.save();
          updatedTasks.push(task.toJSON());
        }
      } else {
        await updateLocalStore((state) => {
          const matching = state.tasks.filter((t) => t.taskId === tid && t.status !== 'Done');
          for (const task of matching) {
            task.status = 'Done';
            task.commitInfo = {
              commitHash,
              commitMessage,
              author: author || 'developer',
              committedAt: new Date().toISOString(),
              repoUrl,
              commitUrl
            };
            task.updatedAt = new Date().toISOString();
            updatedTasks.push(task);
          }
        });
      }
    }
  } else {
    // Fuzzy matching by active task title
    const allTasks = await listTasks();
    const activeTasks = allTasks.filter((t) => t.status !== 'Done');
    for (const t of activeTasks) {
      if (t.title && commitMessage.toLowerCase().includes(t.title.toLowerCase().trim())) {
        const idToUpdate = t.id || t._id;
        const updated = await updateTask(idToUpdate, {
          status: 'Done',
          commitInfo: {
            commitHash,
            commitMessage,
            author: author || 'developer',
            committedAt: new Date().toISOString(),
            repoUrl,
            commitUrl
          }
        });
        if (updated) updatedTasks.push(updated);
      }
    }
  }

  return updatedTasks;
}

// Git Commit Handler (Direct from web UI)
async function handleCommitRequest(req, res) {
  try {
    const { commitMessage, author, branch, repoUrl } = req.body;
    if (!commitMessage || !commitMessage.trim()) {
      return res.status(400).json({ message: 'Commit message is required' });
    }

    const realResult = await executeRealGitCommitAndPush({
      commitMessage: commitMessage.trim(),
      author: author || req.user?.username || 'developer',
      branch: branch || 'main',
      repoUrl: repoUrl || ''
    });

    const updatedTasks = await completeTasksViaCommit({
      commitMessage: commitMessage.trim(),
      commitHash: realResult.commitHash,
      author: author || req.user?.username || 'developer',
      repoUrl: realResult.repoUrl,
      commitUrl: realResult.commitUrl
    });

    const statusMsg = realResult.pushSuccess
      ? `✓ Commit #${realResult.commitHash} pushed to GitHub! ${updatedTasks.length} task(s) completed.`
      : realResult.pushError
        ? `Commit #${realResult.commitHash} created locally, but GitHub push error: ${realResult.pushError}`
        : `Commit #${realResult.commitHash} processed! ${updatedTasks.length} task(s) completed.`;

    res.json({
      success: true,
      message: statusMsg,
      updatedTasks,
      ...realResult
    });
  } catch (error) {
    console.error('Commit processing error:', error);
    res.status(500).json({ message: 'Server error processing commit' });
  }
}

// GitHub REST API Sync Engine (Zero-Configuration Colleague & Remote Commits Sync)
async function syncGitHubRepoCommits(repoInput) {
  try {
    const defaultOwner = getDefaultGitOwner(findGitRepoRoot(__dirname));
    const repoClean = normalizeGitHubRepo(repoInput || '', defaultOwner);
    const match = repoClean.match(/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match) return { synced: 0 };

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const token = (process.env.GIT_TOKEN || process.env.GITHUB_TOKEN || '').trim();
    const headers = {
      'User-Agent': 'SprintStack-App',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token && token.length > 20) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=15`;
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) return { synced: 0, status: response.status };

    const commits = await response.json();
    if (!Array.isArray(commits)) return { synced: 0 };

    let totalUpdated = 0;
    for (const c of commits) {
      const commitMsg = c.commit?.message || '';
      const commitHash = c.sha ? c.sha.substring(0, 7) : '';
      const author = c.commit?.author?.name || c.author?.login || 'Colleague';
      const commitUrl = c.html_url || `${repoClean}/commit/${c.sha}`;

      const updated = await completeTasksViaCommit({
        commitMessage: commitMsg,
        commitHash,
        author,
        repoUrl: repoClean,
        commitUrl
      });
      totalUpdated += updated.length;
    }
    return { synced: totalUpdated, repo: `${owner}/${repo}` };
  } catch (err) {
    return { synced: 0, error: err.message };
  }
}

app.post('/api/sync-github', requireAuth, async (req, res) => {
  const { repoUrl } = req.body;
  const result = await syncGitHubRepoCommits(repoUrl);
  res.json({ success: true, ...result });
});

app.post('/api/commit', requireAuth, handleCommitRequest);
app.post('/api/projects/:projectId/commit', requireAuth, handleCommitRequest);

// Local Git Hook Webhook (Invoked automatically by .git/hooks/post-commit on user's machine)
app.post('/api/webhook/git', async (req, res) => {
  try {
    const { commitMessage, commitHash, author } = req.body;
    if (!commitMessage) {
      return res.status(400).json({ message: 'commitMessage required' });
    }

    const repoRoot = findGitRepoRoot(__dirname);
    let originUrl = '';
    try {
      originUrl = execSync('git remote get-url origin', { cwd: repoRoot, encoding: 'utf8' }).trim();
    } catch { }
    const cleanRepo = originUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
    const commitUrl = cleanRepo && commitHash ? `${cleanRepo}/commit/${commitHash}` : '';

    const updatedTasks = await completeTasksViaCommit({
      commitMessage,
      commitHash: commitHash || 'local',
      author: author || 'developer',
      repoUrl: cleanRepo,
      commitUrl
    });

    console.log(`✓ Webhook: Processed local Git commit "${commitMessage}". Moved ${updatedTasks.length} task(s) to Done.`);
    res.json({ success: true, updatedTasks, count: updatedTasks.length });
  } catch (err) {
    console.error('Git webhook error:', err);
    res.status(500).json({ message: 'Error processing git webhook' });
  }
});

// GitHub Webhook Receiver (Invoked when commits are pushed to GitHub)
app.post('/api/webhook/github', async (req, res) => {
  try {
    const payload = req.body;
    const commits = payload.commits || (payload.head_commit ? [payload.head_commit] : []);
    const results = [];

    for (const commit of commits) {
      const updated = await completeTasksViaCommit({
        commitMessage: commit.message,
        commitHash: commit.id ? commit.id.substring(0, 7) : 'github',
        author: commit.author?.name || commit.author?.username || 'GitHub Committer',
        repoUrl: payload.repository?.html_url || '',
        commitUrl: commit.url || ''
      });
      results.push(...updated);
    }

    console.log(`✓ GitHub Webhook: Received ${commits.length} commit(s). Moved ${results.length} task(s) to Done.`);
    res.json({ success: true, processedCommits: commits.length, updatedTasks: results });
  } catch (err) {
    console.error('GitHub webhook error:', err);
    res.status(500).json({ message: 'Error processing GitHub webhook' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sprintstack', { serverSelectionTimeoutMS: 2500 });
    console.log('Connected to MongoDB');
  } catch (error) {
    useLocalStore = true;
    console.warn(`MongoDB unavailable (${error.message}). Using persistent local development data at ${localFile}`);
  }
  app.listen(PORT, () => console.log(`SprintStack REST API listening on http://localhost:${PORT}`));
}
start();
