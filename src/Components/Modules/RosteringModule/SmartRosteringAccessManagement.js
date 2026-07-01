import React, { useEffect, useState } from "react";
import "../../../Styles/general-styles/SmartRosteringAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../config/apiBase";
import { auth } from "../../../firebase";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { RiAdminLine, RiSettingsLine } from "react-icons/ri";
import { FiUserPlus, FiUsers, FiSliders } from "react-icons/fi";
import ConfirmDialog from "../../general-components/ConfirmDialog";

const SETTINGS_CHAR_MAX = 150;

const DEFAULT_SETTINGS = {
  provider_name: "",
  days: "",
  shortlist_criteria: "",
  overtime_criteria: "",
  // OT mode: "advanced" (AI/LLM, uses overtime_criteria free text) or
  // "standard" (rule-based, uses the structured fields below).
  ot_mode: "advanced",
  ot_fortnight_max: "",
  ot_weekly_max: "",
  ot_shift_day_max: "",
  ot_second_weekend_exempt: false,
  ot_night_enabled: false,
  ot_night_start: "22:00",
  ot_night_end: "06:00",
  ot_night_counts_as: "",
  client_sms_template: "",
  staff_sms_template: "",
  role_elimination_input: "",
  notify_client: false,
  reminder_sms: false,
  require_approval: false,
  visualcare_user: "",
  visualcare_key: "",
  visualcare_secret: "",
};

// Build the ot_config object for "standard" mode from the flat form fields.
// Blank numeric fields are omitted so the engine simply skips that rule.
const assembleOtConfig = (s) => {
  const num = (v) => {
    if (v === "" || v == null) return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? undefined : n;
  };
  const cfg = {};
  const fm = num(s.ot_fortnight_max);
  if (fm !== undefined) cfg.fortnight_max_hours = fm;
  const wm = num(s.ot_weekly_max);
  if (wm !== undefined) cfg.weekly_max_hours = wm;
  const sd = num(s.ot_shift_day_max);
  if (sd !== undefined) cfg.shift_day_max_hours = sd;
  if (s.ot_second_weekend_exempt) cfg.second_weekend_exempt = true;
  if (s.ot_night_enabled) {
    const ca = num(s.ot_night_counts_as);
    cfg.night_shift = {
      start: s.ot_night_start || "22:00",
      end: s.ot_night_end || "06:00",
      counts_as_minutes: ca !== undefined ? ca : 120,
    };
  }
  return cfg;
};

// Only "admin" is supported on this surface. Smart Rostering's backend also
// accepts "staff" but we keep the dropdown collapsed to a static label until
// the role distinction has product meaning here, mirroring Smart Onboarding.
const INVITE_ROLE = "admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Smart Rostering owns its own access-management namespace on the middleware
// (/api/rostering/access/*). Override with REACT_APP_SR_ACCESS_BASE_URL.
const API_BASE =
  process.env.REACT_APP_SR_ACCESS_BASE_URL ||
  `${ROOT_API_BASE}/api/rostering/access`;

const initialsOf = (email = "", name = "") => {
  const source = (name || email).trim();
  if (!source) return "?";
  const parts = source.split(/[\s.@_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
};

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
  for (let i = 0; i < key.length; i++)
    hash = (hash << 5) - hash + key.charCodeAt(i);
  const [a, b] = AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

const SmartRosteringAccessManagement = ({ onClose, onSaved, userEmail, organizationId, onDeleted, onNoOrgDetected }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [resendingId, setResendingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Holds the user whose removal needs confirmation. null = no dialog open.
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [pendingOrgDelete, setPendingOrgDelete] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  // Rostering configuration state (provider name, criteria, SMS templates,
  // workflow flags). Loaded from /api/rosteringSettings/by-org/:orgId on
  // mount and saved via POST /api/rosteringSettings on click.
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");

  // Smart Rostering's organizations router is mounted at /api/rostering/organizations
  // (see modules/rostering/organizations/organizations.routes.js).
  const ORGS_BASE = `${ROOT_API_BASE}/api/rostering/organizations`;

  // Builds headers for an authenticated backend call. Attaches the live
  // Firebase ID token as a Bearer header so the verifyFirebaseToken
  // middleware can confirm identity and overwrite x-user-email /
  // x-firebase-uid with verified values.
  const requestHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
    if (organizationId) headers["x-organization-id"] = String(organizationId);
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[sr-access] getIdToken failed:", err?.message);
      }
    }
    return headers;
  };

  const fetchUsers = async () => {
    if (!userEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "GET",
        headers: await requestHeaders(),
      });
      const data = await res.json();
      // Access middleware reports the user has no user_access row whose
      // firebase_uid matches the signed-in user. Hand off to the parent so it
      // can swap the page to NoOrgEmptyState instead of showing this modal.
      if (
        res.status === 403 &&
        typeof data?.error === "string" &&
        data.error.toLowerCase().includes("no organization linked")
      ) {
        if (typeof onNoOrgDetected === "function") {
          onNoOrgDetected();
          return;
        }
      }
      if (!res.ok) throw new Error(data?.error || "Failed to load users");
      const list = Array.isArray(data?.data) ? data.data : [];
      setUsers(list);
    } catch (err) {
      setError(err.message || "Failed to load users for this organization");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, organizationId]);

  // Load rostering settings (provider name, criteria, SMS templates, flags)
  // from the org doc's rosteringOptions. The GET is unauthenticated — the
  // backend already scopes by organizationId.
  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    setSettingsLoading(true);
    (async () => {
      try {
        const res = await fetch(
          `${ROOT_API_BASE}/api/rosteringSettings/by-org/${encodeURIComponent(organizationId)}?raw=true`
        );
        const data = await res.json();
        if (cancelled) return;
        const doc = Array.isArray(data?.data) ? data.data[0] : null;
        if (!doc) return; // Nothing saved yet — keep DEFAULT_SETTINGS.
        const _sc = doc.shortlisting_criteria || {};
        const _otc = _sc.ot_config || {};
        const _night = _otc.night_shift || {};
        setSettings({
          provider_name: doc.provider_name || "",
          days: doc.rostering?.unallocated_shifts_visible_days
            ? String(doc.rostering.unallocated_shifts_visible_days)
            : "",
          shortlist_criteria: doc.shortlisting_criteria?.profile_matching || "",
          overtime_criteria: doc.shortlisting_criteria?.ot || "",
          ot_mode: _sc.ot_mode || "advanced",
          ot_fortnight_max:
            _otc.fortnight_max_hours != null ? String(_otc.fortnight_max_hours) : "",
          ot_weekly_max:
            _otc.weekly_max_hours != null ? String(_otc.weekly_max_hours) : "",
          ot_shift_day_max:
            _otc.shift_day_max_hours != null ? String(_otc.shift_day_max_hours) : "",
          ot_second_weekend_exempt: !!_otc.second_weekend_exempt,
          ot_night_enabled: !!_otc.night_shift,
          ot_night_start: _night.start || "22:00",
          ot_night_end: _night.end || "06:00",
          ot_night_counts_as:
            _night.counts_as_minutes != null ? String(_night.counts_as_minutes) : "",
          client_sms_template: doc.sms_templates?.client || "",
          staff_sms_template: doc.sms_templates?.staff || "",
          role_elimination_input: Array.isArray(doc.rostering?.role_elimination)
            ? doc.rostering.role_elimination.join(", ")
            : "",
          notify_client: doc.workflow_flags?.notify_client_on_accept ?? false,
          reminder_sms: doc.workflow_flags?.reminder_sms_staff ?? false,
          require_approval:
            doc.workflow_flags?.require_manager_approval ?? false,
          visualcare_user:
            doc.integrations?.softwares?.visualcare?.creds?.user || "",
          visualcare_key:
            doc.integrations?.softwares?.visualcare?.creds?.key || "",
          visualcare_secret:
            doc.integrations?.softwares?.visualcare?.creds?.secret || "",
        });
      } catch (err) {
        if (!cancelled) {
          console.error("[sr-access] settings fetch failed", err);
        }
      } finally {
        if (!cancelled) setSettingsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const updateSettingField = (key, value) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSaveSettings = async () => {
    setSettingsError("");
    setSettingsSuccess("");
    if (!organizationId) {
      setSettingsError("organizationId is missing — can't save");
      return;
    }
    const roleElimination = (settings.role_elimination_input || "")
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    setSettingsSaving(true);
    try {
      const res = await fetch(`${ROOT_API_BASE}/api/rosteringSettings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail,
          organizationId,
          providerName: settings.provider_name,
          days: settings.days ? Number(settings.days) : undefined,
          // Rostering managers live in user_access now — pass empty so the
          // legacy field on rosteringOptions is cleared rather than stale.
          rosteringManagers: [],
          shortlistCriteria: settings.shortlist_criteria,
          overtimeCriteria: settings.overtime_criteria,
          otMode: settings.ot_mode,
          otConfig:
            settings.ot_mode === "standard"
              ? assembleOtConfig(settings)
              : undefined,
          clientSmsTemplate: settings.client_sms_template,
          staffSmsTemplate: settings.staff_sms_template,
          roleElimination,
          workflowFlags: {
            notifyClient: settings.notify_client,
            reminderSms: settings.reminder_sms,
            requireApproval: settings.require_approval,
          },
          visualCareCreds: {
            user: settings.visualcare_user,
            key: settings.visualcare_key,
            secret: settings.visualcare_secret,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save settings");
      setSettingsSuccess("Settings saved");
      // Let the parent (SmartRostering) re-pull settings so the saved creds
      // reflect immediately — hides the Sync toggle, no page reload needed.
      if (typeof onSaved === "function") onSaved();
    } catch (err) {
      setSettingsError(err.message || "Failed to save settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleInvite = async () => {
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { setError("Name is required"); return; }
    if (!EMAIL_REGEX.test(trimmedEmail)) { setError("A valid email is required"); return; }

    // Client-side guard against re-inviting an existing member. The backend
    // is the source of truth (409 on duplicate) — this just avoids a round
    // trip when we can already tell from the loaded list.
    const alreadyExists = users.some(
      (u) => (u.email || "").trim().toLowerCase() === trimmedEmail
    );
    if (alreadyExists) {
      setError("This user is already registered in the organization.");
      return;
    }

    setInviting(true);
    try {
      const res = await fetch(`${API_BASE}/invite`, {
        method: "POST",
        headers: await requestHeaders(),
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role: INVITE_ROLE,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to invite user");

      setSuccess("Invite created successfully");
      setName(""); setEmail("");
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  // Opens the styled ConfirmDialog. The actual DELETE request runs in
  // confirmRemove once the user clicks Yes.
  const handleRemove = (user) => {
    if (!user?.id) return;
    setPendingRemoval(user);
  };

  // Re-send an invitation whose link has lapsed. Hits the access module's
  // /users/:id/resend endpoint, which mints a fresh token + 48h expiry and
  // re-emails the invitee. No confirm dialog — resending is non-destructive.
  const handleResend = async (user) => {
    if (!user?.id) return;
    setError(""); setSuccess(""); setResendingId(user.id);
    try {
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(user.id)}/resend`,
        { method: "POST", headers: await requestHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to resend invitation");
      setSuccess(`Invitation resent to ${user.email}`);
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to resend invitation");
    } finally {
      setResendingId("");
    }
  };

  const confirmRemove = async () => {
    const user = pendingRemoval;
    if (!user?.id) return;
    const isActive = user.status === "active";

    setError(""); setSuccess(""); setRevokingId(user.id);
    try {
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(user.id)}`,
        { method: "DELETE", headers: await requestHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to remove user");
      setSuccess(
        isActive
          ? `Removed access for ${user.email}`
          : `Invite revoked for ${user.email}`
      );
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to remove user");
    } finally {
      setRevokingId("");
      setPendingRemoval(null);
    }
  };

  const isSelf = (user) =>
    !!userEmail &&
    !!user?.email &&
    user.email.trim().toLowerCase() === userEmail.trim().toLowerCase();

  // A pending invite is "expired" once its 48h link has lapsed. The backend
  // stamps inviteExpiresAt on every invited row and returns it in the list
  // payload; an expired invite swaps its Revoke action for "Resend Invitation".
  const isInviteExpired = (user) => {
    if (!user || isSelf(user) || user.role === "owner") return false;
    if (user.status !== "invited" && user.status !== "pending") return false;
    const expiresAt = user.inviteExpiresAt
      ? new Date(user.inviteExpiresAt).getTime()
      : NaN;
    return Number.isFinite(expiresAt) && expiresAt < Date.now();
  };

  // The signed-in admin is always a member of the org they're managing —
  // surface them in the table even before the API list is populated, so
  // a fresh org never reads as "no users yet" to its own admin.
  const selfEntry = userEmail
    ? {
        id: `self:${userEmail.toLowerCase()}`,
        name: "You",
        email: userEmail,
        role: "admin",
        status: "active",
      }
    : null;

  const displayedUsers = (() => {
    const list = Array.isArray(users) ? [...users] : [];
    if (selfEntry && !list.some(isSelf)) list.unshift(selfEntry);
    return list;
  })();

  const activeCount = displayedUsers.filter((u) => u.status === "active").length;
  const pendingCount = displayedUsers.filter(
    (u) => u.status === "invited" || u.status === "pending"
  ).length;

  return (
    <div className="sr-access-overlay" role="presentation" onClick={onClose}>
      <div
        className="sr-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sr-access-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div className="sr-access-modal-header">
          <div className="sr-access-header-icon">
            <HiOutlineShieldCheck size={22} />
          </div>
          <div className="sr-access-header-text">
            <div id="sr-access-title" className="sr-access-title">
              Access Management
            </div>
            <div className="sr-access-subtitle">
              Invite teammates and manage who can access Smart Rostering for this organization.
            </div>
          </div>
          <button
            type="button"
            className="sr-access-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="sr-access-scroll">
          {/* ── INVITE SECTION ── */}
          <div className="sr-access-invite-card">
            <div className="sr-access-invite-card-header">
              <FiUserPlus size={15} />
              <span>Invite a new member</span>
            </div>

            <div className="sr-access-invite-grid">
              {/* Name */}
              <div className="sr-access-field">
                <label className="sr-access-label">
                  Full Name <sup className="sr-access-required">*</sup>
                </label>
                <input
                  className="sr-access-input"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="sr-access-field">
                <label className="sr-access-label">
                  Email Address <sup className="sr-access-required">*</sup>
                </label>
                <input
                  className="sr-access-input"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Role (static — only Admin is surfaced) */}
              <div className="sr-access-field">
                <label className="sr-access-label">Role</label>
                <div className="sr-access-role-static" aria-label="Role: Admin">
                  <span className="sr-access-role-static-icon">
                    <RiAdminLine size={14} />
                  </span>
                  <span className="sr-access-role-static-text">Admin</span>
                  <span className="sr-access-role-static-hint">Only role available</span>
                </div>
              </div>

              {/* Invite Button */}
              <div className="sr-access-field sr-access-invite-action-field">
                <label className="sr-access-label sr-access-label-invisible">Action</label>
                <button
                  type="button"
                  className="sr-access-invite-btn"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <><span className="sr-access-spinner" /> Inviting…</>
                  ) : (
                    <><FiUserPlus size={15} /> Invite User</>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="sr-access-error"><span>⚠</span> {error}</div>}
            {success && <div className="sr-access-success"><span>✓</span> {success}</div>}
          </div>

          {/* ── TEAM MEMBERS TABLE ── */}
          <div className="sr-access-list-section">
            <div className="sr-access-list-header">
              <div className="sr-access-list-title-row">
                <FiUsers size={15} />
                <span>Team Members</span>
                {!loading && displayedUsers.length > 0 && (
                  <span className="sr-access-count">{displayedUsers.length}</span>
                )}
                <div className="sr-access-stats-row">
                  <div className="sr-access-stat-pill sr-access-stat-green">
                    <span className="sr-access-stat-dot sr-access-stat-dot-green" />
                    <span><strong>{activeCount}</strong> active</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="sr-access-stat-pill sr-access-stat-amber">
                      <span className="sr-access-stat-dot sr-access-stat-dot-amber" />
                      <span><strong>{pendingCount}</strong> pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="sr-access-state">
                <span className="sr-access-spinner sr-access-spinner-lg" />
                <span>Loading members…</span>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="sr-access-state">
                <FiUsers size={28} className="sr-access-state-icon" />
                <div className="sr-access-state-title">No members yet</div>
                <div className="sr-access-state-sub">Invite your first team member above.</div>
              </div>
            ) : (
              <div className="sr-access-table-wrapper">
                <div className="sr-access-table">
                  <div className="sr-access-table-header">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="sr-access-table-row">
                      {/* Avatar + Name + Email */}
                      <div className="sr-access-user-cell">
                        <div
                          className="sr-access-avatar"
                          style={{ background: avatarGradient(u.email) }}
                          aria-hidden="true"
                        >
                          {initialsOf(u.email, u.name)}
                        </div>
                        <div className="sr-access-user-info">
                          <div className="sr-access-user-name-row">
                            <span className="sr-access-name-cell">{u.name}</span>
                            {isSelf(u) && <span className="sr-access-you-badge">You</span>}
                          </div>
                          <div className="sr-access-email">{u.email}</div>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        <span className={`sr-access-badge sr-access-role-${(u.role || "").toLowerCase()}`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span className={`sr-access-badge sr-access-status-${(u.status || "").toLowerCase()}`}>
                          {u.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="sr-access-actions-cell">
                        {isInviteExpired(u) ? (
                          <button
                            type="button"
                            className="sr-access-resend-btn"
                            onClick={() => handleResend(u)}
                            disabled={resendingId === u.id}
                            aria-label={`Resend invitation to ${u.email}`}
                          >
                            {resendingId === u.id ? "Resending…" : "Resend Invitation"}
                          </button>
                        ) : (u.status === "invited" || u.status === "active") && !isSelf(u) && u.role !== "owner" ? (
                          <button
                            type="button"
                            className="sr-access-revoke-btn"
                            onClick={() => handleRemove(u)}
                            disabled={revokingId === u.id}
                            aria-label={
                              u.status === "active"
                                ? `Remove access for ${u.email}`
                                : `Revoke invite for ${u.email}`
                            }
                          >
                            {revokingId === u.id
                              ? u.status === "active" ? "Removing…" : "Revoking…"
                              : u.status === "active" ? "Remove" : "Revoke"}
                          </button>
                        ) : (
                          <span
                            className="sr-access-actions-empty"
                            title={
                              u.role === "owner"
                                ? "The organization owner cannot be revoked"
                                : isSelf(u)
                                ? "You cannot remove your own access"
                                : undefined
                            }
                          >
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── ROSTERING CONFIGURATION ── */}
            <div className="sr-access-section">
              <div className="sr-access-section-header">
                <RiSettingsLine size={15} />
                <span>Rostering Configuration</span>
              </div>

              {settingsLoading ? (
                <div className="sr-access-state">
                  <span className="sr-access-spinner sr-access-spinner-lg" />
                  <span>Loading settings…</span>
                </div>
              ) : (
                <div className="sr-access-settings-grid">
                  {/* Provider Name */}
                  <div className="sr-access-field">
                    <label className="sr-access-label">Provider Name</label>
                    <input
                      className="sr-access-input"
                      type="text"
                      placeholder="e.g. All About Care"
                      value={settings.provider_name}
                      onChange={(e) =>
                        updateSettingField("provider_name", e.target.value)
                      }
                    />
                  </div>

                  {/* Show Unallocated Shifts For */}
                  <div className="sr-access-field">
                    <label className="sr-access-label">
                      Show Unallocated Shifts For
                    </label>
                    <select
                      className="sr-access-select"
                      value={settings.days}
                      onChange={(e) => updateSettingField("days", e.target.value)}
                    >
                      <option value="" disabled>
                        Select days
                      </option>
                      {Array.from({ length: 100 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day} Day{day > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                    <div className="sr-access-help">
                      Days from today over which unallocated shifts appear.
                    </div>
                  </div>

                  {/* VisualCare — User */}
                  <div className="sr-access-field">
                    <label className="sr-access-label">User</label>
                    <input
                      className="sr-access-input"
                      type="text"
                      placeholder="VisualCare User ID"
                      value={settings.visualcare_user}
                      onChange={(e) =>
                        updateSettingField("visualcare_user", e.target.value)
                      }
                    />
                  </div>

                  {/* VisualCare — Client ID */}
                  <div className="sr-access-field">
                    <label className="sr-access-label">Client ID</label>
                    <input
                      className="sr-access-input"
                      type="text"
                      placeholder="VisualCare Client ID"
                      value={settings.visualcare_key}
                      onChange={(e) =>
                        updateSettingField("visualcare_key", e.target.value)
                      }
                    />
                  </div>

                  {/* VisualCare — Secret ID */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">Secret ID</label>
                    <input
                      className="sr-access-input"
                      type="text"
                      placeholder="VisualCare Secret ID"
                      value={settings.visualcare_secret}
                      onChange={(e) =>
                        updateSettingField("visualcare_secret", e.target.value)
                      }
                    />
                  </div>

                  {/* Profile Shortlisting Criteria */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">
                      Profile Shortlisting Criteria
                    </label>
                    <textarea
                      className="sr-access-textarea"
                      maxLength={SETTINGS_CHAR_MAX}
                      value={settings.shortlist_criteria}
                      onChange={(e) =>
                        updateSettingField("shortlist_criteria", e.target.value)
                      }
                      placeholder="Describe your profile shortlisting criteria in less than 150 characters"
                    />
                    <span
                      className={`sr-access-char-count${
                        SETTINGS_CHAR_MAX - settings.shortlist_criteria.length < 20
                          ? " sr-access-char-count-danger"
                          : ""
                      }`}
                    >
                      {SETTINGS_CHAR_MAX - settings.shortlist_criteria.length}{" "}
                      characters left
                    </span>
                  </div>

                  {/* Overtime Check Mode */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">Overtime Check Mode</label>
                    <select
                      className="sr-access-select"
                      value={settings.ot_mode}
                      onChange={(e) =>
                        updateSettingField("ot_mode", e.target.value)
                      }
                    >
                      <option value="advanced">
                        Advanced — AI (interprets free-text rules)
                      </option>
                      <option value="standard">
                        Standard — Rule-based (fast, exact)
                      </option>
                    </select>
                    <div className="sr-access-toggle-help">
                      Advanced uses AI to read free-text overtime rules. Standard
                      applies fixed numeric limits instantly.
                    </div>
                  </div>

                  {settings.ot_mode === "advanced" ? (
                    /* Overtime Elimination Criteria (free text, used by Advanced) */
                    <div className="sr-access-field sr-access-field-full">
                      <label className="sr-access-label">
                        Overtime Elimination Criteria
                      </label>
                      <textarea
                        className="sr-access-textarea"
                        maxLength={SETTINGS_CHAR_MAX}
                        value={settings.overtime_criteria}
                        onChange={(e) =>
                          updateSettingField("overtime_criteria", e.target.value)
                        }
                        placeholder="Describe your overtime elimination criteria in less than 150 characters"
                      />
                      <span
                        className={`sr-access-char-count${
                          SETTINGS_CHAR_MAX - settings.overtime_criteria.length < 20
                            ? " sr-access-char-count-danger"
                            : ""
                        }`}
                      >
                        {SETTINGS_CHAR_MAX - settings.overtime_criteria.length}{" "}
                        characters left
                      </span>
                    </div>
                  ) : (
                    /* Structured OT limits (used by Standard) */
                    <>
                      <div className="sr-access-field">
                        <label className="sr-access-label">
                          Max Hours / Fortnight
                        </label>
                        <input
                          className="sr-access-input"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 76"
                          value={settings.ot_fortnight_max}
                          onChange={(e) =>
                            updateSettingField("ot_fortnight_max", e.target.value)
                          }
                        />
                      </div>
                      <div className="sr-access-field">
                        <label className="sr-access-label">Max Hours / Week</label>
                        <input
                          className="sr-access-input"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 38"
                          value={settings.ot_weekly_max}
                          onChange={(e) =>
                            updateSettingField("ot_weekly_max", e.target.value)
                          }
                        />
                      </div>
                      <div className="sr-access-field">
                        <label className="sr-access-label">
                          Max Hours / Shift Day
                        </label>
                        <input
                          className="sr-access-input"
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="e.g. 10"
                          value={settings.ot_shift_day_max}
                          onChange={(e) =>
                            updateSettingField("ot_shift_day_max", e.target.value)
                          }
                        />
                      </div>

                      <div className="sr-access-toggle-row sr-access-field-full">
                        <div className="sr-access-toggle-label">
                          Exempt 2nd Weekend
                          <div className="sr-access-toggle-help">
                            Ignore hours on the second Saturday &amp; Sunday of the
                            fortnight (no OT limit).
                          </div>
                        </div>
                        <label className="sr-access-toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.ot_second_weekend_exempt}
                            onChange={(e) =>
                              updateSettingField(
                                "ot_second_weekend_exempt",
                                e.target.checked
                              )
                            }
                          />
                          <span className="sr-access-toggle-slider" />
                        </label>
                      </div>

                      <div className="sr-access-toggle-row sr-access-field-full">
                        <div className="sr-access-toggle-label">
                          Recount Night Shifts
                          <div className="sr-access-toggle-help">
                            Count any shift starting within the night window as a
                            fixed number of minutes.
                          </div>
                        </div>
                        <label className="sr-access-toggle-switch">
                          <input
                            type="checkbox"
                            checked={settings.ot_night_enabled}
                            onChange={(e) =>
                              updateSettingField(
                                "ot_night_enabled",
                                e.target.checked
                              )
                            }
                          />
                          <span className="sr-access-toggle-slider" />
                        </label>
                      </div>

                      {settings.ot_night_enabled && (
                        <>
                          <div className="sr-access-field">
                            <label className="sr-access-label">Night Start</label>
                            <input
                              className="sr-access-input"
                              type="time"
                              value={settings.ot_night_start}
                              onChange={(e) =>
                                updateSettingField(
                                  "ot_night_start",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="sr-access-field">
                            <label className="sr-access-label">Night End</label>
                            <input
                              className="sr-access-input"
                              type="time"
                              value={settings.ot_night_end}
                              onChange={(e) =>
                                updateSettingField(
                                  "ot_night_end",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="sr-access-field">
                            <label className="sr-access-label">
                              Counts As (minutes)
                            </label>
                            <input
                              className="sr-access-input"
                              type="number"
                              min="0"
                              step="15"
                              placeholder="e.g. 120"
                              value={settings.ot_night_counts_as}
                              onChange={(e) =>
                                updateSettingField(
                                  "ot_night_counts_as",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {/* Client SMS Template */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">Client SMS Template</label>
                    <textarea
                      className="sr-access-textarea"
                      value={settings.client_sms_template}
                      onChange={(e) =>
                        updateSettingField("client_sms_template", e.target.value)
                      }
                      placeholder="Describe client SMS template"
                    />
                  </div>

                  {/* Staff SMS Template */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">Staff SMS Template</label>
                    <textarea
                      className="sr-access-textarea"
                      value={settings.staff_sms_template}
                      onChange={(e) =>
                        updateSettingField("staff_sms_template", e.target.value)
                      }
                      placeholder="Describe staff SMS template"
                    />
                  </div>

                  {/* Exclude Roles From Shortlisting */}
                  <div className="sr-access-field sr-access-field-full">
                    <label className="sr-access-label">
                      Exclude Roles From Shortlisting
                    </label>
                    <input
                      className="sr-access-input"
                      type="text"
                      placeholder="Comma-separated, e.g. Office Staff, Contractor"
                      value={settings.role_elimination_input}
                      onChange={(e) =>
                        updateSettingField(
                          "role_elimination_input",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── WORKFLOW TOGGLES ── */}
            {!settingsLoading && (
              <div className="sr-access-section">
                <div className="sr-access-section-header">
                  <FiSliders size={15} />
                  <span>Workflow Settings</span>
                </div>

                <div className="sr-access-toggle-row">
                  <div className="sr-access-toggle-label">
                    Notify Client On Staff Shift Acceptance
                    <div className="sr-access-toggle-help">
                      Sends a notification to the client when a staff member accepts a shift.
                    </div>
                  </div>
                  <label className="sr-access-toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.notify_client}
                      onChange={(e) =>
                        updateSettingField("notify_client", e.target.checked)
                      }
                    />
                    <span className="sr-access-toggle-slider" />
                  </label>
                </div>

                <div className="sr-access-toggle-row">
                  <div className="sr-access-toggle-label">
                    Reminder SMS to Staff
                    <div className="sr-access-toggle-help">
                      Sends a reminder SMS every 4 hours until the shift is acknowledged.
                    </div>
                  </div>
                  <label className="sr-access-toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.reminder_sms}
                      onChange={(e) =>
                        updateSettingField("reminder_sms", e.target.checked)
                      }
                    />
                    <span className="sr-access-toggle-slider" />
                  </label>
                </div>

                <div className="sr-access-toggle-row">
                  <div className="sr-access-toggle-label">
                    Require Rostering Manager Approval After Staff Accept A Shift
                    <div className="sr-access-toggle-help">
                      The manager must approve the acceptance before the shift is confirmed in chat.
                    </div>
                  </div>
                  <label className="sr-access-toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.require_approval}
                      onChange={(e) =>
                        updateSettingField("require_approval", e.target.checked)
                      }
                    />
                    <span className="sr-access-toggle-slider" />
                  </label>
                </div>

                {settingsError && (
                  <div className="sr-access-error">
                    <span>⚠</span> {settingsError}
                  </div>
                )}
                {settingsSuccess && (
                  <div className="sr-access-success">
                    <span>✓</span> {settingsSuccess}
                  </div>
                )}

                <div className="sr-access-settings-footer">
                  <button
                    type="button"
                    className="sr-access-save-btn"
                    onClick={handleSaveSettings}
                    disabled={settingsSaving}
                  >
                    {settingsSaving ? (
                      <>
                        <span className="sr-access-spinner" /> Saving…
                      </>
                    ) : (
                      "Save Settings"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── DANGER ZONE — owner-only ── */}
            {(() => {
              const currentUserRow = (users || []).find(isSelf);
              const isOwnerOfOrg = currentUserRow?.role === "owner";
              if (!isOwnerOfOrg) return null;
              return (
                <div className="sr-access-danger-zone">
                  <div className="sr-access-danger-zone-text">
                    <div className="sr-access-danger-zone-title">
                      Delete this organization
                    </div>
                    <div className="sr-access-danger-zone-subtitle">
                      Permanently removes every member's access to Smart
                      Rostering for this organization. Your subscription
                      and access to other modules are not affected — cancel
                      your subscription in Stripe separately if needed.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="sr-access-danger-zone-btn"
                    onClick={() => setPendingOrgDelete(true)}
                    disabled={deletingOrg}
                  >
                    {deletingOrg ? "Deleting…" : "Delete Organization"}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingOrgDelete}
        title="Delete this organization?"
        message="Every member's access will be revoked and the organization will be permanently removed. This cannot be undone."
        confirmLabel="Yes, delete"
        cancelLabel="No"
        confirmTone="danger"
        busy={deletingOrg}
        onConfirm={async () => {
          setError(""); setSuccess(""); setDeletingOrg(true);
          try {
            const res = await fetch(ORGS_BASE, {
              method: "DELETE",
              headers: await requestHeaders(),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to delete organization");
            setSuccess(
              `Organization deleted (removed ${data?.deletedAccessRows ?? 0} member${
                data?.deletedAccessRows === 1 ? "" : "s"
              }).`
            );
            setTimeout(() => {
              if (typeof onDeleted === "function") {
                onDeleted({ isVirtualSpace: data?.isVirtualSpace === true });
              } else if (typeof onClose === "function") {
                onClose();
              }
            }, 800);
          } catch (err) {
            setError(err.message || "Failed to delete organization");
          } finally {
            setDeletingOrg(false);
            setPendingOrgDelete(false);
          }
        }}
        onCancel={() => setPendingOrgDelete(false)}
      />

      <ConfirmDialog
        open={pendingRemoval !== null}
        title={
          pendingRemoval?.status === "active"
            ? `Remove access for ${pendingRemoval.email}?`
            : `Revoke invite for ${pendingRemoval?.email || ""}?`
        }
        message={
          pendingRemoval?.status === "active"
            ? "They will lose access immediately and need to be re-invited to come back."
            : "They will lose access until re-invited."
        }
        confirmLabel="Yes"
        cancelLabel="No"
        confirmTone="danger"
        busy={!!revokingId}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
};

export default SmartRosteringAccessManagement;
