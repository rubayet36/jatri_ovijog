// feed.js

// Dummy issues to render
const issues = [
  {
    id: 42,
    title: "Fare overcharge on Asmani bus",
    route: "Uttara → Motijheel",
    area: "Airport Road",
    company: "Asmani Transport",
    timeAgo: "2 hours ago",
    category: "Fare Dispute",
    severity: "high",
    status: "in-progress", // pending | in-progress | resolved
    statusUpdated: "Police reviewing CCTV footage.",
    description:
      "Conductor charged a higher fare than the government-approved rate. Multiple passengers faced the same issue and protested.",
    reactions: { support: 12, angry: 3, watch: 5 },
    comments: [
      { author: "Rubayet", text: "Same bus, same issue yesterday!" },
      { author: "Anonymous", text: "Please check this entire route." }
    ]
  },
  {
    id: 37,
    title: "Harassment on Raida bus",
    route: "Mirpur-10 → Motijheel",
    area: "Farmgate",
    company: "Raida Limited",
    timeAgo: "5 hours ago",
    category: "Harassment",
    severity: "critical",
    status: "pending",
    statusUpdated: "Complaint received. Police team assigned.",
    description:
      "Passenger verbally harassed by another traveler. Conductor did not intervene despite repeated requests.",
    reactions: { support: 20, angry: 14, watch: 9 },
    comments: [{ author: "Passenger", text: "Thanks for speaking up." }]
  },
  {
    id: 53,
    title: "Reckless driving and sudden braking",
    route: "Gabtoli → Jatrabari",
    area: "Jatrabari flyover",
    company: "City Link",
    timeAgo: "1 day ago",
    category: "Reckless Driving",
    severity: "medium",
    status: "resolved",
    statusUpdated: "Company warned; driver suspended for 7 days.",
    description:
      "Bus driver was driving aggressively, changing lanes constantly and braking hard, causing passengers to fall.",
    reactions: { support: 9, angry: 2, watch: 3 },
    comments: [
      { author: "Commuter", text: "Ride feels safer today. Thank you." }
    ]
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const feedList = document.getElementById("feed-list");
  const filterButtons = document.querySelectorAll(".filter-chip");

  renderFeed(issues);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.dataset.filter;
      const filtered =
        filter === "all"
          ? issues
          : issues.filter((issue) => issue.status === filter);
      renderFeed(filtered);
    });
  });

  // Basic profile/logout behaviour
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () =>
      alert("Profile panel coming soon!")
    );
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () =>
      alert("Sign out (wire to login page later).")
    );
  }
});

function renderFeed(data) {
  const feedList = document.getElementById("feed-list");
  feedList.innerHTML = "";

  data.forEach((issue, index) => {
    const card = document.createElement("article");
    card.className = "feed-card";
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
      <div class="feed-card-left">
        <div class="feed-card-header">
          <div class="feed-card-title">ID: ${issue.id} – ${
      issue.title
    }</div>
          <div class="meta-pill ${
            issue.severity === "critical"
              ? "red"
              : issue.severity === "high"
              ? "orange"
              : "green"
          }">
            ${issue.category}
          </div>
        </div>

        <div class="feed-card-meta">
          <span class="meta-pill">Company: ${issue.company}</span>
          <span class="meta-pill">Reported: ${issue.timeAgo}</span>
          <span class="area-chip">📍 ${issue.area}</span>
          <span class="area-chip">🚌 Route: ${issue.route}</span>
        </div>

        <div class="feed-card-description">
          ${issue.description}
        </div>

        <div class="feed-card-actions">
          <div class="reaction-group">
            <button class="reaction-btn" data-type="support">
              👍 <span class="count">${issue.reactions.support}</span>
            </button>
            <button class="reaction-btn" data-type="angry">
              😡 <span class="count">${issue.reactions.angry}</span>
            </button>
            <button class="reaction-btn" data-type="watch">
              👀 <span class="count">${issue.reactions.watch}</span>
            </button>
          </div>
          <button class="comment-toggle">View comments</button>
        </div>

        <div class="comments-container">
          <div class="comment-list">
            ${issue.comments
              .map(
                (c) => `
              <div class="comment-item">
                <span class="comment-author">${c.author}:</span>
                <span>${c.text}</span>
              </div>`
              )
              .join("")}
          </div>
          <form class="comment-form">
            <input class="comment-input" type="text" placeholder="Add a comment..." />
            <button class="comment-submit" type="submit">Post</button>
          </form>
        </div>
      </div>

      <div class="feed-card-right">
        <div class="status-tracker">
          <div class="status-tracker-header">
            <span class="status-label">Police Action</span>
            <span class="status-state">${formatStatus(issue.status)}</span>
          </div>
          <div class="status-bar">
            <div class="status-step ${
              issue.status === "pending" ||
              issue.status === "in-progress" ||
              issue.status === "resolved"
                ? "active"
                : ""
            }"></div>
            <div class="status-step ${
              issue.status === "in-progress" || issue.status === "resolved"
                ? "active"
                : ""
            }"></div>
            <div class="status-step ${
              issue.status === "resolved" ? "active" : ""
            }"></div>
          </div>
          <div class="status-tags">
            <span>Pending</span>
            <span>In Progress</span>
            <span>Resolved</span>
          </div>
          <div class="status-meta">
            ${issue.statusUpdated}
          </div>
        </div>
      </div>
    `;

    // Reaction logic
    const reactionButtons = card.querySelectorAll(".reaction-btn");
    reactionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        issue.reactions[type]++;
        const countSpan = btn.querySelector(".count");
        countSpan.textContent = issue.reactions[type];
      });
    });

    // Comment toggle
    const toggle = card.querySelector(".comment-toggle");
    const commentsContainer = card.querySelector(".comments-container");
    toggle.addEventListener("click", () => {
      commentsContainer.classList.toggle("open");
      toggle.textContent = commentsContainer.classList.contains("open")
        ? "Hide comments"
        : "View comments";
    });

    // Comment submit (front-end only)
    const form = card.querySelector(".comment-form");
    const input = card.querySelector(".comment-input");
    const list = card.querySelector(".comment-list");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const newComment = document.createElement("div");
      newComment.className = "comment-item";
      newComment.innerHTML = `
        <span class="comment-author">You:</span>
        <span>${text}</span>
      `;
      list.appendChild(newComment);
      input.value = "";
    });

    feedList.appendChild(card);
  });
}

function formatStatus(status) {
  if (status === "pending") return "Pending review";
  if (status === "in-progress") return "Police working on it";
  if (status === "resolved") return "Resolved";
  return status;
}
