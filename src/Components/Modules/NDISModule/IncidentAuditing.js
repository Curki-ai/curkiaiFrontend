import React, { forwardRef, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import enGB from "date-fns/locale/en-GB";
import "../../../Styles/NDISModule/IncidentAuditing.css";
import TlcUploadBox from "../FinancialModule/Tlc/TlcUploadBox";
import star from "../../../Images/star.png";
import PulsatingLoader from "../../general-components/PulsatingLoader";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { RiDeleteBin6Line, RiSettingsLine } from "react-icons/ri";
import { GoArrowLeft } from "react-icons/go";
import { FiCalendar, FiFilter, FiSearch } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import incrementCareVoiceAnalysisCount from "../SupportAtHomeModule/careVoiceCostAnalysis";
import { API_BASE as BASE_URL } from "../../../config/apiBase";
import useModuleOrgLookup from "../../../hooks/useModuleOrgLookup";
import FinancialHealthNoOrgEmptyState from "../FinancialModule/FinancialHealth/FinancialHealthNoOrgEmptyState";
import FinancialHealthAccessManagement from "../FinancialModule/FinancialHealth/FinancialHealthAccessManagement";
import CenteredLoader from "../../general-components/CenteredLoader";

registerLocale("en-GB", enGB);

const IA_API_BASE = `${BASE_URL}/api/incident-auditing`;

const TASK_QUEUE = [
    "Analysing data",
    "Confirming incident reports are included",
    "Incident audit started",
    "Processing safety protocols",
    "Validating compliance requirements",
    "Generating final report",
];

const QUICK_RANGES = [
    { label: "Last 7 Days", days: 7 },
    { label: "Last 30 Days", days: 30 },
    { label: "Last 3 Months", days: 90 },
    { label: "Last 6 Months", days: 180 },
    { label: "Last Year", days: 365 },
];

const toDisplayDate = (d) =>
    d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });

// Local-timezone-safe Date <-> ISO (YYYY-MM-DD) conversion. We avoid
// toISOString() because it shifts to UTC and can drift the displayed day.
const dateToIso = (d) => {
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};

const isoToDate = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

const formatDisplay = (d) => {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}-${mm}-${d.getFullYear()}`;
};

const CalIcon = ({ className }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
    >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const ChevronIcon = ({ className }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        viewBox="0 0 24 24"
    >
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

// Custom input rendered inside react-datepicker. Keeps the existing
// .ia-v2-* visual treatment: purple calendar icon on the left, chevron on the
// right that rotates while the popup is open. We deliberately ignore the
// onClick that react-datepicker passes via cloneElement and use our own
// onToggle so the input behaves as a true toggle (click again = close).
const DateFieldInput = forwardRef(
    ({ value, placeholder, isOpen, hasValue, onToggle }, ref) => (
        <div
            ref={ref}
            className={`ia-v2-input-wrap${isOpen ? " ia-v2-input-wrap-open" : ""}`}
            onClick={onToggle}
        >
            <CalIcon className="ia-v2-cal-icon" />
            <div
                className={`ia-v2-date-input ia-v2-date-input-picker${
                    hasValue ? "" : " ia-v2-date-input-placeholder"
                }`}
            >
                {value || placeholder}
            </div>
            <ChevronIcon
                className={`ia-v2-chevron${isOpen ? " ia-v2-chevron-open" : ""}`}
            />
        </div>
    )
);

const IncidentAuditing = (props) => {
    const [incidentAuditingFiles, setIncidentAuditingFiles] = useState([]);
    const [isIncidentAuditingProcessing, setIsIncidentAuditingProcessing] = useState(false);
    const [incidentAuditingProgress, setIncidentAuditingProgress] = useState(0);
    const [responseData, setResponseData] = useState(null);
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startOpen, setStartOpen] = useState(false);
    const [endOpen, setEndOpen] = useState(false);
    const [activeQuickRange, setActiveQuickRange] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [confirmDays, setConfirmDays] = useState("");
    const [currentTask, setCurrentTask] = useState(TASK_QUEUE[0]);
    const [expandedSources, setExpandedSources] = useState([]);
    const isButtonDisabled = !syncEnabled && incidentAuditingFiles.length === 0;
    const [searchTerm, setSearchTerm] = useState("");
    const [filterReportable, setFilterReportable] = useState("ALL");
    const [filterType, setFilterType] = useState("ALL");
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

    const { currentUserRole, orgLookupStatus, refresh: refetchOrg, forceNotFound: forceNoOrg } =
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

    // Close any open date picker when the user clicks outside both inputs
    // and the popper. Attached only while a picker is open.
    useEffect(() => {
        if (!startOpen && !endOpen) return undefined;
        const onDocMouseDown = (e) => {
            const inInput = e.target.closest && e.target.closest(".ia-v2-input-wrap");
            const inPicker =
                e.target.closest &&
                e.target.closest(".react-datepicker, #ia-datepicker-portal");
            if (!inInput && !inPicker) {
                setStartOpen(false);
                setEndOpen(false);
            }
        };
        document.addEventListener("mousedown", onDocMouseDown);
        return () => document.removeEventListener("mousedown", onDocMouseDown);
    }, [startOpen, endOpen]);

    const handleSaveIncidentHistory = async () => {
        if (savingHistory || !responseData) return;

        try {
            setSavingHistory(true);

            const fromDate = syncEnabled ? dateToIso(startDate) || null : null;
            const toDate = syncEnabled ? dateToIso(endDate) || null : null;

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

            const newStart = isoToDate(filters.fromDate);
            const newEnd = isoToDate(filters.toDate);
            setStartDate(newStart);
            setEndDate(newEnd);
            setActiveQuickRange(null);
            if (newStart && newEnd) {
                const diff = Math.round((newEnd - newStart) / 86400000);
                setConfirmText(`${toDisplayDate(newStart)} – ${toDisplayDate(newEnd)}`);
                setConfirmDays(`${diff} days`);
                setShowConfirm(true);
            } else {
                setShowConfirm(false);
                setConfirmText("");
                setConfirmDays("");
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
            // Smoothly scroll back to the top on every history selection. The real
            // scroll container is an ancestor div in HomePage (height:100vh;
            // overflow-y:auto), NOT the window — so window.scrollTo did nothing and
            // only the first load (which reset that div on mount) appeared to work.
            // Walk up from the module root to the nearest scrollable ancestor and
            // scroll it. The 300ms delay lets the new dashboard reflow in first so
            // the smooth animation isn't cancelled mid-scroll.
            const scrollPageToTop = () => {
                let el = pageRef.current;
                while (el) {
                    const oy = window.getComputedStyle(el).overflowY;
                    if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) {
                        el.scrollTo({ top: 0, behavior: "smooth" });
                        return;
                    }
                    el = el.parentElement;
                }
                window.scrollTo({ top: 0, behavior: "smooth" });
            };
            setTimeout(scrollPageToTop, 300);
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
        // Auto-topup balance gate (see HomePage's ANALYSIS_INTENT listener).
        const intent = new CustomEvent("ANALYSIS_INTENT", { cancelable: true });
        if (!window.dispatchEvent(intent)) return;

        const startIso = dateToIso(startDate);
        const endIso = dateToIso(endDate);
        if (syncEnabled) {
            if (!startIso || !endIso) {
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

        const t0 = Date.now();
        const traceId = Math.random().toString(36).slice(2, 8);

        try {
            const formData = new FormData();
            incidentAuditingFiles.forEach((file) => formData.append("files", file));
            if (syncEnabled) {
                formData.append("sync", true);
                formData.append("fromDate", startIso);
                formData.append("toDate", endIso);
                formData.append("userEmail", props.user.email);
            }

            const response = await fetch(`${BASE_URL}/incidentAuditing`, {
                method: "POST",
                body: formData,
            });


            if (!response.ok) {
                // Non-SSE error response (e.g. 500 before flushHeaders). Read it
                // as text so we capture the actual server message.
                const errBody = await response.text().catch(() => "");
                console.error(`[IncidentAuditing ${traceId}] HTTP ${response.status} from /incidentAuditing`, {
                    bodySnippet: errBody.slice(0, 500),
                });
                toast.error(
                    `Server error (${response.status}). Check console for details.`
                );
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let buffer = "";
            let eventCount = 0;
            let sawResult = false;
            let sawError = false;

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
                        eventCount += 1;
                        if (eventCount <= 30 || eventCount % 50 === 0) {
                        }
                        if (data.message) {
                            setCurrentTask(data.message);
                        }
                        if (data.message && /error/i.test(data.message)) {
                            sawError = true;
                            console.error(`[IncidentAuditing ${traceId}] SSE reported error`, data);
                        }

                        if (
                            data.reportable_incidents !== undefined &&
                            data.type_of_incident !== undefined &&
                            data.incidents !== undefined
                        ) {
                            sawResult = true;
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
                        console.warn(`[IncidentAuditing ${traceId}] Non-JSON SSE`, jsonStr);
                    }
                }
            }

        } catch (error) {
            console.error(`[IncidentAuditing ${traceId}] SSE stream error`, {
                message: error?.message,
                stack: error?.stack,
            });
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
                {(currentUserRole === "admin" || currentUserRole === "owner") && (
                    <button
                        type="button"
                        className="ia-access-mgmt-btn"
                        onClick={() => setOpenAccessManagement(true)}
                    >
                        <RiSettingsLine size={18} />
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
                            setStartDate(null);
                            setEndDate(null);
                            setActiveQuickRange(null);
                            setShowConfirm(false);
                            setConfirmText("");
                            setConfirmDays("");
                        }
                    }}
                >
                    <span className="ia-sync-knob" />
                </button>
            </div>
        </div>
    );

    const updateConfirm = (s, e) => {
        if (s && e) {
            const diff = Math.round((e - s) / 86400000);
            setConfirmText(`${toDisplayDate(s)} – ${toDisplayDate(e)}`);
            setConfirmDays(`${diff} days`);
            setShowConfirm(true);
        } else {
            setShowConfirm(false);
            setConfirmText("");
            setConfirmDays("");
        }
    };

    const handleQuickRange = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        setStartDate(start);
        setEndDate(end);
        setActiveQuickRange(days);
        updateConfirm(start, end);
    };

    const handleStartChange = (date) => {
        setStartDate(date);
        setActiveQuickRange(null);
        // End must always be strictly greater than start — drop end if it isn't.
        if (date && endDate && endDate <= date) {
            setEndDate(null);
            updateConfirm(date, null);
        } else {
            updateConfirm(date, endDate);
        }
    };

    const handleEndChange = (date) => {
        setEndDate(date);
        setActiveQuickRange(null);
        updateConfirm(startDate, date);
    };

    // End picker must start at start + 1 day (strictly greater).
    const minEndDate = startDate
        ? new Date(startDate.getTime() + 86400000)
        : undefined;

    const toggleStart = () => {
        setEndOpen(false);
        setStartOpen((prev) => !prev);
    };

    const toggleEnd = () => {
        setStartOpen(false);
        setEndOpen((prev) => !prev);
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
                                    setStartDate(null);
                                    setEndDate(null);
                                    setActiveQuickRange(null);
                                    setShowConfirm(false);
                                    setConfirmText("");
                                    setConfirmDays("");
                                    setIncidentAuditingFiles([]);
                                }}
                            >
                                <GoArrowLeft size={18} />
                                Back
                            </button>
                        )}

                        {(currentUserRole === "admin" || currentUserRole === "owner") && (
                            <div className="ia-header-bar ia-header-bar-dashboard">
                                <div className="ia-header-left" />
                                <div className="ia-header-right">
                                    <button
                                        type="button"
                                        className="ia-access-mgmt-btn"
                                        onClick={() => setOpenAccessManagement(true)}
                                    >
                                        <RiSettingsLine size={18} />
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
                                <span className="ia-filters-card-hint">
                                    {syncEnabled
                                        ? "Required when Sync is enabled"
                                        : "Select a date range to filter incident reports"}
                                </span>
                            </div>

                            <div className="ia-v2-date-grid">
                                <div className="ia-v2-date-col">
                                    <label className="ia-v2-date-label">Start Date</label>
                                    <DatePicker
                                        locale="en-GB"
                                        selected={startDate}
                                        onChange={(date) => {
                                            handleStartChange(date);
                                            setStartOpen(false);
                                        }}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="dd-mm-yyyy"
                                        showPopperArrow={false}
                                        popperPlacement="bottom-start"
                                        portalId="ia-datepicker-portal"
                                        open={startOpen}
                                        customInput={
                                            <DateFieldInput
                                                isOpen={startOpen}
                                                hasValue={!!startDate}
                                                placeholder="dd-mm-yyyy"
                                                onToggle={toggleStart}
                                            />
                                        }
                                    />
                                </div>

                                <div className="ia-v2-arrow">→</div>

                                <div className="ia-v2-date-col">
                                    <label className="ia-v2-date-label">End Date</label>
                                    <DatePicker
                                        locale="en-GB"
                                        selected={endDate}
                                        onChange={(date) => {
                                            handleEndChange(date);
                                            setEndOpen(false);
                                        }}
                                        minDate={minEndDate}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="dd-mm-yyyy"
                                        showPopperArrow={false}
                                        popperPlacement="bottom-start"
                                        portalId="ia-datepicker-portal"
                                        open={endOpen}
                                        customInput={
                                            <DateFieldInput
                                                isOpen={endOpen}
                                                hasValue={!!endDate}
                                                placeholder="dd-mm-yyyy"
                                                onToggle={toggleEnd}
                                            />
                                        }
                                    />
                                </div>
                            </div>

                            <div className="ia-v2-quick-row">
                                <span className="ia-v2-quick-label">Quick Range</span>
                                {QUICK_RANGES.map(({ label, days }) => (
                                    <button
                                        key={days}
                                        type="button"
                                        className={`ia-v2-pill${
                                            activeQuickRange === days ? " active" : ""
                                        }`}
                                        onClick={() => handleQuickRange(days)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {showConfirm && (
                                <div className="ia-v2-confirm show">
                                    <svg
                                        className="ia-v2-confirm-icon"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <span className="ia-v2-confirm-text">{confirmText}</span>
                                    <span className="ia-v2-confirm-days">{confirmDays}</span>
                                </div>
                            )}
                        </section>

                        {/* Upload section — mirrors the new Financial module
                            upload: a single clean dashed drop area
                            (.data-upload-card), no extra glass wrapper or
                            nested frame. */}
                        <section
                            className={`ia-upload-section ${
                                syncEnabled ? "ia-upload-section-disabled" : ""
                            }`}
                        >
                            <TlcUploadBox
                                id="incident-auditing-files"
                                title="Upload Incident Reports"
                                subtitle=".XLSX, .CSV, .XLS, .PDF, .DOC"
                                accept=".xlsx,.csv,.xls,.pdf,.doc"
                                files={incidentAuditingFiles}
                                setFiles={setIncidentAuditingFiles}
                                multiple
                            />
                            {syncEnabled && (
                                <span className="ia-upload-disabled-hint">
                                    Disabled while Sync is on
                                </span>
                            )}
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
                    onDeleted={() => {
                        setOpenAccessManagement(false);
                        refetchOrg();
                    }}
                    onNoOrgDetected={() => {
                        setOpenAccessManagement(false);
                        forceNoOrg();
                    }}
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
