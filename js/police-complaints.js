// police-complaints.js - Modernized Logic

// ===== Dummy Data =====
const complaintsData = [
  {
    id: 42,
    category: "Fare Dispute",
    status: "in-progress",
    thana: "Uttara East",
    route: "Uttara → Motijheel",
    busName: "Asmani",
    busNumber: "DHA-12-3456",
    imageUrl: "./assets/bus-fare.jpg",
    createdAt: "2025-12-05T09:30:00Z",
    reporterType: "Registered User",
    description: "Conductor charged 15tk extra. Multiple passengers protested and were threatened when they refused to pay.",
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
    description: "Passenger verbally harassed near Farmgate. Conductor did not intervene when requested.",
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
    description: "Driver was speeding on Jatrabari flyover and braking hard. Several passengers fell.",
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
    description: "Refused student discount. Staff behavior was aggressive.",
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
    description: "Repeated harassment on the same bus number. Needs immediate review.",
  },
];

// ===== State =====
let selectedThana = "all";
let selectedStatus = "all";
let searchQuery = "";

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  initFilters();
  renderComplaints();
  renderHotspots();
});

// ===== Filters =====
function initFilters() {
  const searchInput = document.getElementById("searchInput");
  const thanaSelect = document.getElementById("thanaFilter");
  const statusSelect = document.getElementById("statusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderComplaints();
    });
  }

  if (thanaSelect) {
    thanaSelect.addEventListener("change", (e) => {
      selectedThana = e.target.value;
      renderComplaints();
    });
  }

  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => {
      selectedStatus = e.target.value.toLowerCase(); // Ensure lowercase matching
      renderComplaints();
    });
  }
}

// ===== Rendering =====
function renderComplaints() {
  const container = document.getElementById("policeComplaintsList");
  if (!container) return;

  // Filter Data
  const filtered = complaintsData.filter(c => {
    const matchesSearch = 
      c.busName.toLowerCase().includes(searchQuery) || 
      c.busNumber.toLowerCase().includes(searchQuery) ||
      String(c.id).includes(searchQuery);
    
    const matchesThana = selectedThana === "all" || c.thana === selectedThana;
    
    // Normalize status for comparison
    const dataStatus = c.status.toLowerCase();
    const filterStatus = selectedStatus.toLowerCase();
    const matchesStatus = filterStatus === "all" || dataStatus === filterStatus;

    return matchesSearch && matchesThana && matchesStatus;
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-queue">No complaints found matching your filters.</div>`;
    return;
  }

  filtered.forEach(c => {
    const card = document.createElement("div");
    // Add 'bus-hot' class if this bus appears more than once in the data set (simple logic)
    const isRepeatOffender = complaintsData.filter(x => x.busNumber === c.busNumber).length > 1;
    card.className = `complaint-card ${isRepeatOffender ? 'bus-hot' : ''}`;

    card.innerHTML = `
      <div class="complaint-image-wrap">
        <img src="${c.imageUrl}" alt="Evidence" onerror="this.src='./assets/bus-generic.jpg'">
      </div>
      
      <div class="complaint-content">
        <div class="complaint-row-top">
          <div>
            <div class="complaint-id">#${c.id} · ${c.category}</div>
            <div class="complaint-bus">${c.busName} (${c.busNumber})</div>
          </div>
          <span class="status-badge status-${c.status.toLowerCase()}">${formatStatus(c.status)}</span>
        </div>

        <div class="complaint-tags">
          <span class="tag-pill tag-thana">📍 ${c.thana}</span>
          <span class="tag-pill tag-route">🚌 ${c.route}</span>
          <span class="tag-pill tag-category">🏷️ ${c.reporterType}</span>
        </div>

        <p class="complaint-desc">${c.description}</p>

        <div class="complaint-meta-row">
          <div class="complaint-meta">
            <span>📅 ${new Date(c.createdAt).toLocaleDateString()}</span>
            <span>⏰ ${new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          </div>
          <div class="complaint-actions">
            <button class="complaint-btn" onclick="alert('View details #${c.id}')">Details</button>
            <button class="complaint-btn btn-primary-ghost" onclick="alert('Open Case #${c.id}')">Open Case</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderHotspots() {
  const container = document.getElementById("busHotspotsList");
  if (!container) return;

  // Group by bus number
  const counts = {};
  complaintsData.forEach(c => {
    if (!counts[c.busNumber]) {
      counts[c.busNumber] = { count: 0, name: c.busName, route: c.route };
    }
    counts[c.busNumber].count++;
  });

  // Convert to array and sort
  const sorted = Object.entries(counts)
    .map(([num, data]) => ({ num, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5

  container.innerHTML = "";
  sorted.forEach(bus => {
    const item = document.createElement("div");
    item.className = "bus-hotspot-item";
    item.onclick = () => {
        document.getElementById("searchInput").value = bus.num;
        searchQuery = bus.num.toLowerCase();
        renderComplaints();
    };

    item.innerHTML = `
      <div>
        <span class="bus-hotspot-title">${bus.name} (${bus.num})</span>
        <span class="bus-hotspot-sub">${bus.route}</span>
      </div>
      <span class="bus-hotspot-count">${bus.count} Reports</span>
    `;
    container.appendChild(item);
  });
}

// ===== Helpers =====
function formatStatus(st) {
  if (st === 'in-progress') return 'In Progress';
  return st.charAt(0).toUpperCase() + st.slice(1);
}