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

  // idle = the initial "you've used all your tokens" prompt
  // success = post-charge success view (user clicks Continue to reload)
  // failure = post-charge failure view (user clicks Try Again / Close)
  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);

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

      // Identity comes from the verified Firebase token — the backend no
      // longer trusts body-supplied userEmail.
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("Authentication expired — please sign in again.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/trigger-autopayment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      console.log("[AutoPaymentPopup] API response status:", response.status);

      const data = await response.json().catch(() => ({}));
      console.log("[AutoPaymentPopup] API response data:", data);

      if (!response.ok || data?.ok === false) {
        console.error("[AutoPaymentPopup] Topup request failed:", data);
        const msg = data?.message || "Auto topup failed. Please try again.";
        toast.error(msg);
        setErrorMessage(msg);
        setStatus("failure");
        setLoading(false);
        return;
      }

      console.log("[AutoPaymentPopup] Auto topup completed");
      toast.success("Auto topup successful — your balance has been credited.");
      setPaymentDetails({
        last4: data?.last4 || null,
        amount: typeof data?.amount === "number" ? data.amount : null,
        currency: data?.currency || null,
        creditedTokens: data?.creditedTokens ?? null,
        creditedSms: data?.creditedSms ?? null,
      });
      setStatus("success");
      setLoading(false);
    } catch (error) {
      console.error("[AutoPaymentPopup] Error while triggering auto topup:", error);
      const msg = "Something went wrong. Please try again.";
      toast.error(msg);
      setErrorMessage(msg);
      setStatus("failure");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log("[AutoPaymentPopup] User clicked No Thanks");
    onClose();
  };

  // Reload the page so HomePage refetches subscriptionInfo / balance.
  // Held until the user explicitly clicks Continue on the success view so
  // the success popup + toast remain visible.
  const handleContinueAfterSuccess = () => {
    window.location.reload();
  };

  const handleRetryAfterFailure = () => {
    setErrorMessage("");
    setStatus("idle");
  };

  const formatAmount = () => {
    if (paymentDetails?.amount == null) return null;
    const major = (paymentDetails.amount / 100).toFixed(2);
    const cur = (paymentDetails.currency || "").toUpperCase();
    return cur ? `${cur} ${major}` : `$${major}`;
  };

  return (
    <div className="autopay-overlay">
      {/* ToastContainer is mounted once globally in HomePage. */}
      <div className="autopay-popup">

        {status === "idle" && (
          <>
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
          </>
        )}

        {status === "success" && (
          <>
            <div className="autopay-icon">
              <div className="autopay-status-icon autopay-status-icon--success">
                ✓
              </div>
            </div>

            <h2 className="autopay-title">Recharge Successful</h2>

            <p className="autopay-description">
              Your account has been topped up and you’re good to keep going.
            </p>

            <div className="autopay-card">
              {formatAmount() && (
                <h3 className="autopay-amount">Charged: {formatAmount()}</h3>
              )}
              <div className="autopay-details">
                {paymentDetails?.creditedTokens != null && (
                  <span>AI Tokens added: {paymentDetails.creditedTokens.toLocaleString()}</span>
                )}
                {paymentDetails?.creditedSms != null && (
                  <span>SMS added: {paymentDetails.creditedSms}</span>
                )}
                {paymentDetails?.last4 && (
                  <span>Card: •••• {paymentDetails.last4}</span>
                )}
              </div>
            </div>

            <button
              className="autopay-button"
              onClick={handleContinueAfterSuccess}
            >
              Continue
            </button>
          </>
        )}

        {status === "failure" && (
          <>
            <div className="autopay-icon">
              <div className="autopay-status-icon autopay-status-icon--failure">
                !
              </div>
            </div>

            <h2 className="autopay-title">Recharge Failed</h2>

            <p className="autopay-description">
              {errorMessage || "We couldn’t process the payment. Please try again."}
            </p>

            <button
              className="autopay-button"
              onClick={handleRetryAfterFailure}
            >
              Try again
            </button>

            <p
              className="autopay-cancel"
              onClick={handleCancel}
            >
              Close
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default AutoPaymentPopup;
