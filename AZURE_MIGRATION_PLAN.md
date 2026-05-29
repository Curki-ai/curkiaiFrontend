# Azure Resource Migration — Backend + Frontend

## Context

The team is replacing the current Azure environment with a freshly created resource group. The new RG will host a new **Cosmos DB account** (replacing `azure-test-db`), two new **Blob Storage accounts** (replacing `staffonboardingmedia` and `staffonboarding`), and a new **App Service** for each side (backend + frontend). All data must move across except the legacy database `azure-test-db-id`, which the team has confirmed is no longer in use. The frontend change is scoped to swapping the Canada-region backend URL inside [src/config/apiBase.js](src/config/apiBase.js); the 37 hardcoded Container Apps URLs in components are out of scope for this migration.

After deployment, code lands on:
- Frontend → `curki-frontend-prod` branch on `Curki-ai/curkiaiFrontend`
- Backend → `curki-middleware-prod` branch on `tech2-careait/curki-ai-test-prod`

---

## Phase 0 — Azure access (you do this)

I cannot authenticate to your tenant. Run these on your machine before approving execution:

```powershell
# Install (one-time)
winget install -e --id Microsoft.AzureCLI

# Authenticate (opens browser)
az login

# Verify the right subscription is active
az account show --output table
az account set --subscription "<SUBSCRIPTION_ID>"   # if needed

# Confirm region availability for the resources we plan to create
az provider show -n Microsoft.DocumentDB --query "resourceTypes[?resourceType=='databaseAccounts'].locations" -o tsv
az provider show -n Microsoft.Storage --query "resourceTypes[?resourceType=='storageAccounts'].locations" -o tsv
az provider show -n Microsoft.Web --query "resourceTypes[?resourceType=='sites'].locations" -o tsv
```

Once `az account show` returns the right tenant/subscription in the terminal I'll be driving, the rest of the plan is executable.

---

## Phase 1 — Naming convention (Azure CAF-compliant)

Per [Microsoft CAF naming rules](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming): `<type>-<workload>-<env>-<region>-<instance>`. Region code `aue` = Australia East, fallback `cce` = Canada Central if Cosmos/App Service capacity is unavailable in AUE.

| Resource | Proposed name | Notes |
|---|---|---|
| Resource group | `rg-curki-prod-aue-001` | Container for everything below |
| Cosmos DB account | `cosmos-curki-prod-aue-001` | SQL/Core API (matches existing `@azure/cosmos` driver) |
| Storage account A (replaces `staffonboardingmedia`) | `stcurkimediaprodaue001` | 3–24 lowercase alphanum, no dashes |
| Storage account B (replaces `staffonboarding`) | `stcurkilmsprodaue001` | Same naming rule |
| Backend App Service plan | `asp-curki-mw-prod-aue-001` | Linux, **P1v3** (matches current `ASP-amantestresource-8336`) |
| Frontend App Service plan | `asp-curki-fe-prod-aue-001` | Linux, **P2v3** (matches current `ASP-CurkiFrontend-b9dd`) |
| Backend Web App | `app-curki-middleware-prod-aue-001` | Replaces `curki-test-prod`. Name aligns with the `curki-middleware-prod` branch. Runtime: Node 22-lts. |
| Frontend Web App | `app-curki-web-prod-aue-001` | Replaces `curkiaidashboard` / `Intelcarefrontend`. Runtime: Node 22-lts. |

**Subscription:** All new resources land in **`Curki Active Sponsership`** (sub ID `1a816e5a-1e74-4b4d-9ab4-fddb8217c04f`). The existing `Frontend` sub (`66665823-…`) is intentionally **not** used for the new env — consolidates everything in one sub matching the source backend data.

> Final names will be re-validated against `az <type> check-name` before creation — Storage account names are globally unique and may need a suffix bump.

---

## Phase 2 — Create the new Azure resources

All steps run from a terminal authenticated via Phase 0.

1. **Create the resource group:**
   ```powershell
   az group create -n rg-curki-prod-aue-001 -l australiaeast
   ```

2. **Create Cosmos DB account (SQL/Core API, Serverless to match source `azure-test-db`):**
   ```powershell
   az cosmosdb create `
     -n cosmos-curki-prod-aue-001 `
     -g rg-curki-prod-aue-001 `
     --kind GlobalDocumentDB `
     --default-consistency-level Session `
     --capabilities EnableServerless `
     --locations regionName=australiaeast failoverPriority=0 isZoneRedundant=False
   ```

3. **Create both Blob Storage accounts** (StorageV2, LRS to start; matches existing usage patterns in backend `utils/azure-blob.js`):
   ```powershell
   az storage account create -n stcurkimediaprodaue001 -g rg-curki-prod-aue-001 -l australiaeast --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false
   az storage account create -n stcurkilmsprodaue001   -g rg-curki-prod-aue-001 -l australiaeast --sku Standard_LRS --kind StorageV2 --allow-blob-public-access false
   ```

4. **Create both App Service plans and Web Apps** (Node 22 to match the active GitHub Actions workflow [.github/workflows/main_intelcarefrontend.yml](.github/workflows/main_intelcarefrontend.yml); two ASPs because backend stays on P1v3 and frontend on P2v3 to match current SKUs):
   ```powershell
   az appservice plan create -n asp-curki-mw-prod-aue-001 -g rg-curki-prod-aue-001 -l australiaeast --sku P1v3 --is-linux
   az appservice plan create -n asp-curki-fe-prod-aue-001 -g rg-curki-prod-aue-001 -l australiaeast --sku P2v3 --is-linux
   az webapp create -n app-curki-middleware-prod-aue-001 -g rg-curki-prod-aue-001 --plan asp-curki-mw-prod-aue-001 --runtime "NODE:22-lts"
   az webapp create -n app-curki-web-prod-aue-001         -g rg-curki-prod-aue-001 --plan asp-curki-fe-prod-aue-001 --runtime "NODE:22-lts"
   ```

5. **Capture the new endpoints** to a scratch file — these feed Phase 4 (the frontend URL swap) and Phase 5 (backend `.env` rewrite):
   ```powershell
   az cosmosdb show -n cosmos-curki-prod-aue-001 -g rg-curki-prod-aue-001 --query documentEndpoint -o tsv
   az cosmosdb keys list -n cosmos-curki-prod-aue-001 -g rg-curki-prod-aue-001 --type keys --query primaryMasterKey -o tsv
   az storage account show-connection-string -n stcurkimediaprodaue001 -g rg-curki-prod-aue-001 --query connectionString -o tsv
   az storage account show-connection-string -n stcurkilmsprodaue001   -g rg-curki-prod-aue-001 --query connectionString -o tsv
   az webapp show -n app-curki-middleware-prod-aue-001 -g rg-curki-prod-aue-001 --query defaultHostName -o tsv
   ```

---

## Phase 3 — Data migration

### 3a. Cosmos DB (17 of 19 DBs)

**Live DB count from `az cosmosdb sql database list`:** 19 databases (not the 17 named in `.env`). The extras are `incient_report` (typo of `incident_report`, kept for safety) and `cosmicworks` (Microsoft sample tutorial DB).

**Excluded:** `azure-test-db-id` and `cosmicworks` (per your direction). Pre-exclusion sanity check: I will `grep` for `azure-test-db-id` and the four hardcoded sites in backend `modules/rostering/broadcast/db/chat.db.js:6`, `modules/rostering/provider-data/db/provider-data.db.js:6`, `modules/rostering/visual-creds/db/visual-creds.db.js:6`, `modules/tlc/admin/db/admin.db.js:6` and verify the calling controllers are not registered in any active router before excluding. If a live route still depends on this DB, I will pause and surface it before deleting/skipping.

**Migrate the remaining 16 DBs**: `staff_onboarding, support, askai_feedback, financial_health, incident_auditing, client_event_incident_mgmt, quality_and_risk_reporting, sirs_analysis, incident_report, custom_incident_mgmt, payments, v2d, smart_rostering, integrations, payroll, client-profitability`.

**Reuse existing script** — the backend repo already has `scripts/migrate-cosmos-data.js`. I will extend it (not rewrite) to:
- Read source endpoint/key from `OLD_ENDPOINT` / `OLD_KEY` env vars.
- Read destination from `NEW_ENDPOINT` / `NEW_KEY`.
- Loop over `process.env.DATABASES_TO_MIGRATE` (CSV) and skip `azure-test-db-id` by hard-coded guard.
- For each DB: enumerate containers via `database.containers.readAll()`, recreate each container at the destination with the same partition key (read via `container.read()`), then page through items with `container.items.readAll({ maxItemCount: 1000 })` and bulk-upsert into the destination.
- Resume-safe: write a `migrated.json` checkpoint per (db, container, continuationToken).

### 3b. Blob Storage (both accounts, all 6 containers)

Use [`azcopy`](https://learn.microsoft.com/en-us/azure/storage/common/storage-use-azcopy-v10) — fastest, resumable, handles container creation. From a shell with `azcopy` installed and `az login` valid:

```powershell
# Generate destination SAS once per account (1-hour TTL is fine for a one-shot)
$dstA = az storage account generate-sas -n stcurkimediaprodaue001 --permissions cdlruwap --resource-types co --services b --expiry (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mmZ") -o tsv
$dstB = az storage account generate-sas -n stcurkilmsprodaue001   --permissions cdlruwap --resource-types co --services b --expiry (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mmZ") -o tsv
$srcA = az storage account generate-sas -n staffonboardingmedia   --permissions rl       --resource-types co --services b --expiry (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mmZ") -o tsv
$srcB = az storage account generate-sas -n staffonboarding        --permissions rl       --resource-types co --services b --expiry (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mmZ") -o tsv

# Copy all containers — azcopy creates them on destination if missing
azcopy copy "https://staffonboardingmedia.blob.core.windows.net?$srcA" "https://stcurkimediaprodaue001.blob.core.windows.net?$dstA" --recursive
azcopy copy "https://staffonboarding.blob.core.windows.net?$srcB"      "https://stcurkilmsprodaue001.blob.core.windows.net?$dstB"      --recursive
```

Containers expected on destination after copy: `lms-media`, `curki-carevoice-templates-container`, `care-voice-filled-doc-container`, `curki-payment-container`, `need-help-container`, `new-tlc-client-profitibility-container`, `tlc-payroll-history-data` (split across the two accounts per the existing mapping in the backend `modules/` tree).

### 3c. Update backend `.env`

Swap these keys to the new endpoints/connection strings captured in Phase 2 step 5:
- `ENDPOINT`, `KEY` → new Cosmos
- `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY`, `AZURE_STORAGE_CONNECTION_STRING` → `stcurkimediaprodaue001`
- `LMS_V2_AZURE_ACCOUNT_NAME`, `LMS_V2_AZURE_ACCOUNT_KEY`, `LMS_V2_AZURE_STORAGE_CONNECTION_STRING` → `stcurkilmsprodaue001`
- Leave `DATABASEID = azure-test-db-id` as-is, **but** flag it: the 4 hardcoded usages in `modules/rostering/**/db/*.js` and `modules/tlc/admin/db/admin.db.js` still reference the legacy DB literally. If those routes are confirmed dead, I'll delete the dead code in a follow-up; if they're live, the legacy DB must be migrated after all (back to Phase 3a).

---

## Phase 4 — Frontend changes

**Scope confirmed earlier:** only [src/config/apiBase.js](src/config/apiBase.js) changes; the 37 hardcoded `aca-curki-aibackend-prod-aue-001…` URLs across components are intentionally left alone for this migration.

1. **Update the Canada URL in [src/config/apiBase.js](src/config/apiBase.js):**
   ```javascript
   const USE_LOCAL_API = process.env.REACT_APP_USE_LOCAL_API === "true";
   console.log(`Using ${USE_LOCAL_API ? "local" : "production"} API endpoint`);
   export const API_BASE = USE_LOCAL_API
     ? "http://localhost:5000"
     : "https://app-curki-middleware-prod-aue-001.azurewebsites.net";  // ← new
   ```
   (Replace with the actual `defaultHostName` returned by `az webapp show` in Phase 2.5.)

2. **Add a deployment workflow for the new frontend Web App.** Copy [.github/workflows/main_intelcarefrontend.yml](.github/workflows/main_intelcarefrontend.yml) → `main_app_curki_web_prod_aue_001.yml`, change:
   - `app-name: app-curki-web-prod-aue-001`
   - Trigger branch: `curki-frontend-prod`
   - Create new federated-credential secrets for the new App Service (`AZUREAPPSERVICE_CLIENTID_*` / `TENANTID_*` / `SUBSCRIPTIONID_*`) — these come from `az ad app federated-credential create` against the new web app.

3. **Leave the 37 hardcoded URLs alone.** I will not touch [src/Components/general-components/HomePage.js](src/Components/general-components/HomePage.js), [src/Components/general-components/UploaderPage.js](src/Components/general-components/UploaderPage.js), the Financial module reporting files, or any of the 15 component files listed in the exploration report.

4. **Leave [.env](.env) as-is** (`REACT_APP_USE_LOCAL_API=false` — already correct for production).

---

## Phase 5 — Push to the new branches

Both repos are already on the right branches (`curki-frontend-prod` and `curki-middleware-prod`). After all edits:

```powershell
# Frontend (in D:\FrontendIntelcare)
git add src/config/apiBase.js .github/workflows/main_app_curki_web_prod_aue_001.yml
git commit -m "chore(migration): point frontend at new Australia-East backend App Service"
git push origin curki-frontend-prod

# Backend (in D:\Curki AI New Backend)
git add .env scripts/migrate-cosmos-data.js
git commit -m "chore(migration): switch Cosmos + Blob connection settings to new resource group"
git push origin curki-middleware-prod
```

I will **not** push without your go-ahead — the commits sit locally for review first.

---

## Verification

1. **Resource creation** — `az resource list -g rg-curki-prod-aue-001 -o table` shows: 1 Cosmos account, 2 Storage accounts, 1 App Service plan, 2 Web Apps.
2. **Cosmos parity** — for each migrated DB, run `az cosmosdb sql container list` against source and destination and diff container names + partition keys. Spot-check item counts on 3 random containers (`SELECT VALUE COUNT(1) FROM c`).
3. **Blob parity** — `az storage blob list --container-name <c> --account-name <new>` row count == source row count, for every container.
4. **Backend boot** — start backend locally against the new `.env`, hit `/health` (or any read-only Cosmos route), confirm 200.
5. **Frontend boot** — `npm start` from `D:\FrontendIntelcare`, open browser, watch the network tab: every request that flows through `API_BASE` should target `app-curki-middleware-prod-aue-001.azurewebsites.net`. Hit one screen that's known to use `API_BASE` (login, dashboard) end-to-end.
6. **Deployed verification** — after both pushes land and CI deploys, open the new frontend Web App URL and run the same login/dashboard smoke test.

---

## Open risks called out

- **`azure-test-db-id` exclusion**: Code grep shows 4 hardcoded references in rostering and TLC admin modules. If those routes are live, excluding the DB will break chat / provider-data / visual-creds / admin features on the new env. The migration script will hard-skip per your instruction, but I'll do the dead-code verification before Phase 3a runs and will stop and ask if I find an active wiring.
- **Service Bus + Container Apps not recreated**: Per your direction. Backend code in `constants/constant.js:15,18` and 13+ controllers still references the old Container Apps URL — those will continue calling the old environment. If the old RG is decommissioned before those references are migrated, the AI features (smart rostering, voice, financial analysis) will break.
- **App Service SKU** is set to `P1v3` as a placeholder — verify the source App Service SKU with `az webapp show` before creation to avoid over- or under-provisioning.
- **Region availability**: AUE is the target; CCE is the fallback. The Phase 0 region-availability check will catch this before we create anything.
