// fare.js
// Leaflet map + OSRM distance + simple fare demo

let map;
let fromMarker = null;
let toMarker = null;

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
    // if both exist, move the "To" marker
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
    const distanceKm = await fetchDistanceKm(from, to);
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

// ---- OSRM public routing API (no key needed) ----
async function fetchDistanceKm(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("OSRM request failed");
  }
  const data = await res.json();
  if (!data.routes || !data.routes[0]) {
    throw new Error("No route found");
  }
  const distanceMeters = data.routes[0].distance;
  return distanceMeters / 1000;
}

// ---- SIMPLE FARE CALCULATION (replace with your PDF rules) ----
function calculateFareFromDistance(distanceKm) {
  // TODO: Replace these numbers with official Dhaka bus fare rules
  const BASE_FARE = 10; // e.g. minimum fare
  const BASE_DISTANCE = 2; // km included in base fare
  const STEP_KM = 1; // charge per 1 km step after base
  const STEP_FARE = 2.5; // extra fare per km

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
