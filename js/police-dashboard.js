// police-dashboard.js
// Dummy front-end data & UI for Police Dashboard

// ===== Dummy stats =====
const policeStats = {
  new_cases: 5,
  in_progress: 7,
  resolved: 18,
  fake_cases: 2,
};

// ===== Dummy complaints (queue) =====
const policeComplaints = [
  {
    id: 42,
    type: "Fare Dispute",
    description:
      "Asmani bus overcharging passengers on Airport Road. Multiple passengers reported higher than government fare.",
    status: "in-progress", // new | pending | in-progress | resolved | fake
    priority: "high", // low | medium | high | critical
    thana: "Uttara East",
    route: "Uttara → Motijheel",
    created_at: "2025-12-05T09:30:00Z",
    assigned_team: "Fare & Fraud Cell",
  },
  {
    id: 37,
    type: "Harassment",
    description:
      "Passenger verbally harassed on Raida bus near Farmgate. Conductor did not intervene.",
    status: "pending",
    priority: "critical",
    thana: "Tejgaon",
    route: "Mirpur-10 → Motijheel",
    created_at: "2025-12-05T14:05:00Z",
    assigned_team: "Women & Child Safety Cell",
  },
  {
    id: 53,
    type: "Reckless Driving",
    description:
      "City Link bus driving aggressively on Jatrabari flyover, sudden braking, passengers fell inside.",
    status: "resolved",
    priority: "medium",
    thana: "Jatrabari",
    route: "Gabtoli → Jatrabari",
    created_at: "2025-12-04T18:20:00Z",
    assigned_team: "Traffic Enforcement",
  },
  {
    id: 61,
    type: "Fare Dispute",
    description:
      "Conductor refused to accept student discount and threatened to drop passenger mid-route.",
    status: "new",
    priority: "high",
    thana: "Mohammadpur",
    route: "Shyamoli → Motijheel",
    created_at: "2025-12-06T07:50:00Z",
    assigned_team: "Fare & Fraud Cell",
  },
  {
    id: 70,
    type: "Fake Report",
    description:
      "Report flagged as suspicious by multiple contradicting statements. Under verification.",
    status: "fake",
    priority: "low",
    thana: "Banani",
    route: "Gulshan → Banani",
    created_at: "2025-12-03T11:15:00Z",
    assigned_team: "Internal Review",
  },
];

// ===== Dummy emergency alerts =====
const emergencyAlerts = [
  {
    id: 101,
    location: "Farmgate",
    time: "2025-12-06T18:10:00Z",
    level: "critical",
    note: "SOS triggered with 10-second voice clip. Possible harassment.",
  },
  {
    id: 102,
    location: "Mirpur-10",
    time: "2025-12-06T17:45:00Z",
    level: "high",
    note: "Multiple SOS triggers in same 30-minute window.",
  },
  {
    id: 103,
    location: "Jatrabari",
    time: "2025-12-06T16:05:00Z",
    level: "medium",
    note: "Reckless driving alert from passenger.",
  },
];

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderPoliceStats();
  renderStatusChart();
  renderCategoryChart();
  renderComplaintsQueue();
  renderEmergencyAlerts();

  const statusFilter = document.getElementById("queueStatusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      renderComplaintsQueue(statusFilter.value);
    });
  }
});

// ===== Stats =====
function renderPoliceStats() {
  document.getElementById("police-new").textContent =
    policeStats.new_cases ?? 0;
  document.getElementById("police-in-progress").textContent =
    policeStats.in_progress ?? 0;
  document.getElementById("police-resolved").textContent =
    policeStats.resolved ?? 0;
  document.getElementById("police-fake").textContent =
    policeStats.fake_cases ?? 0;

  const now = new Date();
  document.getElementById("police-last-updated").textContent =
    now.toLocaleString();
}

// ===== Charts =====
function renderStatusChart() {
  const ctx = document.getElementById("policeStatusChart");
  if (!ctx) return;

  const counts = {
    new: 0,
    pending: 0,
    "in-progress": 0,
    resolved: 0,
    fake: 0,
  };

  policeComplaints.forEach((c) => {
    const st = c.status.toLowerCase();
    if (counts[st] !== undefined) counts[st]++;
  });

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["New", "Pending", "In Progress", "Resolved", "Fake"],
      datasets: [
        {
          data: [
            counts.new,
            counts.pending,
            counts["in-progress"],
            counts.resolved,
            counts.fake,
          ],
          backgroundColor: [
            "rgba(59,130,246,0.7)", // new
            "rgba(234,179,8,0.8)",  // pending
            "rgba(56,189,248,0.8)", // in-progress
            "rgba(34,197,94,0.8)",  // resolved
            "rgba(248,113,113,0.8)", // fake
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById("policeCategoryChart");
  if (!ctx) return;

  const categoryCounts = {};

  policeComplaints.forEach((c) => {
    const key = c.type;
    categoryCounts[key] = (categoryCounts[key] || 0) + 1;
  });

  const labels = Object.keys(categoryCounts);
  const values = labels.map((l) => categoryCounts[l]);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Cases",
          data: values,
          backgroundColor: "rgba(159, 175, 98, 0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: "#E5E7EB" } },
        y: { grid: { color: "#E5E7EB" } },
      },
    },
  });
}

// ===== Complaints queue =====
function renderComplaintsQueue(filterStatus = "all") {
  const container = document.getElementById("activeComplaintsList");
  if (!container) return;

  container.innerHTML = "";

  const filtered = policeComplaints.filter((c) => {
    if (filterStatus === "all") {
      // only show non-resolved & non-fake as "active"
      return c.status !== "resolved" && c.status !== "fake";
    }
    return c.status.toLowerCase() === filterStatus.toLowerCase();
  });

  if (!filtered.length) {
    container.innerHTML =
      '<p class="empty-queue">No complaints match this filter.</p>';
    return;
  }

  filtered.forEach((c) => {
    const card = document.createElement("div");
    card.className = "police-complaint-card";

    const priorityClass =
      c.priority === "critical"
        ? "priority-critical"
        : c.priority === "high"
        ? "priority-high"
        : "";

    const statusClass = getStatusClass(c.status);

    card.innerHTML = `
      <div class="police-complaint-header">
        <div class="police-complaint-title">
          #${c.id} · ${c.type}
        </div>
        <div class="priority-pill ${priorityClass}">
          Priority: ${capitalize(c.priority)}
        </div>
      </div>
      <div class="police-complaint-meta">
        <span class="police-tag">📍 ${c.thana}</span>
        <span class="police-tag">🚌 ${c.route}</span>
        <span class="police-tag">🕒 ${new Date(
          c.created_at
        ).toLocaleString()}</span>
      </div>
      <p>${c.description}</p>
      <div class="police-complaint-footer">
        <span class="police-status-pill ${statusClass}">
          Status: ${formatStatus(c.status)}
        </span>
        <div class="police-actions">
          <button class="police-action-btn" data-action="progress">
            Mark in progress
          </button>
          <button class="police-action-btn" data-action="resolve">
            Mark resolved
          </button>
        </div>
      </div>
    `;

    const [progressBtn, resolveBtn] = card.querySelectorAll(".police-action-btn");

    progressBtn.addEventListener("click", () => {
      c.status = "in-progress";
      renderComplaintsQueue(filterStatus);
    });

    resolveBtn.addEventListener("click", () => {
      c.status = "resolved";
      // also bump stats in UI for demo
      policeStats.resolved++;
      renderPoliceStats();
      renderComplaintsQueue(filterStatus);
    });

    container.appendChild(card);
  });
}

function getStatusClass(status) {
  const st = status.toLowerCase();
  if (st === "new") return "status-new";
  if (st === "pending") return "status-pending";
  if (st === "in-progress") return "status-in-progress";
  if (st === "resolved") return "status-resolved";
  if (st === "fake") return "status-fake";
  return "";
}

function formatStatus(status) {
  if (!status) return "";
  const s = status.toLowerCase();
  if (s === "in-progress") return "In progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ===== Emergency alerts =====
function renderEmergencyAlerts() {
  const container = document.getElementById("emergencyAlertsList");
  if (!container) return;

  container.innerHTML = "";

  emergencyAlerts.forEach((a) => {
    const item = document.createElement("div");
    item.className = "emergency-item";

    item.innerHTML = `
      <div class="emergency-top-row">
        <span class="emergency-id">Alert #${a.id}</span>
        <span class="emergency-time">
          ${new Date(a.time).toLocaleString()}
        </span>
      </div>
      <div class="emergency-location">
        📍 ${a.location}
      </div>
      <div class="emergency-level">
        Level: ${capitalize(a.level)}
      </div>
      <p class="emergency-note">${a.note}</p>
    `;

    container.appendChild(item);
  });
}
