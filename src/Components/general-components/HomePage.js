import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import CenteredLoader from "./CenteredLoader";
import { toast } from "react-toastify";
import "../../Styles/general-styles/UploaderPage.css";
import { API_BASE } from "../../config/apiBase";
import BlackExpandIcon from "../../../src/Images/BlackExpandIcon.png";
import axios from "axios";
import { FaMicrophone, FaPaperPlane, FaPlus, FaTimes, FaFileAlt, FaStop } from "react-icons/fa";
import { FaCircleArrowRight } from "react-icons/fa6";
import Modal from "./Modal";
import SignIn from "./SignIn";
import MarkdownParser from "./MarkdownParser";
import { auth, getCount, incrementCount, signOut } from "../../firebase";
import black_logo from "../../../src/Images/Black_logo.png";
import FeedbackModal from "./FeedbackModal";
import PricingModal from "./PricingModal";
import SubscriptionStatus from "./SubscriptionStatus";
import { IoMdInformationCircleOutline } from "react-icons/io";
import askAiStar from "../../Images/askaiStar.png";
import aksAiPurpleStar from '../../Images/AskAiPurpleStar.png';
import purpleStar from "../../Images/PurpleStar.png";
import askAiPersonIcon from '../../Images/AskAiPersonIcon.png';
import { RxCrossCircled } from "react-icons/rx";
import Sidebar from "./Sidebar";
// import TlcCustomerReporting from "../Modules/FinancialModule/TlcCustomReporting";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import incrementAnalysisCount from "../Modules/FinancialModule/Tlc/TLcAnalysisCount";
import PopupModalLeft from "./ModalLeft";
import crossIcon from "../../Images/AskAiCross.png"
import newChatBtnIcon from "../../Images/AskAiNewChat.png"
import newChatBtnNoteIcon from "../../Images/AskAiNewChatPen.png"
import askAiSearchIcon from "../../Images/AskAiSearch.png"
import askAiSendBtn from "../../Images/askaISendBtn.png"
import newTlcLogo from "../../Images/newTlcLogo.png"
import PricingPlansModal from "./NewPricingModal";
import NewSubscriptionStatus from "./NewSubscriptionStatus";
import dummyLogo from "../../Images/tlcDummyLogo.svg";
import SettingsPage from "./Settings";
import SupportModal from "./SupportModal";
import TeamMembers from "./TeamMembers";
import TrialStartedPopup from "./TrialPopup";
import { checkSubscriptionStatus } from "./getSubscription";
import DetailedUsage from "./DetailedUsage";
import AutoPaymentPopup from "./AutoPaymentPopup";
import PlansAndBillings from "./PlansAndBillings";
import chatBotKeyIcon from "../../Images/chatBoyKeyIcon.svg"
import apiTutorialsIcon from "../../Images/apiTutorialKeyIcon.svg"
import { startSpeechRecognition, stopSpeechRecognition } from "./AskAiSTT";
import { SlLike, SlDislike } from "react-icons/sl";
import { LuPower, LuSpeech } from "react-icons/lu";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { FiFileText } from "react-icons/fi";
import { IoChevronForward, IoChevronDown } from "react-icons/io5";
import { BiDislike, BiLike, BiSolidDislike, BiSolidLike } from "react-icons/bi";
import incrementCareVoiceAnalysisCount from "../Modules/SupportAtHomeModule/careVoiceCostAnalysis";
import TlcUploadBox from "../Modules/FinancialModule/Tlc/TlcUploadBox";
import { useHRChat } from "../Modules/StaffOnboarding/onboarding/hrAssistantStream";

// Feature modules are code-split — each becomes its own webpack chunk and is
// only downloaded the first time the user selects that module. Once a module
// has been visited it stays mounted (display:none) so internal state
// (uploaded files, in-progress analysis, voice sessions) survives subsequent
// module switches, matching the pre-lazy behavior.
const FinancialHealth = lazy(() => import("../Modules/FinancialModule/FinancialHealth/FinancialHealth"));
const SirsAnalysis = lazy(() => import("../Modules/FinancialModule/ComplianceReports/SirsAnalysis"));
const Qfr = lazy(() => import("../Modules/FinancialModule/ComplianceReports/Qfr"));
const Afr = lazy(() => import("../Modules/FinancialModule/ComplianceReports/Afr"));
const IncidentManagement = lazy(() => import("../Modules/FinancialModule/ComplianceReports/IncidentManagement"));
const CustomReporting = lazy(() => import("../Modules/FinancialModule/ComplianceReports/CustomReporting"));
const CareServicesEligibility = lazy(() => import("../Modules/SupportAtHomeModule/CareServicesEligibility/CareServicesEligibilty"));
const IncidentReport = lazy(() => import("../Modules/SupportAtHomeModule/IncidentReport/IncidentReport"));
const QualityandRisk = lazy(() => import("../Modules/SupportAtHomeModule/QualityandRisk/QualityandRisk"));
const AiRostering = lazy(() => import("../Modules/RosteringModule/Rostering"));
const ResumeScreening = lazy(() => import("../Modules/StaffOnboarding/onboarding/HRStaffView"));
const Client_Event_Reporting = lazy(() => import("../Modules/NDISModule/Client_Event_Reporting"));
const SoftwareConnect = lazy(() => import("../Modules/ConnectModule/SoftwareConnect"));
const RosteringDashboard = lazy(() => import("../Modules/RosteringModule/SmartRostering"));
const HRAnalysis = lazy(() => import("../Modules/StaffOnboarding/onboarding/HRAnalysis"));
const NoOrgEmptyState = lazy(() => import("../Modules/StaffOnboarding/onboarding/NoOrgEmptyState"));
const IncidentAuditing = lazy(() => import("../Modules/NDISModule/IncidentAuditing"));
const TlcClientProfitability = lazy(() => import("../Modules/FinancialModule/Tlc/TlcClientProfitability"));
const TlcNewCustomerReporting = lazy(() => import("../Modules/FinancialModule/Tlc/TlcNewCustomReporting"));
const NewFinancialHealth = lazy(() => import("../Modules/FinancialModule/FinancialHealth/NewFinancialModule"));
const TlcNewClientProfitability = lazy(() => import("../Modules/FinancialModule/Tlc/TlcNewClientProfitibility"));
const VoiceModule = lazy(() => import("../Modules/SupportAtHomeModule/CareVoice/VoiceModule"));

const HomePage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [documentString, setDocumentString] = useState("");
  const [tlcAskAiPayload, setTlcAskAiPayload] = useState("");
  const [tlcAskAiHistoryPayload, setTlcAskAiHistoryPayload] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  // const [input, setInput] = useState("");
  const inputRef = useRef("");
  const textareaRef = useRef(null);
  const isSendingRef = useRef(false);
  const [isInputEmpty, setIsInputEmpty] = useState(true);
  // Becomes true the moment the very first resume-screening send is fired.
  // Once true, every follow-up send must carry a typed prompt — empty
  // submissions are no longer allowed, even if jd/resume files are still
  // present in state.
  const [hasResumeRunStarted, setHasResumeRunStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const messagesContainerRef = useRef(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isModalLeftVisible, setLeftModalVisible] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Financial Health");
  // Tracks every role the user has selected this session. Each entry causes
  // its feature-module chunk to be downloaded and the module to be mounted.
  // Once mounted, the module stays in the DOM (display:none when not active)
  // so internal state — uploaded files, voice sessions, in-progress
  // analyses — is preserved across module switches, matching the pre-lazy
  // always-mounted behavior.
  const [visitedRoles, setVisitedRoles] = useState(() => new Set(["Financial Health"]));
  useEffect(() => {
    setVisitedRoles((prev) => {
      if (prev.has(selectedRole)) return prev;
      const next = new Set(prev);
      next.add(selectedRole);
      return next;
    });
  }, [selectedRole]);
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
  const isSoftwareConnectPage = selectedRole === "Connect Your Systems";
  const isNewFinancialModule = selectedRole === "Financial Health";
  const isCareVoicePage = selectedRole === "Care Voice";
  const [tlcClientProfitabilityPayload, setTlcClientProfitabilityPayload] = useState(null);
  const [Suggestions, setSuggestions] = useState([]);
  const [chatbotRules, setChatbotRules] = useState([]);
  const [manualAskAiFile, setManualAskAiFile] = useState(null);
  const [manualResumeZip, setManualResumeZip] = useState(null);
  const [IsSmartRosteringHistory, SetIsSmartRosteringHistory] = useState(false);
  const [IsSmartRosteringDetails, SetIsSmartRosteringDetails] = useState(false);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [trialCountdown, setTrialCountdown] = useState("");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSupportFormInChat, setShowSupportFormInChat] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [formattedTrialEnd, setFormattedTrialEnd] = useState("");
  const [isTrialInitializing, setIsTrialInitializing] = useState(false);
  const [payrollAiPayload, setPayrollAiPayload] = useState("");
  const [payrollAiHistoryPayload, setPayrollAiHistoryPayload] = useState("");
  const [showUsageDetails, setShowUsageDetails] = useState(false);
  const [showAutoPaymentPopup, setShowAutoPaymentPopup] = useState(false);
  const [showPlansBillingModal, setShowPlansBillingModal] = useState(false);
  const [financialAiPayload, setFinancialAiPayload] = useState(null);
  const [financialAiHistoryPayload, setFinancialAiHistoryPayload] = useState([]);
  const [clientProfitabilityAiHistoryPayload, setClientProfitabilityAiHistoryPayload] = useState([]);
  const [tlcPayrollAskAiConversationHistory, setTlcPayrollAskAiConversationHistory] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSTTActive, setIsSTTActive] = useState(false);
  const [careVoiceSessionId, setCareVoiceSessionId] = useState(null);
  const [careVoiceUserId, setCareVoiceUserId] = useState(null);
  const [careVoiceStarted, setCareVoiceStarted] = useState(false);
  const [careVoiceFiles, setCareVoiceFiles] = useState([]);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [selectedSources, setSelectedSources] = useState([]);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [expandedSources, setExpandedSources] = useState({});
  // Add near other useState declarations (around line 100)
  const [isCareVoiceGeneratingDocs, setIsCareVoiceGeneratingDocs] = useState(false);
  const [totalCareVoiceDocsToGenerate, setTotalCareVoiceDocsToGenerate] = useState(0);
  const [generatedCareVoiceDocsCount, setGeneratedCareVoiceDocsCount] = useState(0);
  // will store like: "messageIndex_sourceIndex"
  const [feedbackState, setFeedbackState] = useState({});
  const recognizerRef = useRef(null);
  // Session-scoped guard for the proactive auto-topup popup (see effect
  // below). True after the user closes the popup without paying, so the
  // popup doesn't immediately re-pop on the next render while the balance
  // is still depleted. Cleared automatically when balance climbs back
  // above the threshold so a future dip can re-open the popup — AND
  // whenever `selectedRole` changes (see the popup effect), so dismissing
  // the popup buys peace only until the user switches to a different
  // module.
  const autoTopupDismissedRef = useRef(false);
  // Tracks the selectedRole value the last time the proactive auto-topup
  // effect ran. Used to detect "the user just switched modules" so we can
  // reset the dismissed-guard and re-show the popup if balance is still
  // low — matches the product behaviour "popup reappears on next module
  // action after the user clicks 'No thanks'".
  const lastSelectedRoleForTopupRef = useRef(null);
  const handleModalOpen = () => setModalVisible(true);
  const handleModalClose = () => setModalVisible(false);
  const handleLeftModalOpen = () => setLeftModalVisible(true);
  const handleLeftModalClose = () => setLeftModalVisible(false);
  const [feedbackMode, setFeedbackMode] = useState(null);
  const [isCareVoiceLocked, setIsCareVoiceLocked] = useState(true);
  const [hrStep, setHrStep] = useState("IDLE");
  const [hrMode, setHrMode] = useState("general");
  const [hrSending, setHrSending] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [screenedResults, setScreenedResults] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [jdFiles, setJdFiles] = useState([]);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [askAiAttachedFiles, setAskAiAttachedFiles] = useState([]);
  const [askAiBtnHover, setAskAiBtnHover] = useState(false);
  // Care Voice reports its active role ("Admin" | "Staff") up here so the
  // global "Ask AI" helper popup shows only for Staff (mirrors Smart Onboarding).
  const [voiceRole, setVoiceRole] = useState("Admin");
  // Auto-shows the Care Voice "Ask AI" helper popup (no hover needed) for 5s
  // once the staff member's documents finish generating on the
  // "Generated Documents" screen.
  const [askAiAutoShow, setAskAiAutoShow] = useState(false);
  // Whether Care Voice's staff "Generated Documents" screen is currently shown.
  const [voiceDocsScreen, setVoiceDocsScreen] = useState(false);
  const prevGeneratingDocsRef = useRef(false);
  // Armed when generation completes; fires the popup once the documents are
  // actually present (decouples the file/flag state-update ordering).
  const pendingAutoShowRef = useRef(false);
  const askAiFileInputRef = useRef(null);
  const userEmail = user?.email;
  const userDomain = userEmail?.split("@")[1]?.toLowerCase();
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [candidatesData, setCandidatesData] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);
  // Caller's role in the resolved Staff Onboarding org ("owner" | "admin" …),
  // taken from the by-email lookup. Drives owner-only affordances such as the
  // sidebar "View Details" (Plan Usage) button.
  const [userOrgRole, setUserOrgRole] = useState(null);
  // Active HR workspace — mirrors the virtual-space selection inside
  // HRAdminView (reported up via the onActiveOrgChange callback). The HR chat
  // and resume-screening calls must target the space the user is in, not the
  // Main org. Falls back to organizationId until HRAdminView reports a value.
  const [activeOrganizationId, setActiveOrganizationId] = useState(null);
  const hrActiveOrgId = activeOrganizationId || organizationId;
  // Tracks the lifecycle of the by-email org lookup so the HR admin view can
  // distinguish "still loading" from "looked up and there is no org for this
  // email". On "not_found" the HR view renders the NoOrgEmptyState (register
  // CTA + ask-your-admin message) instead of the normal dashboard.
  const [orgLookupStatus, setOrgLookupStatus] = useState("idle"); // idle | loading | found | not_found
  const { isConnected, sendHRChat } = useHRChat();
  const [hrScreenedCandidates, setHrScreenedCandidates] = useState([]);
  // Conversation history that mirrors hr_chat_client.html's pattern: only
  // finalized {role, content} pairs are tracked here, never intermediate
  // status events. Updated on hr_complete with a real reply.
  const hrConvHistoryRef = useRef([]);
  const hrLastUserTextRef = useRef("");
  const resetHrConversation = () => {
    hrConvHistoryRef.current = [];
    hrLastUserTextRef.current = "";
  };
  let eventQueue = [];
  function fileToBase64(f) {
    return new Promise(function (resolve, reject) {
      const r = new FileReader();
      r.onload = function () {
        const s = r.result;
        if (typeof s === "string" && s.indexOf(",") >= 0) {
          resolve(s.split(",", 2)[1]);
        } else {
          reject(new Error("read failed"));
        }
      };
      r.onerror = function () { reject(new Error("read error")); };
      r.readAsDataURL(f);
    });
  }
  let isShowingEvent = false;
  // Add useEffect to sync refs
  const blockedAutoTopupDomains = [
    "curki.ai",
    "tenderlovingcaredisability.com.au",
    "tenderlovingcare.com.au",
    // "careait.com" — TEMP: removed for autopay popup testing. Restore before deploying.
  ];
  const tlcDomains = [
    "tenderlovingcaredisability.com.au",
    "tenderlovingcare.com.au",
  ];

  const isTlcDomainUser = tlcDomains.includes(userDomain);
  const isDemoUser = userEmail === "kris@curki.ai";
  const handleFeedbackClick = (index, type) => {
    const key = `${selectedRole}_${index}`;
    if (feedbackState[key]?.submitted) return;
    setFeedbackState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        type,
        showInput: type === "down",
      }
    }));
  };
  const submitFeedback = async (index, message, type, feedbackText = "") => {
    const key = `${selectedRole}_${index}`;
    if (feedbackState[key]?.submitted) return;
    try {
      const data = feedbackState[key] || {};
      setFeedbackState((prev) => ({
        ...prev,
        [key]: { ...prev[key], submitting: true }
      }));

      await fetch(`${API_BASE}/api/askAiFeedback/shareFeedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firebaseUid: user?.uid,
          userEmail: user?.email,
          message,
          feedbackType: type,
          feedbackText: feedbackText,
          module: selectedRole || ""
        })
      });

      setFeedbackState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          submitting: false,
          submitted: true
        }
      }));
      // 👇 ADD THIS BLOCK
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text:
            type === "up"
              ? "Thanks for submitting feedback 👍"
              : feedbackText
                ? `Thanks for submitting feedback 👍\n\nYour feedback: ${feedbackText}`
                : "Thanks for submitting feedback 👍",
          isFeedbackResponse: true
        }
      ]);
    } catch (err) {
      console.error("Feedback error:", err);

      setFeedbackState((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          submitting: false
        }
      }));
    }
  };
  useEffect(() => {
    const handleTabClose = () => {
      if (!careVoiceSessionId || !careVoiceUserId) return;

      const url = `${API_BASE}/api/careVoiceAskAI/delete-session`;

      const payload = JSON.stringify({
        session_id: careVoiceSessionId,
        user_id: careVoiceUserId,
      });

      const blob = new Blob([payload], { type: "application/json" });

      navigator.sendBeacon(url, blob);

      // console.log("Delete session called on tab close");
    };

    window.addEventListener("beforeunload", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
    };
  }, [careVoiceSessionId, careVoiceUserId]);
  const handleMicClick = async () => {
    try {

      if (!isListening) {


        setIsListening(true);
        setIsSTTActive(true); // LOCK SEND BUTTON

        // Resolve the moduleName the same way the LLM askai increments do
        // (selectedRole → backend module key), so STT cost rolls up under the
        // same per-module bucket in the cost-analyse doc. Unmapped roles
        // return null and the increment is skipped on the STT side.
        const sttModuleName =
          isCareVoicePage ? "carevoice" :
          isNewFinancialModule ? "financial-health" :
          isSmartRosteringPage ? "smart-rostering" :
          isTlcClientProfitabilityPage ? "client-profitability" :
          isTlcPage ? "payroll-analysis" :
          isHRAskAiPage ? "staff-onboarding" :
          null;

        recognizerRef.current = await startSpeechRecognition((text) => {

          // console.log("Speech text received:", text);

          if (textareaRef.current) {
            textareaRef.current.value = text;
            textareaRef.current.style.height = "auto";
            const next = Math.min(textareaRef.current.scrollHeight, 200);
            textareaRef.current.style.height = next + "px";
          }

          inputRef.current = text;
          setIsInputEmpty(!text || !text.trim());

        }, user?.email?.trim(), sttModuleName,
        () => textareaRef.current?.value || "");

      } else {


        stopSpeechRecognition(recognizerRef.current);

        setIsListening(false);
        setIsSTTActive(false); // UNLOCK SEND BUTTON
      }

    } catch (error) {
      console.error("Microphone error", error);

      setIsListening(false);
      setIsSTTActive(false);
    }
  };
  function convertDriveUrl(url) {
    if (!url) return url;

    const match = url.match(/id=([^&]+)/);

    if (match) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
    }

    return url;
  }
  useEffect(() => {

    const handleAutoTopupPopup = () => {
      if (blockedAutoTopupDomains.includes(userDomain)) {
        return;
      }

      if (subscriptionInfo?.subscription_type === "trial") {
        return;
      }
      setShowAutoPaymentPopup(true);
    };

    window.addEventListener("AUTO_TOPUP_TRIGGER", handleAutoTopupPopup);

    return () => {
      window.removeEventListener("AUTO_TOPUP_TRIGGER", handleAutoTopupPopup);
    };

  }, []);

  // Proactive auto-topup popup gate.
  //
  // Watches subscriptionInfo + selectedRole and surfaces AutoPaymentPopup
  // the moment the token balance dips below the per-click safe minimum.
  // The popup is *state*-driven, independent of any /increment endpoint
  // response.
  //
  // Dismissal semantics:
  //   - When the user clicks "No thanks", `autoTopupDismissedRef` is set
  //     to true (see the popup's onClose below). That keeps the popup
  //     from immediately re-popping during the *current* module view.
  //   - The ref CLEARS on two conditions:
  //       (a) balance climbs back above the threshold (e.g. after a
  //           successful topup), so a future dip can re-arm the popup;
  //       (b) the user navigates to a different module — the spec is
  //           "popup reappears when the user tries to run any module
  //           again", so a sidebar switch counts.
  useEffect(() => {
    if (!subscriptionInfo) return;
    if (blockedAutoTopupDomains.includes(userDomain)) return;
    if (subscriptionInfo.subscription_type === "trial") return;
    if (subscriptionInfo.status !== "active") return;

    const balance = Number(subscriptionInfo.token_balance);
    if (!Number.isFinite(balance)) return; // backend didn't supply the field

    const PER_CLICK_SAFE_MIN = 150_000;

    if (balance >= PER_CLICK_SAFE_MIN) {
      autoTopupDismissedRef.current = false;
      lastSelectedRoleForTopupRef.current = selectedRole;
      return;
    }

    // Module-switch clears the dismissed-guard so the popup reappears on
    // the next module the user actually tries to use.
    if (
      lastSelectedRoleForTopupRef.current !== null &&
      lastSelectedRoleForTopupRef.current !== selectedRole
    ) {
      autoTopupDismissedRef.current = false;
    }
    lastSelectedRoleForTopupRef.current = selectedRole;

    if (autoTopupDismissedRef.current) return;
    setShowAutoPaymentPopup(true);
  }, [subscriptionInfo, userDomain, selectedRole]);

  // Per-action gate for the auto-topup popup.
  //
  // Module analyze handlers dispatch a cancelable `ANALYSIS_INTENT`
  // CustomEvent before kicking off any backend call. If balance is below
  // the per-click safe minimum, this listener:
  //   1. Clears the dismissed-guard (so the popup can re-arm even after
  //      "No thanks").
  //   2. Opens AutoPaymentPopup.
  //   3. Calls event.preventDefault().
  //
  // `window.dispatchEvent` returns false when preventDefault was called
  // on a cancelable event, so the dispatching module reads that boolean
  // and aborts before showing its own "Analysing..." spinner.
  //
  // This is the only place the gate logic lives — modules just opt in by
  // adding a one-liner at the top of their analyze handler.
  useEffect(() => {
    const handler = (event) => {
      if (!subscriptionInfo) return;
      if (blockedAutoTopupDomains.includes(userDomain)) return;
      if (subscriptionInfo.subscription_type === "trial") return;
      if (subscriptionInfo.status !== "active") return;

      const balance = Number(subscriptionInfo.token_balance);
      if (!Number.isFinite(balance)) return;

      const PER_CLICK_SAFE_MIN = 150_000;
      if (balance >= PER_CLICK_SAFE_MIN) return;

      autoTopupDismissedRef.current = false;
      setShowAutoPaymentPopup(true);
      event.preventDefault();
    };
    window.addEventListener("ANALYSIS_INTENT", handler);
    return () => window.removeEventListener("ANALYSIS_INTENT", handler);
  }, [subscriptionInfo, userDomain]);
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
    softWareConnect: [
      { label: "Xero", event: "xero" },
      { label: "Employment Hero", event: "employment_hero" },
      { label: "Intuit Quickbooks", event: "quickbooks" },
      { label: "MYP Technologies", event: "myptechnologies" },
      { label: "MYOB", event: "myob" }
    ],
    financial: [
      "How does my financial health looks like ?",
      "Whats the most claimed amount ?",
      "Which client has the highest revenue ?",
      "What do I need to improve in my business ?"
    ],
    default: []
  };
  // Resolve organizationId from the new `organizations` container (admins[].email).
  // On failure we leave organizationId as null instead of falling back to the
  // user's email — the email-fallback caused real bugs where a transient
  // backend blip (e.g. nodemon restart) put React state into a broken
  // configuration that silently sent every request with the wrong orgId,
  // looking like a 403 / empty-data bug to the user. Better to short-circuit
  // downstream calls and retry the lookup automatically.
  const fetchOrganizationId = async (email, attempt = 1) => {
    if (!email) return;
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY_MS = 1500;
    if (attempt === 1) setOrgLookupStatus("loading");
    try {
      const firebase_uid = user?.uid || "";
      const url =
        `${API_BASE}/api/organizations/by-email?email=${encodeURIComponent(email)}` +
        (firebase_uid ? `&firebase_uid=${encodeURIComponent(firebase_uid)}` : "");
      const res = await fetch(url);
      const data = await res.json();
      const firstOrgId = data?.organizations?.[0]?.organizationId;
      if (res.ok && firstOrgId) {
        setOrganizationId(firstOrgId);
        setUserOrgRole(data?.organizations?.[0]?.role || null);
        setOrgLookupStatus("found");
        if (data.justActivated) {
          toast.success(
            "Welcome! Your invitation to Curki Smart Onboarding has been accepted."
          );
        }
        return;
      }
      // No org found for this email. Surface a "not_found" status so the HR
      // admin view can render the register/ask-to-be-invited empty state.
      setOrganizationId(null);
      setUserOrgRole(null);
      setOrgLookupStatus("not_found");
      console.warn(
        `[organizations] no org for ${email} — rendering empty state`
      );
    } catch (error) {
      console.error(`fetchOrganizationId error (attempt ${attempt}):`, error);
      if (attempt < MAX_ATTEMPTS) {
        setTimeout(() => fetchOrganizationId(email, attempt + 1), RETRY_DELAY_MS);
      }
    }
  };

  const fetchAllCandidates = async () => {
    try {
      if (!user?.email || !organizationId) return;


      const res = await axios.get(
        `${API_BASE}/api/get-all-candidates`,
        {
          params: {
            admin_email: user.email,
            organization_id: hrActiveOrgId
          }
        }
      );


      if (res.data?.ok) {
        setCandidatesData(res.data.candidates || []);
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    const handleTrialInit = (event) => {
      setIsTrialInitializing(event.detail);
    };

    window.addEventListener("trial-initializing", handleTrialInit);

    return () => {
      window.removeEventListener("trial-initializing", handleTrialInit);
    };
  }, []);
  // Fire org/manifest/subscription concurrently on user resolve.
  // fetchAllCandidates is excluded — it depends on organizationId.
  useEffect(() => {
    if (!user?.email) return;

    const SUBSCRIPTION_BYPASS_DOMAINS = [
      "curki.ai",
      "caringways.com.au",
      "tenderlovingcaredisability.com.au",
      "tenderlovingcare.com.au",
      "allaboutcaring.com.au",
      "youcareds.com",
      "contemporarycoordination.com",
      "careait.com",
    ];

    const runSubscriptionCheck = async () => {
      const result = await checkSubscriptionStatus(user.email);
      const domain = user.email.split("@")[1]?.toLowerCase();
      const isBypass = SUBSCRIPTION_BYPASS_DOMAINS.includes(domain);
      setShowPricingModal(isBypass ? false : result.shouldShowPricing);
      setSubscriptionInfo(result.subscription || null);
    };

    Promise.all([
      fetchOrganizationId(user.email),
      fetchManifest(),
      runSubscriptionCheck(),
    ]);
  }, [user]);
  useEffect(() => {
    if (isHRAskAiPage && user?.email) {
      fetchAllCandidates();
    }
    // activeOrganizationId: refetch when the user switches virtual space.
  }, [selectedRole, user, activeOrganizationId]);
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
  useEffect(() => {
    if (!subscriptionInfo || !user) return;

    if (
      subscriptionInfo.subscription_type === "trial" &&
      subscriptionInfo.trial_end &&
      user.emailVerified &&
      !localStorage.getItem("curki_trial_popup_seen")
    ) {
      const formatted = new Date(subscriptionInfo.trial_end).toLocaleDateString(
        "en-AU",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );

      setFormattedTrialEnd(formatted);
      setShowTrialPopup(true);
      localStorage.setItem("curki_trial_popup_seen", "true");
    }
  }, [subscriptionInfo, user]);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobileOrTablet(window.innerWidth <= 820); // mobile + tablet
    };

    checkScreen(); // run on mount
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);


  // console.log("subscriptionInfo", subscriptionInfo)
  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);

  const fetchManifest = async () => {
    try {
      if (!user?.email) {
        console.error("User email not found");
        return;
      }

      const response = await fetch(
        `${API_BASE}/getManifestByEmail/${user?.email}`
      );

      const result = await response.json();
      console.log("result",result)

      if (!result.success) {
        console.error("Failed to fetch manifest:", result.message);
        return;
      }

      const manifest = result.data;
      // console.log("Fetched Manifest:", manifest[0]);
      setManifestData(manifest[0]);


    } catch (err) {
      console.error("Error fetching manifest:", err);
    }
  };

  // Fallback credential source when the Rostering Settings form has no creds:
  // pull them from the integration_credentials container (via /getSoftwares).
  // Docs there store the parts as User / client_id / secret_id — map them to
  // the {user, key, secret} shape the rostering flow expects.
  const fetchSoftwareCredsFromIntegrations = async (softwareKey) => {
    try {
      if (!user?.email || !softwareKey) return null;

      const response = await axios.get(`${API_BASE}/getSoftwares`, {
        params: { userEmail: user.email },
      });

      const integrations = response.data?.integrations || [];
      const wanted = String(softwareKey).toLowerCase();
      const doc = integrations.find(
        (i) => String(i.software || "").toLowerCase() === wanted
      );
      if (!doc) return null;

      const creds = { user: doc.User, key: doc.client_id, secret: doc.secret_id };
      return creds.user && creds.key && creds.secret ? creds : null;
    } catch (err) {
      console.error("Error fetching software creds from integrations:", err);
      return null;
    }
  };

  const getUniqueSources = (sources = []) => {
    const unique = new Set();
    return sources.filter((s) => {
      if (unique.has(s.document_name)) return false;
      unique.add(s.document_name);
      return true;
    });
  };
  const startCareVoiceSession = async () => {
    try {
      if (isCareVoiceLocked) {
        toast.warn("Please wait until your documents are ready before starting Ask AI.");
        return;
      }
      if (isCareVoiceGeneratingDocs || (totalCareVoiceDocsToGenerate > 0 && generatedCareVoiceDocsCount < totalCareVoiceDocsToGenerate)) {
        toast.warn("Please wait until all documents are downloaded before starting a session.");
        return;
      }
      if (!careVoiceFiles.length) {
        toast.warn("No documents available");
        return;
      }
      // console.log("careVoiceFiles", careVoiceFiles);
      setIsStartingSession(true);

      const formData = new FormData();
      formData.append("firebaseUid", user?.uid);
      const session_id = `session_${crypto.randomUUID()}`;
      formData.append("session_id", session_id);

      const filteredFiles = careVoiceFiles.filter(file =>
        !file.type.startsWith("audio/") &&
        !file.type.startsWith("video/")
      );

      filteredFiles.forEach((file) => {
        formData.append("documents", file);
      });

      const res = await fetch(
        `${API_BASE}/api/careVoiceAskAI/start`,
        {
          method: "POST",
          body: formData
        }
      );

      const data = await res.json();
      if (!data.success) throw new Error("Start failed");

      setCareVoiceSessionId(data.data.session_id);
      setCareVoiceUserId(data.user_id);
      setCareVoiceStarted(true);

    } catch (err) {
      console.error("Start session failed", err);
    } finally {
      setIsStartingSession(false); // ✅ STOP LOADING
    }
  };

  const toggleCandidate = (index) => {
    setSelectedCandidates((prev) => {
      if (prev.includes(index)) {
        return prev.filter((item) => item !== index);
      }
      return [...prev, index];
    });
  };

  const handleBulkScreening = async () => {
    if (jdFiles.length === 0 || resumeFiles.length === 0) return;

    try {
      setScreeningLoading(true);

      // Add a processing message
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Processing your documents... Please wait.",
          temp: true
        }
      ]);

      const formData = new FormData();
      formData.append("organisation_id", hrActiveOrgId);
      formData.append("jd_file", jdFiles[0]);

      resumeFiles.forEach((file) => {
        formData.append("resume_files", file);
      });

      const res = await axios.post(
        `${API_BASE}/api/screen-bulk`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data?.ok) {
        const list = (res.data.candidates || []).map((item) => ({
          ...item.screener,
          index: item.index
        }));

        setScreenedResults(list);
        setHrScreenedCandidates(list);
        setSelectedCandidates(list.map((_, i) => i));
        setHrStep("RESULTS");
        // Discard the uploaded JD + resumes once screening completes so
        // the next run starts from a clean slate.
        setJdFiles([]);
        setResumeFiles([]);

        // Replace the processing message with results message
        setMessages((prev) => {
          const filtered = prev.filter(msg => !msg.temp);
          return [
            ...filtered,
            {
              sender: "bot",
              text: `✅ Screening complete! Found ${list.length} candidates. Here are the results:`,
              showResults: true,
              resultsCount: list.length
            }
          ];
        });
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev.filter(msg => !msg.temp),
        {
          sender: "bot",
          text: "❌ Sorry, something went wrong while screening. Please try again."
        }
      ]);
    } finally {
      setScreeningLoading(false);
    }
  };

  const handleShortlist = async () => {
    try {
      setShortlistLoading(true);

      const data = await axios.post(
        `${API_BASE}/api/shortlist-screened`,
        {
          organisation_id: hrActiveOrgId,
          admin_email: user?.email,
          screened: screenedResults,
          selected_indices: selectedCandidates
        }
      );
      setScreenedResults(data.data.shortlisted || []);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: `${selectedCandidates.length} candidates shortlisted successfully.`
        }
      ]);

      setHrStep("IDLE");
      await fetchAllCandidates();
    } catch (err) {
    } finally {
      setShortlistLoading(false);
    }
  };
  useEffect(() => {
    if (isHRAskAiPage && messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hello! I'm Alex, your AI recruitment partner. How can I help you streamline the staff onboarding today?",
          isWelcomeMessage: true
        }
      ]);
    }
  }, [isHRAskAiPage, messages.length]);

  // Care Voice (Staff): once ALL documents finish generating on the
  // "Generated Documents" screen, surface the "Ask AI" helper popup
  // automatically (no hover) to nudge the staff member toward asking about
  // them. We "arm" on the generation-complete transition (so it never fires
  // just from navigating back to a stale docs screen), then fire once the
  // documents are actually present (the file/flag state updates can land in
  // either order across the generation paths).
  useEffect(() => {
    const wasGenerating = prevGeneratingDocsRef.current;
    prevGeneratingDocsRef.current = isCareVoiceGeneratingDocs;

    const onStaffDocsScreen =
      isCareVoicePage && voiceRole === "Staff" && voiceDocsScreen;

    if (wasGenerating && !isCareVoiceGeneratingDocs && onStaffDocsScreen) {
      pendingAutoShowRef.current = true;
    }

    if (
      pendingAutoShowRef.current &&
      onStaffDocsScreen &&
      !isCareVoiceGeneratingDocs &&
      careVoiceFiles.length > 0 &&
      !showAIChat
    ) {
      pendingAutoShowRef.current = false;
      setAskAiAutoShow(true);
    }
  }, [isCareVoiceGeneratingDocs, isCareVoicePage, voiceRole, voiceDocsScreen, careVoiceFiles, showAIChat]);

  // Auto-hide the Care Voice "Ask AI" helper popup 5s after it auto-opens.
  // Keyed only on the flag so unrelated re-renders can't cancel the timer.
  useEffect(() => {
    if (!askAiAutoShow) return undefined;
    const timer = setTimeout(() => setAskAiAutoShow(false), 5000);
    return () => clearTimeout(timer);
  }, [askAiAutoShow]);

  // Auto-scroll Ask AI chat to the bottom whenever messages change (new message
  // arrives, streamed text updates, or temp/loading state flips).
  useEffect(() => {
    if (!showAIChat) return;
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, showAIChat]);

  // Inject the fancy Resume Screening toggle button into the askai label
  useEffect(() => {
    if (!showAIChat || !isHRAskAiPage) return;

    const cb = document.getElementById('askai-mode-checkbox');
    const label = document.getElementById('askai-mode-toggle-label');
    if (!cb || !label || label.querySelector('.rs-fancy-btn')) return;

    const span = label.querySelector('span');
    if (span) span.style.display = 'none';

    const btn = document.createElement('div');
    btn.className = `rs-fancy-btn ${cb.checked ? 'rs-on' : 'rs-off'}`;

    const icon = document.createElement('span');
    icon.className = 'rs-fancy-icon';
    const txt = document.createElement('span');
    txt.textContent = 'Resume Screening';

    btn.appendChild(icon);
    btn.appendChild(txt);
    label.insertBefore(btn, cb);

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // cb.click() flips .checked AND fires a synthetic-event-compatible
      // change so React's onChange (openResumeScreening / general fallback)
      // actually runs. Direct .checked assignment bypasses React's tracker.
      cb.click();
      btn.classList.add('rs-burst');
      setTimeout(() => btn.classList.remove('rs-burst'), 380);
    });
  }, [showAIChat, isHRAskAiPage]);

  // Keep the fancy button's visual state in sync with hrMode
  useEffect(() => {
    const btn = document.querySelector('#askai-mode-toggle-label .rs-fancy-btn');
    if (!btn) return;
    const isOn = hrMode === 'resume_screening';
    btn.classList.toggle('rs-on', isOn);
    btn.classList.toggle('rs-off', !isOn);
  }, [hrMode]);

  // Release the send-guard once the previous response has finished streaming
  // (i.e. no message bubble is still in its temp/generating state)
  useEffect(() => {
    if (!messages.some((m) => m.temp)) {
      isSendingRef.current = false;
    }
  }, [messages]);
  const openResumeScreening = () => {
    setHrMode("resume_screening");
    setHrStep("UPLOAD");
    // Fresh resume-screening session — restart the first-run gate so the
    // initial send (with attached files) can go through without a typed prompt.
    setHasResumeRunStarted(false);
    setAskAiAttachedFiles([]);
    setHrScreenedCandidates([]);
    resetHrConversation();

    setMessages((prev) => [
      ...prev,
      {
        sender: "bot",
        text: "Please upload the Job Description and candidate resumes to start screening.",
        isUploadPrompt: true  // Add flag to identify upload prompt
      }
    ]);
  };
  const handleHRChatWithSocket = async (finalQuery, tempMessageId) => {

    // Function to update the temp message - USE FUNCTIONAL UPDATE
    const updateTempMessage = (newText, isStreaming = true) => {

      setMessages((prev) =>
        prev.map((msg) =>
          msg.tempId === tempMessageId
            ? {
              ...msg,
              text: newText,
              isStreaming: isStreaming,
              temp: isStreaming  // Keep temp true until complete
            }
            : msg
        )
      );
    };

    // Build attachments exactly the way hr_chat_client.html does:
    //   - JD + résumés are attached whenever the user has them in state and
    //     we're in resume_screening mode (regardless of prior screening
    //     state — same as the HTML reference).
    //   - "general" files are attached in general mode only.
    let attachments = [];
    if (hrMode === "resume_screening") {
      attachments = await Promise.all([
        ...jdFiles.map(async (file) => ({
          filename: file.name,
          document_role: "job_description",
          content_base64: await fileToBase64(file)
        })),
        ...resumeFiles.map(async (file) => ({
          filename: file.name,
          document_role: "resume",
          content_base64: await fileToBase64(file)
        }))
      ]);
    } else if (askAiAttachedFiles.length > 0) {
      attachments = await Promise.all(
        askAiAttachedFiles.map(async (file) => ({
          filename: file.name,
          document_role: "general",
          content_base64: await fileToBase64(file)
        }))
      );
      setAskAiAttachedFiles([]);
    }

    // Mirror hr_chat_client.html's `body` shape exactly. `admin_name` /
    // `admin_email` are kept on the proxy payload so the Node proxy can use
    // them for outbound emails — the proxy strips them before relaying to
    // the upstream WS, so the upstream sees the same shape as the HTML
    // client.
    const payload = {
      organisation_id: hrActiveOrgId,
      message: finalQuery,
      max_conversation_turns: 5,
      workflow_phase:
        hrMode === "resume_screening" ? "resume_screening" : "general",
      admin_name: user?.displayName || "HR Admin",
      admin_email: user?.email,
      api_key: ""
    };
    if (hrConvHistoryRef.current.length > 0) {
      payload.conversation_history = hrConvHistoryRef.current;
    }
    if (hrScreenedCandidates && hrScreenedCandidates.length > 0) {
      payload.screened_candidates = hrScreenedCandidates;
    }
    if (attachments.length > 0) {
      payload.attachments = attachments;
    }

    // Track this turn's user-side text the same way the HTML client does
    // (text + "[N file(s)]" summary). Pushed into history on hr_complete.
    const fileCount = attachments.length;
    hrLastUserTextRef.current = finalQuery
      ? fileCount
        ? `${finalQuery} [${fileCount} file(s)]`
        : finalQuery
      : `[${fileCount} file(s) only]`;

    if (hrMode === "resume_screening" && attachments.length > 0) {
      setJdFiles([]);
      setResumeFiles([]);
    }
    try {
      const sent = sendHRChat({
        payload,

        onEvent: (type, data) => {

          // Defensive filter: drop idle/welcome chatter that can otherwise
          // briefly flash in the chat (e.g. "Connected. Send a message or
          // attach files to begin.").
          const isIdleNoise = (text) => {
            if (!text) return false;
            const t = String(text).trim().toLowerCase();
            return (
              t === "connected" ||
              t === "connected." ||
              t.includes("send a message or attach files to begin") ||
              t.startsWith("connecting to hr server") ||
              t.startsWith("connected to hr server")
            );
          };

          let newText = "";

          if (type === "status") {
            const candidate = data?.message || "Processing...";
            if (isIdleNoise(candidate)) return;
            newText = candidate;
            updateTempMessage(newText, true);
          }
          else if (type === "event") {
            if (data?.payload?.message) {
              newText = data.payload.message;
            } else if (data?.payload?.status) {
              newText = data.payload.status;
            } else if (data?.event) {
              const eventName = data.event;
              if (eventName.includes("session_ready")) {
                newText = "🎯 Session ready, analyzing...";
              } else if (eventName.includes("thinking")) {
                newText = "🤔 AI is thinking...";
              } else if (eventName.includes("processing")) {
                newText = "⚙️ Processing your request...";
              } else {
                newText = `📡 ${eventName.split('.').pop()}`;
              }
            }
            if (isIdleNoise(newText)) return;
            if (newText) updateTempMessage(newText, true);
          }
          else if (type === "email_prepared") {
            newText = `📧 ${data?.message || "Preparing email..."}`;
            updateTempMessage(newText, true);
          }
          else if (type === "email_sent") {
            newText = `✅ ${data?.message || "Email sent successfully!"}`;
            updateTempMessage(newText, true);
          }
        },

        onComplete: (data) => {
          const finalText = data?.message || "Done";

          const tools = data?.payload?.tool_results || [];

          const bulkScreen = tools.find(
            (t) => t.tool === "shortlist_screened" && t.ok
          );


          if (bulkScreen) {
            let candidates = [];

            // 1️⃣ If result already contains shortlisted
            if (bulkScreen.result?.shortlisted) {
              candidates = bulkScreen.result.shortlisted;
            }

            // 2️⃣ Else parse screened_json string
            else if (bulkScreen.arguments?.screened_json) {
              try {
                candidates = JSON.parse(
                  bulkScreen.arguments.screened_json
                );
              } catch (err) {
                console.error("JSON parse failed:", err);
              }
            }


            setHrScreenedCandidates(candidates);
            setScreenedResults(candidates);
            setHrStep("RESULTS");
            setJdFiles([]);
            setResumeFiles([]);
            attachments = [];
          }

          // Mirror hr_chat_client.html: on a real reply, append the
          // {user, assistant} pair to the conversation history that we send
          // back on the next turn. Skip when there's no reply text.
          if (finalText && finalText !== "Done") {
            hrConvHistoryRef.current = [
              ...hrConvHistoryRef.current,
              {
                role: "user",
                content: hrLastUserTextRef.current || ""
              },
              { role: "assistant", content: finalText }
            ];
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.tempId === tempMessageId
                ? {
                  sender: "bot",
                  text: finalText,
                  temp: false,
                  isStreaming: false
                }
                : msg
            )
          );
        },

        onError: (err) => {
          console.error("[HR CHAT] Error:", err);

          setMessages((prev) =>
            prev.map((msg) =>
              msg.tempId === tempMessageId
                ? {
                  sender: "bot",
                  text: `❌ Error: ${err?.message || "Something went wrong"}`,
                  temp: false,
                  isError: true
                }
                : msg
            )
          );
        }
      });

      if (!sent) {
        updateTempMessage("❌ Connection failed. Please try again.", false);
      }

    } catch (error) {
      console.error("[HR CHAT] Exception:", error);
      updateTempMessage(`❌ ${error.message}`, false);
    }
  };
  const handleSend = async (customText, eventName = null) => {
    // 🚨 FEEDBACK MODE HANDLER (ADD THIS AT TOP)
    if (feedbackMode) {
      const rawQuery =
        typeof customText === "string"
          ? customText
          : inputRef.current || "";

      const feedbackText = rawQuery.trim();
      if (!feedbackText) return;

      const key = `${selectedRole}_${feedbackMode.index}`;

      try {
        // ✅ CALL YOUR EXISTING API FUNCTION
        await submitFeedback(
          feedbackMode.index,
          feedbackMode.message,
          "down",
          feedbackText
        );

        // ✅ SAVE FEEDBACK TEXT
        setFeedbackState((prev) => ({
          ...prev,
          [key]: {
            ...prev[key],
            text: feedbackText,
            submitted: true
          }
        }));

      } catch (err) {
        console.error("Feedback error:", err);
      }

      // ✅ RESET MODE
      setFeedbackMode(null);

      // ✅ CLEAR INPUT
      if (textareaRef.current) textareaRef.current.value = "";
      inputRef.current = "";

      return;
    }
    const rawQuery =
      typeof customText === "string"
        ? customText
        : inputRef.current || "";

    const finalQuery = rawQuery.trim();

    const allowEmptyPromptForResumeScreening =
      isHRAskAiPage &&
      hrMode === "resume_screening" &&
      jdFiles.length > 0 &&
      resumeFiles.length > 0 &&
      // Only the FIRST screening pass may go through without a typed prompt.
      // Once a resume-screening send has been initiated, every follow-up
      // submission must carry an actual question.
      !hasResumeRunStarted;

    if (!finalQuery && !eventName && !allowEmptyPromptForResumeScreening) {
      return;
    }

    // Block duplicate sends while a previous response is still generating
    if (isSendingRef.current) {
      return;
    }
    isSendingRef.current = true;

    // Lock the empty-prompt allowance after the first resume-screening send.
    if (isHRAskAiPage && hrMode === "resume_screening" && !hasResumeRunStarted) {
      setHasResumeRunStarted(true);
    }

    // Drop the "Please upload…" prompt and its upload boxes together the
    // instant the user submits — the upload step is done.
    setMessages((prev) =>
      prev.some((m) => m.isUploadPrompt)
        ? prev.filter((m) => !m.isUploadPrompt)
        : prev
    );

    // show user message and temp bot message
    if (finalQuery) {
      setMessages((prev) => [...prev, { sender: "user", text: finalQuery }]);
    }
    const tempMessageId = Date.now();
    const tempBotMessage = {
      sender: "bot",
      text: "Generating response...",
      temp: true,
      tempId: tempMessageId
    };
    setMessages((prev) => [...prev, tempBotMessage]);

    // clear input only when the user typed (not when suggestion clicked)
    if (!customText && textareaRef.current) {
      textareaRef.current.value = "";
      inputRef.current = "";
    }

    try {
      if (isCareVoicePage) {
        if (!careVoiceStarted) {
          toast.warn("Please start session first");

          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? { sender: "bot", text: "Please start Care Voice session first." }
                : msg
            )
          );

          return;
        }

        try {
          const response = await fetch(
            `${API_BASE}/api/careVoiceAskAI/query`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                session_id: careVoiceSessionId,
                user_id: careVoiceUserId,
                query: finalQuery
              })
            }
          );

          const data = await response.json();
          const botReply = data?.data?.answer || "No response";
          const sources = data?.data?.sources || [];

          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? { sender: "bot", text: botReply, sources }
                : msg
            )
          );
          await incrementCareVoiceAnalysisCount(
            user?.email?.trim().toLowerCase(),
            "askai",
            data?.data?.llm_cost?.total_usd,
            "carevoice",
            data?.data?.llm_cost?.token_usage
          );
        } catch (err) {
          console.error("Care Voice AskAI Error:", err);

          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? { sender: "bot", text: "Care Voice Ask AI failed." }
                : msg
            )
          );
        }

        return;
      }
      //SMART ROSTERING MODE
      //ASK-AI FOR RESUME ZIP (Smart Onboarding / HR Module)
      //SOFTWARE CONNECT CHATBOT (Dialogflow)
      if (isNewFinancialModule) {
        try {
          // ✅ Send the FULL history, don't remove anything
          const response = await axios.post(
            `${API_BASE}/api/financial-v2/askAi`,
            {
              question: finalQuery,
              dataframes: financialAiPayload,
              conversation_history: financialAiHistoryPayload || [],
              provider: "NDIS"
            }
          );

          // console.log("Financial AI Response: ", response.data);
          const botReply = response.data?.answer || "No response";

          setMessages(prev =>
            prev.map(msg =>
              msg.temp ? { sender: "bot", text: botReply } : msg
            )
          );

          // ✅ Update with the NEW conversation history from response
          setFinancialAiHistoryPayload(response.data?.conversation_history || []);
          await incrementCareVoiceAnalysisCount(
            user?.email?.trim().toLowerCase(),
            "askai",
            response?.data?.llm_cost?.total_usd,
            "financial-health",
            response?.data?.llm_cost?.token_usage
          );

        } catch (err) {
          console.error("Financial AskAI Error:", err);
        }

        return;
      }
      if (isSoftwareConnectPage) {
        try {

          const response = await axios.post(
            `${API_BASE}/api/dialogflow`,
            {
              event: eventName
            }
          );

          // console.log("Dialogflow response:", response.data);

          let botReply = response.data?.reply || "No response";
          botReply = botReply.replace("Rich response received", "").trim();
          const richContent = response.data?.richContent || [];

          const elements = richContent.flat();

          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? {
                  sender: "bot",
                  text: botReply,
                  richContent: elements
                }
                : msg
            )
          );

        } catch (error) {

          console.error("Dialogflow Error:", error);

          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? { sender: "bot", text: "Chatbot failed to respond." }
                : msg
            )
          );
        }

        return;
      }
      if (
        isHRAskAiPage &&
        (
          hrMode === "general" ||
          hrMode === "resume_screening"
        )
      ) {
        try {
          setHrSending(true);
          await handleHRChatWithSocket(finalQuery, tempMessageId);
        } catch (error) {
          console.error("HR Chat error:", error);
          setMessages(prev => prev.map(msg =>
            msg.temp && msg.tempId === tempMessageId
              ? { ...msg, text: `❌ Error: ${error.message}` }
              : msg
          ));
        } finally {
          setHrSending(false);
        }
        return;
      }
      if (isSmartRosteringPage) {
        if (manualAskAiFile) {
          const form = new FormData();
          form.append("files", manualAskAiFile);
          form.append("question", finalQuery);
          const response = await axios.post(
            `${API_BASE}/api/manualSmartRostering`,
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
          await incrementCareVoiceAnalysisCount(
            user?.email?.trim().toLowerCase(),
            "askai",
            response?.data?.llm_cost?.total_usd,
            "smart-rostering",
            response?.data?.llm_cost?.token_usage
          );
          return; // Stop here
        }
        // Normalize the manifest into the exact shape the Python QA endpoint
        // expects (see client_askai.py reference). After the rostering-settings
        // → organizations migration, software creds and placements live nested
        // under `integrations`, so we lift them to the top level. We also fill
        // sensible defaults for any field the org config doesn't carry —
        // crucially `placements`, which the QA endpoint needs to know which
        // software/creds to use when fetching data.
        const src = mainfestData || {};

        // Resolve placements (top-level or nested); fall back to defaults that
        // route every role to the rostering software.
        const hasKeys = (o) => o && typeof o === "object" && Object.keys(o).length > 0;
        const rawPlacements = hasKeys(src.placements)
          ? src.placements
          : hasKeys(src.integrations?.placements)
          ? src.integrations.placements
          : null;
        const rosteringSoftware = rawPlacements?.rostering || "visualcare";
        const placements = rawPlacements || {
          rostering: rosteringSoftware,
          timesheet: rosteringSoftware,
          client_details: rosteringSoftware,
          staff_workers: rosteringSoftware,
          favourites: rosteringSoftware,
        };

        const normalizedManifest = {
          provider_name: src.provider_name || "",
          softwares: src.softwares || src.integrations?.softwares || {},
          placements,
          inputs: src.inputs || {},
          shortlisting_criteria:
            src.shortlisting_criteria ||
            src.integrations?.shortlisting_criteria ||
            {},
          favourites: src.favourites || ["history"],
          Role_elimination:
            src.Role_elimination || src.rostering?.role_elimination || [],
          // Reference manifest uses the singular key `Unallocated_WorkerType`.
          Unallocated_WorkerType:
            src.Unallocated_WorkerType ||
            src.rostering?.Unallocated_WorkerType ||
            [],
        };

        // The Rostering Settings form may not hold creds. If they're missing,
        // fall back to the integration_credentials container.
        const hasCreds = (c) => !!(c && c.user && c.key && c.secret);
        let softwareCreds = normalizedManifest.softwares?.[rosteringSoftware]?.creds;

        if (!hasCreds(softwareCreds)) {
          const fallbackCreds = await fetchSoftwareCredsFromIntegrations(
            rosteringSoftware
          );
          if (hasCreds(fallbackCreds)) {
            softwareCreds = fallbackCreds;
            normalizedManifest.softwares = {
              ...normalizedManifest.softwares,
              [rosteringSoftware]: {
                ...(normalizedManifest.softwares?.[rosteringSoftware] || {}),
                creds: fallbackCreds,
              },
            };
          }
        }

        if (!hasCreds(softwareCreds)) {
          setMessages(prev =>
            prev.map(msg =>
              msg.temp
                ? {
                    sender: "bot",
                    text: "Your rostering software isn't connected yet. Please connect it in Rostering Settings before using Ask AI.",
                  }
                : msg
            )
          );
          return;
        }

        const payload = {
          manifest: normalizedManifest,
          question: finalQuery,
        };

        // kris@curki.ai runs against the sandbox environment.
        if (user?.email?.trim()?.toLowerCase() === "kris@curki.ai") {
          payload.env = "sandbox";
        }
        console.log("🟡 Smart Rostering Payload:", payload);

        // Call the Python QA API via our middleware (browsers are blocked from
        // hitting the Python container directly by CORS).
        try {
          const response = await axios.post(
            `${API_BASE}/smart-rostering/qa`,
            payload
          );

          const botReply = response.data?.answer || "No response";

          setMessages((prev) =>
            prev.map((msg) => (msg.temp ? { sender: "bot", text: botReply } : msg))
          );
          await incrementCareVoiceAnalysisCount(
            user?.email?.trim().toLowerCase(),
            "askai",
            response?.data?.llm_cost?.total_usd,
            "smart-rostering",
            response?.data?.llm_cost?.token_usage
          );
        } catch (err) {
          // Surface the middleware's friendly message (e.g. cold-start retry
          // exhausted) instead of a generic failure.
          console.error("Smart Rostering QA Error:", err);
          const serverMsg = err?.response?.data?.error;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.temp
                ? {
                    sender: "bot",
                    text:
                      serverMsg ||
                      "The rostering AI service is taking longer than usual. Please try again in a moment.",
                  }
                : msg
            )
          );
        }
        return;
      }

      // 🟢 TLC CLIENT PROFITABILITY MODE
      if (isTlcClientProfitabilityPage) {

        try {
          // ✅ Build history from your local messages state
          const localHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));

          // Remove the temp message if it exists
          const cleanHistory = localHistory.filter(msg => !msg.content.includes('Generating response...'));
          // console.log("tlcClientProfitabilityPayload", tlcClientProfitabilityPayload);
          const payload = {
            question: finalQuery,
            table_data: tlcClientProfitabilityPayload,
            conversation_history: cleanHistory,
          };

          // only for kris add env
          if (userEmail === "kris@curki.ai") {
            payload.env = "sandbox";
          }

          const response = await axios.post(
            `https://aca-curki-aibackend-prod-aue-001.agreeabledune-2a557375.australiaeast.azurecontainerapps.io/header_modules/clients_profitability/ask_ai`,
            payload
          );

          // console.log("response of tlc client profit ask ai ", response.data);
          const botReply = response.data?.ai_answer || response.data?.answer || "No response";

          setMessages(prev =>
            prev.map(msg => (msg.temp ? { sender: "bot", text: botReply } : msg))
          );

          //Update history with your own messages + new response
          const updatedHistory = [
            ...cleanHistory,
            { role: 'assistant', content: botReply }
          ];

          setClientProfitabilityAiHistoryPayload(updatedHistory);

          // Count usage for Client Profitability
          if (user?.email) {
            try {
              const email = user.email.trim().toLowerCase();
              await incrementCareVoiceAnalysisCount(email, "askai", response?.data?.llm_cost?.total_usd, "client-profitability", response?.data?.llm_cost?.token_usage);
            } catch (err) {
              console.error("❌ Failed to increment Client Profitability AskAI count:", err.message);
            }
          }
        } catch (err) {
          console.error("TLC Client Profitability AskAI Error:", err);
          setMessages(prev =>
            prev.map(msg =>
              msg.temp ? { sender: "bot", text: "Something went wrong!" } : msg
            )
          );
        }

        return;
      }

      if (isTlcPage) {
        try {
          // Build history from messages
          const localHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }));

          const cleanHistory = localHistory.filter(msg => !msg.content.includes('Generating response...'));
          // console.log("cleanHistory", cleanHistory);
          const response = await axios.post(
            `${API_BASE}/api/payroll-askai`,
            {
              tlcAskAiPayload,
              tlcAskAiHistoryPayload,  // existing parameter
              question: finalQuery,
              userEmail: userEmail,
              conversation_history: cleanHistory,  // new parameter for conversation
              // Scope csv_files_data reads to the caller's organization.
              organizationId: organizationId || null
            }
          );

          // console.log("response", response.data);
          const botReply = response.data?.answer || "No response";

          setMessages(prev =>
            prev.map(msg => (msg.temp ? { sender: "bot", text: botReply } : msg))
          );

          // Update conversation history
          const updatedHistory = [
            ...cleanHistory,
            { role: 'assistant', content: botReply }
          ];

          setTlcPayrollAskAiConversationHistory(updatedHistory);

        } catch (err) {
          console.error("TLC AskAI Error:", err);
        }

        return;
      }


      // DEFAULT ASK AI MODE (for all other modules)
      let payload = { query: finalQuery };
      if (documentString) payload.document = documentString;

      // console.log("Default Ask AI Payload:", payload);

      const response = await axios.post(
        "https://aca-curki-aibackend-prod-aue-001.agreeabledune-2a557375.australiaeast.azurecontainerapps.io/askai",
        payload
      );


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
    if (isTlcPage) {
      setSuggestions(moduleSuggestions.tlc);
    } else if (isTlcClientProfitabilityPage) {
      setSuggestions(moduleSuggestions.tlcClientProfitability);
    }
    else if (isSmartRosteringPage) {
      setSuggestions(moduleSuggestions.smart);
    }
    else if (isSoftwareConnectPage) {
      setSuggestions(moduleSuggestions.softWareConnect);
    }
    else if (isNewFinancialModule) {
      setSuggestions(moduleSuggestions.financial);
    }
    else {
      setSuggestions(moduleSuggestions.default);
    }
  }, [selectedRole]);

  useEffect(() => {
    const isHRAsk = selectedRole === "Smart Onboarding (Staff)";
    setMessages(
      isHRAsk
        ? [
          {
            sender: "bot",
            text: "Hello! I'm Alex, your AI recruitment partner. How can I help you streamline the staff onboarding today?",
            isWelcomeMessage: true
          }
        ]
        : []
    );
    setFinancialAiHistoryPayload([]);
    setClientProfitabilityAiHistoryPayload([]);
    setCareVoiceSessionId(null);
    setCareVoiceUserId(null);
    setCareVoiceStarted(false);
    // NOTE: careVoiceFiles is intentionally NOT cleared on role switch.
    // VoiceModule stays mounted (toggled via display:none), so its open
    // "Generated Documents" panel keeps reading props.careVoiceFiles. Clearing
    // it here wiped the docs while the panel stayed open, leaving only the
    // loading-video fallback when the user returned to Care Voice. The files
    // are reset deliberately via the "New Template" button (handleResetAll)
    // and resetCareVoiceSession instead.
    // clear textarea safely
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
    setHrStep("IDLE");
    setJdFiles([]);
    setResumeFiles([]);
    setScreenedResults([]);
    setSelectedCandidates([]);
    inputRef.current = "";
  }, [selectedRole]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setShowDropdown(false);
  };

  // Force Care Voice on mobile/tablet, restore previous role when returning to desktop
  const previousRoleRef = useRef(null);
  useEffect(() => {
    if (isMobileOrTablet) {
      if (selectedRole !== "Care Voice") {
        previousRoleRef.current = selectedRole;
      }
      setSelectedRole("Care Voice");
    } else if (previousRoleRef.current) {
      setSelectedRole(previousRoleRef.current);
      previousRoleRef.current = null;
    }
  }, [isMobileOrTablet]);

  useEffect(() => {
    const handleSubscriptionUpdate = (event) => {
      if (event.detail) {
        setSubscriptionInfo(event.detail);
      }
    };

    window.addEventListener("subscription-updated", handleSubscriptionUpdate);

    return () => {
      window.removeEventListener("subscription-updated", handleSubscriptionUpdate);
    };
  }, []);
  // SubscriptionStatus(user, setShowPricingModal);
  const resetCareVoiceSession = async () => {
    try {
      if (careVoiceSessionId && careVoiceUserId) {
        await fetch(
          `${API_BASE}/api/careVoiceAskAI/delete-session`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              session_id: careVoiceSessionId,
              user_id: careVoiceUserId,
            }),
          }
        );
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }

    // RESET ALL STATES
    setCareVoiceSessionId(null);
    setCareVoiceUserId(null);
    setCareVoiceStarted(false);
    setCareVoiceFiles([]);
    setMessages([]);
  };

  return (
    <>
      {/* ToastContainer lives at the App root — see App.js. */}
      {showSignIn ?

        <SignIn show={showSignIn} onClose={() => setShowSignIn(false)} />
        :
        <>
          {showPricingModal ? (
            // <PricingModal onClose={() => setShowPricingModal(false)} email={user?.email} />
            <PricingPlansModal onClose={() => setShowPricingModal(false)} email={user?.email} firstName={user?.displayName} setSubscriptionInfo={setSubscriptionInfo} />
          ) : (
            <div className="page-container">
              {!isMobileOrTablet && sidebarVisible && (
                <Sidebar
                  onCollapse={toggleSidebar}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                  majorTypeofReport={majorTypeofReport}
                  setMajorTypeOfReport={setMajorTypeOfReport}
                  user={user}
                  isOwner={userOrgRole === "owner"}
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
                  openSettings={() => {
                    setShowSettings(true);
                    setShowTeamMembers(false);
                    setShowUsageDetails(false);
                  }}
                  openTeamMembers={() => {
                    setShowTeamMembers(true);
                    setShowSettings(false);
                    setShowUsageDetails(false);
                  }}
                  openUsageDetails={() => {
                    setShowUsageDetails(true);
                    setShowSettings(false);
                    setShowTeamMembers(false);
                  }}
                  openPlansBilling={() => {
                    setShowPlansBillingModal(true);
                    setShowUsageDetails(false);
                    setShowSettings(false);
                    setShowTeamMembers(false);
                  }}
                  closeAllPanels={() => {
                    setShowSettings(false);
                    setShowTeamMembers(false);
                    setShowUsageDetails(false);
                    setShowPlansBillingModal(false);
                  }}
                />
              )}

              {/* Right column is a fixed-height (100vh) internal scroll
                  region. The PAGE itself no longer scrolls — only this
                  panel does. That keeps the 100vh sidebar covering the
                  full viewport at every scroll position (previously a
                  taller-than-viewport page left a white gap below the
                  sidebar). */}
              <div className="app-scroll-region" style={{ flex: 1, minWidth: 0, height: "100vh", overflowY: "auto" }}>
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

                  {!isMobileOrTablet && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "20px",
                        }}
                      >
                        {(isTlcPage || isTlcClientProfitabilityPage) && (isDemoUser || isTlcDomainUser) && (
                          <img
                            src={isDemoUser ? dummyLogo : newTlcLogo}
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
                        {
                          !isMobileOrTablet && (
                            <>
                              {userEmail === "kris@curki.ai" && (
                                <p
                                  style={{
                                    fontSize: "16px",
                                    color: "red",
                                    marginTop: "4px",
                                    fontWeight: 700,
                                    letterSpacing: "0.2px",
                                    textTransform: "uppercase"
                                  }}
                                >
                                  Product Demo with Dummy Data
                                </p>
                              )}
                            </>
                          )
                        }
                      </div>
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
                    </>
                  )}
                  {isMobileOrTablet && (
                    <div
                      style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <img src={black_logo} style={{ width: "36%", height: "auto" }} alt="curkiLogo" />
                      <button
                        onClick={() => setShowMobileMenu(true)}
                        style={{
                          background: "none",
                          border: "none",
                          fontSize: "26px",
                          cursor: "pointer",
                        }}
                      >
                        ☰
                      </button>
                    </div>
                  )}
                </div>
                {isSoftwareConnectPage && !showSettings && !showUsageDetails && !showTeamMembers && (
                  <div
                    className="api-key-help-btn"
                    onClick={() => setShowAIChat(true)}
                  >
                    <span>See How To Get API Keys</span>

                    <img
                      src={chatBotKeyIcon}
                      alt="api-help"
                      className="api-key-icon"
                    />
                  </div>
                )}
                {isMobileOrTablet && showMobileMenu && (
                  <>
                    {/* RIGHT */}
                    <div
                      onClick={() => setShowMobileMenu(false)}
                      style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.3)",
                        zIndex: 1000,
                      }}
                    >
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          width: "260px",
                          height: "100%",
                          backgroundColor: "#fff",
                          padding: "20px",
                          boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            marginBottom: "10px",
                            fontSize: "14px",
                          }}
                        >
                          Account
                        </div>

                        <div
                          style={{
                            fontSize: "13px",
                            color: "#555",
                            wordBreak: "break-all",
                          }}
                        >
                          {user?.email}
                        </div>

                        <hr style={{ margin: "16px 0" }} />

                        <button
                          onClick={handleLogout}
                          style={{
                            background: "#6C4CDC",
                            color: "#fff",
                            border: "none",
                            padding: "10px 14px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {showUsageDetails ? (
                  <DetailedUsage
                    user={user}
                    onBack={() => setShowUsageDetails(false)}
                  />
                ) : showSettings ? (
                  <SettingsPage
                    user={user}
                    onBack={() => setShowSettings(false)}
                  />
                ) : showTeamMembers ? (
                  <TeamMembers
                    onBack={() => setShowTeamMembers(false)}
                    loggedInUserEmail={user?.email}
                  />
                ) :
                  (
                    <div className={isTlcPage ? "tlc-custom-main-content" : isSmartRosteringPage ? "smart-rostering-main-content" : "main-content"} style={{
                      display: showAIChat ? "none" : "block",
                    }}>
                      {/* {showFeedbackPopup && <FeedbackModal userEmail={user?.email} />} */}
                      {!loadingUser && selectedRole === "Connect Your Systems" && user && (
                        <Suspense fallback={<CenteredLoader />}>
                          <SoftwareConnect user={user} />
                        </Suspense>
                      )}
                      {visitedRoles.has("Financial Health") && (
                        <div style={{ display: selectedRole === "Financial Health" ? "block" : "none" }}>
                          {/* <FinancialHealth selectedRole="Financial Health" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} /> */}
                          <Suspense fallback={<CenteredLoader />}>
                            <NewFinancialHealth selectedRole="Financial Health" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} setFinancialAiPayload={setFinancialAiPayload}
                              setFinancialAiHistoryPayload={setFinancialAiHistoryPayload} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("SIRS Analysis") && (
                        <div style={{ display: selectedRole === "SIRS Analysis" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <SirsAnalysis selectedRole="SIRS Analysis" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Participant Events & Incident Management") && (
                        <div style={{ display: selectedRole === "Participant Events & Incident Management" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <Client_Event_Reporting selectedRole='Participant Events & Incident Management' user={user} />
                          </Suspense>
                        </div>
                      )}
                      {visitedRoles.has("Incident Auditing") && (
                        <div style={{ display: selectedRole === "Incident Auditing" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <IncidentAuditing selectedRole='Incident Auditing' user={user} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Quarterly Financial Reporting") && (
                        <div style={{ display: selectedRole === "Quarterly Financial Reporting" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <Qfr selectedRole="Quarterly Financial Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Annual Financial Reporting") && (
                        <div style={{ display: selectedRole === "Annual Financial Reporting" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <Afr selectedRole="Annual Financial Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Custom Incident Management") && (
                        <div style={{ display: selectedRole === "Custom Incident Management" ? "block" : "none", padding: '24px 4%' }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <IncidentManagement selectedRole="Custom Incident Management" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Payroll Analysis") && (
                        <div style={{ display: selectedRole === "Payroll Analysis" ? "block" : "none" }}>
                          {/* <CustomReporting selectedRole="Custom Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} /> */}
                          <Suspense fallback={<CenteredLoader />}>
                            <TlcNewCustomerReporting user={user} setTlcAskAiPayload={setTlcAskAiPayload} tlcAskAiPayload={tlcAskAiPayload} setTlcAskAiHistoryPayload={setTlcAskAiHistoryPayload} tlcAskAiHistoryPayload={tlcAskAiHistoryPayload} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Clients Profitability") && (
                        <div style={{ display: selectedRole === 'Clients Profitability' ? "block" : "none" }}>
                          {/* <TlcClientProfitability
                      onPrepareAiPayload={(payload) => setTlcClientProfitabilityPayload(payload)}
                      tlcClientProfitabilityPayload={tlcClientProfitabilityPayload}
                      user={user}
                    /> */}
                          <Suspense fallback={<CenteredLoader />}>
                            <TlcNewClientProfitability
                              onPrepareAiPayload={(payload) => setTlcClientProfitabilityPayload(payload)}
                              tlcClientProfitabilityPayload={tlcClientProfitabilityPayload}
                              user={user}
                              setClientProfitabilityAiHistoryPayload={setClientProfitabilityAiHistoryPayload} // ✅ ADD THIS
                              clientProfitabilityAiHistoryPayload={clientProfitabilityAiHistoryPayload} // ✅ ADD THIS
                            />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Smart Onboarding (Staff)") && (
                        <div style={{ display: selectedRole === "Smart Onboarding (Staff)" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            {orgLookupStatus === "not_found" ? (
                              <NoOrgEmptyState
                                user={user}
                                onRegistered={() => fetchOrganizationId(user?.email)}
                              />
                            ) : (
                              <HRAnalysis handleClick={handleClick} selectedRole="Smart Onboarding (Staff)" setShowFeedbackPopup={setShowFeedbackPopup} user={user} setManualResumeZip={setManualResumeZip} setShowAIChat={setShowAIChat}
                                setMessages={setMessages} setHrMode={setHrMode} setHrStep={setHrStep} organizationId={organizationId} onActiveOrgChange={setActiveOrganizationId}
                                onOrgRemoved={() => {
                                  // Org deleted (or backend reports no org) — swap to
                                  // NoOrgEmptyState immediately, no reload needed.
                                  setOrganizationId(null);
                                  setActiveOrganizationId(null);
                                  setOrgLookupStatus("not_found");
                                }} />
                            )}
                          </Suspense>
                        </div>
                      )}
                      {visitedRoles.has("Care Voice") && (
                        <div style={{ display: selectedRole === "Care Voice" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <VoiceModule user={user} isMobileOrTablet={isMobileOrTablet} setCareVoiceFiles={setCareVoiceFiles} setIsCareVoiceGeneratingDocs={setIsCareVoiceGeneratingDocs}
                              setTotalCareVoiceDocsToGenerate={setTotalCareVoiceDocsToGenerate}
                              setGeneratedCareVoiceDocsCount={setGeneratedCareVoiceDocsCount} setCareVoiceSessionId={setCareVoiceSessionId}
                              setCareVoiceUserId={setCareVoiceUserId}
                              setCareVoiceStarted={setCareVoiceStarted}
                              setMessages={setMessages} careVoiceFiles={careVoiceFiles} onReset={resetCareVoiceSession} isCareVoiceGeneratingDocs={isCareVoiceGeneratingDocs} setIsCareVoiceLocked={setIsCareVoiceLocked} onRoleChange={setVoiceRole} onGeneratedDocsScreenChange={setVoiceDocsScreen} />
                          </Suspense>
                        </div>
                      )}
                      {visitedRoles.has("Client Profitability & Service") && (
                        <div style={{ display: selectedRole === "Client Profitability & Service" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <CareServicesEligibility selectedRole="Client Profitability & Service" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Incident Report") && (
                        <div style={{ display: selectedRole === "Incident Report" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <IncidentReport selectedRole="Incident Report" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Quality and Risk Reporting") && (
                        <div style={{ display: selectedRole === "Quality and Risk Reporting" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <QualityandRisk selectedRole="Quality and Risk Reporting" handleClick={handleClick} setShowFeedbackPopup={setShowFeedbackPopup} user={user} />
                          </Suspense>
                        </div>
                      )}

                      {visitedRoles.has("Smart Rostering") && (
                        <div style={{ display: selectedRole === "Smart Rostering" ? "block" : "none" }}>
                          <Suspense fallback={<CenteredLoader />}>
                            <RosteringDashboard user={user} SetIsSmartRosteringHistory={SetIsSmartRosteringHistory} SetIsSmartRosteringDetails={SetIsSmartRosteringDetails} setManualAskAiFile={setManualAskAiFile} />
                          </Suspense>
                        </div>
                      )}
                    </div>

                  )}

                <Modal
                  isVisible={isModalVisible}
                  onClose={handleModalClose}
                />

                <PopupModalLeft
                  isVisible={isModalLeftVisible}
                  onClose={handleLeftModalClose}
                  module={selectedRole}
                />

                {!isSoftwareConnectPage && <div
                  className="ask-ai-button"
                  onClick={() => setShowAIChat(!showAIChat)}
                  onMouseEnter={() => setAskAiBtnHover(true)}
                  onMouseLeave={() => setAskAiBtnHover(false)}
                >
                  <img src={askAiStar} alt="askAiStar" style={{ width: "22px", height: "22px" }} />
                  <div style={{ fontFamily: "Inter", fontSize: "16px", color: "white" }}>Ask AI</div>
                  {isHRAskAiPage && askAiBtnHover && !showAIChat && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 14px)",
                        right: 0,
                        width: "260px",
                        padding: "16px 18px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0 8px 24px rgba(108, 76, 220, 0.18)",
                        border: "1px solid rgba(108, 76, 220, 0.15)",
                        fontFamily: "Inter",
                        textAlign: "center",
                        cursor: "default",
                        zIndex: 1000
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1F1B2E", marginBottom: "4px" }}>
                        <span role="img" aria-label="wave" style={{ marginRight: "6px" }}>👋</span>
                        Hi, I'm Alex,
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#6C4CDC", marginBottom: "8px" }}>
                        Your AI recruitment partner.
                      </div>
                      <div style={{ fontSize: "13px", color: "#555", lineHeight: "18px" }}>
                        If you're unsure or need help, I'm here to assist.
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-7px",
                          right: "30px",
                          width: "14px",
                          height: "14px",
                          backgroundColor: "#FFFFFF",
                          borderRight: "1px solid rgba(108, 76, 220, 0.15)",
                          borderBottom: "1px solid rgba(108, 76, 220, 0.15)",
                          transform: "rotate(45deg)"
                        }}
                      />
                    </div>
                  )}
                  {isCareVoicePage && voiceRole === "Staff" && (askAiBtnHover || askAiAutoShow) && !showAIChat && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 14px)",
                        right: 0,
                        width: "260px",
                        padding: "16px 18px",
                        backgroundColor: "#FFFFFF",
                        borderRadius: "14px",
                        boxShadow: "0 8px 24px rgba(108, 76, 220, 0.18)",
                        border: "1px solid rgba(108, 76, 220, 0.15)",
                        fontFamily: "Inter",
                        textAlign: "center",
                        cursor: "default",
                        zIndex: 1000
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#1F1B2E", marginBottom: "4px" }}>
                        <span role="img" aria-label="wave" style={{ marginRight: "6px" }}>👋</span>
                        Hi, I'm Zoe,
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#6C4CDC", marginBottom: "8px" }}>
                        Your Care Voice assistant.
                      </div>
                      <div style={{ fontSize: "13px", color: "#555", lineHeight: "18px" }}>
                        {askAiAutoShow
                          ? "Your documents are ready — ask me anything about them."
                          : "If you're unsure or need help, I'm here to assist."}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          bottom: "-7px",
                          right: "30px",
                          width: "14px",
                          height: "14px",
                          backgroundColor: "#FFFFFF",
                          borderRight: "1px solid rgba(108, 76, 220, 0.15)",
                          borderBottom: "1px solid rgba(108, 76, 220, 0.15)",
                          transform: "rotate(45deg)"
                        }}
                      />
                    </div>
                  )}
                </div>}

                {showAIChat && (
                  <div className="ask-ai-panel" style={{ position: "fixed", bottom: "20px", right: "21px", width: "76%", height: isSoftwareConnectPage ? "86%" : "80%", backgroundColor: "#FFFEFF", borderRadius: "24px", zIndex: 999, display: "flex", flexDirection: "column", justifyContent: "space-between", border: '1.09px solid #6C4CDC', boxShadow: '0px 4.36px 65.42px 0px #FFFFFF03', padding: ' 14px 30px', marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", borderTopRightRadius: "24px", borderTopLeftRadius: "24px", }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "44px" }}>
                        {isHRAskAiPage && (
                          <label
                            id="askai-mode-toggle-label"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#333",
                              cursor: "pointer"
                            }}
                          >
                            <span>Resume Screening:</span>

                            <input
                              id="askai-mode-checkbox"
                              type="checkbox"
                              checked={hrMode === "resume_screening"}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  openResumeScreening();
                                } else {
                                  setHrMode("general");
                                  setHrStep("IDLE");
                                  setJdFiles([]);
                                  setResumeFiles([]);
                                  setScreenedResults([]);
                                  setSelectedCandidates([]);
                                  setHasResumeRunStarted(false);
                                  setHrScreenedCandidates([]);
                                  resetHrConversation();
                                  setMessages((prev) => prev.filter((m) => !m.isUploadPrompt));
                                }
                              }}
                              style={{
                                width: "18px",
                                height: "18px",
                                accentColor: "#6C4CDC",
                                cursor: "pointer"
                              }}
                            />
                          </label>
                        )}
                        {messages.length > 0 && <div
                          onClick={() => {
                            setMessages([]);
                            setFeedbackState({});
                            setFeedbackMode(null);
                            setHrMode("general");
                            setHrStep("IDLE");
                            setJdFiles([]);
                            setResumeFiles([]);
                            setScreenedResults([]);
                            setSelectedCandidates([]);
                            setHasResumeRunStarted(false);
                            setHrScreenedCandidates([]);
                            resetHrConversation();
                          }}
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
                          {!isSoftwareConnectPage && <img
                            src={newChatBtnNoteIcon}
                            alt="new-chat"
                            style={{
                              width: "14px", height: "14px",
                            }}
                          />}
                          <span
                            style={{
                              color: "#fff",
                              fontSize: "14px",
                              fontWeight: 500,
                              fontFamily: "Inter",
                            }}
                          >
                            {isSoftwareConnectPage ? "View all Platforms" : "New Chat"}
                          </span>
                        </div>}


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
                        <div className="ask-ai-heading-row" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', gap: isSoftwareConnectPage ? '14px' : '20px' }}>
                          <img src={isSoftwareConnectPage ? apiTutorialsIcon : purpleStar} alt='blue-star' style={{ width: isSoftwareConnectPage ? '32px' : '36px', height: 'auto' }} />
                          <div className="ask-ai-heading-text" style={{ textAlign: 'center', fontSize: '24px', fontFamily: 'Inter', fontWeight: '500' }}>
                            {isCareVoicePage
                              ? (careVoiceStarted
                                ? "Ask Any Question Related To Care Voice Document"
                                : "Click Start Session To Unlock AI Assistance")
                              : isSoftwareConnectPage
                                ? "API Connection Tutorials"
                                : "Ask AI"}
                          </div>
                        </div>
                        {isCareVoicePage && !careVoiceStarted && (
                          <div style={{ display: "flex", justifyContent: "center", marginTop: "12px" }}>
                            <button
                              onClick={startCareVoiceSession}
                              disabled={isStartingSession}
                              style={{
                                padding: "10px 20px 10px 20px",
                                background: isStartingSession ? "#C9C4E3" : "#6C4CDC",
                                color: "#fff",
                                borderRadius: "30px",
                                border: "none",
                                cursor: isStartingSession ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontFamily: "Inter",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px"
                              }}
                            >
                              <LuPower size={20} />
                              {isStartingSession ? "Starting..." : "Start Session"}
                            </button>
                          </div>
                        )}
                      </div>
                    }

                    <div ref={messagesContainerRef} style={{ flex: 1, marginTop: "10px", overflowY: "auto", padding: "10px" }}>
                      {messages.map((msg, index) => {
                        const isThisMessageExpanded =
                          Object.entries(expandedSources).some(
                            ([k, v]) => k.startsWith(`${index}_`) && v === true
                          );
                        return (
                          <div
                            key={index}
                            style={{
                              display: "flex",
                              justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                              marginBottom: "8px",
                              position: "relative"
                            }}
                          >
                            <div className="ask-ai-message-wrap" style={{ display: "flex", flexDirection: "column", alignItems: msg.sender === "user" ? "flex-end" : "flex-start", position: "relative", maxWidth: '100%' }}>
                              <div className="ask-ai-message-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', maxWidth: '100%' }}>
                                <div
                                  className="ask-ai-message-col"
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
                                    className={msg.temp ? "askai-sparkle-icon" : ""}
                                    style={{
                                      width: "32px",
                                      height: "32px"
                                    }}
                                  />

                                  {/* 💬 ANSWER / GENERATING RESPONSE */}
                                  <div
                                    style={{
                                      backgroundColor: "#F9F8FF",
                                      padding: "14px",
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
                                    {msg.temp ? (
                                      isHRAskAiPage ? (
                                        <div className="hr-generating-wrap">
                                          <span className="hr-generating-text">
                                            {msg.text || "Generating response"}
                                          </span>
                                          <span className="hr-generating-dots" aria-hidden="true">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="askai-loader">
                                          <span></span>
                                          <span></span>
                                          <span></span>
                                        </div>
                                      )
                                    ) : (
                                      <>
                                        <ReactMarkdown
                                          children={
                                            msg.text.includes("Thanks for submitting feedback")
                                              ? (() => {
                                                const [firstLine, ...rest] = msg.text.split("\n");
                                                return `**${firstLine}**\n${rest.join("\n")}`;
                                              })()
                                              : msg.text
                                          }
                                          remarkPlugins={[remarkGfm]}
                                          rehypePlugins={[rehypeRaw, rehypeHighlight]}
                                        />
                                        {msg.isUploadPrompt && hrStep === "UPLOAD" && (
                                          <div style={{ marginTop: "16px" }}>
                                            <div className="hr-upload-wrap">
                                              <div className="hr-upload-boxes">
                                                <TlcUploadBox
                                                  id="jd-upload"
                                                  title="Upload Job Description"
                                                  subtitle="Upload single JD file"
                                                  files={jdFiles}
                                                  setFiles={setJdFiles}
                                                  accept=".pdf,.doc,.docx,.txt"
                                                  multiple={false}
                                                />

                                                <div style={{ height: "14px" }} />

                                                <TlcUploadBox
                                                  id="resume-upload"
                                                  title="Upload Candidate Resumes"
                                                  subtitle="Upload multiple resume files"
                                                  files={resumeFiles}
                                                  setFiles={setResumeFiles}
                                                  accept=".pdf,.doc,.docx,.txt"
                                                  multiple={true}
                                                />
                                              </div>

                                              {/* <div style={{ display: "flex", gap: "12px", marginTop: "18px" }}>
                                                <button
                                                  className="hr-primary-btn"
                                                  onClick={handleBulkScreening}
                                                  disabled={screeningLoading || jdFiles.length === 0 || resumeFiles.length === 0}
                                                  style={{
                                                    padding: "12px 24px",
                                                    borderRadius: "12px",
                                                    border: "none",
                                                    backgroundColor: (screeningLoading || jdFiles.length === 0 || resumeFiles.length === 0) ? "#CCC" : "#6C4CDC",
                                                    color: "white",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    cursor: (screeningLoading || jdFiles.length === 0 || resumeFiles.length === 0) ? "not-allowed" : "pointer"
                                                  }}
                                                >
                                                  {screeningLoading ? "Processing..." : "Start Screening"}
                                                </button>

                                                <button
                                                  className="hr-secondary-btn"
                                                  onClick={() => {
                                                    setHrStep("IDLE");
                                                    setJdFiles([]);
                                                    setResumeFiles([]);
                                                    setHrMode("general");
                                                    setHrScreenedCandidates([]);
                                                    resetHrConversation();
                                                    setMessages((prev) => prev.filter((m) => !m.isUploadPrompt));
                                                  }}
                                                  style={{
                                                    padding: "12px 24px",
                                                    borderRadius: "12px",
                                                    border: "1px solid #CCC",
                                                    backgroundColor: "white",
                                                    color: "#666",
                                                    fontSize: "14px",
                                                    fontWeight: 500,
                                                    cursor: "pointer"
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </div> */}
                                            </div>
                                          </div>
                                        )}

                                        {/* Show results when showResults is true */}
                                        {msg.showResults && hrStep === "RESULTS" && screenedResults.length > 0 && (
                                          <div style={{ marginTop: "16px" }}>
                                            <div className="hr-results-wrap" style={{
                                              display: "flex",
                                              flexDirection: "column",
                                              maxHeight: "400px",
                                              overflow: "hidden"
                                            }}>
                                              <div style={{
                                                fontSize: "16px",
                                                fontWeight: 600,
                                                marginBottom: "12px",
                                                padding: "10px 12px",
                                                background: "#F9F8FF",
                                                borderRadius: "10px",
                                                border: "1px solid #E8ECEF"
                                              }}>
                                                {screenedResults.length} Candidates Found
                                              </div>

                                              <div style={{
                                                flex: 1,
                                                overflowY: "auto",
                                                maxHeight: "250px",
                                                marginBottom: "12px"
                                              }}>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                                  {screenedResults.map((item, idx) => {
                                                    const isSelected = selectedCandidates.includes(idx);
                                                    return (
                                                      <div
                                                        key={idx}
                                                        onClick={() => {
                                                          setSelectedCandidateForModal({ ...item, index: idx });
                                                          setShowCandidateModal(true);
                                                        }}
                                                        style={{
                                                          border: isSelected ? "1px solid #6C4CDC" : "1px solid #E5E7EB",
                                                          borderRadius: "10px",
                                                          padding: "10px 12px",
                                                          cursor: "pointer",
                                                          background: isSelected ? "#F8F6FF" : "transparent"
                                                        }}
                                                      >
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                                            <div
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleCandidate(idx);
                                                              }}
                                                              style={{
                                                                width: "16px",
                                                                height: "16px",
                                                                borderRadius: "3px",
                                                                backgroundColor: isSelected ? "#6C4CDC" : "#FFF",
                                                                border: isSelected ? "none" : "1.5px solid #CCC",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                cursor: "pointer"
                                                              }}
                                                            >
                                                              {isSelected && (
                                                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                                                  <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                              )}
                                                            </div>
                                                            <div>
                                                              <div style={{ fontSize: "13px", fontWeight: 500 }}>{item.candidate_name || "Unknown"}</div>
                                                              <div style={{ fontSize: "10px", color: "#888" }}>{item.candidate_email || "No email"}</div>
                                                            </div>
                                                          </div>
                                                          <span style={{
                                                            fontSize: "14px",
                                                            fontWeight: 700,
                                                            color: item.candidate_resume_score >= 80 ? "#4FD46E" : item.candidate_resume_score >= 60 ? "#FFB347" : "#FF6B6B"
                                                          }}>
                                                            {item.candidate_resume_score}%
                                                          </span>
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                                                <button
                                                  onClick={handleShortlist}
                                                  disabled={shortlistLoading || selectedCandidates.length === 0}
                                                  style={{
                                                    flex: 1,
                                                    padding: "10px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: (shortlistLoading || selectedCandidates.length === 0) ? "#CCC" : "#6C4CDC",
                                                    color: "white",
                                                    fontSize: "13px",
                                                    fontWeight: 600,
                                                    cursor: (shortlistLoading || selectedCandidates.length === 0) ? "not-allowed" : "pointer"
                                                  }}
                                                >
                                                  {shortlistLoading ? "Shortlisting..." : `Proceed (${selectedCandidates.length} Selected)`}
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setHrStep("IDLE");
                                                    setJdFiles([]);
                                                    setResumeFiles([]);
                                                    setScreenedResults([]);
                                                    setSelectedCandidates([]);
                                                    setMessages((prev) => [
                                                      ...prev,
                                                      { sender: "bot", text: "Returned to general mode." }
                                                    ]);
                                                  }}
                                                  style={{
                                                    padding: "10px 16px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #CCC",
                                                    backgroundColor: "white",
                                                    color: "#666",
                                                    fontSize: "13px",
                                                    cursor: "pointer"
                                                  }}
                                                >
                                                  Back
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {/* {feedbackState[`${selectedRole}_${index}`]?.submitted &&
                                          feedbackState[`${selectedRole}_${index}`]?.text && (
                                            <div
                                              style={{
                                                marginTop: "12px",
                                                padding: "10px 12px",
                                                borderRadius: "10px",
                                                background: "rgb(249, 248, 255);",
                                                border: "1px solid rgb(108, 76, 220)"
                                              }}
                                            >
                                              <div
                                                style={{
                                                  fontSize: "12px",
                                                  fontWeight: 600,
                                                  color: "#6c4cdc",
                                                  marginBottom: "4px"
                                                }}
                                              >
                                                Your Feedback
                                              </div>

                                              <div
                                                style={{
                                                  fontSize: "13px",
                                                  color: "#323232",
                                                  lineHeight: "18px"
                                                }}
                                              >
                                                {feedbackState[`${selectedRole}_${index}`]?.text}
                                              </div>
                                            </div>
                                          )} */}
                                      </>
                                    )}
                                    {msg.sender === "bot" && msg.sources?.length > 0 && (
                                      <div style={{ marginTop: "12px" }}>
                                        <div
                                          style={{
                                            width: "100%",
                                            height: "1px",
                                            background: "#E5E7EB",
                                            marginBottom: "10px"
                                          }}
                                        />
                                        <div style={{
                                          fontSize: "13px",
                                          fontWeight: 600,
                                          marginBottom: "8px",
                                          color: "#555"
                                        }}>
                                          SOURCE DOCUMENTS({Math.min(msg.sources.length, 5)})
                                        </div>

                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: isThisMessageExpanded ? "column" : "row",
                                            gap: "10px",
                                            overflowX: isThisMessageExpanded ? "hidden" : "auto"
                                          }}
                                        >
                                          {msg.sources.slice(0, 5).map((src, i) => {
                                            const isOpen = expandedSources[`${index}_${i}`];
                                            return (
                                              <div
                                                key={`${src.document_name}-${i}`}
                                                onClick={() => {
                                                  const key = `${index}_${i}`;

                                                  setExpandedSources(prev => {
                                                    const updated = { ...prev };

                                                    if (updated[key]) {
                                                      delete updated[key];
                                                    } else {
                                                      updated[key] = true;
                                                    }

                                                    return updated;
                                                  });
                                                }}


                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.background = "#e4dff0";
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.background = "transparent";
                                                }}

                                                style={{
                                                  minWidth: isThisMessageExpanded ? "100%" : "200px",
                                                  maxWidth: isThisMessageExpanded ? "100%" : "200px",
                                                  flexShrink: 0,
                                                  border: isOpen ? "1px solid #6C4CDC" : "1px solid #E5E7EB",
                                                  borderRadius: isThisMessageExpanded ? "14px" : "8px",
                                                  padding: "12px 14px",
                                                  cursor: "pointer",
                                                  background: "transparent",
                                                  transition: "all 0.2s ease",
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  justifyContent: "center",
                                                  alignItems: "flex-start",
                                                  height: isThisMessageExpanded ? "auto" : "48px",
                                                }}
                                              >

                                                {/* HEADER */}
                                                <div
                                                  style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "center",
                                                    width: "100%"
                                                  }}
                                                >

                                                  {/* LEFT SIDE */}
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: "6px",
                                                      overflow: "hidden"
                                                    }}
                                                  >
                                                    <FiFileText size={18} color="#6C4CDC" />

                                                    <span
                                                      style={{
                                                        fontSize: "13px",
                                                        fontWeight: 500,
                                                        color: "#6C4CDC",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap",
                                                        maxWidth: "120px"
                                                      }}
                                                    >
                                                      {src.document_name.length > 20
                                                        ? src.document_name.slice(0, 20) + "..."
                                                        : src.document_name}
                                                    </span>
                                                  </div>

                                                  {/* RIGHT SIDE */}
                                                  <div
                                                    style={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      gap: "6px",
                                                      color: "#6C4CDC",
                                                      fontSize: "14px",
                                                      fontWeight: 500
                                                    }}
                                                  >
                                                    {i + 1}

                                                    {isOpen ? (
                                                      <IoChevronDown size={14} />
                                                    ) : (
                                                      <IoChevronForward size={14} />
                                                    )}
                                                  </div>

                                                </div>

                                                {/* EXPANDED */}
                                                {isOpen && (
                                                  <div
                                                    style={{
                                                      marginTop: "10px",
                                                      fontSize: "13px",
                                                      color: "#555",
                                                      lineHeight: "18px",
                                                      whiteSpace: "pre-wrap"
                                                    }}
                                                  >
                                                    {src.chunk_text || src.text || "No preview available"}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {/* 👇 ADD THIS BLOCK RIGHT HERE */}
                                    {msg.sender === "bot" && msg.richContent?.length > 0 && (
                                      <div style={{ marginTop: "10px" }}>
                                        {msg.richContent.map((item, i) => {

                                          if (item.type === "info") {
                                            return (
                                              <div key={i} style={{ marginBottom: "10px" }}>
                                                <div style={{ fontWeight: 600 }}>{item.title}</div>
                                                <div style={{ fontSize: "13px", color: "#555" }}>
                                                  {item.subtitle}
                                                </div>
                                              </div>
                                            );
                                          }

                                          if (item.type === "image") {
                                            const fileIdMatch = item.rawUrl?.match(/id=([^&]+)/);
                                            const fileId = fileIdMatch ? fileIdMatch[1] : null;

                                            if (!fileId) return null;

                                            const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

                                            return (
                                              <iframe
                                                key={i}
                                                src={previewUrl}
                                                width="100%"
                                                height="220"
                                                style={{
                                                  border: "none",
                                                  borderRadius: "10px",
                                                  marginBottom: "10px"
                                                }}
                                                allow="autoplay"
                                                title="Drive Preview"
                                              />
                                            );
                                          }

                                          if (item.type === "button") {
                                            const isAssistanceButton =
                                              typeof item.text === "string" &&
                                              item.text.toLowerCase().includes("need assistance");

                                            return (
                                              <button
                                                key={i}
                                                onClick={() => {
                                                  if (isAssistanceButton) {
                                                    setMessages(prev => [
                                                      ...prev,
                                                      { sender: "user", text: item.text }
                                                    ]);
                                                    setShowSupportFormInChat(true);
                                                    return;
                                                  }

                                                  if (item.event?.name) {
                                                    setMessages(prev => [
                                                      ...prev,
                                                      { sender: "user", text: item.text }
                                                    ]);

                                                    handleSend(null, item.event.name);
                                                  }

                                                  if (item.link) {
                                                    window.open(item.link, "_blank");
                                                  }
                                                }}
                                                style={{
                                                  padding: "10px 14px",
                                                  margin: "5px",
                                                  borderRadius: "8px",
                                                  border: "1px solid #6C4CDC",
                                                  background: "#F9F8FF",
                                                  cursor: "pointer"
                                                }}
                                              >
                                                {item.text}
                                              </button>
                                            );
                                          }

                                          return null;
                                        })}
                                      </div>
                                    )}
                                  </div>
                                  {msg.sender === "bot" && !msg.temp && !msg.isFeedbackResponse && (
                                    <div style={{ width: "100%" }}>

                                      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginRight: "10px" }}>

                                        {
                                          feedbackState[`${selectedRole}_${index}`]?.type === "up" ? (
                                            <BiSolidLike
                                              size={24}
                                              style={{ cursor: "pointer", color: "#4FD46E" }}
                                              onClick={() => {
                                                const key = `${selectedRole}_${index}`;
                                                if (feedbackState[key]?.submitted) return;
                                                handleFeedbackClick(index, "up");
                                                submitFeedback(index, msg.text, "up");
                                              }}
                                            />
                                          ) : (
                                            <BiLike
                                              size={24}
                                              style={{
                                                cursor: feedbackState[`${selectedRole}_${index}`]?.submitted ? "not-allowed" : "pointer",
                                                opacity: feedbackState[`${selectedRole}_${index}`]?.submitted ? 0.5 : 1,
                                                color: "#999"
                                              }}
                                              onClick={() => {
                                                const key = `${selectedRole}_${index}`;
                                                if (feedbackState[key]?.submitted) return;
                                                handleFeedbackClick(index, "up");
                                                submitFeedback(index, msg.text, "up");
                                              }}
                                            />
                                          )
                                        }

                                        {
                                          feedbackState[`${selectedRole}_${index}`]?.type === "down" ? (
                                            <BiSolidDislike
                                              size={24}
                                              style={{ cursor: "pointer", color: "#C6685F" }}
                                              onClick={() => {
                                                const key = `${selectedRole}_${index}`;
                                                if (feedbackState[key]?.submitted) return;

                                                // toggle OFF
                                                if (feedbackMode && feedbackMode.index === index) {
                                                  setFeedbackMode(null);
                                                  setFeedbackState((prev) => ({
                                                    ...prev,
                                                    [key]: { ...prev[key], type: null }
                                                  }));
                                                  return;
                                                }

                                                // toggle ON
                                                setFeedbackState((prev) => ({
                                                  ...prev,
                                                  [key]: { ...prev[key], type: "down" }
                                                }));

                                                setFeedbackMode({
                                                  index,
                                                  message: msg.text
                                                });

                                                setTimeout(() => {
                                                  textareaRef.current?.focus();
                                                }, 100);
                                              }}
                                            />
                                          ) : (
                                            <BiDislike
                                              size={24}
                                              style={{
                                                cursor: feedbackState[`${selectedRole}_${index}`]?.submitted ? "not-allowed" : "pointer",
                                                opacity: feedbackState[`${selectedRole}_${index}`]?.submitted ? 0.5 : 1,
                                                color: "#999"
                                              }}
                                              onClick={() => {
                                                const key = `${selectedRole}_${index}`;
                                                if (feedbackState[key]?.submitted) return;

                                                setFeedbackState((prev) => ({
                                                  ...prev,
                                                  [key]: { ...prev[key], type: "down" }
                                                }));

                                                setFeedbackMode({
                                                  index,
                                                  message: msg.text
                                                });

                                                setTimeout(() => {
                                                  textareaRef.current?.focus();
                                                }, 100);
                                              }}
                                            />
                                          )
                                        }
                                      </div>

                                      {/* 👇 MESSAGE BELOW THUMBS (ONLY ON DISLIKE) */}
                                      {feedbackMode && feedbackMode.index === index && (
                                        <div
                                          style={{
                                            marginTop: "6px",
                                            fontSize: "13px",
                                            fontWeight: 500,
                                            color: "#3C3B42",
                                            fontFamily: "Inter",
                                            textAlign: "end"
                                          }}
                                        >
                                          Please submit your feedback below 👇 Or press icon again to discard
                                        </div>
                                      )}

                                    </div>
                                  )}
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
                        )
                      })}
                    </div>
                    <div>
                      {hrStep !== "RESULTS" && messages.length === 0 &&
                        <div>
                          {Suggestions.length !== 0 &&
                            <div style={{ textAlign: 'left', marginBottom: '9px', fontSize: '14px', fontWeight: '500', fontFamily: 'Inter' }}>
                              {isSoftwareConnectPage ? "Select your platform" : "Predefined Prompts"}
                            </div>
                          }
                          <div
                            style={{
                              width: "60%",
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
                                  onClick={() => {
                                    if (typeof q === "string") {
                                      // normal modules (TLC, Smart Rostering etc.)
                                      handleSend(q);
                                    } else {
                                      // SoftwareConnect module
                                      setMessages(prev => [...prev, { sender: "user", text: q.label }]);
                                      handleSend(null, q.event);
                                    }
                                  }}
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
                                  {typeof q === "string" ? q : q.label}
                                </button>
                              ))}
                            </div>
                          </div>


                        </div>
                      }

                      {(!isCareVoicePage || careVoiceStarted) && <div style={{ marginTop: "10px", marginBottom: "18px", width: "100%", display: "flex", flexDirection: "column", alignSelf: "center" }}>
                        {isHRAskAiPage && hrMode === "general" && askAiAttachedFiles.length > 0 && (
                          <div
                            className="askai-attached-strip"
                            style={{
                              display: "flex",
                              flexWrap: "nowrap",
                              gap: "10px",
                              padding: "12px 14px 0 14px",
                              backgroundColor: "#F0EDF6",
                              borderTopLeftRadius: "14px",
                              borderTopRightRadius: "14px",
                              marginBottom: "-8px",
                              overflowX: "auto",
                              overflowY: "hidden",
                              scrollbarWidth: "thin",
                              scrollbarColor: "rgba(108, 76, 220, 0.35) transparent",
                              WebkitOverflowScrolling: "touch"
                            }}
                          >
                            {askAiAttachedFiles.map((file, idx) => {
                              const formatSize = (bytes) => {
                                if (!bytes && bytes !== 0) return "";
                                if (bytes < 1024) return `${bytes} B`;
                                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                              };
                              const ext = (file.name.split(".").pop() || "").toUpperCase();
                              return (
                                <div
                                  key={`${file.name}-${idx}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: "8px 8px 8px 8px",
                                    paddingRight: "32px",
                                    position: "relative",
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid rgba(108, 76, 220, 0.15)",
                                    borderRadius: "12px",
                                    fontSize: "12px",
                                    color: "#1F1B2E",
                                    width: "232px",
                                    flexShrink: 0,
                                    boxShadow: "0 2px 6px rgba(108, 76, 220, 0.10)",
                                    transition: "transform 0.15s ease, box-shadow 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(108, 76, 220, 0.18)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(108, 76, 220, 0.10)";
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "36px",
                                      height: "36px",
                                      borderRadius: "8px",
                                      background: "linear-gradient(135deg, #7B5BE6 0%, #6C4CDC 100%)",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      flexShrink: 0,
                                      color: "#fff"
                                    }}
                                  >
                                    {ext && ext.length <= 4 ? (
                                      <span style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.3px" }}>
                                        {ext}
                                      </span>
                                    ) : (
                                      <FaFileAlt size={14} color="#fff" />
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexDirection: "column",
                                      minWidth: 0,
                                      flex: 1,
                                      gap: "2px"
                                    }}
                                  >
                                    <span
                                      style={{
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        color: "#1F1B2E"
                                      }}
                                      title={file.name}
                                    >
                                      {file.name}
                                    </span>
                                    {file.size != null && (
                                      <span
                                        style={{
                                          fontSize: "11px",
                                          color: "#7A748F",
                                          fontWeight: 500
                                        }}
                                      >
                                        {formatSize(file.size)}
                                      </span>
                                    )}
                                  </div>
                                  <div
                                    onClick={() =>
                                      setAskAiAttachedFiles((prev) =>
                                        prev.filter((_, i) => i !== idx)
                                      )
                                    }
                                    title="Remove file"
                                    style={{
                                      position: "absolute",
                                      top: "6px",
                                      right: "6px",
                                      width: "20px",
                                      height: "20px",
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      cursor: "pointer",
                                      backgroundColor: "#F0EDF6",
                                      flexShrink: 0,
                                      transition: "background-color 0.15s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "#E2DBF5";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "#F0EDF6";
                                    }}
                                  >
                                    <FaTimes size={9} color="#6C4CDC" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ position: "relative", width: "100%", display: "flex" }}>
                          {isHRAskAiPage && hrMode === "general" ? (
                            <>
                              <input
                                type="file"
                                ref={askAiFileInputRef}
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const files = Array.from(e.target.files || []);
                                  if (files.length > 0) {
                                    setAskAiAttachedFiles((prev) => [...prev, ...files]);
                                  }
                                  e.target.value = "";
                                }}
                              />
                              <div
                                onClick={() => askAiFileInputRef.current?.click()}
                                title="Attach files"
                                style={{
                                  position: "absolute",
                                  left: "20px",
                                  bottom: "17px",
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: "pointer",
                                  border: "1px solid #6C4CDC",
                                  backgroundColor: "#FFFFFF",
                                  zIndex: 2
                                }}
                              >
                                <FaPlus size={14} color="#6C4CDC" />
                              </div>
                            </>
                          ) : (
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
                          )}

                          <textarea
                            rows={1}
                            placeholder={feedbackMode ? "Please submit your feedback here..." : "Ask me anything..."}
                            ref={textareaRef}
                            defaultValue=""
                            onChange={(e) => {
                              inputRef.current = e.target.value;
                              setIsInputEmpty(!e.target.value.trim());
                              // Auto-grow the textarea up to its max-height
                              // (ChatGPT-style). Reset to "auto" first so it can
                              // also shrink when the user deletes content.
                              const el = e.target;
                              el.style.height = "auto";
                              const next = Math.min(el.scrollHeight, 200);
                              el.style.height = next + "px";
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (messages.some((m) => m.temp)) return;
                                handleSend();
                                // Snap back to the default size after sending
                                if (textareaRef.current) {
                                  textareaRef.current.style.height = "66px";
                                }
                                setIsInputEmpty(true);
                              }
                            }}
                            style={{
                              width: "100%",
                              resize: "none",
                              // right padding accounts for the absolute-positioned
                              // mic (right:70 + width:32 = 102) + send button + ~16px gap
                              padding: "22px 120px 16px 63px",
                              borderRadius:
                                isHRAskAiPage && hrMode === "general" && askAiAttachedFiles.length > 0
                                  ? "0 0 14px 14px"
                                  : "14px",
                              border: "none",
                              outline: "none",
                              lineHeight: "22px",
                              backgroundColor: "#F0EDF6",
                              minHeight: "66px",
                              maxHeight: "200px",
                              height: "66px",
                              color: "#000",
                              overflowY: "auto",
                              scrollbarWidth: "none",
                              msOverflowStyle: "none",
                              wordBreak: "break-word",
                              overflowWrap: "anywhere",
                              transition: "height 0.12s ease"
                            }}


                          />
                          {(() => {
                            const isAwaitingResponseForMic = messages.some((m) => m.temp);
                            return (
                              <div
                                onClick={isAwaitingResponseForMic ? undefined : handleMicClick}
                                style={{
                                  position: "absolute",
                                  right: "70px",
                                  bottom: "17px",
                                  width: "32px",
                                  height: "32px",
                                  backgroundColor: isAwaitingResponseForMic
                                    ? "#C9C4E3"
                                    : isListening
                                      ? "#FF4D4F"
                                      : "#6C4CDC",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: isAwaitingResponseForMic ? "not-allowed" : "pointer",
                                  opacity: isAwaitingResponseForMic ? 0.5 : 1,
                                  pointerEvents: isAwaitingResponseForMic ? "none" : "auto",
                                }}
                              >
                                <FaMicrophone size={16} color="#fff" />
                              </div>
                            );
                          })()}
                          {/* <FaCircleArrowRight onClick={handleSend} size={22} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#6C4CDC" }} /> */}
                          {(() => {
                            const isAwaitingResponse = messages.some((m) => m.temp);
                            // Empty prompts are only allowed on the very first
                            // resume-screening pass (when JD + resumes are
                            // attached and the first send hasn't fired yet).
                            // After that, every send must carry a typed prompt.
                            const allowEmptyPromptForResumeScreeningNow =
                              isHRAskAiPage &&
                              hrMode === "resume_screening" &&
                              jdFiles.length > 0 &&
                              resumeFiles.length > 0 &&
                              !hasResumeRunStarted;
                            const allowEmptyPromptForGeneralWithFiles =
                              isHRAskAiPage &&
                              hrMode === "general" &&
                              askAiAttachedFiles.length > 0;
                            const isEmptyAndBlocked =
                              isInputEmpty &&
                              !allowEmptyPromptForResumeScreeningNow &&
                              !allowEmptyPromptForGeneralWithFiles;
                            const isSendDisabled =
                              isSTTActive || isAwaitingResponse || isEmptyAndBlocked;
                            return (
                              <div
                                onClick={() => {
                                  if (isSTTActive || (isCareVoicePage && !careVoiceStarted)) return;
                                  if (isAwaitingResponse) return;
                                  if (isEmptyAndBlocked) return;

                                  handleSend();

                                  if (textareaRef.current) {
                                    textareaRef.current.value = "";
                                    // Snap the auto-grown textarea back to its default height
                                    textareaRef.current.style.height = "66px";
                                  }

                                  inputRef.current = "";
                                  setIsInputEmpty(true);
                                }}
                                style={{
                                  position: "absolute",
                                  right: "32px",
                                  bottom: "17px",
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "10px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  cursor: isAwaitingResponse
                                    ? "default"
                                    : isSendDisabled
                                      ? "not-allowed"
                                      : "pointer",
                                  backgroundColor: isAwaitingResponse
                                    ? "#6C4CDC"
                                    : isSendDisabled
                                      ? "#C9C4E3"
                                      : "#6C4CDC",
                                  opacity: isAwaitingResponse ? 1 : isSendDisabled ? 0.5 : 1,
                                  pointerEvents: isSendDisabled ? "none" : "auto"
                                }}
                              >
                                {isAwaitingResponse ? (
                                  <FaStop size={12} color="#fff" />
                                ) : (
                                  <img
                                    src={askAiSendBtn}
                                    alt="send"
                                    style={{
                                      width: "16px",
                                      height: "16px",
                                      pointerEvents: "none",
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })()}

                        </div>
                      </div>}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </>
      }

      {
        showTrialPopup && (
          <TrialStartedPopup
            trialEnd={formattedTrialEnd}
            onClose={() => {
              setShowTrialPopup(false);
            }}
          />
        )
      }
      {
        showAutoPaymentPopup && !blockedAutoTopupDomains.includes(userDomain) && (
          <AutoPaymentPopup
            userEmail={user?.email}
            onClose={() => {
              // Remember the user dismissed this episode so the proactive
              // useEffect doesn't immediately re-open it while balance is
              // still below the threshold. The ref auto-resets when
              // balance climbs back up.
              autoTopupDismissedRef.current = true;
              setShowAutoPaymentPopup(false);
            }}
          />
        )
      }
      {
        showPlansBillingModal && (
          <PlansAndBillings
            onClose={() => setShowPlansBillingModal(false)}
            email={user?.email}
            firstName={user?.displayName}
            setSubscriptionInfo={setSubscriptionInfo}
            subscriptionInfo={subscriptionInfo}
          />
        )
      }
      {showSupportFormInChat && (
        <SupportModal
          user={user}
          firstName={user?.displayName}
          onClose={() => setShowSupportFormInChat(false)}
          onSubmitted={() => {
            setMessages(prev => [
              ...prev,
              {
                sender: "bot",
                text: "Thanks for reaching out! Your support request has been submitted. We'll get back to you as soon as possible."
              }
            ]);
          }}
        />
      )}
      {showSourceModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 2000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
          }}
          onClick={() => setShowSourceModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "20px",
              width: "400px",
              maxHeight: "60vh",
              overflowY: "auto",
              position: "relative" // ✅ IMPORTANT
            }}
          >
            {/* ❌ CROSS BUTTON */}
            <div
              onClick={() => setShowSourceModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: "bold",
                color: "#666"
              }}
            >
              ✕
            </div>

            {/* TITLE */}
            <div style={{ fontWeight: 600, marginBottom: "12px" }}>
              Sources
            </div>

            {/* SOURCES LIST */}
            {selectedSources.map((src, index) => (
              <div
                key={index}
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #eee",
                  fontSize: "14px"
                }}
              >
                📄 {src.document_name}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Candidate Detail Modal - Styled like expanded source */}
      {showCandidateModal && selectedCandidateForModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowCandidateModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#FFF",
              borderRadius: "14px",
              width: "90%",
              maxWidth: "650px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid #E8ECEF"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid #E8ECEF",
                backgroundColor: "#F9F8FF",
                borderRadius: "14px 14px 0 0"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <FiFileText size={20} color="#6C4CDC" />
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
                  Candidate Details
                </h2>
              </div>
              <button
                onClick={() => setShowCandidateModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#999",
                  padding: "0 6px",
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                scrollbarWidth: "thin"
              }}
            >
              {/* Score Section */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  padding: "16px",
                  background: "#F9F8FF",
                  borderRadius: "12px",
                  border: "1px solid #E8ECEF"
                }}
              >
                <div>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px", fontWeight: 500 }}>
                    Match Score
                  </div>
                  <div
                    style={{
                      fontSize: "42px",
                      fontWeight: 700,
                      color: selectedCandidateForModal.candidate_resume_score >= 80 ? "#4FD46E" :
                        selectedCandidateForModal.candidate_resume_score >= 60 ? "#FFB347" : "#FF6B6B"
                    }}
                  >
                    {selectedCandidateForModal.candidate_resume_score}%
                  </div>
                </div>
                <div
                  style={{
                    width: "70px",
                    height: "70px",
                    borderRadius: "35px",
                    background: "#E8ECEF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px"
                  }}
                >
                  📄
                </div>
              </div>

              {/* Basic Info */}
              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#333" }}>
                  Basic Information
                </h3>
                <div style={{ padding: "12px", background: "#F5F5F5", borderRadius: "10px" }}>
                  <p style={{ marginBottom: "6px", fontSize: "13px" }}>
                    <strong>Name:</strong> {selectedCandidateForModal.candidate_name || "N/A"}
                  </p>
                  <p style={{ marginBottom: "6px", fontSize: "13px" }}>
                    <strong>Email:</strong> {selectedCandidateForModal.candidate_email || "N/A"}
                  </p>
                  <p style={{ fontSize: "13px" }}>
                    <strong>Resume Score:</strong> {selectedCandidateForModal.candidate_resume_score}%
                  </p>
                </div>
              </div>

              {/* Full Resume Summary */}
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "10px", color: "#333" }}>
                  Resume Summary
                </h3>
                <div
                  style={{
                    padding: "16px",
                    background: "#FAFAFF",
                    borderRadius: "10px",
                    border: "1px solid #E8ECEF",
                    lineHeight: "1.6",
                    fontSize: "13px",
                    color: "#444",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {selectedCandidateForModal.resume_summary || "No summary available"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "14px 20px",
                borderTop: "1px solid #E8ECEF",
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                backgroundColor: "#FFF",
                borderRadius: "0 0 14px 14px"
              }}
            >
              <button
                onClick={() => {
                  toggleCandidate(selectedCandidateForModal.index);
                  setShowCandidateModal(false);
                }}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid #6C4CDC",
                  backgroundColor: selectedCandidates.includes(selectedCandidateForModal.index) ? "#6C4CDC" : "#FFF",
                  color: selectedCandidates.includes(selectedCandidateForModal.index) ? "#FFF" : "#6C4CDC",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "13px"
                }}
              >
                {selectedCandidates.includes(selectedCandidateForModal.index) ? "✓ Selected" : "Select Candidate"}
              </button>
              <button
                onClick={() => setShowCandidateModal(false)}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "1px solid #CCC",
                  backgroundColor: "#FFF",
                  color: "#666",
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: "13px"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;