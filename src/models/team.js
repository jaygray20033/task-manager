const mongoose = require("mongoose");

const teamMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  role: {
    type: String,
    enum: ["owner", "admin", "member"],
    default: "member",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    members: [teamMemberSchema],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique invite code
teamSchema.methods.generateInviteCode = function () {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  this.inviteCode = code;
  return code;
};

// Check if user is member
teamSchema.methods.isMember = function (userId) {
  // Get the owner ID - handle both populated and unpopulated cases
  const ownerId = this.owner._id
    ? this.owner._id.toString()
    : this.owner.toString();

  // Check if user is owner
  if (ownerId === userId.toString()) return true;

  // Check if user is in members array
  return this.members.some((member) => {
    const memberId = member.user._id
      ? member.user._id.toString()
      : member.user.toString();
    return memberId === userId.toString();
  });
};

// Check if user is admin or owner
teamSchema.methods.isAdmin = function (userId) {
  // Get the owner ID - handle both populated and unpopulated cases
  const ownerId = this.owner._id
    ? this.owner._id.toString()
    : this.owner.toString();

  if (ownerId === userId.toString()) return true;

  const member = this.members.find((m) => {
    const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberId === userId.toString();
  });

  return member && member.role === "admin";
};

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;
