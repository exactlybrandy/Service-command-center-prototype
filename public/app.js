const sampleRows = [
  { account: "Greenview Office", email: "manager@greenview.example", phone: "555-0101", service_address: "125 Main St", city: "Denver", route: "Q1 Core", monthly_value: "725" },
  { account: "Northside Plaza", email: "", phone: "555-0134", service_address: "411 Oak Ave", city: "Arvada", route: "North Route", monthly_value: "1140" },
  { account: "Valley Suites", email: "admin@valleysuites.example", phone: "555-0150", service_address: "", city: "Lakewood", route: "Q2 West", monthly_value: "930" },
  { account: "Parkview Center", email: "owner@parkview.example", phone: "555-0177", service_address: "90 Park Lane", city: "Denver", route: "Q1 Core", monthly_value: "520" },
  { account: "Parkview Annex", email: "owner@parkview.example", phone: "555-0177", service_address: "94 Park Lane", city: "Denver", route: "Q1 Core", monthly_value: "380" },
  { account: "Summit Dental", email: "frontdesk@summit.example", phone: "555-0198", service_address: "601 Summit Dr", city: "Boulder", route: "North Route", monthly_value: "640" },
  { account: "Oak Ridge Shops", email: "ops@oakridge.example", phone: "", service_address: "800 Ridge Rd", city: "Aurora", route: "East Route", monthly_value: "1350" },
  { account: "Civic Lofts", email: "", phone: "555-0123", service_address: "10 Civic Way", city: "Denver", route: "", monthly_value: "460" },
];

function qs(selector) {
  return document.querySelector(selector);
}

function setActiveNav() {
  const current = window.location.pathname === "/" ? "/" : window.location.pathname;
  document.querySelectorAll(".nav-links a").forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("active", href === current);
  });
}

async function postJson(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

function parseDelimited(text) {
  const clean = text.trim();
  if (!clean) return [];
  const delimiter = clean.includes("\t") ? "\t" : ",";
  const lines = clean.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(delimiter).map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"));
  return lines.map((line) => {
    const values = line.split(delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function renderEvaluation(data) {
  const result = qs("#evaluationResult");
  if (!result) return;
  const routeRows = data.routes.map((route) => `
    <tr>
      <td>${route.route}</td>
      <td>${route.count}</td>
      <td>$${Math.round(route.revenue).toLocaleString()}</td>
    </tr>
  `).join("");

  const issues = [
    ...data.missingEmail.map((a) => ({ issue: "Missing email", account: a.account, action: "Find survey contact before outreach" })),
    ...data.missingAddress.map((a) => ({ issue: "Missing address", account: a.account, action: "Confirm service location" })),
    ...data.sharedContacts.map((g) => ({ issue: "Shared email", account: g.accounts.join(", "), action: `Send one thoughtful message to ${g.email}` })),
  ].slice(0, 8);

  result.innerHTML = `
    <div class="metric-grid">
      <div class="metric"><strong>${data.total}</strong><span>Total accounts reviewed</span></div>
      <div class="metric"><strong>${data.cleanupScore}%</strong><span>Data clarity score</span></div>
      <div class="metric"><strong>${data.surveyReady}</strong><span>Survey-ready accounts</span></div>
      <div class="metric"><strong>${data.sharedContacts.length}</strong><span>Shared contact risks</span></div>
    </div>

    <div class="grid-2">
      <div class="panel card">
        <span class="tag blue">What they may not know</span>
        <h3>Potential hidden insights</h3>
        <ul>${data.topOpportunities.map((item) => `<li>${item}</li>`).join("")}</ul>
      </div>
      <div class="panel card">
        <span class="tag gold">Route intelligence</span>
        <h3>Route groups detected</h3>
        <table class="table">
          <thead><tr><th>Route</th><th>Accounts</th><th>Visible value</th></tr></thead>
          <tbody>${routeRows}</tbody>
        </table>
      </div>
    </div>

    <div class="panel card">
      <span class="tag red">Cleanup queue</span>
      <h3>First review list</h3>
      <table class="table">
        <thead><tr><th>Issue</th><th>Account or contact</th><th>Recommended action</th></tr></thead>
        <tbody>${issues.map((row) => `<tr><td>${row.issue}</td><td>${row.account}</td><td>${row.action}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

async function runEvaluation(rows = sampleRows) {
  const data = await postJson("/api/evaluate", { rows });
  renderEvaluation(data);
}

function initSignup() {
  const form = qs("#signupForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    const submit = form.querySelector("button[type='submit']");
    submit.disabled = true;
    submit.textContent = "Creating review profile...";
    try {
      const response = await postJson("/api/signup", payload);
      qs("#signupMessage").innerHTML = `
        <div class="notice">
          ${response.message} Your review profile is set for <strong>${response.plan}</strong>.
          Next step: upload a customer file on the Account Perception page.
        </div>
      `;
      form.reset();
    } finally {
      submit.disabled = false;
      submit.textContent = "Start first 2 months free";
    }
  });
}

function initUpload() {
  const fileInput = qs("#customerFile");
  const sampleButton = qs("#sampleEvaluate");
  if (sampleButton) {
    sampleButton.addEventListener("click", () => runEvaluation(sampleRows));
  }
  if (!fileInput) return;
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseDelimited(text);
    await runEvaluation(rows.length ? rows : sampleRows);
  });
}

setActiveNav();
initSignup();
initUpload();
if (qs("#evaluationResult")) runEvaluation(sampleRows);
