import React, { useState } from "react";
import "../../../Styles/RosteringModule/RosteringModal.css";
import searchIcon from "../../../Images/rostering_search_button.png"; // Update the path as needed
import sendIcon from "../../../Images/rostering_send_button.png"; // Update the path as needed
import Report from "./Report";
import ClientDetailsPage from "./ClientDetails"; // Add this import
import clientImage from "../../../Images/clientImage.png";
import supportWorkerImage from "../../../Images/clientImage2.png";

const AiRostering = ({
  userName = "Emma",
  coverage = 92,
  uncoveredShifts = 2,
  availableStaff = 18,
  todayVisits = 7,
  promptPlaceholder = "Find 5 qualified support workers...",
  onSendPrompt = () => {},
}) => {
  const [activeTab, setActiveTab] = useState("rostering");
  const [prompt, setPrompt] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false); // Add this state
  const [smsBroadcasted, setSmsBroadcasted] = useState(false);
  const handleSend = () => {
    if (prompt.trim()) {
      onSendPrompt(prompt);
      setPrompt("");
      setShowClientDetails(true); // Show ClientDetailsPage when send is clicked
    }
  };

  // Sample data for ClientDetailsPage - matches the image exactly
  const sampleClient = {
    name: "Sophia Carter",
    dob: "December 5th 1950",
    image: { clientImage }, // Update with actual image path
    startDate: "29 July 2025",
    address: "42 Wareland Drive, Cabba Beach, Bricome WA 6725, Australia",
    phone: "+61 8 876475",
  };

  const sampleInteractionHistory = [
    {
      title: "Initial Meeting",
      date: "June 15, 2024",
      type: "meeting",
    },
    {
      title: "Support Worker Details",
      date: "TBD",
      type: "chart",
    },
  ];

  const sampleSupportWorkers = [
    {
      name: "Elsa Smith",
      image: { supportWorkerImage }, // Update with actual image path
      profileLink: "#",
      rate: "40$/Hour",
      ageGender: "27 Year Old, Female",
      experience: "5 years of experience",
    },
    {
      name: "Henery",
      image: { supportWorkerImage }, // Update with actual image path
      profileLink: "#",
      rate: "38$/Hour",
      ageGender: "30 Year Old, Male",
      experience: "2 years of experience",
    },
    {
      name: "Brian",
      image: { supportWorkerImage }, // Update with actual image path
      profileLink: "#",
      rate: "36$/Hour",
      ageGender: "30 Year Old, Male",
      experience: "2 years of experience",
    },
    {
      name: "Brian",
      image: { supportWorkerImage }, // Update with actual image path
      profileLink: "#",
      rate: "38$/Hour",
      ageGender: "30 Year Old, Male",
      experience: "2 years of experience",
    },
  ];

  const handleBroadcastClick = () => {
    console.log("Broadcasting SMS to workers...");
    setSmsBroadcasted(true);
  };

  // If showing client details, render ClientDetailsPage without dashboard wrapper
  if (showClientDetails) {
    return (
      <ClientDetailsPage
        client={sampleClient}
        interactionHistory={sampleInteractionHistory}
        supportWorkers={sampleSupportWorkers}
        onBroadcastClick={handleBroadcastClick}
        smsBroadcasted={smsBroadcasted}
      />
    );
  }

  return (
    <div className="dashboard">
      {/* Switch Tabs */}
      <div className="tab-switch-wrapper">
        <div className="tab-switch">
          <button
            className={activeTab === "rostering" ? "tab active" : "tab"}
            onClick={() => setActiveTab("rostering")}
          >
            Rostering
          </button>
          <button
            className={activeTab === "ai" ? "tab active" : "tab"}
            onClick={() => setActiveTab("ai")}
          >
            AI Insights
          </button>
        </div>
      </div>

      {/* Conditional Content */}
      {activeTab === "rostering" ? (
        <>
          <h1 className="greeting">
            Hi {userName}, your Roster is {coverage}% covered for tomorrow
          </h1>
          <p className="subtext">
            {uncoveredShifts} shift{uncoveredShifts !== 1 && "s"} still need
            staff - let's finish them now.
          </p>

          <div className="cards">
            <div className="card">
              <div className="circle purple">{uncoveredShifts}</div>
              <span>Shifts</span>
              <p>need cover</p>
            </div>
            <div className="card">
              <div className="circle green">{availableStaff}</div>
              <span>Staff</span>
              <p>available now</p>
            </div>
            <div className="card">
              <div className="circle blue">{todayVisits}</div>
              <span>Visits</span>
              <p>today</p>
            </div>
          </div>

          <div className="styled-prompt-box">
            <img src={searchIcon} alt="Search" className="prompt-icon" />
            <textarea
              rows="4"
              placeholder={promptPlaceholder}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button className="styled-send-btn" onClick={handleSend}>
              <img src={sendIcon} alt="Send" />
            </button>
          </div>
        </>
      ) : (
        <div className="container">
          {!showReport ? (
            <div className="text-section">
              <h1>Hi Emma, Generate your AI Insights</h1>
              <button
                className="generate-ai-btn"
                onClick={() => setShowReport(true)}
              >
                Generate AI Insights
              </button>
            </div>
          ) : (
            <Report />
          )}
        </div>
      )}

      {/* Footer */}
      <div className="footer-links">
        <a href="#">Preview tomorrow roster</a>
        <span>•</span>
        <a href="#">Invite a Team Member</a>
      </div>
    </div>
  );
};

export default AiRostering;
