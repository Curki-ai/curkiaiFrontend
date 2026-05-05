import React, { useEffect, useState } from "react";
import "../../Styles/general-styles/AccessManagementForm.css";
import axios from "axios";

const ROLE_OPTIONS = [
    { label: "Admin", value: "admin" },
    { label: "Staff", value: "staff" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AccessManagementForm = ({ onClose, userEmail }) => {
    const API_BASE = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("staff");
    const [users, setUsers] = useState([]);
    const [resolvedOrgId, setResolvedOrgId] = useState("");
    const [loading, setLoading] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const authHeaders = { "x-user-email": userEmail || "" };

    const fetchUsers = async () => {
        if (!userEmail) return;

        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${API_BASE}/api/v2d/users/`, {
                headers: authHeaders,
            });
            const list = res.data?.data || [];
            console.log("[Access] Fetched users", list);
            setUsers(list);
            const orgId =
                res.data?.organization_id ||
                (list.length > 0 ? list[0].organization_id : "");
            setResolvedOrgId(orgId || "");
        } catch (err) {
            console.error("[Access] fetch users failed", err);
            setError(
                err.response?.data?.error ||
                "Failed to load users for this organization"
            );
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

        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (!EMAIL_REGEX.test(email.trim())) {
            setError("A valid email is required");
            return;
        }
        if (!["admin", "staff"].includes(role)) {
            setError("Role must be admin or staff");
            return;
        }

        try {
            setInviting(true);
            console.log("[Access] Inviting user", { name, email, role });
            const res = await axios.post(
                `${API_BASE}/api/v2d/users/invite`,
                {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    role,
                },
                { headers: authHeaders }
            );

            if (res.data?.already_invited) {
                setSuccess("User already invited to this organization");
            } else {
                setSuccess("Invite created successfully");
            }

            setName("");
            setEmail("");
            setRole("staff");

            await fetchUsers();
        } catch (err) {
            console.error("[Access] invite failed", err);
            setError(err.response?.data?.error || "Failed to invite user");
        } finally {
            setInviting(false);
        }
    };

    const roleClass = (value) =>
        `access-mgmt-badge access-mgmt-role-${(value || "").toLowerCase()}`;
    const statusClass = (value) =>
        `access-mgmt-badge access-mgmt-status-${(value || "").toLowerCase()}`;

    return (
        <div className="access-mgmt-overlay">
            <div className="access-mgmt-modal">
                <div className="access-mgmt-scroll">

                    <div className="access-mgmt-header">
                        <div>
                            <div className="access-mgmt-title">Access Management</div>
                            <div className="access-mgmt-subtitle">
                                Invite teammates and manage who can access this organization.
                            </div>
                        </div>
                        <button className="access-mgmt-close" onClick={onClose}>
                            ×
                        </button>
                    </div>


                    <div className="access-mgmt-section-title">Invite a new member</div>

                    <div className="access-mgmt-row">
                        <div className="access-mgmt-field">
                            <div className="access-mgmt-label-row">
                                <label className="access-mgmt-label">
                                    Name <sup className="access-mgmt-required">*</sup>
                                </label>
                            </div>
                            <input
                                className="access-mgmt-input"
                                type="text"
                                placeholder="Full name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="access-mgmt-field">
                            <div className="access-mgmt-label-row">
                                <label className="access-mgmt-label">
                                    Email <sup className="access-mgmt-required">*</sup>
                                </label>
                            </div>
                            <input
                                className="access-mgmt-input"
                                type="email"
                                placeholder="user@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="access-mgmt-row access-mgmt-row--invite">
                        <div className="access-mgmt-field">
                            <div className="access-mgmt-label-row">
                                <label className="access-mgmt-label">
                                    Role <sup className="access-mgmt-required">*</sup>
                                </label>
                            </div>
                            <select
                                className="access-mgmt-select"
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

                        <div className="access-mgmt-invite-cell">
                            <button
                                className="access-mgmt-invite-btn"
                                onClick={handleInvite}
                                disabled={inviting}
                            >
                                {inviting ? "Inviting..." : "Invite User"}
                            </button>
                        </div>
                    </div>

                    {error && <div className="access-mgmt-error">{error}</div>}
                    {success && <div className="access-mgmt-success">{success}</div>}

                    <div className="access-mgmt-list-section">
                        <div className="access-mgmt-section-title access-mgmt-list-title">
                            <span>Team Members</span>
                            {!loading && users.length > 0 && (
                                <span className="access-mgmt-count">{users.length}</span>
                            )}
                        </div>

                        {loading ? (
                            <div className="access-mgmt-state">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="access-mgmt-state">
                                No users in this organization yet
                            </div>
                        ) : (
                            <div className="access-mgmt-table-wrapper">
                                <div className="access-mgmt-table">
                                    <div className="access-mgmt-table-header">
                                        <div>Name</div>
                                        <div>Email</div>
                                        <div>Role</div>
                                        <div>Status</div>
                                    </div>
                                    {users.map((u) => (
                                        <div key={u.id} className="access-mgmt-table-row">
                                            <div className="access-mgmt-name-cell">{u.name}</div>
                                            <div className="access-mgmt-email">{u.email}</div>
                                            <div>
                                                <span className={roleClass(u.role)}>{u.role}</span>
                                            </div>
                                            <div>
                                                <span className={statusClass(u.status)}>{u.status}</span>
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

export default AccessManagementForm;
