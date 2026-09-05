/**
 * aibot-github-app — Cloudflare Worker webhook handler
 * Powered by Google Gemini 3.5 Flash
 */

import { App } from "@octokit/app";

const BOT_TRIGGER = "@aibot";
const GEMINI_MODEL = "gemini-3.5-flash";

async function generateGeminiReply(apiKey, { issue, comment, repo }) {
  if (!apiKey) {
    return [
      `👋 Hi @${comment.user.login}, aibot here!`,
      ``,
      `**Issue:** ${issue.title}`,
      `**Opened by:** @${issue.user.login}`,
      `**Labels:** ${issue.labels.map((l) => l.name).join(", ") || "none"}`,
      ``,
      `*(GEMINI_API_KEY is not configured. Configure it to enable Gemini 3.5 Flash responses.)*`,
    ].join("\n");
  }

  const prompt = `You are aibot, an intelligent GitHub assistant powered by Google Gemini 3.5 Flash.
A developer mentioned you in a GitHub issue. Respond helpfully, clearly, and concisely in GitHub Flavored Markdown.

Repository: ${repo.owner.login}/${repo.name}
Issue #${issue.number}: ${issue.title}
Issue Author: @${issue.user.login}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "none"}
Issue Description:
${issue.body || "(no description)"}

Comment by @${comment.user.login}:
${comment.body}

Please provide a helpful, actionable response to @${comment.user.login}. Include relevant code blocks, debugging steps, or explanations if appropriate. End with:
> ⚡ *Powered by Gemini 3.5 Flash*`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return `👋 Hi @${comment.user.login}! I encountered an issue contacting Gemini 3.5 Flash (${res.status}). Please try again shortly.`;
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (reply) {
      return reply;
    }
    return `👋 Hi @${comment.user.login}! I received your request but could not generate a response.`;
  } catch (err) {
    console.error("Failed to generate Gemini reply:", err);
    return `👋 Hi @${comment.user.login}! Error calling Gemini 3.5 Flash: ${err.message}`;
  }
}

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

      const replyBody = await generateGeminiReply(env.GEMINI_API_KEY, {
        issue,
        comment,
        repo,
      });

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
