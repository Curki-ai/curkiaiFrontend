import React, { useEffect, useState } from "react";
import '../../../Styles/IncidentAuditing.css';
import UploadFiles from "../../UploadFiles";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import star from '../../../Images/star.png';
import axios from "axios";
import Toggle from "react-toggle";
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { IoMdInformationCircleOutline } from "react-icons/io";
import PulsatingLoader from "../../PulsatingLoader";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { RiDeleteBin6Line } from "react-icons/ri";
import { GoArrowLeft } from "react-icons/go";

const TASK_QUEUE = [
    "Analysing data",
    "Confirming incident reports are included",
    "Incident audit started",
    "Processing safety protocols",
    "Validating compliance requirements",
    "Generating final report",
];



const IncidentAuditing = (props) => {
    // console.log("IncidentAuditing props:", props);
    const [incidentAuditingFiles, setIncidentAuditingFiles] = useState([]);
    const [isIncidentAuditingProcessing, setIsIncidentAuditingProcessing] = useState(false);
    const [incidentAuditingProgress, setIncidentAuditingProgress] = useState(0);
    const [responseData, setResponseData] = useState(null);
    const [activeTab, setActiveTab] = useState("incident"); // default tab
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [startDay, setStartDay] = useState("");
    const [startMonth, setStartMonth] = useState("");
    const [endDay, setEndDay] = useState("");
    const [endMonth, setEndMonth] = useState("");
    const [currentTask, setCurrentTask] = useState(TASK_QUEUE[0]);
    const [expandedSources, setExpandedSources] = useState([]);
    const isButtonDisabled = !syncEnabled && incidentAuditingFiles.length === 0;
    const [searchTerm, setSearchTerm] = useState("");
    const [filterReportable, setFilterReportable] = useState("ALL");
    const [filterType, setFilterType] = useState("ALL");
    const [startYear, setStartYear] = useState("");
    const [endYear, setEndYear] = useState("");
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [savingHistory, setSavingHistory] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [isFromHistory, setIsFromHistory] = useState(false);
    const formatIncidentHistoryDateRange = (filters) => {
        const from = filters?.fromDate;
        const to = filters?.toDate;

        if (!from || !to) return "–";

        const format = (d) =>
            new Date(d).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "2-digit",
            });

        return `${format(from)} – ${format(to)}`;
    };
    useEffect(() => {
        const fetchIncidentHistory = async () => {
            try {
                setLoadingHistory(true);

                const res = await fetch(
                    `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/incidentAuditingHistory?email=${props?.user?.email || ""}`
                );

                if (!res.ok) {
                    throw new Error("Failed to fetch incident auditing history");
                }

                const json = await res.json();
                setHistoryList(json.data || []);
            } catch (err) {
                console.error("Failed to load incident auditing history", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchIncidentHistory();
    }, [props.user]);
    const handleSaveIncidentHistory = async () => {
        // guard: already saving OR no response
        if (savingHistory || !responseData) return;

        try {
            setSavingHistory(true);

            // Build fromDate/toDate only when sync enabled
            const fromDate =
                syncEnabled && startYear && startMonth && startDay
                    ? `${startYear}-${startMonth}-${startDay}`
                    : null;

            const toDate =
                syncEnabled && endYear && endMonth && endDay
                    ? `${endYear}-${endMonth}-${endDay}`
                    : null;

            const payload = {
                email: props?.user?.email || "",

                // 🔴 CORE RESULT
                responseData,

                // 🔴 FILTERS (store what user used)
                filters: {
                    syncEnabled,
                    fromDate,
                    toDate,
                },
            };

            const res = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/incidentAuditingHistory/save",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Failed to save history");

            alert("Saved successfully");

            // ✅ Refresh history list immediately (same feel)
            const historyRes = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/incidentAuditingHistory?email${props?.user?.email || ""}`
            );
            const historyJson = await historyRes.json();
            setHistoryList(historyJson.data || []);

        } catch (error) {
            console.error("Save incident auditing history failed:", error);
            alert("Failed to save history");
        } finally {
            setSavingHistory(false);
        }
    };
    const handleIncidentHistoryClick = async (item) => {
        try {
            const res = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/incidentAuditingHistory/${item.id}`
            );

            if (!res.ok) throw new Error("Failed to fetch history item");

            const json = await res.json();
            const data = json.data;

            // ✅ Restore report response
            setResponseData(data.responseData);

            // ✅ Restore sync + date inputs
            const filters = data.filters || {};
            setSyncEnabled(!!filters.syncEnabled);

            if (filters.fromDate) {
                const [y, m, d] = filters.fromDate.split("-");
                setStartYear(y || "");
                setStartMonth(m || "");
                setStartDay(d || "");
            } else {
                setStartYear("");
                setStartMonth("");
                setStartDay("");
            }

            if (filters.toDate) {
                const [y, m, d] = filters.toDate.split("-");
                setEndYear(y || "");
                setEndMonth(m || "");
                setEndDay(d || "");
            } else {
                setEndYear("");
                setEndMonth("");
                setEndDay("");
            }

            // ✅ When viewing from history disable upload effect
            setIncidentAuditingFiles([]);

            // ✅ mark mode
            setIsFromHistory(true);

        } catch (err) {
            console.error("Failed to load incident auditing history item", err);
        }
    };
    const handleDeleteIncidentHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true);

            const res = await fetch(
                `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/incidentAuditingHistory`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: selectedHistoryId,
                    }),
                }
            );

            if (!res.ok) throw new Error("Failed to delete history");

            // ✅ remove from UI immediately
            setHistoryList((prev) =>
                prev.filter((item) => item.id !== selectedHistoryId)
            );

            setShowDeleteModal(false);
            setSelectedHistoryId(null);

            alert("History deleted successfully");
        } catch (error) {
            console.error("Delete incident auditing history failed:", error);
            alert("Failed to delete history");
        } finally {
            setDeleting(false);
        }
    };
    const renderHistorySection = () => (
        <section className="history-container">

            {/* HEADER */}
            <div style={{ display: "flex", gap: "8px" }}>
                <img
                    src={require("../../../Images/TlcPayrollHistory.png")}
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
                    {historyList.map((item) => (
                        <div
                            key={item.id}
                            className="history-card-modern"
                            onClick={() => handleIncidentHistoryClick(item)}
                            style={{ position: "relative" }}
                        >
                            {/* delete */}
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
                            {item?.filters?.syncEnabled && (
                                <div className="history-top">
                                    <div className="history-date-range">
                                        <span className="label">Date Range: </span>
                                        <span className="value">
                                            {formatIncidentHistoryDateRange(item.filters)}
                                        </span>
                                    </div>
                                </div>
                            )}

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
                                    {item.filters.syncEnabled != null && (
                                        <div className="filter-item">
                                            <strong>Sync Enabled:</strong>{" "}
                                            {item.filters.syncEnabled ? "Yes" : "No"}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* DELETE MODAL */}
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
                                onClick={handleDeleteIncidentHistory}
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

    const handleAnalyse = async () => {
        // console.log("Analyse clicked");
        // console.log("startDay:", startDay);
        // console.log("startMonth:", startMonth);
        // console.log("endDay:", endDay);
        // console.log("endMonth:", endMonth);
        // console.log("syncEnabled:", syncEnabled);
        if (syncEnabled) {
            if (!startDay || !startMonth || !startYear || !endDay || !endMonth || !endYear) {

                alert("Please select a start and end date.");
                return;
            }
        }

        if (!syncEnabled && incidentAuditingFiles.length === 0) {
            alert("Please upload files or enable Sync.");
            return;
        }

        setIsIncidentAuditingProcessing(true);
        setIncidentAuditingProgress(5);

        let taskIndex = 0;


        // const taskInterval = setInterval(() => {
        //     taskIndex++;
        //     if (taskIndex < TASK_QUEUE.length) {
        //         setCurrentTask(TASK_QUEUE[taskIndex]);
        //     }
        // }, 20000);

        // fake progress
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 0.15;
            if (progressValue >= 95) progressValue = 70;
            setIncidentAuditingProgress(progressValue);
        }, 80);

        try {
            // Prepare FormData
            const formData = new FormData();
            incidentAuditingFiles.forEach(file => formData.append("files", file));
            if (syncEnabled) {
                formData.append("sync", true);

                const year = new Date().getFullYear();
                // console.log("fromDate:", `${startYear}-${startMonth}-${startDay}`);
                // console.log("toDate:", `${endYear}-${endMonth}-${endDay}`);
                formData.append("fromDate", `${startYear}-${startMonth}-${startDay}`);
                formData.append("toDate", `${endYear}-${endMonth}-${endDay}`);
                formData.append("userEmail", props.user.email);
            }

            const response = await fetch(
                "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/incidentAuditing",
                {
                    method: "POST",
                    body: formData
                }
            );

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";
            let finalResult = null;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Split into SSE lines
                let lines = buffer.split("\n");
                buffer = lines.pop();

                for (let line of lines) {
                    line = line.trim();
                    if (!line.startsWith("data:")) continue;

                    const jsonStr = line.replace("data:", "").trim();

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.message) {
                            setCurrentTask(data.message)
                        }

                        // 🔵 When backend sends result
                        if (
                            data.reportable_incidents !== undefined &&
                            data.type_of_incident !== undefined &&
                            data.incidents !== undefined
                        ) {
                            setResponseData(data);
                        }
                    } catch (err) {
                        console.warn("Non-JSON SSE", jsonStr);
                    }
                }
            }
        } catch (error) {
            console.error("SSE stream error", error);
            alert("Something went wrong while processing files.");
        } finally {
            clearInterval(progressInterval);
            // clearInterval(taskInterval);

            setIncidentAuditingProgress(100);

            setTimeout(() => {
                setIsIncidentAuditingProcessing(false);
            }, 500);
        }
    };

    // 🔥 PUT FILTER LOGIC HERE
    let filteredIncidents = responseData?.incidents || [];

    if (responseData?.incidents) {
        filteredIncidents = responseData.incidents.filter((item) => {

            // SEARCH
            if (searchTerm.trim() !== "") {
                const text = searchTerm.toLowerCase();
                const matches =
                    item.client_name.toLowerCase().includes(text) ||
                    item.summary.toLowerCase().includes(text);
                if (!matches) return false;
            }

            // REPORTABLE FILTER
            if (filterReportable !== "ALL") {
                const isReportable = item.reportable === true;
                if (filterReportable === "YES" && !isReportable) return false;
                if (filterReportable === "NO" && isReportable) return false;
            }

            // TYPE FILTER
            if (filterType !== "ALL") {
                if (item.type.toLowerCase() !== filterType.toLowerCase()) {
                    return false;
                }
            }

            return true;
        });
    }


    return (
        <>
            {/* 🌀 Show loader while processing */}
            {isIncidentAuditingProcessing ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", }}>
                    {/* Replace with your custom loader if you have one */}
                    <PulsatingLoader currentTask={currentTask} progress={incidentAuditingProgress} />
                </div>
            ) : responseData ? (
                /* ✅ Show response reports after processing finishes */
                <>
                    {isFromHistory && (
                        <div
                            className="financial-health-history-back-btn"
                            onClick={() => {
                                setIsFromHistory(false);

                                // clear report view
                                setResponseData(null);

                                // reset filters
                                setSearchTerm("");
                                setFilterReportable("ALL");
                                setFilterType("ALL");

                                // clear expanded sources
                                setExpandedSources([]);

                                // reset sync + date fields (optional)
                                setSyncEnabled(false);
                                setStartDay("");
                                setStartMonth("");
                                setStartYear("");
                                setEndDay("");
                                setEndMonth("");
                                setEndYear("");

                                // clear upload files
                                setIncidentAuditingFiles([]);
                            }}
                        >
                            <GoArrowLeft size={22} color="#6C4CDC" />
                            Back
                        </div>
                    )}
                    {/* Header */}
                    <div className="incident-dashboard-header">
                        <div className="incident-h">Incident Audit Dashboard</div>
                        <div className="incident-dashboard-filters">
                            <input
                                type="text"
                                placeholder="Search Client or Description..."
                                className="incident-dashboard-search"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />

                            <select
                                className="incident-dashboard-select"
                                value={filterReportable}
                                onChange={(e) => setFilterReportable(e.target.value)}
                            >
                                <option value="ALL">All</option>
                                <option value="YES">Reportable</option>
                                <option value="NO">Non Reportable</option>
                            </select>

                            <select
                                className="incident-dashboard-select"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="ALL">All Types</option>
                                <option value="injury">Injury</option>
                                <option value="medication">Medication</option>
                                <option value="behaviour">Behaviour</option>
                                <option value="near_miss">Near Miss</option>
                                <option value="other">Other</option>
                            </select>
                            {!isFromHistory && (
                                <button
                                    onClick={handleSaveIncidentHistory}
                                    style={{
                                        background: "#6C4CDC",
                                        color: "#fff",
                                        border: "none",
                                        padding: "8px 16px",
                                        borderRadius: "8px",
                                        fontSize: "14px",
                                        fontWeight: 400,
                                        cursor: "pointer",
                                    }}
                                >
                                    {savingHistory ? "Saving..." : "Save"}
                                </button>
                            )}
                        </div>

                    </div>

                    {/* Summary Cards */}
                    <div className="incident-dashboard-summary">
                        <div className="incident-dashboard-card">
                            <p>Reportable Incidents</p>
                            <h3>{responseData.reportable_incidents}</h3>
                        </div>
                        <div className="incident-dashboard-card">
                            <p>Total Incidents</p>
                            <h3>{responseData.total_incidents}</h3>
                        </div>
                        <div className="incident-dashboard-card">
                            <p>Overall Compliance</p>
                            <h3>{responseData.overall_compliance}%</h3>
                        </div>
                    </div>

                    {/* Type of Incident Table */}
                    <div className="incident-dashboard-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Type Of Incident</th>
                                    <th>Numbers Reported</th>
                                </tr>
                            </thead>
                            <tbody>
                                {responseData.type_of_incident.map((row, idx) => (
                                    <tr key={idx}>
                                        <td>{row.type}</td>
                                        <td>{row.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Incident Cards */}
                    <h3 className="incident-dashboard-section-title">Incidents</h3>
                    <div className="incident-dashboard-cards">
                        {filteredIncidents.map((incident, idx) => (
                            <div className="incident-dashboard-card-item" key={idx}>
                                <div className="incident-dashboard-card-header">
                                    <h4>{incident.client_name}</h4>
                                    <span
                                        className={`incident-dashboard-badge ${incident.reportable
                                            ? "incident-dashboard-badge-nonreportable"
                                            : "incident-dashboard-badge-nonreportable"
                                            }`}
                                    >
                                        {incident.reportable ? "Reportable" : "Non Reportable"}
                                    </span>
                                </div>

                                <div className="incident-dashboard-card-info">
                                    <p>
                                        <strong>Severity:</strong> {incident.severity}
                                    </p>
                                    <p>
                                        <strong>Incident#:</strong> {incident.incident_number}
                                    </p>
                                    <p>
                                        <strong>Type:</strong> {incident.type}
                                    </p>
                                    <p>
                                        <strong>Date Reported:</strong> {incident.date_reported}
                                    </p>
                                    <p>
                                        <strong>Reported By:</strong> {incident.reported_by}
                                    </p>
                                </div>

                                <div className="incident-dashboard-card-section">
                                    <strong>Summary</strong>
                                    <p>{incident.summary}</p>
                                </div>

                                <div className="incident-dashboard-card-section">
                                    <strong>Behavioural Analysis</strong>
                                    <p>{incident.behavioural_analysis}</p>
                                </div>

                                {/* Sources Section */}
                                <div className="incident-dashboard-card-sources">
                                    <button
                                        className="incident-dashboard-toggle-btn"
                                        onClick={() =>
                                            setExpandedSources((prev) =>
                                                prev.includes(idx)
                                                    ? prev.filter((i) => i !== idx)
                                                    : [...prev, idx]
                                            )
                                        }
                                    >
                                        {expandedSources.includes(idx) ? (
                                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '6px' }}>
                                                Hide Sources <IoIosArrowUp />
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '6px' }}>
                                                Show Sources <IoIosArrowDown />
                                            </div>
                                        )}
                                    </button>


                                    {expandedSources.includes(idx) && (
                                        <div className="incident-dashboard-sources-list">
                                            {incident.sources.map((src, i) => (
                                                <div key={i} className="incident-dashboard-source-item">
                                                    <h5>{src.title}</h5>
                                                    <p>{src.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                </>
            ) : (
                /* 📁 Default: show upload + info UI */
                <>
                    <div className="financial-header">
                        <div></div>
                        <div
                            style={{
                                display: "flex",
                                gap: "6px",
                                alignItems: "center",
                                justifyContent: "center",
                                marginLeft: "100px",
                            }}
                        >
                            <h1 className="titless">INCIDENT AUDITING</h1>
                            <Tippy
                                content={
                                    <div
                                        style={{
                                            width: "450px",
                                            height: "auto",
                                            padding: "4px",
                                            fontSize: "15px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Incident report is mandatory.
                                    </div>
                                }
                                trigger="mouseenter focus click"
                                interactive={true}
                                placement="top"
                                theme="custom"
                            >
                                <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                                    <IoMdInformationCircleOutline size={22} color="#5B36E1" />
                                </div>
                            </Tippy>
                        </div>
                        <div className="sync-toggle">
                            <div style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter" }}>
                                Sync With Your System
                            </div>
                            <Toggle
                                checked={syncEnabled}
                                onChange={() => {
                                    setSyncEnabled(!syncEnabled);
                                    if (!syncEnabled) {
                                        setIncidentAuditingFiles([]);
                                    } else {
                                        setStartDay("");
                                        setStartMonth("");
                                        setStartYear("");
                                        setEndDay("");
                                        setEndMonth("");
                                        setEndYear("");
                                    }
                                }}


                                className="custom-toggle"
                                icons={false}
                            />
                        </div>
                    </div>


                    {/* Info Table */}
                    <div className="info-table">
                        <div className="table-headerss">
                            <span>If You Upload This...</span>
                            <span>Our AI Will Instantly...</span>
                        </div>
                        <div className="table-rowss">
                            <div>Care Management System - Incident Report</div>
                            <ul>
                                <li>Collates evidence to support higher funding requests.</li>
                                <li>Uncover CAPA (Corrective and Preventive Actions) insights per client.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Behaviour Support System - Behaviour Support Report</div>
                            <ul>
                                <li>Auto-generates NDIS evidence summaries and reports.</li>
                                <li>Links incidents to unmet care or supervision needs.</li>
                            </ul>
                        </div>
                        <div className="table-rowss">
                            <div>Care Management System - Shift Notes Report</div>
                            <ul>
                                <li>Flags behavioural or mood changes in participants.</li>
                                <li>Receive a concise, person-centred support analysis report.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Date selectors */}
                    <div className="date-section">
                        {/* Start */}
                        <div className="date-picker">
                            <label style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter" }}>
                                Report Start Date
                            </label>
                            <div className="date-inputs">
                                <select value={startDay} onChange={(e) => setStartDay(e.target.value)}>
                                    <option value="">DD</option>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const day = (i + 1).toString().padStart(2, "0");
                                        return (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        );
                                    })}
                                </select>

                                <select value={startMonth} onChange={(e) => setStartMonth(e.target.value)}>
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0");
                                        const monthName = new Date(0, i).toLocaleString("en-US", { month: "short" });
                                        return (
                                            <option key={monthValue} value={monthValue}>
                                                {monthName}
                                            </option>
                                        );
                                    })}
                                </select>

                                <select value={startYear} onChange={(e) => setStartYear(e.target.value)}>
                                    <option value="">YYYY</option>
                                    {Array.from({ length: 20 }, (_, i) => {
                                        const year = (new Date().getFullYear() - i).toString();
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                        </div>

                        {/* End */}
                        <div className="date-picker">
                            <label style={{ fontSize: "14px", fontWeight: "500", fontFamily: "Inter" }}>
                                Report End Date
                            </label>
                            <div className="date-inputs">
                                <select value={endDay} onChange={(e) => setEndDay(e.target.value)}>
                                    <option value="">DD</option>
                                    {Array.from({ length: 31 }, (_, i) => {
                                        const day = (i + 1).toString().padStart(2, "0");
                                        return (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        );
                                    })}
                                </select>

                                <select value={endMonth} onChange={(e) => setEndMonth(e.target.value)}>
                                    <option value="">MM</option>
                                    {Array.from({ length: 12 }, (_, i) => {
                                        const monthValue = (i + 1).toString().padStart(2, "0");
                                        const monthName = new Date(0, i).toLocaleString("en-US", { month: "short" });
                                        return (
                                            <option key={monthValue} value={monthValue}>
                                                {monthName}
                                            </option>
                                        );
                                    })}
                                </select>

                                <select value={endYear} onChange={(e) => setEndYear(e.target.value)}>
                                    <option value="">YYYY</option>
                                    {Array.from({ length: 20 }, (_, i) => {
                                        const year = (new Date().getFullYear() - i).toString();
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* File uploader */}
                    <div className="uploader-grid" style={{ display: "flex", justifyContent: "center" }}>
                        <div
                            style={{
                                width: "50%",
                                opacity: syncEnabled ? 0.5 : 1,
                                pointerEvents: syncEnabled ? "none" : "auto",
                                cursor: syncEnabled ? "not-allowed" : "pointer"
                            }}
                        >
                            <UploadFiles
                                files={incidentAuditingFiles}
                                setFiles={setIncidentAuditingFiles}
                                title={props.selectedRole}
                                subtitle="Upload .xlsx, .csv, .xls, .pdf or .doc file"
                                fileformat=".xlsx, .csv, .xls, .pdf, .doc"
                                removeFile={(index) =>
                                    setIncidentAuditingFiles((prev) => prev.filter((_, i) => i !== index))
                                }
                                multiple
                                isProcessing={isIncidentAuditingProcessing}
                            />
                        </div>
                    </div>

                    {/* Analyse button */}
                    <button
                        className="analyse-btn"
                        onClick={handleAnalyse}
                        disabled={isButtonDisabled || isIncidentAuditingProcessing}
                        style={{
                            backgroundColor: isButtonDisabled || isIncidentAuditingProcessing ? "#A1A1AA" : "#000",
                            cursor: isIncidentAuditingProcessing ? "not-allowed" : "pointer",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            Analyse <img src={star} alt="img" style={{ width: "20px", height: "20px" }} />
                        </div>
                    </button>
                </>
            )}
            {renderHistorySection()}
        </>
    );

};

export default IncidentAuditing;
