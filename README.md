# aibot — Hello World GitHub App

Replies to `@aibot` mentions on issue comments with the issue's real
details (title, author, labels). This is step 1 of a roadmap toward
a full AI-powered issue/PR assistant.

Two ways to run this are included:

1. **GitHub App** (`src/index.js`) — hosted on Cloudflare Workers,
   installable on any repo/org, listable on GitHub Marketplace.
2. **GitHub Action** (`.github/workflows/aibot-comment.yml`) — runs
   inside a single repo, zero external hosting, good for a fast demo.

---

## Option A — Deploy the GitHub App (Cloudflare Workers)

The production webhook handler runs on Cloudflare Workers using
`@octokit/app` directly (Probot itself doesn't run on the Workers
runtime — it expects a long-running Node server, not Workers' `fetch`
model). `index.js` + `npm run dev:local` still uses Probot, but only
for the one-time local App **registration** step below.

### 1. Register the App on GitHub
- Run the local Probot app once, just to use its manifest flow:
  ```bash
  npm install
  npm run dev:local
  ```
  Then visit `http://localhost:3000/probot/setup` — it reads
  `app.yml` and pre-fills the GitHub App registration form for you.
- When asked for the webhook URL, use your future Worker URL:
  `https://aibot-github-app.YOUR-SUBDOMAIN.workers.dev`
- Permissions needed: **Issues: Read & write**, **Contents: Read-only**,
  **Metadata: Read-only** (already declared in `app.yml`).
- Subscribe to the **Issue comment** event.
- After creation, generate a **private key** (.pem file) and note your
  **App ID** and **Webhook secret**.

### 2. Deploy to Cloudflare Workers
```bash
npm install -g wrangler
cd aibot-github-app
wrangler login
```
Set the three secrets Wrangler will prompt you to paste in:
```bash
wrangler secret put APP_ID
wrangler secret put PRIVATE_KEY
wrangler secret put WEBHOOK_SECRET
```
> For `PRIVATE_KEY`, paste the full contents of the `.pem` file
> (including the `-----BEGIN/END RSA PRIVATE KEY-----` lines).

Then deploy:
```bash
npm run deploy
# or: wrangler deploy
```
This prints your live Worker URL, e.g.
`https://aibot-github-app.your-subdomain.workers.dev`. If it differs
from what you entered during registration, update the webhook URL in
the GitHub App settings page to match exactly.

To iterate locally before deploying:
```bash
npm run dev
# or: wrangler dev
```

### 3. Install & test
- Install the app on a test repo from your App's public page
  (`https://github.com/apps/aibot`).
- Open any issue, comment `@aibot hello`, and confirm it replies
  within a few seconds.
- Check live logs any time with: `wrangler tail`

---

## Option B — Run the GitHub Action version (no hosting)

1. Copy `.github/workflows/aibot-comment.yml` into any repo.
2. Comment `@aibot` on an issue in that repo.
3. The Action runs automatically — check the **Actions** tab if it
   doesn't reply within a minute.

No secrets or hosting required — it uses the repo's built-in
`GITHUB_TOKEN`.

---

## Publishing to GitHub Marketplace

Once the hosted App (Option A) is stable:

1. Go to your App's settings page → **Marketplace listing** tab.
2. Fill in: description, categories (e.g. *Utilities*, *Support*),
   screenshots of it replying on a real issue, and pricing plans
   (start with a **Free** plan while you validate demand).
3. GitHub requires a support email/URL and a privacy policy URL —
   even a simple static page satisfies this for the first listing.
4. Submit for review. GitHub manually reviews new listings
   (typically a few business days) before it goes public.
5. Once approved, orgs can install and (if you add paid plans) be
   billed directly through GitHub's Marketplace billing API.

---

## Next steps (per the earlier roadmap)
- [ ] Swap the static reply in `src/index.js` for a real Claude API call
- [ ] Add repo file/README context to the prompt for smarter answers
- [ ] Support more commands: `@aibot summarize`, `@aibot explain`
- [ ] Add a pricing tier once usage validates demand
