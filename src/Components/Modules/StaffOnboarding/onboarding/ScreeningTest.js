// CandidateScreeningTest.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../../../Styles/general-styles/ScreenTest.css";
import { useParams } from "react-router-dom";
import { API_BASE } from "../../../../config/apiBase";
import { auth, onAuthStateChanged } from "../../../../firebase";

const BASE_URL = `${API_BASE}/api`;

export default function CandidateScreeningTest() {
  const [stage, setStage] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [queryData, setQueryData] = useState({
    organisation_id: "",
    candidate_id: "",
    test_id: ""
  });

  const [form, setForm] = useState({
    passcode: "",
    name: "",
    email: ""
  });

  const [formError, setFormError] = useState("");

  // Logged-in viewer's email (HR/CC), if any — used only to prefill the email
  // field below. Empty for an anonymous candidate clicking the link.
  const [viewerEmail, setViewerEmail] = useState("");

  // OTP access flow — the email the viewer claims, the code they were sent, and
  // request/verify progress state.
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  // Resend popup state: null (hidden) | "loading" | "success".
  const [resendStatus, setResendStatus] = useState(null);

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { test_id } = useParams();
  useEffect(() => {
    if (stage !== "quiz") return;
    if (timeLeft <= 0) {
      setStage("timeout");
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, timeLeft]);
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins
      .toString()
      .padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
  };
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const organisation_id =
      params.get("organisation_id") || "";

    const candidate_id =
      params.get("candidate_id") || "";


    setQueryData({
      organisation_id,
      candidate_id,
      test_id
    });

    // The test is never loaded on open. The viewer must first prove they own an
    // allowlisted email (candidate / HR / CC) via a one-time code. Prefill the
    // email from the signed-in user, if any, to save a step for HR/CC.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const email = currentUser?.email || "";
      setViewerEmail(email);
      if (email) {
        setOtpEmail((prev) => prev || email);
      }
      unsubscribe();
    });

    setStage("verifyEmail");
    setLoading(false);

    return () => unsubscribe();
  }, []);

  // Shared request to email a one-time code to the given address.
  const requestOtp = (email) =>
    axios.post(`${BASE_URL}/request-test-otp`, {
      organisation_id: queryData.organisation_id,
      candidate_id: queryData.candidate_id,
      test_id: queryData.test_id,
      email
    });

  // Step 1 — request a one-time code. Only allowlisted emails (the invited
  // candidate, an org HR, or a CC member) are sent a code; anyone else is
  // denied here, before any test data or code-entry step is shown.
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setFormError("");

    const email = otpEmail.trim();
    if (!email) {
      setFormError("Email required");
      return;
    }

    try {
      setOtpBusy(true);
      const res = await requestOtp(email);

      if (res.data?.ok) {
        setStage("verifyCode");
      } else if (res.data?.code === "ACCESS_DENIED") {
        setFormError(res.data.message || "Access denied");
        setStage("denied");
      } else {
        setFormError(res.data.message || "Could not send code");
      }
    } catch (error) {
      setFormError("Could not send code. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  // Resend from the code step — shows a loading popup, then a green tick that
  // auto-dismisses once the new code has been emailed.
  const handleResendOtp = async () => {
    const email = otpEmail.trim();
    if (!email) {
      setFormError("Email required");
      return;
    }
    setFormError("");
    setResendStatus("loading");

    try {
      const res = await requestOtp(email);

      if (res.data?.ok) {
        setResendStatus("success");
        setTimeout(() => setResendStatus(null), 1400);
      } else if (res.data?.code === "ACCESS_DENIED") {
        setResendStatus(null);
        setFormError(res.data.message || "Access denied");
        setStage("denied");
      } else {
        setResendStatus(null);
        setFormError(res.data.message || "Could not resend code");
      }
    } catch (error) {
      setResendStatus(null);
      setFormError("Could not resend code. Please try again.");
    }
  };

  // Step 2 — verify the code. On success the test itself is returned: HR/CC get
  // a read-only preview, the candidate goes straight into the quiz.
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!otpCode.trim()) {
      setFormError("Enter the code from your email");
      return;
    }

    try {
      setOtpBusy(true);
      const res = await axios.post(
        `${BASE_URL}/verify-test-otp`,
        {
          organisation_id: queryData.organisation_id,
          candidate_id: queryData.candidate_id,
          test_id: queryData.test_id,
          email: otpEmail.trim(),
          code: otpCode
        }
      );

      if (res.data?.ok) {
        setTestData(res.data);
        setQuestions(res.data.test.questions || []);
        setForm((prev) => ({
          ...prev,
          name: res.data.candidate.name,
          email: res.data.candidate.email
        }));

        if (res.data.preview) {
          setStage("preview");
        } else {
          setTimeLeft((res.data.test?.durationMinutes || 30) * 60);
          setStage("quiz");
        }
      } else if (res.data?.code === "ACCESS_DENIED") {
        setFormError(res.data.message || "Access denied");
        setStage("denied");
      } else {
        setFormError(res.data.message || "Invalid code");
      }
    } catch (error) {
      setFormError("Verification failed. Please try again.");
    } finally {
      setOtpBusy(false);
    }
  };

  const selectOption = (questionObj, index) => {
    const questionKey = questionObj.question;

    const type = (
      questionObj?.questionType ||
      questionObj?.type ||
      "single"
    )
      .toString()
      .trim()
      .toLowerCase();

    const isMulti = type === "multiple";

    setAnswers((prev) => {
      if (isMulti) {
        const existing = prev[questionKey] || [];
        const alreadySelected = existing.includes(index);

        return {
          ...prev,
          [questionKey]: alreadySelected
            ? existing.filter((item) => item !== index)
            : [...existing, index]
        };
      }

      return {
        ...prev,
        [questionKey]: index
      };
    });
  };

  const setTextAnswer = (questionObj, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionObj.question]: value
    }));
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(current - 1);
    }
  };

  const skipQuestion = () => {
    goNext();
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);

      const formattedAnswers =
        questions.map((q) => ({
          question: q.question,
          answer: (() => {
            const selected =
              answers[q.question];

            const qType = (
              q?.questionType ||
              q?.type ||
              "single"
            )
              .toString()
              .trim()
              .toLowerCase();

            if (qType === "text") {
              return typeof selected === "string"
                ? selected
                : "";
            }

            if (
              Array.isArray(selected)
            ) {
              return selected.map(
                (i) => q.options[i]
              );
            }

            if (
              selected !== undefined
            ) {
              return q.options[selected];
            }

            return "";
          })()
        }));

      const payload = {
        organisation_id:
          queryData.organisation_id,
        candidate_id:
          queryData.candidate_id,
        test_data: {
          answers: formattedAnswers
        }
      };

      const res = await axios.post(
        `${BASE_URL}/submit-test`,
        payload
      );

      if (res.data?.ok) {
        setStage("success");
      } else {
        setFormError(
          "Submission failed"
        );
      }
    } catch (error) {
      setFormError(
        "Something went wrong"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const currentQuestion =
    questions[current];

  if (loading) {
    return (
      <div className="screening-root">
        <div className="intro-card loading-card">
          Loading test...
        </div>
      </div>
    );
  }
  return (
    <div className="screening-root">
      {resendStatus && (
        <div
          className="otp-popup-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="otp-popup">
            {resendStatus === "loading" ? (
              <>
                <span className="otp-popup-spinner" aria-hidden="true" />
                <p className="otp-popup-text">Resending OTP…</p>
              </>
            ) : (
              <>
                <span className="otp-popup-tick" aria-hidden="true">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <p className="otp-popup-text">Code sent</p>
              </>
            )}
          </div>
        </div>
      )}

      {stage === "verifyEmail" && (
        <div className="intro-card">
          <div className="intro-header">
            <h2>Verify your identity</h2>
            <p className="intro-sub">
              Enter your email to receive a one-time access code.
            </p>
          </div>

          <form
            className="intro-form"
            onSubmit={handleRequestOtp}
          >
            <label className="label">
              Email
              <input
                type="email"
                className="input"
                value={otpEmail}
                onChange={(e) => {
                  setOtpEmail(e.target.value);
                  setFormError("");
                }}
                placeholder="you@example.com"
                autoFocus
              />
            </label>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="btn primary"
              disabled={otpBusy}
            >
              {otpBusy ? "Sending…" : "Send code"}
            </button>
          </form>
        </div>
      )}

      {stage === "verifyCode" && (
        <div className="intro-card">
          <div className="intro-header">
            <h2>Enter your code</h2>
            <p className="intro-sub">
              We sent a 6-digit code to {otpEmail}. It expires in 10 minutes.
            </p>
          </div>

          <form
            className="intro-form"
            onSubmit={handleVerifyOtp}
          >
            <label className="label">
              Access code
              <input
                className="input"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value);
                  setFormError("");
                }}
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                autoFocus
              />
            </label>

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            <button
              type="submit"
              className="btn primary"
              disabled={otpBusy}
            >
              {otpBusy ? "Verifying…" : "Verify & start"}
            </button>

            <button
              type="button"
              className="btn ghost"
              onClick={handleResendOtp}
              disabled={otpBusy || resendStatus === "loading"}
            >
              Resend code
            </button>
          </form>
        </div>
      )}

      {stage === "quiz" &&
        currentQuestion && (
          <div className="quiz-card">
            <div className="quiz-header">
              <div className="quiz-timer">
                Time Left: {formatTime(timeLeft)}
              </div>
              <div className="quiz-progress">
                Question {current + 1} /{" "}
                {questions.length}
              </div>

              <div className="quiz-title">
                {
                  currentQuestion.question
                }
              </div>
            </div>

            {(() => {
              const type = (
                currentQuestion?.questionType ||
                currentQuestion?.type ||
                "single"
              )
                .toString()
                .trim()
                .toLowerCase();

              if (type === "text") {
                const value =
                  typeof answers[currentQuestion.question] === "string"
                    ? answers[currentQuestion.question]
                    : "";
                return (
                  <div className="text-answer-wrap">
                    <textarea
                      className="text-answer-input"
                      placeholder="Type your answer here..."
                      rows={6}
                      value={value}
                      onChange={(e) =>
                        setTextAnswer(
                          currentQuestion,
                          e.target.value
                        )
                      }
                    />
                  </div>
                );
              }

              const isMulti = type === "multiple";

              return (
                <div className="options-list">
                  {(currentQuestion.options || []).map((opt, index) => {
                    const selected = isMulti
                      ? (
                        answers[currentQuestion.question] || []
                      ).includes(index)
                      : answers[currentQuestion.question] === index;

                    return (
                      <div
                        key={index}
                        className={`option-card ${selected ? "selected" : ""}`}
                        onClick={() =>
                          selectOption(currentQuestion, index)
                        }
                      >
                        <div className="option-left-icon">
                          <input
                            type={isMulti ? "checkbox" : "radio"}
                            checked={selected}
                            readOnly
                          />
                        </div>

                        <div className="option-text">{opt}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="quiz-footer">
              {current > 0 && (
                <button
                  className="btn ghost"
                  onClick={goPrev}
                >
                  Previous
                </button>
              )}

              <div className="footer-right">
                <button
                  className="btn ghost"
                  onClick={skipQuestion}
                >
                  Skip
                </button>

                {current <
                  questions.length - 1 ? (
                  <button
                    className="btn primary"
                    onClick={goNext}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="btn primary"
                    onClick={
                      handleFinish
                    }
                    disabled={
                      submitting
                    }
                  >
                    {submitting
                      ? "Submitting..."
                      : "Finish"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      {stage === "success" && (
        <div className="summary-card">
          <h2>
            Test Submitted Successfully
          </h2>
          <p>
            Thank you for completing
            your assessment.
          </p>
        </div>
      )}

      {stage === "denied" && (
        <div className="summary-card denied-card">
          <div className="denied-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <line x1="8" y1="8" x2="16" y2="16" />
            </svg>
          </div>
          <h2>Access Denied</h2>
          <p>
            {formError ||
              "This test link is only for the invited candidate and the hiring team."}
          </p>
        </div>
      )}

      {stage === "preview" && (
        <div className="preview-card">
          <div className="preview-banner">
            Preview mode — you're viewing this test as the hiring team. Answers
            can't be submitted from here.
          </div>
          <h2 className="preview-title">
            {testData?.test?.testName}
          </h2>
          <div className="preview-questions">
            {questions.map((q, qi) => {
              const opts = q.options || [];
              return (
                <div key={qi} className="preview-question">
                  <div className="preview-q-text">
                    {qi + 1}. {q.question}
                  </div>
                  {opts.length > 0 && (
                    <ul className="preview-options">
                      {opts.map((opt, oi) => (
                        <li key={oi} className="preview-option">
                          {opt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="summary-card">
          <h2>Error</h2>
          <p>{formError}</p>
        </div>
      )}
    </div>
  );
}