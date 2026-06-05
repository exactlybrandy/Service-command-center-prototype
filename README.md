# Service Command Center Full-Stack Prototype

This is a working customer-facing prototype for the long-term Service Command Center direction.

## Pages

1. `/` - mission statement and signup
2. `/accounts` - account perception examples and customer.xls upload entry
3. `/evaluation` - sample customer-base evaluation, site-map/crosshair concept, cleanup and route insights
4. `/funnel` - monthly funnel system offer and customer-targeting workflow

## Offer

The prototype presents one recurring offer:

**$250/month after the first 2 months free**

There are no tiered payment plans in the customer flow.

## Backend

The native Node backend provides:

- `POST /api/signup` - captures prototype signups in `data/signups.jsonl`
- `POST /api/evaluate` - evaluates uploaded/sample customer rows and logs summary metrics in `data/evaluations.jsonl`
- static page serving for all four customer-facing pages

## Run Locally

Use the bundled Node runtime if normal `node` or `npm` is not available:

```bash
/Users/brandonlivingcreations/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs
```

Then open:

```text
http://127.0.0.1:4173
```

## Deploy On Render

1. Create a GitHub repo for this folder.
2. Upload the contents of `service-command-center-app`.
3. Go to Render and create a new Web Service from that repo.
4. Render can use `render.yaml`, or you can enter:

```text
Build Command: leave blank
Start Command: node server.mjs
```

5. After deploy, Render will give you a live URL.

## Upload Note

This prototype accepts `.csv`, `.tsv`, `.txt`, `.xls`, and `.xlsx` visually in the upload control. The current parser handles CSV/TSV-style text data. Production should add real `.xls/.xlsx` parsing, Stripe subscription checkout, authentication, and secure customer file storage.
