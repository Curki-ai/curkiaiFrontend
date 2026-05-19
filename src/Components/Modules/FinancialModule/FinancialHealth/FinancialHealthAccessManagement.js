import React, { useEffect, useRef, useState } from "react";
import "../../../../Styles/general-styles/FinancialHealthAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
import { HiOutlineChevronDown, HiOutlineShieldCheck, HiOutlineUser } from "react-icons/hi";
import { RiAdminLine } from "react-icons/ri";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import ConfirmDialog from "../../../general-components/ConfirmDialog";

// Financial Health historically supported two roles. The three apex modules
// (Financial Health, Client Profitability, Payroll Analysis aka TLC Custom
// Reporting) only need admins, so they pass `allowStaffRole={false}` and the
// dropdown collapses into a static Admin badge. The incident/quality/SIRS
// modules keep both options.
const ADMIN_ROLE_OPTION = {
  label: "Admin",
  value: "admin",
  description: "Full access — manage users & all data",
  Icon: RiAdminLine,
};

const STAFF_ROLE_OPTION = {
  label: "Staff",
  value: "staff",
  description: "Can view dashboards & reports",
  Icon: HiOutlineUser,
};

const ALL_ROLE_OPTIONS = [ADMIN_ROLE_OPTION, STAFF_ROLE_OPTION];

// Canonical state list. Mirrored on the backend in
// modules/financial-health/access/access.service.js (ALLOWED_STATES) — keep
// the two in sync. "All States" is encoded as an empty array on the wire,
// matching the backend's "empty = unrestricted" semantics.
const STATE_OPTIONS = [
  "New South Wales",
  "Victoria",
  "Queensland",
  "South Australia",
  "Western Australia",
  "Tasmania",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_API_BASE =
  process.env.REACT_APP_FH_ACCESS_BASE_URL ||
  `${ROOT_API_BASE}/api/financial-health/access`;

// ─── Helpers ───────────────────────────────────────────────────────────────
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

// ─── Custom Role Select ─────────────────────────────────────────────────────
const RoleSelect = ({ value, onChange, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
    <div className={`fha-role-select ${open ? "fha-role-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="fha-role-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`fha-role-icon-wrap fha-role-icon-${value}`}>
          <CurrentIcon size={14} />
        </span>
        <span className="fha-role-label">{current.label}</span>
        <HiOutlineChevronDown
          className={`fha-role-chevron ${open ? "fha-role-chevron-open" : ""}`}
          size={15}
        />
      </button>

      {open && (
        <div className="fha-role-menu" role="listbox">
          {options.map(({ value: v, label, description, Icon }) => (
            <button
              type="button"
              key={v}
              className={`fha-role-item ${value === v ? "fha-role-item-active" : ""}`}
              role="option"
              aria-selected={value === v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              <span className={`fha-role-item-icon fha-role-icon-${v}`}>
                <Icon size={15} />
              </span>
              <span className="fha-role-item-text">
                <span className="fha-role-item-label">{label}</span>
                <span className="fha-role-item-desc">{description}</span>
              </span>
              {value === v && (
                <span className="fha-role-item-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
// `apiBase` and `moduleLabel` let TlcNewClientProfitibility,
// TlcNewCustomReporting, and the NDIS/Compliance/Quality incident surfaces
// reuse this same modal against their own backend (each module has its
// own user_access container, so the API surface differs by base path
// while the UI shape stays identical).
const FinancialHealthAccessManagement = ({
  onClose,
  userEmail,
  apiBase = DEFAULT_API_BASE,
  moduleLabel = "Financial Health",
  subtitle,
  // When false, Staff is hidden from the invite UI and admin is the only
  // role that can be assigned. The three apex modules pass false; the
  // incident/quality/SIRS surfaces keep the default and still expose both.
  allowStaffRole = true,
  // Called right after a successful org delete. Parents pass a callback
  // that closes the modal AND triggers their own org-state re-fetch
  // (useModuleOrgLookup.refresh / fetchOrganization / etc) so the user
  // bounces to NoOrgEmptyState without needing to refresh the page.
  // Falls back to onClose when not provided.
  onDeleted,
}) => {
  const API_BASE = apiBase;
  const roleOptions = allowStaffRole ? ALL_ROLE_OPTIONS : [ADMIN_ROLE_OPTION];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(allowStaffRole ? "staff" : "admin");
  // Empty array = "All States". When the user picks a specific state we
  // implicitly drop the all-states selection.
  const [selectedStates, setSelectedStates] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState(null);
  // Org-delete state. Visible only when the logged-in user resolves as the
  // org's owner via the loaded `users` list.
  const [pendingOrgDelete, setPendingOrgDelete] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  // The orgs router lives at /api/<module>/organizations while this
  // component's apiBase points at /api/<module>/access. Derive one from
  // the other so callers don't need to pass a second URL.
  const ORGS_BASE = API_BASE.endsWith("/access")
    ? API_BASE.slice(0, -"/access".length) + "/organizations"
    : `${API_BASE}/../organizations`;

  // Builds headers for an authenticated backend call. Pulls the live
  // Firebase ID token via `auth.currentUser.getIdToken()` (auto-refreshes
  // if the cached token is close to expiry) and attaches it as a Bearer
  // token. The backend's verifyFirebaseToken middleware checks this and
  // overrides x-user-email / x-firebase-uid with the verified values.
  const requestHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[fh-access] getIdToken failed:", err?.message);
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
  }, [userEmail]);

  const toggleState = (stateName) => {
    setSelectedStates((prev) =>
      prev.includes(stateName)
        ? prev.filter((s) => s !== stateName)
        : [...prev, stateName]
    );
  };

  const handleInvite = async () => {
    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) { setError("Name is required"); return; }
    if (!EMAIL_REGEX.test(trimmedEmail)) { setError("A valid email is required"); return; }
    if (!roleOptions.some((r) => r.value === role)) { setError("Select a valid role"); return; }

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
          role,
          states: selectedStates,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to invite user");

      setSuccess("Invite created successfully");

      setName(""); setEmail(""); setRole(allowStaffRole ? "staff" : "admin"); setSelectedStates([]);
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = (user) => {
    if (!user?.id) return;
    setPendingRemoval(user);
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

  const confirmDeleteOrg = async () => {
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
      // Hand off to the parent: it should both close the modal AND refetch
      // org state so the UI swaps to NoOrgEmptyState without a hard reload.
      setTimeout(() => {
        if (typeof onDeleted === "function") onDeleted();
        else if (typeof onClose === "function") onClose();
      }, 800);
    } catch (err) {
      setError(err.message || "Failed to delete organization");
    } finally {
      setDeletingOrg(false);
      setPendingOrgDelete(false);
    }
  };

  const isSelf = (user) =>
    !!userEmail &&
    !!user?.email &&
    user.email.trim().toLowerCase() === userEmail.trim().toLowerCase();

  // The signed-in admin is always a member of the org they're managing —
  // surface them in the table even before the API list is populated.
  const selfEntry = userEmail
    ? {
        id: `self:${userEmail.toLowerCase()}`,
        name: "You",
        email: userEmail,
        role: "admin",
        status: "active",
        states: [],
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

  const renderStatesCell = (statesArr) => {
    const arr = Array.isArray(statesArr) ? statesArr : [];
    if (arr.length === 0) {
      return (
        <div className="fh-access-states-cell">
          <span className="fh-access-state-pill fh-access-state-pill-all">
            All states
          </span>
        </div>
      );
    }
    return (
      <div className="fh-access-states-cell">
        {arr.map((s) => (
          <span key={s} className="fh-access-state-pill">
            {s}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="fh-access-overlay" role="presentation" onClick={onClose}>
      <div
        className="fh-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fh-access-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div className="fh-access-modal-header">
          <div className="fh-access-header-icon">
            <HiOutlineShieldCheck size={22} />
          </div>
          <div className="fh-access-header-text">
            <div id="fh-access-title" className="fh-access-title">
              Access Management
            </div>
            <div className="fh-access-subtitle">
              {subtitle ||
                `Invite teammates and manage who can access ${moduleLabel} for this organization. Use the State field to scope a user to specific Australian states.`}
            </div>
          </div>
          <button
            type="button"
            className="fh-access-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="fh-access-scroll">
          {/* ── INVITE SECTION ── */}
          <div className="fh-access-invite-card">
            <div className="fh-access-invite-card-header">
              <FiUserPlus size={15} />
              <span>Invite a new member</span>
            </div>

            <div className="fh-access-invite-grid">
              {/* Name */}
              <div className="fh-access-field">
                <label className="fh-access-label">
                  Full Name <sup className="fh-access-required">*</sup>
                </label>
                <input
                  className="fh-access-input"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="fh-access-field">
                <label className="fh-access-label">
                  Email Address <sup className="fh-access-required">*</sup>
                </label>
                <input
                  className="fh-access-input"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="fh-access-field">
                <label className="fh-access-label">
                  Role {allowStaffRole && <sup className="fh-access-required">*</sup>}
                </label>
                {allowStaffRole ? (
                  <RoleSelect
                    value={role}
                    onChange={setRole}
                    options={roleOptions}
                  />
                ) : (
                  <div className="fh-access-role-static" aria-label="Role: Admin">
                    <span className="fh-access-role-static-icon">
                      <RiAdminLine size={14} />
                    </span>
                    <span className="fh-access-role-static-text">Admin</span>
                    <span className="fh-access-role-static-hint">Only role available</span>
                  </div>
                )}
              </div>

              {/* Invite Button */}
              <div className="fh-access-field fh-access-invite-action-field">
                <label className="fh-access-label fh-access-label-invisible">Action</label>
                <button
                  type="button"
                  className="fh-access-invite-btn"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <><span className="fh-access-spinner" /> Inviting…</>
                  ) : (
                    <><FiUserPlus size={15} /> Invite User</>
                  )}
                </button>
              </div>

              {/* States — full width, below the 2x2 grid */}
              <div className="fh-access-field fh-access-field-full">
                <label className="fh-access-label">States</label>
                <div className="fh-access-states">
                  <span
                    className={`fh-access-state-chip fh-access-state-chip-all ${
                      selectedStates.length === 0
                        ? "fh-access-state-chip-selected"
                        : ""
                    }`}
                    onClick={() => setSelectedStates([])}
                    role="button"
                    tabIndex={0}
                  >
                    All states
                  </span>
                  {STATE_OPTIONS.map((s) => {
                    const isSelected = selectedStates.includes(s);
                    return (
                      <span
                        key={s}
                        className={`fh-access-state-chip ${
                          isSelected ? "fh-access-state-chip-selected" : ""
                        }`}
                        onClick={() => toggleState(s)}
                        role="button"
                        tabIndex={0}
                      >
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {error && <div className="fh-access-error"><span>⚠</span> {error}</div>}
            {success && <div className="fh-access-success"><span>✓</span> {success}</div>}
          </div>

          {/* ── TEAM MEMBERS TABLE ── */}
          <div className="fh-access-list-section">
            <div className="fh-access-list-header">
              <div className="fh-access-list-title-row">
                <FiUsers size={15} />
                <span>Team Members</span>
                {!loading && displayedUsers.length > 0 && (
                  <span className="fh-access-count">{displayedUsers.length}</span>
                )}
                <div className="fh-access-stats-row">
                  <div className="fh-access-stat-pill fh-access-stat-green">
                    <span className="fh-access-stat-dot fh-access-stat-dot-green" />
                    <span><strong>{activeCount}</strong> active</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="fh-access-stat-pill fh-access-stat-amber">
                      <span className="fh-access-stat-dot fh-access-stat-dot-amber" />
                      <span><strong>{pendingCount}</strong> pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="fh-access-state">
                <span className="fh-access-spinner fh-access-spinner-lg" />
                <span>Loading members…</span>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="fh-access-state">
                <FiUsers size={28} className="fh-access-state-icon" />
                <div className="fh-access-state-title">No members yet</div>
                <div className="fh-access-state-sub">Invite your first team member above.</div>
              </div>
            ) : (
              <div className="fh-access-table-wrapper">
                <div className="fh-access-table">
                  <div className="fh-access-table-header">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>States</div>
                    <div>Actions</div>
                  </div>

                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="fh-access-table-row">
                      {/* Avatar + Name + Email */}
                      <div className="fh-access-user-cell">
                        <div
                          className="fh-access-avatar"
                          style={{ background: avatarGradient(u.email) }}
                          aria-hidden="true"
                        >
                          {initialsOf(u.email, u.name)}
                        </div>
                        <div className="fh-access-user-info">
                          <div className="fh-access-user-name-row">
                            <span className="fh-access-name-cell">{u.name}</span>
                            {isSelf(u) && <span className="fh-access-you-badge">You</span>}
                          </div>
                          <div className="fh-access-email">{u.email}</div>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        <span className={`fh-access-badge fh-access-role-${(u.role || "").toLowerCase()}`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span className={`fh-access-badge fh-access-status-${(u.status || "").toLowerCase()}`}>
                          {u.status}
                        </span>
                      </div>

                      {/* States */}
                      <div>{renderStatesCell(u.states)}</div>

                      {/* Actions */}
                      <div className="fh-access-actions-cell">
                        {(u.status === "invited" || u.status === "active") && !isSelf(u) && u.role !== "owner" ? (
                          <button
                            type="button"
                            className="fh-access-revoke-btn"
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
                            className="fh-access-actions-empty"
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

            {/* ── DANGER ZONE — owner-only ── */}
            {(() => {
              const currentUserRow = (users || []).find(isSelf);
              const isOwnerOfOrg = currentUserRow?.role === "owner";
              if (!isOwnerOfOrg) return null;
              return (
                <div className="fh-access-danger-zone">
                  <div className="fh-access-danger-zone-text">
                    <div className="fh-access-danger-zone-title">
                      Delete this organization
                    </div>
                    <div className="fh-access-danger-zone-subtitle">
                      Permanently removes every member's access to{" "}
                      {moduleLabel} for this organization. Your subscription
                      and access to other modules are not affected — cancel
                      your subscription in Stripe separately if needed.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="fh-access-danger-zone-btn"
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
        onConfirm={confirmDeleteOrg}
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

export default FinancialHealthAccessManagement;
