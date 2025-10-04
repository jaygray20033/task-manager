const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const { checkTaskReminders } = require("../jobs/taskReminder");
const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    console.log(
      `[Task Created] User: ${req.user.email}, Task: "${
        task.description
      }", DueDate: ${task.dueDate || "None"}`
    );
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.category && req.query.category !== "all") {
    match.category = req.query.category;
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: Number.parseInt(req.query.limit),
        skip: Number.parseInt(req.query.skip),
        sort,
      },
    });
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "description",
    "completed",
    "isImportant",
    "category",
    "dueDate",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).send();
    }

    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

router.post("/tasks/test-reminders", auth, async (req, res) => {
  try {
    console.log(
      `[Manual Test] User ${req.user.email} triggered reminder check`
    );
    await checkTaskReminders();
    res.send({
      message: "Reminder check completed. Check server logs for details.",
    });
  } catch (e) {
    res.status(500).send({ error: "Failed to check reminders" });
  }
});

router.get("/tasks/upcoming/list", auth, async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingTasks = await Task.find({
      owner: req.user._id,
      completed: false,
      dueDate: {
        $gte: now,
        $lte: twentyFourHoursLater,
      },
    }).sort({ dueDate: 1 });

    res.send(upcomingTasks);
  } catch (e) {
    res.status(500).send();
  }
});

module.exports = router;
