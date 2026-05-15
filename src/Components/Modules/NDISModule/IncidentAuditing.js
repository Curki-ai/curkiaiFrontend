import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../Styles/NDISModule/IncidentAuditing.css";
import TlcUploadBox from "../FinancialModule/Tlc/TlcUploadBox";
import star from "../../../Images/star.png";
import PulsatingLoader from "../../general-components/PulsatingLoader";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { RiDeleteBin6Line, RiSettingsLine } from "react-icons/ri";
import { GoArrowLeft } from "react-icons/go";
import { FiCalendar, FiFilter, FiSearch, FiUpload } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import incrementCareVoiceAnalysisCount from "../SupportAtHomeModule/careVoiceCostAnalysis";
import { API_BASE as BASE_URL } from "../../../config/apiBase";
import useModuleOrgLookup from "../../../hooks/useModuleOrgLookup";
import FinancialHealthNoOrgEmptyState from "../FinancialModule/FinancialHealth/FinancialHealthNoOrgEmptyState";
import FinancialHealthAccessManagement from "../FinancialModule/FinancialHealth/FinancialHealthAccessManagement";
import CenteredLoader from "../../general-components/CenteredLoader";

const IA_API_BASE = `${BASE_URL}/api/incident-auditing`;

const TASK_QUEUE = [
    "Analysing data",
    "Confirming incident reports are included",
    "Incident audit started",
    "Processing safety protocols",
    "Validating compliance requirements",
    "Generating final report",
];

const IncidentAuditing = (props) => {
    const [incidentAuditingFiles, setIncidentAuditingFiles] = useState([]);
    const [isIncidentAuditingProcessing, setIsIncidentAuditingProcessing] = useState(false);
    const [incidentAuditingProgress, setIncidentAuditingProgress] = useState(0);
    const [responseData, setResponseData] = useState(null);
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
    const [historyLoading, setHistoryLoading] = useState(false);

    const [savingHistory, setSavingHistory] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [isFromHistory, setIsFromHistory] = useState(false);
    const [openAccessManagement, setOpenAccessManagement] = useState(false);
    const userEmail = props?.user?.email;
    const pageRef = useRef(null);

    const { currentUserRole, orgLookupStatus, refresh: refetchOrg } =
        useModuleOrgLookup({
            userEmail,
            orgsApiBase: `${IA_API_BASE}/organizations`,
        });

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
                    `${BASE_URL}/api/incidentAuditingHistory?email=${props?.user?.email || ""}`
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
        if (savingHistory || !responseData) return;

        try {
            setSavingHistory(true);

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
                responseData,
                filters: {
                    syncEnabled,
                    fromDate,
                    toDate,
                },
            };

            const res = await fetch(
                `${BASE_URL}/api/incidentAuditingHistory/save`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!res.ok) throw new Error("Failed to save history");

            toast.success("Saved successfully");

            const historyRes = await fetch(
                `${BASE_URL}/api/incidentAuditingHistory?email=${props?.user?.email || ""}`
            );
            const historyJson = await historyRes.json();
            setHistoryList(historyJson.data || []);
        } catch (error) {
            console.error("Save incident auditing history failed:", error);
            toast.error("Failed to save history");
        } finally {
            setSavingHistory(false);
        }
    };

    const handleIncidentHistoryClick = async (item) => {
        try {
            setHistoryLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            const res = await fetch(
                `${BASE_URL}/api/incidentAuditingHistory/${item.id}`
            );

            if (!res.ok) throw new Error("Failed to fetch history item");

            const json = await res.json();
            const data = json.data;

            setResponseData(data.responseData);

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

            await incrementCareVoiceAnalysisCount(
                props.user.email,
                "history-click",
                0,
                "incident-auditing",
                0
            );

            setIncidentAuditingFiles([]);
            setIsFromHistory(true);
        } catch (err) {
            console.error("Failed to load incident auditing history item", err);
            toast.error("Failed to load history");
        } finally {
            setHistoryLoading(false);
            if (pageRef.current) {
                pageRef.current.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    };

    const handleDeleteIncidentHistory = async () => {
        if (!selectedHistoryId) return;

        try {
            setDeleting(true);

            const res = await fetch(
                `${BASE_URL}/api/incidentAuditingHistory`,
                {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: selectedHistoryId }),
                }
            );

            if (!res.ok) throw new Error("Failed to delete history");

            setHistoryList((prev) =>
                prev.filter((item) => item.id !== selectedHistoryId)
            );

            setShowDeleteModal(false);
            setSelectedHistoryId(null);

            toast.success("History deleted successfully");
        } catch (error) {
            console.error("Delete incident auditing history failed:", error);
            toast.error("Failed to delete history");
        } finally {
            setDeleting(false);
        }
    };

    const renderHistorySection = () => (
        <section className="ia-history-container">
            {/* HEADER */}
            <div className="ia-history-header">
                <img
                    src={require("../../../Images/TlcPayrollHistory.png")}
                    alt="icon"
                    className="ia-history-icon"
                />
                <div className="ia-history-title">History</div>
            </div>

            {/* BODY */}
            {loadingHistory && (
                <p className="ia-history-state">Loading history...</p>
            )}

            {!loadingHistory && historyList.length === 0 && (
                <p className="ia-history-state ia-history-state-empty">
                    No saved history found.
                </p>
            )}

            {!loadingHistory && historyList.length > 0 && (
                <div className="ia-history-list">
                    {historyList.map((item) => (
                        <div
                            key={item.id}
                            className="ia-history-card"
                            onClick={() => handleIncidentHistoryClick(item)}
                        >
                            <button
                                className="ia-history-delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHistoryId(item.id);
                                    setShowDeleteModal(true);
                                }}
                                title="Delete"
                            >
                                <RiDeleteBin6Line size={18} />
                            </button>

                            {item?.filters?.syncEnabled && (
                                <div className="ia-history-top">
                                    <div className="ia-history-date-range">
                                        <span className="ia-label">Date Range: </span>
                                        <span className="ia-value">
                                            {formatIncidentHistoryDateRange(item.filters)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="ia-saved-on">
                                <span className="ia-saved-label">Saved on: </span>
                                <span className="ia-saved-value">
                                    {new Date(item.createdAt).toLocaleString()}
                                </span>
                            </div>

                            {item.filters && (
                                <div className="ia-history-filters">
                                    {item.filters.syncEnabled != null && (
                                        <div className="ia-filter-item">
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

        </section>
    );

    const handleAnalyse = async () => {
        if (syncEnabled) {
            if (!startDay || !startMonth || !startYear || !endDay || !endMonth || !endYear) {
                toast.error("Please select a start and end date.");
                return;
            }
        }

        if (!syncEnabled && incidentAuditingFiles.length === 0) {
            toast.error("Please upload files or enable Sync.");
            return;
        }

        setIsIncidentAuditingProcessing(true);
        setIncidentAuditingProgress(5);

        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 0.15;
            if (progressValue >= 95) progressValue = 70;
            setIncidentAuditingProgress(progressValue);
        }, 80);

        try {
            const formData = new FormData();
            incidentAuditingFiles.forEach((file) => formData.append("files", file));
            if (syncEnabled) {
                formData.append("sync", true);
                formData.append("fromDate", `${startYear}-${startMonth}-${startDay}`);
                formData.append("toDate", `${endYear}-${endMonth}-${endDay}`);
                formData.append("userEmail", props.user.email);
            }

            const response = await fetch(`${BASE_URL}/incidentAuditing`, {
                method: "POST",
                body: formData,
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                let lines = buffer.split("\n");
                buffer = lines.pop();

                for (let line of lines) {
                    line = line.trim();
                    if (!line.startsWith("data:")) continue;

                    const jsonStr = line.replace("data:", "").trim();

                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.message) {
                            setCurrentTask(data.message);
                        }

                        if (
                            data.reportable_incidents !== undefined &&
                            data.type_of_incident !== undefined &&
                            data.incidents !== undefined
                        ) {
                            setResponseData(data);
                            await incrementCareVoiceAnalysisCount(
                                props?.user?.email?.trim(),
                                "ai-analysis",
                                0,
                                "incident-auditing",
                                0
                            );
                        }
                    } catch (err) {
                        console.warn("Non-JSON SSE", jsonStr);
                    }
                }
            }
        } catch (error) {
            console.error("SSE stream error", error);
            toast.error("Something went wrong while processing files.");
        } finally {
            clearInterval(progressInterval);
            setIncidentAuditingProgress(100);

            setTimeout(() => {
                setIsIncidentAuditingProcessing(false);
            }, 500);
        }
    };

    // Filter pipeline
    let filteredIncidents = responseData?.incidents || [];

    if (responseData?.incidents) {
        filteredIncidents = responseData.incidents.filter((item) => {
            if (searchTerm.trim() !== "") {
                const text = searchTerm.toLowerCase();
                const matches =
                    item.client_name.toLowerCase().includes(text) ||
                    item.summary.toLowerCase().includes(text);
                if (!matches) return false;
            }

            if (filterReportable !== "ALL") {
                const isReportable = item.reportable === true;
                if (filterReportable === "YES" && !isReportable) return false;
                if (filterReportable === "NO" && isReportable) return false;
            }

            if (filterType !== "ALL") {
                if (item.type.toLowerCase() !== filterType.toLowerCase()) {
                    return false;
                }
            }

            return true;
        });
    }

    if (orgLookupStatus === "loading") {
        return <CenteredLoader />;
    }
    if (orgLookupStatus === "not_found") {
        return (
            <FinancialHealthNoOrgEmptyState
                userEmail={userEmail}
                moduleLabel="Incident Auditing"
                registerUrl={`${IA_API_BASE}/organizations/register`}
                onRegistered={refetchOrg}
            />
        );
    }

    const renderHeaderBar = () => (
        <div className="ia-header-bar">
            <div className="ia-header-left">
                {currentUserRole === "admin" && (
                    <button
                        type="button"
                        className="ia-access-mgmt-btn"
                        onClick={() => setOpenAccessManagement(true)}
                    >
                        <RiSettingsLine size={16} />
                        Access Management
                    </button>
                )}
            </div>

            <div className="ia-header-right">
                <span className="ia-sync-label">Sync With Your System</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={syncEnabled}
                    className={`ia-sync-switch ${syncEnabled ? "ia-sync-switch-on" : ""}`}
                    onClick={() => {
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
                >
                    <span className="ia-sync-knob" />
                </button>
            </div>
        </div>
    );

    const renderDateSelect = (value, onChange, kind) => {
        let options;
        if (kind === "day") {
            options = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0"));
        } else if (kind === "month") {
            options = Array.from({ length: 12 }, (_, i) => ({
                value: (i + 1).toString().padStart(2, "0"),
                label: new Date(0, i).toLocaleString("en-US", { month: "short" }),
            }));
        } else {
            options = Array.from({ length: 20 }, (_, i) =>
                (new Date().getFullYear() - i).toString()
            );
        }

        return (
            <select
                className="ia-date-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">
                    {kind === "day" ? "DD" : kind === "month" ? "MM" : "YYYY"}
                </option>
                {kind === "month"
                    ? options.map((o) => (
                          <option key={o.value} value={o.value}>
                              {o.label}
                          </option>
                      ))
                    : options.map((o) => (
                          <option key={o} value={o}>
                              {o}
                          </option>
                      ))}
            </select>
        );
    };

    return (
        <>
            {/* ToastContainer is mounted once globally in HomePage. */}
            <div className="ia-main-container" ref={pageRef}>
                {historyLoading && (
                    <div className="ia-full-screen-loader">
                        <div className="ia-history-loader" />
                    </div>
                )}
                {/* Decorative gradient orb */}
                <div className="ia-ambient-orb" aria-hidden="true" />

                {isIncidentAuditingProcessing ? (
                    <div className="ia-loader-wrap">
                        <PulsatingLoader
                            currentTask={currentTask}
                            progress={incidentAuditingProgress}
                        />
                    </div>
                ) : responseData ? (
                    /* ── DASHBOARD VIEW ── */
                    <div className="ia-page ia-page-dashboard">
                        {isFromHistory && (
                            <button
                                type="button"
                                className="ia-history-back-btn"
                                onClick={() => {
                                    setIsFromHistory(false);
                                    setResponseData(null);
                                    setSearchTerm("");
                                    setFilterReportable("ALL");
                                    setFilterType("ALL");
                                    setExpandedSources([]);
                                    setSyncEnabled(false);
                                    setStartDay("");
                                    setStartMonth("");
                                    setStartYear("");
                                    setEndDay("");
                                    setEndMonth("");
                                    setEndYear("");
                                    setIncidentAuditingFiles([]);
                                }}
                            >
                                <GoArrowLeft size={18} />
                                Back
                            </button>
                        )}

                        {currentUserRole === "admin" && (
                            <div className="ia-header-bar ia-header-bar-dashboard">
                                <div className="ia-header-left" />
                                <div className="ia-header-right">
                                    <button
                                        type="button"
                                        className="ia-access-mgmt-btn"
                                        onClick={() => setOpenAccessManagement(true)}
                                    >
                                        <RiSettingsLine size={16} />
                                        Access Management
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Dashboard header */}
                        <div className="ia-dashboard-header">
                            <h2 className="ia-dashboard-title">Incident Audit Dashboard</h2>
                            <div className="ia-dashboard-filters">
                                <div className="ia-search-field">
                                    <FiSearch size={15} className="ia-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Search client or description…"
                                        className="ia-search-input"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="ia-filter-select"
                                    value={filterReportable}
                                    onChange={(e) => setFilterReportable(e.target.value)}
                                >
                                    <option value="ALL">All</option>
                                    <option value="YES">Reportable</option>
                                    <option value="NO">Non Reportable</option>
                                </select>

                                <select
                                    className="ia-filter-select"
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
                                        type="button"
                                        className="ia-save-btn"
                                        onClick={handleSaveIncidentHistory}
                                        disabled={savingHistory}
                                    >
                                        {savingHistory ? "Saving…" : "Save"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="ia-summary-grid">
                            <div className="ia-summary-card">
                                <div className="ia-summary-label">Reportable Incidents</div>
                                <div className="ia-summary-value">
                                    {responseData.reportable_incidents}
                                </div>
                            </div>
                            <div className="ia-summary-card">
                                <div className="ia-summary-label">Total Incidents</div>
                                <div className="ia-summary-value">
                                    {responseData.total_incidents}
                                </div>
                            </div>
                            <div className="ia-summary-card">
                                <div className="ia-summary-label">Overall Compliance</div>
                                <div className="ia-summary-value">
                                    {responseData.overall_compliance}%
                                </div>
                            </div>
                        </div>

                        {/* Type of Incident Table */}
                        <div className="ia-type-table-card">
                            <table className="ia-type-table">
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
                        <h3 className="ia-incidents-heading">Incidents</h3>
                        <div className="ia-incidents-grid">
                            {filteredIncidents.map((incident, idx) => (
                                <div className="ia-incident-card" key={idx}>
                                    <div className="ia-incident-card-header">
                                        <h4>{incident.client_name}</h4>
                                        <span
                                            className={`ia-incident-badge ${
                                                incident.reportable
                                                    ? "ia-incident-badge-reportable"
                                                    : "ia-incident-badge-nonreportable"
                                            }`}
                                        >
                                            {incident.reportable ? "Reportable" : "Non Reportable"}
                                        </span>
                                    </div>

                                    <div className="ia-incident-card-info">
                                        <div>
                                            <span className="ia-info-label">Severity</span>
                                            <span className="ia-info-value">{incident.severity}</span>
                                        </div>
                                        <div>
                                            <span className="ia-info-label">Incident#</span>
                                            <span className="ia-info-value">{incident.incident_number}</span>
                                        </div>
                                        <div>
                                            <span className="ia-info-label">Type</span>
                                            <span className="ia-info-value">{incident.type}</span>
                                        </div>
                                        <div>
                                            <span className="ia-info-label">Date Reported</span>
                                            <span className="ia-info-value">{incident.date_reported}</span>
                                        </div>
                                        <div className="ia-info-row-full">
                                            <span className="ia-info-label">Reported By</span>
                                            <span className="ia-info-value">{incident.reported_by}</span>
                                        </div>
                                    </div>

                                    <div className="ia-incident-card-section">
                                        <div className="ia-section-label">Summary</div>
                                        <p>{incident.summary}</p>
                                    </div>

                                    <div className="ia-incident-card-section">
                                        <div className="ia-section-label">Behavioural Analysis</div>
                                        <p>{incident.behavioural_analysis}</p>
                                    </div>

                                    <div className="ia-incident-card-sources">
                                        <button
                                            type="button"
                                            className="ia-sources-toggle"
                                            onClick={() =>
                                                setExpandedSources((prev) =>
                                                    prev.includes(idx)
                                                        ? prev.filter((i) => i !== idx)
                                                        : [...prev, idx]
                                                )
                                            }
                                        >
                                            {expandedSources.includes(idx) ? (
                                                <>
                                                    Hide Sources <IoIosArrowUp />
                                                </>
                                            ) : (
                                                <>
                                                    Show Sources <IoIosArrowDown />
                                                </>
                                            )}
                                        </button>

                                        {expandedSources.includes(idx) && (
                                            <div className="ia-sources-list">
                                                {incident.sources.map((src, i) => (
                                                    <div key={i} className="ia-source-item">
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
                    </div>
                ) : (
                    /* ── DEFAULT UPLOAD VIEW (no big title, no info table) ── */
                    <div className="ia-page">
                        {renderHeaderBar()}

                        {/* Filters card — date range */}
                        <section className="ia-filters-card">
                            <div className="ia-filters-card-header">
                                <span className="ia-filters-icon-wrap">
                                    <FiCalendar size={14} />
                                </span>
                                <span className="ia-filters-card-title">Report Date Range</span>
                                {syncEnabled && (
                                    <span className="ia-filters-card-hint">
                                        Required when Sync is enabled
                                    </span>
                                )}
                            </div>

                            <div className="ia-filters-grid">
                                <div className="ia-date-picker">
                                    <label className="ia-date-picker-label">Start Date</label>
                                    <div className="ia-date-inputs">
                                        {renderDateSelect(startDay, setStartDay, "day")}
                                        {renderDateSelect(startMonth, setStartMonth, "month")}
                                        {renderDateSelect(startYear, setStartYear, "year")}
                                    </div>
                                </div>

                                <div className="ia-date-picker">
                                    <label className="ia-date-picker-label">End Date</label>
                                    <div className="ia-date-inputs">
                                        {renderDateSelect(endDay, setEndDay, "day")}
                                        {renderDateSelect(endMonth, setEndMonth, "month")}
                                        {renderDateSelect(endYear, setEndYear, "year")}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Upload section — TlcUploadBox sits inside our own glass
                            card so it gets the same surface treatment as the other
                            page sections. The card header + decorative orb wrap
                            the box; the box keeps its own drop-area chrome. */}
                        <section
                            className={`ia-upload-card ${
                                syncEnabled ? "ia-upload-card-disabled" : ""
                            }`}
                        >
                            <div className="ia-upload-card-header">
                                <span className="ia-filters-icon-wrap">
                                    <FiUpload size={14} />
                                </span>
                                <div className="ia-upload-card-text">
                                    <span className="ia-upload-card-title">
                                        Upload Incident Reports
                                    </span>
                                    <span className="ia-upload-card-subtitle">
                                        Drop your incident files here — we'll do the rest.
                                    </span>
                                </div>
                                {syncEnabled && (
                                    <span className="ia-upload-disabled-hint">
                                        Disabled while Sync is on
                                    </span>
                                )}
                            </div>

                            <div className="ia-upload-card-body">
                                <TlcUploadBox
                                    id="incident-auditing-files"
                                    title="Click below to upload"
                                    subtitle=".XLSX, .CSV, .XLS, .PDF, .DOC"
                                    accept=".xlsx,.csv,.xls,.pdf,.doc"
                                    files={incidentAuditingFiles}
                                    setFiles={setIncidentAuditingFiles}
                                    multiple
                                />
                            </div>
                        </section>

                        {/* Analyse CTA */}
                        <div className="ia-cta-row">
                            <button
                                type="button"
                                className="ia-analyse-btn"
                                onClick={handleAnalyse}
                                disabled={isButtonDisabled || isIncidentAuditingProcessing}
                            >
                                <HiOutlineSparkles size={16} />
                                Analyse
                                <img src={star} alt="" className="ia-analyse-star" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Hide history while the analysis loader is on — keeps focus
                    on the progress and avoids the page jumping under it. */}
                {!isIncidentAuditingProcessing && renderHistorySection()}
            </div>

            {openAccessManagement && (
                <FinancialHealthAccessManagement
                    onClose={() => setOpenAccessManagement(false)}
                    userEmail={userEmail}
                    moduleLabel="Incident Auditing"
                    apiBase={`${IA_API_BASE}/access`}
                />
            )}

            {/* Delete-history modal lives at the top level so its
                position:fixed overlay centers on the viewport. Rendering it
                inside .ia-history-container fails because the container has
                `backdrop-filter`, which creates a new containing block and
                traps fixed-positioned descendants. */}
            {showDeleteModal && (
                <div className="ia-delete-overlay">
                    <div className="ia-delete-modal">
                        <div className="ia-delete-title">
                            Are you sure you want to delete history?
                        </div>

                        <div className="ia-delete-actions">
                            <button
                                className="ia-delete-cancel"
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setSelectedHistoryId(null);
                                }}
                            >
                                No
                            </button>

                            <button
                                className="ia-delete-confirm"
                                onClick={handleDeleteIncidentHistory}
                                disabled={deleting}
                            >
                                {deleting ? "..." : "Yes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IncidentAuditing;
