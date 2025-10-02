const API_URL = "http://localhost:3000";
let allTasks = [];
let currentFilter = "all";

// Check authentication
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
  window.location.href = "/index.html";
}

// Display user name
document.getElementById("userName").textContent = user.name;

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await fetch(`${API_URL}/users/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
});

// Load tasks
async function loadTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load tasks");
    }

    allTasks = await response.json();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error("Load tasks error:", error);
    if (error.message.includes("401")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/index.html";
    }
  }
}

// Render tasks
function renderTasks() {
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");

  let filteredTasks = allTasks;

  if (currentFilter === "active") {
    filteredTasks = allTasks.filter((task) => !task.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = allTasks.filter((task) => task.completed);
  }

  if (filteredTasks.length === 0) {
    taskList.innerHTML = "";
    emptyState.classList.add("show");
    return;
  }

  emptyState.classList.remove("show");

  taskList.innerHTML = filteredTasks
    .map(
      (task) => `
        <div class="task-item ${task.completed ? "completed" : ""}" data-id="${
        task._id
      }">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${task._id}', ${!task.completed})"
            >
            <div class="task-content">
                <div class="task-description">${escapeHtml(
                  task.description
                )}</div>
                <div class="task-meta">
                    Tạo lúc: ${new Date(task.createdAt).toLocaleString("vi-VN")}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-delete" onclick="deleteTask('${
                  task._id
                }')">
                    🗑️
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// Update stats
function updateStats() {
  const total = allTasks.length;
  const active = allTasks.filter((task) => !task.completed).length;
  const completed = allTasks.filter((task) => task.completed).length;

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("activeTasks").textContent = active;
  document.getElementById("completedTasks").textContent = completed;
}

// Add task
document.getElementById("taskForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const description = document.getElementById("taskDescription").value;

  try {
    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    document.getElementById("taskDescription").value = "";
    await loadTasks();
  } catch (error) {
    console.error("Create task error:", error);
    alert("Không thể tạo công việc. Vui lòng thử lại.");
  }
});

// Toggle task completion
async function toggleTask(taskId, completed) {
  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    await loadTasks();
  } catch (error) {
    console.error("Update task error:", error);
    alert("Không thể cập nhật công việc. Vui lòng thử lại.");
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm("Bạn có chắc muốn xóa công việc này?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    await loadTasks();
  } catch (error) {
    console.error("Delete task error:", error);
    alert("Không thể xóa công việc. Vui lòng thử lại.");
  }
}

// Filter tasks
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Initial load
loadTasks();
