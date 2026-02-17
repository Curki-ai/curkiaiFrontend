import React, { useEffect, useState } from "react";
import "../Styles/Settings.css";
import { IoArrowBackOutline } from "react-icons/io5";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";

const SettingsPage = ({ user, onBack }) => {
    const [firstName, setFirstName] = useState(user?.displayName || "Deepak");
    const [lastName, setLastName] = useState(user?.displayName || "uday");
    const [email, setEmail] = useState(user?.email || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isEditingHeaderName, setIsEditingHeaderName] = useState(false);
    const [isEditingInputName, setIsEditingInputName] = useState(false);


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

                <button className="delete-account-btn">
                    Delete Account
                </button>

                <button className="reset-password-btn">
                    Reset Password
                </button>

            </div>

        </div>
    );
};

export default SettingsPage;
