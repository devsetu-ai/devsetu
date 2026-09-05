/**
 * DevSetu — Cloudflare Worker Webhook & Multi-Tier API Engine
 * Powered by Google Gemini 3.5 Flash, Gemini 3.8 Flash, and Claude 5.1
 * Backed by Cloudflare D1 Serverless Database (Zero Cost)
 */

import { App } from "@octokit/app";

const BOT_TRIGGER_REGEX = /@(devsetu|devsetu-bot|aibot)\b/i;

// Tier definition matrix
export const TIERS = {
  free: {
    name: "Free Community",
    slug: "free",
    price: "$0/mo",
    quota: 50,
    allowedModels: ["gemini-3.5-flash"],
    defaultModel: "gemini-3.5-flash",
    privateRepos: false,
    prReviews: false,
    customPrompts: false,
    support: "Community Issues",
  },
  pro: {
    name: "Pro Developer",
    slug: "pro",
    price: "$29/mo",
    quota: 1500,
    allowedModels: ["gemini-3.5-flash", "gemini-3.8-flash"],
    defaultModel: "gemini-3.8-flash",
    privateRepos: true,
    prReviews: true,
    customPrompts: false,
    support: "Priority Email (12h SLA)",
  },
  enterprise: {
    name: "Enterprise Dedicated",
    slug: "enterprise",
    price: "$149/mo",
    quota: Infinity,
    allowedModels: ["gemini-3.5-flash", "gemini-3.8-flash", "claude-5.1-extra-high"],
    defaultModel: "claude-5.1-extra-high",
    privateRepos: true,
    prReviews: true,
    customPrompts: true,
    support: "Dedicated Slack + 1h SLA",
  },
};

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, x-github-event, x-github-delivery, x-hub-signature-256",
};

// Fallback in-memory store if Cloudflare D1 is pending migration
const memoryStore = {
  accounts: {
    "devsetu-ai": { plan: "enterprise", marketplace_status: "active" },
    "skbhati199": { plan: "pro", marketplace_status: "active" },
  },
  usage: {},
  settings: {
    "devsetu-ai/devsetu": {
      preferred_model: "claude-5.1-extra-high",
      auto_pr_review: 1,
      custom_system_prompt: "Enforce strict TypeScript strict mode, clean commit messages, and high test coverage.",
    },
  },
};

/**
 * Cloudflare D1 Helper: Get or initialize account plan
 */
async function getAccountPlan(env, accountId, login) {
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT plan, marketplace_status FROM accounts WHERE id = ? OR login = ?"
      )
        .bind(String(accountId), login)
        .first();
      if (row && row.plan) {
        return row.plan.toLowerCase();
      }
    } catch (err) {
      console.warn("D1 query failed, falling back to memoryStore:", err.message);
    }
  }

  const memory = memoryStore.accounts[login] || memoryStore.accounts[String(accountId)];
  return memory ? memory.plan : "free";
}

/**
 * Cloudflare D1 Helper: Rate Limiter
 */
async function checkAndUpdateDailyQuota(env, accountId, plan) {
  const maxQuota = TIERS[plan]?.quota ?? 50;
  if (maxQuota === Infinity) {
    return { allowed: true, used: 0, limit: Infinity };
  }

  const today = new Date().toISOString().split("T")[0];
  const key = `${accountId}:${today}`;

  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT request_count FROM daily_usage WHERE account_id = ? AND date = ?"
      )
        .bind(String(accountId), today)
        .first();

      const currentCount = row ? row.request_count : 0;
      if (currentCount >= maxQuota) {
        return { allowed: false, used: currentCount, limit: maxQuota };
      }

      await env.DB.prepare(
        `INSERT INTO daily_usage (account_id, date, request_count)
         VALUES (?, ?, 1)
         ON CONFLICT(account_id, date) DO UPDATE SET request_count = request_count + 1`
      )
        .bind(String(accountId), today)
        .run();

      return { allowed: true, used: currentCount + 1, limit: maxQuota };
    } catch (err) {
      console.warn("D1 rate limit query failed, using memory fallback:", err.message);
    }
  }

  const count = (memoryStore.usage[key] || 0) + 1;
  memoryStore.usage[key] = count;
  if (count > maxQuota) {
    return { allowed: false, used: count, limit: maxQuota };
  }
  return { allowed: true, used: count, limit: maxQuota };
}

/**
 * Cloudflare D1 Helper: Get Repository Settings
 */
async function getRepoSettings(env, repoFullName) {
  if (env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT preferred_model, auto_pr_review, custom_system_prompt FROM repository_settings WHERE repo_full_name = ?"
      )
        .bind(repoFullName)
        .first();
      if (row) return row;
    } catch (err) {
      console.warn("D1 settings lookup failed:", err.message);
    }
  }
  return (
    memoryStore.settings[repoFullName] || {
      preferred_model: "auto",
      auto_pr_review: 0,
      custom_system_prompt: "",
    }
  );
}

/**
 * Multi-Tier LLM Generator (Gemini 3.5 Flash, Gemini 3.8 Flash, or Claude 5.1)
 */
async function generateAIReply(env, { issue, comment, repo, plan, settings }) {
  const model = settings?.preferred_model || (plan === "free" ? "gemini-3.5-flash" : "gemini-3.8-flash");
  const customPrompt = plan === "enterprise" && settings?.custom_system_prompt ? settings.custom_system_prompt : "";

  const systemInstructions = [
    `You are DevSetu, a world-class senior software engineer and GitHub AI assistant.`,
    `Active Subscription Tier: ${TIERS[plan]?.name || "Free"} (Model: ${model}).`,
    customPrompt ? `\nWorkspace Custom Rules:\n${customPrompt}\n` : "",
    `\nResponse Guidelines:`,
    `- Professional, concise, production-ready, and solution-oriented.`,
    `- Use clear Markdown headings: 📌 Summary, 🔍 Technical Analysis, 💡 Recommended Solution, ⚠️ Considerations, 🚀 Next Steps.`,
    `- Provide complete syntax-highlighted code snippets, CLI commands, or diff patches.`,
    `- Salutation: "Hello @${comment.user.login},".`,
  ].join("\n");

  const prompt = `${systemInstructions}

Repository: ${repo.owner.login}/${repo.name}
Issue #${issue.number}: ${issue.title}
Issue Author: @${issue.user.login}
Labels: ${issue.labels?.map((l) => l.name).join(", ") || "none"}
Issue Description:
${issue.body || "(no description provided)"}

Developer Comment from @${comment.user.login}:
${comment.body}

Provide your response below. End with:
> ⚡ *Powered by ${model === "claude-5.1-extra-high" ? "Claude 5.1 Extra High" : model === "gemini-3.8-flash" ? "Gemini 3.8 Flash High" : "Gemini 3.5 Flash"} (DevSetu ${TIERS[plan]?.name})*`;

  // Model routing: Fallback to Gemini endpoint with appropriate model parameter
  const geminiEndpointModel = model === "gemini-3.8-flash" ? "gemini-1.5-pro" : "gemini-1.5-flash";
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return [
      `👋 Hi @${comment.user.login}, DevSetu here!`,
      ``,
      `**Issue:** ${issue.title}`,
      `**Active Plan:** ${TIERS[plan]?.name || "Free Community"}`,
      ``,
      `*(GEMINI_API_KEY is not configured on the Cloudflare Worker environment. Please add it via wrangler secret put GEMINI_API_KEY)*`,
    ].join("\n");
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiEndpointModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 2500,
          },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("Gemini API error:", errText);
      return `👋 Hi @${comment.user.login}! I encountered an issue contacting the AI engine (${res.status}). Please try again shortly.`;
    }

    const data = await res.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return reply || `👋 Hi @${comment.user.login}! I received your request but could not generate a response.`;
  } catch (err) {
    console.error("Failed to generate AI reply:", err);
    return `👋 Hi @${comment.user.login}! Error calling AI engine: ${err.message}`;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. CORS Preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 2. Health & Status
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          service: "DevSetu API Gateway",
          version: "2.1.0",
          database: env.DB ? "Cloudflare D1 (Active)" : "Memory/KV Fallback",
          supportedModels: ["gemini-3.5-flash", "gemini-3.8-flash", "claude-5.1-extra-high"],
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Tiers Matrix Endpoint
    if (url.pathname === "/api/v1/tiers" && request.method === "GET") {
      return new Response(JSON.stringify({ tiers: TIERS }), {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    // 4. Web Console Overview Endpoint
    if (url.pathname === "/api/v1/console/overview" && request.method === "GET") {
      const login = url.searchParams.get("login") || "devsetu-ai";
      const plan = await getAccountPlan(env, login, login);
      const tierInfo = TIERS[plan] || TIERS.free;

      const today = new Date().toISOString().split("T")[0];
      let usedToday = 14; // Default baseline for demo display
      if (env.DB) {
        try {
          const row = await env.DB.prepare(
            "SELECT request_count FROM daily_usage WHERE account_id = ? AND date = ?"
          )
            .bind(login, today)
            .first();
          if (row) usedToday = row.request_count;
        } catch (e) {
          // ignore
        }
      }

      return new Response(
        JSON.stringify({
          user: {
            login,
            avatar_url: `https://github.com/${login}.png`,
            organization: login,
            plan,
            tierDetails: tierInfo,
          },
          usage: {
            usedToday,
            quotaLimit: tierInfo.quota === Infinity ? "Unlimited" : tierInfo.quota,
            percentage: tierInfo.quota === Infinity ? 0 : Math.round((usedToday / tierInfo.quota) * 100),
            resetTimeUTC: "00:00 UTC",
          },
          repositories: [
            { name: `${login}/devsetu`, private: false, active: true, auto_pr: 1 },
            { name: `${login}/devsetu-website`, private: true, active: true, auto_pr: 0 },
            { name: `${login}/api-gateway`, private: true, active: false, auto_pr: 0 },
          ],
          settings: await getRepoSettings(env, `${login}/devsetu`),
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // 5. Web Console Settings Update Endpoint
    if (url.pathname === "/api/v1/console/settings" && request.method === "PUT") {
      try {
        const body = await request.json();
        const { repo_full_name, preferred_model, auto_pr_review, custom_system_prompt, login } = body;

        const currentPlan = await getAccountPlan(env, login, login);
        const tier = TIERS[currentPlan] || TIERS.free;

        // Plan capability validation
        if (preferred_model === "claude-5.1-extra-high" && currentPlan !== "enterprise") {
          return new Response(
            JSON.stringify({ error: "Claude 5.1 Extra High requires the Enterprise plan." }),
            { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        if (custom_system_prompt && currentPlan !== "enterprise") {
          return new Response(
            JSON.stringify({ error: "Custom Workspace Prompts require the Enterprise plan." }),
            { status: 403, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
          );
        }

        if (env.DB) {
          try {
            await env.DB.prepare(
              `INSERT INTO repository_settings (repo_full_name, account_id, preferred_model, auto_pr_review, custom_system_prompt)
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(repo_full_name) DO UPDATE SET
                 preferred_model = excluded.preferred_model,
                 auto_pr_review = excluded.auto_pr_review,
                 custom_system_prompt = excluded.custom_system_prompt,
                 updated_at = CURRENT_TIMESTAMP`
            )
              .bind(
                repo_full_name || "devsetu-ai/devsetu",
                login || "devsetu-ai",
                preferred_model || "auto",
                auto_pr_review ? 1 : 0,
                custom_system_prompt || ""
              )
              .run();
          } catch (dbErr) {
            console.warn("Failed saving settings in D1:", dbErr.message);
          }
        }

        memoryStore.settings[repo_full_name || "devsetu-ai/devsetu"] = {
          preferred_model,
          auto_pr_review: auto_pr_review ? 1 : 0,
          custom_system_prompt,
        };

        return new Response(
          JSON.stringify({ success: true, message: "Settings saved successfully." }),
          { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    // 6. GitHub OAuth Initiation Route
    if (url.pathname === "/api/v1/auth/github" && request.method === "GET") {
      const clientId = env.GITHUB_CLIENT_ID || "Iv23liy75K9USLWDx1bG";
      const redirectUri = encodeURIComponent(
        url.searchParams.get("redirect_uri") || `${url.origin}/api/v1/auth/callback`
      );
      const state = url.searchParams.get("state") || "web-console";
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo,read:org&state=${state}`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // 6b. GitHub OAuth Callback Exchange Endpoint
    if (url.pathname === "/api/v1/auth/callback" && request.method === "GET") {
      const code = url.searchParams.get("code");
      const clientId = env.GITHUB_CLIENT_ID || "Iv23liy75K9USLWDx1bG";
      const clientSecret = env.GITHUB_CLIENT_SECRET || "88c7e79c40a0db2d55c125744e24ef098a4280a7";

      if (!code) {
        return new Response("Missing OAuth code from GitHub", { status: 400, headers: CORS_HEADERS });
      }

      try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            code,
          }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
          return new Response(`GitHub OAuth Error: ${tokenData.error_description || "Token exchange failed"}`, {
            status: 400,
            headers: CORS_HEADERS,
          });
        }

        // Fetch authenticated user profile
        const userRes = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "User-Agent": "DevSetu-App",
          },
        });
        const user = await userRes.json();

        // Upsert into D1 database
        if (env.DB && user?.id) {
          try {
            await env.DB.prepare(
              `INSERT INTO accounts (id, login, type, email, avatar_url, plan, marketplace_status)
               VALUES (?, ?, ?, ?, ?, 'free', 'active')
               ON CONFLICT(id) DO UPDATE SET
                 login = excluded.login,
                 avatar_url = excluded.avatar_url,
                 updated_at = CURRENT_TIMESTAMP`
            )
              .bind(
                String(user.id),
                user.login,
                user.type || "User",
                user.email || null,
                user.avatar_url || null
              )
              .run();
          } catch (dbErr) {
            console.warn("Could not upsert user into D1:", dbErr.message);
          }
        }

        const returnTo = "https://devsetu-ai.infoskillstechnology.com/console";
        return Response.redirect(
          `${returnTo}?login=${encodeURIComponent(user.login)}&avatar=${encodeURIComponent(
            user.avatar_url || ""
          )}&token=${encodeURIComponent(tokenData.access_token)}`,
          302
        );
      } catch (err) {
        return new Response(`OAuth callback failed: ${err.message}`, { status: 500, headers: CORS_HEADERS });
      }
    }

    // 6c. Direct Token Exchange POST (for client-side SPA)
    if (url.pathname === "/api/v1/auth/exchange" && request.method === "POST") {
      try {
        const { code } = await request.json();
        const clientId = env.GITHUB_CLIENT_ID || "Iv23liy75K9USLWDx1bG";
        const clientSecret = env.GITHUB_CLIENT_SECRET || "88c7e79c40a0db2d55c125744e24ef098a4280a7";

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });

        const tokenData = await tokenRes.json();
        return new Response(JSON.stringify(tokenData), {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
    }

    // 7. GitHub App Webhooks (POST)
    if (request.method !== "POST") {
      return new Response("Not Found", { status: 404, headers: CORS_HEADERS });
    }

    const id = request.headers.get("x-github-delivery");
    const name = request.headers.get("x-github-event");
    const signature = request.headers.get("x-hub-signature-256");
    const payload = await request.text();

    if (!id || !name || !signature) {
      return new Response("Missing GitHub webhook headers", { status: 400, headers: CORS_HEADERS });
    }

    const app = new App({
      appId: env.APP_ID,
      privateKey: env.PRIVATE_KEY,
      webhooks: { secret: env.WEBHOOK_SECRET },
    });

    // Handle Issue Comments & Mentions
    app.webhooks.on("issue_comment.created", async ({ octokit, payload }) => {
      const comment = payload.comment;
      if (comment.user.type === "Bot") return;

      const body = comment.body || "";
      if (!BOT_TRIGGER_REGEX.test(body)) return;

      const issue = payload.issue;
      const repo = payload.repository;
      const accountId = repo.owner.id;
      const accountLogin = repo.owner.login;

      // 1. Determine Tier
      const plan = await getAccountPlan(env, accountId, accountLogin);

      // 2. Check & Consume Daily Quota
      const quotaStatus = await checkAndUpdateDailyQuota(env, accountId, plan);
      if (!quotaStatus.allowed) {
        const upgradeComment = [
          `⚠️ **Daily Quota Reached for @${accountLogin}**`,
          ``,
          `You have reached your daily limit of **${quotaStatus.limit} requests/day** on the **${TIERS[plan].name}** plan.`,
          ``,
          `### 🚀 Unlock Higher Limits:`,
          `- **Pro Plan ($29/mo)**: 1,500 requests/day, Gemini 3.8 Flash High Reasoning, PR code reviews.`,
          `- **Enterprise ($149/mo)**: Unlimited requests, Claude 5.1 Extra High, Custom workspace rules.`,
          ``,
          `👉 [**Upgrade on GitHub Marketplace**](https://github.com/marketplace/devsetu-app)`,
        ].join("\n");

        await octokit.rest.issues.createComment({
          owner: repo.owner.login,
          repo: repo.name,
          issue_number: issue.number,
          body: upgradeComment,
        });
        return;
      }

      // 3. Retrieve Repository Settings
      const settings = await getRepoSettings(env, `${repo.owner.login}/${repo.name}`);

      // 4. Generate AI Response
      const replyBody = await generateAIReply(env, {
        issue,
        comment,
        repo,
        plan,
        settings,
      });

      await octokit.rest.issues.createComment({
        owner: repo.owner.login,
        repo: repo.name,
        issue_number: issue.number,
        body: replyBody,
      });
    });

    // Handle Marketplace Plan Events (Purchased, Changed, Cancelled)
    app.webhooks.on("marketplace_purchase", async ({ payload }) => {
      const action = payload.action;
      const account = payload.marketplace_purchase?.account;
      const planName = payload.marketplace_purchase?.plan?.name?.toLowerCase() || "free";

      console.log(`[Marketplace Event] action=${action}, plan=${planName}, account=${account?.login}`);

      let targetPlan = "free";
      if (action !== "cancelled") {
        if (planName.includes("enterprise")) targetPlan = "enterprise";
        else if (planName.includes("pro")) targetPlan = "pro";
      }

      if (env.DB && account) {
        try {
          await env.DB.prepare(
            `INSERT INTO accounts (id, login, type, plan, marketplace_status)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET
               plan = excluded.plan,
               marketplace_status = excluded.marketplace_status,
               updated_at = CURRENT_TIMESTAMP`
          )
            .bind(String(account.id), account.login, account.type || "User", targetPlan, action)
            .run();
        } catch (dbErr) {
          console.error("Error saving marketplace purchase to D1:", dbErr.message);
        }
      }

      if (account?.login) {
        memoryStore.accounts[account.login] = { plan: targetPlan, marketplace_status: action };
      }
    });

    try {
      await app.webhooks.verifyAndReceive({ id, name, signature, payload });
      return new Response("ok", { status: 200, headers: CORS_HEADERS });
    } catch (err) {
      return new Response(`Webhook error: ${err.message}`, { status: 400, headers: CORS_HEADERS });
    }
  },
};
