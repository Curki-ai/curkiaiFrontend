import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../../../Styles/general-styles/SmartOnboarding.enhanced.css";
import "../../../../Styles/general-styles/ResumeScreening.css";
import "../../../../Styles/general-styles/NewSmartOnboardingHrView.css"
import StaffOnboarding from "./StaffOnboarding";
import StaffComplianceDashboard from "./StaffComplianceDashboard";
import UploadFiles from "../../../general-components/UploadFiles";
import ScreeningTestCreation from "./ScreeningTestCreation";
import AdminDocumentVerification from "./AdminDocumentVerification";
// LMS v1 (legacy) — kept for rollback. Active LMS is v2 below.
import AdminCourseCreation from "./AdminCourseCreation";
// LMS v2 — replaces AdminCourseCreation in the Edit Training tab.
import AdminCourseCreation_v2 from "../lms/LMSRedesign";
import incrementAnalysisCount from "../../FinancialModule/Tlc/TLcAnalysisCount";
import incrementCareVoiceAnalysisCount from "../../SupportAtHomeModule/careVoiceCostAnalysis";
import SmartOnboardingAccessManagement from "./SmartOnboardingAccessManagement";

const HRAdminView = ({
  handleClick,
  setShowFeedbackPopup,
  role,
  selectedRole,
  user,
  setManualResumeZip,
  setShowAIChat,
  setMessages,
  setHrMode,
  setHrStep,
}) => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [selectedJd, setSelectedJd] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("Resume Screening");
  const [showResults, setShowResults] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [candidates, setCandidates] = useState([]);
  const [progress, setProgress] = useState(0);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [organizationId, setOrganizationId] = useState(null);
  const [testResultsById, setTestResultsById] = useState({});
  const [selectedTestResult, setSelectedTestResult] = useState(null);
  const [smartCandidates, setSmartCandidates] = useState([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const hasFetchedCandidatesRef = useRef(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [openAccessManagement, setOpenAccessManagement] = useState(false);
  
  useEffect(() => {
    // Resolve organizationId from the new `organizations` container.
    // On failure we leave organizationId as null and retry instead of
    // falling back to the user's email — the email-fallback caused
    // sticky broken state during transient backend restarts.
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 1500;
    let cancelled = false;

    const fetchOrganizationId = async (attempt = 1) => {
      const email = user?.email;
      if (!email || cancelled) return;
      try {
        const res = await fetch(
          `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/organizations/by-email?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        console.log(
          `Organizations by-email response (attempt ${attempt}):`,
          data
        );
        if (cancelled) return;
        const firstOrgId = data?.organizations?.[0]?.organizationId;
        if (res.ok && firstOrgId) {
          setOrganizationId(firstOrgId);
          return;
        }
        console.warn(
          `[organizations] no org for ${email} — leaving organizationId null`
        );
      } catch (error) {
        console.error(`fetchOrganizationId error (attempt ${attempt}):`, error);
        if (!cancelled && attempt < MAX_ATTEMPTS) {
          setTimeout(() => fetchOrganizationId(attempt + 1), RETRY_DELAY_MS);
        }
      }
    };

    fetchOrganizationId();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const fetchTestResults = useCallback(async () => {
    if (!organizationId) return;

    try {
      const res = await fetch(
        `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/get-test-results?organisation_id=${encodeURIComponent(organizationId)}`
      );
      const data = await res.json();

      if (data?.ok && Array.isArray(data.results)) {
        const map = {};
        data.results.forEach((r) => {
          if (r.candidateId) map[r.candidateId] = r;
        });
        setTestResultsById(map);
      }
    } catch (error) {
      console.error("fetchTestResults error:", error);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchTestResults();
  }, [fetchTestResults]);

  const fetchAllCandidates = useCallback(async () => {
    if (!user?.email || !organizationId) return;

    const isInitialFetch = !hasFetchedCandidatesRef.current;
    if (isInitialFetch) {
      setIsLoadingCandidates(true);
    }

    try {
      const params = new URLSearchParams({
        admin_email: user.email,
        organization_id: organizationId,
      });
      const res = await fetch(
        `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/get-all-candidates?${params.toString()}`
      );
      const data = await res.json();

      if (data?.ok) {
        setSmartCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("fetchAllCandidates error:", error);
    } finally {
      hasFetchedCandidatesRef.current = true;
      setIsLoadingCandidates(false);
    }
  }, [organizationId, user?.email]);

  useEffect(() => {
    fetchAllCandidates();
  }, [fetchAllCandidates]);

  useEffect(() => {
    if (!organizationId) return;

    const handleShortlisted = (event) => {
      const detail = event?.detail || {};
      const incomingOrg = detail.organisation_id || detail.organization_id;

      if (incomingOrg && String(incomingOrg) !== String(organizationId)) {
        return;
      }

      const incoming = Array.isArray(detail.candidates) ? detail.candidates : [];
      if (incoming.length > 0) {
        setSmartCandidates((prev) => {
          const byId = new Map();
          prev.forEach((c) => {
            if (c?.candidateId) byId.set(String(c.candidateId), c);
          });
          incoming.forEach((c) => {
            if (!c?.candidateId) return;
            const id = String(c.candidateId);
            byId.set(id, { ...(byId.get(id) || {}), ...c });
          });
          return Array.from(byId.values());
        });
      }

      fetchAllCandidates();
    };

    window.addEventListener("hr:candidates-shortlisted", handleShortlisted);
    return () => {
      window.removeEventListener("hr:candidates-shortlisted", handleShortlisted);
    };
  }, [organizationId, fetchAllCandidates]);

  useEffect(() => {
    if (!organizationId) return;
    if (activeTab !== "Resume Screening") return;

    const refresh = () => {
      fetchAllCandidates();
      fetchTestResults();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const intervalId = setInterval(refresh, 8000);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", refresh);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", refresh);
    };
  }, [organizationId, activeTab, fetchAllCandidates, fetchTestResults]);

  const parseTestAnalysis = (analysis) => {
    if (!analysis) return [];
    if (typeof analysis === "object") {
      return Object.entries(analysis).map(([k, v]) => `${k}: ${v}`);
    }
    const text = String(analysis).trim();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
      if (parsed && typeof parsed === "object") {
        return Object.entries(parsed).map(([k, v]) => `${k}: ${v}`);
      }
    } catch (_) {}
    return text
      .split(/\r?\n|(?:\s*[•\-\*]\s+)/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const showCandidatesSkeleton = isLoadingCandidates && smartCandidates.length === 0;

  const filteredCandidates = smartCandidates.filter((item) => {
    const query = searchTerm.toLowerCase().trim();

    if (!query) return true;

    const name = item.candidateName?.toLowerCase() || "";
    const email = item.candidateEmail?.toLowerCase() || "";
    const stage = item.stage?.toLowerCase() || "";
    const skills = (item.candidateSkills || [])
      .join(" ")
      .toLowerCase();

    return (
      name.includes(query) ||
      email.includes(query) ||
      stage.includes(query) ||
      skills.includes(query)
    );
  });
  const handleAnalyze = async () => {
    if (!selectedFile.length || !selectedJd.length) {
      alert("Please upload both Resume ZIP and Job Description PDF.");
      return;
    }
    setManualResumeZip(selectedFile[0]);
    setIsAnalyzing(true);
    setProgress(1);

    // Dynamic Smart Progress — same behavior as FinancialHealth
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) return prev + 2;        // Fast progress
        if (prev < 98) return prev + 0.5;      // Slow near the end
        return prev;                           // Wait until API finishes
      });
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("resume_zip_file", selectedFile[0]);
      formData.append("jd_file", selectedJd[0]);

      const response = await fetch(
        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/process-zip",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze resumes");
      }

      // ✅ Map candidates
      const mappedCandidates = data.results.map((item, i) => ({
        id: i + 1,
        name: item.ApiResponse.candidate_name,
        score: item.ApiResponse["score out of 10"],
        skills: item.ApiResponse["Skills(keywords)"],
        resumeFile: item.resume,
      }));

      setCandidates(mappedCandidates);
      await incrementCareVoiceAnalysisCount(user?.email?.trim(), "resume-screening", 0, "staff-onboarding", 0);
      setProgress(100);
      clearInterval(interval);

      // Smooth UI transition
      setTimeout(() => {
        setShowResults(true);
      }, 400);

    } catch (error) {
      console.error("Analysis failed:", error);
      alert(error.message || "Analysis failed. Please try again.");
    } finally {
      clearInterval(interval);

      // Cleanup UI
      setTimeout(() => {
        setIsAnalyzing(false);
        setProgress(0);
      }, 800);
    }
  };


  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    setShowResults(false);
    setSelectedCandidates(new Set());
  };

  const toggleCandidateSelection = (candidateId) => {
    setSelectedCandidates((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(candidateId)) {
        newSelected.delete(candidateId);
      } else {
        newSelected.add(candidateId);
      }
      return newSelected;
    });
  };

  const handleSendScreeningTest = () => {
    if (selectedCandidates.size === 0) {
      alert("Please select at least one candidate to send screening test.");
      return;
    }
    alert(
      `Screening test link sent to ${selectedCandidates.size} selected candidate(s)!`
    );
    setSelectedCandidates(new Set());
  };

  const handleDeleteCandidate = (candidate) => {
    if (!candidate?.candidateId) return;
    if (!organizationId) {
      setDeleteError("Organisation not loaded yet. Please try again.");
      setDeleteTarget(candidate);
      return;
    }
    setDeleteError("");
    setDeleteTarget(candidate);
  };

  const closeDeleteDialog = () => {
    if (isDeletingCandidate) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDeleteCandidate = async () => {
    const candidate = deleteTarget;
    if (!candidate?.candidateId || !organizationId) return;

    setIsDeletingCandidate(true);
    setDeleteError("");

    const previous = smartCandidates;
    setSmartCandidates((prev) =>
      prev.filter((c) => c.candidateId !== candidate.candidateId)
    );

    try {
      const res = await fetch(
        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/delete-candidate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisation_id: organizationId ? organizationId : user?.email,
            candidate_id: candidate.candidateId,
          }),
        }
      );
      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "Failed to delete candidate");
      }

      setTestResultsById((prev) => {
        if (!prev[candidate.candidateId]) return prev;
        const next = { ...prev };
        delete next[candidate.candidateId];
        return next;
      });

      setDeleteTarget(null);
    } catch (error) {
      console.error("deleteCandidate error:", error);
      setSmartCandidates(previous);
      setDeleteError(error.message || "Failed to delete candidate. Please try again.");
    } finally {
      setIsDeletingCandidate(false);
    }
  };



  return (
    <>
      <div className="hr-analysis-container">
        <div className="top-nav">
          <button
            className={`nav-tab ${activeTab === "Resume Screening" ? "active" : ""
              }`}
            onClick={() => handleTabClick("Resume Screening")}
          >
            Dashboard
          </button>
          <button
            className={`nav-tab ${activeTab === "Screening Test Creation" ? "active" : ""
              }`}
            onClick={() => handleTabClick("Screening Test Creation")}
          >
            Screening Test Creation
          </button>
          {/* <button
          className={`nav-tab ${activeTab === "Document Verfication" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Document Verfication")}
        >
          Document Verfication
        </button> */}
          <button
            className={`nav-tab ${activeTab === "Staff Onboarding" ? "active" : ""
              }`}
            onClick={() => handleTabClick("Staff Onboarding")}
          >
            Edit Training
          </button>

          {role === "Admin" && (
            <button
              className="so-access-trigger-btn"
              onClick={() => setOpenAccessManagement(true)}
              type="button"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#707493"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Access Management
            </button>
          )}
        </div>

        <div className="content-area" className={`content-area ${(activeTab === "Resume Screening" && activeTab !== "Smart Onboarding") ? "resume-screening-full" : ""
          }`}>
          {activeTab === "Resume Screening" && (
            <div className="resume-dashboard-wrapper">

              {/* Stats */}
              <div className="resume-top-cards">
                <div className="resume-top-card">
                  <div className="resume-icon blue">👥</div>
                  <div className="candidate-meta-data">
                    <p>OVERALL CANDIDATES</p>
                    {showCandidatesSkeleton ? (
                      <div className="resume-skeleton resume-skeleton-stat-num" />
                    ) : (
                      <h2>{smartCandidates.length}</h2>
                    )}
                  </div>
                </div>

                <div className="resume-top-card">
                  <div className="resume-icon purple">📊</div>
                  <div className="candidate-meta-data">
                    <p>ACTIVE PIPELINE</p>
                    {showCandidatesSkeleton ? (
                      <div className="resume-skeleton resume-skeleton-stat-num" />
                    ) : (
                      <h2>
                        {
                          smartCandidates.filter(
                            item => item.docs_verification_status === "pending"
                          ).length
                        }
                      </h2>
                    )}
                  </div>
                </div>

                <div className="resume-top-card">
                  <div className="resume-icon orange">📋</div>
                  <div className="candidate-meta-data">
                    <p>IN TEST STAGE</p>
                    {showCandidatesSkeleton ? (
                      <div className="resume-skeleton resume-skeleton-stat-num" />
                    ) : (
                      <h2>
                        {
                          smartCandidates.filter(
                            item =>
                              item.send_test_email_status === "sent" &&
                              item.screening_test_status === "pending"
                          ).length
                        }
                      </h2>
                    )}
                  </div>
                </div>

                <div className="resume-top-card">
                  <div className="resume-icon green">✔</div>
                  <div className="candidate-meta-data">
                    <p>VERIFIED READY</p>
                    {showCandidatesSkeleton ? (
                      <div className="resume-skeleton resume-skeleton-stat-num" />
                    ) : (
                      <h2>
                        {
                          smartCandidates.filter(
                            item => item.docs_verification_status === "verified"
                          ).length
                        }
                      </h2>
                    )}
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="resume-header-row">
                <div className="resume-header-title-content">
                  <h2 className="resume-main-title">Active Onboarding Pipeline</h2>
                  <p className="resume-sub-title">
                    Real-time deep dive into candidate stages and AI analysis.
                  </p>
                </div>

                <div className="resume-header-actions">
                  <input
                    type="text"
                    placeholder="Find a candidate..."
                    className="resume-search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button
                    className="resume-add-btn"
                    onClick={() => {
                      setHrStep("UPLOAD");
                      setHrMode("resume_screening");
                      setShowAIChat(true);
                      // Make sure the upload prompt message is added
                      setTimeout(() => {
                        setMessages([
                          {
                            sender: "bot",
                            text: "Hello! I'm Alex, your AI recruitment partner. How can I help you add a new candidate today?",
                            isWelcomeMessage: true
                          },
                          {
                            sender: "bot",
                            text: "Please upload the Job Description and candidate resumes to start screening.",
                            isUploadPrompt: true  // This flag triggers the upload box rendering
                          }
                        ]);
                      }, 100);
                    }}
                  >
                    + Add Candidates
                  </button>
                </div>
              </div>

              {/* Candidate Cards */}
              <div className={`resume-candidate-grid ${showCandidatesSkeleton ? "is-loading" : "is-loaded"}`}>
                {showCandidatesSkeleton && Array.from({ length: 4 }).map((_, idx) => (
                  <div className="resume-candidate-card resume-skeleton-card" key={`skeleton-${idx}`} aria-hidden="true">
                    <div className="resume-user-top">
                      <div className="resume-skeleton resume-skeleton-avatar" />
                      <div className="candidate-item-header resume-skeleton-header">
                        <div className="resume-skeleton resume-skeleton-line w-60" />
                        <div className="resume-skeleton resume-skeleton-line w-80" />
                        <div className="resume-skeleton resume-skeleton-line w-40" />
                      </div>
                    </div>
                    <div className="resume-middle-section">
                      <div className="resume-skeleton resume-skeleton-summary" />
                      <div className="resume-skeleton-progress-block">
                        <div className="resume-skeleton resume-skeleton-line w-50" />
                        <div className="resume-skeleton resume-skeleton-bar" />
                        <div className="resume-skeleton resume-skeleton-line w-50" />
                        <div className="resume-skeleton resume-skeleton-bar" />
                      </div>
                    </div>
                    <div className="resume-skeleton resume-skeleton-test-row" />
                  </div>
                ))}
                {!showCandidatesSkeleton && filteredCandidates.map((item) => {
                  const initials =
                    item.candidateName?.charAt(0)?.toUpperCase() || "U";

                  const score = item.candidateResumeScore || 0;
                  const testResult = testResultsById[item.candidateId];
                  console.log("test result", testResult);
                  const testScore = testResult?.candidate_test_score;
                  const testStatusRaw = testResult?.candidate_test_status;
                  const testStatusLabel = testStatusRaw
                    ? String(testStatusRaw).charAt(0).toUpperCase() +
                      String(testStatusRaw).slice(1).toLowerCase()
                    : null;
                  const isPass = testStatusRaw &&
                    String(testStatusRaw).toLowerCase() === "pass";

                  const docsStatus = String(item.docs_verification_status || "").toLowerCase();
                  const testStatus = String(item.screening_test_status || "").toLowerCase();
                  let displayStage;
                  if (docsStatus === "completed" || docsStatus === "verified") {
                    displayStage = "TRAINING";
                  } else if (testStatus === "completed" || testResult) {
                    displayStage = "DOCUMENT VERIFICATION PENDING";
                  } else {
                    displayStage = "SCREENING TEST PENDING";
                  }

                  return (
                    <div className="resume-candidate-card" key={item.candidateId}>
                      <button
                        type="button"
                        className="resume-card-delete-btn"
                        title="Delete candidate"
                        aria-label="Delete candidate"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCandidate(item);
                        }}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                          <path d="M10 11v6"></path>
                          <path d="M14 11v6"></path>
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                      <div className="resume-user-top">
                        <div className="resume-avatar">{initials}</div>

                        <div className="candidate-item-header">
                          <h3>
                            {item.candidateName || "Unknown Candidate"}
                          </h3>
                          <p>
                            {item.candidateEmail || "No email"}
                          </p>
                          <span className="resume-stage">
                            ● STAGE: {displayStage}
                          </span>
                        </div>
                      </div>

                      <div className="resume-middle-section">
                        <div className="resume-summary-box" onClick={() => setSelectedAssessment(item)}>
                          <h4>RESUME ASSESSMENT</h4>
                          <p>
                            "
                            {item.resumeSummary
                              ? item.resumeSummary.length > 220
                                ? `${item.resumeSummary.slice(0, 220).trimEnd()}...`
                                : item.resumeSummary
                              : "Candidate profile available."}
                            "
                          </p>

                          <div className="resume-score-row">
                            <span>AI Fit Score</span>
                            <strong>{score} / 100</strong>
                          </div>
                        </div>

                        <div className="resume-right-progress">

                          {(() => {
                            const required = Number(item.candidate_number_of_docs_required) || 0;
                            const uploaded = Number(item.candidate_number_of_docs_uploaded) || 0;
                            const docsPercent = required > 0
                              ? Math.min(100, Math.round((uploaded / required) * 100))
                              : 0;
                            return (
                              <div className="resume-progress-block">
                                <div className="resume-progress-head">
                                  <span>Documents</span>
                                  <span>{uploaded} / {required} uploaded</span>
                                </div>
                                <div className="resume-bar">
                                  <div
                                    className="resume-bar-fill green"
                                    style={{ width: `${docsPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })()}

                          <div className="resume-progress-block">
                            <div className="resume-progress-head">
                              <span>Training Modules</span>
                              <span>{0}% Done</span>
                            </div>
                            <div className="resume-bar">
                              <div
                                className="resume-bar-fill purple"
                                style={{ width: `${0}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`resume-test-result-row ${testResult ? "has-result" : "no-result"}`}
                        onClick={() => testResult && setSelectedTestResult({ ...testResult, candidate: item })}
                      >
                        <div className="resume-test-result-left">
                          <div className="resume-test-result-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M9 11H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-2"></path>
                              <rect x="9" y="2" width="6" height="4" rx="1"></rect>
                              <path d="M9 14h6"></path>
                              <path d="M9 18h4"></path>
                            </svg>
                          </div>
                          <div className="resume-test-result-label">Screening Test Results</div>
                        </div>
                        <div className="resume-test-result-right">
                          {testResult ? (
                            <>
                              <span className={`resume-test-result-value ${isPass ? "pass" : "fail"}`}>
                                {testStatusLabel || "—"}
                                {testScore != null && ` (${testScore}%)`}
                              </span>
                              <svg className="resume-test-result-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="9 18 15 12 9 6"></polyline>
                              </svg>
                            </>
                          ) : (
                            <span className="resume-test-result-pending">Not attempted</span>
                          )}
                        </div>
                      </div>


                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "Resume Screening" && showResults && (
            <div className="results-container">
              <h1 className="page-title">Resume Screening Results</h1>
              <p className="page-subtitle">
                Analysis complete - Review candidate profiles
              </p>

              <div className="candidates-list">
                {candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className={`candidate-card ${selectedCandidates.has(candidate.id) ? "selected" : ""
                      }`}
                    onClick={() => toggleCandidateSelection(candidate.id)}
                  >
                    <div className="candidate-info">
                      <div className="candidate-header">
                        <h3 className="candidate-name">{candidate.name}</h3>
                        <div className="candidate-score">
                          <span className="score-label">Score:</span>
                          <span className="score-value">
                            {candidate.score}/10
                          </span>
                        </div>
                      </div>

                      <div className="candidate-details">
                        {/* <p className="experience">
                        Experience: {candidate.experience}
                      </p> */}
                        <div className="star-rating">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`star ${i < Math.floor(candidate.score / 2)
                                ? "filled"
                                : ""
                                }`}
                            >
                              {i < Math.floor(candidate.score / 2) ? "★" : "☆"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="skills-container">
                        {candidate.skills.map((skill, index) => (
                          <span key={index} className="skill-tag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="action-buttons">
                {selectedCandidates.size > 0 && (
                  <button
                    className="sent-test-btn"
                    onClick={handleSendScreeningTest}
                  >
                    Send Screening Test to {selectedCandidates.size} Candidate(s)
                  </button>
                )}
              </div>
            </div>
          )}
          {activeTab === "Screening Test Creation" && <ScreeningTestCreation user={user} organizationId={organizationId} />}
        </div>
        <div className="content-areasss">
          {activeTab === "Staff Onboarding" && (
            <AdminCourseCreation_v2 user={user} organizationId={organizationId} />
          )}
          {/* {activeTab === "Document Verfication" && <AdminDocumentVerification />} */}
        </div>
      </div>
      {selectedAssessment && (
        <div
          className="resume-assessment-overlay"
          onClick={() => setSelectedAssessment(null)}
        >
          <div
            className="resume-assessment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resume-assessment-header">
              <div className="resume-assessment-title-wrap">
                <div className="resume-assessment-icon">✦</div>

                <div>
                  <h2>
                    {selectedAssessment.candidateName}'s Resume Assessment
                  </h2>
                  <p>AI POWERED DEEP ANALYSIS</p>
                </div>
              </div>

              <button
                className="resume-assessment-close"
                onClick={() => setSelectedAssessment(null)}
              >
                ×
              </button>
            </div>

            <div className="resume-score-highlight">
              <span>TECHNICAL ASSESSMENT SCORE</span>
              <strong>
                {(selectedAssessment.candidateResumeScore / 10).toFixed(1)}/10
              </strong>
            </div>

            <div className="resume-insight-list">
              <div className="resume-insight-item">
                <span>1</span>
                <p>
                  {selectedAssessment.resumeSummary ||
                    "Strong candidate profile with relevant experience."}
                </p>
              </div>

              <div className="resume-insight-item">
                <span>2</span>
                <p>
                  Candidate score:{" "}
                  {selectedAssessment.candidateResumeScore}/100
                </p>
              </div>

              <div className="resume-insight-item">
                <span>3</span>
                <p>
                  Current stage:{" "}
                  {selectedAssessment.stage
                    ?.replaceAll("_", " ")
                    ?.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="resume-modal-skills">
              {(selectedAssessment.candidateSkills || []).map(
                (skill, i) => (
                  <span key={i} className="resume-modal-skill">
                    {skill}
                  </span>
                )
              )}
            </div>

            <div className="resume-modal-footer">
              <button
                className="resume-close-btn"
                onClick={() => setSelectedAssessment(null)}
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTestResult && (
        <div
          className="resume-assessment-overlay"
          onClick={() => setSelectedTestResult(null)}
        >
          <div
            className="resume-assessment-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="resume-assessment-header">
              <div className="resume-assessment-title-wrap">
                <div className="resume-assessment-icon">✦</div>
                <div>
                  <h2>
                    {selectedTestResult.candidate?.candidateName || "Candidate"}'s Screening Test Results
                  </h2>
                  <p>AI POWERED DEEP ANALYSIS</p>
                </div>
              </div>

              <button
                className="resume-assessment-close"
                onClick={() => setSelectedTestResult(null)}
              >
                ×
              </button>
            </div>

            <div className="resume-score-highlight">
              <span>TECHNICAL ASSESSMENT SCORE</span>
              <strong>
                {selectedTestResult.candidate_test_score != null
                  ? `${selectedTestResult.candidate_test_score}%`
                  : "—"}
              </strong>
            </div>

            <div className="resume-insight-list">
              {(() => {
                const items = [];
                if (selectedTestResult.candidate_test_status) {
                  const s = String(selectedTestResult.candidate_test_status);
                  items.push(`Final Result: ${s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}`);
                }
                const analysisItems = parseTestAnalysis(selectedTestResult.test_analysis);
                analysisItems.forEach((line) => items.push(line));
                if (items.length === 0) {
                  items.push("No detailed analysis available for this submission.");
                }
                return items.map((line, idx) => (
                  <div className="resume-insight-item" key={idx}>
                    <span>{idx + 1}</span>
                    <p>{line}</p>
                  </div>
                ));
              })()}
            </div>

            <div className="resume-modal-footer">
              <button
                className="resume-close-btn"
                onClick={() => setSelectedTestResult(null)}
              >
                Close Insights
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="confirm-dialog-overlay"
          onClick={closeDeleteDialog}
          role="presentation"
        >
          <div
            className="confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
          >
            <div className="confirm-dialog-icon" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </div>

            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              Delete candidate?
            </h3>
            <p id="confirm-dialog-desc" className="confirm-dialog-desc">
              {`Are you sure you want to delete `}
              <strong>
                {deleteTarget.candidateName ||
                  deleteTarget.candidateEmail ||
                  "this candidate"}
              </strong>
              {`? This action cannot be undone.`}
            </p>

            {deleteError && (
              <div className="confirm-dialog-error" role="alert">
                {deleteError}
              </div>
            )}

            <div className="confirm-dialog-actions">
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-secondary"
                onClick={closeDeleteDialog}
                disabled={isDeletingCandidate}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-dialog-btn confirm-dialog-btn-danger"
                onClick={confirmDeleteCandidate}
                disabled={isDeletingCandidate || !organizationId}
                autoFocus
              >
                {isDeletingCandidate ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openAccessManagement && (
        <SmartOnboardingAccessManagement
          onClose={() => setOpenAccessManagement(false)}
          userEmail={user?.email}
          organizationId={organizationId}
        />
      )}
    </>

  );
};

export default HRAdminView;
