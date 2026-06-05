import React, { useEffect, useRef, useState } from "react";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
import { HiOutlineSparkles } from "react-icons/hi";
import { FiCopy, FiPlay, FiLink, FiSlash, FiRefreshCw } from "react-icons/fi";

// Curki Sage — minimal "Connect to Sage (extension)" surface.
//
// Models the Access Management modal pattern but stays deliberately small:
//   • Connect    → mints a v2d pairing code and shows it to paste into Sage.
//   • Disconnect → revokes the code.
//   • Workflow   → lists the org's saved training workflows (from Cosmos).
//   • Replay     → triggers a replay of the selected workflow, passing the
//                  training data + the latest run's placeholders/values + doc.
//
// The broker lives in the middleware at /api/care-voice/sage and the deployed
// Sage Chrome extension dials it directly over its SSE tunnel.

const MODULE = "v2d";
const API_BASE =
  process.env.REACT_APP_SAGE_BASE_URL || `${ROOT_API_BASE}/sage`;

// The broker keeps a paired session alive for ~12h, but the dashboard's
// connection state otherwise lives only in this component — closing the modal
// (unmount) or reloading the page would drop the code and falsely show "Not
// connected" while the extension is still paired. Persist the code so we can
// re-attach to the live session on mount.
const CODE_STORAGE_KEY = `sage:${MODULE}:code`;

const SageConnect = ({ onClose, userEmail, userName, replayReady, buildReplayData }) => {
  const [code, setCode] = useState(null);
  const [connState, setConnState] = useState("idle"); // idle | waiting | connected | offline
  const [workflows, setWorkflows] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingWf, setLoadingWf] = useState(false);
  const [minting, setMinting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const pollRef = useRef(null);

  // Authenticated headers — Firebase ID token (verified server-side) plus the
  // legacy identity headers. x-user-name becomes the workflow's creator name.
  const headers = async () => {
    const h = { "Content-Type": "application/json" };
    if (userEmail) h["x-user-email"] = userEmail;
    if (userName) h["x-user-name"] = userName;
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) h["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[sage] getIdToken failed:", err?.message);
      }
    }
    return h;
  };

  // ── Workflows ───────────────────────────────────────────────────────────
  const fetchWorkflows = async () => {
    setLoadingWf(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/workflows?module=${MODULE}`, {
        method: "GET",
        headers: await headers(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to load workflows");
      setWorkflows(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err.message || "Failed to load workflows");
    } finally {
      setLoadingWf(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
    // Re-attach to a still-live paired session from a previous open / page load.
    // pollStatus resolves it to connected/waiting, or clears it on 404/410.
    let stored = null;
    try { stored = localStorage.getItem(CODE_STORAGE_KEY); } catch { /* ignore */ }
    if (stored) {
      setCode(stored);
      setConnState("waiting");
      startPolling(stored);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Pairing ─────────────────────────────────────────────────────────────
  const pollStatus = async (activeCode) => {
    try {
      const res = await fetch(
        `${API_BASE}/session/${encodeURIComponent(activeCode)}/status`,
        { headers: await headers() }
      );
      if (res.status === 404 || res.status === 410) {
        setConnState("offline");
        setCode(null);
        try { localStorage.removeItem(CODE_STORAGE_KEY); } catch { /* ignore */ }
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      const data = await res.json();
      setConnState(data?.connected ? "connected" : "waiting");
    } catch {
      /* transient — next tick retries */
    }
  };

  const startPolling = (activeCode) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollStatus(activeCode);
    pollRef.current = setInterval(() => pollStatus(activeCode), 3000);
  };

  const handleConnect = async () => {
    setError("");
    setInfo("");
    setMinting(true);
    try {
      const res = await fetch(`${API_BASE}/pair/mint`, {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({ module: MODULE }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Failed to create code");
      setCode(data.code);
      setConnState("waiting");
      try { localStorage.setItem(CODE_STORAGE_KEY, data.code); } catch { /* ignore */ }
      setInfo("Code ready — paste it into the Sage side panel to pair.");
      try {
        await navigator.clipboard.writeText(data.code);
      } catch {
        /* clipboard blocked — user can still select the code */
      }
      startPolling(data.code);
    } catch (err) {
      setError(err.message || "Failed to create code");
    } finally {
      setMinting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!code) return;
    const activeCode = code;
    setCode(null);
    setConnState("idle");
    try { localStorage.removeItem(CODE_STORAGE_KEY); } catch { /* ignore */ }
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      await fetch(`${API_BASE}/session/${encodeURIComponent(activeCode)}/revoke`, {
        method: "POST",
        headers: await headers(),
      });
      setInfo("Disconnected.");
    } catch (err) {
      setError(err.message || "Failed to disconnect");
    }
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setInfo("Code copied.");
    } catch {
      /* ignore */
    }
  };

  // ── Replay ──────────────────────────────────────────────────────────────
  const handleReplay = async () => {
    setError("");
    setInfo("");
    if (!code) return setError("Connect to Sage first.");
    if (!replayReady) return setError("Generate a document first — replay re-enters that run's data.");
    if (!selectedId) return setError("Select a workflow to replay.");
    setReplaying(true);
    try {
      // Pull the full workflow (incl. the embedded plan) from Cosmos.
      const wfRes = await fetch(
        `${API_BASE}/workflows/${encodeURIComponent(selectedId)}`,
        { headers: await headers() }
      );
      const wfData = await wfRes.json();
      if (!wfRes.ok) throw new Error(wfData?.detail || "Failed to load workflow");
      const workflow = wfData?.data?.workflow || null;

      // Run-time data for v2d: the latest generation's placeholders/values JSON
      // plus the generated document. The extension re-enters this into the
      // live form using the recorded workflow + plan as the training data.
      const replayData =
        typeof buildReplayData === "function" ? buildReplayData() : {};

      const res = await fetch(
        `${API_BASE}/session/${encodeURIComponent(code)}/trigger`,
        {
          method: "POST",
          headers: await headers(),
          body: JSON.stringify({
            mode: "replay",
            module: MODULE,
            workflow,
            data: replayData || {},
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || "Replay failed");
      setInfo("Replay triggered — watch the Sage side panel.");
    } catch (err) {
      setError(err.message || "Replay failed");
    } finally {
      setReplaying(false);
    }
  };

  const dotColor =
    connState === "connected" ? "#34d399" : connState === "waiting" ? "#f59e0b" : "#9aa0b4";
  const statusText =
    connState === "connected"
      ? "Sage connected"
      : connState === "waiting"
      ? "Waiting for Sage to pair…"
      : connState === "offline"
      ? "Code expired"
      : "Not connected";

  return (
    <div style={S.overlay} role="presentation" onClick={onClose}>
      <div style={S.modal} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={S.header}>
          <div style={S.headerIcon}>
            <HiOutlineSparkles size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={S.title}>Connect to Sage</div>
            <div style={S.subtitle}>
              Pair the Sage browser extension, then replay a saved training workflow into the live form.
            </div>
          </div>
          <button type="button" style={S.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div style={S.body}>
          {/* Connection */}
          <div style={S.section}>
            <div style={S.sectionTitle}>
              <FiLink size={14} /> Connection
            </div>
            {!code ? (
              <button type="button" style={S.primaryBtn} onClick={handleConnect} disabled={minting}>
                <FiLink size={15} /> {minting ? "Connecting…" : "Connect to Sage"}
              </button>
            ) : (
              <>
                <div style={S.codeRow}>
                  <code style={S.code}>{code}</code>
                  <button type="button" style={S.ghostBtn} onClick={copyCode} title="Copy">
                    <FiCopy size={15} />
                  </button>
                </div>
                <button type="button" style={S.dangerBtn} onClick={handleDisconnect}>
                  <FiSlash size={14} /> Disconnect
                </button>
              </>
            )}
            <div style={S.statusPill}>
              <span style={{ ...S.dot, background: dotColor }} />
              {statusText}
            </div>
          </div>

          {/* Replay */}
          <div style={S.section}>
            <div style={S.sectionTitleRow}>
              <div style={S.sectionTitle}>
                <FiPlay size={14} /> Replay a workflow
              </div>
              <button
                type="button"
                style={S.iconBtn}
                onClick={fetchWorkflows}
                disabled={loadingWf}
                title="Refresh workflows"
                aria-label="Refresh workflows"
              >
                <FiRefreshCw size={14} />
              </button>
            </div>
            <select
              style={S.select}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">
                {loadingWf
                  ? "Loading workflows…"
                  : workflows.length
                  ? "Select a workflow…"
                  : "No saved workflows yet"}
              </option>
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.createdByName ? ` · ${w.createdByName}` : ""}
                  {w.createdAt ? ` · ${new Date(w.createdAt).toLocaleDateString()}` : ""}
                </option>
              ))}
            </select>
            {(() => {
              const replayDisabled =
                replaying || !code || !selectedId || !replayReady;
              // Tell the user exactly what's still missing — otherwise a disabled
              // button reads as "nothing happens" with no explanation.
              const replayBlocker = !code
                ? "Connect to Sage first — pair the extension above."
                : !replayReady
                ? "Generate a document first — replay re-enters that run’s data into the live form."
                : !selectedId
                ? "Select a workflow to replay."
                : "";
              return (
                <>
                  <button
                    type="button"
                    style={{
                      ...S.primaryBtn,
                      ...(replayDisabled ? S.primaryBtnDisabled : {}),
                    }}
                    onClick={handleReplay}
                    disabled={replayDisabled}
                  >
                    <FiPlay size={15} /> {replaying ? "Triggering…" : "Run Replay"}
                  </button>
                  {replayBlocker && <div style={S.hint}>{replayBlocker}</div>}
                </>
              );
            })()}
          </div>

          {error && <div style={S.error}>⚠ {error}</div>}
          {info && <div style={S.info}>✓ {info}</div>}
        </div>
      </div>
    </div>
  );
};

// Self-contained styles — keeps this minimal surface to a single file.
const S = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(15,16,32,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  },
  modal: {
    width: "min(480px, 92vw)", background: "#fff", borderRadius: 16,
    boxShadow: "0 24px 60px rgba(0,0,0,0.25)", overflow: "hidden",
    fontFamily: "inherit",
  },
  header: {
    display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 20px",
    borderBottom: "1px solid #ecebf5",
  },
  headerIcon: {
    width: 38, height: 38, borderRadius: 10, display: "grid", placeItems: "center",
    background: "linear-gradient(135deg,#a78bfa,#6c4cdc)", color: "#fff", flexShrink: 0,
  },
  title: { fontSize: 16, fontWeight: 700, color: "#1c1b2e" },
  subtitle: { fontSize: 12.5, color: "#707493", marginTop: 2, lineHeight: 1.4 },
  close: {
    border: "none", background: "transparent", fontSize: 24, lineHeight: 1,
    color: "#9aa0b4", cursor: "pointer",
  },
  body: { padding: 20, display: "flex", flexDirection: "column", gap: 18 },
  section: {
    border: "1px solid #ecebf5", borderRadius: 12, padding: 14,
    display: "flex", flexDirection: "column", gap: 10,
  },
  sectionTitle: {
    display: "flex", alignItems: "center", gap: 7, fontSize: 12.5,
    fontWeight: 700, color: "#5b21b6", textTransform: "uppercase", letterSpacing: 0.4,
  },
  sectionTitleRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  iconBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    width: 28, height: 28, border: "1px solid #ddd9ee", borderRadius: 8,
    background: "#f6f5fc", color: "#5b21b6", cursor: "pointer",
  },
  primaryBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "10px 16px", border: "none", borderRadius: 9, cursor: "pointer",
    background: "#7c3aed", color: "#fff", fontWeight: 600, fontSize: 14,
  },
  primaryBtnDisabled: {
    background: "#c4b5fd", cursor: "not-allowed", opacity: 0.7,
  },
  ghostBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    padding: "9px 11px", border: "1px solid #ddd9ee", borderRadius: 9,
    background: "#f6f5fc", color: "#5b21b6", cursor: "pointer",
  },
  dangerBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
    padding: "8px 14px", border: "1px solid #f3c9c9", borderRadius: 9,
    background: "#fff5f5", color: "#c0392b", cursor: "pointer", fontWeight: 600, fontSize: 13,
  },
  codeRow: { display: "flex", gap: 8, alignItems: "center" },
  code: {
    flex: 1, fontFamily: "ui-monospace, monospace", fontWeight: 700, fontSize: 17,
    letterSpacing: 1.5, textAlign: "center", padding: "11px 12px", borderRadius: 9,
    background: "#f6f5fc", border: "1px solid #ddd9ee", color: "#5b21b6",
  },
  statusPill: {
    display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
    padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 600,
    color: "#5a5f74", background: "#f4f4f9", border: "1px solid #ecebf5",
  },
  dot: { width: 9, height: 9, borderRadius: "50%" },
  hint: { fontSize: 11.5, color: "#9094ab", lineHeight: 1.4 },
  select: {
    width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #ddd9ee",
    background: "#fff", color: "#1c1b2e", fontSize: 14,
  },
  error: {
    background: "#fff5f5", color: "#c0392b", border: "1px solid #f3c9c9",
    borderRadius: 9, padding: "9px 12px", fontSize: 13,
  },
  info: {
    background: "#f0fbf4", color: "#1d7a46", border: "1px solid #c6ecd5",
    borderRadius: 9, padding: "9px 12px", fontSize: 13,
  },
};

export default SageConnect;
