require("dotenv").config();
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  console.warn("Failed to set DNS servers:", e);
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Task = require("./models/Task");
const User = require("./models/User");

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// ─── Validation Helpers ─────────────────────────────────────────────────────

const VALID_STATUSES = ["To Do", "In Progress", "Done"];
const VALID_PRIORITIES = ["Low", "Medium", "High"];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// ─── Auth Routes ────────────────────────────────────────────────────────────

app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required" });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters" });
    }
    if (!email.includes("@")) {
      return res.status(400).json({ message: "Email must be a valid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.status(400).json({ message: "Username or email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Identifier is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const user = await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Task REST Routes ────────────────────────────────────────────────────────

// GET /api/tasks — list all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find({});
    res.json(tasks.map(t => t.toObject()));
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/tasks — create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status, priority, category, assignee, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be one of: To Do, In Progress, Done" });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: "Priority must be one of: Low, Medium, High" });
    }

    const newTask = new Task({
      title: title.trim(),
      description: description || "",
      status: status || "To Do",
      priority: priority || "Low",
      category: category || "Feature",
      assignee: assignee || null,
      dueDate: dueDate || null,
    });
    await newTask.save();
    res.status(201).json(newTask.toObject());
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/tasks/:id — update a task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const { title, description, status, priority, category, assignee, dueDate } = req.body;

    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ message: "Task title cannot be empty" });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Status must be one of: To Do, In Progress, Done" });
    }
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: "Priority must be one of: Low, Medium, High" });
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(category !== undefined && { category }),
        ...(assignee !== undefined && { assignee }),
        ...(dueDate !== undefined && { dueDate }),
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(updated.toObject());
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/tasks/:id — delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid task ID format" });
    }

    const deleted = await Task.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── Admin Seeder ───────────────────────────────────────────────────────────

const seedAdmin = async () => {
  try {
    const admin = await User.findOne({ username: "sarthak" });
    if (!admin) {
      const hashedPassword = await bcrypt.hash("sarthak_1204", 10);
      await new User({ username: "sarthak", email: "sarthak@admin.com", password: hashedPassword }).save();
      console.log("Admin user seeded");
    } else if (!admin.email) {
      admin.email = "sarthak@admin.com";
      await admin.save();
      console.log("Admin email updated");
    }
  } catch (err) {
    console.error("Seed error", err);
  }
};

// ─── MongoDB Connection & Server Start ──────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/kanban_board";
mongoose.connect(MONGODB_URI, { dbName: 'kanban' })
  .then(() => {
    console.log("Connected to MongoDB");
    seedAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
