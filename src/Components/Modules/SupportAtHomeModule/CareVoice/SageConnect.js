import React, { useEffect, useRef, useState } from "react";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
import { HiOutlineSparkles } from "react-icons/hi";
import {
  FiCopy,
  FiPlay,
  FiLink,
  FiSlash,
  FiRefreshCw,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiTerminal,
  FiX,
} from "react-icons/fi";
import "../../../../Styles/SupportAtHomeModule/CareVoice/SageConnect.css";
import "../../../../Styles/SupportAtHomeModule/CareVoice/SageHandleExperiments.css";

// Curki Sage — "Connect to Sage (extension)" surface as a right-side drawer.
//
//   • Arrow handle  → a persistent tab on the right edge; clicking it slides the
//                     drawer in/out (toggle).
//   • Connect       → mints a v2d pairing code to paste into Sage.
//   • Disconnect    → revokes the code.
//   • Workflows     → lists the org's saved training workflows, each labelled
//                     with the creator's name; one is selectable for replay.
//   • Replay        → triggers a replay of the selected workflow.
//   • Delete        → removes a saved workflow (Yes/No confirm dialog).
//   • Logs          → friendly activity events from the extension, shown one at
//                     a time with prev/next navigation.
//
// The broker lives in the middleware at /api/care-voice/sage and the deployed
// Sage Chrome extension dials it directly over its SSE tunnel.

const MODULE = "v2d";
const API_BASE =
  process.env.REACT_APP_SAGE_BASE_URL || `${ROOT_API_BASE}/sage`;

// The broker keeps a paired session alive for ~12h, but the dashboard's
// connection state otherwise lives only in this component — reloading the page
// would drop the code and falsely show "Not connected" while the extension is
// still paired. Persist the code so we can re-attach to the live session.
const CODE_STORAGE_KEY = `sage:${MODULE}:code`;
const LOG_CAP = 200; // keep the log buffer bounded

const SageConnect = ({
  open = false,
  onOpenChange,
  onClose,
  userEmail,
  userName,
  replayReady,
  buildReplayData,
}) => {
  const [code, setCode] = useState(null);
  const [connState, setConnState] = useState("idle"); // idle | waiting | connected | offline
  const [workflows, setWorkflows] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadingWf, setLoadingWf] = useState(false);
  const [ddOpen, setDdOpen] = useState(false); // workflow dropdown open/closed
  const ddRef = useRef(null);
  const [minting, setMinting] = useState(false);
  const [replaying, setReplaying] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // Delete-workflow confirmation
  const [deleteTarget, setDeleteTarget] = useState(null); // workflow object
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Activity logs (one shown at a time)
  const [logs, setLogs] = useState([]);
  const [logIdx, setLogIdx] = useState(0);
  const followRef = useRef(true); // auto-advance to newest unless user navigated back

  const pollRef = useRef(null);
  const actRef = useRef(null);

  const setPanel = (next) => {
    if (typeof onOpenChange === "function") onOpenChange(next);
    else if (!next && typeof onClose === "function") onClose();
  };
  const togglePanel = () => setPanel(!open);

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

  // Drain the broker's buffered friendly events and append to the log feed.
  const pollActivity = async (activeCode) => {
    try {
      const res = await fetch(
        `${API_BASE}/session/${encodeURIComponent(activeCode)}/activity`,
        { headers: await headers() }
      );
      if (!res.ok) return;
      const data = await res.json();
      const incoming = Array.isArray(data?.activity) ? data.activity : [];
      if (incoming.length) {
        setLogs((prev) => [...prev, ...incoming].slice(-LOG_CAP));
      }
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

  // Keep the visible log pinned to the newest entry while the user is following.
  useEffect(() => {
    if (followRef.current) setLogIdx(Math.max(0, logs.length - 1));
  }, [logs.length]);

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

  // ── Replay ──────────────────────────────────────────────────────────────
  const handleReplay = async () => {
    setError("");
    setInfo("");
    if (!code) return setError("Connect to Sage first.");
    if (!replayReady)
      return setError(
        "Generate a document first — replay re-enters that run's data."
      );
    if (!selectedId) return setError("Select a workflow to replay.");
    setReplaying(true);
    try {
      const wfRes = await fetch(
        `${API_BASE}/workflows/${encodeURIComponent(selectedId)}`,
        { headers: await headers() }
      );
      const wfData = await wfRes.json();
      if (!wfRes.ok) throw new Error(wfData?.detail || "Failed to load workflow");
      const workflow = wfData?.data?.workflow || null;

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
        `${API_BASE}/workflows/${encodeURIComponent(deleteTarget.id)}`,
        { method: "DELETE", headers: await headers() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || "Failed to delete workflow");
      if (selectedId === deleteTarget.id) setSelectedId("");
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

  const selectedWf = workflows.find((w) => w.id === selectedId) || null;
  const replayDisabled = replaying || !code || !selectedId || !replayReady;
  const replayBlocker = !code
    ? "Connect to Sage first — pair the extension above."
    : !replayReady
    ? "Generate a document first — replay re-enters that run’s data into the live form."
    : !selectedId
    ? "Select a workflow to replay."
    : "";

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
      {/* ── Drawer (slides in/out) + arrow handle ─────────────────────────── */}
      <div
        className={`sage-drawer${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label="Connect to Sage"
      >
        {/* Arrow handle — sticks out of the drawer's left edge, slides with it */}
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
                Pair the Sage extension, then replay a saved workflow into the
                live form.
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
                  className={`sage-dot${
                    connState === "connected" ? " is-live" : ""
                  }`}
                  style={{ background: dotColor }}
                />
                {statusText}
              </div>
            </div>

            {/* Replay */}
            <div className="sage-section">
              <div className="sage-section-title-row">
                <div className="sage-section-title">
                  <FiPlay size={14} /> Replay a workflow
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

              {/* Workflow dropdown — opens a menu of workflows, each with its
                  creator's name and a delete icon. */}
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
                      selectedWf ? "" : " is-placeholder"
                    }`}
                  >
                    {loadingWf
                      ? "Loading workflows…"
                      : selectedWf
                      ? selectedWf.name
                      : workflows.length
                      ? "Select a workflow…"
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
                      const sel = w.id === selectedId;
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
                            setSelectedId(w.id);
                            setDdOpen(false);
                          }}
                        >
                          <div className="sage-wf-info">
                            <span className="sage-wf-name">{w.name}</span>
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
                            aria-label={`Delete workflow ${w.name}`}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="sage-btn-primary"
                onClick={handleReplay}
                disabled={replayDisabled}
              >
                <FiPlay size={15} /> {replaying ? "Triggering…" : "Run Replay"}
              </button>

              {replayBlocker && <div className="sage-hint">{replayBlocker}</div>}
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
                      ? "No activity yet — logs from Sage appear here."
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

      {/* ── Delete confirmation (mirrors the candidate-delete dialog) ──────── */}
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
              <strong className="sage-cd-strong">
                {deleteTarget.name || "this workflow"}
              </strong>
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
};

export default SageConnect;
