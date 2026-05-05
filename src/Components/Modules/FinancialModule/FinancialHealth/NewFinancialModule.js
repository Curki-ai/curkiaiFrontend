import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import SummaryReport from "../../../general-components/SummaryReportViewer";
import UploadFiles from "../../../general-components/UploadFiles";
import UploaderCSVBox from "../../../general-components/UploaderCSVBox";
import star from "../../../../Images/star.png";
import "../../../../Styles/FinancialModule/FinancialHealth.css";
import "../../../../Styles/general-styles/UploaderPage.css";
import NewReportIcon from "../../../../Images/NewReportIcon.png";
import Toggle from "react-toggle";
import "react-toggle/style.css";
import UploadFinancialFiles from "../../../general-components/UploadFinancialFiles";
import ChartsDisplay from "../../../general-components/ChartDisplay";
import Plot from "react-plotly.js";
import response from "./response_api_only";
import PreviewDataSection from "./PreviewDataSection";
import { LuDownload } from "react-icons/lu";
import TlcPayrollDownArrow from "../../../../Images/tlc_payroll_down_button.png"
import TlcPayrollInsightIcon from "../../../../Images/TlcPayrollinsightIcon.png"
import DateRangePicker from "../DateRangePicker";
import "../../../../Styles/FinancialModule/TlcClientProfitability.css";
import MultiSelectCustom from "../MultiSelectCustom";
import TlcUploadBox from "../Tlc/TlcUploadBox";
import TlcPayrollRoleIcon from "../../../../Images/TlcPayrollRoleIcon.png";
import TlcPayrollRoleDownArrowIcon from "../../../../Images/TlcPayrollRoleDownArrow.png";
import TlcPayrollDepartmentIcon from "../../../../Images/TlcPayrollDepartmentIcon.png"
import TlcPayrollTypeIcon from "../../../../Images/TlcPayrollType.png"
import TlcPayrollStateIcon from "../../../../Images/TlcPayrollStateIcon.png"
import TlcPayrollHistoryIcon from "../../../../Images/TlcPayrollHistory.png"
import TlcCompareAnalyseIcon from "../../../../Images/Tlc_Compare_Analyse_Icon.png"
import WhoAreYouToggle from "../WhoAreYouToggle";
import "../../../../Styles/FinancialModule/TlcNewCustomReporting.css";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useRef } from "react";
import { GoArrowLeft } from "react-icons/go";
import FinancialAnalysisReportViewer from "../FinancialAnalysisReportViewer.js"
import TlcPayrollSyncTickIcon from "../../../../Images/TlcPayrollSyncTick.png";
import TlcGraphRenderer from "../Tlc/TlcGraphRenderer.js";
import { MdOutlineFileDownload } from "react-icons/md";
import incrementAnalysisCount from "../Tlc/TLcAnalysisCount.js";
import incrementCareVoiceAnalysisCount from "../../SupportAtHomeModule/careVoiceCostAnalysis.js";

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
    const [historyLoading, setHistoryLoading] = useState(false);
    const pageRef = useRef(null);
    // Add these near your other state declarations
    const [searchQuery, setSearchQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [filteredHistoryList, setFilteredHistoryList] = useState([]);
    const [searchMode, setSearchMode] = useState(false); // To track if we're in search mode
    const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
    // const BASE_URL = "http://localhost:5000";
    // Add this function after handleDeleteHistory
    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSearchMode(false);
            setFilteredHistoryList([]);
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`${BASE_URL}/searchParse`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query: searchQuery }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || "Search failed");
            }

            const parsedRanges = result.data;
            // console.log("Parsed search ranges:", parsedRanges);

            if (!parsedRanges || parsedRanges.length === 0) {
                setFilteredHistoryList([]);
                setSearchMode(true);
                return;
            }

            // Filter history items based on search ranges
            const filtered = historyList.filter(historyItem => {
                // Get filters from history item
                const filters = historyItem.filters || {};
                const dateRange = filters.dateRange || [];
                const state = filters.selectedState || [];

                if (!dateRange || dateRange.length !== 2) return false;

                const [start, end] = dateRange;
                if (!start || !end) return false;

                const historyStart = new Date(start);
                const historyEnd = new Date(end);

                return parsedRanges.some(range => {
                    let matches = true;

                    // Date range check - check if history date range is within search range
                    if (range.Start && range.End) {
                        const rangeStart = new Date(range.Start);
                        const rangeEnd = new Date(range.End);

                        // Check if history date range is within search range
                        const datesMatch = !(
                            historyEnd < rangeStart ||
                            historyStart > rangeEnd
                        );
                        if (!datesMatch) matches = false;
                    }

                    // STATE FILTER - handle empty states properly
                    if (range.State && range.State.trim() !== "") {
                        if (!state || state.length === 0) {
                            matches = false;
                        } else {
                            const rangeStateLower = range.State.toLowerCase();
                            // Check if any selected state matches the search state
                            const hasMatchingState = state.some(s =>
                                s.value?.toLowerCase().includes(rangeStateLower) ||
                                s.label?.toLowerCase().includes(rangeStateLower)
                            );

                            if (!hasMatchingState) {
                                matches = false;
                            }
                        }
                    }

                    return matches;
                });
            });

            console.log(`Found ${filtered.length} matching history items`);
            setFilteredHistoryList(filtered);
            setSearchMode(true);

        } catch (err) {
            console.error("❌ Search error:", err);
            alert("Search failed: " + err.message);
            setSearchMode(false);
            setFilteredHistoryList([]);
        } finally {
            setSearching(false);
        }
    };
    // Add debounced search effect
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch();
            } else {
                setSearchMode(false);
                setFilteredHistoryList([]);
            }
        }, 500); // Wait 500ms after user stops typing

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);
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
            askAiDataframes: {},
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
            progressStage: "idle",
            stage: "idle",
            savedToHistory: false,
        },
    ]);

    const [activeTab, setActiveTab] = useState(1);

    const activeTabData = tabs.find(t => t.id === activeTab);
    const [startDate, endDate] = activeTabData?.dateRange || [];

    const previewRef = useRef(null);
    const userEmail = props.user?.email;
    // const userEmail = "gjavier@tenderlovingcaredisability.com.au";
    // const userEmail = "q.benico@tenderlovingcaredisability.com.au";
    // const userEmail = "iaquino@tenderlovingcaredisability.com.au";
    const RESTRICTED_USERS = [
        "jballares@tenderlovingcaredisability.com.au",
        "iaquino@tenderlovingcaredisability.com.au",
        "kperu@tenderlovingcaredisability.com.au",
        "mboutros@tenderlovingcaredisability.com.au",
        "rjodeh@tenderlovingcaredisability.com.au",
        "ryounes@tenderlovingcaredisability.com.au",
        "stickner@tenderlovingcaredisability.com.au",
        "q.benico@tenderlovingcaredisability.com.au"
    ];

    const isRestrictedUser = RESTRICTED_USERS.includes(
        (userEmail || "").toLowerCase()
    );
    const EMAIL_STATE_MAP = {
        "molley@tenderlovingcaredisability.com.au": [
            "South Australia",
            "Queensland",
        ],

        "ilaurente@tenderlovingcaredisability.com.au": [
            "Victoria",
            "Queensland",
        ],

        "kbrennen@tenderlovingcaredisability.com.au": [
            "New South Wales",
        ],
    };

    const userStates = EMAIL_STATE_MAP[userEmail] || [];
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
                askAiDataframes: {},
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
                progressStage: "idle",
                stage: "idle",
                savedToHistory: false,
            }

        ]);

        setActiveTab(newId);
    };
    function tablesToAskAiDataframes(tables = {}) {
        const dataframes = {};

        Object.entries(tables).forEach(([tableName, rows]) => {
            if (!Array.isArray(rows) || rows.length === 0) return;

            // Extract sheet name
            const parts = tableName.split("/");
            const sheetName = parts[parts.length - 1].toLowerCase();

            let key = null;

            if (sheetName.includes("claim")) key = "claims";
            else if (sheetName.includes("payroll")) key = "payroll";
            else if (sheetName.includes("roster")) key = "timesheets";
            else if (sheetName.includes("revenue")) key = "receivables";

            if (!key) return;

            const headers = Object.keys(rows[0]);

            const csv =
                headers.join(",") +
                "\n" +
                rows
                    .map((row) =>
                        headers
                            .map((h) => {
                                const val = row[h];
                                if (val === null || val === undefined) return "";
                                return `"${String(val).replace(/"/g, '""')}"`;
                            })
                            .join(",")
                    )
                    .join("\n");

            dataframes[key] = csv;
        });

        return dataframes;
    }
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

        const workbook = XLSX.utils.book_new();
        const titles = [];

        Object.entries(excelExports).forEach(([sheetName, csvString]) => {

            if (!csvString || typeof csvString !== "string") return;

            try {
                // 🔹 Convert CSV string → Array of Arrays
                const rows = csvString
                    .split("\n")
                    .filter(row => row.trim() !== "")
                    .map(row => row.split(","));

                if (rows.length === 0) return;

                // 🔹 Create worksheet safely
                const worksheet = XLSX.utils.aoa_to_sheet(rows);

                XLSX.utils.book_append_sheet(
                    workbook,
                    worksheet,
                    sheetName.slice(0, 31)
                );

                titles.push(sheetName);

            } catch (err) {
                console.error("Error rebuilding sheet:", sheetName, err);
            }
        });

        if (workbook.SheetNames.length === 0) {
            console.warn("No sheets found in history excelExports");
            return {
                apiExcelUrls: [],
                titleArray: [],
            };
        }

        const wbout = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "binary",
        });

        const blob = new Blob([s2ab(wbout)], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        return {
            apiExcelUrls: [URL.createObjectURL(blob)],
            titleArray: titles,
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
        { label: "New South Wales", value: "New South Wales" },
        { label: "Victoria", value: "Victoria" },
        { label: "Queensland", value: "Queensland" },
        { label: "Western Australia", value: "Western Australia" },
        { label: "South Australia", value: "South Australia" },
        { label: "Tasmania", value: "Tasmania" },
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

                const email = userEmail;

                const res = await fetch(
                    `${BASE_URL}/api/financial-module?email=${email}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch financial history");
                }

                const json = await res.json();
                console.log("json", json)
                const filteredHistory = userStates.length
                    ? (json.data || []).filter(item =>
                        item.filters?.selectedState?.some(selected =>
                            userStates.some(
                                allowed =>
                                    selected.value?.toLowerCase() === allowed.toLowerCase()
                            )
                        )
                    )
                    : json.data;

                setHistoryList(filteredHistory);

            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        if (userEmail) {
            fetchFinancialHistory();
        }

    }, [props.user]);

    const handleSaveFinancialHistory = async () => {
        // guard: already saving OR no analysis
        if (activeTabData.savingHistory || !activeTabData.responseData) return;
        // console.log("active tab data", activeTabData)
        try {
            // 🔹 START saving (PER TAB)
            updateTab({ savingHistory: true });

            const payload = {
                email: userEmail || "",

                // 🔴 CORE DATA (THIS WAS MISSING)
                responseData: activeTabData.responseData,
                financialVisualizations: activeTabData.financialVisualizations || [],
                apiExcelUrls: activeTabData.apiExcelUrls || [],
                excelExports: activeTabData.excel_exports || {},
                titleArray: activeTabData.titleArray || [],
                reportType: activeTabData.reportType || null,
                askAiDataframes: activeTabData.askAiDataframes || {},

                // 🔴 FILTERS (same as client profitability)
                filters: {
                    dateRange: activeTabData.dateRange,
                    selectedState: activeTabData.selectedState,
                    selectedDepartment: activeTabData.selectedDepartment,
                    selectedType: activeTabData.selectedType,
                    selectedRole: activeTabData.selectedRole,
                },
                apiPlots: activeTabData.apiPlots || [],
            };

            // console.log("payload before saving history", payload)
            const res = await fetch(`${BASE_URL}/api/financial-module/save`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                throw new Error("Failed to save history");
            }
            const data = await res.json();

            setHistoryList(prev => [
                {
                    id: data.id,
                    createdAt: new Date().toISOString(),
                    filters: payload.filters,
                },
                ...prev,
            ]);
            alert("Saved successfully");
            updateTab({
                savedToHistory: true,
            });
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
            setHistoryLoading(true);
            await new Promise(resolve => setTimeout(resolve, 50));
            const res = await fetch(
                `${BASE_URL}/api/financial-module/${item.id}`
            );

            if (!res.ok) throw new Error("Failed to fetch history item");

            const json = await res.json();
            const data = json.data;
            props.setFinancialAiPayload(data.askAiDataframes || {});
            props.setFinancialAiHistoryPayload([]);
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
                askAiDataframes: data.askAiDataframes || {},
                isFromHistory: true,
                loading: false,
                uploading: false,
                progressStage: "idle",
                stage: "overview",
                apiPlots: data.apiPlots || [],
                savedToHistory: true,
            };

            // ---- TYPE-SPECIFIC HANDLING ----
            if (data.reportType === "api") {
                // ✅ API reports → rebuild excel preview
                const { apiExcelUrls, titleArray } =
                    rebuildExcelPreviewFromHistory(data.excelExports);
                // console.log("Rebuilt excel preview from history:", { apiExcelUrls, titleArray });
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
            await incrementCareVoiceAnalysisCount(userEmail, "history-click", 0, "financial-health",0)
        } catch (err) {
            console.error("Failed to load history", err);
        }
        finally {
            setHistoryLoading(false);
            setTimeout(() => {
                if (pageRef.current) {
                    pageRef.current.scrollTo({
                        top: 0,
                        behavior: "smooth",
                    });
                }
            }, 100);
        }
    };


    const handleDeleteHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true);

            const res = await fetch(`${BASE_URL}/api/financial-module`, {
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
        updateTab({
            savedToHistory: false,
            isFromHistory: false,
        });
        // Validation checks
        if (userStates.length > 0 && activeTabData.selectedState.length > 0) {
            const selectedStates = activeTabData.selectedState.map(s => s.value);

            const isInvalid = selectedStates.some(
                state =>
                    !userStates.some(
                        allowed =>
                            allowed.toLowerCase() === state.toLowerCase()
                    )
            );

            if (isInvalid) {
                alert(`You are allowed to analyse only: ${userStates.join(", ")}`);
                return;
            }
        }
        const hasFiles = activeTabData.selectedFiles.length > 0;
        const hasDateRange = startDate && endDate;

        if (!syncEnabled && !hasFiles) {
            console.log("Please turn on sync or select file.")
            alert("Please turn on sync or select file.");
            return;
        }

        if (hasFiles && !hasDateRange) {
            alert("Please select a date range.");
            return;
        }

        if (syncEnabled && !hasDateRange) {
            alert("Please select a date range.");
            return;
        }


        props.handleClick();
        updateTab({
            loading: true,
            uploading: true,
            progressStage: "uploading",
            stage: "loading",
        });


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
        
            if (type === "api") {
                fromDate = startDate.toISOString();
                toDate = endDate.toISOString();

                if (!fromDate || !toDate) {
                    alert("Please select valid start and end dates for sync mode.");
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
            if (!userEmail) {
                alert("User email is required. Please log in again.");
                updateTab({
                    loading: false,
                });
                return;
            }

            // Append required fields
            formData.append("type", type);
            formData.append("userEmail", userEmail);
            formData.append("provider", selectedActor);
            formData.append("fromDate", fromDate);
            formData.append("toDate", toDate);
            if (type === "upload") {
                if (activeTabData.selectedFiles.length === 0) {
                    alert("No files selected for upload.");
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
            const reportEndpoint = `${BASE_URL}/report-middleware`
            // --- Step 1: Call Analysis API ---
            let analysisData = null;

            if (type === "api") {

                const apiPayload = {
                    type,
                    userEmail,
                    provider: selectedActor,
                    fromDate,
                    toDate,
                };
                updateTab({
                    uploading: false,
                    progressStage: "analysing",
                });
                if (userStates.length > 0 && activeTabData.selectedState.length === 0) {
                    updateTab({
                        selectedState: userStates.map(state => ({
                            label: state,
                            value: state,
                        })),
                    });
                }
                const analysisRes = await axios.post(
                    `${BASE_URL}/api/financial-v2`,
                    apiPayload,
                    {
                        headers: { "Content-Type": "application/json" },
                        timeout: 600000,
                    }
                );

                // console.log("Analysis API response:", analysisRes);
                analysisData = analysisRes.data;
                console.log("Analysis API response data of type api:", analysisData);
                const askAiFrames = analysisData?.csv_data
                updateTab({
                    progressStage: "preparing",
                });
                updateTab({
                    askAiDataframes: askAiFrames
                })
                props.setFinancialAiPayload(askAiFrames);
                props.setFinancialAiHistoryPayload([]);

            } else {

                const reportEndpoint =
                    `${BASE_URL}/report-middleware`;
                updateTab({
                    uploading: false,
                    progressStage: "analysing",
                });
                if (userStates.length > 0 && activeTabData.selectedState.length === 0) {
                    updateTab({
                        selectedState: userStates.map(state => ({
                            label: state,
                            value: state,
                        })),
                    });
                }
                const analysisRes = await axios.post(
                    reportEndpoint,
                    formData,
                    {
                        headers: { "Content-Type": "multipart/form-data" },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity,
                    }
                );
                updateTab({
                    progressStage: "preparing",
                });
                analysisData = analysisRes.data;

                console.log("Analysis API response of type upload:", analysisData);
                // const dataframes = tablesToAskAiDataframes(analysisData?.normalized_files?.tables);
                updateTab({
                    askAiDataframes: analysisData?.csv_data
                })
                // console.log("Extracted dataframes for AI:", dataframes);
                props.setFinancialAiPayload(analysisData?.csv_data);
                props.setFinancialAiHistoryPayload([]);
            }

            if (!analysisData) throw new Error("Empty response from analysis API");

            if (type === "upload") {
                updateTab({ apiExcelUrls: [] });
            }
            // console.log("apiExcelUrls in handle analyse", apiExcelUrls)
            let responseText = null;
            let figures = [];

            if (type === "api") {
                // 🔹 V2 structure - FIXED based on actual response
                const apiResponseText = analysisData?.report?.review_response ||
                    analysisData?.review_response ||
                    "";

                // Handle plots/figures from API response
                let apiFigures = [];
                if (analysisData?.plots && Array.isArray(analysisData.plots)) {
                    apiFigures = analysisData.plots.map((plot, index) => ({
                        type: "html",
                        html: plot.html,
                        metricName: plot.filename || `Plot ${index + 1}`,
                    }));
                }
                console.log("analysisData", analysisData)
                const apiPlots = analysisData?.plots || [];
                // Process CSV data for Excel export
                // Process CSV data for Excel export
                let builtApiUrls = [];
                let builtTitles = [];

                const csvData = analysisData?.csv_data;
                // console.log("CSV data from API response:", csvData);
                // console.log("type of csvData:", typeof csvData);
                // console.log("XLSX utils available:", Object.keys(XLSX.utils));

                if (csvData && typeof csvData === "object") {
                    try {
                        const workbook = XLSX.utils.book_new();
                        const titlesArray = [];

                        Object.entries(csvData).forEach(([sheetName, csvString]) => {
                            if (!csvString) return;

                            // console.log(`Processing ${sheetName}, type:`, typeof csvString);

                            if (typeof csvString === 'string') {
                                // Clean the CSV string
                                let cleanCsv = csvString
                                    .replace(/Show more.*$/gm, '')
                                    .replace(/^\s*[\d.]+\s*(KB|MB|GB)\s*Copy\s*$/gim, '')
                                    .replace(/,\s*\.\.\..*$/gm, '')
                                    .trim();

                                // console.log(`Cleaned ${sheetName} length:`, cleanCsv.length);

                                const lines = cleanCsv.split('\n').filter(line => line.trim() !== '');
                                // console.log(`${sheetName} has ${lines.length} lines`);

                                if (lines.length > 1) {
                                    try {
                                        // Try different methods to parse CSV
                                        let worksheet;

                                        // Method 1: Try csv_to_sheet
                                        if (typeof XLSX.utils.csv_to_sheet === 'function') {
                                            worksheet = XLSX.utils.csv_to_sheet(cleanCsv);
                                        }
                                        // Method 2: Try aoo_to_sheet with split
                                        else if (typeof XLSX.utils.aoa_to_sheet === 'function') {
                                            const data = lines.map(line => line.split(','));
                                            worksheet = XLSX.utils.aoa_to_sheet(data);
                                        }
                                        // Method 3: Try sheet_add_aoa
                                        else if (typeof XLSX.utils.sheet_add_aoa === 'function') {
                                            worksheet = XLSX.utils.aoa_to_sheet([]);
                                            const data = lines.map(line => line.split(','));
                                            XLSX.utils.sheet_add_aoa(worksheet, data);
                                        }
                                        else {
                                            console.error("No suitable CSV parsing method found");
                                            return;
                                        }

                                        if (worksheet) {
                                            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
                                            // console.log(`${sheetName} has rows:`, range.e.r + 1);

                                            if (range.e.r > 0) {
                                                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));
                                                titlesArray.push(sheetName);
                                            }
                                        }
                                    } catch (sheetErr) {
                                        console.warn(`Failed to parse sheet ${sheetName}:`, sheetErr);
                                    }
                                }
                            } else {
                                console.log(`${sheetName} is not a string, it's:`, typeof csvString);
                            }
                        });

                        // console.log("Titles array after processing:", titlesArray);
                        // console.log("Workbook sheet names:", workbook.SheetNames);

                        if (titlesArray.length > 0 && workbook.SheetNames.length > 0) {
                            const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
                            const blob = new Blob([s2ab(wbout)], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                            });

                            const url = URL.createObjectURL(blob);
                            // console.log("Generated Excel URL:", url);
                            builtApiUrls = [url];
                            builtTitles = titlesArray;

                            // console.log("Created Excel with sheets:", titlesArray);
                        } else {
                            console.log("No valid CSV data to create Excel");
                        }
                    } catch (err) {
                        console.error("Error building Excel:", err);
                    }
                } else {
                    console.log("No csv_data in response or it's not an object");
                }

                const tabDateName = formatDateRangeForTab(startDate, endDate);

                // SINGLE updateTab call with ALL data
                updateTab({
                    responseData: apiResponseText,
                    // financialVisualizations: apiFigures,
                    apiPlots: apiPlots,
                    apiExcelUrls: builtApiUrls,
                    titleArray: builtTitles,
                    excel_exports: analysisData?.csv_data || {},
                    reportType: type,
                    loading: false,
                    uploading: false,
                    progressStage: "idle",
                    stage: "overview",
                    ...(tabDateName ? { name: tabDateName } : {}),
                });
                console.log("analysisData?.llm_cost",analysisData?.llm_cost)
                await incrementCareVoiceAnalysisCount(userEmail, "ai-analysis", analysisData?.llm_cost?.total_usd, "financial-health",analysisData?.llm_cost?.token_usage);
            } else {
                // 🔹 Old upload flow
                // 🔹 Upload flow (FIXED – parse like API)

                let uploadResponseText =
                    analysisData?.report?.review_response ||
                    analysisData?.review_response ||
                    "";

                // Parse if stringified JSON
                if (typeof uploadResponseText === "string") {
                    try {
                        const parsed = JSON.parse(uploadResponseText);

                        uploadResponseText =
                            parsed?.review_response ||
                            parsed?.report?.review_response ||
                            parsed?.final ||
                            uploadResponseText;

                    } catch (err) {
                        console.log("Upload response is not JSON, using raw string");
                    }
                }

                // const uploadFigures = normalizeFigures(vizData);
                const uploadPlots = analysisData?.plots || [];

                const tabDateName = formatDateRangeForTab(startDate, endDate);

                updateTab({
                    responseData: uploadResponseText,
                    // financialVisualizations: uploadFigures,
                    apiPlots: uploadPlots,
                    apiExcelUrls: [],
                    titleArray: [],
                    excel_exports: analysisData?.excel_exports || {},
                    reportType: type,
                    loading: false,
                    uploading: false,
                    progressStage: "idle",
                    stage: "overview",
                    ...(tabDateName ? { name: tabDateName } : {}),
                });
                console.log("analysisData?.llm_cost in upload type",analysisData?.llm_cost)
                await incrementCareVoiceAnalysisCount(userEmail, "ai-analysis", analysisData?.llm_cost?.total_usd, "financial-health",analysisData?.llm_cost?.token_usage);
            }


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
            updateTab({
                loading: false,
                uploading: false,
                progressStage: "idle",
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
    const renderHistorySection = () => {
        const displayHistoryList = searchMode ? filteredHistoryList : historyList;

        return (
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
                            className="download-report-btn"
                        >
                            <MdOutlineFileDownload size={16} />
                            Download Report
                        </button>
                    </div>
                )}

                {/* HEADER with SEARCH BAR */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                        flexWrap: "wrap",
                        gap: "12px",
                    }}
                >
                    <div style={{ display: "flex", gap: "8px" }}>
                        <img
                            src={TlcPayrollHistoryIcon}
                            alt="icon"
                            style={{ width: "22px", height: "21px", pointerEvents: "none" }}
                        />
                        <div className="history-title">History</div>
                    </div>

                    {/* SEARCH BAR */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1", maxWidth: "400px" }}>
                        <input
                            type="text"
                            placeholder="Search history (e.g., 'April to May, Victoria' or 'last week')"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                padding: "8px 12px",
                                border: "1px solid #D1D5DB",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontFamily: "Inter",
                                outline: "none",
                                transition: "all 0.2s ease",
                            }}
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    handleSearch();
                                }
                            }}
                        />
                        {/* <button
                            onClick={handleSearch}
                            disabled={searching}
                            style={{
                                background: "#6C4CDC",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: searching ? "not-allowed" : "pointer",
                                opacity: searching ? 0.7 : 1,
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {searching ? (
                                <>
                                    <div
                                        style={{
                                            width: "14px",
                                            height: "14px",
                                            border: "2px solid #fff",
                                            borderTop: "2px solid transparent",
                                            borderRadius: "50%",
                                            animation: "spin 0.8s linear infinite",
                                        }}
                                    />
                                    Searching...
                                </>
                            ) : (
                                "Search"
                            )}
                        </button> */}
                        {searchMode && (
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSearchMode(false);
                                    setFilteredHistoryList([]);
                                }}
                                style={{
                                    background: "#E5E7EB",
                                    color: "#374151",
                                    border: "none",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Search results count */}
                {searchMode && searchQuery && (
                    <div
                        style={{
                            fontSize: "12px",
                            color: "#6B7280",
                            marginBottom: "12px",
                            padding: "6px 12px",
                            background: "#F3F4F6",
                            borderRadius: "6px",
                            display: "inline-block",
                        }}
                    >
                        Found {displayHistoryList.length} result(s) for "{searchQuery}"
                    </div>
                )}

                {/* BODY */}
                {loadingHistory && (
                    <p style={{ textAlign: "center", color: "#555", marginTop: "20px" }}>
                        Loading history...
                    </p>
                )}
                {!loadingHistory && displayHistoryList.length === 0 && (
                    <p style={{ textAlign: "center", color: "#777", marginTop: "20px" }}>
                        {searchMode ? "No matching history found." : "No saved history found."}
                    </p>
                )}
                {!loadingHistory && displayHistoryList.length > 0 && (
                    <div className="history-list">
                        {displayHistoryList.map(item => (
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
                                    <span style={{ color: "#57575c" }}>
                                        {new Date(item.createdAt).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "2-digit",
                                        })}
                                    </span>
                                </div>

                                {/* FILTER SUMMARY */}
                                {item.filters && (
                                    <div className="history-filters">
                                        {item.filters?.selectedState?.length > 0 && (
                                            <div className="filter-item">
                                                <strong>State:</strong>{" "}
                                                {item.filters.selectedState
                                                    .map(s => s.label || s.value)
                                                    .join(", ")}
                                            </div>
                                        )}

                                        {item.filters.selectedDepartment?.length > 0 && (
                                            <div className="filter-item">
                                                <strong>Department:</strong>{" "}
                                                {item.filters.selectedDepartment
                                                    .map(d => d.label || d.value)
                                                    .join(", ")}
                                            </div>
                                        )}

                                        {item.filters.selectedRole?.length > 0 && (
                                            <div className="filter-item">
                                                <strong>Role:</strong>{" "}
                                                {item.filters.selectedRole
                                                    .map(r => r.label || r.value)
                                                    .join(", ")}
                                            </div>
                                        )}

                                        {item.filters.selectedType?.length > 0 && (
                                            <div className="filter-item">
                                                <strong>Employment Type:</strong>{" "}
                                                {item.filters.selectedType
                                                    .map(t => t.label || t.value)
                                                    .join(", ")}
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
    };
    // console.log("activeTabData in financial health", activeTabData)
    if (isRestrictedUser) {
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
        );
    }
    return (

        <div
            ref={pageRef}
            className="financial-main-container"
        >
            {historyLoading && (
                <div className="full-screen-loader">
                    <div className="history-loader"></div>
                </div>
            )}
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
                                    cursor: activeTabData.loading || activeTabData.uploading ? "not-allowed" : "pointer",
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
                    {activeTabData.stage === "loading" && (
                        <div className="inline-loader-wrapper">
                            <div className="loader"></div>
                            <div className="loading-text">
                                {activeTabData.progressStage === "uploading" && "Uploading files..."}
                                {activeTabData.progressStage === "analysing" && "Analysing data..."}
                                {activeTabData.progressStage === "preparing" && "Preparing report..."}
                            </div>
                        </div>
                    )}
                    {activeTabData.stage !== "loading" && (
                        <div className="search-section">
                            <button
                                className="analyse-btn"
                                // disabled={isButtonDisabled || activeTabData.loading}
                                style={{
                                    backgroundColor:
                                        isButtonDisabled || activeTabData.loading ? "#A1A1AA" : "#000",
                                    cursor: activeTabData.loading ? "not-allowed" : "pointer",
                                    marginTop: activeTabData.isFromHistory ? 0 : "40px",
                                }}
                                onClick={handleAnalyse}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    AI Analyse
                                    <img src={star} alt="img" style={{ width: "20px", height: "20px" }} />
                                </div>
                            </button>
                        </div>
                    )}
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
                                    cursor: activeTabData?.loading || activeTabData?.uploading ? "not-allowed" : "pointer",
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
                                    disabled={
                                        activeTabData.savingHistory ||
                                        activeTabData.isFromHistory ||
                                        activeTabData.savedToHistory
                                    }
                                    style={{
                                        background: "#6C4CDC",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        cursor: activeTabData.savedToHistory ? "not-allowed" : "pointer",
                                        opacity: activeTabData.savedToHistory ? 0.6 : 1,
                                        marginBottom: "10px"
                                    }}
                                >
                                    {activeTabData.savingHistory
                                        ? "Processing..."
                                        : activeTabData.isFromHistory || activeTabData.savedToHistory
                                            ? "Saved"
                                            : "Save"}
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
                                ? `AI Insight (${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")})`
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
                                ? `Financial Vizualization (${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")})`
                                : "Financial Vizualization"
                        }
                        isOpen={activeTabData.accordions.charts}
                        onClick={() => toggleAccordion("charts")}
                    />

                    {activeTabData.accordions.charts && (
                        activeTabData.apiPlots?.length > 0 ? (

                            <div className="charts-grid">
                                <TlcGraphRenderer plots={activeTabData.apiPlots} />
                            </div>

                        ) : (

                            <div className="graph-gridsss">
                                {activeTabData.financialVisualizations.map((item, index) => (
                                    <div key={index} style={{ marginBottom: "30px" }}>

                                        {/* HTML iframe */}
                                        {item.type === "html" && (
                                            <div style={{ width: "100%", height: "500px" }}>
                                                <iframe
                                                    srcDoc={item.html}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        border: "none",
                                                        borderRadius: "8px",
                                                    }}
                                                    title={item.metricName}
                                                />
                                            </div>
                                        )}

                                        {/* Plotly JSON */}
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

                                        {/* Image */}
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

                        )
                    )}

                    {/* ================= RAW DATA / EXPORT ================= */}
                    {activeTabData.reportType === "api" && <AccordionHeader
                        title={
                            startDate && endDate
                                ? `Exported Data (${startDate.toLocaleDateString("en-GB")} - ${endDate.toLocaleDateString("en-GB")})`
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

        </div>

    );
};

export default NewFinancialHealth;
