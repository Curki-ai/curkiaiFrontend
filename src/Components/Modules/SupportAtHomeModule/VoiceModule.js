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
    // STAFF RECORDER STATE
    const [recordMode, setRecordMode] = useState("idle");

    // STAFF TEMPLATE DRAWER
    const [showTemplateDrawer, setShowTemplateDrawer] = useState(false);
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
                console.log("FINAL TRANSCRIPT:", data);
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
        } finally {
            setTranscribing(false);
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
        console.log("template", template);
        console.log("[UI][EDIT] Editing template", template.id);

        // 🔐 RAW SOURCE (FROM DB)
        setRawPrompt(template.prompt || "");
        setRawMapper(template.mappings || null);   // ✅ FIX

        // 🎨 UI
        const cleanedText = cleanText(template.prompt || "");
        setAnalysisText(cleanedText);

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

                    console.log("[UI][FINAL_RESULT] Raw prompt from AI:", data.prompt);
                    console.log("[UI][FINAL_RESULT] Raw mapper from AI:", data.mapper);
                    console.log("[UI][FINAL_RESULT] Raw mapper from AI 2:", data.mapper.mapper);

                    // 🔐 RAW — SOURCE OF TRUTH
                    setRawPrompt(data.prompt || "");
                    setRawMapper(data?.mapper || data?.mapper?.mapper || null);

                    // 🎨 UI ONLY — cleaned prompt
                    const cleanedText = cleanText(data.prompt || "");
                    setAnalysisText(cleanedText);

                    // 🎨 UI ONLY — normalized mapper for grid
                    const rowsArray = normalizeFieldMappings(
                        extractMapperFields(data?.mapper)
                    );

                    console.log("[UI][FINAL_RESULT] Normalized mapper rows for UI:", rowsArray);

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
        setAnalysisText(cleanedText);

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
        }
    };


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
            {role === "Staff" && (
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "10px 20px 10px 20px", width: "161px", height: "41px", marginLeft: "auto" }}>
                    <button
                        className="staff-template-btn"
                        onClick={() => setShowTemplateDrawer(true)}
                    >
                        <img src={careVoiceStaffTemplateIcon} alt="templates" style={{ width: "24px", height: "24px" }} />
                        Templates
                    </button>
                </div>
            )}

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
                            {templates.map((tpl, index) => (
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
                                        disabled={transcribing}
                                    >
                                        {transcribing ? "Transcribing..." : "✓ Submit"}
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
                                <button className="voice-browse-btn">Browse Files</button>
                            </div>
                        )}

                        {/* FILE PREVIEW */}
                        {uploadedTranscriptFile && (
                            <div className="vm-file-list" style={{ marginTop: "12px" }}>
                                <div className="vm-file-item">
                                    <div className="vm-file-left">
                                        <div className="vm-file-name">
                                            {uploadedTranscriptFile.name}
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
                                                setUploadedTranscriptFile(null);
                                                setTranscriptSource(null);
                                            }}
                                        >
                                            <FiX />
                                        </span>
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
            {role === "Staff" && showTemplateDrawer && (
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
            )}

        </div>
    );
};

export default VoiceModule;     