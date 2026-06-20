import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { API_BASE } from "../../../../config/apiBase";
import "../../../../Styles/general-styles/CombinedTestResults.css";

// Shown in the new tab while the Google Sheet is being created, so it isn't a
// blank tab during the few seconds the first open takes.
const SHEET_LOADING_HTML = `<!doctype html><html><head><meta charset="utf-8"><title>Opening results…</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif;background:#faf8ff;color:#1f1f40">
<div style="text-align:center">
<div style="width:44px;height:44px;border:4px solid #e9e3fb;border-top-color:#6c4cdc;border-radius:50%;margin:0 auto 18px;animation:s .7s linear infinite"></div>
<div style="font-size:16px;font-weight:600">Preparing your results sheet…</div>
<div style="font-size:14px;color:#6b6f8d;margin-top:6px">This can take a few seconds the first time.</div>
</div>
<style>@keyframes s{to{transform:rotate(360deg)}}</style>
</body></html>`;

// HR "Combined Test Results" — a test picker. Clicking a test opens that test's
// combined submissions as a Google Sheet in a new tab. The first time, the org
// connects Google once (a popup) so the sheet is created in their own Drive.
const CombinedTestResultsModal = ({
  results = [],
  organizationId,
  userEmail,
  onClose,
}) => {
  // Group every submission by the test it belongs to (only tests with data).
  const tests = useMemo(() => {
    const byTest = new Map();
    results.forEach((row) => {
      const id = row.testId || "__unassigned__";
      const name = row.testName || "Unassigned Test";
      if (!byTest.has(id)) {
        byTest.set(id, { testId: id, testName: name, count: 0 });
      }
      byTest.get(id).count += 1;
    });
    return Array.from(byTest.values()).sort((a, b) =>
      a.testName.localeCompare(b.testName)
    );
  }, [results]);

  const [openingId, setOpeningId] = useState(null);
  const [showConnect, setShowConnect] = useState(false);
  // null when idle, else the provider being connected ("google" | "microsoft").
  const [connecting, setConnecting] = useState(null);
  const popupRef = useRef(null);
  const pollRef = useRef(null);

  const openSheet = useCallback(
    async (test) => {
      if (openingId) return;
      if (test.testId === "__unassigned__") {
        toast.error("These submissions aren't linked to a test yet.");
        return;
      }
      // Open the tab synchronously inside the click gesture so the browser
      // doesn't block it as a popup, then redirect it once we have the URL.
      // Paint a friendly loading screen so it isn't a stark blank tab while the
      // sheet is being created (first open takes a few seconds).
      const win = window.open("about:blank", "_blank");
      if (win) {
        win.document.write(SHEET_LOADING_HTML);
        win.document.close();
      }
      setOpeningId(test.testId);
      try {
        const res = await fetch(`${API_BASE}/api/test-sheet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-email": userEmail || "",
            "x-organization-id": String(organizationId || ""),
          },
          body: JSON.stringify({
            organisation_id: organizationId,
            test_id: test.testId,
          }),
        });
        const data = await res.json();
        if (data?.ok && data.url) {
          if (win && !win.closed) win.location.href = data.url;
          else window.open(data.url, "_blank", "noopener,noreferrer");
        } else if (data?.needsConnect) {
          if (win && !win.closed) win.close();
          setShowConnect(true);
        } else {
          if (win && !win.closed) win.close();
          toast.error(data?.message || "Could not open the results sheet.");
        }
      } catch (error) {
        console.error("openSheet error:", error);
        if (win && !win.closed) win.close();
        toast.error("Could not open the results sheet. Please try again.");
      } finally {
        setOpeningId(null);
      }
    },
    [openingId, organizationId, userEmail]
  );

  // Listen for the popup's result.
  useEffect(() => {
    const onMessage = (event) => {
      const data = event?.data;
      if (!data || typeof data.ok !== "boolean") return;
      setConnecting(null);
      if (pollRef.current) clearInterval(pollRef.current);
      if (data.ok) {
        setShowConnect(false);
        toast.success("Connected — tap the test to open it.");
      } else {
        toast.error(data.message || "Connection failed.");
      }
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleConnect = useCallback(
    (provider) => {
      const path =
        provider === "microsoft" ? "test-sheet-msoauth" : "test-sheet-oauth";
      const url =
        `${API_BASE}/api/${path}/start` +
        `?organisation_id=${encodeURIComponent(organizationId || "")}` +
        `&admin_email=${encodeURIComponent(userEmail || "")}`;
      const w = window.open(url, "curki-connect", "width=520,height=660");
      if (!w) {
        toast.error("Please allow popups to connect.");
        return;
      }
      popupRef.current = w;
      setConnecting(provider);
      // Stop the spinner if the user closes the popup without finishing.
      pollRef.current = setInterval(() => {
        if (w.closed) {
          clearInterval(pollRef.current);
          setConnecting(null);
        }
      }, 700);
    },
    [organizationId, userEmail]
  );

  return (
    <div className="combined-overlay" onClick={onClose} role="presentation">
      <div
        className="combined-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="combined-title"
      >
        <div className="combined-header">
          <div className="combined-header-titles">
            <span className="combined-header-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
              </svg>
            </span>
            <div className="combined-header-text">
              <h2 className="combined-title" id="combined-title">
                Combined Test Results
              </h2>
              <p className="combined-subtitle">
                Pick a test to see all candidate responses in one spreadsheet —
                sort, filter or edit it, and your whole team sees the same view.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="combined-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="combined-body">
          {showConnect ? (
            <div className="combined-connect">
              <span className="combined-connect-icon" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
              </span>
              <p className="combined-connect-title">Connect once</p>
              <p className="combined-connect-text">
                Connect your Google or Microsoft account so results open in your
                own spreadsheet. You only do this once for your whole team.
              </p>
              <div className="combined-connect-actions">
                <button
                  type="button"
                  className="combined-connect-btn"
                  onClick={() => handleConnect("google")}
                  disabled={!!connecting}
                >
                  {connecting === "google" ? (
                    <>
                      <span className="combined-spinner" aria-hidden="true" />
                      Waiting…
                    </>
                  ) : (
                    "Connect Google"
                  )}
                </button>
                <button
                  type="button"
                  className="combined-connect-btn combined-connect-btn-ms"
                  onClick={() => handleConnect("microsoft")}
                  disabled={!!connecting}
                >
                  {connecting === "microsoft" ? (
                    <>
                      <span className="combined-spinner" aria-hidden="true" />
                      Waiting…
                    </>
                  ) : (
                    "Connect Microsoft"
                  )}
                </button>
              </div>
              <button
                type="button"
                className="combined-connect-back"
                onClick={() => setShowConnect(false)}
                disabled={!!connecting}
              >
                Back
              </button>
            </div>
          ) : tests.length === 0 ? (
            <div className="combined-empty">
              <span className="combined-empty-icon" aria-hidden="true">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="8" y1="13" x2="16" y2="13" />
                  <line x1="8" y1="17" x2="13" y2="17" />
                </svg>
              </span>
              <p className="combined-empty-title">No submissions yet</p>
              <p className="combined-empty-text">
                Once candidates submit a screening test, their results show up
                here.
              </p>
            </div>
          ) : (
            <div className="combined-test-grid">
              {tests.map((t) => {
                const isOpening = openingId === t.testId;
                return (
                  <button
                    type="button"
                    key={t.testId}
                    className={`combined-test-card ${isOpening ? "is-opening" : ""}`}
                    onClick={() => openSheet(t)}
                    disabled={!!openingId}
                  >
                    <span className="combined-card-tile" aria-hidden="true">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                      </svg>
                    </span>

                    <span className="combined-card-body">
                      <span className="combined-card-name">{t.testName}</span>
                      <span className="combined-card-count">
                        {t.count} submission{t.count === 1 ? "" : "s"}
                      </span>
                    </span>

                    <span className="combined-card-action">
                      {isOpening ? (
                        <>
                          <span className="combined-spinner" aria-hidden="true" />
                          Opening…
                        </>
                      ) : (
                        <>
                          Open in Google Sheets
                          <svg className="combined-card-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CombinedTestResultsModal;
