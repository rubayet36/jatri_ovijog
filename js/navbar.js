// navbar.js

document.addEventListener("DOMContentLoaded", () => {
  setupNavSlider();
  setupBurger();
  setupProfileLogout();
  setupThemeToggle();
});

function setupNavSlider() {
  const nav = document.getElementById("nav-pill");
  const slider = document.getElementById("nav-slider");
  const links = Array.from(document.querySelectorAll(".nav-pill-link"));

  if (!nav || !slider || links.length === 0) return;

  const currentPage = getCurrentPageKey();
  let activeLink =
    links.find((link) => link.dataset.page === currentPage) || links[0];

  links.forEach((link) => link.classList.remove("active"));
  activeLink.classList.add("active");
  moveSliderTo(nav, slider, activeLink);

  window.addEventListener("resize", () => {
    const currentActive =
      links.find((link) => link.classList.contains("active")) || links[0];
    moveSliderTo(nav, slider, currentActive);
  });

  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      links.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      moveSliderTo(nav, slider, link);

      const href = link.getAttribute("href");
      setTimeout(() => {
        window.location.href = href;
      }, 220);
    });
  });
}

function moveSliderTo(nav, slider, element) {
  const navRect = nav.getBoundingClientRect();
  const elRect = element.getBoundingClientRect();

  const left = elRect.left - navRect.left;
  const width = elRect.width;

  slider.style.transform = `translateX(${left}px)`;
  slider.style.width = `${width}px`;
}

function getCurrentPageKey() {
  const path = window.location.pathname;
  const file = path.split("/").pop() || "dashboard.html";
  return file.replace(".html", "") || "dashboard";
}

// Mobile burger
function setupBurger() {
  const header = document.querySelector(".full-navbar");
  const toggle = document.querySelector(".nav-toggle");
  if (!header || !toggle) return;

  toggle.addEventListener("click", () => {
    header.classList.toggle("is-open");
  });
}

// Profile / logout buttons
function setupProfileLogout() {
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      alert("Open Profile Panel (later)!");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Sign Out Clicked");
      window.location.href = "index.html"; // adjust if your login page name differs
    });
  }
}

// Dark mode toggle
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const root = document.documentElement;
  const stored = localStorage.getItem("theme");

  if (stored === "dark") {
    root.setAttribute("data-theme", "dark");
    btn.textContent = "☀️";
  } else {
    root.setAttribute("data-theme", "light");
    btn.textContent = "🌙";
  }

  btn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    btn.textContent = next === "dark" ? "☀️" : "🌙";
  });
}
