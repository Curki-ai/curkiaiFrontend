import React, { useState, useEffect } from "react";
import "../Styles/UploaderPage.css";
import BlackExpandIcon from "../../src/Images/BlackExpandIcon.png";
import axios from "axios";
import { FaPaperPlane } from "react-icons/fa";
import { FaCircleArrowRight } from "react-icons/fa6";
import Modal from "./Modal";
import SignIn from "./SignIn";
import MarkdownParser from "./MarkdownParser";
import { auth, getCount, incrementCount, signOut } from "../firebase";
import FeedbackModal from "./FeedbackModal";
import PricingModal from "./PricingModal";
import SubscriptionStatus from "./SubscriptionStatus";
import { IoMdInformationCircleOutline } from "react-icons/io";
import askAiStar from "../Images/askaiStar.png";
import aksAiPurpleStar from '../Images/AskAiPurpleStar.png';
import purpleStar from "../Images/PurpleStar.png";
import askAiPersonIcon from '../Images/AskAiPersonIcon.png';
import { RxCrossCircled } from "react-icons/rx";
import Sidebar from "./Sidebar";
import FinancialHealth from "./Modules/FinancialModule/FinancialHealth";
import SirsAnalysis from "./Modules/FinancialModule/SirsAnalysis";
import Qfr from "./Modules/FinancialModule/Qfr";
import Afr from "./Modules/FinancialModule/Afr";
import IncidentManagement from "./Modules/FinancialModule/IncidentManagement";
import CustomReporting from "./Modules/FinancialModule/CustomReporting";
import CareServicesEligibility from "./Modules/SupportAtHomeModule.js/CareServicesEligibilty";
import IncidentReport from "./Modules/SupportAtHomeModule.js/IncidentReport";
import QualityandRisk from "./Modules/SupportAtHomeModule.js/QualityandRisk";
import AiRostering from "./Modules/RosteringModule/Rostering";
import ResumeScreening from "./Modules/SupportAtHomeModule.js/HRStaffView";
import Client_Event_Reporting from "./Modules/NDISModule/Client_Event_Reporting";
import SoftwareConnect from "./Modules/ConnectModule/SoftwareConnect";
import RosteringDashboard from "./Modules/RosteringModule/SmartRostering";
import HRAnalysis from "./Modules/SupportAtHomeModule.js/HRAnalysis";
import IncidentAuditing from "./Modules/NDISModule/IncidentAuditing";
// import TlcCustomerReporting from "./Modules/FinancialModule/TlcCustomReporting";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import incrementAnalysisCount from "./Modules/FinancialModule/TLcAnalysisCount";
import TlcClientProfitability from "./Modules/FinancialModule/TlcClientProfitability";
import TlcNewCustomerReporting from "./Modules/FinancialModule/TlcNewCustomReporting";
import PopupModalLeft from "./ModalLeft";
import NewFinancialHealth from "./Modules/FinancialModule/NewFinancialModule";
import TlcNewClientProfitability from "./Modules/FinancialModule/TlcNewClientProfitibility";
import crossIcon from "../Images/AskAiCross.png"
import newChatBtnIcon from "../Images/AskAiNewChat.png"
import newChatBtnNoteIcon from "../Images/AskAiNewChatPen.png"
import askAiSearchIcon from "../Images/AskAiSearch.png"
import askAiSendBtn from "../Images/askaISendBtn.png"
import newTlcLogo from "../Images/newTlcLogo.png"
import PricingPlansModal from "./NewPricingModal";
import NewSubscriptionStatus from "./NewSubscriptionStatus";
import VoiceModule from "./Modules/SupportAtHomeModule.js/VoiceModule";
const HomePage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [documentString, setDocumentString] = useState("");
  const [tlcAskAiPayload, setTlcAskAiPayload] = useState("");
  const [tlcAskAiHistoryPayload, setTlcAskAiHistoryPayload] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isModalLeftVisible, setLeftModalVisible] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Financial Health");
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [majorTypeofReport, setMajorTypeOfReport] = useState("");
  const [activeReportType, setActiveReportType] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showFinalZipReport, setShowFinalZipReport] = useState(false);
  const [showUploadedReport, setShowUploadReport] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [mainfestData, setManifestData] = useState();
  const isTlcPage = selectedRole === "Payroll Analysis";
  const isSmartRosteringPage = selectedRole === 'Smart Rostering'
  const isTlcClientProfitabilityPage = selectedRole === "Clients Profitability";
  const isHRAskAiPage = selectedRole === "Smart Onboarding (Staff)";
  const [tlcClientProfitabilityPayload, setTlcClientProfitabilityPayload] = useState(null);
  const [Suggestions, setSuggestions] = useState([]);
  const [manualAskAiFile, setManualAskAiFile] = useState(null);
  const [manualResumeZip, setManualResumeZip] = useState(null);
  const [IsSmartRosteringHistory, SetIsSmartRosteringHistory] = useState(false);
  const [IsSmartRosteringDetails, SetIsSmartRosteringDetails] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [trialCountdown, setTrialCountdown] = useState("");
  const handleModalOpen = () => setModalVisible(true);
  const handleModalClose = () => setModalVisible(false);
  const handleLeftModalOpen = () => setLeftModalVisible(true);
  const handleLeftModalClose = () => setLeftModalVisible(false);
  const moduleSuggestions = {
    tlc: [
      "Which 10 employees in NDIS Department have the highest overtime hours and overtime $ ?",
      "Which employees had negative amounts in any pay-related column (e.g. reversals/adjustments), and what were those values ?",
      "By Cost Centre, what is the total Gross, Net, Tax and Super for this pay run, and which centres are the most expensive ?",
      "Top 5 Departments with the highest Gross for this pay run."
    ],
    tlcClientProfitability: [
      "Which Client has the highest gross margin ?",
      "who are the top 5 most profitable participants, and what are their total revenue, total costs and margin % ?",
      "Which region has the highest total revenue ?",
      "Top 5 Participants per Department."
    ],
    smart: [
      "How many workers are available today ?",
      "How many rosters are having Carer as -1 ?"
    ],

    default: []
  };

  useEffect(() => {
    if (
      !subscriptionInfo ||
      subscriptionInfo.subscription_type !== "trial" ||
      !subscriptionInfo.trial_end
    ) {
      setTrialCountdown("");
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(subscriptionInfo.trial_end);
      const diffMs = end - now;

      if (diffMs <= 0) {
        setTrialCountdown("");
        return;
      }

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      if (days > 0) {
        setTrialCountdown(
          `Trial ends in ${days} day${days > 1 ? "s" : ""}`
        );
      } else {
        setTrialCountdown(
          `Trial ends in ${hours}h ${minutes}m`
        );
      }
    };

    // run immediately
    updateCountdown();

    // update every minute
    const interval = setInterval(updateCountdown, 60 * 1000);

    return () => clearInterval(interval);
  }, [subscriptionInfo]);



  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  const fetchManifest = async () => {
    try {
      if (!user?.email) {
        console.error("User email not found");
        return;
      }

      const email = 'utkarsh@curki.ai'

      const response = await fetch(
        `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/getManifestByEmail/${user?.email}`
      );

      const result = await response.json();

      if (!result.success) {
        console.error("Failed to fetch manifest:", result.message);
        return;
      }

      const manifest = result.data;
      console.log("Fetched Manifest:", manifest[0]);
      setManifestData(manifest[0]);


    } catch (err) {
      console.error("Error fetching manifest:", err);
    }
  };





  const handleSend = async (customText) => {
    const rawQuery =
      typeof customText === "string"
        ? customText
        : typeof input === "string"
          ? input
          : "";

    const finalQuery = rawQuery.trim();
    if (!finalQuery) return;
    if (!finalQuery) return;

    // show user message and temp bot message
    setMessages((prev) => [...prev, { sender: "user", text: finalQuery }]);
    const tempBotMessage = { sender: "bot", text: "Generating response...", temp: true };
    setMessages((prev) => [...prev, tempBotMessage]);

    // clear input only when the user typed (not when suggestion clicked)
    if (!customText) setInput("");

    try {
      // 🟢 SMART ROSTERING MODE
      // 🟣 ASK-AI FOR RESUME ZIP (Smart Onboarding / HR Module)
      if (isHRAskAiPage) {
        try {
          const form = new FormData();
          form.append("resume_zip_file", manualResumeZip);
          form.append("question", finalQuery);

          const response = await axios.post(
            "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/askAi",
            form,
            { headers: { "Content-Type": "multipart/form-data" } }
          );

          console.log("Resume Ask-AI Response: ", response.data);

          const botReply =
            response.data?.results?.answer ||
            response.data?.answer ||
            JSON.stringify(response.data, null, 2);

          setMessages(prev =>
            prev.map(msg => (msg.temp ? { sender: "bot", text: botReply } : msg))
          );

          return;
        } catch (error) {
          console.error("Resume Ask-AI Error:", error);
          setMessages(prev =>
            prev.map(msg =>
              msg.temp ? { sender: "bot", text: "Ask-AI for resumes failed." } : msg
            )
          );
          return;
        }
      }

      if (isSmartRosteringPage) {
        if (manualAskAiFile) {
          const form = new FormData();
          form.append("files", manualAskAiFile);
          form.append("question", finalQuery);
          const response = await axios.post(
            "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/manualSmartRostering",
            form,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
          const botReply =
            response.data?.answer ||
            response.data?.response ||
            "No response";

          setMessages(prev =>
            prev.map(msg => (msg.temp ? { sender: "bot", text: botReply } : msg))
          );

          return; // Stop here
        }
        const payload = {
          manifest: mainfestData,
          question: finalQuery,
        };

        console.log("🟡 Smart Rostering Payload:", payload);
        const userEmail = user?.email?.trim()?.toLowerCase();
        // if (userEmail === "kris@curki.ai") {
        //   payload.env = "sandbox";
        // }

        const response = await axios.post(
          "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/smart-rostering/qa",
          payload
        );

        console.log("Smart Rostering response:", response);

        const botReply = response.data?.answer || "No response";

        setMessages((prev) =>
          prev.map((msg) => (msg.temp ? { sender: "bot", text: botReply } : msg))
        );
        return;
      }

      // 🟢 TLC CLIENT PROFITABILITY MODE
      if (isTlcClientProfitabilityPage) {
        console.log("🟡 TLC Client Profitability Ask AI triggered");

        // Step 1: Rebuild JSON files for AI
        // const payloadCreateRes = await fetch(
        //   `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/tlcClientProfitibility/prepare_ai_payload`,
        //   {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({ payload: tlcClientProfitabilityPayload })
        //   }
        // );

        // Step 2: Ask AI
        const userEmail = user?.email
        // const response = await axios.post(
        //   `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/tlcClientProfitibility/ask_ai?userEmail=${userEmail}`,
        //   {
        //     question: finalQuery,
        //     payload: tlcClientProfitabilityPayload
        //   }
        // )
        console.log("tlcClientProfitabilityPayload in homepage", tlcClientProfitabilityPayload)
        const response = await axios.post(
          `https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/header_modules/clients_profitability/ask_ai`,
          {
            question: finalQuery,
            table_data: tlcClientProfitabilityPayload
          }
        )

        console.log("response of tlc client profit ask ai ", response)
        const botReply =
          response.data?.ai_answer ||
          response.data?.answer ||
          "No response";

        setMessages((prev) =>
          prev.map((msg) => (msg.temp ? { sender: "bot", text: botReply } : msg))
        );

        // Count usage for Client Profitability
        if (user?.email) {
          try {
            const email = user.email.trim().toLowerCase();
            await incrementAnalysisCount(email, "tlc-client-profitability-askai", response?.data?.ai_analysis_cost);
          } catch (err) {
            console.error("❌ Failed to increment Client Profitability AskAI count:", err.message);
          }
        }
        return;
      }

      // 🟢 TLC PAYROLL MODE (existing code)
      if (isTlcPage) {
        let payload = {};

        if (tlcAskAiPayload && tlcAskAiPayload.length > 0) {
          payload = {
            objects: Array.isArray(tlcAskAiPayload) ? tlcAskAiPayload : [tlcAskAiPayload],
            query: finalQuery,
          };
        } else if (tlcAskAiHistoryPayload) {
          const { start, end } = tlcAskAiHistoryPayload.filters;

          const query = new URLSearchParams({
            start: new Date(start).toISOString().split("T")[0],
            end: new Date(end).toISOString().split("T")[0],
          });
          const userEmail = user?.email
          const filterApiResponse = await axios.get(
            `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/filter?${query}&${userEmail}`
          );

          // console.log("filter api response in ask ai", filterApiResponse);

          const filteredPayload = filterApiResponse.data?.payload || [];

          payload = {
            objects: filteredPayload,
            query: finalQuery,
          };
        }

        // console.log("🟡 TLC Payroll Payload:", payload);

        const baseURL = "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io";
        const apiURL = `${baseURL}/tlc/payroll/payroll_askai`;

        console.log("Payload sending to TLC Payroll API:", apiURL, payload);
        const userEmail = user?.email
        // const userEmail = "kris@curki.ai" 
        if (userEmail === "kris@curki.ai") {
          payload.env = "sandbox";   // exactly payload = { ..., env: "sandbox" }
        }
        const response = await axios.post(apiURL, payload);

        console.log("response from TLC Payroll ask ai", response);

        const botReply = response.data?.answer || "No response";

        setMessages((prev) =>
          prev.map((msg) => (msg.temp ? { sender: "bot", text: botReply } : msg))
        );

        // count usage for TLC Payroll
        if (user?.email) {
          try {
            const email = user.email.trim().toLowerCase();
            await incrementAnalysisCount(email, "tlc-askai", response?.data?.ai_analysis_cost);
          } catch (err) {
            console.error("❌ Failed to increment TLC AskAI count:", err.message);
          }
        }
        return;
      }

      // 🟢 DEFAULT ASK AI MODE (for all other modules)
      let payload = { query: finalQuery };
      if (documentString) payload.document = documentString;

      console.log("🟡 Default Ask AI Payload:", payload);

      const response = await axios.post(
        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/askai",
        payload
      );

      console.log("response from default ask ai", response);

      const botReply = response.data?.response?.text || response.data?.response || "No response";

      setMessages((prev) =>
        prev.map((msg) => (msg.temp ? { sender: "bot", text: botReply } : msg))
      );

    } catch (error) {
      console.error("Error calling API:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.temp ? { sender: "bot", text: "Something went wrong!" } : msg
        )
      );
    }
  };

  const handleClick = async () => {
    await incrementCount();
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);

      if (!currentUser) {
        // Not logged in → show signin popup
        setShowSignIn(true);
        return;
      }

      // Reload user to get latest emailVerified value
      await currentUser.reload();

      if (!currentUser.emailVerified) {
        // 🚫 Logged in BUT NOT verified → KEEP popup open
        setShowSignIn(true);
        return;
      }

      // ✅ Logged in AND verified → close popup
      setShowSignIn(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    getCount();
  }, []);

  useEffect(() => {
    if (user?.email) {
      fetchManifest();
    }
  }, [user]);



  useEffect(() => {
    if (isTlcPage) {
      setSuggestions(moduleSuggestions.tlc);
    } else if (isTlcClientProfitabilityPage) {
      setSuggestions(moduleSuggestions.tlcClientProfitability);
    }
    else if (isSmartRosteringPage) {
      setSuggestions(moduleSuggestions.smart);
    } else {
      setSuggestions(moduleSuggestions.default);
    }
  }, [selectedRole]);

  useEffect(() => {
    // Reset chat when module changes
    setMessages([]);
    setInput("");
  }, [selectedRole]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowDropdown(false);
  };

  // SubscriptionStatus(user, setShowPricingModal);
  NewSubscriptionStatus(user, setShowPricingModal, setSubscriptionInfo);

  return (
    <>
      {showSignIn ?

        <SignIn show={showSignIn} onClose={() => setShowSignIn(false)} />
        :
        <>
          {showPricingModal ? (
            // <PricingModal onClose={() => setShowPricingModal(false)} email={user?.email} />
            <PricingPlansModal onClose={() => setShowPricingModal(false)} email={user?.email} firstName={user?.displayName} setSubscriptionInfo={setSubscriptionInfo} />
          ) : (
            <div className="page-container">
              {sidebarVisible ? (
                <Sidebar
                  onCollapse={toggleSidebar}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  majorTypeofReport={majorTypeofReport}
                  setMajorTypeOfReport={setMajorTypeOfReport}
                  user={user}
                  handleLogout={handleLogout}
                  setShowDropdown={setShowDropdown}
                  setShowSignIn={setShowSignIn}
                  showDropdown={showDropdown}
                  activeReportType={activeReportType}
                  setActiveReportType={setActiveReportType}
                  showReport={showReport}
                  setShowReport={setShowReport}
                  showFinalZipReport={showFinalZipReport}
                  setShowFinalZipReport={setShowFinalZipReport}
                  showUploadedReport={showUploadedReport}
                  setShowUploadReport={setShowUploadReport}
                />
              ) : (
                <div className="collapsed-button" onClick={toggleSidebar}>
                  <img src={BlackExpandIcon} height={27} width={28} alt="blackexpand" />
                </div>
              )}

              <div style={{ flex: 1, height: "100vh", overflowY: "auto" }}>
                <div
                  className="typeofreportmaindiv"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    borderBottom: "1px solid #E8ECEF",
                    backgroundColor: "#FFFFF9",
                    padding: "12px 20px",
                    boxShadow: "0px 12px 40px -12px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    {(isTlcPage || isTlcClientProfitabilityPage) && (
                      <img
                        src={newTlcLogo}
                        alt="TLC"
                        style={{
                          height: "32px",
                          width: "auto",
                        }}
                      />
                    )}
                    <div
                      className="page-title-btn"
                      onClick={handleLeftModalOpen}
                      style={
                        selectedRole === "Smart Rostering"
                          ? IsSmartRosteringDetails
                            ? { marginLeft: "120px" }
                            : IsSmartRosteringHistory
                              ? { marginLeft: "84px" }
                              : {}
                          : {}
                      }
                    >
                      <IoMdInformationCircleOutline size={20} color="#5B36E1" />
                      Our AI will instantly give.....
                    </div>
                  </div>




                  {/* RIGHT */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <div className="page-title-btn" onClick={handleModalOpen}>
                      <IoMdInformationCircleOutline size={20} color="#5B36E1" /> Accepted Types Of Reports
                    </div>

                    {trialCountdown && (
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#6C4CDC",
                          background: "#F4F1FF",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {trialCountdown}
                      </div>
                    )}
                  </div>

                </div>


                <div className={isTlcPage ? "tlc-custom-main-content" : isSmartRosteringPage ? "smart-rostering-main-content" : "main-content"} style={{
                  display: showAIChat ? "none" : "block",
                }}>
                  {showFeedbackPopup && <FeedbackModal userEmail={user?.email} />}
                  {!loadingUser && selectedRole === "Connect Your Systems" && user && (
                    <SoftwareConnect user={user} />
                  )}
                  <div style={{ display: selectedRole === "Financial Health" ? "block" : "none" }}>
                    {/* <FinancialHealth selectedRole="Financial Health" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} /> */}
                    <NewFinancialHealth selectedRole="Financial Health" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} />
                  </div>

                  <div style={{ display: selectedRole === "SIRS Analysis" ? "block" : "none" }}>
                    <SirsAnalysis selectedRole="SIRS Analysis" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Participant Events & Incident Management" ? "block" : "none" }}>
                    <Client_Event_Reporting selectedRole='Participant Events & Incident Management' />
                  </div>
                  <div style={{ display: selectedRole === "Incident Auditing" ? "block" : "none" }}>
                    <IncidentAuditing selectedRole='Incident Auditing' user={user} />
                  </div>

                  <div style={{ display: selectedRole === "Quarterly Financial Reporting" ? "block" : "none" }}>
                    <Qfr selectedRole="Quarterly Financial Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Annual Financial Reporting" ? "block" : "none" }}>
                    <Afr selectedRole="Annual Financial Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Custom Incident Management" ? "block" : "none" }}>
                    <IncidentManagement selectedRole="Custom Incident Management" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Payroll Analysis" ? "block" : "none" }}>
                    {/* <CustomReporting selectedRole="Custom Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} /> */}
                    <TlcNewCustomerReporting user={user} setTlcAskAiPayload={setTlcAskAiPayload} tlcAskAiPayload={tlcAskAiPayload} setTlcAskAiHistoryPayload={setTlcAskAiHistoryPayload} tlcAskAiHistoryPayload={tlcAskAiHistoryPayload} />
                  </div>

                  <div style={{ display: selectedRole === 'Clients Profitability' ? "block" : "none" }}>
                    {/* <TlcClientProfitability
                    onPrepareAiPayload={(payload) => setTlcClientProfitabilityPayload(payload)}
                    tlcClientProfitabilityPayload={tlcClientProfitabilityPayload}
                    user={user}
                  /> */}
                    <TlcNewClientProfitability
                      onPrepareAiPayload={(payload) => setTlcClientProfitabilityPayload(payload)}
                      tlcClientProfitabilityPayload={tlcClientProfitabilityPayload}
                      user={user}
                    />
                  </div>

                  <div style={{ display: selectedRole === "Smart Onboarding (Staff)" ? "block" : "none" }}>
                    <HRAnalysis handleClick={handleClick} selectedRole="Smart Onboarding (Staff)" setShowFeedbackPopup={setShowFeedbackPopup} user={user} setManualResumeZip={setManualResumeZip} />
                  </div>
                  <div style={{ display: selectedRole === "Voice AI Module" ? "block" : "none" }}>
                    <VoiceModule />
                  </div>
                  <div style={{ display: selectedRole === "Client Profitability & Service" ? "block" : "none" }}>
                    <CareServicesEligibility selectedRole="Client Profitability & Service" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Incident Report" ? "block" : "none" }}>
                    <IncidentReport selectedRole="Incident Report" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Quality and Risk Reporting" ? "block" : "none" }}>
                    <QualityandRisk selectedRole="Quality and Risk Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                  </div>

                  <div style={{ display: selectedRole === "Smart Rostering" ? "block" : "none" }}>
                    <RosteringDashboard user={user} SetIsSmartRosteringHistory={SetIsSmartRosteringHistory} SetIsSmartRosteringDetails={SetIsSmartRosteringDetails} setManualAskAiFile={setManualAskAiFile} />
                  </div>
                </div>


                <Modal isVisible={isModalVisible} onClose={handleModalClose}></Modal>
                <PopupModalLeft isVisible={isModalLeftVisible} onClose={handleLeftModalClose} module={selectedRole}></PopupModalLeft>

                <div className="ask-ai-button" onClick={() => setShowAIChat(!showAIChat)}>
                  <img src={askAiStar} alt="askAiStar" style={{ width: "22px", height: "22px" }} />
                  <div style={{ fontFamily: "Inter", fontSize: "16px", color: "white" }}>Ask AI</div>
                </div>

                {showAIChat && (
                  <div style={{ position: "fixed", bottom: "20px", right: "21px", width: "76%", height: "80%", backgroundColor: "#FFFEFF", borderRadius: "24px", zIndex: 999, display: "flex", flexDirection: "column", justifyContent: "space-between", border: '1.09px solid #6C4CDC', boxShadow: '0px 4.36px 65.42px 0px #FFFFFF03', padding: ' 14px 30px', marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTopRightRadius: "24px", borderTopLeftRadius: "24px", }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "44px" }}>
                        <div
                          onClick={() => setMessages([])}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            backgroundColor: "#6c4cdc",
                            cursor: "pointer"
                          }}
                        >
                          <img
                            src={newChatBtnNoteIcon}
                            alt="new-chat"
                            style={{
                              width: "14px", height: "14px",
                            }}
                          />
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: 500,
                              fontFamily: "Inter",
                            }}
                          >
                            New Chat
                          </span>
                        </div>


                        <img
                          src={crossIcon}
                          alt="close"
                          style={{ cursor: "pointer", width: "28px" }}
                          onClick={() => setShowAIChat(false)}
                        />
                      </div>

                    </div>
                    {messages.length === 0 &&
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px' }}>
                          <img src={purpleStar} alt='blue-star' style={{ width: '36px', height: 'auto' }} />
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '24px', fontFamily: 'Inter', fontWeight: '500' }}>
                          Got a question? Just ask AI.
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: '400', marginTop: '10px' }}>
                          Your Aged Care & NDIS helper.<br></br>Ask a question get simple, trusted guidance.
                        </div>
                      </div>
                    }

                    <div style={{ flex: 1, marginTop: "10px", overflowY: "auto", padding: "10px" }}>
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          style={{
                            display: "flex",
                            justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                            marginBottom: "8px",
                            position: "relative"
                          }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start", position: "relative", maxWidth: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', maxWidth: '100%' }}>
                              <div
                                style={{
                                  display: msg.sender === "user" ? "none" : "flex",
                                  flexDirection: "column",
                                  alignItems: "flex-start",
                                  gap: "6px"
                                }}
                              >
                                {/* ⭐ STAR */}
                                <img
                                  src={aksAiPurpleStar}
                                  alt="ai star"
                                  style={{
                                    width: "32px",
                                    height: "32px"
                                  }}
                                />

                                {/* 💬 ANSWER / GENERATING RESPONSE */}
                                <div
                                  style={{
                                    backgroundColor: "#F9F8FF",
                                    padding: "16px 18px",
                                    borderRadius: "26px",
                                    width: "100%",        // ✅ full width
                                    maxWidth: "100%",
                                    fontSize: "14px",
                                    lineHeight: "16px",
                                    textAlign: "left",
                                    color: "black",
                                    fontFamily: "Inter",
                                    border: "1px solid #6c4cdc",
                                    overflowY: "auto",
                                    scrollbarWidth: "none",
                                    msOverflowStyle: "none"
                                  }}
                                  className="ask-ai-res-div"
                                >
                                  <ReactMarkdown
                                    children={msg.text
                                      .replace(/```(?:\w+)?\n?/, "")
                                      .replace(/```$/, "")
                                    }
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                  />
                                </div>
                              </div>
                              {msg.sender === "user" && (
                                <div
                                  style={{
                                    backgroundColor: "#FFFFFF",
                                    padding: "16px 18px",
                                    borderRadius: "26px",
                                    maxWidth: "90%",
                                    fontSize: "14px",
                                    lineHeight: "16px",
                                    textAlign: "left",
                                    color: "black",
                                    fontFamily: "Inter",
                                    border: "1px solid #6c4cdc"
                                  }}
                                >
                                  {msg.text}
                                </div>
                              )}

                              <img
                                src={askAiPersonIcon}
                                alt="user icon"
                                style={{ width: "52px", height: "52px", display: msg.sender === 'user' ? 'block' : 'none' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                    </div>
                    <div>
                      {messages.length === 0 &&
                        <div>
                          {Suggestions.length !== 0 &&
                            <div style={{ textAlign: 'left', marginBottom: '9px', fontSize: '14px', fontWeight: '500', fontFamily: 'Inter' }}>
                              Predefined Prompts
                            </div>
                          }
                          <div
                            style={{
                              width: "60%",
                              maxHeight: "150px",
                              overflowY: "auto",
                              boxSizing: "border-box",
                              paddingTop: "10px",       // ✅ ADD
                              paddingBottom: "12px",
                              scrollbarWidth: "none",    // Firefox
                              msOverflowStyle: "none"    // IE/Edge
                            }}
                            className="predefined-prompts-scroll"
                          >
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              {Suggestions.map((q, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleSend(q)}
                                  style={{
                                    padding: "12px",
                                    borderRadius: "8px",
                                    background: "#F9F8FF",
                                    border: "1px solid #6c4cdc",
                                    cursor: "pointer",
                                    marginBottom: "10px",
                                    textAlign: "left",
                                    width: "100%"
                                  }}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>


                        </div>
                      }

                      <div style={{ position: "relative", marginTop: "10px", marginBottom: "18px", width: "100%", display: "flex", alignSelf: "center" }}>
                        <img
                          src={askAiSearchIcon}
                          alt="search"
                          style={{
                            position: "absolute",
                            left: "32px",              // ✅ was 14px → more gap like screenshot
                            top: "32px",
                            bottom: "75px",               // ✅ center vertically
                            transform: "translateY(-50%)",
                            width: "18px",
                            height: "18px",
                            opacity: 0.7
                          }}
                        />

                        <textarea
                          rows={1}
                          placeholder="Ask me anything..."
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            // const el = e.target;
                            // el.style.height = "56px";              // base height
                            // el.style.height = el.scrollHeight + "px";
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSend();
                            }
                          }}
                          style={{
                            width: "100%",
                            resize: "none",
                            padding: "22px 56px 16px 63px", // ✅ KEY CHANGE (more left space)
                            borderRadius: "14px",
                            border: "none",
                            outline: "none",
                            lineHeight: "22px",
                            backgroundColor: "#F0EDF6",
                            height: "120px",
                            maxHeight: "120px",
                            color: "#000",
                            overflowY: "auto",
                            scrollbarWidth: "none",
                            msOverflowStyle: "none"
                          }}


                        />
                        {/* <FaCircleArrowRight onClick={handleSend} size={22} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6C4CDC" }} /> */}
                        <div
                          onClick={handleSend}
                          style={{
                            position: "absolute",
                            right: "32px",
                            top: "63%",
                            transform: "translateY(-50%)",
                            width: "32px",
                            height: "32px",
                            backgroundColor: "#6C4CDC",   // purple background
                            borderRadius: "10px",         // rounded square
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                          }}
                        >
                          <img
                            src={askAiSendBtn}
                            alt="send"
                            style={{
                              width: "16px",
                              height: "16px",
                              pointerEvents: "none", // click handled by parent div
                            }}
                          />
                        </div>

                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </>
      }
    </>
  );
};

export default HomePage;