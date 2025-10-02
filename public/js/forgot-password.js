const API_URL = "http://localhost:3000";

const form = document.getElementById("forgotPasswordForm");
const messageDiv = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  submitBtn.textContent = "Đang gửi...";
  submitBtn.disabled = true;
  messageDiv.textContent = "";
  messageDiv.className = "message";

  try {
    const response = await fetch(`${API_URL}/users/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Có lỗi xảy ra");
    }

    messageDiv.textContent = data.message + " Vui lòng kiểm tra email của bạn.";
    messageDiv.classList.add("success", "show");
    form.reset();
  } catch (error) {
    messageDiv.textContent = error.message;
    messageDiv.classList.add("error", "show");
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});
