import React, { useState, useEffect } from "react";
import star from "../../../Images/star.png";
import "../../../Styles/VoiceModule.css";
import voiceRoleIcon from "../../../Images/VoiceRoleIcon.png";
import voiceMailIcon from "../../../Images/VoiceMailIcon.png";
import voiceNameIcon from "../../../Images/VoiceNameIcon.png";
import recordIcon from "../../../Images/voiceModuleRecord.png";
import templateIcon from "../../../Images/voiceModuleTemplateIcon.png";
import careVoiceEdit from "../../../Images/careVoiceEditTemplate.png";
import careVoiceDelete from "../../../Images/careVoiceDeleteTemplate.png"
import careVoiceShare from "../../../Images/careVoiceShare.png"
import { FiUploadCloud, FiX } from "react-icons/fi";
import MapperGrid from "./VoiceModuleMapper";

const VoiceModule = (props) => {
    const userEmail = props?.user?.email;
    const domain = userEmail?.split("@")[1] || "";
    console.log("userEmail", userEmail)
    console.log("domain", domain)
    const organizationId = domain;
    const API_BASE =
        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

    const [role, setRole] = useState("Admin");
    const [templateFile, setTemplateFile] = useState(null);
    const [sampleFiles, setSampleFiles] = useState([]);
    const [sessionId, setSessionId] = useState(null);

    // idle | processing | review | completed
    const [stage, setStage] = useState("idle");

    const [analysisText, setAnalysisText] = useState("");
    const [feedbackText, setFeedbackText] = useState("");
    const [currentStep, setCurrentStep] = useState(1);
    const [eventLogs, setEventLogs] = useState([]);
    const [showUploadSection, setShowUploadSection] = useState(true);
    const [mapperRows, setMapperRows] = useState([]);
    const [showFeedbackBox, setShowFeedbackBox] = useState(false);
    // template list & actions
    const [templates, setTemplates] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);

    // delete flow
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);

    // edit flow
    const [editingTemplateId, setEditingTemplateId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const timeAgo = (dateString) => {
        if (!dateString) return "";

        const now = new Date();
        const past = new Date(dateString);
        const diffMs = now - past;

        const seconds = Math.floor(diffMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return "Just now";
        if (minutes < 60) return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
        return `${days} day${days > 1 ? "s" : ""} ago`;
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/voiceModuleTemplate?domain=${domain}`
            );
            const data = await res.json();
            console.log("fetched templates", data?.data)
            if (data.success) setTemplates(data?.data);
        } catch (err) {
            console.error("[UI] Fetch templates failed", err);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, [domain]);
    const handleDeleteClick = (template) => {
        setDeleteTarget(template);
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        setDeleting(true);

        try {
            await fetch(
                `${API_BASE}/api/voiceModuleTemplate/${deleteTarget.id}?organizationId=${organizationId}`,
                { method: "DELETE" }
            );

            setDeleting(false);
            setDeleteTarget(null);
            setShowDeleteSuccess(true);

            fetchTemplates();

            setTimeout(() => setShowDeleteSuccess(false), 2000);

        } catch (err) {
            console.error("[UI] Delete failed", err);
            setDeleting(false);
        }
    };

    const handleEditTemplate = (template) => {
        console.log("[UI] Editing template", template.id);

        setMapperRows(template.mappings);
        setAnalysisText(template.prompt);
        setEditingTemplateId(template.id);

        setShowUploadSection(false);
        setStage("completed");
        setOpenMenuId(null);
    };


    const getFieldMappings = (data) => {
        return (
            data?.mapper?.mapper?.fields ||          // ✅ NEW (array)
            data?.mapper?.mapper?.field_mappings ||  // object (snake_case)
            data?.mapper?.mapper?.fieldMappings ||   // object (camelCase)
            null
        );
    };

    const normalizeFieldMappings = (fieldMappings) => {
        if (!fieldMappings) return [];

        // ✅ CASE 1: Already array (BEST CASE)
        if (Array.isArray(fieldMappings)) {
            return fieldMappings.map((item) => ({
                template_field: item.template_field || item.key || "",
                source: item.source || "",
                type: item.type || "text",
                required: !!item.required
            }));
        }

        // ✅ CASE 2: Object map
        if (typeof fieldMappings === "object") {
            return Object.entries(fieldMappings).map(
                ([key, value]) => ({
                    template_field: key,
                    source: value?.source || "",
                    type: value?.type || "text",
                    required: !!value?.required
                })
            );
        }

        return [];
    };


    const pushEvent = (label, step) => {
        setEventLogs(prev => {
            const lastEvent = prev[prev.length - 1];
            const now = new Date().toLocaleTimeString();

            // ✅ SAME EVENT → UPDATE TIME ONLY
            if (lastEvent && lastEvent.label === label) {
                return prev.map((ev, idx) =>
                    idx === prev.length - 1
                        ? { ...ev, time: now }
                        : ev
                );
            }

            // ✅ NEW EVENT → PUSH
            return [
                ...prev,
                {
                    label,
                    time: now,
                    step: step || currentStep
                }
            ];
        });

        if (step) {
            setCurrentStep(step);
        }
    };



    // Clean unnecessary characters from text (keeping emojis)
    const cleanText = (text) => {
        if (!text) return "";
        // Remove unnecessary characters like #, *, excessive punctuation
        return text
            .replace(/[#*_~`]/g, '') // Remove markdown symbols
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    };
    const startAnalysis = async () => {
        if (!templateFile) return;

        console.log("[UI] Starting onboarding analysis");

        // RESET PREVIOUS STATE (VERY IMPORTANT)
        setEventLogs([]);          // purane steps clear
        setCurrentStep(2);         // fresh process
        setAnalysisText("");       // purani explanation hatao
        setFeedbackText("");

        // UI updates
        setShowUploadSection(false);
        setStage("processing");

        // First step
        pushEvent("Analysis started", 2);

        const formData = new FormData();
        formData.append("template", templateFile);
        sampleFiles.forEach((f) => formData.append("example", f));

        try {
            const res = await fetch(`${API_BASE}/api/onboarding/start`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            // Second step
            pushEvent("Session created", 2);
            console.log("[UI] Session created:", data);

            setSessionId(data.sessionId);
            pollLatest(data.sessionId);

        } catch (error) {
            console.error("[UI] Analysis error:", error);

            pushEvent("Analysis failed", 1);
            setShowUploadSection(true);
            setStage("idle");
        }
    };


    /* ================= POLL LATEST ================= */
    const pollLatest = (id) => {
        console.log("[UI] Polling latest event:", id);

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/onboarding/respond`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId: id,
                        action: "latest"
                    })
                });

                const data = await res.json();
                console.log("[UI] Latest event:", data);

                if (data.type === "processing" || data.type === "status") {
                    pushEvent("Processing document", 2);
                    return;
                }

                if (data.type === "explanation" || data.type === "refined_explanation") {
                    pushEvent("AI explanation ready", 3);
                    // Clean the text before displaying
                    const cleanedText = cleanText(data.payload?.content || "");
                    setAnalysisText(cleanedText);
                    setStage("review");
                    clearInterval(interval);
                }

                if (data.type === "final_result") {
                    pushEvent("Final document generated", 4);

                    const rawMappings = getFieldMappings(data);
                    const rowsArray = normalizeFieldMappings(rawMappings);

                    console.log("[UI] Mapper rows (normalized):", rowsArray);

                    setMapperRows(rowsArray);
                    setStage("completed");
                    clearInterval(interval);
                }


            } catch (error) {
                console.error("[UI] Polling error:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    };

    /* ================= ACCEPT ================= */
    const acceptAnalysis = async () => {
        console.log("[UI] Accepting analysis");

        setStage("processing");
        setEventLogs([]);        // 🔥 RESET STEPS
        setCurrentStep(2);

        try {
            await fetch(`${API_BASE}/api/onboarding/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    action: "accept"
                })
            });

            pollLatest(sessionId);
        } catch (error) {
            console.error("[UI] Accept error:", error);
        }
    };

    /* ================= FEEDBACK ================= */
    const sendFeedback = async () => {
        if (!feedbackText.trim()) return;

        console.log("[UI] Sending feedback");

        setStage("processing");
        setEventLogs([]);        // 🔥 PURANE STEPS CLEAR
        setCurrentStep(2);

        try {
            await fetch(`${API_BASE}/api/onboarding/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sessionId,
                    action: "feedback",
                    comment: feedbackText
                })
            });

            setFeedbackText("");
            setShowFeedbackBox(false);
            pollLatest(sessionId);
        } catch (error) {
            console.error("[UI] Feedback error:", error);
        }
    };
    const resetToTemplateList = () => {
        setStage("idle");
        setShowUploadSection(true);
        setMapperRows([]);
        setAnalysisText("");
        setFeedbackText("");
        setSessionId(null);
    };

    const saveTemplate = async () => {
        if (isSaving) return;
        console.log("[UI] Saving template");
        setIsSaving(true);
        const payload = {
            organizationId: organizationId,
            domain: domain,
            userEmail: userEmail,
            prompt: analysisText,
            mappings: mapperRows,
            templateStructure: {},
            sessionId
        };

        try {
            const url = editingTemplateId
                ? `${API_BASE}/api/voiceModuleTemplate/${editingTemplateId}`
                : `${API_BASE}/api/voiceModuleTemplate`;

            const method = editingTemplateId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!data.success) {
                setIsSaving(false);
                return;
            }

            setEditingTemplateId(null);
            resetToTemplateList();
            fetchTemplates();

        } catch (err) {
            console.error("[UI] Save failed", err);
        }
        finally {
            setIsSaving(false);
        }
    };


    // Reset view when role changes
    useEffect(() => {
        if (role === "Admin") {
            setShowUploadSection(true);
            setStage("idle");
            setCurrentStep(1);
        }
    }, [role]);

    return (
        <div className="voice-container">
            {/* ================= TOP ROW ================= */}
            <div className="voice-top-row">
                <div className="voice-field">
                    <img
                        src={voiceRoleIcon}
                        alt="role"
                        style={{ width: "17px", height: "15px" }}
                    />
                    <select
                        className="voice-select"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="Admin">Admin</option>
                        {/* <option value="Staff">Staff</option> */}
                    </select>
                </div>

                {role === "Staff" && (
                    <>
                        <div className="voice-field">
                            <img
                                src={voiceNameIcon}
                                alt="name"
                                style={{ width: "16px", height: "15px" }}
                            />
                            <input
                                className="voice-input"
                                placeholder="Name"
                            />
                        </div>

                        <div className="voice-field">
                            <img
                                src={voiceMailIcon}
                                alt="email"
                                style={{ width: "17px", height: "13px" }}
                            />
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
                    {/* ================= TEMPLATE LIST ================= */}
                    {stage === "idle" && (
                        <div className="vm-template-list">
                            <div className="vm-template-list-title">
                                Available Template
                            </div>

                            {/* ✅ EMPTY STATE */}
                            {templates.length === 0 && (
                                <div className="vm-template-empty">
                                    No templates available
                                </div>
                            )}

                            {/* ✅ TEMPLATE CARDS */}
                            {templates.map((tpl,index) => (
                                <div key={tpl.id} className="vm-template-card">
                                    <div className="vm-template-left">
                                        <div className="vm-template-icon">
                                            <img src={templateIcon} alt="template" />
                                        </div>

                                        <div className="vm-template-info">
                                            <div className="vm-template-name">
                                               {tpl.name || `Voice Template ${index + 1}`}
                                                <span
                                                    className="vm-template-edit-icon"
                                                    onClick={() => handleEditTemplate(tpl)}
                                                >
                                                    ✎
                                                </span>
                                            </div>

                                            <div className="vm-template-date">
                                                ⏱ {timeAgo(tpl.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vm-template-right">
                                        {/* Share Button */}
                                        <button className="vm-share-btn">
                                            <img src={careVoiceShare} alt="share" />
                                            Share Template
                                        </button>

                                        {/* 3 dots */}
                                        <span
                                            className="vm-dots"
                                            onClick={() =>
                                                setOpenMenuId(openMenuId === tpl.id ? null : tpl.id)
                                            }
                                        >
                                            ⋮
                                        </span>

                                        {/* Dropdown */}
                                        {openMenuId === tpl.id && (
                                            <div className="vm-dropdown">
                                                <div
                                                    className="vm-dropdown-item"
                                                    onClick={() => handleEditTemplate(tpl)}
                                                >
                                                    <img src={careVoiceEdit} alt="edit" />
                                                    Edit Template Fields
                                                </div>

                                                <div
                                                    className="vm-dropdown-item danger"
                                                    onClick={() => handleDeleteClick(tpl)}
                                                >
                                                    <img src={careVoiceDelete} alt="delete" />
                                                    Delete Template
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}


                    {/* Upload Section - Hidden when analyze clicked OR during processing */}

                    {showUploadSection && stage !== "processing" && (
                        <>
                            <div className="voice-upload-row">
                                {/* ================= TEMPLATE COLUMN ================= */}
                                <div className="voice-upload-col">
                                    <div className="voice-upload-title-admin">
                                        Upload Templates*
                                    </div>

                                    {!templateFile && (
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
                                                onChange={(e) => {
                                                    console.log("[UI] Template selected:", e.target.files[0]?.name);
                                                    setTemplateFile(e.target.files[0]);
                                                }}
                                            />

                                            <FiUploadCloud className="voice-icon" />
                                            <div className="voice-text">Drop file or browse</div>
                                            <div className="voice-subtext">Format: .doc only</div>

                                            <button className="voice-browse-btn">
                                                Browse Files
                                            </button>
                                        </div>
                                    )}

                                    {templateFile && (
                                        <div className="vm-file-list">
                                            <div className="vm-file-item">
                                                <div className="vm-file-left">
                                                    <div className="vm-file-name">
                                                        {templateFile.name}
                                                    </div>
                                                    <div className="vm-file-status">
                                                        Uploaded • 100%
                                                    </div>
                                                </div>

                                                <div className="vm-file-actions">
                                                    <span className="vm-file-check">✓</span>
                                                    <span
                                                        className="vm-file-remove"
                                                        onClick={() => {
                                                            console.log("[UI] Template removed");
                                                            setTemplateFile(null);
                                                        }}
                                                    >
                                                        <FiX />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ================= SAMPLES COLUMN ================= */}
                                <div className="voice-upload-col">
                                    <div className="voice-upload-title-admin">
                                        Upload Samples
                                    </div>

                                    {sampleFiles.length === 0 && (
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
                                                onChange={(e) => {
                                                    const files = Array.from(e.target.files);
                                                    console.log("[UI] Samples selected:", files.map(f => f.name));
                                                    setSampleFiles(files);
                                                }}
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
                                    )}

                                    {sampleFiles.length > 0 && (
                                        <div className="vm-file-list">
                                            {sampleFiles.map((file, index) => (
                                                <div key={index} className="vm-file-item">
                                                    <div className="vm-file-left">
                                                        <div className="vm-file-name">
                                                            {file.name}
                                                        </div>
                                                        <div className="vm-file-status">
                                                            Uploaded • 100%
                                                        </div>
                                                    </div>

                                                    <div className="vm-file-actions">
                                                        <span className="vm-file-check">✓</span>
                                                        <span
                                                            className="vm-file-remove"
                                                            onClick={() => {
                                                                console.log("[UI] Sample removed:", file.name);
                                                                setSampleFiles(prev =>
                                                                    prev.filter((_, i) => i !== index)
                                                                );
                                                            }}
                                                        >
                                                            <FiX />
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Save & Analyze Button */}
                            <div className="voice-action">
                                <button
                                    disabled={!templateFile || stage === "processing"}
                                    onClick={startAnalysis}
                                >
                                    Save & Analyze
                                    <img
                                        src={star}
                                        alt="star"
                                        className="voice-star"
                                    />
                                </button>
                            </div>
                        </>
                    )}

                    {/* Processing Animation */}
                    {/* ================= PROCESSING ================= */}
                    {stage === "processing" && (
                        <>
                            {/* ✅ 1. PEHLE LOADER (jab eventLogs empty ho) */}
                            {eventLogs.length === 0 && (
                                <div className="analysis-processing">
                                    <div className="loader-container">
                                        <div className="spinner"></div>
                                        <div className="loader-text">Processing document</div>
                                        <div className="loader-subtext">
                                            This may take a few moments
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ✅ 2. EVENT AANE KE BAAD STEPPER */}
                            {eventLogs.length > 0 && (
                                <div className="vm-stepper-vertical">
                                    {eventLogs.map((event, index) => (
                                        <div key={index} className="vm-step-vertical">
                                            <div className="vm-step-circle-vertical" />
                                            <div className="vm-step-content">
                                                <div className="vm-event-name">
                                                    {event.label}
                                                </div>
                                                <div className="vm-event-time">
                                                    {event.time}
                                                </div>
                                            </div>
                                            {index < eventLogs.length - 1 && (
                                                <div className="vm-step-line-vertical" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}


                    {/* Review Section */}
                    {stage === "review" && (
                        <div className="analysis-review-container">
                            <h3>AI Analysis Summary</h3>

                            <div className="analysis-box">
                                {analysisText}
                            </div>

                            {showFeedbackBox && (
                                <div className="analysis-feedback-section">
                                    <div className="analysis-feedback-label">
                                        What would you like to change?
                                    </div>

                                    <textarea
                                        className="analysis-feedback-input"
                                        placeholder="Provide your feedback here..."
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        rows="4"
                                    />

                                    <div className="analysis-actions" style={{ marginTop: "16px" }}>
                                        <button
                                            onClick={sendFeedback}
                                            className="analysis-feedback-btn"
                                            disabled={!feedbackText.trim()}
                                        >
                                            Submit Changes
                                        </button>
                                    </div>
                                </div>
                            )}


                            <div className="analysis-actions">
                                <button
                                    onClick={acceptAnalysis}
                                    className="analysis-accept-btn"
                                >
                                    Accept
                                </button>

                                <button
                                    onClick={() => setShowFeedbackBox(true)}
                                    className="analysis-feedback-btn"
                                >
                                    Request Changes
                                </button>
                            </div>

                        </div>
                    )}

                    {/* Completed */}
                    {stage === "completed" && (
                        <div className="analysis-completed">
                            <h3>Mapper Configuration</h3>

                            <MapperGrid
                                rows={mapperRows}
                                setRows={setMapperRows}
                            />
                            <div style={{ marginTop: "20px", textAlign: "right" }}>
                                <button
                                    className="analysis-accept-btn"
                                    onClick={saveTemplate}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Template"}
                                </button>

                            </div>
                        </div>
                    )}
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
                            <div className="voice-text">
                                Drop file or browse
                            </div>
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
            {/* ================= DELETE CONFIRM MODAL ================= */}
            {deleteTarget && (
                <div className="vm-confirm-overlay">
                    <div className="vm-confirm-modal">
                        <h4 className="vm-confirm-title">Delete Template?</h4>
                        <p className="vm-confirm-text">
                            This action cannot be undone.
                        </p>

                        <div className="vm-confirm-actions">
                            <button
                                className="vm-confirm-no"
                                onClick={() => setDeleteTarget(null)}
                            >
                                No
                            </button>

                            <button
                                className="vm-confirm-yes"
                                disabled={deleting}
                                onClick={confirmDelete}
                            >
                                {deleting ? "..." : "Yes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* ================= DELETE SUCCESS ================= */}
            {showDeleteSuccess && (
                <div className="success-toast">
                    Template deleted successfully
                </div>
            )}

        </div>
    );
};

export default VoiceModule;