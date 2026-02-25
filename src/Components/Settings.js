import React, { useEffect, useState } from "react";
import "../Styles/Settings.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { auth } from "../firebase";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import supportSettingsDown from "../Images/supportSettingsDownIcon.svg"
import supportSettingsRight from "../Images/supportSettingsUpIcon.svg"
import supportSettingsUploadIcon from "../Images/supportSettingsUpload.svg"
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
    useEffect(() => {
        fetchUserData();
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

                <div className="support-header" onClick={() => setIsSupportOpen(!isSupportOpen)}>
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
                            src={isSupportOpen ? supportSettingsDown : supportSettingsRight}
                            alt="toggle"
                            className="support-arrow-icon"
                        />
                    </div>
                </div>

                {isSupportOpen && (
                    <div className="support-body">

                        <div className="support-list-header">
                            <span>In progress issues & support list</span>
                            <div className="support-badge">1</div>
                        </div>

                        <div className="support-table">
                            <div className="support-table-header">
                                <div>Issue Related to</div>
                                <div>Description</div>
                                <div>Status</div>
                            </div>

                            <div className="support-table-row">
                                <div>Technical issue</div>
                                <div>What happened? What were you experiencing's?</div>
                                <div>
                                    <span className="status-badge in-progress">
                                        In progress
                                    </span>
                                </div>
                            </div>

                            <div className="support-table-row">
                                <div>deepak@curki.ai</div>
                                <div>Deepak.U</div>
                                <div>
                                    <span className="status-badge resolved">
                                        Resolved
                                    </span>
                                </div>
                            </div>

                        </div>

                        <button
                            className="raise-support-btn"
                            onClick={() => setShowSupportModal(true)}
                        >
                            Raise Support Request
                        </button>

                    </div>
                )}

            </div>
            {showSupportModal && (
                <div className="support-modal-overlay">
                    <div className="support-modal">

                        <div className="support-modal-header">
                            <h3>Raise a Support Request</h3>
                            <span
                                className="support-close"
                                onClick={() => setShowSupportModal(false)}
                            >
                                ×
                            </span>
                        </div>

                        <div className="support-form-group">
                            <label>Issue Related To</label>
                            <select>
                                <option>Technical issue</option>
                                <option>Billing</option>
                                <option>General Query</option>
                            </select>
                        </div>

                        <div className="support-form-group">
                            <div className="label-row">
                                <label>Briefly Describe The Issue</label>
                            </div>

                            <textarea
                                placeholder="What happened? What were you experiencing's?"
                                maxLength="150"
                                className="support-textarea"
                            />

                            <div className="char-limit">150 characters left</div>
                        </div>

                        <div className="support-form-group">
                            <label>Screenshots Related To Issues</label>

                            <div className="upload-box">
                                <div className="upload-inner">
                                    <img
                                        src={supportSettingsUploadIcon}
                                        alt="upload"
                                        className="upload-icon"
                                    />
                                    <div className="upload-text">Click to upload</div>
                                    <div className="upload-format">Format: doc only</div>
                                </div>
                            </div>
                        </div>
                        <button className="submit-support-btn">
                            Submit Request
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
