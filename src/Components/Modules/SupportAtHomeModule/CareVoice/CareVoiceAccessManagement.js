import React, { useEffect, useRef, useState } from "react";
import "../../../../Styles/general-styles/CareVoiceAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
import { HiOutlineChevronDown, HiOutlineShieldCheck, HiOutlineUser } from "react-icons/hi";
import { RiAdminLine } from "react-icons/ri";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import ConfirmDialog from "../../../general-components/ConfirmDialog";

// Care Voice supports two roles. Staff can use the product but cannot
// manage access — only admins reach this surface (the API enforces it).
const ROLE_OPTIONS = [
  {
    label: "Admin",
    value: "admin",
    description: "Full access — manage templates & users",
    Icon: RiAdminLine,
  },
  {
    label: "Staff",
    value: "staff",
    description: "Can record & generate documents",
    Icon: HiOutlineUser,
  },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_BASE =
  process.env.REACT_APP_CV_ACCESS_BASE_URL ||
  `${ROOT_API_BASE}/api/care-voice/access`;

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
const RoleSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = ROLE_OPTIONS.find((o) => o.value === value) || ROLE_OPTIONS[1];
  const CurrentIcon = current.Icon;

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className={`cva-role-select ${open ? "cva-role-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="cva-role-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`cva-role-icon-wrap cva-role-icon-${value}`}>
          <CurrentIcon size={14} />
        </span>
        <span className="cva-role-label">{current.label}</span>
        <HiOutlineChevronDown
          className={`cva-role-chevron ${open ? "cva-role-chevron-open" : ""}`}
          size={15}
        />
      </button>

      {open && (
        <div className="cva-role-menu" role="listbox">
          {ROLE_OPTIONS.map(({ value: v, label, description, Icon }) => (
            <button
              type="button"
              key={v}
              className={`cva-role-item ${value === v ? "cva-role-item-active" : ""}`}
              role="option"
              aria-selected={value === v}
              onClick={() => {
                onChange(v);
                setOpen(false);
              }}
            >
              <span className={`cva-role-item-icon cva-role-icon-${v}`}>
                <Icon size={15} />
              </span>
              <span className="cva-role-item-text">
                <span className="cva-role-item-label">{label}</span>
                <span className="cva-role-item-desc">{description}</span>
              </span>
              {value === v && (
                <span className="cva-role-item-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────
const CareVoiceAccessManagement = ({ onClose, userEmail, onDeleted }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [pendingOrgDelete, setPendingOrgDelete] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);
  // `onDeleted` is read from props lazily inside the confirm handler so
  // existing callers that only pass onClose keep working.

  // The orgs router for care-voice lives at /api/care-voice/organizations
  // while this component's API_BASE points at /api/care-voice/access.
  const ORGS_BASE = API_BASE.endsWith("/access")
    ? API_BASE.slice(0, -"/access".length) + "/organizations"
    : `${ROOT_API_BASE}/api/care-voice/organizations`;

  // Builds headers for an authenticated backend call. Attaches the live
  // Firebase ID token as a Bearer header so the verifyFirebaseToken
  // middleware can confirm identity and overwrite x-user-email /
  // x-firebase-uid with verified values.
  const requestHeaders = async () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      } catch (err) {
        console.warn("[cv-access] getIdToken failed:", err?.message);
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
      setUsers(Array.isArray(data?.data) ? data.data : []);
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

  const handleInvite = async () => {
    setError("");
    setSuccess("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName) { setError("Name is required"); return; }
    if (!EMAIL_REGEX.test(trimmedEmail)) { setError("A valid email is required"); return; }
    if (!ROLE_OPTIONS.some((r) => r.value === role)) { setError("Select a valid role"); return; }

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
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to invite user");
      setSuccess("Invite created successfully");
      setName(""); setEmail(""); setRole("staff");
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
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
        headers: await requestHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to remove user");
      setSuccess(isActive ? `Removed access for ${user.email}` : `Invite revoked for ${user.email}`);
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

  const selfEntry = userEmail
    ? { id: `self:${userEmail.toLowerCase()}`, name: "You", email: userEmail, role: "admin", status: "active" }
    : null;

  const displayedUsers = (() => {
    const list = Array.isArray(users) ? [...users] : [];
    if (selfEntry && !list.some(isSelf)) list.unshift(selfEntry);
    return list;
  })();

  // Stats
  const activeCount = displayedUsers.filter((u) => u.status === "active").length;
  const pendingCount = displayedUsers.filter((u) => u.status === "invited" || u.status === "pending").length;

  return (
    <div className="cv-access-overlay" role="presentation" onClick={onClose}>
      <div
        className="cv-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-access-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div className="cv-access-modal-header">
          <div className="cv-access-header-icon">
            <HiOutlineShieldCheck size={22} />
          </div>
          <div className="cv-access-header-text">
            <div id="cv-access-title" className="cv-access-title">
              Access Management
            </div>
            <div className="cv-access-subtitle">
              Invite teammates and manage who can access Care Voice for this organization.
            </div>
          </div>
          <button type="button" className="cv-access-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="cv-access-scroll">


          {/* ── INVITE SECTION ── */}
          <div className="cv-access-invite-card">
            <div className="cv-access-invite-card-header">
              <FiUserPlus size={15} />
              <span>Invite a new member</span>
            </div>

            <div className="cv-access-invite-grid">
              {/* Name */}
              <div className="cv-access-field">
                <label className="cv-access-label">
                  Full Name <sup className="cv-access-required">*</sup>
                </label>
                <input
                  className="cv-access-input"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="cv-access-field">
                <label className="cv-access-label">
                  Email Address <sup className="cv-access-required">*</sup>
                </label>
                <input
                  className="cv-access-input"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Role */}
              <div className="cv-access-field">
                <label className="cv-access-label">
                  Role <sup className="cv-access-required">*</sup>
                </label>
                <RoleSelect value={role} onChange={setRole} />
              </div>

              {/* Invite Button */}
              <div className="cv-access-field cv-access-invite-action-field">
                <label className="cv-access-label cv-access-label-invisible">Action</label>
                <button
                  type="button"
                  className="cv-access-invite-btn"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <><span className="cv-access-spinner" /> Inviting…</>
                  ) : (
                    <><FiUserPlus size={15} /> Invite User</>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="cv-access-error"><span>⚠</span> {error}</div>}
            {success && <div className="cv-access-success"><span>✓</span> {success}</div>}
          </div>

          {/* ── TEAM MEMBERS TABLE ── */}
          <div className="cv-access-list-section">
            <div className="cv-access-list-header">
              <div className="cv-access-list-title-row">
                <FiUsers size={15} />
                <span>Team Members</span>
                {!loading && displayedUsers.length > 0 && (
                  <span className="cv-access-count">{displayedUsers.length}</span>
                )}
                {/* ── STAT PILLS ── */}
                <div className="cv-access-stats-row">
                  <div className="cv-access-stat-pill cv-access-stat-green">
                    <span className="cv-access-stat-dot cv-access-stat-dot-green" />
                    <span><strong>{activeCount}</strong> active</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="cv-access-stat-pill cv-access-stat-amber">
                      <span className="cv-access-stat-dot cv-access-stat-dot-amber" />
                      <span><strong>{pendingCount}</strong> pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="cv-access-state">
                <span className="cv-access-spinner cv-access-spinner-lg" />
                <span>Loading members…</span>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="cv-access-state cv-access-state-empty">
                <FiUsers size={28} style={{ color: "#c5c0e0", marginBottom: 8 }} />
                <div className="cv-access-state-title">No members yet</div>
                <div className="cv-access-state-sub">Invite your first team member above.</div>
              </div>
            ) : (
              <div className="cv-access-table-wrapper">
                <div className="cv-access-table">
                  <div className="cv-access-table-header">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="cv-access-table-row">
                      {/* Avatar + Name + Email */}
                      <div className="cv-access-user-cell">
                        <div
                          className="cv-access-avatar"
                          style={{ background: avatarGradient(u.email) }}
                          aria-hidden="true"
                        >
                          {initialsOf(u.email, u.name)}
                        </div>
                        <div className="cv-access-user-info">
                          <div className="cv-access-user-name-row">
                            <span className="cv-access-name-cell">{u.name}</span>
                            {isSelf(u) && <span className="cv-access-you-badge">You</span>}
                          </div>
                          <div className="cv-access-email">{u.email}</div>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        <span className={`cv-access-badge cv-access-role-${(u.role || "").toLowerCase()}`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span className={`cv-access-badge cv-access-status-${(u.status || "").toLowerCase()}`}>
                          {u.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="cv-access-actions-cell">
                        {(u.status === "invited" || u.status === "active") && !isSelf(u) && u.role !== "owner" ? (
                          <button
                            type="button"
                            className="cv-access-revoke-btn"
                            onClick={() => handleRemove(u)}
                            disabled={revokingId === u.id}
                            aria-label={u.status === "active" ? `Remove access for ${u.email}` : `Revoke invite for ${u.email}`}
                          >
                            {revokingId === u.id
                              ? u.status === "active" ? "Removing…" : "Revoking…"
                              : u.status === "active" ? "Remove" : "Revoke"}
                          </button>
                        ) : (
                          <span
                            className="cv-access-actions-empty"
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
                <div className="cv-access-danger-zone">
                  <div className="cv-access-danger-zone-text">
                    <div className="cv-access-danger-zone-title">
                      Delete this organization
                    </div>
                    <div className="cv-access-danger-zone-subtitle">
                      Permanently removes every member's access to Care
                      Voice for this organization. Your subscription and
                      access to other modules are not affected — cancel
                      your subscription in Stripe separately if needed.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cv-access-danger-zone-btn"
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
            // Hand off to the parent: it should close the modal AND refetch
            // org state so the UI swaps to NoOrgEmptyState without a reload.
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

export default CareVoiceAccessManagement;
