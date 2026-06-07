import http from "node:http";
import { appendFile, readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const dataDir = join(__dirname, "data");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".svg": "image/svg+xml",
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  return JSON.parse(raw);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseRows(input) {
  if (Array.isArray(input)) return input;
  const text = String(input || "").trim();
  if (!text) return [];
  const delimiter = text.includes("\t") ? "\t" : ",";
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(delimiter).map(normalizeHeader);
  return lines.map((line) => {
    const values = line.split(delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function pick(row, names) {
  for (const name of names) {
    const key = normalizeHeader(name);
    if (row[key]) return String(row[key]).trim();
  }
  return "";
}

function evaluateCustomerBase(inputRows) {
  const rows = parseRows(inputRows);
  const accounts = rows.map((row, index) => {
    const account = pick(row, ["account", "account name", "customer", "customer name", "company", "business"]);
    const email = pick(row, ["email", "contact email", "customer email"]);
    const phone = pick(row, ["phone", "telephone", "contact phone"]);
    const serviceAddress = pick(row, ["service address", "address", "site address", "location"]);
    const billingAddress = pick(row, ["billing address", "bill address"]);
    const city = pick(row, ["city", "service city"]);
    const route = pick(row, ["route", "route group", "territory", "quarter", "technician"]);
    const status = pick(row, ["status", "active"]);
    const value = Number(pick(row, ["monthly value", "revenue", "amount", "invoice amount"]).replace(/[^0-9.]/g, "")) || 0;
    return {
      id: index + 1,
      account: account || `Account ${index + 1}`,
      email,
      phone,
      serviceAddress,
      billingAddress,
      city,
      route: route || "Unassigned",
      status: status || "Needs Review",
      value,
    };
  });

  const total = accounts.length;
  const missingEmail = accounts.filter((a) => !a.email);
  const missingAddress = accounts.filter((a) => !a.serviceAddress);
  const unassigned = accounts.filter((a) => a.route === "Unassigned");
  const emailGroups = new Map();
  for (const account of accounts) {
    if (!account.email) continue;
    const key = account.email.toLowerCase();
    emailGroups.set(key, [...(emailGroups.get(key) || []), account.account]);
  }
  const sharedContacts = [...emailGroups.entries()]
    .filter(([, names]) => names.length > 1)
    .map(([email, names]) => ({ email, accounts: names }));

  const routeCounts = new Map();
  const routeRevenue = new Map();
  for (const account of accounts) {
    routeCounts.set(account.route, (routeCounts.get(account.route) || 0) + 1);
    routeRevenue.set(account.route, (routeRevenue.get(account.route) || 0) + account.value);
  }

  const routes = [...routeCounts.entries()]
    .map(([route, count]) => ({ route, count, revenue: routeRevenue.get(route) || 0 }))
    .sort((a, b) => b.count - a.count);

  const totalRevenue = accounts.reduce((sum, account) => sum + account.value, 0);
  const surveyReady = accounts.filter((a) => a.email && a.serviceAddress).length;
  const cleanupScore = total
    ? Math.max(0, Math.round(100 - ((missingEmail.length + missingAddress.length + sharedContacts.length + unassigned.length) / (total * 3)) * 100))
    : 0;

  const topOpportunities = [
    missingEmail.length
      ? `${missingEmail.length} accounts cannot receive survey outreach until emails are cleaned.`
      : "Email coverage is strong enough to begin survey outreach.",
    sharedContacts.length
      ? `${sharedContacts.length} shared contacts need thoughtful messaging before bulk outreach.`
      : "No shared contact risk was detected in this sample.",
    unassigned.length
      ? `${unassigned.length} accounts need route or territory assignment.`
      : "Every account has a route or territory label.",
    totalRevenue
      ? `The uploaded base represents about $${Math.round(totalRevenue).toLocaleString()} in visible monthly account value.`
      : "Revenue columns were not detected; adding value data would improve prioritization.",
  ];

  return {
    total,
    cleanupScore,
    surveyReady,
    missingEmail: missingEmail.slice(0, 8),
    missingAddress: missingAddress.slice(0, 8),
    sharedContacts: sharedContacts.slice(0, 8),
    routes: routes.slice(0, 8),
    topOpportunities,
    accounts: accounts.slice(0, 20),
  };
}

async function appendJsonLine(filename, value) {
  await appendFile(join(dataDir, filename), `${JSON.stringify({ ...value, createdAt: new Date().toISOString() })}\n`);
}

async function handleApi(req, res) {
  if (req.method === "POST" && req.url === "/api/signup") {
    const body = await readJson(req);
    const lead = {
      businessName: body.businessName || "",
      businessType: body.businessType || "",
      email: body.email || "",
      pain: body.pain || "",
      plan: "$250/month after first 2 months free",
    };
    await appendJsonLine("signups.jsonl", lead);
    const response = {
      ok: true,
      message: "Signup captured for prototype review.",
      plan: "$250/month after first 2 months free",
      lead,
    };
    send(res, 200, JSON.stringify(response));
    return;
  }

  if (req.method === "POST" && req.url === "/api/evaluate") {
    const body = await readJson(req);
    const evaluation = evaluateCustomerBase(body.rows || body.csv || []);
    await appendJsonLine("evaluations.jsonl", {
      total: evaluation.total,
      cleanupScore: evaluation.cleanupScore,
      surveyReady: evaluation.surveyReady,
      sharedContacts: evaluation.sharedContacts.length,
      routeCount: evaluation.routes.length,
    });
    send(res, 200, JSON.stringify(evaluation));
    return;
  }

  send(res, 404, JSON.stringify({ error: "Not found" }));
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://localhost:${port}`);
  let pathname = decodeURIComponent(url.pathname);
  const routes = {
    "/": "/index.html",
    "/accounts": "/accounts.html",
    "/dashboard": "/dashboard.html",
    "/evaluation": "/evaluation.html",
    "/funnel": "/funnel.html",
  };
  pathname = routes[pathname] || pathname;
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) {
    send(res, 403, "Forbidden", "text/plain; charset=utf-8");
    return;
  }
  try {
    const file = await readFile(filePath);
    send(res, 200, file, mimeTypes[extname(filePath)] || "application/octet-stream");
  } catch {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if ((req.url || "").startsWith("/api/")) {
      await handleApi(req, res);
    } else {
      await serveStatic(req, res);
    }
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }));
  }
});

server.listen(port, host, () => {
  console.log(`Service Command Center prototype running at http://${host}:${port}`);
});
