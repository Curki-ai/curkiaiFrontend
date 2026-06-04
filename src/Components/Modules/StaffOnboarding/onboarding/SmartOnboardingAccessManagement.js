import React, { useEffect, useState } from "react";
import "../../../../Styles/general-styles/SmartOnboardingAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";
import { auth } from "../../../../firebase";
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

const SmartOnboardingAccessManagement = ({ onClose, userEmail, organizationId, onDeleted, onNoOrgDetected }) => {
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
  // Replaces window.confirm so we get the same styled yes/no popup used
  // across the platform.
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [pendingOrgDelete, setPendingOrgDelete] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState(false);

  // Staff-onboarding's organizations router is mounted at /api/organizations
  // (NOT /api/staff-onboarding/organizations) — that's the legacy URL chosen
  // when the module shipped. Use ROOT_API_BASE directly here.
  const ORGS_BASE = `${ROOT_API_BASE}/api/organizations`;

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
        console.warn("[so-access] getIdToken failed:", err?.message);
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
                        {isInviteExpired(u) ? (
                          <button
                            type="button"
                            className="so-access-resend-btn"
                            onClick={() => handleResend(u)}
                            disabled={resendingId === u.id}
                            aria-label={`Resend invitation to ${u.email}`}
                          >
                            {resendingId === u.id ? "Resending…" : "Resend Invitation"}
                          </button>
                        ) : (u.status === "invited" || u.status === "active") && !isSelf(u) && u.role !== "owner" ? (
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
                <div className="so-access-danger-zone">
                  <div className="so-access-danger-zone-text">
                    <div className="so-access-danger-zone-title">
                      Delete this organization
                    </div>
                    <div className="so-access-danger-zone-subtitle">
                      Permanently removes every member's access to Smart
                      Onboarding for this organization. Your subscription
                      and access to other modules are not affected — cancel
                      your subscription in Stripe separately if needed.
                    </div>
                  </div>
                  <button
                    type="button"
                    className="so-access-danger-zone-btn"
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
            // Hand off to the parent. The backend reports `isVirtualSpace`
            // so the parent can route correctly: a virtual-space delete
            // should swap the active workspace back to the Main org, NOT
            // tear down the whole HR view to NoOrgEmptyState.
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

export default SmartOnboardingAccessManagement;
