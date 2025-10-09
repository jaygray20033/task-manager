const jwt = require("jsonwebtoken");
const User = require("../models/user");
const Team = require("../models/team");
const Message = require("../models/message");

const setupSocketHandlers = (io) => {
  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      console.log(
        "[v0] Socket authentication attempt from:",
        socket.handshake.address
      );

      // Added check for auth object
      if (!socket.handshake.auth) {
        console.error("[v0] No auth object provided in socket handshake");
        return next(new Error("Authentication error: No auth provided"));
      }

      const token = socket.handshake.auth.token;
      if (!token) {
        console.error("[v0] No token provided in auth object");
        return next(new Error("Authentication error: No token provided"));
      }

      console.log("[v0] Verifying JWT token...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("[v0] Token decoded successfully, user ID:", decoded._id);

      const user = await User.findOne({
        _id: decoded._id,
        "tokens.token": token,
      });

      if (!user) {
        console.error("[v0] User not found or token not in tokens array");
        console.error("[v0] User ID from token:", decoded._id);
        return next(new Error("Authentication error: Invalid token"));
      }

      console.log(
        "[v0] User authenticated successfully:",
        user.name,
        user.email
      );
      socket.user = user;
      socket.token = token;
      next();
    } catch (error) {
      console.error("[v0] Socket authentication failed:", error.message);
      if (error.name === "JsonWebTokenError") {
        return next(new Error("Authentication error: Invalid token format"));
      } else if (error.name === "TokenExpiredError") {
        return next(new Error("Authentication error: Token expired"));
      }
      next(new Error(`Authentication error: ${error.message}`));
    }
  });

  io.on("connection", (socket) => {
    console.log(
      `[v0] ✓ User connected: ${socket.user.name} (${socket.user.email}) - Socket ID: ${socket.id}`
    );

    // Join team room
    socket.on("join-team", async ({ teamId }) => {
      try {
        console.log(
          `[v0] User ${socket.user.name} attempting to join team ${teamId}`
        );

        const team = await Team.findOne({
          _id: teamId,
          "members.user": socket.user._id,
        });

        if (!team) {
          console.error(
            `[v0] User ${socket.user.name} is not a member of team ${teamId}`
          );
          socket.emit("error", {
            message: "You are not a member of this team",
          });
          return;
        }

        socket.join(`team-${teamId}`);
        console.log(
          `[v0] User ${socket.user.name} successfully joined team ${teamId}`
        );

        // Load recent messages (last 50)
        const messages = await Message.find({ team: teamId })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate("sender", "name email")
          .lean();

        console.log(
          `[v0] Loaded ${messages.length} messages for team ${teamId}`
        );
        socket.emit("load-messages", messages.reverse());

        // Notify others that user joined
        socket.to(`team-${teamId}`).emit("user-joined", {
          userId: socket.user._id,
          userName: socket.user.name,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("[v0] Error joining team:", error);
        socket.emit("error", { message: "Failed to join team chat" });
      }
    });

    // Leave team room
    socket.on("leave-team", ({ teamId }) => {
      socket.leave(`team-${teamId}`);
      console.log(`[v0] User ${socket.user.name} left team ${teamId}`);

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
        console.error("[v0] Error sending message:", error);
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
      console.log(`[v0] User disconnected: ${socket.user.name}`);
    });
  });
};

module.exports = { setupSocketHandlers };
