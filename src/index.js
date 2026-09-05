/**
 * aibot-github-app — Cloudflare Worker webhook handler
 *
 * Replaces the previous Vercel serverless function. Runs on
 * Cloudflare's `fetch` event model rather than Probot's Node
 * server model, using @octokit/app directly (works on Workers
 * when the `nodejs_compat` compatibility flag is enabled — see
 * wrangler.toml).
 *
 * Roadmap position: same hello-world logic as index.js /
 * .github/workflows/aibot-comment.yml, just running on Cloudflare.
 */

import { App } from "@octokit/app";

const BOT_TRIGGER = "@aibot";

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("aibot webhook endpoint — POST only", { status: 200 });
    }

    const id = request.headers.get("x-github-delivery");
    const name = request.headers.get("x-github-event");
    const signature = request.headers.get("x-hub-signature-256");
    const payload = await request.text();

    if (!id || !name || !signature) {
      return new Response("Missing GitHub webhook headers", { status: 400 });
    }

    const app = new App({
      appId: env.APP_ID,
      privateKey: env.PRIVATE_KEY,
      webhooks: { secret: env.WEBHOOK_SECRET },
    });

    app.webhooks.on("issue_comment.created", async ({ octokit, payload }) => {
      const comment = payload.comment;

      // Ignore bot comments (including our own) to avoid loops
      if (comment.user.type === "Bot") return;

      // Only react to actual @aibot mentions
      const body = comment.body || "";
      if (!body.toLowerCase().includes(BOT_TRIGGER)) return;

      const issue = payload.issue;
      const repo = payload.repository;

      const replyBody = [
        `👋 Hi @${comment.user.login}, aibot here!`,
        ``,
        `**Issue:** ${issue.title}`,
        `**Opened by:** @${issue.user.login}`,
        `**Labels:** ${issue.labels.map((l) => l.name).join(", ") || "none"}`,
        ``,
        `_This is a hello-world reply from the Cloudflare Worker version — real fix suggestions are coming in the next iteration._`,
      ].join("\n");

      await octokit.rest.issues.createComment({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number,
        body: replyBody,
      });
    });

    try {
      await app.webhooks.verifyAndReceive({ id, name, signature, payload });
      return new Response("ok", { status: 200 });
    } catch (err) {
      return new Response(`Webhook error: ${err.message}`, { status: 400 });
    }
  },
};
