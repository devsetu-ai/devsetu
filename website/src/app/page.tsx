"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Bot,
  Zap,
  Shield,
  Code,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  FileCode2,
} from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
    </svg>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"bug" | "perf" | "security">("bug");

  const copyCommand = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const demoScenarios = {
    bug: {
      prompt: "@aibot TypeError: Cannot read properties of undefined (reading 'map')",
      issueTitle: "Issue #42: Dashboard crashes on empty repository list",
      response: `Hello @sonurust,

Thank you for reporting this issue. Below is the technical breakdown and proposed fix for the runtime exception.

---

### 📌 Summary
The runtime \`TypeError\` occurs when the component attempts to invoke \`.map()\` on an uninitialized or empty state array before the API payload resolves.

---

### 🔍 Technical Analysis
In \`src/components/RepoList.tsx\`, \`data\` defaults to \`undefined\` during initial render:
\`\`\`typescript
// Problematic code:
const { data } = useFetchRepos();
return <div>{data.map(repo => <RepoCard key={repo.id} {...repo} />)}</div>;
\`\`\`

---

### 💡 Recommended Solution
Apply optional chaining with a default fallback array, or implement an explicit loading guard:

\`\`\`typescript
// Recommended Fix:
export function RepoList() {
  const { data = [], isLoading } = useFetchRepos();

  if (isLoading) {
    return <div className="animate-pulse">Loading repositories...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {data.length === 0 ? (
        <p className="text-slate-400">No repositories found.</p>
      ) : (
        data.map((repo) => <RepoCard key={repo.id} {...repo} />)
      )}
    </div>
  );
}
\`\`\`

---

### 🚀 Next Steps
1. Add a unit test verifying render state with empty mock data \`[]\`.
2. Commit the patch and tag me for verification!

> ⚡ *Powered by Gemini 3.5 Flash (aibot-sonurust)*`,
    },
    perf: {
      prompt: "@aibot how can we optimize our Cloudflare Worker cold starts and payload size?",
      issueTitle: "Issue #43: Optimizing webhook latency for high-traffic spikes",
      response: `Hello @sonurust,

Below is the architectural analysis for reducing webhook execution latency on Cloudflare Workers.

---

### 📌 Summary
Optimizing edge worker execution involves minimizing bundle size, leveraging native \`nodejs_compat\`, and avoiding heavy synchronous imports.

---

### 🔍 Technical Analysis
- **Bundle Optimization:** Tree-shaking unneeded Octokit modules reduced the bundle from 160 KiB to 124 KiB.
- **Streaming Execution:** Returning early HTTP 200 OK while processing long tasks asynchronously with \`ctx.waitUntil()\`.

---

### 💡 Recommended Solution
Utilize \`ctx.waitUntil()\` to decouple GitHub's 10-second delivery timeout from LLM generation:

\`\`\`javascript
export default {
  async fetch(request, env, ctx) {
    // Acknowledge webhook delivery immediately
    const response = new Response("Accepted", { status: 202 });

    // Process LLM in background execution
    ctx.waitUntil(handleWebhookEvent(request, env));

    return response;
  }
}
\`\`\`

> ⚡ *Powered by Gemini 3.5 Flash (aibot-sonurust)*`,
    },
    security: {
      prompt: "@aibot please review our GitHub Actions workflow permissions for least-privilege compliance",
      issueTitle: "Issue #44: Security audit on issue_comment workflow",
      response: `Hello @sonurust,

Here is your security audit for the GitHub Actions workflow definition.

---

### 📌 Summary
The workflow conforms to least-privilege standards by explicitly restricting \`GITHUB_TOKEN\` to \`issues: write\` rather than granting default write-all access.

---

### 🔍 Security Checklist
- ✅ **Permissions Restricted:** Only \`issues: write\` is specified.
- ✅ **Bot Loop Prevention:** Checks \`comment.user.type != 'Bot'\`.
- ✅ **Trigger Scoped:** Strictly filtered to \`issue_comment: [created]\`.

---

### 💡 Recommended Hardening
Ensure \`actions/github-script\` is pinned to a specific SHA for supply-chain integrity.

> ⚡ *Powered by Gemini 3.5 Flash (aibot-sonurust)*`,
    },
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent blur-3xl opacity-70" />
        <div className="absolute top-1/3 -right-60 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 -left-60 w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b14]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-cyan-500/30 glow-cyan">
              <Image src="/logo.png" alt="aibot logo" width={36} height={36} priority />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                aibot-sonurust
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Gemini 3.5 Flash
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-cyan-400 transition-colors">
              Live Demo
            </a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">
              How It Works
            </a>
            <a
              href="https://github.com/sonurust/aibot-github-app/blob/main/PRIVACY.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-cyan-400 transition-colors"
            >
              Privacy Policy
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/sonurust/aibot-github-app"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-200 bg-slate-900/80 border border-slate-700/80 rounded-lg hover:border-slate-500 hover:bg-slate-800 transition-all"
            >
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://github.com/apps/aibot-sonurust-app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-lg hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all"
            >
              Install App
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 md:pt-28 md:pb-24 max-w-5xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-semibold mb-6 glow-cyan">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Automated Issue Triage & Code Fixes</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
            Your AI Senior Engineer,{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Directly Inside GitHub Issues
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Mention <code className="text-cyan-300 font-mono bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">@aibot</code> in any issue to receive instant, senior-level code analysis, root-cause diagnosis, and executable patches powered by <strong>Google Gemini 3.5 Flash</strong>.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/apps/aibot-sonurust-app"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:shadow-xl hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 text-base"
            >
              <Bot className="w-5 h-5" />
              Add to GitHub Free
            </a>

            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-xl text-sm font-mono text-slate-300">
              <span className="text-cyan-400 select-none">$</span>
              <span>@aibot explain this bug</span>
              <button
                onClick={() => copyCommand("@aibot explain this bug")}
                className="ml-2 text-slate-400 hover:text-white transition-colors"
                title="Copy mention trigger"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-white/5 text-left">
            <div className="p-3">
              <div className="text-2xl font-bold text-white">~500ms</div>
              <div className="text-xs text-slate-400">Edge Webhook Latency</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-cyan-400">Gemini 3.5</div>
              <div className="text-xs text-slate-400">Google Flagship Flash</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-emerald-400">0 KB</div>
              <div className="text-xs text-slate-400">Private Code Retained</div>
            </div>
            <div className="p-3">
              <div className="text-2xl font-bold text-white">1-Click</div>
              <div className="text-xs text-slate-400">Marketplace Install</div>
            </div>
          </div>
        </section>

        {/* Live Interactive Demo Section */}
        <section id="demo" className="py-16 max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Interactive Issue Simulator</h2>
            <p className="text-sm text-slate-400 mt-2">
              Select a real-world scenario to preview how aibot-sonurust responds inside GitHub.
            </p>

            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <button
                onClick={() => setActiveTab("bug")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "bug"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                🐛 Debugging & Bug Fix
              </button>
              <button
                onClick={() => setActiveTab("perf")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "perf"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                ⚡ Edge Performance & Cloudflare
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "security"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 glow-cyan"
                    : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                🔐 CI/CD Security Audit
              </button>
            </div>
          </div>

          {/* Mock GitHub Issue Container */}
          <div className="glass-card rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* Header bar */}
            <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-3 font-mono text-xs text-slate-400">
                  github.com/sonurust/aibot-github-app/issues/1
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                Open
              </span>
            </div>

            {/* Issue body */}
            <div className="p-6 space-y-6 text-left">
              <div>
                <h3 className="text-xl font-bold text-white">{demoScenarios[activeTab].issueTitle}</h3>
                <p className="text-xs text-slate-400 mt-1">Opened by @sonurust • 1 comment</p>
              </div>

              {/* User comment */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                  SR
                </div>
                <div className="flex-1 bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 mb-1">@sonurust commented:</div>
                  <p className="font-mono text-sm text-cyan-300">{demoScenarios[activeTab].prompt}</p>
                </div>
              </div>

              {/* Bot response */}
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-cyan-400/50 glow-cyan">
                  <Image src="/logo.png" alt="aibot avatar" width={32} height={32} />
                </div>
                <div className="flex-1 bg-slate-900/90 rounded-xl p-5 border border-cyan-500/30 shadow-lg">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3 pb-2 border-b border-slate-800">
                    <span className="flex items-center gap-1.5 text-cyan-400">
                      <Bot className="w-3.5 h-3.5" />
                      aibot-sonurust[bot]
                    </span>
                    <span className="text-[11px] text-slate-500">Just now</span>
                  </div>

                  <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap font-sans text-slate-200">
                    {demoScenarios[activeTab].response}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-16 max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Engineered for Fast, Reliable Developer Workflows</h2>
            <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
              Combining edge computing with state-of-the-art multimodal AI models for instant developer assistance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Google Gemini 3.5 Flash</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Powered by Google&apos;s latest high-speed reasoning model, delivering deep technical analysis, code explanations, and debugging in seconds.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Cloudflare Workers Edge</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Global serverless execution across 300+ edge data centers ensures sub-second delivery acknowledgement and maximum uptime.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Zero Data Retention</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Your private code and issue data are never stored in external databases or used for model training. Pure in-memory streaming.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
                <Code className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Structured Output</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Replies are structured with executive clarity: Summary, Technical Analysis, Recommended Solution, and Next Steps with code snippets.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Dual Architecture</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Deploy as an organization-wide GitHub App on Cloudflare Workers or run as a standalone repository GitHub Action with zero hosting.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mb-4">
                <FileCode2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Marketplace Ready</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Designed to meet GitHub Marketplace standards with complete metadata, verified security practices, and clean permissions.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-16 max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-10">Simple 3-Step Setup</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-bold text-lg mb-4 glow-cyan">
                1
              </div>
              <h4 className="font-bold text-white text-base">Install App</h4>
              <p className="text-xs text-slate-400 mt-2">
                Install <code className="text-cyan-300">aibot-sonurust-app</code> on your repositories with one click.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg mb-4 glow-emerald">
                2
              </div>
              <h4 className="font-bold text-white text-base">Mention @aibot</h4>
              <p className="text-xs text-slate-400 mt-2">
                Tag the bot in any issue comment with questions, bug reports, or review requests.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">
                3
              </div>
              <h4 className="font-bold text-white text-base">Instant Fixes</h4>
              <p className="text-xs text-slate-400 mt-2">
                Receive syntax-highlighted code recommendations generated by Gemini 3.5 Flash.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 max-w-5xl mx-auto px-4">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 border border-cyan-500/30 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-center glow-cyan">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Start Automating Your GitHub Issues Today
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Free to use on public and private repositories. Powered by Google Gemini 3.5 Flash.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/apps/aibot-sonurust-app"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-95 shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                Install GitHub App Free
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/sonurust/aibot-github-app"
                target="_blank"
                rel="noreferrer"
                className="px-6 py-3 rounded-xl font-semibold text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 flex items-center gap-2"
              >
                <GithubIcon className="w-4 h-4" />
                View Repository
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#05080f] py-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="logo" width={20} height={20} />
            <span className="font-semibold text-slate-300">aibot-sonurust</span>
            <span>• Powered by Google Gemini 3.5 Flash</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/sonurust/aibot-github-app/blob/main/PRIVACY.md"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="https://github.com/sonurust/aibot-github-app/issues"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              Support & Issues
            </a>
            <a
              href="https://github.com/sonurust/aibot-github-app"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 transition-colors"
            >
              GitHub Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
