const STORAGE_KEYS = {
  apiBase: "ai_workflow_api_base",
  token: "ai_workflow_token",
};

const state = {
  apiBase: localStorage.getItem(STORAGE_KEYS.apiBase) || defaultApiBase(),
  token: localStorage.getItem(STORAGE_KEYS.token) || "",
  workflows: [],
  documents: [],
};

const els = {
  statusText: document.getElementById("statusText"),
  healthBadge: document.getElementById("healthBadge"),
  tokenState: document.getElementById("tokenState"),
  apiBaseInput: document.getElementById("apiBaseInput"),
  connectionForm: document.getElementById("connectionForm"),
  loginForm: document.getElementById("loginForm"),
  logoutBtn: document.getElementById("logoutBtn"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),
  workflowForm: document.getElementById("workflowForm"),
  workflowName: document.getElementById("workflowName"),
  workflowDescription: document.getElementById("workflowDescription"),
  workflowStatus: document.getElementById("workflowStatus"),
  workflowSelect: document.getElementById("workflowSelect"),
  workflowsList: document.getElementById("workflowsList"),
  refreshWorkflowsBtn: document.getElementById("refreshWorkflowsBtn"),
  uploadForm: document.getElementById("uploadForm"),
  fileInput: document.getElementById("fileInput"),
  refreshDocumentsBtn: document.getElementById("refreshDocumentsBtn"),
  documentsBody: document.getElementById("documentsBody"),
  searchForm: document.getElementById("searchForm"),
  searchInput: document.getElementById("searchInput"),
  searchResults: document.getElementById("searchResults"),
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
  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.token);
  }
  els.tokenState.textContent = token ? "Authenticated" : "Not authenticated";
}

function setApiBase(url) {
  state.apiBase = url.replace(/\/$/, "");
  localStorage.setItem(STORAGE_KEYS.apiBase, state.apiBase);
  els.apiBaseInput.value = state.apiBase;
}

function authHeaders() {
  return state.token ? { Authorization: `Bearer ${state.token}` } : {};
}

async function request(path, options = {}) {
  const { auth = true, form = false } = options;
  const headers = {};
  if (auth) {
    Object.assign(headers, authHeaders());
  }
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

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return null;
}

function workflowNameById(id) {
  if (!id) return "None";
  const match = state.workflows.find((wf) => wf.id === id);
  return match ? match.name : id.slice(0, 8);
}

function renderWorkflows() {
  els.workflowsList.innerHTML = "";
  if (state.workflows.length === 0) {
    els.workflowsList.innerHTML = "<li>No workflows yet.</li>";
  } else {
    state.workflows.forEach((wf) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${escapeHtml(wf.name)}</strong>
        <div class="muted">${escapeHtml(wf.description || "No description")} | ${escapeHtml(wf.status)}</div>
      `;
      els.workflowsList.appendChild(li);
    });
  }

  const current = els.workflowSelect.value;
  els.workflowSelect.innerHTML = `<option value="">No workflow</option>`;
  state.workflows.forEach((wf) => {
    const option = document.createElement("option");
    option.value = wf.id;
    option.textContent = wf.name;
    els.workflowSelect.appendChild(option);
  });
  if (current) {
    els.workflowSelect.value = current;
  }
}

function renderDocuments() {
  els.documentsBody.innerHTML = "";
  if (state.documents.length === 0) {
    els.documentsBody.innerHTML =
      '<tr><td colspan="5" class="muted">No documents uploaded yet.</td></tr>';
    return;
  }

  state.documents.forEach((doc) => {
    const tr = document.createElement("tr");
    const created = new Date(doc.created_at).toLocaleString();
    const statusClass = `status-${doc.status}`;
    tr.innerHTML = `
      <td>${escapeHtml(doc.filename)}</td>
      <td><span class="status-badge ${statusClass}">${escapeHtml(doc.status)}</span></td>
      <td>${escapeHtml(workflowNameById(doc.workflow_id))}</td>
      <td>${escapeHtml(created)}</td>
      <td><button class="btn btn-secondary" data-reindex="${doc.id}">Reindex</button></td>
    `;
    els.documentsBody.appendChild(tr);
  });
}

function renderSearchResults(results) {
  els.searchResults.innerHTML = "";
  if (!results.length) {
    els.searchResults.innerHTML = "<li>No results found.</li>";
    return;
  }
  results.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${escapeHtml(item.filename)}</strong>
      <div class="muted">Score: ${Number(item.score || 0).toFixed(2)}</div>
      <div class="result-snippet">${escapeHtml(item.snippet || "No snippet available.")}</div>
    `;
    els.searchResults.appendChild(li);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function refreshHealth() {
  try {
    const health = await request("/health", { auth: false });
    const search = health.services?.search || "unknown";
    const storage = health.services?.storage || "unknown";
    els.healthBadge.textContent = `Health: OK (${storage}, ${search})`;
    setStatus("Connected to API.", "success");
  } catch (error) {
    els.healthBadge.textContent = "Health: Offline";
    setStatus(`Health check failed: ${error.message}`, "warn");
  }
}

async function loadWorkflows() {
  if (!state.token) return;
  const workflows = await request("/workflows");
  state.workflows = workflows;
  renderWorkflows();
}

async function loadDocuments() {
  if (!state.token) return;
  const docs = await request("/documents");
  state.documents = docs;
  renderDocuments();
}

async function bootstrap() {
  setApiBase(state.apiBase);
  setToken(state.token);
  await refreshHealth();
  if (state.token) {
    try {
      await Promise.all([loadWorkflows(), loadDocuments()]);
      setStatus("Authenticated session restored.", "success");
    } catch (error) {
      setStatus(`Session restore failed: ${error.message}`, "warn");
    }
  }
}

els.connectionForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = els.apiBaseInput.value.trim();
  if (!input) {
    setStatus("API base URL cannot be empty.", "error");
    return;
  }
  setApiBase(input);
  await refreshHealth();
});

els.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
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
    await Promise.all([loadWorkflows(), loadDocuments()]);
    setStatus("Login successful.", "success");
  } catch (error) {
    setToken("");
    setStatus(`Login failed: ${error.message}`, "error");
  }
});

els.logoutBtn.addEventListener("click", () => {
  setToken("");
  state.workflows = [];
  state.documents = [];
  renderWorkflows();
  renderDocuments();
  renderSearchResults([]);
  setStatus("Signed out.", "info");
});

els.workflowForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  try {
    await request("/workflows", {
      method: "POST",
      body: JSON.stringify({
        name: els.workflowName.value.trim(),
        description: els.workflowDescription.value.trim(),
        status: els.workflowStatus.value,
      }),
    });
    els.workflowForm.reset();
    els.workflowStatus.value = "active";
    await loadWorkflows();
    setStatus("Workflow created.", "success");
  } catch (error) {
    setStatus(`Create workflow failed: ${error.message}`, "error");
  }
});

els.refreshWorkflowsBtn.addEventListener("click", async () => {
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  try {
    await loadWorkflows();
    setStatus("Workflows refreshed.", "success");
  } catch (error) {
    setStatus(`Refresh workflows failed: ${error.message}`, "error");
  }
});

els.uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  if (!els.fileInput.files || !els.fileInput.files.length) {
    setStatus("Select a file to upload.", "warn");
    return;
  }
  const fd = new FormData();
  fd.append("file", els.fileInput.files[0]);

  const workflowId = els.workflowSelect.value;
  const query = workflowId ? `?workflow_id=${encodeURIComponent(workflowId)}` : "";

  try {
    const response = await request(`/documents/upload${query}`, {
      method: "POST",
      body: fd,
    });
    els.uploadForm.reset();
    await loadDocuments();
    setStatus(
      `Document queued for indexing. Task: ${response.task_id || "n/a"}`,
      "success",
    );
  } catch (error) {
    setStatus(`Upload failed: ${error.message}`, "error");
  }
});

els.refreshDocumentsBtn.addEventListener("click", async () => {
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  try {
    await loadDocuments();
    setStatus("Documents refreshed.", "success");
  } catch (error) {
    setStatus(`Refresh documents failed: ${error.message}`, "error");
  }
});

els.documentsBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const id = target.getAttribute("data-reindex");
  if (!id) return;
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  try {
    await request(`/documents/${id}/reindex`, { method: "POST" });
    setStatus("Reindex task queued.", "success");
    await loadDocuments();
  } catch (error) {
    setStatus(`Reindex failed: ${error.message}`, "error");
  }
});

els.searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.token) {
    setStatus("Sign in first.", "warn");
    return;
  }
  const query = els.searchInput.value.trim();
  if (query.length < 2) {
    setStatus("Search query must be at least 2 characters.", "warn");
    return;
  }
  try {
    const results = await request(`/documents/search/query?query=${encodeURIComponent(query)}`);
    renderSearchResults(results);
    setStatus(`Search completed (${results.length} results).`, "success");
  } catch (error) {
    setStatus(`Search failed: ${error.message}`, "error");
  }
});

bootstrap();
