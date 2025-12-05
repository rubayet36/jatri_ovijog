// report.js

document.addEventListener("DOMContentLoaded", () => {
  const anonymousCheckbox = document.getElementById("anonymous-checkbox");
  const nameInput = document.getElementById("reporterName");
  const phoneInput = document.getElementById("reporterPhone");
  const emailInput = document.getElementById("reporterEmail");

  const reportImageInput = document.getElementById("reportImage");
  const previewImg = document.getElementById("previewImg");
  const previewPlaceholder = document.querySelector(".preview-placeholder");

  const getLocationBtn = document.getElementById("getLocationBtn");
  const locationStatus = document.getElementById("locationStatus");
  const locationCoords = document.getElementById("locationCoords");
  const locationMapLink = document.getElementById("locationMapLink");

  const form = document.getElementById("report-form");
  const postToFeedBtn = document.getElementById("postToFeedBtn");

  // PROFILE & LOGOUT (placeholder)
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () =>
      alert("Profile panel coming later!")
    );
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () =>
      alert("Sign out – replace with real auth later.")
    );
  }

  // Anonymous toggle
  anonymousCheckbox.addEventListener("change", () => {
    const anon = anonymousCheckbox.checked;
    [nameInput, phoneInput, emailInput].forEach((input) => {
      input.disabled = anon;
      if (anon) input.value = "";
    });
  });

  // Image preview
  reportImageInput.addEventListener("change", () => {
    const file = reportImageInput.files[0];
    if (!file) {
      previewImg.style.display = "none";
      previewPlaceholder.style.display = "block";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
      previewPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  });

  // Live location
  getLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      locationStatus.textContent =
        "Geolocation is not supported in this browser.";
      return;
    }

    locationStatus.textContent = "Requesting location…";
    locationStatus.classList.add("loading");
    locationCoords.textContent = "";
    locationMapLink.style.display = "none";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locationStatus.classList.remove("loading");
        const { latitude, longitude, accuracy } = pos.coords;
        locationStatus.textContent = "Location captured.";
        locationCoords.textContent = `Lat: ${latitude.toFixed(
          5
        )}, Lng: ${longitude.toFixed(5)} (accuracy ~${Math.round(
          accuracy
        )}m)`;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        locationMapLink.href = url;
        locationMapLink.style.display = "inline-block";

        // store in dataset to send with form
        form.dataset.lat = latitude;
        form.dataset.lng = longitude;
        form.dataset.accuracy = accuracy;
      },
      (err) => {
        locationStatus.classList.remove("loading");
        if (err.code === err.PERMISSION_DENIED) {
          locationStatus.textContent =
            "Location permission denied. You can still submit the report.";
        } else {
          locationStatus.textContent = "Could not get location. Try again.";
        }
      }
    );
  });

  // Main submit (to authorities only)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const report = collectReportData(form);
    if (!validateReport(report)) return;

    console.log("Report for backend:", report);
    alert(
      "Report captured (front-end demo).\nLater this will be sent to the police backend."
    );
    form.reset();
    previewImg.style.display = "none";
    previewPlaceholder.style.display = "block";
    locationCoords.textContent = "";
    locationMapLink.style.display = "none";
  });

  // Submit & share to community feed
  postToFeedBtn.addEventListener("click", () => {
    const report = collectReportData(form);
    if (!validateReport(report)) return;
    saveToLocalFeed(report);
    alert(
      "Report saved and added to local Community Feed.\nOpen the Feed page to see it."
    );
    // optional redirect:
    // window.location.href = "feed.html";
  });
});

// Collect all form data into one object
function collectReportData(form) {
  const anon = document.getElementById("anonymous-checkbox").checked;
  const base64Image = document.getElementById("previewImg").src || null;
  const report = {
    anonymous: anon,
    reporterName: anon
      ? "Anonymous"
      : document.getElementById("reporterName").value.trim(),
    reporterPhone: anon
      ? ""
      : document.getElementById("reporterPhone").value.trim(),
    reporterEmail: anon
      ? ""
      : document.getElementById("reporterEmail").value.trim(),

    incidentType: document.getElementById("incidentType").value,
    incidentDateTime: document.getElementById("incidentDateTime").value,
    busName: document.getElementById("busName").value.trim(),
    busNumber: document.getElementById("busNumber").value.trim(),
    companyName: document.getElementById("companyName").value.trim(),
    seatInfo: document.getElementById("seatInfo").value.trim(),
    routeFrom: document.getElementById("routeFrom").value.trim(),
    routeTo: document.getElementById("routeTo").value.trim(),
    thana: document.getElementById("thana").value,
    landmark: document.getElementById("landmark").value.trim(),
    description: document.getElementById("incidentDescription").value.trim(),

    latitude: form.dataset.lat || null,
    longitude: form.dataset.lng || null,
    accuracy: form.dataset.accuracy || null,
    image: base64Image && base64Image.startsWith("data:image")
      ? base64Image
      : null,

    createdAt: new Date().toISOString()
  };

  return report;
}

// Minimal validation
function validateReport(report) {
  if (!report.incidentType) {
    alert("Please select the type of issue.");
    return false;
  }
  if (!report.incidentDateTime) {
    alert("Please enter the date and time of the incident.");
    return false;
  }
  if (!report.thana) {
    alert("Please select a Thana.");
    return false;
  }
  if (!report.description) {
    alert("Please describe what happened.");
    return false;
  }
  return true;
}

// Save to localStorage for feed page to read
function saveToLocalFeed(report) {
  const key = "communityReports";
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  const withId = {
    id: Date.now(),
    ...report,
    status: "pending"
  };
  existing.unshift(withId);
  localStorage.setItem(key, JSON.stringify(existing));
}
