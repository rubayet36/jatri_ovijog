// script.js – login

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // stop normal POST

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const accountType = document.querySelector(
      "input[name='accountType']:checked"
    );

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    if (!accountType) {
      alert("Please select whether you are User or Police.");
      return;
    }

    // Decide which dashboard to go to later
    const targetDashboard =
      accountType.value === "police"
        ? "police-dashboard.html" // if you make this later
        : "dashboard.html";

    // Store next page so intro.html knows where to send user
    sessionStorage.setItem("targetDashboard", targetDashboard);

    // Go to animated intro page
    window.location.href = "intro.html";
  });
});
