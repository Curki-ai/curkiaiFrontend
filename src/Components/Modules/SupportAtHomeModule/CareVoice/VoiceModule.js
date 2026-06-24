import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { auth } from "../../../../firebase";
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
import { FiDownload, FiFileText, FiMail, FiUploadCloud, FiArrowUp } from "react-icons/fi";
import MapperGrid from "./VoiceModuleMapper";
import { RiDeleteBin6Line } from "react-icons/ri";
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
import incrementCareVoiceAnalysisCount from "../careVoiceCostAnalysis";
import FilePreviewModal from "./FilePreviewModal";
import docFilePreviewIcon from "../../../../Images/docFilePreviewIcon.svg"
import Lottie from "lottie-react";
import { HiOutlineDocumentAdd, HiOutlineSparkles } from "react-icons/hi";
import PulsatingLoader from "../../../general-components/PulsatingLoader";
import { RiSettingsLine } from "react-icons/ri";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { IoMdInformationCircleOutline } from "react-icons/io";
import CareVoiceAccessManagement from "./CareVoiceAccessManagement";
import SageConnect from "./SageConnect";
import CareVoiceNoOrgEmptyState from "./CareVoiceNoOrgEmptyState";
import GeneratingDocument from "./GeneratingDocument";
import { API_BASE } from "../../../../config/apiBase";

// `docx` is dynamic-imported inside createTranscriptDoc so the library only
// downloads when a user actually exports a transcript as a Word doc.

// DEV ONLY: flip to true to preview the "Generating Document" loading
// animation in the app without running the real generation flow (no API
// calls, no recording/upload needed). MUST stay false in committed code.
const PREVIEW_GENERATING_ANIMATION = false;

// adminPageLottie.json alone is 10.4 MB; eager-imported it dominated the
// Care Voice chunk. Loaders below split each animation into its own chunk
// that downloads only when the component that renders it mounts.
const loadSelectTemplateAnimation = () => import("../../../../Images/document.json");
const loadRecordingLottieAnimation = () => import("../../../../Images/recordingAnimation.json");
const loadBeforeRecordingAnimation = () => import("../../../../Images/beforeRecordingAnimation.json");
const loadAdminLottie = () => import("../../../../Images/adminPageLottie.json");

const LazyLottie = ({ loader, ...lottieProps }) => {
    const [animationData, setAnimationData] = useState(null);
    useEffect(() => {
        let cancelled = false;
        loader().then((m) => { if (!cancelled) setAnimationData(m.default || m); });
        return () => { cancelled = true; };
    }, [loader]);
    if (!animationData) return null;
    return <Lottie animationData={animationData} {...lottieProps} />;
};

const VoiceModule = (props) => {
    const userEmail = props?.user?.email;
    // const ALLOWED_USERS = [
    //     "mboutros@tenderlovingcaredisability.com.au",
    //     "rjodeh@tenderlovingcaredisability.com.au",
    //     "ryounes@tenderlovingcaredisability.com.au",
    //     "stickner@tenderlovingcaredisability.com.au",
    //     "bastruc@tenderlovingcaredisability.com.au",
    //     "yzaki@tenderlovingcare.com.au"
    // ];
    // const isAllowedUsers = ALLOWED_USERS.includes(
    //     (userEmail || "").toLowerCase()
    // );
    const tlcDomainArray = ["tenderlovingcaredisability.com.au", "tenderlovingcare.com.au"]
    const notAllowedDomain = tlcDomainArray.includes(userEmail?.split("@")[1]);

    const setCareVoiceFiles = props?.setCareVoiceFiles;
    const setIsCareVoiceGeneratingDocs = props?.setIsCareVoiceGeneratingDocs;
    const setTotalCareVoiceDocsToGenerate = props?.setTotalCareVoiceDocsToGenerate;
    const setGeneratedCareVoiceDocsCount = props?.setGeneratedCareVoiceDocsCount;
    const setIsCareVoiceLocked = props?.setIsCareVoiceLocked;
    // Email domain is still useful for the TLC allow-list checks above; it is
    // NOT used as the organization id anymore. Templates are now scoped by
    // the v2d-user-access UUID we fetch from /api/care-voice/organizations/by-email.
    const domain = userEmail?.split("@")[1] || "";


    // Organization resolution state. Drives the "no org → register" gate
    // below so a brand-new user lands on CareVoiceNoOrgEmptyState instead
    // of an empty/broken Care Voice screen.
    //   idle      — initial render, before useEffect kicks in
    //   loading   — fetch in flight
    //   found     — organizationId resolved, render the dashboard
    //   not_found — caller has no v2d-user-access row, render NoOrgEmptyState
    const [organizationId, setOrganizationId] = useState(null);
    const [organizationName, setOrganizationName] = useState("");
    const [orgLookupStatus, setOrgLookupStatus] = useState("idle");
    // Welcome toast trigger — deferred via useEffect below so the toast
    // fires only after ToastContainer is mounted in the main return.
    const [pendingWelcomeToast, setPendingWelcomeToast] = useState(false);

    const [role, setRole] = useState("Admin");
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [openAccessManagement, setOpenAccessManagement] = useState(false);
    const [openSageConnect, setOpenSageConnect] = useState(false);
    // Connecting to Sage can happen anytime (before or after generation), but a
    // replay needs a generated document — this flips true once one exists so the
    // SageConnect modal can enable its Replay button.
    const [sageDocReady, setSageDocReady] = useState(false);
    // Every generated document, accumulated for the Sage extension's "Data" tab:
    // {id, label, data:{placeholders, document}}. SageConnect auto-pushes this
    // list so the user can pick which doc (and workflow) to run per open page.
    const [sageDocs, setSageDocs] = useState([]);
    const addSageDoc = (filename, base64, extracted_data, label) => {
        setSageDocs((prev) => [
            ...prev,
            {
                id: `doc-${Date.now()}-${prev.length + 1}`,
                label: label || filename || `Document ${prev.length + 1}`,
                data: {
                    placeholders: extracted_data || null,
                    document: filename ? { filename, base64 } : null,
                },
            },
        ]);
    };
    // Keep the Sage doc list in lockstep with the VISIBLE generated docs: when a
    // new generation starts the displayed list clears, so reset sageDocs too —
    // otherwise a prior run's documents linger and the Data tab shows stale ones
    // (e.g. "2 documents" after generating only 1). New docs re-accumulate as
    // addSageDoc fires for this batch.
    useEffect(() => {
        if ((props?.careVoiceFiles?.length ?? 0) === 0) setSageDocs([]);
    }, [props?.careVoiceFiles]);
    // Holds the latest voice→document run's artifacts so a Sage replay can pass
    // the generated document along with the placeholders/values used to fill it.
    const lastSageDocRef = useRef(null);
    // Builds the v2d replay run-time data: the placeholders/values JSON the
    // filler extracted (e.g. {PARTICIPANT_NAME:"…"}) + the generated document.
    // Falls back to the active template's field mappings only if a run hasn't
    // produced extracted_data yet.
    const buildSageReplayData = () => {
        const latest = lastSageDocRef.current;
        let placeholders = latest?.extracted_data || null;
        if (!placeholders) {
            try {
                placeholders = selectedTemplate?.mappings
                    ? JSON.parse(selectedTemplate.mappings)
                    : null;
            } catch {
                placeholders = null;
            }
        }
        const document = latest
            ? { filename: latest.filename, base64: latest.base64 }
            : null;
        return { placeholders, document };
    };
    // Display name for stamping the workflow creator and the x-user-name header.
    const sageUserName =
        props?.user?.displayName || props?.user?.name || userEmail || "";
    const [templateFile, setTemplateFile] = useState(null);
    const [sampleFiles, setSampleFiles] = useState([]);
    // Optional real-source example (transcript/document) — makes onboarding generate
    // source-agnostic extraction specs. Posted as `source_sample` to /onboarding/start.
    const [sourceFiles, setSourceFiles] = useState([]);
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
    // Drives the list's loading / error / retry UI. Without these the list
    // failed silently (blank forever) when a fetch stalled or errored.
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState(false);
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
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioRef = useRef(null);
    const [audioURL, setAudioURL] = useState(null);
    const [recordTime, setRecordTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playTime, setPlayTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isDownloadingRecording, setIsDownloadingRecording] = useState(false);
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
    // Slider pagination is derived from REAL scroll geometry (not a hardcoded
    // "2 cards per view") so the dots stay correct on every screen size / zoom.
    // On a wide screen (or zoomed out) more cards fit per view → fewer scroll
    // positions → fewer dots. This is what kills the "extra trailing dot at the
    // end" bug, where the old N-1 dot count assumed exactly 2 cards visible.
    const [sliderPages, setSliderPages] = useState(1);
    const [sliderActivePage, setSliderActivePage] = useState(0);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [currentTask, setCurrentTask] = useState("");
    const progressIntervalRef = useRef(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [templateAccordions, setTemplateAccordions] = useState({
        aiResponse: false,
        generatedTemplate: false,
    });
    // Template-details workspace tab (replaces the old AI Response / Generated
    // Template accordions). One panel is always visible.
    const [activeTemplateTab, setActiveTemplateTab] = useState("aiResponse");
    const [editingNameId, setEditingNameId] = useState(null);
    const [tempName, setTempName] = useState("");

    const [mapperMode, setMapperMode] = useState("view");
    // "view" | "edit"
    const [staffStep, setStaffStep] = useState("landing");
    const [downloadingFileKey, setDownloadingFileKey] = useState(null);
    const [uploadedTranscriptFiles, setUploadedTranscriptFiles] = useState([]);
    // "multiple" = legacy (one API call per file, only first transcript_data used server-side per call).
    // "single" = combine all uploaded transcript files into one request per template.
    const [transcriptMergeMode, setTranscriptMergeMode] = useState("multiple");
    const [currentTranscriptIndex, setCurrentTranscriptIndex] = useState(0);
    const [dropdownPos, setDropdownPos] = useState(null);
    const [isPromptEditing, setIsPromptEditing] = useState(false);
    const [editedPrompt, setEditedPrompt] = useState("");
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [promptSavedToast, setPromptSavedToast] = useState(false);
    const sliderRef = useRef(null);
    // Holds the in-flight arrow-navigation target PAGE so rapid clicks
    // accumulate; cleared by recomputeSliderDots once the scroll settles.
    const sliderTargetRef = useRef(null);
    // "Back to top" floating button for the (often very long) template-details
    // prompt. voiceRootRef anchors us to the component so we can resolve which
    // ancestor actually scrolls; scrollTargetRef caches it.
    const voiceRootRef = useRef(null);
    const scrollTargetRef = useRef(null);
    // True while the smooth "return to top" animation is running, so the scroll
    // listener doesn't keep the button visible (or re-show it) during the climb.
    const isReturningToTopRef = useRef(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
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
        const { Document, Packer, Paragraph, TextRun } = await import("docx");
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
    const downloadRecording = async () => {
        if (!audioBlob || isDownloadingRecording) return;

        const sanitize = (s) =>
            String(s || "")
                .replace(/\.[a-zA-Z0-9]{1,5}$/, "")
                .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
                .replace(/\s+/g, "_")
                .replace(/_+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 80);

        let baseName = "";
        if (
            selectedTemplate?.isMulti &&
            Array.isArray(selectedTemplate.templates) &&
            selectedTemplate.templates.length > 0
        ) {
            baseName = selectedTemplate.templates
                .map((t) => sanitize(t.templateName))
                .filter(Boolean)
                .join("_");
        } else if (selectedTemplate?.templateName) {
            baseName = sanitize(selectedTemplate.templateName);
        }

        const filename = baseName
            ? `${baseName}_${Date.now()}`
            : `recording_${Date.now()}`;

        try {
            setIsDownloadingRecording(true);

            const formData = new FormData();
            formData.append("audio", audioBlob, `${filename}.webm`);
            formData.append("filename", filename);

            const res = await fetch(`${API_BASE}/api/care-voice/convert-to-mp3`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`Conversion failed (${res.status})`);
            }

            const mp3Blob = await res.blob();
            const url = window.URL.createObjectURL(mp3Blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `${filename}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download recording as mp3:", err);
            toast.error("Failed to download recording. Please try again.");
        } finally {
            setIsDownloadingRecording(false);
        }
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


            setGenerationStage("generating");
            animateProgress(audioProgress, setAudioProgress, 30, 600);

            const res = await fetch(`${API_BASE}/api/process-recording`, {
                method: "POST",
                body: formData
            });


            animateProgress(30, setAudioProgress, 70, 800);

            const data = await res.json();
            if (data?.generatedDocsSasUrls && Array.isArray(data?.generatedDocsSasUrls)) {
                setGeneratedDocsSasUrls(prev => [...prev, ...data?.generatedDocsSasUrls]);
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

    // Reads the slider's live geometry and returns the per-card stride
    // (card width + the REAL flex gap, not a hardcoded guess). Used by both the
    // dot math and the arrow scroll so they always agree on "one card".
    const getSliderStride = (slider) => {
        const card = slider.querySelector(".vm-template-card");
        if (!card) return 0;
        const track = slider.querySelector(".vm-template-track");
        const gap = track
            ? parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0
            : 0;
        return card.offsetWidth + gap;
    };

    // Recomputes how many dots to show and which one is active, straight from
    // the scroll container's measurements. Because it uses (scrollWidth -
    // clientWidth), it automatically accounts for however many cards actually
    // fit per view at the current width/zoom — so there's never an extra
    // trailing dot once you've scrolled to the end.
    const recomputeSliderDots = () => {
        const slider = sliderRef.current;
        if (!slider) return;

        const stride = getSliderStride(slider);
        const maxScroll = slider.scrollWidth - slider.clientWidth;

        if (stride <= 0 || maxScroll <= 1) {
            // Everything fits — no scrolling possible, so no dots.
            sliderTargetRef.current = null;
            setSliderPages(1);
            setSliderActivePage(0);
            setTemplateIndex(0);
            return;
        }

        // Number of single-card steps from start to end, + the start position.
        // Use ceil (with a small epsilon) instead of round so that ANY real
        // overflow — e.g. a last card that's only partly cut off at low zoom —
        // still counts as a scrollable page and lights up the arrows/dots. The
        // 0.1-card epsilon absorbs subpixel remainders so they don't add a
        // spurious trailing dot (the bug the old round() was guarding against).
        const maxPage = Math.max(1, Math.ceil(maxScroll / stride - 0.1));
        const pages = maxPage + 1;
        let active = Math.round(slider.scrollLeft / stride);

        // Snap to the last dot once we're at (or within 1px of) the end so a
        // fractional remainder can't leave a stray inactive dot trailing.
        if (maxScroll - slider.scrollLeft <= 1) active = maxPage;
        active = Math.min(Math.max(active, 0), maxPage);

        // Release the rapid-click target once the smooth scroll has landed on
        // it, so subsequent trackpad scrolls compute their base from the live
        // position rather than a stale target. The last page lives at maxScroll
        // (which may be a fraction of a card past the last whole step), so
        // resolve its target the same way scrollSlider() does.
        if (sliderTargetRef.current != null) {
            const tp = sliderTargetRef.current;
            const targetLeft = tp >= maxPage ? maxScroll : tp * stride;
            if (Math.abs(slider.scrollLeft - targetLeft) <= 2) {
                sliderTargetRef.current = null;
            }
        }

        setSliderPages(pages);
        setSliderActivePage(active);
        setTemplateIndex(active);
    };

    // Re-runs when the slider mounts/unmounts (templates count changes),
    // so the scroll listener is actually attached once the slider element
    // exists in the DOM. Also recomputes on window resize/zoom so the dots
    // stay responsive.
    useEffect(() => {
        const slider = sliderRef.current;
        if (!slider) return;

        const handleScroll = () => recomputeSliderDots();
        const handleResize = () => recomputeSliderDots();

        slider.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);
        // Run once on attach so the dots reflect the current geometry. Defer a
        // frame so layout (card widths) is settled before we measure.
        const raf = requestAnimationFrame(recomputeSliderDots);

        return () => {
            slider.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
            cancelAnimationFrame(raf);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [templates.length, stage, activeTemplate]);

    // Finds the element that actually scrolls. The real scroll container is an
    // ancestor div in HomePage (height:100vh; overflow-y:auto), NOT the window —
    // so we walk up from the module root to the nearest scrollable ancestor
    // (same approach the Financial module uses for its smooth history scroll).
    const resolveScrollTarget = () => {
        let el = voiceRootRef.current;
        while (el) {
            const oy = window.getComputedStyle(el).overflowY;
            if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) {
                return el;
            }
            el = el.parentElement;
        }
        return window;
    };

    // Show the "back to top" button once the user has scrolled the template
    // details view down past a threshold. Re-resolves the scroll target when
    // entering/leaving a template (content height changes drastically).
    useEffect(() => {
        const target = resolveScrollTarget();
        scrollTargetRef.current = target;

        const getTop = () =>
            target === window
                ? window.scrollY || document.documentElement.scrollTop || 0
                : target.scrollTop;

        const onScroll = () => {
            const top = getTop();
            // While returning to top, stay hidden; release the flag once we've
            // actually arrived so normal show/hide resumes afterwards.
            if (isReturningToTopRef.current) {
                if (top <= 4) isReturningToTopRef.current = false;
                setShowScrollTop(false);
                return;
            }
            setShowScrollTop(top > 320);
        };
        target.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => target.removeEventListener("scroll", onScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTemplate]);

    const scrollToTop = () => {
        // Hide instantly on click so the button vanishes the moment it's pressed.
        isReturningToTopRef.current = true;
        setShowScrollTop(false);

        // Native smooth scroll on the real scroll container — identical to the
        // Financial module's history-click animation the user wants to match.
        const target = scrollTargetRef.current || resolveScrollTarget();
        if (target && target !== window) {
            target.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

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

    // Report the active Care Voice role up to HomePage so the global "Ask AI"
    // button can show its hover/auto-show helper popup only for the Staff role
    // (mirrors the Smart Onboarding "Ask AI" popup behaviour).
    useEffect(() => {
        props?.onRoleChange?.(role);
    }, [role]);

    // Report whether the staff "Generated Documents" screen is showing, so
    // HomePage only auto-reveals the Ask AI popup once docs are generated.
    useEffect(() => {
        props?.onGeneratedDocsScreenChange?.(showGeneratedFilesUI);
    }, [showGeneratedFilesUI]);
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
            toast.warn("Prompt cannot be empty");
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

            // ✅ persist a pending override so a hard refresh (which reads from
            // the backend, which may still be lagging) keeps showing the saved
            // prompt until the backend's copy matches.
            recordPromptOverride(organizationId, activeTemplate.id, promptToSave);

            // ✅ optimistically reflect the saved prompt in the list + cache so
            // reopening the template (after "back") shows it immediately, even
            // before/independent of the background refetch below.
            setTemplates((prev) => {
                const next = (prev || []).map((t) =>
                    t.id === activeTemplate.id ? { ...t, prompt: promptToSave } : t
                );
                try {
                    sessionStorage.setItem(
                        templatesCacheKey(organizationId),
                        JSON.stringify(next)
                    );
                } catch (_) { /* quota / private mode — ignore */ }
                return next;
            });

            // ✅ refresh template list
            fetchTemplates();

            // ✅ show toast / success msg
            setPromptSavedToast(true);
            setTimeout(() => setPromptSavedToast(false), 1500);
        } catch (err) {
            console.error("Save prompt failed", err);
            toast.error("Failed to save prompt");
        } finally {
            setSavingPrompt(false);
        }
    };


    const AccordionHeader = ({ icon, title, subtitle, isOpen, onClick }) => (
        <button
            type="button"
            onClick={onClick}
            className="vm-accordion-header"
            aria-expanded={isOpen}
        >
            <img
                src={TlcPayrollDownArrow}
                alt=""
                aria-hidden="true"
                className={`vm-accordion-toggle ${isOpen ? "vm-accordion-toggle-open" : ""}`}
            />
            <div className="vm-accordion-header-text">
                <span className="vm-accordion-header-title">{title}</span>
                {icon === TlcPayrollInsightIcon && (
                    <img
                        src={icon}
                        alt=""
                        aria-hidden="true"
                        className="vm-accordion-header-icon"
                    />
                )}
            </div>
        </button>
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
    const releaseMicResources = () => {
        try {
            mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        } catch (e) {
            console.warn("Failed to stop mic tracks:", e);
        }
        mediaStreamRef.current = null;

        const ctx = audioContextRef.current;
        if (ctx && ctx.state !== "closed") {
            ctx.close().catch(() => { });
        }
        audioContextRef.current = null;
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

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
            releaseMicResources();
        };

        // 🎤 voice detect
        const audioContext = new window.AudioContext();
        audioContextRef.current = audioContext;
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
        const recorder = mediaRecorderRef.current;
        if (recorder && recorder.state !== "inactive") {
            try {
                recorder.stop();
            } catch (e) { /* noop */ }
        }
        releaseMicResources();
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
        return () => {
            const recorder = mediaRecorderRef.current;
            if (recorder && recorder.state !== "inactive") {
                try {
                    recorder.stop();
                } catch (e) { /* noop */ }
            }
            releaseMicResources();
        };
    }, []);

    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        const handleEnded = () => {
            setIsPlaying(false);
            setPlayTime(0);
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
            toast.warn("Audio must be at least 10 seconds long.");
            return;
        }
        if (setIsCareVoiceLocked) setIsCareVoiceLocked(true);
        try {
            if (platformType !== "windows" || platformType === "windows" || platformType !== "mac") {

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

    // Cache key is per-org so switching orgs doesn't show the previous org's
    // templates. sessionStorage (not localStorage) keeps the data tab-scoped
    // and clears on browser close.
    const templatesCacheKey = (orgId) => `cv:templates:${orgId}`;

    // Pending prompt saves, persisted so they survive a hard refresh. The
    // backend can lag a few seconds after a PUT, so a fresh GET may still return
    // the OLD prompt and wipe a table the user just saved. We keep the saved
    // prompt as an override until the backend's copy matches it (then drop it),
    // with a TTL so a normalising backend can never make it stick forever.
    const PROMPT_OVERRIDE_TTL_MS = 5 * 60 * 1000;
    const promptOverridesKey = (orgId) => `cv:promptOverrides:${orgId}`;

    const readPromptOverrides = (orgId) => {
        try {
            const raw = JSON.parse(localStorage.getItem(promptOverridesKey(orgId)) || "{}");
            const now = Date.now();
            let changed = false;
            const valid = {};
            Object.entries(raw || {}).forEach(([id, entry]) => {
                if (entry && now - entry.ts < PROMPT_OVERRIDE_TTL_MS) valid[id] = entry;
                else changed = true;
            });
            if (changed) {
                localStorage.setItem(promptOverridesKey(orgId), JSON.stringify(valid));
            }
            return valid;
        } catch (_) {
            return {};
        }
    };

    const writePromptOverrides = (orgId, overrides) => {
        try {
            localStorage.setItem(promptOverridesKey(orgId), JSON.stringify(overrides));
        } catch (_) { /* quota / private mode — ignore */ }
    };

    const recordPromptOverride = (orgId, templateId, prompt) => {
        const overrides = readPromptOverrides(orgId);
        overrides[templateId] = { prompt, ts: Date.now() };
        writePromptOverrides(orgId, overrides);
    };

    // Apply pending overrides to a freshly-fetched list, and clear any override
    // the backend has now caught up on.
    const applyPromptOverrides = (orgId, list) => {
        const overrides = readPromptOverrides(orgId);
        if (!Object.keys(overrides).length) return list || [];
        let changed = false;
        const merged = (list || []).map((t) => {
            const entry = overrides[t.id];
            if (!entry) return t;
            if (t.prompt === entry.prompt) {
                delete overrides[t.id]; // backend caught up
                changed = true;
                return t;
            }
            return { ...t, prompt: entry.prompt }; // keep the saved prompt
        });
        if (changed) writePromptOverrides(orgId, overrides);
        return merged;
    };

    // Wraps fetch with an abort-based timeout so a stalled backend or a
    // half-open connection can't leave the request pending for minutes — the
    // root cause of the "waited 5 mins and the list never came" bug (a bare
    // fetch() has no timeout and sits until the OS TCP timeout). Retries once
    // on timeout / network error with a short backoff.
    const fetchJsonWithTimeout = async (
        url,
        { timeoutMs = 15000, retries = 1, ...options } = {}
    ) => {
        for (let attempt = 0; ; attempt++) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timer);
                return res;
            } catch (err) {
                clearTimeout(timer);
                if (attempt >= retries) throw err;
                await new Promise((r) => setTimeout(r, 500));
            }
        }
    };

    const fetchTemplates = async () => {
        if (!organizationId) return;
        setTemplatesError(false);
        setTemplatesLoading(true);
        try {
            // Cache-bust + no-store so a just-saved prompt is never masked by a
            // stale HTTP-cached response (the "needs 2-3 refreshes" bug).
            const res = await fetchJsonWithTimeout(
                `${API_BASE}/api/voiceModuleTemplate?organizationId=${encodeURIComponent(organizationId)}&_t=${Date.now()}`,
                // The list pulls all templates (large prompt/mappings/sampleBlobs
                // each) from Cosmos. On a local backend hitting a remote Cosmos
                // over a slow link this can run well past 15s — long enough that
                // the old 15s abort fired, retried, and surfaced "couldn't load"
                // even though the backend had actually found the records. Give
                // the bulk list a generous ceiling; it still can't hang forever.
                { cache: "no-store", timeoutMs: 60000, retries: 1 }
            );
            const data = await res.json();
            if (!res.ok || !data?.success) {
                throw new Error(data?.message || `Request failed (${res.status})`);
            }
            // Guard against backend write-lag clobbering a just-saved prompt.
            const merged = applyPromptOverrides(organizationId, data?.data || []);
            setTemplates(merged);
            try {
                sessionStorage.setItem(
                    templatesCacheKey(organizationId),
                    JSON.stringify(merged)
                );
            } catch (_) { /* quota / private mode — ignore */ }
        } catch (err) {
            console.error("[UI] Fetch templates failed", err);
            // Surface a retryable error instead of failing silently. The render
            // only shows the banner when there's nothing cached to display, so
            // a painted list stays put rather than blanking out on a blip.
            setTemplatesError(true);
        } finally {
            setTemplatesLoading(false);
        }
    };

    useEffect(() => {
        if (!organizationId) return;
        // Paint cached templates immediately so the list isn't blank while
        // the network request is in flight. Background refresh happens below.
        try {
            const cached = sessionStorage.getItem(templatesCacheKey(organizationId));
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setTemplates(applyPromptOverrides(organizationId, parsed));
                }
            }
        } catch (_) { /* ignore */ }

        fetchTemplates();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);
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
        // Auto-topup balance gate (see HomePage's ANALYSIS_INTENT listener).
        const intent = new CustomEvent("ANALYSIS_INTENT", { cancelable: true });
        if (!window.dispatchEvent(intent)) return;

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
        // Optional real-source example (single file) — only sent if the user provided one.
        if (sourceFiles[0]) formData.append("source_sample", sourceFiles[0]);

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

        // Abort if no NEW event arrives within this window. The engine can
        // legitimately go silent for 2-3 min during a heavy LLM step on a
        // large document, so this must comfortably exceed that gap. A truly
        // dead engine is caught immediately via the WS-close "error" event,
        // so this watchdog only needs to be a generous backstop.
        const STALL_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes of silence
        let lastProgressAt = Date.now();
        let lastSeenSeq = 0;
        let done = false; // guards against late-arriving fetches after completion

        const finish = () => {
            done = true;
            clearInterval(interval);
        };

        const interval = setInterval(async () => {
            if (done) return;

            if (Date.now() - lastProgressAt > STALL_TIMEOUT_MS) {
                console.error(
                    "[UI] pollLatest stalled — no new events for",
                    STALL_TIMEOUT_MS,
                    "ms"
                );
                stopProgress();
                finish();
                setStage("review");
                toast.error(
                    "The AI engine stopped responding. Please try again or check backend logs."
                );
                return;
            }

            try {
                const res = await fetch(`${API_BASE}/api/onboarding/respond`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        sessionId: id,
                        action: "latest"
                    })
                });

                // Polling completed (or aborted) while this request was in flight — ignore.
                if (done) return;

                const data = await res.json();

                if (done) return;

                // Reset the stall watchdog whenever a NEW WS event arrives
                // (backend tags every event with an incrementing `seq`)
                if (typeof data?.seq === "number" && data.seq > lastSeenSeq) {
                    lastProgressAt = Date.now();
                    lastSeenSeq = data.seq;
                }

                if (!res.ok || data?.error) {
                    console.error("[UI] poll returned error:", data);
                    stopProgress();
                    finish();
                    setStage("review");
                    toast.error(
                        `Backend error: ${data?.error || res.status}. Please try again.`
                    );
                    return;
                }

                // ❌ WS / ENGINE ERROR
                if (data.type === "error") {
                    console.error("[UI] Engine reported error:", data?.payload);
                    stopProgress();
                    finish();
                    setStage("review");
                    toast.error(
                        `AI engine error: ${data?.payload?.message || "Unknown error"
                        }. Please try again.`
                    );
                    return;
                }

                // ✅ PROCESSING STATES (INCLUDING FEEDBACK)
                if (
                    data.type === "processing" ||
                    data.type === "status" ||
                    data.type === "processing_feedback"
                ) {
                    const detail =
                        data?.payload?.message ||
                        data?.payload?.status ||
                        data?.payload?.step ||
                        data?.message ||
                        "";
                    pushEvent(
                        detail ? `Processing: ${detail}` : "Processing document",
                        2
                    );
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
                    finish();
                    setStage("review");
                    return;
                }

                if (data.type === "final_result") {
                    setEditingTemplateId(null);
                    setActiveTemplate(null);
                    pushEvent("Final document generated", 4);

                    setRawPrompt(data.prompt || "");
                    setRawMapper(data?.mapper || null);

                    setAnalysisText(data.prompt);

                    // ✅ ONLY mapper.mapper flatten
                    setMapperRows(mapperToRows(data?.mapper));
                    // Stop further polling immediately — the backend deletes the
                    // session on final_result, so any in-flight follow-up poll
                    // would otherwise hit "Invalid sessionId".
                    finish();
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
                    return;
                }

                // Unknown type — log it so we can see exactly what the WS engine sent
                console.warn("[UI] Unknown event type from backend:", data?.type, data);
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
        setSourceFiles([]);
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
            toast.success(editingTemplateId ? "Template updated successfully" : "Template saved successfully");
            if (!editingTemplateId) {
                resetToTemplateList();
            }
            fetchTemplates();

        } catch (err) {
            console.error("[UI][SAVE] Failed", err);
            toast.error("Failed to save template");
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

        // templateId + organizationId let the middleware look up a cached
        // question_set and skip the (expensive) Stage-2 question generation
        // in Python. Falls back to prompt/mapper when the cache is empty.
        if (tpl.id) formData.append("templateId", tpl.id);
        if (organizationId) formData.append("organizationId", organizationId);

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
        // DEV PREVIEW: skip the real generation flow and just show the
        // "Generating Document" animation by flipping the same states the
        // real flow sets. See PREVIEW_GENERATING_ANIMATION at top of file.
        if (PREVIEW_GENERATING_ANIMATION) {
            setShowGeneratedFilesUI(true);
            setIsGeneratingFile(true);
            setFileStage("generating");
            setFileProgress(0);
            if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(true);
            if (setIsCareVoiceLocked) setIsCareVoiceLocked(true);
            return;
        }
        if (
            !selectedTemplate ||
            (selectedTemplate.isMulti && selectedTemplate.templates.length === 0)
        ) {
            toast.warn("Please select at least one template");
            return;
        }

        // Start from a clean result list so only this run's documents show —
        // see submitMultipleTranscripts for why (removed/unselected files must
        // not leave their previously-filled docs behind).
        if (setCareVoiceFiles) setCareVoiceFiles([]);

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

            // Cached question_set lookup keys.
            if (selectedTemplate.id) formData.append("templateId", selectedTemplate.id);
            if (organizationId) formData.append("organizationId", organizationId);

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
                lastSageDocRef.current = {
                    filename,
                    base64: data.filled_document,
                    extracted_data: data?.extracted_data || null,
                };
                setSageDocReady(true);
                // Add to the list the Sage extension's Data tab shows.
                addSageDoc(
                    filename,
                    data.filled_document,
                    data?.extracted_data || null,
                    selectedTemplate?.name || data?.document_name || filename
                );

                setGeneratedDocs(docs);
                // downloadBase64File(data.filled_document, filename);

                // await sendGeneratedDocsEmail(docs);
                // resetStaffUI();
            }

            setGeneratedDocs([]);
            emailSentRef.current = false;

        } catch (err) {
            console.error("Document generation failed", err);
            toast.error("Failed to generate document");
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
            // console.log("docs", docs)
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


    // Slider paging (dot count + active dot) is now derived from real scroll
    // geometry in recomputeSliderDots() so it stays correct at any width/zoom.
    // The old hardcoded "2 cards per view" counters lived here and caused the
    // extra-trailing-dot bug on wider screens.
    const isSingleView =
        templates.length === 1
    // Arrow navigation. Scrolls to an EXACT card boundary using native smooth
    // scroll, which cooperates with CSS scroll-snap (the container snaps to the
    // same boundaries on trackpad), so the rest position, dots and arrows can
    // never drift out of sync. sliderTargetRef holds the in-flight target page
    // so rapid clicks accumulate (each click advances exactly one more card
    // instead of collapsing into one), and recomputeSliderDots clears it once
    // the scroll settles.
    const scrollSlider = (dir) => {
        const slider = sliderRef.current;
        if (!slider) return;

        const stride = getSliderStride(slider);
        if (stride <= 0) return;

        const maxScroll = slider.scrollWidth - slider.clientWidth;
        // Must match recomputeSliderDots()'s page math (ceil + epsilon) so the
        // arrow can actually reach the partially-cut last card the dots promise.
        const maxPage = maxScroll <= 1 ? 0 : Math.max(1, Math.ceil(maxScroll / stride - 0.1));

        const base =
            sliderTargetRef.current != null
                ? sliderTargetRef.current
                : Math.round(slider.scrollLeft / stride);

        let page = dir === "left" ? base - 1 : base + 1;
        page = Math.max(0, Math.min(maxPage, page));
        sliderTargetRef.current = page;

        // The final page lands exactly at maxScroll so the last card is fully
        // revealed even when maxScroll isn't a whole number of card strides.
        slider.scrollTo({
            left: page >= maxPage ? maxScroll : page * stride,
            behavior: "smooth",
        });
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

        // Cached question_set lookup keys (middleware skips prompt/mapper
        // gen when these resolve to a populated questions array).
        if (tpl.id) formData.append("templateId", tpl.id);
        if (organizationId) formData.append("organizationId", organizationId);

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
        if (data.success && data.filled_document) {
            const filename = `${tpl.templateName}_${file.name}.docx`;

            const doc = { filename, base64: data.filled_document, sasUrl: data?.sasUrl, extracted_data: data?.extracted_data };
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


    // mode=single sibling of processSingleTranscriptWithTemplate: posts ALL
    // transcript files in one request so the filler API can merge them into a
    // single combined transcript before extraction.
    const processCombinedTranscriptsWithTemplate = async (tpl, files) => {
        const formData = new FormData();

        formData.append("templateBlobName", tpl.templateBlobName);
        formData.append("templateMimeType", tpl.templateMimeType);
        formData.append("templateOriginalName", tpl.templateOriginalName);

        formData.append(
            "sampleBlobs",
            JSON.stringify(tpl.sampleBlobs || [])
        );

        if (tpl.id) formData.append("templateId", tpl.id);
        if (organizationId) formData.append("organizationId", organizationId);

        formData.append("prompt", tpl.prompt);

        const parsedJson = JSON.parse(tpl.mappings);
        const normalizedMapper = {
            ...parsedJson,
            mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper
        };

        formData.append("mapper", JSON.stringify(normalizedMapper));
        formData.append("mode", "single");

        for (const file of files) {
            formData.append("transcript_data", file, file.name);
        }

        const res = await fetch(`${API_BASE}/api/document-filler`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();

        if (data.success && data.filled_document) {
            const filename = `${tpl.templateName}_combined.docx`;
            const doc = { filename, base64: data.filled_document, sasUrl: data?.sasUrl, extracted_data: data?.extracted_data };
            if (userEmail) {
                await incrementCareVoiceAnalysisCount(
                    userEmail,
                    "document-generation",
                    data?.llm_cost?.total_usd,
                    "carevoice",
                    data?.llm_cost?.token_usage
                );
            }
            return doc;
        }
        return null;
    };

    const submitMultipleTranscripts = async () => {
        setShowGeneratedFilesUI(true);
        if (setIsCareVoiceLocked) setIsCareVoiceLocked(true);
        // DEV PREVIEW: skip the real generation flow and just show the
        // "Generating Document" animation. See PREVIEW_GENERATING_ANIMATION.
        if (PREVIEW_GENERATING_ANIMATION) {
            setIsGeneratingFile(true);
            setFileStage("generating");
            setFileProgress(0);
            if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(true);
            return;
        }
        if (
            !selectedTemplate ||
            !selectedTemplate.isMulti ||
            selectedTemplate.templates.length === 0 ||
            uploadedTranscriptFiles.length === 0
        ) return;

        // Start each run from a clean slate so the result list shows ONLY the
        // documents generated for the currently-selected files. Without this,
        // careVoiceFiles keeps appending across runs, so a doc filled from a
        // file the user has since removed (unselected) lingers in the result.
        if (setCareVoiceFiles) setCareVoiceFiles([]);

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

        // Pre-transcribe step: when combine mode is on AND at least one
        // media file is in the upload, transcribe every media file first
        // via /process-recording (templates=[] so it just returns text),
        // then wrap each transcript as an in-memory .txt File. Those text
        // files are merged with the doc files into `filesToProcess`, so
        // the combined-doc branch below can batch them into one
        // /document-filler call per template with mode=single. Without
        // this step the media-vs-doc split would generate two separate
        // sets of docs, each filled from only half the source material.
        let filesToProcess = uploadedTranscriptFiles;
        const mediaSourceFiles = uploadedTranscriptFiles.filter(
            (f) => isAudioFile(f) || isVideoFile(f)
        );
        const docSourceFiles = uploadedTranscriptFiles.filter(
            (f) => !isAudioFile(f) && !isVideoFile(f)
        );
        const totalSources = mediaSourceFiles.length + docSourceFiles.length;
        const shouldPreTranscribeMedia =
            transcriptMergeMode === "single" &&
            mediaSourceFiles.length > 0 &&
            totalSources > 1;

        if (shouldPreTranscribeMedia) {
            try {
                setCurrentTask("Transcribing media files");
                const transcribeForm = new FormData();
                for (const f of mediaSourceFiles) {
                    transcribeForm.append("audio", f, f.name);
                }
                // Empty templates array → /process-recording skips
                // document generation and just returns transcripts.
                transcribeForm.append("templates", JSON.stringify([]));
                transcribeForm.append("userEmail", userEmail || "");
                transcribeForm.append("staffEmail", staffEmail || "");
                transcribeForm.append("staffName", staffName || "");
                // Pass the mode through purely for log/observability parity
                // — the controller skips doc generation when templates=[],
                // so the value has no effect on what's returned.
                transcribeForm.append("mode", "single");

                const transRes = await fetch(
                    `${API_BASE}/api/process-recording`,
                    { method: "POST", body: transcribeForm }
                );
                const transData = await transRes.json();

                const transcribedFiles = (transData?.transcripts || [])
                    .map((t, i) => {
                        const text = (t?.text || "").trim();
                        if (!text) return null;
                        const sourceName =
                            t?.fileName || mediaSourceFiles[i]?.name || `media_${i}`;
                        const baseName = sourceName.replace(/\.[^/.]+$/, "");
                        return new File(
                            [text],
                            `${baseName}_transcript.txt`,
                            { type: "text/plain" }
                        );
                    })
                    .filter(Boolean);

                if (transcribedFiles.length === 0) {
                    throw new Error("No usable transcripts produced from media files");
                }

                filesToProcess = [...transcribedFiles, ...docSourceFiles];
                setCurrentTask("Generating documents");
            } catch (err) {
                console.error("Pre-transcription failed:", err);
                toast.error("Failed to transcribe media files");
                setIsGeneratingFile(false);
                setFileStage(null);
                if (setIsCareVoiceGeneratingDocs) setIsCareVoiceGeneratingDocs(false);
                if (setIsCareVoiceLocked) setIsCareVoiceLocked(false);
                setCurrentTask("");
                return;
            }
        }

        // mode=single only kicks in when there are 2+ non-media files to
        // combine. With a single file the toggle is a no-op, so we fall back
        // to the legacy per-file path to avoid an unnecessary code branch.
        // After the pre-transcribe step above, any media file is already a
        // .txt File so this count covers the merged set.
        const nonMediaFilesCount = filesToProcess.filter(
            (f) => !isAudioFile(f) && !isVideoFile(f)
        ).length;
        const useSingleMode =
            transcriptMergeMode === "single" && nonMediaFilesCount > 1;
        let singleModeDocsProcessed = false;

        // Calculate total operations
        const totalOperations = filesToProcess.length;
        let completedOperations = 0;
        let hasError = false;
        const docsToSend = [];
        let generatedDocsSasUrls = [];
        // console.log(`Starting processing of ${totalOperations} total operations`);
        // console.log(`Templates: ${selectedTemplate.templates.length}, Files: ${uploadedTranscriptFiles.length}`);

        // Closes over the local counters/state so the parallel per-template
        // branches below can share a single result-handler. Mutates the same
        // docsToSend / generatedDocsSasUrls arrays the surrounding flow uses.
        const handleGeneratedDoc = (doc) => {
            if (!doc) return;

            if (doc?.sasUrl) {
                if (Array.isArray(doc.sasUrl)) {
                    generatedDocsSasUrls.push(...doc.sasUrl);
                } else {
                    generatedDocsSasUrls.push(doc.sasUrl);
                }
            }
            docsToSend.push(doc);
            // Remember the latest generated doc + its extracted placeholder/values
            // JSON so a Sage replay can carry both.
            if (doc.base64) {
                lastSageDocRef.current = {
                    filename: doc.filename,
                    base64: doc.base64,
                    extracted_data: doc.extracted_data || null,
                };
                setSageDocReady(true);
                // Add to the list the Sage extension's Data tab shows + auto-pushes.
                addSageDoc(
                    doc.filename,
                    doc.base64,
                    doc.extracted_data || null,
                    doc.filename
                );
            }

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
            setCareVoiceFiles(prev => [...prev, fileObj]);

            docsGeneratedSoFar++;
            totalDocsExpected++;
            if (setGeneratedCareVoiceDocsCount) setGeneratedCareVoiceDocsCount(docsGeneratedSoFar);
            if (setTotalCareVoiceDocsToGenerate) setTotalCareVoiceDocsToGenerate(totalDocsExpected);
            setDocsGeneratedCount(docsGeneratedSoFar);
            setTotalDocsToGenerate(totalDocsExpected);
        };

        // Process each file with ALL templates in ONE API call
        for (const file of filesToProcess) {
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
                    if (data?.generatedDocsSasUrls) {
                        data?.generatedDocsSasUrls.map(sasUrl => {
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

                                // Capture the latest doc so Sage replay is enabled
                                // for the recording/audio path too (staff records →
                                // document → replay). base64 is read from the blob;
                                // extracted_data is the placeholder/values map if the
                                // backend returned one.
                                try {
                                    const b64 = await new Promise((resolve, reject) => {
                                        const r = new FileReader();
                                        r.onloadend = () => resolve(String(r.result).split(",")[1] || "");
                                        r.onerror = reject;
                                        r.readAsDataURL(blob);
                                    });
                                    const sageFilename =
                                        doc.filename || `${file.name}_document.docx`;
                                    lastSageDocRef.current = {
                                        filename: sageFilename,
                                        base64: b64,
                                        extracted_data: doc.extracted_data || null,
                                    };
                                    setSageDocReady(true);
                                    addSageDoc(
                                        sageFilename,
                                        b64,
                                        doc.extracted_data || null,
                                        sageFilename
                                    );
                                } catch (e) {
                                    /* non-fatal — Sage replay just stays disabled */
                                }

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
                else if (useSingleMode) {
                    // Combined-transcript path: process ALL non-media files in
                    // one batched call per template, only on the first
                    // non-media iteration. Subsequent non-media iterations
                    // fall through to the finally block to tick progress
                    // (media iterations interleaved before/after still run).
                    if (singleModeDocsProcessed) {
                        // no-op; progress ticks in finally
                    } else {
                        singleModeDocsProcessed = true;

                        const docFiles = filesToProcess.filter(
                            (f) => !isAudioFile(f) && !isVideoFile(f)
                        );

                        // Fan out all templates in parallel. allSettled keeps a
                        // single template's failure from cancelling the rest.
                        const results = await Promise.allSettled(
                            selectedTemplate.templates.map((tpl) =>
                                processCombinedTranscriptsWithTemplate(tpl, docFiles)
                            )
                        );

                        results.forEach((r, i) => {
                            if (r.status === "fulfilled") {
                                handleGeneratedDoc(r.value);
                            } else {
                                const tpl = selectedTemplate.templates[i];
                                console.error(
                                    `Error processing template ${tpl.id} with combined transcripts:`,
                                    r.reason
                                );
                                hasError = true;
                            }
                        });
                    }
                }
                else {
                    // For non-audio/video files (PDF, DOC, TXT, etc.)

                    // Fan out all templates for this file in parallel.
                    // allSettled keeps a single template's failure from
                    // cancelling the rest.
                    const results = await Promise.allSettled(
                        selectedTemplate.templates.map((tpl) =>
                            processSingleTranscriptWithTemplate(tpl, file)
                        )
                    );

                    results.forEach((r, i) => {
                        if (r.status === "fulfilled") {
                            handleGeneratedDoc(r.value);
                        } else {
                            const tpl = selectedTemplate.templates[i];
                            console.error(
                                `Error processing template ${tpl.id} with file ${file.name}:`,
                                r.reason
                            );
                            hasError = true;
                        }
                    });
                }
            } catch (err) {
                console.error("Error processing file:", file.name, err);
                hasError = true;
            } finally {
                completedOperations++;
                const progressPercent = Math.floor((completedOperations / totalOperations) * 100);
                setFileProgress(progressPercent);
                if (setIsCareVoiceLocked) setIsCareVoiceLocked(false);
                // Add a small delay between file processing
                if (completedOperations < totalOperations) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        }

        setGeneratedDocsSasUrls(generatedDocsSasUrls);
        if (docsToSend.length > 0) {
            setFileStage("emailing");
            setFileProgress(90);
            // await sendGeneratedDocsEmail(docsToSend);
            toast.success(`Successfully generated ${docsToSend.length} document(s)!`);
        } else {
            if (!hasError) {
                toast.warn("No documents were generated. Please check your audio files and templates.");
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
            toast.error("Failed to download file");
        } finally {
            setDownloadingFileKey(null);
        }
    };

    useEffect(() => {
        if (props.isMobileOrTablet) {
            setRole("Staff");
        }
    }, [props.isMobileOrTablet]);

    // The loading screens ("Analyzing with AI" for admins, "Generating
    // Document" for staff) have no real content to scroll to, yet their
    // animation stack can run a few pixels past the viewport and surface the
    // page scrollbar. Lock page scroll while a loader is mounted and release
    // it on cleanup. Scoped to these stages only via a root <html> class, so
    // every other screen keeps its normal scrolling/layout untouched.
    const isCareVoiceLoading =
        stage === "processing" ||
        (showGeneratedFilesUI &&
            (props?.careVoiceFiles?.length === 0 || props?.isCareVoiceGeneratingDocs));

    useEffect(() => {
        if (!isCareVoiceLoading) return undefined;

        // The app's scrollable region is an inner container in HomePage
        // (a flex column with height:100vh; overflow-y:auto), NOT <html> — so
        // we can't just lock the document root. Walk up from this module and
        // lock every scrollable ancestor, then restore exactly what we changed
        // on cleanup. <html> is locked too as a harmless fallback. Nothing
        // else is touched, so other screens keep their normal scrolling.
        const start = document.querySelector(".voice-container");
        const locked = [];

        document.documentElement.classList.add("cv-loading-lock");

        let node = start ? start.parentElement : null;
        while (node && node !== document.documentElement) {
            const overflowY = window.getComputedStyle(node).overflowY;
            if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") {
                locked.push({ el: node, prev: node.style.overflowY });
                node.style.overflowY = "hidden";
            }
            node = node.parentElement;
        }

        return () => {
            document.documentElement.classList.remove("cv-loading-lock");
            locked.forEach(({ el, prev }) => {
                el.style.overflowY = prev;
            });
        };
    }, [isCareVoiceLoading]);

    // Resolve the caller's organization on mount (or whenever userEmail
    // changes). The same lookup feeds three things:
    //   - organizationId (UUID)  → used by every template endpoint below
    //   - organizationName        → display label (Access Management modal etc.)
    //   - currentUserRole         → drives the role-switcher options
    // If the lookup returns an empty `organizations` array we set
    // orgLookupStatus="not_found"; the render below then shows
    // CareVoiceNoOrgEmptyState instead of the dashboard.
    const fetchOrganization = async () => {
        if (!userEmail) return;
        setOrgLookupStatus("loading");
        try {
            const firebase_uid = auth.currentUser?.uid || "";
            const res = await fetchJsonWithTimeout(
                `${API_BASE}/api/care-voice/organizations/by-email?email=${encodeURIComponent(userEmail)}` +
                (firebase_uid ? `&firebase_uid=${encodeURIComponent(firebase_uid)}` : ""),
                { timeoutMs: 15000, retries: 1 }
            );
            const data = await res.json();
            const first = data?.organizations?.[0];
            if (res.ok && data?.ok && first?.organizationId) {
                setOrganizationId(first.organizationId);
                setOrganizationName(first.organizationName || "");
                const apiRole = String(first.role || "").toLowerCase();
                if (apiRole === "staff") {
                    setCurrentUserRole("staff");
                    setRole("Staff");
                } else if (apiRole === "admin" || apiRole === "owner") {
                    // Owner is a superset of admin — same UI privileges
                    // (Access Management, etc.) but a distinct backend role.
                    setCurrentUserRole(apiRole);
                }
                setOrgLookupStatus("found");
                if (data.justActivated) {
                    setPendingWelcomeToast(true);
                }
            } else if (res.ok && data?.ok) {
                // Genuine empty result — the caller really has no org yet.
                setOrganizationId(null);
                setOrganizationName("");
                setOrgLookupStatus("not_found");
            } else {
                // Bad / uninterpretable response. Treat as a transient error
                // rather than "no org", so a backend blip doesn't wrongly drop
                // the user onto the register screen (and never load templates).
                throw new Error(data?.message || `Org lookup failed (${res.status})`);
            }
        } catch (err) {
            console.error("[VoiceModule] org lookup failed", err);
            // Network error / timeout / bad response → retryable error screen,
            // NOT "not_found". Previously any blip here showed the register
            // screen and the template list never even attempted to load.
            setOrgLookupStatus("error");
        }
    };

    useEffect(() => {
        fetchOrganization();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userEmail]);

    // Fire the welcome toast only after the main return has rendered
    // (i.e. ToastContainer is in the DOM). Emitting from inside the
    // fetch's then-block runs during the "loading"/transition render
    // when no ToastContainer is mounted and the message is dropped.
    useEffect(() => {
        if (orgLookupStatus === "found" && pendingWelcomeToast) {
            toast.success(
                "Welcome! Your invitation to Curki Care Voice has been accepted."
            );
            setPendingWelcomeToast(false);
        }
    }, [orgLookupStatus, pendingWelcomeToast]);

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

    };
    // if (!isAllowedUsers && notAllowedDomain) {
    //     return (
    //         <div style={{
    //             textAlign: "center",
    //             padding: "120px 20px",
    //             fontFamily: "Inter, sans-serif",
    //             color: "#1f2937"
    //         }}>
    //             {/* <img
    //                 src={TlcLogo}
    //                 alt="Access Denied"
    //                 style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
    //             /> */}

    //             <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
    //                 Access Restricted 🚫
    //             </h2>

    //             <p style={{ fontSize: "16px", color: "#555" }}>
    //                 Sorry, your account (<strong>{userEmail}</strong>)
    //                 is not authorized to view this page.
    //             </p>
    //         </div>
    //     )
    // }

    // No org → show the create-organization screen. Mirrors the Smart
    // Onboarding "no org → register" flow. We render this AFTER the
    // access-restricted check so blocked users still see the right copy,
    // and before the main return so none of the dashboard code runs
    // against a null organizationId.
    if (orgLookupStatus === "not_found") {
        return (
            <CareVoiceNoOrgEmptyState
                userEmail={userEmail}
                onRegistered={() => fetchOrganization()}
            />
        );
    }

    // Transient failure resolving the org (network / timeout / bad response).
    // Offer a retry instead of silently showing the register screen or a
    // perpetually-blank dashboard.
    if (orgLookupStatus === "error") {
        return (
            <div className="vm-org-error">
                <div className="vm-org-error-title">
                    Couldn't load Care Voice
                </div>
                <div className="vm-org-error-text">
                    We couldn't reach the server. Check your connection and try again.
                </div>
                <button
                    className="vm-org-error-retry"
                    onClick={() => fetchOrganization()}
                >
                    Retry
                </button>
            </div>
        );
    }

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
        toast.info("Sending email… please wait");

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
            toast.success("Email sent successfully");
        } catch (error) {
            toast.error("Failed to send email");
            console.error(error);
        } finally {
            setIsEmailingDocs(false);
        }
    };
    return (
        <div className="voice-container" ref={voiceRootRef}>
            {/* ToastContainer is mounted once globally in HomePage. */}
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

                <div className="voice-top-actions">
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
                    {/* Connect to Sage is available to both Admin and Staff — staff
                        generate documents (recording / transcript upload) and replay
                        them once a document exists. */}
                    {/* <button
                        className="access-mgmt-trigger-btn access-mgmt-trigger-btn--accent"
                        onClick={() => setOpenSageConnect(true)}
                        type="button"
                    >
                        <HiOutlineSparkles size={18} color="#6C4CDC" />
                        Connect to Sage
                    </button> */}
                </div>
            </div>


            <div className="voice-divider" />
            {role === "Staff" && !showGeneratedFilesUI && staffStep === "landing" && (
                <div className="staff-landing-container">
                    <div className="staff-landing-content">
                        {/* Lottie Animation */}
                        <div className="staff-landing-animation">
                            <LazyLottie
                                loader={loadSelectTemplateAnimation}
                                loop={true}
                                autoplay={true}
                            />
                        </div>

                        {/* Text Content */}
                        <div className="staff-landing-text">
                            <h2 className="staff-landing-title">
                                Select A Template To Populate
                            </h2>
                            <p className="staff-landing-description">
                                <span className="staff-landing-description-line">Choose a template to get started. We'll automatically</span>
                                <span className="staff-landing-description-line">structure and populate your transcript or recording.</span>
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

                            {/* Floating "back to top" — long prompts can run for
                                many screens, so let the user jump up instantly
                                instead of scrolling the whole way back. */}
                            {showScrollTop && (
                                <button
                                    type="button"
                                    className="vm-scroll-top-btn"
                                    onClick={scrollToTop}
                                    aria-label="Scroll to top"
                                    title="Back to top"
                                >
                                    <FiArrowUp size={22} strokeWidth={2.5} />
                                </button>
                            )}

                            {/* BACK + SAVE */}
                            <div className="vm-template-details-topbar">
                                <button
                                    type="button"
                                    className="vm-back-btn"
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
                                    aria-label="Back to template list"
                                >
                                    <GoArrowLeft size={22} color="#6C4CDC" /> Back
                                </button>

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
                                <div className="vm-uploaded-docs-title-row">
                                    <img src={careVoiceTemplateViewDoc} alt="" aria-hidden="true" />
                                    <h4>Uploaded Documents</h4>
                                </div>
                                <div className="vm-file-list vm-uploaded-docs-list">
                                    <div className="vm-file-item vm-file-item-doc vm-file-item-doc-static">
                                        <div className="vm-file-item-doc-inner">
                                            <img
                                                src={careVoiceDocIcon}
                                                alt=""
                                                aria-hidden="true"
                                                className="vm-file-doc-icon"
                                            />
                                            <div className="vm-file-item-doc-text">
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

                                        {/* Download is an explicit button now — clicking the
                                            card body no longer downloads, so accidental clicks
                                            are harmless while a real download stays one click. */}
                                        <button
                                            type="button"
                                            className={`vm-file-download-btn ${downloadingFileKey === `template-${activeTemplate.id}` ? "is-downloading" : ""}`}
                                            disabled={!!downloadingFileKey}
                                            aria-label="Download Template Structure"
                                            title="Download"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (downloadingFileKey) return;
                                                handleDownloadBlob({
                                                    fileKey: `template-${activeTemplate.id}`,
                                                    templateId: activeTemplate.id,
                                                    originalName: activeTemplate.templateOriginalName,
                                                });
                                            }}
                                        >
                                            {downloadingFileKey === `template-${activeTemplate.id}` ? (
                                                <span className="vm-file-download-spinner" aria-hidden="true" />
                                            ) : (
                                                <FiDownload size={18} />
                                            )}
                                        </button>
                                    </div>

                                    {activeTemplate.sampleBlobs?.map((file, i) => {
                                        const fileExt = file.originalName?.split('.').pop()?.toLowerCase();
                                        const isPDF = fileExt === 'pdf';
                                        const fileKey = `sample-${activeTemplate.id}-${i}`;
                                        const isDownloading = downloadingFileKey === fileKey;
                                        const triggerDownload = () =>
                                            handleDownloadBlob({
                                                fileKey,
                                                templateId: activeTemplate.id,
                                                blobName: file.blobName,
                                                originalName: file.originalName,
                                            });
                                        return (
                                            <div
                                                key={i}
                                                className="vm-file-item vm-file-item-doc vm-file-item-doc-static"
                                            >
                                                <div className="vm-file-item-doc-inner">
                                                    <img
                                                        src={isPDF ? careVoicePdfIcon : careVoiceDocIcon}
                                                        alt=""
                                                        aria-hidden="true"
                                                        className="vm-file-doc-icon"
                                                    />
                                                    <div className="vm-file-item-doc-text">
                                                        <div className="vm-file-name">
                                                            {isDownloading ? "Downloading..." : "Sample Document"}
                                                        </div>
                                                        <div className="vm-file-status">
                                                            {isDownloading ? "Please wait" : file.originalName}
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className={`vm-file-download-btn ${isDownloading ? "is-downloading" : ""}`}
                                                    disabled={!!downloadingFileKey}
                                                    aria-label={`Download ${file.originalName || "sample document"}`}
                                                    title="Download"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (downloadingFileKey) return;
                                                        triggerDownload();
                                                    }}
                                                >
                                                    {isDownloading ? (
                                                        <span className="vm-file-download-spinner" aria-hidden="true" />
                                                    ) : (
                                                        <FiDownload size={18} />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* WORKSPACE TABS (replaces the AI Response / Generated Template accordions) */}
                            <div className="vm-workspace">
                                <div className="vm-workspace-tabs" role="tablist" aria-label="Template workspace">
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTemplateTab === "aiResponse"}
                                        className={`vm-workspace-tab ${activeTemplateTab === "aiResponse" ? "is-active" : ""}`}
                                        onClick={() => setActiveTemplateTab("aiResponse")}
                                    >
                                        {/* <span className="vm-workspace-tab-icon" aria-hidden="true">
                                            <img src={TlcPayrollInsightIcon} alt="" />
                                        </span> */}
                                        <span className="vm-workspace-tab-label">AI Response</span>
                                    </button>

                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={activeTemplateTab === "generatedTemplate"}
                                        className={`vm-workspace-tab ${activeTemplateTab === "generatedTemplate" ? "is-active" : ""}`}
                                        onClick={() => setActiveTemplateTab("generatedTemplate")}
                                    >
                                        {/* <span className="vm-workspace-tab-icon" aria-hidden="true">
                                            <img src={AdminTemplateViewIcon} alt="" />
                                        </span> */}
                                        <span className="vm-workspace-tab-label">Generated Template</span>
                                        {/* {mapperRows.length > 0 && (
                                            <span className="vm-workspace-tab-count">{mapperRows.length}</span>
                                        )} */}
                                    </button>
                                </div>

                                <div className="vm-workspace-panel" role="tabpanel" key={activeTemplateTab}>
                                    {activeTemplateTab === "aiResponse" && (
                                        <div className="analysis-box">
                                            <PromptBlockEditor
                                                value={editedPrompt || activeTemplate?.prompt || ""}
                                                onChange={(val) => setEditedPrompt(val)}
                                                rightSlot={
                                                    <button
                                                        type="button"
                                                        className="vm-prompt-save-btn"
                                                        disabled={savingPrompt}
                                                        onClick={savePromptDirectly}
                                                    >
                                                        {savingPrompt ? "Saving..." : "Save"}
                                                    </button>
                                                }
                                            />

                                            {promptSavedToast && (
                                                <div className="vm-prompt-saved-toast">
                                                    ✅ Saved
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTemplateTab === "generatedTemplate" && (
                                        <FieldMapperPro
                                            mapperRows={mapperRows}
                                            setMapperRows={setMapperRows}
                                            mapperMode={mapperMode}
                                        />
                                    )}
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ===== TEMPLATE LIST: loading (nothing cached yet) ===== */}
                    {stage === "idle" && !activeTemplate && templates.length === 0 && templatesLoading && (
                        <div className="vm-template-list">
                            <div className="vm-template-status vm-template-status-loading">
                                <span className="vm-template-spinner" aria-hidden="true" />
                            </div>
                        </div>
                    )}

                    {/* ===== TEMPLATE LIST: error (nothing cached to show) ===== */}
                    {stage === "idle" && !activeTemplate && templates.length === 0 && !templatesLoading && templatesError && (
                        <div className="vm-template-list">
                            <div className="vm-template-status vm-template-status-error">
                                <span>Couldn't load your templates.</span>
                                <button
                                    className="vm-template-retry-btn"
                                    onClick={fetchTemplates}
                                >
                                    Retry
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= TEMPLATE LIST ================= */}
                    {stage === "idle" && !activeTemplate && templates.length > 0 && (
                        <div className="vm-template-list">
                            <div className="vm-template-header">
                                <div className="vm-template-list-title">
                                    Available Template
                                </div>

                                {/* Always visible — arrows simply disable themselves
                                    when there's nothing to scroll, instead of vanishing. */}
                                <div className="vm-template-header-arrows">
                                    <button
                                        className="vm-slider-arrow"
                                        onClick={() => scrollSlider("left")}
                                        disabled={sliderActivePage === 0}
                                    >
                                        <img src={careVoiceLeft} alt="prev" />
                                    </button>

                                    <button
                                        className="vm-slider-arrow"
                                        onClick={() => scrollSlider("right")}
                                        disabled={sliderActivePage >= sliderPages - 1}
                                    >
                                        <img src={careVoiceRight} alt="next" />
                                    </button>
                                </div>

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
                                        {templates.map((tpl, index) => {
                                            const openTemplate = () => {
                                                if (openMenuId) return;
                                                if (editingNameId === tpl.id) return;
                                                setActiveTemplate(tpl);
                                                setMapperMode("edit");
                                                setEditingTemplateId(tpl.id);
                                                setRawPrompt(tpl.prompt || "");
                                                setRawMapper(tpl.mappings || null);
                                                setMapperRows(mapperToRows(tpl.mappings));
                                            };
                                            return (
                                                <div key={tpl.id} className="vm-template-slide">
                                                    <div
                                                        className={`vm-template-card ${templates.length === 2 ? "vm-template-card-two" : ""}`}
                                                        role="button"
                                                        tabIndex={editingNameId === tpl.id ? -1 : 0}
                                                        aria-label={`Open template ${tpl.templateName || `Voice Template ${index + 1}`}`}
                                                        onClick={openTemplate}
                                                        onKeyDown={(e) => {
                                                            if (e.target !== e.currentTarget) return;
                                                            if (e.key === "Enter" || e.key === " ") {
                                                                e.preventDefault();
                                                                openTemplate();
                                                            }
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

                                                                    {/* RIGHT : DOTS or RENAME ACTIONS */}
                                                                    {editingNameId === tpl.id ? (
                                                                        <div className="vm-template-actions vm-template-rename-actions">
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
                                                                        <div className="vm-template-actions">
                                                                            <span
                                                                                className="vm-dots"
                                                                                onClick={(e) => openDropdown(e, tpl.id)}
                                                                            >
                                                                                ...
                                                                            </span>
                                                                        </div>
                                                                    )}

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
                                            );
                                        })}
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
                            {/* Always visible — shows at least one dot even when
                                all templates fit and there's nothing to page through. */}
                            <div className="vm-slider-dots">
                                {Array.from({ length: Math.max(sliderPages, 1) }).map((_, i) => (
                                    <span
                                        key={i}
                                        className={`vm-slider-dot ${i === sliderActivePage ? "active" : ""
                                            }`}
                                    />
                                ))}
                            </div>

                        </div>
                    )}


                    {/* Upload Section - Hidden when analyze clicked OR during processing */}
                    {stage !== "processing" && stage !== "completed" && stage !== "review" && !activeTemplate && (
                        <div className="vm-admin-heading">
                            <div className="vm-admin-lottie">
                                <LazyLottie
                                    loader={loadAdminLottie}
                                    loop={true}
                                    autoplay={true}
                                    className="vm-admin-lottie-anim"
                                />
                            </div>
                            <h2 className="vm-admin-title">
                                Make Care Voice Template
                            </h2>
                            <p className="vm-admin-subtitle">
                                Turn your document structure into a template you can reuse anytime.
                            </p>
                        </div>
                    )}
                    {showUploadSection && stage !== "processing" && !activeTemplate && (
                        <>
                            <div className="voice-upload-row-admin">
                                {/* ================= TEMPLATE COLUMN ================= */}
                                <div className="voice-upload-col">
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
                                <div className="voice-upload-col">
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

                                {/* ============ SOURCE EXAMPLE COLUMN (optional) ============ */}
                                <div className="voice-upload-col">
                                    <TlcUploadBox
                                        id="admin-source-upload"
                                        title="Source Example"
                                        subtitle=".DOC, .PDF (optional)"
                                        accept=".doc,.docx,.pdf"
                                        files={sourceFiles}
                                        multiple={false}
                                        setFiles={setSourceFiles}
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

                    {/* ================= PROCESSING ================= */}
                    {stage === "processing" && (
                        <div className="vm-admin-processing">
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
                            <div className="analysis-actions analysis-actions-row">

                                {/* Only show Request Changes button when NOT requesting changes */}
                                {!isRequestingChanges && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowFeedbackBox(true);
                                            setIsRequestingChanges(true);
                                        }}
                                        className="analysis-feedback-request-btn"
                                    >
                                        <FiEdit size={15} />
                                        Request Changes
                                    </button>
                                )}
                                {!isRequestingChanges && (
                                    <button
                                        type="button"
                                        onClick={acceptAnalysis}
                                        className="analysis-accept-btn analysis-accept-btn-primary"
                                    >
                                        Accept and analyse
                                        <img src={star} alt="" aria-hidden="true" className="voice-star" />
                                    </button>
                                )}
                            </div>

                            {/* ===== FEEDBACK / REQUEST CHANGES ===== */}
                            {showFeedbackBox && (
                                <div className="analysis-feedback-section">
                                    <div className="analysis-feedback-header">
                                        {/* <div className="analysis-feedback-header-icon">
                                            <FiEdit size={15} />
                                        </div> */}
                                        <div className="analysis-feedback-header-text">
                                            <div className="analysis-feedback-title">
                                                Request changes
                                            </div>
                                            <div className="analysis-feedback-subtitle">
                                                Tell the AI what to adjust — the more specific, the better the result.
                                            </div>
                                        </div>
                                    </div>

                                    <textarea
                                        ref={feedbackTextareaRef}
                                        className="analysis-feedback-input"
                                        placeholder="e.g. Please rephrase section 2 in a more formal tone…"
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        rows="5"
                                    />

                                    <div className="analysis-feedback-footer">
                                        <span className="analysis-feedback-count">
                                            {feedbackText.length} {feedbackText.length === 1 ? "character" : "characters"}
                                        </span>
                                        <div className="analysis-actions analysis-actions-row-feedback">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowFeedbackBox(false);
                                                    setIsRequestingChanges(false);
                                                    setFeedbackText("");
                                                }}
                                                className="analysis-feedback-discard-btn"
                                            >
                                                Discard Changes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={sendFeedback}
                                                className="analysis-feedback-submit-btn"
                                                disabled={!feedbackText.trim()}
                                            >
                                                Submit Changes
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="analysis-box analysis-box-review">
                                <div className="voice-explanation-section">
                                    <CareVoiceExplainationMarkdown content={analysisText} />
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Completed */}
                    {stage === "completed" && (
                        <div className="analysis-completed">
                            <div className="analysis-completed-actions">
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
                        {/* LEFT — only visible before recording starts */}
                        {!["recording", "paused"].includes(recordMode) && (
                            <div className="vm-rec-conv-title">
                                <h2>Record Conversation</h2>
                                <p>Start recording to fill your selected template</p>
                            </div>
                        )}

                        {/* RIGHT */}
                        {selectedTemplate && (
                            <div className="vm-rec-header-right">
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
                            </div>
                        )}

                    </div>

                    <div
                        className={`staff-record-upload-row ${!["recording", "paused", "preview"].includes(recordMode)
                            ? "has-upload"
                            : "recorder-only"
                            }`}
                    >
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
                                <div className={`staff-rec-circle ${recordMode === "idle" ? "is-before-recording" : ""}`}>
                                    {recordMode === "recording" || recordMode === "paused" ? (
                                        <div className="staff-recording-wrapper">
                                            <LazyLottie
                                                loader={loadRecordingLottieAnimation}
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
                                            <LazyLottie
                                                loader={loadBeforeRecordingAnimation}
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

                                    {/* TIME — counts down from full duration to 00:00:00 */}
                                    <span className="staff-audio-time">
                                        {formatTime(Math.max(0, recordTime - playTime))}
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
                                            disabled={isDownloadingRecording}
                                            className="staff-primary"
                                        >
                                            <FiDownload size={18} />
                                            {isDownloadingRecording ? "Downloading..." : "Download"}
                                        </button>
                                    </>
                                )}

                            </div>
                        </div>




                        {/* ===== OR ===== */}
                        {!["recording", "paused", "preview"].includes(recordMode) && <div className="voice-or-row staff-or-divider">
                            <span className="voice-or-line" />
                            <span className="voice-or-text">Or</span>
                            <span className="voice-or-line" />
                        </div>}
                        {!["recording", "paused", "preview"].includes(recordMode) && selectedTemplate && (
                            <div className="vm-combine-switch">
                                <Tippy
                                    content={
                                        <div className="vm-combine-info-tooltip">
                                            {transcriptMergeMode === "single" ? (
                                                <p className="vm-combine-info-tooltip-line">
                                                    <strong>ON:</strong> All uploaded documents, audio and video will be combined together to fill the forms. Example: use this when all uploaded files belong to one person.
                                                </p>
                                            ) : (
                                                <p className="vm-combine-info-tooltip-line">
                                                    <strong>OFF (default):</strong> Each transcript file is processed separately against every selected form.
                                                </p>
                                            )}
                                        </div>
                                    }
                                    trigger="mouseenter focus click"
                                    interactive={true}
                                    placement="top"
                                    maxWidth={320}
                                    zIndex={9999}
                                    appendTo={() => document.body}
                                >
                                    <span className="vm-combine-info-icon" tabIndex={0} aria-label="What does Combine documents do?">
                                        <IoMdInformationCircleOutline size={18} color="#5B36E1" />
                                    </span>
                                </Tippy>
                                <span className="vm-combine-switch-label">Single documents</span>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={transcriptMergeMode === "single"}
                                    aria-label="Combine multiple transcripts into one"
                                    className={`vm-combine-switch-track${transcriptMergeMode === "single" ? " is-on" : ""}`}
                                    onClick={() =>
                                        setTranscriptMergeMode(
                                            transcriptMergeMode === "single" ? "multiple" : "single"
                                        )
                                    }
                                >
                                    <span className="vm-combine-switch-knob" />
                                </button>
                            </div>
                        )}
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
                            <div className="generate-doc-btn-wrapper">
                                <button
                                    className="staff-primary"
                                    onClick={
                                        uploadedTranscriptFiles.length > 0
                                            ? submitMultipleTranscripts
                                            : submitToDocumentFiller
                                    }
                                    disabled={
                                        !PREVIEW_GENERATING_ANIMATION && (
                                            fileStage !== null ||
                                            !selectedTemplate ||
                                            (selectedTemplate?.isMulti && selectedTemplate.templates.length === 0) ||
                                            uploadedTranscriptFiles.length === 0
                                        )
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

                            {templates.length === 0 && templatesLoading ? (
                                <div className="template-empty-center">
                                    <span className="vm-template-spinner" aria-hidden="true" />
                                </div>
                            ) : templates.length === 0 && templatesError ? (
                                <div className="template-empty-center">
                                    <div className="template-empty-text">
                                        Couldn't load templates.
                                    </div>
                                    <button
                                        className="vm-template-retry-btn"
                                        onClick={fetchTemplates}
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : templates.length === 0 ? (
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
                <div className={`generated-docs-container${(props?.careVoiceFiles?.length === 0 ||
                    props?.isCareVoiceGeneratingDocs) ? " is-generating" : ""}`} style={
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
                            <GeneratingDocument />
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
                <CareVoiceAccessManagement
                    onClose={() => setOpenAccessManagement(false)}
                    onDeleted={() => {
                        setOpenAccessManagement(false);
                        fetchOrganization();
                    }}
                    onNoOrgDetected={() => {
                        setOpenAccessManagement(false);
                        setOrganizationId(null);
                        setOrganizationName("");
                        setCurrentUserRole(null);
                        setOrgLookupStatus("not_found");
                    }}
                    userEmail={userEmail}
                />
            )}

            {/* Sage drawer is always mounted so its arrow handle stays pinned to
                the right edge; `open` is the controlled toggle (also driven by the
                "Connect to Sage" button above and by the handle itself). */}
            <SageConnect
                open={openSageConnect}
                onOpenChange={setOpenSageConnect}
                userEmail={userEmail}
                userName={sageUserName}
                replayReady={sageDocReady}
                buildReplayData={buildSageReplayData}
                documents={sageDocs}
            />
        </div>
    );
};

export default VoiceModule;