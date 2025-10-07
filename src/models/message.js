const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Team",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      enum: ["text", "system"],
      default: "text",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
messageSchema.index({ team: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
