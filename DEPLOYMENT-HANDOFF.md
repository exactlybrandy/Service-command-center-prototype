# HQ SaaS Deployment Handoff

## Prototype

Service Command Center test/example prototype.

## Current Status

The prototype is ready to be uploaded to GitHub and deployed to Render.

## GitHub Repo Setup

Create or use a repo such as:

`service-command-center-prototype`

Upload the contents of this folder into the repo root.

Important files:

- `server.mjs`
- `package.json`
- `render.yaml`
- `public/index.html`
- `public/accounts.html`
- `public/evaluation.html`
- `public/funnel.html`
- `public/styles.css`
- `public/app.js`
- `data/sample-customers.csv`
- `data/sample-customers.xls`

Do not upload local test logs:

- `data/signups.jsonl`
- `data/evaluations.jsonl`

## Render Settings

Render can use `render.yaml`.

Manual settings:

```text
Environment: Node
Build Command: leave blank
Start Command: node server.mjs
```

## Live Link

After Render deploys the app, save the Render URL inside the HQ SaaS Drive folder.

## Prototype Offer

The app presents one recurring fee:

`$250/month after first 2 months free`

No tiered payment plans are shown.

