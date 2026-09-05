# TODO — Deploy aibot via `gh` CLI

Checklist for pushing this repo to GitHub and getting both the
Action and the App running, using the GitHub CLI (`gh`) instead of
the web UI wherever possible.

## 0. Prerequisites
- [x] Install `gh`: https://cli.github.com
- [x] Authenticate: `gh auth login`
- [x] Confirm auth: `gh auth status`

## 1. Create and push the repo
```bash
cd aibot-github-app
git init
git add .
git commit -m "Initial commit: aibot hello-world (App + Action)"

# Create the repo on GitHub and push in one step
gh repo create aibot-github-app --public --source=. --remote=origin --push
```
- [ ] Repo created and code pushed
- [ ] Confirm on GitHub: `gh repo view --web`

## 2. Quick win — enable the GitHub Action version first
The workflow file is already at `.github/workflows/aibot-comment.yml`,
so pushing the repo (step 1) already activates it for **this** repo.
- [ ] Open an issue to test against: `gh issue create --title "Test aibot" --body "testing"`
- [ ] Comment on it: `gh issue comment <issue-number> --body "@aibot hello"`
- [ ] Check the run: `gh run list` then `gh run watch`
- [ ] Confirm the bot replied: `gh issue view <issue-number> --comments`

## 3. Register the GitHub App
`gh` doesn't create GitHub Apps directly (no API for the manifest
flow), so this step is done via browser, but `gh` can open it for you:
- [ ] `gh api /app-manifests` isn't applicable — instead run the app
      locally first: `npm install && npm run dev:local`
- [ ] Visit `http://localhost:3000/probot/setup` — this reads
      `app.yml` and pre-fills the registration form
- [ ] Complete registration in the browser, then download the
      generated **private key** (.pem) and note the **App ID** +
      **Webhook secret**

## 4. Store secrets with `gh` (for CI / Actions use, if needed later)
```bash
gh secret set APP_ID --body "<your-app-id>"
gh secret set WEBHOOK_SECRET --body "<your-webhook-secret>"
gh secret set PRIVATE_KEY < path/to/private-key.pem
```
- [ ] Secrets set: verify with `gh secret list`

## 5. Deploy the App to Cloudflare Workers
`gh` doesn't manage Cloudflare, so this stays on the Wrangler CLI:
```bash
npm install -g wrangler
wrangler login
wrangler secret put APP_ID
wrangler secret put PRIVATE_KEY
wrangler secret put WEBHOOK_SECRET
npm run deploy   # or: wrangler deploy
```
- [ ] Cloudflare Worker deployment live
- [ ] Webhook URL updated on the GitHub App settings page to the
      printed Worker URL, e.g.
      `https://aibot-github-app.YOUR-SUBDOMAIN.workers.dev`
- [ ] Tail live logs to confirm delivery: `wrangler tail`

## 6. Install the App on a test repo
```bash
gh repo view --web   # opens repo; from here click "Settings > Integrations"
# or just visit the app's public page directly:
# https://github.com/apps/aibot
```
- [ ] App installed on at least one test repo
- [ ] Comment `@aibot hello` on an issue there and confirm a reply

## 7. Submit to GitHub Marketplace
Marketplace listing setup is web-UI only (no `gh` support):
- [ ] Go to App settings → **Marketplace listing** tab
- [ ] Add description, categories, screenshots, pricing (start Free)
- [ ] Add support email + privacy policy URL
- [ ] Submit for review

## 8. Track ongoing work with `gh issue`
Use issues in the repo itself to track the product roadmap:
```bash
gh issue create --title "Swap static reply for Claude API call" --label enhancement
gh issue create --title "Add @aibot summarize command" --label enhancement
gh issue create --title "Add repo file context to prompt" --label enhancement
gh issue create --title "Add paid pricing tier" --label enhancement
```
- [ ] Roadmap issues created
