// CandidateScreeningTest.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../../../Styles/general-styles/ScreenTest.css";
import { useParams } from "react-router-dom";
import { getAuth } from "firebase/auth";

const BASE_URL = "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api";

export default function CandidateScreeningTest() {
  const [stage, setStage] = useState("loading");
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const user = auth.currentUser;
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

    fetchTest(
      organisation_id,
      candidate_id,
      test_id,
      user?.email || ""
    );
  }, []);

  const fetchTest = async (
    organisation_id,
    candidate_id,
    test_id,
    user_email
  ) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/get-test-view`,
        {
          params: {
            organisation_id,
            candidate_id,
            test_id,
            user_email
          }
        }
      );
      console.log("fetchTestView response", res.data);
      if (res.data?.ok) {
        setTestData(res.data);
        setQuestions(
          res.data.test.questions || []
        );

        setForm((prev) => ({
          ...prev,
          name: res.data.candidate.name,
          email: res.data.candidate.email
        }));

        setStage("intro");
      } else {
        setFormError(
          res.data.message ||
          "Unable to load test"
        );
        setStage("error");
      }
    } catch (error) {
      setFormError("Failed to load test");
      setStage("error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
    setFormError("");
  };

  const handleProceed = async (e) => {
    e.preventDefault();

    if (!form.passcode.trim()) {
      setFormError("Passcode required");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/verify-test-access`,
        {
          organisation_id:
            queryData.organisation_id,
          candidate_id:
            queryData.candidate_id,
          test_id: queryData.test_id,
          passcode: form.passcode
        }
      );

      if (res.data?.ok) {
        setTimeLeft(
          (testData?.test?.durationMinutes || 30) * 60
        );
        setStage("quiz");
      } else {
        setFormError(
          res.data.message ||
          "Invalid passcode"
        );
      }
    } catch (error) {
      setFormError("Verification failed");
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
  console.log("testData", testData)
  return (
    <div className="screening-root">
      {stage === "intro" && (
        <div className="intro-card">
          <div className="intro-header">
            <h2>{testData?.test?.testName}</h2>
            <p className="intro-sub">
              Enter passcode to begin test
            </p>
          </div>

          <form
            className="intro-form"
            onSubmit={handleProceed}
          >
            <label className="label">
              Passcode
              <input
                name="passcode"
                className="input"
                value={form.passcode}
                onChange={handleChange}
                placeholder="Enter Passcode"
              />
            </label>

            <label className="label">
              Name
              <input
                className="input"
                value={form.name}
                disabled
              />
            </label>

            <label className="label">
              Email
              <input
                className="input"
                value={form.email}
                disabled
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
            >
              Start Test
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

      {stage === "error" && (
        <div className="summary-card">
          <h2>Error</h2>
          <p>{formError}</p>
        </div>
      )}
    </div>
  );
}