const API_URL = "http://localhost:3000";

// Tab switching
const tabBtns = document.querySelectorAll(".tab-btn");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab;

    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    if (tab === "login") {
      loginForm.classList.add("active");
      registerForm.classList.remove("active");
    } else {
      registerForm.classList.add("active");
      loginForm.classList.remove("active");
    }
  });
});

// Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const errorDiv = document.getElementById("loginError");

  try {
    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(
        "Đăng nhập thất bại. Vui lòng kiểm tra email và mật khẩu."
      );
    }

    const data = await response.json();

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirect to dashboard
    window.location.href = "/dashboard.html";
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add("show");

    setTimeout(() => {
      errorDiv.classList.remove("show");
    }, 5000);
  }
});

// Register
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("registerName").value;
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  const age = document.getElementById("registerAge").value;
  const errorDiv = document.getElementById("registerError");

  const userData = { name, email, password };
  if (age) {
    userData.age = Number.parseInt(age);
  }

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    }

    const data = await response.json();

    // Save token and user info
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    // Redirect to dashboard
    window.location.href = "/dashboard.html";
  } catch (error) {
    errorDiv.textContent = error.message;
    errorDiv.classList.add("show");

    setTimeout(() => {
      errorDiv.classList.remove("show");
    }, 5000);
  }
});

// Check if already logged in
if (localStorage.getItem("token")) {
  window.location.href = "/dashboard.html";
}
