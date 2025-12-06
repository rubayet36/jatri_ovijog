// police-dashboard.js
// Dummy front-end data & UI for Police Dashboard, now with heatmap

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
    status: "in-progress",
    priority: "high",
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

// ===== Dummy incident points for heatmap =====
// lat/lng values target Dhaka-ish locations, lastSeenHoursAgo indicates recency
const incidentPoints = [
  {
    thana: "Farmgate",
    route: "Mirpur-10 → Motijheel",
    type: "Harassment",
    lat: 23.7529,
    lng: 90.3929,
    count: 5,
    lastSeenHoursAgo: 3,
  },
  {
    thana: "Airport Road",
    route: "Uttara → Motijheel",
    type: "Fare Dispute",
    lat: 23.8430,
    lng: 90.4000,
    count: 4,
    lastSeenHoursAgo: 8,
  },
  {
    thana: "Jatrabari",
    route: "Gabtoli → Jatrabari",
    type: "Reckless Driving",
    lat: 23.7100,
    lng: 90.4500,
    count: 6,
    lastSeenHoursAgo: 30,
  },
  {
    thana: "Mohammadpur",
    route: "Shyamoli → Motijheel",
    type: "Fare Dispute",
    lat: 23.7647,
    lng: 90.3580,
    count: 2,
    lastSeenHoursAgo: 10,
  },
  {
    thana: "Banani",
    route: "Gulshan → Banani",
    type: "Fake Report",
    lat: 23.7936,
    lng: 90.4043,
    count: 1,
    lastSeenHoursAgo: 80,
  },
  {
    thana: "Mirpur-10",
    route: "Mirpur-10 → Motijheel",
    type: "Harassment",
    lat: 23.8067,
    lng: 90.3683,
    count: 3,
    lastSeenHoursAgo: 15,
  },
];
let heatMapLeaflet = null; // L.map instance
let heatCircleLayers = []; // store circle overlays
// the L.map instance

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderPoliceStats();
  renderStatusChart();
  renderCategoryChart();
  renderComplaintsQueue();
  renderEmergencyAlerts();
  initHeatmap(); // NEW
      computeForecast(); // NEW

  const statusFilter = document.getElementById("queueStatusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      renderComplaintsQueue(statusFilter.value);
    });
  }

  const heatTimeFilter = document.getElementById("heatTimeFilter");
  if (heatTimeFilter) {
    heatTimeFilter.addEventListener("change", () => {
      const value = heatTimeFilter.value; // "24", "168", "720", "all"
      renderHeatLayer(value);
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
            "rgba(59,130,246,0.7)",
            "rgba(234,179,8,0.8)",
            "rgba(56,189,248,0.8)",
            "rgba(34,197,94,0.8)",
            "rgba(248,113,113,0.8)",
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

    const [progressBtn, resolveBtn] =
      card.querySelectorAll(".police-action-btn");

    progressBtn.addEventListener("click", () => {
      c.status = "in-progress";
      renderComplaintsQueue(filterStatus);
    });

    resolveBtn.addEventListener("click", () => {
      c.status = "resolved";
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
// ======== HEATMAP (circle-style) ========

function initHeatmap() {
  const mapContainer = document.getElementById("policeHeatmap");
  if (!mapContainer || typeof L === "undefined") return;

  // Create map centered on Dhaka only once
  heatMapLeaflet = L.map("policeHeatmap", {
    zoomControl: false,
  }).setView([23.8103, 90.4125], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(heatMapLeaflet);

  // First render with default filter (30 days)
  const timeFilterSelect = document.getElementById("heatTimeFilter");
  const val = timeFilterSelect ? timeFilterSelect.value : "720";
  renderHeatLayer(val);
}

function renderHeatLayer(hoursFilter) {
  if (!heatMapLeaflet || typeof L === "undefined") return;

  // Remove previous circles
  heatCircleLayers.forEach((layer) => {
    heatMapLeaflet.removeLayer(layer);
  });
  heatCircleLayers = [];

  let maxHours = null;
  if (hoursFilter !== "all") {
    maxHours = parseInt(hoursFilter, 10);
  }

  const filteredPoints = incidentPoints.filter((p) => {
    if (maxHours == null) return true;
    return p.lastSeenHoursAgo <= maxHours;
  });

  // Add big colored circles
  filteredPoints.forEach((p) => {
    // Decide intensity level from count
    let color = "#38bdf8"; // low (blue)
    let fillOpacity = 0.35;
    let radius = 250; // meters

    if (p.count >= 5) {
      // high
      color = "#ef4444"; // red
      fillOpacity = 0.5;
      radius = 550;
    } else if (p.count >= 3) {
      // medium
      color = "#f97316"; // orange
      fillOpacity = 0.45;
      radius = 400;
    }

    const circle = L.circle([p.lat, p.lng], {
      radius: radius,
      color: color,
      weight: 1.5,
      fillColor: color,
      fillOpacity: fillOpacity,
    }).addTo(heatMapLeaflet);

    circle.bindPopup(
      `<strong>${p.thana}</strong><br/>${p.route}<br/>` +
        `${p.type} · ${p.count} report(s)`
    );

    heatCircleLayers.push(circle);
  });

  // Optionally fit bounds if we have points
  if (filteredPoints.length) {
    const bounds = L.latLngBounds(
      filteredPoints.map((p) => [p.lat, p.lng])
    );
    heatMapLeaflet.fitBounds(bounds, { padding: [20, 20] });
  }

  renderHotspotList(filteredPoints);
}

function renderHotspotList(points) {
  const list = document.getElementById("heatHotspotList");
  if (!list) return;

  list.innerHTML = "";

  if (!points.length) {
    list.innerHTML = `<p>No incidents in this time window.</p>`;
    return;
  }

  // aggregate by thana / route
  const groups = {};
  points.forEach((p) => {
    const key = `${p.thana} | ${p.route}`;
    if (!groups[key]) {
      groups[key] = {
        thana: p.thana,
        route: p.route,
        totalCount: 0,
        avgLat: 0,
        avgLng: 0,
        types: new Set(),
      };
    }
    const g = groups[key];
    g.totalCount += p.count;
    g.avgLat += p.lat * p.count;
    g.avgLng += p.lng * p.count;
    g.types.add(p.type);
  });

  const aggregated = Object.values(groups).map((g) => {
    const totalWeight = g.totalCount || 1;
    return {
      thana: g.thana,
      route: g.route,
      totalCount: g.totalCount,
      lat: g.avgLat / totalWeight,
      lng: g.avgLng / totalWeight,
      types: Array.from(g.types),
    };
  });

  // sort desc by totalCount & show top 5
  aggregated.sort((a, b) => b.totalCount - a.totalCount);
  const top = aggregated.slice(0, 5);

  top.forEach((h) => {
    const item = document.createElement("div");
    item.className = "hotspot-item";
    item.innerHTML = `
      <div class="hotspot-meta">
        <span class="hotspot-title">${h.thana}</span>
        <span class="hotspot-issues">
          🚌 ${h.route} • ${h.types.join(", ")}
        </span>
      </div>
      <span class="hotspot-count-pill">${h.totalCount} reports</span>
    `;
    item.addEventListener("click", () => {
      if (heatMapLeaflet) {
        heatMapLeaflet.setView([h.lat, h.lng], 13);
      }
    });
    list.appendChild(item);
  });
}
// ===== Forecast: simple "next hotspots" model =====
function computeForecast() {
  const list = document.getElementById("forecastList");
  if (!list) return;

  // Aggregate by thana using incidentPoints + open complaints
  const scores = {}; // thana -> {score, harassment, reckless, fare, sosLike}

  const ensure = (thana) => {
    if (!scores[thana]) {
      scores[thana] = {
        thana,
        score: 0,
        harassment: 0,
        reckless: 0,
        fare: 0,
        openCases: 0,
      };
    }
    return scores[thana];
  };

  // incidents (heatmap points)
  incidentPoints.forEach((p) => {
    const g = ensure(p.thana);
    // recent incidents (<= 24h) weighted higher
    const timeWeight = p.lastSeenHoursAgo <= 24 ? 2 : p.lastSeenHoursAgo <= 72 ? 1 : 0.5;
    const countWeight = p.count;
    g.score += countWeight * timeWeight;

    if (p.type === "Harassment") g.harassment += p.count;
    if (p.type === "Reckless Driving") g.reckless += p.count;
    if (p.type === "Fare Dispute") g.fare += p.count;
  });

  // open complaints (from queue data)
  policeComplaints.forEach((c) => {
    const st = c.status.toLowerCase();
    if (st === "resolved" || st === "fake") return;
    const g = ensure(c.thana);
    g.openCases++;
    // open complaints add extra risk
    g.score += 3;
    if (c.type === "Harassment") g.harassment++;
    if (c.type === "Reckless Driving") g.reckless++;
    if (c.type === "Fare Dispute") g.fare++;
  });

  const arr = Object.values(scores).filter((g) => g.score > 0);
  if (!arr.length) {
    list.innerHTML = "<li>No risk forecast yet.</li>";
    return;
  }

  arr.sort((a, b) => b.score - a.score);
  const top = arr.slice(0, 3);

  list.innerHTML = "";
  top.forEach((g) => {
    const li = document.createElement("li");
    li.className = "forecast-item";

    const level =
      g.score >= 25 ? "Critical" : g.score >= 15 ? "High" : "Elevated";

    const issues = [];
    if (g.harassment) issues.push(`Harassment (${g.harassment})`);
    if (g.reckless) issues.push(`Reckless (${g.reckless})`);
    if (g.fare) issues.push(`Fare (${g.fare})`);

    li.innerHTML = `
      <div class="forecast-main">
        <span class="forecast-title">${g.thana}</span>
        <span class="forecast-badge">${level} risk</span>
      </div>
      <div class="forecast-detail">
        Likely hotspot this evening based on recent reports.
      </div>
      <div class="forecast-detail">
        Top issues: ${issues.join(", ") || "mixed incidents"}.
      </div>
      <div class="forecast-detail">
        Open cases: ${g.openCases}
      </div>
    `;

    list.appendChild(li);
  });
}
