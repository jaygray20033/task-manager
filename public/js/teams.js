const API_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : window.location.origin;

let currentUser = null;
let currentTeam = null;
let teamMembers = [];
let socket = null;
let typingTimeout = null;

// Declare io variable
const io = window.io;

// Check authentication
const token = localStorage.getItem("token");
if (!token) {
  window.location.href = "/index.html";
}

// Logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/index.html";
});

// Load current user and teams on page load
loadCurrentUser().then(() => {
  loadTeams();
});

// Create team form
document
  .getElementById("createTeamForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("teamName").value.trim();
    const description = document.getElementById("teamDescription").value.trim();

    if (!name) {
      alert("Vui lòng nhập tên nhóm!");
      return;
    }

    try {
      console.log("[v0] Creating team with:", { name, description });

      const response = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      console.log("[v0] Create team response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("[v0] Create team error:", error);
        throw new Error(error.error || "Failed to create team");
      }

      const team = await response.json();
      console.log("[v0] Team created successfully:", team);

      document.getElementById("teamName").value = "";
      document.getElementById("teamDescription").value = "";

      loadTeams();
      alert("Tạo nhóm thành công!");
    } catch (error) {
      console.error("[v0] Team creation failed:", error);
      alert(error.message);
    }
  });

// Join team form
document
  .getElementById("joinTeamForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const inviteCode = document
      .getElementById("inviteCode")
      .value.toUpperCase();

    try {
      const response = await fetch(`${API_URL}/teams/join/${inviteCode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to join team");
      }

      document.getElementById("inviteCode").value = "";

      loadTeams();
      alert("Tham gia nhóm thành công!");
    } catch (error) {
      alert(error.message);
    }
  });

// Load teams
async function loadTeams() {
  try {
    const response = await fetch(`${API_URL}/teams`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load teams");

    const teams = await response.json();

    const teamsList = document.getElementById("teamsList");
    const emptyState = document.getElementById("emptyTeamsState");

    if (teams.length === 0) {
      teamsList.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    teamsList.style.display = "grid";
    emptyState.style.display = "none";

    teamsList.innerHTML = teams
      .map((team) => {
        const userMember = team.members.find(
          (m) => m.user._id === currentUser?._id
        );
        const role =
          team.owner._id === currentUser?._id
            ? "owner"
            : userMember?.role || "member";

        return `
        <div class="team-card" onclick="openTeamModal('${team._id}')">
          <div class="team-card-header">
            <div>
              <div class="team-card-title">${team.name}</div>
            </div>
            <span class="team-role-badge ${role}">${
          role === "owner"
            ? "Chủ nhóm"
            : role === "admin"
            ? "Quản trị"
            : "Thành viên"
        }</span>
          </div>
          <div class="team-card-description">${
            team.description || "Không có mô tả"
          }</div>
          <div class="team-card-footer">
            <span class="team-members-count">👥 ${
              team.members.length
            } thành viên</span>
            <span class="team-tasks-count">📝 Xem chi tiết →</span>
          </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Error loading teams:", error);
  }
}

function initializeSocket() {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: {
      token: token,
    },
  });

  socket.on("connect", () => {
    console.log("[v0] Socket connected");
    updateChatStatus("connected");
  });

  socket.on("disconnect", () => {
    console.log("[v0] Socket disconnected");
    updateChatStatus("disconnected");
  });

  socket.on("error", (error) => {
    console.error("[v0] Socket error:", error);
    alert(error.message);
  });

  socket.on("load-messages", (messages) => {
    console.log("[v0] Loaded messages:", messages.length);
    displayMessages(messages);
  });

  socket.on("new-message", (message) => {
    console.log("[v0] New message received:", message);
    appendMessage(message);
  });

  socket.on("user-joined", (data) => {
    console.log("[v0] User joined:", data.userName);
    appendSystemMessage(`${data.userName} đã tham gia chat`);
  });

  socket.on("user-left", (data) => {
    console.log("[v0] User left:", data.userName);
    appendSystemMessage(`${data.userName} đã rời khỏi chat`);
  });

  socket.on("user-typing", (data) => {
    console.log("[v0] User typing:", data.userName, data.isTyping);
    showTypingIndicator(data.userName, data.isTyping);
  });
}

function updateChatStatus(status) {
  const statusElement = document.getElementById("chatStatus");
  const statusText = statusElement.querySelector(".status-text");

  statusElement.className = `online-indicator ${status}`;

  if (status === "connected") {
    statusText.textContent = "Đã kết nối";
  } else if (status === "disconnected") {
    statusText.textContent = "Mất kết nối";
  } else {
    statusText.textContent = "Đang kết nối...";
  }
}

function displayMessages(messages) {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";

  messages.forEach((message) => {
    appendMessage(message, false);
  });

  scrollToBottom();
}

function appendMessage(message, shouldScroll = true) {
  const chatMessages = document.getElementById("chatMessages");
  const isOwnMessage = message.sender._id === currentUser._id;

  const messageDiv = document.createElement("div");
  messageDiv.className = `chat-message ${isOwnMessage ? "own-message" : ""}`;

  const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-avatar">${message.sender.name
      .charAt(0)
      .toUpperCase()}</div>
    <div class="message-content">
      ${
        !isOwnMessage
          ? `<div class="message-sender">${message.sender.name}</div>`
          : ""
      }
      <div class="message-bubble">${escapeHtml(message.content)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;

  chatMessages.appendChild(messageDiv);

  if (shouldScroll) {
    scrollToBottom();
  }
}

function appendSystemMessage(text) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = "message-system";
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

function showTypingIndicator(userName, isTyping) {
  const indicator = document.getElementById("typingIndicator");
  const userSpan = indicator.querySelector(".typing-user");

  if (isTyping) {
    userSpan.textContent = userName;
    indicator.style.display = "block";
  } else {
    indicator.style.display = "none";
  }
}

function scrollToBottom() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const input = document.getElementById("chatInput");
  const content = input.value.trim();

  if (!content || !socket || !currentTeam) return;

  socket.emit("send-message", {
    teamId: currentTeam._id,
    content: content,
  });

  input.value = "";

  // Stop typing indicator
  socket.emit("typing", {
    teamId: currentTeam._id,
    isTyping: false,
  });
});

document.getElementById("chatInput").addEventListener("input", (e) => {
  if (!socket || !currentTeam) return;

  // Clear previous timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }

  // Emit typing event
  socket.emit("typing", {
    teamId: currentTeam._id,
    isTyping: true,
  });

  // Stop typing after 2 seconds of no input
  typingTimeout = setTimeout(() => {
    socket.emit("typing", {
      teamId: currentTeam._id,
      isTyping: false,
    });
  }, 2000);
});

// Open team modal
async function openTeamModal(teamId) {
  try {
    const response = await fetch(`${API_URL}/teams/${teamId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load team");

    currentTeam = await response.json();
    teamMembers = currentTeam.members;

    document.getElementById("modalTeamName").textContent = currentTeam.name;
    document.getElementById("teamInviteCode").textContent =
      currentTeam.inviteCode;
    document.getElementById("teamDescription").textContent =
      currentTeam.description || "Không có mô tả";
    document.getElementById("memberCount").textContent =
      currentTeam.members.length;

    // Show delete button if user is owner
    const deleteTeamBtn = document.getElementById("deleteTeamBtn");
    if (currentTeam.owner._id === currentUser?._id) {
      deleteTeamBtn.style.display = "inline-block";
    } else {
      deleteTeamBtn.style.display = "none";
    }

    // Load members
    loadMembers();

    // Load team tasks
    loadTeamTasks(teamId);

    // Initialize socket for chat
    initializeSocket();

    // Join team room
    if (socket) {
      socket.emit("join-team", { teamId: currentTeam._id });
    }

    // Show modal
    document.getElementById("teamModal").classList.add("show");
  } catch (error) {
    alert(error.message);
  }
}

// Close team modal
function closeTeamModal() {
  // Leave team room
  if (socket && currentTeam) {
    socket.emit("leave-team", { teamId: currentTeam._id });
    socket.disconnect();
  }

  document.getElementById("teamModal").classList.remove("show");
  currentTeam = null;
  teamMembers = [];
}

// Create team task form
document
  .getElementById("createTeamTaskForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const description = document.getElementById("teamTaskDescription").value;
    const category = document.getElementById("teamTaskCategory").value;

    // Get assignments
    const assignmentItems = document.querySelectorAll(".assignment-item");
    const assignments = [];

    assignmentItems.forEach((item) => {
      const userId = item.querySelector(".assignment-user-select").value;
      const dueDate = item.querySelector(".assignment-due-input").value;

      if (userId) {
        assignments.push({
          user: userId,
          dueDate: dueDate || undefined,
        });
      }
    });

    if (assignments.length === 0) {
      alert("Vui lòng phân công ít nhất 1 thành viên!");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/teams/${currentTeam._id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            description,
            category,
            assignments,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create task");
      }

      document.getElementById("teamTaskDescription").value = "";
      document.getElementById("teamTaskCategory").value = "";
      document.getElementById("assignmentsList").innerHTML = "";

      loadTeamTasks(currentTeam._id);
      alert("Tạo công việc thành công!");
    } catch (error) {
      alert(error.message);
    }
  });

// Load team tasks
async function loadTeamTasks(teamId) {
  try {
    const response = await fetch(`${API_URL}/teams/${teamId}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load tasks");

    const tasks = await response.json();

    const tasksList = document.getElementById("teamTasksList");
    const emptyState = document.getElementById("emptyTeamTasksState");

    if (tasks.length === 0) {
      tasksList.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    tasksList.style.display = "flex";
    emptyState.style.display = "none";

    tasksList.innerHTML = tasks
      .map(
        (task) => `
      <div class="team-task-item">
        <div class="team-task-header">
          <div class="team-task-title-section">
            <div class="team-task-description">${task.description}</div>
            <div class="team-task-meta">
              ${
                task.category
                  ? `<span class="task-category-badge">${task.category}</span>`
                  : ""
              }
              <span class="task-creator">Tạo bởi: ${task.createdBy.name}</span>
            </div>
          </div>
          <div class="team-task-header-right">
            ${
              currentTeam &&
              (currentTeam.owner._id === currentUser?._id ||
                currentTeam.members.find(
                  (m) => m.user._id === currentUser?._id && m.role === "admin"
                ))
                ? `<button class="btn-delete-task" onclick="event.stopPropagation(); deleteTeamTask('${task._id}')">🗑️ Xóa</button>`
                : ""
            }
          </div>
        </div>
        <div class="team-task-assignments">
          ${task.assignments
            .map(
              (assignment) => `
            <div class="assignment-display ${
              assignment.completed ? "completed" : ""
            }">
              <div class="assignment-info">
                <div class="assignment-user">
                  <span class="assignment-avatar">${assignment.user.name
                    .charAt(0)
                    .toUpperCase()}</span>
                  <span class="assignment-name">${assignment.user.name}</span>
                </div>
                ${
                  assignment.dueDate
                    ? `<div class="assignment-due">⏰ Hạn: ${new Date(
                        assignment.dueDate
                      ).toLocaleString("vi-VN")}</div>`
                    : ""
                }
              </div>
              <div class="assignment-actions">
                ${
                  assignment.user._id === currentUser?._id &&
                  !assignment.completed
                    ? `
                  <label class="btn-upload">
                    📎 Upload
                    <input type="file" onchange="uploadAssignmentFile('${task._id}', '${assignment._id}', this.files[0])" style="display: none;">
                  </label>
                `
                    : assignment.completed
                    ? '<span class="assignment-status completed">✓ Đã xong</span>'
                    : '<span class="assignment-status pending">⏳ Chưa xong</span>'
                }
              </div>
              ${
                assignment.fileUrl && assignment.fileName
                  ? `
              <div class="assignment-file">
                <a href="${assignment.fileUrl}" download="${assignment.fileName}" class="btn-download-file">
                  📄 ${assignment.fileName}
                  <span class="download-icon">⬇️</span>
                </a>
              </div>
              `
                  : ""
              }
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `
      )
      .join("");
  } catch (error) {
    console.error("Error loading team tasks:", error);
  }
}

// Toggle assignment completion
async function toggleAssignment(taskId, assignmentId, completed) {
  try {
    const response = await fetch(
      `${API_URL}/teams/${currentTeam._id}/tasks/${taskId}/assignments/${assignmentId}/complete`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update assignment");
    }

    loadTeamTasks(currentTeam._id);
  } catch (error) {
    alert(error.message);
  }
}

// Upload assignment file
async function uploadAssignmentFile(taskId, assignmentId, file) {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(
      `${API_URL}/teams/${currentTeam._id}/tasks/${taskId}/assignments/${assignmentId}/upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload file");
    }

    await toggleAssignment(taskId, assignmentId, true);

    alert("Upload file thành công!");
    loadTeamTasks(currentTeam._id);
  } catch (error) {
    alert(error.message);
  }
}

// Delete team task
async function deleteTeamTask(taskId) {
  if (!confirm("Bạn có chắc muốn xóa công việc này?")) return;

  try {
    const response = await fetch(
      `${API_URL}/teams/${currentTeam._id}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete task");
    }

    alert("Xóa công việc thành công!");
    loadTeamTasks(currentTeam._id);
  } catch (error) {
    alert(error.message);
  }
}

// Delete team
async function deleteTeam() {
  if (!confirm("Bạn có chắc muốn xóa nhóm này? Tất cả công việc sẽ bị xóa!"))
    return;

  try {
    const response = await fetch(`${API_URL}/teams/${currentTeam._id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete team");
    }

    alert("Xóa nhóm thành công!");
    closeTeamModal();
    loadTeams();
  } catch (error) {
    alert(error.message);
  }
}

// Load current user
async function loadCurrentUser() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to load user");

    currentUser = await response.json();
  } catch (error) {
    console.error("Error loading user:", error);
  }
}

// Show/hide form thêm thành viên
function showAddMemberForm() {
  document.getElementById("addMemberForm").style.display = "block";
}

function hideAddMemberForm() {
  document.getElementById("addMemberForm").style.display = "none";
  document.getElementById("memberEmail").value = "";
}

// Handler for form thêm thành viên
document
  .getElementById("addMemberFormElement")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("memberEmail").value;

    try {
      const response = await fetch(
        `${API_URL}/teams/${currentTeam._id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member");
      }

      const updatedTeam = await response.json();
      currentTeam = updatedTeam;
      teamMembers = updatedTeam.members;

      hideAddMemberForm();
      loadMembers();
      alert("Thêm thành viên thành công!");
    } catch (error) {
      alert(error.message);
    }
  });

// Load members
function loadMembers() {
  const membersList = document.getElementById("membersList");

  membersList.innerHTML = currentTeam.members
    .map((member) => {
      const isOwner = currentTeam.owner._id === member.user._id;
      const role = isOwner ? "owner" : member.role;

      return `
      <div class="member-item">
        <div class="member-info">
          <div class="member-avatar">${member.user.name
            .charAt(0)
            .toUpperCase()}</div>
          <div class="member-details">
            <span class="member-name">${member.user.name}</span>
            <span class="member-email">${member.user.email}</span>
          </div>
        </div>
        <span class="team-role-badge ${role}">${
        role === "owner"
          ? "Chủ nhóm"
          : role === "admin"
          ? "Quản trị"
          : "Thành viên"
      }</span>
      </div>
    `;
    })
    .join("");
}

// Add assignment input
function addAssignment() {
  const assignmentsList = document.getElementById("assignmentsList");

  const assignmentItem = document.createElement("div");
  assignmentItem.className = "assignment-item";

  assignmentItem.innerHTML = `
    <div class="input-wrapper">
      <select class="select-input assignment-user-select" required>
        <option value="">Chọn thành viên...</option>
        ${teamMembers
          .map((m) => `<option value="${m.user._id}">${m.user.name}</option>`)
          .join("")}
      </select>
    </div>
    <div class="input-wrapper">
      <input type="datetime-local" class="assignment-due-input" placeholder="Thời hạn">
    </div>
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">✕</button>
  `;

  assignmentsList.appendChild(assignmentItem);
}
