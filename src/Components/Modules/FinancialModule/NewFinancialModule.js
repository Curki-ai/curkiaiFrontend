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
import HistoryList from "./TlcHistoryList";
import TlcPayrollHistoryIcon from "../../../Images/TlcPayrollHistory.png"
import TlcCompareAnalyseIcon from "../../../Images/Tlc_Compare_Analyse_Icon.png"
import WhoAreYouToggle from "./WhoAreYouToggle";
import "../../../Styles/TlcNewCustomReporting.css";
import { useRef } from "react";

const NewFinancialHealth = (props) => {
    const [financialReportFiles, setFinancialReportFiles] = useState([]);
    const [financialTemplate, setFinancialTemplate] = useState(null);
    const [standardFinancialExcelFile, setStandardFiancialExcelFile] = useState(
        []
    );
    const [uploadedFinancialExcelFile, setUploadedFinancialExcelFile] =
        useState(null);
    const [financialReport, setFinancialReport] = useState(null);
    const [financialVisualizations, setFinancialVisualizations] = useState([]);
    const [isFinancialProcessing, setIsFinancialProcessing] = useState(false);
    const [financialprogress, setFinancialProgress] = useState(0);
    const [financialshowReport, setFinancialShowReport] = useState(false);
    const [isConsentChecked, setIsConsentChecked] = useState(false);
    // New Addition......
    const [selectedActor, setSelectedActor] = useState("NDIS");
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    const [selectedState, setSelectedState] = useState([]);
    const [selectedDepartment, setSelectedDepartment] = useState([]);
    const [selectedType, setSelectedType] = useState([]);
    const [selectedRole, setSelectedRole] = useState([]);

    const [apiExcelUrls, setApiExcelUrls] = useState([]);
    const [title, setTitle] = useState("");
    const raw = response

    const [titleArray, setTitleArray] = useState([]);
    const [accordions, setAccordions] = useState({
        aiInsight: false,
        charts: false,
        summary: false,
    });
    const [aiInsightOpen, setAiInsightOpen] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    // ---------------- UI TABS (SAFE, ISOLATED) ----------------
    const [uiTabs, setUiTabs] = useState([
        {
            id: 1,
            name: "Tab 1",
            loading: false,
            uploading: false,
        },
    ]);

    const [uiActiveTabId, setUiActiveTabId] = useState(1);

    const uiActiveTab = uiTabs.find(t => t.id === uiActiveTabId);
    const previewRef = useRef(null);
 
    const handleUiNewTab = () => {
        const newId = uiTabs.length
            ? Math.max(...uiTabs.map(t => t.id)) + 1
            : 1;

        setUiTabs(prev => [
            ...prev,
            {
                id: newId,
                name: `Tab ${newId}`,
                loading: false,
                uploading: false,
            },
        ]);

        setUiActiveTabId(newId);
    };

    const handleUiCloseTab = (id) => {
        const remaining = uiTabs.filter(t => t.id !== id);
        setUiTabs(remaining);

        if (id === uiActiveTabId && remaining.length) {
            setUiActiveTabId(remaining[0].id);
        }
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
                marginTop: "12px"
            }}
        >
            {uiTabs.map(tab => (
                <div
                    key={tab.id}
                    onClick={() => setUiActiveTabId(tab.id)}
                    style={{
                        padding: "8px 16px",
                        borderRadius: "8px",
                        background: tab.id === uiActiveTabId ? "#6C4CDC" : "#f3f4f6",
                        color: tab.id === uiActiveTabId ? "#fff" : "#000",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "14px",
                        fontWeight: tab.id === uiActiveTabId ? 600 : 400,
                    }}
                >
                    {tab.name}

                    {uiTabs.length > 1 && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                handleUiCloseTab(tab.id);
                            }}
                            style={{
                                marginLeft: "4px",
                                color: tab.id === uiActiveTabId ? "#ccc" : "#999",
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
                onClick={handleUiNewTab}
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
        setAccordions((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleButtonClick = () => {
        setIsConsentChecked(true);
    };
    const handleFinancialFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setFinancialReportFiles((prev) => [...prev, ...files]);
        e.target.value = "";
    };

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
    const handleDownloadReport = ()=>{
        console.log("report download")
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

    const handleAnalyse = async () => {
        // Validation checks
        if (financialReportFiles.length === 0 && !syncEnabled) {
            alert("Please upload the report files or enable sync.");
            return;
        }
        if (syncEnabled && (!startDate || !endDate)) {
            alert("Please select a valid date range when sync is enabled.");
            return;
        }


        props.handleClick();
        setIsFinancialProcessing(true);
        setFinancialProgress(1);

        const interval = setInterval(() => {
            setFinancialProgress((prev) => (prev < 92 ? prev + 2 : prev));
        }, 5000);

        try {
            const formData = new FormData();

            // Determine type correctly
            let type = "upload";
            if (syncEnabled && financialReportFiles.length > 0) type = "hybrid";
            else if (syncEnabled && financialReportFiles.length === 0) type = "api";

            // Handle dates
            let fromDate, toDate;
            if (type === "api" || type === "hybrid") {
                fromDate = startDate.toISOString();
                toDate = endDate.toISOString();

                if (!fromDate || !toDate) {
                    alert("Please select valid start and end dates for sync mode.");
                    clearInterval(interval);
                    setIsFinancialProcessing(false);
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
                setIsFinancialProcessing(false);
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
            if (type === "upload" || type === "hybrid") {
                if (financialReportFiles.length === 0) {
                    alert("No files selected for upload.");
                    clearInterval(interval);
                    setIsFinancialProcessing(false);
                    return;
                }
                financialReportFiles.forEach((file) => formData.append("files", file));
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

                        setTitleArray(titlesArray);

                        const wbout = XLSX.write(mergedWorkbook, { bookType: "xlsx", type: "binary" });
                        const blob = new Blob([s2ab(wbout)], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        });

                        const url = URL.createObjectURL(blob);
                        setApiExcelUrls([url]);
                    } catch (err) {
                        console.error("Error merging API Excel files:", err);
                    }
                }
            } else {
                setApiExcelUrls([]); // clear for non-API types
            }
            // console.log("apiExcelUrls in handle analyse", apiExcelUrls)
            const figures = normalizeFigures(vizData);

            // --- Step 5: Save state ---
            setFinancialReport(analysisData.final);
            setFinancialVisualizations(figures);
            setFinancialShowReport(true);
            setIsFinancialProcessing(false);
            setFinancialProgress(100);

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
            setIsFinancialProcessing(false);
            setFinancialProgress(100);
        }
    };

    const isButtonDisabled = !syncEnabled && financialReportFiles.length === 0;

    useEffect(() => {
        if (financialshowReport) {
            const timer = setTimeout(() => {
                props.setShowFeedbackPopup(true);
            }, 60000); // 1 minute

            return () => clearTimeout(timer); // Clear on unmount or change
        }
    }, [financialshowReport]);

    const resetFinancialHealthState = () => {
        setFinancialReportFiles([]);
        setFinancialTemplate(null);
        setStandardFiancialExcelFile([]);
        setUploadedFinancialExcelFile(null);
        setFinancialReport(null);
        setFinancialVisualizations([]);
        setIsFinancialProcessing(false);
        setFinancialProgress(0);
        setFinancialShowReport(false);
        setIsConsentChecked(false);
    };
    // console.log("financial Visualizations", financialVisualizations);

    return (

        <>
            {!financialshowReport ? (
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
                                    selected={selectedRole}
                                    setSelected={setSelectedRole}
                                    placeholder="Role"
                                    leftIcon={TlcPayrollRoleIcon}
                                    rightIcon={TlcPayrollRoleDownArrowIcon}
                                />
                            </div>
                        </div>


                        {/* <h1 className="titless">FINANCIAL HEALTH</h1> */}
                        <div className="sync-toggle">
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
                                disabled={uiActiveTab?.loading || uiActiveTab?.uploading}
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
                                        uiActiveTab?.loading || uiActiveTab?.uploading ? 0.6 : 1,
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
                                    onChange={(dates) => setDateRange(dates)}
                                />
                            </div>

                            {/* STATE */}
                            <MultiSelectCustom
                                options={optionsState}
                                selected={selectedState}
                                setSelected={setSelectedState}
                                placeholder="State"
                                leftIcon={TlcPayrollStateIcon}
                                rightIcon={TlcPayrollDownArrow}
                            />

                            {/* DEPARTMENT FILTER */}
                            <MultiSelectCustom
                                options={optionsDepartment}
                                selected={selectedDepartment}
                                setSelected={setSelectedDepartment}
                                placeholder="Department"
                                leftIcon={TlcPayrollDepartmentIcon}
                                rightIcon={TlcPayrollDownArrow}
                            />

                            {/* TYPE FILTER */}
                            <MultiSelectCustom
                                options={optionsType}
                                selected={selectedType}
                                setSelected={setSelectedType}
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
                            files={financialReportFiles}
                            setFiles={setFinancialReportFiles}
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
                            disabled={isButtonDisabled || isFinancialProcessing}
                            style={{
                                backgroundColor:
                                    isButtonDisabled || isFinancialProcessing ? "#A1A1AA" : "#000",
                                cursor: isFinancialProcessing ? "not-allowed" : "pointer",
                            }}
                            onClick={handleAnalyse}
                        >
                            {isFinancialProcessing ? (
                                `${financialprogress}% Processing...`
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
                                    selected={selectedRole}
                                    setSelected={setSelectedRole}
                                    placeholder="Role"
                                    leftIcon={TlcPayrollRoleIcon}
                                    rightIcon={TlcPayrollRoleDownArrowIcon}
                                />
                            </div>
                        </div>


                        {/* <h1 className="titless">FINANCIAL HEALTH</h1> */}
                        <div className="sync-toggle">
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
                                disabled={uiActiveTab?.loading || uiActiveTab?.uploading}
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
                                        uiActiveTab?.loading || uiActiveTab?.uploading ? 0.6 : 1,
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
                        isOpen={aiInsightOpen}
                        onClick={() => setAiInsightOpen(!aiInsightOpen)}
                    />


                    {aiInsightOpen && (
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
                                        titles={titleArray}
                                        financialReport={financialReport}
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
                        isOpen={accordions.charts}
                        onClick={() => toggleAccordion("charts")}
                    />

                    {accordions.charts && (
                        <div className="graph-gridsss">
                            {financialVisualizations.map((item, index) => (
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
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ================= RAW DATA / EXPORT ================= */}
                    <AccordionHeader
                        title={
                            startDate && endDate
                                ? `Exported Data (${startDate.toLocaleDateString("en-US")} - ${endDate.toLocaleDateString("en-US")})`
                                : "Exported Data"
                        }
                        isOpen={accordions.summary}
                        onClick={() => toggleAccordion("summary")}
                    />

                    {accordions.summary && apiExcelUrls?.length > 0 && (
                        <PreviewDataSection
                            apiExcelUrls={apiExcelUrls}
                            titles={titleArray}
                            financialReport={financialReport}
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
            <section className="history-container">
                {financialshowReport && financialReport && (
                    <div
                        style={{
                            width: "100%",
                            display: "flex",
                            justifyContent: "flex-end",
                            marginBottom: "12px",
                        }}
                    >
                        <button
                            onClick={() => previewRef.current?.downloadAll()}
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
                            marginBottom: "13px",
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

                {/* BODY */}
                {loadingHistory ? (
                    <p
                        style={{
                            textAlign: "center",
                            color: "#555",
                            marginTop: "12px",
                            fontSize: "13px",
                            fontFamily: "Inter",
                        }}
                    >
                        Loading history...
                    </p>
                ) : historyList.length === 0 ? (
                    <p
                        style={{
                            textAlign: "center",
                            color: "#777",
                            marginTop: "12px",
                            fontSize: "13px",
                            fontFamily: "Inter",
                        }}
                    >
                        No saved history found.
                    </p>
                ) : (
                    /* later you will map history cards here */
                    null
                )}
            </section>


        </>

    );
};

export default NewFinancialHealth;
