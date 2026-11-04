const mongoose = require("mongoose");

const commitLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    commitHash: { type: String, required: true },
    commitMessage: { type: String, required: true },
    author: { type: String, default: "Anonymous" },
    matchedTasks: [{ type: String }],
    repoUrl: { type: String, default: "" },
    branch: { type: String, default: "main" },
    source: { type: String, enum: ["webhook", "simulator"], default: "simulator" }
  },
  { timestamps: true }
);

commitLogSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
  },
});

module.exports = mongoose.model("CommitLog", commitLogSchema);

