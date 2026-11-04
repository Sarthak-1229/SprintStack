const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["To Do", "In Progress", "Done"],
      default: "To Do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    category: {
      type: String,
      enum: ["Feature", "Bug", "Design", "Research", "Enhancement"],
      default: "Feature",
    },
    attachment: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    assignee: {
      type: String,
      default: null,
    },
    createdBy: {
      type: String,
      default: null,
    },
    commitInfo: {
      commitHash: { type: String, default: null },
      commitMessage: { type: String, default: null },
      author: { type: String, default: null },
      committedAt: { type: Date, default: null },
      repoUrl: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

taskSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model("Task", taskSchema);
