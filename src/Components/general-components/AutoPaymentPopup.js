import React, { useEffect, useState } from "react";
import "../../Styles/general-styles/AutoPaymentPopup.css";
import autoPaymentGif from "../../Images/autopaymentPopup.gif";
import { toast } from "react-toastify";

import { API_BASE } from "../../config/apiBase";
import { auth } from "../../firebase";

const AutoPaymentPopup = ({ onClose, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  const [access, setAccess] = useState({
    canPurchase: false,
    role: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setAccessLoading(true);
        const firebase_uid = auth.currentUser?.uid || "";
        if (!firebase_uid) {
          if (!cancelled) setAccessLoading(false);
          return;
        }
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(
          `${API_BASE}/api/payment-plans/me?firebase_uid=${encodeURIComponent(firebase_uid)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (cancelled) return;
        setAccess({
          canPurchase: !!data?.canPurchase,
          role: data?.membership?.role || null,
        });
      } catch (err) {
        console.error("[AutoPaymentPopup] /payment-plans/me failed:", err);
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  const handleProceedTopup = async () => {
    try {
      console.log("[AutoPaymentPopup] Proceed topup clicked");
      if (accessLoading) {
        toast.info("Checking subscription access…");
        return;
      }
      if (!access.canPurchase) {
        if (access.role && access.role !== "owner") {
          toast.error("Only the account Owner can manage billing.");
        } else {
          toast.error("Please ask your account Owner to set up the subscription.");
        }
        return;
      }
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
      {/* ToastContainer is mounted once globally in HomePage. */}
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