import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import SummaryReport from "../../SummaryReportViewer";
import UploadFiles from "../../UploadFiles";
import UploaderCSVBox from "../../UploaderCSVBox";
import star from "../../../Images/star.png";
import "../../../Styles/FinancialHealth.css";
import "../../../Styles/UploaderPage.css";
import NewReportIcon from "../../../Images/NewReportIcon.png";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import UploadFinancialFiles from "../../UploadFinancialFiles";
import ChartsDisplay from "../../ChartDisplay";
import Plot from "react-plotly.js";
import response from "./response_api_only";
import PreviewDataSection from "./PreviewDataSection";
import { LuDownload } from "react-icons/lu";
import TlcPayrollDownArrow from "../../../Images/tlc_payroll_down_button.png"
import TlcPayrollInsightIcon from "../../../Images/TlcPayrollinsightIcon.png"
import DateRangePicker from "./DateRangePicker";
// import DateRangePicker from "../ClientProfitability/DateRangePicker";
// import MultiSelectCustom from "../ClientProfitability/MultiSelectCustom";
import "../../../Styles/TlcClientProfitability.css";
import MultiSelectCustom from "./MultiSelectCustom";
import TlcUploadBox from "./TlcUploadBox";
import TlcPayrollRoleIcon from "../../../Images/TlcPayrollRoleIcon.png";
import TlcPayrollRoleDownArrowIcon from "../../../Images/TlcPayrollRoleDownArrow.png";
import TlcPayrollDepartmentIcon from "../../../Images/TlcPayrollDepartmentIcon.png"
import TlcPayrollTypeIcon from "../../../Images/TlcPayrollType.png"
import TlcPayrollStateIcon from "../../../Images/TlcPayrollStateIcon.png"
import TlcPayrollHistoryIcon from "../../../Images/TlcPayrollHistory.png"
import TlcCompareAnalyseIcon from "../../../Images/Tlc_Compare_Analyse_Icon.png"
import WhoAreYouToggle from "./WhoAreYouToggle";
import "../../../Styles/TlcNewCustomReporting.css";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useRef } from "react";
import { GoArrowLeft } from "react-icons/go";
import FinancialAnalysisReportViewer from "./FinancialAnalysisReportViewer.js"
import TlcPayrollSyncTickIcon from "../../../Images/TlcPayrollSyncTick.png";

const NewFinancialHealth = (props) => {

    const [financialTemplate, setFinancialTemplate] = useState(null);
    const [standardFinancialExcelFile, setStandardFiancialExcelFile] = useState(
        []
    );
    const [uploadedFinancialExcelFile, setUploadedFinancialExcelFile] =
        useState(null);


    const [isFinancialProcessing, setIsFinancialProcessing] = useState(false);
    const [financialprogress, setFinancialProgress] = useState(0);

    const [isConsentChecked, setIsConsentChecked] = useState(false);
    // New Addition......
    const [selectedActor, setSelectedActor] = useState("NDIS");
    const [syncEnabled, setSyncEnabled] = useState(false);

    const [title, setTitle] = useState("");
    const raw = response
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [deleting, setDeleting] = useState(false);


    // ---------------- UI TABS (SAFE, ISOLATED) ----------------
    const [tabs, setTabs] = useState([
        {
            id: 1,
            name: "Tab 1",

            // 🔹 files
            selectedFiles: [],

            // 🔹 filters
            dateRange: [null, null],
            selectedState: [],
            selectedDepartment: [],
            selectedType: [],
            selectedRole: [],

            // 🔹 report result
            responseData: null,
            financialVisualizations: [],
            apiExcelUrls: [],
            excel_exports: {},
            titleArray: [],
            reportType: null,

            // 🔹 UI / workflow
            loading: false,
            uploading: false,
            progress: 0,
            isFromHistory: false,

            // 🔹 accordions
            aiInsightOpen: false,
            accordions: {
                charts: false,
                summary: false,
            },
            savingHistory: false,
        },
    ]);

    const [activeTab, setActiveTab] = useState(1);

    const activeTabData = tabs.find(t => t.id === activeTab);
    const [startDate, endDate] = activeTabData?.dateRange || [];

    const previewRef = useRef(null);
    const handleNewTab = () => {
        const newId = tabs.length
            ? Math.max(...tabs.map(t => t.id)) + 1
            : 1;

        setTabs(prev => [
            ...prev,
            {
                id: newId,
                name: `Tab ${newId}`,

                selectedFiles: [],

                dateRange: [null, null],
                selectedState: [],
                selectedDepartment: [],
                selectedType: [],
                selectedRole: [],

                responseData: null,
                financialVisualizations: [],
                apiExcelUrls: [],
                excel_exports: {},
                titleArray: [],
                reportType: null,

                loading: false,
                uploading: false,
                progress: 0,
                isFromHistory: false,

                aiInsightOpen: false,
                accordions: {
                    charts: false,
                    summary: false,
                },
                savingHistory: false,
            }

        ]);

        setActiveTab(newId);
    };

    const updateTab = (updates) => {
        setTabs(prev =>
            prev.map(t =>
                t.id === activeTab ? { ...t, ...updates } : t
            )
        );
    };
    const handleCloseTab = (id) => {
        const remaining = tabs.filter(t => t.id !== id);
        setTabs(remaining);

        if (id === activeTab && remaining.length > 0) {
            setActiveTab(remaining[0].id);
        }
    };
    const formatDateRangeForTab = (startDate, endDate) => {
        if (!startDate || !endDate) return null;

        const format = (d) => {
            const date = d instanceof Date ? d : new Date(d);
            return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        };

        return `${format(startDate)} - ${format(endDate)}`;
    };


    const formatHistoryDateRange = (dateRange) => {
        if (!Array.isArray(dateRange) || dateRange.length !== 2) return "–";

        const [start, end] = dateRange;
        if (!start || !end) return "–";

        const format = (date) =>
            new Date(date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
            });

        return `${format(start)} – ${format(end)}`;
    };

    const rebuildExcelPreviewFromHistory = (excelExports = {}) => {

        const mergedWorkbook = XLSX.utils.book_new();
        const usedSheetNames = new Set();
        const titleArray = [];

        Object.entries(excelExports).forEach(([provider, files]) => {
            if (!Array.isArray(files)) return;

            files.forEach((file) => {
                if (!file?.data_url) return;

                titleArray.push(file.title);

                const base64String = file.data_url.includes("base64,")
                    ? file.data_url.split("base64,")[1]
                    : file.data_url;

                const binary = atob(base64String);
                const buffer = new ArrayBuffer(binary.length);
                const view = new Uint8Array(buffer);

                for (let i = 0; i < binary.length; i++) {
                    view[i] = binary.charCodeAt(i) & 0xff;
                }

                const workbook = XLSX.read(buffer, { type: "array" });

                workbook.SheetNames.forEach((sheetName) => {
                    let finalName = sheetName.slice(0, 31);
                    let counter = 1;

                    while (usedSheetNames.has(finalName)) {
                        const suffix = `_${counter++}`;
                        finalName = sheetName.slice(0, 31 - suffix.length) + suffix;
                    }

                    usedSheetNames.add(finalName);
                    XLSX.utils.book_append_sheet(
                        mergedWorkbook,
                        workbook.Sheets[sheetName],
                        finalName
                    );
                });
            });
        });

        const wbout = XLSX.write(mergedWorkbook, {
            bookType: "xlsx",
            type: "binary",
        });

        const blob = new Blob([s2ab(wbout)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        return {
            apiExcelUrls: [URL.createObjectURL(blob)], // ✅ SINGLE FILE
            titleArray,
        };
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
                };
            })
        );
    };

    const formatAccordionDate = (date) => {
        if (!date) return "";
        return date.toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        });
    };

    const renderUiTabBar = () => (
        <div
            className="tab-bar"
            style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginBottom: "16px",
                paddingTop: "16px",
                marginTop: "12px",
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
                                marginLeft: "4px",
                                color: "#ddd",
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
                }}
            >
                + New Tab
            </button>
        </div>
    );


    const optionsState = [
        { label: "NSW", value: "NSW" },
        { label: "VIC", value: "VIC" },
        { label: "QLD", value: "QLD" },
    ];

    const optionsDepartment = [
        { label: "NDIS", value: "NDIS" },
        { label: "Aged Care", value: "Aged Care" },
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
    const toggleAccordion = (key) => {
        updateTab({
            accordions: {
                ...activeTabData.accordions,
                [key]: !activeTabData.accordions[key],
            },
        });
    };


    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };
    // const handleFinancialFileChange = (e) => {
    //     const files = Array.from(e.target.files);
    //     if (!files.length) return;

    //     setFinancialReportFiles((prev) => [...prev, ...files]);
    //     e.target.value = "";
    // };

    const AccordionHeader = ({ title, isOpen, onClick }) => {
        const showInsightIcon =
            typeof title === "string" && title.startsWith("AI Insight");

        return (
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
                {/* Arrow */}
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

                {/* Title */}
                <span>{title}</span>

                {/* ✅ ONLY AI INSIGHT ICON */}
                {showInsightIcon && (
                    <img
                        src={TlcPayrollInsightIcon}
                        alt="AI Insight"
                        style={{ width: "18px", height: "18px", marginLeft: "4px" }}
                    />
                )}
            </div>
        );
    };



    const handleDownloadUploadedExcel = () => {
        if (!uploadedFinancialExcelFile) {
            alert("No Uploaded Excel file to download.");
            return;
        }

        const url = URL.createObjectURL(uploadedFinancialExcelFile);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", uploadedFinancialExcelFile.name);
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; ++i) view[i] = s.charCodeAt(i) & 0xff;
        return buf;
    }

    function toAWSDateTime(day, month, year = new Date().getFullYear()) {
        if (!day || !month) return null; // Handle missing values

        // Ensure day and month are two digits
        const dd = day.toString().padStart(2, "0");
        const mm = month.toString().padStart(2, "0");

        return `${year}-${mm}-${dd}T00:00:00Z`;
    }
    const handleDownloadStandardExcel = async () => {
        if (
            !Array.isArray(standardFinancialExcelFile) ||
            standardFinancialExcelFile.length === 0
        ) {
            alert("No Standard Excel files to download.");
            return;
        }

        const mergedWorkbook = XLSX.utils.book_new();
        const usedSheetNames = new Set();

        for (const file of standardFinancialExcelFile) {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: "array" });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Get base name without extension and limit to 31 characters
            const rawName = file.name.replace(/\.xlsx$/i, "");
            let sheetName = rawName.slice(0, 31); // Truncate to 31 chars

            // Ensure uniqueness if names clash
            let counter = 1;
            while (usedSheetNames.has(sheetName)) {
                const suffix = `_${counter++}`;
                const base = rawName.slice(0, 31 - suffix.length);
                sheetName = base + suffix;
            }

            usedSheetNames.add(sheetName);
            XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, sheetName);
        }

        const wbout = XLSX.write(mergedWorkbook, {
            bookType: "xlsx",
            type: "binary",
        });
        const blob = new Blob([s2ab(wbout)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Combined_Standard_Report.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    useEffect(() => {
        const fetchFinancialHistory = async () => {
            try {
                setLoadingHistory(true);

                const res = await fetch(
                    "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/financial-module"
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch financial history");
                }

                const json = await res.json();
                // console.log("json", json)
                setHistoryList(json.data || []);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchFinancialHistory()
    }, [props.user])

    const handleSaveFinancialHistory = async () => {
        // guard: already saving OR no analysis
        if (activeTabData.savingHistory || !activeTabData.responseData) return;
        // console.log("active tab data", activeTabData)
        try {
            // 🔹 START saving (PER TAB)
            updateTab({ savingHistory: true });

            const payload = {
                email: props?.user?.email || "",

                // 🔴 CORE DATA (THIS WAS MISSING)
                responseData: activeTabData.responseData,
                financialVisualizations: activeTabData.financialVisualizations || [],
                apiExcelUrls: activeTabData.apiExcelUrls || [],
                excelExports: activeTabData.excel_exports || {},
                titleArray: activeTabData.titleArray || [],
                reportType: activeTabData.reportType || null,

                // 🔴 FILTERS (same as client profitability)
                filters: {
                    dateRange: activeTabData.dateRange,
                    selectedState: activeTabData.selectedState,
                    selectedDepartment: activeTabData.selectedDepartment,
                    selectedType: activeTabData.selectedType,
                    selectedRole: activeTabData.selectedRole,
                },
            };

            // console.log("payload before saving history", payload)
            const res = await fetch("https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/financial-module/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to save history");
            }

            alert("Saved successfully");
        } catch (error) {
            console.error("Save history failed:", error);
            alert("Failed to save history");
        } finally {
            // 🔹 END saving (PER TAB)
            updateTab({ savingHistory: false });
        }
    };


    const handleHistoryClick = async (item) => {
        try {
            const res = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/financial-module/${item.id}`
            );

            if (!res.ok) throw new Error("Failed to fetch history item");

            const json = await res.json();
            const data = json.data;

            // console.log("data when clicked", data);

            // ---- Date range parsing (common) ----
            const rawRange = data.filters?.dateRange;
            const parsedDateRange =
                Array.isArray(rawRange) && rawRange.length === 2
                    ? [
                        rawRange[0] ? new Date(rawRange[0]) : null,
                        rawRange[1] ? new Date(rawRange[1]) : null,
                    ]
                    : [null, null];
            const historyTabName = formatDateRangeForTab(
                parsedDateRange[0],
                parsedDateRange[1]
            );
            // ---- Base payload (common for ALL types) ----
            const baseTabPayload = {
                responseData: data.responseData,
                financialVisualizations: data.financialVisualizations || [],
                reportType: data.reportType,

                dateRange: parsedDateRange,
                selectedState: data.filters?.selectedState || [],
                selectedDepartment: data.filters?.selectedDepartment || [],
                selectedType: data.filters?.selectedType || [],
                selectedRole: data.filters?.selectedRole || [],

                isFromHistory: true,
                loading: false,
                progress: 100,
            };

            // ---- TYPE-SPECIFIC HANDLING ----
            if (data.reportType === "api") {
                // ✅ API reports → rebuild excel preview
                const { apiExcelUrls, titleArray } =
                    rebuildExcelPreviewFromHistory(data.excelExports);

                updateTab({
                    ...baseTabPayload,
                    apiExcelUrls,
                    titleArray,
                    excel_exports: data.excelExports || {},
                    ...(historyTabName ? { name: historyTabName } : {}),
                });

            } else if (data.reportType === "upload") {
                // ✅ Upload reports → NO excel rebuild
                updateTab({
                    ...baseTabPayload,
                    apiExcelUrls: [],
                    titleArray: [],
                    excel_exports: {},
                    ...(historyTabName ? { name: historyTabName } : {}),
                });

            } else {
                // ✅ Fallback (future-proof)
                console.warn("Unknown reportType:", data.reportType);
                updateTab(baseTabPayload);
            }

        } catch (err) {
            console.error("Failed to load history", err);
        }
    };


    const handleDeleteHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true);

            const res = await fetch(`https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/financial-module`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: selectedHistoryId,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to delete history");
            }

            // remove from UI immediately (same as client profitability)
            setHistoryList((prev) =>
                prev.filter((item) => item.id !== selectedHistoryId)
            );

            setShowDeleteModal(false);
            setSelectedHistoryId(null);

            alert("History deleted successfully");
        } catch (error) {
            console.error("Delete history failed:", error);
            alert("Failed to delete history");
        } finally {
            setDeleting(false);
        }
    };

    const handleAnalyse = async () => {
        // Validation checks
        if (activeTabData.selectedFiles.length === 0 && !syncEnabled) {
            alert("Please upload the report files or enable sync.");
            return;
        }
        if (syncEnabled && (!startDate || !endDate)) {
            alert("Please select a valid date range when sync is enabled.");
            return;
        }


        props.handleClick();
        updateTab({ loading: true, progress: 1 });

        const interval = setInterval(() => {
            setTabs(prev =>
                prev.map(tab =>
                    tab.id === activeTab
                        ? { ...tab, progress: tab.progress < 92 ? tab.progress + 2 : tab.progress }
                        : tab
                )
            );
        }, 5000);


        try {
            const formData = new FormData();

            // Determine type correctly
            let type = "upload";
            // if (syncEnabled && financialReportFiles.length > 0) type = "hybrid";
            if (syncEnabled && activeTabData.selectedFiles.length === 0) type = "api";
            updateTab({
                reportType: type,
            });


            // Handle dates
            let fromDate, toDate;
            // if (type === "api" || type === "hybrid") {
            //     fromDate = startDate.toISOString();
            //     toDate = endDate.toISOString();

            //     if (!fromDate || !toDate) {
            //         alert("Please select valid start and end dates for sync mode.");
            //         clearInterval(interval);
            //         setIsFinancialProcessing(false);
            //         return;
            //     }
            // } else {
            //     const currentYear = new Date().getFullYear();
            //     fromDate = `${currentYear}-01-01T00:00:00Z`;
            //     toDate = `${currentYear}-12-31T23:59:59Z`;
            // }
            if (type === "api") {
                fromDate = startDate.toISOString();
                toDate = endDate.toISOString();

                if (!fromDate || !toDate) {
                    alert("Please select valid start and end dates for sync mode.");
                    clearInterval(interval);
                    updateTab({
                        loading: false,
                    });
                    return;
                }
            } else {
                const currentYear = new Date().getFullYear();
                fromDate = `${currentYear}-01-01T00:00:00Z`;
                toDate = `${currentYear}-12-31T23:59:59Z`;
            }
            // Validate user email
            if (!props.user?.email) {
                alert("User email is required. Please log in again.");
                clearInterval(interval);
                updateTab({
                    loading: false,
                });
                return;
            }

            const userEmail = props.user.email.trim().toLowerCase();

            // const userEmail = "kris@curki.ai"
            // console.log("Using email:", userEmail);

            // Append required fields
            formData.append("type", type);
            formData.append("userEmail", userEmail);
            formData.append("provider", selectedActor);
            formData.append("fromDate", fromDate);
            formData.append("toDate", toDate);

            // Append files if needed
            // if (type === "upload" || type === "hybrid") {
            //     if (financialReportFiles.length === 0) {
            //         alert("No files selected for upload.");
            //         clearInterval(interval);
            //         setIsFinancialProcessing(false);
            //         return;
            //     }
            //     financialReportFiles.forEach((file) => formData.append("files", file));
            // }
            if (type === "upload") {
                if (activeTabData.selectedFiles.length === 0) {
                    alert("No files selected for upload.");
                    clearInterval(interval);
                    updateTab({
                        loading: false,
                    });
                    return;
                }
                activeTabData.selectedFiles.forEach(file =>
                    formData.append("files", file)
                );
            }

            // --- Step 1: Call Analysis API ---
            const reportEndpoint = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/report-middleware"
            let analysisData = null;

            // Normal flow
            const analysisRes = await axios.post(
                reportEndpoint,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity,
                }
            );
            // console.log("analysisRes", analysisRes);
            analysisData = analysisRes.data;

            if (!analysisData) throw new Error("Empty response from analysis API");

            // --- Step 2: Build Visualization Payload ---
            let vizPayload;

            // Non-Kris = normal behavior
            vizPayload = {
                reportResponse: analysisData,
                from_date: fromDate,
                to_date: toDate,
                userEmail: userEmail
            };
            // console.log("vizPayload", vizPayload)

            // --- Step 3: Call Visualization API ---
            let vizData = null;
            // console.log("vizpayload", vizPayload)
            const vizRes = await axios.post(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/vizualize-reports",
                vizPayload,
                { headers: { "Content-Type": "application/json" } }
            );
            // console.log("vizRes", vizRes)
            vizData = vizRes.data;

            // --- Step 4: Normalize Figures ---
            const normalizeFigures = (source) => {
                // console.log("source", source);

                const results = [];

                // 1️⃣ Case: Normal Plotly JSON charts
                if (Array.isArray(source?.data?.figures)) {
                    const charts = source.data.figures.map((fig, i) => ({
                        type: "json",
                        figure: fig.figure,
                        metricName: fig.key || `Figure ${i + 1}`,
                    }));
                    results.push(...charts);
                }

                // 🧩 2️⃣ Case: Image attachments
                if (Array.isArray(source?.data?.attachments)) {
                    const images = source.data.attachments.map((att, i) => ({
                        type: "image",
                        image: `data:image/png;base64,${att.file_base64}`,
                        metricName: att.filename
                            ? att.filename.replace(/\.[^/.]+$/, "")
                            : `Attachment ${i + 1}`,
                    }));
                    results.push(...images);
                }

                // 🧩 3️⃣ Case: Unavailable metrics (✅ top level)
                if (Array.isArray(source?.unavailable_metrics)) {
                    // console.log("Found top-level unavailable_metrics", source.unavailable_metrics);
                    const seen = new Set();
                    const uniqueMetrics = [];

                    for (const [metricName, reason] of source.unavailable_metrics) {
                        if (!metricName) continue;
                        if (!seen.has(metricName)) {
                            seen.add(metricName);
                            uniqueMetrics.push({ metricName, reason });
                        }
                    }

                    const blanks = uniqueMetrics.map(({ metricName, reason }, i) => ({
                        type: "blank",
                        metricName: metricName || `Unavailable Metric ${i + 1}`,
                        reason: reason || "No data available",
                    }));

                    results.push(...blanks);
                }

                // 🧩 4️⃣ Case: Unavailable metrics nested inside data
                if (Array.isArray(source?.data?.unavailable_metrics)) {
                    // console.log("Found nested unavailable_metrics", source.data.unavailable_metrics);
                    const seen = new Set();
                    const uniqueMetrics = [];

                    for (const [metricName, reason] of source.data.unavailable_metrics) {
                        if (!metricName) continue;
                        if (!seen.has(metricName)) {
                            seen.add(metricName);
                            uniqueMetrics.push({ metricName, reason });
                        }
                    }

                    const blanks = uniqueMetrics.map(({ metricName, reason }, i) => ({
                        type: "blank",
                        metricName: metricName || `Unavailable Metric ${i + 1}`,
                        reason: reason || "No data available",
                    }));

                    results.push(...blanks);
                }

                // console.log("normalizeFigures results:", results);
                return results;
            };

            // console.log("vizPayload?.reportResponse?.excel_exports", vizPayload?.reportResponse?.excel_exports)
            if (type === "api") {
                if (vizPayload?.reportResponse?.excel_exports) {
                    try {
                        const mergedWorkbook = XLSX.utils.book_new();
                        const usedSheetNames = new Set();

                        const excelFiles = Object.values(vizPayload?.reportResponse?.excel_exports).flat();
                        const titlesArray = [];

                        for (const fileData of excelFiles) {
                            let base64 = fileData.data_url;
                            let fileTitle = fileData.title;
                            titlesArray.push(fileTitle);

                            const base64String = base64.includes("base64,") ? base64.split("base64,")[1] : base64;
                            const binary = atob(base64String);
                            const arrayBuffer = new ArrayBuffer(binary.length);
                            const view = new Uint8Array(arrayBuffer);
                            for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i) & 0xff;

                            const workbook = XLSX.read(arrayBuffer, { type: "array" });

                            for (const sheetName of workbook.SheetNames) {
                                let newSheetName = fileTitle.slice(0, 31);
                                let counter = 1;
                                while (usedSheetNames.has(newSheetName)) {
                                    const suffix = `_${counter++}`;
                                    newSheetName = fileTitle.slice(0, 31 - suffix.length) + suffix;
                                }
                                usedSheetNames.add(newSheetName);
                                XLSX.utils.book_append_sheet(mergedWorkbook, workbook.Sheets[sheetName], newSheetName);
                            }
                        }

                        updateTab({
                            titleArray: titlesArray,
                        });

                        const wbout = XLSX.write(mergedWorkbook, { bookType: "xlsx", type: "binary" });
                        const blob = new Blob([s2ab(wbout)], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        });

                        const url = URL.createObjectURL(blob);
                        updateTab({
                            apiExcelUrls: [url],
                        });
                    } catch (err) {
                        console.error("Error merging API Excel files:", err);
                    }
                }
            } else {
                updateTab({ apiExcelUrls: [] });
            }
            // console.log("apiExcelUrls in handle analyse", apiExcelUrls)
            const figures = normalizeFigures(vizData);
            // console.log("analysisData", analysisData)
            // --- Step 5: Save state ---
            const tabDateName = formatDateRangeForTab(startDate, endDate);
            updateTab({
                responseData: analysisData.final,
                financialVisualizations: figures,
                excel_exports: analysisData?.excel_exports,
                loading: false,
                progress: 100,
                ...(tabDateName ? { name: tabDateName } : {}),
            });



        } catch (err) {
            console.error("Error in analysis pipeline:", err);
            if (err.response) {
                const { status, data } = err.response;
                alert(`Error ${status}: ${data?.error || data?.message || "Unknown server error"}`);
            } else if (err.request) {
                alert("Network error. Please check your internet connection.");
            } else {
                alert(`Unexpected error: ${err.message}`);
            }
        } finally {
            clearInterval(interval);
            updateTab({
                loading: false,
                progress: 100,
            });
        }
    };

    const isButtonDisabled =
        !syncEnabled && activeTabData.selectedFiles.length === 0;


    useEffect(() => {
        if (activeTabData?.responseData) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [activeTabData?.responseData]);


    const resetFinancialHealthState = () => {
        updateTab({
            responseData: null,
            selectedFiles: [],
            financialVisualizations: [],
            apiExcelUrls: [],
            titleArray: [],
            reportType: null,
            isFromHistory: false,
            aiInsightOpen: false,
            accordions: { charts: false, summary: false },
        });
    };

    // console.log("financial Visualizations", financialVisualizations);
    // console.log("accordions", accordions)
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
                        // onClick={handleDownloadReport}
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
                <div className="history-title">History</div>
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
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHistoryId(item.id);
                                    setShowDeleteModal(true);
                                }}
                                style={{
                                    position: "absolute",
                                    top: "10px",
                                    right: "10px",
                                    background: "transparent",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "#6C4CDC",
                                }}
                                title="Delete"
                            >
                                <RiDeleteBin6Line size={18} />
                            </button>

                            {/* TOP ROW */}
                            <div className="history-top">
                                <div className="history-date-range">
                                    <span className="label">Date Range: </span>
                                    <span className="value">
                                        {formatHistoryDateRange(item.filters?.dateRange)}

                                    </span>
                                </div>
                            </div>

                            {/* SAVED ON */}
                            <div className="saved-on">
                                <span className="saved-label">Saved on: </span>
                                <span style={{ color: "#000" }}>
                                    {new Date(item.createdAt).toLocaleString()}
                                </span>
                            </div>


                            {/* FILTER SUMMARY */}
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
                </div>
            )}
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
                                color: "#1f2937",
                                marginBottom: "20px",
                            }}
                        >
                            Are you sure you want to delete history?
                        </div>

                        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
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
                                    cursor: "pointer",
                                    fontWeight: "500",
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
                                    cursor: "pointer",
                                    fontWeight: "500",
                                }}
                            >
                                {deleting ? "..." : "Yes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </section>
    );
    // console.log("activeTabData", activeTabData)
    return (

        <>
            {!activeTabData.responseData ? (
                <>
                    {/* <PreviewDataSection
            apiExcelUrls={apiExcelUrls}
            titles={titleArray} // pass titles as a prop
          /> */}
                    {/* Header Section */}

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
                                    setSelected={(vals) => updateTab({ selectedRole: vals })}
                                    placeholder="Role"
                                    leftIcon={TlcPayrollRoleIcon}
                                    rightIcon={TlcPayrollRoleDownArrowIcon}
                                />

                            </div>
                        </div>


                        {/* <h1 className="titless">FINANCIAL HEALTH</h1> */}
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
                            <span style={{ fontSize: "13px", fontWeight: 500, fontFamily: "Inter" }}>
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
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        {/* LEFT: UI TABS */}
                        {renderUiTabBar()}

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
                                onClick={handleAnalyse} // existing financial analyse fn
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

                        </div>
                    </div>

                    {/* Info Table */}
                    {/* <div className="info-table">
                        <div className="table-headerss">
                            <span>If You Upload This...</span>
                            <span>Our AI Will Instantly...</span>
                        </div>
                        <div className="table-rowss">
                            <div>Client Funding Statements (NDIS/HCP)</div>
                            <ul>
                                <li>Find unspent funds expiring soon.</li>
                                <li>
                                    Show you which clients are under or over-utilising their plans
                                </li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Timesheets & Roster Exports</div>
                            <ul>
                                <li>Pinpoint overtime hotspots and their cost</li>
                                <li>Show wage cost vs revenue for every client and service.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Aged Receivables Report</div>
                            <ul>
                                <li>Triage overdue NDIS & client invoices.</li>
                                <li>
                                    Predict next week's cash flow based on what's still unpaid.
                                </li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Profit & Loss Statement</div>
                            <ul>
                                <li>Analyse your true service line profitability.</li>
                                <li>Flag rising costs that are eroding your margin.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Service Delivery Logs</div>
                            <ul>
                                <li>Find unspent funds expiring soon.</li>
                                <li>
                                    Show you which clients are under or over-utilising their plans
                                </li>
                            </ul>
                        </div>
                    </div> */}
                    {/* Date DropDown */}
                    <section className="filters-card">
                        <div className="filters-grid">

                            {/* DATE RANGE */}
                            <div className="date-filter-wrapper">
                                <DateRangePicker
                                    startDate={startDate}
                                    endDate={endDate}
                                    onChange={(dates) => updateTab({ dateRange: dates })}
                                />

                            </div>

                            {/* STATE */}
                            <MultiSelectCustom
                                options={optionsState}
                                selected={activeTabData.selectedState}
                                setSelected={(vals) => updateTab({ selectedState: vals })}
                                placeholder="State"
                                leftIcon={TlcPayrollStateIcon}
                                rightIcon={TlcPayrollDownArrow}
                            />

                            {/* DEPARTMENT FILTER */}
                            <MultiSelectCustom
                                options={optionsDepartment}
                                selected={activeTabData.selectedDepartment}
                                setSelected={(vals) => updateTab({ selectedDepartment: vals })}
                                placeholder="Department"
                                leftIcon={TlcPayrollDepartmentIcon}
                                rightIcon={TlcPayrollDownArrow}
                            />


                            {/* TYPE FILTER */}
                            <MultiSelectCustom
                                options={optionsType}
                                selected={activeTabData.selectedType}
                                setSelected={(vals) => updateTab({ selectedType: vals })}
                                placeholder="Type"
                                leftIcon={TlcPayrollTypeIcon}
                                rightIcon={TlcPayrollDownArrow}
                            />


                        </div>
                    </section>

                    <section className="data-upload-wrapper">
                        <TlcUploadBox
                            id="financial-health-files"
                            title="Upload Data"
                            subtitle="Upload multiple .xlsx, .csv or .xls files"
                            accept=".xlsx,.xls,.csv"
                            files={activeTabData.selectedFiles}
                            setFiles={setTabFiles}
                            multiple
                            onTemplateDownload={() => {
                                const link = document.createElement("a");
                                link.href = "/templates/FinancialTemplate.xlsx";
                                link.download = "FinancialTemplate.xlsx";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                        />
                    </section>
                    <div className="search-section">
                        <button
                            className="analyse-btn"
                            disabled={isButtonDisabled || activeTabData.loading}
                            style={{
                                backgroundColor:
                                    isButtonDisabled || activeTabData.loading ? "#A1A1AA" : "#000",
                                cursor: activeTabData.loading ? "not-allowed" : "pointer",
                                marginTop: activeTabData.isFromHistory ? 0 : "40px",
                            }}
                            onClick={handleAnalyse}
                        >
                            {activeTabData.loading ? (
                                `${activeTabData.progress}% Processing...`
                            ) : (
                                <div
                                    style={{ display: "flex", alignItems: "center", gap: "10px" }}
                                >
                                    AI Analyse
                                    <img
                                        src={star}
                                        alt="img"
                                        style={{ width: "20px", height: "20px" }}
                                    />
                                </div>
                            )}
                        </button>
                    </div>
                    {/* <div
                        style={{
                            fontSize: "12px",
                            color: "grey",
                            fontFamily: "Inter",
                            fontWeight: "400",
                            textAlign: "center",
                            marginTop: "12px",
                        }}
                    >
                        **Estimated Time to Analyse 4 min**
                    </div> */}
                </>
            ) : (
                <>
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
                                    setSelected={(vals) => updateTab({ selectedRole: vals })}
                                    placeholder="Role"
                                    leftIcon={TlcPayrollRoleIcon}
                                    rightIcon={TlcPayrollRoleDownArrowIcon}
                                />
                            </div>
                        </div>


                        {/* <h1 className="titless">FINANCIAL HEALTH</h1> */}
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
                            <span style={{ fontSize: "13px", fontWeight: 500, fontFamily: "Inter" }}>
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
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            width: "100%",
                        }}
                    >
                        {/* LEFT: UI TABS */}
                        {renderUiTabBar()}

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
                                onClick={handleAnalyse} // existing financial analyse fn
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
                            {!activeTabData.isFromHistory && (
                                <button
                                    onClick={handleSaveFinancialHistory}
                                    style={{
                                        background: "#6C4CDC",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        cursor: "pointer",
                                        marginBottom: "10px"
                                    }}
                                >
                                    {activeTabData.savingHistory ? "Saving..." : "Save"}
                                </button>
                            )}

                        </div>
                    </div>
                    {activeTabData.isFromHistory && (
                        <div
                            className="financial-health-history-back-btn"
                            onClick={() => {
                                updateTab({
                                    // 🔁 history mode off
                                    isFromHistory: false,

                                    // 🧹 clear report
                                    responseData: null,
                                    financialVisualizations: [],
                                    apiExcelUrls: [],
                                    excel_exports: {},
                                    titleArray: [],
                                    reportType: null,

                                    // 📅 clear filters
                                    dateRange: [null, null],
                                    selectedState: [],
                                    selectedDepartment: [],
                                    selectedType: [],
                                    selectedRole: [],

                                    // 🧠 close accordions
                                    aiInsightOpen: false,
                                    accordions: {
                                        charts: false,
                                        summary: false,
                                    },

                                    // 🏷️ reset tab name
                                    name: `Tab ${activeTab}`,
                                });
                            }}
                        >
                            <GoArrowLeft size={22} color="#6C4CDC" />
                            Back
                        </div>
                    )}
                    {/* <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-start",
                            marginBottom: "24px",
                            marginTop: "14px",
                        }}
                    >
                        <button
                            className="new-report-btn"
                            onClick={resetFinancialHealthState}
                        >
                            <img
                                src={NewReportIcon}
                                alt="newReporticon"
                                style={{ width: "24px" }}
                            />
                            <div>New Report</div>
                        </button>
                    </div> */}
                    {/* ================= AI INSIGHT ================= */}
                    <AccordionHeader
                        title={
                            startDate && endDate
                                ? `AI Insight (${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")})`
                                : "AI Insight"
                        }
                        isOpen={activeTabData.aiInsightOpen}
                        onClick={() =>
                            updateTab({ aiInsightOpen: !activeTabData.aiInsightOpen })
                        }

                    />


                    {activeTabData.aiInsightOpen && (
                        <div
                            className="reports-box"
                            style={{ height: "auto", marginTop: "20px", padding: "10px" }}
                        >
                            <div
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    padding: "10px 30px",
                                    borderRadius: "10px",
                                }}
                            >
                                {/* <SummaryReport
                                    summaryText={activeTabData.responseData}
                                    handleDownloadAnalyedReportUploadedCSV={
                                        handleDownloadUploadedExcel
                                    }
                                    handleDownloadAnalyedStandardReportCSV={
                                        handleDownloadStandardExcel
                                    }
                                    selectedRole={props.selectedRole}
                                    resetFinancialHealthState={resetFinancialHealthState}
                                /> */}
                                {activeTabData.aiInsightOpen && (
                                    <div style={{ marginTop: "16px" }}>
                                        <FinancialAnalysisReportViewer
                                            reportText={activeTabData.responseData}
                                            loading={!activeTabData.responseData}
                                        />
                                    </div>
                                )}
                                {activeTabData.responseData && activeTabData.apiExcelUrls?.length > 0 && (
                                    <PreviewDataSection
                                        apiExcelUrls={activeTabData.apiExcelUrls}
                                        titles={activeTabData.titleArray}
                                        financialReport={activeTabData.responseData}
                                        ref={previewRef}
                                    />
                                )}


                                {/* Consent */}
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        padding: "16px",
                                        fontSize: "13px",
                                        color: "grey",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isConsentChecked}
                                            readOnly
                                            style={{
                                                width: "16px",
                                                height: "16px",
                                                marginRight: "8px",
                                                accentColor: "green",
                                            }}
                                        />
                                        <label>
                                            AI-generated content. Only to be used as a guide. I agree to
                                            T&C on curki.ai website.
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleButtonClick}
                                        style={{
                                            background:
                                                "linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)",
                                            color: "white",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "4px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        I understand
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ================= CHARTS ================= */}
                    <AccordionHeader
                        title={
                            startDate && endDate
                                ? `Financial Vizualization (${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")})`
                                : "Financial Vizualization"
                        }
                        isOpen={activeTabData.accordions.charts}
                        onClick={() => toggleAccordion("charts")}
                    />

                    {activeTabData.accordions.charts && (
                        <div className="graph-gridsss">
                            {activeTabData.financialVisualizations.map((item, index) => (
                                <div key={index} style={{ marginBottom: "30px" }}>
                                    {item.figure && (
                                        <Plot
                                            data={item.figure.data}
                                            layout={{
                                                ...item.figure.layout,
                                                autosize: true,
                                                margin: { t: 120, l: 40, r: 40, b: 40 },
                                            }}
                                            style={{ width: "100%", height: "400px" }}
                                            config={{ responsive: true, displayModeBar: false }}
                                        />
                                    )}
                                    {item.type === "image" && item.image && (
                                        <div style={{ textAlign: "center" }}>
                                            <h4 style={{ marginBottom: "8px" }}>{item.metricName}</h4>
                                            <img
                                                src={item.image}
                                                alt={item.metricName}
                                                style={{
                                                    maxWidth: "100%",
                                                    height: "auto",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ================= RAW DATA / EXPORT ================= */}
                    {activeTabData.reportType === "api" && <AccordionHeader
                        title={
                            startDate && endDate
                                ? `Exported Data (${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")})`
                                : "Exported Data"
                        }
                        isOpen={activeTabData.accordions.summary}
                        onClick={() => toggleAccordion("summary")}
                    />}

                    {activeTabData.accordions.summary &&
                        activeTabData.apiExcelUrls?.length > 0 && (
                            <PreviewDataSection
                                apiExcelUrls={activeTabData.apiExcelUrls}
                                titles={activeTabData.titleArray}
                                financialReport={activeTabData.responseData}
                                ref={previewRef}
                            />
                        )}


                    {/* <div
                        className="reports-box"
                        style={{ height: "auto", marginTop: "30px", padding: "10px" }}
                    >
                        <div
                            style={{
                                backgroundColor: "#FFFFFF",
                                padding: "10px 30px",
                                borderRadius: "10px",
                            }}
                        >
                            <SummaryReport
                                summaryText={financialReport}
                                handleDownloadAnalyedReportUploadedCSV={
                                    handleDownloadUploadedExcel
                                }
                                handleDownloadAnalyedStandardReportCSV={
                                    handleDownloadStandardExcel
                                }
                                selectedRole={props.selectedRole}
                                resetFinancialHealthState={resetFinancialHealthState}
                            />
                            {financialReport && apiExcelUrls?.length > 0 && (
                                <PreviewDataSection
                                    apiExcelUrls={apiExcelUrls}
                                    titles={titleArray} // pass titles as a prop
                                    financialReport={financialReport}
                                />
                            )}
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    padding: "16px",
                                    fontSize: "13px",
                                    color: "grey",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        id="aiConsent"
                                        checked={isConsentChecked}
                                        readOnly
                                        style={{
                                            width: "16px",
                                            height: "16px",
                                            marginRight: "8px",
                                            accentColor: "green",
                                            cursor: "pointer",
                                        }}
                                    />
                                    <label htmlFor="aiConsent" style={{ cursor: "pointer" }}>
                                        AI-generated content. Only to be used as a guide. I agree to
                                        T&C on curki.ai website.
                                    </label>
                                </div>
                                <button
                                    onClick={handleButtonClick}
                                    style={{
                                        background:
                                            "linear-gradient(180deg, rgba(139, 117, 255, 0.9) 27.88%, #6D51FF 100%)",
                                        color: "white",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "4px",
                                        cursor: "pointer",
                                    }}
                                >
                                    I understand
                                </button>
                            </div>
                        </div>
                    </div> */}
                </>
            )}
            {renderHistorySection()}

        </>

    );
};

export default NewFinancialHealth;
