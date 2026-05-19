import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import axios from "axios";
import "../../Styles/general-styles/DetailedUsage.css";
import { API_BASE } from "../../config/apiBase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiZap, FiDollarSign, FiMessageCircle, FiFileText, FiActivity } from "react-icons/fi";
import { HiOutlineChevronDown, HiOutlineUserGroup, HiOutlineUser } from "react-icons/hi";
import CustomRangeSelect from "./DetailedUsageCustomSelect";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

// Module tab list. Keys MUST match the backend MODULE_REGISTRY in
// modules/_shared/access/module-registry.js — those are the same strings
// that incrementCareVoiceAnalysisCount uses on the write path. Order here
// is just the tab order shown in the UI.
const MODULE_TABS = [
  { key: "financial-health", label: "Financial Health" },
  { key: "client-profitability", label: "Clients Profitability" },
  { key: "payroll-analysis", label: "Payroll Analysis" },
  { key: "smart-rostering", label: "Smart Rostering" },
  // Note: key is "carevoice" (no hyphen) — matches what VoiceModule.js
  // passes to incrementCareVoiceAnalysisCount and what daily-usage docs
  // are bucketed under.
  { key: "carevoice", label: "Care Voice" },
  { key: "staff-onboarding", label: "Smart Onboarding (Staff)" },
  { key: "client-event-reporting", label: "Participant Events & Incident" },
  { key: "incident-auditing", label: "Incident Auditing" },
  { key: "quality-and-risk", label: "Quality and Risk Reporting" },
  { key: "SIRS", label: "SIRS Analysis" },
  { key: "incident-report", label: "Incident Report" },
  { key: "incident-management", label: "Custom Incident Management" },
];

// Care Voice is the only tab that surfaces a "documents generated" stat.
const showsDocsStat = (moduleKey) => moduleKey === "carevoice";

const formatNumber = (n) =>
  Number.isFinite(Number(n)) ? Number(n).toLocaleString() : "0";

const formatCost = (n) => `$${Number(n || 0).toFixed(2)}`;

const initialsOf = (email = "", name = "") => {
  const source = (name || email).trim();
  if (!source) return "?";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
};

// Deterministic gradient picker so the same email always lands on the same
// avatar color. Pure presentation — no semantic meaning.
const AVATAR_PALETTE = [
  ["#a78bfa", "#6c4cdc"],
  ["#60a5fa", "#2563eb"],
  ["#34d399", "#0d9488"],
  ["#f59e0b", "#d97706"],
  ["#f472b6", "#db2777"],
  ["#fb923c", "#ea580c"],
  ["#22d3ee", "#0891b2"],
  ["#a3e635", "#65a30d"],
];
const avatarGradient = (key = "") => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash << 5) - hash + key.charCodeAt(i);
  const [a, b] = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

// Custom view-mode dropdown — the native <select> in the prior version
// inherited the OS-styled control which clashed with the rest of the page.
// Mirrors the API of CustomRangeSelect: { value, onChange, options }.
const ViewModeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const options = [
    { value: "organization", label: "Organization", Icon: HiOutlineUserGroup },
    { value: "user", label: "User-based", Icon: HiOutlineUser },
  ];
  const current = options.find((o) => o.value === value) || options[0];
  const CurrentIcon = current.Icon;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={`du2-vm ${open ? "du2-vm-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="du2-vm-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CurrentIcon className="du2-vm-icon" size={16} />
        <span className="du2-vm-label">{current.label}</span>
        <HiOutlineChevronDown
          className={`du2-vm-chevron ${open ? "du2-vm-chevron-open" : ""}`}
          size={16}
        />
      </button>
      {open && (
        <div className="du2-vm-menu" role="listbox">
          {options.map(({ value: v, label, Icon }) => (
            <button
              type="button"
              key={v}
              className={`du2-vm-item ${value === v ? "du2-vm-item-active" : ""}`}
              role="option"
              aria-selected={value === v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Subtle horizontal-scroll wrapper with fading edges so the tabs row hints
// at overflow without showing a scrollbar. Edges fade out as you scroll
// toward them.
const ScrollableTabs = ({ children }) => {
  const ref = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const recompute = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    recompute();
    const el = ref.current;
    if (!el) return;
    el.addEventListener("scroll", recompute, { passive: true });
    window.addEventListener("resize", recompute);
    return () => {
      el.removeEventListener("scroll", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  return (
    <div
      className={`du2-tabs-wrap ${edges.left ? "du2-tabs-fade-left" : ""} ${
        edges.right ? "du2-tabs-fade-right" : ""
      }`}
    >
      <div className="du2-tabs" ref={ref}>
        {children}
      </div>
    </div>
  );
};

const DetailedUsage = ({ user, onBack }) => {
  // const userEmail = user?.email || "";
  const userEmail = "admin@contemporarycoordination.com"
  const userEmailLower = userEmail.toLowerCase();

  const [activeModule, setActiveModule] = useState(MODULE_TABS[0]);
  const [range, setRange] = useState("month");
  const [viewMode, setViewMode] = useState("organization");

  const [organizationId, setOrganizationId] = useState(null);
  const [orgLookupStatus, setOrgLookupStatus] = useState("loading");
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resolve which org the signed-in user belongs to in the active module's
  // user_access. The backend /me endpoint hides the per-module routing.
  useEffect(() => {
    let cancelled = false;
    const fetchOrg = async () => {
      if (!userEmail) return;
      setOrgLookupStatus("loading");
      setError("");
      try {
        const res = await axios.get(`${API_BASE}/api/usage/v2/me`, {
          params: { email: userEmail, module: activeModule.key },
        });
        if (cancelled) return;
        if (res.data?.organizationId) {
          setOrganizationId(res.data.organizationId);
          setOrgLookupStatus("found");
        } else {
          setOrganizationId(null);
          setOrgLookupStatus("not_found");
        }
      } catch (err) {
        if (cancelled) return;
        console.error("[DetailedUsage] /me failed", err);
        setOrgLookupStatus("not_found");
      }
    };
    fetchOrg();
    return () => {
      cancelled = true;
    };
  }, [userEmail, activeModule.key]);

  useEffect(() => {
    let cancelled = false;
    const fetchUsage = async () => {
      if (!organizationId) return;
      setLoading(true);
      setError("");
      try {
        const [summaryRes, timelineRes] = await Promise.all([
          axios.get(
            `${API_BASE}/api/usage/v2/org/${encodeURIComponent(
              organizationId
            )}/summary`,
            { params: { module: activeModule.key, range } }
          ),
          axios.get(
            `${API_BASE}/api/usage/v2/org/${encodeURIComponent(
              organizationId
            )}/timeline`,
            { params: { module: activeModule.key, range } }
          ),
        ]);
        if (cancelled) return;
        setSummary(summaryRes.data);
        setTimeline(timelineRes.data);
      } catch (err) {
        if (cancelled) return;
        console.error("[DetailedUsage] usage fetch failed", err);
        setError("Failed to load usage data");
        setSummary(null);
        setTimeline(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchUsage();
    return () => {
      cancelled = true;
    };
  }, [organizationId, activeModule.key, range]);

  const sortedUsers = useMemo(() => {
    const list = Array.isArray(summary?.byUser) ? [...summary.byUser] : [];
    list.sort((a, b) => {
      const aIsSelf = (a.userEmail || "").toLowerCase() === userEmailLower;
      const bIsSelf = (b.userEmail || "").toLowerCase() === userEmailLower;
      if (aIsSelf && !bIsSelf) return -1;
      if (bIsSelf && !aIsSelf) return 1;
      return (b.tokens || 0) - (a.tokens || 0);
    });
    return list;
  }, [summary, userEmailLower]);

  const chartData = useMemo(() => {
    const points = timeline?.points || [];
    return {
      labels: points.map((p) => p.period),
      datasets: [
        {
          label: "Tokens",
          data: points.map((p) => p.tokens || 0),
          borderColor: "#6c4cdc",
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "rgba(108, 76, 220, 0.12)";
            const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, "rgba(108, 76, 220, 0.32)");
            grad.addColorStop(1, "rgba(108, 76, 220, 0.02)");
            return grad;
          },
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: "#6c4cdc",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 3,
          borderWidth: 2.5,
        },
        {
          label: "Ask AI",
          data: points.map((p) => p.askAi || 0),
          borderColor: "#16c79a",
          backgroundColor: "rgba(22, 199, 154, 0.06)",
          tension: 0.4,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        ...(showsDocsStat(activeModule.key)
          ? [
              {
                label: "Documents",
                data: points.map((p) => p.docs || 0),
                borderColor: "#f59e0b",
                backgroundColor: "rgba(245, 158, 11, 0.06)",
                tension: 0.4,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 5,
                borderWidth: 2,
              },
            ]
          : []),
      ],
    };
  }, [timeline, activeModule.key]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
          align: "end",
          labels: {
            usePointStyle: true,
            pointStyle: "circle",
            boxWidth: 8,
            color: "#4f5273",
            padding: 14,
            font: { size: 12, weight: "500" },
          },
        },
        tooltip: {
          backgroundColor: "rgba(31, 31, 64, 0.95)",
          titleColor: "#fff",
          bodyColor: "#e5e7eb",
          borderColor: "rgba(108, 76, 220, 0.5)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: true,
          boxPadding: 6,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#9ca3af", font: { size: 11 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(0,0,0,0.05)", borderDash: [4, 4] },
          ticks: { color: "#9ca3af", font: { size: 11 } },
        },
      },
    }),
    []
  );

  const totals = summary?.totals || {
    tokens: 0,
    aiCost: 0,
    askAi: 0,
    docs: 0,
    actions: 0,
    userCount: 0,
  };

  const renderEmptyState = () => {
    if (orgLookupStatus === "loading") {
      return (
        <div className="du2-state du2-state-loading">
          <div className="du2-spinner" />
          <span>Loading usage…</span>
        </div>
      );
    }
    if (orgLookupStatus === "not_found") {
      return (
        <div className="du2-state du2-state-empty">
          <div className="du2-state-emoji">🔒</div>
          <div className="du2-state-title">No access yet</div>
          <div className="du2-state-body">
            You're not a member of any <strong>{activeModule.label}</strong>{" "}
            organization yet. Open the module and register or get invited first.
          </div>
        </div>
      );
    }
    if (loading) {
      return (
        <div className="du2-state du2-state-loading">
          <div className="du2-spinner" />
          <span>Loading usage…</span>
        </div>
      );
    }
    if (error) {
      return <div className="du2-state du2-state-error">{error}</div>;
    }
    return null;
  };

  return (
    <div className="du2-container">
      <button type="button" className="du2-back" onClick={onBack}>
        <IoArrowBackOutline size={16} />
        Back
      </button>

      <div className="du2-hero">
        <div className="du2-hero-text">
          <div className="du2-hero-eyebrow">Plan Usage</div>
          <div className="du2-hero-title">Detailed AI Utilisation</div>
          {summary && orgLookupStatus === "found" && (
            <div className="du2-hero-meta">
              <span className="du2-hero-pill">
                <HiOutlineUserGroup size={14} />
                {totals.userCount} member{totals.userCount === 1 ? "" : "s"}
              </span>
              <span className="du2-hero-divider" />
              {/* <span className="du2-hero-org">
                org <span>{summary.organizationId.slice(0, 8)}…</span>
              </span> */}
            </div>
          )}
        </div>
        <div className="du2-hero-controls">
          <ViewModeSelect value={viewMode} onChange={setViewMode} />
          <CustomRangeSelect value={range} onChange={setRange} />
        </div>
      </div>

      <ScrollableTabs>
        {MODULE_TABS.map((mod) => (
          <button
            key={mod.key}
            type="button"
            className={`du2-tab ${activeModule.key === mod.key ? "du2-tab-active" : ""}`}
            onClick={() => setActiveModule(mod)}
          >
            {mod.label}
          </button>
        ))}
      </ScrollableTabs>

      {renderEmptyState()}

      {!loading && !error && summary && orgLookupStatus === "found" && (
        <>
          <div className="du2-stat-row">
            <StatCard
              tone="purple"
              icon={<FiZap />}
              label="Tokens used"
              value={formatNumber(totals.tokens)}
            />
            {/* <StatCard
              tone="indigo"
              icon={<FiDollarSign />}
              label="AI cost"
              value={formatCost(totals.aiCost)}
            /> */}
            <StatCard
              tone="green"
              icon={<FiMessageCircle />}
              label="Ask AI questions"
              value={formatNumber(totals.askAi)}
            />
            {showsDocsStat(activeModule.key) && (
              <StatCard
                tone="amber"
                icon={<FiFileText />}
                label="Documents generated"
                value={formatNumber(totals.docs)}
              />
            )}
            <StatCard
              tone="slate"
              icon={<FiActivity />}
              label="Total actions"
              value={formatNumber(totals.actions)}
            />
          </div>

          <div className="du2-chart-card">
            <div className="du2-chart-header">
              <div>
                <div className="du2-chart-title">Activity over time</div>
                <div className="du2-chart-sub">
                  {summary.start} → {summary.end}
                </div>
              </div>
            </div>
            {(timeline?.points || []).length === 0 ? (
              <div className="du2-state du2-state-empty">
                <div className="du2-state-emoji">📊</div>
                <div className="du2-state-body">No activity in this range.</div>
              </div>
            ) : (
              <div className="du2-chart-canvas">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>

          {viewMode === "user" && (
            <div className="du2-table-card">
              <div className="du2-table-title">
                <span>Per-user usage</span>
                <span className="du2-pill">{sortedUsers.length}</span>
              </div>
              {sortedUsers.length === 0 ? (
                <div className="du2-state du2-state-empty">
                  <div className="du2-state-emoji">👥</div>
                  <div className="du2-state-body">
                    No members in this organization yet.
                  </div>
                </div>
              ) : (
                <UserTable
                  users={sortedUsers}
                  selfEmailLower={userEmailLower}
                  showsDocs={showsDocsStat(activeModule.key)}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard = ({ tone, icon, label, value }) => (
  <div className={`du2-stat-card du2-stat-${tone}`}>
    <div className="du2-stat-icon">{icon}</div>
    <div className="du2-stat-meta">
      <div className="du2-stat-label">{label}</div>
      <div className="du2-stat-value">{value}</div>
    </div>
  </div>
);

const UserTable = ({ users, selfEmailLower, showsDocs }) => (
  <div className={`du2-table ${showsDocs ? "du2-table-cv" : ""}`}>
    <div className="du2-thead">
      <div>User</div>
      <div>Role</div>
      <div className="du2-num">Tokens</div>
      {/* <div className="du2-num">AI cost</div> */}
      <div className="du2-num">Ask AI</div>
      {showsDocs && <div className="du2-num">Docs</div>}
      <div className="du2-num">Actions</div>
    </div>

    {users.map((u) => {
      const isSelf = (u.userEmail || "").toLowerCase() === selfEmailLower;
      return (
        <div
          key={u.userEmail}
          className={`du2-trow ${isSelf ? "du2-trow-self" : ""}`}
        >
          <div className="du2-user-cell">
            <div
              className="du2-avatar"
              style={{ background: avatarGradient(u.userEmail) }}
              aria-hidden="true"
            >
              {initialsOf(u.userEmail, u.name)}
            </div>
            <div className="du2-user-text">
              <div className="du2-user-name-row">
                <span className="du2-user-name">{u.name || u.userEmail.split("@")[0]}</span>
                {isSelf && <span className="du2-self-badge">You</span>}
              </div>
              <div className="du2-user-email">{u.userEmail}</div>
            </div>
          </div>

          <div className="du2-role">
            <span className={`du2-role-chip du2-role-${(u.role || "").toLowerCase() || "unknown"}`}>
              {u.role || "—"}
            </span>
          </div>

          <div className="du2-num">
            <span className="du2-mobile-label">Tokens</span>
            {formatNumber(u.tokens)}
          </div>
          {/* <div className="du2-num">
            <span className="du2-mobile-label">AI cost</span>
            {formatCost(u.aiCost)}
          </div> */}
          <div className="du2-num">
            <span className="du2-mobile-label">Ask AI</span>
            {formatNumber(u.askAi)}
          </div>
          {showsDocs && (
            <div className="du2-num">
              <span className="du2-mobile-label">Docs</span>
              {formatNumber(u.docs)}
            </div>
          )}
          <div className="du2-num">
            <span className="du2-mobile-label">Actions</span>
            {formatNumber(u.actions)}
          </div>
        </div>
      );
    })}
  </div>
);

export default DetailedUsage;
