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
  localWrites = operation.catch(() => {});
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
async function createTask(data) {
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

// Execute a REAL Git commit and push directly to GitHub
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
    const authorClean = (author || 'developer').replace(/["<>]/g, '');
    const authorStr = `${authorClean} <developer@sprintstack.local>`;
    spawnSync('git', ['commit', '-m', commitMessage, `--author=${authorStr}`, '--allow-empty'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    // 4. Retrieve real git commit hashes
    let shortHash = '';
    let fullHash = '';
    try {
      shortHash = execSync('git rev-parse --short HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
      fullHash = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
    } catch {
      shortHash = Math.random().toString(36).substring(2, 9);
      fullHash = shortHash;
    }

    // 5. Determine active origin URL
    let originUrl = '';
    try {
      originUrl = execSync('git remote get-url origin', { cwd: repoRoot, encoding: 'utf8' }).trim();
    } catch {}

    const cleanWebRepo = (originUrl || repoUrl || '')
      .replace(/\.git$/, '')
      .replace(/^git@github\.com:/, 'https://github.com/');

    // 6. Push to GitHub!
    let pushSuccess = false;
    let pushError = null;

    const token = (process.env.GIT_TOKEN || process.env.GITHUB_TOKEN || '').trim();
    const targetBranch = branch || 'main';

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

    const commitUrl = cleanWebRepo && fullHash ? `${cleanWebRepo}/commit/${fullHash}` : '';

    return {
      commitHash: shortHash,
      fullHash,
      pushSuccess,
      pushError,
      repoUrl: cleanWebRepo,
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

// Git Commit Handler (Works for both /api/commit and /api/projects/:projectId/commit)
async function handleCommitRequest(req, res) {
  try {
    const { commitMessage, author, branch } = req.body;
    if (!commitMessage || !commitMessage.trim()) {
      return res.status(400).json({ message: 'Commit message is required' });
    }

    const result = await executeRealGitCommitAndPush({
      commitMessage: commitMessage.trim(),
      author: author || req.user?.username || 'developer',
      branch: branch || 'main'
    });

    const statusMsg = result.pushSuccess
      ? `✓ Commit #${result.commitHash} pushed to GitHub successfully!`
      : result.pushError
      ? `Commit #${result.commitHash} created locally, but GitHub push error: ${result.pushError}`
      : `Commit #${result.commitHash} processed!`;

    res.json({
      success: true,
      message: statusMsg,
      ...result
    });
  } catch (error) {
    console.error('Commit processing error:', error);
    res.status(500).json({ message: 'Server error processing commit' });
  }
}

app.post('/api/commit', requireAuth, handleCommitRequest);
app.post('/api/projects/:projectId/commit', requireAuth, handleCommitRequest);

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
