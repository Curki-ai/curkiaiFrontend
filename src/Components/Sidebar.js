import React, { useState, useEffect } from "react";
import "../Styles/UploaderPage.css";
import logo from "../../src/Images/CurkiAiLogo.png";
import purpleFinanicial from "../Images/purple_financial.png";
import whiteFinancial from "../Images/white_financial.png";
import purpleSirs from "../Images/purple_sirs.png";
import whiteSirs from "../Images/white_sirs.png";
import purpleQfr from "../Images/purple_quarter.png";
import whiteQfr from "../Images/white_quarter.png";
import purpleAnnual from "../Images/purple_annual.png";
import whiteAnnual from "../Images/white_annual.png";
import purpleIncidentManagement from "../Images/purple_incident.png";
import whiteIncidentManagement from "../Images/white_incident.png";
import purpleCustom from "../Images/purple_custom.png";
import whitecustom from "../Images/white_custom.png";
import purpleCareplan from "../Images/puple_careplan.png";
import whiteCareplan from "../Images/white_care.png";
import purpleIncidentReport from "../Images/purple_incidentReporting.png";
import whiteIncidentReport from "../Images/white_incidentReporting.png";
import purpleqirs from "../Images/purple_qirs.png";
import whiteqirs from "../Images/white_qirs.png";
import purpleSmartOnboarding from '../Images/purple_smartOnboarding.png';
import whiteSmartOnboarding from '../Images/white_smartOnboarding.png';
import purpleSmartRostering from '../Images/purple_smartRostering.png';
import whiteSmartRostering from '../Images/white_smartRostering.png';
import purpleEventandIncident from '../Images/purple_eventIncident.png';
import whiteEventandIncident from '../Images/white_eventIncident.png';
import purpleConnectSystem from '../Images/Purple_ConnectSystem.png';
import whiteConnectSystem from '../Images/White_ConnectSystem.png';
import purpleIncidentAuditing from '../Images/puple_incident_Auditing.png';
import whiteIncidentAuditing from '../Images/white_incident_Auditing.png';
import voiceModuleIcon from '../Images/voiceModuleIcon.png';
import voiceModuleIconWhite from '../Images/voiceModuleWhiteIcon.png';

import lock from "../Images/lock.png";
import { IoIosContact, IoIosLogOut } from "react-icons/io";
import { FaChevronUp } from "react-icons/fa";

const Sidebar = ({
  setSelectedRole,
  showReport,
  setShowReport,
  showFinalZipReport,
  setShowFinalZipReport,
  showUploadedReport,
  setShowUploadReport,
  activeReportType,
  setActiveReportType,
  analysedReportdata,
  setAnalysedReportdata,
  majorTypeofReport,
  setMajorTypeOfReport,
  setReportFiles,
  user,
  handleLogout,
  setShowSignIn,
  setShowDropdown,
  showDropdown,
}) => {
  // console.log(activeReportType);
  const [showRoles, setShowRoles] = useState(true);
  // const [activeItem, setActiveItem] = useState("Care Services & elgibility Analysis"); careplan
  const [activeItem, setActiveItem] = useState("Financial Health");

  const toggleRoles = () => {
    // setShowRoles(!showRoles);
    setShowUploadReport(false);
  };
  const ConnectButton = [
    "Connect Your Systems"
  ]
  const roles = [
    "Financial Health",
    "Payroll Analysis",
    "Clients Profitability",
    // "Client Profitability & Service",
  ];
  const AiAutomationButtons = [
    "Smart Rostering",
    "Smart Onboarding (Staff)",
    "Care Voice"
  ];
  const NDISButton = [
    "Participant Events & Incident Management",
    "Incident Auditing"
  ];
  const AgedCareButton = [
    "Quality and Risk Reporting",
    "SIRS Analysis",
    "Incident Report",
    "Custom Incident Management",
    // "Quarterly Financial Reporting",
    // "Annual Financial Reporting",
  ]

  const roleIcons = {
    "Financial Health": { white: whiteFinancial, purple: purpleFinanicial },
    "SIRS Analysis": { white: whiteSirs, purple: purpleSirs },
    "Quarterly Financial Reporting": { white: whiteQfr, purple: purpleQfr },
    "Annual Financial Reporting": { white: whiteAnnual, purple: purpleAnnual },
    "Custom Incident Management": { white: whiteIncidentManagement, purple: purpleIncidentManagement },
    "Payroll Analysis": { white: whitecustom, purple: purpleCustom },
    "Clients Profitability": { white: whiteCareplan, purple: purpleCareplan },
    "Client Profitability & Service": { white: whiteCareplan, purple: purpleCareplan },
    "Incident Report": { white: whiteIncidentReport, purple: purpleIncidentReport },
    "Quality and Risk Reporting": { white: whiteqirs, purple: purpleqirs },
    "Smart Onboarding (Staff)": { white: whiteSmartOnboarding, purple: purpleSmartOnboarding },
    "Smart Rostering": { white: whiteSmartRostering, purple: purpleSmartRostering },
    "Participant Events & Incident Management": { white: whiteEventandIncident, purple: purpleEventandIncident },
    "Incident Auditing": { white: whiteIncidentAuditing, purple: purpleIncidentAuditing },
    "Connect Your Systems": { white: whiteConnectSystem, purple: purpleConnectSystem },
    "Care Voice": {
      white: voiceModuleIconWhite,        
      purple: voiceModuleIcon,  
    },
  };

  return (
    <div className="sidebar">
      <div className="logo" style={{ cursor: "pointer" }}>
        <img src={logo} style={{ width: "75%", height: "auto" }} alt="curkiLogo" />
        <div style={{ border: "1px solid #c8c8c8", padding: "4px 8px", borderRadius: "20px", color: "#c8c8c8", marginLeft: "-10px", fontSize: "8px", marginBottom: "-20px", marginTop: "10px", }}
        >
          Beta
        </div>
      </div>
      <div className="sidebar-scroll-content" style={{ overflowY: "auto", flex: 1 }}>
        <div>
          {ConnectButton
            .map((report) => {
              const icon = roleIcons[report];
              return (
                <div key={report} className={`role-item ${activeItem === report ? "active-role" : ""}`}
                  style={{ cursor: "pointer", opacity: 1, pointerEvents: "auto", border: '1px solid #CCCCCC', borderRadius: '14px', padding: '16px 10px', marginLeft: '20px', marginTop: '14px', marginBottom: '24px' }}
                  onClick={() => {
                    let reportType = report;
                    setSelectedRole(reportType);
                    setActiveItem(report);
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", }}>
                    <img
                      src={activeItem === report ? icon.purple : icon.white}
                      alt={`${report} icon`}
                      style={{ width: "30px", height: "30px" }}
                    />
                    <div>
                      <p style={{ color: activeItem === report ? "#000000" : "#FFFFFF" }}>
                        {report}
                      </p>
                      <p style={{ color: activeItem === report ? "#000000" : "#FFFFFF", fontSize: '12px' }}>Care Management, Financial, HR</p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
        <div style={{ color: "white", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "Inter", marginBottom: "14px", alignItems: "center", gap: "6px", marginTop: "4px", }}
        >
          Aged Care/NDIS
        </div>
        {showRoles && (
          <div className="roles-list">
            {roles.map((role) => {
              return (
                <div key={role} className={`role-item ${activeItem === role ? "active-role" : ""}`}
                  onClick={() => {
                    let reportType = role;
                    if (role === "Client Profitability & Service")
                      reportType = "Client Profitability & Service";
                    setSelectedRole(reportType);
                    setActiveItem(role);
                  }}
                  style={{ cursor: "pointer", opacity: 1, marginTop: "2px" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", }}>
                    <img src={activeItem === role ? roleIcons[role].purple : roleIcons[role].white}
                      alt={`${role} icon`}
                      style={{ width: "22px", height: "22px" }}
                    />
                    <p>{role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="roles-list">
          <div style={{ color: "white", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "Inter", marginBottom: "14px", alignItems: "center", gap: "6px", marginTop: "4px", }}
          >
            AI AUTOMATION
          </div>
          {AiAutomationButtons
            .map((report) => {
              const icon = roleIcons[report];
              return (
                <div key={report} className={`role-item ${activeItem === report ? "active-role" : ""}`}
                  style={{ cursor: "pointer", marginTop: "2px", opacity: 1, pointerEvents: "auto", }}
                  onClick={() => {
                    let reportType = report;
                    setSelectedRole(reportType);
                    setActiveItem(report);
                    setMajorTypeOfReport("AI AUTOMATION");
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", }}>
                    {icon ? (
                      <img
                        src={activeItem === report ? icon.purple : icon.white}
                        alt={`${report} icon`}
                        style={{ width: "22px", height: "22px" }}
                      />
                    ) : (
                      <img
                        src={lock}
                        alt="lock"
                        style={{ width: "22px", height: "22px" }}
                      />
                    )}
                    <p style={{ color: activeItem === report ? "#000000" : "#FFFFFF" }}>
                      {report}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>

        {/* NDIS (Locked) */}
        <div className="roles-list">
          <div
            style={{ color: "white", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "Inter", marginBottom: "14px", alignItems: "center", gap: "6px", marginTop: "4px", }}
          >
            NDIS
          </div>

          {NDISButton.map((report) => {
            const icon = roleIcons[report];
            const isEnabled = true; // Always enabled now

            return (
              <div
                key={report}
                className={`role-item ${activeItem === report ? "active-role" : ""
                  }`}
                style={{
                  cursor: isEnabled ? "pointer" : "not-allowed",
                  marginTop: "2px",
                  opacity: isEnabled ? 1 : 0.6,
                  pointerEvents: isEnabled ? "auto" : "none",
                }}
                onClick={() => {
                  if (!isEnabled) return;

                  let reportType = report;

                  // Map UI names to internal report types
                  if (report === "Participant Events & Incident Management")
                    reportType = "Participant Events & Incident Management";
                  else if (report === "Audit & Registration Manager")
                    reportType = "Audit & Registration Manager";
                  else if (report === "Incident & Complaint Reporter")
                    reportType = "Incident & Complaint Reporter";
                  else if (
                    report === "Restrictive Practice & Behaviour Support"
                  )
                    reportType = "Restrictive Practice & Behaviour Support";
                  else if (report === "Worker-Screening & HR Compliance")
                    reportType = "Worker-Screening & HR Compliance";
                  else if (report === "Financial & Claims Compliance")
                    reportType = "Financial & Claims Compliance";
                  else if (
                    report === "Participant Outcomes & Capacity-Building"
                  )
                    reportType = "Participant Outcomes & Capacity-Building";

                  // Set both selectedRole and activeReportType
                  setSelectedRole(reportType);
                  setActiveItem(report);
                  setActiveReportType(reportType);

                  // Reset views
                  setShowReport(false);
                  setShowFinalZipReport(false);
                  setShowUploadReport(true);
                  setMajorTypeOfReport("NDIS");

                  if (analysedReportdata) setAnalysedReportdata(null);
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {isEnabled && icon ? (
                    <img
                      src={activeItem === report ? icon.purple : icon.white}
                      alt={`${report} icon`}
                      style={{ width: "22px", height: "22px" }}
                    />
                  ) : (
                    <img
                      src={lock}
                      alt="lock"
                      style={{ width: "22px", height: "22px" }}
                    />
                  )}
                  <p
                    style={{
                      color: isEnabled
                        ? activeItem === report
                          ? "#000000"
                          : "#FFFFFF"
                        : "#929592",
                    }}
                  >
                    {report}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="roles-list">
          <div style={{ color: "white", fontSize: "18px", fontWeight: "bold", textAlign: "center", fontFamily: "Inter", marginBottom: "6px", alignItems: "center", gap: "6px", marginTop: "4px", }}
          >
            AGED CARE
          </div>
          <div style={{ fontSize: '14px', fontWeight: '400', color: 'white', fontFamily: 'Inter', textAlign: 'center', marginBottom: '14px' }}>SUPPORT AT HOME | HCP | CHSP</div>
          {AgedCareButton
            .map((report) => {
              const icon = roleIcons[report];
              return (
                <div key={report} className={`role-item ${activeItem === report ? "active-role" : ""}`}
                  style={{ cursor: "pointer", marginTop: "2px", opacity: 1, pointerEvents: "auto", }}
                  onClick={() => {
                    let reportType = report;
                    if (report === "Care Services & Eligibility Analysis")
                      reportType = "Client Profitability & Service";
                    setSelectedRole(reportType);
                    setActiveItem(report);
                    setMajorTypeOfReport("SUPPORT AT HOME");
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {icon ? (
                      <img
                        src={activeItem === report ? icon.purple : icon.white}
                        alt={`${report} icon`}
                        style={{ width: "22px", height: "22px" }}
                      />
                    ) : (
                      <img
                        src={lock}
                        alt="lock"
                        style={{ width: "22px", height: "22px" }}
                      />
                    )}
                    <p
                      style={{
                        color: activeItem === report
                          ? "#000000"
                          : "#FFFFFF"
                      }}
                    >
                      {report}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      <>
        <div style={{ display: "flex", justifyContent: "center" }}>
          {showDropdown && (
            <button onClick={handleLogout} className="logout-button">
              {" "}
              <IoIosLogOut size={24} color="#6C4CDC" />
              Logout
            </button>
          )}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignSelf: "center",
            width: "90%",
            alignItems: "center",
            border: "1px solid white",
            marginBottom: "20px",
            padding: "11px 14px",
            borderRadius: "12px",
            // background: "#232627",
            cursor: "pointer",
          }}
          onClick={() => {
            if (!user) {
              setShowSignIn(true);
            } else {
              setShowDropdown((prev) => !prev);
            }
          }}
        >
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <IoIosContact color="white" size={36} />
            <div>
              <div
                style={{
                  color: "#c8c8c8",
                  fontSize: "14px",
                  textAlign: "left",
                  fontWeight: "bold",
                }}
              >
                {user?.displayName}
              </div>
              <div
                style={{
                  color: "#c8c8c8",
                  fontSize: "12px",
                  textAlign: "left",
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <FaChevronUp color="white" size={16} />
        </div>
      </>
    </div>
  );
};
export default Sidebar;
