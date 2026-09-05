# Transparency & Security Disclosures for DevSetu

**Last updated:** September 5, 2026

DevSetu is designed with security-by-design principles, least-privilege permissions, and a strict zero-retention data privacy model.

---

### 1. Cryptographic Authentication & Verification
- All incoming webhook events received by the Cloudflare Worker edge runtime are cryptographically authenticated using HMAC-SHA256 (`x-hub-signature-256`) validated via `@octokit/app`.
- Requests lacking valid signatures or carrying mismatched checksums are rejected immediately with HTTP 400 before payload parsing.
- Secrets (`WEBHOOK_SECRET`, `PRIVATE_KEY`, `GEMINI_API_KEY`) are stored in encrypted environment secret vaults and are never exposed in logs or client-side code.

---

### 2. Least-Privilege Scope
DevSetu requires only minimal scopes necessary for automated triage:
- `issues: write` (to post AI technical guidance on issue threads)
- `contents: read` (to inspect relevant source snippets referenced in discussions)
- `metadata: read` (default GitHub App repository metadata)

The application does not request administrative access, billing access, or webhook modification rights.

---

### 3. Data Governance & Zero Data Retention
- **Stateless Edge Processing:** Issue descriptions and comments are processed in-memory solely during the duration of the webhook request.
- **No External Database Persistence:** DevSetu does not operate external databases, caches, or persistent storage. User code and conversations are never stored, logged, or indexed.
- **No AI Retraining:** Prompts transmitted to the Google Gemini API are processed under enterprise/developer API terms where customer inputs are not retained or utilized to train foundation models.

---

### 4. EU AI Act & Risk Management (Articles 6, 8-17)
- **Risk Classification:** Under the EU AI Act (Regulation EU 2024/1689), DevSetu operates as an interactive developer utility for code explanation and documentation triage, classified as low-risk (non-high-risk AI system under Article 6 & Annex III).
- **Transparency & Attribution (Article 50):** Every automated output clearly identifies itself as an AI-generated suggestion and includes sign-off attribution (`> ⚡ Powered by Gemini 3.5 Flash (DevSetu)`). Maintainers retain full human agency and control over whether suggestions are accepted, rejected, or edited.
- **Input Sanitization:** Prompts enforce strict engineering response guidelines and system prompts to prevent prompt injection and mitigate adversarial inputs.

---

### 5. Compliance, Terms & Reporting
- **Privacy Policy:** [PRIVACY.md](PRIVACY.md)
- **Terms of Service:** [TERMS.md](TERMS.md)
- **Vulnerability Reporting:** Issues can be reported directly via [GitHub Issues](https://github.com/devsetu-ai/devsetu/issues) or to `skbhati199@gmail.com`.
