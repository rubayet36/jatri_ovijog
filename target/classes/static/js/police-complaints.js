// police-complaints.js - Modernized Logic

// ===== Complaints Data =====
let complaintsData = [];

// Load complaints from backend
async function loadComplaints() {
  try {
    const token = localStorage.getItem("token");
    const resp = await fetch("/api/complaints", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await resp.json();
    if (resp.ok) {
      // Map Supabase keys to camelCase expected by UI
      complaintsData = data.map((c) => {
        return {
          ...c,
          busName: c.bus_name ?? c.busName ?? "",
          busNumber: c.bus_number ?? c.busNumber ?? "",
          imageUrl: c.image_url ?? c.imageUrl ?? "",
          reporterType: c.reporter_type ?? c.reporterType ?? "",
          createdAt: c.created_at ?? c.createdAt ?? "",
        };
      });
    } else {
      console.error("Failed to load complaints", data);
      complaintsData = [];
    }
  } catch (err) {
    console.error("Error fetching complaints:", err);
    complaintsData = [];
  }
}

// ===== State =====
let selectedThana = "all";
let selectedStatus = "all";
let searchQuery = "";

// ===== Init =====
document.addEventListener("DOMContentLoaded", async () => {
  initFilters();
  await loadComplaints();
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
            <button class="complaint-btn" onclick="openCase(${c.id})">Details</button>
<button class="complaint-btn btn-primary-ghost" onclick="openCase(${c.id})">Open Case</button>

          </div>
        </div>
      </div>
    `;
    // Build a lifecycle timeline to visualise the complaint's status.
    const lifecycle = ['submitted', 'verified', 'assigned', 'in-progress', 'resolved', 'closed'];
    const currentIndex = lifecycle.indexOf(c.status.toLowerCase());
    let timelineHtml = '<div class="complaint-timeline">';
    lifecycle.forEach((step, idx) => {
      let cls = '';
      if (idx < currentIndex) cls = 'completed';
      else if (idx === currentIndex) cls = 'active';
      timelineHtml += '<div class="timeline-step ' + cls + '">' + step.replace(/-/g, ' ') + '</div>';
    });
    timelineHtml += '</div>';
    card.innerHTML += timelineHtml;
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

// ==========================
// Case Modal (Open Case)
// ==========================
function safe(v) {
  return (v === null || v === undefined || v === "") ? "-" : String(v);
}

function fmtDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString();
}

function getById(id) {
  return complaintsData.find(x => Number(x.id) === Number(id));
}

function closeCaseModal() {
  const modal = document.getElementById("caseModal");
  if (modal) modal.classList.add("hidden");
}

function wireCaseModalClose() {
  const close1 = document.getElementById("caseModalClose");
  const close2 = document.getElementById("caseModalClose2");
  const modal = document.getElementById("caseModal");

  if (close1) close1.onclick = closeCaseModal;
  if (close2) close2.onclick = closeCaseModal;

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeCaseModal();
    });
  }
}

// Make it available for onclick="openCase(id)"
window.openCase = function (id) {
  const c = getById(id);
  if (!c) return;

  const title = document.getElementById("caseModalTitle");
  const body = document.getElementById("caseModalBody");
  const modal = document.getElementById("caseModal");
  if (!title || !body || !modal) return;

  title.textContent = `Case #${c.id} • ${safe(c.category)}`;

  const imgUrl = c.imageUrl || "";
  const imgHtml = imgUrl
    ? `
      <div class="case-image">
        <img src="${imgUrl}" alt="Evidence" onerror="this.style.display='none'">
        <div>
          <div class="row" style="margin-bottom:10px;">
            <b>Evidence</b>
            <span><a href="${imgUrl}" target="_blank" rel="noreferrer">${imgUrl}</a></span>
          </div>
          <div class="row">
            <b>Reporter Type</b>
            <span>${safe(c.reporterType)}</span>
          </div>
        </div>
      </div>`
    : `<div class="row" style="margin-top:12px;"><b>Evidence</b><span>No image provided</span></div>`;

  body.innerHTML = `
    <div class="case-grid">
      <div class="row"><b>Status</b><span>${safe(formatStatus(c.status))}</span></div>
      <div class="row"><b>Created</b><span>${fmtDateTime(c.createdAt)}</span></div>

      <div class="row"><b>Thana</b><span>${safe(c.thana)}</span></div>
      <div class="row"><b>Route</b><span>${safe(c.route)}</span></div>

      <div class="row"><b>Bus Name</b><span>${safe(c.busName)}</span></div>
      <div class="row"><b>Bus Number</b><span>${safe(c.busNumber)}</span></div>

      <div class="row"><b>User ID</b><span>${safe(c.user_id ?? c.userId)}</span></div>
      <div class="row"><b>Category</b><span>${safe(c.category)}</span></div>
    </div>

    <div class="case-desc">
      <b>Description</b>
      <p>${safe(c.description)}</p>
    </div>

    ${imgHtml}
  `;

  modal.classList.remove("hidden");
};

// Ensure modal close handlers exist
document.addEventListener("DOMContentLoaded", wireCaseModalClose);
