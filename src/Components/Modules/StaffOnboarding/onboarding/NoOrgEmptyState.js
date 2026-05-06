import React, { useState } from "react";

// Rendered on the Smart Onboarding (Staff) admin path when the by-email
// lookup confirms the signed-in user has no organizations linked.
// Two paths out:
//   1. Register your organization → POST /api/organizations/register, on
//      success calls onRegistered() which the parent uses to refetch by-email
//      and transition to the normal admin dashboard.
//   2. Ask your admin/owner to invite you → informational only.

const API_BASE =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

const NoOrgEmptyState = ({ user, onRegistered }) => {
  const [showModal, setShowModal] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const email = user?.email || "";

  const handleRegister = async () => {
    const trimmed = orgName.trim();
    if (!trimmed) {
      setError("Organization name is required.");
      return;
    }
    if (!email) {
      setError("Could not detect your email. Please sign in again.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/organizations/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": email,
        },
        body: JSON.stringify({ organizationName: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Registration failed. Please try again.");
        setSubmitting(false);
        return;
      }
      console.log("[NoOrgEmptyState] register success:", data);
      setSubmitting(false);
      setShowModal(false);
      setOrgName("");
      if (typeof onRegistered === "function") onRegistered();
    } catch (e) {
      console.error("[NoOrgEmptyState] register error:", e);
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        padding: "60px 20px",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h2
        style={{
          fontSize: "24px",
          color: "#1F1B2E",
          marginBottom: "8px",
          textAlign: "center",
        }}
      >
        Welcome to Smart Onboarding
      </h2>
      <p
        style={{
          fontSize: "15px",
          color: "#555",
          marginBottom: "36px",
          textAlign: "center",
          maxWidth: "560px",
        }}
      >
        Your account (<strong>{email || "—"}</strong>) is not linked to an
        organization yet. Choose one of the options below to get started.
      </p>

      <div
        style={{
          display: "flex",
          gap: "24px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        {/* Card 1 — Register */}
        <div
          onClick={() => !submitting && setShowModal(true)}
          style={{
            width: "320px",
            padding: "28px 24px",
            borderRadius: "16px",
            border: "1px solid #6C4CDC",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 4px 18px rgba(108, 76, 220, 0.12)",
            cursor: "pointer",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#6C4CDC", marginBottom: "10px" }}>
            Register your organization
          </div>
          <div style={{ fontSize: "14px", color: "#555", lineHeight: "20px", marginBottom: "16px" }}>
            Create a new organization on Curki. You'll be set up as the owner
            and can invite admins or staff afterwards.
          </div>
          <div
            style={{
              display: "inline-block",
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#6C4CDC",
              color: "#FFFFFF",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            Register
          </div>
        </div>

        {/* Card 2 — Ask admin */}
        <div
          style={{
            width: "320px",
            padding: "28px 24px",
            borderRadius: "16px",
            border: "1px solid #E5E5EA",
            backgroundColor: "#FAFAFB",
          }}
        >
          <div style={{ fontSize: "18px", fontWeight: 600, color: "#1F1B2E", marginBottom: "10px" }}>
            Ask your admin or owner to invite you
          </div>
          <div style={{ fontSize: "14px", color: "#555", lineHeight: "20px" }}>
            If your organization is already on Curki, ask an existing owner or
            admin to add your email (<strong>{email || "—"}</strong>) to the
            organization's admin list. Once added, sign out and back in to see
            the dashboard.
          </div>
        </div>
      </div>

      {/* Register modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(31, 27, 46, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            style={{
              width: "440px",
              maxWidth: "90vw",
              backgroundColor: "#FFFFFF",
              borderRadius: "18px",
              padding: "28px 28px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
              fontFamily: "Inter, sans-serif",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#1F1B2E", marginBottom: "6px" }}>
              Register your organization
            </div>
            <div style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              You'll be added as the owner of this organization.
            </div>

            <label
              htmlFor="org-name-input"
              style={{ fontSize: "13px", fontWeight: 500, color: "#333", display: "block", marginBottom: "6px" }}
            >
              Organization name
            </label>
            <input
              id="org-name-input"
              type="text"
              autoFocus
              value={orgName}
              onChange={(e) => {
                setOrgName(e.target.value);
                if (error) setError("");
              }}
              disabled={submitting}
              placeholder="e.g. Acme Care Services"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: "14px",
                border: "1px solid #D6D3E0",
                borderRadius: "8px",
                outline: "none",
                fontFamily: "Inter, sans-serif",
                marginBottom: "8px",
                boxSizing: "border-box",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submitting) handleRegister();
              }}
            />

            {error && (
              <div style={{ fontSize: "13px", color: "#C62828", marginBottom: "8px" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={submitting}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "1px solid #D6D3E0",
                  backgroundColor: "#FFFFFF",
                  color: "#333",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegister}
                disabled={submitting}
                style={{
                  padding: "9px 22px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: submitting ? "#9C8AE8" : "#6C4CDC",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: submitting ? "not-allowed" : "pointer",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {submitting ? "Registering…" : "Register"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoOrgEmptyState;
