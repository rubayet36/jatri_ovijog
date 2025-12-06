// police-complaints.js
// Dummy data & UI logic for Complaints page in police portal

// ===== Dummy complaints data =====
// Later you will replace this with real API data from Spring Boot
const complaintsData = [
  {
    id: 42,
    category: "Fare Dispute",
    status: "in-progress", // new | pending | in-progress | resolved | fake
    thana: "Uttara East",
    route: "Uttara → Motijheel",
    busName: "Asmani",
    busNumber: "DHA-12-3456",
    imageUrl: "./assets/bus-fare.jpg", // use your own image or placeholder
    createdAt: "2025-12-05T09:30:00Z",
    reporterType: "Registered User",
    description:
      "Conductor charged more than approved fare on Airport Road. Multiple passengers protested.",
  },
  {
    id: 37,
    category: "Harassment",
    status: "pending",
    thana: "Tejgaon",
    route: "Mirpur-10 → Motijheel",
    busName: "Raida Limited",
    busNumber: "DHA-15-9988",
    imageUrl: "./assets/bus-harassment.jpg",
    createdAt: "2025-12-05T14:05:00Z",
    reporterType: "Anonymous",
    description:
      "Passenger verbally harassed near Farmgate. Conductor did not intervene when requested.",
  },
  {
    id: 53,
    category: "Reckless Driving",
    status: "resolved",
    thana: "Jatrabari",
    route: "Gabtoli → Jatrabari",
    busName: "City Link",
    busNumber: "DHA-17-2211",
    imageUrl: "./assets/bus-reckless.jpg",
    createdAt: "2025-12-04T18:20:00Z",
    reporterType: "Registered User",
    description:
      "Driver was speeding on Jatrabari flyover and braking hard. Several passengers fell inside the bus.",
  },
  {
    id: 61,
    category: "Fare Dispute",
    status: "new",
    thana: "Mohammadpur",
    route: "Shyamoli → Motijheel",
    busName: "Shyamoli",
    busNumber: "DHA-19-4432",
    imageUrl: "./assets/bus-fare-2.jpg",
    createdAt: "2025-12-06T07:50:00Z",
    reporterType: "Student",
    description:
      "Conductor refused to accept student discount and threatened to drop the passenger mid-route.",
  },
  {
    id: 70,
    category: "Fare Dispute",
    status: "fake",
    thana: "Banani",
    route: "Gulshan → Banani",
    busName: "North City",
    busNumber: "DHA-11-4521",
    imageUrl: "./assets/bus-generic.jpg",
    createdAt: "2025-12-03T11:15:00Z",
    reporterType: "Unknown",
    description:
      "Report marked as suspicious after verification; route and timings did not match GPS data.",
  },
  {
    id: 81,
    category: "Harassment",
    status: "pending",
    thana: "Mirpur",
    route: "Mirpur-10 → Motijheel",
    busName: "Raida Limited",
    busNumber: "DHA-15-9988",
    imageUrl: "./assets/bus-harassment.jpg",
    createdAt: "2025-12-06T08:30:00Z",
    reporterType: "Registered User",
    description:
      "Repeated verbal harassment on same bus number. Passenger felt unsafe and had to step off.",
  },
  {
    id: 82,
    category: "Harassment",
    status: "resolved",
    thana: "Mirpur",
    route: "Mirpur-10 → Motijheel",
    busName: "Raida Limited",
    busNumber: "DHA-15-9988",
    imageUrl: "./assets/bus-harassment.jpg",
    createdAt: "2025-11-30T19:20:00Z",
    reporterType: "Registered User",
    description:
      "Earlier harassment case on same bus number. Conductor was warned and CCTV footage reviewed.",
  },
];

// ===== Global filter state =====
let selectedThana = "all";
let selectedStatus = "all";
let selectedCategory = "all";
let searchQuery = "";

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  initThanaFilter();
  initStatusFilter();
  initCategoryFilter();
  initSearchFilter();

  renderComplaints();
  renderBusHotspots();
  renderBusSummary();
});

// ===== Filters =====

function initThanaFilter() {
  const select = document.getElementById("thanaFilter");
  if (!select) return;

  const uniqueThanas = Array.from(
    new Set(complaintsData.map((c) => c.thana))
  ).sort();

  select.innerHTML = `
    <option value="all">All thanas</option>
    ${uniqueThanas.map((t) => `<option value="${t}">${t}</option>`).join("")}
  `;

  select.addEventListener("change", () => {
    selectedThana = select.value;
    renderComplaints();
  });
}

function initStatusFilter() {
  const container = document.getElementById("statusPills");
  if (!container) return;

  const pills = container.querySelectorAll(".status-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      selectedStatus = pill.dataset.status || "all";
      renderComplaints();
    });
  });
}

function initCategoryFilter() {
  const container = document.getElementById("categoryPills");
  if (!container) return;

  const pills = container.querySelectorAll(".category-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      pills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      selectedCategory = pill.dataset.cat || "all";
      renderComplaints();
    });
  });
}

function initSearchFilter() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    searchQuery = input.value.trim().toLowerCase();
    renderComplaints();
  });
}

// ===== Data helpers =====

// group by busNumber
function groupByBus() {
  const map = {};
  complaintsData.forEach((c) => {
    const key = c.busNumber;
    if (!map[key]) {
      map[key] = {
        busNumber: c.busNumber,
        busName: c.busName,
        route: c.route,
        thanas: new Set(),
        total: 0,
        openCases: 0,
        categories: new Set(),
        lastSeen: null,
      };
    }
    const g = map[key];
    g.total++;
    if (c.status !== "resolved" && c.status !== "fake") {
      g.openCases++;
    }
    g.thanas.add(c.thana);
    g.categories.add(c.category);

    const created = new Date(c.createdAt);
    if (!g.lastSeen || created > g.lastSeen) {
      g.lastSeen = created;
    }
  });
  // transform sets to arrays
  return Object.values(map).map((g) => ({
    ...g,
    thanas: Array.from(g.thanas),
    categories: Array.from(g.categories),
  }));
}

// ===== Rendering complaints list =====
function renderComplaints() {
  const container = document.getElementById("policeComplaintsList");
  const countBadge = document.getElementById("complaintsCount");
  if (!container) return;

  const busGroups = groupByBus();
  const busCounts = {};
  busGroups.forEach((b) => {
    busCounts[b.busNumber] = b.total;
  });

  // apply filters
  let list = complaintsData.filter((c) => {
    if (selectedThana !== "all" && c.thana !== selectedThana) return false;
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    if (selectedCategory !== "all" && c.category !== selectedCategory)
      return false;

    if (searchQuery) {
      const combo =
        `${c.id} ${c.busName} ${c.busNumber} ${c.route} ${c.thana} ${c.category}`.toLowerCase();
      if (!combo.includes(searchQuery)) return false;
    }

    return true;
  });

  // sort: buses with most complaints first, then newest first
  list.sort((a, b) => {
    const countA = busCounts[a.busNumber] || 0;
    const countB = busCounts[b.busNumber] || 0;
    if (countB !== countA) return countB - countA;

    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  container.innerHTML = "";

  if (countBadge) {
    countBadge.textContent = `${list.length} complaints shown`;
  }

  if (!list.length) {
    container.innerHTML =
      '<p class="empty-queue">No complaints match this filter.</p>';
    return;
  }

  list.forEach((c) => {
    const card = document.createElement("div");
    card.className = "complaint-card";

    const totalForBus = busCounts[c.busNumber] || 0;
    const isHotBus = totalForBus >= 3; // threshold for "many complaints"
    if (isHotBus) {
      card.classList.add("bus-hot");
    }

    const statusClass = getStatusClass(c.status);

    card.innerHTML = `
      ${
        isHotBus
          ? `<span class="bus-repeat-flag">${totalForBus} reports for this bus</span>`
          : ""
      }
      <div class="complaint-image-wrap">
        <img src="${c.imageUrl}" alt="Bus photo for complaint ${c.id}" onerror="this.src='./assets/bus-placeholder.jpg'" />
      </div>
      <div class="complaint-content">
        <div class="complaint-row-top">
          <div>
            <div class="complaint-id">#${c.id} · ${c.category}</div>
            <div class="complaint-bus">${c.busName} (${c.busNumber})</div>
          </div>
          <span class="status-badge ${statusClass}">
            ${formatStatus(c.status)}
          </span>
        </div>

        <div class="complaint-tags">
          <span class="tag-pill tag-category">${c.category}</span>
          <span class="tag-pill tag-thana">${c.thana}</span>
          <span class="tag-pill tag-route">${c.route}</span>
        </div>

        <p class="complaint-desc">
          ${truncateText(c.description, 160)}
        </p>

        <div class="complaint-meta-row">
          <div class="complaint-meta">
            <span>🕒 ${new Date(c.createdAt).toLocaleString()}</span>
            <span>👤 ${c.reporterType}</span>
          </div>
          <div class="complaint-actions">
            <button class="complaint-btn">View details</button>
            <button class="complaint-btn">Open case file</button>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// ===== Buses with most complaints =====
function renderBusHotspots() {
  const container = document.getElementById("busHotspotsList");
  if (!container) return;

  const grouped = groupByBus();
  // sort by total complaints desc
  grouped.sort((a, b) => b.total - a.total);

  container.innerHTML = "";

  if (!grouped.length) {
    container.innerHTML = "<p>No bus data available.</p>";
    return;
  }

  grouped.slice(0, 5).forEach((bus) => {
    const item = document.createElement("div");
    item.className = "bus-hotspot-item";

    const catText = bus.categories.join(", ");
    const thanasText = bus.thanas.join(", ");

    item.innerHTML = `
      <div class="bus-hotspot-meta">
        <span class="bus-hotspot-title">${bus.busName} (${bus.busNumber})</span>
        <span class="bus-hotspot-sub">
          🚌 ${bus.route}
        </span>
        <span class="bus-hotspot-sub">
          📍 ${thanasText} • ${catText}
        </span>
      </div>
      <span class="bus-hotspot-count">${bus.total} reports</span>
    `;

    // click could later open filtered view just for this bus
    item.addEventListener("click", () => {
      // fast filter by this bus in list
      searchQuery = bus.busNumber.toLowerCase();
      const searchInput = document.getElementById("searchInput");
      if (searchInput) searchInput.value = bus.busNumber;
      renderComplaints();
    });

    container.appendChild(item);
  });
}

// ===== Summary =====
function renderBusSummary() {
  const list = document.getElementById("busSummaryList");
  if (!list) return;

  const totalComplaints = complaintsData.length;
  const openComplaints = complaintsData.filter(
    (c) => c.status !== "resolved" && c.status !== "fake"
  ).length;
  const harassmentCount = complaintsData.filter(
    (c) => c.category === "Harassment"
  ).length;
  const fareDisputeCount = complaintsData.filter(
    (c) => c.category === "Fare Dispute"
  ).length;
  const recklessCount = complaintsData.filter(
    (c) => c.category === "Reckless Driving"
  ).length;

  const grouped = groupByBus();
  const busesOverThreshold = grouped.filter((b) => b.total >= 3).length;

  list.innerHTML = `
    <li><strong>${totalComplaints}</strong> total complaints</li>
    <li><strong>${openComplaints}</strong> active / pending cases</li>
    <li><strong>${harassmentCount}</strong> harassment, <strong>${fareDisputeCount}</strong> fare disputes, <strong>${recklessCount}</strong> reckless driving</li>
    <li><strong>${busesOverThreshold}</strong> buses flagged as high-risk (3+ complaints)</li>
  `;
}

// ===== Helpers =====
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

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
