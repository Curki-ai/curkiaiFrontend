import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../../Styles/FinancialModule/TlcCustomReporting.css";
import TLCLogo from "../../../../Images/TLCLogo.png";
import UploadTlcIcon from "../../../../Images/UploadTlcIcon.png";
import { FiChevronDown } from "react-icons/fi";
import parse, { domToReact } from "html-react-parser";
import { RiDeleteBin6Line } from "react-icons/ri";
import star from '../../../../Images/star.png';
import AIAnalysisReportViewer from "./TlcAiAnalysisReport";
import incrementAnalysisCount from "./TLcAnalysisCount";

export default function TlcCustomerReporting(props) {
  // -------------------- MULTI TAB SUPPORT --------------------
  const [tabs, setTabs] = useState([
    {
      id: 1,
      name: "Tab 1",
      startDate: null,
      endDate: null,
      selectedState: [],
      selectedDepartment: [],
      selectedRole: [],
      selectedEmploymentType: [],
      fileNames: { payroll: [], people: [], employee: [] },
      stage: "filters",
      analysisData: null,
      error: null,
      currentPage: 1,
      viewingHistory: false,
      showReport: false,
      aiReport: null,
      aiLoading: false,
      loading: false,
      uploading: false,
      progressStage: "idle",
      tlcAskAiPayload: null,
      tlcAskAiHistoryPayload: null,
    },
  ]);
  const [activeTab, setActiveTab] = useState(1);

  const activeTabData = tabs.find((t) => t.id === activeTab);

  const updateTab = (updates) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTab ? { ...t, ...updates } : t))
    );
  };
  useEffect(() => {
    const active = tabs.find((t) => t.id === activeTab);
    if (active) {
      props.setTlcAskAiPayload(active.tlcAskAiPayload || "");
      props.setTlcAskAiHistoryPayload(active.tlcAskAiHistoryPayload || "");
    }
  }, [activeTab, tabs]);
  const handleNewTab = () => {
    const newId = tabs.length ? Math.max(...tabs.map((t) => t.id)) + 1 : 1;
    const newTab = {
      id: newId,
      name: `Tab ${newId}`,
      startDate: null,
      endDate: null,
      selectedState: [],
      selectedDepartment: [],
      selectedRole: [],
      selectedEmploymentType: [],
      fileNames: { payroll: [], people: [], employee: [] },
      stage: "filters",
      analysisData: null,
      error: null,
      currentPage: 1,
      viewingHistory: false,
      showReport: false,
      aiReport: null,
      aiLoading: false,
      loading: false,
      uploading: false,
      progressStage: "idle",
      tlcAskAiPayload: null,
      tlcAskAiHistoryPayload: null,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newId);
  };

  const handleCloseTab = (id) => {
    // console.log("Closing tab:", id);
    const remainingTabs = tabs.filter((t) => t.id !== id);
    setTabs(remainingTabs);
    if (id === activeTab && remainingTabs.length > 0) {
      setActiveTab(remainingTabs[0].id);
    }
  };
  // ------------------------------------------------------------

  // -------------------- BASE STATES --------------------
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isAllowed, setIsAllowed] = useState(null);

  const optionsState = [
    { label: "New South Wales", value: "New South Wales" },
    { label: "Queensland", value: "Queensland" },
    { label: "Victoria", value: "Victoria" },
  ];

  const optionsDepartment = [
    { label: "ACAC", value: "ACAC" },
    { label: "AUGU", value: "AUGU" },
    { label: "AUS Chief Executive Officer", value: "AUS Chief Executive Officer" },
    { label: "Accommodation", value: "Accommodation" },
    { label: "Allied Health", value: "Allied Health" },
    { label: "Behaviour", value: "Behaviour" },
    { label: "Customer Care", value: "Customer Care" },
    { label: "DS - WERR", value: "DS - WERR" },
    { label: "Day Program", value: "Day Program" },
    { label: "Finance", value: "Finance" },
    { label: "Global Chief Executive Officer", value: "Global Chief Executive Officer" },
    { label: "Growth and Marketing", value: "Growth and Marketing" },
    { label: "HUB - Central Coast", value: "HUB - Central Coast" },
    { label: "Hub - Bankstown", value: "Hub - Bankstown" },
    { label: "Inactive", value: "Inactive" },
    { label: "Information Communications and Technology", value: "Information Communications and Technology" },
    { label: "MAC", value: "MAC" },
    { label: "MayeFoodz", value: "MayeFoodz" },
    { label: "NDIS", value: "NDIS" },
    { label: "OT", value: "OT" },
    { label: "Operations", value: "Operations" },
    { label: "PHYSIO", value: "PHYSIO" },
    { label: "PSYCH", value: "PSYCH" },
    { label: "People and Culture", value: "People and Culture" },
    { label: "Quality and Safeguards", value: "Quality and Safeguards" },
    { label: "Scheduling", value: "Scheduling" },
    { label: "Speech", value: "Speech" },
    { label: "Support Coordination", value: "Support Coordination" },
    { label: "Travel", value: "Travel" },
  ];

  const optionsRole = [
    { label: "Admin Assistant", value: "Admin Assistant" },
    { label: "Area Manager", value: "Area Manager" },
    { label: "Behaviour Support Practitioner", value: "Behaviour Support Practitioner" },
    { label: "Business Development Manager", value: "Business Development Manager" },
    { label: "CEO - Australian Operations", value: "CEO - Australian Operations" },
    { label: "Customer Care Coordinator", value: "Customer Care Coordinator" },
    { label: "Customer Care Manager", value: "Customer Care Manager" },
    { label: "Customer Care Specialist", value: "Customer Care Specialist" },
    { label: "Day Program Coordinator", value: "Day Program Coordinator" },
    { label: "Direct Service Coordinator", value: "Direct Service Coordinator" },
    { label: "Direct Services Manager", value: "Direct Services Manager" },
    { label: "Domestic Assistant", value: "Domestic Assistant" },
    { label: "Group Chief Executive Officer", value: "Group Chief Executive Officer" },
    { label: "House Lead", value: "House Lead" },
    { label: "National Business Development Manager", value: "National Business Development Manager" },
    { label: "Physiotherapist", value: "Physiotherapist" },
    { label: "Program Manager", value: "Program Manager" },
    { label: "Quality & Safeguarding Officer", value: "Quality & Safeguarding Officer" },
    { label: "Quality Coordinator", value: "Quality Coordinator" },
    { label: "SIL Intake Coordinator", value: "SIL Intake Coordinator" },
    { label: "Senior Support Coordinator", value: "Senior Support Coordinator" },
    { label: "State Manager", value: "State Manager" },
    { label: "Support Coordinator", value: "Support Coordinator" },
    { label: "Support Coordinator Team Leader", value: "Support Coordinator Team Leader" },
    { label: "Support Worker", value: "Support Worker" },
    { label: "Team Leader", value: "Team Leader" },
  ];

  const optionsType = [
    { label: "Casual", value: "Casual" },
    { label: "Full Time", value: "Full Time" },
    { label: "Part Time", value: "Part Time" },
  ];
  const formatTabDate = (start, end) => {
    if (!start || !end) return null;
    return `${start.toLocaleDateString("en-US")} - ${end.toLocaleDateString("en-US")}`;
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // ✅ Validate file names
    const validFiles = files.filter((file) => {
      const name = file.name.toLowerCase();
      if (type === "payroll" && name.includes("pay journal")) return true;
      if (type === "people" && name.includes("people - team members")) return true;
      if (type === "employee" && name.includes("employeeupdate")) return true;
      return false;
    });

    if (validFiles.length === 0) {
      alert(`⚠️ Invalid file uploaded in ${type.toUpperCase()} section.`)
      e.target.value = "";
      return;
    }

    // ✅ Save both file names and actual file objects
    updateTab({
      fileNames: {
        ...activeTabData.fileNames,
        [type]: validFiles.map((f) => f.name),
      },
      [`${type}Files`]: validFiles, // 🧠 keep File objects
    });

    // console.log(`Selected ${type} files:`, validFiles.map((f) => f.name));

    // Allow reselecting same file
    e.target.value = "";
  };





  const handleAnalyse = async () => {
    if (!activeTabData) return;

    const {
      startDate,
      endDate,
      selectedState,
      selectedDepartment,
      selectedRole,
      selectedEmploymentType,
      fileNames,
    } = activeTabData;

    // ✅ Basic check for date range
    if (!startDate || !endDate) {
      alert("Please select a date range first!");
      return;
    }

    try {
      updateTab({ loading: true, showReport: false });

      updateTab({ stage: "loading", error: null });
      updateTab({ uploading: true, progressStage: "uploading" });
      // console.log("Starting analysis process for tab:", activeTab);

      // -------------------------------
      // STEP 1️: VALIDATE FILE UPLOADS
      // -------------------------------
      const inputs = ["payroll", "people", "employee"].map((type) => ({
        type,
        files: activeTabData[`${type}Files`] || [],
      }));

      const hasAnyFile = inputs.some((set) => set.files.length > 0);

      if (hasAnyFile) {
        lastManualWithFilesRef.current = true;
        console.log("Upload path selected — validating uploaded files...");

        const invalidUploads = [];

        // ✅ Validate each file section
        for (const input of inputs) {
          const { type, files } = input;
          if (!files.length) {
            invalidUploads.push(`❌ Missing file(s) for ${type.toUpperCase()}`);
            continue;
          }

          const invalidFiles = files.filter((file) => {
            const name = file.name.toLowerCase();
            if (type === "payroll" && !name.includes("pay journal")) return true;
            if (type === "people" && !name.includes("people - team members")) return true;
            if (type === "employee" && !name.includes("employeeupdate")) return true;
            return false;
          });

          if (invalidFiles.length > 0) {
            invalidUploads.push(
              `⚠️ Incorrect file(s) in ${type.toUpperCase()} section: ${invalidFiles
                .map((f) => f.name)
                .join(", ")}`
            );
          }
        }


        // ✅ Check if all 3 sections have files
        const allTypesUploaded = inputs.every(
          (input) => input && input.files && input.files.length > 0
        );

        if (invalidUploads.length > 0) {
          updateTab({ loading: false });
          updateTab({ stage: "filters" });

          let message = "⚠️ Please correct the following before analysing:\n\n";
          if (invalidUploads.length > 0)
            message += "\n" + invalidUploads.join("\n");

          alert(message);
          return;
        }

        // If everything is valid, upload first
        console.log("All uploaded files are valid. Uploading before analysis...");
        try {
          updateTab({ uploading: true });
          updateTab({ uploading: true, progressStage: "uploading" });
          const formData = new FormData();
          inputs.forEach((input) => {
            Array.from(input.files).forEach((file) => formData.append("files", file));
          });

          const uploadRes = await fetch(
            "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/upload-latest",
            { method: "POST", body: formData }
          );

          const uploadData = await uploadRes.json();

          if (!uploadRes.ok) {
            throw new Error(uploadData.error || "File upload failed.");
          }

          console.log("Files uploaded successfully before analysis.");
          updateTab({ progressStage: "analysing" });
        } catch (uploadErr) {
          console.error("❌ Upload failed:", uploadErr);
          alert("Some files failed to upload. Continuing with existing data...");
        } finally {
          updateTab({ uploading: false });
        }
      } else {
        lastManualWithFilesRef.current = false;
        updateTab({ progressStage: "analysing" });
        console.log("No files selected. Proceeding with existing database data...");
      }

      // -------------------------------
      // STEP 2️⃣: RUN ANALYSIS API
      // -------------------------------
      const query = new URLSearchParams({
        start: startDate.toISOString().split("T")[0],
        end: endDate.toISOString().split("T")[0],
      });

      if (selectedState.length)
        query.append("state", selectedState.map((s) => s.value).join(","));
      if (selectedDepartment.length)
        query.append("department", selectedDepartment.map((d) => d.value).join(","));
      if (selectedEmploymentType.length)
        query.append("employmentType", selectedEmploymentType.map((e) => e.value).join(","));
      if (selectedRole.length)
        query.append("role", selectedRole.map((r) => r.value).join(","));

      const userEmail = props?.user?.email?.trim()?.toLowerCase();
      // const userEmail = "kris@curki.ai"
      const url = `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/filter?${query.toString()}&${userEmail}`;

      const analyzeRes = await fetch(url);
      const analyzeData = await analyzeRes.json();
      updateTab({ tlcAskAiPayload: analyzeData.payload });
      if (tabs.find(t => t.id === activeTab)) {
        props.setTlcAskAiPayload(analyzeData.payload);
      }

      // 🧩 Handle invalid date range
      if (analyzeData.message && analyzeData.message.includes("Invalid date range")) {
        alert("⚠️ Invalid date range selected. Please choose correct start and end dates.");
        updateTab({ loading: false, uploading: false, stage: "filters" });
        return;
      }

      // 🧩 Handle no data found
      if (analyzeData.analysisResult?.message === "No data found for given filters.") {
        alert("⚠️ No data found for the selected filters. Please adjust your filters and try again.");
        updateTab({ loading: false, uploading: false, stage: "filters" });
        return;
      }
      updateTab({ progressStage: "preparing" });
      if (!analyzeRes.ok || !analyzeData.analysisResult) {
        throw new Error(analyzeData.error || "Analysis failed. No valid response received.");
      }
      updateTab({ progressStage: "preparing" });
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Analysis data received successfully.");
      justRanManualAnalysisRef.current = true;
      updateTab({
        analysisData: { ...analyzeData.analysisResult, payload: analyzeData.payload },
        stage: "overview",
        loading: false,
        uploading: false,
        progressStage: "idle",
      });
      try {
        const userEmail = props?.user?.email?.trim()?.toLowerCase();
        if (userEmail) {
          await incrementAnalysisCount(userEmail, "tlc-report-analysis");
        } else {
          console.warn("⚠️ User email missing — skipping count increment");
        }
      } catch (err) {
        console.error("❌ Failed to increment count:", err.message);
      }
      lastManualWithFilesRef.current = false;
    } catch (err) {
      console.error("❌ Error in handleAnalyse:", err);
      updateTab({ error: err.message, stage: "filters" });
      alert("Something went wrong: " + err.message);
    } finally {
      updateTab({ loading: false, uploading: false });
      updateTab({ loading: false, uploading: false });
      setTimeout(() => updateTab({ progressStage: "idle" }), 800);
    }
  };

  const { startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;
  const hasFiltersFieldChanged = [
    startDate,
    endDate,
    selectedState?.length,
    selectedDepartment?.length,
    selectedRole?.length,
    selectedEmploymentType?.length,
  ].some(Boolean);


  // 🧠 Auto-run analysis logic (final stable version)
  const lastAnalysisKeyRef = useRef("");
  const lastManualWithFilesRef = useRef(false);
  const justRanManualAnalysisRef = useRef(false);

  // 🧩 Reset "isFromHistory" when user edits any filters or date
  useEffect(() => {
    if (!activeTabData) return;

    const { isFromHistory, analysisData, startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;

    // Run only if it's a history-loaded record AND analysis exists
    if (!isFromHistory || !analysisData) return;

    const hasFiltersChanged = [
      startDate,
      endDate,
      selectedState?.length,
      selectedDepartment?.length,
      selectedRole?.length,
      selectedEmploymentType?.length,
    ].some(Boolean);

    // If user modifies any filter/date, allow saving again
    if (hasFiltersChanged) {
      updateTab({ isFromHistory: false });
    }
  }, [
    activeTabData?.startDate,
    activeTabData?.endDate,
    activeTabData?.selectedState,
    activeTabData?.selectedDepartment,
    activeTabData?.selectedRole,
    activeTabData?.selectedEmploymentType,
  ]);
  useEffect(() => {
    const userEmail = props?.user?.email?.trim()?.toLowerCase();

    if (!userEmail) {
      setIsAllowed(false);
      return;
    }

    const allowedDomains = [
      "tenderlovingcaredisability.com.au",
      "tenderlovingcare.com.au",
      "curki.ai",
      "careait.com"
    ];

    const userDomain = userEmail.split("@")[1];

    setIsAllowed(allowedDomains.includes(userDomain));
  }, [props.user]);

  // -------------------- SAVE HANDLER --------------------
  const handleSaveToDatabase = async () => {
    if (!activeTabData) return;

    // ✅ If loaded from history, block saving again
    if (activeTabData.isFromHistory) {
      alert("⚠️ This analysis is already saved in the history list.");
      return;
    }

    const { analysisData, startDate, endDate, selectedState, selectedDepartment, selectedRole, selectedEmploymentType } = activeTabData;

    if (!analysisData) {
      alert("No analysis data found. Please run an analysis first.");
      return;
    }

    const email = props.user.email.trim().toLowerCase();
    if (!email) {
      alert("Email is missing — cannot save data.");
      return;
    }

    setSaving(true);
    try {
      // console.log("📤 Saving analysis data to database for tab:", activeTab);
      // console.log("analysisData", analysisData)
      const enrichedAnalysis = {
        pages: analysisData?.pages,
        scorecard: analysisData?.scorecard,
        filters: {
          start: startDate ? startDate.toISOString().split("T")[0] : null,
          end: endDate ? endDate.toISOString().split("T")[0] : null,
          state: selectedState.map((s) => s.value).join(", "),
          department: selectedDepartment.map((d) => d.value).join(", "),
          role: selectedRole.map((r) => r.value).join(", "),
          employmentType: selectedEmploymentType.map((e) => e.value).join(", "),
        },
      };

      // console.log("enrichedAnalysis", enrichedAnalysis)
      const markdownReport = activeTabData.aiReport || activeTabData.analysisData?.report_md || "";

      // console.log("markdown in save history", markdownReport)
      const response = await fetch(
        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/save",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysisData: enrichedAnalysis,
            email,
            markdown: markdownReport
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        console.error("❌ Failed to save:", result.error);
        alert(`Error: ${result.error || "Failed to save data."}`);
        return;
      }

      console.log("Save response:", result);
      alert("✅ Analysis data saved successfully!");
      // ✅ Optional: Mark as saved to prevent double-save
      updateTab({ isFromHistory: true });
    } catch (err) {
      console.error("❌ Error saving data:", err);
      alert("Something went wrong while saving data.");
    } finally {
      setSaving(false);
    }
  };
  const handleDeleteHistory = async () => {
    if (!selectedHistoryId) return;

    try {
      setDeleting(true);
      const res = await fetch(
        "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/deleteById",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: selectedHistoryId }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete history.");

      // console.log("Deleted successfully:", data);
      setHistoryList((prev) => prev.filter((item) => item.id !== selectedHistoryId));
      setShowDeleteModal(false);
      alert("✅ Deleted successfully!");
    } catch (err) {
      console.error("❌ Error deleting:", err);
      alert("Failed to delete history: " + err.message);
    } finally {
      setDeleting(false);
    }
  };


  // -------------------- HISTORY FETCH --------------------
  useEffect(() => {
    const fetchHistory = async () => {
      const email = props.user?.email?.trim().toLowerCase();
      if (!email) return;
      try {
        setLoadingHistory(true);
        const res = await fetch(`https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/payroll/history?email=${email}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch history");
        setHistoryList(data.data);
      } catch (err) {
        console.error("❌ Error fetching history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [props.user]);

  const handleAiAnalysis = async () => {
    if (!activeTabData?.analysisData) {
      alert("Please run the regular analysis first.");
      return;
    }

    // ✅ Step 1: Retrieve payload from props or analysisData
    const aiPayload =
      props.tlcAskAiPayload ||
      activeTabData.analysisData?.payload ||
      [];

    // console.log("AI Payload ready to send:", aiPayload);

    if (!aiPayload || aiPayload.length === 0) {
      alert("No valid payload available for AI Analysis.");
      return;
    }

    try {
      // ✅ Step 2: Start loading
      updateTab({ aiLoading: true, aiReport: null });

      console.log("Sending full payload to AI Analysis API...");
      const userEmail = props?.user?.email?.trim()?.toLowerCase();
      // const userEmail = "kris@curki.ai"
      if (userEmail === "kris@curki.ai") {
        aiPayload.env = "sandbox";   // exactly payload = { ..., env: "sandbox" }
      }
      console.log("ai payload", aiPayload)
      // ✅ Step 3: Send directly (no re-wrapping or redeclaration)
      const res = await fetch(
        "https://curki-backend-api-container.yellowflower-c21bea82.australiaeast.azurecontainerapps.io/tlc/payroll/ai-analysis-report",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiPayload), // ✅ Send as-is
        }
      );

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "AI Analysis failed");
      }

      // ✅ Step 4: Save report into tab
      updateTab({
        aiReport: data?.report_md,
        showReport: true,
        aiLoading: false,
      });
      try {
        const userEmail = props?.user?.email?.trim()?.toLowerCase();
        if (userEmail) {
          await incrementAnalysisCount(userEmail, "tlc-ai-analysis", data?.ai_analysis_cost);
        }
      } catch (err) {
        console.error("Error incrementing AI analysis count:", err);
      }
    } catch (err) {
      console.error("❌ AI Analysis Error:", err);
      alert("AI Analysis failed: " + err.message);
      updateTab({ aiLoading: false });
    }
  };



  // -------------------- HISTORY CLICK --------------------
  const handleHistoryClick = async (item) => {
    try {

      const res = await fetch(
        `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/getById/${item.id}`
      );
      const data = await res.json();
      updateTab({ tlcAskAiHistoryPayload: data.data.analysisResult });
      if (tabs.find(t => t.id === activeTab)) {
        props.setTlcAskAiHistoryPayload(data.data.analysisResult);
      }


      if (!res.ok) throw new Error(data.error || "Failed to fetch analysis");

      // ✅ Update tab with analysis data
      updateTab({
        analysisData: data.data.analysisResult,
        stage: "overview",
        currentPage: 1,
        isFromHistory: true,
      });

      // ✅ Show markdown report if exists
      if (data.data.reportMarkdown) {
        updateTab({
          aiReport: data.data.reportMarkdown,
          showReport: true,
        });
      } else {
        updateTab({
          aiReport: null,
          showReport: false,
        });
      }

      updateTab({ viewingHistory: true });

    } catch (err) {
      console.error("❌ Error loading analysis:", err);
      alert("Failed to load analysis: " + err.message);
    }
  };


  const formatDateRange = () => {
    if (!activeTabData || !activeTabData.startDate || !activeTabData.endDate) return "Selected Date Range";
    return `${activeTabData.startDate.toLocaleDateString()} - ${activeTabData.endDate.toLocaleDateString()}`;
  };

  // ------------------- CUSTOM MULTISELECT -------------------
  const MultiSelectCustom = ({ options, selected, setSelected, placeholder }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef();

    const toggleOption = (option) => {
      if (selected.some((o) => o.value === option.value)) {
        setSelected(selected.filter((o) => o.value !== option.value));
      } else {
        setSelected([...selected, option]);
      }
    };

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="custom-multiselect" ref={ref}>
        <div
          className="custom-input"
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span style={{ color: selected.length === 0 ? "#ccc" : "#000", fontFamily: 'Inter' }}>
            {selected.length === 0
              ? placeholder
              : selected.length === 1
                ? selected[0].label
                : (
                  <>
                    {selected[0].label}{" "}
                    <span style={{ color: "#6C4CDC", fontSize: "12px", fontFamily: 'Inter' }}>
                      +{selected.length - 1}
                    </span>
                  </>
                )
            }
          </span>
          <FiChevronDown
            style={{
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </div>

        {open && (
          <div className="options-dropdown">
            {options.map((option) => {
              const isSelected = selected.some((o) => o.value === option.value);
              return (
                <div
                  key={option.value}
                  className={`option-item ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleOption(option)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    style={{ marginRight: "8px" }}
                    className="custom-checkbox"
                  />
                  {option.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };



  const renderHtmlFigure = (htmlString) => {
    const parsed = parse(htmlString, {
      replace: (domNode) => (domNode.name === "script" ? null : undefined),
    });

    setTimeout(() => {
      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = htmlString;

        const scripts = tempDiv.getElementsByTagName("script");
        for (let script of scripts) {
          const newScript = document.createElement("script");
          if (script.src) newScript.src = script.src;
          else if (script.textContent) newScript.text = script.textContent;
          document.body.appendChild(newScript);
          document.body.removeChild(newScript);
        }
      } catch (e) {
        console.warn("Script execution error:", e);
      }
    }, 0);

    return parsed;
  };



  // -------------------- TAB BAR --------------------
  const renderTabBar = () => (
    <div className="tab-bar" style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", paddingTop: "16px" }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id); props.setTlcAskAiPayload(tab.tlcAskAiPayload || "");
            props.setTlcAskAiHistoryPayload(tab.tlcAskAiHistoryPayload || "");
          }}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            background: tab.id === activeTab ? "#1f2d3d" : "#f3f4f6",
            color: tab.id === activeTab ? "#fff" : "#000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: tab.id === activeTab ? 600 : 400,
            transition: "all 0.2s ease",
          }}
        >
          {tab.name}
          {tabs.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleCloseTab(tab.id);
              }}
              style={{
                marginLeft: "4px",
                color: tab.id === activeTab ? "#ccc" : "#999",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              ×
            </span>
          )}
        </div>
      ))}
      <button
        onClick={handleNewTab}
        style={{
          background: "#e5e7eb",
          borderRadius: "8px",
          padding: "8px 14px",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "14px",
          transition: "all 0.2s ease",
        }}
      >
        + New Tab
      </button>
    </div>
  );

  if (!activeTabData) return null;

  if (!isAllowed) {
    return (
      <div style={{
        textAlign: "center",
        padding: "120px 20px",
        fontFamily: "Inter, sans-serif",
        color: "#1f2937"
      }}>
        <img
          src={TLCLogo}
          alt="Access Denied"
          style={{ width: "80px", opacity: 0.8, marginBottom: "20px" }}
        />
        <h2 style={{ fontSize: "24px", marginBottom: "12px", color: "#6C4CDC" }}>
          Access Restricted 🚫
        </h2>
        <p style={{ fontSize: "16px", color: "#555" }}>
          Sorry, your account (<strong>{props?.user?.email}</strong>) is not authorized to view this page.
        </p>
      </div>
    );
  }
  return (
    <div className="page-containersss">
      <div className="headerss">
        <div className="left-headerss">
          {activeTabData.analysisData && <img src={TLCLogo} alt="Logo" className="tlclogo" />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="date-text">{formatDateRange()}</div>
              {renderTabBar()}
            </div>
            {!activeTabData.viewingHistory && (
              <button
                className="save-btnss"
                onClick={handleSaveToDatabase}
                disabled={saving}
              >
                {saving ? "Processing..." : "Save to Database"}
              </button>
            )}
          </div>
        </div>

      </div>
      {!activeTabData.viewingHistory && (
        <section className="filters-card">
          <div className="filters-header">Filters</div>
          <div className="filters-grid">
            <div>
              <DatePicker
                selectsRange
                startDate={activeTabData.startDate}
                endDate={activeTabData.endDate}
                onChange={(dates) => {
                  const [start, end] = dates;
                  const formatted = formatTabDate(start, end);
                  updateTab({ startDate: start, endDate: end, name: formatted || `Tab ${activeTab}`, });
                }}
                placeholderText="Select Date Range"
                className="filter-input"
                dateFormat="dd/MM/yy"
              />
            </div>

            <MultiSelectCustom
              options={optionsState}
              selected={activeTabData.selectedState}
              setSelected={(v) => updateTab({ selectedState: v })}
              placeholder="Select State"
            />
            <MultiSelectCustom
              options={optionsDepartment}
              selected={activeTabData.selectedDepartment}
              setSelected={(v) => updateTab({ selectedDepartment: v })}
              placeholder="Select Department"
            />
            <MultiSelectCustom
              options={optionsRole}
              selected={activeTabData.selectedRole}
              setSelected={(v) => updateTab({ selectedRole: v })}
              placeholder="Select Role"
            />
            <MultiSelectCustom
              options={optionsType}
              selected={activeTabData.selectedEmploymentType}
              setSelected={(v) => updateTab({ selectedEmploymentType: v })}
              placeholder="Employment Type"
            />
          </div>
          {activeTabData.analysisData && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleAnalyse}
                disabled={activeTabData.loading || activeTabData.uploading}
                style={{
                  backgroundColor: "#6c4cdc",
                  padding: "10px 30px",
                  textAlign: "center",
                  border: "none",
                  borderRadius: "6px",
                  marginTop: "20px",
                  cursor: "pointer",
                  color: "white",
                  fontWeight: "500",
                  fontSize: "14px",
                  opacity: activeTabData.loading || activeTabData.uploading ? 0.7 : 1,
                }}
              >
                {activeTabData.loading || activeTabData.uploading ? "Processing..." : "Apply Filters"}
              </button>
            </div>
          )}

        </section>
      )}

      {!activeTabData.viewingHistory && activeTabData.stage !== "overview" &&
        (!activeTabData.analysisData ||
          Object.keys(activeTabData.analysisData).length === 0) && (
          <section className="uploads-containers">
            {[
              { key: "payroll", label: "Payroll Data" },
              { key: "people", label: "People and Teams Data" },
              { key: "employee", label: "Employee Update Data" },
            ].map((item) => (
              <div key={item.key} style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    textAlign: "left",
                    fontSize: "12px",
                    fontFamily: "Inter",
                    fontWeight: 500,
                  }}
                >
                  Upload {item.label}
                </div>

                <div
                  className="upload-boxes"
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    if (!e.target.dataset.ignore) {
                      document.getElementById(`file-${activeTab}-${item.key}`).click();
                    }
                  }}
                >
                  <input
                    id={`file-${activeTab}-${item.key}`}
                    type="file"
                    multiple
                    accept=".xlsx, .xls, .csv"
                    data-type={item.key}
                    data-tab={activeTab}
                    onChange={(e) => handleFileChange(e, item.key)}
                    style={{ display: "none" }}
                  />

                  <div className="uploadss-iconss">
                    <img
                      src={UploadTlcIcon}
                      alt="uploadtlcIcon"
                      style={{ height: "48px", width: "48px" }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#444",
                      fontFamily: "Inter",
                    }}
                  >
                    {activeTabData.fileNames[item.key].length === 0 ? (
                      <>
                        Click to upload{" "}
                        <span style={{ color: "#6C4CDC" }}>{item.label}</span>
                        <br />
                        <small>.XLSX, .XLS, .CSV</small>
                      </>
                    ) : (
                      "Uploaded files:"
                    )}
                  </p>

                  <div className="upload-content">
                    <div
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      {activeTabData.fileNames[item.key].map((fileName, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "#DADADA",
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontFamily: "Inter",
                          }}
                          data-ignore="true"
                        >
                          <span title={fileName}>
                            {fileName.length > 30
                              ? fileName.slice(0, 30) + "..."
                              : fileName}
                          </span>
                          <span
                            style={{
                              cursor: "pointer",
                              color: "#6C4CDC",
                              fontWeight: "bold",
                            }}
                            data-ignore="true"
                            onClick={() => {
                              const updatedFiles =
                                activeTabData.fileNames[item.key].filter(
                                  (_, i) => i !== idx
                                );
                              updateTab({
                                fileNames: {
                                  ...activeTabData.fileNames,
                                  [item.key]: updatedFiles,
                                },
                              });
                            }}
                          >
                            ×
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}



      {activeTabData.stage === "loading" && (
        <div className="inline-loader-wrapper">
          <div className="loader"></div>
          <div className="loading-text">
            {activeTabData.progressStage === "uploading" && "📤 Uploading your files..."}
            {activeTabData.progressStage === "analysing" && "🔍 Analysing data..."}
            {activeTabData.progressStage === "preparing" && "📊 Preparing your dashboard..."}
          </div>
        </div>
      )}


      <div className="search-section">
        {activeTabData.stage === "overview" && activeTabData.analysisData && (
          <section className="dashboard">
            {!activeTabData.showReport && <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px', marginTop: '-20px' }}>
              {!activeTabData.viewingHistory && (
                <button
                  className="analyse-btn"
                  style={{ cursor: 'pointer' }}
                  onClick={handleAiAnalysis}
                  disabled={activeTabData.aiLoading}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {activeTabData.aiLoading ? "Analyzing..." : "AI Analysis"}
                    <img src={star} alt='img' style={{ width: '20px', height: '20px' }} />
                  </div>
                </button>
              )
              }
            </div>
            }
            {activeTabData.showReport && (
              <AIAnalysisReportViewer reportText={activeTabData.aiReport} loading={activeTabData.aiLoading} />
            )}

            <h2 className="payroll-section-title">
              {(() => {
                const titles = {
                  1: "Payroll Overview",
                  2: "Detailed Breakdown",
                  3: "Leave & Absences",
                  4: "Payroll Comparison"
                };
                return titles[activeTabData.currentPage] || `Page ${activeTabData.currentPage}`;
              })()}
            </h2>

            {activeTabData.analysisData && (
              <div className="summary-cards">
                {(() => {
                  // ✅ 1️⃣ Try to use the page-specific scorecard
                  const pageKey = `page ${activeTabData.currentPage}`;
                  const pageScorecard = activeTabData.analysisData.pages?.[pageKey]?.scorecard || {};

                  // ✅ 2️⃣ If totals exist (from root scorecard), show them too
                  const totals = activeTabData.analysisData.scorecard?.totals || {};

                  // ✅ Merge both (page first, then totals if page is empty)
                  let displayData = {};

                  if (Object.keys(pageScorecard).length > 0) {
                    // ✅ Page has its own scorecard (e.g., Page 1 or 3)
                    displayData = pageScorecard;
                  }

                  // ✅ 3️⃣ Render all fields dynamically
                  return Object.entries(displayData).map(([label, value], index) => (
                    <div key={index} className="summary-card">
                      <p>{label}</p>
                      <h3>
                        {typeof value === "number"
                          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
                          : value}
                      </h3>
                    </div>
                  ));
                })()}
              </div>
            )}


            <div className="charts-grid">
              {(activeTabData.analysisData.pages?.[`page ${activeTabData.currentPage}`]?.figures || [])
                .filter(
                  (chartHTML) =>
                    !chartHTML.toLowerCase().includes("<table") &&
                    !chartHTML.toLowerCase().includes("employee leave")
                )
                .map((chartHTML, index) => (
                  <div
                    key={`${activeTabData.currentPage}-${index}`}
                    id={`chart-${activeTabData.currentPage}-${index}`}
                  >
                    {renderHtmlFigure(chartHTML)}
                  </div>
                ))}
            </div>

            {/* Page 3 Table */}
            {activeTabData.currentPage === 3 && (() => {
              const tableFigure = (activeTabData.analysisData.pages?.[`page ${activeTabData.currentPage}`]?.figures || []).find(
                (html) =>
                  html.toLowerCase().includes("<table") ||
                  html.toLowerCase().includes("employee leave")
              );
              if (!tableFigure) return null;

              return (
                <div id={`leave-table-${activeTabData.currentPage}`}>
                  {renderHtmlFigure(tableFigure)}
                </div>
              );
            })()}

            {activeTabData.currentPage === 4 && (() => {
              const page4Data = activeTabData.analysisData.pages?.["page 4"];
              if (!page4Data) return null;

              // 1️⃣ If there are figures (charts or visuals)
              const figures = page4Data.figures || [];

              // 2️⃣ If there’s a main table HTML block
              const tableHTML = page4Data.table || "";

              return (
                <div id="page-4-content">
                  {/* Render charts first if available */}
                  {figures.length > 0 && (
                    <div className="charts-grid">
                      {figures.map((chartHTML, index) => (
                        <div key={`page4-chart-${index}`}>
                          {renderHtmlFigure(chartHTML)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render table (main Workforce Summary table) */}
                  {tableHTML && (
                    <div className="table-box" style={{ marginTop: "20px" }}>
                      {renderHtmlFigure(tableHTML)}
                    </div>
                  )}
                </div>
              );
            })()}


            {/* Page 1 Table */}
            {activeTabData.currentPage === 1 && (() => {
              const tableHTML =
                activeTabData.analysisData.table ||
                activeTabData.analysisData.pages?.["page 1"]?.table ||
                "";
              if (!tableHTML) return null;

              return (
                <div className="table-box" id={`table-${activeTabData.currentPage}`}>
                  {renderHtmlFigure(tableHTML)}
                </div>
              );
            })()}

            {/* Navigation Buttons */}
            <div className="nav-buttons">
              {activeTabData.currentPage > 1 && (
                <button
                  className="back-btn"
                  onClick={() => updateTab({ currentPage: 1 })}
                >
                  ← Back to Payroll Overview
                </button>
              )}

              {activeTabData.currentPage === 1 && (
                <button
                  className="next-btn"
                  onClick={() => updateTab({ currentPage: 2 })}
                  style={{
                    marginLeft: "auto",
                    background: "#6C4CDC",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  View Detailed Breakdown →
                </button>
              )}

              {activeTabData.currentPage === 2 && (
                <button
                  className="next-btn"
                  onClick={() => updateTab({ currentPage: 3 })}
                  style={{
                    marginLeft: "auto",
                    background: "#6C4CDC",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  View Leave Summary →
                </button>
              )}
              {activeTabData.currentPage === 3 && (
                <button
                  className="next-btn"
                  onClick={() => updateTab({ currentPage: 4 })}
                  style={{
                    marginLeft: "auto",
                    background: "#6C4CDC",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  Payroll Comparison →
                </button>
              )}
            </div>

          </section>
        )}

        {activeTabData.stage === "filters" && !activeTabData.analysisData && (
          <button className="search-btn" onClick={handleAnalyse} disabled={activeTabData.loading}>
            {activeTabData.loading ? "Processing..." : "Analyse"}
          </button>
        )}
      </div>

      {activeTabData.stage !== "loading" && (
        <section className="history-container">
          <div className="history-title">History</div>

          {loadingHistory ? (
            <p style={{ textAlign: "center", color: "#555" }}>Loading history...</p>
          ) : historyList.length === 0 ? (
            <p style={{ textAlign: "center", color: "#777" }}>No saved history found.</p>
          ) : (
            <>
              {historyList.map((item, index) => {
                const createdAt = new Date(item.createdAt).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                });

                const filters = item.analysisResult?.filters || item?.filters || {};
                const { state, department, role, employmentType, start, end } = filters;

                return (
                  <div
                    key={item.id || index}
                    className="history-card-modern"
                    style={{
                      position: "relative",
                      transition: "transform 0.2s ease, box-shadow 0.3s ease",
                    }}
                  >
                    {/* Delete button (cross icon) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedHistoryId(item.id);
                        setShowDeleteModal(true);
                      }}
                      title="Delete analysis"
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "transparent",
                        border: "none",
                        fontSize: "20px",
                        color: "#6C4CDC",
                        fontWeight: "bold",
                        cursor: "pointer",
                        transition: "transform 0.2s ease, color 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1.0)")}
                    >
                      <RiDeleteBin6Line color='#6c4cdc' size={18} />
                    </button>

                    {/* History card body */}
                    <div onClick={() => handleHistoryClick(item)}>
                      <div className="history-top">
                        <div className="history-date-range">
                          <strong className="label">Date Range:</strong>{" "}
                          <span className="value">
                            {start
                              ? new Date(start).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                              })
                              : "N/A"}{" "}
                            –{" "}
                            {end
                              ? new Date(end).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "2-digit",
                              })
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="saved-on">
                        <span className="saved-label">Saved On:</span>{" "}
                        <span className="saved-value">{createdAt}</span>
                      </div>

                      <div className="history-filters">
                        {state && (
                          <span className="filter-item">
                            <strong>State:</strong> {state}
                          </span>
                        )}
                        {department && (
                          <span className="filter-item">
                            <strong>Department:</strong> {department}
                          </span>
                        )}
                        {role && (
                          <span className="filter-item">
                            <strong>Role:</strong> {role}
                          </span>
                        )}
                        {employmentType && (
                          <span className="filter-item">
                            <strong>Employment Type:</strong> {employmentType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ✅ Delete confirmation modal (moved outside .map) */}
              {showDeleteModal && (
                <div
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(0,0,0,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: "10px",
                      padding: "20px 28px",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      textAlign: "center",
                      animation: "scaleIn 0.25s ease",
                    }}
                  >
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1f2937",
                        marginBottom: "16px",
                      }}
                    >
                      Are you sure you want to delete history?
                    </h4>

                    <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                      <button
                        onClick={() => setShowDeleteModal(false)}
                        style={{
                          background: "#E5E7EB",
                          color: "#111",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 16px",
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        No
                      </button>
                      <button
                        onClick={handleDeleteHistory}
                        disabled={deleting}
                        style={{
                          background: "#6C4CDC",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 16px",
                          fontWeight: 600,
                          cursor: "pointer",
                          opacity: deleting ? 0.7 : 1,
                        }}
                      >
                        {deleting ? "..." : "Yes"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}