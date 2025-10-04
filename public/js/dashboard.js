// API Base URL
const API_URL = window.location.origin;

// Get token from localStorage
const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user") || "{}");

// Redirect to login if not authenticated
if (!token) {
  window.location.href = "/";
}

// DOM Elements
const userNameEl = document.getElementById("userName");
const logoutBtn = document.getElementById("logoutBtn");
const taskForm = document.getElementById("taskForm");
const taskDescriptionInput = document.getElementById("taskDescription");
const taskCategoryInput = document.getElementById("taskCategory");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const upcomingTasksList = document.getElementById("upcomingTasksList");
const upcomingEmptyState = document.getElementById("upcomingEmptyState");
const filterBtns = document.querySelectorAll(".filter-btn");
const categoryFilterEl = document.getElementById("categoryFilter");
const sortByEl = document.getElementById("sortBy");
const totalTasksEl = document.getElementById("totalTasks");
const activeTasksEl = document.getElementById("activeTasks");
const completedTasksEl = document.getElementById("completedTasks");
const userInitialEl = document.getElementById("userInitial");
const userAvatarEl = document.querySelector(".user-avatar");

// State
let tasks = [];
let currentFilter = "all";
let currentCategory = "all";
let currentSort = "default";

// Initialize
init();

async function init() {
  // Display user name
  userNameEl.textContent = user.name || "User";

  if (userInitialEl && user.name) {
    userInitialEl.textContent = user.name.charAt(0).toUpperCase();
  }
  if (userAvatarEl) {
    userAvatarEl.style.cursor = "pointer";
    userAvatarEl.addEventListener("click", () => {
      window.location.href = "/profile";
    });
  }

  // Load avatar if exists
  if (user._id) {
    loadUserAvatar();
  }
  // Load tasks
  await loadTasks();
  await loadUpcomingTasks();

  // Setup event listeners
  setupEventListeners();

  setInterval(loadUpcomingTasks, 5 * 60 * 1000);
}
function loadUserAvatar() {
  const avatarUrl = `${API_URL}/users/${user._id}/avatar`;
  const img = new Image();

  img.onload = () => {
    if (userAvatarEl) {
      userAvatarEl.style.backgroundImage = `url(${avatarUrl})`;
      userAvatarEl.style.backgroundSize = "cover";
      userAvatarEl.style.backgroundPosition = "center";
      if (userInitialEl) {
        userInitialEl.style.display = "none";
      }
    }
  };

  img.onerror = () => {
    // Keep showing initial if avatar doesn't exist
    if (userInitialEl) {
      userInitialEl.style.display = "flex";
    }
  };

  img.src = avatarUrl;
}

function setupEventListeners() {
  // Logout
  logoutBtn.addEventListener("click", logout);

  // Add task
  taskForm.addEventListener("submit", addTask);

  // Filters
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderTasks();
    });
  });

  categoryFilterEl.addEventListener("change", (e) => {
    currentCategory = e.target.value;
    renderTasks();
  });

  sortByEl.addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderTasks();
  });
}

// Load tasks from API
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

    tasks = await response.json();
    updateCategoryFilter();
    updateCategoryDatalist();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error("Error loading tasks:", error);
    alert("Không thể tải danh sách công việc");
  }
}

function updateCategoryFilter() {
  const categories = [...new Set(tasks.map((t) => t.category || "Chung"))];
  categoryFilterEl.innerHTML = '<option value="all">Tất cả</option>';
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilterEl.appendChild(option);
  });
}

function updateCategoryDatalist() {
  const categories = [...new Set(tasks.map((t) => t.category || "Chung"))];
  const datalist = document.getElementById("categoryList");
  datalist.innerHTML = "";
  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat;
    datalist.appendChild(option);
  });
}

// Add new task
async function addTask(e) {
  e.preventDefault();

  const description = taskDescriptionInput.value.trim();
  const category = taskCategoryInput.value.trim() || "Chung";
  const dueDate = taskDueDateInput.value;

  if (!description) return;

  try {
    const taskData = { description, category };

    if (dueDate) {
      taskData.dueDate = new Date(dueDate).toISOString();
    }

    const response = await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error("Failed to add task");
    }

    const newTask = await response.json();
    tasks.push(newTask);

    taskDescriptionInput.value = "";
    taskCategoryInput.value = "";
    taskDueDateInput.value = "";
    updateCategoryFilter();
    updateCategoryDatalist();
    renderTasks();
    updateStats();
    await loadUpcomingTasks();
  } catch (error) {
    console.error("Error adding task:", error);
    alert("Không thể thêm công việc");
  }
}

// Toggle task completion
async function toggleTask(taskId) {
  const task = tasks.find((t) => t._id === taskId);
  if (!task) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed: !task.completed }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    const updatedTask = await response.json();
    const index = tasks.findIndex((t) => t._id === taskId);
    tasks[index] = updatedTask;

    renderTasks();
    updateStats();
    await loadUpcomingTasks();
  } catch (error) {
    console.error("Error updating task:", error);
    alert("Không thể cập nhật công việc");
  }
}

async function toggleImportant(taskId) {
  const task = tasks.find((t) => t._id === taskId);
  if (!task) return;

  try {
    const response = await fetch(`${API_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isImportant: !task.isImportant }),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    const updatedTask = await response.json();
    const index = tasks.findIndex((t) => t._id === taskId);
    tasks[index] = updatedTask;

    renderTasks();
  } catch (error) {
    console.error("Error updating task importance:", error);
    alert("Không thể cập nhật độ ưu tiên");
  }
}

// Delete task
async function deleteTask(taskId) {
  if (!confirm("Bạn có chắc muốn xóa công việc này?")) return;

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

    tasks = tasks.filter((t) => t._id !== taskId);

    updateCategoryFilter();
    updateCategoryDatalist();
    renderTasks();
    updateStats();
    await loadUpcomingTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
    alert("Không thể xóa công việc");
  }
}

// Render tasks
function renderTasks() {
  // Filter tasks
  let filteredTasks = tasks;

  if (currentFilter === "active") {
    filteredTasks = filteredTasks.filter((t) => !t.completed);
  } else if (currentFilter === "completed") {
    filteredTasks = filteredTasks.filter((t) => t.completed);
  }

  if (currentCategory !== "all") {
    filteredTasks = filteredTasks.filter(
      (t) => (t.category || "Chung") === currentCategory
    );
  }

  filteredTasks = [...filteredTasks].sort((a, b) => {
    // Important tasks always first
    if (a.isImportant && !b.isImportant) return -1;
    if (!a.isImportant && b.isImportant) return 1;

    // Then apply selected sort
    if (currentSort === "dueDate") {
      // Tasks with due date first, sorted by date
      if (!a.dueDate && b.dueDate) return 1;
      if (a.dueDate && !b.dueDate) return -1;
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
    } else if (currentSort === "createdAt") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    } else if (currentSort === "createdAtOld") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }

    return 0;
  });

  // Show/hide empty state
  if (filteredTasks.length === 0) {
    emptyState.style.display = "block";
    taskList.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  taskList.style.display = "flex";

  // Render task items
  taskList.innerHTML = filteredTasks
    .map(
      (task) => `
        <div class="task-item ${task.completed ? "completed" : ""} ${
        task.isImportant ? "important" : ""
      }" data-id="${task._id}">
            <input 
                type="checkbox" 
                class="task-checkbox" 
                ${task.completed ? "checked" : ""}
                onchange="toggleTask('${task._id}')"
            >
            <div class="task-content">
                <div class="task-description">
                    ${
                      task.isImportant
                        ? '<span class="important-badge">⭐</span>'
                        : ""
                    }
                    ${escapeHtml(task.description)}
                    ${
                      task.dueDate
                        ? getDueDateBadge(task.dueDate, task.completed)
                        : ""
                    }
                </div>
                <div class="task-meta">
                    <span class="task-category-badge">${escapeHtml(
                      task.category || "Chung"
                    )}</span>
                    Tạo lúc: ${formatDate(task.createdAt)}
                    ${
                      task.dueDate
                        ? ` • Hẹn lúc: ${formatDate(task.dueDate)}`
                        : ""
                    }
                </div>
            </div>
            <div class="task-actions">
                <button 
                    class="task-btn task-btn-important ${
                      task.isImportant ? "active" : ""
                    }" 
                    onclick="toggleImportant('${task._id}')"
                    title="${
                      task.isImportant
                        ? "Bỏ đánh dấu quan trọng"
                        : "Đánh dấu quan trọng"
                    }"
                >
                    ${task.isImportant ? "★" : "☆"}
                </button>
                <button class="task-btn task-btn-delete" onclick="deleteTask('${
                  task._id
                }')">
                    Xóa
                </button>
            </div>
        </div>
    `
    )
    .join("");
}

// Get due date badge with appropriate styling
function getDueDateBadge(dueDate, isCompleted) {
  if (isCompleted) return "";

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return '<span class="task-due-date overdue">⚠️ Quá hạn</span>';
  } else if (diffHours <= 24) {
    return '<span class="task-due-date upcoming">⏰ Sắp đến hạn</span>';
  } else {
    return '<span class="task-due-date">📅 Có hẹn</span>';
  }
}

// Update statistics
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  totalTasksEl.textContent = total;
  activeTasksEl.textContent = active;
  completedTasksEl.textContent = completed;
}

// Logout
async function logout() {
  try {
    await fetch(`${API_URL}/users/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error logging out:", error);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index";
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString("vi-VN");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadUpcomingTasks() {
  try {
    const response = await fetch(`${API_URL}/tasks/upcoming/list`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load upcoming tasks");
    }

    const upcomingTasks = await response.json();
    renderUpcomingTasks(upcomingTasks);
  } catch (error) {
    console.error("Error loading upcoming tasks:", error);
  }
}

function renderUpcomingTasks(upcomingTasks) {
  const upcomingSection = document.getElementById("upcomingTasksSection");
  const upcomingCountEl = document.getElementById("upcomingCount");

  upcomingCountEl.textContent = upcomingTasks.length;

  if (upcomingTasks.length === 0) {
    upcomingSection.style.display = "none";
    return;
  }

  upcomingSection.style.display = "block";
  upcomingEmptyState.style.display = "none";
  upcomingTasksList.style.display = "flex";

  upcomingTasksList.innerHTML = upcomingTasks
    .map((task) => {
      const now = new Date();
      const due = new Date(task.dueDate);
      const diffMs = due - now;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let timeText = "";
      if (diffHours > 0) {
        timeText = `${diffHours} giờ ${diffMinutes} phút nữa`;
      } else {
        timeText = `${diffMinutes} phút nữa`;
      }

      return `
        <div class="upcoming-task-item">
          <div class="upcoming-task-info">
            <div class="upcoming-task-description">${escapeHtml(
              task.description
            )}</div>
            <div class="task-meta">
              <span class="task-category-badge">${escapeHtml(
                task.category || "Chung"
              )}</span>
              <span class="upcoming-task-time">⏰ ${timeText}</span>
            </div>
          </div>
          <div style="text-align: right; color: #666; font-size: 13px;">
            ${formatDate(task.dueDate)}
          </div>
        </div>
      `;
    })
    .join("");
}
