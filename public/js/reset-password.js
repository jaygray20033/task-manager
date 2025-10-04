const API_URL = window.location.origin;

const form = document.getElementById("resetPasswordForm");
const messageDiv = document.getElementById("message");

// Get token from URL
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get("token");

if (!token) {
  messageDiv.textContent =
    "Link không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu mới.";
  messageDiv.classList.add("error", "show");
  form.style.display = "none";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  messageDiv.textContent = "";
  messageDiv.className = "message";

  // Validate password
  if (password.length < 7) {
    messageDiv.textContent = "Mật khẩu phải có ít nhất 7 ký tự";
    messageDiv.classList.add("error", "show");
    return;
  }

  if (password.toLowerCase().includes("password")) {
    messageDiv.textContent = 'Mật khẩu không được chứa từ "password"';
    messageDiv.classList.add("error", "show");
    return;
  }

  if (password !== confirmPassword) {
    messageDiv.textContent = "Mật khẩu xác nhận không khớp";
    messageDiv.classList.add("error", "show");
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.textContent = "Đang xử lý...";
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/users/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Có lỗi xảy ra");
    }

    messageDiv.textContent =
      data.message + " Đang chuyển đến trang đăng nhập...";
    messageDiv.classList.add("success", "show");
    form.reset();

    // Redirect to login after 2 seconds
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
  } catch (error) {
    messageDiv.textContent = error.message;
    messageDiv.classList.add("error", "show");
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});
