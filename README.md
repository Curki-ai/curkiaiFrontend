# frontendIntelcare

<!-- prod branch initialized -->


## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

Or use the helper script (activates the dev environment, then runs `npm start`):

```powershell
E:\dev\run-frontend.ps1
```

Build for production:

```bash
npm run build
```

## API config: switching between local and prod

The API base URL is resolved in [src/config/apiBase.js](src/config/apiBase.js) from a single environment variable:

```js
const USE_LOCAL_API = process.env.REACT_APP_USE_LOCAL_API === "true";
export const API_BASE = USE_LOCAL_API
  ? "http://localhost:5000"
  : "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
```

The toggle is `REACT_APP_USE_LOCAL_API`, set in [.env](.env):

| Value | `API_BASE` resolves to | When to use |
| --- | --- | --- |
| `true` | `http://localhost:5000` | Local dev against a backend running on your machine |
| `false` (or unset) | `https://curki-test-prod-…azurewebsites.net` | Local dev against the deployed backend, and all production builds |

### To switch

Edit [.env](.env) and restart the dev server (CRA only reads env vars at startup):

```
# hit the local backend
REACT_APP_USE_LOCAL_API=true

# hit the deployed backend
REACT_APP_USE_LOCAL_API=false
```

### Production builds

Production deploys must build with `REACT_APP_USE_LOCAL_API=false` (or unset) — otherwise the bundle ships with `http://localhost:5000` baked in and every API call from the live site will fail. Set this in your hosting platform's build environment, not by committing it to `.env`.

## Dev-only API host redirect

`src/index.js` contains a localhost-only interceptor that transparently rewrites all calls from the production backend host to `http://localhost:5000`. This exists because most modules in this app hardcode the production URL — without the interceptor, running `npm start` would still hit the deployed backend.

**The redirect only activates when `window.location.hostname` is localhost / 127.0.0.1, so production builds are unaffected.**

### To revert / remove

Open `src/index.js` and delete the contiguous block between the comment markers:

```
// ── Dev-only API host redirect ───────────────────────────────────────────
... (block) ...
// ─────────────────────────────────────────────────────────────────────────
```

Also remove the `import axios from 'axios';` line at the top if no other code in `index.js` uses it.

### Long-term cleanup

The right fix is to replace the hardcoded production URL across the ~40 files with a shared helper that does the localhost detection itself (see `src/Components/Modules/SupportAtHomeModule/LMSRedesign/api.js` for the pattern). Once that's done, the interceptor in `index.js` can be removed permanently.
