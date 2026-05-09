import React, { useEffect, useState } from "react";
import "../../../../Styles/general-styles/FinancialHealthAccessManagement.css";
import { API_BASE as ROOT_API_BASE } from "../../../../config/apiBase";

// Financial Health supports two roles. Staff can use the product but cannot
// manage access — only admins reach this surface (the API enforces it).
const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Staff", value: "staff" },
];

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

// `apiBase` and `moduleLabel` let TlcNewClientProfitibility and
// TlcNewCustomReporting reuse this same modal against their own backend
// (`/api/client-profitability/access`, `/api/payroll/access`) — each module
// has its own user_access container, so the API surface differs by base
// path while the UI shape stays identical.
const FinancialHealthAccessManagement = ({
  onClose,
  userEmail,
  apiBase = DEFAULT_API_BASE,
  moduleLabel = "Financial Health",
  subtitle,
}) => {
  const API_BASE = apiBase;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");
  // Empty array = "All States". When the user picks a specific state we
  // implicitly drop the all-states selection.
  const [selectedStates, setSelectedStates] = useState([]);
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
      console.log("[FinancialHealth/Access] users", list);
      setUsers(list);
    } catch (err) {
      console.error("[FinancialHealth/Access] fetch users failed", err);
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
      console.log("[FinancialHealth/Access] invite", {
        name: trimmedName,
        email: trimmedEmail,
        role,
        states: selectedStates,
      });
      const res = await fetch(`${API_BASE}/invite`, {
        method: "POST",
        headers: requestHeaders(),
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          role,
          states: selectedStates,
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
      setSelectedStates([]);

      await fetchUsers();
    } catch (err) {
      console.error("[FinancialHealth/Access] invite failed", err);
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
      console.log("[FinancialHealth/Access] remove", {
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
      console.error("[FinancialHealth/Access] remove failed", err);
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
    `fh-access-badge fh-access-role-${(value || "").toLowerCase()}`;
  const statusClass = (value) =>
    `fh-access-badge fh-access-status-${(value || "").toLowerCase()}`;

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
        <div className="fh-access-scroll">
          <div className="fh-access-header">
            <div>
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

          <div className="fh-access-section-title">Invite a new member</div>

          <div className="fh-access-row">
            <div className="fh-access-field">
              <label className="fh-access-label">
                Name <sup className="fh-access-required">*</sup>
              </label>
              <input
                className="fh-access-input"
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="fh-access-field">
              <label className="fh-access-label">
                Email <sup className="fh-access-required">*</sup>
              </label>
              <input
                className="fh-access-input"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="fh-access-row">
            <div className="fh-access-field">
              <label className="fh-access-label">
                Role <sup className="fh-access-required">*</sup>
              </label>
              <select
                className="fh-access-select"
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

            <div className="fh-access-field">
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

          <div className="fh-access-row-invite">
            <div />
            <div />
            <div className="fh-access-invite-cell">
              <button
                type="button"
                className="fh-access-invite-btn"
                onClick={handleInvite}
                disabled={inviting}
              >
                {inviting ? "Inviting..." : "Invite User"}
              </button>
            </div>
          </div>

          {error && <div className="fh-access-error">{error}</div>}
          {success && <div className="fh-access-success">{success}</div>}

          <div className="fh-access-list-section">
            <div className="fh-access-section-title fh-access-list-title">
              <span>Team Members</span>
              {!loading && displayedUsers.length > 0 && (
                <span className="fh-access-count">{displayedUsers.length}</span>
              )}
            </div>

            {loading ? (
              <div className="fh-access-state">Loading users...</div>
            ) : displayedUsers.length === 0 ? (
              <div className="fh-access-state">
                No users in this organization yet
              </div>
            ) : (
              <div className="fh-access-table-wrapper">
                <div className="fh-access-table">
                  <div className="fh-access-table-header">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>States</div>
                    <div>Actions</div>
                  </div>
                  {displayedUsers.map((u) => (
                    <div key={u.id || u.email} className="fh-access-table-row">
                      <div className="fh-access-name-cell">{u.name}</div>
                      <div className="fh-access-email">{u.email}</div>
                      <div>
                        <span className={roleClass(u.role)}>{u.role}</span>
                      </div>
                      <div>
                        <span className={statusClass(u.status)}>{u.status}</span>
                      </div>
                      <div>{renderStatesCell(u.states)}</div>
                      <div className="fh-access-actions-cell">
                        {(u.status === "invited" || u.status === "active") &&
                        !isSelf(u) ? (
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
                              ? u.status === "active"
                                ? "Removing..."
                                : "Revoking..."
                              : u.status === "active"
                              ? "Remove"
                              : "Revoke"}
                          </button>
                        ) : (
                          <span
                            className="fh-access-actions-empty"
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

export default FinancialHealthAccessManagement;
