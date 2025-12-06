// police-chat.js
// Front-end only demo: officer chat + image sharing + case assignment

// Dummy channel data
const channels = [
  {
    id: "fraud",
    name: "Fare & Fraud Cell",
    type: "Team",
    description: "Handles overcharging, fake tickets & fare scams.",
    members: ["Officer Rahim", "Officer Nabila", "Officer Hasan"],
  },
  {
    id: "traffic",
    name: "Traffic Enforcement",
    type: "Team",
    description: "Reckless driving, speeding and road-safety issues.",
    members: ["Officer Karim", "Officer Biplob"],
  },
  {
    id: "women",
    name: "Women & Child Safety Cell",
    type: "Team",
    description: "Harassment & gender-based safety cases.",
    members: ["Officer Asma", "Officer Tania"],
  },
  {
    id: "control",
    name: "Control Room",
    type: "Broadcast",
    description: "Emergency coordination and routing.",
    members: ["Duty Officer", "SOS Monitor"],
  },
];

// Dummy messages per channel
const channelMessages = {
  fraud: [
    {
      from: "Officer Rahim",
      me: false,
      text: "We have repeated fare complaints on Raida bus DHA-15-9988.",
      time: "09:20",
    },
    {
      from: "Me",
      me: true,
      text: "Copy. I’ll request GPS and ticket logs for the last 3 days.",
      time: "09:22",
    },
  ],
  traffic: [
    {
      from: "Officer Karim",
      me: false,
      text: "Reckless driving on Jatrabari flyover yesterday, case #53.",
      time: "18:45",
    },
  ],
  women: [
    {
      from: "Officer Asma",
      me: false,
      text: "Farmgate harassment case, need CCTV tags by tonight.",
      time: "14:10",
    },
  ],
  control: [
    {
      from: "Duty Officer",
      me: false,
      text: "New SOS alert from Mirpur-10, sending details.",
      time: "21:30",
    },
  ],
};

// Dummy case queue
let cases = [
  {
    id: 42,
    category: "Fare Dispute",
    status: "open", // open | progress | resolved
    thana: "Uttara East",
    route: "Uttara → Motijheel",
    bus: "Asmani (DHA-12-3456)",
    assignedTo: "None",
    history: [
      { time: "2025-12-05T09:30:00Z", text: "Complaint #42 created (fare dispute)." },
      { time: "2025-12-05T10:00:00Z", text: "Auto-triage flagged this route as high risk." },
    ],
    notes: [
      {
        time: "2025-12-05T11:10:00Z",
        author: "Officer Rahim",
        text: "Multiple overcharge reports for same bus this week.",
      },
    ],
  },
  {
    id: 37,
    category: "Harassment",
    status: "progress",
    thana: "Tejgaon",
    route: "Mirpur-10 → Motijheel",
    bus: "Raida (DHA-15-9988)",
    assignedTo: "Women & Child Safety Cell",
    history: [
      { time: "2025-12-05T14:05:00Z", text: "Complaint #37 created (harassment near Farmgate)." },
      { time: "2025-12-05T14:40:00Z", text: "Assigned to Women & Child Safety Cell." },
    ],
    notes: [
      {
        time: "2025-12-05T15:00:00Z",
        author: "Officer Asma",
        text: "Need CCTV footage from Farmgate stop.",
      },
    ],
  },
  {
    id: 53,
    category: "Reckless Driving",
    status: "resolved",
    thana: "Jatrabari",
    route: "Gabtoli → Jatrabari",
    bus: "City Link (DHA-17-2211)",
    assignedTo: "Traffic Enforcement",
    history: [
      { time: "2025-12-04T18:20:00Z", text: "Complaint #53 created (reckless driving)." },
      { time: "2025-12-05T09:10:00Z", text: "Driver summoned to station." },
      { time: "2025-12-05T11:30:00Z", text: "Fine issued and driver warned." },
      { time: "2025-12-05T11:35:00Z", text: "Case marked resolved." },
    ],
    notes: [
      {
        time: "2025-12-05T09:15:00Z",
        author: "Officer Karim",
        text: "First reported offence for this driver.",
      },
    ],
  },
  {
    id: 61,
    category: "Fare Dispute",
    status: "open",
    thana: "Mohammadpur",
    route: "Shyamoli → Motijheel",
    bus: "Shyamoli (DHA-19-4432)",
    assignedTo: "None",
    history: [
      { time: "2025-12-06T07:50:00Z", text: "Complaint #61 created (student discount refused)." },
    ],
    notes: [],
  },
];

let currentChannelId = null;
let pendingImageDataUrl = null; // preview only
let currentModalCaseId = null;
const CASE_OFFICERS = [
  "None",
  "Fare & Fraud Cell",
  "Traffic Enforcement",
  "Women & Child Safety Cell",
  "Internal Review",
];

document.addEventListener("DOMContentLoaded", () => {
  renderChannels();
  renderCaseList();
  renderCaseSummary();
  attachInputHandlers();

  // default open first channel
  if (channels.length) {
    switchChannel(channels[0].id);
  }
});

// ===== Channels =====

function renderChannels() {
  const list = document.getElementById("channelList");
  if (!list) return;

  list.innerHTML = "";
  channels.forEach((ch) => {
    const div = document.createElement("div");
    div.className = "channel-item";
    div.dataset.id = ch.id;
    div.innerHTML = `
      <span class="channel-title">${ch.name}</span>
      <span class="channel-meta">${ch.members.length} members</span>
      <span class="channel-type-chip">${ch.type}</span>
    `;
    div.addEventListener("click", () => switchChannel(ch.id));
    list.appendChild(div);
  });
  updateChannelActiveState();
}

function switchChannel(id) {
  currentChannelId = id;
  updateChannelActiveState();

  const ch = channels.find((c) => c.id === id);
  if (!ch) return;

  const nameEl = document.getElementById("currentChannelName");
  const metaEl = document.getElementById("currentChannelMeta");
  const typeEl = document.getElementById("currentChannelType");

  nameEl.textContent = ch.name;
  metaEl.textContent = `${ch.type} • ${ch.members.join(", ")}`;
  typeEl.textContent = ch.type;

  renderMessages();
}

function updateChannelActiveState() {
  const list = document.getElementById("channelList");
  if (!list) return;
  list.querySelectorAll(".channel-item").forEach((item) => {
    if (item.dataset.id === currentChannelId) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

// ===== Messages =====

function renderMessages() {
  const container = document.getElementById("messageList");
  if (!container) return;

  const msgs = channelMessages[currentChannelId] || [];
  container.innerHTML = "";

  msgs.forEach((m) => {
    const div = document.createElement("div");
    div.className = "message-item" + (m.me ? " me" : "");
    const initials = m.from
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

       div.innerHTML = `
      <div class="message-avatar">${initials}</div>
      <div class="message-body">
        <div class="message-header">
          <span class="message-author">${m.from}</span>
          <span class="message-time">${m.time}</span>
        </div>
        <p class="message-text">${escapeHtml(m.text)}</p>
        ${
          m.imageDataUrl
            ? `<img src="${m.imageDataUrl}" class="message-image" alt="shared image" />`
            : ""
        }
        ${
          m.caseId
            ? `<div class="message-tag">
                 🔗 Case #${m.caseId}
                 ${
                   m.caseTagType === "resolved"
                     ? "· marked resolved"
                     : m.caseTagType === "assigned"
                     ? "· assigned to this team"
                     : "· attached"
                 }
               </div>`
            : ""
        }
      </div>
    `;

    container.appendChild(div);
  });

  // scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// ===== Input handling =====

function attachInputHandlers() {
  const input = document.getElementById("chatInput");
  const sendBtn = document.getElementById("sendBtn");
  const imageInput = document.getElementById("imageInput");

  if (!input || !sendBtn) return;

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", sendMessage);

  if (imageInput) {
    imageInput.addEventListener("change", handleImageSelect);
  }
}

function handleImageSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImageDataUrl = ev.target.result;
    showToast("Image attached – it will be sent with your next message.");
  };
  reader.readAsDataURL(file);
}
function sendMessage(extra = {}) {
  if (!currentChannelId) return;

  const input = document.getElementById("chatInput");
  const text = (input.value || "").trim();
  const hasUserText = text.length > 0;

  // if called from UI (button / enter) and no text and no image and no extra.tag → do nothing
  if (!hasUserText && !pendingImageDataUrl && !extra.caseId) return;

  const timeStr = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const msg = {
    from: "Me",
    me: true,
    text: hasUserText ? text : extra.text || "(update)",
    time: timeStr,
  };

  if (pendingImageDataUrl) {
    msg.imageDataUrl = pendingImageDataUrl;
  }

  if (extra.caseId) {
    msg.caseId = extra.caseId;
    msg.caseTagType = extra.tagType || "attached";
  }

  channelMessages[currentChannelId] =
    channelMessages[currentChannelId] || [];
  channelMessages[currentChannelId].push(msg);

  input.value = "";
  pendingImageDataUrl = null;

  renderMessages();
}

// ===== Cases & assignment =====
function renderCaseList() {
  const list = document.getElementById("caseList");
  if (!list) return;

  list.innerHTML = "";
  cases.forEach((c) => {
    const statusClass =
      c.status === "resolved"
        ? "case-status-resolved"
        : c.status === "progress"
        ? "case-status-progress"
        : "case-status-open";

    const div = document.createElement("div");
    div.className = "case-item";
    div.dataset.id = c.id;

    div.innerHTML = `
      <div class="case-item-header">
        <span class="case-id">#${c.id} · ${c.category}</span>
        <span class="case-status-pill ${statusClass}">${formatCaseStatus(
      c.status
    )}</span>
      </div>
      <div class="case-meta">
        🚌 ${c.bus}<br />
        📍 ${c.thana} • ${c.route}<br />
        👮 Assigned: ${c.assignedTo}
      </div>
      <div class="case-actions">
        <button class="case-assign-btn" data-id="${c.id}">
          Assign to this chat
        </button>
        <button class="case-assign-btn case-resolve-btn" data-id="${c.id}">
          Mark resolved & announce
        </button>
      </div>
    `;
    list.appendChild(div);
  });

  // clicking the card opens modal
  list.querySelectorAll(".case-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      // ignore clicks on buttons (they have their own handlers)
      if (e.target.closest("button")) return;
      const id = parseInt(item.dataset.id, 10);
      openCaseModal(id);
    });
  });

  // Assign button
  list.querySelectorAll(".case-assign-btn").forEach((btn) => {
    if (btn.classList.contains("case-resolve-btn")) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      assignCaseToCurrentChannel(id);
    });
  });

  // Resolve & announce button
  list.querySelectorAll(".case-resolve-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id, 10);
      resolveCaseWithAnnouncement(id);
    });
  });
}


function assignCaseToCurrentChannel(caseId) {
  if (!currentChannelId) {
    showToast("Open a channel first.");
    return;
  }
  const c = cases.find((x) => x.id === caseId);
  const ch = channels.find((x) => x.id === currentChannelId);
  if (!c || !ch) return;

  c.assignedTo = ch.name;
  if (c.status === "open") {
    c.status = "progress";
  }

  c.history = c.history || [];
  c.history.push({
    time: new Date().toISOString(),
    text: `Assigned to ${ch.name} from chat.`,
  });

  // system message
  const timeStr = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sysMsg = {
    from: "System",
    me: false,
    text: `Case #${c.id} assigned to ${ch.name}.`,
    time: timeStr,
    caseId: c.id,
    caseTagType: "assigned",
  };

  channelMessages[currentChannelId] =
    channelMessages[currentChannelId] || [];
  channelMessages[currentChannelId].push(sysMsg);

  renderMessages();
  renderCaseList();
  renderCaseSummary();
  showToast(`Case #${c.id} assigned to ${ch.name}.`);
}


function renderCaseSummary() {
  const list = document.getElementById("caseSummaryList");
  if (!list) return;

  const total = cases.length;
  const open = cases.filter((c) => c.status === "open").length;
  const progress = cases.filter((c) => c.status === "progress").length;
  const resolved = cases.filter((c) => c.status === "resolved").length;

  list.innerHTML = `
    <li><strong>${total}</strong> total cases</li>
    <li><strong>${open}</strong> open, <strong>${progress}</strong> in progress</li>
    <li><strong>${resolved}</strong> resolved</li>
  `;
}

// ===== Toast helper =====

let toastTimeout = null;

function showToast(message) {
  let toast = document.querySelector(".chat-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "chat-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

// ===== small helpers =====

function formatCaseStatus(st) {
  if (st === "open") return "Open";
  if (st === "progress") return "In progress";
  if (st === "resolved") return "Resolved";
  return st;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// ===== Case modal (timeline + notes + assignment) =====

function openCaseModal(caseId) {
  const c = cases.find((x) => x.id === caseId);
  if (!c) return;

  currentModalCaseId = caseId;

  const modal = document.getElementById("caseModal");
  const titleEl = document.getElementById("caseModalTitle");
  const subtitleEl = document.getElementById("caseModalSubtitle");
  const statusPill = document.getElementById("caseModalStatus");
  const assigneeSelect = document.getElementById("caseModalAssigneeSelect");
  const statusSelect = document.getElementById("caseModalStatusSelect");

  titleEl.textContent = `Case #${c.id} · ${c.category}`;
  subtitleEl.textContent = `${c.bus} • ${c.thana} • ${c.route}`;

  // status pill class
  let statusClass =
    c.status === "resolved"
      ? "case-status-resolved"
      : c.status === "progress"
      ? "case-status-progress"
      : "case-status-open";
  statusPill.className = `case-status-pill ${statusClass}`;
  statusPill.textContent = formatCaseStatus(c.status);

  // assignee
  assigneeSelect.innerHTML = CASE_OFFICERS.map(
    (o) => `<option value="${o}">${o}</option>`
  ).join("");
  assigneeSelect.value = c.assignedTo || "None";

  // status select
  statusSelect.value = c.status;

  renderCaseModalTimeline(c);
  renderCaseModalNotes(c);

  modal.classList.add("open");
}

function renderCaseModalTimeline(c) {
  const list = document.getElementById("caseModalTimeline");
  if (!list) return;
  const events = c.history || [];
  list.innerHTML = "";

  if (!events.length) {
    list.innerHTML = "<li>No timeline events yet.</li>";
    return;
  }

  events
    .slice()
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .forEach((evt) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div class="case-timeline-time">${new Date(
          evt.time
        ).toLocaleString()}</div>
        <div>${evt.text}</div>
      `;
      list.appendChild(li);
    });
}

function renderCaseModalNotes(c) {
  const container = document.getElementById("caseModalNotesList");
  if (!container) return;
  const notes = c.notes || [];
  container.innerHTML = "";

  if (!notes.length) {
    container.innerHTML =
      '<p class="note-empty">No internal notes yet.</p>';
    return;
  }

  notes
    .slice()
    .sort((a, b) => new Date(a.time) - new Date(b.time))
    .forEach((n) => {
      const div = document.createElement("div");
      div.className = "case-note-item";
      div.innerHTML = `
        <div class="case-note-meta">
          ${n.author || "Officer"} • ${new Date(
        n.time
      ).toLocaleString()}
        </div>
        <div>${n.text}</div>
      `;
      container.appendChild(div);
    });
}

function closeCaseModal() {
  const modal = document.getElementById("caseModal");
  if (modal) modal.classList.remove("open");
  currentModalCaseId = null;
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("caseModal");
  const backdrop = modal?.querySelector(".chat-case-modal-backdrop");
  const closeBtn = document.getElementById("caseModalCloseBtn");
  const saveBtn = document.getElementById("caseModalSaveAssignment");
  const addNoteBtn = document.getElementById("caseModalAddNote");

  backdrop?.addEventListener("click", closeCaseModal);
  closeBtn?.addEventListener("click", closeCaseModal);

  saveBtn?.addEventListener("click", () => {
    if (currentModalCaseId == null) return;
    const c = cases.find((x) => x.id === currentModalCaseId);
    if (!c) return;

    const assigneeSelect = document.getElementById("caseModalAssigneeSelect");
    const statusSelect = document.getElementById("caseModalStatusSelect");
    const newAssignee = assigneeSelect.value;
    const newStatus = statusSelect.value;

    const changedAssignee = c.assignedTo !== newAssignee;
    const changedStatus = c.status !== newStatus;

    c.assignedTo = newAssignee;
    c.status = newStatus;

    c.history = c.history || [];
    if (changedAssignee || changedStatus) {
      const bits = [];
      if (changedAssignee) bits.push(`assigned to ${newAssignee}`);
      if (changedStatus) bits.push(`status set to ${formatCaseStatus(newStatus)}`);
      c.history.push({
        time: new Date().toISOString(),
        text: `Updated in case panel: ${bits.join(", ")}.`,
      });
    }

    renderCaseModalTimeline(c);
    renderCaseList();
    renderCaseSummary();
  });

  addNoteBtn?.addEventListener("click", () => {
    if (currentModalCaseId == null) return;
    const c = cases.find((x) => x.id === currentModalCaseId);
    if (!c) return;

    const noteInput = document.getElementById("caseModalNoteInput");
    const text = (noteInput.value || "").trim();
    if (!text) return;

    c.notes = c.notes || [];
    c.notes.push({
      time: new Date().toISOString(),
      author: "Officer (demo)",
      text,
    });

    noteInput.value = "";
    renderCaseModalNotes(c);
  });
});
function resolveCaseWithAnnouncement(caseId) {
  if (!currentChannelId) {
    showToast("Open a channel first.");
    return;
  }
  const c = cases.find((x) => x.id === caseId);
  const ch = channels.find((x) => x.id === currentChannelId);
  if (!c || !ch) return;

  c.status = "resolved";
  c.history = c.history || [];
  c.history.push({
    time: new Date().toISOString(),
    text: `Marked resolved by ${ch.name} via chat.`,
  });

  const timeStr = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sysMsg = {
    from: "System",
    me: false,
    text: `Case #${c.id} marked resolved by ${ch.name}.`,
    time: timeStr,
    caseId: c.id,
    caseTagType: "resolved",
  };

  channelMessages[currentChannelId] =
    channelMessages[currentChannelId] || [];
  channelMessages[currentChannelId].push(sysMsg);

  renderMessages();
  renderCaseList();
  renderCaseSummary();
  showToast(`Case #${c.id} marked resolved.`);
}
