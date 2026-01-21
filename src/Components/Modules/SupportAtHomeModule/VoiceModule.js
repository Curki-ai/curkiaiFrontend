import React, { useState, useEffect, useRef } from "react";
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
import careVoiceWave from "../../../Images/careVoiceWave.png"
import careVoicePlay from "../../../Images/careVoicePlay.png"
import careVoicePause from "../../../Images/careVoicePause.png"
import careVoiceEndAndPreview from "../../../Images/careVoiceEndAndPreview.png"
import careVoiceStaffTemplateIcon from "../../../Images/careVoiceStaffTemplateIcon.png"
import careVoiceLeft from "../../../Images/careVoiceLeft.png"
import careVoiceRight from "../../../Images/careVoiceRight.png"
import { FiUploadCloud } from "react-icons/fi";
import MapperGrid from "./VoiceModuleMapper";
import { RiDeleteBin6Line } from "react-icons/ri";
import PulsatingLoader from "../../PulsatingLoader";
import FinancialAnalysisReportViewer from "../FinancialModule/FinancialAnalysisReportViewer";
import { parseVoiceExplanation } from "./ParseVoiceExplanation";
import TlcPayrollDownArrow from "../../../Images/tlc_payroll_down_button.png"
import careVoiceDocIcon from "../../../Images/careVoiceDocIcon.png"
import careVoicePdfIcon from "../../../Images/careVoicePdfIcon.png"
import careVoiceTemplateViewDoc from "../../../Images/careVoiceTemplateViewDoc.png"
import TlcPayrollInsightIcon from "../../../Images/TlcPayrollinsightIcon.png";
import AdminTemplateViewIcon from "../../../Images/AdminTemplateViewTable.png"
import careVoiceCross from "../../../Images/careVoiceCross.png"
import { GoArrowLeft } from "react-icons/go";
import { FiEdit } from "react-icons/fi";
import { FiCheck, FiX } from "react-icons/fi";

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
    // STAFF RECORDER STATE
    const [recordMode, setRecordMode] = useState("idle");

    // STAFF TEMPLATE DRAWER
    // const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const [audioURL, setAudioURL] = useState(null);
    const [recordTime, setRecordTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playTime, setPlayTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [transcriptData, setTranscriptData] = useState(null);
    const [transcribing, setTranscribing] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [uploadedTranscriptFile, setUploadedTranscriptFile] = useState(null);
    const [transcriptSource, setTranscriptSource] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    // RAW – AI source of truth (DB + Python)
    const [rawPrompt, setRawPrompt] = useState("");
    const [rawMapper, setRawMapper] = useState(null);
    const [templateIndex, setTemplateIndex] = useState(0);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState("");
    const progressIntervalRef = useRef(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [templateAccordions, setTemplateAccordions] = useState({
        aiResponse: false,
        generatedTemplate: false,
    });
    const [editingNameId, setEditingNameId] = useState(null);
    const [tempName, setTempName] = useState("");

    const [mapperMode, setMapperMode] = useState("view");
    // "view" | "edit"
    const [staffStep, setStaffStep] = useState("landing");
    useEffect(() => {
        if (role === "Admin") {
            setShowUploadSection(true);
            setStage("idle");
            setCurrentStep(1);
        }

        if (role === "Staff") {
            setStaffStep("landing");   // 🔥 IMPORTANT
            setSelectedTemplate(null);
        }
    }, [role]);

    const AccordionHeader = ({ icon, title, subtitle, isOpen, onClick }) => (
        <div
            onClick={onClick}
            style={{
                padding: "14px 18px",
                background:
                    "linear-gradient(180deg, #6C4CDC -65.32%, #FFFFFF 157.07%, #FFFFFF 226.61%)",
                borderRadius: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
            }}
        >
            {/* LEFT SIDE */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                {/* ICON */}
                {icon && (
                    <img
                        src={icon}
                        alt="accordion-icon"
                        style={{ width: "20px", height: "20px" }}
                    />
                )}

                {/* TITLE + SUBTITLE */}
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#000" }}>{title}</span>
                    {subtitle && (
                        <span style={{ fontSize: "Body/Size Medium", color: "#6B7280", fontWeight: 400 }}>
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* RIGHT ARROW */}
            <img
                src={TlcPayrollDownArrow}
                alt="toggle"
                style={{
                    width: "18px",
                    height: "10px",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                }}
            />
        </div>
    );



    useEffect(() => {
        let interval;

        if (recordMode === "recording") {
            interval = setInterval(() => {
                setRecordTime((t) => t + 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [recordMode]);
    const formatTime = (seconds) => {
        const total = Math.floor(seconds); // 🔥 FIX
        const h = String(Math.floor(total / 3600)).padStart(2, "0");
        const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
        const s = String(total % 60).padStart(2, "0");
        return `${h}:${m}:${s}`;
    };
    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            setAudioBlob(blob);
            setAudioURL(URL.createObjectURL(blob));
        };


        mediaRecorder.start();
        setRecordMode("recording");
    };
    const pauseRecording = () => {
        mediaRecorderRef.current?.pause();
        setRecordMode("paused");
    };
    const resumeRecording = () => {
        mediaRecorderRef.current?.resume();
        setRecordMode("recording");
    };
    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setRecordMode("preview");
    };
    const discardRecording = () => {
        setAudioURL(null);
        setRecordTime(0);
        audioChunksRef.current = [];
        setRecordMode("idle");
    };
    const togglePlayAudio = () => {
        if (!audioRef.current) return;

        if (audioRef.current.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    };
    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        const updateTime = () => {
            setPlayTime(audio.currentTime);
        };

        audio.addEventListener("timeupdate", updateTime);

        return () => {
            audio.removeEventListener("timeupdate", updateTime);
        };
    }, [audioURL]);

    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        const handleEnded = () => {
            setIsPlaying(false);
        };

        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("ended", handleEnded);
        };
    }, [audioURL]);
    const uploadAudioToAssemblyAI = async () => {
        const res = await fetch("https://api.assemblyai.com/v2/upload", {
            method: "POST",
            headers: {
                authorization: "f42a91a8cca04f3cb1667edcc30cd120",
            },
            body: audioBlob,
        });

        const data = await res.json();
        return data.upload_url;
    };
    const createTranscript = async (audioUrl) => {
        const res = await fetch("https://api.assemblyai.com/v2/transcript", {
            method: "POST",
            headers: {
                authorization: "f42a91a8cca04f3cb1667edcc30cd120",
                "content-type": "application/json",
            },
            body: JSON.stringify({
                audio_url: audioUrl,
                speaker_labels: true, // 🔥 IMPORTANT
                punctuate: true,
                format_text: true,
            }),
        });

        const data = await res.json();
        return data.id;
    };
    const pollTranscript = (id) => {
        const interval = setInterval(async () => {
            const res = await fetch(
                `https://api.assemblyai.com/v2/transcript/${id}`,
                {
                    headers: { authorization: "f42a91a8cca04f3cb1667edcc30cd120" },
                }
            );

            const data = await res.json();

            if (data.status === "completed") {
                clearInterval(interval);
                setTranscriptData(data);
                setIsGenerating(true);
                console.log("FINAL TRANSCRIPT:", data);
                if (selectedTemplate) {
                    submitToDocumentFiller();   // 🚀 DIRECT CALL
                }
            }

            if (data.status === "error") {
                clearInterval(interval);
                console.error("AssemblyAI error");
            }
        }, 2000);
    };
    const fetchTemplateFile = async (templateFileName) => {
        const response = await fetch(`/templates/${templateFileName}`);

        if (!response.ok) {
            throw new Error("Template file not found");
        }

        const blob = await response.blob();

        return new File(
            [blob],
            templateFileName,
            { type: blob.type }
        );
    };

    const acceptRecording = async () => {
        if (!audioBlob) return;

        try {
            setTranscribing(true);
            setTranscriptSource("audio");
            const uploadUrl = await uploadAudioToAssemblyAI();
            const transcriptId = await createTranscript(uploadUrl);

            pollTranscript(transcriptId);
        } catch (err) {
            console.error("AssemblyAI failed", err);
        }
    };
    const getSpeakerTranscript = () => {
        if (!transcriptData?.utterances) return [];

        return transcriptData.utterances.map((u, index) => ({
            id: index,
            speaker: u.speaker,
            text: u.text,
            confidence: u.confidence,
        }));
    };


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
        setMapperMode("edit");
        console.log("template", template);
        console.log("[UI][EDIT] Editing template", template.id);

        // 🔐 RAW SOURCE (FROM DB)
        setRawPrompt(template.prompt || "");
        setRawMapper(template.mappings || null);   // ✅ FIX

        // 🎨 UI
        const cleanedText = cleanText(template.prompt || "");
        setAnalysisText(template.prompt);

        const parsedMappings =
            typeof template.mappings === "string"
                ? JSON.parse(template.mappings)
                : template.mappings;

        setRawMapper(parsedMappings); // source of truth

        const rowsArray = normalizeFieldMappings(
            extractMapperFields(parsedMappings)
        );

        setMapperRows(rowsArray);

        setEditingTemplateId(template.id);
        setShowUploadSection(false);
        setStage("completed");
        setOpenMenuId(null);
    };


    const saveTemplateName = async (templateId) => {
        if (!tempName.trim()) {
            setEditingNameId(null);
            return;
        }

        try {
            await fetch(`${API_BASE}/api/voiceModuleTemplate/${templateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    organizationId,
                    userEmail,
                    templateName: tempName.trim(),
                }),
            });

            setEditingNameId(null);
            fetchTemplates(); // 🔥 refresh list
        } catch (err) {
            console.error("[UI] Rename failed", err);
        }
    };


    const getFieldMappings = (data) => {
        return (
            data?.mapper?.mapper?.fields ||          // ✅ NEW (array)
            data?.mapper?.mapper?.field_mappings ||  // object (snake_case)
            data?.mapper?.mapper?.fieldMappings ||
            data?.mapper?.fieldMappings ||
            data?.mapper?.fields ||
            data?.mapper?.field_mappings ||
            null
        );
    };
    const extractMapperFields = (input) => {
        if (!input) return [];

        // unwrap AI/python wrapper
        if (input.mapper) {
            return extractMapperFields(input.mapper);
        }

        // ✅ ONLY allow actual field mappings
        if (input.field_mappings && typeof input.field_mappings === "object") {
            return Object.entries(input.field_mappings).map(([key, value]) => ({
                template_field: key,
                ...value
            }));
        }

        // legacy support
        if (Array.isArray(input.fields)) return input.fields;
        if (Array.isArray(input.fieldMappings)) return input.fieldMappings;

        return [];
    };


    const normalizeFieldMappings = (fieldMappings) => {
        if (!fieldMappings) return [];

        // ✅ ARRAY (AI / DB)
        if (Array.isArray(fieldMappings)) {
            return fieldMappings.map((item) => ({
                template_field: item.template_field || item.key || "",
                source:
                    item.source ||
                    item.transcript_source ||   // 🔥 FIX
                    "",
                type: item.type || "text",
                required: !!item.required
            }));
        }

        // ✅ OBJECT MAP (legacy / manual)
        if (typeof fieldMappings === "object") {
            return Object.entries(fieldMappings).map(
                ([key, value]) => ({
                    template_field: key,
                    source:
                        value?.source ||
                        value?.transcript_source || // 🔥 FIX
                        "",
                    type: value?.type || "text",
                    required: !!value?.required
                })
            );
        }

        return [];
    };



    const pushEvent = (label, step) => {
        const now = new Date().toLocaleTimeString();

        setCurrentTask(label); // 🔥 THIS DRIVES THE TIMELINE

        setEventLogs(prev => {
            const last = prev[prev.length - 1];

            if (last && last.label === label) {
                return prev.map((ev, i) =>
                    i === prev.length - 1 ? { ...ev, time: now } : ev
                );
            }

            return [
                ...prev,
                { label, time: now, step: step || currentStep }
            ];
        });

        if (step) setCurrentStep(step);
    };


    const cleanPromptText = (text) => {
        if (!text) return "";

        return text
            .replace(/\*\*/g, "")    // Remove bold **
            .replace(/#{1,6}\s*/g, "") // Remove markdown headers
            .replace(/`/g, "")       // Remove backticks
            .replace(/_/g, "")       // Remove underscores
            .replace(/~{1,2}/g, "")  // Remove strikethrough
            .replace(/\n{3,}/g, "\n\n") // Normalize line breaks
            .trim();
    };

    // Clean unnecessary characters from text (keeping emojis)
    const cleanText = (text) => {
        if (!text) return "";

        return text
            .replace(/[*#`_~]/g, "")   // remove markdown junk
            .replace(/[ \t]+/g, " ")   // normalize spaces
            .replace(/\n{3,}/g, "\n\n") // avoid huge gaps
            .trim();
    };
    const stopProgress = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
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
        stopProgress();
        setProcessingProgress(5);

        let progress = 5;
        progressIntervalRef.current = setInterval(() => {
            progress += 0.3;
            if (progress >= 90) progress = 70; // cap till backend finishes
            setProcessingProgress(progress);
        }, 80);

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

                // ✅ PROCESSING STATES (INCLUDING FEEDBACK)
                if (
                    data.type === "processing" ||
                    data.type === "status" ||
                    data.type === "processing_feedback"
                ) {
                    pushEvent("Processing document", 2);
                    return;
                }

                // ✅ FEEDBACK ACKNOWLEDGEMENT
                if (
                    data.type === "feedback_received" ||
                    data.type === "acknowledged"
                ) {
                    pushEvent("Feedback received, refining analysis", 2);
                    return;
                }

                if (data.type === "explanation" || data.type === "refined_explanation") {
                    pushEvent("AI explanation ready", 3);

                    const cleanedText = cleanText(data.payload?.content || "");
                    setAnalysisText(data.payload?.content);

                    setProcessingProgress(100);
                    stopProgress();
                    setStage("review");
                    clearInterval(interval);
                }

                if (data.type === "final_result") {
                    pushEvent("Final document generated", 4);

                    setRawPrompt(data.prompt || "");
                    setRawMapper(data?.mapper || data?.mapper?.mapper || null);

                    const cleanedText = cleanText(data.prompt || "");
                    setAnalysisText(data.prompt);

                    const rowsArray = normalizeFieldMappings(
                        extractMapperFields(data?.mapper)
                    );

                    setMapperRows(rowsArray);
                    setProcessingProgress(100);
                    stopProgress();
                    setStage("completed");
                    clearInterval(interval);
                }

            } catch (error) {
                console.error("[UI] Polling error:", error);
            }
        }, 2000);
    };


    /* ================= ACCEPT ================= */
    const acceptAnalysis = async () => {
        console.log("[UI] Accepting analysis");

        stopProgress();
        setStage("processing");
        setEventLogs([]);
        setProcessingProgress(5);

        let progress = 5;
        progressIntervalRef.current = setInterval(() => {
            progress += 0.3;
            if (progress >= 90) progress = 70;
            setProcessingProgress(progress);
        }, 80);
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

        stopProgress();

        // ✅ REQUIRED: switch UI to processing
        setStage("processing");
        setEventLogs([]);

        setProcessingProgress(5);

        let progress = 5;
        progressIntervalRef.current = setInterval(() => {
            progress += 0.3;
            if (progress >= 90) progress = 70;
            setProcessingProgress(progress);
        }, 80);

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
        stopProgress();
        setStage("idle");
        setShowUploadSection(true);
        setMapperRows([]);
        setAnalysisText("");
        setFeedbackText("");
        setSessionId(null);
    };
    const saveTemplate = async () => {
        if (isSaving) return;
        setIsSaving(true);

        try {
            const formData = new FormData();

            formData.append("organizationId", organizationId);
            formData.append("domain", domain);
            formData.append("userEmail", userEmail);
            formData.append("prompt", rawPrompt);
            const updatedMapper = {
                mapper: {
                    field_mappings: mapperRows.reduce((acc, row) => {
                        if (!row.template_field) return acc;

                        acc[row.template_field] = {
                            source: row.source,
                            type: row.type,
                            required: !!row.required
                        };

                        return acc;
                    }, {})
                }
            };

            formData.append("mappings", JSON.stringify(updatedMapper));

            formData.append("sessionId", sessionId);

            // ✅ MAIN TEMPLATE
            if (templateFile) {
                formData.append("template", templateFile);
            }

            // ✅ SAMPLE FILES (MULTIPLE)
            sampleFiles.forEach((file) => {
                formData.append("samples", file);
            });

            const url = editingTemplateId
                ? `${API_BASE}/api/voiceModuleTemplate/${editingTemplateId}`
                : `${API_BASE}/api/voiceModuleTemplate`;

            const method = editingTemplateId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                body: formData // ❗ NO headers
            });

            const data = await res.json();
            if (!data.success) throw new Error("Save failed");

            resetToTemplateList();
            fetchTemplates();

        } catch (err) {
            console.error("[UI][SAVE] Failed", err);
            alert("Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };


    // const saveTemplate = async () => {
    //     if (isSaving) return;

    //     console.log("[UI][SAVE] Saving template");
    //     console.log("[UI][SAVE] RAW PROMPT:", rawPrompt);
    //     console.log("[UI][SAVE] RAW MAPPER:", rawMapper);

    //     setIsSaving(true);

    //     const payload = {
    //         organizationId: organizationId,
    //         domain: domain,
    //         userEmail: userEmail,

    //         // 🔐 SOURCE OF TRUTH
    //         prompt: rawPrompt,
    //         mappings: rawMapper,

    //         // UI helpers (optional, future use)
    //         uiPromptPreview: analysisText,
    //         uiMappings: mapperRows,

    //         sessionId
    //     };

    //     try {
    //         const url = editingTemplateId
    //             ? `${API_BASE}/api/voiceModuleTemplate/${editingTemplateId}`
    //             : `${API_BASE}/api/voiceModuleTemplate`;

    //         const method = editingTemplateId ? "PUT" : "POST";

    //         const res = await fetch(url, {
    //             method,
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify(payload)
    //         });

    //         const data = await res.json();

    //         console.log("[UI][SAVE] Response:", data);

    //         if (!data.success) {
    //             setIsSaving(false);
    //             return;
    //         }

    //         setEditingTemplateId(null);
    //         resetToTemplateList();
    //         fetchTemplates();

    //     } catch (err) {
    //         console.error("[UI][SAVE] Save failed", err);
    //     } finally {
    //         setIsSaving(false);
    //     }
    // };



    // Reset view when role changes
    useEffect(() => {
        if (role === "Admin") {
            setShowUploadSection(true);
            setStage("idle");
            setCurrentStep(1);
        }
    }, [role]);
    const handleStaffTemplateSelect = (tpl) => {
        console.log("[STAFF] Selected template:", tpl.id);

        // 🔐 RAW — Python ke liye
        setSelectedTemplate({
            ...tpl,
            prompt: tpl.prompt,
            mapper: tpl.mappings
        });

        // 🎨 UI
        const cleanedText = cleanText(tpl.prompt || "");
        setAnalysisText(tpl.prompt);

        const rowsArray = normalizeFieldMappings(
            extractMapperFields(tpl.mapper)
        );

        setMapperRows(rowsArray);
    };

    console.log("selectedTemplate?.mappings", selectedTemplate?.mappings)
    // console.log(analysisText)
    console.log(mapperRows)
    const downloadBase64File = (base64, filename) => {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        const blob = new Blob([byteArray], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();

        link.remove();
        URL.revokeObjectURL(url);
    };

    const submitToDocumentFiller = async () => {
        if (!selectedTemplate) {
            alert("Please select a template");
            return;
        }

        try {
            setIsGenerating(true); // 🔥 START LOADING

            const formData = new FormData();
            // 🔥 TEMPLATE FROM BLOB METADATA
            formData.append("templateBlobName", selectedTemplate.templateBlobName);
            formData.append("templateMimeType", selectedTemplate.templateMimeType);
            formData.append("templateOriginalName", selectedTemplate.templateOriginalName);

            // 🔥 SAMPLE BLOBS (ARRAY OR EMPTY)
            formData.append(
                "sampleBlobs",
                JSON.stringify(selectedTemplate.sampleBlobs || [])
            );
            console.log("[STAFF][DOC] Using RAW prompt:", selectedTemplate.prompt);
            console.log("[STAFF][DOC] Using RAW mapper:", selectedTemplate.mappings);

            formData.append("prompt", selectedTemplate.prompt);
            const parsedJson = JSON.parse(selectedTemplate.mappings);
            console.log("parsedJson (raw)", parsedJson);

            // 🔥 normalize mapper here
            const normalizedMapper = {
                ...parsedJson,
                mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper
            };

            console.log("parsedJson (normalized)", normalizedMapper);

            formData.append(
                "mapper",
                JSON.stringify(normalizedMapper)
            );

            if (transcriptData?.text) {
                formData.append("transcript_data", transcriptData.text);
            } else if (uploadedTranscriptFile) {
                // ✅ NEW (FORCE FILE MODE)
                formData.append(
                    "transcript_data",
                    uploadedTranscriptFile,
                    uploadedTranscriptFile.name
                );

            }

            const res = await fetch(`${API_BASE}/api/document-filler`, {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            console.log("data in submitToDocumentFiller", data)
            if (data.success && data.filled_document) {
                downloadBase64File(
                    data.filled_document,
                    "Generated_Document.docx"
                );
            }
            // window.open(data.filled_document, "_blank");

        } catch (err) {
            console.error("Document generation failed", err);
            alert("Failed to generate document");
        } finally {
            setIsGenerating(false); // 🔥 STOP LOADING
            setTranscribing(false);
        }
    };
    const CARDS_PER_VIEW = 2;

    const canGoPrev = templateIndex > 0;
    const canGoNext = templateIndex + CARDS_PER_VIEW < templates.length;

    const handlePrev = () => {
        if (canGoPrev) setTemplateIndex(prev => prev - 1);
    };

    const handleNext = () => {
        if (canGoNext) setTemplateIndex(prev => prev + 1);
    };
    const sections = parseVoiceExplanation(analysisText);

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
                        <option value="Staff">Staff</option>
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
            {/* {role === "Staff" && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px 10px 20px", width: "161px", height: "41px", marginLeft: "auto" }}>
                    <button
                        className="staff-template-btn"
                        onClick={() => setShowTemplateDrawer(true)}
                    >
                        <img src={careVoiceStaffTemplateIcon} alt="templates" style={{ width: "24px", height: "24px" }} />
                        Templates
                    </button>
                </div>

            )} */}
            {role === "Staff" && staffStep === "landing" && (
                <div style={{ textAlign: "center", marginTop: "80px" }}>
                    <h2 style={{ fontWeight: 600 }}>
                        Select A Template To Populate
                    </h2>

                    <button
                        className="staff-primary"
                        style={{ margin: "auto" }}
                        onClick={() => setStaffStep("selectTemplate")}
                    >
                        <img src={careVoiceStaffTemplateIcon} width={16} style={{ filter: "brightness(0) invert(1)" }} />
                        Select Template
                    </button>
                </div>
            )}

            {/* ================= ADMIN VIEW ================= */}
            {role === "Admin" && (
                <>
                    {role === "Admin" && activeTemplate && (
                        <div className="vm-template-details">

                            {/* BACK */}
                            <div
                                className="vm-back"
                                style={{ cursor: "pointer", marginBottom: "35px", display: "flex", fontSize: "14px", color: "#6C4CDC", alignItems: "center", gap: "2px" }}
                                onClick={() => setActiveTemplate(null)}
                            >
                                <GoArrowLeft size={22} color="#6C4CDC" /> Back
                            </div>

                            {/* UPLOADED DOCUMENTS */}
                            <div className="vm-uploaded-docs">
                                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                    <img
                                        src={careVoiceTemplateViewDoc}
                                        alt="doc"
                                        style={{ width: "24px", height: "24px", marginBottom: "8px" }}
                                    />
                                    <h4 style={{ marginTop: "2px" }}>Uploaded Documents</h4>

                                </div>
                                <div className="vm-file-list" style={{ display: "flex", gap: "10px" }}>
                                    <div className="vm-file-item" style={{ width: "435px", height: "78px" }}>
                                        <div className="vm-file-left" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                                            {/* DOC ICON ADD HERE */}
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <img
                                                    src={careVoiceDocIcon}
                                                    alt="doc"
                                                    style={{ width: "24px", height: "24px", marginBottom: "8px" }}
                                                />
                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                    <div className="vm-file-name">
                                                        Template Structure
                                                    </div>
                                                    <div className="vm-file-status">
                                                        {activeTemplate.templateOriginalName}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTemplate.sampleBlobs?.map((file, i) => {
                                        // Check file extension for icon
                                        const fileExt = file.originalName?.split('.').pop()?.toLowerCase();
                                        const isPDF = fileExt === 'pdf';

                                        return (
                                            <div key={i} className="vm-file-item" style={{ width: "435px", height: "78px" }}>
                                                <div className="vm-file-left" style={{ flexDirection: "column", alignItems: "flex-start" }}>
                                                    {/* PDF/DOC ICON BASED ON FILE TYPE */}
                                                    <div style={{ display: "flex", gap: "10px" }}>
                                                        <img
                                                            src={isPDF ? careVoicePdfIcon : careVoiceDocIcon}
                                                            alt={isPDF ? "pdf" : "doc"}
                                                            style={{ width: "24px", height: "24px", marginBottom: "8px" }}
                                                        />
                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                            <div className="vm-file-name">
                                                                Sample Document
                                                            </div>
                                                            <div className="vm-file-status">
                                                                {file.originalName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* AI RESPONSE ACCORDION */}
                            <AccordionHeader
                                icon={TlcPayrollInsightIcon}
                                title="AI Response"
                                subtitle="You requested two changes"
                                isOpen={templateAccordions.aiResponse}
                                onClick={() =>
                                    setTemplateAccordions(prev => ({
                                        ...prev,
                                        aiResponse: !prev.aiResponse
                                    }))
                                }
                            />

                            {templateAccordions.aiResponse && (
                                <div className="analysis-box">
                                    {parseVoiceExplanation(activeTemplate.prompt).map(section => (
                                        <div key={section.id} className="voice-explanation-section">
                                            <h4>{cleanPromptText(section.title)}</h4>
                                            <div style={{
                                                whiteSpace: 'pre-wrap',
                                                fontFamily: 'monospace',
                                                fontSize: '13px',
                                                lineHeight: '1.5'
                                            }}>
                                                {cleanPromptText(section.content)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* GENERATED TEMPLATE ACCORDION */}
                            <AccordionHeader
                                icon={AdminTemplateViewIcon}
                                title="Generated Template"
                                subtitle={`${mapperRows.length} fields generated`}
                                isOpen={templateAccordions.generatedTemplate}
                                onClick={() =>
                                    setTemplateAccordions(prev => ({
                                        ...prev,
                                        generatedTemplate: !prev.generatedTemplate
                                    }))
                                }
                            />

                            {templateAccordions.generatedTemplate && (
                                <MapperGrid rows={mapperRows} readOnly={mapperMode === "view"} />
                            )}
                        </div>
                    )}

                    {/* ================= TEMPLATE LIST ================= */}
                    {stage === "idle" && !activeTemplate && (
                        <div className="vm-template-list">
                            <div className="vm-template-header">
                                <div className="vm-template-list-title">
                                    Available Template
                                </div>

                                {templates.length > CARDS_PER_VIEW && (
                                    <div className="vm-template-header-arrows">
                                        <button
                                            className="vm-slider-arrow"
                                            onClick={handlePrev}
                                            disabled={!canGoPrev}
                                        >
                                            <img src={careVoiceLeft} alt="prev" />
                                        </button>

                                        <button
                                            className="vm-slider-arrow"
                                            onClick={handleNext}
                                            disabled={!canGoNext}
                                        >
                                            <img src={careVoiceRight} alt="next" />
                                        </button>
                                    </div>
                                )}
                            </div>


                            {/* ✅ EMPTY STATE */}
                            {templates.length === 0 && (
                                <div className="vm-template-empty">
                                    No templates available
                                </div>
                            )}

                            <div className="vm-template-slider-wrapper">

                                {/* SLIDER WINDOW */}
                                <div className="vm-template-slider">
                                    <div
                                        className="vm-template-track"
                                        style={{
                                            transform: `translateX(-${templateIndex * (100 / CARDS_PER_VIEW)}%)`
                                        }}
                                    >
                                        {templates.map((tpl, index) => (
                                            <div key={tpl.id} className="vm-template-slide">
                                                <div className="vm-template-card" onClick={() => {
                                                    if (openMenuId) return;
                                                    setActiveTemplate(tpl);
                                                    setMapperMode("view");
                                                    // 🔥 extract mappings from template
                                                    const parsedMappings =
                                                        typeof tpl.mappings === "string"
                                                            ? JSON.parse(tpl.mappings)
                                                            : tpl.mappings;

                                                    const rowsArray = normalizeFieldMappings(
                                                        extractMapperFields(parsedMappings)
                                                    );

                                                    setMapperRows(rowsArray);
                                                }}>
                                                    <div className="vm-template-left">
                                                        <div className="vm-template-icon">
                                                            <img src={templateIcon} alt="template" />
                                                        </div>

                                                        <div className="vm-template-info">
                                                            {/* ===== TOP ROW (NAME + DOTS) ===== */}
                                                            <div className="vm-template-top-row">
                                                                {/* LEFT : NAME */}
                                                                <div className="vm-template-name">
                                                                    {editingNameId === tpl.id ? (
                                                                        <div className="vm-template-rename-row">
                                                                            <input
                                                                                className="vm-template-name-input"
                                                                                value={tempName}
                                                                                autoFocus
                                                                                onChange={(e) => setTempName(e.target.value)}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Escape") {
                                                                                        setEditingNameId(null);
                                                                                        setTempName(tpl.templateName || "");
                                                                                    }
                                                                                }}
                                                                            />

                                                                            <button
                                                                                className="vm-rename-yes"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    saveTemplateName(tpl.id);
                                                                                }}
                                                                            >
                                                                                <FiCheck size={14} strokeWidth={3} />
                                                                            </button>

                                                                            <button
                                                                                className="vm-rename-no"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingNameId(null);
                                                                                    setTempName(tpl.templateName || "");
                                                                                }}
                                                                            >
                                                                                <FiX size={14} strokeWidth={3} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <span className="vm-template-name-text">
                                                                                {tpl.templateName || `Voice Template ${index + 1}`}
                                                                            </span>

                                                                            <span
                                                                                className="vm-template-edit-icon"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingNameId(tpl.id);
                                                                                    setTempName(tpl.templateName || "");
                                                                                }}
                                                                            >
                                                                                <FiEdit size={14} />
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* RIGHT : DOTS */}
                                                                <div className="vm-template-actions">
                                                                    <span
                                                                        className="vm-dots"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(openMenuId === tpl.id ? null : tpl.id);
                                                                        }}
                                                                    >
                                                                        ⋮
                                                                    </span>

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

                                                            {/* DATE */}
                                                            <div className="vm-template-date">
                                                                ⏱ {timeAgo(tpl.createdAt)}
                                                            </div>

                                                        </div>
                                                    </div>

                                                    <div className="vm-template-right">
                                                        <button className="vm-share-btn">
                                                            <img src={careVoiceShare} alt="share" />
                                                            Share Template
                                                        </button>

                                                        {/* <span
                                                            className="vm-dots"
                                                            onClick={() =>
                                                                setOpenMenuId(openMenuId === tpl.id ? null : tpl.id)
                                                            }
                                                        >
                                                            ⋮
                                                        </span>

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
                                                        )} */}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                        </div>
                    )}


                    {/* Upload Section - Hidden when analyze clicked OR during processing */}

                    {showUploadSection && stage !== "processing" && !activeTemplate && (
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

                                            {/* <button className="voice-browse-btn">
                                                Browse Files
                                            </button> */}
                                        </div>
                                    )}


                                    {templateFile && (
                                        <div className="vm-file-list">
                                            <div className="vm-file-item vm-file-item-uploaded">
                                                <div className="vm-file-left">
                                                    <div className="vm-file-icon">📄</div>

                                                    <div>
                                                        <div className="vm-file-name">
                                                            {templateFile.name}
                                                        </div>
                                                        <div className="vm-file-status">
                                                            Uploaded • 100%
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="vm-file-actions">
                                                    <span className="vm-file-check">✓</span>
                                                    <RiDeleteBin6Line
                                                        className="vm-file-delete"
                                                        onClick={() => setTemplateFile(null)}
                                                    />
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

                                            {/* <button className="voice-browse-btn">
                                                Browse Files
                                            </button> */}
                                        </div>
                                    )}

                                    {sampleFiles.length > 0 && (
                                        <div className="vm-file-list">
                                            {sampleFiles.map((file, index) => (
                                                <div key={index} className="vm-file-item vm-file-item-uploaded">
                                                    <div className="vm-file-left">
                                                        <div className="vm-file-icon">📄</div>

                                                        <div>
                                                            <div className="vm-file-name">
                                                                {file.name}
                                                            </div>
                                                            <div className="vm-file-status">
                                                                Uploaded • 100%
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="vm-file-actions">
                                                        <span className="vm-file-check">✓</span>

                                                        <RiDeleteBin6Line
                                                            className="vm-file-delete"
                                                            onClick={() => {
                                                                console.log("[UI] Sample removed:", file.name);
                                                                setSampleFiles(prev =>
                                                                    prev.filter((_, i) => i !== index)
                                                                );
                                                            }}
                                                        />
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
                        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
                            <PulsatingLoader
                                currentTask={currentTask || "Processing document"}
                                progress={processingProgress}
                            />
                        </div>
                    )}


                    {/* Review Section */}
                    {stage === "review" && (
                        <div className="analysis-review-container">

                            {/* ===== ACTION BUTTONS (TOP) ===== */}
                            <div className="analysis-actions" style={{ marginBottom: "16px" }}>
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

                            {/* ===== ANALYSIS CONTENT ===== */}
                            <div className="analysis-box">
                                {sections.map(section => (
                                    <div key={section.id} className="voice-explanation-section">
                                        <h4 className="voice-explanation-title">
                                            {cleanText(section.title)}
                                        </h4>

                                        <div className="voice-explanation-content">
                                            {cleanText(section.content)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ===== FEEDBACK BOX ===== */}
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

                        </div>
                    )}


                    {/* Completed */}
                    {stage === "completed" && (
                        <div className="analysis-completed">
                            <div style={{ marginTop: "20px", textAlign: "right" }}>
                                <button
                                    className="analysis-accept-btn"
                                    onClick={saveTemplate}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Template"}
                                </button>

                            </div>
                            <MapperGrid
                                rows={mapperRows}
                                setRows={setMapperRows}
                                readOnly={mapperMode === "view"}
                            />

                        </div>
                    )}
                </>
            )}

            {/* ================= STAFF VIEW ================= */}
            {role === "Staff" && staffStep === "working" && (
                <>
                    <div
                        style={{
                            position: "relative",          // ✅ anchor for absolute child
                            display: "flex",
                            justifyContent: "center",       // ✅ real centering
                            alignItems: "center",
                            padding: "24px 32px",
                        }}
                    >
                        {/* LEFT */}
                        <div style={{ textAlign: "center" }}>
                            <h2 style={{ margin: 0, fontWeight: 600 }}>
                                Record Conversation
                            </h2>
                            <p style={{ marginTop: "6px", color: "#6b7280" }}>
                                Start recording to fill your selected template
                            </p>
                        </div>

                        {/* RIGHT */}
                        {selectedTemplate && (
                            <div
                                style={{
                                    position: "absolute",
                                    right: "32px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "10px 16px",
                                    borderRadius: "999px",
                                    border: "1px solid #E5E7EB",
                                    background: "#FFFFFF",
                                }}
                            >
                                {/* LEFT DOC ICON */}
                                <img
                                    src={careVoiceStaffTemplateIcon}
                                    alt="doc"
                                    style={{ width: "20px", height: "20px" }}
                                />

                                {/* BLUE SELECTED PILL */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        background: "#3B82F6",
                                        color: "#FFFFFF",
                                        padding: "6px 12px",
                                        borderRadius: "999px",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                    }}
                                >
                                    {/* CHECK */}
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "18px",
                                            height: "18px",
                                            borderRadius: "50%",
                                            background: "#FFFFFF",
                                            color: "#3B82F6",
                                            fontSize: "12px",
                                            fontWeight: 700,
                                        }}
                                    >
                                        ✓
                                    </span>

                                    Selected

                                    {/* COUNT */}
                                    <span
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "22px",
                                            height: "22px",
                                            borderRadius: "50%",
                                            background: "#FFFFFF",
                                            color: "#3B82F6",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                        }}
                                    >
                                        1
                                    </span>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="staff-recorder">

                        {/* ===== REAL AUDIO PLAYER ===== */}
                        <audio ref={audioRef} src={audioURL} />

                        {/* ===== TIMER CIRCLE ===== */}
                        {(recordMode === "idle" || recordMode === "recording") && (
                            <div className="staff-rec-circle">
                                <span>{formatTime(recordTime)}</span>
                            </div>
                        )}


                        {/* ===== AUDIO PREVIEW (PAUSED / PREVIEW) ===== */}
                        {(recordMode === "paused" || recordMode === "preview") && audioURL && (
                            <div className="staff-audio-preview-wrapper">

                                {/* PLAY / PAUSE ICON */}
                                <button
                                    className="staff-play-circle"
                                    onClick={togglePlayAudio}
                                >
                                    <img
                                        src={isPlaying ? careVoicePause : careVoicePlay}
                                        alt="play-pause"
                                        style={{ width: "20px", height: "20px" }}
                                    />
                                </button>

                                {/* WAVE ICON */}
                                <div className="staff-wave-container">
                                    <img
                                        src={careVoiceWave}
                                        className={`staff-wave-small ${isPlaying ? "playing" : ""}`}
                                        alt="wave"
                                    />

                                </div>

                                {/* TIME */}
                                <span className="staff-audio-time">
                                    {formatTime(playTime)}
                                </span>
                            </div>
                        )}

                        {/* ===== ACTION BUTTONS (ALL ICONS INTACT) ===== */}
                        <div className="staff-rec-actions">

                            {recordMode === "idle" && (
                                <button className="staff-primary" onClick={startRecording}>
                                    <img src={recordIcon} width={16} />
                                    Start Recording
                                </button>
                            )}

                            {recordMode === "recording" && (
                                <>
                                    <button className="staff-outline" onClick={pauseRecording}>
                                        <img src={careVoicePause} width={16} />
                                        Pause
                                    </button>

                                    <button className="staff-primary" onClick={stopRecording}>
                                        <img src={careVoiceEndAndPreview} width={16} />
                                        End & Preview
                                    </button>
                                </>
                            )}

                            {recordMode === "paused" && (
                                <>
                                    <button className="staff-outline" onClick={resumeRecording}>
                                        <img src={careVoicePlay} width={16} />
                                        Resume
                                    </button>

                                    <button className="staff-primary" onClick={stopRecording}>
                                        <img src={careVoiceEndAndPreview} width={16} />
                                        End & Preview
                                    </button>
                                </>
                            )}

                            {recordMode === "preview" && (
                                <>
                                    <button className="staff-outline" onClick={discardRecording}>
                                        ✕ Discard
                                    </button>

                                    <button
                                        className="staff-primary"
                                        onClick={acceptRecording}
                                        disabled={transcribing || isGenerating}
                                    >
                                        {transcribing
                                            ? "Transcribing..."
                                            : isGenerating
                                                ? "Generating..."
                                                : "✓ Submit"}
                                    </button>
                                </>
                            )}

                        </div>
                    </div>




                    {/* ===== OR ===== */}
                    <div className="voice-or-row">
                        <span className="voice-or-line" />
                        <span className="voice-or-text">Or</span>
                        <span className="voice-or-line" />
                    </div>

                    {/* ===== UPLOAD TRANSCRIPT ===== */}
                    {/* ===== UPLOAD TRANSCRIPT (FINAL – SINGLE SOURCE) ===== */}
                    <div className="voice-upload-col">
                        <div className="voice-title">Upload Transcript</div>

                        <div className="voice-subtext">
                            Upload single transcript or folder of transcripts
                        </div>

                        {/* Upload box */}
                        {!uploadedTranscriptFile && (
                            <div
                                className="voice-upload-box"
                                onClick={() => document.getElementById("staff-transcript").click()}
                            >
                                <input
                                    id="staff-transcript"
                                    type="file"
                                    accept=".doc,.pdf,.txt"
                                    hidden
                                    onChange={(e) => {
                                        setUploadedTranscriptFile(e.target.files[0]);
                                        setTranscriptSource("file");
                                    }}
                                />

                                <FiUploadCloud className="voice-icon" />
                                <div className="voice-text">Drop file or browse</div>
                                <div className="voice-subtext">Format: .doc or .pdf only</div>
                                {/* <button className="voice-browse-btn">Browse Files</button> */}
                            </div>
                        )}

                        {/* FILE PREVIEW */}
                        {uploadedTranscriptFile && (
                            <div className="vm-file-list" style={{ marginTop: "12px" }}>
                                <div className="vm-file-item vm-file-item-uploaded">
                                    <div className="vm-file-left">
                                        <div className="vm-file-icon">📄</div>

                                        <div>
                                            <div className="vm-file-name">
                                                {uploadedTranscriptFile.name}
                                            </div>
                                            <div className="vm-file-status">
                                                Uploaded • 100%
                                            </div>
                                        </div>
                                    </div>

                                    <div className="vm-file-actions">
                                        <span className="vm-file-check">✓</span>

                                        <RiDeleteBin6Line
                                            className="vm-file-delete"
                                            onClick={() => {
                                                setUploadedTranscriptFile(null);
                                                setTranscriptSource(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                        )}

                        {/* Generate Document */}
                        <div style={{ textAlign: "right", marginTop: "24px" }}>
                            <button
                                className="staff-primary"
                                onClick={submitToDocumentFiller}
                                disabled={
                                    isGenerating ||
                                    !selectedTemplate ||
                                    (!transcriptData && !uploadedTranscriptFile)
                                }
                            >
                                {isGenerating ? "Generating..." : "✓ Generate Document"}
                            </button>

                        </div>
                    </div>


                </>
            )}
            {role === "Staff" && staffStep === "selectTemplate" && (
                <div className="vm-confirm-overlay">
                    <div className="vm-select-confirm-modal template-select-modal">

                        {/* HEADER */}
                        <div className="template-select-header">
                            <div style={{ display: "flex", alignItems: "center", gap: "529px", height: "56px", margin: "10px" }}>
                                <div style={{ textAlign: "left", width: "294px", height: "56px" }}>
                                    <h3>Available Templates</h3>
                                    <p>Select a template organized by your admin</p>
                                </div>
                                <img src={careVoiceCross} style={{ width: "24px", height: "24px", cursor: "pointer" }} onClick={() => setStaffStep("landing")} />
                            </div>
                        </div>
                        <div style={{ height: "1px", width: "860px", border: "1px solid #E6E6E6", color: "black", background: "black", marginBottom: "20px" }}></div>

                        {templates?.length > 0 &&
                            <button
                                className="template-select-confirm"
                                disabled={!selectedTemplate}
                                onClick={() => setStaffStep("working")}
                            >
                                ✓ Choose Template
                                {selectedTemplate && <span className="template-count">1</span>}
                            </button>
                        }

                        {/* TEMPLATE LIST */}
                        <div className="template-select-list">

                            {templates.length === 0 ? (
                                <div className="template-empty-center">
                                    <img
                                        src={careVoiceStaffTemplateIcon}
                                        alt="no-templates"
                                        className="template-empty-icon"
                                    />

                                    <div className="template-empty-text">
                                        No Templates Found!
                                    </div>
                                </div>
                            ) : (
                                /* ================= TEMPLATE LIST ================= */
                                templates.map((tpl) => {
                                    console.log("tpl", tpl)
                                    const isSelected = selectedTemplate?.id === tpl.id;

                                    return (
                                        <div
                                            key={tpl.id}
                                            className={`template-select-card ${isSelected ? "active" : ""}`}
                                            onClick={() => handleStaffTemplateSelect(tpl)}
                                        >
                                            <input type="checkbox" checked={isSelected} readOnly />

                                            <img src={templateIcon} className="template-select-icon" />

                                            <div className="template-select-info">
                                                <div className="template-select-name">
                                                    {tpl.templateName || "Voice Template"}
                                                </div>
                                                <div className="template-select-date">
                                                    ⏱ {timeAgo(tpl.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                        </div>


                    </div>
                </div>
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
            {/* ================= STAFF TEMPLATE DRAWER ================= */}
            {/* {role === "Staff" && showTemplateDrawer && (
                <div className="staff-template-overlay">
                    <div className="staff-template-drawer">
                        <div className="staff-template-header">
                            <span>Templates</span>
                            <button onClick={() => setShowTemplateDrawer(false)} style={{ width: "32px" }}>✕</button>
                        </div>

                        <div className="staff-template-list">
                            {templates.map((tpl, index) => (
                                <div
                                    key={tpl.id}
                                    className={`staff-template-item ${selectedTemplate?.id === tpl.id ? "active" : ""
                                        }`}
                                    onClick={() => handleStaffTemplateSelect(tpl)}
                                >
                                    <div className="staff-template-icon">
                                        <img src={templateIcon} alt="tpl" style={{ width: "16px", height: "16px" }} />
                                    </div>

                                    <div className="staff-template-info">
                                        <div className="staff-template-name">
                                            {tpl.name || `Voice Template ${index + 1}`}
                                        </div>
                                        <div className="staff-template-date">
                                            ⏱ {timeAgo(tpl.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )} */}

        </div>
    );
};

export default VoiceModule;     