import React, { useState } from "react";
import "../../../Styles/ScreenTest.css";

const sampleQuestions = [
  {
    id: 1,
    text: `You see a non-familiar face in the access-controlled areas of our office, the person does not have the MGL ID/Visitor/Staff/Vendor tag with him. What would you do?`,
    options: [
      {
        id: "a",
        text: "None of my business, let somebody else take care of it",
      },
      { id: "b", text: "Ask the person to leave the facility" },
      {
        id: "c",
        text: "Escort the person to the security and raise a security incident",
      },
      {
        id: "d",
        text: "Raise a security incident and go back doing your work",
      },
    ],
    correct: "c",
  },
  {
    id: 2,
    text: `If you see a small fire starting in a waste bin, what's the immediate action?`,
    options: [
      { id: "a", text: "Call fire department and wait" },
      { id: "b", text: "Use nearest extinguisher and shout for help" },
      { id: "c", text: "Run out of the building" },
      { id: "d", text: "Ignore it" },
    ],
    correct: "b",
  },
];

export default function ScreeningTest({ onFinish }) {
  const [stage, setStage] = useState("intro"); // 'intro' | 'quiz' | 'success'
  const [form, setForm] = useState({ passcode: "", name: "", email: "" });
  const [formError, setFormError] = useState("");

  const [questions] = useState(sampleQuestions);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const validateIntro = () => {
    if (!form.passcode.trim()) return "Passcode is required.";
    if (!form.name.trim()) return "Name is required.";
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email))
      return "Valid email is required.";
    return "";
  };

  const handleProceed = (e) => {
    e.preventDefault();
    const err = validateIntro();
    if (err) {
      setFormError(err);
      return;
    }
    setStage("quiz");
  };

  const selectOption = (questionId, optionId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const goNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    }
  };

  const goPrev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  const skipQuestion = () => {
    setAnswers((prev) => ({ ...prev, [questions[current].id]: null }));
    goNext();
  };

  const handleFinish = () => {
    setStage("success");
    if (onFinish) onFinish(answers);
  };

  const optionClass = (qid, optId) => {
    const sel = answers[qid];
    let cls = "option-card";
    if (sel === optId) cls += " selected";
    return cls;
  };
  const resetTest = () => {
    setStage("intro");
    setCurrent(0);
    setAnswers({});
    // Keep form data if you want the user to keep their info
    // Or reset form if you want a clean slate:
    // setForm({ passcode: "", name: "", email: "" });
  };
  return (
    <div className="screening-root">
      {stage === "intro" && (
        <div className="intro-card">
          <h2>Screening Test</h2>
          <p className="intro-sub">Enter details before starting the test</p>

          <form className="intro-form" onSubmit={handleProceed}>
            <label className="label">
              Passcode
              <input
                name="passcode"
                placeholder="Enter Passcode"
                value={form.passcode}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label className="label">
              Name
              <input
                name="name"
                placeholder="Enter Your Full Name"
                value={form.name}
                onChange={handleChange}
                className="input"
              />
            </label>

            <label className="label">
              Email
              <input
                name="email"
                placeholder="Enter Your Email"
                value={form.email}
                onChange={handleChange}
                className="input"
              />
            </label>

            {formError && <div className="form-error">{formError}</div>}

            <div className="intro-actions">
              <button type="submit" className="btn primary">
                Proceed To Test
              </button>
            </div>
          </form>
        </div>
      )}

      {stage === "quiz" && (
        <div className="quiz-card">
          <div className="quiz-header">
            <div className="quiz-progress">
              Question {current + 1} / {questions.length}
            </div>
            <div className="quiz-title">{questions[current].text}</div>
          </div>

          <div className="options-list">
            {questions[current].options.map((opt) => (
              <div
                key={opt.id}
                onClick={() => selectOption(questions[current].id, opt.id)}
                className={optionClass(questions[current].id, opt.id)}
              >
                <div className="option-text">{opt.text}</div>
              </div>
            ))}
          </div>

          <div className="quiz-footer">
            {current > 0 && (
              <div className="prev-btn-animate">
                <button className="btn ghost" onClick={goPrev}>
                  ← Previous
                </button>
              </div>
            )}

            <div className="footer-right">
              <button className="btn ghost" onClick={skipQuestion}>
                Skip
              </button>

              {current < questions.length - 1 ? (
                <button className="btn primary" onClick={goNext}>
                  Next →
                </button>
              ) : (
                <button className="btn primary" onClick={handleFinish}>
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {stage === "success" && (
        <div className="summary-card">
          <div className="success-container">
            <div className="tick-circle animate"></div>
          </div>

          {/* Add any additional actions or summary you want below */}
          <div className="summary-actions">
            <button className="btn primary" onClick={() => resetTest()}>
              Start New Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
