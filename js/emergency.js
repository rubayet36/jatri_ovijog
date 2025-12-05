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
        
        // 3) "Send" to backend
        sendingStatus.textContent = "Sending...";
        simulateSendToBackend(currentLocation, audioBlob)
          .then(() => {
            sendingStatus.textContent = "Sent to police system (demo).";
          })
          .catch(() => {
            sendingStatus.textContent = "Failed to send.";
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

// "SEND" TO BACKEND (demo)
function simulateSendToBackend(location, audioBlob) {
  return new Promise((resolve) => {
    // In your real app, you'd do something like:
    // const formData = new FormData();
    // formData.append("audio", audioBlob, "sos.webm");
    // if (location) {
    //   formData.append("lat", location.latitude);
    //   formData.append("lng", location.longitude);
    //   formData.append("accuracy", location.accuracy);
    // }
    // fetch("/api/emergency-alert", { method: "POST", body: formData });

    console.log("=== EMERGENCY ALERT (demo) ===");
    console.log("Location:", location);
    console.log("Audio blob:", audioBlob);
    console.log("Size (KB):", Math.round(audioBlob.size / 1024));

    // Simulate a small delay
    setTimeout(resolve, 800);
  });
}
