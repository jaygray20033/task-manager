const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Team = require("../models/team");
const Message = require("../models/message");

const setupSocketHandlers = (io) => {
  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({
        _id: decoded._id,
        "tokens.token": token,
      });

      if (!user) {
        return next(new Error("Authentication error"));
      }

      socket.user = user;
      socket.token = token;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);

    // Join team room
    socket.on("join-team", async (teamId) => {
      try {
        const team = await Team.findOne({
          _id: teamId,
          "members.user": socket.user._id,
        });

        if (!team) {
          socket.emit("error", {
            message: "You are not a member of this team",
          });
          return;
        }

        socket.join(`team-${teamId}`);
        console.log(`User ${socket.user.name} joined team ${teamId}`);

        // Load recent messages (last 50)
        const messages = await Message.find({ team: teamId })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate("sender", "name email")
          .lean();

        socket.emit("load-messages", messages.reverse());

        // Notify others that user joined
        socket.to(`team-${teamId}`).emit("user-joined", {
          userId: socket.user._id,
          userName: socket.user.name,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error joining team:", error);
        socket.emit("error", { message: "Failed to join team chat" });
      }
    });

    // Leave team room
    socket.on("leave-team", (teamId) => {
      socket.leave(`team-${teamId}`);
      console.log(`User ${socket.user.name} left team ${teamId}`);

      socket.to(`team-${teamId}`).emit("user-left", {
        userId: socket.user._id,
        userName: socket.user.name,
        timestamp: new Date(),
      });
    });

    // Send message
    socket.on("send-message", async ({ teamId, content }) => {
      try {
        // Verify user is member of team
        const team = await Team.findOne({
          _id: teamId,
          "members.user": socket.user._id,
        });

        if (!team) {
          socket.emit("error", {
            message: "You are not a member of this team",
          });
          return;
        }

        // Create message
        const message = new Message({
          team: teamId,
          sender: socket.user._id,
          content: content.trim(),
          type: "text",
        });

        await message.save();
        await message.populate("sender", "name email");

        // Broadcast to all users in team room
        io.to(`team-${teamId}`).emit("new-message", {
          _id: message._id,
          team: message.team,
          sender: {
            _id: message.sender._id,
            name: message.sender.name,
            email: message.sender.email,
          },
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", ({ teamId, isTyping }) => {
      socket.to(`team-${teamId}`).emit("user-typing", {
        userId: socket.user._id,
        userName: socket.user.name,
        isTyping,
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { setupSocketHandlers };
