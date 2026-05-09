import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../../Styles/NDISModule/ClientEvent.css";
import UploadFiles from "../../general-components/UploadFiles";
import star from '../../../Images/star.png';
import Toggle from "react-toggle";
import historyIcon from "../../../Images/TlcPayrollHistory.png"
import { GoArrowLeft } from "react-icons/go";
import { RiDeleteBin6Line } from "react-icons/ri";
import incrementAnalysisCount from "../FinancialModule/Tlc/TLcAnalysisCount";
import incrementCareVoiceAnalysisCount from "../SupportAtHomeModule/careVoiceCostAnalysis";
import { API_BASE } from "../../../config/apiBase";
import useModuleOrgLookup from "../../../hooks/useModuleOrgLookup";
import FinancialHealthNoOrgEmptyState from "../FinancialModule/FinancialHealth/FinancialHealthNoOrgEmptyState";
import FinancialHealthAccessManagement from "../FinancialModule/FinancialHealth/FinancialHealthAccessManagement";
import { RiSettingsLine } from "react-icons/ri";

const BASE_URL =
  "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io";
const CEIM_API_BASE = `${API_BASE}/api/client-event-incident-mgmt`;

const Client_Event_Reporting = (props) => {
  const userEmail = props?.user?.email;
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [reportMode, setReportMode] = useState("one-time");
  const [loading, setLoading] = useState(false);
  const [stage3Data, setStage3Data] = useState(null);
  const [askAIResult, setAskAIResult] = useState(null);
  const [question, setQuestion] = useState("");
  const [loadingAskAI, setLoadingAskAI] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [startDay, setStartDay] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [endDay, setEndDay] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [savingHistory, setSavingHistory] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isFromHistory, setIsFromHistory] = useState(false);
  const [openAccessManagement, setOpenAccessManagement] = useState(false);

  const { currentUserRole, orgLookupStatus, refresh: refetchOrg } =
    useModuleOrgLookup({
      userEmail,
      orgsApiBase: `${CEIM_API_BASE}/organizations`,
    });
  const formatClientEventDateRange = (dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) return "–";

    const format = (d) =>
      new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
      });

    return `${format(dateRange.startDate)} – ${format(dateRange.endDate)}`;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoadingHistory(true);

        const res = await fetch(
          `${API_BASE}/api/clientEventIncidentMgmt?email=${props.user.email}`
        );

        const json = await res.json();
        setHistoryList(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [props.user]);
  const handleSaveClientEventHistory = async () => {
    if (savingHistory || !stage3Data) return;

    try {
      setSavingHistory(true);

      // build date range only if selected
      const currentYear = new Date().getFullYear();

      const dateRange = {
        startDate: startDay && startMonth
          ? `${currentYear}-${startMonth}-${startDay}`
          : null,
        endDate: endDay && endMonth
          ? `${currentYear}-${endMonth}-${endDay}`
          : null,
      };
      console.log("Saving with date range:", dateRange);

      const payload = {
        email: props.user.email,
        stage3Data,
        dateRange: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      };

      const res = await fetch(
        `${API_BASE}/api/clientEventIncidentMgmt/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Save failed");

      alert("Saved successfully");

      // 🔁 refresh history list immediately
      const historyRes = await fetch(
        `${API_BASE}/api/clientEventIncidentMgmt?email=${props.user.email}`
      );
      const historyJson = await historyRes.json();
      setHistoryList(historyJson.data || []);
    } catch (err) {
      console.error("Save history failed", err);
      alert("Failed to save history");
    } finally {
      setSavingHistory(false);
    }
  };

  const handleClientEventHistoryClick = async (item) => {
    try {
      const res = await fetch(
        `${API_BASE}/api/clientEventIncidentMgmt/${item.id}`
      );

      if (!res.ok) throw new Error("Failed to fetch history item");

      const json = await res.json();
      const data = json.data;

      // Restore events
      setStage3Data(data.stage3Data || []);

      // Restore date range (if exists)
      if (data.dateRange) {
        const { startDate, endDate } = data.dateRange;

        if (startDate) {
          const d = new Date(startDate);
          setStartDay(String(d.getDate()).padStart(2, "0"));
          setStartMonth(String(d.getMonth() + 1).padStart(2, "0"));
        }

        if (endDate) {
          const d = new Date(endDate);
          setEndDay(String(d.getDate()).padStart(2, "0"));
          setEndMonth(String(d.getMonth() + 1).padStart(2, "0"));
        }
      }

      // Disable upload state
      setSelectedFiles([]);

      // Mark history mode
      setIsFromHistory(true);
      await incrementCareVoiceAnalysisCount(props.user.email, "history-click", 0, "client-event-reporting", 0)
    } catch (err) {
      console.error("Failed to load client event history item", err);
    }
  };
  const handleDeleteClientEventHistory = async () => {
    if (!selectedHistoryId) return;

    try {
      setDeleting(true);

      const res = await fetch(
        `${API_BASE}/api/clientEventIncidentMgmt/delete`,
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

      if (!res.ok) throw new Error("Delete failed");

      // ✅ remove from UI immediately
      setHistoryList((prev) =>
        prev.filter((item) => item.id !== selectedHistoryId)
      );

      setShowDeleteModal(false);
      setSelectedHistoryId(null);
    } catch (err) {
      console.error("Delete history failed", err);
      alert("Failed to delete history");
    } finally {
      setDeleting(false);
    }
  };

  const handleFileChange = (e) => {
    const filesArray = Array.from(e.target.files);
    if (filesArray.length + selectedFiles.length > 10) {
      alert("You can select up to 10 files only");
      return;
    }
    setSelectedFiles(Array.from(e.target.files));
  };

  const handleAnalyse = async () => {
    if (selectedFiles.length === 0) {
      alert("Please select at least one file");
      return;
    }

    setLoading(true);
    setStage3Data(null);
    setAskAIResult(null);
    setUploadProgress(0);

    let fakeProgressInterval;

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));

      const params = {
        include_text: 0,
        run_stage3: 1,
        concurrency: 4,
      };

      // 🔹 Start fake gradual progress immediately
      fakeProgressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 95) return prev + 1; // keep it below 100%
          return prev;
        });
      }, 300); // adjust speed here

      const processRes = await axios.post(
        `${BASE_URL}/ndis/clients-events/report`,
        formData,
        {
          params,
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 900000,
        }
      );

      if (processRes.data?.stage3) {
        const s3 = processRes.data.stage3;

        const eventsArray = Array.isArray(s3)
          ? s3
          : Object.keys(s3)
            .sort((a, b) => {
              const numA = parseInt(a.replace(/\D/g, ""), 10);
              const numB = parseInt(b.replace(/\D/g, ""), 10);
              return numA - numB;
            })
            .map((key) => s3[key]);

        setStage3Data(eventsArray);
        await incrementCareVoiceAnalysisCount(props?.user?.email?.trim(), "ai-analysis", 0, "client-event-reporting", 0);
      } else {
        alert("Stage 3 data not found in response");
      }

      // ✅ Jump to 100% once backend responds
      setUploadProgress(100);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong! Check console for details.");
    } finally {
      setLoading(false);
      if (fakeProgressInterval) clearInterval(fakeProgressInterval);

      // reset after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };




  // const handleAskAI = async () => {
  //   if (!stage3Data) {
  //     alert("Please run analysis first");
  //     return;
  //   }
  //   if (!question.trim()) {
  //     alert("Please enter a question");
  //     return;
  //   }

  //   setLoadingAskAI(true);
  //   setAskAIResult(null);

  //   try {
  //     const stage3Obj = {};
  //     stage3Data.forEach((content, idx) => {
  //       stage3Obj[`event${idx + 1}`] = content;
  //     });

  //     const formData = new FormData();
  //     selectedFiles.forEach((file) => formData.append("files", file));
  //     formData.append("question", question);
  //     formData.append("stage3", JSON.stringify(stage3Obj));
  //     formData.append("concurrency", 6);
  //     formData.append("include_text", 0);

  //     const askAIRes = await axios.post(
  //       `${BASE_URL}/clients-events/askai`,
  //       formData,
  //       {
  //         headers: { "Content-Type": "multipart/form-data" },
  //         timeout: 900000,
  //       }
  //     );

  //     setAskAIResult(
  //       askAIRes.data.answer_markdown.replace(/\. /g, ".\n\n") ||
  //       "No answer received"
  //     );
  //   } catch (err) {
  //     console.error("Ask AI Error:", err.response?.data || err);
  //     alert("Something went wrong in Ask AI! Check console for details.");
  //   } finally {
  //     setLoadingAskAI(false);
  //   }
  // };

  const monthlyReports = [
    { date: "12 Aug", type: "SE", format: "Txt", link: "#" },
    { date: "12 September", type: "SE", format: "Txt", link: "#" },
    { date: "12 Aug", type: "SE", format: "Txt", link: "#" },
    { date: "12 Aug", type: "SE", format: "Txt", link: "#" },
  ];
  const renderHistorySection = () => (
    <section className="ce-history-container">

      {/* HEADER */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <img
          src={historyIcon}
          alt="icon"
          style={{ width: "22px", height: "21px", pointerEvents: "none" }}
        />
        <div className="ce-history-title">History</div>
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
        <div className="ce-history-list">
          {historyList.map((item) => (
            <div
              key={item.id}
              className="ce-history-card"
              onClick={() => handleClientEventHistoryClick(item)}
              style={{ position: "relative", cursor: "pointer" }}
            >
              {/* DELETE ICON */}
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

              {/* DATE RANGE */}
              {item.dateRange && (
                <div className="ce-history-top">
                  <div className="ce-history-date-range">
                    <span className="ce-label">Date Range: </span>
                    <span className="ce-value">
                      {formatClientEventDateRange(item.dateRange)}
                    </span>
                  </div>
                </div>
              )}

              {/* SAVED ON */}
              <div className="ce-saved-on">
                <span className="ce-saved-label">Saved on: </span>
                <span style={{ color: "#000" }}>
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}

        </div>
      )}
      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div
          className="ce-delete-overlay"
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
            className="ce-delete-modal"
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
                onClick={handleDeleteClientEventHistory}
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
  if (orgLookupStatus === "loading") {
    return (
      <div style={{
        textAlign: "center",
        padding: "120px 20px",
        fontFamily: "Inter, sans-serif",
        color: "#1f2937"
      }}>
        <p style={{ fontSize: "15px", color: "#555" }}>Loading…</p>
      </div>
    );
  }
  if (orgLookupStatus === "not_found") {
    return (
      <FinancialHealthNoOrgEmptyState
        userEmail={userEmail}
        moduleLabel="Participant Events & Incident Management"
        registerUrl={`${CEIM_API_BASE}/organizations/register`}
        onRegistered={refetchOrg}
      />
    );
  }
  return (
    <div className="ce-page">
      {currentUserRole === "admin" && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
          <button
            type="button"
            className="access-mgmt-trigger-btn"
            onClick={() => setOpenAccessManagement(true)}
          >
            <RiSettingsLine size={18} color="#707493" />
            Access Management
          </button>
        </div>
      )}
      {/* Toggle */}
      <div className="ce-header">

        {!stage3Data && <h1 className="ce-title">PARTICIPANT EVENTS & INCIDENT MANAGEMENT</h1>}
        <div className="ce-sync-toggle" style={{ marginLeft: stage3Data ? "auto" : "0px" }}>
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
      {!stage3Data && <div className="ce-info-table">
        <div className="ce-info-table-header">
          <span>If You Upload This...</span>
          <span>Our AI Will Instantly...</span>
        </div>
        <div className="ce-info-table-row">
          <div>Care Management System - Shift Notes Report</div>
          <ul>
            <li>Detects unreported incidents under NDIS rules</li>
            <li>Identifies high-risk participants needing follow-up.</li>
          </ul>
        </div>
        <div className="ce-info-table-row">
          <div>Care Management System - Progress Notes Report</div>
          <ul>
            <li>Links repeated issues to specific staff or time slots.</li>
            <li>Predicts potential restrictive practice or escalation risks.</li>
          </ul>
        </div>
        <div className="ce-info-table-row">
          <div>Rostering System - Shift Logs / Daily Support Notes Report</div>
          <ul>
            <li>Ensures incident and reportable event compliance.</li>
            <li>Tracks quality-of-support indicators from shift notes and progress notes.</li>
          </ul>
        </div>
      </div>}
      {/* Date DropDown */}
      {!stage3Data && <div className="ce-date-section">
        {/* Report Start Date */}
        <div className="ce-date-picker">
          <label
            style={{
              fontSize: "14px",
              fontWeight: "500",
              fontFamily: "Inter",
            }}
          >
            Report Start Date
          </label>
          <div className="ce-date-inputs">
            <select
              value={startDay}
              onChange={(e) => setStartDay(e.target.value)}
            >
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
            <select
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthValue = (i + 1).toString().padStart(2, "0"); // 01, 02, 03
                const monthName = new Date(0, i).toLocaleString("en-US", {
                  month: "short",
                }); // Jan, Feb
                return (
                  <option key={monthValue} value={monthValue}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Report End Date */}
        <div className="ce-date-picker">
          <label
            style={{
              fontSize: "14px",
              fontWeight: "500",
              fontFamily: "Inter",
            }}
          >
            Report End Date
          </label>
          <div className="ce-date-inputs">
            <select
              value={endDay}
              onChange={(e) => setEndDay(e.target.value)}
            >
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
            <select
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
            >
              <option value="">MM</option>
              {Array.from({ length: 12 }, (_, i) => {
                const monthValue = (i + 1).toString().padStart(2, "0"); // 01, 02, 03
                const monthName = new Date(0, i).toLocaleString("en-US", {
                  month: "short",
                }); // Jan, Feb
                return (
                  <option key={monthValue} value={monthValue}>
                    {monthName}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>}
      {/* One Time Mode */}
      <>
        {!stage3Data && <>
          <div
            className="ce-uploader-grid"
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div className="ce-uploader-col" style={{ width: '50%' }}>
              <UploadFiles
                files={selectedFiles}
                setFiles={setSelectedFiles}
                title={props.selectedRole}
                subtitle="Upload multiple .docx, .xlsx, .xls, .csv, .pdf file"
                fileformat=".xlsx,.csv,.xls,.docx,.pdf"
                removeFile={(index) => {
                  setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                }}
                multiple={true}
                isProcessing={loading}
              />
            </div>
          </div>

          <button
            className="ce-analyse-btn"
            disabled={loading}
            style={{ backgroundColor: '#000', marginTop: '20px' }}
            onClick={handleAnalyse}
          >
            {loading
              ? `Analysing...${uploadProgress}%`
              : <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>Analyse<img src={star} alt='img' style={{ width: '20px', height: '20px' }} /></div>}
          </button>
        </>}

        {stage3Data && !isFromHistory && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "12px",
              marginTop: "12px",
            }}
          >
            <button
              onClick={handleSaveClientEventHistory}
              disabled={savingHistory}
              style={{
                background: "#6C4CDC",
                color: "#fff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {savingHistory ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {/* BACK BUTTON (only when opened from history) */}
        {isFromHistory && stage3Data && (
          <div
            className="ce-history-back-btn"
            onClick={() => {
              setIsFromHistory(false);
              setStage3Data(null);

              // reset dates
              setStartDay("");
              setStartMonth("");
              setEndDay("");
              setEndMonth("");

              // clear uploads
              setSelectedFiles([]);
            }}
          >
            <GoArrowLeft size={22} color="#6C4CDC" />
            Back
          </div>
        )}


        {/* Stage 3 Events */}
        {stage3Data && (
          <div className="ce-events-grid">
            {stage3Data.map((content, idx) => (
              <div key={idx} className="ce-event-card">
                <h4>Event {idx + 1}</h4>
                <div
                  className="ce-event-content"
                  dangerouslySetInnerHTML={{
                    __html: content
                      .replace(/^###\s*/gm, "")
                      .replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            ))}
          </div>
        )}


        {/* Ask AI Section */}
        {/* {stage3Data && (
            <div className="ask-ai-container">
              <label style={{ marginLeft: "8px" }}>Ask AI a Question:</label>
              <div className="ask-ai-input-wrapper">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                />
                <button onClick={handleAskAI} disabled={loadingAskAI}>
                  {loadingAskAI ? "Thinking..." : "Ask"}
                </button>
              </div>

              {askAIResult && (
                <div className="results-box">
                  <h3>AI Answer</h3>
                  <p>{askAIResult}</p>
                </div>
              )}
            </div>
          )} */}
      </>
      {renderHistorySection()}
      {openAccessManagement && (
        <FinancialHealthAccessManagement
          onClose={() => setOpenAccessManagement(false)}
          userEmail={userEmail}
          moduleLabel="Participant Events & Incident Management"
          apiBase={`${CEIM_API_BASE}/access`}
        />
      )}
    </div>
  );
};

export default Client_Event_Reporting;
