import React, { useEffect, useState } from "react";
import "../../../Styles/RosterDetails.css";
import PersonalInformationIcon from '../../../Images/PersonalInformation.png';
import ContactIcon from '../../../Images/ContactNameicon.png';
import SuccessCheck from '../../../Images/SuccessCheck.png';
import { GoHistory, GoArrowLeft } from "react-icons/go";
import axios from "axios";
import clockCircleIcon from "../../../Images/clock circle.png"
import clickHandIcon from "../../../Images/clock hand.png"
import star_icon from "../../../Images/rostering_star.png"
const RosterDetails = ({ setScreen, rosteringResponse, API_BASE, selectedClient, visualCareCreds, userEmail, SetIsSmartRosteringDetails, bulkQueue, setBulkQueue,
    bulkResults,
    setBulkResults,
    activeTab,
    setActiveTab,
    handleClientClickBulk }) => {
    const [currentBulkResponse, setCurrentBulkResponse] = useState(null);
    useEffect(() => {
        if (!bulkQueue?.length) return;

        bulkQueue.forEach((item) => {
            const id = item.id;

            // already completed → skip
            if (bulkResults[id]?.status === "completed") return;

            // mark processing
            setBulkResults(prev => ({
                ...prev,
                [id]: { status: "processing" }
            }));

            // 🔥 PARALLEL API CALL
            handleClientClickBulk(item.client)
                .then(data => {
                    setBulkResults(prev => ({
                        ...prev,
                        [id]: {
                            status: "completed",
                            data
                        }
                    }));
                })
                .catch(() => {
                    setBulkResults(prev => ({
                        ...prev,
                        [id]: { status: "error" }
                    }));
                });
        });
    }, [bulkQueue]);
    useEffect(() => {
        if (!bulkQueue) return;
         if (bulkQueue.length === 0 && activeTab !== null) {
            setActiveTab(null);
            setCurrentBulkResponse(null);
            setBulkResults({});
            setSelected([]);

            setScreen(1); 
        }
    }, [bulkQueue]);


    console.log("rosteringResponse", rosteringResponse);
    console.log("selectedClient", selectedClient)

    const [selected, setSelected] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [broadcasting, setBroadcasting] = useState(false);
    const [timesheetHistory, setTimesheetHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showClashing, setShowClashing] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [refining, setRefining] = useState(false);
    const [refinedStaff, setRefinedStaff] = useState([]);
    const [rankedStaffState, setRankedStaffState] = useState([]);
    const effectiveResponse =
        bulkQueue?.length
            ? bulkResults[activeTab]?.data || {}
            : rosteringResponse || {};

    const activeClient =
        bulkQueue?.length && activeTab
            ? bulkQueue.find(q => q.id === activeTab)?.client ?? null
            : selectedClient ?? null;

    const clashingList = effectiveResponse?.preffered_worker_clashing_roster || [];
    useEffect(() => {
        if (typeof SetIsSmartRosteringDetails === "function") {
            SetIsSmartRosteringDetails(true);
        }

        return () => {
            if (typeof SetIsSmartRosteringDetails === "function") {
                SetIsSmartRosteringDetails(false);
            }
        };
    }, []);
    const formatDateDMY = (dateStr) => {
        if (!dateStr) return "";

        // expect YYYY-MM-DD
        const [year, month, day] = dateStr.split("-");
        if (!year || !month || !day) return dateStr;

        return `${day}-${month}-${year}`;
    };
    const normalizeInPhone = (input) => {
        if (!input || typeof input !== "string") return null;

        // 1. Remove all non-digit characters
        let digits = input.replace(/\D/g, "");

        // 2. Remove leading country code (91)
        if (digits.startsWith("91")) {
            digits = digits.slice(2);
        }

        // 3. Remove leading zero (some numbers start with 0)
        if (digits.startsWith("0")) {
            digits = digits.slice(1);
        }

        // 4. Validate Indian mobile number length (10 digits)
        if (digits.length !== 10) {
            console.warn("Invalid IN phone number:", input);
            return null;
        }

        // 5. Indian mobile numbers start with 6,7,8,9
        if (!/^[6-9]/.test(digits)) {
            console.warn("Invalid IN mobile prefix:", input);
            return null;
        }
        console.log(`normalized Indian number +91${digits}`)
        // 6. Return E.164 format
        return `+91${digits}`;
    };

    const normalizeAuPhone = (input) => {
        if (!input || typeof input !== "string") return null;

        // 1. Remove all non-digit characters
        let digits = input.replace(/\D/g, "");

        // 2. Remove leading country code variants
        if (digits.startsWith("61")) {
            digits = digits.slice(2);
        }

        // 3. Remove leading zero (mobile numbers start with 04)
        if (digits.startsWith("0")) {
            digits = digits.slice(1);
        }

        // 4. Validate mobile number length (9 digits after removing 0)
        if (digits.length !== 9) {
            console.warn("Invalid AU phone number:", input);
            return null;
        }

        // 5. Return E.164 format
        return `+61${digits}`;
    };
    const formatDateTime = (isoString) => {
        if (!isoString) return "N/A";

        const date = new Date(isoString);

        const options = {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
        };

        return date.toLocaleString("en-AU", options);
    };

    const isFillerResponse = effectiveResponse?.filler;

    const isManualResponse =
        effectiveResponse?.parsed_client_profile &&
        effectiveResponse?.final_ranked &&
        !effectiveResponse?.data;

    // CLIENT
    let client = {};
    if (isFillerResponse) {
        client = effectiveResponse?.filler?.match?.matched_record || {};
    } else if (isManualResponse) {
        client = {
            client_name: effectiveResponse?.parsed_client_profile?.client_name || "Unknown",
            required_skills: effectiveResponse?.parsed_client_profile?.required_skills || [],
            gender: effectiveResponse?.parsed_client_profile?.preferences?.gender || "any"
        };
    } else {
        client = effectiveResponse?.data?.client || {};
    }

    // STAFF
    let rankedStaff = [];
    if (isFillerResponse) {
        rankedStaff = effectiveResponse?.rostering_summary?.final_ranked || [];
    } else if (isManualResponse) {
        rankedStaff = effectiveResponse?.final_ranked || [];
    } else {
        rankedStaff = effectiveResponse?.data?.final_ranked || [];
    }
    useEffect(() => {
        setRankedStaffState(rankedStaff);
    }, [effectiveResponse, activeTab]);

    // REQUEST
    let request = {};
    if (isFillerResponse) {
        request = effectiveResponse?.filler?.llm?.inputs || {};
    } else if (isManualResponse) {
        request = {
            shift_date: effectiveResponse?.parsed_shift?.date || null,
            start_time: effectiveResponse?.parsed_shift?.start_time || null,
            duration_minutes: effectiveResponse?.parsed_shift?.duration_minutes || 0
        };
    } else {
        request = effectiveResponse?.data?.request || {};
    }
    const handleSelect = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter((s) => s !== id));
        } else {
            if (selected.length < 5) {
                setSelected([...selected, id]);
            } else {
                alert("You can select up to 5 staff only.");
            }
        }
    };
    const handleBroadcast = async () => {
        if (selected.length === 0) {
            alert("Please select at least one staff to broadcast.");
            return;
        }

        setBroadcasting(true);

        try {
            // Get selected staff from rankedStaff
            const selectedStaff = selected.map(index => rankedStaff[index]);
            // console.log("selectedStaff", selectedStaff)
            const payload = {
                clientData: {
                    // ✔ Correct client ID
                    ClientId: isManualResponse ? Date.now() : activeClient?.clientId,

                    // ✔ Correct name
                    PreferredName: activeClient?.name,
                    FirstName: activeClient?.name,

                    // ✔ Gender
                    Gender: activeClient?.sex,

                    // ✔ DOB (not available → null)
                    DateOfBirth: activeClient?.dob || null,

                    // ✔ Phone
                    Phone: normalizeAuPhone(activeClient?.phone),
                    Address1: activeClient?.address || "",
                    Address2: "",

                    Suburb: "",
                    State: "",
                    PostCode: "",

                    // ✔ Skills
                    prefSkillsDescription: activeClient?.prefSkillsDescription || [],

                    // ✔ Use selectedClient startTime + minutes
                    startTime: activeClient?.startTime,
                    minutes: parseInt(activeClient?.minutes) || request.minutes,
                },

                staffList: selectedStaff.map(s => ({
                    staffId: s.id || s.staffId,
                    name: s.name,
                    phone: userEmail === "kris@curki.ai" ? normalizeAuPhone("419 015 351") : normalizeAuPhone(s?.phone),
                    email: s.email,
                    gender: s.gender || s.sex,
                    location: s.location,
                    skills: s.skills,
                    award: s.award_desc,
                    experience_years: s.experience_years,
                    languages: s.languages,
                    role_description: s.role_description,
                    reason: s.reason,
                    role: "SW",
                    DateOfService: activeClient?.dateOfService
                })),

                rosteringManagers: [
                    {
                        name: "Rostering Manager",
                        email: userEmail,
                        role: "RM"
                    }
                ]
            };



            console.log("Broadcast Payload:", payload);

            const response = await axios.post(`${API_BASE}/api/sampleBroadcast`, payload);

            setShowSuccess(true);

        } catch (error) {
            console.error("Error broadcasting:", error);
            alert("Failed to broadcast messages. Try again.");
        } finally {
            setBroadcasting(false);
        }
    };
    const handleRefine = async () => {
        if (!prompt.trim()) {
            alert("Please enter a prompt.");
            return;
        }

        const main = effectiveResponse?.rosteringMainResponse;
        if (!main) {
            alert("No rostering main response found.");
            return;
        }

        const { candidates_enriched, final_ranked, client } = main;

        const payload = {
            payload: {
                candidates_enriched,
                final_ranked,
                client,
                prompt
            }
        };

        try {
            setRefining(true);
            const response = await axios.post(`${API_BASE}/rostering-refine`, payload);

            if (response.data?.success) {
                const refined = response.data.refinement.final_ranked;

                if (Array.isArray(refined)) {
                    setRankedStaffState(refined);
                    setRefinedStaff([]);
                    setSelected([]);
                }

            }
        } catch (err) {
            console.error("Refinement API Error:", err);
            alert("Refinement failed.");
        } finally {
            setRefining(false);
        }
    };


    // Helper function to format address
    const formatAddress = () => {
        if (client.Address1) {
            return `${client.Address1}${client.Address2 ? ', ' + client.Address2 : ''}, ${client.Suburb}, ${client.State} ${client.PostCode}`;
        }
        if (client.address) {
            return typeof client.address === 'string'
                ? client.address
                : `${client.address.street_number} ${client.address.street}, ${client.address.suburb}, ${client.address.state} ${client.address.postcode}, ${client.address.country}`;
        }
        return activeClient?.address || 'N/A';
    };
    // console.log(selectedClient)
    useEffect(() => {
        if (!isManualResponse) return;

        let allRecords = effectiveResponse?.history || [];
        allRecords = allRecords
            .sort((a, b) => new Date(b.date_of_service) - new Date(a.date_of_service))
            .slice(0, 10);

        setTimesheetHistory(allRecords);
    }, [isManualResponse, effectiveResponse]);

    useEffect(() => {
        const fetchTimesheetHistory = async () => {
            if (!activeClient || !visualCareCreds) return;
            if (isManualResponse) return;
            setLoadingHistory(true);
            try {
                //Dynamic date range (last 10 days)
                const today = new Date();
                const tenDaysAgo = new Date(today);
                tenDaysAgo.setDate(today.getDate() - 10);

                // Format as YYYY-MM-DD
                const formatDate = (date) => date.toISOString().split("T")[0];
                const fromDate = formatDate(tenDaysAgo);
                const toDate = formatDate(today);

                const { user, key, secret } = visualCareCreds;

                const res = await axios.get(`${API_BASE}/api/getTimesheets`, {
                    params: { user, key, secret, fromDate, toDate },
                });

                if (res.data?.success) {
                    // Normalize data
                    let allRecords = Array.isArray(res.data.data)
                        ? res.data.data
                        : res.data.data?.items || [];

                    // Sort by date (descending) and take latest 10
                    allRecords = allRecords
                        .sort((a, b) => new Date(b.DateOfService) - new Date(a.DateOfService))
                        .slice(0, 10);

                    setTimesheetHistory(allRecords);
                } else {
                    console.warn("⚠️ No timesheet data returned:", res.data);
                    setTimesheetHistory([]);
                }
            } catch (err) {
                console.error("❌ Error fetching timesheet history:", err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchTimesheetHistory();
    }, [activeClient, visualCareCreds]);
    useEffect(() => {
        setSelected([]);
    }, [activeTab]);
    console.log("rankedStaff length", rankedStaff?.length)
    const ClockIcon = () => (
        <div
            style={{
                position: "relative",
                width: "14px", // 🔹 smaller icon size
                height: "14px",
                marginRight: "6px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <img
                src={clockCircleIcon}
                alt="Clock Circle"
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                }}
            />
            <img
                src={clickHandIcon}
                alt="Clock Hand"
                style={{
                    position: "absolute",
                    width: "55%",
                    height: "55%",
                    objectFit: "contain",
                    marginLeft: "2px",
                    marginBottom: "1px",
                }}
            />
        </div>
    );
    return (
        <div className="roster-page">
            <div
                className="roster-back-btn"
                onClick={() => {
                    if (typeof SetIsSmartRosteringDetails === "function") {
                        SetIsSmartRosteringDetails(false);
                    }

                    setCurrentBulkResponse(null);
                    setActiveTab(null);
                    setBulkResults({});
                    setSelected([]);

                    setScreen(1);
                }}
            >
                <GoArrowLeft size={22} color="#6C4CDC" />
                <span>Back</span>
            </div>
            {bulkQueue?.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        {bulkQueue.map(q => {
                            const status = bulkResults[q.id]?.status;
                            const isProcessing = status === "processing";

                            return (
                                <div
                                    key={q.id}
                                    onClick={() => setActiveTab(q.id)}
                                    className={`bulk-tab ${activeTab === q.id ? "active" : ""}`}
                                >
                                    <span>{q.client.name}</span>

                                    {/* loader inside tab */}
                                    {isProcessing && <span className="tab-loader" />}

                                    {/* cross button */}
                                    <span
                                        className="tab-close"
                                        onClick={(e) => {
                                            e.stopPropagation();

                                            setBulkQueue(prev => prev.filter(x => x.id !== q.id));
                                            setBulkResults(prev => {
                                                const copy = { ...prev };
                                                delete copy[q.id];
                                                return copy;
                                            });

                                            if (activeTab === q.id) {
                                                const remaining = bulkQueue.filter(x => x.id !== q.id);
                                                setActiveTab(remaining[0]?.id || null);
                                            }
                                        }}
                                    >
                                        ×
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            {/* Layout wrapper */}
            <div className="roster-layout">
                {/* Personal Information */}
                <div className="roster-personal-info">
                    <div className="roster-peronal-img-h">
                        <img
                            src={PersonalInformationIcon}
                            alt="personalInformation"
                            style={{ width: '40px', marginRight: '14px' }}
                        />
                        <h3 className="roster-section-title">Personal Information</h3>
                    </div>

                    <div className="roster-info-grid">
                        <div style={{ display: 'flex', paddingLeft: '54px', gap: '42px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E4' }}>
                            <p>ID: <span style={{ color: 'black' }}>
                                {client.ClientId || client.id || activeClient?.clientId || request.client_id || 'N/A'}
                            </span></p>
                            <p>Name: <span style={{ color: 'black' }}>
                                {client.PreferredName || client.FirstName || client.client_name || activeClient?.name || request.client_name || 'N/A'}
                            </span></p>
                            <p>DOB: <span style={{ color: 'black' }}>
                                {client.DateOfBirth || client.dob || 'N/A'}
                            </span></p>
                            <p>Gender: <span style={{ color: 'black' }}>
                                {client.Gender || client.gender || activeClient?.sex || 'N/A'}
                            </span></p>
                        </div>
                        <div style={{ display: 'flex', paddingLeft: '54px', gap: '42px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E4' }}>
                            <p>Phone: <span style={{ color: 'black' }}>
                                {client.Phone1 || client.phone || activeClient?.phone || 'N/A'}
                            </span></p>
                            <p>Plan Start Date: <span style={{ color: 'black' }}>
                                {client.ServiceStart || client.plan_start_date || request.shift_date || 'N/A'}
                            </span></p>

                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', paddingLeft: '54px', gap: '42px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E4' }}>
                            <p>Shift Date: <span style={{ color: 'black' }}>
                                {formatDateDMY(activeClient?.dateOfService)}
                            </span></p>
                            <p>Start Time: <span style={{ color: 'black' }}>
                                {activeClient?.startTime}
                            </span></p>
                            <p>End Time: <span style={{ color: 'black' }}>
                                {activeClient?.endTime}
                            </span></p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', paddingLeft: '54px', gap: '42px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E4' }}>
                            <p>Address: <span style={{ color: 'black' }}>
                                {formatAddress()}
                            </span></p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', paddingLeft: '54px', gap: '42px', paddingTop: '20px', paddingBottom: '20px', borderBottom: '1px solid #E4E4E4', textAlign: 'left' }}>
                            <p>Skills: <span style={{ color: 'black' }}>
                                {activeClient?.prefSkillsDescription?.join(', ')}
                            </span></p>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="roster-history">
                    <div className="history-icon-h">
                        <GoHistory size={28} color="#6C4CDC" style={{ marginRight: '14px' }} />
                        <h3 className="roster-section-title">History</h3>
                    </div>

                    <div>
                        {loadingHistory ? (
                            <p style={{ padding: '20px', color: '#666' }}>Loading timesheet history...</p>
                        ) : timesheetHistory.length > 0 ? (
                            timesheetHistory.map((item, index) => (
                                <div className="history-card-roster" key={index}>
                                    <img
                                        src={ContactIcon}
                                        alt="contactIcon"
                                        style={{ width: '24px', marginRight: '14px' }}
                                    />
                                    <div>
                                        <p className="staff-details">
                                            <strong>Date of Service:</strong>{' '}
                                            <span style={{ color: 'black' }}>
                                                {item.DateOfService || item?.date_of_service || 'N/A'}
                                            </span>
                                        </p>
                                        <p className="staff-details">
                                            <strong>Worker Name:</strong>{' '}
                                            <span style={{ color: 'black' }}>
                                                {item.WorkerName || item?.worker_name || 'N/A'}
                                            </span>
                                        </p>
                                        <p className="staff-details">
                                            <strong>Minutes:</strong>{' '}
                                            <span style={{ color: 'black' }}>
                                                {item.Minutes || item?.minutes || 'N/A'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ padding: '20px', color: '#666', fontSize: '14px' }}>
                                No recent timesheet records found.
                            </p>
                        )}
                    </div>
                </div>

            </div>

            {/* Available Staff */}
            <div className="roster-staff-section">
                <h3
                    className="roster-section-title"
                    style={{ textAlign: "left", marginBottom: "20px" }}
                >
                    Available Staff
                </h3>

                {rankedStaffState.length > 0 ? (
                    <div className="roster-staff-cards">
                        {rankedStaffState.map((staff, index) => (
                            <div
                                key={index}
                                className={`roster-staff-card ${selected.includes(index) ? "roster-selected" : ""
                                    }`}
                                onClick={() => handleSelect(index)}
                            >
                                {/* Header with Rank & Name */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div className="roster-staff-number">{index + 1}</div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                                        <div
                                            style={{ fontSize: "15px", fontWeight: "600", color: "black" }}
                                        >
                                            {staff.name || "Unknown"}
                                        </div>

                                        {staff.preferred === "true" && (
                                            <img
                                                src={star_icon}
                                                alt="Preferred"
                                                style={{ width: "18px", height: "18px" }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Overtime / Elimination */}
                                {(staff.overtime_hours > 0 || staff.eliminated_reason?.[0]) && (
                                    <div
                                        style={{
                                            padding: "8px",
                                            background: "#f9f7ff",
                                            borderRadius: "6px",
                                            borderLeft: "3px solid #6C4CDC",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        {staff.overtime_hours > 0 && (
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <ClockIcon />
                                                <p
                                                    className="staff-details"
                                                    style={{ fontSize: "13px", margin: 0 }}
                                                >
                                                    <strong>Overtime Hours:</strong>{" "}
                                                    <span style={{ color: "black" }}>
                                                        {staff.overtime_hours}
                                                    </span>
                                                </p>
                                            </div>
                                        )}

                                        {staff.eliminated_reason?.[0] && (
                                            <p
                                                className="staff-details"
                                                style={{ fontSize: "13px", margin: 0 }}
                                            >
                                                <strong>Overtime Reason:</strong>{" "}
                                                {staff.eliminated_reason[0]}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Details */}
                                <p className="staff-details">
                                    Score:{" "}
                                    <span style={{ color: "#6C4CDC", fontWeight: 700 }}>
                                        {staff.score || "N/A"}
                                    </span>
                                </p>

                                <p className="staff-details">
                                    Gender:{" "}
                                    <span style={{ color: "black" }}>
                                        {staff.sex || staff.gender || "N/A"}
                                    </span>
                                </p>

                                <p className="staff-details">
                                    Phone: <span style={{ color: "black" }}>{staff.phone || "N/A"}</span>
                                </p>

                                <p className="staff-details">
                                    Email: <span style={{ color: "black" }}>{staff.email || "N/A"}</span>
                                </p>

                                <p className="staff-details">
                                    Languages:{" "}
                                    <span style={{ color: "black" }}>
                                        {staff.languages || "N/A"}
                                    </span>
                                </p>

                                {isManualResponse && (
                                    <p className="staff-details">
                                        Experience:{" "}
                                        <span style={{ color: "black" }}>
                                            {staff.experience_years != null
                                                ? `${staff.experience_years} years`
                                                : "N/A"}
                                        </span>
                                    </p>
                                )}

                                <p className="staff-details">
                                    Role:{" "}
                                    <span style={{ color: "black" }}>
                                        {Array.isArray(staff.roles)
                                            ? staff.roles.join(", ")
                                            : staff.roles || staff.role || "N/A"}
                                    </span>
                                </p>

                                {staff.award_desc && (
                                    <p className="staff-details" style={{ fontSize: "13px" }}>
                                        Award:{" "}
                                        <span style={{ color: "black" }}>{staff.award_desc}</span>
                                    </p>
                                )}

                                {staff?.location?.address && (
                                    <p className="staff-details">
                                        Location:{" "}
                                        <span style={{ color: "black" }}>
                                            {staff.location.address}
                                        </span>
                                    </p>
                                )}

                                {staff?.skills?.length > 0 && (
                                    <div style={{ marginTop: "10px" }}>
                                        <p className="staff-details" style={{ fontWeight: 600 }}>
                                            Skills:
                                        </p>
                                        <ul style={{ paddingLeft: "20px", margin: 0 }}>
                                            {staff.skills.map((skill, idx) => (
                                                <li key={idx} style={{ fontSize: "12px", color: "#555" }}>
                                                    {skill}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {staff.reason && (
                                    <p
                                        className="staff-details"
                                        style={{
                                            marginTop: "12px",
                                            padding: "8px",
                                            background: "#f9f7ff",
                                            borderLeft: "3px solid #6C4CDC",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                        }}
                                    >
                                        <strong>Why this staff?</strong>{" "}
                                        <span style={{ color: "black" }}>{staff.reason}</span>
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : bulkResults[activeTab]?.status === "processing" ? (
                    <div className="center-loader">
                        <div className="big-loader" />
                    </div>
                ) : (
                    <p>No staff available for this shift.</p>
                )}
            </div>

            {/* Preferred Worker Clashing Roster */}
            {clashingList.length > 0 && (
                <div className="clashing-container">

                    {/* Header Row */}
                    <div
                        className="clashing-header"
                        onClick={() => setShowClashing(!showClashing)}
                    >
                        <h3 className="clashing-title">
                            Preferred Worker – Clashing Roster
                        </h3>

                        <span className="clashing-toggle">
                            {showClashing ? "−" : "+"}
                        </span>
                    </div>

                    {/* Expandable List */}
                    {showClashing && (
                        <div className="clashing-list">
                            {clashingList.map((item, index) => (
                                <div className="clashing-item" key={index}>
                                    <p className="clashing-text">
                                        <strong>Worker:</strong> {item.worker_name}
                                    </p>
                                    <p className="clashing-text">
                                        <strong>Client ID:</strong> {item.client_id}
                                    </p>
                                    <p className="clashing-text">
                                        <strong>Start:</strong> {formatDateTime(item.start)}
                                    </p>
                                    <p className="clashing-text">
                                        <strong>End:</strong> {formatDateTime(item.end)}
                                    </p>
                                    <p className="clashing-text">
                                        <strong>Status:</strong> {item.status}
                                    </p>
                                    <p className="clashing-text">
                                        <strong>Minutes:</strong> {item.Minutes}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            <div className="refine-container">
                <label className="refine-label">
                    Refine Staff Suggestions:
                </label>

                <textarea
                    className="refine-textarea"
                    placeholder="Enter your refinement prompt… (e.g. 'Give me only female workers')"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />

                <button
                    className="refine-btn"
                    onClick={handleRefine}
                    disabled={refining}
                >
                    {refining ? "Refining…" : "Refine Results"}
                </button>
            </div>

            {/* Broadcast Button */}
            <button
                className="roster-broadcast-btn"
                onClick={handleBroadcast}
                disabled={broadcasting}
            >
                {broadcasting ? "Broadcasting..." : "Broadcast SMS to Staff"}
            </button>

            {showSuccess && (
                <div className="success-overlay">
                    <div className="success-card">
                        <img src={SuccessCheck} alt="success" className="success-img" />
                        <p>Messages sent successfully!</p>
                        <button className="done-btn" onClick={() => {
                            if (bulkQueue?.length > 0) {
                                setShowSuccess(false);
                            } else {
                                setScreen(1);
                            }
                        }}>
                            <GoArrowLeft size={24} color="white" style={{ marginLeft: '6px' }} /> Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RosterDetails;

