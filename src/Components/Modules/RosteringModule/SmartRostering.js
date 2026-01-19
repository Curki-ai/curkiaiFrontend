import React, { useEffect, useState } from "react";
import "../../../Styles/SmartRostering.css";
import { FiUploadCloud } from "react-icons/fi";
import SearchIcon from '../../../Images/SearchIcon.png';
import { BiSend } from "react-icons/bi";
import RosterDetails from "./RosterDetails";
import { RiDeleteBin6Line } from "react-icons/ri";
import fileIcon from '../../../Images/FileIcon.png';
import axios from "axios";
import { MdOutlineHistory } from "react-icons/md";
import RosterHistory from "./RosterHistory";
import { LuDownload } from "react-icons/lu";
import incrementAnalysisCount from "../FinancialModule/TLcAnalysisCount";
import OnboardingForm from "../../OnboardingForm";
import { RiSettingsLine } from "react-icons/ri";
import { FiCheck } from "react-icons/fi";

const API_BASE = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

const SmartRostering = (props) => {
    const userEmail = props?.user?.email;
    // const userEmail = "kris@curki.ai";
    const [screen, setScreen] = useState(1);
    const [query, setQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState([]);
    const [rosteringResponse, setRosteringResponse] = useState(null);
    const [rosteringMetrics, setRosteringMetrics] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [unallocatedClients, setUnallocatedClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [loading, setLoading] = useState(false);
    const [promptLoading, setPromptLoading] = useState(false);
    const [manualMetrics, setManualMetrics] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(1);
    const [openRosterSetting, setOpenRosterSetting] = useState(false);
    const [rosteringSettings, setRosteringSettings] = useState(null);
    const [bulkMode, setBulkMode] = useState(false);
    const [selectedShiftIds, setSelectedShiftIds] = useState([]);

    // bulk processing
    const [bulkQueue, setBulkQueue] = useState([]);
    const [bulkResults, setBulkResults] = useState({});
    const [activeTab, setActiveTab] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    // console.log("unallocatedClients", unallocatedClients)
    useEffect(() => {
        if (!userEmail) return;

        const domain = userEmail.split("@")[1];

        const fetchRosteringSettings = async () => {
            try {
                const res = await axios.get(
                    `${API_BASE}/api/rosteringSettings/${domain}`
                );

                if (res.data?.data?.length) {
                    setRosteringSettings(res.data.data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch rostering settings", err);
            }
        };

        fetchRosteringSettings();
    }, [userEmail]);
    console.log("rostering settings in smart rostering main page", rosteringSettings)
    const handleScroll = () => {
        const container = document.getElementById("unallocated-scroll-container");
        if (!container) return;

        const cardWidth = 320;
        const index = Math.floor(container.scrollLeft / cardWidth) + 1;

        setCurrentIndex(Math.min(index, unallocatedClients.length));
    };

    const today = new Date();
    const options = { day: "2-digit", month: "short", year: "numeric" };
    const formattedDate = today.toLocaleDateString("en-GB", options);

    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 3;
    const [unauthorized, setUnauthorized] = useState(false);
    const visualCareCreds =
        rosteringSettings?.integrations?.softwares?.visualcare?.creds || null;
    console.log("visual care creds", visualCareCreds)
    // console.log("unallocatedClients.length", unallocatedClients.length)
    const formatDateDMY = (dateStr) => {
        if (!dateStr) return "";

        // expect YYYY-MM-DD
        const [year, month, day] = dateStr.split("-");
        if (!year || !month || !day) return dateStr;

        return `${day}-${month}-${year}`;
    };
    const maskClientForKris = (client) => {
        if (!client) return client;

        const maskedName = `Client_${Math.floor(1000 + Math.random() * 9000)}`;

        return {
            ...client,
            name: maskedName,
            phone: "04XX XXX XXX",
            email: `${maskedName.toLowerCase()}@mail.com`,
            address: "Australia",
            sex: client.sex || "N/A",
        };
    };
    // console.log("selectedFile", selectedFile)
    const runManualMetrics = async () => {
        try {
            const form = new FormData();
            selectedFile.forEach(f => form.append("files", f));

            const res = await axios.post(
                `${API_BASE}/api/manualMetricsAndHistory`,
                form // ❌ NO custom headers
            );

            // console.log("res in runManualMetrics", res);

            const m = res.data;

            const mm = {
                shift_coverage: m?.shift_coverage_percent,
                Unallocated_shift: m?.at_risk_unallocated_count,
                staff_utilisation: m?.staff_utilisation_percent,
            };

            setManualMetrics(mm);

        } catch (err) {
            console.error("❌ Manual Metrics Error:", err);
        }
    };

    // console.log("manual metrics", manualMetrics)
    // console.log("rosteringMetrics", rosteringMetrics)


    // 🔹 rostering managers list
    const rosteringManagers =
        rosteringSettings?.rostering?.rostering_managers || [];
    const isRosteringManager = rosteringManagers.some(
        rm => rm.email?.toLowerCase() === userEmail?.toLowerCase()
    );
    const canUseVisualCare =
        !!visualCareCreds && isRosteringManager;

    const uploadDisabled = !!canUseVisualCare;  // true when creds exist
    // useEffect(() => {
    //     const fetchVisualCareCreds = async () => {
    //         try {
    //             const res = await axios.get(`${API_BASE}/get-visualcare-creds`);
    //             // console.log("res", res)
    //             if (res.data?.success && res.data?.data?.length > 0) {
    //                 // Find the record where logged-in user's email is in rosteringManager.emails[]
    //                 const matched = res.data.data.find((entry) =>
    //                     entry.rosteringManager?.emails?.includes(userEmail)
    //                 );

    //                 if (!matched) {
    //                     setUnauthorized(true);
    //                 }

    //                 setVisualCareCreds(matched.creds); // ✅ Save credentials for later API use
    //                 // console.log("Authorized VisualCare credentials loaded:", matched.creds);
    //             } else {
    //                 alert("No VisualCare credentials found in the database.");
    //             }
    //         } catch (err) {
    //             console.error("❌ Error fetching VisualCare creds:", err);
    //             // alert("Failed to load VisualCare credentials.");
    //         }
    //     };

    //     if (userEmail) fetchVisualCareCreds();
    // }, [userEmail]);

    useEffect(() => {
        if (!canUseVisualCare) return;


        // If manual metrics exist → do NOT load VC metrics
        if (manualMetrics) {
            return;
        }

        const fetchMetrics = async () => {
            const { user, key, secret } = visualCareCreds;
            try {
                const res = await axios.get(`${API_BASE}/api/getFortnightMetrics`, {
                    params: { user, key, secret },
                });

                if (res.data?.success) {
                    const data = res.data.metrics;

                    setRosteringMetrics({
                        shift_coverage: data.shift_coverage_pct,
                        Unallocated_shift: data.unallocated_shifts,
                        staff_utilisation: data.staff_utilization_pct,
                    });
                }
            } catch (err) {
                console.error("❌ Error fetching fortnight metrics:", err);
            }
        };

        fetchMetrics();
    }, [visualCareCreds, manualMetrics]);


    // console.log("rosteringResponse",rosteringMetrics)
    // 🔹 Fetch unallocated shifts from API
    // console.log("visualCareCreds", visualCareCreds)
    useEffect(() => {
        const fetchUnallocatedShifts = async () => {
            setLoadingClients(true);
            try {
                const user = visualCareCreds?.user;
                const key = visualCareCreds?.key;
                const secret = visualCareCreds?.secret;
                const days = rosteringSettings?.rostering?.unallocated_shifts_visible_days;
                const res = await axios.get(
                    `${API_BASE}/getUnallocatedShifts`,
                    {
                        params: { user, key, secret, userEmail, days },
                    }
                );

                // console.log("res in fetchUnallocatedShifts", res)
                const grouped = res.data || {};
                const allClients = grouped?.grouped.map((shift) => {
                    const start = shift.start_time;              // "10:00"
                    const mins = Number(shift.minutes) || 0;     // 360

                    let endTime = "-";

                    if (start && mins) {
                        const [h, m] = start.split(":").map(Number);
                        const startDate = new Date(2000, 0, 1, h, m); // dummy date

                        const endDate = new Date(startDate.getTime() + mins * 60000);

                        const endH = String(endDate.getHours()).padStart(2, "0");
                        const endM = String(endDate.getMinutes()).padStart(2, "0");

                        endTime = `${endH}:${endM}`;
                    }
                    return {
                        dateOfService: shift.date_of_service || "-",
                        shiftId: `${shift.client_id}_${shift.date_of_service}_${shift.start_time}`,
                        clientId: shift.client_id || "-",
                        name: shift.client_name || "Unknown",
                        sex: shift.sex || "-",
                        phone: shift.phone || "-",
                        email: shift.email?.trim() || "-",
                        address: shift.address || "-",
                        startTime: start || "-",
                        minutes: mins ? `${mins} min` : "-",
                        endTime: endTime,  // <-- added
                        prefSkillsDescription: shift?.prefSkillsDescription || []
                    };
                });




                setUnallocatedClients(allClients);
                // console.log(allClients);
            } catch (error) {
                console.error("Error fetching unallocated shifts:", error);
            } finally {
                setLoadingClients(false);
            }
        };

        fetchUnallocatedShifts();
    }, [visualCareCreds]);


    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);

        setSelectedFile((prev) => {
            const combined = [...prev, ...files];
            if (combined.length > 2) {
                alert("You can only upload a maximum of 2 files");
                return combined.slice(0, 2);
            }
            return combined;
        });

        // ADD THIS LINE:
        if (props.setManualAskAiFile) {
            props.setManualAskAiFile(files[0]);  // only first file used for manual Ask-AI
        }
    };

    const removeFile = (index) => {
        setSelectedFile((prev) => prev.filter((_, i) => i !== index));
    };

    const handleNext = () => {
        const container = document.getElementById("unallocated-scroll-container");
        if (!container) return;

        container.scrollBy({ left: 320, behavior: "smooth" });

        setCurrentIndex(prev => Math.min(prev + 1, unallocatedClients.length));
    };

    const handlePrev = () => {
        const container = document.getElementById("unallocated-scroll-container");
        if (!container) return;

        container.scrollBy({ left: -320, behavior: "smooth" });

        setCurrentIndex(prev => Math.max(prev - 1, 1));
    };




    const visibleClients = unallocatedClients.slice(startIndex, startIndex + visibleCount);


    useEffect(() => {
        if (screen === 1) {
            setQuery("");
            setSelectedFile([]);
        }
    }, [screen]);
    // 🔹 Call backend rostering API (Controller 1)
    const startBulkProcessing = () => {
        const queue = unallocatedClients
            .filter(c => selectedShiftIds.includes(c.shiftId))
            .map(c => ({
                id: c.shiftId,
                client: c
            }));

        const results = {};
        queue.forEach(q => {
            results[q.id] = { status: "pending" };
        });

        setBulkQueue(queue);
        setBulkResults(results);
        setActiveTab(queue[0]?.id || null);
        // setProcessingId(queue[0]?.id || null);
        setScreen(2);
    };

    const handleClientClick = async (client) => {
        setLoading(true);
        try {
            const user = visualCareCreds?.user;
            const key = visualCareCreds?.key;
            const secret = visualCareCreds?.secret;

            const real = client._real ? {
                client_id: client._real.client_id,
                shift_date: client._real.date_of_service,
                shift_start: client._real.start_time,
                shift_minutes: client._real.minutes

            } : {
                client_id: client.clientId,
                shift_date: client.dateOfService,
                shift_start: client.startTime,
                shift_minutes: client.minutes?.replace(" min", "") || 0,
            };

            const inputs = real;



            const response = await axios.post(
                `${API_BASE}/run-smart-rostering?user=${user}&key=${key}&secret=${secret}`,
                { inputs, userEmail: userEmail },
                { headers: { "Content-Type": "application/json" } }
            );

            // console.log("Smart Rostering Response:", response.data);
            if (userEmail) {
                await incrementAnalysisCount(userEmail, "smart-rostering", response?.data?.llm_cost?.total_usd);
            }
            // ⏳ Only now switch to screen 2 after data is ready
            if (response.data?.data?.final_ranked?.length > 0) {
                setRosteringResponse(response?.data);
                setSelectedClient(client);
                setScreen(2);
            } else {
                alert("No staff found for this shift.");
            }
        } catch (error) {
            console.error("❌ Error in Smart Rostering:", error);
            alert("Failed to run smart rostering.");
        } finally {
            setLoading(false);
        }
    };

    const handleClientClickBulk = async (client) => {
        const user = visualCareCreds?.user;
        const key = visualCareCreds?.key;
        const secret = visualCareCreds?.secret;

        const inputs = {
            client_id: client.clientId,
            shift_date: client.dateOfService,
            shift_start: client.startTime,
            shift_minutes: client.minutes?.replace(" min", "") || 0,
        };

        const res = await axios.post(
            `${API_BASE}/run-smart-rostering?user=${user}&key=${key}&secret=${secret}`,
            { inputs, userEmail },
            { headers: { "Content-Type": "application/json" } }
        );

        return res.data;
    };


    const handleSubmit = async () => {
        if (!query.trim()) {
            alert("Please enter a query first.");
            return;
        }

        setPromptLoading(true);

        try {
            // USER SELECTED FILES? → RUN MANUAL LOGIC
            if (selectedFile.length > 0) {
                const form = new FormData();
                form.append("prompt", query);

                // attach first file only (manual expects single file)
                form.append("files", selectedFile[0]);

                const manualResponse = await axios.post(
                    `${API_BASE}/api/manualSmartRostering`,
                    form,
                    { headers: { "Content-Type": "multipart/form-data" } }
                );
                // console.log("manualResponse", manualResponse);
                if (userEmail) {
                    await incrementAnalysisCount(userEmail, "manual-smart-rostering", manualResponse?.data?.llm_cost?.total_usd);
                }
                // console.log("📌 Manual Roster Response:", manualResponse.data);

                // handle manual response
                const rankedStaff = manualResponse.data?.final_ranked || [];
                if (rankedStaff.length === 0) {
                    alert("No staff found.");
                    return;
                }

                setRosteringResponse(manualResponse.data);

                // build client for UI
                const parsedClient = manualResponse.data?.parsed_client_profile || {};
                const parsedShift = manualResponse.data?.parsed_shift || {};

                setSelectedClient({
                    name: parsedClient?.client_name || "Unknown",
                    dateOfService: parsedShift?.date || "-",
                    startTime: parsedShift?.start_time || "-",
                    minutes: parsedShift?.duration_minutes
                        ? `${parsedShift.duration_minutes} min`
                        : "-",
                    prefSkillsDescription: parsedClient?.required_skills || []
                });

                setScreen(2); // go to details view
                await runManualMetrics();
                return;
            }

            // NO FILES? → use old filler + smart logic
            const user = visualCareCreds?.user;
            const key = visualCareCreds?.key;
            const secret = visualCareCreds?.secret;

            const response = await axios.post(
                `${API_BASE}/run-manifest-filler?user=${user}&key=${key}&secret=${secret}`,
                { prompt: query, userEmail },
                { headers: { "Content-Type": "application/json" } }
            );
            // console.log("response in prompt based rostering", response)
            const promptCost = response?.data?.filler?.llm_cost?.total_usd || 0;
            const rosteringCost = response?.data?.rostering_llm_cost?.total_usd || 0;
            const totalCost = promptCost + rosteringCost;
            if (userEmail) {
                await incrementAnalysisCount(userEmail, "prompt-smart-rostering", totalCost);
            }
            const rankedStaff = response.data?.rostering_summary?.final_ranked || [];
            if (!rankedStaff.length) {
                alert("No staff found.");
                return;
            }

            setRosteringResponse(response.data);

            const fillerInputs = response.data?.filler?.llm?.inputs || {};
            setSelectedClient({
                name: fillerInputs.client_name,
                dateOfService: fillerInputs.shift_date,
                startTime: fillerInputs.shift_start,
                minutes: fillerInputs.shift_minutes
                    ? `${fillerInputs.shift_minutes} min`
                    : "-",
                prefSkillsDescription: response?.data?.preferred_skill_descriptions
            });
            // if (userEmail === "kris@curki.ai") {
            //     selectedClient = maskClientForKris(selectedClient);
            // }
            setScreen(2);

        } catch (error) {
            console.error("❌ Error:", error);
            alert("Error running query.");
        } finally {
            setPromptLoading(false);
        }
    };
    useEffect(() => {
        if (manualMetrics) {
            setRosteringMetrics(manualMetrics);
        }
    }, [manualMetrics]);


    // if (unauthorized) {
    //     return (
    //         <div style={{
    //             textAlign: "center",
    //             padding: "120px 20px",
    //             fontFamily: "Inter, sans-serif",
    //             color: "#1f2937"
    //         }}>
    //             <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
    //                 Access Restricted 🚫
    //             </h2>
    //             <p style={{ fontSize: "16px", color: "#555" }}>
    //                 Sorry, your account (<strong>{userEmail}</strong>) is not authorized to view this page.
    //             </p>
    //         </div>
    //     );
    // }

    return (
        <>
            {screen === 1 && (
                <div className="rostering-dashboard">
                    <div className="info-table">
                        <div className="table-headerss">
                            <span>If You Upload This...</span>
                            <span>Our AI Will Instantly...</span>
                        </div>
                        <div className="table-rowss">
                            <div>Fortnightly Roster Schedule.</div>
                            <ul>
                                <div style={{ padding: '0px 0px 8px 0px' }}>
                                    <li>Ensures 100% shift coverage with no missed or unfilled shifts.</li>
                                    <li>Sends automatic SMS invites to fill shifts instantly.</li>
                                </div>
                                <div style={{ padding: '8px 0px' }}>
                                    <li>Analyses overtime patterns and past shift history.</li>
                                    <li>Matches client care needs with the best-suited staff.</li>
                                </div>
                                <div style={{ padding: '8px 0px' }}>
                                    <li>Factors in hourly rates, distance, and availability.</li>
                                    <li>Recommends the top 5 most cost-efficient staff for each shift.</li>
                                    <li>Keeps rosters profitable, compliant, and fully staffed in minutes.</li>
                                </div>
                            </ul>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '30px' }}>
                        <div className="rostering-date">{formattedDate}</div>
                        <div style={{ display: 'flex', gap: '14px' }}>
                            <button className="roster-settings-btn" onClick={() => setScreen(3)}><MdOutlineHistory size={18} color="#707493" /> History </button>
                            <button className="roster-settings-btn" onClick={() => setOpenRosterSetting(true)}><RiSettingsLine size={18} color="#707493" />Rostering Settings</button>
                            {/* {canUseVisualCare && (
                                <button
                                    className="roster-settings-btn"
                                    onClick={() => setOpenRosterSetting(true)}
                                >
                                    <RiSettingsLine size={18} color="#707493" />
                                    Rostering Settings
                                </button>
                            )} */}
                        </div>
                    </div>

                    <div className="rostering-stats-row">
                        <div className="rostering-stat-card">
                            <p>Shift Coverage %</p>
                            <span className="rostering-circle rostering-green">{rosteringMetrics?.shift_coverage ?? 0}</span>
                        </div>

                        <div className="rostering-stat-card">
                            <p>At-Risk Shifts</p>
                            <span className="rostering-circle rostering-orange">
                                {manualMetrics
                                    ? (rosteringMetrics?.Unallocated_shift ?? 0)
                                    : (unallocatedClients?.length ?? 0)
                                }
                            </span>

                        </div>

                        <div className="rostering-stat-card">
                            <p>Staff Utilisation %</p>
                            <span className="rostering-circle rostering-green">{rosteringMetrics?.staff_utilisation ?? 0}</span>
                        </div>
                        <div style={{ borderRadius: '8px', border: '0.76px dashed #6548FF' }}>
                            <div
                                style={{
                                    fontFamily: 'Inter',
                                    fontSize: '16px',
                                    cursor: uploadDisabled ? 'not-allowed' : 'pointer',
                                    opacity: uploadDisabled ? 0.5 : 1,
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: '500',
                                    color: '#6c4cdc',
                                    padding: '6px 4px'
                                }}
                                onClick={() => {
                                    if (uploadDisabled) return;  // 🔥 Stop click when creds exist
                                    const link = document.createElement("a");
                                    link.href = "/templates/SmartRosteringTemplate.xlsx";
                                    link.download = "Smart Rostering Template.xlsx";
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                Download Template <LuDownload size={20} />
                            </div>

                            <div
                                className="rostering-upload-card"
                                style={{
                                    opacity: uploadDisabled ? 0.5 : 1,
                                    pointerEvents: uploadDisabled ? "none" : "auto",
                                    cursor: uploadDisabled ? "not-allowed" : "pointer"
                                }}
                            >
                                <div>
                                    {selectedFile.map((file, index) => (
                                        <div key={index} style={{ border: '1px solid #6c4cdc', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', padding: '8px 10px', marginBottom: '4px', width: '100%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <div className="file-icon">
                                                    <img src={fileIcon} height={15} width={10} alt="Zip" />
                                                </div>
                                                <div style={{ fontSize: '12px', fontFamily: 'Inter', fontWeight: '600', marginRight: '10px' }}>
                                                    {file.name.length > 20 ? file.name.slice(0, 15) + "..." : file.name}
                                                </div>
                                            </div>
                                            <div className="remove-btn" onClick={() => removeFile(index)}>
                                                <RiDeleteBin6Line size={16} color="red" />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!selectedFile.length && (
                                    <>
                                        <div className="upload-icon">
                                            <FiUploadCloud color="#6C4CDC" />
                                        </div>
                                        <p>Browse Files</p>
                                        <small>Format: .xlsx, .csv, .xls only</small>
                                    </>
                                )}

                                <div style={{ marginTop: "12px" }}>
                                    <label
                                        htmlFor="rostering-file-upload"
                                        className="rostering-upload-label"
                                        style={{
                                            background: uploadDisabled ? "#d3d3d3" : "",
                                            color: uploadDisabled ? "#888" : "",
                                            cursor: uploadDisabled ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        Browse Files
                                        <input
                                            type="file"
                                            id="rostering-file-upload"
                                            accept=".xlsx,.xls,.csv"
                                            onChange={handleFileChange}
                                            style={{ display: "none" }}
                                            multiple
                                            disabled={uploadDisabled}
                                        />
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>

                    {canUseVisualCare && <div className="unallocated-shifts-section" style={{ marginTop: "40px" }}>
                        <h3
                            style={{
                                fontFamily: "Inter",
                                fontWeight: "600",
                                marginBottom: "20px",
                                textAlign: "center",
                                fontSize: "24px"
                            }}
                        >
                            Unallocated Shifts
                        </h3>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                marginBottom: "16px",
                                width: "184px",
                                height: "44px",
                                border: "1px solid #EEEEEE",
                                borderRadius: "999px",
                                marginLeft: "auto"
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 500,
                                    color: "#6B7280",
                                    marginLeft: "16px"
                                }}
                            >
                                Bulk Selection
                            </span>

                            <div
                                onClick={() => {
                                    setBulkMode(!bulkMode);
                                    setSelectedShiftIds([]);
                                }}
                                style={{
                                    width: "46px",
                                    height: "24px",
                                    borderRadius: "999px",
                                    backgroundColor: bulkMode ? "#6C4CDC" : "#E5E7EB",
                                    position: "relative",
                                    cursor: "pointer",
                                    transition: "background-color 0.25s ease"
                                }}
                            >
                                <div
                                    style={{
                                        width: "20px",
                                        height: "20px",
                                        borderRadius: "50%",
                                        backgroundColor: "#fff",
                                        position: "absolute",
                                        top: "2px",
                                        left: bulkMode ? "24px" : "2px",
                                        transition: "left 0.25s ease",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)"
                                    }}
                                />
                            </div>
                        </div>

                        {loadingClients ? (
                            <p>Loading unallocated shifts...</p>
                        ) : unallocatedClients.length === 0 ? (
                            <p>No unallocated shifts found.</p>
                        ) : (
                            <>
                                {/* Scrollable Container */}
                                <div
                                    id="unallocated-scroll-container"
                                    onScroll={handleScroll}
                                    style={{
                                        position: "relative",
                                        width: "100%",
                                        margin: "0 auto",
                                        overflowX: "auto",
                                        overflowY: "hidden",
                                        scrollBehavior: "smooth",
                                        scrollbarWidth: "thin",
                                        paddingBottom: "10px",
                                        paddingTop: "10px",
                                    }}
                                >
                                    <div
                                        className="unallocated-shifts-cards"
                                        style={{
                                            display: "flex",
                                            gap: "20px",
                                            width: `${unallocatedClients.length * 330}px`,
                                            transition: "transform 0.6s ease-in-out",
                                        }}
                                    >
                                        {unallocatedClients
                                            .map((client, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        position: "relative",
                                                        flex: "0 0 300px",
                                                        border: "1px solid #6c4cdc",
                                                        borderRadius: "10px",
                                                        padding: "16px",
                                                        background: "#fff",
                                                        fontFamily: "Inter",
                                                        textAlign: "left",
                                                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                                        fontSize: "14px",
                                                        cursor: "pointer",
                                                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "translateY(-5px)";
                                                        e.currentTarget.style.boxShadow =
                                                            "0 0 10px rgba(86, 21, 208, 0.4)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "translateY(0)";
                                                        e.currentTarget.style.boxShadow =
                                                            "0 2px 6px rgba(0,0,0,0.08)";
                                                    }}
                                                    onClick={() => {
                                                        if (bulkMode) return;
                                                        handleClientClick(client);
                                                    }}


                                                >
                                                    {bulkMode && (
                                                        <input
                                                            type="checkbox"
                                                            className="bulk-checkbox"
                                                            checked={selectedShiftIds.includes(client.shiftId)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={() => {
                                                                setSelectedShiftIds(prev =>
                                                                    prev.includes(client.shiftId)
                                                                        ? prev.filter(id => id !== client.shiftId)
                                                                        : [...prev, client.shiftId]
                                                                );
                                                            }}

                                                            style={{
                                                                position: "absolute",
                                                                top: "10px",
                                                                right: "10px"
                                                            }}
                                                        />
                                                    )}

                                                    <p style={{ marginBottom: '12px' }}><strong>Date Of Service:</strong> {formatDateDMY(client.dateOfService)}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Client ID:</strong> {client.clientId}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Client Name:</strong> {client.name}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Sex:</strong> {client.sex}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Phone:</strong> {client.phone}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Email:</strong> {client.email}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Address:</strong> {client.address}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Start Time:</strong> {client.startTime}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>Minutes:</strong> {client.minutes}</p>
                                                    <p style={{ marginBottom: '12px' }}><strong>End Time:</strong> {client.endTime}</p>
                                                    {/* <p style={{ marginBottom: '12px' }}><strong>OnHoldType:</strong> {client.onHoldType}</p> */}
                                                    {/* <p><strong>OnHoldNote:</strong> {client.onHoldNote}</p> */}
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                {/* Pagination */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginTop: "20px",
                                        gap: "10px",
                                    }}
                                >
                                    <button
                                        onClick={handlePrev}
                                        disabled={currentIndex === 1}   // ⛔ Disable when at start
                                        style={{
                                            background: "#f1f0ff",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "30px",
                                            height: "30px",
                                            cursor: currentIndex === 1 ? "not-allowed" : "pointer",
                                            opacity: currentIndex === 1 ? 0.4 : 1,
                                            fontSize: "18px",
                                            color: '#6c4cdc',
                                        }}
                                    >
                                        ‹
                                    </button>

                                    <span style={{ fontFamily: "Inter", fontSize: "14px" }}>
                                        {currentIndex} / {unallocatedClients.length}
                                    </span>

                                    <button
                                        onClick={handleNext}
                                        disabled={currentIndex === unallocatedClients.length}  // ⛔ Disable when at last
                                        style={{
                                            background: "#f1f0ff",
                                            border: "none",
                                            borderRadius: "50%",
                                            width: "30px",
                                            height: "30px",
                                            cursor: currentIndex === unallocatedClients.length ? "not-allowed" : "pointer",
                                            opacity: currentIndex === unallocatedClients.length ? 0.4 : 1,
                                            fontSize: "18px",
                                            color: '#6c4cdc'
                                        }}
                                    >
                                        ›
                                    </button>
                                </div>
                                {bulkMode && selectedShiftIds.length > 0 && (
                                    <div style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}>
                                        <button
                                            className="bulk-shortlist-btn"
                                            onClick={startBulkProcessing}
                                        >
                                            <span style={{fontSize:"14px",fontWeight:"500"}}>Bulk Shortlist</span>
                                            <span className="bulk-count">
                                                {selectedShiftIds.length}
                                            </span>
                                        </button>
                                    </div>
                                )}


                            </>
                        )}
                    </div>}




                    <div className="rostering-input-box">
                        <div style={{ fontWeight: '600', fontSize: '16px', fontFamily: 'Inter', marginBottom: '24px' }}>Want to roster for anybody specific?</div>
                        <div className="rostering-input-wrapper">
                            <div className="rostering-search-icon">
                                <img src={SearchIcon} alt='SearchIcon' style={{ width: '21px', height: '20px' }} />
                            </div>
                            <textarea
                                rows={6}
                                placeholder={
                                    "Required: Client Name, Date, Shift Start Time, Hours\n" +
                                    "Example: Find staff for Sarah James on 25th Dec at 10 AM for 2 Hours."
                                }
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />

                            <button className="rostering-send-btn" onClick={handleSubmit} disabled={promptLoading}>
                                {promptLoading ? "Sending..." : <BiSend />}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {screen === 2 && (
                <RosterDetails
                    setScreen={setScreen}
                    rosteringResponse={rosteringResponse}
                    API_BASE={API_BASE}
                    selectedClient={selectedClient}
                    visualCareCreds={visualCareCreds}
                    userEmail={userEmail}
                    SetIsSmartRosteringDetails={props.SetIsSmartRosteringDetails}
                    bulkQueue={bulkQueue}
                    setBulkQueue={setBulkQueue}
                    bulkResults={bulkResults}
                    setBulkResults={setBulkResults}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleClientClickBulk={handleClientClickBulk}
                />
            )}
            {screen === 3 && (
                <RosterHistory
                    setScreen={setScreen}
                    userEmail={userEmail}
                    SetIsSmartRosteringHistory={props.SetIsSmartRosteringHistory}
                />
            )}
            {loading && (
                <div className="overlay">
                    <div className="spinner"></div>
                    <p>Running Smart Rostering...</p>
                </div>
            )}
            {openRosterSetting && (
                <OnboardingForm onClose={() => setOpenRosterSetting(false)} userEmail={userEmail} />
            )}
        </>
    );
};

export default SmartRostering;
