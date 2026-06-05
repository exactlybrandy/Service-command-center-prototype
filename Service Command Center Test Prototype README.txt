Service Command Center Test Prototype

This is the working customer-facing prototype for the long-term Service Command Center SaaS direction.

Local prototype ZIP:
Service-Command-Center-Test-Prototype.zip

Local app folder:
service-command-center-app

Pages:

1. Mission statement and signup
   URL path: /
   Purpose: explains the mission and captures customer signup interest.
   Offer: $250/month after the first 2 months free.

2. Account perception
   URL path: /accounts
   Purpose: shows how a customer.xls file can be perceived before upload.
   Examples: operational, territory, relationship, and cleanup views.

3. Evaluation
   URL path: /evaluation
   Purpose: shows what the customer-base evaluation can reveal.
   Includes: data clarity score, survey readiness, route groups, missing email cleanup, shared-contact risk, and a site-map/crosshair concept.

4. Funnel system
   URL path: /funnel
   Purpose: explains how the business uses the client's customer.xls to target customer segments, follow-up opportunities, route groups, and campaign direction.

Backend:

- POST /api/signup
  Captures prototype signups into data/signups.jsonl.

- POST /api/evaluate
  Evaluates uploaded/sample customer rows and logs summary metrics into data/evaluations.jsonl.

Sample files:

- data/sample-customers.csv
- data/sample-customers.xls

Run locally:

/Users/brandonlivingcreations/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.mjs

Then open:

http://127.0.0.1:4173

Production next steps:

- Stripe subscription checkout
- Authentication
- Real .xls/.xlsx parsing
- Secure customer file storage
- Customer dashboard
- Admin review dashboard
- AI-assisted customer-base interpretation

