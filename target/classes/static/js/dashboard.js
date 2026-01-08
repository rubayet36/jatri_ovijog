// =============== DATA FROM BACKEND ===============

// All complaints loaded from the backend
let dashboardComplaints = [];

// Fetch complaints from backend and normalize keys
async function fetchDashboardComplaints() {
  try {
    const token = localStorage.getItem("token");
    const resp = await fetch("/api/complaints", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.error("Failed to fetch complaints", data);
      dashboardComplaints = [];
      return;
    }
    dashboardComplaints = data.map((c) => {
      return {
        ...c,
        busName: c.bus_name ?? c.busName ?? "",
        busNumber: c.bus_number ?? c.busNumber ?? "",
        createdAt: c.created_at ?? c.createdAt ?? "",
        status: (c.status || "").toLowerCase(),
      };
    });
  } catch (err) {
    console.error("Error loading complaints", err);
    dashboardComplaints = [];
  }
}

// =============== STATS ===============

function loadDashboardStats() {
  const total = dashboardComplaints.length;
  // Pending/new statuses (treat 'new', 'pending', 'in-progress', 'submitted' as pending)
  const pending = dashboardComplaints.filter((c) => {
    const st = (c.status || "").toLowerCase();
    return ["new", "pending", "in-progress", "submitted"].includes(st);
  }).length;
  const resolved = dashboardComplaints.filter((c) => {
    const st = (c.status || "").toLowerCase();
    return st === "resolved" || st === "closed";
  }).length;
  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-pending").textContent = pending;
  document.getElementById("stat-resolved").textContent = resolved;
}

// =============== COMPANY COMPLAINTS CHART ===============

function loadCompanyComplaintsChart() {
  const ctx = document.getElementById("companyComplaintsChart");
  if (!ctx) return;
  // Group complaints by bus/company name
  const counts = {};
  dashboardComplaints.forEach((c) => {
    const company = c.busName || "Unknown";
    counts[company] = (counts[company] || 0) + 1;
  });
  const labels = Object.keys(counts);
  const values = labels.map((l) => counts[l]);
  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Number of Complaints",
          data: values,
          backgroundColor: "rgba(75, 192, 192, 0.3)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
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

// =============== COMPLAINTS OVERVIEW CHART ===============

function loadComplaintsOverviewChart() {
  const ctx = document.getElementById("complaintsOverviewChart");
  if (!ctx) return;
  // Build overview by category/type
  const categories = {};
  dashboardComplaints.forEach((c) => {
    const type = (c.category || "other").toLowerCase().replace(/\s+/g, "-");
    if (!categories[type]) {
      categories[type] = { resolved: 0, pending: 0, fake: 0 };
    }
    const st = (c.status || "").toLowerCase();
    if (st === "resolved" || st === "closed") categories[type].resolved++;
    else if (st === "fake") categories[type].fake++;
    else categories[type].pending++;
  });
  const labels = Object.keys(categories).map((t) => t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, " "));
  const resolvedData = Object.values(categories).map((cat) => cat.resolved);
  const pendingData = Object.values(categories).map((cat) => cat.pending);
  const fakeData = Object.values(categories).map((cat) => cat.fake);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Resolved",
        data: resolvedData,
        backgroundColor: "rgba(34, 197, 94, 0.7)",
      },
      {
        label: "Pending",
        data: pendingData,
        backgroundColor: "rgba(249, 115, 22, 0.8)",
      },
      {
        label: "Fake",
        data: fakeData,
        backgroundColor: "rgba(239, 68, 68, 0.8)",
      },
    ],
  };
  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
      },
      scales: {
        x: { grid: { color: "#E5E7EB" } },
        y: { grid: { color: "#E5E7EB" } },
      },
    },
  });
}

// =============== RECENT COMPLAINTS (RIGHT COLUMN) ===============

function loadRecentComplaints() {
  const container = document.getElementById("recentComplaintsList");
  if (!container) return;
  container.innerHTML = "";
  // Sort complaints by createdAt descending and take top 5
  const sorted = [...dashboardComplaints]
    .filter((c) => c.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  sorted.forEach((c) => {
    const item = document.createElement("div");
    item.classList.add("complaint-item");
    const status = String(c.status || "").toLowerCase();
    if (status === "resolved" || status === "closed") item.classList.add("status-resolved");
    else if (status === "pending" || status === "new" || status === "in-progress") item.classList.add("status-pending");
    else if (status === "fake") item.classList.add("status-fake");
    // Determine type label
    const typeLabel = formatType((c.category || "").replace(/\s+/g, "-"));
    const submittedBy = c.reporterName || c.reporter_type || c.reporterType || "Anonymous";
    // Build HTML
    let html = `<p><strong>ID:</strong> ${c.id}</p>`;
    html += `<p><strong>Type:</strong> ${typeLabel}</p>`;
    html += `<p><strong>Description:</strong> ${c.description || ""}</p>`;
    html += `<p><strong>Status:</strong> <span class="complaint-status">${status}</span></p>`;
    if (c.route) {
      html += `<p><strong>Route:</strong> ${c.route}</p>`;
    }
    if (c.thana) {
      html += `<p><strong>Thana:</strong> ${c.thana}</p>`;
    }
    html += `<p><strong>Submitted by:</strong> ${submittedBy}</p>`;
    item.innerHTML = html;
    container.appendChild(item);
  });
}

function formatType(type) {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}

// =============== TRUSTED ROUTES ===============

function loadTrustedRoutes() {
  const container = document.getElementById("trustedRoutes");
  if (!container) return;

  container.innerHTML = "";
  if (dashboardComplaints.length === 0) {
    container.innerHTML = "<p>No route data available.</p>";
    return;
  }
  // Count complaints per route
  const counts = {};
  dashboardComplaints.forEach((c) => {
    const route = c.route || "Unknown";
    counts[route] = (counts[route] || 0) + 1;
  });
  // Determine safety status: 0–1 complaints -> safe, 2–3 -> watch, >3 -> caution
  const routeData = Object.entries(counts).map(([route, count]) => {
    let status;
    if (count <= 1) status = "safe";
    else if (count <= 3) status = "watch";
    else status = "caution";
    return { route, count, status };
  });
  // Sort by ascending count (safer routes first)
  routeData.sort((a, b) => a.count - b.count);
  routeData.slice(0, 5).forEach((r) => {
    const chip = document.createElement("button");
    chip.className = `trusted-chip trusted-${r.status}`;
    let label;
    if (r.status === "safe") label = "No serious complaints recently";
    else if (r.status === "watch") label = "Some complaints reported";
    else label = "Multiple complaints reported";
    chip.textContent = `✅ ${r.route} – ${label}`;
    container.appendChild(chip);
  });
}

// =============== INIT ===============

document.addEventListener("DOMContentLoaded", async () => {
  // Load complaints from backend first
  await fetchDashboardComplaints();
  // Populate all dashboard sections
  loadDashboardStats();
  loadCompanyComplaintsChart();
  loadComplaintsOverviewChart();
  loadRecentComplaints();
  loadTrustedRoutes();
  const fareBtn = document.getElementById("btnCalculateFare");
  if (fareBtn) {
    fareBtn.addEventListener("click", () => {
      fareBtn.classList.add("quick-btn-pulse");
      setTimeout(() => {
        fareBtn.classList.remove("quick-btn-pulse");
        window.location.href = "fare.html"; // your fare page
      }, 220);
    });
  }
});
