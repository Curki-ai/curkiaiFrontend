import React, { useState } from "react";
import '../../../Styles/TlcClientProfitability.css';
import TlcLogo from '../../../Images/TLCLogo.png';
import UploadTlcIcon from '../../../Images/UploadTlcIcon.png';
import star from '../../../Images/star.png';
import Select from "react-select";
import JsonTableCard from "./TlcClientTableJsonCard";
import { useRef, useEffect } from "react";
import Toggle from "react-toggle";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { IoMdInformationCircleOutline } from "react-icons/io";
import TooltipPlaceholder from '../../../Images/TooltipPlaceholder.png';
import ClientProfitabilityAIAnalysisReportViewer from "./TlcClientProfitibilityReport";
import TlcPayrollDownArrow from "../../../Images/tlc_payroll_down_button.png";
import TlcPayrollInsightIcon from "../../../Images/TlcPayrollinsightIcon.png";
import TlcPayrollDepartmentIcon from "../../../Images/TlcPayrollDepartmentIcon.png"
import TlcPayrollTypeIcon from "../../../Images/TlcPayrollType.png"
import TlcPayrollStateIcon from "../../../Images/TlcPayrollStateIcon.png"
import TlcPayrollHistoryIcon from "../../../Images/TlcPayrollHistory.png"
import TlcPayrollRoleIcon from "../../../Images/TlcPayrollRoleIcon.png";
import TlcPayrollRoleDownArrowIcon from "../../../Images/TlcPayrollRoleDownArrow.png";
import TlcCompareAnalyseIcon from "../../../Images/Tlc_Compare_Analyse_Icon.png"
import DateRangePicker from "./DateRangePicker";
import MultiSelectCustom from "./MultiSelectCustom";
import TlcUploadBox from "./TlcUploadBox";
import WhoAreYouToggle from "./WhoAreYouToggle";
import { RiDeleteBin6Line } from "react-icons/ri";
import "../../../Styles/TlcNewCustomReporting.css";
import TlcSaveButton from "../../../Images/Tlc_Save_Button.png"
import TlcPayrollSyncTickIcon from "../../../Images/TlcPayrollSyncTick.png";
import { GoArrowLeft } from "react-icons/go";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { addSectionWithGraphsToWord, parseMarkdownToDocx } from "./TlcClientProfitibilityExport";

const TlcNewClientProfitability = (props) => {
    const onPrepareAiPayload = props.onPrepareAiPayload;
    const user = props.user
    // console.log("user in client profitibility", user)
    // console.log("useremail in profitibility",userEmail)
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [documentIds, setDocumentIds] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiQuestion, setAiQuestion] = useState("");
    const [aiReply, setAiReply] = useState("");
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [selectedActor, setSelectedActor] = useState("NDIS");
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [payload, setPayload] = useState(null);
    const [isAllowed, setIsAllowed] = useState(null);
    const [tablesAccordionOpen, setTablesAccordionOpen] = useState(false);
    const [directAccordionOpen, setDirectAccordionOpen] = useState(false);
    const [planAccordionOpen, setPlanAccordionOpen] = useState(false);
    const [selectedState, setSelectedState] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState([]);
    const [selectedType, setSelectedType] = useState([]);
    const [clientFiles, setClientFiles] = useState([]);
    const [selectedRole, setSelectedRole] = useState([]);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [aiProgressDisplay, setAiProgressDisplay] = useState(0);
    const [deleting, setDeleting] = useState(false);
    const aiProgressRef = useRef({});
    const reportRef = useRef(null);
    const EMAIL_STATE_MAP = {
        "molley@tenderlovingcaredisability.com.au": "Queensland",
        "laurente@tenderlovingcaredisability.com.au": "Victoria",
        "kbrennen@tenderlovingcaredisability.com.au": "New South Wales",
    };
    const userEmail = user?.email;
    const userState = EMAIL_STATE_MAP[userEmail];
    const [tabs, setTabs] = useState([
        {
            id: 1,
            name: "Tab 1",

            // ⬇️ CLIENT PROFITABILITY STATE
            responseData: null,
            selectedFiles: [],
            files: [],
            // ⬇️ DATE (Custom Reporting style)
            startDate: null,
            endDate: null,

            // ⬇️ FILTERS (PER TAB)
            selectedState: [],
            selectedDepartment: [],
            selectedType: [],
            selectedRole: [],
            aiSummary: "",

            // accordions
            aiAccordionOpen: false,
            chartsAccordionOpen: false,
            jsonTableAccordionOpen: false,

            // workflow
            loading: false,
            uploading: false,
            directFinalTable: null,
            isFromHistory: false,
            saving: false,
            aiLoading: false,
            aiProgress: 0,
            exporting: false,
        },
    ]);

    const [activeTab, setActiveTab] = useState(1);

    const activeTabData = tabs.find(t => t.id === activeTab);
    const { startDate, endDate } = activeTabData || {};


    const updateTab = (updates) => {
        setTabs(prev =>
            prev.map(t =>
                t.id === activeTab ? { ...t, ...updates } : t
            )
        );
    };

    // const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
    const BASE_URL = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io"
    // 🔹 MOCK FILTER OPTIONS (SHOWCASE ONLY)
    const optionsState = [
        { label: "New South Wales", value: "New South Wales" },
        { label: "Queensland", value: "Queensland" },
        { label: "Victoria", value: "Victoria" },
    ];

    const optionsDepartment = [
        { label: "NDIS", value: "NDIS" },
        { label: "Aged Care", value: "Aged Care" },
        { label: "Support Coordination", value: "Support Coordination" },
    ];

    const optionsType = [
        { label: "Full Time", value: "Full Time" },
        { label: "Part Time", value: "Part Time" },
        { label: "Casual", value: "Casual" },
    ];
    const optionsRole = [
        { label: "Support Worker", value: "Support Worker" },
        { label: "Coordinator", value: "Coordinator" },
        { label: "Admin", value: "Admin" },
    ];
    const formatSavedOnDate = (date) =>
        new Date(date).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
        });
    const formatDateRange = () => {
        if (!activeTabData || !startDate || !endDate)
            return "Selected Date Range";

        const format = (date) =>
            `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

        return `${format(startDate)} - ${format(endDate)}`;
    };

    const waitForChartToRender = async (node, timeout = 4000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (
                node.querySelector("svg") ||
                node.querySelector("canvas") ||
                node.querySelector(".chart-container svg")
            ) {
                return;
            }

            await new Promise(r => setTimeout(r, 200));
        }
    };

    const captureNode = async (node) => {
        await waitForChartToRender(node);

        const canvas = await html2canvas(node, {
            scale: 1.25,
            backgroundColor: "#ffffff",
            useCORS: true,
        });

        return {
            data: Uint8Array.from(
                atob(canvas.toDataURL("image/png").split(",")[1]),
                c => c.charCodeAt(0)
            ),
            width: canvas.width,
            height: canvas.height,
        };
    };
    const handleDownloadReport = async () => {
        if (!reportRef.current) return;

        const prevState = {
            ai: activeTabData.aiAccordionOpen,
            charts: activeTabData.chartsAccordionOpen,
            table: activeTabData.jsonTableAccordionOpen,
        };

        updateTab({
            exporting: true,
            aiAccordionOpen: true,
            chartsAccordionOpen: true,
            jsonTableAccordionOpen: true,
        });

        // await new Promise(r => setTimeout(r, 2000));
        // wait for React to commit DOM
        await new Promise(r => requestAnimationFrame(r));
        await new Promise(r => requestAnimationFrame(r));

        // safety buffer for charts
        await new Promise(r => setTimeout(r, 500));


        const children = [];

        // TITLE
        children.push(
            new Paragraph({
                text: "Client Profitability Report",
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 },
            })
        );

        // DATE RANGE
        if (startDate && endDate) {
            children.push(
                new Paragraph({
                    text: `Period: ${formatMonthRange(startDate, endDate)}`,
                    spacing: { after: 300 },
                })
            );
        }

        // AI SUMMARY
        if (activeTabData.aiSummary) {
            children.push(
                new Paragraph({
                    text: "AI Insight",
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 300 },
                }),
                ...parseMarkdownToDocx(activeTabData.aiSummary)
            );
        }

        // SECTIONS
        await addSectionWithGraphsToWord({
            title: "Charts Overview",
            sectionKey: "client-charts",
            children,
            reportRoot: reportRef.current,
            captureNode,
        });

        await addSectionWithGraphsToWord({
            title: "Participant Level Details",
            sectionKey: "client-table",
            children,
            reportRoot: reportRef.current,
            captureNode,
        });

        // CREATE WORD FILE
        const doc = new Document({
            sections: [{ children }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Client_Profitability_${formatMonthRange(startDate, endDate)}.docx`);

        updateTab({
            exporting: false,
            aiAccordionOpen: prevState.ai,
            chartsAccordionOpen: prevState.charts,
            jsonTableAccordionOpen: prevState.table,
        });
    };

    const formatYearMonth = (date) => {
        if (!date) return "";

        const d = new Date(date);
        if (isNaN(d)) return "";

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");

        return `${year}-${month}`;
    };
    const handleNewTab = () => {
        const newId = tabs.length
            ? Math.max(...tabs.map(t => t.id)) + 1
            : 1;

        setTabs(prev => [
            ...prev,
            {
                id: newId,
                name: `Tab ${newId}`,

                responseData: null,
                selectedFiles: [],
                files: [],
                // ⬇️ DATE (Custom Reporting style)
                startDate: null,
                endDate: null,

                // ⬇️ FILTERS (PER TAB)
                selectedState: [],
                selectedDepartment: [],
                selectedType: [],
                selectedRole: [],
                aiSummary: "",

                aiAccordionOpen: false,
                chartsAccordionOpen: false,
                jsonTableAccordionOpen: false,

                loading: false,
                uploading: false,
                directFinalTable: null,
                isFromHistory: false,
                saving: false,
                aiLoading: false,
                aiProgress: 0,
                exporting: false,
            },
        ]);

        setActiveTab(newId);
    };

    const handleCloseTab = (id) => {
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);

        if (id === activeTab && remaining.length > 0) {
            setActiveTab(remaining[0].id);
        }
    };
    const formatHistoryDateRange = (start, end = start) => {
        if (!start) return "–";

        const format = (date) =>
            new Date(date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
            });

        // if start === end → single date (Saved on)
        if (!end || start === end) {
            return format(start);
        }

        // otherwise → range
        return `${format(start)} – ${format(end)}`;
    };

    const setTabFiles = (updater) => {
        setTabs(prevTabs =>
            prevTabs.map(tab => {
                if (tab.id !== activeTab) return tab;

                const prevFiles = tab.selectedFiles || [];
                const nextFiles =
                    typeof updater === "function"
                        ? updater(prevFiles)
                        : updater;

                const safeFiles = Array.isArray(nextFiles)
                    ? nextFiles.filter(f => f && f.name)
                    : [];

                return {
                    ...tab,
                    selectedFiles: safeFiles,
                    files: safeFiles.map(f => f.name),
                };
            })
        );
    };

    useEffect(() => {
        setAiProgressDisplay(aiProgressRef.current[activeTab] || 0);
    }, [activeTab]);

    useEffect(() => {
        const userEmail = user?.email?.toLowerCase().trim();
        if (!userEmail) {
            setIsAllowed(false);
            return;
        }

        const allowedDomains = [
            "tenderlovingcaredisability.com.au",
            "tenderlovingcare.com.au",
            "curki.ai",
            "careait.com"
        ];

        const userDomain = userEmail.split("@")[1];

        if (allowedDomains.includes(userDomain)) {
            setIsAllowed(true);
        } else {
            setIsAllowed(false);
        }
    }, [user]);

    const AccordionHeader = ({
        title,
        isOpen,
        onClick,
        showInsightIcon = false,
    }) => (
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
                gap: "12px",
                fontWeight: 600,
                marginBottom: "12px",
                color: "black",
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

            <span>{title}</span>

            {showInsightIcon && (
                <img
                    src={TlcPayrollInsightIcon}
                    alt="AI Insight"
                    style={{ width: "18px", height: "18px", marginLeft: "4px" }}
                />
            )}
        </div>
    );
    // const handleUpload = async () => {
    //     try {
    //         const formData = new FormData();
    //         for (let file of selectedFiles) formData.append("files", file);

    //         console.log("form data",formData)
    //         const uploadRes = await fetch(`${BASE_URL}/header_modules/clients_profitability/analyze`, {
    //             method: "POST",
    //             body: formData
    //         });

    //         const uploadData = await uploadRes.json();
    //         console.log("UPLOAD RESPONSE", uploadData);

    //         // const ids = uploadData.files?.map(f => f.documentId) || [];
    //         // setDocumentIds(ids);

    //         return uploadData;
    //     } catch (err) {
    //         console.error(err);
    //         return null;
    //     }
    // };
    const handleUpload = async () => {
        try {
            const formData = new FormData();

            // ✅ 1. Load department_kb.txt from public/templates
            const kbResponse = await fetch("/templates/department_kb.txt");
            const kbText = await kbResponse.text();

            const kbBlob = new Blob([kbText], { type: "text/plain" });
            const kbFile = new File([kbBlob], "department_kb.txt", {
                type: "text/plain",
            });

            // 🔑 SAME KEY backend expects
            formData.append("kb_file", kbFile);

            // ✅ 2. Append user uploaded Excel / CSV files
            activeTabData.selectedFiles.forEach((file) => {
                formData.append("files", file);
            });

            // ✅ 3. Send request
            const res = await fetch(
                `${BASE_URL}/header_modules/clients_profitability/analyze`,
                {
                    method: "POST",
                    body: formData,
                }
            );
            const finalReponse = await res.json();
            console.log("final response", finalReponse)
            return finalReponse;
        } catch (err) {
            console.error("Upload failed:", err);
            return null;
        }
    };




    // const handleFinalAnalysis = async (finalPayload) => {
    //     console.log("props.tlcClientProfitabilityPayload in handleFinal analysis", props?.tlcClientProfitabilityPayload)
    //     console.log("finalPayload", finalPayload)
    //     try {
    //         console.log("🔄 Starting final analysis request...");
    //         const analyzeRes = await fetch(
    //             `${BASE_URL}/tlcClientProfitibility/analyze-from-files?userEmail=${userEmail}`,
    //             {
    //                 method: "POST",
    //                 headers: { "Content-Type": "application/json" },
    //                 body: JSON.stringify({ payload: finalPayload })
    //             }
    //         );


    //         if (!analyzeRes.ok) {
    //             throw new Error(`HTTP error! status: ${analyzeRes.status}`);
    //         }

    //         const analyzeData = await analyzeRes.json();
    //         console.log("✅ FINAL ANALYSIS RESPONSE:", analyzeData);
    //         setResponseData(analyzeData);
    //         return analyzeData;
    //     } catch (error) {
    //         console.error("❌ Final analysis error:", error);
    //         throw error; // Re-throw to handle in calling function
    //     }
    // };

    const handleAnalyse = async () => {
        try {
            updateTab({ loading: true });

            let uploadData = null;

            if (activeTabData.selectedFiles.length > 0) {
                uploadData = await handleUpload();

                updateTab({
                    responseData: uploadData,
                    name:
                        startDate && endDate
                            ? `${startDate.getDate()}-${startDate.getMonth() + 1}-${startDate.getFullYear()}
               - 
               ${endDate.getDate()}-${endDate.getMonth() + 1}-${endDate.getFullYear()}`
                            : activeTabData.name,
                });

                onPrepareAiPayload({
                    table_data: uploadData?.table,
                });
            }
        } catch (err) {
            console.error("Analyse failed:", err);
        } finally {
            updateTab({ loading: false });
        }
    };

    const fetchAiSummary = async () => {
        try {
            if (!activeTabData?.responseData?.table) return;
            updateTab({ aiLoading: true, aiProgress: 5 });

            let progress = 5;

            const aiProgressInterval = setInterval(() => {
                progress += Math.random() * 6;

                // ⛔ HOLD AT 70%
                if (progress > 70) progress = 70;

                // updateTab({ aiProgress: Math.floor(progress) });
                aiProgressRef.current[activeTab] = Math.floor(progress);
                setAiProgressDisplay(aiProgressRef.current[activeTab]);
            }, 600);

            const res = await fetch(
                `${BASE_URL}/header_modules/clients_profitability/ai_analysis`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        table_data: activeTabData.responseData.table,
                    }),
                }
            );

            const data = await res.json();
            clearInterval(aiProgressInterval);
            updateTab({
                aiSummary: data.summary_md || data.report_md || "",
                aiLoading: false,
            });
        } catch (err) {
            console.error(err);
            updateTab({ aiLoading: false, aiProgress: 0 });
        }
    };
    const handleSaveClientProfitability = async () => {
        if (!activeTabData?.responseData) return;

        try {
            updateTab({ saving: true });

            const payload = {
                email: user?.email,
                responseData: activeTabData.responseData,
                filters: {
                    start: startDate ? startDate.toISOString() : null,
                    end: endDate ? endDate.toISOString() : null,
                    state: activeTabData.selectedState.map(s => s.value).join(", "),
                    department: activeTabData.selectedDepartment.map(d => d.value).join(", "),
                    role: activeTabData.selectedRole.map(r => r.value).join(", "),
                    employmentType: activeTabData.selectedType.map(t => t.value).join(", "),
                },
                aiSummary: activeTabData.aiSummary,
            };

            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/clients-profitability/save",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Save failed");
            alert("Saved successfully");

            // 🔑 IMPORTANT: sirf current tab mark karo
            updateTab({ isFromHistory: true, saving: false, });

            // history list me add
            setHistoryList(prev => [
                {
                    id: data.id,
                    createdAt: new Date().toISOString(),
                    filters: payload.filters,
                },
                ...prev,
            ]);
        } catch (err) {
            console.error("Save failed:", err);
        } finally {
            updateTab({ saving: false });
        }
    };

    const handleDeleteHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true); // 🔥 YES → ...

            await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/clients-profitability/history",
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedHistoryId }),
                }
            );

            setHistoryList(prev =>
                prev.filter(item => item.id !== selectedHistoryId)
            );

            setShowDeleteModal(false); // close modal AFTER success
            setSelectedHistoryId(null);
        } catch (err) {
            console.error("Delete failed", err);
        } finally {
            setDeleting(false); // reset button
        }
    };


    const handleHistoryClick = async (item) => {
        try {
            const res = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/clients-profitability/history/${item.id}`
            );
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || "Failed to load history");

            const record = result.data;
            console.log("Loaded history record:", record);
            const { start, end } = record.filters || {};

            updateTab({
                responseData: record.responseData,
                aiSummary: record.aiSummary || "",
                // ✅ DATE RESTORE (new structure)
                startDate: start ? new Date(start) : null,
                endDate: end ? new Date(end) : null,

                // ✅ FILTERS RESTORE (⭐ THIS IS YOUR ANSWER)
                selectedState: record.filters?.state
                    ? record.filters.state.split(", ").map(v => ({ label: v, value: v }))
                    : [],

                selectedDepartment: record.filters?.department
                    ? record.filters.department.split(", ").map(v => ({ label: v, value: v }))
                    : [],

                selectedRole: record.filters?.role
                    ? record.filters.role.split(", ").map(v => ({ label: v, value: v }))
                    : [],

                selectedType: record.filters?.employmentType
                    ? record.filters.employmentType.split(", ").map(v => ({ label: v, value: v }))
                    : [],
                name: start && end
                    ? `${new Date(start).getDate()}-${new Date(start).getMonth() + 1}-${new Date(start).getFullYear()}
           -
           ${new Date(end).getDate()}-${new Date(end).getMonth() + 1}-${new Date(end).getFullYear()}`
                    : activeTabData.name,

                aiAccordionOpen: false,
                chartsAccordionOpen: false,
                jsonTableAccordionOpen: false,

                isFromHistory: true,
            });
            console.log("record.responseData.table", record.responseData.table)
            if (record?.responseData?.table) {
                onPrepareAiPayload({
                    table_data: record?.responseData?.table, // ✅ EXACT structure backend expects
                });
            }
        } catch (err) {
            console.error("History load failed:", err);
            alert("Failed to load history");
        }
    };


    // Convert API HTML safely into React elements + execute script tags
    const RenderHtmlFigure = ({ htmlString, className = "" }) => {
        const containerRef = useRef(null);

        useEffect(() => {
            if (!htmlString || !containerRef.current) return;

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, "text/html");

            // Extract and remove script tags
            const scripts = [];
            doc.querySelectorAll("script").forEach((scr) => {
                scripts.push(scr.innerHTML);
                scr.remove();
            });

            // Set container content
            containerRef.current.innerHTML = doc.body.innerHTML;

            // Execute scripts
            scripts.forEach((code) => {
                try {
                    const fn = new Function(code);
                    fn();
                } catch (err) {
                    console.error("Script execution failed:", err);
                }
            });

            // Optional: Force resize charts if they have resize methods
            // setTimeout(() => {
            //     if (window.Chart && typeof window.Chart.instances !== 'undefined') {
            //         Object.values(window.Chart.instances).forEach(chart => {
            //             chart.resize();
            //         });
            //     }
            // }, 100);

        }, [htmlString]);

        return (
            <div
                ref={containerRef}
                className={`chart-container ${className}`}
                style={{ width: '100%', minHeight: '300px' }}
            />
        );
    };
    const formatMonthRange = (start, end) => {
        if (!start || !end) return "";

        const options = { month: "short", year: "numeric" };
        const from = start.toLocaleDateString("en-US", options);
        const to = end.toLocaleDateString("en-US", options);

        return `${from} – ${to}`;
    };

    // useEffect(() => {
    //     if (!responseData?.direct_service) return;

    //     const summary = responseData.direct_service.tables.by_reference;
    //     const details = responseData.direct_service.tables.detail;

    //     const summaryCols = summary.columns || [];
    //     const summaryRows = summary.rows || [];
    //     const detailCols = details.columns || [];
    //     const detailRows = details.rows || [];

    //     // Normalize keys
    //     const normalizeObjKeys = (obj) => {
    //         const normalized = {};
    //         Object.keys(obj || {}).forEach(k => {
    //             normalized[k.trim().toLowerCase()] = obj[k];
    //         });
    //         return normalized;
    //     };

    //     const findIndex = (cols, keywords) =>
    //         cols.findIndex(c =>
    //             keywords.some(k =>
    //                 c?.toString?.().toLowerCase().includes(k.toLowerCase())
    //             )
    //         );

    //     const sNdisIndex = findIndex(summaryCols, ["ndis", "reference"]);
    //     const sPartIndex = findIndex(summaryCols, ["participant"]);

    //     const dNdisIndex = findIndex(detailCols, ["ndis", "reference"]);
    //     const dPartIndex = findIndex(detailCols, ["participant"]);

    //     if (sNdisIndex < 0 || sPartIndex < 0 || dNdisIndex < 0 || dPartIndex < 0) {
    //         console.error("🏳️ Required key columns missing.");
    //         return;
    //     }

    //     // Convert row → array by column order
    //     const toRowArray = (obj, cols) => {
    //         const norm = normalizeObjKeys(obj);
    //         return cols.map(c => norm[c.toLowerCase()] ?? "");
    //     };

    //     // Identify detail-only columns
    //     const detailOnlyCols = detailCols.filter(c => !summaryCols.includes(c));

    //     // ---------------------------
    //     // BUILD DETAIL MAP
    //     // ---------------------------
    //     const detailMap = {};

    //     detailRows.forEach(dr => {
    //         const norm = normalizeObjKeys(dr);

    //         // Skip if detail is actually same as summary (happens when no extra columns)
    //         if (detailOnlyCols.length === 0) return;

    //         const ndis =
    //             dr[detailCols[dNdisIndex]] ??
    //             dr[dNdisIndex] ??
    //             norm[detailCols[dNdisIndex].toLowerCase()] ??
    //             "";

    //         const part =
    //             dr[detailCols[dPartIndex]] ??
    //             dr[dPartIndex] ??
    //             norm[detailCols[dPartIndex].toLowerCase()] ??
    //             "";

    //         const key = `${ndis}___${part}`;

    //         if (!detailMap[key]) detailMap[key] = [];
    //         detailMap[key].push(toRowArray(dr, detailCols));
    //     });

    //     // ---------------------------
    //     // REMOVE DUPLICATE SUMMARY ROWS
    //     // ---------------------------
    //     const seenParents = new Set();
    //     const uniqueSummaryRows = [];

    //     summaryRows.forEach(sr => {
    //         const parent = toRowArray(sr, summaryCols);

    //         const sNdis =
    //             sr[summaryCols[sNdisIndex]] ??
    //             sr[sNdisIndex] ??
    //             parent[sNdisIndex] ??
    //             "";

    //         const sPart =
    //             sr[summaryCols[sPartIndex]] ??
    //             sr[sPartIndex] ??
    //             parent[sPartIndex] ??
    //             "";

    //         const key = `${sNdis}___${sPart}`;

    //         if (!seenParents.has(key)) {
    //             seenParents.add(key);
    //             uniqueSummaryRows.push(sr);
    //         }
    //     });

    //     // ---------------------------
    //     // MERGE SUMMARY + DETAIL
    //     // ---------------------------
    //     const finalRows = uniqueSummaryRows.map(sr => {
    //         const parent = toRowArray(sr, summaryCols);

    //         const sNdis =
    //             sr[summaryCols[sNdisIndex]] ??
    //             sr[sNdisIndex] ??
    //             parent[sNdisIndex] ??
    //             "";

    //         const sPart =
    //             sr[summaryCols[sPartIndex]] ??
    //             sr[sPartIndex] ??
    //             parent[sPartIndex] ??
    //             "";

    //         const key = `${sNdis}___${sPart}`;

    //         return {
    //             parent,
    //             children: detailMap[key] || [],
    //             participant: sPart,
    //             ndis: sNdis
    //         };
    //     });

    //     // ---------------------------
    //     // FILTER VALUES
    //     // ---------------------------
    //     const regions = new Set();
    //     const depts = new Set();

    //     const regionIdx = findIndex(detailCols, ["region"]);
    //     const deptIdx = findIndex(detailCols, ["department", "dept"]);

    //     detailRows.forEach(dr => {
    //         const n = normalizeObjKeys(dr);

    //         if (regionIdx >= 0) {
    //             const r = n[detailCols[regionIdx].toLowerCase()];
    //             if (r) regions.add(r);
    //         }
    //         if (deptIdx >= 0) {
    //             const d = n[detailCols[deptIdx].toLowerCase()];
    //             if (d) depts.add(d);
    //         }
    //     });

    //     // ---------------------------
    //     // SET FINAL OUTPUT
    //     // ---------------------------
    //     setDirectFinalTable({
    //         columns: summaryCols,
    //         rows: finalRows,
    //         detailCols,
    //         regions: [...regions],
    //         departments: [...depts]
    //     });

    // }, [responseData]);
    // useEffect(() => {
    //     if (!activeTabData?.responseData?.table || activeTabData?.responseData.table.length === 0) return;

    //     updateTab({
    //         directFinalTable: {
    //             columns: Object.keys(activeTabData.responseData.table[0]),
    //             rows: activeTabData.responseData.table,
    //             regions: [],
    //             departments: [],
    //         }
    //     });

    // }, [activeTabData?.responseData]);

    useEffect(() => {
        if (!activeTabData?.responseData?.table || activeTabData.responseData.table.length === 0) return;

        const COLUMN_ORDER = [
            "Client Name",
            "Region",
            "Department",
            "Revenue",
            "Direct Cost",
            "Gross Margin",
            "Gross Margin %",
            "Allocated Cost",
            "Indirect Cost",
            "Total Expense",
            "Gross Profit",
            "Gross Profit %"
        ];


        // keep only columns that actually exist in data
        const availableColumns = Object.keys(activeTabData.responseData.table[0]);

        const orderedColumns = COLUMN_ORDER.filter(col =>
            availableColumns.includes(col)
        );

        updateTab({
            directFinalTable: {
                columns: orderedColumns,
                rows: activeTabData.responseData.table,
                regions: [],
                departments: [],
            }
        });
    }, [activeTabData?.responseData]);


    console.log("activeTabData", activeTabData)
    const renderHistorySection = () => (
        <section className="history-container">
            {activeTabData?.responseData && (
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "flex-end",
                        marginBottom: "12px",
                    }}
                >
                    <button
                        onClick={handleDownloadReport}
                        style={{
                            background: "var(--Curki-2nd-Portal-1, #14C8A8)",
                            color: "#fff",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: 400,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <img
                            src={TlcCompareAnalyseIcon}
                            alt="download"
                            style={{ width: "14px", height: "14px" }}
                        />
                        Download Report
                    </button>
                </div>
            )}


            {/* HEADER */}
            <div style={{ display: "flex", gap: "8px" }}>
                <img
                    src={TlcPayrollHistoryIcon}
                    alt="icon"
                    style={{ width: "22px", height: "21px", pointerEvents: "none" }}
                />
                <div className="history-title" style={{}}>History</div>
            </div>

            {/* BODY */}
            {loadingHistory && (
                <p style={{ textAlign: "center", color: "#555", marginTop: "20px" }}>
                    Loading history...
                </p>
            )}
            {!loadingHistory && historyList.length === 0 && (
                <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
                    No saved history found.
                </p>
            )}

            {!loadingHistory && historyList.length > 0 && (
                <div className="history-list">
                    {historyList.map(item => (
                        <div
                            key={item.id}
                            className="history-card-modern"
                            onClick={() => handleHistoryClick(item)}
                            style={{ position: "relative" }}
                        >
                            {/* TOP ROW */}
                            <div className="history-top">
                                <div className="history-date-range">
                                    <span className="label">Date Range: </span>
                                    <span className="value">
                                        <span className="value">
                                            {formatHistoryDateRange(
                                                item.filters?.start,
                                                item.filters?.end
                                            )}
                                        </span>

                                    </span>
                                </div>

                                {/* RIGHT SIDE ACTIONS */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHistoryId(item.id);
                                        setShowDeleteModal(true);
                                    }}
                                    title="Delete analysis"
                                    style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: "transparent",
                                        border: "none",
                                        fontSize: "20px",
                                        color: "#6C4CDC",
                                        cursor: "pointer",
                                    }}
                                >
                                    <RiDeleteBin6Line size={18} />
                                </button>



                            </div>

                            {/* SAVED ON */}
                            <div className="saved-on">
                                <span className="saved-label">Saved on: </span>
                                <span style={{ color: "#000" }}>
                                    {formatSavedOnDate(item.createdAt)}
                                </span>
                            </div>

                            {/* FILTER SUMMARY (MISSING PART) */}
                            {item.filters && (
                                <div className="history-filters">
                                    {item.filters.state && (
                                        <div className="filter-item">
                                            <strong>State:</strong> {item.filters.state}
                                        </div>
                                    )}

                                    {item.filters.department && (
                                        <div className="filter-item">
                                            <strong>Department:</strong> {item.filters.department}
                                        </div>
                                    )}

                                    {item.filters.role && (
                                        <div className="filter-item">
                                            <strong>Role:</strong> {item.filters.role}
                                        </div>
                                    )}

                                    {item.filters.employmentType && (
                                        <div className="filter-item">
                                            <strong>Employment Type:</strong> {item.filters.employmentType}
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>


                    ))}
                    {showDeleteModal && (
                        <div
                            style={{
                                position: "fixed",
                                inset: 0,
                                background: "rgba(0,0,0,0.35)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 9999,
                            }}
                        >
                            <div
                                style={{
                                    background: "#fff",
                                    borderRadius: "12px",
                                    padding: "20px 24px",
                                    minWidth: "360px",
                                    textAlign: "center",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        fontFamily: "inherit",
                                        color: "#1f2937",
                                        marginBottom: "20px",
                                    }}
                                >
                                    Are you sure you want to delete history?
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "12px",
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setSelectedHistoryId(null);
                                        }}
                                        style={{
                                            padding: "8px 22px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: "#e5e7eb",
                                            // fontSize: "14px",
                                            cursor: "pointer",
                                            fontWeight: "500"
                                        }}
                                    >
                                        No
                                    </button>

                                    <button
                                        onClick={handleDeleteHistory}
                                        disabled={deleting}
                                        style={{
                                            padding: "8px 22px",
                                            borderRadius: "6px",
                                            border: "none",
                                            background: "#6C4CDC",
                                            color: "#fff",
                                            // fontSize: "14px",
                                            cursor: "pointer",
                                            fontWeight: "500"
                                        }}
                                    >
                                        {deleting ? "..." : "Yes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            )}
        </section>
    );

    useEffect(() => {
        const fetchHistory = async () => {
            const email = props.user?.email?.trim().toLowerCase();
            if (!email) return;

            try {
                setLoadingHistory(true);
                const res = await fetch(
                    `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/clients-profitability/history?email=${email}`
                );
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch history");

                // setHistoryList(data.data);
                const filteredHistory = userState
                    ? data.data.filter(item =>
                        item.filters?.state?.toLowerCase() === userState.toLowerCase()
                    )
                    : data.data;

                setHistoryList(filteredHistory);
            } catch (err) {
                console.error("❌ Error fetching history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [props.user]);

    if (isAllowed === false) {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                <img
                    src={TlcLogo}
                    alt="Access Denied"
                    style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
                />

                <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
                    Access Restricted 🚫
                </h2>

                <p style={{ fontSize: "16px", color: "#555" }}>
                    Sorry, your account (<strong>{user?.email}</strong>)
                    is not authorized to view this page.
                </p>
            </div>
        );
    }



    return (
        <div className="page-containersss">

            <div className="financial-header">
                <div
                    className="role-selector"
                    style={{ display: "flex", gap: "24px", alignItems: "center" }}
                >
                    <WhoAreYouToggle
                        value={selectedActor === "aged-care" ? "Aged Care" : "NDIS"}
                        onChange={(val) => {
                            setSelectedActor(val === "Aged Care" ? "aged-care" : "NDIS");
                        }}
                    />

                    <div style={{ minWidth: "180px" }}>
                        <MultiSelectCustom
                            options={optionsRole}
                            selected={activeTabData.selectedRole}
                            setSelected={(v) => updateTab({ selectedRole: v })}
                            placeholder="Role"
                            leftIcon={TlcPayrollRoleIcon}
                            rightIcon={TlcPayrollRoleDownArrowIcon}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    {/* <h1 className="titless">CLIENTS PROFITABILITY</h1> */}
                    {/* <Tippy
                        content={
                            <div style={{ width: '450px', height: 'auto', padding: '4px', fontSize: '15px', fontWeight: '600' }}>
                                <img src={TooltipPlaceholder} alt="tooltip" style={{ width: '100%' }} />
                                Each individual row of the Excel/CSV sheet should represent  a single clients information
                            </div>
                        }
                        trigger="mouseenter focus click"
                        interactive={true}
                        placement="bottom"
                        theme="custom"
                    >
                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <IoMdInformationCircleOutline size={22} color="#5B36E1" />
                        </div>
                    </Tippy> */}
                </div>
                {/* <div className="sync-toggle">
                    <div
                        style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            fontFamily: "Inter",
                        }}
                    >
                        Sync With Your System
                    </div>
                    <Toggle
                        checked={syncEnabled}
                        onChange={() => setSyncEnabled(!syncEnabled)}
                        className="custom-toggle"
                        icons={false} // ✅ No icons
                    />
                </div> */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>
                        Sync With Your System
                    </span>

                    <div
                        onClick={() => setSyncEnabled(!syncEnabled)}
                        style={{
                            width: "40px",
                            height: "22px",
                            borderRadius: "20px",
                            background: syncEnabled ? "#6C4CDC" : "#E5E7EB",
                            display: "flex",
                            alignItems: "center",
                            padding: "2px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        <div
                            style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                background: "#fff",
                                transform: syncEnabled
                                    ? "translateX(18px)"
                                    : "translateX(0)",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {syncEnabled && (
                                <img
                                    src={TlcPayrollSyncTickIcon}
                                    alt="tick"
                                    style={{ width: "10px", height: "10px" }}
                                />
                            )}
                        </div>
                    </div>
                </div>

            </div>
            <div className="left-headerss">
                {/* {responseData && <img src={TlcLogo} alt="Logo" className="tlclogo" />}
                 */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        width: "100%",
                        marginTop: "12px",
                    }}
                >
                    {/* LEFT: UI TABS */}
                    <div
                        className="tab-bar"
                        style={{
                            display: "flex",
                            gap: "10px",
                            alignItems: "center",
                            marginBottom: "16px",
                            paddingTop: "16px",
                        }}
                    >
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: "8px 16px",
                                    borderRadius: "8px",
                                    background: tab.id === activeTab ? "#6C4CDC" : "#f3f4f6",
                                    color: tab.id === activeTab ? "#fff" : "#000",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    fontSize: "14px",
                                    fontWeight: tab.id === activeTab ? 600 : 400,
                                }}
                            >
                                {tab.name}

                                {tabs.length > 1 && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCloseTab(tab.id);
                                        }}
                                        style={{
                                            fontWeight: "bold",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ×
                                    </span>
                                )}
                            </div>
                        ))}

                        <button
                            onClick={handleNewTab}
                            style={{
                                background: "#e5e7eb",
                                borderRadius: "8px",
                                padding: "8px 14px",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: 600,
                                fontSize: "14px",
                            }}
                        >
                            + New Tab
                        </button>
                    </div>



                    {/* RIGHT: COMPARE & ANALYSE */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                            alignItems: "flex-end",
                        }}
                    >
                        <button
                            onClick={handleAnalyse} // keep your existing function
                            disabled={activeTabData?.loading || activeTabData?.uploading}
                            style={{
                                background: "var(--Curki-2nd-Portal-1, #14C8A8)",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: 400,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "17px",
                                opacity:
                                    activeTabData?.loading || activeTabData?.uploading ? 0.6 : 1,
                            }}
                        >
                            <img
                                src={TlcCompareAnalyseIcon}
                                alt="compare"
                                style={{ width: "14px", height: "14px" }}
                            />
                            Compare and Analyse
                        </button>
                        {activeTabData?.responseData && !activeTabData?.isFromHistory && (
                            <button
                                onClick={handleSaveClientProfitability}
                                disabled={activeTabData?.saving}
                                className="save-btnss"   // ✅ SAME CLASS AS CUSTOM REPORTING
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "10px"
                                }}
                            >
                                <img
                                    src={TlcSaveButton}
                                    alt="save"
                                    style={{ width: "14px", height: "14px" }}
                                />
                                {activeTabData?.saving ? "Processing..." : "Save"}
                            </button>
                        )}

                    </div>
                </div>

            </div>

            {!activeTabData?.responseData && !activeTabData?.isFromHistory ? (
                <>
                    <div>
                        <section className="filters-card">
                            <div className="filters-grid">

                                {/* DATE RANGE (reuse your existing one) */}
                                <div className="date-filter-wrapper">
                                    <DateRangePicker
                                        startDate={activeTabData.startDate}
                                        endDate={activeTabData.endDate}
                                        onChange={([start, end]) =>
                                            updateTab({
                                                startDate: start,
                                                endDate: end,
                                            })
                                        }
                                    />

                                </div>

                                {/* STATE FILTER */}
                                <MultiSelectCustom
                                    options={optionsState}
                                    selected={activeTabData.selectedState}
                                    setSelected={(v) => updateTab({ selectedState: v })}
                                    placeholder="State"
                                    leftIcon={TlcPayrollStateIcon}
                                    rightIcon={TlcPayrollDownArrow}
                                />

                                {/* DEPARTMENT FILTER */}
                                <MultiSelectCustom
                                    options={optionsDepartment}
                                    selected={activeTabData.selectedDepartment}
                                    setSelected={(v) => updateTab({ selectedDepartment: v })}
                                    placeholder="Department"
                                    leftIcon={TlcPayrollDepartmentIcon}
                                    rightIcon={TlcPayrollDownArrow}
                                />

                                {/* TYPE FILTER */}
                                <MultiSelectCustom
                                    options={optionsType}
                                    selected={activeTabData.selectedType}
                                    setSelected={(v) => updateTab({ selectedType: v })}
                                    placeholder="Type"
                                    leftIcon={TlcPayrollTypeIcon}
                                    rightIcon={TlcPayrollDownArrow}
                                />

                            </div>
                        </section>

                        <section className="data-upload-wrapper">
                            <TlcUploadBox
                                id="client-profit-files"
                                title="Upload Data"
                                subtitle=".XLSX, .XLS, .CSV"
                                accept=".xlsx,.xls,.csv"
                                files={activeTabData.selectedFiles}
                                setFiles={setTabFiles}
                                onTemplateDownload={() => {
                                    const link = document.createElement("a");
                                    link.href = "/templates/ClientProfitibilityTemplate.xlsx";
                                    link.download = "ClientProfitibilityTemplate.xlsx";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            />


                        </section>
                        <div className="search-section">
                            <button className="analyse-btn" disabled={activeTabData?.loading} style={{ backgroundColor: '#000', marginTop: activeTabData.isFromHistory ? 0 : "40px", }} onClick={handleAnalyse}>
                                {activeTabData?.loading ? `Analysing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>AI Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                            </button>
                        </div>
                    </div>
                    {/* {renderHistorySection()} */}
                </>
            ) : (
                <>

                    {activeTabData?.isFromHistory && (
                        <div
                            className="tlc-profitibility-history-back-btn"
                            onClick={() => {
                                updateTab({
                                    // 🔁 history mode off
                                    isFromHistory: false,
                                    // 🧹 clear analysis
                                    responseData: null,
                                    aiSummary: "",
                                    directFinalTable: null,
                                    startDate: null,
                                    endDate: null,
                                    selectedState: [],
                                    selectedDepartment: [],
                                    selectedRole: [],
                                    selectedType: [],
                                    // 🧠 close accordions
                                    aiAccordionOpen: false,
                                    chartsAccordionOpen: false,
                                    jsonTableAccordionOpen: false,
                                    // 🏷️ reset tab name
                                    name: `Tab ${activeTab}`,
                                });
                            }}
                        >
                            <GoArrowLeft size={22} color="#6C4CDC" />
                            Back
                        </div>
                    )}

                    {/* AI Panel */}
                    {/* ================= AI INSIGHT ACCORDION ================= */}
                    <div ref={reportRef}>
                        <AccordionHeader
                            title={
                                startDate && endDate
                                    ? `AI Insight (${formatDateRange()})`
                                    : "AI Insight"
                            }
                            isOpen={activeTabData?.aiAccordionOpen}
                            showInsightIcon
                            onClick={async () => {
                                const willOpen = !activeTabData.aiAccordionOpen;
                                updateTab({
                                    aiAccordionOpen: !activeTabData.aiAccordionOpen,
                                });


                                if (willOpen && !activeTabData.aiSummary) {
                                    setShowAiPanel(true);
                                    await fetchAiSummary();
                                }
                            }}
                        />


                        {activeTabData.aiAccordionOpen && (
                            <div style={{ marginBottom: "10px" }}>
                                <ClientProfitabilityAIAnalysisReportViewer
                                    reportText={activeTabData.aiSummary}
                                    loading={activeTabData.aiLoading}
                                    progress={aiProgressDisplay}
                                />
                            </div>
                        )}





                        {/* charts */}
                        <AccordionHeader
                            title={
                                startDate && endDate
                                    ? `Charts Overview (${formatDateRange()})`
                                    : "Charts Overview"
                            }
                            isOpen={activeTabData?.chartsAccordionOpen}
                            onClick={() =>
                                updateTab({
                                    chartsAccordionOpen: !activeTabData.chartsAccordionOpen
                                })
                            }
                        />
                        <section data-report-section="client-charts">
                            {activeTabData.chartsAccordionOpen && (
                                <div className="client-profitability-graph">
                                    {activeTabData?.responseData?.graphs && (
                                        <>
                                            <div className="chart-box" style={{ marginBottom: "30px" }}>
                                                <RenderHtmlFigure
                                                    htmlString={activeTabData.responseData.graphs.department_revenue_expense}
                                                />
                                            </div>

                                            <div className="chart-box" style={{ marginBottom: "30px" }}>
                                                <RenderHtmlFigure htmlString={activeTabData?.responseData?.graphs.region_revenue_expense} />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </section>

                        {/* summary tables */}
                        {/* <AccordionHeader
                        title={
                            startDate && endDate
                                ? `Detailed Table (${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")})`
                                : "Detailed Table"
                        }
                        isOpen={tablesAccordionOpen}
                        onClick={() => setTablesAccordionOpen(!tablesAccordionOpen)}
                    /> */}

                        {/* {tablesAccordionOpen && (
                        <>
                            <div className="table-box" style={{ marginTop: "40px" }}>
                                {activeTab === "direct" && (
                                    <RenderHtmlFigure htmlString={responseData.direct_service.summary_tables.by_region_department} />
                                )}
                                {activeTab === "plan" && (
                                    <RenderHtmlFigure htmlString={responseData.plan_managed.summary_tables.by_region_department} />
                                )}
                            </div>
                        </>
                    )} */}


                        {/* ================= JSON TABLE ACCORDION ================= */}
                        <AccordionHeader
                            title={
                                startDate && endDate
                                    ? `Participant Level Details (${formatDateRange()})`
                                    : "Participant Level Details"
                            }
                            isOpen={activeTabData?.jsonTableAccordionOpen}
                            onClick={() =>
                                updateTab({
                                    jsonTableAccordionOpen: !activeTabData?.jsonTableAccordionOpen
                                })
                            }
                        />
                        <section data-report-section="client-table">
                            {activeTabData.jsonTableAccordionOpen && (
                                <div style={{ marginTop: "24px" }}>
                                    {/* DIRECT SERVICES JSON TABLE */}
                                    {/* {activeTab === "direct" && directFinalTable && (
                                <JsonTableCard
                                    title="Direct Services – NDIS Reference (click + to see detail)"
                                    data={directFinalTable}
                                    isSummaryDetailMode={true}
                                    availableRegions={directFinalTable.regions}
                                    availableDepartments={directFinalTable.departments}
                                    summaryTable={responseData.direct_service.tables.by_reference}
                                    detailsTable={responseData.direct_service.tables.detail}
                                />
                            )} */}
                                    {activeTabData.jsonTableAccordionOpen && activeTabData?.directFinalTable && (
                                        <div className="table-box" style={{ marginTop: "24px" }}>
                                            <JsonTableCard
                                                title="Client Profitability Table"
                                                data={activeTabData.directFinalTable}
                                            />
                                        </div>
                                    )}

                                    {/* PLAN MANAGED JSON TABLE */}
                                    {/* {activeTab === "plan" && responseData?.plan_managed?.tables?.detail && (
                                <JsonTableCard
                                    title="Plan Managed — Detailed Table"
                                    data={responseData.plan_managed.tables.detail}
                                />
                            )} */}
                                </div>
                            )}
                        </section>
                    </div>
                </>
            )}
            {renderHistorySection()}
            {activeTabData.exporting && (
                <div
                    onClick={(e) => e.stopPropagation()}   // 🔥 BLOCK CLICKS
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(255,255,255,0.85)",
                        zIndex: 99999,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "all",               // 🔥 IMPORTANT
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        {/* 🔄 CIRCULAR LOADER */}
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                border: "4px solid #E5E7EB",
                                borderTop: "4px solid #6C4CDC",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 12px",
                            }}
                        />

                        <div
                            style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                color: "#374151",
                            }}
                        >
                            Generating Word report…
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TlcNewClientProfitability;