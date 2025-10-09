require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
require("./db/mongoose");
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");
const teamRouter = require("./routers/team");
const { startTaskReminderJob } = require("./jobs/taskReminder");
const { setupSocketHandlers } = require("./sockets/chat");
const { testSendGridConnection } = require("./emails/account");

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000, // Tăng timeout để tránh ngắt kết nối sau 5 phút
});
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

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: "connected",
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.get("/index", (req, res) => {
  res.redirect("/");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/dashboard.html"));
});

app.get("/profile", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/profile.html"));
});

app.get("/teams", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/teams.html"));
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/forgot-password.html"));
});

app.get("/reset-password", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/reset-password.html"));
});

// Log lỗi kết nối Socket.IO để debug
io.engine.on("connection_error", (err) => {
  console.log(
    "Socket.IO connection error:",
    err.req,
    err.code,
    err.message,
    err.context
  );
});

setupSocketHandlers(io);

server.listen(port, async () => {
  console.log(`Server is up on: http://localhost:${port}`);

  startTaskReminderJob();
});
