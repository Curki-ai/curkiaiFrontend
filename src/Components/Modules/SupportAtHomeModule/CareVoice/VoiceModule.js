import React, { useState, useEffect, useRef } from "react";
import star from "../../../../Images/star.png";
import "../../../../Styles/SupportAtHomeModule/CareVoice/VoiceModule.css";
import voiceRoleIcon from "../../../../Images/VoiceRoleIcon.png";
import voiceMailIcon from "../../../../Images/VoiceMailIcon.png";
import voiceNameIcon from "../../../../Images/VoiceNameIcon.png";
import recordIcon from "../../../../Images/voiceModuleRecord.png";
import templateIcon from "../../../../Images/voiceModuleTemplateIcon.png";
import careVoiceEdit from "../../../../Images/careVoiceEditTemplate.png";
import careVoiceDelete from "../../../../Images/careVoiceDeleteTemplate.png"
import careVoiceShare from "../../../../Images/careVoiceShare.png"
import careVoiceWave from "../../../../Images/careVoiceWave.png"
import careVoicePlay from "../../../../Images/careVoicePlay.png"
import careVoicePause from "../../../../Images/careVoicePause.png"
import careVoiceEndAndPreview from "../../../../Images/careVoiceEndAndPreview.png"
import careVoiceStaffTemplateIcon from "../../../../Images/careVoiceStaffTemplateIcon.png"
import careVoiceLeft from "../../../../Images/careVoiceLeft.png"
import careVoiceRight from "../../../../Images/careVoiceRight.png"
import { FiDownload, FiFileText, FiMail, FiUploadCloud } from "react-icons/fi";
import MapperGrid from "./VoiceModuleMapper";
import { RiDeleteBin6Line } from "react-icons/ri";
import PulsatingLoader from "../../../general-components/PulsatingLoader";
import FinancialAnalysisReportViewer from "../../FinancialModule/FinancialAnalysisReportViewer";
import { parseVoiceExplanation } from "./ParseVoiceExplanation";
import TlcPayrollDownArrow from "../../../../Images/tlc_payroll_down_button.png"
import careVoiceDocIcon from "../../../../Images/careVoiceDocIcon.png"
import careVoicePdfIcon from "../../../../Images/careVoicePdfIcon.png"
import careVoiceTemplateViewDoc from "../../../../Images/careVoiceTemplateViewDoc.png"
import TlcPayrollInsightIcon from "../../../../Images/TlcPayrollinsightIcon.png";
import AdminTemplateViewIcon from "../../../../Images/AdminTemplateViewTable.png"
import careVoiceTimeIcon from "../../../../Images/careVoiceTimeIcon.svg";
import careVoiceSelectTemplateIcon from "../../../../Images/careVoiceSelectTemplateIcon.svg"
import careVoiceCross from "../../../../Images/careVoiceCross.png"
import { GoArrowLeft } from "react-icons/go";
import { FiEdit } from "react-icons/fi";
import { FiCheck, FiX } from "react-icons/fi";
import { GoPencil } from "react-icons/go";
import TlcUploadBox from "../../FinancialModule/Tlc/TlcUploadBox";
import CareVoiceExplainationMarkdown from "./CareVoiceExplainationMarkdown";
import { mapperToRows } from "./carevoiceMapperObject";
import FieldMapperPro from "./CareVoiceJsonGrid";
import MultiSelectCustom from "../../FinancialModule/MultiSelectCustom"
import PromptBlockEditor from "./PromptBlockEditor";
import incrementAnalysisCount from "../../FinancialModule/Tlc/TLcAnalysisCount";
import { FiMic } from "react-icons/fi";
import { extractAudioFromVideo, getTranscriptTextFromAudioBlob } from "./CareVoiceAudioVideoExtract";
import { Document, Packer, Paragraph, TextRun } from "docx";
import incrementCareVoiceAnalysisCount from "../careVoiceCostAnalysis";
import FilePreviewModal from "./FilePreviewModal";
import docFilePreviewIcon from "../../../../Images/docFilePreviewIcon.svg"
import Lottie from "lottie-react";
import selectTemplateAnimation from "../../../../Images/document.json"
import recordingLottieAnimation from "../../../../Images/recordingAnimation.json";
import beforeRecordingAnimation from "../../../../Images/beforeRecordingAnimation.json"
import { HiOutlineDocumentAdd } from "react-icons/hi";
import generatingDocAnimation from "../../../../Images/generatingDocAnimation.json"
import generatingDocAnimationVideo from "../../../../Images/generatingDocAnimationVideo.mp4"
import { RiSettingsLine } from "react-icons/ri";
import AccessManagementForm from "../../../general-components/AccessManagementForm";
const VoiceModule = (props) => {
    const userEmail = props?.user?.email;
    // const userEmail = "daniel@contemporarycoordination.com";
    // const userEmail = "mboutros@tenderlovingcaredisability.com.au";
    const ALLOWED_USERS = [
        "mboutros@tenderlovingcaredisability.com.au",
        "rjodeh@tenderlovingcaredisability.com.au",
        "ryounes@tenderlovingcaredisability.com.au",
        "stickner@tenderlovingcaredisability.com.au",
        "bastruc@tenderlovingcaredisability.com.au",
        "yzaki@tenderlovingcare.com.au"
    ];
    const isAllowedUsers = ALLOWED_USERS.includes(
        (userEmail || "").toLowerCase()
    );
    const tlcDomainArray = ["tenderlovingcaredisability.com.au", "tenderlovingcare.com.au"]
    const notAllowedDomain = tlcDomainArray.includes(userEmail?.split("@")[1]);

    const setCareVoiceFiles = props?.setCareVoiceFiles;
    const setIsCareVoiceGeneratingDocs = props?.setIsCareVoiceGeneratingDocs;
    const setTotalCareVoiceDocsToGenerate = props?.setTotalCareVoiceDocsToGenerate;
    const setGeneratedCareVoiceDocsCount = props?.setGeneratedCareVoiceDocsCount;
    const setIsCareVoiceLocked = props?.setIsCareVoiceLocked;
    const domain = userEmail?.split("@")[1] || "";

    // console.log("props.careVoiceFiles", props.careVoiceFiles)
    // console.log("userEmail", userEmail)
    // console.log("domain", domain)
    const organizationId = domain;
    const API_BASE = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
    // const API_BASE = "http://localhost:5000";
    const [role, setRole] = useState("Admin");
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [openAccessManagement, setOpenAccessManagement] = useState(false);
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
    const [isRequestingChanges, setIsRequestingChanges] = useState(false);
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
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [isGeneratingFile, setIsGeneratingFile] = useState(false);
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
    const [downloadingFileKey, setDownloadingFileKey] = useState(null);
    const [uploadedTranscriptFiles, setUploadedTranscriptFiles] = useState([]);
    const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0);
    const [dropdownPos, setDropdownPos] = useState(null);
    const [isPromptEditing, setIsPromptEditing] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState("");
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [promptSavedToast, setPromptSavedToast] = useState(false);
    const sliderRef = useRef(null);
    const dropdownRef = useRef(null);
    const [generatedDocs, setGeneratedDocs] = useState([]);
    const emailSentRef = useRef(false);

    const [staffName, setStaffName] = useState("");
    const [staffEmail, setStaffEmail] = useState("");
    const [generationStage, setGenerationStage] = useState(null);
    const [fileStage, setFileStage] = useState(null);
    const [audioProgress, setAudioProgress] = useState(0);
    const [fileProgress, setFileProgress] = useState(0);
    const [clearAudioOnFileUpload, setClearAudioOnFileUpload] = useState(false);
    // Add near other state declarations
    const [docsGeneratedCount, setDocsGeneratedCount] = useState(0);
    const [totalDocsToGenerate, setTotalDocsToGenerate] = useState(0);
    const [showGeneratedFilesUI, setShowGeneratedFilesUI] = useState(false);
    // Add these state variables (around line 100-150)
    const [previewDoc, setPreviewDoc] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [generatedDocsSasUrls, setGeneratedDocsSasUrls] = useState([])
    const [previewIndex, setPreviewIndex] = useState(null);
    const feedbackTextareaRef = useRef(null);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isEmailingDocs, setIsEmailingDocs] = useState(false);
    // Add this useEffect
    useEffect(() => {
        if (showFeedbackBox && feedbackTextareaRef.current) {
            feedbackTextareaRef.current.focus();
        }
    }, [showFeedbackBox]);
    // Add this function to handle file preview
    const handleFilePreview = (doc, index) => {
        setPreviewDoc(doc);
        setPreviewIndex(index);
        setIsPreviewOpen(true);
    };
    useEffect(() => {
        if (!generatedDocs?.length) return;

        const files = generatedDocs.map((doc, index) => {
            const byteCharacters = atob(doc.base64);
            const byteNumbers = new Array(byteCharacters.length)
                .fill(0)
                .map((_, i) => byteCharacters.charCodeAt(i));

            const byteArray = new Uint8Array(byteNumbers);

            return new File(
                [byteArray],
                doc.filename || `doc_${index}.docx`,
                { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }
            );
        });

        // console.log("Sending docs to HomePage:", files);

        setCareVoiceFiles(prev => [
            ...prev,
            ...files
        ]);

    }, [generatedDocs]);
    useEffect(() => {
        if (!uploadedTranscriptFiles?.length) return;

        // console.log("Sending transcripts to HomePage:", uploadedTranscriptFiles);

        setCareVoiceFiles(prev => [
            ...prev,
            ...uploadedTranscriptFiles
        ]);

    }, [uploadedTranscriptFiles]);

    const createTranscriptDoc = async (text, filename) => {
        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "Transcript",
                                    bold: true,
                                    size: 28
                                })
                            ]
                        }),

                        new Paragraph(""), // spacing

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: text,
                                    size: 22
                                })
                            ]
                        })
                    ]
                }
            ]
        });

        const blob = await Packer.toBlob(doc);

        return new File(
            [blob],
            filename || `transcript_${Date.now()}.docx`,
            {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            }
        );
    };
    const downloadRecording = () => {
        if (!audioBlob) return;

        const url = window.URL.createObjectURL(audioBlob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `recording_${Date.now()}.webm`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.URL.revokeObjectURL(url);
    };
    const getPlatformType = () => {
        const ua = navigator.userAgent;

        if (/android/i.test(ua)) return "android";
        if (/iPad|iPhone|iPod/.test(ua)) return "ios";
        if (/Windows/i.test(ua)) return "windows";
        if (/Mac/i.test(ua)) return "mac";
        if (/Linux/i.test(ua)) return "linux";

        return "unknown";
    };

    const platformType = getPlatformType();

    // console.log("Platform type:", platformType);
    const testRecord = false;
    const isVideoFile = (file) =>
        file.type.startsWith("video/");

    const isAudioFile = (file) =>
        file.type.startsWith("audio/");
    const processVoiceRecordingAndroid = async () => {
        try {
            if (!audioBlob) {
                console.log("No audio blob");
                return;
            }

            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");
            formData.append(
                "templates",
                JSON.stringify(selectedTemplate?.templates || [])
            );
            formData.append("userEmail", userEmail || "");
            formData.append("staffEmail", staffEmail || "");
            formData.append("staffName", staffName || "");

            console.log("ANDROID request payload ready");

            setGenerationStage("generating");
            animateProgress(audioProgress, setAudioProgress, 30, 600);

            const res = await fetch(`${API_BASE}/api/process-recording`, {
                method: "POST",
                body: formData
            });

            console.log("ANDROID backend response received");

            animateProgress(30, setAudioProgress, 70, 800);

            const data = await res.json();
            console.log("ANDROID voice response", data);
            if (data?.generatedDocsSasUrls && Array.isArray(data?.generatedDocsSasUrls)) {
                setGeneratedDocsSasUrls(prev => [...prev, ...data?.generatedDocsSasUrls]);
                console.log("SAS URLs collected in Android flow:", data?.generatedDocsSasUrls);
            }

            let documentsGenerated = 0;

            // HANDLE TRANSCRIPTS
            if (data.transcripts?.length) {
                const transcriptFiles = await Promise.all(
                    data.transcripts.map((t, i) =>
                        createTranscriptDoc(
                            t.text,
                            `${t.fileName || "transcript"}_${i}.docx`
                        )
                    )
                );

                // console.log("Transcripts converted:", transcriptFiles);
                documentsGenerated += transcriptFiles.length;

                // Update parent state
                if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(documentsGenerated);
                if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(documentsGenerated);

                setDocsGeneratedCount(documentsGenerated);
                setTotalDocsToGenerate(documentsGenerated);

                setCareVoiceFiles(prev => [
                    ...prev,
                    ...transcriptFiles
                ]);
            }

            if (data.success && data.documents?.length > 0) {
                const generatedFiles = [];
                for (const doc of data.documents) {
                    if (doc.attachment?.data) {
                        // console.log("Downloading buffer document:", doc.filename);
                        const byteArray = new Uint8Array(doc.attachment.data);
                        const blob = new Blob([byteArray], {
                            type: doc.mime || "application/octet-stream"
                        });
                        const blobUrl = window.URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = blobUrl;
                        link.download = doc.filename || "document.docx";
                        document.body.appendChild(link);
                        // link.click();
                        document.body.removeChild(link);
                        window.URL.revokeObjectURL(blobUrl);

                        const file = new File(
                            [blob],
                            doc.filename || "document.docx",
                            {
                                type: doc.mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            }
                        );
                        generatedFiles.push(file);
                        documentsGenerated++;

                        // Update parent state
                        if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(documentsGenerated);
                        if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(documentsGenerated);

                        setDocsGeneratedCount(documentsGenerated);
                        setTotalDocsToGenerate(documentsGenerated);
                    }
                }

                if (generatedFiles.length > 0) {
                    setCareVoiceFiles(prev => [
                        ...prev,
                        ...generatedFiles
                    ]);
                    // console.log("Generated files sent to Ask AI:", generatedFiles);
                }
                // console.log("ANDROID documents downloaded");
                animateProgress(70, setAudioProgress, 100, 500);
            } else {
                // console.log("No documents returned from backend");
            }

        } catch (err) {
            console.error("ANDROID voice processing failed", err);
        } finally {
            // Reset generating flag after a delay

            if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(false);
            if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(0);
            if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(0);
            setDocsGeneratedCount(0);
            setTotalDocsToGenerate(0);

        }
    };
    const openDropdown = (e, tplId) => {
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + 8,
            left: rect.left - 160, // adjust if needed
        });

        setOpenMenuId((prev) => (prev === tplId ? null : tplId));
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            // ✅ if click is inside dropdown, do nothing
            if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;

            // ✅ if click is on dots, do nothing (because dots toggle already handles it)
            if (e.target.closest(".vm-dots")) return;

            // ✅ otherwise close dropdown
            setOpenMenuId(null);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        const handleScroll = () => {
            const card = slider.querySelector(".vm-template-card");
            if (!card) return;

            const cardWidth = card.offsetWidth + 12; // same gap
            const index = Math.floor(
                (slider.scrollLeft + cardWidth / 2) / cardWidth
            );

            setTemplateIndex(index);
        };

        slider.addEventListener("scroll", handleScroll);

        return () => slider.removeEventListener("scroll", handleScroll);
    }, []);

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
    const animateProgress = (currentValue, setter, target, duration = 800) => {
        let start = currentValue;   // ✅ start from current %
        const diff = target - start;

        if (diff <= 0) {
            setter(target);
            return;
        }

        const increment = diff / (duration / 16);

        const interval = setInterval(() => {
            start += increment;

            if (start >= target) {
                start = target;
                clearInterval(interval);
            }

            setter(Math.floor(start));
        }, 16);
    };
    const savePromptDirectly = async () => {
        if (!activeTemplate?.id) return;

        // ✅ fallback so prompt doesn't become empty by mistake
        const promptToSave =
            editedPrompt?.trim() ? editedPrompt : activeTemplate?.prompt || "";

        if (!promptToSave.trim()) {
            alert("Prompt cannot be empty");
            return;
        }

        try {
            setSavingPrompt(true);

            const res = await fetch(
                `${API_BASE}/api/voiceModuleTemplate/${activeTemplate.id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        organizationId,
                        userEmail,
                        prompt: promptToSave,
                    }),
                }
            );

            const data = await res.json();
            if (!data?.success) throw new Error("Prompt update failed");

            // ✅ update UI
            setActiveTemplate((prev) => ({ ...prev, prompt: promptToSave }));

            // ✅ update RAW prompt too (important for saveTemplate)
            setRawPrompt(promptToSave);

            // ✅ refresh template list
            fetchTemplates();

            // ✅ show toast / success msg
            setPromptSavedToast(true);
            setTimeout(() => setPromptSavedToast(false), 1500);
        } catch (err) {
            console.error("Save prompt failed", err);
            alert("Failed to save prompt");
        } finally {
            setSavingPrompt(false);
        }
    };


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
                // justifyContent: "space-between",
                marginBottom: "12px",
                gap: "10px"
            }}
        >
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
            {/* LEFT SIDE */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                {/* ICON */}


                {/* TITLE + SUBTITLE */}
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600, color: "#000" }}>{title}</span>
                </div>
                {icon === TlcPayrollInsightIcon && (
                    <img
                        src={icon}
                        alt="accordion-icon"
                        style={{ width: "20px", height: "20px" }}
                    />
                )}
            </div>

            {/* RIGHT ARROW */}

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
        const total = Math.floor(seconds);
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
            setIsSpeaking(false);
        };

        // 🎤 voice detect
        const audioContext = new window.AudioContext();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        source.connect(analyser);
        analyser.fftSize = 256;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVoice = () => {
            analyser.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
            }

            const volume = sum / dataArray.length;

            setIsSpeaking(volume > 8);

            if (mediaRecorder.state === "recording") {
                requestAnimationFrame(checkVoice);
            }
        };

        checkVoice();

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
    // Add this useEffect to clear audio when files are uploaded
    useEffect(() => {
        if (clearAudioOnFileUpload && uploadedTranscriptFiles.length > 0) {
            // Clear any playing audio
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
                setIsPlaying(false);
            }
            setAudioURL(null);
            setAudioBlob(null);
            setClearAudioOnFileUpload(false);
        }
    }, [uploadedTranscriptFiles, clearAudioOnFileUpload]);
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
                setTranscribing(false);

                setGenerationStage("generating");
                animateProgress(audioProgress, setAudioProgress, 60, 800);
                await submitMultipleTemplatesWithAudio(data.text);
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
        if (recordTime < 10) {
            alert("Audio must be at least 10 seconds long.");
            return;
        }
        if (setIsCareVoiceLocked) setIsCareVoiceLocked(true);
        try {
            if (platformType !== "windows" || platformType === "windows" || platformType !== "mac") {
                console.log("ANDROID detected, using backend voice pipeline");

                setGenerationStage("generating");

                // Set generating flag
                if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(true);
                if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(1);
                if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(0);
                setShowGeneratedFilesUI(true);
                await processVoiceRecordingAndroid();

                setGenerationStage(null);

                // Reset after delay

                if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(false);
                if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(0);
                if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(0);

                if (setIsCareVoiceLocked) setIsCareVoiceLocked(false);
                // resetStaffUI();
                return;
            }
            setGenerationStage("transcribing");
            animateProgress(audioProgress, setAudioProgress, 20, 600);
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
                `${API_BASE}/api/voiceModuleTemplate?email=${userEmail}`
            );
            const data = await res.json();
            // console.log("fetched templates", data?.data)
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
        // console.log("template", template);
        // console.log("[UI][EDIT] Editing template", template.id);


        setRawPrompt(template.prompt || "");
        setRawMapper(template.mappings || null);


        setAnalysisText(template.prompt);


        setMapperRows(mapperToRows(template.mappings));

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
            fetchTemplates();
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

        // console.log("[DEBUG] extractMapperFields input:", input);

        // Handle the new structure: input.mapper.mapper
        if (input.mapper && input.mapper.mapper && typeof input.mapper.mapper === "object") {
            const mapperObj = input.mapper.mapper;

            // Convert the object to array format
            return Object.entries(mapperObj).map(([key, value]) => ({
                template_field: key,
                source: Array.isArray(value.source) ? value.source.join(", ") : value.source || "",
                type: value.type || "text",
                required: !!value.required,
                // Include validation and transform if they exist
                validation: value.validation || "",
                transform: value.transform || ""
            }));
        }

        // unwrap AI/python wrapper (old structure)
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

        // console.log("[DEBUG] normalizeFieldMappings input:", fieldMappings);

        // ✅ ARRAY (from extractMapperFields)
        if (Array.isArray(fieldMappings)) {
            return fieldMappings.map((item) => ({
                template_field: item.template_field || item.key || "",
                source:
                    item.source ||
                    item.transcript_source ||
                    "",
                type: item.type || "text",
                required: !!item.required,
                // Optional: include validation and transform
                validation: item.validation || "",
                transform: item.transform || ""
            }));
        }

        // ✅ OBJECT MAP (legacy / manual)
        if (typeof fieldMappings === "object" && !Array.isArray(fieldMappings)) {
            return Object.entries(fieldMappings).map(
                ([key, value]) => ({
                    template_field: key,
                    source:
                        value?.source ||
                        value?.transcript_source ||
                        "",
                    type: value?.type || "text",
                    required: !!value?.required,
                    validation: value?.validation || "",
                    transform: value?.transform || ""
                })
            );
        }

        return [];
    };



    const pushEvent = (label, step) => {
        const now = new Date().toLocaleTimeString();

        setCurrentTask(label);

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
        setEditingTemplateId(null);
        setActiveTemplate(null);
        // console.log("[UI] Starting onboarding analysis");

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
            // console.log("[UI] Session created:", data);

            setSessionId(data.sessionId);
            pollLatest(data.sessionId);

        } catch (error) {
            console.error("[UI] Analysis error:", error);

            pushEvent("Analysis failed", 1);
            setShowUploadSection(true);
            setStage("idle");
        }
    };



    const pollLatest = (id) => {
        // console.log("[UI] Polling latest event:", id);

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
                // console.log("[UI] Latest event:", data);

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
                // console.log("data in poll latest", data);
                if (data.type === "final_result") {
                    setEditingTemplateId(null);
                    setActiveTemplate(null);
                    pushEvent("Final document generated", 4);

                    setRawPrompt(data.prompt || "");
                    setRawMapper(data?.mapper || null);

                    setAnalysisText(data.prompt);

                    // ✅ ONLY mapper.mapper flatten
                    setMapperRows(mapperToRows(data?.mapper));
                    console.log("data?.llm_cost?.total_usd", data?.llm_cost?.total_usd)
                    if (userEmail) {
                        await incrementCareVoiceAnalysisCount(
                            userEmail,
                            "onboarding",
                            data?.llm_cost?.total_usd,
                            "carevoice",
                            data?.llm_cost?.token_usage
                        );
                    }
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
        // console.log("[UI] Accepting analysis");

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

        // console.log("[UI] Sending feedback");

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
            setIsRequestingChanges(false);
            pollLatest(sessionId);
        } catch (error) {
            console.error("[UI] Feedback error:", error);
        }
    };

    const resetToTemplateList = () => {
        stopProgress();
        setStage("idle");
        setShowUploadSection(true);
        setTemplateFile(null);
        setSampleFiles([]);
        setEditingTemplateId(null);
        setRawPrompt("");
        setRawMapper(null);
        setMapperRows([]);
        setAnalysisText("");
        setFeedbackText("");
        setSessionId(null);
    };
    const saveTemplate = async () => {
        if (isSaving) return;
        if (!rawPrompt || mapperRows.length === 0) {
            console.warn("Save prevented: Missing prompt or mapper");
            return;
        }
        if (!editingTemplateId && stage !== "completed") {
            console.warn("Save prevented: Not in edit mode");
            return;
        }
        setIsSaving(true);
        // console.log("rawPrompt during save", rawPrompt)
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
                        let parsedValidation = {};

                        try {
                            if (row.validation) {
                                parsedValidation =
                                    typeof row.validation === "string"
                                        ? JSON.parse(row.validation)
                                        : row.validation;
                            }
                        } catch (e) {
                            parsedValidation = {};
                        }
                        acc[row.template_field] = {
                            source: row.source,
                            type: row.type,
                            required: !!row.required,
                            validation: parsedValidation || {}
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

            // SAMPLE FILES (MULTIPLE)
            sampleFiles.forEach((file) => {
                formData.append("samples", file);
            });
            console.log("editingTemplateId", editingTemplateId)
            const url = editingTemplateId !== null
                ? `${API_BASE}/api/voiceModuleTemplate/${editingTemplateId}`
                : `${API_BASE}/api/voiceModuleTemplate`;

            const method = editingTemplateId ? "PUT" : "POST";
            // console.log("method",method)
            const res = await fetch(url, {
                method,
                body: formData
            });

            const data = await res.json();
            if (!data.success) throw new Error("Save failed");
            savePromptDirectly()
            alert(editingTemplateId ? "Template updated successfully" : "Template saved successfully");
            if (!editingTemplateId) {
                resetToTemplateList();
            }
            fetchTemplates();

        } catch (err) {
            console.error("[UI][SAVE] Failed", err);
            alert("Failed to save template");
        } finally {
            setIsSaving(false);
        }
    };

    const processSingleTranscriptWithTemplateText = async (tpl, transcriptText) => {
        const formData = new FormData();

        formData.append("templateBlobName", tpl.templateBlobName);
        formData.append("templateMimeType", tpl.templateMimeType);
        formData.append("templateOriginalName", tpl.templateOriginalName);

        formData.append(
            "sampleBlobs",
            JSON.stringify(tpl.sampleBlobs || [])
        );

        formData.append("prompt", tpl.prompt);

        const parsedJson = JSON.parse(tpl.mappings);
        const normalizedMapper = {
            ...parsedJson,
            mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper,
        };

        formData.append("mapper", JSON.stringify(normalizedMapper));

        // 🔥 KEY DIFFERENCE: TEXT, NOT FILE
        formData.append("transcript_data", transcriptText);

        const res = await fetch(`${API_BASE}/api/document-filler`, {
            method: "POST",
            body: formData,
        });

        const data = await res.json();

        if (data.success && data.filled_document) {
            const filename = `${tpl.templateName || "Generated"}_Audio.docx`;

            const doc = { filename, base64: data.filled_document };

            // downloadBase64File(data.filled_document, filename);

            return doc;
        }

        if (userEmail) {
            await incrementCareVoiceAnalysisCount(
                userEmail,
                "document-generation",
                data?.llm_cost?.total_usd,
                "carevoice",
                data?.llm_cost?.token_usage
            );
        }
    };
    const submitMultipleTemplatesWithAudio = async (transcriptTextParam) => {
        if (
            !selectedTemplate ||
            !selectedTemplate.isMulti ||
            selectedTemplate.templates.length === 0 ||
            !transcriptTextParam
        ) return;

        setIsGeneratingAudio(true);
        setCurrentTask("Generating documents from audio");

        const docsToSend = [];
        // console.log("Selected templates for audio generation:", selectedTemplate.templates);
        const tasks = selectedTemplate.templates.map(async (tpl) => {
            const doc = await processSingleTranscriptWithTemplateText(
                tpl,
                transcriptTextParam
            );

            if (doc) docsToSend.push(doc);
        });
        await Promise.all(tasks);
        animateProgress(audioProgress, setAudioProgress, 80, 600);
        setGenerationStage("emailing");
        // await sendGeneratedDocsEmail(docsToSend);
        animateProgress(audioProgress, setAudioProgress, 100, 400);

        setGeneratedDocs([]);
        emailSentRef.current = false;
        setIsGeneratingAudio(false);
        setGenerationStage(null);
        // resetStaffUI();
        setCurrentTask("");
        setAudioProgress(0);
    };


    // Reset view when role changes
    useEffect(() => {
        if (role === "Admin") {
            setShowUploadSection(true);
            setStage("idle");
            setCurrentStep(1);
        }
    }, [role]);
    const handleStaffTemplateSelect = (tpl) => {
        // console.log("[STAFF] Selected template:", tpl.id);

        // 🔐 RAW — selection logic unchanged
        setSelectedTemplate((prev) => {
            if (!prev || !prev.isMulti) {
                return {
                    isMulti: true,
                    templates: [tpl],
                };
            }

            const exists = prev.templates.find((t) => t.id === tpl.id);

            return {
                isMulti: true,
                templates: exists
                    ? prev.templates.filter((t) => t.id !== tpl.id)
                    : [...prev.templates, tpl],
            };
        });

        // 🎨 UI prompt
        setAnalysisText(tpl.prompt);

        // ✅ ONLY mapper.mapper flatten
        setMapperRows(mapperToRows(tpl.mappings));
    };


    // console.log("selectedTemplate?.mappings", selectedTemplate?.mappings)
    // console.log(analysisText)
    // console.log(mapperRows)
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
        if (
            !selectedTemplate ||
            (selectedTemplate.isMulti && selectedTemplate.templates.length === 0)
        ) {
            alert("please select atleast one template")
            return;
        }

        try {
            setIsGeneratingFile(true);

            const formData = new FormData();
            // TEMPLATE FROM BLOB METADATA
            formData.append("templateBlobName", selectedTemplate.templateBlobName);
            formData.append("templateMimeType", selectedTemplate.templateMimeType);
            formData.append("templateOriginalName", selectedTemplate.templateOriginalName);

            // SAMPLE BLOBS (ARRAY OR EMPTY)
            formData.append(
                "sampleBlobs",
                JSON.stringify(selectedTemplate.sampleBlobs || [])
            );
            // console.log("[STAFF][DOC] Using RAW prompt:", selectedTemplate.prompt);
            // console.log("[STAFF][DOC] Using RAW mapper:", selectedTemplate.mappings);

            formData.append("prompt", selectedTemplate.prompt);
            const parsedJson = JSON.parse(selectedTemplate.mappings);
            // console.log("parsedJson (raw)", parsedJson);

            // normalize mapper here
            const normalizedMapper = {
                ...parsedJson,
                mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper
            };

            // console.log("parsedJson (normalized)", normalizedMapper);

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
            if (userEmail) {
                await incrementCareVoiceAnalysisCount(
                    userEmail,
                    "document-generation",
                    data?.llm_cost?.total_usd,
                    "carevoice",
                    data?.llm_cost?.token_usage
                )
            }
            if (data.success && data.filled_document) {
                const filename = "Generated_Document.docx";

                const docs = [{ filename, base64: data.filled_document }];

                setGeneratedDocs(docs);
                // downloadBase64File(data.filled_document, filename);

                // await sendGeneratedDocsEmail(docs);
                // resetStaffUI();
            }

            setGeneratedDocs([]);
            emailSentRef.current = false;

        } catch (err) {
            console.error("Document generation failed", err);
            alert("Failed to generate document");
        } finally {
            setIsGeneratingFile(false);
            setTranscribing(false);
        }
    };
    const sendGeneratedDocsEmail = async (docs) => {
        if (
            emailSentRef.current ||
            !docs?.length ||
            !userEmail
        ) {
            console.log("emailSentRef.current", emailSentRef.current)
            // console.log("docs", docs)
            console.log("sendGeneratedDocsEmail says returned", userEmail)
            return;
        }

        emailSentRef.current = true;

        try {
            const res = await fetch(`${API_BASE}/api/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    documents: docs,
                    userEmail,
                    staffEmail: staffEmail?.trim() || undefined,
                    staffName: staffName?.trim() || undefined,
                }),
            });

            const data = await res.json();
            // console.log("data", data)
            if (!res.ok) {
                throw new Error(data.error || "Email API failed");
            }

            // console.log("Email sent:", docs.length);
        } catch (err) {
            console.error("❌ Email send failed", err.message);
        }
    };


    const CARDS_PER_VIEW = 2;

    const canGoPrev = templateIndex > 0;
    const canGoNext = templateIndex + CARDS_PER_VIEW < templates.length;

    const handlePrev = () => {
        if (canGoPrev) {
            setTemplateIndex(prev => prev - CARDS_PER_VIEW);
        }
    };

    const handleNext = () => {
        if (canGoNext) {
            setTemplateIndex(prev => prev + CARDS_PER_VIEW);
        }
    };
    // const sections = parseVoiceExplanation(analysisText);
    const currentPage = templateIndex;
    const totalPages = templates.length > 1 ? templates.length - 1 : templates.length;

    const isSingleView =
        templates.length === 1
    const scrollSlider = (dir) => {
        if (!sliderRef.current) return;

        const card = sliderRef.current.querySelector(".vm-template-card");
        if (!card) return;

        const cardWidth = card.offsetWidth;
        const gap = 12; // same as padding-right / gap
        const scrollAmount = (cardWidth + gap) * 0.6;

        sliderRef.current.scrollBy({
            left: dir === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
        // setTemplateIndex(prev =>
        //     dir === "left"
        //         ? Math.max(prev - CARDS_PER_VIEW, 0)
        //         : Math.min(prev + CARDS_PER_VIEW, (totalPages - 1) * CARDS_PER_VIEW)
        // );
    };


    const processSingleTranscriptWithTemplate = async (tpl, file) => {
        const formData = new FormData();

        formData.append("templateBlobName", tpl.templateBlobName);
        formData.append("templateMimeType", tpl.templateMimeType);
        formData.append("templateOriginalName", tpl.templateOriginalName);

        formData.append(
            "sampleBlobs",
            JSON.stringify(tpl.sampleBlobs || [])
        );

        formData.append("prompt", tpl.prompt);

        const parsedJson = JSON.parse(tpl.mappings);
        const normalizedMapper = {
            ...parsedJson,
            mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper
        };

        formData.append("mapper", JSON.stringify(normalizedMapper));
        formData.append("transcript_data", file, file.name);

        const res = await fetch(`${API_BASE}/api/document-filler`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        console.log("data in processSingleTranscriptWithTemplate", data)
        if (data.success && data.filled_document) {
            const filename = `${tpl.templateName}_${file.name}.docx`;

            const doc = { filename, base64: data.filled_document, sasUrl: data?.sasUrl };
            if (userEmail) {
                await incrementCareVoiceAnalysisCount(
                    userEmail,
                    "document-generation",
                    data?.llm_cost?.total_usd,
                    "carevoice",
                    data?.llm_cost?.token_usage
                )
            }
            // downloadBase64File(data.filled_document, filename);

            return doc;
        }
    };


    const submitMultipleTranscripts = async () => {
        setShowGeneratedFilesUI(true);
        if (setIsCareVoiceLocked) setIsCareVoiceLocked(true);
        if (
            !selectedTemplate ||
            !selectedTemplate.isMulti ||
            selectedTemplate.templates.length === 0 ||
            uploadedTranscriptFiles.length === 0
        ) return;

        // Clear any playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }

        setIsGeneratingFile(true);
        setFileStage("generating");
        setFileProgress(0);

        // Set generating docs flag in parent
        if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(true);

        // Reset counters
        let totalDocsExpected = 0;
        let docsGeneratedSoFar = 0;

        // Calculate total operations
        const totalOperations = uploadedTranscriptFiles.length;
        let completedOperations = 0;
        let hasError = false;
        const docsToSend = [];
        let generatedDocsSasUrls = [];
        // console.log(`Starting processing of ${totalOperations} total operations`);
        // console.log(`Templates: ${selectedTemplate.templates.length}, Files: ${uploadedTranscriptFiles.length}`);

        // Process each file with ALL templates in ONE API call
        for (const file of uploadedTranscriptFiles) {
            try {
                // console.log(`Processing file: ${file.name} with ${selectedTemplate.templates.length} templates`);

                // Check if file is audio or video
                if (isAudioFile(file) || isVideoFile(file)) {
                    // console.log(`Processing ${isAudioFile(file) ? "audio" : "video"} file with ALL templates:`, file.name);

                    const formData = new FormData();
                    formData.append("audio", file, file.name);

                    // OPTIMIZATION: Send ALL templates in ONE request
                    formData.append(
                        "templates",
                        JSON.stringify(selectedTemplate.templates)
                    );
                    formData.append("userEmail", userEmail || "");
                    formData.append("staffEmail", staffEmail || "");
                    formData.append("staffName", staffName || "");

                    // console.log(`Sending request for ${file.name} with ${selectedTemplate.templates.length} templates...`);
                    const res = await fetch(`${API_BASE}/api/process-recording`, {
                        method: "POST",
                        body: formData
                    });

                    // console.log(`Response received for ${file.name}, status: ${res.status}`);
                    const data = await res.json();
                    console.log(`Processing response for ${file.name}:`, data?.generatedDocsSasUrls);
                    if (data?.generatedDocsSasUrls) {
                        data?.generatedDocsSasUrls.map(sasUrl => {
                            console.log("data.generatedDocsSasUrl of media", sasUrl);
                            generatedDocsSasUrls.push(sasUrl);
                        });
                    }
                    // HANDLE TRANSCRIPTS
                    if (data.transcripts?.length) {
                        const transcriptFiles = await Promise.all(
                            data.transcripts.map((t, i) =>
                                createTranscriptDoc(
                                    t.text,
                                    `${t.fileName || file.name}_transcript_${i}.docx`
                                )
                            )
                        );

                        // console.log("Transcripts converted (multi):", transcriptFiles);
                        docsGeneratedSoFar += transcriptFiles.length;
                        totalDocsExpected += transcriptFiles.length;

                        // Update parent state
                        if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(docsGeneratedSoFar);
                        if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(totalDocsExpected);

                        setDocsGeneratedCount(docsGeneratedSoFar);
                        setTotalDocsToGenerate(totalDocsExpected);

                        setCareVoiceFiles(prev => [
                            ...prev,
                            ...transcriptFiles
                        ]);
                    }

                    if (data.success && data.documents?.length > 0) {
                        // Backend returns documents for ALL templates
                        const generatedFiles = [];
                        for (const doc of data.documents) {
                            if (doc.attachment?.data) {
                                const byteArray = new Uint8Array(doc.attachment.data);
                                const blob = new Blob([byteArray], {
                                    type: doc.mime || "application/octet-stream"
                                });

                                // ✅ DOWNLOAD
                                const blobUrl = window.URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = blobUrl;
                                link.download = doc.filename || `${file.name}_document.docx`;
                                document.body.appendChild(link);
                                // link.click();
                                document.body.removeChild(link);
                                window.URL.revokeObjectURL(blobUrl);

                                // ✅ ADD THIS (IMPORTANT)
                                const fileObj = new File(
                                    [blob],
                                    doc.filename || `${file.name}_document.docx`,
                                    {
                                        type: doc.mime || "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    }
                                );

                                generatedFiles.push(fileObj);
                                docsToSend.push(doc);
                                docsGeneratedSoFar++;
                                totalDocsExpected++;

                                // Update parent state
                                if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(docsGeneratedSoFar);
                                if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(totalDocsExpected);

                                setDocsGeneratedCount(docsGeneratedSoFar);
                                setTotalDocsToGenerate(totalDocsExpected);
                            }
                        }

                        if (generatedFiles.length > 0) {
                            setCareVoiceFiles(prev => [
                                ...prev,
                                ...generatedFiles
                            ]);

                            // console.log("Generated files sent to Ask AI (multi):", generatedFiles);
                        }
                        // console.log(`Generated ${data.documents.length} documents from ${file.name}`);
                    } else {
                        // console.log(`No documents generated for ${file.name}`);
                        if (data.error) {
                            console.error(`Error from backend:`, data.error);
                        }
                    }
                }
                else {
                    // For non-audio/video files (PDF, DOC, TXT, etc.)
                    console.log("Processing non-audio/video file:", file.name);

                    for (const tpl of selectedTemplate.templates) {
                        try {
                            const doc = await processSingleTranscriptWithTemplate(tpl, file);
                            console.log("doc", doc)

                            if (doc) {
                                if (doc?.sasUrl) {
                                    if (Array.isArray(doc.sasUrl)) {
                                        // If it's an array, spread it
                                        generatedDocsSasUrls.push(...doc.sasUrl);
                                    } else {
                                        console.log("non media generatedDocsSasUrls.push", doc.sasUrl)
                                        // If it's a single object, push it directly
                                        generatedDocsSasUrls.push(doc.sasUrl);
                                    }
                                }
                                docsToSend.push(doc);

                                //CONVERT BASE64 → FILE (IMPORTANT)
                                const byteCharacters = atob(doc.base64);
                                const byteNumbers = new Array(byteCharacters.length)
                                    .fill(0)
                                    .map((_, i) => byteCharacters.charCodeAt(i));

                                const byteArray = new Uint8Array(byteNumbers);

                                const fileObj = new File(
                                    [byteArray],
                                    doc.filename,
                                    {
                                        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    }
                                );

                                // ✅ ADD TO UI STATE (THIS WAS MISSING)
                                setCareVoiceFiles(prev => [
                                    ...prev,
                                    fileObj
                                ]);

                                docsGeneratedSoFar++;
                                totalDocsExpected++;

                                if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(docsGeneratedSoFar);
                                if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(totalDocsExpected);

                                setDocsGeneratedCount(docsGeneratedSoFar);
                                setTotalDocsToGenerate(totalDocsExpected);
                            }
                        } catch (err) {
                            console.error(`Error processing template ${tpl.id} with file ${file.name}:`, err);
                            hasError = true;
                        }
                    }
                }
            } catch (err) {
                console.error("Error processing file:", file.name, err);
                hasError = true;
            } finally {
                completedOperations++;
                const progressPercent = Math.floor((completedOperations / totalOperations) * 100);
                setFileProgress(progressPercent);
                console.log(`Progress: ${completedOperations}/${totalOperations} (${progressPercent}%)`);
                if (setIsCareVoiceLocked) setIsCareVoiceLocked(false);
                // Add a small delay between file processing
                if (completedOperations < totalOperations) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        console.log(`All files processed. Total documents generated: ${docsToSend.length}`);
        console.log("docsToSend", docsToSend)
        setGeneratedDocsSasUrls(generatedDocsSasUrls);
        console.log("All SAS URLs collected:", generatedDocsSasUrls);
        if (docsToSend.length > 0) {
            setFileStage("emailing");
            setFileProgress(90);
            // await sendGeneratedDocsEmail(docsToSend);
            alert(`Successfully generated ${docsToSend.length} document(s)!`);
        } else {
            console.log("No documents were generated");
            if (!hasError) {
                alert("No documents were generated. Please check your audio files and templates.");
            }
        }

        setFileProgress(100);
        emailSentRef.current = false;
        setIsGeneratingFile(false);
        setFileStage(null);

        // Reset generating flag after all documents are processed

        if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(false);
        if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(0);
        if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(0);
        setDocsGeneratedCount(0);
        setTotalDocsToGenerate(0);
        if (setIsCareVoiceLocked) setIsCareVoiceLocked(false);

        // resetStaffUI();
        setCurrentTask("");
    };
    console.log("generatedDocsSasUrls", generatedDocsSasUrls)


    const handleDownloadBlob = async ({
        fileKey,
        templateId,
        blobName,
        originalName,
    }) => {
        try {
            setDownloadingFileKey(fileKey);

            const query = new URLSearchParams({
                organizationId,
                ...(blobName ? { blobName } : {}) // ✅ only if exists
            }).toString();

            const res = await fetch(
                `${API_BASE}/api/voiceModuleTemplate/${templateId}/download?${query}`
            );

            const data = await res.json();
            if (!data.success) throw new Error("Download failed");

            const link = document.createElement("a");
            link.href = data.url;
            link.download = originalName;
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (err) {
            console.error("[DOWNLOAD ERROR]", err);
            alert("Failed to download file");
        } finally {
            setDownloadingFileKey(null);
        }
    };

    useEffect(() => {
        if (props.isMobileOrTablet) {
            setRole("Staff");
        }
    }, [props.isMobileOrTablet]);

    useEffect(() => {
        if (!userEmail) return;

        const fetchCurrentUserRole = async () => {
            try {
                const res = await fetch(
                    `${API_BASE}/api/v2d/users/${encodeURIComponent(userEmail)}`,
                    { headers: { "x-user-email": userEmail } }
                );
                const data = await res.json();
                const apiRole = (data?.data?.role || "").toLowerCase();
                if (apiRole === "staff") {
                    setCurrentUserRole("staff");
                    setRole("Staff");
                } else if (apiRole === "admin") {
                    setCurrentUserRole("admin");
                }
            } catch (err) {
                console.error("[VoiceModule] failed to fetch current user role", err);
            }
        };

        fetchCurrentUserRole();
    }, [userEmail]);

    const transcriptInputRef = useRef(null);
    const resetStaffUI = () => {
        setRecordMode("idle");
        setAudioURL(null);
        setAudioBlob(null);
        setRecordTime(0);
        setPlayTime(0);
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setTranscriptData(null);
        setUploadedTranscriptFiles([]);
        setTranscriptSource(null);

        setSelectedTemplate(null);
        setStaffStep("landing");

        setStaffName("");
        setStaffEmail("");
    };
    const handleResetAll = () => {
        props.onReset?.();
        // 1. Reset staff UI
        resetStaffUI();
        setShowGeneratedFilesUI(false);
        // 2. Clear Care Voice files
        setCareVoiceFiles([]);

        // 3. Reset generation states
        setIsCareVoiceGeneratingDocs(false);
        setTotalCareVoiceDocsToGenerate(0);
        setGeneratedCareVoiceDocsCount(0);
        setGeneratedDocsSasUrls([]);

        // 4. Reset Ask AI session (VERY IMPORTANT)
        if (props?.setCareVoiceSessionId) props.setCareVoiceSessionId(null);
        if (props?.setCareVoiceUserId) props.setCareVoiceUserId(null);
        if (props?.setCareVoiceStarted) props.setCareVoiceStarted(false);

        // 5. Clear Ask AI chat
        if (props?.setMessages) props.setMessages([]);

        console.log("Full reset done");
    };
    if (!isAllowedUsers && notAllowedDomain) {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                {/* <img
                    src={TlcLogo}
                    alt="Access Denied"
                    style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
                /> */}

                <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
                    Access Restricted 🚫
                </h2>

                <p style={{ fontSize: "16px", color: "#555" }}>
                    Sorry, your account (<strong>{userEmail}</strong>)
                    is not authorized to view this page.
                </p>
            </div>
        )
    }
    console.log("props.careVoice files", props?.careVoiceFiles)
    const handleDownloadAllDocs = () => {
        const filteredFiles = (props.careVoiceFiles || []).filter((file) => {
            const fileName = file?.name || "";
            const lowerName = fileName.toLowerCase();

            const isUploadedTranscript =
                uploadedTranscriptFiles?.some(
                    (tFile) => tFile?.name === fileName
                );

            const isTranscriptDoc =
                /(_\d+\.docx)$/i.test(fileName) &&
                (
                    lowerName.includes("transcript") ||
                    lowerName.includes(".webm_") ||
                    lowerName.includes(".mp3_") ||
                    lowerName.includes(".wav_") ||
                    lowerName.includes(".mp4_") ||
                    lowerName.includes(".m4a_")
                );

            return !isUploadedTranscript && !isTranscriptDoc;
        });

        filteredFiles.forEach((file, index) => {
            const url = URL.createObjectURL(file);

            const link = document.createElement("a");
            link.href = url;
            link.download = file.name || `document_${index + 1}.docx`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    };
    const handleEmailAllDocs = async () => {
        if (isEmailingDocs) return;
        setIsEmailingDocs(true);
        alert("Sending email... Please wait");

        try {
            const filteredFiles = (props.careVoiceFiles || []).filter((file) => {
                const fileName = file?.name || "";
                const lowerName = fileName.toLowerCase();

                const isUploadedTranscript =
                    uploadedTranscriptFiles?.some(
                        (tFile) => tFile?.name === fileName
                    );

                const isTranscriptDoc =
                    /(_\d+\.docx)$/i.test(fileName) &&
                    (
                        lowerName.includes("transcript") ||
                        lowerName.includes(".webm_") ||
                        lowerName.includes(".mp3_") ||
                        lowerName.includes(".wav_") ||
                        lowerName.includes(".mp4_") ||
                        lowerName.includes(".m4a_")
                    );

                return !isUploadedTranscript && !isTranscriptDoc;
            });

            const docs = await Promise.all(
                filteredFiles.map((file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();

                        reader.onload = () => {
                            const base64 = reader.result.split(",")[1];

                            resolve({
                                filename: file.name,
                                base64
                            });
                        };

                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                })
            );

            await sendGeneratedDocsEmail(docs);
            alert("Email sent successfully");
        } catch (error) {
            alert("Failed to send email");
            console.error(error);
        } finally {
            setIsEmailingDocs(false);
        }
    };
    return (
        <div className="voice-container">
            {/* ================= TOP ROW ================= */}
            {props.isMobileOrTablet &&
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px', gap: '2px' }}>
                    <FiMic size={22} />
                    <div style={{ textAlign: 'center', fontSize: '20px', fontWeight: '500', }}>Care Voice</div>
                </div>
            }
            <div className="voice-top-bar">
                <div className="voice-top-row">
                    <MultiSelectCustom
                        placeholder="Role"
                        leftIcon={voiceRoleIcon}
                        rightIcon={props.isMobileOrTablet ? null : TlcPayrollDownArrow}  // optional arrow
                        options={
                            currentUserRole === "staff"
                                ? [{ label: "Staff", value: "Staff" }]
                                : [
                                    { label: "Admin", value: "Admin" },
                                    { label: "Staff", value: "Staff" },
                                ]
                        }
                        selected={[{ label: role, value: role }]}
                        setSelected={(arr) => {
                            if (currentUserRole === "staff") {
                                setRole("Staff");
                                return;
                            }
                            setRole(arr?.[0]?.value || "Admin");
                        }}
                        isSingleSelect={true}
                        disabled={props.isMobileOrTablet || currentUserRole === "staff"}
                    />

                    {role === "Staff" && currentUserRole !== "Admin" && !showGeneratedFilesUI && (
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
                                    value={staffName}
                                    onChange={(e) => setStaffName(e.target.value)}
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
                                    value={staffEmail}
                                    onChange={(e) => setStaffEmail(e.target.value)}
                                />
                            </div>
                        </>
                    )}
                </div>

                {role === "Admin" && (
                    <button
                        className="access-mgmt-trigger-btn"
                        onClick={() => setOpenAccessManagement(true)}
                        type="button"
                    >
                        <RiSettingsLine size={18} color="#707493" />
                        Access Management
                    </button>
                )}
            </div>


            <div className="voice-divider" />
            {role === "Staff" && !showGeneratedFilesUI && staffStep === "landing" && (
                <div className="staff-landing-container">
                    <div className="staff-landing-content">
                        {/* Lottie Animation */}
                        <div className="staff-landing-animation">
                            <Lottie
                                animationData={selectTemplateAnimation}
                                loop={true}
                                autoplay={true}
                                style={{ width: "200px", height: "200px" }}
                            />
                        </div>

                        {/* Text Content */}
                        <div className="staff-landing-text">
                            <h2 className="staff-landing-title">
                                Select a template to populate
                            </h2>
                            <p className="staff-landing-description">
                                Choose a template to get started. We'll automatically structure and populate your transcript or recording.
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            className="staff-primary staff-landing-button"
                            onClick={() => setStaffStep("selectTemplate")}
                        >
                            <HiOutlineDocumentAdd size={18} />
                            Select Template
                        </button>
                    </div>
                </div>
            )}

            {/* ================= ADMIN VIEW ================= */}
            {role === "Admin" && (
                <>
                    {role === "Admin" && activeTemplate && (
                        <div className="vm-template-details">

                            {/* BACK */}
                            {/* BACK + SAVE */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "35px"
                                }}
                            >
                                <div
                                    className="vm-back"
                                    style={{
                                        cursor: "pointer",
                                        display: "flex",
                                        fontSize: "14px",
                                        color: "#6C4CDC",
                                        alignItems: "center",
                                        gap: "2px"
                                    }}
                                    onClick={() => {
                                        setActiveTemplate(null);
                                        setEditingTemplateId(null);

                                        setAnalysisText("");
                                        setRawPrompt("");
                                        setRawMapper(null);
                                        setMapperRows([]);

                                        setEditedPrompt("");
                                        setIsPromptEditing(false);
                                    }}
                                >
                                    <GoArrowLeft size={22} color="#6C4CDC" /> Back
                                </div>

                                <button
                                    className="analysis-accept-btn"
                                    onClick={() => {
                                        // ✅ important: this tells saveTemplate() that we are updating existing template
                                        setEditingTemplateId(activeTemplate.id);

                                        // ✅ ensure prompt + mapper are set
                                        setRawPrompt(activeTemplate.prompt || "");
                                        setRawMapper(activeTemplate.mappings || null);

                                        saveTemplate();
                                    }}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Template"}
                                </button>
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
                                    <div
                                        className="vm-file-item"
                                        style={{
                                            width: "435px",
                                            height: "78px",
                                            cursor: downloadingFileKey ? "not-allowed" : "pointer",
                                            opacity: downloadingFileKey ? 0.6 : 1,
                                        }}
                                        onClick={() =>
                                            !downloadingFileKey &&
                                            handleDownloadBlob({
                                                fileKey: `template-${activeTemplate.id}`,
                                                templateId: activeTemplate.id,
                                                originalName: activeTemplate.templateOriginalName,
                                            })
                                        }
                                    >
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
                                                        {downloadingFileKey === `template-${activeTemplate.id}`
                                                            ? "Downloading..."
                                                            : "Template Structure"}
                                                    </div>
                                                    <div className="vm-file-status">
                                                        {downloadingFileKey === `template-${activeTemplate.id}`
                                                            ? "Please wait"
                                                            : activeTemplate.templateOriginalName}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTemplate.sampleBlobs?.map((file, i) => {
                                        // Check file extension for icon
                                        const fileExt = file.originalName?.split('.').pop()?.toLowerCase();
                                        const isPDF = fileExt === 'pdf';
                                        const fileKey = `sample-${activeTemplate.id}-${i}`;
                                        const isDownloading = downloadingFileKey === fileKey;
                                        return (
                                            <div
                                                key={i}
                                                className="vm-file-item"
                                                style={{
                                                    width: "435px",
                                                    height: "78px",
                                                    cursor: downloadingFileKey ? "not-allowed" : "pointer",
                                                    opacity: isDownloading ? 0.6 : 1,
                                                }}
                                                onClick={() =>
                                                    !downloadingFileKey &&
                                                    handleDownloadBlob({
                                                        fileKey,
                                                        templateId: activeTemplate.id,
                                                        blobName: file.blobName,
                                                        originalName: file.originalName,
                                                    })
                                                }
                                            >
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
                                                                {isDownloading ? "Downloading..." : "Sample Document"}
                                                            </div>
                                                            <div className="vm-file-status">
                                                                {isDownloading ? "Please wait" : file.originalName}
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

                                    <PromptBlockEditor
                                        value={editedPrompt || activeTemplate?.prompt || ""}
                                        onChange={(val) => setEditedPrompt(val)}
                                        rightSlot={
                                            <button
                                                style={{
                                                    background: "#6C4CDC",
                                                    color: "#fff",
                                                    border: "none",
                                                    padding: "10px 24px",
                                                    borderRadius: "10px",
                                                    fontWeight: 600,
                                                    cursor: savingPrompt ? "not-allowed" : "pointer",
                                                    opacity: savingPrompt ? 0.7 : 1,
                                                }}
                                                disabled={savingPrompt}
                                                onClick={savePromptDirectly}
                                            >
                                                {savingPrompt ? "Saving..." : "Save"}
                                            </button>
                                        }
                                    />


                                    {promptSavedToast && (
                                        <div style={{ marginTop: "12px", color: "#16a34a", fontWeight: 600 }}>
                                            ✅ Saved
                                        </div>
                                    )}
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
                                <FieldMapperPro
                                    mapperRows={mapperRows}
                                    setMapperRows={setMapperRows}
                                    mapperMode={mapperMode}
                                />
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

                                {templates.length > 2 && (
                                    <div className="vm-template-header-arrows">
                                        <button
                                            className="vm-slider-arrow"
                                            onClick={() => scrollSlider("left")}
                                        >
                                            <img src={careVoiceLeft} alt="prev" />
                                        </button>

                                        <button
                                            className="vm-slider-arrow"
                                            onClick={() => scrollSlider("right")}
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
                                <div
                                    className={`vm-template-slider ${templates.length === 1 ? "single-template" : ""
                                        }`}
                                    ref={sliderRef}
                                >

                                    <div className="vm-template-track">
                                        {templates.map((tpl, index) => (
                                            <div key={tpl.id} className="vm-template-slide">
                                                <div className={`vm-template-card ${templates.length === 2 ? "vm-template-card-two" : ""
                                                    }`} onClick={() => {
                                                        if (openMenuId) return;
                                                        if (editingNameId === tpl.id) return;
                                                        setActiveTemplate(tpl);
                                                        setMapperMode("edit");

                                                        // ✅ Needed for save API
                                                        setEditingTemplateId(tpl.id);
                                                        setRawPrompt(tpl.prompt || "");
                                                        setRawMapper(tpl.mappings || null);

                                                        setMapperRows(mapperToRows(tpl.mappings));
                                                    }}
                                                >
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
                                                                                {(tpl.templateName || `Voice Template ${index + 1}`).length > 30
                                                                                    ? (tpl.templateName || `Voice Template ${index + 1}`).slice(0, 30) + "..."
                                                                                    : (tpl.templateName || `Voice Template ${index + 1}`)}
                                                                            </span>

                                                                            <span
                                                                                className="vm-template-edit-icon"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setEditingNameId(tpl.id);
                                                                                    setTempName(tpl.templateName || "");
                                                                                }}
                                                                            >
                                                                                <GoPencil size={14} />
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {/* RIGHT : DOTS */}
                                                                {editingNameId !== tpl.id && <div className="vm-template-actions">
                                                                    <span
                                                                        className="vm-dots"
                                                                        onClick={(e) => openDropdown(e, tpl.id)}
                                                                    >
                                                                        ...
                                                                    </span>


                                                                </div>}

                                                            </div>

                                                            {/* DATE */}
                                                            <div className="vm-template-date">
                                                                <img
                                                                    src={careVoiceTimeIcon}
                                                                    alt="time"
                                                                    style={{ width: "20px", height: "20px" }}
                                                                />
                                                                {timeAgo(tpl.createdAt)}
                                                            </div>


                                                        </div>
                                                    </div>

                                                    <div className="vm-template-right">
                                                        {/* <button className="vm-share-btn">
                                                            <img src={careVoiceShare} alt="share" />
                                                            Share Template
                                                        </button> */}

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
                            {openMenuId && dropdownPos && (
                                <div
                                    className="vm-dropdown-fixed"
                                    ref={dropdownRef}
                                    style={{
                                        position: "fixed",
                                        top: dropdownPos.top,
                                        left: dropdownPos.left,
                                        zIndex: 999999,
                                    }}
                                >
                                    <div
                                        className="vm-dropdown-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditTemplate(templates.find((t) => t.id === openMenuId));
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <img src={careVoiceEdit} alt="edit" />
                                        Edit Template Fields
                                    </div>

                                    <div
                                        className="vm-dropdown-item danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(templates.find((t) => t.id === openMenuId));
                                            setOpenMenuId(null);
                                        }}
                                    >
                                        <img src={careVoiceDelete} alt="delete" />
                                        Delete Template
                                    </div>
                                </div>
                            )}
                            {totalPages > 1 && (
                                <div className="vm-slider-dots">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <span
                                            key={i}
                                            className={`vm-slider-dot ${i === currentPage ? "active" : ""
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    )}


                    {/* Upload Section - Hidden when analyze clicked OR during processing */}
                    {stage !== "processing" && stage !== "completed" && stage !== "review" && !activeTemplate && <div className="vm-admin-heading">
                        <h2 className="vm-admin-title">
                            Make Care Voice Template
                        </h2>
                        <p className="vm-admin-subtitle">
                            Turn your document structure into a template you can reuse anytime.
                        </p>
                    </div>}
                    {showUploadSection && stage !== "processing" && !activeTemplate && (
                        <>
                            <div className="voice-upload-row">
                                {/* ================= TEMPLATE COLUMN ================= */}
                                <div className="voice-upload-col" style={{ width: "35%" }}>
                                    <TlcUploadBox
                                        id="admin-template-upload"
                                        title="Upload Templates*"
                                        subtitle=".DOC, .DOCX"
                                        accept=".doc,.docx"
                                        files={templateFile ? [templateFile] : []}
                                        multiple={false}
                                        setFiles={(files) => {
                                            setTemplateFile(files[0] || null);
                                        }}
                                    />
                                </div>


                                {/* ================= SAMPLES COLUMN ================= */}
                                <div className="voice-upload-col" style={{ width: "35%" }}>
                                    <TlcUploadBox
                                        id="admin-sample-upload"
                                        title="Upload Samples*"
                                        subtitle=".DOC, .PDF"
                                        accept=".doc,.docx,.pdf"
                                        files={sampleFiles}
                                        multiple
                                        setFiles={setSampleFiles}
                                    />
                                </div>

                            </div>

                            {/* Save & Analyze Button */}
                            <div className="voice-action">
                                <button
                                    disabled={
                                        stage === "processing" ||
                                        !templateFile ||
                                        sampleFiles.length === 0
                                    }
                                    onClick={startAnalysis}
                                >
                                    Analyze
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

                                {/* Only show Request Changes button when NOT requesting changes */}
                                {!isRequestingChanges && (
                                    <button
                                        onClick={() => {
                                            // Request changes - show textarea
                                            setShowFeedbackBox(true);
                                            setIsRequestingChanges(true);
                                        }}
                                        className="analysis-feedback-request-btn"
                                    >
                                        Request Changes
                                    </button>
                                )}
                                {!isRequestingChanges && (
                                    <button
                                        onClick={acceptAnalysis}
                                        className="analysis-accept-btn"
                                    >
                                        Accept and analyse
                                    </button>
                                )}
                            </div>

                            {/* ===== ANALYSIS CONTENT ===== */}
                            {showFeedbackBox && (
                                <div className="analysis-feedback-section">
                                    <div className="analysis-feedback-label">
                                        What would you like to change?
                                    </div>

                                    <textarea
                                        ref={feedbackTextareaRef}
                                        className="analysis-feedback-input"
                                        placeholder="Provide your feedback here..."
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        rows="4"
                                    />

                                    <div className="analysis-actions" style={{ marginTop: "16px", display: "flex", gap: "12px" }}>
                                        <button
                                            onClick={() => {
                                                // Discard changes - hide textarea and reset
                                                setShowFeedbackBox(false);
                                                setIsRequestingChanges(false);
                                                setFeedbackText("");
                                            }}
                                            className="analysis-feedback-discard-btn"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            onClick={sendFeedback}
                                            className="analysis-feedback-submit-btn"
                                            disabled={!feedbackText.trim()}
                                        >
                                            Submit Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="analysis-box" style={{ padding: "2rem" }}>
                                <div className="voice-explanation-section">
                                    <CareVoiceExplainationMarkdown content={analysisText} />
                                </div>
                            </div>
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

                            <FieldMapperPro
                                mapperRows={mapperRows}
                                setMapperRows={setMapperRows}
                                mapperMode={mapperMode}
                                onChangeConfig={(cfg) => {
                                    // ✅ OPTIONAL: agar tum chaho to cfg.mapper ko rows me sync kar sakte ho later
                                    console.log("config updated");
                                }}
                            />
                        </div>
                    )}

                </>
            )}

            {/* ================= STAFF VIEW ================= */}
            {role === "Staff" && !showGeneratedFilesUI && staffStep === "working" && (
                <div className="carevoice-staff-container">
                    <div className="record-conversation">
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
                            <div className="selectedtemplatebtn" onClick={() => setStaffStep("selectTemplate")}>
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
                                        cursor: "pointer"
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
                                        {selectedTemplate?.isMulti
                                            ? selectedTemplate.templates.length
                                            : 1}
                                    </span>
                                </div>
                            </div>
                        )}

                    </div>

                    <div
                        className={`staff-recorder ${audioURL || recordMode === "recording" || recordMode === "paused"
                            ? "staff-recorder-active"
                            : ""
                            }`}
                    >

                        {/* ===== REAL AUDIO PLAYER ===== */}
                        <audio ref={audioRef} src={audioURL} />

                        {/* ===== TIMER CIRCLE ===== */}
                        {(recordMode === "idle" || recordMode === "recording" || recordMode === "paused") && (
                            <div className="staff-rec-circle">
                                {recordMode === "recording" || recordMode === "paused" ? (
                                    <div className="staff-recording-wrapper">
                                        <Lottie
                                            animationData={recordingLottieAnimation}
                                            loop={recordMode === "recording"}
                                            autoplay={recordMode === "recording"}
                                            pause={recordMode === "paused"}
                                            className="staff-recording-lottie"
                                        />

                                        <span className="staff-recording-timer">
                                            {formatTime(recordTime)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="staff-recording-wrapper">
                                        <Lottie
                                            animationData={beforeRecordingAnimation}
                                            loop={true}
                                            autoplay={true}
                                            paused={!isSpeaking}
                                            className="staff-recording-lottie"
                                        />

                                        {/* <span className="staff-recording-timer">
                                            {formatTime(recordTime)}
                                        </span> */}
                                    </div>
                                )}
                            </div>
                        )}


                        {/* ===== AUDIO PREVIEW (PAUSED / PREVIEW) ===== */}
                        {(recordMode === "paused" || recordMode === "preview") && audioURL && (
                            <div className="staff-audio-preview-wrapper">

                                <div className="staff-play-recorder-div">
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
                                        <div className="staff-audio-seek-wrapper">
                                            <input
                                                type="range"
                                                min="0"
                                                max={audioRef.current?.duration || 0}
                                                value={playTime}
                                                step="0.1"
                                                onChange={(e) => {
                                                    const time = Number(e.target.value);
                                                    audioRef.current.currentTime = time;
                                                    setPlayTime(time);
                                                }}
                                                className="staff-audio-seekbar"
                                                style={{
                                                    background: audioRef.current?.duration
                                                        ? `linear-gradient(to right, #6c4cdc ${(playTime / audioRef.current.duration) * 100
                                                        }%, #bdbdbd ${(playTime / audioRef.current.duration) * 100
                                                        }%)`
                                                        : "#bdbdbd",
                                                }}
                                            />
                                        </div>
                                    </div>
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
                                        disabled={generationStage !== null}
                                    >
                                        {generationStage === "transcribing"
                                            ? `Transcribing... ${audioProgress}%`
                                            : generationStage === "generating"
                                                ? `Generating Documents... ${audioProgress}%`
                                                : generationStage === "emailing"
                                                    ? `Sending Emails... ${audioProgress}%`
                                                    : "✓ Submit"}
                                    </button>
                                    <button
                                        onClick={downloadRecording}
                                        style={{
                                            background: "#6c4cdc",
                                            border: "1px solid #ddd",
                                            borderRadius: "999px",
                                            padding: "8px 12px",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            color: "#fff",
                                            fontWeight: 500,
                                        }}
                                    >
                                        <FiDownload size={20} /> Download
                                    </button>
                                </>
                            )}

                        </div>
                    </div>




                    {/* ===== OR ===== */}
                    {!["recording", "paused", "preview"].includes(recordMode) && <div className="voice-or-row">
                        <span className="voice-or-line" />
                        <span className="voice-or-text">Or</span>
                        <span className="voice-or-line" />
                    </div>}

                    {!["recording", "paused", "preview"].includes(recordMode) && <div className="voice-upload-col">
                        <TlcUploadBox
                            id="staff-transcript-upload"
                            title="Upload Transcript"
                            subtitle=".DOC, .PDF, .TXT, .MP3, .WAV, .WEBM ,.MP4, .MOV"
                            accept=".doc,.docx,.pdf,.txt,.mp3,.wav,.webm,.mp4,.mov"
                            files={uploadedTranscriptFiles}
                            multiple
                            setFiles={(files) => {
                                setUploadedTranscriptFiles(files);
                                setTranscriptSource("file");
                                setCurrentTranscriptIndex(0);
                                setClearAudioOnFileUpload(true);
                            }}
                        />

                        {/* ✅ GENERATE DOCUMENT BUTTON (PUT BACK) */}
                        <div style={{ textAlign: "right", marginTop: "24px", marginBottom: '64px' }}>
                            <button
                                className="staff-primary"
                                onClick={
                                    uploadedTranscriptFiles.length > 0
                                        ? submitMultipleTranscripts
                                        : submitToDocumentFiller
                                }
                                disabled={
                                    fileStage !== null ||
                                    !selectedTemplate ||
                                    (selectedTemplate?.isMulti && selectedTemplate.templates.length === 0) ||
                                    uploadedTranscriptFiles.length === 0
                                }
                            >
                                {fileStage === "generating"
                                    ? `Generating Documents... ${fileProgress}%`
                                    : fileStage === "emailing"
                                        ? `Sending Emails... ${fileProgress}%`
                                        : "✓ Generate Document"}
                            </button>
                        </div>
                    </div>}





                </div>
            )}
            {role === "Staff" && staffStep === "selectTemplate" && (
                <div className="vm-confirm-overlay">
                    <div className="vm-select-confirm-modal template-select-modal">

                        {/* HEADER */}
                        <div className="template-select-header" style={{ height: "56px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    height: "56px",
                                    boxSizing: "border-box",
                                    marginBottom: "24px"
                                }}
                            >
                                {/* LEFT */}
                                <div
                                    style={{
                                        textAlign: "left",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    <h3 style={{ margin: 0 }}>Available Templates</h3>
                                    <p style={{ margin: 0 }}>Select a template organized by your admin</p>
                                </div>

                                {/* RIGHT */}
                                <img
                                    src={careVoiceCross}
                                    style={{ width: "24px", height: "24px", cursor: "pointer" }}
                                    onClick={() => {
                                        if (!selectedTemplate?.isMulti || selectedTemplate.templates.length === 0) {
                                            setStaffStep("landing");
                                        } else {
                                            setStaffStep("working");
                                        }
                                    }}
                                />
                            </div>

                        </div>
                        <div
                            style={{
                                height: "1px",
                                width: "100%",
                                maxWidth: "823px",
                                background: "#E6E6E6",
                                marginBottom: "24px",
                            }}
                        />

                        {templates?.length > 0 &&
                            <button
                                className={`template-select-confirm ${selectedTemplate?.isMulti && selectedTemplate.templates.length > 0
                                    ? "selected"
                                    : "not-selected"
                                    }`}
                                disabled={
                                    !selectedTemplate?.isMulti ||
                                    selectedTemplate.templates.length === 0
                                }
                                onClick={() => setStaffStep("working")}
                            >
                                ✓ Choose Template

                                {selectedTemplate?.isMulti &&
                                    selectedTemplate.templates.length > 0 && (
                                        <span className="template-count">
                                            {selectedTemplate.templates.length}
                                        </span>
                                    )}
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
                                    // console.log("tpl", tpl)
                                    const isSelected =
                                        selectedTemplate?.isMulti &&
                                        selectedTemplate.templates.some(t => t.id === tpl.id);


                                    return (
                                        <div
                                            key={tpl.id}
                                            className={`template-select-card ${isSelected ? "active" : ""}`}
                                            onClick={() => handleStaffTemplateSelect(tpl)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                readOnly
                                                className="template-checkbox"
                                            />

                                            <img src={templateIcon} className="template-select-icon" />

                                            <div className="template-select-info" style={{ display: "flex", flexDirection: "column", textAlign: "left", gap: "4px" }}>
                                                <div className="template-select-name" style={{ fontSize: "16px", fontWeight: "600", color: "#0e0c16" }}>
                                                    {(tpl.templateName || "Voice Template").length > 30
                                                        ? (tpl.templateName || "Voice Template").slice(0, 25) + "..."
                                                        : (tpl.templateName || "Voice Template")}
                                                </div>
                                                <div className="template-select-date">
                                                    <div className="vm-template-date">
                                                        <img
                                                            src={careVoiceTimeIcon}
                                                            alt="time"
                                                            style={{ width: "20px", height: "20px" }}
                                                        />
                                                        {timeAgo(tpl.createdAt)}
                                                    </div>
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

            {role === "Staff" && showGeneratedFilesUI && (
                <div className="generated-docs-container" style={
                    props?.careVoiceFiles?.length === 0 ||
                        props?.isCareVoiceGeneratingDocs
                        ? { background: "white" }
                        : {}
                }>
                    <div className="generated-docs-header">
                        <h3 className="generated-docs-title">
                            {!props?.isCareVoiceGeneratingDocs
                                ? "Generated Documents"
                                : ""}
                        </h3>
                    </div>

                    {props?.careVoiceFiles?.length === 0 ||
                        props?.isCareVoiceGeneratingDocs ? (
                        <div className="genratingDocLottieDiv">
                            <video
                                className="generating-docs-video"
                                autoPlay
                                loop
                                muted
                                playsInline
                            >
                                <source src={generatingDocAnimationVideo} type="video/mp4" />
                            </video>
                        </div>
                    ) : (
                        <>
                            <div className="generated-docs-grid-wrapper">
                                <div
                                    className="generated-docs-grid"
                                    style={{
                                        ...(() => {
                                            const filteredFiles = (props.careVoiceFiles || [])
                                                .map((file, originalIndex) => ({
                                                    file,
                                                    originalIndex
                                                }))
                                                .filter(({ file }) => {
                                                    const fileName = file?.name || "";
                                                    const isUploadedTranscript =
                                                        uploadedTranscriptFiles?.some(
                                                            (tFile) => tFile?.name === fileName
                                                        );
                                                    const lowerName = fileName.toLowerCase();
                                                    const isTranscriptDoc =
                                                        /(_\d+\.docx)$/i.test(fileName) &&
                                                        (
                                                            lowerName.includes("transcript") ||
                                                            lowerName.includes(".webm_") ||
                                                            lowerName.includes(".mp3_") ||
                                                            lowerName.includes(".wav_") ||
                                                            lowerName.includes(".mp4_") ||
                                                            lowerName.includes(".m4a_")
                                                        );
                                                    return !isUploadedTranscript && !isTranscriptDoc;
                                                });

                                            const fileCount = filteredFiles.length;

                                            if (fileCount === 1) {
                                                return { gridTemplateColumns: "1fr", maxWidth: "300px" };
                                            } else if (fileCount === 2) {
                                                return { gridTemplateColumns: "1fr 1fr", maxWidth: "630px" };
                                            } else {
                                                return { gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", maxWidth: "100%" };
                                            }
                                        })()
                                    }}
                                >
                                    {(() => {
                                        const filteredFiles = (props.careVoiceFiles || [])
                                            .map((file, originalIndex) => ({
                                                file,
                                                originalIndex
                                            }))
                                            .filter(({ file }) => {
                                                const fileName = file?.name || "";

                                                const isUploadedTranscript =
                                                    uploadedTranscriptFiles?.some(
                                                        (tFile) =>
                                                            tFile?.name === fileName
                                                    );

                                                const lowerName = fileName.toLowerCase();

                                                const isTranscriptDoc =
                                                    /(_\d+\.docx)$/i.test(fileName) &&
                                                    (
                                                        lowerName.includes("transcript") ||
                                                        lowerName.includes(".webm_") ||
                                                        lowerName.includes(".mp3_") ||
                                                        lowerName.includes(".wav_") ||
                                                        lowerName.includes(".mp4_") ||
                                                        lowerName.includes(".m4a_")
                                                    );

                                                return (
                                                    !isUploadedTranscript &&
                                                    !isTranscriptDoc
                                                );
                                            });

                                        return filteredFiles.map(
                                            ({ file, originalIndex }) => (
                                                <div
                                                    key={originalIndex}
                                                    className="generated-doc-card"
                                                    onClick={() =>
                                                        handleFilePreview(
                                                            file,
                                                            originalIndex
                                                        )
                                                    }
                                                >
                                                    <div className="generated-doc-content">
                                                        <div className="generated-doc-icon-wrapper">
                                                            <FiFileText
                                                                color="#fff"
                                                                size={18}
                                                                className="default-icon"
                                                            />
                                                        </div>

                                                        <div className="generated-doc-info">
                                                            <span
                                                                className="generated-doc-name"
                                                                title={file.name}
                                                            >
                                                                {file.name?.split(".")[0]}
                                                            </span>

                                                            <span
                                                                className="generated-doc-filename"
                                                                title={file.name}
                                                            >
                                                                {file.name}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Hover Icon in Top Right Corner */}
                                                    <div className="generated-doc-hover-icon">
                                                        <img
                                                            src={docFilePreviewIcon}
                                                            alt="preview"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="generated-docs-actions">
                                <button
                                    className="generate-doc-btns"
                                    onClick={handleDownloadAllDocs}
                                >
                                    <FiDownload size={18} />
                                    Download All Docs
                                </button>

                                <button
                                    className="generate-doc-btns"
                                    onClick={handleEmailAllDocs}
                                    disabled={isEmailingDocs}
                                    style={{
                                        opacity: isEmailingDocs ? 0.6 : 1,
                                        cursor: isEmailingDocs ? "not-allowed" : "pointer"
                                    }}
                                >
                                    <FiMail size={18} />
                                    {isEmailingDocs ? "Sending..." : "Email All Docs"}
                                </button>
                                <button
                                    className="start-with-new-template-btn"
                                    onClick={handleResetAll}
                                >
                                    <HiOutlineDocumentAdd size={18} />
                                    New Template
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Preview Modal */}
            <FilePreviewModal
                doc={previewDoc}
                fileIndex={previewIndex}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                careVoiceFiles={props.careVoiceFiles}
                setCareVoiceFiles={props.setCareVoiceFiles}
                userEmail={userEmail}
                staffEmail={staffEmail}
                staffName={staffName}
            />

            {openAccessManagement && (
                <AccessManagementForm
                    onClose={() => setOpenAccessManagement(false)}
                    userEmail={userEmail}
                />
            )}
        </div>
    );
};

export default VoiceModule;