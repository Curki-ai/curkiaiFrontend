import React, { useState } from "react";
import "../../../Styles/ResumeScreening.css";
import StaffOnboarding from "./StaffOnboarding";
import StaffComplianceDashboard from "./StaffComplianceDashboard";
import UploadFiles from "../../UploadFiles";
import ScreeningTestCreation from "./ScreeningTestCreation";
import AdminDocumentVerification from "./AdminDocumentVerification";
import AdminCourseCreation from "./AdminCourseCreation";

const HRAdminView = ({
  handleClick,
  setShowFeedbackPopup,
  role,
  selectedRole,
  user,
  setManualResumeZip
}) => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [selectedJd, setSelectedJd] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("Resume Screening");
  const [showResults, setShowResults] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  const [candidates, setCandidates] = useState([]);
  const [progress, setProgress] = useState(0);

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

      // 🎯 API Completed → Instantly jump to 100%
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



  return (
    <div className="hr-analysis-container">
      <div className="top-nav">
        <button
          className={`nav-tab ${activeTab === "Resume Screening" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Resume Screening")}
        >
          Resume Screening
        </button>
        <button
          className={`nav-tab ${activeTab === "Screening Test Creation" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Screening Test Creation")}
        >
          Screening Test Creation
        </button>
        <button
          className={`nav-tab ${activeTab === "Document Verfication" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Document Verfication")}
        >
          Document Verfication
        </button>
        <button
          className={`nav-tab ${activeTab === "Staff Onboarding" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Staff Onboarding")}
        >
          Edit Training
        </button>
        <button
          className={`nav-tab ${activeTab === "Staff Compliance Check" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Staff Compliance Check")}
        >
          Staff Compliance Check
        </button>
      </div>

      <div className="content-area">
        {activeTab === "Resume Screening" && !showResults && (
          <div className="upload-section-container">
            {/* <h1 className="page-title">Resume Screening</h1> */}
            <p className="page-subtitle">
              Upload Job Description and Zip folder with multiple staff resumes
            </p>

            <div className="uploader-grid"
              style={{ display: 'flex', justifyContent: 'center' }}>
              <UploadFiles
                files={selectedJd}
                setFiles={setSelectedJd}
                title='Job Description'
                subtitle='Upload .doc or .pdf file'
                fileformat=".docx, .doc, .pdf"
                removeFile={(index) => {
                  setSelectedJd(prev => prev.filter((_, i) => i !== index));
                }}
                multiple={false}
                isProcessing={isAnalyzing}
              />
              <UploadFiles
                files={selectedFile}
                setFiles={setSelectedFile}
                title='Resumes'
                subtitle='Upload .zip, .rar file'
                fileformat=".zip, .rar"
                removeFile={(index) => {
                  setSelectedFile(prev => prev.filter((_, i) => i !== index));
                }}
                multiple={false}
                isProcessing={isAnalyzing}
              />
            </div>

            <button
              className={`analyze-btn ${isAnalyzing ? "analyzing" : ""}`}
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <span className="resume-screening-progress-text">Analyzing {progress}%</span>
                </>
              ) : (
                "Analyse"
              )}
            </button>

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
        {activeTab === "Screening Test Creation" && <ScreeningTestCreation />}
        {activeTab === "Staff Compliance Check" && <StaffComplianceDashboard />}
      </div>
      <div className="content-areasss">
        {activeTab === "Staff Onboarding" && <AdminCourseCreation user={user} />}
        {activeTab === "Document Verfication" && <AdminDocumentVerification />}
      </div>
    </div>
  );
};

export default HRAdminView;
