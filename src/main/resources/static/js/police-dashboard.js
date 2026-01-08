// police-dashboard.js - Full Code

// =========================================
// 1. DATA LOADED FROM BACKEND (Command Center)
// =========================================

// Dynamic stats and lists
let policeStats = { new_cases: 0, in_progress: 0, resolved: 0, fake_cases: 0 };
let policeComplaints = [];
let emergencyAlerts = [];

// Heatmap placeholder (Leaflet map). Without real lat/lon data in complaints, we won't display incident points.
let heatMapLeaflet = null;

// Fetch complaints and emergencies from backend and compute stats
async function fetchPoliceData() {
  try {
    // Fetch complaints
    const token = localStorage.getItem("token");
    const cResp = await fetch("/api/complaints", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const cData = await cResp.json();
    if (cResp.ok) {
      policeComplaints = cData.map((c) => {
        // Normalize keys
        const status = (c.status || "").toLowerCase();
        const type = c.category || "Other";
        // Derive priority based on status or category
        let priority = "medium";
        const catLower = (type || "").toLowerCase();
        if (status === "in-progress" || catLower.includes("harass")) priority = "high";
        else if (status === "pending" || status === "new") priority = "medium";
        else if (status === "resolved") priority = "low";
        return {
          id: c.id,
          type,
          description: c.description || "",
          status,
          priority,
          thana: c.thana || "",
          route: c.route || "",
          created_at: c.created_at || c.createdAt || "",
        };
      });
      // Compute stats
      const stats = { new_cases: 0, in_progress: 0, resolved: 0, fake_cases: 0 };
      policeComplaints.forEach((c) => {
        const st = c.status;
        if (st === "new" || st === "pending") stats.new_cases++;
        else if (st === "in-progress" || st === "working") stats.in_progress++;
        else if (st === "resolved" || st === "closed") stats.resolved++;
        else if (st === "fake") stats.fake_cases++;
        else stats.new_cases++;
      });
      policeStats = stats;
    } else {
      console.error("Failed to load complaints", cData);
      policeComplaints = [];
    }
    // Fetch emergency reports
    const eResp = await fetch("/api/emergencies", {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const eData = await eResp.json();
    if (eResp.ok) {
      emergencyAlerts = eData.map((e) => {
        const time = e.created_at || e.createdAt || new Date().toISOString();
        // Determine level by accuracy or always high
        let level = "medium";
        if (e.accuracy && e.accuracy <= 10) level = "critical";
        else if (e.accuracy && e.accuracy <= 50) level = "high";
        else level = "medium";
        const loc = (e.latitude && e.longitude) ? `Lat ${e.latitude.toFixed(4)}, Lng ${e.longitude.toFixed(4)}` : "Unknown location";
        return {
          id: e.id,
          location: loc,
          time,
          level,
          note: e.description || "SOS triggered",
        };
      });
    } else {
      console.error("Failed to load emergencies", eData);
      emergencyAlerts = [];
    }
  } catch (err) {
    console.error("Error loading police data", err);
    policeComplaints = [];
    emergencyAlerts = [];
    policeStats = { new_cases: 0, in_progress: 0, resolved: 0, fake_cases: 0 };
  }
}

// =========================================
// 2. INITIALIZATION
// =========================================

document.addEventListener("DOMContentLoaded", async () => {
  // Fetch data first
  await fetchPoliceData();
  // Render dynamic data
  renderPoliceStats();
  renderStatusChart();
  renderCategoryChart();
  renderComplaintsQueue("all");
  renderEmergencyAlerts();
  // Heatmap requires geographic data; only init if we have lat/lon values
  //initHeatmap();
  //computeForecast();
  // Filter Event Listener
  const filter = document.getElementById("queueStatusFilter");
  if (filter) {
    filter.addEventListener("change", (e) => {
      renderComplaintsQueue(e.target.value);
    });
  }
});

// =========================================
// 3. CORE FUNCTIONS
// =========================================

function renderPoliceStats() {
  setText("police-new", policeStats.new_cases);
  setText("police-in-progress", policeStats.in_progress);
  setText("police-resolved", policeStats.resolved);
  setText("police-fake", policeStats.fake_cases);
  setText("police-last-updated", new Date().toLocaleTimeString());
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// --- CHARTS (Using Chart.js) ---

function renderStatusChart() {
  const ctx = document.getElementById("policeStatusChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["New", "Working", "Closed", "Fake"],
      datasets: [
        {
          data: [policeStats.new_cases, policeStats.in_progress, policeStats.resolved, policeStats.fake_cases],
          backgroundColor: [
            "#3B82F6", // Blue (New)
            "#F59E0B", // Amber (Working)
            "#10B981", // Emerald (Closed)
            "#EF4444", // Red (Fake)
          ],
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "75%",
      plugins: {
        legend: { position: "right", labels: { font: { family: "Inter" }, boxWidth: 12 } },
      },
    },
  });
}

function renderCategoryChart() {
  const ctx = document.getElementById("policeCategoryChart");
  if (!ctx) return;

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Fare", "Harassment", "Reckless", "Theft"],
      datasets: [
        {
          label: "Reports",
          data: [15, 8, 12, 5],
          backgroundColor: "#0F172A", // Slate 900
          borderRadius: 4,
          barThickness: 24,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: "Inter" } } },
        y: { grid: { color: "#F1F5F9" }, border: { display: false } },
      },
    },
  });
}

// --- QUEUE LIST ---

function renderComplaintsQueue(filter) {
  const list = document.getElementById("activeComplaintsList");
  if (!list) return;
  list.innerHTML = "";

  const filtered = policeComplaints.filter((c) => 
    filter === "all" ? true : c.status === filter
  );

  if (filtered.length === 0) {
    list.innerHTML = `<div style="padding:20px; text-align:center; color:#64748B;">No cases found.</div>`;
    return;
  }

  filtered.forEach((c) => {
    const card = document.createElement("div");
    card.className = "police-complaint-card";
    
    // Priority Color Logic
    const priorityColor = c.priority === 'critical' ? '#EF4444' : (c.priority === 'high' ? '#F97316' : '#64748B');

    card.innerHTML = `
      <div class="police-complaint-header">
        <span>#${c.id} · ${c.type}</span>
        <span style="color:${priorityColor}; text-transform:uppercase; font-size:11px;">${c.priority}</span>
      </div>
      <div style="margin-bottom:8px;">
        <span class="police-tag">📍 ${c.thana}</span>
        <span class="police-tag">🚌 ${c.route}</span>
      </div>
      <p style="font-size:13px; color:#334155; line-height:1.4; margin-bottom:12px;">
        ${c.description}
      </p>
      <div class="police-actions">
        <button class="police-action-btn" onclick="alert('Opening Case #${c.id}...')">Open Case</button>
        <button class="police-action-btn" onclick="alert('Resolving Case #${c.id}...')">Resolve</button>
      </div>
    `;
    list.appendChild(card);
  });
}

// --- EMERGENCY ALERTS ---

function renderEmergencyAlerts() {
  const list = document.getElementById("emergencyAlertsList");
  if (!list) return;
  list.innerHTML = "";

  emergencyAlerts.forEach((a) => {
    const item = document.createElement("div");
    item.className = "emergency-item";
    
    const timeStr = new Date(a.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <span class="emergency-id">ALERT #${a.id}</span>
        <span style="font-size:11px; font-weight:700;">${timeStr}</span>
      </div>
      <div style="font-size:13px; font-weight:600; margin-bottom:2px;">📍 ${a.location}</div>
      <div style="font-size:12px; color:#7F1D1D;">${a.note}</div>
    `;
    list.appendChild(item);
  });
}

// --- HEATMAP (Leaflet) ---

function initHeatmap() {
  const mapId = "policeHeatmap";
  if (!document.getElementById(mapId) || typeof L === "undefined") return;

  // Initialize Map
  heatMapLeaflet = L.map(mapId, { zoomControl: false }).setView([23.78, 90.40], 12);

  // Light tiles for professional look
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap, &copy; CartoDB'
  }).addTo(heatMapLeaflet);

  // Add Circles
  incidentPoints.forEach((p) => {
    // Color logic: Red for high count, Blue for low
    let color = p.count >= 5 ? "#EF4444" : "#0EA5E9"; 
    let radius = p.count * 120; // Size based on count

    L.circle([p.lat, p.lng], {
      color: color,
      fillColor: color,
      fillOpacity: 0.4,
      radius: radius,
      weight: 1
    }).addTo(heatMapLeaflet)
      .bindPopup(`<b>${p.thana}</b><br>${p.type}<br>${p.count} Reports`);
  });

  renderHotspots();
}

function renderHotspots() {
  const list = document.getElementById("heatHotspotList");
  if (!list) return;
  
  // Sort by count descending
  const topSpots = [...incidentPoints].sort((a,b) => b.count - a.count).slice(0, 3);

  topSpots.forEach(p => {
    const item = document.createElement("div");
    item.className = "hotspot-item";
    item.innerHTML = `
      <div>
        <div style="font-weight:600;">${p.thana}</div>
        <div style="font-size:11px; color:#64748B;">${p.type}</div>
      </div>
      <div style="font-weight:700; color:#EF4444;">${p.count}</div>
    `;
    // Click to zoom
    item.addEventListener("click", () => {
      if(heatMapLeaflet) heatMapLeaflet.setView([p.lat, p.lng], 14);
    });
    list.appendChild(item);
  });
}

function computeForecast() {
  const list = document.getElementById("forecastList");
  if (!list) return;

  // Simple static forecast for demo
  list.innerHTML = `
    <li style="padding:10px; border-bottom:1px solid #E2E8F0; font-size:13px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <strong>Farmgate</strong>
        <span style="background:#FEE2E2; color:#991B1B; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">HIGH RISK</span>
      </div>
      <span style="color:#64748B; font-size:11px;">Expected: Harassment surge (18:00 - 21:00)</span>
    </li>
    <li style="padding:10px; font-size:13px;">
      <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
        <strong>Jatrabari</strong>
        <span style="background:#FEF3C7; color:#92400E; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700;">ELEVATED</span>
      </div>
      <span style="color:#64748B; font-size:11px;">Expected: Reckless driving incidents</span>
    </li>
  `;
}