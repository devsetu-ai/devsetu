-- DevSetu Database Schema for Cloudflare D1
-- Zero-cost serverless SQLite for multi-tier plan management & repository settings

-- 1. Accounts & GitHub Marketplace Plan Mapping
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,                       -- GitHub User or Organization ID
  login TEXT NOT NULL,                       -- GitHub username or org slug (e.g. 'devsetu-ai')
  type TEXT NOT NULL DEFAULT 'User',         -- 'User' or 'Organization'
  email TEXT,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free',         -- 'free', 'pro', 'enterprise'
  marketplace_status TEXT DEFAULT 'active',  -- 'active', 'cancelled', 'pending_change'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Installations (GitHub App installs)
CREATE TABLE IF NOT EXISTS installations (
  installation_id INTEGER PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  repository_selection TEXT DEFAULT 'all',   -- 'all' or 'selected'
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Daily Usage & Rate Limiting
CREATE TABLE IF NOT EXISTS daily_usage (
  account_id TEXT NOT NULL,
  date TEXT NOT NULL,                        -- YYYY-MM-DD (UTC)
  request_count INTEGER DEFAULT 1,
  PRIMARY KEY (account_id, date),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- 4. Custom Repository Settings (Pro & Enterprise)
CREATE TABLE IF NOT EXISTS repository_settings (
  repo_full_name TEXT PRIMARY KEY,           -- e.g. 'devsetu-ai/devsetu'
  account_id TEXT NOT NULL,
  preferred_model TEXT DEFAULT 'auto',       -- 'gemini-3.5-flash', 'gemini-3.8-flash', 'claude-5.1-extra-high'
  auto_pr_review INTEGER DEFAULT 0,          -- 1 = Review PRs automatically on open
  custom_system_prompt TEXT,                 -- Custom rules for Enterprise
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast account lookup
CREATE INDEX IF NOT EXISTS idx_accounts_login ON accounts(login);
CREATE INDEX IF NOT EXISTS idx_usage_date ON daily_usage(date);
