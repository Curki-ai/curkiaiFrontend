import React, { useEffect, useState } from "react";
import "../../Styles/general-styles/Settings.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import axios from "axios";
import { auth, googleProvider } from "../../firebase";
import {
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import supportSettingsDown from "../../Images/supportSettingsDownIcon.svg"
import supportSettingsRight from "../../Images/supportSettingsUpIcon.svg"
import supportSettingsUploadIcon from "../../Images/supportSettingsUpload.svg"
import { API_BASE } from "../../config/apiBase";
import SupportModal from "./SupportModal";
import { toast } from "react-toastify";
const SettingsPage = ({ user, onBack }) => {
    const [firstName, setFirstName] = useState(user?.displayName || "Deepak");
    const [lastName, setLastName] = useState(user?.displayName || "uday");
    const [email, setEmail] = useState(user?.email || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingHeaderName, setIsEditingHeaderName] = useState(false);
    const [isEditingInputName, setIsEditingInputName] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmType, setConfirmType] = useState("");
    const [deletePassword, setDeletePassword] = useState("");
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Which sign-in provider this account uses — drives how we re-verify the
    // user before the (sensitive) account deletion.
    const deleteProviderId =
        (user || auth.currentUser)?.providerData?.[0]?.providerId;
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [openStatusId, setOpenStatusId] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusModalTicket, setStatusModalTicket] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, user?.email);
            toast.success("Password reset email sent!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to send reset email.");
        }
    };

    const handleDeleteAccount = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            toast.error("No user found.");
            return;
        }

        const providerId = currentUser.providerData?.[0]?.providerId;

        setDeleteError("");
        setIsDeleting(true);
        try {
            // Re-verify the user right before deleting. Firebase requires a
            // recent login for sensitive ops; reauthenticating here avoids the
            // "requires-recent-login" error without making the user sign out.
            if (providerId === "password") {
                if (!deletePassword) {
                    setDeleteError("Please enter your password to confirm.");
                    setIsDeleting(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(
                    currentUser.email,
                    deletePassword
                );
                await reauthenticateWithCredential(currentUser, credential);
            } else if (providerId === "google.com") {
                await reauthenticateWithPopup(currentUser, googleProvider);
            }
            // Other providers: attempt the delete directly.

            // Remove the DB record if it exists. The endpoint returns 200 even
            // when there's no matching row, so we always proceed to delete the
            // Firebase auth account next.
            await axios.delete(
                `${API_BASE}/api/user/delete?id=${currentUser.uid}`
            );

            await deleteUser(currentUser);

            toast.success("Account deleted successfully.");
            setShowConfirmModal(false);
            setDeletePassword("");
            window.location.href = "/";
        } catch (error) {
            console.error("Delete account failed:", error);
            const code = error?.code;
            if (
                code === "auth/wrong-password" ||
                code === "auth/invalid-credential"
            ) {
                setDeleteError("Incorrect password. Please try again.");
            } else if (
                code === "auth/popup-closed-by-user" ||
                code === "auth/cancelled-popup-request"
            ) {
                setDeleteError("Confirmation was cancelled. Please try again.");
            } else if (code === "auth/too-many-requests") {
                setDeleteError(
                    "Too many attempts. Please wait a few minutes and try again."
                );
            } else {
                setDeleteError("Could not delete your account. Please try again.");
            }
        } finally {
            setIsDeleting(false);
        }
    };
    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            setIsUpdatingStatus(true);

            // ✅ Normalize status (make first letter capital, rest lowercase)
            const formattedStatus =
                newStatus.trim().toLowerCase() === "resolved"
                    ? "Resolved"
                    : newStatus.trim().toLowerCase() === "in progress"
                        ? "In progress"
                        : newStatus; // fallback (optional)

            await axios.put(
                `${API_BASE}/api/need-help/update-status/${ticketId}`,
                {
                    status: formattedStatus,
                    userEmail: user.email
                }
            );

            await fetchSupportTickets();

        } catch (error) {
            console.error("Status update failed:", error.response?.data || error);
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    const handleSave = async () => {
        try {
            setIsSaving(true);

            await axios.put(
                `${API_BASE}/api/user/update`,
                {
                    id: user?.uid,
                    name: firstName
                }
            );

            setIsEditingHeaderName(false);
            setIsEditingInputName(false);

        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };


    const fetchUserData = async () => {
        try {
            if (!user?.email) return;

            const res = await axios.get(
                `${API_BASE}/api/user/get?userEmail=${user?.email}`
            );

            const dbUser = res.data.user;

            setFirstName(dbUser?.name || "");
            setLastName(dbUser?.organization || "");
            setEmail(dbUser?.userEmail || "");

        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    };
    const fetchSupportTickets = async () => {
        try {
            if (!user?.email) return;

            const res = await axios.get(
                `${API_BASE}/api/need-help/list?userEmail=${user.email}`
            );

            if (res.data.success) {
                setTickets(res.data.tickets);
            }
        } catch (error) {
            console.error("Failed to fetch support tickets:", error);
        }
    };
    useEffect(() => {
        fetchUserData();
        fetchSupportTickets();
    }, [user?.email]);

    return (
        <div className="settings-container">

            {/* BACK */}
            <div className="settings-back" onClick={onBack}>
                <IoArrowBackOutline size={18} />
                <span>Back</span>
            </div>

            {/* HEADER */}
            <p style={{ textAlign: "left", width: "88px", height: "24px", fontSize: "22px", fontWeight: "500", lineHeight: "24px", marginBottom: "25px" }}>Settings</p>
            <div className="settings-header">

                <div className="settings-user-info">
                    <img
                        src={
                            user?.photoURL ||
                            `https://ui-avatars.com/api/?name=${user?.displayName}`
                        }
                        className="settings-avatar"
                    />

                    <div>
                        <div className="settings-admin-badge">Admin</div>
                        <div className="settings-name-wrapper">

                            {isEditingHeaderName ? (
                                <input
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="settings-header-input"
                                    autoFocus
                                />
                            ) : (
                                <div className="settings-name">{firstName}</div>
                            )}

                            <FiEdit2
                                size={16}
                                className="settings-name-edit-icon"
                                onClick={() => setIsEditingHeaderName(true)}
                            />

                        </div>
                    </div>

                </div>

                <button
                    className="settings-save-btn"
                    onClick={handleSave}
                    disabled={isSaving || (!isEditingHeaderName && !isEditingInputName)}

                >
                    {isSaving ? "Saving..." : "Save Changes"}
                </button>


            </div>

            {/* FORM */}
            <div className="settings-form">

                <div className="settings-input-group">

                    <label>Name</label>

                    <div className="settings-input-wrapper">

                        <input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={!isEditingInputName}
                            className={!isEditingInputName ? "settings-disabled-input" : ""}
                        />

                        <FiEdit2
                            className="settings-edit-icon"
                            size={16}
                            onClick={() => setIsEditingInputName(true)}
                        />

                    </div>

                </div>



                <div className="settings-input-group">
                    <label>Organisation Name</label>
                    <div className="settings-input-wrapper">
                        <input
                            value={lastName}
                            disabled
                            className="settings-disabled-input"
                        />

                        <FiEdit2 className="settings-edit-icon" size={16} />
                    </div>
                </div>

                <div className="settings-input-group">
                    <label>Email</label>
                    <div className="settings-input-wrapper">
                        <input
                            value={email}
                            disabled
                        />

                        <FiEdit2 className="settings-edit-icon" size={16} />
                    </div>
                </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="settings-actions">

                <button
                    className="delete-account-btn"
                    onClick={() => {
                        setConfirmType("delete");
                        setDeletePassword("");
                        setShowDeletePassword(false);
                        setDeleteError("");
                        setShowConfirmModal(true);
                    }}
                >
                    Delete Account
                </button>

                <button
                    className="reset-password-btn"
                    onClick={() => {
                        setConfirmType("reset");
                        setShowConfirmModal(true);
                    }}
                >
                    Reset Password
                </button>

            </div>
            {/* ================= NEED HELP SECTION ================= */}

            <div className="support-container">

                <div className="support-header" onClick={() => setShowSupportModal(true)}>
                    <div className="support-header-left">
                        <div className="support-icon">?</div>
                        <div>
                            <div className="support-title">Need Help?</div>
                            <div className="support-subtitle">
                                Raise issue or request support
                            </div>
                        </div>
                    </div>

                    <div
                        className="support-arrow"
                    >
                        <img
                            src={supportSettingsRight}
                            alt="open"
                            className="support-arrow-icon"
                        />
                    </div>
                </div>


                <div className="support-body">

                    <div className="support-list-header">
                        <span className="support-list-text">In progress issues & support list</span>
                        <div className="support-badge">{tickets?.filter(t => t.status !== "Resolved").length}</div>
                    </div>

                    {tickets?.filter(t => t.status !== "Resolved").length > 0 && (
                        <div className="support-table">
                            <div className="support-table-header">
                                <div>Issue Related to</div>
                                <div>Description</div>
                                <div>Status</div>
                            </div>

                            {tickets.filter(ticket => ticket.status !== "Resolved")?.map((ticket) => (
                                <div className="support-table-row" key={ticket.id}>
                                    <div>{ticket.issueType}</div>
                                    <div>{ticket.description}</div>
                                    <div>
                                        <div className="status-cell">
                                            <div
                                                className={`status-badge ${ticket.status?.toLowerCase() === "resolved"
                                                    ? "resolved"
                                                    : "in-progress"
                                                    }`}
                                                onClick={() => {
                                                    setStatusModalTicket(ticket);
                                                    setSelectedStatus(ticket.status);
                                                }}
                                                style={{ marginRight: "auto" }}
                                            >
                                                {ticket.status}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>
            </div>
            {statusModalTicket && (
                <div className="status-modal-overlay">
                    <div className="status-modal">
                        <h3>Update Status</h3>

                        <input
                            type="text"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="status-input"
                            placeholder="Enter status (In progress / Resolved)"
                        />

                        <div className="status-modal-buttons">
                            <button
                                className="status-cancel"
                                onClick={() => setStatusModalTicket(null)}
                            >
                                Cancel
                            </button>

                            <button
                                className="status-save"
                                onClick={() => {
                                    handleStatusChange(statusModalTicket.id, selectedStatus);
                                    setStatusModalTicket(null);
                                }}
                                disabled={isUpdatingStatus}
                            >
                                {isUpdatingStatus ? "Updating..." : "Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSupportModal && (
                <SupportModal
                    user={user}
                    firstName={firstName}
                    onClose={() => setShowSupportModal(false)}
                    onSubmitted={() => fetchSupportTickets()}
                />
            )}
            {/* CONFIRM MODAL */}
            {showConfirmModal && (
                <div className="confirm-overlay">
                    <div className="confirm-modal">

                        <div className="confirm-title">
                            {confirmType === "delete"
                                ? "Delete Account?"
                                : "Reset Password?"}
                        </div>

                        <div className="confirm-message">
                            {confirmType === "delete"
                                ? "This action is permanent and cannot be undone."
                                : "We will send a password reset link to your email."}
                        </div>

                        {confirmType === "delete" && deleteProviderId === "password" && (
                            <div className="confirm-password-wrap">
                                <input
                                    type={showDeletePassword ? "text" : "password"}
                                    className="confirm-password-input"
                                    placeholder="Enter your password to confirm"
                                    value={deletePassword}
                                    onChange={(e) => setDeletePassword(e.target.value)}
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="confirm-eye"
                                    onClick={() => setShowDeletePassword((s) => !s)}
                                    tabIndex={-1}
                                    aria-label={showDeletePassword ? "Hide password" : "Show password"}
                                >
                                    {showDeletePassword ? (
                                        <PiEyeSlash size={20} />
                                    ) : (
                                        <PiEyeLight size={20} />
                                    )}
                                </button>
                            </div>
                        )}

                        {confirmType === "delete" && deleteProviderId === "google.com" && (
                            <div className="confirm-subnote">
                                You'll be asked to confirm with Google.
                            </div>
                        )}

                        {confirmType === "delete" && deleteError && (
                            <div className="confirm-error">{deleteError}</div>
                        )}

                        <div className="confirm-buttons">

                            <button
                                className="confirm-cancel"
                                disabled={isDeleting}
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setDeletePassword("");
                                    setShowDeletePassword(false);
                                    setDeleteError("");
                                }}
                            >
                                No
                            </button>

                            <button
                                className="confirm-confirm"
                                disabled={isDeleting}
                                onClick={async () => {
                                    if (confirmType === "delete") {
                                        // handleDeleteAccount closes the modal itself on success
                                        await handleDeleteAccount();
                                    } else {
                                        await handleResetPassword();
                                        setShowConfirmModal(false);
                                    }
                                }}
                            >
                                {confirmType === "delete" && isDeleting
                                    ? "Deleting…"
                                    : "Yes"}
                            </button>

                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default SettingsPage;
