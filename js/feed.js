// feed.js

// Dummy issues with explicit timestamps for accurate sorting
// Timestamps are effectively "Date.now()" minus some time
const now = Date.now();
const hour = 3600 * 1000;

const issues = [
  {
    id: 42,
    timestamp: now - (2 * hour), // 2 hours ago
    title: "Fare overcharge on Asmani bus",
    route: "Uttara → Motijheel",
    area: "Airport Road",
    company: "Asmani Transport",
    timeAgo: "2 hours ago",
    category: "Fare Dispute",
    severity: "high",
    status: "in-progress",
    statusUpdated: "Police reviewing CCTV footage.",
    description: "Conductor charged 15tk extra. Multiple passengers protested.",
    // Total reacts: 12+3+5 = 20
    reactions: { support: 12, angry: 3, watch: 5 },
    // 2 Comments
    comments: [
      { author: "Rubayet", text: "Same bus, same issue yesterday!" },
      { author: "Anonymous", text: "Please check this entire route." }
    ]
  },
  {
    id: 37,
    timestamp: now - (5 * hour), // 5 hours ago
    title: "Harassment on Raida bus",
    route: "Mirpur-10 → Motijheel",
    area: "Farmgate",
    company: "Raida Limited",
    timeAgo: "5 hours ago",
    category: "Harassment",
    severity: "critical",
    status: "pending",
    statusUpdated: "Complaint received. Police team assigned.",
    description: "Passenger verbally harassed by another traveler. Conductor ignored it.",
    // Total reacts: 20+14+9 = 43 (Highest Reacts)
    reactions: { support: 20, angry: 14, watch: 9 },
    // 1 Comment
    comments: [{ author: "Passenger", text: "Thanks for speaking up." }]
  },
  {
    id: 53,
    timestamp: now - (24 * hour), // 1 day ago
    title: "Reckless driving",
    route: "Gabtoli → Jatrabari",
    area: "Jatrabari flyover",
    company: "City Link",
    timeAgo: "1 day ago",
    category: "Reckless Driving",
    severity: "medium",
    status: "resolved",
    statusUpdated: "Driver suspended for 7 days.",
    description: "Bus driver was changing lanes dangerously.",
    // Total reacts: 9+2+3 = 14
    reactions: { support: 9, angry: 2, watch: 3 },
    // 4 Comments (Most Comments)
    comments: [
      { author: "Commuter", text: "Ride feels safer today." },
      { author: "Admin", text: "Action taken." },
      { author: "User1", text: "Good job." },
      { author: "User2", text: "Finally." }
    ]
  }
];

// State
let currentFilter = "all";
let currentSort = "recent";

document.addEventListener("DOMContentLoaded", () => {
  
  // Initial Render
  applyFilterAndSort();

  // 1. Handle Filter Clicks (Status)
  const filterButtons = document.querySelectorAll(".filter-chip");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // UI Update
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      // Logic Update
      currentFilter = btn.dataset.filter;
      applyFilterAndSort();
    });
  });

  // 2. Handle Sort Clicks (Recent/Reacts/Comments)
  const sortButtons = document.querySelectorAll(".sort-chip");
  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // UI Update
      sortButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Logic Update
      currentSort = btn.dataset.sort;
      applyFilterAndSort();
    });
  });

  // Profile/Logout Mock
  const profileBtn = document.getElementById("profile-btn");
  if(profileBtn) profileBtn.addEventListener("click", () => alert("Profile coming soon!"));
});

function applyFilterAndSort() {
  let filtered = [...issues];

  // A. Filter by Status
  if (currentFilter !== "all") {
    filtered = filtered.filter((issue) => issue.status === currentFilter);
  }

  // B. Sort
  filtered.sort((a, b) => {
    if (currentSort === "recent") {
      // Newest (higher timestamp) first
      return b.timestamp - a.timestamp;
    } 
    else if (currentSort === "top-react") {
      // Total reactions count
      const reactsA = a.reactions.support + a.reactions.angry + a.reactions.watch;
      const reactsB = b.reactions.support + b.reactions.angry + b.reactions.watch;
      return reactsB - reactsA;
    } 
    else if (currentSort === "top-comment") {
      // Comment count
      return b.comments.length - a.comments.length;
    }
    return 0;
  });

  renderFeed(filtered);
}

function renderFeed(data) {
  const feedList = document.getElementById("feed-list");
  feedList.innerHTML = "";

  if (data.length === 0) {
    feedList.innerHTML = `
      <div style="text-align:center; padding:40px; color:#64748B;">
        <h3>No reports found</h3>
        <p>Try changing your filter settings.</p>
      </div>
    `;
    return;
  }

  data.forEach((issue, index) => {
    const card = document.createElement("article");
    card.className = "feed-card";
    // Stagger animation
    card.style.animationDelay = `${index * 0.05}s`;

    card.innerHTML = `
      <div class="feed-card-left">
        <div class="feed-card-header">
          <div class="feed-card-title">#${issue.id} – ${issue.title}</div>
          <div class="meta-pill ${issue.severity === 'critical' ? 'critical' : issue.severity === 'high' ? 'high' : 'normal'}">
            ${issue.category}
          </div>
        </div>

        <div class="feed-card-meta">
          <span class="area-chip">🏢 ${issue.company}</span>
          <span class="area-chip">🕒 ${issue.timeAgo}</span>
          <span class="area-chip">📍 ${issue.area}</span>
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
          <button class="comment-toggle">
            💬 ${issue.comments.length} Comments
          </button>
        </div>

        <div class="comments-container">
          <div class="comment-list">
            ${issue.comments.map(c => `
              <div class="comment-item">
                <span class="comment-author">${c.author}:</span>
                <span>${c.text}</span>
              </div>
            `).join("")}
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
            <span>Status</span>
            <span class="status-state">${formatStatus(issue.status)}</span>
          </div>
          <div class="status-bar">
            <div class="status-step ${['pending','in-progress','resolved'].includes(issue.status) ? 'active' : ''}"></div>
            <div class="status-step ${['in-progress','resolved'].includes(issue.status) ? 'active' : ''}"></div>
            <div class="status-step ${issue.status === 'resolved' ? 'active' : ''}"></div>
          </div>
          <div class="status-tags">
            <span>Pending</span>
            <span>Progress</span>
            <span>Resolved</span>
          </div>
          <div class="status-meta">
            ${issue.statusUpdated}
          </div>
        </div>
      </div>
    `;

    // 1. Reaction Logic
    const reactionButtons = card.querySelectorAll(".reaction-btn");
    reactionButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        issue.reactions[type]++;
        btn.querySelector(".count").textContent = issue.reactions[type];
        // Note: Real sorting won't update until you re-click sort button
      });
    });

    // 2. Comment Toggle
    const toggle = card.querySelector(".comment-toggle");
    const commentsContainer = card.querySelector(".comments-container");
    toggle.addEventListener("click", () => {
      commentsContainer.classList.toggle("open");
    });

    // 3. Comment Submit
    const form = card.querySelector(".comment-form");
    const input = card.querySelector(".comment-input");
    const list = card.querySelector(".comment-list");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      
      // Update data
      issue.comments.push({ author: "You", text: text });
      
      // Update UI immediately
      const newComment = document.createElement("div");
      newComment.className = "comment-item";
      newComment.innerHTML = `<span class="comment-author">You:</span> <span>${text}</span>`;
      list.appendChild(newComment);
      input.value = "";
      
      // Update count text
      toggle.textContent = `💬 ${issue.comments.length} Comments`;
    });

    feedList.appendChild(card);
  });
}

function formatStatus(status) {
  if (status === "pending") return "Pending";
  if (status === "in-progress") return "Working";
  if (status === "resolved") return "Resolved";
  return status;
}