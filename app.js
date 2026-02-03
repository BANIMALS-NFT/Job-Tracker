(function () {
  const STORAGE_KEY = "cfm_job_tracker_v1";

  const form = document.getElementById("jobForm");
  const jobId = document.getElementById("jobId");
  const company = document.getElementById("company");
  const role = document.getElementById("role");
  const locationEl = document.getElementById("location");
  const dateApplied = document.getElementById("dateApplied");
  const followUp = document.getElementById("followUp");
  const status = document.getElementById("status");
  const notes = document.getElementById("notes");

  const list = document.getElementById("list");
  const counts = document.getElementById("counts");
  const search = document.getElementById("search");
  const statusFilter = document.getElementById("statusFilter");

  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");

  function uid() {
    return String(Date.now()) + String(Math.floor(Math.random() * 10000));
  }

  function loadJobs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveJobs(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function normalize(s) {
    return (s || "").toLowerCase().trim();
  }

  function formatDate(d) {
    if (!d) return "";
    return d;
  }

  function badge(text) {
    return `<span class="badge">${escapeHtml(text)}</span>`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getFilteredJobs(all) {
    const q = normalize(search.value);
    const sf = statusFilter.value;

    return all.filter((j) => {
      const hitsSearch =
        !q ||
        normalize(j.company).includes(q) ||
        normalize(j.role).includes(q);

      const hitsStatus = sf === "ALL" || j.status === sf;

      return hitsSearch && hitsStatus;
    });
  }

  function render() {
    const all = loadJobs();

    const filtered = getFilteredJobs(all);

    counts.textContent = `${filtered.length} shown.  ${all.length} total.`;

    if (filtered.length === 0) {
      list.innerHTML = `<tr><td colspan="6" class="tiny">No results.  Add your first application.</td></tr>`;
      return;
    }

    const rows = filtered
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .map((j) => {
        return `
          <tr>
            <td>${escapeHtml(j.company)}</td>
            <td>${escapeHtml(j.role)}${j.location ? `<div class="tiny">${escapeHtml(j.location)}</div>` : ""}</td>
            <td>${badge(j.status)}</td>
            <td>${escapeHtml(formatDate(j.dateApplied))}</td>
            <td>${escapeHtml(formatDate(j.followUp))}</td>
            <td class="right">
              <button type="button" class="secondary" data-action="edit" data-id="${j.id}">Edit</button>
              <button type="button" class="danger" data-action="delete" data-id="${j.id}">Delete</button>
            </td>
          </tr>
        `;
      })
      .join("");

    list.innerHTML = rows;
  }

  function clearForm() {
    jobId.value = "";
    company.value = "";
    role.value = "";
    locationEl.value = "";
    dateApplied.value = "";
    followUp.value = "";
    status.value = "Applied";
    notes.value = "";
    company.focus();
  }

  function upsertJob() {
    const c = company.value.trim();
    const r = role.value.trim();

    if (!c || !r) return;

    const all = loadJobs();
    const now = Date.now();

    if (jobId.value) {
      const idx = all.findIndex((x) => x.id === jobId.value);
      if (idx >= 0) {
        all[idx] = {
          ...all[idx],
          company: c,
          role: r,
          location: locationEl.value.trim(),
          dateApplied: dateApplied.value,
          followUp: followUp.value,
          status: status.value,
          notes: notes.value.trim(),
          updatedAt: now
        };
      }
    } else {
      all.push({
        id: uid(),
        company: c,
        role: r,
        location: locationEl.value.trim(),
        dateApplied: dateApplied.value,
        followUp: followUp.value,
        status: status.value,
        notes: notes.value.trim(),
        createdAt: now,
        updatedAt: now
      });
    }

    saveJobs(all);
    clearForm();
    render();
  }

  function editJob(id) {
    const all = loadJobs();
    const j = all.find((x) => x.id === id);
    if (!j) return;

    jobId.value = j.id;
    company.value = j.company || "";
    role.value = j.role || "";
    locationEl.value = j.location || "";
    dateApplied.value = j.dateApplied || "";
    followUp.value = j.followUp || "";
    status.value = j.status || "Applied";
    notes.value = j.notes || "";
    company.focus();
  }

  function deleteJob(id) {
    const all = loadJobs();
    const next = all.filter((x) => x.id !== id);
    saveJobs(next);
    render();
  }

  function exportJson() {
    const all = loadJobs();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "job-tracker-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function clearAll() {
    const ok = confirm("Clear all saved applications.  This cannot be undone.");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    render();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    upsertJob();
  });

  resetBtn.addEventListener("click", function () {
    clearForm();
  });

  exportBtn.addEventListener("click", function () {
    exportJson();
  });

  clearAllBtn.addEventListener("click", function () {
    clearAll();
  });

  list.addEventListener("click", function (e) {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");

    if (action === "edit") editJob(id);
    if (action === "delete") deleteJob(id);
  });

  search.addEventListener("input", render);
  statusFilter.addEventListener("change", render);

  clearForm();
  render();
})();
