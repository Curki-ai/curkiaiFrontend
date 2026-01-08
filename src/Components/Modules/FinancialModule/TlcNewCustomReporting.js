import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../Styles/TlcNewCustomReporting.css";
import TLCLogo from "../../../Images/TLCLogo.png";
import { FiChevronDown } from "react-icons/fi";
import parse, { domToReact } from "html-react-parser";
import star from '../../../Images/star.png';
import AIAnalysisReportViewer from "./TlcAiAnalysisReport";
import incrementAnalysisCount from "./TLcAnalysisCount";
import TlcPayrollDownArrow from "../../../Images/tlc_payroll_down_button.png"
import TlcPayrollInsightIcon from "../../../Images/TlcPayrollinsightIcon.png"
import Toggle from "react-toggle";
import "react-toggle/style.css";
import TlcPayrollRoleIcon from "../../../Images/TlcPayrollRoleIcon.png"
import TlcPayrollSyncTickIcon from "../../../Images/TlcPayrollSyncTick.png"
import TlcPayrollRoleDownArrowIcon from "../../../Images/TlcPayrollRoleDownArrow.png"
import TlcPayrollDateFilterIcon from "../../../Images/TlcPayrollDateFilterIcon.png"
import TlcPayrollDepartmentIcon from "../../../Images/TlcPayrollDepartmentIcon.png"
import TlcPayrollTypeIcon from "../../../Images/TlcPayrollType.png"
import TlcPayrollStateIcon from "../../../Images/TlcPayrollStateIcon.png"
import TlcPayrollHistoryIcon from "../../../Images/TlcPayrollHistory.png"
import UploadTlcIcon from "../../../Images/UploadTlcIcon.png";
import { RiDeleteBin6Line } from "react-icons/ri";
import TlcPayrollDownloadIcon from "../../../Images/TlcPayrollDownloadIcon.png"
import { dummyData, dummyPayload } from "./TlcPayrollDummyData";
import TlcSaveButton from "../../../Images/Tlc_Save_Button.png"
import TlcCompareAnalyseIcon from "../../../Images/Tlc_Compare_Analyse_Icon.png"
import TlcAiWordExporter, { parseMarkdownToDocx } from "./TlcAiWordExporter";
import { Document, Packer, Paragraph, HeadingLevel, ImageRun } from "docx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import { GoArrowLeft } from "react-icons/go";

export default function TlcNewCustomerReporting(props) {
    // -------------------- MULTI TAB SUPPORT --------------------
    const USE_DUMMY_DATA = false;
    const [tabs, setTabs] = useState([
        {
            id: 1,
            name: "Tab 1",
            startDate: null,
            endDate: null,
            selectedState: [],
            selectedDepartment: [],
            selectedRole: [],
            selectedEmploymentType: [],
            fileNames: { payroll: [], people: [], employee: [] },
            stage: "filters",
            analysisData: null,
            error: null,
            currentPage: 1,
            viewingHistory: false,
            showReport: false,
            aiReport: null,
            aiLoading: false,
            loading: false,
            uploading: false,
            progressStage: "idle",
            tlcAskAiPayload: null,
            tlcAskAiHistoryPayload: null,
            page1: false,
            page2: false,
            page3: false,
            page4: false,
            aiAccordion: false,
            whoAreYou: "NDIS",
            headerRole: "",
            syncEnabled: false,
            dateOpen: false,
        },
    ]);
    const [activeTab, setActiveTab] = useState(1);

    const activeTabData = tabs.find((t) => t.id === activeTab);

    const updateTab = (updates) => {
        setTabs((prev) =>
            prev.map((t) => (t.id === activeTab ? { ...t, ...updates } : t))
        );
    };
    const togglePage = (pageKey) => {
        updateTab({ [pageKey]: !activeTabData[pageKey] });
    };
    useEffect(() => {
        const active = tabs.find((t) => t.id === activeTab);
        if (active) {
            props.setTlcAskAiPayload(active.tlcAskAiPayload || "");
            props.setTlcAskAiHistoryPayload(active.tlcAskAiHistoryPayload || "");
        }
    }, [activeTab, tabs]);
    const handleNewTab = () => {
        const newId = tabs.length ? Math.max(...tabs.map((t) => t.id)) + 1 : 1;
        const newTab = {
            id: newId,
            name: `Tab ${newId}`,
            startDate: null,
            endDate: null,
            selectedState: [],
            selectedDepartment: [],
            selectedRole: [],
            selectedEmploymentType: [],
            fileNames: { payroll: [], people: [], employee: [] },
            stage: "filters",
            analysisData: null,
            error: null,
            currentPage: 1,
            viewingHistory: false,
            showReport: false,
            aiReport: null,
            aiLoading: false,
            loading: false,
            uploading: false,
            progressStage: "idle",
            tlcAskAiPayload: null,
            tlcAskAiHistoryPayload: null,
            page1: false,
            page2: false,
            page3: false,
            page4: false,
            aiAccordion: false,
            whoAreYou: "NDIS",
            headerRole: "",
            syncEnabled: false,
            dateOpen: false,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newId);
    };

    const handleCloseTab = (id) => {
        // console.log("Closing tab:", id);
        const remainingTabs = tabs.filter((t) => t.id !== id);
        setTabs(remainingTabs);
        if (id === activeTab && remainingTabs.length > 0) {
            setActiveTab(remainingTabs[0].id);
        }
    };
    // ------------------------------------------------------------

    // -------------------- BASE STATES --------------------
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [isAllowed, setIsAllowed] = useState(null);
    const reportRef = useRef(null);

    const optionsState = [
        { label: "New South Wales", value: "New South Wales" },
        { label: "Queensland", value: "Queensland" },
        { label: "Victoria", value: "Victoria" },
    ];

    const optionsDepartment = [
        { label: "ACAC", value: "ACAC" },
        { label: "AUGU", value: "AUGU" },
        { label: "AUS Chief Executive Officer", value: "AUS Chief Executive Officer" },
        { label: "Accommodation", value: "Accommodation" },
        { label: "Allied Health", value: "Allied Health" },
        { label: "Behaviour", value: "Behaviour" },
        { label: "Customer Care", value: "Customer Care" },
        { label: "DS - WERR", value: "DS - WERR" },
        { label: "Day Program", value: "Day Program" },
        { label: "Finance", value: "Finance" },
        { label: "Global Chief Executive Officer", value: "Global Chief Executive Officer" },
        { label: "Growth and Marketing", value: "Growth and Marketing" },
        { label: "HUB - Central Coast", value: "HUB - Central Coast" },
        { label: "Hub - Bankstown", value: "Hub - Bankstown" },
        { label: "Inactive", value: "Inactive" },
        { label: "Information Communications and Technology", value: "Information Communications and Technology" },
        { label: "MAC", value: "MAC" },
        { label: "MayeFoodz", value: "MayeFoodz" },
        { label: "NDIS", value: "NDIS" },
        { label: "OT", value: "OT" },
        { label: "Operations", value: "Operations" },
        { label: "PHYSIO", value: "PHYSIO" },
        { label: "PSYCH", value: "PSYCH" },
        { label: "People and Culture", value: "People and Culture" },
        { label: "Quality and Safeguards", value: "Quality and Safeguards" },
        { label: "Scheduling", value: "Scheduling" },
        { label: "Speech", value: "Speech" },
        { label: "Support Coordination", value: "Support Coordination" },
        { label: "Travel", value: "Travel" },
    ];

    const optionsRole = [
        { label: "Admin Assistant", value: "Admin Assistant" },
        { label: "Area Manager", value: "Area Manager" },
        { label: "Behaviour Support Practitioner", value: "Behaviour Support Practitioner" },
        { label: "Business Development Manager", value: "Business Development Manager" },
        { label: "CEO - Australian Operations", value: "CEO - Australian Operations" },
        { label: "Customer Care Coordinator", value: "Customer Care Coordinator" },
        { label: "Customer Care Manager", value: "Customer Care Manager" },
        { label: "Customer Care Specialist", value: "Customer Care Specialist" },
        { label: "Day Program Coordinator", value: "Day Program Coordinator" },
        { label: "Direct Service Coordinator", value: "Direct Service Coordinator" },
        { label: "Direct Services Manager", value: "Direct Services Manager" },
        { label: "Domestic Assistant", value: "Domestic Assistant" },
        { label: "Group Chief Executive Officer", value: "Group Chief Executive Officer" },
        { label: "House Lead", value: "House Lead" },
        { label: "National Business Development Manager", value: "National Business Development Manager" },
        { label: "Physiotherapist", value: "Physiotherapist" },
        { label: "Program Manager", value: "Program Manager" },
        { label: "Quality & Safeguarding Officer", value: "Quality & Safeguarding Officer" },
        { label: "Quality Coordinator", value: "Quality Coordinator" },
        { label: "SIL Intake Coordinator", value: "SIL Intake Coordinator" },
        { label: "Senior Support Coordinator", value: "Senior Support Coordinator" },
        { label: "State Manager", value: "State Manager" },
        { label: "Support Coordinator", value: "Support Coordinator" },
        { label: "Support Coordinator Team Leader", value: "Support Coordinator Team Leader" },
        { label: "Support Worker", value: "Support Worker" },
        { label: "Team Leader", value: "Team Leader" },
    ];

    const optionsType = [
        { label: "Casual", value: "Casual" },
        { label: "Full Time", value: "Full Time" },
        { label: "Part Time", value: "Part Time" },
    ];
    const formatTabDate = (start, end) => {
        if (!start || !end) return null;
        return `${start.toLocaleDateString("en-US")} - ${end.toLocaleDateString("en-US")}`;
    };
    // ✅ ADD THIS AT THE BOTTOM
    const buildMarkdownDocxContent = (markdown) => {
        if (!markdown) return [];

        return [
            new Paragraph({
                text: "AI Summary Report",
                heading: HeadingLevel.HEADING_1,
                spacing: { after: 300 },
            }),
            ...parseMarkdownToDocx(markdown),
        ];
    };

    const captureNode = async (node) => {
        // ⏳ wait for SVG & fonts to paint
        await new Promise((r) => setTimeout(r, 600));

        const canvas = await html2canvas(node, {
            scale: 2,
            backgroundColor: "#ffffff",
            useCORS: true,
            foreignObjectRendering: true,
        });

        return {
            data: Uint8Array.from(
                atob(canvas.toDataURL("image/png").split(",")[1]),
                (c) => c.charCodeAt(0)
            ),
            width: canvas.width,
            height: canvas.height,
        };
    };

    const handleDownloadWordReport = async () => {
        if (!reportRef.current) return;

        const children = [];

        /* ================= TITLE ================= */
        children.push(
            new Paragraph({
                text: "Payroll Analysis Report",
                heading: HeadingLevel.TITLE,
                spacing: { after: 400 },
            })
        );

        children.push(
            new Paragraph({
                text: `Date Range: ${formatDateRange()}`,
                spacing: { after: 300 },
            })
        );

        /* ================= AI MARKDOWN (USING TlcAiWordExporter) ================= */
        if (activeTabData.aiReport) {
            children.push(...buildMarkdownDocxContent(activeTabData.aiReport));
        }

        /* ================= DASHBOARD ================= */
        const sectionTitles = reportRef.current.querySelectorAll(
            '[style*="font-weight: 600"]'
        );

        for (const sectionTitle of sectionTitles) {
            children.push(
                new Paragraph({
                    text: sectionTitle.innerText,
                    heading: HeadingLevel.HEADING_2,
                    spacing: { before: 300, after: 200 },
                })
            );

            /* ===== SCORE CARDS ===== */
            const scoreCards =
                sectionTitle.parentElement.querySelectorAll(".summary-card");

            scoreCards.forEach((card) => {
                const label = card.querySelector("p")?.innerText;
                const value = card.querySelector("h3")?.innerText;

                if (label && value) {
                    children.push(
                        new Paragraph({
                            text: `${label}: ${value}`,
                            spacing: { after: 120 },
                        })
                    );
                }
            });

            /* ===== CHARTS ===== */
            const charts = sectionTitle
                .closest("section")
                ?.querySelectorAll(".charts-grid > div")

            await new Promise((r) => setTimeout(r, 300));

            for (const chart of charts) {
                console.log("chart", chart)
                // ⛔ skip invisible / empty charts
                if (!chart.offsetWidth || !chart.offsetHeight) continue;

                const { data, width, height } = await captureNode(chart);

                const maxWidth = 550;
                const ratio = height / width;

                children.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data, // ✅ ONLY Uint8Array goes here
                                transformation: {
                                    width: maxWidth,
                                    height: Math.round(maxWidth * ratio), // ✅ aspect ratio safe
                                },
                            }),
                        ],
                        spacing: { after: 300 },
                    })
                );
            }


        }

        /* ================= CREATE ONE WORD FILE ================= */
        const doc = new Document({
            sections: [{ children }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `Payroll_Report_${formatDateRange()}.docx`);
    };





    const handleFileChange = (e, type) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // ✅ Validate file names
        const validFiles = files.filter((file) => {
            const name = file.name.toLowerCase();
            if (
                name.includes("pay journal") ||
                name.includes("people - team members") ||
                name.includes("employeeupdate")
            ) {
                return true;
            }

            return false;
        });

        if (validFiles.length === 0) {
            alert(`⚠️ Invalid file uploaded in ${type.toUpperCase()} section.`)
            e.target.value = "";
            return;
        }

        // ✅ Save both file names and actual file objects
        // ✅ Append new files instead of replacing
        const existingNames = activeTabData.fileNames[type] || [];
        const existingFiles = activeTabData[`${type}Files`] || [];

        updateTab({
            fileNames: {
                ...activeTabData.fileNames,
                [type]: [...existingNames, ...validFiles.map((f) => f.name)],
            },
            [`${type}Files`]: [...existingFiles, ...validFiles],
        });


        // console.log(`Selected ${type} files:`, validFiles.map((f) => f.name));

        // Allow reselecting same file
        e.target.value = "";
    };

    const handleAnalyse = async () => {
        if (!activeTabData) return;

        const {
            startDate,
            endDate,
            selectedState,
            selectedDepartment,
            selectedRole,
            selectedEmploymentType,
            fileNames,
        } = activeTabData;

        // ✅ Basic check for date range
        if (!startDate || !endDate) {
            alert("Please select a date range first!");
            return;
        }

        try {
            updateTab({ loading: true, showReport: false });

            updateTab({ stage: "loading", error: null });
            updateTab({ uploading: true, progressStage: "uploading" });
            // console.log("Starting analysis process for tab:", activeTab);

            // -------------------------------
            // STEP 1️: VALIDATE FILE UPLOADS
            // -------------------------------
            const inputs = ["payroll", "people", "employee"].map((type) => ({
                type,
                files: activeTabData[`${type}Files`] || [],
            }));

            const hasAnyFile = inputs.some((set) => set.files.length > 0);

            if (hasAnyFile) {
                lastManualWithFilesRef.current = true;
                console.log("Upload path selected — validating uploaded files...");

                const invalidUploads = [];

                // ✅ Validate each file section
                // for (const input of inputs) {
                //     const { type, files } = input;
                //     if (!files.length) {
                //         invalidUploads.push(`❌ Missing file(s) for ${type.toUpperCase()}`);
                //         continue;
                //     }

                //     const invalidFiles = files.filter((file) => {
                //         const name = file.name.toLowerCase();
                //         if (type === "payroll" && !name.includes("pay journal")) return true;
                //         if (type === "people" && !name.includes("people - team members")) return true;
                //         if (type === "employee" && !name.includes("employeeupdate")) return true;
                //         return false;
                //     });

                //     if (invalidFiles.length > 0) {
                //         invalidUploads.push(
                //             `⚠️ Incorrect file(s) in ${type.toUpperCase()} section: ${invalidFiles
                //                 .map((f) => f.name)
                //                 .join(", ")}`
                //         );
                //     }
                // }


                // ✅ Check if all 3 sections have files
                const allTypesUploaded = inputs.every(
                    (input) => input && input.files && input.files.length > 0
                );

                if (invalidUploads.length > 0) {
                    updateTab({ loading: false });
                    updateTab({ stage: "filters" });

                    let message = "⚠️ Please correct the following before analysing:\n\n";
                    if (invalidUploads.length > 0)
                        message += "\n" + invalidUploads.join("\n");

                    alert(message);
                    return;
                }

                // If everything is valid, upload first
                console.log("All uploaded files are valid. Uploading before analysis...");
                try {
                    updateTab({ uploading: true });
                    updateTab({ uploading: true, progressStage: "uploading" });
                    const formData = new FormData();
                    inputs.forEach((input) => {
                        Array.from(input.files).forEach((file) => formData.append("files", file));
                    });

                    const uploadRes = await fetch(
                        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/upload-latest",
                        { method: "POST", body: formData }
                    );

                    const uploadData = await uploadRes.json();

                    if (!uploadRes.ok) {
                        throw new Error(uploadData.error || "File upload failed.");
                    }

                    console.log("Files uploaded successfully before analysis.");
                    updateTab({ progressStage: "analysing" });
                } catch (uploadErr) {
                    console.error("❌ Upload failed:", uploadErr);
                    alert("Some files failed to upload. Continuing with existing data...");
                } finally {
                    updateTab({ uploading: false });
                }
            } else {
                lastManualWithFilesRef.current = false;
                updateTab({ progressStage: "analysing" });
                console.log("No files selected. Proceeding with existing database data...");
            }

            // -------------------------------
            // STEP 2️⃣: RUN ANALYSIS API
            // -------------------------------
            const query = new URLSearchParams({
                start: startDate.toISOString().split("T")[0],
                end: endDate.toISOString().split("T")[0],
            });

            if (selectedState.length)
                query.append("state", selectedState.map((s) => s.value).join(","));
            if (selectedDepartment.length)
                query.append("department", selectedDepartment.map((d) => d.value).join(","));
            if (selectedEmploymentType.length)
                query.append("employmentType", selectedEmploymentType.map((e) => e.value).join(","));
            if (selectedRole.length)
                query.append("role", selectedRole.map((r) => r.value).join(","));

            const userEmail = props?.user?.email?.trim()?.toLowerCase();
            // const userEmail = "kris@curki.ai"
            const url = `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/filter?${query.toString()}&${userEmail}`;

            let analyzeData;

            if (USE_DUMMY_DATA) {
                console.log("🧪 Using dummy payroll data");
                analyzeData = {
                    payload: dummyPayload,
                    analysisResult: dummyData.analysisResult
                };
            } else {
                const analyzeRes = await fetch(url);
                analyzeData = await analyzeRes.json();
            }


            updateTab({ tlcAskAiPayload: analyzeData.payload });
            if (tabs.find(t => t.id === activeTab)) {
                props.setTlcAskAiPayload(analyzeData.payload);
            }

            // 🧩 Handle invalid date range
            if (analyzeData.message && analyzeData.message.includes("Invalid date range")) {
                alert("⚠️ Invalid date range selected. Please choose correct start and end dates.");
                updateTab({ loading: false, uploading: false, stage: "filters" });
                return;
            }

            // 🧩 Handle no data found
            if (analyzeData.analysisResult?.message === "No data found for given filters.") {
                alert("⚠️ No data found for the selected filters. Please adjust your filters and try again.");
                updateTab({ loading: false, uploading: false, stage: "filters" });
                return;
            }
            updateTab({ progressStage: "preparing" });
            if (!analyzeData.analysisResult) {
                throw new Error(analyzeData.error || "Analysis failed. No valid response received.");
            }
            updateTab({ progressStage: "preparing" });
            await new Promise(resolve => setTimeout(resolve, 800));
            console.log("Analysis data received successfully.");
            justRanManualAnalysisRef.current = true;
            updateTab({
                analysisData: { ...analyzeData.analysisResult, payload: analyzeData.payload },
                stage: "overview",
                loading: false,
                uploading: false,
                progressStage: "idle",
                name: formatDateRange()
            });
            try {
                const userEmail = props?.user?.email?.trim()?.toLowerCase();
                if (userEmail) {
                    await incrementAnalysisCount(userEmail, "tlc-report-analysis");
                } else {
                    console.warn("⚠️ User email missing — skipping count increment");
                }
            } catch (err) {
                console.error("❌ Failed to increment count:", err.message);
            }
            lastManualWithFilesRef.current = false;
        } catch (err) {
            console.error("❌ Error in handleAnalyse:", err);
            updateTab({ error: err.message, stage: "filters" });
            alert("Something went wrong: " + err.message);
        } finally {
            updateTab({ loading: false, uploading: false });
            updateTab({ loading: false, uploading: false });
            setTimeout(() => updateTab({ progressStage: "idle" }), 800);
        }
    };

    const { startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;
    const hasFiltersFieldChanged = [
        startDate,
        endDate,
        selectedState?.length,
        selectedDepartment?.length,
        selectedRole?.length,
        selectedEmploymentType?.length,
    ].some(Boolean);


    // 🧠 Auto-run analysis logic (final stable version)
    const lastAnalysisKeyRef = useRef("");
    const lastManualWithFilesRef = useRef(false);
    const justRanManualAnalysisRef = useRef(false);

    // 🧩 Reset "isFromHistory" when user edits any filters or date
    useEffect(() => {
        if (!activeTabData) return;

        const { isFromHistory, analysisData, startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;

        // Run only if it's a history-loaded record AND analysis exists
        if (!isFromHistory || !analysisData) return;

        const hasFiltersChanged = [
            startDate,
            endDate,
            selectedState?.length,
            selectedDepartment?.length,
            selectedRole?.length,
            selectedEmploymentType?.length,
        ].some(Boolean);

        // If user modifies any filter/date, allow saving again
        if (hasFiltersChanged) {
            updateTab({ isFromHistory: false });
        }
    }, [
        activeTabData?.startDate,
        activeTabData?.endDate,
        activeTabData?.selectedState,
        activeTabData?.selectedDepartment,
        activeTabData?.selectedRole,
        activeTabData?.selectedEmploymentType,
    ]);
    useEffect(() => {
        const userEmail = props?.user?.email?.trim()?.toLowerCase();

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

        setIsAllowed(allowedDomains.includes(userDomain));
    }, [props.user]);

    // -------------------- SAVE HANDLER --------------------
    const handleSaveToDatabase = async () => {
        if (!activeTabData) return;

        // ✅ If loaded from history, block saving again
        if (activeTabData.isFromHistory) {
            alert("⚠️ This analysis is already saved in the history list.");
            return;
        }

        const { analysisData, startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;

        if (!analysisData) {
            alert("No analysis data found. Please run an analysis first.");
            return;
        }

        const email = props.user.email.trim().toLowerCase();
        if (!email) {
            alert("Email is missing — cannot save data.");
            return;
        }

        setSaving(true);
        try {
            // console.log("📤 Saving analysis data to database for tab:", activeTab);
            // console.log("analysisData", analysisData)
            const enrichedAnalysis = {
                pages: analysisData?.pages,
                scorecard: analysisData?.scorecard,
                filters: {
                    start: startDate ? startDate.toISOString().split("T")[0] : null,
                    end: endDate ? endDate.toISOString().split("T")[0] : null,
                    state: selectedState.map((s) => s.value).join(", "),
                    department: selectedDepartment.map((d) => d.value).join(", "),
                    role: selectedRole.map((r) => r.value).join(", "),
                    employmentType: selectedEmploymentType.map((e) => e.value).join(", "),
                },
            };

            // console.log("enrichedAnalysis", enrichedAnalysis)
            const markdownReport = activeTabData.aiReport || activeTabData.analysisData?.report_md || "";

            // console.log("markdown in save history", markdownReport)
            const response = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/save",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        analysisData: enrichedAnalysis,
                        email,
                        markdown: markdownReport
                    }),
                }
            );

            const result = await response.json();
            if (!response.ok) {
                console.error("❌ Failed to save:", result.error);
                alert(`Error: ${result.error || "Failed to save data."}`);
                return;
            }

            console.log("Save response:", result);
            alert("✅ Analysis data saved successfully!");
            // ✅ Optional: Mark as saved to prevent double-save
            updateTab({ isFromHistory: true });
        } catch (err) {
            console.error("❌ Error saving data:", err);
            alert("Something went wrong while saving data.");
        } finally {
            setSaving(false);
        }
    };
    const handleDeleteHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true);
            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/deleteById",
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedHistoryId }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to delete history.");

            // console.log("Deleted successfully:", data);
            setHistoryList((prev) => prev.filter((item) => item.id !== selectedHistoryId));
            setShowDeleteModal(false);
            alert("✅ Deleted successfully!");
        } catch (err) {
            console.error("❌ Error deleting:", err);
            alert("Failed to delete history: " + err.message);
        } finally {
            setDeleting(false);
        }
    };


    // -------------------- HISTORY FETCH --------------------
    useEffect(() => {
        const fetchHistory = async () => {
            const email = props.user?.email?.trim().toLowerCase();
            if (!email) return;
            try {
                setLoadingHistory(true);
                const res = await fetch(`https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/history?email=${email}`);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Failed to fetch history");
                setHistoryList(data.data);
            } catch (err) {
                console.error("❌ Error fetching history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchHistory();
    }, [props.user]);

    const handleAiAnalysis = async () => {
        if (activeTabData.aiReport || activeTabData.aiLoading) return;
        if (!activeTabData?.analysisData) {
            alert("Please run the regular analysis first.");
            return;
        }
        if (USE_DUMMY_DATA) {
            console.log("🧪 Using dummy AI markdown");

            updateTab({
                aiReport: dummyData?.reportMarkdown,
                showReport: true,
                aiLoading: false,
            });

            return; // ⛔ STOP HERE
        }
        // ✅ Step 1: Retrieve payload from props or analysisData
        const aiPayload =
            props.tlcAskAiPayload ||
            activeTabData.analysisData?.payload ||
            [];

        // console.log("AI Payload ready to send:", aiPayload);

        if (!aiPayload || aiPayload.length === 0) {
            alert("No valid payload available for AI Analysis.");
            return;
        }

        try {
            // ✅ Step 2: Start loading
            updateTab({ aiLoading: true, aiReport: null });

            console.log("Sending full payload to AI Analysis API...");
            const userEmail = props?.user?.email?.trim()?.toLowerCase();
            // const userEmail = "kris@curki.ai"
            if (userEmail === "kris@curki.ai") {
                aiPayload.env = "sandbox";   // exactly payload = { ..., env: "sandbox" }
            }
            console.log("ai payload", aiPayload)
            // ✅ Step 3: Send directly (no re-wrapping or redeclaration)
            const res = await fetch(
                "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/tlc/payroll/ai-analysis-report",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(aiPayload), // ✅ Send as-is
                }
            );

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || "AI Analysis failed");
            }

            // ✅ Step 4: Save report into tab
            updateTab({
                aiReport: data?.report_md,
                showReport: true,
                aiLoading: false,
            });
            try {
                const userEmail = props?.user?.email?.trim()?.toLowerCase();
                if (userEmail) {
                    await incrementAnalysisCount(userEmail, "tlc-ai-analysis", data?.ai_analysis_cost);
                }
            } catch (err) {
                console.error("Error incrementing AI analysis count:", err);
            }
        } catch (err) {
            console.error("❌ AI Analysis Error:", err);
            alert("AI Analysis failed: " + err.message);
            updateTab({ aiLoading: false });
        }
    };



    // -------------------- HISTORY CLICK --------------------
    const handleHistoryClick = async (item) => {
        try {

            const res = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/getById/${item.id}`
            );
            const data = await res.json();
            console.log("data in history click", data)
            updateTab({ tlcAskAiHistoryPayload: data.data.analysisResult });
            if (tabs.find(t => t.id === activeTab)) {
                props.setTlcAskAiHistoryPayload(data.data.analysisResult);
            }


            if (!res.ok) throw new Error(data.error || "Failed to fetch analysis");
            const { start, end } = data.data.filters || {};
            console.log("start,end", start, end)
            updateTab({
                analysisData: data.data.analysisResult,
                stage: "overview",
                currentPage: 1,
                isFromHistory: true,

                // ✅ correct variables
                startDate: start ? new Date(start) : null,
                endDate: end ? new Date(end) : null,

                // ✅ tab name shows date
                name: start && end ? `${start} - ${end}` : "History",
            });

            // ✅ Show markdown report if exists
            if (data.data.reportMarkdown) {
                updateTab({
                    aiReport: data.data.reportMarkdown,
                    showReport: true,
                });
            } else {
                updateTab({
                    aiReport: null,
                    showReport: false,
                });
            }

            updateTab({ viewingHistory: true });

        } catch (err) {
            console.error("❌ Error loading analysis:", err);
            alert("Failed to load analysis: " + err.message);
        }
    };


    const formatDateRange = () => {
        if (!activeTabData || !activeTabData.startDate || !activeTabData.endDate) return "Selected Date Range";
        return `${activeTabData.startDate.toLocaleDateString()} - ${activeTabData.endDate.toLocaleDateString()}`;
    };

    // ------------------- CUSTOM MULTISELECT -------------------
    const MultiSelectCustom = ({
        options = [],
        selected = [],
        setSelected,
        placeholder,
        leftIcon,        // ✅ NEW
        rightIcon,       // ✅ NEW
        height = 38,     // optional
        minWidth = 220,  // optional
    }) => {
        const [open, setOpen] = useState(false);
        const ref = useRef();

        const toggleOption = (option) => {
            if (selected.some((o) => o.value === option.value)) {
                setSelected(selected.filter((o) => o.value !== option.value));
            } else {
                setSelected([...selected, option]);
            }
        };

        useEffect(() => {
            const handleClickOutside = (e) => {
                if (ref.current && !ref.current.contains(e.target)) setOpen(false);
            };
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        return (
            <div
                className="custom-multiselect"
                ref={ref}
                style={{ position: "relative", minWidth }}
            >
                {/* INPUT */}
                <div
                    className="custom-input"
                    onClick={() => setOpen(!open)}
                    style={{
                        height: placeholder === "Role" ? "31px" : height,
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        paddingLeft: leftIcon ? "36px" : "12px",
                        paddingRight: rightIcon ? "36px" : "12px",
                        cursor: "pointer",
                        background: "#fff",
                        fontFamily: "Inter",
                    }}
                >
                    {/* LEFT ICON */}
                    {leftIcon && (
                        <img
                            src={leftIcon}
                            alt="icon"
                            style={{
                                position: "absolute",
                                left: "10px",
                                width: "16px",
                                height: "16px",
                                pointerEvents: "none",
                            }}
                        />
                    )}

                    {/* TEXT */}
                    <span
                        style={{
                            color: selected.length === 0 ? "#9CA3AF" : "#111827",
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {selected.length === 0
                            ? placeholder
                            : selected.length === 1
                                ? selected[0].label
                                : (
                                    <>
                                        {selected[0].label}{" "}
                                        <span style={{ color: "#6C4CDC", fontSize: "12px" }}>
                                            +{selected.length - 1}
                                        </span>
                                    </>
                                )}
                    </span>

                    {/* RIGHT ICON */}
                    {rightIcon && (
                        <img
                            src={rightIcon}
                            alt="arrow"
                            style={{
                                position: "absolute",
                                right: "10px",
                                width: "12px",
                                height: "7px",
                                pointerEvents: "none",
                                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "transform 0.2s ease",
                            }}
                        />
                    )}
                </div>

                {/* DROPDOWN */}
                {open && (
                    <div className="options-dropdown">
                        {options.map((option) => {
                            const isSelected = selected.some(
                                (o) => o.value === option.value
                            );
                            return (
                                <div
                                    key={option.value}
                                    className={`option-item ${isSelected ? "selected" : ""}`}
                                    onClick={() => toggleOption(option)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="custom-checkbox"
                                    />
                                    {option.label}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };




    const renderHtmlFigure = (htmlString) => {
        const parsed = parse(htmlString, {
            replace: (domNode) => (domNode.name === "script" ? null : undefined),
        });

        setTimeout(() => {
            try {
                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = htmlString;

                const scripts = tempDiv.getElementsByTagName("script");
                for (let script of scripts) {
                    const newScript = document.createElement("script");
                    if (script.src) newScript.src = script.src;
                    else if (script.textContent) newScript.text = script.textContent;
                    document.body.appendChild(newScript);
                    document.body.removeChild(newScript);
                }
            } catch (e) {
                console.warn("Script execution error:", e);
            }
        }, 0);

        return parsed;
    };



    // -------------------- TAB BAR --------------------
    const renderTabBar = () => (
        <div className="tab-bar" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", paddingTop: "16px" }}>
            {tabs.map((tab) => (
                <div
                    key={tab.id}
                    onClick={() => {
                        setActiveTab(tab.id); props.setTlcAskAiPayload(tab.tlcAskAiPayload || "");
                        props.setTlcAskAiHistoryPayload(tab.tlcAskAiHistoryPayload || "");
                    }}
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
                        transition: "all 0.2s ease",
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
                                marginLeft: "4px",
                                color: tab.id === activeTab ? "#ccc" : "#999",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "18px",
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
                    transition: "all 0.2s ease",
                }}
            >
                + New Tab
            </button>
        </div>
    );

    if (!activeTabData) return null;

    if (!isAllowed) {
        return (
            <div style={{
                textAlign: "center",
                padding: "120px 20px",
                fontFamily: "Inter, sans-serif",
                color: "#1f2937"
            }}>
                <img
                    src={TLCLogo}
                    alt="Access Denied"
                    style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
                />
                <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
                    Access Restricted 🚫
                </h2>
                <p style={{ fontSize: "16px", color: "#555" }}>
                    Sorry, your account (<strong>{props?.user?.email}</strong>) is not authorized to view this page.
                </p>
            </div>
        );
    }
    const AccordionHeader = ({
        title,
        isOpen,
        onClick,
        showInsightIcon = false,
        showDownloadIcon = false,   // ✅ NEW
        onDownload,
    }) => (
        <div
            onClick={onClick}
            style={{
                padding: "14px 18px",
                background: "linear-gradient(180deg, #6C4CDC -65.32%, #FFFFFF 157.07%, #FFFFFF 226.61%)",
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
            {/* ⬇️ DOWN ARROW (LEFT) */}
            <img
                src={TlcPayrollDownArrow}
                alt="Toggle"
                style={{
                    width: "18px",
                    height: "10px",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    flexShrink: 0,
                }}
            />

            {/* TEXT */}
            <span>{title}</span>

            {/* ✨ INSIGHT ICON (TEXT KE BAAD) */}
            {showInsightIcon && (
                <img
                    src={TlcPayrollInsightIcon}
                    alt="AI Insight"
                    style={{
                        width: "18px",
                        height: "18px",
                        marginLeft: "4px",
                        flexShrink: 0,
                    }}
                />
            )}
            {/* {showDownloadIcon && (
                <img
                    src={TlcPayrollDownloadIcon}
                    alt="Download AI Summary"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDownload?.();
                    }}
                    style={{
                        width: "18px",
                        height: "18px",
                        marginLeft: "auto",
                        cursor: "pointer",
                    }}
                />
            )} */}
        </div>
    );


    const DateRangeInput = React.forwardRef(
        ({ startDate, endDate, isOpen, onClick }, ref) => {
            const hasStart = startDate;
            const hasEnd = endDate;


            return (
                <div
                    className="custom-input"
                    onClick={onClick}
                    ref={ref}
                    style={{
                        height: 38,
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid #D1D5DB",
                        borderRadius: "8px",
                        paddingLeft: "36px",
                        paddingRight: "36px",
                        cursor: "pointer",
                        background: "#fff",
                        fontFamily: "Inter",
                        position: "relative",
                        minWidth: 220,
                    }}
                >
                    {/* LEFT ICON */}
                    <img
                        src={TlcPayrollDateFilterIcon}
                        alt="date"
                        style={{
                            position: "absolute",
                            left: "10px",
                            width: "16px",
                            height: "16px",
                            pointerEvents: "none",
                        }}
                    />

                    {/* TEXT */}
                    <span
                        style={{
                            fontSize: "13px",
                            color: hasStart ? "#111827" : "#9CA3AF",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {!hasStart && "Select Date Range"}
                        {hasStart && !hasEnd && startDate.toLocaleDateString()}
                        {hasStart && hasEnd &&
                            `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                        }
                    </span>

                    {/* RIGHT ARROW */}
                    <img
                        src={TlcPayrollRoleDownArrowIcon}
                        alt="arrow"
                        style={{
                            position: "absolute",
                            right: "10px",
                            width: "12px",
                            height: "7px",
                            pointerEvents: "none",
                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s ease",
                        }}
                    />
                </div>
            );
        }
    );
    const isAnyAccordionOpen =
        activeTabData.aiAccordion ||
        activeTabData.page1 ||
        activeTabData.page2 ||
        activeTabData.page3 ||
        activeTabData.page4;

    const downloadWord = TlcAiWordExporter({
        markdown: activeTabData.aiReport,
        fileName: `AI_Summary_${formatDateRange()?.replace(/\s+/g, "_")}`,
    });


    return (
        <div className="page-containersss">
            <div className="headerss">
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 20px",
                        borderBottom: "1px solid #E5E7EB",
                        fontFamily: "Inter",
                        background: "#fff",
                    }}
                >
                    {/* LEFT SIDE */}
                    <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                        {/* WHO ARE YOU */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Who are you ?
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    border: "1px solid #6C4CDC",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                }}
                            >
                                {["Aged Care", "NDIS"].map((item) => (
                                    <div
                                        key={item}
                                        onClick={() => updateTab({ whoAreYou: item })}
                                        style={{
                                            width: "92px",              // ✅ SAME WIDTH
                                            textAlign: "center",        // ✅ text centered
                                            padding: "6px 0",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            cursor: "pointer",
                                            background:
                                                activeTabData.whoAreYou === item ? "#6C4CDC" : "#fff",
                                            color:
                                                activeTabData.whoAreYou === item ? "#fff" : "#6C4CDC",
                                        }}
                                    >
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* ROLE */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >

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

                    {/* RIGHT SIDE – SYNC */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500 }}>
                            Sync With Your System
                        </span>

                        {/* CUSTOM SWITCH */}
                        <div
                            onClick={() =>
                                updateTab({ syncEnabled: !activeTabData.syncEnabled })
                            }
                            style={{
                                width: "40px",
                                height: "22px",
                                borderRadius: "20px",
                                background: activeTabData.syncEnabled
                                    ? "#6C4CDC"
                                    : "#E5E7EB",
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
                                    transform: activeTabData.syncEnabled
                                        ? "translateX(18px)"
                                        : "translateX(0)",
                                    transition: "all 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {activeTabData.syncEnabled && (
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
                    {/* {activeTabData.analysisData && <img src={TLCLogo} alt="Logo" className="tlclogo" />} */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            width: "100%",
                            marginTop: "12px",
                        }}
                    >
                        {/* LEFT: TABS */}
                        <div>
                            {renderTabBar()}
                        </div>

                        {/* RIGHT: ACTION BUTTONS */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                                alignItems: "flex-end",
                            }}
                        >
                            <button
                                onClick={handleAnalyse}
                                disabled={activeTabData.loading || activeTabData.uploading}
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
                                        activeTabData.loading || activeTabData.uploading?.accounts
                                            ? 0.6
                                            : 1,
                                }}
                            >
                                <img
                                    src={TlcCompareAnalyseIcon}
                                    alt="compare"
                                    style={{ width: "14px", height: "14px" }}
                                />
                                Compare and Analyse
                            </button>


                            {activeTabData.stage === "overview" && !activeTabData.viewingHistory && (
                                <button
                                    className="save-btnss"
                                    onClick={handleSaveToDatabase}
                                    disabled={saving}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <img
                                        src={TlcSaveButton}
                                        alt="save"
                                        style={{ width: "14px", height: "14px" }}
                                    />
                                    {saving ? "Processing..." : "Save"}
                                </button>

                            )}
                        </div>
                    </div>

                </div>

            </div>
            {!activeTabData.viewingHistory && (
                <section className="filters-card" style={{ marginBottom: activeTabData?.isFromHistory ? "0px" : "40px" }}>
                    <div className="filters-grid">
                        <div>
                            <DatePicker
                                selectsRange
                                startDate={activeTabData.startDate}
                                endDate={activeTabData.endDate}

                                onCalendarOpen={() => updateTab({ dateOpen: true })}
                                onCalendarClose={() => updateTab({ dateOpen: false })}

                                onChange={(dates) => {
                                    const [start, end] = dates;
                                    updateTab({
                                        startDate: start,
                                        endDate: end,
                                    });
                                }}

                                dateFormat="dd/MM/yy"

                                customInput={
                                    <DateRangeInput
                                        startDate={activeTabData.startDate}
                                        endDate={activeTabData.endDate}
                                        isOpen={activeTabData.dateOpen}   // ✅ PER TAB
                                    />
                                }
                            />
                        </div>
                        <MultiSelectCustom
                            options={optionsState}
                            selected={activeTabData.selectedState}
                            setSelected={(v) => updateTab({ selectedState: v })}
                            placeholder="State"
                            leftIcon={TlcPayrollStateIcon}
                            rightIcon={TlcPayrollRoleDownArrowIcon}
                        />
                        <MultiSelectCustom
                            options={optionsDepartment}
                            selected={activeTabData.selectedDepartment}
                            setSelected={(v) => updateTab({ selectedDepartment: v })}
                            placeholder="Department"
                            leftIcon={TlcPayrollDepartmentIcon}
                            rightIcon={TlcPayrollRoleDownArrowIcon}
                        />
                        <MultiSelectCustom
                            options={optionsType}
                            selected={activeTabData.selectedEmploymentType}
                            setSelected={(v) => updateTab({ selectedEmploymentType: v })}
                            placeholder="Type"
                            leftIcon={TlcPayrollTypeIcon}
                            rightIcon={TlcPayrollRoleDownArrowIcon}
                        />

                    </div>
                    {/* {activeTabData.analysisData && (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <button
                                onClick={handleAnalyse}
                                disabled={activeTabData.loading || activeTabData.uploading}
                                style={{
                                    backgroundColor: "#6c4cdc",
                                    padding: "10px 30px",
                                    textAlign: "center",
                                    border: "none",
                                    borderRadius: "6px",
                                    marginTop: "20px",
                                    cursor: "pointer",
                                    color: "white",
                                    fontWeight: "500",
                                    fontSize: "14px",
                                    opacity: activeTabData.loading || activeTabData.uploading ? 0.7 : 1,
                                }}
                            >
                                {activeTabData.loading || activeTabData.uploading ? "Processing..." : "Apply Filters"}
                            </button>
                        </div>
                    )} */}

                </section>
            )}
            {!activeTabData.viewingHistory &&
                activeTabData.stage !== "overview" &&
                (!activeTabData.analysisData ||
                    Object.keys(activeTabData.analysisData).length === 0) && (

                    <section className="data-upload-wrapper">
                        {(() => {
                            const item = { key: "payroll", title: "Upload Data" };
                            const files = activeTabData.fileNames[item.key] || [];

                            return (
                                <div className="data-upload-card">
                                    {/* HEADER */}
                                    <div className="data-upload-header">
                                        <span
                                            className="data-upload-template"
                                            onClick={() => {
                                                const link = document.createElement("a");
                                                link.href = "/templates/PayrollAnalysisTemplate.xlsx";
                                                link.download = "PayrollAnalysisTemplate.xlsx";
                                                document.body.appendChild(link);
                                                link.click();
                                                document.body.removeChild(link);
                                            }}
                                        >
                                            Download Template
                                            <img
                                                src={TlcPayrollDownloadIcon}
                                                alt="download"
                                                style={{ width: "24px", height: "24px" }}
                                            />

                                        </span>

                                        <span
                                            className="data-upload-label"
                                            style={{ marginRight: "auto", marginLeft: "12px" }}
                                        >
                                            {files.length === 0 ? "Upload Data" : "Upload Content"}
                                        </span>
                                    </div>

                                    {/* DROP AREA */}
                                    <div
                                        className="data-upload-droparea"
                                        onClick={() =>
                                            document.getElementById(`file-${activeTab}-${item.key}`).click()
                                        }
                                    >
                                        <input
                                            id={`file-${activeTab}-${item.key}`}
                                            type="file"
                                            accept=".xlsx,.xls,.csv"
                                            multiple
                                            hidden
                                            onChange={(e) => handleFileChange(e, item.key)}
                                        />

                                        {files.length === 0 ? (
                                            <div className="data-upload-empty">
                                                <img src={UploadTlcIcon} alt="upload" />
                                                <div className="data-upload-cta">Click to upload</div>
                                                <div className="data-upload-format">.XLSX, .XLS, .CSV</div>
                                            </div>
                                        ) : (
                                            <div className="data-upload-filelist">
                                                {files.map((fileName, idx) => (
                                                    <div key={idx} className="data-upload-file">
                                                        <div className="data-upload-fileinfo">
                                                            <img
                                                                src="https://cdn-icons-png.flaticon.com/512/732/732220.png"
                                                                alt="xls"
                                                            />
                                                            <div>
                                                                <div className="data-upload-filename">{fileName}</div>
                                                                <div className="data-upload-status">
                                                                    Uploaded • 100%
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="data-upload-actions">
                                                            <span className="data-upload-success">✔</span>
                                                            <RiDeleteBin6Line
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const updated = files.filter((_, i) => i !== idx);
                                                                    updateTab({
                                                                        fileNames: {
                                                                            ...activeTabData.fileNames,
                                                                            [item.key]: updated,
                                                                        },
                                                                        [`${item.key}Files`]:
                                                                            activeTabData[`${item.key}Files`]?.filter(
                                                                                (_, i) => i !== idx
                                                                            ),
                                                                    });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </section>

                )}
            {activeTabData.stage === "loading" && (
                <div className="inline-loader-wrapper">
                    <div className="loader"></div>
                    <div className="loading-text">
                        {activeTabData.progressStage === "uploading" && "📤 Uploading your files..."}
                        {activeTabData.progressStage === "analysing" && "🔍 Analysing data..."}
                        {activeTabData.progressStage === "preparing" && "📊 Preparing your dashboard..."}
                    </div>
                </div>
            )}
            <div className="search-section">

                {activeTabData.stage === "overview" && activeTabData.analysisData && (

                    <section
                        ref={reportRef}
                        className={`dashboard ${!isAnyAccordionOpen ? "dashboard-decrease-margin-bottom" : ""}`}
                    >
                        {activeTabData.viewingHistory && (
                            <div
                                className="history-back-btn"
                                onClick={() => {
                                    updateTab({
                                        // exit history mode
                                        viewingHistory: false,
                                        isFromHistory: false,

                                        // reset flow
                                        stage: "filters",
                                        analysisData: null,

                                        // IMPORTANT: reset AI summary
                                        aiReport: null,
                                        aiLoading: false,
                                        showReport: false,

                                        // reset dates & filters
                                        startDate: null,
                                        endDate: null,
                                        selectedState: [],
                                        selectedDepartment: [],
                                        selectedRole: [],
                                        selectedEmploymentType: [],

                                        // reset tab name
                                        name: `Tab ${activeTab}`,

                                        // close accordions
                                        aiAccordion: false,
                                        page1: false,
                                        page2: false,
                                        page3: false,
                                        page4: false,
                                    });
                                }}
                            >
                                <GoArrowLeft size={22} color="#6C4CDC" />
                                Back
                            </div>
                        )}

                        <AccordionHeader
                            title={`AI Insight ${activeTabData.startDate && activeTabData.endDate
                                ? `(${formatDateRange()})`
                                : ""
                                }`}
                            isOpen={activeTabData.aiAccordion}
                            showInsightIcon={true}
                            showDownloadIcon={!!activeTabData.aiReport}   // ✅ only show when ready
                            onDownload={downloadWord}
                            onClick={() => {
                                const willOpen = !activeTabData.aiAccordion;
                                updateTab({ aiAccordion: willOpen });
                                if (willOpen && !activeTabData.aiReport && !activeTabData.aiLoading) {
                                    handleAiAnalysis();
                                }
                            }}
                        />

                        {activeTabData.aiAccordion && (
                            <div style={{ marginTop: "16px" ,marginBottom:"16px"}}>
                                {activeTabData.aiLoading && (
                                    <p style={{ textAlign: "center", color: "#6C4CDC" }}>
                                        ⏳ Generating AI summary...
                                    </p>
                                )}

                                {!activeTabData.aiLoading && activeTabData.aiReport && (
                                    <AIAnalysisReportViewer
                                        reportText={activeTabData.aiReport}
                                        loading={false}
                                        onDownload={downloadWord}
                                    />
                                )}

                                {!activeTabData.aiLoading && !activeTabData.aiReport && (
                                    <p style={{ textAlign: "center", color: "#777" }}>
                                        Click to generate AI summary
                                    </p>
                                )}
                            </div>
                        )}

                        {/* ================= PAGE 1 ================= */}
                        <AccordionHeader
                            title={`Payroll Overview ${activeTabData.startDate && activeTabData.endDate
                                ? `(${formatDateRange()})`
                                : ""
                                }`}
                            isOpen={activeTabData.page1}
                            showInsightIcon={false}
                            onClick={() => togglePage("page1")}
                        />

                        {activeTabData.page1 && (
                            <>
                                <div className="summary-cards">
                                    {Object.entries(
                                        activeTabData.analysisData.pages?.["page 1"]?.scorecard || {}
                                    ).map(([label, value], index) => (
                                        <div key={index} className="summary-card">
                                            <p>{label}</p>
                                            <h3>
                                                {typeof value === "number" || !isNaN(value)
                                                    ? Number(value).toLocaleString(undefined, {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })
                                                    : value}
                                            </h3>
                                        </div>
                                    ))}
                                </div>

                                <div className="charts-grid">
                                    {(activeTabData.analysisData.pages?.["page 1"]?.figures || []).map(
                                        (html, index) => (
                                            <div key={index}>{renderHtmlFigure(html)}</div>
                                        )
                                    )}
                                </div>

                                {activeTabData.analysisData.pages?.["page 1"]?.table && (
                                    <div className="table-box">
                                        {renderHtmlFigure(
                                            activeTabData.analysisData.pages["page 1"].table
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* ================= PAGE 2 ================= */}
                        <AccordionHeader
                            title={`Detailed Breakdown ${activeTabData.startDate && activeTabData.endDate
                                ? `(${formatDateRange()})`
                                : ""
                                }`}
                            isOpen={activeTabData.page2}
                            showInsightIcon={false}
                            onClick={() => togglePage("page2")}
                        />

                        {activeTabData.page2 && (
                            <div className="charts-grid">
                                {(activeTabData.analysisData.pages?.["page 2"]?.figures || []).map(
                                    (html, index) => (
                                        <div key={index}>{renderHtmlFigure(html)}</div>
                                    )
                                )}
                            </div>
                        )}

                        {/* ================= PAGE 3 ================= */}
                        <AccordionHeader
                            title={`Leave and absence ${activeTabData.startDate && activeTabData.endDate
                                ? `(${formatDateRange()})`
                                : ""
                                }`}
                            isOpen={activeTabData.page3}
                            showInsightIcon={false}
                            onClick={() => togglePage("page3")}
                        />

                        {activeTabData.page3 && (
                            <>
                                {(activeTabData.analysisData.pages?.["page 3"]?.figures || []).map(
                                    (html, index) => (
                                        <div key={index}>{renderHtmlFigure(html)}</div>
                                    )
                                )}
                            </>
                        )}

                        {/* ================= PAGE 4 ================= */}
                        <AccordionHeader
                            title={`Payroll Comparison ${activeTabData.startDate && activeTabData.endDate
                                ? `(${formatDateRange()})`
                                : ""
                                }`}
                            isOpen={activeTabData.page4}
                            showInsightIcon={false}
                            onClick={() => togglePage("page4")}
                        />

                        {activeTabData.page4 && (
                            <>
                                <div className="charts-grid">
                                    {(activeTabData.analysisData.pages?.["page 4"]?.figures || []).map(
                                        (html, index) => (
                                            <div key={index}>{renderHtmlFigure(html)}</div>
                                        )
                                    )}
                                </div>

                                {activeTabData.analysisData.pages?.["page 4"]?.table && (
                                    <div className="table-box">
                                        {renderHtmlFigure(
                                            activeTabData.analysisData.pages["page 4"].table
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                )}
                {activeTabData.stage === "filters" && !activeTabData.analysisData && (
                    <button
                        className="search-btn"
                        onClick={handleAnalyse}
                        disabled={activeTabData.loading}   // ✅ sirf loading ke time disable
                        style={{
                            marginTop: activeTabData.isFromHistory ? 0 : "40px",
                        }}
                    >
                        {activeTabData.loading ? (
                            "Processing..."
                        ) : (
                            <>
                                AI Analyse
                                <img
                                    src={star}
                                    alt="AI Insight"
                                    style={{ width: "20px", height: "20px" }}
                                />
                            </>
                        )}
                    </button>

                )}
            </div>

            {activeTabData.stage !== "loading" && (
                <section className="history-container">
                    {activeTabData?.analysisData && <button
                        onClick={handleDownloadWordReport}
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
                            marginLeft: "auto", // ✅ PUSH TO END
                            marginBottom: "7px",
                            opacity:
                                activeTabData.loading || activeTabData.uploading?.accounts
                                    ? 0.6
                                    : 1,
                        }}
                    >
                        <img
                            src={TlcCompareAnalyseIcon}
                            alt="download"
                            style={{ width: "14px", height: "14px" }}
                        />
                        Download Report
                    </button>
                    }
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <img
                            src={TlcPayrollHistoryIcon}
                            alt="icon"
                            style={{
                                width: "22px",
                                height: "21px",
                                pointerEvents: "none",
                                marginBottom: "13px"
                            }}
                        />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                width: "100%",
                            }}
                        >
                            <div className="history-title">History</div>
                        </div>

                    </div>

                    {loadingHistory ? (
                        <p style={{ textAlign: "center", color: "#555" }}>Loading history...</p>
                    ) : historyList.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#777" }}>No saved history found.</p>
                    ) : (
                        <>
                            {historyList.map((item, index) => {
                                const createdAt = new Date(item.createdAt).toLocaleString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "2-digit",
                                });

                                const filters = item.analysisResult?.filters || item?.filters || {};
                                const { state, department, role, employmentType, start, end } = filters;

                                return (
                                    <div
                                        key={item.id}
                                        className="history-card-modern"
                                        style={{
                                            position: "relative",
                                            transition: "transform 0.2s ease, box-shadow 0.3s ease",
                                        }}
                                    >
                                        {/* Delete button (cross icon) */}
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
                                                fontWeight: "bold",
                                                cursor: "pointer",
                                                transition: "transform 0.2s ease, color 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                                        >
                                            <RiDeleteBin6Line color='#6c4cdc' size={18} />
                                        </button>

                                        {/* History card body */}
                                        <div onClick={() => handleHistoryClick(item)}>
                                            <div className="history-top">
                                                <div className="history-date-range">
                                                    <strong className="label">Date Range:</strong>{" "}
                                                    <span className="value">
                                                        {start
                                                            ? new Date(start).toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "2-digit",
                                                            })
                                                            : "N/A"}{" "}
                                                        –{" "}
                                                        {end
                                                            ? new Date(end).toLocaleDateString("en-GB", {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "2-digit",
                                                            })
                                                            : "N/A"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="saved-on">
                                                <span className="saved-label">Saved On:</span>{" "}
                                                <span className="saved-value">{createdAt}</span>
                                            </div>

                                            <div className="history-filters">
                                                {state && (
                                                    <span className="filter-item">
                                                        <strong>State:</strong> {state}
                                                    </span>
                                                )}
                                                {department && (
                                                    <span className="filter-item">
                                                        <strong>Department:</strong> {department}
                                                    </span>
                                                )}
                                                {role && (
                                                    <span className="filter-item">
                                                        <strong>Role:</strong> {role}
                                                    </span>
                                                )}
                                                {employmentType && (
                                                    <span className="filter-item">
                                                        <strong>Employment Type:</strong> {employmentType}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ✅ Delete confirmation modal (moved outside .map) */}
                            {showDeleteModal && (
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        background: "rgba(0,0,0,0.4)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 9999,
                                        fontFamily: "Inter, sans-serif",
                                    }}
                                >
                                    <div
                                        style={{
                                            background: "#fff",
                                            borderRadius: "10px",
                                            padding: "20px 28px",
                                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                                            textAlign: "center",
                                            animation: "scaleIn 0.25s ease",
                                        }}
                                    >
                                        <h4
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#1f2937",
                                                marginBottom: "16px",
                                            }}
                                        >
                                            Are you sure you want to delete history?
                                        </h4>

                                        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                                            <button
                                                onClick={() => setShowDeleteModal(false)}
                                                style={{
                                                    background: "#E5E7EB",
                                                    color: "#111",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "6px 16px",
                                                    fontWeight: 500,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                No
                                            </button>
                                            <button
                                                onClick={handleDeleteHistory}
                                                disabled={deleting}
                                                style={{
                                                    background: "#6C4CDC",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "6px",
                                                    padding: "6px 16px",
                                                    fontWeight: 600,
                                                    cursor: "pointer",
                                                    opacity: deleting ? 0.7 : 1,
                                                }}
                                            >
                                                {deleting ? "..." : "Yes"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </div>
    );
}