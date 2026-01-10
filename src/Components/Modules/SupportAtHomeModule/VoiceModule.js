import React, { useState } from "react";
import { FiUploadCloud } from "react-icons/fi";
import star from "../../../Images/star.png";
import "../../../Styles/VoiceModule.css";
import voiceRoleIcon from "../../../Images/VoiceRoleIcon.png";
import voiceMailIcon from "../../../Images/VoiceMailIcon.png";
import voiceNameIcon from "../../../Images/VoiceNameIcon.png";
import recordIcon from "../../../Images/voiceModuleRecord.png";

const VoiceModule = () => {
    const [role, setRole] = useState("Admin");
    const [templateFile, setTemplateFile] = useState(null);
    const [sampleFiles, setSampleFiles] = useState([]);

    return (
        <div className="voice-container">
            {/* ================= TOP ROW ================= */}
            <div className="voice-top-row">
                {/* ROLE */}
                <div className="voice-field">
                    <img src={voiceRoleIcon} alt="role" style={{ width: "17px", height: "15px" }} />
                    <select
                        className="voice-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="Admin">Admin</option>
                        <option value="Staff">Staff</option>
                    </select>
                </div>

                {/* NAME + EMAIL ONLY FOR STAFF */}
                {role === "Staff" && (
                    <>
                        <div className="voice-field">
                            <img src={voiceNameIcon} alt="name" style={{ width: "16px", height: "15px" }} />
                            <input
                                className="voice-input"
                                placeholder="Name"
                            />
                        </div>

                        <div className="voice-field">
                            <img src={voiceMailIcon} alt="email" style={{ width: "17px", height: "13px" }} />
                            <input
                                className="voice-input"
                                placeholder="Email Address"
                            />
                        </div>
                    </>
                )}
            </div>

            <div className="voice-divider" />

            {/* ================= ADMIN VIEW ================= */}
            {role === "Admin" && (
                <>
                    <div className="voice-upload-row">
                        <div className="voice-upload-col">
                            <div className="voice-upload-title-admin">Upload Templates*</div>

                            <div
                                className="voice-upload-box"
                                onClick={() =>
                                    document.getElementById("voice-template").click()
                                }
                            >
                                <input
                                    id="voice-template"
                                    type="file"
                                    accept=".doc"
                                    hidden
                                    onChange={(e) => setTemplateFile(e.target.files[0])}
                                />

                                <FiUploadCloud className="voice-icon" />
                                <div className="voice-text">Drop file or browse</div>
                                <div className="voice-subtext">Format: .doc only</div>

                                <button className="voice-browse-btn">
                                    Browse Files
                                </button>
                            </div>
                        </div>

                        <div className="voice-upload-col">
                            <div className="voice-upload-title-admin">Upload Samples</div>

                            <div
                                className="voice-upload-box"
                                onClick={() =>
                                    document.getElementById("voice-sample").click()
                                }
                            >
                                <input
                                    id="voice-sample"
                                    type="file"
                                    accept=".doc,.pdf"
                                    multiple
                                    hidden
                                    onChange={(e) =>
                                        setSampleFiles(Array.from(e.target.files))
                                    }
                                />

                                <FiUploadCloud className="voice-icon" />
                                <div className="voice-text">Drop file or browse</div>
                                <div className="voice-subtext">
                                    Format: .doc or .pdf only
                                </div>

                                <button className="voice-browse-btn">
                                    Browse Files
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="voice-action">
                        <button disabled={!templateFile}>
                            Save & Analyze
                            <img src={star} alt="star" className="voice-star" />
                        </button>
                    </div>
                </>
            )}

            {/* ================= STAFF VIEW ================= */}
            {role === "Staff" && (
                <>
                    <div className="voice-record-section">
                        <div className="voice-timer">00:00:00</div>
                        <button className="voice-record-btn">
                            <img
                                src={recordIcon}
                                alt="record"
                                className="voice-record-icon"
                            />
                            Start Recording
                        </button>
                    </div>

                    <div className="voice-or-row">
                        <span className="voice-or-line" />
                        <span className="voice-or-text">Or</span>
                        <span className="voice-or-line" />
                    </div>

                    <div className="voice-upload-col">
                        <div className="voice-title">Upload Transcript</div>
                        <div className="voice-subtext">
                            Upload single transcript or folder of transcripts
                        </div>

                        <div className="voice-upload-box">
                            <FiUploadCloud className="voice-icon" />
                            <div className="voice-text">Drop file or browse</div>
                            <div className="voice-subtext">
                                Format: .doc or .pdf only
                            </div>

                            <button className="voice-browse-btn">
                                Browse Files
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default VoiceModule;
