// fare.js
// Leaflet map + OSRM distance + simple fare + safety lens

let map;
let fromMarker = null;
let toMarker = null;
let routeLine = null;
let routeDot = null;
let routeDotInterval = null;

// demo safety presets for known routes
const routeSafetyPresets = {
  "Uttara → Motijheel": {
    safetyScore: 3,
    harassment: 2,
    reckless: 1,
    peakWindow: "7–9 PM",
  },
  "Mirpur-10 → Motijheel": {
    safetyScore: 2,
    harassment: 3,
    reckless: 1,
    peakWindow: "7–10 PM",
  },
  "Gabtoli → Jatrabari": {
    safetyScore: 4,
    harassment: 0,
    reckless: 1,
    peakWindow: "5–7 PM",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  // init map centered on Dhaka
  map = L.map("fareMap").setView([23.8103, 90.4125], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  map.on("click", onMapClick);

  const btnUseCurrent = document.getElementById("btnUseCurrent");
  const btnClear = document.getElementById("btnClear");

  if (btnUseCurrent) {
    btnUseCurrent.addEventListener("click", useCurrentLocationAsFrom);
  }
  if (btnClear) {
    btnClear.addEventListener("click", clearRoute);
  }

  const routeSelect = document.getElementById("routePreset");
  if (routeSelect) {
    routeSelect.addEventListener("change", handleRoutePresetChange);
  }
});

function onMapClick(e) {
  const { lat, lng } = e.latlng;

  if (!fromMarker) {
    fromMarker = L.marker([lat, lng], { draggable: true })
      .addTo(map)
      .bindPopup("From")
      .openPopup();
    fromMarker.on("dragend", updateRouteIfReady);
    updateLabels();
  } else if (!toMarker) {
    toMarker = L.marker([lat, lng], { draggable: true })
      .addTo(map)
      .bindPopup("To")
      .openPopup();
    toMarker.on("dragend", updateRouteIfReady);
    updateLabels();
    updateRouteIfReady();
  } else {
    toMarker.setLatLng([lat, lng]).openPopup();
    updateLabels();
    updateRouteIfReady();
  }
}

function useCurrentLocationAsFrom() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      if (!fromMarker) {
        fromMarker = L.marker([latitude, longitude], { draggable: true })
          .addTo(map)
          .bindPopup("From (your location)")
          .openPopup();
        fromMarker.on("dragend", updateRouteIfReady);
      } else {
        fromMarker.setLatLng([latitude, longitude]).openPopup();
      }
      map.setView([latitude, longitude], 13);
      updateLabels();
      updateRouteIfReady();
    },
    () => alert("Could not get current location.")
  );
}

function clearRoute() {
  if (fromMarker) {
    map.removeLayer(fromMarker);
    fromMarker = null;
  }
  if (toMarker) {
    map.removeLayer(toMarker);
    toMarker = null;
  }
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  if (routeDot) {
    map.removeLayer(routeDot);
    routeDot = null;
  }
  if (routeDotInterval) {
    clearInterval(routeDotInterval);
    routeDotInterval = null;
  }

  document.getElementById("fromLabel").textContent = "Not selected";
  document.getElementById("toLabel").textContent = "Not selected";
  document.getElementById("distanceLabel").textContent = "-- km";
  document.getElementById("fareLabel").textContent = "-- ৳";
  document.getElementById("fareBreakdownText").textContent =
    "Select a route to see calculation.";
}

function updateLabels() {
  const fromLabel = document.getElementById("fromLabel");
  const toLabel = document.getElementById("toLabel");

  if (fromMarker) {
    const { lat, lng } = fromMarker.getLatLng();
    fromLabel.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  if (toMarker) {
    const { lat, lng } = toMarker.getLatLng();
    toLabel.textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function updateRouteIfReady() {
  if (!fromMarker || !toMarker) return;

  const from = fromMarker.getLatLng();
  const to = toMarker.getLatLng();

  try {
    const routeData = await fetchRouteData(from, to);
    const distanceKm = routeData.distanceKm;

    drawRoutePreview(routeData.coords);

    const fareInfo = calculateFareFromDistance(distanceKm);
    document.getElementById("distanceLabel").textContent =
      distanceKm.toFixed(2) + " km";
    document.getElementById("fareLabel").textContent =
      Math.round(fareInfo.totalFare) + " ৳";
    document.getElementById("fareBreakdownText").textContent =
      fareInfo.breakdown;
  } catch (err) {
    console.error(err);
    alert("Could not calculate route. Please try a different pair of points.");
  }
}

// OSRM routing with geometry
async function fetchRouteData(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("OSRM request failed");
  }
  const data = await res.json();
  if (!data.routes || !data.routes[0]) {
    throw new Error("No route found");
  }

  const distanceMeters = data.routes[0].distance;
  const distanceKm = distanceMeters / 1000;

  const coords =
    data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

  return { distanceKm, coords };
}

// Draw polyline + animated dot
function drawRoutePreview(coords) {
  if (routeLine) {
    map.removeLayer(routeLine);
    routeLine = null;
  }
  if (routeDot) {
    map.removeLayer(routeDot);
    routeDot = null;
  }
  if (routeDotInterval) {
    clearInterval(routeDotInterval);
    routeDotInterval = null;
  }

  if (!coords || coords.length < 2) return;

  routeLine = L.polyline(coords, {
    color: "#9faf62",
    weight: 5,
    opacity: 0.8,
  }).addTo(map);

  map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });

  routeDot = L.circleMarker(coords[0], {
    radius: 6,
    color: "#1f2933",
    fillColor: "#b9ec87",
    fillOpacity: 1,
  }).addTo(map);

  let index = 0;
  routeDotInterval = setInterval(() => {
    if (!routeDot) return;
    routeDot.setLatLng(coords[index]);
    index = (index + 1) % coords.length;
  }, 90);
}

// Simple fare calculation (replace values with real PDF rules)
function calculateFareFromDistance(distanceKm) {
  const BASE_FARE = 10; // minimum fare
  const BASE_DISTANCE = 2; // km included in base fare
  const STEP_KM = 1;
  const STEP_FARE = 2.5;

  if (distanceKm <= 0) {
    return { totalFare: 0, breakdown: "Invalid distance." };
  }

  if (distanceKm <= BASE_DISTANCE) {
    return {
      totalFare: BASE_FARE,
      breakdown: `Up to ${BASE_DISTANCE} km → base fare ${BASE_FARE}৳ applied.`,
    };
  }

  const extraKm = distanceKm - BASE_DISTANCE;
  const steps = Math.ceil(extraKm / STEP_KM);
  const extraFare = steps * STEP_FARE;
  const total = BASE_FARE + extraFare;

  const breakdown = [
    `Base fare (${BASE_DISTANCE} km): ${BASE_FARE}৳`,
    `Extra distance: ${extraKm.toFixed(2)} km (charged in ${steps} step(s))`,
    `Extra fare: ${extraFare.toFixed(1)}৳`,
    `Total: ${total.toFixed(1)}৳`,
  ].join(" • ");

  return { totalFare: total, breakdown };
}

// ===== Safety lens: route presets =====
function handleRoutePresetChange() {
  const select = document.getElementById("routePreset");
  const value = select.value;

  const safetyScoreLabel = document.getElementById("safetyScoreLabel");
  const safetyIssuesLabel = document.getElementById("safetyIssuesLabel");
  const safetyTimeLabel = document.getElementById("safetyTimeLabel");

  if (!value || !routeSafetyPresets[value]) {
    safetyScoreLabel.textContent = "--";
    safetyIssuesLabel.textContent = "--";
    safetyTimeLabel.textContent =
      "Choose a route above to see when most complaints occur.";
    return;
  }

  const info = routeSafetyPresets[value];
  const stars = makeStars(info.safetyScore);

  safetyScoreLabel.textContent = `${stars} (${info.safetyScore}/5)`;
  safetyIssuesLabel.textContent = `Harassment (${info.harassment}), Reckless driving (${info.reckless})`;
  safetyTimeLabel.textContent = `Most complaints on this route happen between ${info.peakWindow}.`;
}

function makeStars(score) {
  const full = "★★★★★";
  const empty = "☆☆☆☆☆";
  const clamped = Math.max(1, Math.min(5, score));
  return full.slice(0, clamped) + empty.slice(clamped);
}
