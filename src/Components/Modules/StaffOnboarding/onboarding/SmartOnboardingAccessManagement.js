import React, { useEffect, useState } from "react";
import "../../../../Styles/general-styles/SmartOnboardingAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { RiAdminLine } from "react-icons/ri";
import { FiUserPlus, FiUsers } from "react-icons/fi";
import ConfirmDialog from "../../../general-components/ConfirmDialog";

// Only "admin" is supported on this surface. The previous "staff" role was
// never enforced server-side, so the dropdown was replaced with a static
// label to make the available role obvious without offering a fake choice.
const INVITE_ROLE = "admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Smart Onboarding has its own access-management namespace on the
// middleware so it can evolve independently of VoiceModule's
// /api/v2d/users/* routes. Override with REACT_APP_SO_ACCESS_BASE_URL.
const API_BASE =
  process.env.REACT_APP_SO_ACCESS_BASE_URL ||
  `${ROOT_API_BASE}/api/staff-onboarding/access`;

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

const SmartOnboardingAccessManagement = ({ onClose, userEmail, organizationId }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Holds the user whose removal needs confirmation. null = no dialog open.
  // Replaces window.confirm so we get the same styled yes/no popup used
  // across the platform.
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const requestHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
    if (organizationId) headers["x-organization-id"] = String(organizationId);
    return headers;
  };

  const fetchUsers = async () => {
    if (!userEmail) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: "GET",
        headers: requestHeaders(),
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
  }, [userEmail, organizationId]);

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
        headers: requestHeaders(),
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

  const confirmRemove = async () => {
    const user = pendingRemoval;
    if (!user?.id) return;
    const isActive = user.status === "active";

    setError(""); setSuccess(""); setRevokingId(user.id);
    try {
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(user.id)}`,
        { method: "DELETE", headers: requestHeaders() }
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
    <div className="so-access-overlay" role="presentation" onClick={onClose}>
      <div
        className="so-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="so-access-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── MODAL HEADER ── */}
        <div className="so-access-modal-header">
          <div className="so-access-header-icon">
            <HiOutlineShieldCheck size={22} />
          </div>
          <div className="so-access-header-text">
            <div id="so-access-title" className="so-access-title">
              Access Management
            </div>
            <div className="so-access-subtitle">
              Invite teammates and manage who can access Smart Onboarding for this organization.
            </div>
          </div>
          <button
            type="button"
            className="so-access-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="so-access-scroll">
          {/* ── INVITE SECTION ── */}
          <div className="so-access-invite-card">
            <div className="so-access-invite-card-header">
              <FiUserPlus size={15} />
              <span>Invite a new member</span>
            </div>

            <div className="so-access-invite-grid">
              {/* Name */}
              <div className="so-access-field">
                <label className="so-access-label">
                  Full Name <sup className="so-access-required">*</sup>
                </label>
                <input
                  className="so-access-input"
                  type="text"
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Email */}
              <div className="so-access-field">
                <label className="so-access-label">
                  Email Address <sup className="so-access-required">*</sup>
                </label>
                <input
                  className="so-access-input"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Role (static — only Admin is supported on this surface) */}
              <div className="so-access-field">
                <label className="so-access-label">Role</label>
                <div className="so-access-role-static" aria-label="Role: Admin">
                  <span className="so-access-role-static-icon">
                    <RiAdminLine size={14} />
                  </span>
                  <span className="so-access-role-static-text">Admin</span>
                  <span className="so-access-role-static-hint">Only role available</span>
                </div>
              </div>

              {/* Invite Button */}
              <div className="so-access-field so-access-invite-action-field">
                <label className="so-access-label so-access-label-invisible">Action</label>
                <button
                  type="button"
                  className="so-access-invite-btn"
                  onClick={handleInvite}
                  disabled={inviting}
                >
                  {inviting ? (
                    <><span className="so-access-spinner" /> Inviting…</>
                  ) : (
                    <><FiUserPlus size={15} /> Invite User</>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="so-access-error"><span>⚠</span> {error}</div>}
            {success && <div className="so-access-success"><span>✓</span> {success}</div>}
          </div>

          {/* ── TEAM MEMBERS TABLE ── */}
          <div className="so-access-list-section">
            <div className="so-access-list-header">
              <div className="so-access-list-title-row">
                <FiUsers size={15} />
                <span>Team Members</span>
                {!loading && displayedUsers.length > 0 && (
                  <span className="so-access-count">{displayedUsers.length}</span>
                )}
                <div className="so-access-stats-row">
                  <div className="so-access-stat-pill so-access-stat-green">
                    <span className="so-access-stat-dot so-access-stat-dot-green" />
                    <span><strong>{activeCount}</strong> active</span>
                  </div>
                  {pendingCount > 0 && (
                    <div className="so-access-stat-pill so-access-stat-amber">
                      <span className="so-access-stat-dot so-access-stat-dot-amber" />
                      <span><strong>{pendingCount}</strong> pending</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="so-access-state">
                <span className="so-access-spinner so-access-spinner-lg" />
                <span>Loading members…</span>
              </div>
            ) : displayedUsers.length === 0 ? (
              <div className="so-access-state">
                <FiUsers size={28} className="so-access-state-icon" />
                <div className="so-access-state-title">No members yet</div>
                <div className="so-access-state-sub">Invite your first team member above.</div>
              </div>
            ) : (
              <div className="so-access-table-wrapper">
                <div className="so-access-table">
                  <div className="so-access-table-header">
                    <div>Member</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>

                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="so-access-table-row">
                      {/* Avatar + Name + Email */}
                      <div className="so-access-user-cell">
                        <div
                          className="so-access-avatar"
                          style={{ background: avatarGradient(u.email) }}
                          aria-hidden="true"
                        >
                          {initialsOf(u.email, u.name)}
                        </div>
                        <div className="so-access-user-info">
                          <div className="so-access-user-name-row">
                            <span className="so-access-name-cell">{u.name}</span>
                            {isSelf(u) && <span className="so-access-you-badge">You</span>}
                          </div>
                          <div className="so-access-email">{u.email}</div>
                        </div>
                      </div>

                      {/* Role badge */}
                      <div>
                        <span className={`so-access-badge so-access-role-${(u.role || "").toLowerCase()}`}>
                          {u.role}
                        </span>
                      </div>

                      {/* Status badge */}
                      <div>
                        <span className={`so-access-badge so-access-status-${(u.status || "").toLowerCase()}`}>
                          {u.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="so-access-actions-cell">
                        {(u.status === "invited" || u.status === "active") && !isSelf(u) ? (
                          <button
                            type="button"
                            className="so-access-revoke-btn"
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
                            className="so-access-actions-empty"
                            title={isSelf(u) ? "You cannot remove your own access" : undefined}
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
          </div>
        </div>
      </div>

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

export default SmartOnboardingAccessManagement;
