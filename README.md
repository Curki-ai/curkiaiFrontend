# frontendIntelcare

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
