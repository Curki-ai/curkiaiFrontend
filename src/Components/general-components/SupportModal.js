import React, { useState } from "react";
import axios from "axios";
import "../../Styles/general-styles/Settings.css";
import TlcUploadBox from "../Modules/FinancialModule/Tlc/TlcUploadBox";
import crossIcon from "../../Images/ComparePriceCross.png";
import { API_BASE } from "../../config/apiBase";
import { toast } from "react-toastify";

const SupportModal = ({ user, firstName, onClose, onSubmitted }) => {
    const [issueType, setIssueType] = useState("Integration support");
    const [description, setDescription] = useState("");
    const [screenshotFile, setScreenshotFile] = useState(null);
    const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
    const [fileError, setFileError] = useState("");

    const handleSubmitSupport = async () => {
        try {
            if (!description.trim()) {
                toast.warn("Please describe your issue.");
                return;
            }

            setIsSubmittingSupport(true);

            const formData = new FormData();
            formData.append("firstName", firstName || user?.displayName || "");
            formData.append("userEmail", user?.email);
            formData.append("issueType", issueType);
            formData.append("description", description);

            if (screenshotFile) {
                formData.append("issue_screenshot", screenshotFile);
            }

            const res = await axios.post(
                `${API_BASE}/api/need-help/create`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            if (res.data.success) {
                setDescription("");
                setScreenshotFile(null);
                if (onSubmitted) onSubmitted(res.data);
                onClose();
            }
        } catch (error) {
            console.error("Support submission failed:", error);
            toast.error("Failed to submit request.");
        } finally {
            setIsSubmittingSupport(false);
        }
    };

    return (
        <div className="support-modal-overlay">
            <div className="support-modal">

                <div className="support-modal-header">
                    <h3>Raise a Support Request</h3>
                    <img
                        src={crossIcon}
                        alt="close"
                        className="support-close"
                        onClick={onClose}
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
    );
};

export default SupportModal;
