// Custom Firebase email-action handler.
//
// Replaces Firebase's bland default action page (the one hosted at
// curki-dashboard.firebaseapp.com/__/auth/action). Firebase uses a SINGLE
// action URL for every email action type, so this one page branches on the
// `mode` query param:
//   - resetPassword : verify the code, show a branded "new password" form,
//                     then confirm the reset.
//   - verifyEmail   : apply the code and show "you can close this window".
//   - recoverEmail  : apply the code (email change rollback).
//
// To use it, set the custom action URL in Firebase Console → Authentication →
// Templates → "Customize action URL" to https://<frontend-domain>/auth/action.

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamation,
  HiOutlineLockClosed,
} from "react-icons/hi";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import {
  auth,
  verifyPasswordResetCode,
  confirmPasswordReset,
  applyActionCode,
} from "../../firebase";
import curkiLogo from "../../Images/Black_logo.png";
import "../../Styles/general-styles/FirebaseActionHandler.css";

const FirebaseActionHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  // phase: "loading" | "reset-form" | "success" | "error"
  const [phase, setPhase] = useState("loading");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  // reset-form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!mode || !oobCode) {
        if (!active) return;
        setPhase("error");
        setTitle("Invalid link");
        setMessage(
          "This link is missing required information. Please request a new one."
        );
        return;
      }

      if (mode === "resetPassword") {
        try {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          if (!active) return;
          setEmail(userEmail);
          setPhase("reset-form");
        } catch (err) {
          if (!active) return;
          setPhase("error");
          setTitle("Link expired");
          setMessage(
            "This password reset link is invalid or has expired. Please request a new one."
          );
        }
        return;
      }

      if (mode === "verifyEmail") {
        try {
          await applyActionCode(auth, oobCode);
          if (!active) return;
          setPhase("success");
          setTitle("Email verified");
          setMessage("Your email has been verified. You can close this window.");
        } catch (err) {
          if (!active) return;
          setPhase("error");
          setTitle("Verification failed");
          setMessage(
            "This verification link is invalid or has expired. Please request a new one."
          );
        }
        return;
      }

      if (mode === "recoverEmail") {
        try {
          await applyActionCode(auth, oobCode);
          if (!active) return;
          setPhase("success");
          setTitle("Email restored");
          setMessage(
            "Your email address has been restored. You can close this window."
          );
        } catch (err) {
          if (!active) return;
          setPhase("error");
          setTitle("Request failed");
          setMessage("This link is invalid or has expired.");
        }
        return;
      }

      if (!active) return;
      setPhase("error");
      setTitle("Unsupported request");
      setMessage("This action isn't supported. Please request a new link.");
    };

    run();
    return () => {
      active = false;
    };
  }, [mode, oobCode]);

  const handleResetSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError("");

      if (newPassword.length < 8) {
        setFormError("Password should be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
      }

      setSubmitting(true);
      try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        setPhase("success");
        setTitle("Password updated");
        setMessage(
          "Your password has been changed. You can now sign in with your new password."
        );
        toast.success("Password updated successfully!");
      } catch (err) {
        const code = err?.code;
        setFormError(
          code === "auth/expired-action-code" ||
            code === "auth/invalid-action-code"
            ? "This reset link has expired. Please request a new one."
            : code === "auth/weak-password"
            ? "Password is too weak. Use at least 8 characters."
            : "Could not reset your password. Please try again."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [newPassword, confirmPassword, oobCode]
  );

  const renderIcon = () => {
    if (phase === "success") {
      return (
        <div className="fah-icon-wrap fah-icon-wrap-success">
          <HiOutlineCheckCircle size={30} />
        </div>
      );
    }
    if (phase === "error") {
      return (
        <div className="fah-icon-wrap fah-icon-wrap-error">
          <HiOutlineExclamation size={30} />
        </div>
      );
    }
    if (phase === "reset-form") {
      return (
        <div className="fah-icon-wrap fah-icon-wrap-loading">
          <HiOutlineLockClosed size={28} />
        </div>
      );
    }
    return (
      <div className="fah-icon-wrap fah-icon-wrap-loading">
        <span className="fah-spinner" />
      </div>
    );
  };

  return (
    <div className="fah-page">
      <div className="fah-card">
        <img src={curkiLogo} alt="Curki AI" className="fah-logo" />
        {renderIcon()}

        {phase === "loading" && (
          <>
            <div className="fah-title">Just a moment…</div>
            <div className="fah-message">Verifying your link.</div>
          </>
        )}

        {phase === "reset-form" && (
          <>
            <div className="fah-title">Reset your password</div>
            <div className="fah-message">
              for <strong>{email}</strong>
            </div>
            <form onSubmit={handleResetSubmit} className="fah-form">
              <div className="fah-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="fah-input"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="fah-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <PiEyeSlash size={20} /> : <PiEyeLight size={20} />}
                </button>
              </div>
              <div className="fah-input-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  className="fah-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {formError && <div className="fah-form-error">{formError}</div>}
              <button type="submit" className="fah-cta" disabled={submitting}>
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </form>
          </>
        )}

        {phase === "success" && (
          <>
            <div className="fah-title">{title}</div>
            <div className="fah-message">{message}</div>
            {mode === "resetPassword" && (
              <button
                type="button"
                className="fah-cta"
                onClick={() => navigate("/")}
              >
                Go to sign in
              </button>
            )}
          </>
        )}

        {phase === "error" && (
          <>
            <div className="fah-title">{title}</div>
            <div className="fah-message">{message}</div>
            <button
              type="button"
              className="fah-cta"
              onClick={() => navigate("/")}
            >
              Back to Curki
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FirebaseActionHandler;
