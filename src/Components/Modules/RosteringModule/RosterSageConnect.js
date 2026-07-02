import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { API_BASE as ROOT_API_BASE } from "../../../config/apiBase";
import { auth } from "../../../firebase";
import { HiOutlineSparkles } from "react-icons/hi";
import {
  FiCopy,
  FiLink,
  FiSlash,
  FiRefreshCw,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiTerminal,
  FiStar,
  FiX,
} from "react-icons/fi";
import "../../../Styles/SupportAtHomeModule/CareVoice/SageConnect.css";
import "../../../Styles/SupportAtHomeModule/CareVoice/SageHandleExperiments.css";

// Curki Sage — Smart Rostering variant of the "Connect to Sage" drawer.
//
// Same connection layer as CareVoice's SageConnect (pair / disconnect / status /
// live logs), but the REPLAY is event-driven instead of button-driven:
//
//   • The user picks ONE "active workflow" and it stays active.
//   • When a staff shift turns ACCEPTED (green) in the history screen, that
//     screen calls the imperative `fireReplay(shiftData, label)` exposed here —
//     no button. The active workflow is auto-run against that shift's data.
//   • MULTIPLE accepts are fine: each is a separate trigger carrying its own
//     shift data; the extension runs them as a queue (one portal at a time).
//   • OFFLINE accepts are not lost: if Sage isn't connected (or no active
//     workflow) when a shift is accepted, the request is queued to localStorage
//     and auto-fired the moment Sage (re)connects.
//
// The broker lives at /api/care-voice/sage and already reserves the `roster`
// module tag (SAGE-ROS-…). Everything below is module="roster".

const MODULE = "roster";
const API_BASE = process.env.REACT_APP_SAGE_BASE_URL || `${ROOT_API_BASE}/sage`;

const CODE_STORAGE_KEY = `sage:${MODULE}:code`;
const ACTIVE_WF_KEY = `sage:${MODULE}:activeWorkflow`;
const QUEUE_KEY = `sage:${MODULE}:queue`; // pending accepts awaiting a live Sage
const LOG_CAP = 200;

const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const RosterSageConnect = forwardRef(function RosterSageConnect(
  { open = false, onOpenChange, onClose, userEmail, userName },
  ref
) {
  const [code, setCode] = useState(null);
  const [connState, setConnState] = useState("idle"); // idle | waiting | connected | offline
  const [workflows, setWorkflows] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [loadingWf, setLoadingWf] = useState(false);
  const [ddOpen, setDdOpen] = useState(false);
  const ddRef = useRef(null);
  const [minting, setMinting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Delete-workflow confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Activity logs (one shown at a time)
  const [logs, setLogs] = useState([]);
  const [logIdx, setLogIdx] = useState(0);
  const followRef = useRef(true);

  const [queueLen, setQueueLen] = useState(() => readJSON(QUEUE_KEY, []).length);

  const pollRef = useRef(null);
  const actRef = useRef(null);

  // Refs mirror state so the imperative fireReplay() (called from RosterHistory)
  // always sees the latest values, not a stale render closure.
  const codeRef = useRef(null);
  const connStateRef = useRef("idle");
  const activeIdRef = useRef("");
  useEffect(() => void (codeRef.current = code), [code]);
  useEffect(() => void (connStateRef.current = connState), [connState]);
  useEffect(() => void (activeIdRef.current = activeId), [activeId]);

  const setPanel = (next) => {
    if (typeof onOpenChange === "function") onOpenChange(next);
    else if (!next && typeof onClose === "function") onClose();
  };
  const togglePanel = () => setPanel(!open);

  const logLocal = (message, level = "info") =>
    setLogs((prev) => [...prev, { level, message, ts: Date.now() }].slice(-LOG_CAP));

  // Authenticated headers — Firebase ID token + legacy identity headers.
  const headers = async () => {
    const h = { "Content-Type": "application/json" };
    if (userEmail) h["x-user-email"] = userEmail;
    if (userName || userEmail) h["x-user-name"] = userName || userEmail;
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) h["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[sage-roster] getIdToken failed:", err?.message);
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
    // Restore the active workflow choice.
    const savedWf = readJSON(ACTIVE_WF_KEY, "");
    if (savedWf) setActiveId(savedWf);
    // Re-attach to a still-live paired session from a previous open / page load.
    let stored = null;
    try {
      stored = localStorage.getItem(CODE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (stored) {
      setCode(stored);
      setConnState("waiting");
      startPolling(stored);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (actRef.current) clearInterval(actRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the active-workflow choice whenever it changes.
  useEffect(() => {
    writeJSON(ACTIVE_WF_KEY, activeId || "");
  }, [activeId]);

  // ── Pairing / presence ────────────────────────────────────────────────────
  const pollStatus = async (activeCode) => {
    try {
      const res = await fetch(
        `${API_BASE}/session/${encodeURIComponent(activeCode)}/status`,
        { headers: await headers() }
      );
      if (res.status === 404 || res.status === 410) {
        setConnState("offline");
        setCode(null);
        try {
          localStorage.removeItem(CODE_STORAGE_KEY);
        } catch {
          /* ignore */
        }
        if (pollRef.current) clearInterval(pollRef.current);
        if (actRef.current) clearInterval(actRef.current);
        return;
      }
      const data = await res.json();
      setConnState(data?.connected ? "connected" : "waiting");
    } catch {
      /* transient — next tick retries */
    }
  };

  const pollActivity = async (activeCode) => {
    try {
      const res = await fetch(
        `${API_BASE}/session/${encodeURIComponent(activeCode)}/activity`,
        { headers: await headers() }
      );
      if (!res.ok) return;
      const data = await res.json();
      const incoming = Array.isArray(data?.activity) ? data.activity : [];
      if (incoming.length) setLogs((prev) => [...prev, ...incoming].slice(-LOG_CAP));
    } catch {
      /* transient — next tick retries */
    }
  };

  const startPolling = (activeCode) => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (actRef.current) clearInterval(actRef.current);
    pollStatus(activeCode);
    pollActivity(activeCode);
    pollRef.current = setInterval(() => pollStatus(activeCode), 3000);
    actRef.current = setInterval(() => pollActivity(activeCode), 3000);
  };

  // Keep the visible log pinned to the newest entry while following.
  useEffect(() => {
    if (followRef.current) setLogIdx(Math.max(0, logs.length - 1));
  }, [logs.length]);

  // ── Trigger a replay for one accepted shift ───────────────────────────────
  // Fetches the active workflow body and fires mode:"replay" with the shift data.
  const runReplay = async (activeCode, shiftData, label) => {
    const wfRes = await fetch(
      `${API_BASE}/workflows/${encodeURIComponent(activeIdRef.current)}?module=${MODULE}`,
      { headers: await headers() }
    );
    const wfData = await wfRes.json();
    if (!wfRes.ok) throw new Error(wfData?.detail || "Failed to load workflow");
    const workflow = wfData?.data?.workflow || null;

    const res = await fetch(
      `${API_BASE}/session/${encodeURIComponent(activeCode)}/trigger`,
      {
        method: "POST",
        headers: await headers(),
        body: JSON.stringify({
          mode: "replay",
          module: MODULE,
          workflow,
          data: shiftData || {},
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || "Replay failed");
  };

  // ── Offline queue (persisted; flushed on (re)connect) ─────────────────────
  const enqueue = (item) => {
    const q = readJSON(QUEUE_KEY, []);
    q.push({ ...item, queuedAt: Date.now() });
    writeJSON(QUEUE_KEY, q);
    setQueueLen(q.length);
  };

  const flushQueue = async () => {
    if (!codeRef.current || connStateRef.current !== "connected") return;
    if (!activeIdRef.current) return; // still no active workflow → keep waiting
    let q = readJSON(QUEUE_KEY, []);
    if (!q.length) return;
    logLocal(`Sage connected — sending ${q.length} queued shift(s)…`);
    const remaining = [];
    for (const item of q) {
      try {
        await runReplay(codeRef.current, item.shiftData, item.label);
        logLocal(`Auto-filled queued shift: ${item.label}`);
      } catch (err) {
        remaining.push(item); // keep it for the next flush
        logLocal(`Queued shift failed (${item.label}): ${err.message}`, "error");
      }
    }
    writeJSON(QUEUE_KEY, remaining);
    setQueueLen(remaining.length);
  };

  // Flush whenever we transition INTO connected (reconnect, panel reopen, etc.)
  // or once an active workflow is chosen while already connected.
  const prevConnRef = useRef(connState);
  useEffect(() => {
    const becameConnected =
      connState === "connected" && prevConnRef.current !== "connected";
    prevConnRef.current = connState;
    if (connState === "connected" && (becameConnected || activeId)) {
      flushQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connState, activeId]);

  // ── Imperative API for RosterHistory ──────────────────────────────────────
  // fireReplay is called at the "shift turned green" moment. If Sage is ready it
  // triggers immediately; otherwise the request is queued and fired on connect.
  useImperativeHandle(
    ref,
    () => ({
      get connected() {
        return connStateRef.current === "connected";
      },
      fireReplay: async (shiftData, label) => {
        const tag = label || "shift";
        if (
          !codeRef.current ||
          connStateRef.current !== "connected" ||
          !activeIdRef.current
        ) {
          enqueue({ shiftData, label: tag });
          logLocal(
            `Queued auto-fill for ${tag} — ${
              !activeIdRef.current
                ? "no active workflow selected"
                : "Sage not connected"
            }.`,
            "warn"
          );
          return { queued: true };
        }
        try {
          await runReplay(codeRef.current, shiftData, tag);
          logLocal(`Auto-filling shift: ${tag}`);
          return { queued: false };
        } catch (err) {
          enqueue({ shiftData, label: tag }); // don't lose it on a transient error
          logLocal(`Auto-fill failed (${tag}) — queued to retry: ${err.message}`, "error");
          return { queued: true, error: err.message };
        }
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Close the workflow dropdown when clicking outside it.
  useEffect(() => {
    if (!ddOpen) return undefined;
    const onDown = (e) => {
      if (ddRef.current && !ddRef.current.contains(e.target)) setDdOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [ddOpen]);

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
      try {
        localStorage.setItem(CODE_STORAGE_KEY, data.code);
      } catch {
        /* ignore */
      }
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
    try {
      localStorage.removeItem(CODE_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (pollRef.current) clearInterval(pollRef.current);
    if (actRef.current) clearInterval(actRef.current);
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

  // ── Delete workflow ───────────────────────────────────────────────────────
  const askDelete = (wf) => {
    if (!wf) return;
    setDeleteError("");
    setDeleteTarget(wf);
  };
  const closeDelete = () => {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(
        `${API_BASE}/workflows/${encodeURIComponent(deleteTarget.id)}?module=${MODULE}`,
        { method: "DELETE", headers: await headers() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to delete workflow");
      if (activeId === deleteTarget.id) setActiveId("");
      setDeleteTarget(null);
      setInfo("Workflow deleted.");
      fetchWorkflows();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete workflow");
    } finally {
      setDeleting(false);
    }
  };

  // ── Logs navigation ───────────────────────────────────────────────────────
  const total = logs.length;
  const current = total ? logs[Math.min(logIdx, total - 1)] : null;

  const dotColor =
    connState === "connected"
      ? "#16c79a"
      : connState === "waiting"
      ? "#f59e0b"
      : "#9aa0b4";
  const statusText =
    connState === "connected"
      ? "Sage connected"
      : connState === "waiting"
      ? "Waiting for Sage to pair…"
      : connState === "offline"
      ? "Code expired"
      : "Not connected";

  const wfLabel = (w) => (w && (w.workflow?.name || w.name)) || "Workflow";
  const activeWf = workflows.find((w) => w.id === activeId) || null;

  const logLevelColor = (lvl) =>
    lvl === "error" ? "#f87171" : lvl === "warn" ? "#fbbf24" : "#7dd3fc";
  const fmtTime = (ts) => {
    if (!ts) return "";
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return "";
    }
  };

  return (
    <>
      <div
        className={`sage-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Connect to Sage"
      >
        <button
          type="button"
          className="sage-handle"
          data-variant="ring"
          onClick={togglePanel}
          aria-label={open ? "Close Sage panel" : "Open Sage panel"}
          title={open ? "Close Sage panel" : "Open Sage panel"}
        >
          {open ? <FiChevronRight size={20} /> : <FiChevronLeft size={20} />}
        </button>

        <div className="sage-panel">
          {/* Header */}
          <div className="sage-header">
            <div className="sage-header-icon">
              <HiOutlineSparkles size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sage-title">Connect to Sage</div>
              <div className="sage-subtitle">
                Pick an active workflow — Sage auto-fills the portal whenever a
                shift is accepted.
              </div>
            </div>
            <button
              type="button"
              className="sage-close"
              onClick={() => setPanel(false)}
              aria-label="Close"
            >
              <FiX size={18} />
            </button>
          </div>

          <div className="sage-body">
            {/* Connection */}
            <div className="sage-section">
              <div className="sage-section-title">
                <FiLink size={14} /> Connection
              </div>
              {!code ? (
                <button
                  type="button"
                  className="sage-btn-primary"
                  onClick={handleConnect}
                  disabled={minting}
                >
                  <FiLink size={15} /> {minting ? "Connecting…" : "Connect to Sage"}
                </button>
              ) : (
                <>
                  <div className="sage-code-row">
                    <code className="sage-code">{code}</code>
                    <button
                      type="button"
                      className="sage-btn-ghost"
                      onClick={copyCode}
                      title="Copy"
                      aria-label="Copy pairing code"
                    >
                      <FiCopy size={15} />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="sage-btn-danger"
                    onClick={handleDisconnect}
                  >
                    <FiSlash size={14} /> Disconnect
                  </button>
                </>
              )}
              <div className="sage-status-pill">
                <span
                  className={`sage-dot${connState === "connected" ? " is-live" : ""}`}
                  style={{ background: dotColor }}
                />
                {statusText}
              </div>
            </div>

            {/* Active workflow (event-driven — no Run button) */}
            <div className="sage-section">
              <div className="sage-section-title-row">
                <div className="sage-section-title">
                  <FiStar size={14} /> Active workflow
                </div>
                <button
                  type="button"
                  className="sage-icon-btn"
                  onClick={fetchWorkflows}
                  disabled={loadingWf}
                  title="Refresh workflows"
                  aria-label="Refresh workflows"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>

              <div className="sage-dd" ref={ddRef}>
                <button
                  type="button"
                  className="sage-dd-trigger"
                  onClick={() => setDdOpen((o) => !o)}
                  disabled={loadingWf || workflows.length === 0}
                  aria-haspopup="listbox"
                  aria-expanded={ddOpen}
                >
                  <span
                    className={`sage-dd-trigger-text${
                      activeWf ? "" : " is-placeholder"
                    }`}
                  >
                    {loadingWf
                      ? "Loading workflows…"
                      : activeWf
                      ? wfLabel(activeWf)
                      : workflows.length
                      ? "Select the workflow to auto-run…"
                      : "No saved workflows yet"}
                  </span>
                  <FiChevronDown
                    size={16}
                    className={`sage-dd-chevron${ddOpen ? " is-open" : ""}`}
                  />
                </button>

                {ddOpen && workflows.length > 0 && (
                  <div className="sage-dd-menu" role="listbox">
                    {workflows.map((w) => {
                      const sel = w.id === activeId;
                      const creator =
                        w.createdByName || w.createdByEmail || "Unknown";
                      const date = w.createdAt
                        ? new Date(w.createdAt).toLocaleDateString()
                        : "";
                      return (
                        <div
                          key={w.id}
                          role="option"
                          aria-selected={sel}
                          className={`sage-dd-item${sel ? " is-selected" : ""}`}
                          onClick={() => {
                            setActiveId(w.id);
                            setDdOpen(false);
                          }}
                        >
                          <div className="sage-wf-info">
                            <span className="sage-wf-name">{wfLabel(w)}</span>
                            <span className="sage-wf-meta">
                              <span className="sage-wf-by">by {creator}</span>
                              {date ? ` · ${date}` : ""}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="sage-wf-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              askDelete(w);
                            }}
                            title="Delete this workflow"
                            aria-label={`Delete workflow ${wfLabel(w)}`}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="sage-hint">
                {activeWf
                  ? "Active — every accepted shift auto-runs this workflow."
                  : "Select a workflow to arm auto-fill. Until then, accepted shifts are queued."}
              </div>
              {queueLen > 0 && (
                <div className="sage-status-pill" style={{ marginTop: 8 }}>
                  <span className="sage-dot" style={{ background: "#f59e0b" }} />
                  {queueLen} shift{queueLen > 1 ? "s" : ""} queued — will run when
                  Sage is ready
                </div>
              )}
            </div>

            {/* Logs — one at a time */}
            <div className="sage-section">
              <div className="sage-section-title-row">
                <div className="sage-section-title">
                  <FiTerminal size={14} /> Sage logs
                </div>
                {total > 0 && (
                  <div className="sage-log-counter">
                    {Math.min(logIdx + 1, total)} / {total}
                  </div>
                )}
              </div>

              <div className="sage-log-card">
                {current ? (
                  <>
                    <div className="sage-log-top">
                      <span
                        className="sage-log-dot"
                        style={{ background: logLevelColor(current.level) }}
                      />
                      <span className="sage-log-level">
                        {(current.level || "info").toUpperCase()}
                      </span>
                      <span className="sage-log-time">{fmtTime(current.ts)}</span>
                    </div>
                    <div className="sage-log-msg">{current.message}</div>
                  </>
                ) : (
                  <div className="sage-log-empty">
                    {code
                      ? "No activity yet — accepted shifts will appear here."
                      : "Connect to Sage to stream activity logs."}
                  </div>
                )}
              </div>
            </div>

            {error && <div className="sage-alert sage-alert-error">⚠ {error}</div>}
            {info && <div className="sage-alert sage-alert-info">✓ {info}</div>}
          </div>
        </div>
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="sage-cd-overlay" role="presentation" onClick={closeDelete}>
          <div
            className="sage-cd-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label="Delete workflow"
          >
            <div className="sage-cd-icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 6h18"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </div>

            <h3 className="sage-cd-title">Delete workflow?</h3>
            <p className="sage-cd-desc">
              {`Are you sure you want to delete `}
              <strong className="sage-cd-strong">{wfLabel(deleteTarget)}</strong>
              {`? This action cannot be undone.`}
            </p>

            {deleteError && (
              <div className="sage-cd-error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="sage-cd-actions">
              <button
                type="button"
                className="sage-cd-btn sage-cd-btn-secondary"
                onClick={closeDelete}
                disabled={deleting}
              >
                No
              </button>
              <button
                type="button"
                className="sage-cd-btn sage-cd-btn-danger"
                onClick={confirmDelete}
                disabled={deleting}
                autoFocus
              >
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default RosterSageConnect;
