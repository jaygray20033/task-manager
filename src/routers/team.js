const express = require("express");
const Team = require("../models/team");
const TeamTask = require("../models/teamTask");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");

const router = new express.Router();

const upload = multer({
  limits: {
    fileSize: 10000000, // 10MB
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx|txt|zip)$/)) {
      return cb(new Error("Please upload a valid file"));
    }
    cb(undefined, true);
  },
});

// Create a new team
router.post("/teams", auth, async (req, res) => {
  try {
    const team = new Team({
      ...req.body,
      owner: req.user._id,
      members: [
        {
          user: req.user._id,
          role: "owner",
        },
      ],
    });

    team.generateInviteCode();
    await team.save();

    res.status(201).send(team);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

// Get all teams for current user
router.get("/teams", auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "name email")
      .populate("members.user", "name email");

    res.send(teams);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Get team by ID
router.get("/teams/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("owner", "name email")
      .populate("members.user", "name email");

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).send({ error: "Access denied" });
    }

    res.send(team);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Update team
router.patch("/teams/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "description"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isAdmin(req.user._id)) {
      return res.status(403).send({ error: "Only admins can update team" });
    }

    updates.forEach((update) => (team[update] = req.body[update]));
    await team.save();

    res.send(team);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

// Delete team
router.delete("/teams/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: "Only owner can delete team" });
    }

    // Delete all team tasks
    await TeamTask.deleteMany({ team: team._id });

    await team.deleteOne();
    res.send({ message: "Team deleted successfully" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Join team with invite code
router.post("/teams/join/:inviteCode", auth, async (req, res) => {
  try {
    const team = await Team.findOne({ inviteCode: req.params.inviteCode });

    if (!team) {
      return res.status(404).send({ error: "Invalid invite code" });
    }

    if (team.isMember(req.user._id)) {
      return res.status(400).send({ error: "Already a member of this team" });
    }

    team.members.push({
      user: req.user._id,
      role: "member",
    });

    await team.save();
    await team.populate("owner", "name email");
    await team.populate("members.user", "name email");

    res.send(team);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Leave team
router.post("/teams/:id/leave", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (team.owner.toString() === req.user._id.toString()) {
      return res.status(400).send({
        error: "Owner cannot leave team. Transfer ownership or delete team.",
      });
    }

    team.members = team.members.filter(
      (member) => member.user.toString() !== req.user._id.toString()
    );

    await team.save();
    res.send({ message: "Left team successfully" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Remove member from team
router.delete("/teams/:id/members/:userId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isAdmin(req.user._id)) {
      return res.status(403).send({ error: "Only admins can remove members" });
    }

    if (team.owner.toString() === req.params.userId) {
      return res.status(400).send({ error: "Cannot remove team owner" });
    }

    team.members = team.members.filter(
      (member) => member.user.toString() !== req.params.userId
    );

    await team.save();
    res.send({ message: "Member removed successfully" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Create team task
router.post("/teams/:id/tasks", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).send({ error: "Access denied" });
    }

    const teamTask = new TeamTask({
      ...req.body,
      team: team._id,
      createdBy: req.user._id,
    });

    await teamTask.save();
    await teamTask.populate("createdBy", "name email");
    await teamTask.populate("assignments.user", "name email");

    res.status(201).send(teamTask);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

// Get all tasks for a team
router.get("/teams/:id/tasks", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).send({ error: "Access denied" });
    }

    const tasks = await TeamTask.find({ team: team._id })
      .populate("createdBy", "name email")
      .populate("assignments.user", "name email")
      .sort({ createdAt: -1 });

    res.send(tasks);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

// Update team task
router.patch("/teams/:teamId/tasks/:taskId", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "description",
    "category",
    "isImportant",
    "status",
    "assignments",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates" });
  }

  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).send({ error: "Access denied" });
    }

    const task = await TeamTask.findOne({
      _id: req.params.taskId,
      team: team._id,
    });

    if (!task) {
      return res.status(404).send({ error: "Task not found" });
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    task.checkCompletion();
    await task.save();

    await task.populate("createdBy", "name email");
    await task.populate("assignments.user", "name email");

    res.send(task);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
});

// Mark assignment as completed
router.patch(
  "/teams/:teamId/tasks/:taskId/assignments/:assignmentId/complete",
  auth,
  async (req, res) => {
    try {
      const team = await Team.findById(req.params.teamId);

      if (!team) {
        return res.status(404).send({ error: "Team not found" });
      }

      if (!team.isMember(req.user._id)) {
        return res.status(403).send({ error: "Access denied" });
      }

      const task = await TeamTask.findOne({
        _id: req.params.taskId,
        team: team._id,
      });

      if (!task) {
        return res.status(404).send({ error: "Task not found" });
      }

      const assignment = task.assignments.id(req.params.assignmentId);

      if (!assignment) {
        return res.status(404).send({ error: "Assignment not found" });
      }

      // Only the assigned user can mark their assignment as complete
      if (assignment.user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .send({ error: "Can only complete your own assignments" });
      }

      assignment.completed =
        req.body.completed !== undefined ? req.body.completed : true;
      assignment.completedAt = assignment.completed ? new Date() : null;

      task.checkCompletion();
      await task.save();

      await task.populate("createdBy", "name email");
      await task.populate("assignments.user", "name email");

      res.send(task);
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  }
);

// Delete team task
router.delete("/teams/:teamId/tasks/:taskId", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.teamId);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).send({ error: "Access denied" });
    }

    const task = await TeamTask.findOne({
      _id: req.params.taskId,
      team: team._id,
    });

    if (!task) {
      return res.status(404).send({ error: "Task not found" });
    }

    // Only creator or admin can delete
    if (
      task.createdBy.toString() !== req.user._id.toString() &&
      !team.isAdmin(req.user._id)
    ) {
      return res
        .status(403)
        .send({ error: "Only task creator or admin can delete" });
    }

    await task.deleteOne();
    res.send({ message: "Task deleted successfully" });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.post(
  "/teams/:teamId/tasks/:taskId/assignments/:assignmentId/upload",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const team = await Team.findById(req.params.teamId);

      if (!team) {
        return res.status(404).send({ error: "Team not found" });
      }

      if (!team.isMember(req.user._id)) {
        return res.status(403).send({ error: "Access denied" });
      }

      const task = await TeamTask.findOne({
        _id: req.params.taskId,
        team: team._id,
      });

      if (!task) {
        return res.status(404).send({ error: "Task not found" });
      }

      const assignment = task.assignments.id(req.params.assignmentId);

      if (!assignment) {
        return res.status(404).send({ error: "Assignment not found" });
      }

      // Only the assigned user can upload file
      if (assignment.user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .send({ error: "Can only upload file for your own assignments" });
      }

      // Store file as base64
      const fileBuffer = req.file.buffer;
      const fileBase64 = fileBuffer.toString("base64");
      const fileUrl = `data:${req.file.mimetype};base64,${fileBase64}`;

      assignment.fileUrl = fileUrl;
      assignment.fileName = req.file.originalname;

      await task.save();

      await task.populate("createdBy", "name email");
      await task.populate("assignments.user", "name email");

      res.send(task);
    } catch (e) {
      res.status(400).send({ error: e.message });
    }
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

// Add member to team
router.post("/teams/:id/members", auth, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ error: "Email is required" });
    }

    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).send({ error: "Team not found" });
    }

    // Only admin or owner can add members
    if (!team.isAdmin(req.user._id)) {
      return res.status(403).send({ error: "Only admins can add members" });
    }

    // Find user by email
    const userToAdd = await User.findOne({ email: email.toLowerCase().trim() });

    if (!userToAdd) {
      return res.status(404).send({ error: "User not found with this email" });
    }

    // Check if already a member
    if (team.isMember(userToAdd._id)) {
      return res
        .status(400)
        .send({ error: "User is already a member of this team" });
    }

    // Add member
    team.members.push({
      user: userToAdd._id,
      role: "member",
    });

    await team.save();
    await team.populate("owner", "name email");
    await team.populate("members.user", "name email");

    res.send(team);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
