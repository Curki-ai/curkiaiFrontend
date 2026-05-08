import React, { useEffect, useState } from "react";
import "../../../../Styles/general-styles/CareVoiceAccessManagement.css";

// Care Voice supports two roles. Staff can use the product but cannot
// manage access — only admins reach this surface (the API enforces it).
const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Staff", value: "staff" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Care Voice has its own access-management namespace on the middleware so
// it can evolve independently of the older /api/v2d/users/* routes.
// Override with REACT_APP_CV_ACCESS_BASE_URL.
const PROD_HOST =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
const LOCAL_HOST = "http://localhost:5000";
const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(window.location.hostname);
const API_BASE =
  process.env.REACT_APP_CV_ACCESS_BASE_URL ||
  `${isLocalhost ? LOCAL_HOST : PROD_HOST}/api/care-voice/access`;

const CareVoiceAccessManagement = ({ onClose, userEmail }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requestHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    if (userEmail) headers["x-user-email"] = userEmail;
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
      if (!res.ok) {
        throw new Error(data?.error || "Failed to load users");
      }
      const list = Array.isArray(data?.data) ? data.data : [];
      console.log("[CareVoice/Access] users", list);
      setUsers(list);
    } catch (err) {
      console.error("[CareVoice/Access] fetch users failed", err);
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

    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError("A valid email is required");
      return;
    }
    if (!ROLE_OPTIONS.some((r) => r.value === role)) {
      setError("Select a valid role");
      return;
    }

    setInviting(true);
    try {
      console.log("[CareVoice/Access] invite", {
        name: trimmedName,
        email: trimmedEmail,
        role,
      });
      const res = await fetch(`${API_BASE}/invite`, {
        method: "POST",
        headers: requestHeaders(),
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to invite user");
      }

      setSuccess(
        data?.already_invited
          ? "User already invited to this organization"
          : "Invite created successfully"
      );

      setName("");
      setEmail("");
      setRole("staff");

      await fetchUsers();
    } catch (err) {
      console.error("[CareVoice/Access] invite failed", err);
      setError(err.message || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (user) => {
    if (!user?.id) return;
    const isActive = user.status === "active";
    const confirmMessage = isActive
      ? `Remove access for ${user.email}? They will lose access immediately and need to be re-invited to come back.`
      : `Revoke invite for ${user.email}? They will lose access until re-invited.`;
    if (!window.confirm(confirmMessage)) return;

    setError("");
    setSuccess("");
    setRevokingId(user.id);
    try {
      console.log("[CareVoice/Access] remove", {
        id: user.id,
        email: user.email,
        status: user.status,
      });
      const res = await fetch(
        `${API_BASE}/users/${encodeURIComponent(user.id)}`,
        { method: "DELETE", headers: requestHeaders() }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Failed to remove user");
      }
      setSuccess(
        isActive
          ? `Removed access for ${user.email}`
          : `Invite revoked for ${user.email}`
      );
      await fetchUsers();
    } catch (err) {
      console.error("[CareVoice/Access] remove failed", err);
      setError(err.message || "Failed to remove user");
    } finally {
      setRevokingId("");
    }
  };

  const isSelf = (user) =>
    !!userEmail &&
    !!user?.email &&
    user.email.trim().toLowerCase() === userEmail.trim().toLowerCase();

  const roleClass = (value) =>
    `cv-access-badge cv-access-role-${(value || "").toLowerCase()}`;
  const statusClass = (value) =>
    `cv-access-badge cv-access-status-${(value || "").toLowerCase()}`;

  // The signed-in admin is always a member of the org they're managing —
  // surface them in the table even before the API list is populated, so a
  // fresh org never reads as "no users yet" to its own admin.
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

  return (
    <div className="cv-access-overlay" role="presentation" onClick={onClose}>
      <div
        className="cv-access-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cv-access-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cv-access-scroll">
          <div className="cv-access-header">
            <div>
              <div id="cv-access-title" className="cv-access-title">
                Access Management
              </div>
              <div className="cv-access-subtitle">
                Invite teammates and manage who can access Care Voice for this
                organization.
              </div>
            </div>
            <button
              type="button"
              className="cv-access-close"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="cv-access-section-title">Invite a new member</div>

          <div className="cv-access-row">
            <div className="cv-access-field">
              <label className="cv-access-label">
                Name <sup className="cv-access-required">*</sup>
              </label>
              <input
                className="cv-access-input"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="cv-access-field">
              <label className="cv-access-label">
                Email <sup className="cv-access-required">*</sup>
              </label>
              <input
                className="cv-access-input"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="cv-access-row cv-access-row-invite">
            <div className="cv-access-field">
              <label className="cv-access-label">
                Role <sup className="cv-access-required">*</sup>
              </label>
              <select
                className="cv-access-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="cv-access-invite-cell">
              <button
                type="button"
                className="cv-access-invite-btn"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? "Inviting..." : "Invite User"}
              </button>
            </div>
          </div>

          {error && <div className="cv-access-error">{error}</div>}
          {success && <div className="cv-access-success">{success}</div>}

          <div className="cv-access-list-section">
            <div className="cv-access-section-title cv-access-list-title">
              <span>Team Members</span>
              {!loading && displayedUsers.length > 0 && (
                <span className="cv-access-count">{displayedUsers.length}</span>
              )}
            </div>

            {loading ? (
              <div className="cv-access-state">Loading users...</div>
            ) : displayedUsers.length === 0 ? (
              <div className="cv-access-state">
                No users in this organization yet
              </div>
            ) : (
              <div className="cv-access-table-wrapper">
                <div className="cv-access-table">
                  <div className="cv-access-table-header">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Actions</div>
                  </div>
                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="cv-access-table-row">
                      <div className="cv-access-name-cell">{u.name}</div>
                      <div className="cv-access-email">{u.email}</div>
                      <div>
                        <span className={roleClass(u.role)}>{u.role}</span>
                      </div>
                      <div>
                        <span className={statusClass(u.status)}>{u.status}</span>
                      </div>
                      <div className="cv-access-actions-cell">
                        {(u.status === "invited" || u.status === "active") &&
                        !isSelf(u) ? (
                          <button
                            type="button"
                            className="cv-access-revoke-btn"
                            onClick={() => handleRemove(u)}
                            disabled={revokingId === u.id}
                            aria-label={
                              u.status === "active"
                                ? `Remove access for ${u.email}`
                                : `Revoke invite for ${u.email}`
                            }
                          >
                            {revokingId === u.id
                              ? u.status === "active"
                                ? "Removing..."
                                : "Revoking..."
                              : u.status === "active"
                              ? "Remove"
                              : "Revoke"}
                          </button>
                        ) : (
                          <span
                            className="cv-access-actions-empty"
                            title={
                              isSelf(u)
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareVoiceAccessManagement;
