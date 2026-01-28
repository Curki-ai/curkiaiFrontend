import React, { useState, useEffect } from "react";
import "../../../Styles/SoftwareConnect.css";
import axios from "axios";
import AlayaCare from "../../../Images/Alayacare.png";
import Xero from "../../../Images/Xero.png";
import EmployementHero from "../../../Images/EmploymentHero.png";
import VisualCare from "../../../Images/VisualCare.png";
import QuickBooks from "../../../Images/IntuitQuickBooks.png";
import Myp from "../../../Images/MypTech.png";
import MyOB from "../../../Images/MyOb.png";
import CareVision from "../../../Images/CareVision.png";
import GoogledriveIcon from "../../../Images/GoogleDriveIcon.png";
import SharePointIcon from "../../../Images/SharePointIcon.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SoftwareConnect = (props) => {
  const XERO_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net"; // ✅ your ngrok for testing

  const softwareList = [
    { name: "AlayaCare", logo: AlayaCare },
    { name: "VisualCare", logo: VisualCare },
    { name: "MYP Technologies", logo: Myp },
    { name: "CareVision", logo: CareVision },
    { name: "Xero", logo: Xero },
    { name: "QuickBooks", logo: QuickBooks },
    { name: "MYOB", logo: MyOB },
    { name: "EmploymentHero", logo: EmployementHero },
  ];

  const [clientId, setClientId] = useState("");
  const [secretId, setSecretId] = useState("");
  const [selectedSoftware, setSelectedSoftware] = useState(softwareList[0].name);
  const [isLoading, setIsLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [googleDriveURL, setGoogleDriveURL] = useState("");
  const [sharePointURL, setSharePointURL] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [shareConnected, setShareConnected] = useState(false);
  const [visualCareUser, setVisualCareUser] = useState("");

  // ✅ 1️⃣ Fetch already connected softwares + creds
  useEffect(() => {
    const fetchConnected = async () => {
      if (!props.user?.email) return;

      try {
        const response = await axios.get(
          `https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/getSoftwares`,
          {
            params: { userEmail: props.user.email },
          }
        );

        const data = response.data;
        const integrations = data.integrations || data || [];
        setIntegrations(integrations);

        const current = integrations.find((i) => i.software === selectedSoftware);
        if (current) {
          setClientId(current.client_id || "");
          setSecretId(current.secret_id || "");
          if (selectedSoftware === "VisualCare") {
            setVisualCareUser(current.User || "");
          }
        } else {
          setClientId("");
          setSecretId("");
          setVisualCareUser("");
        }
      } catch (err) {
        console.error("Error fetching connected softwares:", err.message);
      }
    };

    fetchConnected();
  }, [props.user.email, selectedSoftware]);

  // ✅ 2️⃣ Handle software selection
  const handleSelectSoftware = (software) => {
    setSelectedSoftware(software);
    const current = integrations.find((i) => i.software === software);
    setClientId(current?.client_id || "");
    setSecretId(current?.secret_id || "");
    if (software === "VisualCare") {
      setVisualCareUser(current?.User || "");
    } else {
      setVisualCareUser("");
    }
  };

  const handleRegister = async () => {
    if (!selectedSoftware) {
      toast.warn("⚠️ Please select a software");
      return;
    }

    if (!clientId.trim() || !secretId.trim()) {
      toast.warn("⚠️ Please enter both Client ID and Secret ID");
      return;
    }

    setIsLoading(true);

    try {
      const isConnected = integrations.some((i) => i.software === selectedSoftware);
      // console.log("selected software", selectedSoftware);

      // 🟦 CASE 1: Xero integration (handled via your ngrok backend)
      if (selectedSoftware === "Xero") {
        const payload = {
          client_id: clientId,
          secret_id: secretId,
          userEmail: props.user.email,
          status: isConnected ? "deregister" : "register",
        };

        // console.log("payload in selected software Xero", payload);

        const response = await axios.post(`${XERO_URL}/xero/connect`, payload);
        const data = response.data;

        if (isConnected) {
          // 🔴 Deregister Xero
          setIntegrations((prev) => prev.filter((i) => i.software !== "Xero"));
          setClientId("");
          setSecretId("");
          toast.success("Xero disconnected successfully!");
        } else {
          // 🟢 Register Xero and redirect to OAuth
          toast.info("Redirecting to Xero for authorization...");
          window.location.href = data.redirectUrl;
        }

        setIsLoading(false);
        return; // ✅ Exit early to avoid hitting non-Xero API
      }

      // 🟩 CASE 2: Any software other than Xero
      if (selectedSoftware !== "Xero") {
        const payload = {
          software: selectedSoftware,
          userEmail: props.user.email,
          client_id: clientId,
          secret_id: secretId,
          status: isConnected ? "deregister" : "register",
          ...(selectedSoftware === "VisualCare" ? { User: visualCareUser } : {}),
        };

        // console.log("selected software in non Xero", payload);

        const response = await axios.post(
          "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/integrationCredsCheck",
          payload
        );

        const data = response.data;

        if (isConnected) {
          // 🔴 Deregister
          setIntegrations((prev) => prev.filter((i) => i.software !== selectedSoftware));
          setClientId("");
          setSecretId("");
          if (selectedSoftware === "VisualCare") setVisualCareUser("");

          toast.success(`${selectedSoftware} disconnected successfully!`);
        } else {
          // 🟢 Register
          setIntegrations((prev) => [
            ...prev,
            {
              software: selectedSoftware,
              client_id: clientId,
              secret_id: secretId,
              ...(selectedSoftware === "VisualCare" ? { User: visualCareUser } : {}),
            },
          ]);

          toast.success(`${selectedSoftware} connected successfully!`);
        }
      }
    } catch (err) {
      console.error("❌ Error in handleRegister:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ 4️⃣ Auto-refresh Xero token every 30 mins
  useEffect(() => {
    const isXeroConnected = integrations.some((i) => i.software === "Xero");
    if (!props.user?.email || !isXeroConnected) return;

    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${XERO_URL}/xero/refreshToken`, {
          params: { userEmail: props.user.email },
        });

        // console.log("data in refresh token", response.data);

        if (response.status === 200) {
          console.log("Xero token refreshed");
        } else {
          console.warn("⚠️ Failed to refresh Xero token:", response.data.error);
        }
      } catch (err) {
        console.error("❌ Error refreshing Xero token:", err.message);
      }
    }, 1800 * 1000); // every 30 mins

    return () => clearInterval(interval);
  }, [props.user?.email, integrations]);

  const isConnected = integrations.some((i) => i.software === selectedSoftware);

  return (
    <div className="software-connect-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Software Grid */}
      <div className="software-grid">
        {softwareList.map((software, index) => (
          <div
            key={index}
            className={`software-card ${selectedSoftware === software.name ? "active" : ""}`}
            onClick={() => handleSelectSoftware(software.name)}
          >
            <img
              src={software.logo}
              alt={software.name}
              className={`software-logo ${software.name === "EmploymentHero"
                ? "employment-hero-logo"
                : software.name === "QuickBooks"
                  ? "quickbooks-logo"
                  : software.name === "Xero"
                    ? "xero-logo"
                    : software.name === "MYOB"
                      ? "myob-logo"
                      : ""
                }`}
            />
            {integrations.some((i) => i.software === software.name) && (
              <div className="connected-badge">Connected</div>
            )}
          </div>
        ))}
      </div>

      {/* Input Fields + Button */}
      <div className="software-form">
        {selectedSoftware === "VisualCare" && (
          <div className="forms-group">
            <label className="connect-label">User ID</label>
            <input
              type="text"
              value={visualCareUser}
              onChange={(e) => setVisualCareUser(e.target.value)}
              placeholder="Enter User Value"
              className="connect-input"
            />
          </div>
        )}
        <div className="forms-group">
          <label className="connect-label">Client ID</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Enter Client ID"
            className="connect-input"
          />
        </div>
        <div className="forms-group">
          <label className="connect-label">Secret ID</label>
          <input
            type="text"
            value={secretId}
            onChange={(e) => setSecretId(e.target.value)}
            placeholder="Enter Secret ID"
            className="connect-input"
          />
        </div>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div className="spinners"></div>
          </div>
        ) : (
          <button
            className={`connect-system-btn ${isConnected ? "disconnect-btn" : ""}`}
            disabled={isLoading}
            onClick={handleRegister}
          >
            {isConnected ? "Disconnect" : "Register"}
          </button>
        )}
      </div>

      {/* Google Drive + SharePoint rows */}
      <div className="integration-row">
        <img src={GoogledriveIcon} alt="Google Drive" className="integration-icon" />
        <input
          type="text"
          value={googleDriveURL}
          onChange={(e) => setGoogleDriveURL(e.target.value)}
          placeholder="Enter Google Drive URL"
          className="integration-input"
        />
        <button className={`connect-url-btn ${googleConnected ? "disconnect-btn" : ""}`}>
          Connect
        </button>
      </div>

      <div className="integration-row">
        <img src={SharePointIcon} alt="SharePoint" className="integration-icon" />
        <input
          type="text"
          value={sharePointURL}
          onChange={(e) => setSharePointURL(e.target.value)}
          placeholder="Enter SharePoint URL"
          className="integration-input"
        />
        <button className={`connect-url-btn ${shareConnected ? "disconnect-btn" : ""}`}>
          Connect
        </button>
      </div>
    </div>
  );
};

export default SoftwareConnect;
