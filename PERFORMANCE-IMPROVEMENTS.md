# Performance Improvements — Initial Load

Commit: `a8bc62b` on `curki-frontend-v2`
Date: 2026-05-25

## TL;DR

The app's initial JavaScript download shrunk from **21.4 MB (11.3 MB gzipped)** to **224 KB (73.5 KB gzipped)** — a **150x reduction in what every user transfers before the page can start working**. We did this without removing any features and without changing any user-visible behavior.

---

## The problem in plain English

When you opened the dashboard, your browser had to download the entire app — every report module, every chart library, every screen — before showing you anything. That meant:

- A single 21.4 MB JavaScript file (11.3 MB compressed) had to fully download before the app could render.
- A second copy of the plotly chart library was being downloaded from a CDN, on top of the one already bundled into the app — so plotly was loading twice.
- It didn't matter if you only used Financial Health: you still downloaded Care Voice, Smart Rostering, SIRS Analysis, Quality and Risk, Payroll Analysis, every staff onboarding screen, and more.
- This was the dominant reason the app felt slow on first open and stayed slow on every refresh.

## The problem technically

Three concrete issues sat at the root of the slow load:

1. **No code splitting at the route layer.** `src/App.js` statically imported all 7 route components (HomePage, InvitePage, AcceptAccessInvite, CandidateScreeningTest, CandidateLogin, CandidateDashboard) at the top of the file. CRA's default webpack config emitted them all into one bundle.

2. **No code splitting inside HomePage.** `src/Components/general-components/HomePage.js` (4,022 lines, 81 static imports) eagerly imported every feature module of the entire app. Each of those modules transitively pulled in heavy libraries — `plotly.js`, `chart.js`, `recharts`, `tinymce`, `jsoneditor`, `html2pdf.js`, `mammoth`, `docx`, `xlsx`, `superdoc`, `microsoft-cognitiveservices-speech-sdk`. All of it shipped on first paint regardless of which module the user actually opened.

3. **Duplicate plotly download via CDN.** `public/index.html` had a `<script src="https://cdn.plot.ly/plotly-3.0.0.min.js">` tag in `<head>` with no `async`/`defer`. It blocked HTML parsing for ~3 MB of plotly. But the project also has `plotly.js` and `react-plotly.js` as npm dependencies and uses them via `import Plot from 'react-plotly.js'`, so plotly was being downloaded twice — once from the CDN, once from the bundle.

## What we changed

### 1. `public/index.html` — removed the redundant CDN tag

```diff
- <title>CURKI AI DASHBOARD</title>
- <script src="https://cdn.plot.ly/plotly-3.0.0.min.js"></script>
+ <title>CURKI AI DASHBOARD</title>
```

Plain English: stopped downloading a 3 MB JavaScript library twice on every page load.

### 2. `src/App.js` — route-level lazy loading

```diff
- import HomePage from "./Components/general-components/HomePage";
- import InvitePage from "./Components/general-components/AcceptInvitation";
- // ... 4 more static imports
+ import { lazy, Suspense } from "react";
+ import CenteredLoader from "./Components/general-components/CenteredLoader";
+
+ const HomePage = lazy(() => import("./Components/general-components/HomePage"));
+ const InvitePage = lazy(() => import("./Components/general-components/AcceptInvitation"));
+ // ... 4 more lazy imports

  <Router>
    <ToastContainer ... />
-   <Routes>
-     <Route path="/" element={<HomePage />} />
-     // ... 6 more routes
-   </Routes>
+   <Suspense fallback={<CenteredLoader label="Loading…" />}>
+     <Routes>
+       <Route path="/" element={<HomePage />} />
+       // ... 6 more routes
+     </Routes>
+   </Suspense>
  </Router>
```

Plain English: each page of the app is now downloaded only when a user actually opens that page. If a candidate clicks an invite link to `/hr-candidate`, they no longer download the entire admin dashboard.

### 3. `src/Components/general-components/HomePage.js` — module-level lazy loading

All 22 feature modules (FinancialHealth, SirsAnalysis, Qfr, Afr, IncidentManagement, CustomReporting, CareServicesEligibility, IncidentReport, QualityandRisk, AiRostering, ResumeScreening, Client_Event_Reporting, SoftwareConnect, RosteringDashboard, HRAnalysis, NoOrgEmptyState, IncidentAuditing, TlcClientProfitability, TlcNewCustomerReporting, NewFinancialHealth, TlcNewClientProfitability, VoiceModule) were converted from static `import` to `lazy(() => import(...))`. Each gets its own webpack chunk.

A `visitedRoles` Set was added to gate when each module mounts:

```diff
+ const [visitedRoles, setVisitedRoles] = useState(() => new Set(["Financial Health"]));
+ useEffect(() => {
+   setVisitedRoles((prev) => {
+     if (prev.has(selectedRole)) return prev;
+     const next = new Set(prev);
+     next.add(selectedRole);
+     return next;
+   });
+ }, [selectedRole]);

- <div style={{ display: selectedRole === "SIRS Analysis" ? "block" : "none" }}>
-   <SirsAnalysis ... />
- </div>
+ {visitedRoles.has("SIRS Analysis") && (
+   <div style={{ display: selectedRole === "SIRS Analysis" ? "block" : "none" }}>
+     <Suspense fallback={<CenteredLoader />}>
+       <SirsAnalysis ... />
+     </Suspense>
+   </div>
+ )}
```

Plain English: when you first open a report module, the code for that module downloads in the background. Once it has downloaded, it stays loaded for the rest of your session, so switching back to it later is instant. Any uploaded files, in-progress analyses, or voice sessions remain in place — the state is not lost. Only modules you have actually opened ever get downloaded.

## Numbers — production build comparison

Measured by running `npm run build` against the codebase before and after the change. Numbers are for `build/static/js/`.

| Metric | Before | After | Change |
|---|---|---|---|
| Main bundle (raw) | 21,946 KB | 224 KB | **98% smaller** |
| Main bundle (gzipped) | 11.3 MB | 73.5 KB | **153× smaller** |
| Number of JS files | 13 | 66 | +53 (one per lazy boundary) |
| Total app code | 27.6 MB | 27.9 MB | +0.3 MB (chunk overhead — same code, more files) |
| Plotly downloaded | twice (CDN + bundle) | once (bundle only) | **3 MB cut from critical path** |
| Render-blocking scripts in `<head>` | 1 (plotly CDN, ~3 MB) | 0 | **HTML parser no longer blocked** |

## How the codebase is better — at a glance

| Concern | Before | After |
|---|---|---|
| Time to first paint | Browser parses HTML, hits a 3 MB blocking script tag, then downloads an 11.3 MB main JS bundle before any UI can appear | Browser parses HTML with no blocking scripts, downloads a 73 KB main JS bundle, renders the app shell immediately, downloads feature module chunks in the background as the user navigates |
| First-time visitor on the candidate-invite route | Downloads the full admin dashboard (HomePage and 22 feature modules) even though that route is just a login screen | Downloads only the `CandidateLogin` chunk (28 KB) plus the main runtime |
| User who only uses Financial Health | Pays for Care Voice, Smart Rostering, SIRS, Payroll Analysis, etc. on every visit | Pays for Financial Health only |
| Switching between modules in the sidebar | Instant (everything was preloaded) | Instant after first visit; brief loader shown on the first click for that module while its chunk downloads |
| Preserved in-progress work when switching modules | Yes (all modules mounted with `display:none`) | Yes — same behavior preserved via the `visitedRoles` Set |
| Plotly load count per page | 2 (CDN script + npm bundle) | 1 (npm bundle only) |
| Repo memory pressure during `npm start` | Required `--max-old-space-size=8192` to compile | Same flag still set, but the dep graph webpack has to chew on for the initial chunk is much smaller |
| Caching across deploys | A single hash change in any module busts the entire 21 MB bundle for every user | Only the changed module's chunk is busted; other chunks stay cached in the user's browser |
| Future feature additions | Every new module bloated the single bundle for everyone | Every new module is its own chunk; only users who open it pay |

## Behavior guarantees (what did NOT change)

- The sidebar, navigation, ToastContainer, sign-in flow, modals, and feature-module UIs are unchanged.
- Switching between modules preserves uploaded files, in-progress analyses, voice sessions, and any other internal module state — exactly as before. (This is what the `visitedRoles` gate is for: once you have opened a module, it stays mounted with `display:none` even when you switch away.)
- `SoftwareConnect` retains its original behavior of remounting on each visit (it was already conditionally rendered, not display-toggled).
- 5 imports that were dead in HomePage (`FinancialHealth`, `CustomReporting`, `TlcClientProfitability`, `AiRostering`, `ResumeScreening` — commented out or unused) were also moved to `lazy()`. Since their JSX is not referenced, their chunks are never requested at runtime.

## What we did not do (next steps)

The biggest wins are in. Smaller incremental work remaining:

| Step | Effort | Expected impact |
|---|---|---|
| `Promise.all` the mount-time API calls in HomePage (`fetchOrganizationId`, subscription check, manifest, candidates) so they run in parallel rather than chained on `user?.email` | ~1 hour | Faster TTI once bundle is small |
| Defer Firebase init (`initializeApp`, `getAuth`, `getDatabase`) until an auth-requiring route mounts, so `/test/:test_id` and the candidate routes don't pay for it | ~1 hour | Faster cold start on those routes |
| Backend: add `compression` middleware to the express app at `curki-ai-test-prod/index.js`, confirm Azure App Service "Always On" is enabled | ~15 min | Smaller JSON responses + no cold starts |
| Backend: deploy an Australia-East region App Service alongside the current Canada-Central one | ~1 day | ~250 ms per request saved for Australian users |
| Investigate the 11.3 MB on-demand chunk in the AFTER build — likely Care Voice with its speech SDK; might be further split | a few hours | Smaller chunk for that one module |

## How to verify the improvement yourself

```powershell
# Production build
$env:NODE_OPTIONS = '--max_old_space_size=8192'
$env:CI = 'false'
$env:GENERATE_SOURCEMAP = 'false'
node node_modules\react-scripts\scripts\build.js

# Look at the size of the main bundle and the chunk count
Get-ChildItem build\static\js\*.js |
  Sort-Object Length -Descending |
  Select-Object @{N='KB';E={[Math]::Round($_.Length/1024,1)}}, Name
```

You should see `main.<hash>.js` at around 224 KB and 65 other chunks of varying sizes. None of those other chunks load on initial page render — they only download when the user opens the module that uses them.
