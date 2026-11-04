require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const Task = require("./models/Task");
const User = require("./models/User");
const Project = require("./models/Project");
const CommitLog = require("./models/CommitLog");

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json({ limit: "10mb" }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || "*" },
});

const JWT_SECRET = process.env.JWT_SECRET || "sprintstack_super_secret_jwt_key_2026";

// Auth Middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Generate 6-character unique Project Code (e.g., PRJ-84K2)
function generateProjectCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PRJ-${randomPart}`;
}

// Extract Task IDs from commit message (e.g. TASK-101, task 102, [TASK-103])
function extractTaskIds(message) {
  if (!message || typeof message !== "string") return [];
  const regex = /(?:TASK|task)[ -]?(\d+)/gi;
  const matches = [];
  let match;
  while ((match = regex.exec(message)) !== null) {
    matches.push(`TASK-${match[1]}`);
  }
  return [...new Set(matches)];
}

// ========================
// AUTH & PROFILE ROUTES
// ========================

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role = "member",
      fullName = "",
      userType = "student",
      institutionOrCompany = "",
      branchOrDepartment = "",
      yearOrExperience = "",
      bio = "",
      githubUsername = "",
      skills = []
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }

    const existing = await User.findOne({ 
      $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] 
    });
    if (existing) {
      return res.status(400).json({ message: "Username or email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === "admin" ? "admin" : "member";

    const user = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: userRole,
      fullName,
      userType,
      institutionOrCompany,
      branchOrDepartment,
      yearOrExperience,
      bio,
      githubUsername,
      skills: Array.isArray(skills) ? skills : []
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        userType: user.userType,
        institutionOrCompany: user.institutionOrCompany,
        branchOrDepartment: user.branchOrDepartment,
        yearOrExperience: user.yearOrExperience,
        bio: user.bio,
        githubUsername: user.githubUsername,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ message: "Identifier and password required" });
    }

    const user = await User.findOne({
      $or: [
        { username: identifier.trim() }, 
        { email: identifier.trim().toLowerCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        userType: user.userType,
        institutionOrCompany: user.institutionOrCompany,
        branchOrDepartment: user.branchOrDepartment,
        yearOrExperience: user.yearOrExperience,
        bio: user.bio,
        githubUsername: user.githubUsername,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Get Current Profile
app.get("/api/profile", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch user stats
    const assignedTasks = await Task.find({ assignee: user.username });
    const completedTasks = assignedTasks.filter((t) => t.status === "Done");
    const inProgressTasks = assignedTasks.filter((t) => t.status === "In Progress");

    res.json({
      ...user.toJSON(),
      stats: {
        totalAssigned: assignedTasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length
      }
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ message: "Server error loading profile" });
  }
});

// Update Profile
app.put("/api/profile", requireAuth, async (req, res) => {
  try {
    const {
      fullName,
      userType,
      institutionOrCompany,
      branchOrDepartment,
      yearOrExperience,
      bio,
      githubUsername,
      skills
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName !== undefined) user.fullName = fullName;
    if (userType !== undefined) user.userType = userType;
    if (institutionOrCompany !== undefined) user.institutionOrCompany = institutionOrCompany;
    if (branchOrDepartment !== undefined) user.branchOrDepartment = branchOrDepartment;
    if (yearOrExperience !== undefined) user.yearOrExperience = yearOrExperience;
    if (bio !== undefined) user.bio = bio;
    if (githubUsername !== undefined) user.githubUsername = githubUsername;
    if (skills !== undefined) user.skills = Array.isArray(skills) ? skills : [];

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        userType: user.userType,
        institutionOrCompany: user.institutionOrCompany,
        branchOrDepartment: user.branchOrDepartment,
        yearOrExperience: user.yearOrExperience,
        bio: user.bio,
        githubUsername: user.githubUsername,
        skills: user.skills
      }
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error updating profile" });
  }
});

// Get Users List (for task assignment)
app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const users = await User.find({}, "username email role fullName userType");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching users" });
  }
});

// ========================
// PROJECT ROUTES
// ========================

// List Projects for current user
app.get("/api/projects", requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { "members.username": req.user.username },
        { ownerUsername: req.user.username }
      ]
    }).sort({ createdAt: -1 });

    // Populate task counts for each project
    const projectList = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const doneTasks = await Task.countDocuments({ projectId: p._id, status: "Done" });
        return {
          ...p.toJSON(),
          totalTasks,
          doneTasks
        };
      })
    );

    res.json(projectList);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error loading projects" });
  }
});

// Create Project (Admin or Team Member)
app.post("/api/projects", requireAuth, async (req, res) => {
  try {
    const { name, description = "", githubRepo = "" } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    // Ensure unique project code
    let code = generateProjectCode();
    let exists = await Project.findOne({ code });
    while (exists) {
      code = generateProjectCode();
      exists = await Project.findOne({ code });
    }

    const project = new Project({
      name: name.trim(),
      description: description.trim(),
      code,
      owner: req.user.id,
      ownerUsername: req.user.username,
      githubRepo: githubRepo.trim(),
      taskCounter: 100,
      members: [
        {
          user: req.user.id,
          username: req.user.username,
          role: req.user.role || "admin",
          joinedAt: new Date()
        }
      ]
    });

    await project.save();
    res.status(201).json(project.toJSON());
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Server error creating project" });
  }
});

// Join Project by Code
app.post("/api/projects/join", requireAuth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Project code is required" });
    }

    const formattedCode = code.trim().toUpperCase();
    const project = await Project.findOne({ code: formattedCode });
    if (!project) {
      return res.status(404).json({ message: `Project with code "${formattedCode}" not found` });
    }

    const alreadyMember = project.members.some(
      (m) => m.username === req.user.username || m.user.toString() === req.user.id
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "You are already a member of this project", project });
    }

    project.members.push({
      user: req.user.id,
      username: req.user.username,
      role: req.user.role || "member",
      joinedAt: new Date()
    });

    await project.save();

    // Broadcast member joined
    io.to(`project:${project._id.toString()}`).emit("project:member_joined", {
      projectId: project._id.toString(),
      username: req.user.username,
      role: req.user.role
    });

    res.json({ message: `Joined ${project.name} successfully!`, project: project.toJSON() });
  } catch (error) {
    console.error("Join project error:", error);
    res.status(500).json({ message: "Server error joining project" });
  }
});

// Get Project Details
app.get("/api/projects/:id", requireAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project.toJSON());
  } catch (error) {
    res.status(500).json({ message: "Server error loading project details" });
  }
});

// ========================
// TASK ROUTES
// ========================

// Get Tasks for a project
app.get("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId }).sort({ createdAt: 1 });
    res.json(tasks.map((t) => t.toJSON()));
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Server error loading tasks" });
  }
});

// Create Task (Admin only)
app.post("/api/projects/:projectId/tasks", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Validate creator authorization (Admin role or project owner)
    const isOwner = project.ownerUsername === req.user.username;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Only Admins can create and assign tasks" });
    }

    const {
      title,
      description = "",
      priority = "Low",
      category = "Feature",
      attachment = null,
      attachmentName = null,
      dueDate = null,
      assignee = null
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    project.taskCounter += 1;
    await project.save();

    const taskId = `TASK-${project.taskCounter}`;

    const newTask = new Task({
      projectId: project._id,
      taskId,
      title: title.trim(),
      description: description.trim(),
      status: "To Do",
      priority,
      category,
      attachment,
      attachmentName,
      dueDate: dueDate || null,
      assignee: assignee || null,
      createdBy: req.user.username
    });

    await newTask.save();
    const taskObj = newTask.toJSON();

    io.to(`project:${projectId}`).emit("task:created", taskObj);

    res.status(201).json(taskObj);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ message: "Server error creating task" });
  }
});

// Update Task
app.put("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const {
      title,
      description,
      priority,
      category,
      attachment,
      attachmentName,
      dueDate,
      assignee
    } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (attachment !== undefined) task.attachment = attachment;
    if (attachmentName !== undefined) task.attachmentName = attachmentName;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assignee !== undefined) task.assignee = assignee;

    await task.save();
    const updated = task.toJSON();

    io.to(`project:${task.projectId.toString()}`).emit("task:updated", updated);
    res.json(updated);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error updating task" });
  }
});

// Move Task Status (STRICT RULE: "Done" cannot be moved manually!)
app.patch("/api/tasks/:id/move", requireAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    // CRITICAL REQUIREMENT CHECK:
    // "Done" can ONLY be completed via a Git commit containing the Task ID!
    if (status === "Done") {
      return res.status(403).json({
        message:
          `⛔ [${task.taskId}] cannot be manually dragged to 'Done'. Tasks can only be completed automatically via a Git commit containing the task ID (e.g., git commit -m "${task.taskId}: finished task")`
      });
    }

    if (!["To Do", "In Progress"].includes(status)) {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    task.status = status;
    await task.save();

    const updated = task.toJSON();
    io.to(`project:${task.projectId.toString()}`).emit("task:moved", updated);
    res.json(updated);
  } catch (error) {
    console.error("Move task error:", error);
    res.status(500).json({ message: "Server error moving task" });
  }
});

// Delete Task (Admin or Project Owner)
app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.projectId);
    const isOwner = project && project.ownerUsername === req.user.username;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Only Admins can delete tasks." });
    }

    const projectId = task.projectId.toString();
    const taskId = task._id.toString();
    await Task.findByIdAndDelete(task._id);

    io.to(`project:${projectId}`).emit("task:deleted", taskId);
    res.json({ message: "Task deleted successfully", id: taskId });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ message: "Server error deleting task" });
  }
});

// ========================
// GIT & GITHUB WEBHOOK / SIMULATOR
// ========================

// Reusable commit processing logic
async function processCommit({ projectId, commitHash, commitMessage, author, branch = "main", repoUrl = "", source = "simulator" }) {
  const matchedTaskIds = extractTaskIds(commitMessage);
  const updatedTasks = [];

  const shortHash = commitHash || crypto.randomBytes(4).toString("hex");

  for (const tid of matchedTaskIds) {
    // Find task in this project (or across projects if webhook)
    const query = { taskId: tid };
    if (projectId) query.projectId = projectId;

    const task = await Task.findOne(query);
    if (task) {
      task.status = "Done";
      task.commitInfo = {
        commitHash: shortHash,
        commitMessage,
        author: author || "Developer",
        committedAt: new Date(),
        repoUrl: repoUrl || ""
      };
      await task.save();

      const taskObj = task.toJSON();
      updatedTasks.push(taskObj);

      // Emit real-time event to project room
      io.to(`project:${task.projectId.toString()}`).emit("task:updated", taskObj);
      io.to(`project:${task.projectId.toString()}`).emit("task:completed_by_commit", {
        task: taskObj,
        commitHash: shortHash,
        commitMessage,
        author
      });
    }
  }

  // Create commit log entry
  let commitLogDoc = null;
  if (projectId) {
    commitLogDoc = new CommitLog({
      projectId,
      commitHash: shortHash,
      commitMessage,
      author: author || "Developer",
      matchedTasks: matchedTaskIds,
      repoUrl,
      branch,
      source
    });
    await commitLogDoc.save();

    io.to(`project:${projectId}`).emit("git:new_commit", commitLogDoc.toJSON());
  }

  return {
    matchedTaskIds,
    updatedTasks,
    commitLog: commitLogDoc ? commitLogDoc.toJSON() : null
  };
}

// Interactive Git Commit Simulator / Dispatcher (Direct API)
app.post("/api/projects/:projectId/commit", requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { commitMessage, commitHash, author, branch } = req.body;

    if (!commitMessage || !commitMessage.trim()) {
      return res.status(400).json({ message: "Commit message is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    const result = await processCommit({
      projectId,
      commitHash: commitHash || crypto.randomBytes(4).toString("hex"),
      commitMessage: commitMessage.trim(),
      author: author || req.user.username,
      branch: branch || "main",
      repoUrl: project.githubRepo,
      source: "simulator"
    });

    res.json({
      success: true,
      message: `Commit processed! ${result.matchedTaskIds.length} task(s) linked.`,
      ...result
    });
  } catch (error) {
    console.error("Commit processing error:", error);
    res.status(500).json({ message: "Server error processing commit" });
  }
});

// Official GitHub Webhook receiver (for live GitHub integration)
app.post("/api/projects/:projectId/webhook", async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // GitHub sends array of commits in `req.body.commits` on push
    const commits = payload.commits || [];
    const results = [];

    if (commits.length === 0 && payload.head_commit) {
      commits.push(payload.head_commit);
    }

    for (const commit of commits) {
      const resComm = await processCommit({
        projectId,
        commitHash: commit.id ? commit.id.substring(0, 7) : crypto.randomBytes(4).toString("hex"),
        commitMessage: commit.message,
        author: commit.author?.name || commit.author?.username || "GitHub Committer",
        branch: payload.ref ? payload.ref.replace("refs/heads/", "") : "main",
        repoUrl: payload.repository?.html_url || project.githubRepo,
        source: "webhook"
      });
      results.push(resComm);
    }

    res.json({ success: true, processedCommits: results.length, details: results });
  } catch (error) {
    console.error("GitHub webhook error:", error);
    res.status(500).json({ message: "Server error processing webhook" });
  }
});

// Get Commit Logs for a project
app.get("/api/projects/:projectId/commits", requireAuth, async (req, res) => {
  try {
    const commits = await CommitLog.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(commits.map((c) => c.toJSON()));
  } catch (error) {
    res.status(500).json({ message: "Server error fetching commit history" });
  }
});

// ========================
// SOCKET.IO REALTIME ROOMS
// ========================

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication required"));
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Invalid token"));
    socket.user = decoded;
    next();
  });
});

io.on("connection", (socket) => {
  // Join a specific project room
  socket.on("join:project", async (projectId) => {
    if (!projectId) return;
    const roomName = `project:${projectId}`;
    socket.join(roomName);

    try {
      const tasks = await Task.find({ projectId }).sort({ createdAt: 1 });
      socket.emit("sync:tasks", tasks.map((t) => t.toJSON()));
    } catch (err) {
      console.error("Error syncing tasks on join:", err);
    }
  });

  // Leave project room
  socket.on("leave:project", (projectId) => {
    if (projectId) {
      socket.leave(`project:${projectId}`);
    }
  });

  // Real-time task movement via socket with commit-gate enforcement
  socket.on("task:move", async ({ id, status, projectId }) => {
    try {
      if (status === "Done") {
        return socket.emit("error:rule", {
          message: "⛔ Done status is commit-gated! You must push a Git commit with the Task ID to complete this task."
        });
      }

      const updatedDoc = await Task.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      if (updatedDoc) {
        const payload = updatedDoc.toJSON();
        io.to(`project:${projectId}`).emit("task:moved", payload);
      }
    } catch (error) {
      console.error("Socket task:move error:", error);
    }
  });

  socket.on("disconnect", () => {
    // disconnected
  });
});

// ========================
// DATABASE CONNECTION & SEEDING
// ========================

async function initializeDatabase() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kanban_board";

  try {
    // Attempt connecting to specified or local MongoDB with a short timeout
    await mongoose.connect(MONGODB_URI, {
      dbName: "kanban",
      serverSelectionTimeoutMS: 2000,
    });
    console.log("✓ Connected to MongoDB at", MONGODB_URI);
  } catch (err) {
    console.warn("⚠️ Local/External MongoDB not accessible:", err.message);
    console.log("🔄 Starting MongoDB Memory Server for seamless in-memory execution...");
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const inMemoryUri = mongod.getUri();
      await mongoose.connect(inMemoryUri, { dbName: "kanban" });
      console.log("✓ Connected to MongoDB In-Memory Server:", inMemoryUri);
    } catch (memErr) {
      console.error("❌ Failed to initialize MongoDB Memory Server:", memErr);
    }
  }

  await seedInitialData();
}

async function seedInitialData() {
  try {
    // 1. Seed Admin
    let admin = await User.findOne({ username: "sarthak" });
    if (!admin) {
      const hashedPassword = await bcrypt.hash("sarthak_1204", 10);
      admin = await new User({
        username: "sarthak",
        email: "sarthak@admin.com",
        password: hashedPassword,
        role: "admin",
        fullName: "Sarthak (Lead Admin)",
        userType: "student",
        institutionOrCompany: "Engineering University",
        branchOrDepartment: "Computer Technology",
        yearOrExperience: "Final Year (TY)",
        bio: "Project Lead & Full Stack Architect",
        githubUsername: "sarthak-dev",
        skills: ["React", "NodeJS", "Express", "MongoDB", "Git", "Docker"]
      }).save();
      console.log("✓ Admin user seeded (sarthak / sarthak_1204)");
    } else {
      admin.role = "admin";
      await admin.save();
    }

    // 2. Seed Team Member
    let member = await User.findOne({ username: "alex_dev" });
    if (!member) {
      const hashedMemberPwd = await bcrypt.hash("password123", 10);
      member = await new User({
        username: "alex_dev",
        email: "alex@team.com",
        password: hashedMemberPwd,
        role: "member",
        fullName: "Alex Rivera",
        userType: "student",
        institutionOrCompany: "Engineering University",
        branchOrDepartment: "Information Technology",
        yearOrExperience: "TY (Third Year)",
        bio: "Frontend Specialist & React Enthusiast",
        githubUsername: "alex-dev-code",
        skills: ["React", "CSS", "UI/UX", "JavaScript"]
      }).save();
      console.log("✓ Team member user seeded (alex_dev / password123)");
    }

    // 3. Seed Default Project
    let project = await Project.findOne({ code: "PRJ-9042" });
    if (!project) {
      project = new Project({
        name: "SprintStack Core System",
        description: "Next-gen git-automated developer task management platform.",
        code: "PRJ-9042",
        owner: admin._id,
        ownerUsername: admin.username,
        githubRepo: "https://github.com/SprintStack/core-engine",
        taskCounter: 102,
        members: [
          {
            user: admin._id,
            username: admin.username,
            role: "admin",
            joinedAt: new Date()
          },
          {
            user: member._id,
            username: member.username,
            role: "member",
            joinedAt: new Date()
          }
        ]
      });
      await project.save();
      console.log("✓ Default Project seeded: 'SprintStack Core System' [Code: PRJ-9042]");

      // Seed initial tasks
      await new Task({
        projectId: project._id,
        taskId: "TASK-101",
        title: "Implement GitHub commit parser webhook",
        description: "Parse incoming git commit messages and auto-advance matching tasks to Done.",
        status: "Done",
        priority: "High",
        category: "Feature",
        assignee: "alex_dev",
        createdBy: "sarthak",
        commitInfo: {
          commitHash: "8a4f91c",
          commitMessage: "TASK-101: added commit parser regex and webhook endpoint",
          author: "alex_dev",
          committedAt: new Date()
        }
      }).save();

      await new Task({
        projectId: project._id,
        taskId: "TASK-102",
        title: "Build Neo-brutalist Multi-Project Hub",
        description: "Design project creation, unique code sharing, and session switcher in Bauhaus aesthetic.",
        status: "In Progress",
        priority: "Medium",
        category: "Design",
        assignee: "alex_dev",
        createdBy: "sarthak"
      }).save();

      console.log("✓ Initial tasks seeded: TASK-101 (Done via commit), TASK-102 (In Progress)");
    }
  } catch (seedErr) {
    console.error("Seed error:", seedErr);
  }
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`========================================`);
  console.log(`🚀 SprintStack Backend running on port ${PORT}`);
  console.log(`========================================`);
  await initializeDatabase();
});
