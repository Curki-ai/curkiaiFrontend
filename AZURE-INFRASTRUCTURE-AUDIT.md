# Azure Infrastructure Audit — Curki Frontend

**Date:** 2026-06-01
**Scope:** This repository (`curkiaiFrontend`) — a Create React App SPA — and the Azure cloud infrastructure it needs to be robust, scalable, and professional.
**Cloud:** Azure. **Primary region:** Australia East (`aue`) — appropriate for an Australian aged-care / NDIS product.

> This audit covers the **frontend repo and its surrounding platform concerns**. Backend/API services live in a separate repo; where infra spans both (residency, WAF, observability), it's called out as **[cross-repo]**.

---

## 1. Current state (what exists today)

| Area | Observed | Verdict |
| --- | --- | --- |
| App | CRA `react-scripts@5.0.1` SPA, React 18, react-router v7 | OK, but CRA is EOL — see §8 |
| Hosting | Deployed to **Azure App Service** (Linux Node) as raw repo | ❌ Wrong primitive for a static SPA |
| Serve model | No `server.js` / `web.config` / `staticwebapp.config.json` / Dockerfile | ❌ Likely runs `react-scripts start` (dev server) in prod |
| CI/CD | 4 GitHub Actions workflows, **all** on `push: main` | ❌ Duplicate/competing deploys |
| Build | `npm install`, `npm test` → `exit 0`, `zip ./* -r` (incl. `node_modules`) | ❌ Non-reproducible, no tests, bloated artifact |
| Auth to Azure | Mix of publish-profile (`azure-webapps-node.yml`) + OIDC | ⚠️ Eliminate publish-profile |
| Config | `.env` is **git-tracked**; API base scattered across modules | ⚠️ Secrets/config hygiene |
| Bundle | 57 MB build; largest chunk ~11.5 MB uncompressed (plotly/xlsx) | ⚠️ Perf — lazy-loading started (see `PERFORMANCE-IMPROVEMENTS.md`) |
| Realtime | `socket.io-client` in 4 modules | ⚠️ Needs WebSocket-capable edge + sticky/scaled backend |
| Residency | Frontend prod in **AU East**; backend in **Canada Central** | ❌ AU health-data residency risk **[cross-repo]** |
| CDN / WAF | None detected | ❌ No edge caching, no WAF, no DDoS L7 |
| Observability | No App Insights / RUM wiring in frontend | ❌ Blind in production |
| IaC | None (no Bicep/Terraform) | ❌ Infra is click-ops |
| Repo hygiene | Stray `src/*.py` files; `build/` present locally | ⚠️ Clean up |

---

## 2. Target architecture (recommended)

```
                          ┌─────────────────────────────────────────┐
   Users (AU) ───TLS───▶  │  Azure Front Door Standard/Premium       │
                          │  • WAF (OWASP managed rules, bot mgmt)   │
                          │  • Brotli/Gzip compression at edge       │
                          │  • Caching + custom domain + TLS         │
                          │  • WebSocket passthrough (socket.io)     │
                          └───────────────┬─────────────┬───────────┘
                                          │             │
                         /  (static SPA)  │             │  /api/*  /socket.io
                                          ▼             ▼
                      ┌──────────────────────────┐   ┌──────────────────────────┐
                      │ Azure Static Web Apps     │   │ Backend API (separate repo)│
                      │  (Standard) — global CDN  │   │  App Service / Container   │
                      │  immutable hashed assets  │   │  Apps in AU East           │
                      └──────────────────────────┘   └──────────────────────────┘
                                          │
        Cross-cutting: Key Vault · App Configuration · App Insights + Log Analytics
                       Entra ID · Managed Identity · Bicep IaC · Front Door DDoS
```

---

## 3. Hosting — fix the foundation first

**Problem:** A static React bundle is being deployed to App Service with no production web server. App Service + Oryx will, by default, try to `npm start` — i.e. the CRA dev server (`react-scripts start --max-old-space-size=8192`). That is not a production server: no compression, no caching headers, single-process, memory-hungry, insecure.

**Recommendation — choose one:**

1. **Azure Static Web Apps (Standard tier)** — *recommended default for this SPA.*
   - Purpose-built for SPA + API; global CDN included; free managed TLS; SPA fallback routing; staging environments per PR out of the box; integrates with Entra ID.
   - Add a `staticwebapp.config.json` for SPA fallback, security headers (CSP, HSTS, X-Frame-Options), and `/api` routing/proxy.
   - Standard tier needed for: custom auth (Entra), SLA, larger size limits, BYO Functions/linked backend.

2. **Storage Static Website + Azure Front Door** — if you want full control of caching/WAF and the asset set is large.
   - `$web` container hosts the build; Front Door fronts it with WAF, compression, caching.

> Either way: **stop deploying to App Service as a Node app.** If App Service must be retained short-term, add a real static server (`web.config` with URL-rewrite to `index.html`, or `pm2 serve build`) and set a proper startup command — but SWA/Front Door is the professional answer.

**Caching policy** (set once you control the edge):
- `index.html` → `Cache-Control: no-cache` (always revalidate).
- Hashed assets (`static/js/*.[hash].js`) → `Cache-Control: public, max-age=31536000, immutable`.
- Enable **Brotli** compression at the edge.

---

## 4. CDN / Edge / WAF — Azure Front Door

- **Azure Front Door Standard (or Premium for managed WAF + bot rules).**
- Benefits: TLS termination + auto-managed certs, custom domain, global anycast (fast for AU + offshore staff), **WAF with OWASP managed ruleset**, rate limiting, L7 DDoS, WebSocket support for `socket.io`.
- Front Door also lets you route `/` → SWA/Storage and `/api`, `/socket.io` → backend under **one origin**, which removes CORS complexity and lets you drop the dev-only host-rewrite hack.

---

## 5. CI/CD — consolidate and harden

**Current:** 4 workflows (`azure-webapps-node.yml`, `deploy_app-curki-frontend-prod-aue-001.yml`, `main_intelcaredashboard.yml`, `main_intelcarefrontend.yml`) all fire on `push: main` → racing, duplicated deploys to multiple app names.

**Target — a single pipeline:**
1. **Delete/disable** the 3 redundant workflows; keep one canonical pipeline (or one per real environment).
2. Use **`npm ci`** (reproducible) and **`actions/setup-node` cache**.
3. **Real CI gates:** ESLint, `npm audit`/Dependabot, a smoke build, and unit tests (replace the `exit 0` stub). Fail the build on lint/security errors.
4. **Artifact = `build/` only** — never zip `node_modules`.
5. **Inject build-time config explicitly:** `REACT_APP_USE_LOCAL_API=false` (and other `REACT_APP_*`) from GitHub Environment secrets/vars, *not* from a committed `.env`. A wrong value bakes `localhost:5000` into prod.
6. **OIDC everywhere** (`azure/login` federated credentials). Remove the `AZURE_WEBAPP_PUBLISH_PROFILE` path entirely.
7. **Environments + gates:** `dev` → `staging` → `production` with required reviewers on `production`. Use SWA preview environments (or App Service deployment slots) for PR validation and **slot swap** for zero-downtime release + instant rollback.
8. Pin actions to versions and set least-privilege `permissions:` per job.

---

## 6. Configuration & secrets

- **Stop tracking `.env`.** Add `.env` to `.gitignore` (currently only `.env.local` variants are ignored) and rotate anything ever committed.
- **Build-time vs runtime:** CRA inlines `REACT_APP_*` at build time, so the bundle is environment-specific. Standardize all API base resolution through `src/config/apiBase.js` and finish the README's planned cleanup (remove the ~40-file hardcoded-URL pattern and the dev-only host-rewrite interceptor in `src/index.js`).
- **Azure Key Vault** — for any real secrets used by build/runtime (e.g. Speech SDK keys should be brokered by the backend, **never** shipped in the SPA). Front-end must treat all `REACT_APP_*` values as public.
- **Azure App Configuration** — central feature flags + non-secret config across environments, with labels per env.
- **Managed Identity** — for pipeline/service access to Key Vault/App Config (no stored credentials).

---

## 7. Observability

- **Application Insights** (Browser SDK / RUM) in the SPA: page-load timing, Core Web Vitals, JS exceptions, dependency (XHR) failures, user flows.
- **Log Analytics workspace** as the sink; **Front Door + WAF logs** and **SWA/App Service logs** routed there.
- **Azure Monitor alerts + dashboards:** availability test (ping `index.html`), JS error-rate spike, 4xx/5xx at Front Door, WAF block anomalies, P95 load time.
- Wire **release annotations** from the pipeline so regressions map to deploys.

---

## 8. Application-level robustness (enables the infra to pay off)

- **CRA is end-of-life.** Plan migration to **Vite** (or Next.js if SSR/SEO is wanted). Vite gives faster builds, modern code-splitting, and removes the `--max-old-space-size=8192` crutch.
- **Bundle:** the 11.5 MB chunk (plotly + xlsx) should be split further and loaded on demand; consider lighter charting where possible. Continue the route/module lazy-loading already begun in `PERFORMANCE-IMPROVEMENTS.md`.
- **Security headers / CSP:** none in `public/index.html`. Define CSP, HSTS, X-Content-Type-Options, Referrer-Policy at the edge (SWA config or Front Door rules).
- **Repo hygiene:** remove stray `src/*.py` files and committed `build/` artifacts from the repo.

---

## 9. Identity & access

- Firebase is currently used for client auth. For an enterprise AU health product, evaluate **Microsoft Entra ID (External ID / B2C)** for SSO, conditional access, MFA, and audit alignment — or keep Firebase but document the trust boundary. **[cross-repo]**
- Enforce **RBAC + least privilege** on all Azure resources; pipeline identities scoped to a single resource group per environment.

---

## 10. Data residency & compliance — **high priority [cross-repo]**

- The production backend resolves to **`canadacentral`** while the frontend is in **Australia East**. Australian aged-care / NDIS data is subject to the **Privacy Act / APPs** and (often contractually) **data-residency in Australia**.
- **Action:** confirm where personal/health data is stored and processed. If it leaves AU, this is a compliance and latency problem. Target: backend, database, storage, and AI services all in **Australia East/Southeast**.
- Establish **Azure Policy** to enforce allowed regions, required tags, and TLS minimums across the subscription.

---

## 11. Networking & reliability

- **Custom domain + managed TLS** via Front Door/SWA (no self-managed certs).
- **WebSocket support** confirmed at the edge for `socket.io` (Front Door supports it).
- **Multi-region / failover:** Front Door can health-probe and fail over origins; for the static SPA, SWA/Storage is already geo-distributed.
- **Backend scaling [cross-repo]:** socket.io with multiple backend instances needs a backplane (e.g. **Azure Cache for Redis** adapter) or **Azure Web PubSub**; otherwise sticky sessions only, which limits scale.

---

## 12. Infrastructure as Code & governance

- **Bicep** modules for: Front Door + WAF policy, Static Web App (or Storage + CDN), Key Vault, App Configuration, App Insights + Log Analytics, RBAC assignments. Deploy via the same pipeline (what-if + approval).
- **Resource naming + tagging** standard (you already use `app-curki-frontend-prod-aue-001` — formalize it: `<type>-<app>-<env>-<region>-<instance>`).
- **Cost management:** budgets + alerts per environment; SWA Standard and Front Door Standard are low fixed cost; biggest savings come from killing the App Service-as-static-host pattern.

---

## 13. Prioritized roadmap

### P0 — correctness & safety (days)
1. Consolidate to **one** deploy workflow; disable the other 3 racing pipelines.
2. Confirm prod is **not** serving the CRA dev server; if it is, ship a real static host.
3. **Untrack `.env`**, gitignore it, rotate exposed values, inject `REACT_APP_*` from CI.
4. Switch CI to `npm ci`, build `build/` only, OIDC auth, remove publish-profile.
5. **[cross-repo]** Confirm data residency of the Canada-Central backend.

### P1 — professional baseline (1–3 weeks)
6. Move hosting to **Azure Static Web Apps (Standard)** (or Storage + Front Door).
7. Add **Azure Front Door + WAF**, custom domain, TLS, edge compression + caching headers.
8. Add **Application Insights (RUM)** + Log Analytics + alerts.
9. Add **CSP/security headers**; finish API-base centralization; remove dev host-rewrite hack.
10. **Bicep** for all of the above; environments + approval gates + staging slots/preview envs.

### P2 — scale & maturity (1–3 months)
11. Migrate **CRA → Vite**; further split the 11.5 MB chunk.
12. **Key Vault + App Configuration** + Managed Identity; feature flags.
13. Evaluate **Entra External ID** for auth; enforce **Azure Policy** (regions/tags/TLS).
14. **[cross-repo]** socket.io scale-out via Redis backplane / Azure Web PubSub; multi-region failover.

---

## 14. Azure services shopping list

| Need | Azure service | Tier |
| --- | --- | --- |
| Static SPA hosting | **Static Web Apps** | Standard |
| Edge / CDN / WAF / DDoS-L7 | **Front Door** | Standard (Premium for managed WAF/bot) |
| Secrets | **Key Vault** | Standard |
| Config / feature flags | **App Configuration** | Standard |
| Observability | **Application Insights** + **Log Analytics** | Pay-as-you-go |
| Identity (eval) | **Entra External ID (B2C)** | — |
| Governance | **Azure Policy** + **Cost Management budgets** | included |
| Realtime scale [cross-repo] | **Azure Cache for Redis** or **Web PubSub** | Basic/Standard |
| IaC | **Bicep** + GitHub Actions OIDC | — |

---

*Generated as an architecture audit. Next step options: (a) scaffold the Bicep + a single hardened GitHub Actions pipeline, (b) add `staticwebapp.config.json` with routing + security headers, or (c) draft the App Insights RUM wiring.*
