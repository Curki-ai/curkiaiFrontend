import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  saveCandidateSession,
  isCandidateAuthenticated,
} from "./candidateAuth";
import { MdOutlineEmail } from "react-icons/md";
import { FiLock } from "react-icons/fi";
import { PiEyeLight, PiEyeSlash } from "react-icons/pi";
import curkiLogo from "../../../../Images/Black_logo.png";
import "../../../../Styles/general-styles/CandidateLogin.css";

const HR_CANDIDATE_AUTH_BASE = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/hr-candidate";

const CandidateLogin = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (isCandidateAuthenticated()) {
      navigate("/hr-candidate/dashboard", { replace: true });
    }
  }, [navigate]);

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const switchMode = (next) => {
    if (loading) return;
    setMode(next);
    resetMessages();
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const persistAndRedirect = (data, fallbackEmail) => {
    saveCandidateSession({
      email: data.email || fallbackEmail,
      organisationId: data.organisation_id,
      candidateId: data.candidate?.candidateId || "",
      candidateName: data.candidate?.candidateName || "",
      token: data.sessionToken || "",
    });
    navigate("/hr-candidate/dashboard", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint =
        mode === "signup" ? "/signup" : "/signin";

      const res = await axios.post(
        `${HR_CANDIDATE_AUTH_BASE}${endpoint}`,
        { email: trimmedEmail, password }
      );

      const data = res.data;
      if (!data?.ok) {
        setError(
          data?.message ||
            "Unable to complete the request. Please try again."
        );
        setLoading(false);
        return;
      }

      persistAndRedirect(data, trimmedEmail);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      setError(
        serverMsg ||
          "Unable to reach the server. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <div className="candidate-login-page">
      <div className="candidate-login-card">
        <div className="candidate-login-logo">
          <img src={curkiLogo} alt="Curki AI" />
        </div>
        <div className="candidate-login-header">
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isSignup
              ? "Set a password to access your onboarding workspace"
              : "Sign in to your Smart Onboarding workspace"}
          </p>
        </div>

        <form
          className="candidate-login-form"
          onSubmit={handleSubmit}
          noValidate
        >
          <label className="candidate-input-label">
            <span>Email</span>
            <div className="candidate-input-wrapper">
              <MdOutlineEmail className="candidate-input-icon" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          </label>

          <label className="candidate-input-label">
            <span>Password</span>
            <div className="candidate-input-wrapper">
              <FiLock className="candidate-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isSignup ? "Choose a password (min. 6 chars)" : "Enter your password"
                }
                autoComplete={isSignup ? "new-password" : "current-password"}
                disabled={loading}
              />
              <button
                type="button"
                className="candidate-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? <PiEyeSlash /> : <PiEyeLight />}
              </button>
            </div>
          </label>

          {isSignup && (
            <label className="candidate-input-label">
              <span>Confirm password</span>
              <div className="candidate-input-wrapper">
                <FiLock className="candidate-input-icon" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="candidate-eye-btn"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? <PiEyeSlash /> : <PiEyeLight />}
                </button>
              </div>
            </label>
          )}

          {error && (
            <div className="candidate-login-error" role="alert">
              {error}
            </div>
          )}

          {info && !error && (
            <div className="candidate-login-info" role="status">
              {info}
            </div>
          )}

          <button
            type="submit"
            className="candidate-login-submit"
            disabled={loading}
          >
            {loading && (
              <span className="candidate-login-submit-spinner" />
            )}
            {loading
              ? isSignup
                ? "Creating account..."
                : "Signing in..."
              : isSignup
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="candidate-login-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="candidate-login-switch-link"
                onClick={() => switchMode("signin")}
                disabled={loading}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              First time here?{" "}
              <button
                type="button"
                className="candidate-login-switch-link"
                onClick={() => switchMode("signup")}
                disabled={loading}
              >
                Create an account
              </button>
            </>
          )}
        </p>

        <p className="candidate-login-footnote">
          Trouble signing in? Reach out to your administrator.
        </p>
      </div>
    </div>
  );
};

export default CandidateLogin;
