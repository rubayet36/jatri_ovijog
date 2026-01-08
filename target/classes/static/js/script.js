// script.js – login

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stop normal POST

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const accountTypeEl = document.querySelector(
      "input[name='accountType']:checked"
    );

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    if (!accountTypeEl) {
      alert("Please select whether you are User or Police.");
      return;
    }

    try {
      const resp = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        alert(data.error || "Invalid credentials");
        return;
      }
      // Save the JWT and user object for subsequent API calls
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));

      // Determine target dashboard based on returned role or selected radio
      const role = (data.user && data.user.role) || accountTypeEl.value;
      const targetDashboard = role === "police" ? "police-dashboard.html" : "dashboard.html";
      sessionStorage.setItem("targetDashboard", targetDashboard);
      // Navigate to intro page for animation
      window.location.href = "intro.html";
    } catch (err) {
      console.error(err);
      alert("An error occurred while logging in.");
    }
  });
});
