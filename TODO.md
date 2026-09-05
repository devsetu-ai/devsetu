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
- [x] Repo created and code pushed
- [x] Confirm on GitHub: `gh repo view --web`

## 2. Quick win — enable the GitHub Action version first
The workflow file is already at `.github/workflows/aibot-comment.yml`,
so pushing the repo (step 1) already activates it for **this** repo.
- [x] Open an issue to test against: `gh issue create --title "Test aibot" --body "testing"`
- [x] Comment on it: `gh issue comment <issue-number> --body "@aibot hello"`
- [x] Check the run: `gh run list` then `gh run watch`
- [x] Confirm the bot replied: `gh issue view <issue-number> --comments`

## 3. Register the GitHub App
- [x] GitHub App registered: `aibot-sonurust-app` (App ID: `4838612`)
- [x] Private key downloaded and webhook secret configured

## 4. Store secrets with `gh` (for CI / Actions use, if needed later)
```bash
gh secret set APP_ID --body "4838612"
gh secret set WEBHOOK_SECRET --body "2cbfac2526acd8fe8ca5815051414f9a43a09560"
gh secret set PRIVATE_KEY < aibot-sonurust-app.2026-09-05.private-key.pem
```
- [x] Secrets set: verified with `gh secret list`

## 5. Deploy the App to Cloudflare Workers
- [x] Cloudflare Worker deployment live (`https://aibot-github-app.skbhati199.workers.dev`)
- [x] Worker secrets configured: `APP_ID`, `PRIVATE_KEY`, `WEBHOOK_SECRET`
- [x] Webhook URL and secret configured on GitHub App settings page

## 6. Install the App on a test repo
```bash
# Visit the app's public page to install:
# https://github.com/apps/aibot-sonurust-app
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
