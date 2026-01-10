import React, { useState } from "react";
import "../../../Styles/ResumeScreening.css";
import ScreeningTest from "./ScreeningTest";
import StaffOnboarding from "./StaffOnboarding";
import DocumentVerification from "./DocumentVerification";

const HRStaffView = ({
  selectedRole,
  handleClick,
  setShowFeedbackPopup,
  user
}) => {
  const [selectedFile, setSelectedFile] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("Screening Test");
  const [showResults, setShowResults] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState(new Set());
  
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith(".zip") || file.name.endsWith(".rar"))) {
      setSelectedFile(file);
    } else {
      alert("Please upload only .zip or .rar files");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".zip") || file.name.endsWith(".rar"))) {
      setSelectedFile(file);
    } else {
      alert("Please drop only .zip or .rar files");
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      alert("Please select a file first!");
      return;
    }
    setIsAnalyzing(true);

    try {
      if (handleClick) {
        await handleClick();
      }

      // Simulate analysis delay
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setShowResults(true);
      setIsAnalyzing(false);

      if (setShowFeedbackPopup) {
        setShowFeedbackPopup(true);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      setIsAnalyzing(false);
      alert("Analysis failed. Please try again.");
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

  const candidates = [
    {
      id: 1,
      name: "Robert Drowski",
      score: 8,
      experience: "2 years",
      skills: ["React", "Node.js", "MongoDB"],
    },
    {
      id: 2,
      name: "Sarah Johnson",
      score: 9,
      experience: "3 years",
      skills: ["Vue.js", "Express", "PostgreSQL"],
    },
    {
      id: 3,
      name: "Michael Chen",
      score: 7,
      experience: "1.5 years",
      skills: ["Angular", "Python", "Docker"],
    },
    {
      id: 4,
      name: "Emily Rodriguez",
      score: 8,
      experience: "4 years",
      skills: ["TypeScript", "AWS", "GraphQL"],
    },
    {
      id: 5,
      name: "David Thompson",
      score: 9,
      experience: "5 years",
      skills: ["JavaScript", "Kubernetes", "Redis"],
    },
  ];

  return (
    <div className="hr-analysis-container">
      <div className="top-nav">
        <button
          className={`nav-tab ${activeTab === "Screening Test" ? "active" : ""
            }`}
          onClick={() => handleTabClick("Screening Test")}
        >
          Screening Test
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
          Staff Onboarding
        </button>
      </div>

      <div className="content-area">
        {activeTab === "Screening Test" && <ScreeningTest />}
        {activeTab === "Staff Onboarding" && <StaffOnboarding user={user}/>}
        {activeTab === "Document Verfication" && <DocumentVerification />}
      </div>
    </div>
  );
};

export default HRStaffView;
