// API Base URL
const API_URL = window.location.origin;

// Get token from localStorage
const token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user") || "{}");

// Redirect to login if not authenticated
if (!token) {
  window.location.href = "/index";
}

// DOM Elements
const avatarPreview = document.getElementById("avatarPreview");
const avatarInitial = document.getElementById("avatarInitial");
const avatarInput = document.getElementById("avatarInput");
const removeAvatarBtn = document.getElementById("removeAvatarBtn");
const profileForm = document.getElementById("profileForm");
const userNameInput = document.getElementById("userName");
const userEmailInput = document.getElementById("userEmail");
const userAgeInput = document.getElementById("userAge");
const passwordForm = document.getElementById("passwordForm");
const newPasswordInput = document.getElementById("newPassword");
const confirmPasswordInput = document.getElementById("confirmPassword");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const logoutBtn = document.getElementById("logoutBtn");

const tabButtons = document.querySelectorAll(".profile-tab-btn");
const tabContents = document.querySelectorAll(".profile-tab-content");

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tabName = btn.dataset.tab;

    // Remove active class from all buttons and contents
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));

    // Add active class to clicked button
    btn.classList.add("active");

    // Add active class to corresponding content
    const targetTab = document.getElementById(`${tabName}Tab`);
    if (targetTab) {
      targetTab.classList.add("active");
    }
  });
});

// Initialize
init();

async function init() {
  await loadUserProfile();
  setupEventListeners();
}

async function loadUserProfile() {
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load profile");
    }

    user = await response.json();
    localStorage.setItem("user", JSON.stringify(user));

    // Display user info
    userNameInput.value = user.name || "";
    userEmailInput.value = user.email || "";
    userAgeInput.value = user.age || "";

    // Display avatar
    updateAvatarDisplay();
  } catch (error) {
    console.error("Error loading profile:", error);
    alert("Không thể tải thông tin cá nhân");
  }
}

function updateAvatarDisplay() {
  if (user.avatarUrl) {
    avatarPreview.style.backgroundImage = `url(${user.avatarUrl})`;
    avatarPreview.style.backgroundSize = "cover";
    avatarPreview.style.backgroundPosition = "center";
    avatarInitial.style.display = "none";
  } else if (user._id) {
    // Try to load avatar from server
    const avatarUrl = `${API_URL}/users/${user._id}/avatar`;
    avatarPreview.style.backgroundImage = `url(${avatarUrl})`;
    avatarPreview.style.backgroundSize = "cover";
    avatarPreview.style.backgroundPosition = "center";
    avatarInitial.style.display = "none";

    // If avatar fails to load, show initial
    const img = new Image();
    img.onerror = () => {
      avatarPreview.style.backgroundImage = "none";
      avatarInitial.style.display = "flex";
      avatarInitial.textContent = user.name
        ? user.name.charAt(0).toUpperCase()
        : "?";
    };
    img.src = avatarUrl;
  } else {
    avatarPreview.style.backgroundImage = "none";
    avatarInitial.style.display = "flex";
    avatarInitial.textContent = user.name
      ? user.name.charAt(0).toUpperCase()
      : "?";
  }
}

function setupEventListeners() {
  // Avatar click to upload instead of button
  avatarPreview.addEventListener("click", () => {
    avatarInput.click();
  });

  // Avatar upload
  avatarInput.addEventListener("change", handleAvatarUpload);
  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener("click", handleRemoveAvatar);
  }

  // Profile form
  profileForm.addEventListener("submit", handleProfileUpdate);

  // Password form
  passwordForm.addEventListener("submit", handlePasswordChange);

  // Delete account
  deleteAccountBtn.addEventListener("click", handleDeleteAccount);

  // Logout
  logoutBtn.addEventListener("click", logout);
}

async function handleAvatarUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file size (1MB)
  if (file.size > 1000000) {
    alert("Kích thước file quá lớn. Vui lòng chọn ảnh nhỏ hơn 1MB");
    return;
  }

  // Validate file type
  if (!file.type.match(/image\/(jpg|jpeg|png)/)) {
    alert("Chỉ chấp nhận file JPG, JPEG, PNG");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_URL}/users/me/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload avatar");
    }

    alert("Cập nhật ảnh đại diện thành công!");
    await loadUserProfile();
  } catch (error) {
    console.error("Error uploading avatar:", error);
    alert("Không thể tải ảnh lên");
  }
}

async function handleRemoveAvatar() {
  if (!confirm("Bạn có chắc muốn xóa ảnh đại diện?")) return;

  try {
    const response = await fetch(`${API_URL}/users/me/avatar`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to remove avatar");
    }

    alert("Đã xóa ảnh đại diện!");
    await loadUserProfile();
  } catch (error) {
    console.error("Error removing avatar:", error);
    alert("Không thể xóa ảnh đại diện");
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const name = userNameInput.value.trim();
  const email = userEmailInput.value.trim();
  const age = Number.parseInt(userAgeInput.value) || 0;

  if (!name || !email) {
    alert("Vui lòng điền đầy đủ thông tin");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, email, age }),
    });

    if (!response.ok) {
      throw new Error("Failed to update profile");
    }

    const updatedUser = await response.json();
    user = updatedUser;
    localStorage.setItem("user", JSON.stringify(user));

    alert("Cập nhật thông tin thành công!");
    updateAvatarDisplay();
  } catch (error) {
    console.error("Error updating profile:", error);
    alert("Không thể cập nhật thông tin");
  }
}

async function handlePasswordChange(e) {
  e.preventDefault();

  const newPassword = newPasswordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (newPassword !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp");
    return;
  }

  if (newPassword.toLowerCase().includes("password")) {
    alert('Mật khẩu không được chứa từ "password"');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!response.ok) {
      throw new Error("Failed to change password");
    }

    alert("Đổi mật khẩu thành công!");
    newPasswordInput.value = "";
    confirmPasswordInput.value = "";
  } catch (error) {
    console.error("Error changing password:", error);
    alert("Không thể đổi mật khẩu");
  }
}

async function handleDeleteAccount() {
  console.log("[v0] Delete account button clicked");
  console.log("[v0] Current token:", token ? "exists" : "missing");
  console.log("[v0] API URL:", API_URL);

  const confirmation = prompt(
    'Để xác nhận xóa tài khoản, vui lòng nhập: "XOA TAI KHOAN"'
  );

  if (!confirmation) {
    console.log("[v0] User cancelled - no input");
    return;
  }

  if (confirmation.trim().toUpperCase() !== "XOA TAI KHOAN") {
    console.log("[v0] Wrong confirmation text:", confirmation);
    alert("Xác nhận không đúng. Hủy xóa tài khoản.");
    return;
  }

  console.log("[v0] Confirmation correct, sending DELETE request...");

  try {
    const response = await fetch(`${API_URL}/users/me`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[v0] Response status:", response.status);
    console.log("[v0] Response ok:", response.ok);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[v0] Error response data:", errorData);
      throw new Error(errorData.error || "Failed to delete account");
    }

    console.log("[v0] Account deleted successfully");
    alert("Tài khoản đã được xóa thành công");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  } catch (error) {
    console.error("[v0] Error deleting account:", error);
    console.error("[v0] Error message:", error.message);
    alert(`Không thể xóa tài khoản: ${error.message}`);
  }
}

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
  window.location.href = "/";
}
