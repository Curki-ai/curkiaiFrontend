import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiOutlineShieldCheck,
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineMail,
} from "react-icons/hi";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";
import SignIn from "./SignIn";
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
  rostering: "/api/rostering/access/accept-invite",
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
  rostering: "Smart Rostering",
};

const AcceptAccessInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = (params.get("token") || "").trim();
  const moduleSlug = (params.get("module") || "").trim();
  const moduleLabel = MODULE_LABELS[moduleSlug] || "this module";

  // "ready" | "loading" | "success" | "error"
  // "ready" is the new default: we show the invitation acceptance page UI
  // first and only call accept-invite once the user clicks Accept (and, if
  // needed, signs in). The old behaviour auto-fired on mount and dead-ended
  // signed-out users at an error screen.
  const [phase, setPhase] = useState("ready");
  const [message, setMessage] = useState(
    `You've been invited to join ${moduleLabel} on Curki. Accept your invitation to get started.`
  );
  const [details, setDetails] = useState(null);
  // Controls the embedded SignIn (login/signup) modal.
  const [showSignIn, setShowSignIn] = useState(false);
  // Guards against double POSTs (React 18 StrictMode dev double-invoke, or a
  // user double-clicking Accept). The second POST would hit an already-cleared
  // token and return 404 even though the first succeeded.
  const firedRef = useRef(false);
  // Set true when the user clicks Accept while signed out. Once they finish
  // login/signup we read this to auto-resume the accept flow without a second
  // click.
  const pendingAcceptRef = useRef(false);

  // Validate the link up front. A malformed link can never be accepted, so we
  // surface the error immediately rather than waiting for a click.
  useEffect(() => {
    if (!token || !moduleSlug) {
      setPhase("error");
      setMessage(
        "This invitation link is missing required information. Please use the link from your email."
      );
      return;
    }
    if (!MODULE_TO_API_PATH[moduleSlug]) {
      setPhase("error");
      setMessage(
        "Unknown module on this invitation link. Please use the link from your email."
      );
    }
  }, [token, moduleSlug]);

  // Backend requires a verified firebase_uid + Bearer token on accept-invite so
  // it can write the membership into payment_plans. Wait for Firebase auth
  // state to settle before firing — onAuthStateChanged returns synchronously
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

  // Performs the actual accept-invite POST. Called only once we know the user
  // is signed in (either they already were, or they just completed the
  // embedded login/signup).
  const runAccept = async () => {
    if (firedRef.current) return;
    const apiPath = MODULE_TO_API_PATH[moduleSlug];
    if (!apiPath) return;

    firedRef.current = true;
    setPhase("loading");
    setMessage("Accepting your invitation…");

    try {
      const firebase_uid = await waitForFirebaseUid();
      if (!firebase_uid) {
        // Auth didn't settle — let the user retry by clicking Accept again.
        firedRef.current = false;
        setPhase("ready");
        setMessage(
          `You've been invited to join ${moduleLabel} on Curki. Accept your invitation to get started.`
        );
        toast.error("Please sign in to accept the invitation.");
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
        // Allow another attempt (e.g. signed in with the wrong email) — clear
        // the guard so a corrected sign-in can retry.
        firedRef.current = false;
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
      firedRef.current = false;
      setPhase("error");
      setMessage(errMsg);
      toast.error(errMsg);
    }
  };

  // Accept button handler. If the user is already signed in we accept right
  // away; otherwise we open the login/signup modal and remember to resume the
  // accept once they're authenticated.
  const handleAccept = () => {
    if (auth.currentUser?.uid) {
      runAccept();
    } else {
      pendingAcceptRef.current = true;
      setShowSignIn(true);
    }
  };

  // SignIn calls onClose only after a successful login / Google sign-in /
  // verified email signup. That's exactly when we want to resume the pending
  // accept — no second click required.
  const handleSignInClose = () => {
    setShowSignIn(false);
    if (pendingAcceptRef.current) {
      pendingAcceptRef.current = false;
      runAccept();
    }
  };

  const renderIcon = () => {
    if (phase === "ready") {
      return (
        <div className="aai-icon-wrap aai-icon-wrap-loading">
          <HiOutlineMail size={30} />
        </div>
      );
    }
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
    phase === "ready"
      ? `You're invited to ${moduleLabel}`
      : phase === "loading"
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

        {phase === "ready" && (
          <button type="button" className="aai-cta" onClick={handleAccept}>
            <HiOutlineShieldCheck size={16} />
            Accept invitation
          </button>
        )}

        {(phase === "success" || phase === "error") && (
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

      {/* Embedded login/signup. SignIn fires onClose only after a successful
          auth (login / Google / verified signup); handleSignInClose then
          auto-resumes the pending accept so the user never has to click
          Accept a second time. */}
      <SignIn show={showSignIn} onClose={handleSignInClose} />
    </div>
  );
};

export default AcceptAccessInvite;
