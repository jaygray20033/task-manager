const API_URL = "";
let currentUser = null;
let currentTeam = null;
let teamMembers = [];

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

// Load teams on page load
loadTeams();

// Create team form
document
  .getElementById("createTeamForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("teamName").value;
    const description = document.getElementById("teamDescription").value;

    try {
      const response = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create team");
      }

      document.getElementById("teamName").value = "";
      document.getElementById("teamDescription").value = "";

      loadTeams();
      alert("Tạo nhóm thành công!");
    } catch (error) {
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

    // Load members
    loadMembers();

    // Load team tasks
    loadTeamTasks(teamId);

    // Show modal
    document.getElementById("teamModal").classList.add("show");
  } catch (error) {
    alert(error.message);
  }
}

// Close team modal
function closeTeamModal() {
  document.getElementById("teamModal").classList.remove("show");
  currentTeam = null;
  teamMembers = [];
}

// Copy invite code
function copyInviteCode() {
  const code = document.getElementById("teamInviteCode").textContent;
  navigator.clipboard.writeText(code);
  alert("Đã copy mã mời!");
}

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
          <div>
            <div class="team-task-description">${task.description}</div>
            <div class="team-task-meta">
              ${
                task.category
                  ? `<span class="task-category-badge">${task.category}</span>`
                  : ""
              }
              Tạo bởi: ${task.createdBy.name}
            </div>
          </div>
          <span class="team-task-status ${task.status}">${
          task.status === "completed"
            ? "Hoàn thành"
            : task.status === "in-progress"
            ? "Đang làm"
            : "Chưa bắt đầu"
        }</span>
        </div>
        <div class="team-task-assignments">
          ${task.assignments
            .map(
              (assignment) => `
            <div class="assignment-display ${
              assignment.completed ? "completed" : ""
            }">
              <div>
                <div class="assignment-user">${assignment.user.name}</div>
                ${
                  assignment.dueDate
                    ? `<div class="assignment-due">Hạn: ${new Date(
                        assignment.dueDate
                      ).toLocaleString("vi-VN")}</div>`
                    : ""
                }
              </div>
              <div class="assignment-actions">
                ${
                  assignment.user._id === currentUser?._id
                    ? `
                  <button class="btn-complete ${
                    assignment.completed ? "completed" : ""
                  }" 
                    onclick="toggleAssignment('${task._id}', '${
                        assignment._id
                      }', ${!assignment.completed})">
                    ${assignment.completed ? "✓ Đã xong" : "Hoàn thành"}
                  </button>
                `
                    : assignment.completed
                    ? '<span style="color: #10b981; font-weight: 600;">✓ Đã xong</span>'
                    : '<span style="color: #999;">Chưa xong</span>'
                }
              </div>
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

// Initialize
loadCurrentUser();
