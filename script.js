const WORKFLOW_STATES = [
  "Submitted",
  "Under Review",
  "Escalated",
  "Approved",
  "Rejected",
  "Reopened",
];

const TRANSITIONS = {
  "Submitted": [
    { to: "Under Review", action: "review", label: "Send to Review" }
  ],
  "Under Review": [
    { to: "Escalated", action: "escalate", label: "Escalate" },
    { to: "Approved", action: "approve", label: "Approve" },
    { to: "Rejected", action: "reject", label: "Reject" }
  ],
  "Escalated": [
    { to: "Under Review", action: "review", label: "Return to Review" },
    { to: "Approved", action: "approve", label: "Approve After Escalation" },
    { to: "Rejected", action: "reject", label: "Reject After Escalation" }
  ],
  "Approved": [
    { to: "Reopened", action: "reopen", label: "Reopen" }
  ],
  "Rejected": [
    { to: "Reopened", action: "reopen", label: "Reopen" }
  ],
  "Reopened": [
    { to: "Submitted", action: "resubmit", label: "Resubmit" }
  ]
};

const DEMO_DATA = [
  {
    id: "WF-201",
    requester: "Aarav Rao",
    type: "Purchase Approval",
    title: "Robotics Lab Sensor Kit",
    priority: "High",
    details: "Approval for robotics sensor procurement required for the embedded systems demonstration.",
    state: "Under Review",
    visited: ["Submitted", "Under Review"],
    lastTransition: "Submitted->Under Review"
  },
  {
    id: "WF-202",
    requester: "Meera Singh",
    type: "Scholarship Review",
    title: "Research Travel Grant",
    priority: "Urgent",
    details: "Funding request for conference registration, travel booking, and research presentation costs.",
    state: "Escalated",
    visited: ["Submitted", "Under Review", "Escalated"],
    lastTransition: "Under Review->Escalated"
  },
  {
    id: "WF-203",
    requester: "Rohit Iyer",
    type: "Leave Request",
    title: "Medical Leave for 3 Days",
    priority: "Medium",
    details: "Leave application with health center recommendation and supporting documents.",
    state: "Approved",
    visited: ["Submitted", "Under Review", "Approved"],
    lastTransition: "Under Review->Approved"
  },
  {
    id: "WF-204",
    requester: "Naina Das",
    type: "Complaint Resolution",
    title: "Hostel Maintenance Escalation",
    priority: "Low",
    details: "Complaint regarding repeated electrical maintenance issues in hostel block C.",
    state: "Rejected",
    visited: ["Submitted", "Under Review", "Rejected"],
    lastTransition: "Under Review->Rejected"
  }
];

const HISTORY_SEED = [
  { message: "WF-204 moved from Under Review to Rejected.", timestamp: new Date(Date.now() - 1000 * 60 * 18) },
  { message: "WF-203 moved from Under Review to Approved.", timestamp: new Date(Date.now() - 1000 * 60 * 42) },
  { message: "WF-202 moved from Under Review to Escalated.", timestamp: new Date(Date.now() - 1000 * 60 * 85) },
  { message: "WF-201 moved from Submitted to Under Review.", timestamp: new Date(Date.now() - 1000 * 60 * 130) }
];

const AUTO_PATH = [
  "Under Review",
  "Escalated",
  "Approved",
  "Reopened",
  "Submitted"
];

let requests = [];
let historyLog = [];
let selectedId = null;
let autoplayTimer = null;

const el = {
  heroTotal: document.getElementById("hero-total"),
  heroApproved: document.getElementById("hero-approved"),
  heroActive: document.getElementById("hero-active"),
  heroSelected: document.getElementById("hero-selected"),
  approvalRate: document.getElementById("approval-rate"),
  activeReviews: document.getElementById("active-reviews"),
  summaryCurrent: document.getElementById("summary-current"),
  transitionCount: document.getElementById("transition-count"),
  requestList: document.getElementById("request-list"),
  historyList: document.getElementById("history-list"),
  selectedRequest: document.getElementById("selected-request"),
  currentStateChip: document.getElementById("current-state-chip"),
  controlButtons: document.getElementById("control-buttons"),
  journeyTrack: document.getElementById("journey-track"),
  filterType: document.getElementById("filter-type"),
  filterState: document.getElementById("filter-state"),
  form: document.getElementById("request-form"),
  resetDemoBtn: document.getElementById("reset-demo-btn"),
  runDemoPath: document.getElementById("run-demo-path"),
  pauseDemo: document.getElementById("pause-demo"),
  stepNext: document.getElementById("step-next"),
  resetSelected: document.getElementById("reset-selected"),
  template: document.getElementById("request-card-template"),
  heroSvg: document.getElementById("hero-dfa"),
  mainSvg: document.getElementById("main-dfa")
};

const STATE_POSITIONS = {
  "Submitted": { x: 160, y: 210, final: false },
  "Under Review": { x: 420, y: 210, final: false },
  "Escalated": { x: 680, y: 210, final: false },
  "Approved": { x: 940, y: 210, final: true },
  "Rejected": { x: 1200, y: 210, final: true },
  "Reopened": { x: 1320, y: 80, final: false }
};

const EDGE_DEFS = [
  {
    key: "START->Submitted",
    label: "start",
    path: "M40 210 C70 210 95 210 120 210",
    labelX: 66,
    labelY: 186,
    start: true
  },
  {
    key: "Submitted->Under Review",
    label: "review",
    path: "M220 210 C265 210 315 210 360 210",
    labelX: 287,
    labelY: 186
  },
  {
    key: "Under Review->Escalated",
    label: "escalate",
    path: "M480 210 C525 210 575 210 620 210",
    labelX: 545,
    labelY: 186
  },
  {
    key: "Escalated->Approved",
    label: "approve",
    path: "M740 210 C785 210 835 210 880 210",
    labelX: 807,
    labelY: 186
  },
  {
    key: "Approved->Rejected",
    label: "reject",
    path: "M1000 210 C1045 210 1095 210 1140 210",
    labelX: 1068,
    labelY: 186
  },
  {
    key: "Under Review->Approved",
    label: "approve",
    path: "M420 150 C560 40 800 40 940 150",
    labelX: 680,
    labelY: 58
  },
  {
    key: "Under Review->Rejected",
    label: "reject",
    path: "M420 272 C600 372 1018 370 1200 272",
    labelX: 806,
    labelY: 368
  },
  {
    key: "Escalated->Under Review",
    label: "review",
    path: "M620 150 C565 108 535 108 480 150",
    labelX: 550,
    labelY: 112
  },
  {
    key: "Escalated->Rejected",
    label: "reject",
    path: "M680 272 C790 338 1088 338 1200 272",
    labelX: 960,
    labelY: 332
  },
  {
    key: "Approved->Reopened",
    label: "reopen",
    path: "M975 150 C1035 82 1188 36 1265 66",
    labelX: 1085,
    labelY: 48
  },
  {
    key: "Rejected->Reopened",
    label: "reopen",
    path: "M1200 150 C1236 96 1270 80 1268 80",
    labelX: 1230,
    labelY: 106
  },
  {
    key: "Reopened->Submitted",
    label: "resubmit",
    path: "M1260 96 C1080 10 520 10 210 150",
    labelX: 735,
    labelY: 24
  }
];

function deepClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function getStateClass(state) {
  return "state-" + state.toLowerCase().replace(/\s+/g, "-");
}

function formatTime(input) {
  const date = new Date(input);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function nextId() {
  const maxNum = requests.reduce((max, item) => {
    const num = Number(item.id.replace("WF-", ""));
    return Number.isFinite(num) ? Math.max(max, num) : max;
  }, 200);
  return `WF-${maxNum + 1}`;
}

function getSelectedRequest() {
  return requests.find((item) => item.id === selectedId) || null;
}

function createSharedDefs() {
  return `
    <defs>
      <marker id="arrowhead-shared" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
        <path d="M0,0 L12,6 L0,12 Z" fill="currentColor"></path>
      </marker>
    </defs>
  `;
}

function renderSvg(svg, currentState, latestTransition) {
  if (!svg) return;

  const edgesMarkup = EDGE_DEFS.map((edge) => {
    const isLatest = edge.key === latestTransition;
    const edgeClass = [
      "edge",
      edge.start ? "edge-start" : "",
      isLatest ? "edge-latest" : ""
    ].filter(Boolean).join(" ");

    return `
      <g class="edge-group">
        <path class="${edgeClass}" style="color:${isLatest ? "var(--warning)" : edge.start ? "rgba(101, 215, 255, 0.55)" : "rgba(160, 183, 209, 0.45)"}" d="${edge.path}"></path>
        <text class="${edge.start ? "start-text" : "edge-label"}" x="${edge.labelX}" y="${edge.labelY}">${edge.label}</text>
      </g>
    `;
  }).join("");

  const nodesMarkup = WORKFLOW_STATES.map((state) => {
    const node = STATE_POSITIONS[state];
    const activeClass = currentState === state ? "active" : "";
    const finalClass = node.final ? "final-node" : "";
    const yLines = state === "Under Review"
      ? `<text class="node-label" x="${node.x}" y="${node.y - 8}">Under</text><text class="node-label" x="${node.x}" y="${node.y + 18}">Review</text>`
      : `<text class="node-label" x="${node.x}" y="${node.y + 6}">${state}</text>`;

    return `
      <g class="state-node ${activeClass} ${finalClass}">
        <circle class="state-circle ${node.final ? "final" : ""}" cx="${node.x}" cy="${node.y}" r="60"></circle>
        ${node.final ? `<circle class="state-circle-inner" cx="${node.x}" cy="${node.y}" r="48"></circle>` : ""}
        ${yLines}
      </g>
    `;
  }).join("");

  svg.innerHTML = `
    ${createSharedDefs()}
    <rect class="svg-bg" x="0" y="0" width="1440" height="420" rx="26"></rect>
    ${edgesMarkup}
    ${nodesMarkup}
  `;
}

function syncMachines() {
  const selected = getSelectedRequest();
  const currentState = selected ? selected.state : null;
  const latestTransition = selected ? selected.lastTransition : null;
  renderSvg(el.heroSvg, currentState, latestTransition);
  renderSvg(el.mainSvg, currentState, latestTransition);
}

function renderFilters() {
  const types = ["All Types", ...new Set(requests.map((item) => item.type))];
  const states = ["All States", ...WORKFLOW_STATES];

  const prevType = el.filterType.value || "All Types";
  const prevState = el.filterState.value || "All States";

  el.filterType.innerHTML = types.map((type) => `<option ${type === prevType ? "selected" : ""}>${type}</option>`).join("");
  el.filterState.innerHTML = states.map((state) => `<option ${state === prevState ? "selected" : ""}>${state}</option>`).join("");
}

function renderStats() {
  const approved = requests.filter((item) => item.state === "Approved").length;
  const active = requests.filter((item) => item.state === "Under Review" || item.state === "Escalated").length;
  const rejected = requests.filter((item) => item.state === "Rejected").length;
  const selected = getSelectedRequest();

  el.heroTotal.textContent = String(requests.length);
  el.heroApproved.textContent = String(approved);
  el.heroActive.textContent = String(active);
  el.heroSelected.textContent = selected ? selected.state : "None";

  const approvalRate = requests.length ? Math.round((approved / requests.length) * 100) : 0;
  el.approvalRate.textContent = `${approvalRate}%`;
  el.activeReviews.textContent = String(active);
  el.summaryCurrent.textContent = selected ? selected.state : "None";
  el.transitionCount.textContent = String(historyLog.length);
}

function renderRequestList() {
  const typeFilter = el.filterType.value || "All Types";
  const stateFilter = el.filterState.value || "All States";

  const filtered = requests.filter((item) => {
    const matchesType = typeFilter === "All Types" || item.type === typeFilter;
    const matchesState = stateFilter === "All States" || item.state === stateFilter;
    return matchesType && matchesState;
  });

  if (!filtered.length) {
    el.requestList.innerHTML = `<div class="empty-box">No workflow requests match the current filters.</div>`;
    return;
  }

  el.requestList.innerHTML = "";
  filtered.forEach((item) => {
    const frag = el.template.content.cloneNode(true);
    const button = frag.querySelector(".request-item");
    button.classList.toggle("active", item.id === selectedId);

    frag.querySelector(".request-id").textContent = item.id;
    const priorityPill = frag.querySelector(".priority-pill");
    priorityPill.textContent = item.priority;
    priorityPill.classList.add(`priority-${item.priority.toLowerCase()}`);

    frag.querySelector(".request-item-title").textContent = item.title;
    frag.querySelector(".request-item-subtitle").textContent = `${item.requester} · ${item.type}`;

    const stateChip = frag.querySelector(".state-chip");
    stateChip.textContent = item.state;
    stateChip.classList.add(getStateClass(item.state));

    button.addEventListener("click", () => {
      selectedId = item.id;
      stopAutoplay();
      render();
    });

    el.requestList.appendChild(frag);
  });
}

function renderSelectedRequest() {
  const selected = getSelectedRequest();
  if (!selected) {
    el.selectedRequest.innerHTML = `<div class="empty-box">Select a workflow request to activate the control center and DFA simulation.</div>`;
    el.currentStateChip.textContent = "No Selection";
    el.currentStateChip.className = "state-chip neutral";
    return;
  }

  el.currentStateChip.textContent = selected.state;
  el.currentStateChip.className = `state-chip ${getStateClass(selected.state)}`;

  el.selectedRequest.innerHTML = `
    <div class="selected-request-card">
      <div class="selected-top">
        <div>
          <h3>${selected.title}</h3>
          <div class="selected-meta">${selected.id} · ${selected.requester} · ${selected.type}</div>
        </div>
        <span class="state-chip ${getStateClass(selected.state)}">${selected.state}</span>
      </div>
      <div class="selected-meta">Priority: ${selected.priority}</div>
      <p class="selected-details">${selected.details}</p>
    </div>
  `;
}

function renderControlButtons() {
  const selected = getSelectedRequest();
  if (!selected) {
    el.controlButtons.innerHTML = `<div class="empty-box">Dynamic transition actions will appear here after selecting a request.</div>`;
    return;
  }

  const actions = TRANSITIONS[selected.state] || [];
  if (!actions.length) {
    el.controlButtons.innerHTML = `<div class="empty-box">No valid transitions are available from the current state.</div>`;
    return;
  }

  el.controlButtons.innerHTML = "";
  actions.forEach((transition) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-primary";
    button.textContent = transition.label;
    button.addEventListener("click", () => {
      applyTransition(selected.id, transition.to);
    });
    el.controlButtons.appendChild(button);
  });
}

function renderJourney() {
  const selected = getSelectedRequest();
  if (!selected) {
    el.journeyTrack.innerHTML = `<div class="empty-box">The visited-state trace will appear here.</div>`;
    return;
  }

  el.journeyTrack.innerHTML = selected.visited.map((state, index) => `
    <span class="trace-pill ${index === selected.visited.length - 1 ? "active" : ""}">
      <span class="trace-index">${index + 1}</span>
      <span>${state}</span>
    </span>
  `).join("");
}

function renderHistory() {
  if (!historyLog.length) {
    el.historyList.innerHTML = `<div class="empty-box">No transitions have been recorded yet.</div>`;
    return;
  }

  el.historyList.innerHTML = historyLog
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .map((entry) => `
      <div class="history-item">
        <strong>${entry.message}</strong>
        <span>${formatTime(entry.timestamp)}</span>
      </div>
    `)
    .join("");
}

function addHistory(message) {
  historyLog.unshift({ message, timestamp: new Date().toISOString() });
}

function findTransitionLabel(fromState, toState) {
  const match = (TRANSITIONS[fromState] || []).find((item) => item.to === toState);
  return match ? match.action : "";
}

function applyTransition(id, nextState) {
  const request = requests.find((item) => item.id === id);
  if (!request || request.state === nextState) return;

  const valid = (TRANSITIONS[request.state] || []).some((item) => item.to === nextState);
  if (!valid) return;

  const prevState = request.state;
  request.state = nextState;
  request.visited.push(nextState);
  request.lastTransition = `${prevState}->${nextState}`;

  const action = findTransitionLabel(prevState, nextState);
  addHistory(`${request.id} applied input "${action}" and moved from ${prevState} to ${nextState}.`);
  render();
}

function runNextValidStep() {
  const selected = getSelectedRequest();
  if (!selected) return;

  const valid = TRANSITIONS[selected.state] || [];
  if (!valid.length) return;

  applyTransition(selected.id, valid[0].to);
}

function autoPathNextState(currentState) {
  if (currentState === "Submitted") return "Under Review";
  if (currentState === "Under Review") return "Escalated";
  if (currentState === "Escalated") return "Approved";
  if (currentState === "Approved") return "Reopened";
  if (currentState === "Rejected") return "Reopened";
  if (currentState === "Reopened") return "Submitted";
  return null;
}

function startAutoplay() {
  const selected = getSelectedRequest();
  if (!selected) return;

  stopAutoplay();
  autoplayTimer = window.setInterval(() => {
    const current = getSelectedRequest();
    if (!current) {
      stopAutoplay();
      return;
    }
    const next = autoPathNextState(current.state);
    if (!next) {
      stopAutoplay();
      return;
    }
    applyTransition(current.id, next);
  }, 1200);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

function resetSelectedRequest() {
  const selected = getSelectedRequest();
  if (!selected) return;

  const prevState = selected.state;
  if (prevState !== "Submitted") {
    selected.state = "Submitted";
    selected.visited.push("Submitted");
    selected.lastTransition = `${prevState}->Submitted`;
    addHistory(`${selected.id} was manually reset from ${prevState} to Submitted.`);
  } else {
    addHistory(`${selected.id} remained in Submitted after manual reset.`);
  }
  render();
}

function restoreDemoData() {
  stopAutoplay();
  requests = deepClone(DEMO_DATA);
  historyLog = deepClone(HISTORY_SEED);
  selectedId = requests[0]?.id || null;
  renderFilters();
  render();
}

function handleCreateRequest(event) {
  event.preventDefault();

  const requester = document.getElementById("requester-name").value.trim();
  const type = document.getElementById("workflow-type").value;
  const title = document.getElementById("request-title").value.trim();
  const priority = document.getElementById("request-priority").value;
  const details = document.getElementById("request-details").value.trim();

  if (!requester || !title || !details) return;

  const item = {
    id: nextId(),
    requester,
    type,
    title,
    priority,
    details,
    state: "Submitted",
    visited: ["Submitted"],
    lastTransition: "START->Submitted"
  };

  requests.unshift(item);
  selectedId = item.id;
  addHistory(`${item.id} was created and entered the Submitted state.`);
  el.form.reset();
  document.getElementById("workflow-type").value = "Leave Request";
  document.getElementById("request-priority").value = "Medium";
  renderFilters();
  render();
}

function render() {
  renderStats();
  renderRequestList();
  renderSelectedRequest();
  renderControlButtons();
  renderJourney();
  renderHistory();
  syncMachines();
}

function initEvents() {
  el.filterType.addEventListener("change", renderRequestList);
  el.filterState.addEventListener("change", renderRequestList);
  el.form.addEventListener("submit", handleCreateRequest);
  el.resetDemoBtn.addEventListener("click", restoreDemoData);
  el.runDemoPath.addEventListener("click", startAutoplay);
  el.pauseDemo.addEventListener("click", stopAutoplay);
  el.stepNext.addEventListener("click", () => {
    stopAutoplay();
    runNextValidStep();
  });
  el.resetSelected.addEventListener("click", () => {
    stopAutoplay();
    resetSelectedRequest();
  });
}

function init() {
  restoreDemoData();
  initEvents();
}

init();
