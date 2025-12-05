// =============== DUMMY DATA ===============

// Stats for "Your Statistics"
const dummyStats = {
  total_reports: 32,
  pending: 23,
  resolved: 7,
};

// Complaints per company (for bar chart)
const dummyCompanyComplaints = [
  { company: "Company A", count: 10 },
  { company: "Company B", count: 7 },
  { company: "Company C", count: 5 },
  { company: "Company D", count: 3 },
];

// Complaints overview by type (for stacked bar chart)
const dummyComplaintsOverview = [
  { type: "fare-dispute", resolved: 12, pending: 5, fake: 1 },
  { type: "harassment", resolved: 6, pending: 3, fake: 0 },
  { type: "reckless-driving", resolved: 4, pending: 2, fake: 1 },
];

// Recent complaints list (right side)
const dummyRecentComplaints = [
  {
    id: 42,
    type: "fare-dispute",
    description:
      "On [insert date and time], while traveling on an Asmani bus from Uttora to Ideal, I encountered a fare dispute. The conductor charged an amount higher than the government-approved fare.",
    status: "resolved",
    location: "Dhaka, Uttara to Ideal",
    user_name: "Rubayet",
    file_path: null,
  },
  {
    id: 41,
    type: "fare-dispute",
    description:
      "Bus was over crowded, but the driver was still taking passengers and overcharging the fare.",
    status: "pending",
    location: "Dhaka",
    user_name: "Rubayet",
    file_path: null,
  },
  {
    id: 37,
    type: "harassment",
    description:
      "On [insert date and time], I was traveling on a Raida bus from Mirpur to Motijheel when a fellow passenger verbally harassed me.",
    status: "pending",
    location: "Mirpur to Motijheel",
    user_name: "Anonymous",
    file_path: null,
  },
];


// =============== STATS ===============

function loadDashboardStats() {
  document.getElementById("stat-total").textContent =
    dummyStats.total_reports ?? 0;
  document.getElementById("stat-pending").textContent =
    dummyStats.pending ?? 0;
  document.getElementById("stat-resolved").textContent =
    dummyStats.resolved ?? 0;
}


// =============== COMPANY COMPLAINTS CHART ===============

function loadCompanyComplaintsChart() {
  const ctx = document.getElementById("companyComplaintsChart");
  if (!ctx) return;

  const labels = dummyCompanyComplaints.map((item) => item.company);
  const counts = dummyCompanyComplaints.map((item) => item.count);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Number of Complaints",
          data: counts,
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

  const labels = dummyComplaintsOverview.map((item) =>
    item.type.charAt(0).toUpperCase() +
    item.type.slice(1).replace(/-/g, " ")
  );

  const chartData = {
    labels,
    datasets: [
      {
        label: "Resolved",
        data: dummyComplaintsOverview.map((item) => item.resolved),
        backgroundColor: "rgba(34, 197, 94, 0.7)",
      },
      {
        label: "Pending",
        data: dummyComplaintsOverview.map((item) => item.pending),
        backgroundColor: "rgba(249, 115, 22, 0.8)",
      },
      {
        label: "Fake",
        data: dummyComplaintsOverview.map((item) => item.fake),
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

  dummyRecentComplaints.forEach((c) => {
    const item = document.createElement("div");
    item.classList.add("complaint-item");

    const status = String(c.status || "").toLowerCase();
    if (status === "resolved") {
      item.classList.add("status-resolved");
    } else if (status === "pending") {
      item.classList.add("status-pending");
    } else if (status === "fake") {
      item.classList.add("status-fake");
    }

    item.innerHTML = `
      <p><strong>ID:</strong> ${c.id}</p>
      <p><strong>Type:</strong> ${formatType(c.type)}</p>
      <p><strong>Description:</strong> ${c.description}</p>
      <p>
        <strong>Status:</strong>
        <span class="complaint-status">${status}</span>
      </p>
      ${c.location ? `<p><strong>Location:</strong> ${c.location}</p>` : ""}
      <p><strong>Submitted by:</strong> ${c.user_name}</p>
    `;

    const actions = document.createElement("div");
    actions.classList.add("complaint-actions");

    // Just to demo the buttons / styles
    if (status === "pending") {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.classList.add("btn-delete");
      deleteBtn.addEventListener("click", () => {
        item.remove();
        alert(`(Dummy) Deleted complaint #${c.id}`);
      });
      actions.appendChild(deleteBtn);
    }

    if (status === "fake") {
      const reportBtn = document.createElement("button");
      reportBtn.textContent = "Report Issue";
      reportBtn.classList.add("btn-report");
      reportBtn.addEventListener("click", () => {
        alert("(Dummy) Report Issue clicked");
      });
      actions.appendChild(reportBtn);
    }

    if (actions.children.length) {
      item.appendChild(actions);
    }

    container.appendChild(item);
  });
}

function formatType(type) {
  if (!type) return "";
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ");
}


// =============== INIT ===============

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
  loadCompanyComplaintsChart();
  loadComplaintsOverviewChart();
  loadRecentComplaints();

  const fareBtn = document.getElementById("btnCalculateFare");
  if (fareBtn) {
    fareBtn.addEventListener("click", () => {
      window.location.href = "fare.html";
    });
  }
});
