const STORAGE_KEYS = {
  apiBase: "ai_workflow_api_base",
  token: "ai_workflow_token",
  activeProject: "ai_workflow_active_project",
  activeTab: "ai_workflow_active_tab",
};

const state = {
  apiBase: localStorage.getItem(STORAGE_KEYS.apiBase) || defaultApiBase(),
  token: localStorage.getItem(STORAGE_KEYS.token) || "",
  activeProjectId: localStorage.getItem(STORAGE_KEYS.activeProject) || "",
  activeTab: localStorage.getItem(STORAGE_KEYS.activeTab) || "dashboard",
  projects: [],
  rfis: [],
  submittals: [],
  changeOrders: [],
  dailyReports: [],
  documents: [],
  selectedDocId: null,
};

const $ = (id) => document.getElementById(id);

const els = {
  statusText: $("statusText"),
  healthBadge: $("healthBadge"),
  tokenState: $("tokenState"),
  apiBaseInput: $("apiBaseInput"),
  saveApiBaseBtn: $("saveApiBaseBtn"),
  loginBtn: $("loginBtn"),
  logoutBtn: $("logoutBtn"),
  emailInput: $("emailInput"),
  passwordInput: $("passwordInput"),
  projectSelect: $("projectSelect"),
  seedDemoBtn: $("seedDemoBtn"),
};

function defaultApiBase() {
  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") {
    return "http://127.0.0.1:8101/api/v1";
  }
  return `${window.location.origin}/api/v1`;
}

function setStatus(message, type = "info") {
  els.statusText.textContent = message;
  const colors = {
    info: "#eaf5ef",
    success: "#b7ffd2",
    warn: "#ffe2a9",
    error: "#ffc1c1",
  };
  els.statusText.style.color = colors[type] || colors.info;
}

function setToken(token) {
  state.token = token;
  if (token) localStorage.setItem(STORAGE_KEYS.token, token);
  else localStorage.removeItem(STORAGE_KEYS.token);
  els.tokenState.textContent = token ? "Authenticated" : "Not authenticated";
}

function setApiBase(url) {
  state.apiBase = url.replace(/\/$/, "");
  localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
  els.apiBaseInput.value = state.apiBase;
}

function setActiveProject(id) {
  state.activeProjectId = id || "";
  if (id) localStorage.setItem(STORAGE_KEYS.activeProject, id);
  else localStorage.removeItem(STORAGE_KEYS.activeProject);
  els.projectSelect.value = id || "";
  updateScopeLabels();
  document.querySelectorAll(".project-card").forEach((el) => {
    el.classList.toggle("is-active", el.dataset.id === id);
  });
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function request(path, options = {}) {
  const { auth = true, form = false } = options;
  const headers = {};
  if (auth) Object.assign(headers, authHeaders());
  if (!form && options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${state.apiBase}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed (${response.status})`);
  }
  if (response.status === 204) return null;
  const ct = response.headers.get("content-type") || "";
  return ct.includes("application/json") ? response.json() : null;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function statusBadge(status) {
  return `<span class="status-badge status-${escapeHtml(status)}">${escapeHtml(status)}</span>`;
}

function fmtDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function fmtMoney(amount) {
  if (amount === null || amount === undefined || amount === "") return "—";
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function projectQuery() {
  return state.activeProjectId
    ? `?project_id=${encodeURIComponent(state.activeProjectId)}`
    : "";
}

function activeProjectName() {
  if (!state.activeProjectId) return "all projects";
  const p = state.projects.find((p) => p.id === state.activeProjectId);
  return p ? `${p.number} · ${p.name}` : "selected project";
}

function updateScopeLabels() {
  const label = `(${activeProjectName()})`;
  ["rfiScope", "subScope", "coScope", "drScope", "docScope"].forEach((id) => {
    const el = $(id);
    if (el) el.textContent = label;
  });
}

// ---- Tabs -------------------------------------------------------------------

function activateTab(tab) {
  state.activeTab = tab;
  localStorage.setItem(STORAGE_KEYS.activeTab, tab);
  document.querySelectorAll(".tab").forEach((b) => {
    b.classList.toggle("is-active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("hidden", p.dataset.panel !== tab);
  });
  loadTab(tab).catch((err) => setStatus(`Tab load failed: ${err.message}`, "error"));
}

async function loadTab(tab) {
  if (!state.token && tab !== "dashboard") return;
  switch (tab) {
    case "dashboard":
      await loadDashboard();
      break;
    case "projects":
      await loadProjects();
      break;
    case "rfis":
      await loadRfis();
      break;
    case "submittals":
      await loadSubmittals();
      break;
    case "change_orders":
      await loadChangeOrders();
      break;
    case "daily_reports":
      await loadDailyReports();
      break;
    case "documents":
      await loadDocuments();
      break;
    case "search":
      // Search is on-demand; nothing to preload.
      break;
  }
}

// ---- Dashboard --------------------------------------------------------------

async function loadDashboard() {
  if (!state.token) {
    ["metricProjects", "metricOpenRfis", "metricPendingSubs",
     "metricCoAmount", "metricDocs", "metricIndexed"].forEach((id) => {
      $(id).textContent = "—";
    });
    return;
  }
  try {
    const [projects, rfis, subs, cos, docs] = await Promise.all([
      request("/projects"),
      request("/rfis"),
      request("/submittals"),
      request("/change-orders"),
      request("/documents"),
    ]);
    $("metricProjects").textContent = projects.length;
    $("metricOpenRfis").textContent = rfis.filter((r) => r.status === "open").length;
    $("metricPendingSubs").textContent = subs.filter(
      (s) => s.status === "pending" || s.status === "under_review"
    ).length;
    const coTotal = cos
      .filter((c) => c.status === "submitted" || c.status === "approved")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    $("metricCoAmount").textContent = fmtMoney(coTotal);
    $("metricDocs").textContent = docs.length;
    $("metricIndexed").textContent = docs.filter((d) => d.status === "indexed").length;
  } catch (err) {
    setStatus(`Dashboard load failed: ${err.message}`, "error");
  }
}

// ---- Projects ---------------------------------------------------------------

async function loadProjects() {
  if (!state.token) return;
  state.projects = await request("/projects");
  renderProjects();
  renderProjectSelect();
  updateScopeLabels();
}

function renderProjects() {
  const container = $("projectCards");
  container.innerHTML = "";
  if (!state.projects.length) {
    container.innerHTML = '<p class="muted">No projects yet. Create one or click "Seed Demo".</p>';
    return;
  }
  for (const p of state.projects) {
    const card = document.createElement("div");
    card.className = "project-card";
    card.dataset.id = p.id;
    if (p.id === state.activeProjectId) card.classList.add("is-active");
    card.innerHTML = `
      <div class="num">${escapeHtml(p.number)}</div>
      <h4>${escapeHtml(p.name)}</h4>
      <div class="meta">${escapeHtml(p.location || "—")}</div>
      <div class="meta">Owner: ${escapeHtml(p.owner || "—")}</div>
      <div style="margin-top:8px">${statusBadge(p.status)}</div>
    `;
    card.addEventListener("click", () => setActiveProject(p.id));
    container.appendChild(card);
  }
}

function renderProjectSelect() {
  const sel = els.projectSelect;
  const current = state.activeProjectId;
  sel.innerHTML = '<option value="">All projects</option>';
  for (const p of state.projects) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.number} · ${p.name}`;
    sel.appendChild(opt);
  }
  sel.value = current && state.projects.some((p) => p.id === current) ? current : "";
  if (sel.value !== current) setActiveProject(sel.value);
}

// ---- RFIs -------------------------------------------------------------------

async function loadRfis() {
  if (!state.token) return;
  state.rfis = await request(`/rfis${projectQuery()}`);
  renderRfis();
}

function renderRfis() {
  const tbody = $("rfisBody");
  tbody.innerHTML = "";
  if (!state.rfis.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="muted">No RFIs.</td></tr>';
    return;
  }
  for (const r of state.rfis) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(r.number)}</td>
      <td>${escapeHtml(r.subject)}</td>
      <td>${escapeHtml(r.spec_section || "—")}</td>
      <td>${escapeHtml(r.drawing_ref || "—")}</td>
      <td>${escapeHtml(r.assignee || "—")}</td>
      <td>${escapeHtml(fmtDate(r.due_date))}</td>
      <td>${statusBadge(r.status)}</td>
      <td class="actions-cell">${rfiActions(r)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function rfiActions(r) {
  const transitions = {
    draft: ["open"],
    open: ["answered", "closed"],
    answered: ["closed", "open"],
    closed: [],
  };
  const next = transitions[r.status] || [];
  return next
    .map(
      (s) =>
        `<button class="btn btn-secondary btn-mini" data-rfi="${r.id}" data-status="${s}">→ ${s}</button>`
    )
    .join("");
}

// ---- Submittals -------------------------------------------------------------

async function loadSubmittals() {
  if (!state.token) return;
  state.submittals = await request(`/submittals${projectQuery()}`);
  renderSubmittals();
}

function renderSubmittals() {
  const tbody = $("submittalsBody");
  tbody.innerHTML = "";
  if (!state.submittals.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="muted">No submittals.</td></tr>';
    return;
  }
  for (const s of state.submittals) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(s.number)}</td>
      <td>${escapeHtml(s.title)}</td>
      <td>${escapeHtml(s.spec_section || "—")}</td>
      <td>${escapeHtml(s.revision || "—")}</td>
      <td>${escapeHtml(s.submitted_by || "—")}</td>
      <td>${escapeHtml(s.reviewer || "—")}</td>
      <td>${statusBadge(s.status)}</td>
      <td class="actions-cell">${submittalActions(s)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function submittalActions(s) {
  const transitions = {
    pending: ["under_review"],
    under_review: ["approved", "approved_as_noted", "revise_resubmit", "rejected"],
    approved: [],
    approved_as_noted: [],
    revise_resubmit: ["pending"],
    rejected: [],
  };
  const next = transitions[s.status] || [];
  return next
    .map(
      (st) =>
        `<button class="btn btn-secondary btn-mini" data-submittal="${s.id}" data-status="${st}">→ ${st}</button>`
    )
    .join("");
}

// ---- Change Orders ----------------------------------------------------------

async function loadChangeOrders() {
  if (!state.token) return;
  state.changeOrders = await request(`/change-orders${projectQuery()}`);
  renderChangeOrders();
}

function renderChangeOrders() {
  const tbody = $("coBody");
  tbody.innerHTML = "";
  if (!state.changeOrders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">No change orders.</td></tr>';
    return;
  }
  for (const c of state.changeOrders) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(c.number)}</td>
      <td>${escapeHtml(c.description || "—")}</td>
      <td>${fmtMoney(c.amount)}</td>
      <td>${escapeHtml(c.schedule_impact_days ?? "—")}</td>
      <td>${escapeHtml(c.reason || "—")}</td>
      <td>${statusBadge(c.status)}</td>
      <td class="actions-cell">${coActions(c)}</td>
    `;
    tbody.appendChild(tr);
  }
}

function coActions(c) {
  const transitions = {
    proposed: ["submitted"],
    submitted: ["approved", "rejected"],
    approved: [],
    rejected: [],
  };
  const next = transitions[c.status] || [];
  return next
    .map(
      (s) =>
        `<button class="btn btn-secondary btn-mini" data-co="${c.id}" data-status="${s}">→ ${s}</button>`
    )
    .join("");
}

// ---- Daily Reports ----------------------------------------------------------

async function loadDailyReports() {
  if (!state.token) return;
  state.dailyReports = await request(`/daily-reports${projectQuery()}`);
  renderDailyReports();
}

function renderDailyReports() {
  const tbody = $("drBody");
  tbody.innerHTML = "";
  if (!state.dailyReports.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">No daily reports.</td></tr>';
    return;
  }
  for (const r of state.dailyReports) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHtml(fmtDate(r.report_date))}</td>
      <td>${escapeHtml(r.weather || "—")} ${r.temperature_f ? `(${r.temperature_f}°F)` : ""}</td>
      <td>${escapeHtml(r.crew_count ?? "—")}</td>
      <td>${escapeHtml(r.trades_on_site || "—")}</td>
      <td>${escapeHtml(r.work_performed || "—")}</td>
      <td>${escapeHtml(r.delays || "—")}</td>
      <td>${escapeHtml(r.author || "—")}</td>
    `;
    tbody.appendChild(tr);
  }
}

// ---- Documents --------------------------------------------------------------

async function loadDocuments() {
  if (!state.token) return;
  state.documents = await request("/documents");
  renderDocuments();
}

function renderDocuments() {
  const tbody = $("documentsBody");
  tbody.innerHTML = "";
  if (!state.documents.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">No documents uploaded yet.</td></tr>';
    return;
  }
  for (const d of state.documents) {
    const tr = document.createElement("tr");
    tr.dataset.docId = d.id;
    const conf = d.confidence == null ? "—" : `${(d.confidence * 100).toFixed(0)}%`;
    tr.innerHTML = `
      <td>${escapeHtml(d.filename)}</td>
      <td>${d.doc_type ? statusBadge(d.doc_type) : "—"}</td>
      <td>${statusBadge(d.status)}</td>
      <td>${escapeHtml(conf)}</td>
      <td>${escapeHtml(d.workflow_id ? d.workflow_id.slice(0, 8) : "—")}</td>
      <td>${escapeHtml(new Date(d.created_at).toLocaleString())}</td>
      <td class="actions-cell">
        <button class="btn btn-secondary btn-mini" data-reindex="${d.id}">Reindex</button>
        <button class="btn btn-secondary btn-mini" data-classify="${d.id}">Classify</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function loadDocDetail(id) {
  state.selectedDocId = id;
  const detail = $("docDetail");
  detail.classList.remove("muted");
  try {
    const doc = await request(`/documents/${id}`);
    const fields = doc.extracted_fields || {};
    const rows = [
      ["Filename", doc.filename],
      ["Type", doc.doc_type || "—"],
      ["Status", doc.status],
      ["Confidence", doc.confidence == null ? "—" : (doc.confidence * 100).toFixed(0) + "%"],
    ];
    for (const [k, v] of Object.entries(fields)) {
      rows.push([k, v ?? "—"]);
    }
    detail.innerHTML = rows
      .map(
        ([k, v]) =>
          `<div class="field-key">${escapeHtml(k)}</div><div class="field-val">${escapeHtml(v)}</div>`
      )
      .join("");
  } catch (err) {
    detail.classList.add("muted");
    detail.textContent = `Load failed: ${err.message}`;
  }
}

// ---- Search -----------------------------------------------------------------

function renderSearchResults(results) {
  const list = $("searchResults");
  list.innerHTML = "";
  if (!results.length) {
    list.innerHTML = "<li>No results found.</li>";
    return;
  }
  for (const r of results) {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(r.filename)}</strong>
      ${r.doc_type ? statusBadge(r.doc_type) : ""}
      <div class="muted">Score: ${Number(r.score || 0).toFixed(2)}</div>
      <div class="result-snippet">${escapeHtml(r.snippet || "No snippet available.")}</div>
    `;
    list.appendChild(li);
  }
}

// ---- Health -----------------------------------------------------------------

async function refreshHealth() {
  try {
    const health = await request("/health", { auth: false });
    const search = health.services?.search || "unknown";
    const storage = health.services?.storage || "unknown";
    els.healthBadge.textContent = `Health: OK (${storage}, ${search})`;
    setStatus("Connected to API.", "success");
  } catch (err) {
    els.healthBadge.textContent = "Health: Offline";
    setStatus(`Health check failed: ${err.message}`, "warn");
  }
}

// ---- Bootstrap --------------------------------------------------------------

async function bootstrap() {
  setApiBase(state.apiBase);
  setToken(state.token);
  await refreshHealth();
  if (state.token) {
    try {
      await loadProjects();
    } catch (err) {
      setStatus(`Session restore failed: ${err.message}`, "warn");
    }
  }
  activateTab(state.activeTab);
}

// ---- Wiring -----------------------------------------------------------------

document.querySelectorAll(".tab").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

els.saveApiBaseBtn.addEventListener("click", async () => {
  const v = els.apiBaseInput.value.trim();
  if (!v) return setStatus("API base URL cannot be empty.", "error");
  setApiBase(v);
  await refreshHealth();
});

els.loginBtn.addEventListener("click", async () => {
  const payload = new URLSearchParams();
  payload.set("username", els.emailInput.value.trim());
  payload.set("password", els.passwordInput.value);
  try {
    const tokenData = await request("/auth/token", {
      method: "POST",
      auth: false,
      form: true,
      body: payload,
    });
    setToken(tokenData.access_token);
    await loadProjects();
    activateTab(state.activeTab);
    setStatus("Login successful.", "success");
  } catch (err) {
    setToken("");
    setStatus(`Login failed: ${err.message}`, "error");
  }
});

els.logoutBtn.addEventListener("click", () => {
  setToken("");
  state.projects = [];
  state.rfis = [];
  state.submittals = [];
  state.changeOrders = [];
  state.dailyReports = [];
  state.documents = [];
  setActiveProject("");
  renderProjects();
  renderProjectSelect();
  ["rfisBody", "submittalsBody", "coBody", "drBody", "documentsBody"].forEach((id) => {
    const el = $(id);
    if (el) el.innerHTML = "";
  });
  $("docDetail").classList.add("muted");
  $("docDetail").textContent = "Click a row above to see extracted fields.";
  $("searchResults").innerHTML = "";
  setStatus("Signed out.", "info");
});

els.projectSelect.addEventListener("change", async () => {
  setActiveProject(els.projectSelect.value);
  await loadTab(state.activeTab);
});

els.seedDemoBtn.addEventListener("click", async () => {
  if (!state.token) return setStatus("Sign in first.", "warn");
  try {
    const res = await request("/admin/seed", { method: "POST" });
    setStatus(
      res.created
        ? `Demo project created (${res.counts.rfis} RFIs, ${res.counts.submittals} submittals).`
        : "Demo project already exists.",
      "success"
    );
    await loadProjects();
    setActiveProject(res.project_id);
    await loadTab(state.activeTab);
  } catch (err) {
    setStatus(`Seed failed: ${err.message}`, "error");
  }
});

// Projects tab
$("projectForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.token) return setStatus("Sign in first.", "warn");
  try {
    await request("/projects", {
      method: "POST",
      body: JSON.stringify({
        number: $("pNumber").value.trim(),
        name: $("pName").value.trim(),
        location: $("pLocation").value.trim(),
        owner: $("pOwner").value.trim(),
      }),
    });
    e.target.reset();
    await loadProjects();
    setStatus("Project created.", "success");
  } catch (err) {
    setStatus(`Create project failed: ${err.message}`, "error");
  }
});
$("refreshProjectsBtn").addEventListener("click", () =>
  loadProjects().then(() => setStatus("Projects refreshed.", "success"))
);

// RFIs tab
$("rfiForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.activeProjectId)
    return setStatus("Select an Active Project first.", "warn");
  try {
    await request("/rfis", {
      method: "POST",
      body: JSON.stringify({
        project_id: state.activeProjectId,
        number: $("rfiNumber").value.trim(),
        subject: $("rfiSubject").value.trim(),
        question: $("rfiQuestion").value.trim(),
        spec_section: $("rfiSpec").value.trim() || null,
        drawing_ref: $("rfiDrawing").value.trim() || null,
        assignee: $("rfiAssignee").value.trim() || null,
        due_date: $("rfiDue").value || null,
      }),
    });
    e.target.reset();
    await loadRfis();
    setStatus("RFI created.", "success");
  } catch (err) {
    setStatus(`Create RFI failed: ${err.message}`, "error");
  }
});
$("refreshRfisBtn").addEventListener("click", () => loadRfis());
$("rfisBody").addEventListener("click", async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.getAttribute("data-rfi");
  const status = t.getAttribute("data-status");
  if (!id || !status) return;
  try {
    await request(`/rfis/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setStatus(`RFI → ${status}`, "success");
    await loadRfis();
  } catch (err) {
    setStatus(`Transition failed: ${err.message}`, "error");
  }
});

// Submittals tab
$("submittalForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.activeProjectId)
    return setStatus("Select an Active Project first.", "warn");
  try {
    await request("/submittals", {
      method: "POST",
      body: JSON.stringify({
        project_id: state.activeProjectId,
        number: $("subNumber").value.trim(),
        title: $("subTitle").value.trim(),
        spec_section: $("subSpec").value.trim() || null,
        revision: $("subRev").value.trim() || null,
        submitted_by: $("subBy").value.trim() || null,
        reviewer: $("subReviewer").value.trim() || null,
      }),
    });
    e.target.reset();
    await loadSubmittals();
    setStatus("Submittal created.", "success");
  } catch (err) {
    setStatus(`Create submittal failed: ${err.message}`, "error");
  }
});
$("refreshSubmittalsBtn").addEventListener("click", () => loadSubmittals());
$("submittalsBody").addEventListener("click", async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.getAttribute("data-submittal");
  const status = t.getAttribute("data-status");
  if (!id || !status) return;
  try {
    await request(`/submittals/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setStatus(`Submittal → ${status}`, "success");
    await loadSubmittals();
  } catch (err) {
    setStatus(`Transition failed: ${err.message}`, "error");
  }
});

// Change Orders tab
$("coForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.activeProjectId)
    return setStatus("Select an Active Project first.", "warn");
  try {
    const amount = $("coAmount").value;
    const days = $("coDays").value;
    await request("/change-orders", {
      method: "POST",
      body: JSON.stringify({
        project_id: state.activeProjectId,
        number: $("coNumber").value.trim(),
        description: $("coDescription").value.trim(),
        amount: amount === "" ? null : Number(amount),
        schedule_impact_days: days === "" ? null : Number(days),
        reason: $("coReason").value.trim() || null,
      }),
    });
    e.target.reset();
    await loadChangeOrders();
    setStatus("Change order created.", "success");
  } catch (err) {
    setStatus(`Create CO failed: ${err.message}`, "error");
  }
});
$("refreshCoBtn").addEventListener("click", () => loadChangeOrders());
$("coBody").addEventListener("click", async (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  const id = t.getAttribute("data-co");
  const status = t.getAttribute("data-status");
  if (!id || !status) return;
  try {
    await request(`/change-orders/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setStatus(`Change order → ${status}`, "success");
    await loadChangeOrders();
  } catch (err) {
    setStatus(`Transition failed: ${err.message}`, "error");
  }
});

// Daily Reports tab
$("drForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.activeProjectId)
    return setStatus("Select an Active Project first.", "warn");
  try {
    const temp = $("drTemp").value;
    const crew = $("drCrew").value;
    await request("/daily-reports", {
      method: "POST",
      body: JSON.stringify({
        project_id: state.activeProjectId,
        report_date: $("drDate").value,
        weather: $("drWeather").value.trim() || null,
        temperature_f: temp === "" ? null : Number(temp),
        crew_count: crew === "" ? null : Number(crew),
        trades_on_site: $("drTrades").value.trim() || null,
        work_performed: $("drWork").value.trim(),
        delays: $("drDelays").value.trim() || null,
        author: $("drAuthor").value.trim() || null,
      }),
    });
    e.target.reset();
    await loadDailyReports();
    setStatus("Daily report created.", "success");
  } catch (err) {
    setStatus(`Create daily report failed: ${err.message}`, "error");
  }
});
$("refreshDrBtn").addEventListener("click", () => loadDailyReports());

// Documents tab — drag & drop + actions
const dropzone = $("dropzone");
const fileInput = $("fileInput");

async function uploadFile(file) {
  if (!state.token) return setStatus("Sign in first.", "warn");
  if (!file) return;
  const fd = new FormData();
  fd.append("file", file);
  const params = [];
  if (state.activeProjectId) params.push(`project_id=${encodeURIComponent(state.activeProjectId)}`);
  const qs = params.length ? `?${params.join("&")}` : "";
  try {
    const res = await request(`/documents/upload${qs}`, { method: "POST", body: fd });
    setStatus(`Uploaded "${file.name}" — task ${res.task_id || "n/a"}`, "success");
    await loadDocuments();
  } catch (err) {
    setStatus(`Upload failed: ${err.message}`, "error");
  }
}

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("is-hover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("is-hover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("is-hover");
  if (e.dataTransfer?.files?.length) uploadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files?.length) uploadFile(fileInput.files[0]);
  fileInput.value = "";
});

$("refreshDocumentsBtn").addEventListener("click", () =>
  loadDocuments().then(() => setStatus("Documents refreshed.", "success"))
);
$("documentsBody").addEventListener("click", async (e) => {
  const t = e.target;
  const tr = t.closest && t.closest("tr");
  if (t instanceof HTMLElement) {
    const reindexId = t.getAttribute("data-reindex");
    const classifyId = t.getAttribute("data-classify");
    if (reindexId) {
      try {
        await request(`/documents/${reindexId}/reindex`, { method: "POST" });
        setStatus("Reindex queued.", "success");
        await loadDocuments();
      } catch (err) {
        setStatus(`Reindex failed: ${err.message}`, "error");
      }
      return;
    }
    if (classifyId) {
      try {
        await request(`/documents/${classifyId}/classify`, { method: "POST" });
        setStatus("Classify queued.", "success");
        await loadDocuments();
      } catch (err) {
        setStatus(`Classify failed: ${err.message}`, "error");
      }
      return;
    }
  }
  if (tr && tr.dataset && tr.dataset.docId) {
    loadDocDetail(tr.dataset.docId);
  }
});

// Search tab
$("searchForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.token) return setStatus("Sign in first.", "warn");
  const q = $("searchInput").value.trim();
  if (q.length < 2) return setStatus("Query must be at least 2 chars.", "warn");
  const params = [`query=${encodeURIComponent(q)}`];
  const t = $("searchDocType").value;
  const s = $("searchSpec").value.trim();
  if (t) params.push(`doc_type=${encodeURIComponent(t)}`);
  if (s) params.push(`spec_section=${encodeURIComponent(s)}`);
  try {
    const results = await request(`/documents/search/query?${params.join("&")}`);
    renderSearchResults(results);
    setStatus(`Search completed (${results.length} results).`, "success");
  } catch (err) {
    setStatus(`Search failed: ${err.message}`, "error");
  }
});

bootstrap();
