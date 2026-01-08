import React, { useState, useRef, useMemo, useEffect } from "react";
import "../../../Styles/RosterHistory.css";
import { FiUser, FiMapPin, FiPhone } from "react-icons/fi";
import { GoArrowLeft } from "react-icons/go";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { AiFillClockCircle } from "react-icons/ai";
import { LuBriefcaseBusiness } from "react-icons/lu";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import axios from "axios";

const API_BASE = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

const RosterHistory = (props) => {
    const userEmail = props?.userEmail
    // const userEmail = "kris@curki.ai"
    // === state kept as original
    const [selected, setSelected] = useState(null);
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [openPanel, setOpenPanel] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [open, setOpen] = useState(false);
    const messageEndRef = useRef(null);

    const scrollRef = useRef(null);

    // we keep the same variable names as original *but* fill them dynamically
    const [dummyClients, setDummyClients] = useState([]); // will hold clients in old shape
    const [assignmentsData, setAssignmentsData] = useState([]); // will hold assignment objects in old shape
    const [messages, setMessages] = useState([]); // chat messages in old shape

    // === Load clients from API and map to old structure (id, name, address, phone)
    const maskDetailsIfKris = (value, type) => {
        const isKris = userEmail?.toLowerCase() === "kris@curki.ai";
        if (!isKris) return value;

        if (type === "name") {
            return "Client User";
        }

        if (type === "address") {
            return "Address Hidden";
        }

        if (type === "phone") {
            return "Hidden";
        }

        if (type === "email") {
            return "hidden@domain.com";
        }

        return value;
    };

    useEffect(() => {
        if (typeof props.SetIsSmartRosteringHistory === "function") {
            props.SetIsSmartRosteringHistory(true);
        }

        return () => {
            if (typeof props.SetIsSmartRosteringHistory === "function") {
                props.SetIsSmartRosteringHistory(false);
            }
        };
    }, []);

    useEffect(() => {
        const fetchClients = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/getAllClientsHistory?rmEmail=${userEmail}`);
                const clients = res.data.clients || [];

                // Map API clients -> old dummyClients shape
                const mapped = clients.map(c => ({
                    id: c.clientId,
                    name: c.clientName,
                    address: (() => {
                        const addr = c.clientAddress;
                        if (!addr || typeof addr !== "object") return "N/A";

                        const parts = [
                            addr.address1,
                            addr.address2,
                            addr.suburb,
                            addr.state,
                            addr.postcode
                        ].filter(Boolean);

                        return parts.length ? parts.join(", ") : "N/A";
                    })(),

                    phone: c.clientPhone || "N/A",
                    // keep original for future use
                    __raw: c
                }));
                console.log("mapped", mapped)
                setDummyClients(mapped);
            } catch (err) {
                console.error("Failed to fetch clients:", err);
            }
        };

        fetchClients();
    }, []);

    // === helper: format time range similar to earlier logic
    const formatTimeRange = (record) => {
        try {
            const isValidDate = (d) => d instanceof Date && !isNaN(d);

            const baseDate = record.createdAt
                ? record.createdAt.split("T")[0]
                : new Date().toISOString().split("T")[0];

            let start;

            if (record.startTime && record.startTime.length <= 5) {
                start = new Date(`${baseDate}T${record.startTime}:00`);
            } else if (record.startTime) {
                start = new Date(record.startTime);
            } else {
                start = new Date(record.createdAt || Date.now());
            }

            const minutes = Number(record.minutes) || 0;
            const end = minutes > 0 ? new Date(start.getTime() + minutes * 60000) : null;

            const fmt = d =>
                isValidDate(d)
                    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "Not Mentioned";

            return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
        } catch (e) {
            return "Not Mentioned";
        }
    };


    // === When a client is selected: fetch their full history and build assignmentsData exactly like old structure
    const fetchClientHistory = async (clientId) => {
        try {
            const res = await axios.get(`${API_BASE}/api/getClientHistory/${clientId}?rmEmail=${userEmail}`);
            const history = res.data.history || [];
            // console.log("history", history)
            // Build assignments array in old shape
            const built = [];
            history.forEach(record => {
                const baseDate = record.createdAt ? record.createdAt.split("T")[0] : new Date().toISOString().split("T")[0];
                const timeStr = formatTimeRange(record);

                (record.staffMembers || []).forEach(staff => {
                    let status;

                    //RM accepted
                    if (staff.status === "accepted" && staff.managerApproved === true) {
                        status = "accepted";
                    }

                    //RM rejected
                    else if (staff.status === "rejected" && staff.rejectedByRM === true) {
                        status = "rejected";
                    }

                    //Staff Y / Staff N / Pending → waiting
                    else {
                        status = "waiting";
                    }



                    // compute day/dayName/monthName as old UI expects these to appear
                    const d = new Date(baseDate);
                    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
                    const monthName = d.toLocaleString("default", { month: "long" });

                    built.push({
                        clientId: record.clientId,
                        date: baseDate,
                        carer: staff.name || "Unknown",
                        time: timeStr,
                        status,
                        // preserve original for details
                        originalRecord: record,
                        originalStaffObject: staff,
                        // old UI date pieces:
                        dayName,
                        day: d.getDate(),
                        monthName
                    });
                });
            });

            setAssignmentsData(built);
            // Also set messages empty for now — chat loads when user opens assignment
            setMessages([]);
        } catch (err) {
            console.error("Failed to fetch client history:", err);
        }
    };

    // === fetch chat messages for chosen assignment and map to old message shape
    const fetchChatMessages = async (recordId, staffId, phone) => {
        try {
            // Backend conversation ID format:
            // conversationId = `${recordId}-${staffId}`
            const conversationId = `${recordId}`;

            // console.log("Fetching conversation:", conversationId);

            const res = await axios.get(`${API_BASE}/api/getChatHistory/${conversationId}`);

            const messagesArr = res.data.messages || [];
            // console.log("Raw messagesArr:", messagesArr);
            // Convert to UI format
            const msgs = messagesArr.map((m, index) => {
                const isBroadcast =
                    m.fromRole === "RM" &&
                    m.toRole === "SW" &&
                    m.message?.toLowerCase().includes("open shift");

                return {
                    id: `${conversationId}-${index}`,
                    text: m.message || "",
                    time: m.time
                        ? new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "",
                    sender: isBroadcast
                        ? "other"
                        : m.fromRole === "RM"
                            ? "me"
                            : "other",

                    rawFromPhone: m.fromPhone,
                    rawToPhone: m.toPhone
                };
            });

            // FILTER NOW
            const staffPhoneClean = (phone || "").replace(/\D/g, "");
            // console.log("msgs before filter", msgs);
            const filtered = msgs.filter(m => {
                const fp = (m.rawFromPhone || "").replace(/\D/g, "");
                const tp = (m.rawToPhone || "").replace(/\D/g, "");

                if (fp === staffPhoneClean) return true;  // staff → RM
                if (tp === staffPhoneClean) return true;  // RM → staff

                return false;
            });
            // console.log("msgs after filter", filtered);
            setMessages(filtered);

            // auto scroll
            if (messageEndRef.current) {
                messageEndRef.current.scrollIntoView({ behavior: "smooth" });
            }

            return msgs;

        } catch (err) {
            console.error("Failed to fetch chat messages:", err);
            setMessages([]);
            return [];
        }
    };




    // === send message (RM) — matches old UI: appends locally after successful POST
    const sendRMMessage = async () => {
        if (!inputValue?.trim() || !selectedAssignment) return;

        try {
            await axios.post(`${API_BASE}/api/chat/send`, {
                recordId: selectedAssignment.originalRecord?.id || selectedAssignment.recordId,
                message: inputValue,
                staffPhone: selectedAssignment.originalStaffObject?.phone || selectedAssignment.staffPhone
            });

            const newMsg = {
                id: Date.now(),
                text: inputValue,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                sender: "me"
            };

            setMessages(prev => [...prev, newMsg]);
            setInputValue("");
            if (messageEndRef.current) messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        } catch (err) {
            console.error("Failed to send RM message:", err);
        }
    };
    console.log("selectedAssignment", selectedAssignment)
    // === approve/reject handlers (call API, update local assignmentsData)
    const approveStaff = async (recordId, staffPhone) => {
        try {
            await axios.post(`${API_BASE}/api/staff/approve`, {
                recordId,
                staffId: selectedAssignment.originalStaffObject.staffId
            });

            setAssignmentsData(prev =>
                prev.map(a =>
                    a.originalStaffObject?.staffId === selectedAssignment.originalStaffObject.staffId
                        ? {
                            ...a,
                            status: "accepted",
                            originalStaffObject: {
                                ...a.originalStaffObject,
                                status: "accepted",
                                managerApproved: true
                            }
                        }
                        : a
                )
            );


            // If the selectedAssignment matches, update it too
            if (selectedAssignment?.originalStaffObject?.staffId === selectedAssignment.originalStaffObject.staffId) {
                setSelectedAssignment(prev => ({
                    ...prev,
                    status: "accepted",
                    originalStaffObject: {
                        ...prev.originalStaffObject,
                        status: "accepted",
                        managerApproved: true
                    }
                }));
            }
        } catch (err) {
            console.error("approveStaff error:", err);
        }
    };

    const rejectStaff = async (recordId, staffPhone) => {
        try {
            await axios.post(`${API_BASE}/api/staff/reject`, {
                recordId,
                staffId: selectedAssignment.originalStaffObject.staffId
            });

            setAssignmentsData(prev =>
                prev.map(a =>
                    a.originalStaffObject?.staffId === selectedAssignment.originalStaffObject.staffId
                        ? {
                            ...a,
                            status: "rejected",
                            originalStaffObject: {
                                ...a.originalStaffObject,
                                status: "rejected",
                                rejectedByRM: true
                            }
                        }
                        : a
                )
            );


            if (selectedAssignment?.originalStaffObject?.staffId === selectedAssignment.originalStaffObject.staffId) {
                setSelectedAssignment(prev => ({
                    ...prev,
                    status: "rejected",
                    originalStaffObject: {
                        ...prev.originalStaffObject,
                        status: "rejected",
                        rejectedByRM: true
                    }
                }));

            }
        } catch (err) {
            console.error("rejectStaff error:", err);
        }
    };

    // === DAYS calculation kept same as old UI
    const days = useMemo(() => {
        const daysInMonth = new Date(year, month, 0).getDate();

        return Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const assignments = assignmentsData.filter(
                a => a.clientId === selected?.id && a.date === dateStr   // FIX HERE
            );

            return {
                dayName: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(year, month - 1, day).getDay()],
                date: day,
                assignments
            };
        });
    }, [selected, month, year, assignmentsData]);


    // auto-scroll to today (same logic)
    useEffect(() => {
        const todayDate = new Date();
        const todayIndex = days.findIndex(
            d =>
                d.date === todayDate.getDate() &&
                month === todayDate.getMonth() + 1 &&
                year === todayDate.getFullYear()
        );

        if (todayIndex !== -1 && scrollRef.current) {
            const scrollAmount = todayIndex * 130;
            scrollRef.current.scrollTo({
                left: scrollAmount,
                behavior: "smooth",
            });
        }
    }, [days]);

    // when selectedAssignment changes, scroll messages to bottom
    useEffect(() => {
        if (messageEndRef.current) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedAssignment, messages]);

    // monthName for header
    const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });

    const handleMonthChange = (e) => {
        const [y, m] = e.target.value.split("-");
        setYear(Number(y));
        setMonth(Number(m));
    };

    // old UI onClient click behavior preserved
    const onClientSelect = async (c) => {
        setSelected(c);
        await fetchClientHistory(c.id);
        // reset panel & messages
        setOpenPanel(false);
        setSelectedAssignment(null);
        setMessages([]);
    };

    // old UI open assignment behavior preserved
    const onOpenAssignment = async (a) => {
        setSelectedAssignment(a);
        setOpenPanel(true);

        const recordId = a.originalRecord?.id;
        const staffId = a.originalStaffObject?.staffId;
        const phone = a.originalStaffObject?.phone;

        await fetchChatMessages(recordId, staffId, phone);
    };


    // Build staffInfoList in same order & same labels as old static file (but using selectedAssignment.originalStaffObject)
    const staffInfoList = [
        {
            label: "Name",
            value: selectedAssignment?.originalStaffObject?.name
        },

        {
            label: "Score",
            value: selectedAssignment?.originalStaffObject?.score ?? 98
        },

        {
            label: "Gender",
            value: selectedAssignment?.originalStaffObject?.gender ?? "Female"
        },

        {
            label: "Email",
            value: selectedAssignment?.originalStaffObject?.email
        },

        {
            label: "Phone",
            value: selectedAssignment?.originalStaffObject?.phone
        },

        {
            label: "Languages",
            value: selectedAssignment?.originalStaffObject?.languages ?? "English"
        },

        {
            label: "Experience",
            value: selectedAssignment?.originalStaffObject?.experience_years ?? "12+"
        },

        {
            label: "Award",
            value: selectedAssignment?.originalStaffObject?.award ?? "N/A"
        },

        {
            label: "Location",
            value:
                (() => {
                    const loc = selectedAssignment?.originalStaffObject?.location;
                    if (!loc) return "Address not available";

                    const parts = [
                        loc.address1,
                        loc.address2,
                        loc.suburb,
                        loc.state,
                        loc.postcode
                    ].filter(Boolean);

                    const fullAddress = parts.join(", ");
                    return fullAddress;
                })()
        },

        {
            label: "Why",
            value: {
                title: "Why this staff?",
                description:
                    selectedAssignment?.originalStaffObject?.reason ??
                    "Reason not provided"
            }
        }
    ];



    console.log("staffInfoList", staffInfoList)
    // input value for chat (kept like original)
    const [inputValue, setInputValue] = useState("");
    console.log("selectedAssignment", selectedAssignment)
    const staffStatus = selectedAssignment?.originalStaffObject?.status;

    const isStaffAccepted = staffStatus === "accepted";
    const isStaffRejected = staffStatus === "rejected";
    const isStaffPending = !staffStatus || staffStatus === "pending";
    const isRMDecided =
        selectedAssignment?.originalStaffObject?.managerApproved === true ||
        selectedAssignment?.originalStaffObject?.rejectedByRM === true;

    return (
        <div className="rostering-history-container">

            <div className="roster-back-btn" onClick={() => {
                if (typeof props.setIsSmartRosteringHistory === "function") {
                    props.SetIsSmartRosteringHistory(false);
                }
                props.setScreen(1);
            }} style={{ left: '30px', top: '-45px' }}>
                <GoArrowLeft size={22} color="#6C4CDC" />
                <span>Back</span>
            </div>

            <div className="rostering-history-sidebar">
                <div style={{ borderBottom: '1px solid #E2E8F1', padding: '18px' }}>
                    <div className="rostering-history-title">Client History</div>
                    <div className="rostering-history-subtitle">{dummyClients.length} Active Clients</div>
                </div>

                <div className="rostering-client-list">
                    {dummyClients.map((c) => (
                        <div
                            key={c.id}
                            className={`rostering-client-card ${selected?.id === c.id ? "rostering-active-client" : ""}`}
                            onClick={() => onClientSelect(c)}
                        >
                            <div style={{ backgroundColor: '#F7FAFF', height: '34px', width: '34px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <FiUser size={22} color='#6c4cdc' />
                            </div>

                            <div style={{ display: 'flex', flexDirection: "column", gap: '8px', marginTop: '6px' }}>
                                <div className="rostering-client-name">{c.name}</div>
                                <div className="rostering-client-info"><FiMapPin /> {c.address}</div>
                                <div className="rostering-client-info"><FiPhone /> {c.phone}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rostering-history-details-panel">
                {!selected ? (
                    <div className="rostering-empty-details">
                        <div style={{ width: '200px', height: '200px', borderRadius: '50%', backgroundColor: '#E2E8F1', display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '-140px', marginBottom: '20px' }}>
                            <FiUser size={110} color="#90A2B9" />
                        </div>
                        <p>Select a client to view staff details</p>
                    </div>
                ) : (
                    <div className="roster-calendar-container">

                        <div className="roster-calendar-header">
                            <h2 className="rostering-detail-title" >{selected.name}</h2>

                            <div style={{ display: "flex", alignItems: "center", gap: "15px", justifyContent: 'space-between' }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", }}>
                                    <FaAngleLeft color="#6c4cdc" onClick={() => (scrollRef.current.scrollLeft -= 350)} style={{ cursor: 'pointer' }} />
                                    <span style={{ fontWeight: 600 }}>{monthName} {year}</span>
                                    <FaAngleRight color="#6c4cdc" onClick={() => (scrollRef.current.scrollLeft += 350)} style={{ cursor: 'pointer' }} />
                                </div>
                                <input
                                    type="month"
                                    value={`${year}-${String(month).padStart(2, "0")}`}
                                    onChange={handleMonthChange}
                                />
                            </div>
                        </div>

                        <div ref={scrollRef} className="roster-days-scroll">
                            {days.map((d, idx) => {
                                const isToday =
                                    d.date === new Date().getDate() &&
                                    month === new Date().getMonth() + 1 &&
                                    year === new Date().getFullYear();

                                return (
                                    <div
                                        key={idx}
                                        className="roster-day-column"
                                        style={{ backgroundColor: isToday ? "#F8FAFB" : "transparent", borderRadius: "8px" }}
                                    >
                                        <div style={{ backgroundColor: "#F8FAFB", padding: "20px 10px", textAlign: "center", }}>
                                            <div style={{ fontWeight: 500, fontSize: 10, color: isToday ? "#6c4cdc" : "#62748E", marginBottom: 2 }}>
                                                {d.dayName}
                                            </div>

                                            <div style={{ fontSize: 16, marginBottom: 10, color: isToday ? "#6c4cdc" : "inherit" }}>
                                                {d.date}
                                            </div>

                                            <div style={{ fontSize: 10, fontWeight: 500, marginBottom: 2, marginTop: 6, color: isToday ? "#6c4cdc" : "#62748E" }}>
                                                {d.assignments.length} Staff
                                            </div>
                                        </div>

                                        <div style={{ padding: "10px", paddingTop: '0px', height: '70vh', overflowY: 'auto', scrollbarWidth: 'none' }}>
                                            {d.assignments.length === 0 ? (
                                                <div style={{ fontSize: 12, marginTop: 30, color: "#9CA3AF" }}>No Assignments</div>
                                            ) : (
                                                d.assignments.map((a, i) => (
                                                    <div
                                                        key={i}
                                                        className={`roster-status-card status-${a.status}`}
                                                        onClick={() => onOpenAssignment(a)}
                                                    >

                                                        <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter', marginBottom: '8px', textAlign: 'left' }}>{a.carer}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '4px', marginBottom: '4px' }}>
                                                            <AiFillClockCircle color="white" />
                                                            <div style={{ fontSize: '14px', textAlign: 'left' }}>{a.time}</div>
                                                        </div>
                                                        <div style={{ fontSize: '12px', marginTop: '10px', borderRadius: '70px', padding: '4px 10px', }} className={`text-${a.status}`}>{a.status}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                        </div>
                        {openPanel && selectedAssignment && (
                            <div className="side-panel-overlay" onClick={() => setOpenPanel(false)}>
                                <div className="side-panel" onClick={(e) => e.stopPropagation()}>

                                    {/* ===== Header ===== */}
                                    <div className={`side-header status-${selectedAssignment.status}`}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                                <LuBriefcaseBusiness size={22} color="white" />
                                                <div style={{ fontSize: '14px', fontWeight: '500', fontFamily: 'Inter' }}>Staff Details</div>
                                            </div>
                                            <button className="close-x" onClick={() => setOpenPanel(false)}>✕</button>
                                        </div>
                                        <div className="panel-top-block">
                                            <h3 className="panel-staff-name">{selectedAssignment.carer}</h3>

                                            <div className={`status-chip chip-${selectedAssignment.status}`}>
                                                {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                                            </div>
                                            <div style={{ textAlign: 'left', fontSize: '12px', fontFamily: 'Inter', fontWeight: '400', color: 'white', marginTop: '6px', marginBottom: '8px' }}>
                                                {selectedAssignment.dayName}, {selectedAssignment.day} {selectedAssignment.monthName}
                                            </div>
                                            <div className="panel-date-time">
                                                <AiFillClockCircle size={12} />
                                                <span>
                                                    {selectedAssignment.time}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ===== Staff Basic Info ===== */}

                                    {/* Divider */}
                                    <div
                                        style={{
                                            borderBottom: '1px solid #ede8f1',
                                            padding: '16px 12px',
                                            backgroundColor: '#F8FAFB',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '16px'
                                        }}
                                    >
                                        {/* ❌ RM already decided → NO buttons */}
                                        {isRMDecided && (
                                            <span style={{ fontWeight: 600, color: '#6B7280' }}>
                                                Decision already taken
                                            </span>
                                        )}

                                        {/* ❌ Staff has not replied */}
                                        {!isRMDecided && isStaffPending && (
                                            <span style={{ color: '#9CA3AF', fontWeight: 500 }}>
                                                Waiting for staff response
                                            </span>
                                        )}

                                        {/* ✅ Staff said YES → show BOTH buttons */}
                                        {!isRMDecided && isStaffAccepted && (
                                            <>
                                                <button
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        fontSize: '13px',
                                                        background: '#E63946',
                                                        color: '#fff',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() =>
                                                        rejectStaff(
                                                            selectedAssignment.originalRecord?.id,
                                                            selectedAssignment.originalStaffObject?.phone
                                                        )
                                                    }
                                                >
                                                    Reject
                                                </button>

                                                <button
                                                    style={{
                                                        padding: '8px 16px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        fontSize: '13px',
                                                        background: '#4CAF50',
                                                        color: '#fff',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() =>
                                                        approveStaff(
                                                            selectedAssignment.originalRecord?.id,
                                                            selectedAssignment.originalStaffObject?.phone
                                                        )
                                                    }
                                                >
                                                    Accept
                                                </button>
                                            </>
                                        )}

                                        {/* ❌ Staff said NO → only Reject */}
                                        {!isRMDecided && isStaffRejected && (
                                            <button
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    fontSize: '13px',
                                                    background: '#E63946',
                                                    color: '#fff',
                                                    cursor: 'pointer'
                                                }}
                                                onClick={() =>
                                                    rejectStaff(
                                                        selectedAssignment.originalRecord?.id,
                                                        selectedAssignment.originalStaffObject?.phone
                                                    )
                                                }
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </div>




                                    {/* ===== WHY STAFF BLOCK ===== */}
                                    <div style={{ padding: '14px' }}>
                                        <div
                                            style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Inter', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', cursor: 'pointer' }}
                                            onClick={() => setOpen(!open)}
                                        >
                                            Staff Information
                                            {open
                                                ? <FaChevronUp color="#6c4cdc" size={14} />
                                                : <FaChevronDown color="#6c4cdc" size={14} />
                                            }
                                        </div>

                                        {open && staffInfoList.map((item, i) => (
                                            item.label === "Why" ? (
                                                <div key={i} style={{ marginTop: 14, background: "#F5F3FF", padding: "12px 14px", borderRadius: 8 }}>
                                                    <h4 style={{ color: "#5A33FF", fontWeight: 700, marginBottom: 6, textAlign: 'left' }}>{item.value.title}</h4>
                                                    <p style={{ fontSize: 13, lineHeight: "20px", color: "#333", textAlign: 'justify' }}>{item.value.description}</p>
                                                </div>
                                            ) : (
                                                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50% 50%', marginBottom: '8px' }}>
                                                    <span style={{ fontWeight: '600', color: "#45556C", fontSize: '14px', fontFamily: 'Inter', textAlign: 'left' }}>{item.label}</span>
                                                    <span style={{ fontWeight: '500', fontSize: '14px', fontFamily: 'Inter', textAlign: 'left' }}>{item.value}</span>
                                                </div>
                                            )
                                        ))}
                                    </div>


                                    {/* ===== CHAT SECTION ===== */}
                                    <div style={{ fontSize: '16px', fontWeight: '500', fontFamily: 'Inter', textAlign: 'left', margin: '8px 14px' }}>Messages</div>
                                    <div className="messages-section">
                                        {messages.map((m) => (
                                            <div key={m.id} className={`msg ${m.sender === "me" ? "you" : ""}`}>
                                                <div className={`msg-bubble ${m.sender === "me" ? "right" : "left"}`}>
                                                    {m.text}
                                                </div>
                                                <div className={`msg-time ${m.sender === "me" ? "rightss" : "leftss"}`}>
                                                    {m.time}
                                                </div>
                                            </div>
                                        ))}

                                        <div ref={messageEndRef}></div>
                                    </div>


                                    {/* input */}
                                    {selectedAssignment.status !== "rejected" &&
                                        <div className="msg-input-container">
                                            <input placeholder="Message..." className="msg-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
                                            <button className="send-btn" onClick={sendRMMessage}>➤</button>
                                        </div>
                                    }

                                    {/* If rejected show footer message */}
                                    {selectedAssignment.status === "rejected" && (
                                        <div className="closed-footer">Conversation marked closed</div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};

export default RosterHistory;
