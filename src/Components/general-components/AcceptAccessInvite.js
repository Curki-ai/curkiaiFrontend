import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
} from "react-icons/hi";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import curkiLogo from "../../Images/Black_logo.png";
import { API_BASE } from "../../config/apiBase";
import "../../Styles/general-styles/AcceptAccessInvite.css";

// Map the `module` URL param to the matching backend access namespace.
// Every entry corresponds to a module that calls /accept-invite on its own
// access router. Keep in sync with backend mailers — each module's email
// embeds `module=<slug>` and the backend mounts at /api/<slug>/access.
const MODULE_TO_API_PATH = {
  "care-voice": "/api/care-voice/access/accept-invite",
  "staff-onboarding": "/api/staff-onboarding/access/accept-invite",
  "financial-health": "/api/financial-health/access/accept-invite",
  "client-profitability": "/api/client-profitability/access/accept-invite",
  payroll: "/api/payroll/access/accept-invite",
  "incident-auditing": "/api/incident-auditing/access/accept-invite",
  "incident-report": "/api/incident-report/access/accept-invite",
  "client-event-incident-mgmt":
    "/api/client-event-incident-mgmt/access/accept-invite",
  "custom-incident-mgmt": "/api/custom-incident-mgmt/access/accept-invite",
  "quality-and-risk-reporting":
    "/api/quality-and-risk-reporting/access/accept-invite",
  "sirs-analysis": "/api/sirs-analysis/access/accept-invite",
};

const MODULE_LABELS = {
  "care-voice": "Care Voice",
  "staff-onboarding": "Smart Onboarding",
  "financial-health": "Financial Health",
  "client-profitability": "Client Profitability",
  payroll: "Payroll Analysis",
  "incident-auditing": "Incident Auditing",
  "incident-report": "Incident Report",
  "client-event-incident-mgmt": "Participant Events & Incident Management",
  "custom-incident-mgmt": "Custom Incident Management",
  "quality-and-risk-reporting": "Quality and Risk Reporting",
  "sirs-analysis": "SIRS Analysis",
};

const AcceptAccessInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = (params.get("token") || "").trim();
  const moduleSlug = (params.get("module") || "").trim();

  // "loading" | "success" | "error"
  const [phase, setPhase] = useState("loading");
  const [message, setMessage] = useState("Verifying your invitation…");
  const [details, setDetails] = useState(null);
  // Guards against React 18 StrictMode double-invoke in dev which would
  // otherwise fire two POSTs; the second hits an already-cleared token and
  // returns 404 even though the first succeeded.
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    const moduleLabel = MODULE_LABELS[moduleSlug] || "this module";

    if (!token || !moduleSlug) {
      setPhase("error");
      setMessage(
        "This invitation link is missing required information. Please use the link from your email."
      );
      return;
    }

    const apiPath = MODULE_TO_API_PATH[moduleSlug];
    if (!apiPath) {
      setPhase("error");
      setMessage(
        "Unknown module on this invitation link. Please use the link from your email."
      );
      return;
    }

    // Backend now requires firebase_uid on accept-invite so it can write
    // the membership into payment_plans. Wait for Firebase auth state to
    // settle before firing — onAuthStateChanged returns synchronously
    // when a user is already signed in.
    const waitForFirebaseUid = () =>
      new Promise((resolve) => {
        if (auth.currentUser?.uid) {
          resolve(auth.currentUser.uid);
          return;
        }
        const timer = setTimeout(() => {
          unsubscribe();
          resolve(null);
        }, 4000);
        const unsubscribe = onAuthStateChanged(auth, (u) => {
          if (u?.uid) {
            clearTimeout(timer);
            unsubscribe();
            resolve(u.uid);
          }
        });
      });

    const run = async () => {
      try {
        const firebase_uid = await waitForFirebaseUid();
        if (!firebase_uid) {
          setPhase("error");
          setMessage(
            "Please sign in to your Curki account first, then click the invitation link again."
          );
          toast.error("Sign in before accepting the invitation.");
          return;
        }

        // The access-management surface is gated by verifyFirebaseToken
        // — every request must carry a valid Bearer Firebase ID token.
        let bearerToken = "";
        try {
          bearerToken = await auth.currentUser.getIdToken();
        } catch (err) {
          console.warn("[AcceptAccessInvite] getIdToken failed:", err?.message);
        }

        const headers = { "Content-Type": "application/json" };
        if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;

        const res = await fetch(`${API_BASE}${apiPath}`, {
          method: "POST",
          headers,
          body: JSON.stringify({ token, firebase_uid }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.success) {
          const errMsg =
            data?.error || "We couldn't verify this invitation link.";
          setPhase("error");
          setMessage(errMsg);
          toast.error(errMsg);
          return;
        }

        const u = data.data || {};
        setDetails({
          email: u.email,
          name: u.name,
          role: u.role,
          moduleLabel,
        });

        if (data.already_accepted) {
          setPhase("success");
          setMessage(
            `You've already accepted this invitation. You can sign in to ${moduleLabel} with ${u.email}.`
          );
          toast.info("This invitation was already accepted.");
        } else {
          setPhase("success");
          setMessage(
            `Your access to ${moduleLabel} is now active. Welcome aboard!`
          );
          toast.success(`Invitation accepted — welcome to ${moduleLabel}!`);
        }
      } catch (err) {
        const errMsg =
          err?.message || "Network error. Please try the link again.";
        setPhase("error");
        setMessage(errMsg);
        toast.error(errMsg);
      }
    };

    run();
  }, [token, moduleSlug]);

  const renderIcon = () => {
    if (phase === "loading") {
      return (
        <div className="aai-icon-wrap aai-icon-wrap-loading">
          <span className="aai-spinner" aria-hidden="true" />
        </div>
      );
    }
    if (phase === "success") {
      return (
        <div className="aai-icon-wrap aai-icon-wrap-success">
          <HiOutlineCheckCircle size={32} />
        </div>
      );
    }
    return (
      <div className="aai-icon-wrap aai-icon-wrap-error">
        <HiOutlineExclamation size={30} />
      </div>
    );
  };

  const title =
    phase === "loading"
      ? "Accepting your invitation…"
      : phase === "success"
      ? "You're all set"
      : "We couldn't accept this invitation";

  return (
    <div className="aai-page">
      {/* ToastContainer lives at the App root — see App.js. */}
      <div className="aai-card">
        <img src={curkiLogo} alt="Curki AI" className="aai-logo" />

        {renderIcon()}

        <div className="aai-title">{title}</div>
        <div className="aai-message">{message}</div>

        {phase === "success" && details && (
          <div className="aai-meta">
            <div className="aai-meta-row">
              <span className="aai-meta-label">Module</span>
              <span className="aai-meta-value">{details.moduleLabel}</span>
            </div>
            <div className="aai-meta-row">
              <span className="aai-meta-label">Email</span>
              <span className="aai-meta-value">{details.email}</span>
            </div>
            {details.role && (
              <div className="aai-meta-row">
                <span className="aai-meta-label">Role</span>
                <span className="aai-meta-value">{details.role}</span>
              </div>
            )}
          </div>
        )}

        {phase !== "loading" && (
          <button
            type="button"
            className="aai-cta"
            onClick={() => navigate("/")}
          >
            <HiOutlineShieldCheck size={16} />
            Go to dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default AcceptAccessInvite;
