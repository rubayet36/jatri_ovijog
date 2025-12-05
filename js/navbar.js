// navbar.js

document.addEventListener("DOMContentLoaded", () => {
  // ===== HAMBURGER TOGGLE (MOBILE) =====
  const header = document.querySelector(".full-navbar");
  const toggle = document.querySelector(".nav-toggle");

  if (header && toggle) {
    toggle.addEventListener("click", () => {
      header.classList.toggle("is-open");
      toggle.classList.toggle("open");
    });
  }

  // ===== PILL NAV SLIDER =====
  const nav = document.getElementById("nav-pill");
  const slider = document.getElementById("nav-slider");
  const links = Array.from(document.querySelectorAll(".nav-pill-link"));

  if (nav && slider && links.length) {
    const currentPage = getCurrentPageKey(); // "dashboard", "feed", "report", "emergency"
    let activeLink =
      links.find((link) => link.dataset.page === currentPage) || links[0];

    // initial active state
    links.forEach((link) => link.classList.remove("active"));
    activeLink.classList.add("active");
    moveSliderTo(nav, slider, activeLink);

    // realign on resize
    window.addEventListener("resize", () => {
      const currentActive =
        links.find((link) => link.classList.contains("active")) || links[0];
      moveSliderTo(nav, slider, currentActive);
    });

    // click: animate then navigate
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

  // ===== PROFILE / LOGOUT BUTTONS =====
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      alert("Profile panel coming later!");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      alert("Sign out – wire this to login later.");
      window.location.href = "index.html";
    });
  }
});

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
