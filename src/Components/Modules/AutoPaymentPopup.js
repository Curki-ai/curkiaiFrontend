import React, { useState } from "react";
import "../../Styles/AutoPaymentPopup.css";
import autoPaymentGif from "../../Images/autopaymentPopup.gif";

const API_BASE =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net";

const AutoPaymentPopup = ({ onClose, userEmail }) => {
  const [loading, setLoading] = useState(false);

  const handleProceedTopup = async () => {
    try {
      console.log("[AutoPaymentPopup] Proceed topup clicked");
      console.log("[AutoPaymentPopup] userEmail:", userEmail);

      setLoading(true);

      const response = await fetch(`${API_BASE}/api/trigger-autopayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userEmail: userEmail
        })
      });

      console.log("[AutoPaymentPopup] API response status:", response.status);

      const data = await response.json();

      console.log("[AutoPaymentPopup] API response data:", data);

      if (!response.ok) {
        console.error("[AutoPaymentPopup] Topup request failed:", data);
        setLoading(false);
        return;
      }

      console.log("[AutoPaymentPopup] Auto topup request successfully sent");

      setLoading(false);
      onClose();

    } catch (error) {
      console.error("[AutoPaymentPopup] Error while triggering auto topup:", error);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("[AutoPaymentPopup] User clicked No Thanks");
    onClose();
  };

  return (
    <div className="autopay-overlay">
      <div className="autopay-popup">

        <div className="autopay-icon">
          <img
            src={autoPaymentGif}
            alt="auto payment"
            className="autopay-gif"
          />
        </div>

        <h2 className="autopay-title">
          You’ve Used All Your Tokens
        </h2>

        <p className="autopay-description">
          To keep going without interruption, we’ll automatically recharge
          your account using your saved payment method.
        </p>

        <div className="autopay-card">
          <h3 className="autopay-amount">Recharge Amount: $50</h3>

          <div className="autopay-details">
            <span>AI Tokens: 2M</span>
            <span>SMS: 100</span>
          </div>
        </div>

        <button
          className="autopay-button"
          onClick={handleProceedTopup}
          disabled={loading}
        >
          {loading ? "Processing..." : "Proceed topup"}
        </button>

        <p
          className="autopay-cancel"
          onClick={handleCancel}
        >
          No thanks, I’ll hold my growth for this month
        </p>

      </div>
    </div>
  );
};

export default AutoPaymentPopup;