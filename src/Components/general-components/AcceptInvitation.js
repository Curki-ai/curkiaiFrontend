import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import curkiLogo from "../../Images/Black_logo.png";

const InvitePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [inviteDetails, setInviteDetails] = useState(null);
  const [message, setMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const BASE_URL =
    "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/teamMembers";

  /* =============================
     Fetch Invite Details
  ============================== */
  useEffect(() => {
    const fetchInviteDetails = async () => {
      if (!token) {
        setInitialLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE_URL}/details/${token}`);
        const data = await res.json();
        console.log("data",data)
        if (res.ok) {
          setInviteDetails(data);
        } else {
          setStatusType("error");
          setMessage(data.message || "Invalid invite link");
        }
      } catch {
        setStatusType("error");
        setMessage("Something went wrong.");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInviteDetails();
  }, [token]);

  /* =============================
     Accept Invite
  ============================== */
  const handleAccept = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/accept/${token}`);
      const data = await res.json();

      if (res.ok) {
        setStatusType("success");
        setMessage("Invitation accepted successfully. Redirecting...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        setStatusType("error");
        setMessage(data.message);
      }
    } catch {
      setStatusType("error");
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     Reject Invite
  ============================== */
  const handleReject = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/reject/${token}`);
      const data = await res.json();

      if (res.ok) {
        setStatusType("success");
        setMessage("Invitation rejected successfully.");
      } else {
        setStatusType("error");
        setMessage(data.message);
      }
    } catch {
      setStatusType("error");
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  /* =============================
     Invalid Token
  ============================== */
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f3f4f6",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "50px",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
            textAlign: "center",
            maxWidth: "450px",
          }}
        >
          <h2>Invalid Invitation</h2>
          <p style={{ color: "#dc2626" }}>
            This invitation link is invalid or expired.
          </p>
        </div>
      </div>
    );
  }

  /* =============================
     Main UI
  ============================== */
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          padding: "60px 40px",
          borderRadius: "18px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}
      >
        {/* Logo */}
        <img
          src={curkiLogo}
          alt="Curki AI Logo"
          style={{
            width: "160px",
            marginBottom: "28px",
          }}
        />

        {initialLoading ? (
          <p>Loading invitation...</p>
        ) : message ? (
          <div
            style={{
              padding: "16px",
              borderRadius: "10px",
              fontSize: "14px",
              background:
                statusType === "success" ? "#ecfdf5" : "#fef2f2",
              color:
                statusType === "success" ? "#065f46" : "#991b1b",
            }}
          >
            {message}
          </div>
        ) : inviteDetails && (
          <>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 600,
                marginBottom: "14px",
              }}
            >
              Team Invitation
            </h2>

            <p
              style={{
                fontSize: "15px",
                color: "#4b5563",
                marginBottom: "28px",
                lineHeight: "1.6",
              }}
            >
              <strong>{inviteDetails.invitedByName}</strong> invited you to join{" "}
              <strong>Curki.ai</strong> as{" "}
              <strong>{inviteDetails.role}</strong>.
            </p>

            <div
              style={{
                display: "flex",
                gap: "14px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={handleAccept}
                disabled={loading}
                style={{
                  background: "#6C4CDC",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontWeight: 500,
                }}
              >
                {loading ? "Processing..." : "Accept"}
              </button>

              <button
                onClick={handleReject}
                disabled={loading}
                style={{
                  background: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  fontWeight: 500,
                }}
              >
                Reject
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InvitePage;