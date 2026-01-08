// emergency.js

let mediaRecorder = null;
let audioChunks = [];
let countdownInterval = null;

document.addEventListener("DOMContentLoaded", () => {
  const sosButton = document.getElementById("sosButton");
  const locationStatus = document.getElementById("locationStatus");
  const recordingStatus = document.getElementById("recordingStatus");
  const countdownStatus = document.getElementById("countdownStatus");
  const sendingStatus = document.getElementById("sendingStatus");
  const locationCoords = document.getElementById("locationCoords");
  const locationMapLink = document.getElementById("locationMapLink");
  const audioInfo = document.getElementById("audioInfo");
  const audioPreview = document.getElementById("audioPreview");

  let currentLocation = null;

  // basic profile/logout placeholders
  const profileBtn = document.getElementById("profile-btn");
  const logoutBtn = document.getElementById("logout-btn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () =>
      alert("Profile panel coming later.")
    );
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () =>
      alert("Sign out – connect to auth later.")
    );
  }

  sosButton.addEventListener("click", async () => {
    // prevent starting again while active
    if (sosButton.classList.contains("active")) return;

    sosButton.classList.add("active");
    sendingStatus.textContent = "Waiting to send…";
    recordingStatus.textContent = "Preparing...";
    countdownStatus.textContent = "--";
    audioInfo.textContent = "No audio recorded yet.";

    // 1) Get location
    locationStatus.textContent = "Requesting location…";
    currentLocation = await getLocationSafe(locationStatus, locationCoords, locationMapLink);

    // 2) Start 10s recording
    const stream = await getAudioStreamSafe(recordingStatus);
    if (!stream) {
      // fail gracefully
      sosButton.classList.remove("active");
      countdownStatus.textContent = "--";
      sendingStatus.textContent = "Failed (no microphone).";
      return;
    }

    recordingStatus.textContent = "Recording…";
    startRecording(stream, 10, countdownStatus)
      .then((audioBlob) => {
        recordingStatus.textContent = "Finished.";
        sosButton.classList.remove("active");

        // Update audio preview
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPreview.src = audioUrl;
        audioPreview.style.display = "block";
        audioInfo.textContent = "10 second audio clip captured.";
        
        // 3) Send to backend
        sendingStatus.textContent = "Sending...";
        sendEmergencyToBackend(currentLocation, audioBlob)
          .then(() => {
            sendingStatus.textContent = "Emergency alert sent successfully.";
          })
          .catch((err) => {
            console.error(err);
            sendingStatus.textContent = "Failed to send emergency alert.";
          });
      })
      .catch((err) => {
        console.error(err);
        recordingStatus.textContent = "Error during recording.";
        sosButton.classList.remove("active");
        countdownStatus.textContent = "--";
        sendingStatus.textContent = "Failed.";
      });
  });
});

// LOCATION HELPERS
function getLocationSafe(statusEl, coordsEl, mapLinkEl) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      statusEl.textContent = "Geolocation not supported.";
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        statusEl.textContent = "Location captured.";
        coordsEl.textContent = `Lat: ${latitude.toFixed(
          5
        )}, Lng: ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        mapLinkEl.href = url;
        mapLinkEl.style.display = "inline-block";
        resolve({ latitude, longitude, accuracy });
      },
      (err) => {
        console.warn("Location error:", err);
        if (err.code === err.PERMISSION_DENIED) {
          statusEl.textContent =
            "Location permission denied. SOS will still send audio only.";
        } else {
          statusEl.textContent = "Could not get location.";
        }
        resolve(null); // still continue without location
      }
    );
  });
}

// AUDIO HELPERS
async function getAudioStreamSafe(recordingStatus) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    recordingStatus.textContent = "Audio not supported.";
    return null;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  } catch (err) {
    console.warn("getUserMedia error:", err);
    recordingStatus.textContent = "Microphone permission denied.";
    return null;
  }
}

function startRecording(stream, seconds, countdownEl) {
  return new Promise((resolve, reject) => {
    audioChunks = [];
    let remaining = seconds;
    countdownEl.textContent = `${remaining}s`;

    // Countdown
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      remaining--;
      countdownEl.textContent = remaining > 0 ? `${remaining}s` : "0s";
      if (remaining <= 0) {
        clearInterval(countdownInterval);
      }
    }, 1000);

    try {
      mediaRecorder = new MediaRecorder(stream);
    } catch (err) {
      clearInterval(countdownInterval);
      reject(err);
      return;
    }

    mediaRecorder.ondataavailable = (e) => {
      audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      stream.getTracks().forEach((t) => t.stop());
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      clearInterval(countdownInterval);
      stream.getTracks().forEach((t) => t.stop());
      reject(e.error || e);
    };

    mediaRecorder.start();

    // stop after `seconds`
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    }, seconds * 1000);
  });
}

// Convert blob to Base64 string
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // Remove the prefix 'data:audio/webm;base64,'
      const result = reader.result;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
}

// Send emergency report to backend
function sendEmergencyToBackend(location, audioBlob) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = localStorage.getItem("token");
      // Convert audio to base64 string (optional). You could instead upload the blob to storage and send URL.
      const audioBase64 = await blobToBase64(audioBlob);
      // Derive current user name, if available, for display on police portal
      let currentUser = null;
      try {
        currentUser = JSON.parse(localStorage.getItem("currentUser"));
      } catch (_) {}
      const payload = {
        // include location data
        latitude: location ? location.latitude : null,
        longitude: location ? location.longitude : null,
        accuracy: location ? location.accuracy : null,
        // audio encoded as base64 string
        audio: audioBase64,
        createdAt: new Date().toISOString(),
        status: "new",
        // Additional meta fields for police UI
        passenger: currentUser && currentUser.name ? currentUser.name : "Unknown",
        type: "SOS",
        location: location
          ? `Lat ${location.latitude.toFixed(4)}, Lng ${location.longitude.toFixed(4)}`
          : "Unknown location",
        description: "Emergency SOS alert",
      };
      const resp = await fetch("/api/emergencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return reject(data.error || "Failed to send emergency report.");
      }
      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
}
