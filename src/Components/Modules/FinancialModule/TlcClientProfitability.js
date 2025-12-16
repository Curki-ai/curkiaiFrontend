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
const TlcClientProfitability = (props) => {
    const onPrepareAiPayload = props.onPrepareAiPayload;
    const user = props.user
    console.log("user in client profitibility", user)
    const userEmail = user?.email
    const [startMonth, setStartMonth] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [files, setFiles] = useState([]);
    const [isTlcClientProfitabilityLoading, setTlcClientProfitabilityLoading] = useState(false);
    const [responseData, setResponseData] = useState(null);
    const [documentIds, setDocumentIds] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [activeTab, setActiveTab] = useState("direct"); // "direct" or "plan"
    const [aiSummary, setAiSummary] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiQuestion, setAiQuestion] = useState("");
    const [aiReply, setAiReply] = useState("");
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [directFinalTable, setDirectFinalTable] = useState(null);
    const [selectedActor, setSelectedActor] = useState("NDIS");
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [payload, setPayload] = useState(null);
    const [isAllowed, setIsAllowed] = useState(null);

    const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";
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


    const handleUpload = async () => {
        try {
            const formData = new FormData();
            for (let file of selectedFiles) formData.append("files", file);

            const uploadRes = await fetch(`${BASE_URL}/tlcClientProfitibility/upload-profitibility`, {
                method: "POST",
                body: formData
            });

            const uploadData = await uploadRes.json();
            console.log("UPLOAD RESPONSE", uploadData);

            const ids = uploadData.files?.map(f => f.documentId) || [];
            setDocumentIds(ids);

            return uploadData;
        } catch (err) {
            console.error(err);
            return null;
        }
    };


    const handleFinalAnalysis = async (finalPayload) => {
        console.log("props.tlcClientProfitabilityPayload in handleFinal analysis", props?.tlcClientProfitabilityPayload)
        console.log("finalPayload", finalPayload)
        try {
            console.log("🔄 Starting final analysis request...");
            const analyzeRes = await fetch(
                `${BASE_URL}/tlcClientProfitibility/analyze-from-files?userEmail=${userEmail}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payload: finalPayload })
                }
            );


            if (!analyzeRes.ok) {
                throw new Error(`HTTP error! status: ${analyzeRes.status}`);
            }

            const analyzeData = await analyzeRes.json();
            console.log("✅ FINAL ANALYSIS RESPONSE:", analyzeData);
            setResponseData(analyzeData);
            return analyzeData;
        } catch (error) {
            console.error("❌ Final analysis error:", error);
            throw error; // Re-throw to handle in calling function
        }
    };

    const handleFileChange = (e) => {
        const fileList = Array.from(e.target.files);
        setSelectedFiles(fileList);
        setFiles(fileList.map((file) => file.name));
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAnalyse = async () => {
        try {
            if (!startMonth || !endMonth) {
                alert("Please select both start and end months");
                return;
            }

            setTlcClientProfitabilityLoading(true);

            let sessionId = null;

            // Upload → get sessionId
            if (selectedFiles.length > 0) {
                const uploadData = await handleUpload();
                sessionId = uploadData?.sessionId || null;

                console.log("🆔 SESSION FROM UPLOAD:", sessionId);
            } else {
                console.log("📝 No upload → prepare without sessionId");
            }

            // 🚫 Pass undefined if null → so query string omits sessionId
            const safeSessionId = sessionId ? sessionId : undefined;

            // Prepare analysis
            const prepareData = await handlePrepareAnalysis(safeSessionId);
            console.log("PREPARE DATA:", prepareData);

            if (!prepareData?.ok) {
                alert("Prepare failed");
                return;
            }

            // Save AI payload
            if (prepareData.payload && onPrepareAiPayload) {
                onPrepareAiPayload(prepareData?.payload);
                setPayload(prepareData?.payload)
            }

            // Final server analysis
            await handleFinalAnalysis(prepareData.payload);

        } catch (err) {
            console.error("❌ ERROR IN handleAnalyse:", err);
            alert("Analysis failed: " + err.message);
        } finally {
            setTlcClientProfitabilityLoading(false);
        }
    };



    const handlePrepareAnalysis = async (sessionId) => {
        try {
            const from = `2025-${startMonth}`;
            const to = `2025-${endMonth}`;

            console.log("📊 Preparing analysis with:", { from, to, sessionId });

            // BASE URL
            let url = `${BASE_URL}/tlcClientProfitibility/prepare-analysis-data?from=${from}&to=${to}`;

            // 🚫 If sessionId null OR undefined → DO NOT append
            if (sessionId && sessionId !== "null") {
                url += `&sessionId=${sessionId}`;
            }

            console.log("➡️ FINAL PREPARE URL:", url);

            const prepareRes = await fetch(url, { method: "GET" });

            const text = await prepareRes.text();

            // 🔥 Fix for HTML parsing issue
            try {
                return JSON.parse(text);
            } catch (parseErr) {
                console.error("❌ Server returned HTML instead of JSON:", text.slice(0, 200));
                return { ok: false, message: "Server returned invalid JSON" };
            }

        } catch (error) {
            console.error("Prepare analysis error:", error);
            return { ok: false, message: error.message };
        }
    };



    const prepareAiPayload = async (payload) => {
        try {
            const res = await fetch(
                `${BASE_URL}/tlcClientProfitibility/prepare_ai_payload`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payload })
                }
            );
            const data = await res.json();
            console.log("AI PREPARE:", data);
            return data;
        } catch (err) {
            console.error("AI prepare error:", err);
        }
    };

    const fetchAiSummary = async () => {
        try {
            const res = await fetch(
                `${BASE_URL}/tlcClientProfitibility/ask_ai_summary?userEmail=${userEmail}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payload: props.tlcClientProfitabilityPayload })
                }
            );


            const data = await res.json();
            console.log("AI SUMMARY:", data);

            setAiSummary(data.summary_md || data.report_md || "");
        } catch (err) {
            console.error("AI summary error:", err);
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
    useEffect(() => {
        if (!responseData?.direct_service) return;

        const summary = responseData.direct_service.tables.by_reference;
        const details = responseData.direct_service.tables.detail;

        const summaryCols = summary.columns || [];
        const summaryRows = summary.rows || [];
        const detailCols = details.columns || [];
        const detailRows = details.rows || [];

        // Normalize keys
        const normalizeObjKeys = (obj) => {
            const normalized = {};
            Object.keys(obj || {}).forEach(k => {
                normalized[k.trim().toLowerCase()] = obj[k];
            });
            return normalized;
        };

        const findIndex = (cols, keywords) =>
            cols.findIndex(c =>
                keywords.some(k =>
                    c?.toString?.().toLowerCase().includes(k.toLowerCase())
                )
            );

        const sNdisIndex = findIndex(summaryCols, ["ndis", "reference"]);
        const sPartIndex = findIndex(summaryCols, ["participant"]);

        const dNdisIndex = findIndex(detailCols, ["ndis", "reference"]);
        const dPartIndex = findIndex(detailCols, ["participant"]);

        if (sNdisIndex < 0 || sPartIndex < 0 || dNdisIndex < 0 || dPartIndex < 0) {
            console.error("🏳️ Required key columns missing.");
            return;
        }

        // Convert row → array by column order
        const toRowArray = (obj, cols) => {
            const norm = normalizeObjKeys(obj);
            return cols.map(c => norm[c.toLowerCase()] ?? "");
        };

        // Identify detail-only columns
        const detailOnlyCols = detailCols.filter(c => !summaryCols.includes(c));

        // ---------------------------
        // BUILD DETAIL MAP
        // ---------------------------
        const detailMap = {};

        detailRows.forEach(dr => {
            const norm = normalizeObjKeys(dr);

            // Skip if detail is actually same as summary (happens when no extra columns)
            if (detailOnlyCols.length === 0) return;

            const ndis =
                dr[detailCols[dNdisIndex]] ??
                dr[dNdisIndex] ??
                norm[detailCols[dNdisIndex].toLowerCase()] ??
                "";

            const part =
                dr[detailCols[dPartIndex]] ??
                dr[dPartIndex] ??
                norm[detailCols[dPartIndex].toLowerCase()] ??
                "";

            const key = `${ndis}___${part}`;

            if (!detailMap[key]) detailMap[key] = [];
            detailMap[key].push(toRowArray(dr, detailCols));
        });

        // ---------------------------
        // REMOVE DUPLICATE SUMMARY ROWS
        // ---------------------------
        const seenParents = new Set();
        const uniqueSummaryRows = [];

        summaryRows.forEach(sr => {
            const parent = toRowArray(sr, summaryCols);

            const sNdis =
                sr[summaryCols[sNdisIndex]] ??
                sr[sNdisIndex] ??
                parent[sNdisIndex] ??
                "";

            const sPart =
                sr[summaryCols[sPartIndex]] ??
                sr[sPartIndex] ??
                parent[sPartIndex] ??
                "";

            const key = `${sNdis}___${sPart}`;

            if (!seenParents.has(key)) {
                seenParents.add(key);
                uniqueSummaryRows.push(sr);
            }
        });

        // ---------------------------
        // MERGE SUMMARY + DETAIL
        // ---------------------------
        const finalRows = uniqueSummaryRows.map(sr => {
            const parent = toRowArray(sr, summaryCols);

            const sNdis =
                sr[summaryCols[sNdisIndex]] ??
                sr[sNdisIndex] ??
                parent[sNdisIndex] ??
                "";

            const sPart =
                sr[summaryCols[sPartIndex]] ??
                sr[sPartIndex] ??
                parent[sPartIndex] ??
                "";

            const key = `${sNdis}___${sPart}`;

            return {
                parent,
                children: detailMap[key] || [],
                participant: sPart,
                ndis: sNdis
            };
        });

        // ---------------------------
        // FILTER VALUES
        // ---------------------------
        const regions = new Set();
        const depts = new Set();

        const regionIdx = findIndex(detailCols, ["region"]);
        const deptIdx = findIndex(detailCols, ["department", "dept"]);

        detailRows.forEach(dr => {
            const n = normalizeObjKeys(dr);

            if (regionIdx >= 0) {
                const r = n[detailCols[regionIdx].toLowerCase()];
                if (r) regions.add(r);
            }
            if (deptIdx >= 0) {
                const d = n[detailCols[deptIdx].toLowerCase()];
                if (d) depts.add(d);
            }
        });

        // ---------------------------
        // SET FINAL OUTPUT
        // ---------------------------
        setDirectFinalTable({
            columns: summaryCols,
            rows: finalRows,
            detailCols,
            regions: [...regions],
            departments: [...depts]
        });

    }, [responseData]);


    console.log("directFinalTable", directFinalTable)

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
            <div className="left-headerss">
                {responseData && <img src={TlcLogo} alt="Logo" className="tlclogo" />}
            </div>
            <div className="financial-header">
                <div className="role-selector">
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "500",
                            fontFamily: "Inter",
                        }}
                    >
                        Who are you?
                    </div>
                    <div className="role-toggle-container">
                        <div
                            onClick={() => setSelectedActor("NDIS")}
                            style={{
                                backgroundColor:
                                    selectedActor === "NDIS" ? "#6C4CDC" : "#FFFFFF",
                                color: selectedActor === "NDIS" ? "white" : "#6C4CDC",
                                borderTopLeftRadius: "4px",
                                borderBottomLeftRadius: "4px",
                                cursor: "pointer",
                                padding: "6px 12px",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                            }}
                            className="role-toggle"
                        >
                            NDIS
                        </div>
                        <div
                            onClick={() => setSelectedActor("aged-care")}
                            style={{
                                backgroundColor:
                                    selectedActor === "aged-care" ? "#6C4CDC" : "#FFFFFF",
                                color: selectedActor === "aged-care" ? "white" : "#6C4CDC",
                                borderTopRightRadius: "4px",
                                borderBottomRightRadius: "4px",
                                cursor: "pointer",
                                padding: "6px 12px",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                            }}
                            className="role-toggle"
                        >
                            Aged Care
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                    <h1 className="titless">CLIENTS PROFITABILITY</h1>
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
                <div className="sync-toggle">
                    <div
                        style={{
                            fontSize: "14px",
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
            <div className="info-table">
                <div className="table-headerss">
                    <span>If You Upload This...</span>
                    <span>Our AI Will Instantly...</span>
                </div>
                <div className="table-rowss">
                    <div>Finance System - Client Revenue & Cost Allocation Report</div>
                    <ul>
                        <li>Client Margin Forecasts – Predict low-profit clients ahead of time.</li>
                        <li>
                            Claim Leakage Alerts – Detect missed or under-billed services.
                        </li>
                    </ul>
                </div>
                <div className="table-rowss">
                    <div>Care Management System - Client Funding Utilisation & Service Delivery Report</div>
                    <ul>
                        <li>Roster Optimisation – Recommend cost-efficient shift allocations.</li>
                        <li>Funding Utilisation – Track and lift package use to 95%+.</li>
                    </ul>
                </div>
                <div className="table-rowss">
                    <div>Rostering System - Roster vs Actual Labour Cost Report</div>
                    <ul>
                        <li>Workforce Productivity – Identify high and low performers by billed hours.</li>
                        <li>
                            Overtime Risk Warnings – Flag and prevent high-cost shifts.
                        </li>
                    </ul>
                </div>
                <div className="table-rowss">
                    <div>HR System - Timesheet Accuracy & Workforce Utilisation Report</div>
                    <ul>
                        <li>Service Line Profitability – Show which service types drive margin.</li>
                        <li>Client Mix Optimisation – Recommend the most profitable client ratios.</li>
                    </ul>
                </div>
                <div className="table-rowss">
                    <div>Claims/Billing System - Claim Leakage & Rejection Summary Report</div>
                    <ul>
                        <li>Cost Variance Analysis – Expose clients with abnormal cost patterns.</li>
                        <li>
                            Cashflow Forecasting – Predict liquidity impact from claims/wages.
                        </li>
                    </ul>
                </div>
            </div>

            {!responseData ? (
                <div>
                    <div className="date-section" style={{ gap: '8%' }}>
                        <div className="date-picker" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                            <label style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter", }}>
                                Select Start Month
                            </label>
                            <div className="date-inputs">
                                <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0");
                                        const monthName = new Date(0, i).toLocaleString("en-US", { month: "short" });
                                        return <option key={monthValue} value={monthValue}>{monthName}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="date-picker" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                            <label style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter" }}>
                                Select End Month
                            </label>
                            <div className="date-inputs">
                                <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0");
                                        const monthName = new Date(0, i).toLocaleString("en-US", { month: "short" });
                                        return <option key={monthValue} value={monthValue}>{monthName}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '30px' }}>
                        <div style={{ marginBottom: "16px", width: '40%' }}>
                            <div style={{ fontSize: "14px", fontFamily: "Inter", fontWeight: 500, marginBottom: '6px', }}>
                                Upload Receivables, Payables and Profitables Data
                            </div>

                            <div className="upload-boxes" style={{ cursor: "pointer", padding: '40px 14px' }} onClick={() => document.getElementById("payroll-file-input").click()}>
                                <input id="payroll-file-input" type="file" multiple accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: "none" }} />

                                <div className="uploadss-iconss">
                                    <img src={UploadTlcIcon} alt="uploadIcon" style={{ height: "48px", width: "48px" }} />
                                </div>

                                <p style={{ fontSize: "14px", color: "#444", fontFamily: "Inter" }}>
                                    {files.length === 0 ? (
                                        <>
                                            Click to upload <span style={{ color: "#6C4CDC" }}>Receivables, Payables and Profitables Data</span>
                                            <br />
                                            <small>.XLSX, .XLS</small>
                                        </>
                                    ) : "Uploaded files:"}
                                </p>

                                {files.length > 0 && (
                                    <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                        {files.map((fileName, idx) => (
                                            <div key={idx} onClick={(e) => e.stopPropagation()} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#DADADA", padding: "4px 8px", borderRadius: "6px", fontSize: "14px", fontFamily: "Inter" }}>
                                                <span title={fileName}>{fileName.length > 30 ? fileName.slice(0, 30) + "..." : fileName}</span>
                                                <span onClick={(e) => { e.stopPropagation(); removeFile(idx); }} style={{ cursor: "pointer", color: "#6C4CDC", fontWeight: "bold" }}>×</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <button className="analyse-btn" disabled={isTlcClientProfitabilityLoading} style={{ backgroundColor: '#000', marginTop: '20px' }} onClick={handleAnalyse}>
                        {isTlcClientProfitabilityLoading ? `Analysing...` : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
                    </button>
                </div>
            ) : (
                <>
                    {/* header + tabs */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left', marginTop: '20px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: '600', fontFamily: 'Inter', marginBottom: '10px' }}>
                                Participant Profitability Overview
                            </div>
                            <div style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '500', color: '#928F8F' }}>
                                Scorecards and charts at the top, detailed per-participant table with filters at the bottom.
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setActiveTab("plan")} className={`tab-btn ${activeTab === "plan" ? "active" : ""}`}>Plan Managed </button>
                                <button onClick={() => setActiveTab("direct")} className={`tab-btn ${activeTab === "direct" ? "active" : ""}`}>Direct Services</button>
                            </div>

                            <button
                                onClick={async () => {
                                    if (onPrepareAiPayload) {
                                        console.log("Rebuilding JSON files before Summary...");
                                        // await prepareAiPayload(props.tlcClientProfitabilityPayload);
                                    }

                                    setShowAiPanel(true);
                                    await fetchAiSummary();
                                }}
                                style={{
                                    border: 'none',
                                    borderRadius: '30px',
                                    fontFamily: 'Inter',
                                    padding: '14px 32px',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    color: 'white',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: '#6c4cdc'
                                }}
                            >
                                AI Analyse
                            </button>


                        </div>
                    </div>
                    {/* AI Panel */}
                    {showAiPanel && (
                        <ClientProfitabilityAIAnalysisReportViewer
                            reportText={aiSummary}
                            loading={!aiSummary}
                        />
                    )}

                    {/* common scorecards (showing direct or plan depending on activeTab) */}
                    <div className="tlcClient-dashboard-summary">
                        {activeTab === "direct" && responseData?.direct_service && (
                            <>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Revenue</p>
                                    <h3>${responseData.direct_service.scorecards.total_revenue.toLocaleString()}</h3>
                                    <p>All months, All Participants</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Expense</p>
                                    <h3>${responseData.direct_service.scorecards.total_expense.toLocaleString()}</h3>
                                    <p>Allocated expense</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Profit</p>
                                    <h3>${responseData.direct_service.scorecards.total_profit.toLocaleString()}</h3>
                                    <p>Revenue minus expense</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Overall Margin</p>
                                    <h3>{(responseData.direct_service.scorecards.total_margin * 100).toFixed(2)}%</h3>
                                    <p>Profit / Revenue</p>
                                </div>
                            </>
                        )}

                        {activeTab === "plan" && responseData?.plan_managed && (
                            <>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Revenue</p>
                                    <h3>${responseData.plan_managed.scorecards.total_revenue.toLocaleString()}</h3>
                                    <p>All Plan Managed participants</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Expense</p>
                                    <h3>${responseData.plan_managed.scorecards.total_expense.toLocaleString()}</h3>
                                    <p>Invoice-linked expenses</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Total Profit</p>
                                    <h3>${responseData.plan_managed.scorecards.total_profit.toLocaleString()}</h3>
                                    <p>Revenue minus expense</p>
                                </div>
                                <div className="tlcClient-dashboard-card">
                                    <p>Overall Margin</p>
                                    <h3>{(responseData.plan_managed.scorecards.total_margin * 100).toFixed(2)}%</h3>
                                    <p>Profit / Revenue</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* charts */}
                    <div className="client-profitability-graph">
                        {activeTab === "direct" && responseData?.direct_service && (
                            <>
                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.direct_service.graphs.department_profit} />
                                </div>

                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.direct_service.graphs.department_revenue_expense} />
                                </div>

                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.direct_service.graphs.region_profit} />
                                </div>

                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.direct_service.graphs.region_revenue_expense} />
                                </div>
                            </>
                        )}

                        {activeTab === "plan" && responseData?.plan_managed && (
                            <>
                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.plan_managed.graphs.profit_by_region} />
                                </div>

                                <div className="chart-box" style={{ marginBottom: "30px" }}>
                                    <RenderHtmlFigure htmlString={responseData.plan_managed.graphs.revenue_expense_by_region} />
                                </div>
                            </>
                        )}
                    </div>

                    {/* summary tables */}
                    <div className="table-box" style={{ marginTop: "40px" }}>
                        {activeTab === "direct" && (
                            <RenderHtmlFigure htmlString={responseData.direct_service.summary_tables.by_region_department} />
                        )}

                        {activeTab === "plan" && (
                            <RenderHtmlFigure htmlString={responseData.plan_managed.summary_tables.by_region_department} />
                        )}
                    </div>

                    {/* Detailed Json tables - show tables relevant to active tab */}
                    <div style={{ marginTop: "40px" }}>
                        {activeTab === "direct" && directFinalTable && (
                            <JsonTableCard
                                title="Direct Services – NDIS Reference (click + to see detail)"
                                data={directFinalTable}
                                isSummaryDetailMode={true}
                                availableRegions={directFinalTable.regions}
                                availableDepartments={directFinalTable.departments}
                                summaryTable={responseData.direct_service.tables.by_reference}
                                detailsTable={responseData.direct_service.tables.detail}
                            />
                        )}

                        {activeTab === "plan" && (
                            <>
                                {responseData?.plan_managed?.tables?.detail && (
                                    <JsonTableCard title="Plan Managed — Detailed Table" data={responseData.plan_managed.tables.detail} />
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default TlcClientProfitability;
