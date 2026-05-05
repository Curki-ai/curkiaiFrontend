import React, { useEffect, useState } from "react";
import "../../Styles/general-styles/Settings.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { auth } from "../../firebase";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import supportSettingsDown from "../../Images/supportSettingsDownIcon.svg"
import supportSettingsRight from "../../Images/supportSettingsUpIcon.svg"
import supportSettingsUploadIcon from "../../Images/supportSettingsUpload.svg"
import TlcUploadBox from "../Modules/FinancialModule/Tlc/TlcUploadBox";
import crossIcon from "../../Images/ComparePriceCross.png"
const SettingsPage = ({ user, onBack }) => {
    const [firstName, setFirstName] = useState(user?.displayName || "Deepak");
    const [lastName, setLastName] = useState(user?.displayName || "uday");
    const [email, setEmail] = useState(user?.email || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingHeaderName, setIsEditingHeaderName] = useState(false);
    const [isEditingInputName, setIsEditingInputName] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmType, setConfirmType] = useState("");
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [issueType, setIssueType] = useState("Technical issue");
    const [description, setDescription] = useState("");
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [fileError, setFileError] = useState("");
    const [openStatusId, setOpenStatusId] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusModalTicket, setStatusModalTicket] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const handleResetPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, user?.email);
            alert("Password reset email sent!");
        } catch (error) {
            console.error(error);
            alert("Failed to send reset email.");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
                alert("No user found.");
                return;
            }

            await axios.delete(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/user/delete?id=${currentUser.uid}`
            );

            await deleteUser(currentUser);

            alert("Account deleted successfully.");

            // window.location.reload();

        } catch (error) {
            console.error(error);

            if (error.code === "auth/requires-recent-login") {
                alert("Please log in again before deleting your account.");
            } else {
                alert("Failed to delete account.");
            }
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
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/need-help/update-status/${ticketId}`,
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
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/user/update",
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
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/user/get?userEmail=${user?.email}`
            );

            const dbUser = res.data.user;

            setFirstName(dbUser?.name || "");
            setLastName(dbUser?.organization || "");
            setEmail(dbUser?.userEmail || "");

        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    };
    const handleSubmitSupport = async () => {
        try {
            if (!description.trim()) {
                alert("Please describe your issue.");
                return;
            }

            setIsSubmittingSupport(true);

            const formData = new FormData();
            formData.append("firstName", firstName);
            formData.append("userEmail", user.email);
            formData.append("issueType", issueType);
            formData.append("description", description);

            if (screenshotFile) {
                formData.append("issue_screenshot", screenshotFile);
            }

            const res = await axios.post(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/need-help/create",
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (res.data.success) {
                setShowSupportModal(false);
                setDescription("");
                setScreenshotFile(null);
                fetchSupportTickets();
            }

        } catch (error) {
            console.error("Support submission failed:", error);
            alert("Failed to submit request.");
        } finally {
            setIsSubmittingSupport(false);
        }
    };
    const fetchSupportTickets = async () => {
        try {
            if (!user?.email) return;

            const res = await axios.get(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/need-help/list?userEmail=${user.email}`
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
                <div className="support-modal-overlay">
                    <div className="support-modal">

                        <div className="support-modal-header">
                            <h3>Raise a Support Request</h3>
                            <img
                                src={crossIcon}
                                alt="close"
                                className="support-close"
                                onClick={() => setShowSupportModal(false)}
                            />
                        </div>

                        <div className="support-form-group">
                            <label>Issue Related To</label>
                            <select
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                            >
                                <option>Technical Issue</option>
                                <option>Billing Question</option>
                                <option>Account access</option>
                                <option>Feature request</option>
                                <option>Integration support</option>
                                <option>General Query</option>
                            </select>
                        </div>

                        <div className="support-form-group">
                            <div className="label-row">
                                <label>Briefly Describe The Issue</label>
                            </div>

                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What happened? What were you experiencing's?"
                                maxLength="150"
                                className="support-textarea"
                            />
                            <div className="char-limit">
                                {150 - description.length} characters left
                            </div>
                        </div>

                        <div className="support-form-group">

                            <TlcUploadBox
                                id="supportScreenshotUpload"
                                title="Upload Screenshot"
                                subtitle="JPG, PNG, WEBP • Max 5MB"
                                accept="image/jpeg,image/png,image/webp"
                                files={screenshotFile ? [screenshotFile] : []}
                                multiple={false}
                                setFiles={(selectedFiles) => {
                                    if (!selectedFiles || !selectedFiles.length) {
                                        setScreenshotFile(null);
                                        return;
                                    }

                                    const file = selectedFiles[0];

                                    const allowedTypes = [
                                        "image/jpeg",
                                        "image/png",
                                        "image/webp"
                                    ];

                                    if (!allowedTypes.includes(file.type)) {
                                        setFileError("Only JPG, PNG, or WEBP images are allowed.");
                                        setScreenshotFile(null);
                                        return;
                                    }

                                    const maxSize = 5 * 1024 * 1024; // 5MB
                                    if (file.size > maxSize) {
                                        setFileError("Image size must be less than 5MB.");
                                        setScreenshotFile(null);
                                        return;
                                    }

                                    setFileError("");
                                    setScreenshotFile(file);
                                }}
                            />

                            {fileError && <div className="file-error">{fileError}</div>}
                        </div>
                        <button
                            className="submit-support-btn"
                            onClick={handleSubmitSupport}
                            disabled={isSubmittingSupport}
                        >
                            {isSubmittingSupport ? "Submitting..." : "Submit Request"}
                        </button>

                        <div className="support-response-note">
                            We'll respond within 24 - 42 business hours.
                        </div>

                    </div>
                </div>
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

                        <div className="confirm-buttons">

                            <button
                                className="confirm-cancel"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                No
                            </button>

                            <button
                                className="confirm-confirm"
                                onClick={async () => {
                                    if (confirmType === "delete") {
                                        await handleDeleteAccount();
                                    } else {
                                        await handleResetPassword();
                                    }
                                    setShowConfirmModal(false);
                                }}
                            >
                                Yes
                            </button>

                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default SettingsPage;
