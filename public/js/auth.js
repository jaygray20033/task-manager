// API Base URL
const API_URL = window.location.origin

// DOM Elements
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const tabBtns = document.querySelectorAll(".tab-btn")
const loginError = document.getElementById("loginError")
const registerError = document.getElementById("registerError")

// Tab Switching
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const tab = btn.dataset.tab

    // Update active tab button
    tabBtns.forEach((b) => b.classList.remove("active"))
    btn.classList.add("active")

    // Update active form
    loginForm.classList.remove("active")
    registerForm.classList.remove("active")

    if (tab === "login") {
      loginForm.classList.add("active")
    } else {
      registerForm.classList.add("active")
    }

    // Clear errors
    hideError(loginError)
    hideError(registerError)
  })
})

// Login Form Submit
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  console.log("[v0] Login form submitted")

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  console.log("[v0] Login attempt with email:", email)

  hideError(loginError)

  // Show loading state
  const submitBtn = loginForm.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = "Đang đăng nhập..."
  submitBtn.disabled = true

  try {
    console.log("[v0] Sending login request to:", `${API_URL}/users/login`)

    const response = await fetch(`${API_URL}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    console.log("[v0] Login response status:", response.status)

    const data = await response.json()
    console.log("[v0] Login response data:", data)

    if (!response.ok) {
      throw new Error(data.error || "Đăng nhập thất bại")
    }

    // Save token and user data
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    console.log("[v0] Login successful, redirecting to dashboard")

    // Redirect to dashboard
<<<<<<< HEAD
    window.location.href = "/dashboard.html"
=======
    window.location.href = "/dashboard";
>>>>>>> fedb057 (new feat:personal page and file uploading)
  } catch (error) {
    console.error("[v0] Login error:", error)
    showError(loginError, error.message)
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
})

// Register Form Submit
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  console.log("[v0] Register form submitted")

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const password = document.getElementById("registerPassword").value
  const age = document.getElementById("registerAge").value

  console.log("[v0] Register attempt with email:", email)

  hideError(registerError)

  // Validate password
  if (password.length < 7) {
    showError(registerError, "Mật khẩu phải có ít nhất 7 ký tự")
    return
  }

  if (password.toLowerCase().includes("password")) {
    showError(registerError, 'Mật khẩu không được chứa từ "password"')
    return
  }

  // Show loading state
  const submitBtn = registerForm.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent
  submitBtn.textContent = "Đang đăng ký..."
  submitBtn.disabled = true

  try {
    const userData = { name, email, password }
    if (age) {
      userData.age = Number.parseInt(age)
    }

    console.log("[v0] Sending register request to:", `${API_URL}/users`)

    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    console.log("[v0] Register response status:", response.status)

    const data = await response.json()
    console.log("[v0] Register response data:", data)

    if (!response.ok) {
      throw new Error(data.error || "Đăng ký thất bại")
    }

    // Save token and user data
    localStorage.setItem("token", data.token)
    localStorage.setItem("user", JSON.stringify(data.user))

    console.log("[v0] Register successful, redirecting to dashboard")

    // Redirect to dashboard
<<<<<<< HEAD
    window.location.href = "/dashboard.html"
=======
    window.location.href = "/dashboard";
>>>>>>> fedb057 (new feat:personal page and file uploading)
  } catch (error) {
    console.error("[v0] Register error:", error)
    showError(registerError, error.message)
    submitBtn.textContent = originalText
    submitBtn.disabled = false
  }
})

// Helper Functions
function showError(element, message) {
  element.textContent = message
  element.classList.add("show")
}

function hideError(element) {
  element.textContent = ""
  element.classList.remove("show")
}

// Check if already logged in
if (localStorage.getItem("token")) {
<<<<<<< HEAD
  console.log("[v0] User already logged in, redirecting to dashboard")
  window.location.href = "/dashboard.html"
=======
  console.log("[v0] User already logged in, redirecting to dashboard");
  window.location.href = "/dashboard";
>>>>>>> fedb057 (new feat:personal page and file uploading)
}

console.log("[v0] Auth.js loaded, API URL:", API_URL)
