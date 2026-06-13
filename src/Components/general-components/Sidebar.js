import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "../../Styles/general-styles/UploaderPage.css";
import "../../Styles/general-styles/Sidebar.css";
import { API_BASE } from "../../config/apiBase";
import logo from "../../../src/Images/CurkiAiLogo.png";
import purpleFinanicial from "../../Images/purple_financial.png";
import whiteFinancial from "../../Images/white_financial.png";
import purpleSirs from "../../Images/purple_sirs.png";
import whiteSirs from "../../Images/white_sirs.png";
import purpleQfr from "../../Images/purple_quarter.png";
import whiteQfr from "../../Images/white_quarter.png";
import purpleAnnual from "../../Images/purple_annual.png";
import whiteAnnual from "../../Images/white_annual.png";
import purpleIncidentManagement from "../../Images/purple_incident.png";
import whiteIncidentManagement from "../../Images/white_incident.png";
import purpleCustom from "../../Images/purple_custom.png";
import whitecustom from "../../Images/white_custom.png";
import purpleCareplan from "../../Images/puple_careplan.png";
import whiteCareplan from "../../Images/white_care.png";
import purpleIncidentReport from "../../Images/purple_incidentReporting.png";
import whiteIncidentReport from "../../Images/white_incidentReporting.png";
import purpleqirs from "../../Images/purple_qirs.png";
import whiteqirs from "../../Images/white_qirs.png";
import purpleSmartOnboarding from '../../Images/purple_smartOnboarding.png';
import whiteSmartOnboarding from '../../Images/white_smartOnboarding.png';
import purpleSmartRostering from '../../Images/purple_smartRostering.png';
import whiteSmartRostering from '../../Images/white_smartRostering.png';
import purpleEventandIncident from '../../Images/purple_eventIncident.png';
import whiteEventandIncident from '../../Images/white_eventIncident.png';
import purpleConnectSystem from '../../Images/Purple_ConnectSystem.png';
import whiteConnectSystem from '../../Images/White_ConnectSystem.png';
import purpleIncidentAuditing from '../../Images/puple_incident_Auditing.png';
import whiteIncidentAuditing from '../../Images/white_incident_Auditing.png';
import voiceModuleIcon from '../../Images/voiceModuleIcon.png';
import voiceModuleIconWhite from '../../Images/voiceModuleWhiteIcon.png';
import oliverAi from '../../Images/oliver_ai.png';
import zoeAi from '../../Images/zoe_ai.png';
import alexAi from '../../Images/alex_ai.png';
import willAi from '../../Images/will_ai.png';
import jamesAi from '../../Images/james_ai.png';
import adminProfileDown from "../../Images/adminProfileDownArrow.svg";
import adminProfileRight from "../../Images/adminProfilerightArrow.svg";
import adminProfileUpgrade from "../../Images/adminProfileUpgrade.svg";
import adminProfilePlanAndBill from "../../Images/adminProfilePlansAndBill.svg";
import adminProfileTeamMembers from "../../Images/adminProfileTeamMembers.svg";
import adminProfileSettings from "../../Images/adminProfileSettings.svg";
import AiSideBarIcon from "../../Images/AiSideBarIcon.svg"
import AiSmsSideBarIcon from "../../Images/SmsSideBarIcon.svg"
import lock from "../../Images/lock.png";
import { IoIosContact, IoIosLogOut } from "react-icons/io";
import sideBarLogout from "../../Images/sideBarLogout.svg"
import viewDetailsSideBarRight from "../../Images/viewDetailsRightArrow.svg"
import { FaChevronUp, FaChevronDown } from "react-icons/fa";
import PricingPlansModal from "./NewPricingModal";
import axios from "axios";

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
  isOwner,
  handleLogout,
  setShowSignIn,
  setShowDropdown,
  showDropdown,
  openSettings,
  openTeamMembers,
  openUsageDetails,
  openPlansBilling,
  closeAllPanels
}) => {
  // console.log(activeReportType);
  // const [showRoles, setShowRoles] = useState(true); // legacy — pre-redesign roles toggle
  // const [activeItem, setActiveItem] = useState("Care Services & elgibility Analysis"); careplan
  const [activeItem, setActiveItem] = useState("Financial Health");
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [usageSummary, setUsageSummary] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // The card that owns the currently-active module is always expanded and
  // stays open until the user switches to a different module. `browseAgent`
  // is an optional second card the user has expanded to peek into before
  // committing to one of its modules.
  const [browseAgent, setBrowseAgent] = useState(null);

  const truncate = (text, maxLength = 25) => {
    if (!text) return "";
    return text.length > maxLength
      ? text.slice(0, maxLength) + "..."
      : text;
  };

  // Compact number formatter for the Plan Usage Overview when there's no
  // plan limit to compute a percentage against. e.g. 21993204 → "22M".
  const formatCompact = (n) => {
    const x = Number(n || 0);
    if (!Number.isFinite(x) || x === 0) return "0";
    if (x >= 1e9) return `${(x / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
    if (x >= 1e6) return `${(x / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
    if (x >= 1e3) return `${(x / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
    return String(x);
  };
  useEffect(() => {
    if (!user?.email) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/user/get?userEmail=${user?.email}`,
        );


        setIsAdmin(res.data.isAdmin);
      } catch (error) {
        console.error("User fetch error:", error);
      }
    };

    fetchUser();
  }, [user]);
  useEffect(() => {
    if (!user?.email) return;

    const email = user.email.toLowerCase();

    const fetchUsageSummary = async () => {
      try {
        setUsageLoading(true);

        // Per-user usage (combined across all modules) from the usage-v2
        // controller. This is the signed-in user's own usage, not a domain
        // rollup — so there are no plan limits/percentages and the card shows
        // raw counts.
        const res = await axios.get(
          `${API_BASE}/api/usage/v2/user/${encodeURIComponent(email)}/summary?range=year`,
        );
        const totals = res.data?.totals || {};
        setUsageSummary({
          totalTokensUsed: totals.tokens || 0,
          totalSmsUsed: totals.sms || 0,
        });
      } catch (err) {
        console.error("Usage fetch error:", err);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsageSummary();
  }, [user]);
  const tokenLimit =
    usageSummary?.tokenUsagePercent > 0
      ? Math.round(
        usageSummary.totalTokensUsed /
        (usageSummary.tokenUsagePercent / 100)
      )
      : 0;

  const smsLimit =
    usageSummary?.smsUsagePercent > 0
      ? Math.round(
        usageSummary.totalSmsUsed /
        (usageSummary.smsUsagePercent / 100)
      )
      : 0;
  // const toggleRoles = () => {
  //   // setShowRoles(!showRoles);
  //   setShowUploadReport(false);
  // };
  const ConnectButton = [
    "Connect Your Systems"
  ]
  const roles = [
    "Financial Health",
    "Payroll Analysis",
    "Clients Profitability",
    // "Client Profitability & Service",
  ];
  const NDISButton = [
    "Participant Events & Incident Management",
    "Incident Auditing"
  ];
  // Legacy report groups — kept (commented) from before the AI-associate
  // sidebar redesign so they can be restored if needed.
  // const AiAutomationButtons = [
  //   "Smart Rostering",
  //   "Smart Onboarding (Staff)",
  //   "Care Voice"
  // ];
  // const AgedCareButton = [
  //   "Quality and Risk Reporting",
  //   "SIRS Analysis",
  //   "Incident Report",
  //   "Custom Incident Management",
  //   // "Quarterly Financial Reporting",
  //   // "Annual Financial Reporting",
  // ];

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

  // ---- AI-associate card model -------------------------------------------
  // Each associate is an expandable card whose children are the existing
  // reports. The click behaviour is preserved per group: Finance items don't
  // touch majorTypeOfReport, AI-Automation items set "AI AUTOMATION", and the
  // incident items run the original NDIS flow.
  const handleFinanceItem = (role) => {
    setSelectedRole(role);
    setActiveItem(role);
    setBrowseAgent(null);
    closeAllPanels();
    setShowProfilePanel(false);
  };

  const handleAiAutomationItem = (report) => {
    setSelectedRole(report);
    setActiveItem(report);
    setBrowseAgent(null);
    setMajorTypeOfReport("AI AUTOMATION");
    closeAllPanels();
    setShowProfilePanel(false);
  };

  const handleNdisItem = (report) => {
    setSelectedRole(report);
    setActiveItem(report);
    setBrowseAgent(null);
    setActiveReportType(report);
    setShowReport(false);
    setShowFinalZipReport(false);
    setShowUploadReport(true);
    setMajorTypeOfReport("NDIS");
    if (analysedReportdata) setAnalysedReportdata(null);
    closeAllPanels();
    setShowProfilePanel(false);
  };

  const agentSections = [
    {
      heading: "Finance and Operations",
      agents: [
        {
          id: "oliver",
          name: "Oliver AI",
          role: "CFO Associate",
          avatar: oliverAi,
          items: roles,
          onItemClick: handleFinanceItem,
        },
      ],
    },
    {
      heading: "AI Automation",
      agents: [
        {
          id: "zoe",
          name: "Zoe AI",
          role: "V2D Associate",
          avatar: zoeAi,
          // Zoe is itself a single module — no dropdown; the card opens
          // Care Voice directly.
          direct: true,
          items: ["Care Voice"],
          onItemClick: handleAiAutomationItem,
        },
        {
          id: "alex",
          name: "Alex AI",
          role: "HR Associate",
          avatar: alexAi,
          // Alex opens Smart Onboarding directly — no dropdown.
          direct: true,
          items: ["Smart Onboarding (Staff)"],
          onItemClick: handleAiAutomationItem,
        },
        {
          id: "will",
          name: "Will AI",
          role: "Rostering Associate",
          avatar: willAi,
          // Will opens Smart Rostering directly — no dropdown.
          direct: true,
          items: ["Smart Rostering"],
          onItemClick: handleAiAutomationItem,
        },
        {
          id: "james",
          name: "James AI",
          role: "Compliance Associate",
          avatar: jamesAi,
          // Expandable: holds the incident modules.
          items: NDISButton,
          onItemClick: handleNdisItem,
        },
      ],
    },
  ];

  // Which expandable card owns the active module (null for the direct
  // cards, which have no dropdown). This card is always shown expanded.
  const activeOwnerId =
    agentSections
      .flatMap((section) => section.agents)
      .find((agent) => !agent.direct && agent.items.includes(activeItem))?.id ||
    null;

  // The active module's card can't be collapsed; toggling a header only
  // opens/closes the optional browse card.
  const toggleAgent = (id) => {
    if (id === activeOwnerId) return;
    setBrowseAgent((prev) => (prev === id ? null : id));
  };

  const ProfileItem = ({ icon, text, arrow, highlight }) => (
    <div className={`profile-item ${highlight ? "highlight" : ""}`}>

      <div className="profile-item-left">
        <img src={icon} className="profile-item-icon" />
        <span>{text}</span>
      </div>

      {arrow && (
        <div style={{ width: "24px", height: "24px" }}>
          <img src={adminProfileRight} className="profile-item-arrow" />
        </div>
      )}

    </div>
  );



  return (
    <div className="sidebar">
      <div className="sb-header">
        <img src={logo} className="sb-logo-img" alt="curkiLogo" />
        <div className="sb-beta-pill">Beta</div>
      </div>
      <div className="sidebar-scroll-content">
        {ConnectButton.map((report) => {
          const icon = roleIcons[report];
          const isActive = activeItem === report;
          return (
            <div
              key={report}
              className={`sb-connect-card ${isActive ? "active-role" : ""}`}
              onClick={() => {
                setSelectedRole(report);
                setActiveItem(report);
                closeAllPanels();
                setShowProfilePanel(false);
              }}
            >
              <img
                src={isActive ? icon.purple : icon.white}
                alt={`${report} icon`}
                className="sb-connect-icon"
              />
              <div className="sb-connect-text">
                <p className="sb-connect-title">{report}</p>
                <p className="sb-connect-subtitle">Care Management, Financial, HR</p>
              </div>
            </div>
          );
        })}

        {agentSections.map((section) => (
          <div className="sb-section" key={section.heading}>
            <div className="sb-section-heading">{section.heading}</div>
            <div className="sb-agent-list">
              {section.agents.map((agent) => {
                // Direct agents (Zoe, Alex) are themselves a single module:
                // the whole card is the button — no chevron, no dropdown.
                if (agent.direct) {
                  const moduleName = agent.items[0];
                  const isActive = activeItem === moduleName;
                  return (
                    <div
                      key={agent.id}
                      className={`sb-agent-card sb-agent-card--direct ${isActive ? "active" : ""}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setBrowseAgent(null);
                        agent.onItemClick(moduleName);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setBrowseAgent(null);
                          agent.onItemClick(moduleName);
                        }
                      }}
                    >
                      <div className="sb-agent-header">
                        <img
                          src={agent.avatar}
                          alt={agent.name}
                          className="sb-agent-avatar"
                        />
                        <div className="sb-agent-meta">
                          <p className="sb-agent-name">{agent.name}</p>
                          <span className="sb-agent-role">{agent.role}</span>
                        </div>
                      </div>
                    </div>
                  );
                }

                const isExpanded =
                  agent.id === activeOwnerId || agent.id === browseAgent;
                return (
                  <div
                    key={agent.id}
                    className={`sb-agent-card ${isExpanded ? "expanded" : ""}`}
                  >
                    <div
                      className="sb-agent-header"
                      onClick={() => toggleAgent(agent.id)}
                    >
                      <img
                        src={agent.avatar}
                        alt={agent.name}
                        className="sb-agent-avatar"
                      />
                      <div className="sb-agent-meta">
                        <div className="sb-agent-name-row">
                          <p className="sb-agent-name">{agent.name}</p>
                          <FaChevronDown
                            className={`sb-agent-chevron ${isExpanded ? "open" : ""}`}
                          />
                        </div>
                        <span className="sb-agent-role">{agent.role}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="sb-agent-items">
                        {agent.items.map((item) => {
                          const icon = roleIcons[item];
                          const isActive = activeItem === item;
                          return (
                            <div
                              key={item}
                              className={`sb-agent-item ${isActive ? "active" : ""}`}
                              onClick={() => agent.onItemClick(item)}
                            >
                              {icon ? (
                                <img
                                  src={icon.white}
                                  alt={`${item} icon`}
                                />
                              ) : (
                                <img src={lock} alt="lock" />
                              )}
                              <p>{item}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* ============================================================
            Legacy sidebar sections (pre AI-associate redesign).
            Kept commented for reference / quick rollback.
            ------------------------------------------------------------
        {showRoles && (
          <div className="sb-section">
            <div className="sb-section-heading">Aged Care / NDIS</div>
            <div className="sb-section-items">
              {roles.map((role) => {
                const isActive = activeItem === role;
                return (
                  <div
                    key={role}
                    className={`role-item ${isActive ? "active-role" : ""}`}
                    onClick={() => {
                      let reportType = role;
                      if (role === "Client Profitability & Service")
                        reportType = "Client Profitability & Service";
                      setSelectedRole(reportType);
                      setActiveItem(role);
                      closeAllPanels();
                      setShowProfilePanel(false);
                    }}
                  >
                    <img
                      src={isActive ? roleIcons[role].purple : roleIcons[role].white}
                      alt={`${role} icon`}
                    />
                    <p>{role}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="sb-section">
          <div className="sb-section-heading">AI Automation</div>
          <div className="sb-section-items">
            {AiAutomationButtons.map((report) => {
              const icon = roleIcons[report];
              const isActive = activeItem === report;
              return (
                <div
                  key={report}
                  className={`role-item ${isActive ? "active-role" : ""}`}
                  onClick={() => {
                    setSelectedRole(report);
                    setActiveItem(report);
                    setMajorTypeOfReport("AI AUTOMATION");
                    closeAllPanels();
                    setShowProfilePanel(false);
                  }}
                >
                  {icon ? (
                    <img
                      src={isActive ? icon.purple : icon.white}
                      alt={`${report} icon`}
                    />
                  ) : (
                    <img src={lock} alt="lock" />
                  )}
                  <p>{report}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sb-section">
          <div className="sb-section-heading">NDIS</div>
          <div className="sb-section-items">
            {NDISButton.map((report) => {
              const icon = roleIcons[report];
              const isEnabled = true;
              const isActive = activeItem === report;

              return (
                <div
                  key={report}
                  className={`role-item ${isActive ? "active-role" : ""}`}
                  style={{
                    cursor: isEnabled ? "pointer" : "not-allowed",
                    opacity: isEnabled ? 1 : 0.6,
                    pointerEvents: isEnabled ? "auto" : "none",
                  }}
                  onClick={() => {
                    if (!isEnabled) return;

                    let reportType = report;
                    if (report === "Participant Events & Incident Management")
                      reportType = "Participant Events & Incident Management";
                    else if (report === "Audit & Registration Manager")
                      reportType = "Audit & Registration Manager";
                    else if (report === "Incident & Complaint Reporter")
                      reportType = "Incident & Complaint Reporter";
                    else if (report === "Restrictive Practice & Behaviour Support")
                      reportType = "Restrictive Practice & Behaviour Support";
                    else if (report === "Worker-Screening & HR Compliance")
                      reportType = "Worker-Screening & HR Compliance";
                    else if (report === "Financial & Claims Compliance")
                      reportType = "Financial & Claims Compliance";
                    else if (report === "Participant Outcomes & Capacity-Building")
                      reportType = "Participant Outcomes & Capacity-Building";

                    setSelectedRole(reportType);
                    setActiveItem(report);
                    setActiveReportType(reportType);
                    setShowReport(false);
                    setShowFinalZipReport(false);
                    setShowUploadReport(true);
                    setMajorTypeOfReport("NDIS");

                    if (analysedReportdata) setAnalysedReportdata(null);
                    closeAllPanels();
                    setShowProfilePanel(false);
                  }}
                >
                  {isEnabled && icon ? (
                    <img
                      src={isActive ? icon.purple : icon.white}
                      alt={`${report} icon`}
                    />
                  ) : (
                    <img src={lock} alt="lock" />
                  )}
                  <p>{report}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="sb-section">
          <div className="sb-section-heading">Aged Care</div>
          <div className="sb-section-subheading">Support at Home | HCP | CHSP</div>
          <div className="sb-section-items">
            {AgedCareButton.map((report) => {
              const icon = roleIcons[report];
              const isActive = activeItem === report;
              return (
                <div
                  key={report}
                  className={`role-item ${isActive ? "active-role" : ""}`}
                  onClick={() => {
                    let reportType = report;
                    if (report === "Care Services & Eligibility Analysis")
                      reportType = "Client Profitability & Service";
                    setSelectedRole(reportType);
                    setActiveItem(report);
                    setMajorTypeOfReport("SUPPORT AT HOME");
                    closeAllPanels();
                    setShowProfilePanel(false);
                  }}
                >
                  {icon ? (
                    <img
                      src={isActive ? icon.purple : icon.white}
                      alt={`${report} icon`}
                    />
                  ) : (
                    <img src={lock} alt="lock" />
                  )}
                  <p>{report}</p>
                </div>
              );
            })}
          </div>
        </div>
            ============================================================ */}
      </div>
      <div className="profile-wrapper">

        {/* USER BUTTON */}
        <div
          className={`profile-button ${showProfilePanel ? "active-profile-button" : ""}`}
          onClick={() => {
            if (!user) {
              setShowSignIn(true);
              return;
            }

            setShowProfilePanel(prev => !prev);
          }}
        >
          <div className="profile-button-left">

            <IoIosContact
              color={showProfilePanel ? "#000000" : "#FFFFFF"}
              size={36}
            />

            <div>
              <div className="profile-name">{user?.displayName}</div>
              <div className="profile-email"> {truncate(user?.email, 25)}</div>
            </div>

          </div>

          <img src={adminProfileRight} className="profile-arrow" />

        </div>


        {/* PROFILE PANEL — rendered via portal so it escapes every parent
            stacking context (sidebar's sticky position, module-level
            containers, etc.) and reliably sits above the page. */}
        {showProfilePanel && createPortal(
          <>
          <div
            className="profile-backdrop"
            onClick={() => setShowProfilePanel(false)}
          />
          <div className="profile-panel">

            {/* HEADER */}
            <div className="profile-header">

              <img
                src={
                  user?.photoURL ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.displayName || user?.email || "User"
                  )}&background=6C4CDC&color=fff&bold=true`
                }
                className="profile-avatar"
                alt=""
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.displayName || user?.email || "User"
                  )}&background=6C4CDC&color=fff&bold=true`;
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />

              <div className="profile-header-info">
                {isAdmin ? (<div className="profile-badge">Admin</div>) : (<div className="profile-badge">Staff</div>)}
                <div className="profile-header-name">{user?.displayName}</div>
                <div className="profile-header-email">{truncate(user?.email, 25)}</div>
              </div>


            </div>


            {/* Usage */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="usage-overview-wrapper">

                <div className="usage-overview-card">

                  <div className="usage-title">
                    Plan Usage Overview
                  </div>

                  <div className="usage-subtitle">
                    Combined usage across all modules
                  </div>

                  {/* AI TOKENS */}
                  <div className="usage-row">
                    <div className="usage-left">
                      <img src={AiSideBarIcon} className="usage-icon-img" />
                      <div className="usage-label">
                        AI tokens used
                      </div>

                    </div>

                    <div className="usage-percent">
                      {/* Percent is only meaningful when the domain has a
                          plan with a token limit. Otherwise show the raw
                          count (compactly) so the user sees actual usage
                          instead of a useless "0%". */}
                      {usageSummary?.planTokenLimit > 0
                        ? `${usageSummary?.tokenUsagePercent || 0}%`
                        : formatCompact(usageSummary?.totalTokensUsed)}
                    </div>

                  </div>

                  <div className="usage-bar">
                    <div
                      className="usage-bar-fill"
                      style={{
                        width: `${
                          usageSummary?.planTokenLimit > 0
                            ? Math.min(usageSummary?.tokenUsagePercent || 0, 100)
                            : usageSummary?.totalTokensUsed > 0
                            ? 100
                            : 0
                        }%`,
                        opacity: usageSummary?.planTokenLimit > 0 ? 1 : 0.45,
                      }}
                    />
                  </div>


                  {/* SMS */}
                  <div className="usage-row">

                    <div className="usage-left">


                      <img src={AiSmsSideBarIcon} className="usage-icon-img" />


                      <div className="usage-label">
                        Sms used
                      </div>

                    </div>

                    <div className="usage-percent">
                      {usageSummary?.planSmsLimit > 0
                        ? `${usageSummary?.smsUsagePercent || 0}%`
                        : formatCompact(usageSummary?.totalSmsUsed)}
                    </div>

                  </div>

                  <div className="usage-bar">
                    <div
                      className="usage-bar-fill"
                      style={{
                        width: `${
                          usageSummary?.planSmsLimit > 0
                            ? Math.min(usageSummary?.smsUsagePercent || 0, 100)
                            : usageSummary?.totalSmsUsed > 0
                            ? 100
                            : 0
                        }%`,
                        opacity: usageSummary?.planSmsLimit > 0 ? 1 : 0.45,
                      }}
                    />
                  </div>


                  {/* View Details (Plan Usage) is owner-only. Non-owners still
                      see the row, but it's greyed out and unclickable. */}
                  <div
                    className={`usage-details ${isOwner ? "" : "usage-details-disabled"}`}
                    onClick={
                      isOwner
                        ? () => {
                            setShowProfilePanel(false);
                            setActiveItem("");
                            openUsageDetails();
                          }
                        : undefined
                    }
                    style={{
                      cursor: isOwner ? "pointer" : "not-allowed",
                      opacity: isOwner ? 1 : 0.45,
                    }}
                    title={
                      isOwner
                        ? undefined
                        : "Only the organization owner can view detailed plan usage"
                    }
                    aria-disabled={!isOwner}
                  >
                    <p>View Details</p>
                    <img src={viewDetailsSideBarRight} className="profile-item-arrow" />
                  </div>

                </div>

              </div>




              {/* CENTERED CARD */}
              <div className="profile-card-wrapper">

                <div className="profile-card">



                  <div
                    onClick={() => {
                      setShowProfilePanel(false);
                      setActiveItem("");
                      openPlansBilling();
                    }}
                  >
                    <ProfileItem
                      icon={adminProfilePlanAndBill}
                      text="Plans & Billing"
                      arrow
                    />
                  </div>

                  <div
                    onClick={() => {
                      setShowProfilePanel(false);
                      setActiveItem("");
                      openTeamMembers();
                    }}
                  >
                    <ProfileItem
                      icon={adminProfileTeamMembers}
                      text="Team Members"
                      arrow
                    />
                  </div>


                  <div
                    onClick={() => {
                      setShowProfilePanel(false);
                      setActiveItem("");
                      openSettings();
                    }}
                  >
                    <ProfileItem
                      icon={adminProfileSettings}
                      text="Settings"
                      arrow
                    />
                  </div>
                  <div
                    className="profile-item logout-item"
                    onClick={handleLogout}
                  >

                    <div className="profile-item-left">

                      <img
                        src={sideBarLogout}
                        className="profile-item-icon"
                      />

                      <span>Logout</span>

                    </div>

                  </div>
                </div>

              </div>

            </div>

          </div>
          </>,
          document.body
        )}

      </div>



      {/* <>
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
      </> */}
      {/* {showPricingModal && (
        <PricingPlansModal
          onClose={() => setShowPricingModal(false)}
          email={user?.email}
          firstName={user?.displayName}
          setSubscriptionInfo={() => { }}
        />
      )} */}
    </div>

  );
};
export default Sidebar;
