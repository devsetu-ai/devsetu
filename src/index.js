/**
 * DevSetu — Cloudflare Worker webhook handler
 * Powered by Google Gemini 3.5 Flash
 */

import { App } from "@octokit/app";

const BOT_TRIGGER_REGEX = /@(devsetu|devsetu-bot|aibot)\b/i;
const GEMINI_MODEL = "gemini-3.5-flash";

async function generateGeminiReply(apiKey, { issue, comment, repo }) {
  if (!apiKey) {
    return [
      `👋 Hi @${comment.user.login}, DevSetu here!`,
      ``,
      `**Issue:** ${issue.title}`,
      `**Opened by:** @${issue.user.login}`,
      `**Labels:** ${issue.labels.map((l) => l.name).join(", ") || "none"}`,
      ``,
      `*(GEMINI_API_KEY is not configured. Configure it to enable Gemini 3.5 Flash responses.)*`,
    ].join("\n");
  }

  const prompt = `You are DevSetu, a senior software engineer and professional GitHub AI assistant powered by Google Gemini 3.5 Flash.
A developer has tagged you in an issue discussion.

Response Guidelines:
- Tone: Highly professional, objective, concise, and solution-driven.
- Structure: Organize with clear Markdown headings and tasteful contextual emojis (e.g., 📌 Summary, 🔍 Technical Analysis, 💡 Recommended Solution, ⚠️ Considerations, 🚀 Next Steps).
- Clarity: Provide clear syntax-highlighted code blocks, actionable CLI commands, or precise diffs where applicable.
- Salutation: Address the user politely (e.g., "Hello @${comment.user.login},").

Repository: ${repo.owner.login}/${repo.name}
Issue #${issue.number}: ${issue.title}
Issue Author: @${issue.user.login}
Labels: ${issue.labels.map((l) => l.name).join(", ") || "none"}
Issue Description:
${issue.body || "(no description provided)"}

User Comment from @${comment.user.login}:
${comment.body}

Provide your professional response below. End with:
> ⚡ *Powered by Gemini 3.5 Flash (DevSetu)*`;

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
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "DevSetu",
          version: "1.0.0",
          model: "Google Gemini 3.5 Flash",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
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

      // React to @devsetu or @aibot mentions
      const body = comment.body || "";
      if (!BOT_TRIGGER_REGEX.test(body)) return;

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

    app.webhooks.on("marketplace_purchase", async ({ payload }) => {
      console.log(
        `Marketplace event [${payload.action}]: plan ${payload.marketplace_purchase?.plan?.name} for ${payload.marketplace_purchase?.account?.login}`
      );
    });

    try {
      await app.webhooks.verifyAndReceive({ id, name, signature, payload });
      return new Response("ok", { status: 200 });
    } catch (err) {
      return new Response(`Webhook error: ${err.message}`, { status: 400 });
    }
  },
};
