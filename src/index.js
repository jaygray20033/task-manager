require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const teamRouter = require("./routers/team");
const { startTaskReminderJob } = require("./jobs/taskReminder");
const { testSendGridConnection } = require("./emails/account");

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use(userRouter);
app.use(taskRouter);
app.use(teamRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(port, async () => {
  console.log(`Server is up on: http://localhost:${port}`);

  startTaskReminderJob();
});
