const mongoose = require("mongoose");

const teamTaskAssignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
});

const teamTaskSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "Chung",
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Team",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    assignments: [teamTaskAssignmentSchema],
    isImportant: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Check if all assignments are completed
teamTaskSchema.methods.checkCompletion = function () {
  if (this.assignments.length === 0) return false;
  const allCompleted = this.assignments.every(
    (assignment) => assignment.completed
  );
  if (allCompleted && this.status !== "completed") {
    this.status = "completed";
  }
  return allCompleted;
};

const TeamTask = mongoose.model("TeamTask", teamTaskSchema);

module.exports = TeamTask;
