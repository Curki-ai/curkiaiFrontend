// ScreeningTestCreation.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiSave,
  FiLoader,
  FiFileText,
  FiClock,
  FiAward,
  FiX,
  FiEye,
  FiEdit2,
  FiCopy,
  FiArrowUp,
  FiArrowDown,
  FiChevronRight,
  FiCheckCircle,
  FiCircle,
  FiSquare,
  FiAlignLeft
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../../../../Styles/general-styles/NewScreeningTestCreation.css";

const BASE_URL =
  "https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api";

const QTYPE_LABELS = {
  single: "Multiple Choice",
  multiple: "Checkboxes",
  text: "Short Answer"
};

const newId = (p) =>
  `${p}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const makeBlankQuestion = () => ({
  id: newId("q"),
  type: "single",
  question: "",
  options: ["Option 1", "Option 2", "Option 3"],
  correctAnswers: [],
  correctText: "",
  required: false
});

const makeBlankTest = () => ({
  id: null,
  title: "",
  description: "",
  duration: 30,
  passScore: 70,
  createdAt: null,
  questions: [makeBlankQuestion()]
});

const normalizeQuestion = (q) => ({
  id: q.id || newId("q"),
  type: q.type || q.questionType || "single",
  question: q.question || "",
  options: Array.isArray(q.options) ? [...q.options] : [],
  correctAnswers: Array.isArray(q.correctAnswers) ? [...q.correctAnswers] : [],
  correctText: q.correctText || "",
  required: !!q.required
});

// Backend stores: { question, options, answer, questionType, required }
//   answer is a string for "single"/"text", array of strings for "multiple"
// Frontend uses: { id, type, question, options, correctAnswers, correctText, required }
const backendQuestionToFrontend = (q) => {
  const type = q.questionType || q.type || "single";
  const options = Array.isArray(q.options) ? [...q.options] : [];
  const base = {
    id: q.id || newId("q"),
    type,
    question: q.question || "",
    options,
    correctAnswers: [],
    correctText: "",
    required: !!q.required
  };
  if (type === "text") {
    base.correctText =
      typeof q.answer === "string" ? q.answer : q.correctText || "";
  } else if (type === "multiple") {
    const answers = Array.isArray(q.answer) ? q.answer : [];
    base.correctAnswers = answers
      .map((ans) => options.indexOf(ans))
      .filter((i) => i >= 0);
  } else {
    if (typeof q.answer === "string" && q.answer) {
      const idx = options.indexOf(q.answer);
      if (idx >= 0) base.correctAnswers = [idx];
    }
  }
  return base;
};

const frontendQuestionToBackend = (q) => {
  if (q.type === "text") {
    return {
      question: q.question,
      options: [],
      answer: q.correctText || "",
      questionType: "text",
      required: !!q.required
    };
  }
  const cleanOpts = (q.options || []).filter((o) => o.trim() !== "");
  let answer;
  if (q.type === "single") {
    const idx = (q.correctAnswers || [])[0];
    answer =
      typeof idx === "number" && q.options[idx] ? q.options[idx] : "";
  } else {
    answer = (q.correctAnswers || [])
      .map((i) => q.options[i])
      .filter(Boolean);
  }
  return {
    question: q.question,
    options: cleanOpts,
    answer,
    questionType: q.type,
    required: !!q.required
  };
};

const ScreeningTestCreation = (props) => {
  const ORG_ID = props?.organizationId;
  const adminEmail = props?.user?.email;

  // App-level
  const [view, setView] = useState("home"); // 'home' | 'builder' | 'preview'
  const [previousTests, setPreviousTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Builder
  const [gfState, setGfState] = useState(makeBlankTest());
  const [focusedQIdx, setFocusedQIdx] = useState(0);
  const [editingTestId, setEditingTestId] = useState(null);

  // Preview
  const [previewData, setPreviewData] = useState(null);
  const [previewSource, setPreviewSource] = useState("home");
  const [previewAnswers, setPreviewAnswers] = useState({});
  const [previewSubmitted, setPreviewSubmitted] = useState(false);

  const newQAnchorRef = useRef(null);

  useEffect(() => {
    fetchTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ORG_ID, adminEmail]);

  const showToast = (message, type = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "info") toast.info(message);
    else if (type === "warn") toast.warn(message);
    else toast.success(message);
  };

  // ============== Backend ==============
  const fetchTests = async () => {
    try {
      if (!adminEmail || !ORG_ID) {
        setLoadingTests(false);
        return;
      }
      setLoadingTests(true);
      const res = await axios.get(`${BASE_URL}/get-tests`, {
        params: { admin_email: adminEmail, organization_id: ORG_ID }
      });
      if (res.data?.ok) setPreviousTests(res.data.tests || []);
    } catch (error) {
      console.log("fetchTests error:", error);
    } finally {
      setLoadingTests(false);
    }
  };

  // ============== Tests list (transformed from backend) ==============
  const mergedTests = useMemo(() => {
    return (previousTests || []).map((t) => {
      const id = t.testId || t._id;
      const rawQs = Array.isArray(t.questions) ? t.questions : [];
      const questions = rawQs.map(backendQuestionToFrontend);
      return {
        id,
        title: t.testName || "Untitled Test",
        description: t.description || "",
        duration: t.durationMinutes ?? 30,
        passScore: t.passingMarks ?? 0,
        questionCount: t.totalQuestions ?? questions.length,
        questions,
        createdAt: t.createdAt || null
      };
    });
  }, [previousTests]);

  const stats = useMemo(() => {
    const total = mergedTests.length;
    const totalQ = mergedTests.reduce(
      (s, t) => s + (t.questionCount || 0),
      0
    );
    const avg = total > 0 ? Math.round(totalQ / total) : 0;
    return { total, totalQ, avg };
  }, [mergedTests]);

  // ============== Navigation ==============
  const onCreateNewTest = () => {
    setGfState(makeBlankTest());
    setEditingTestId(null);
    setFocusedQIdx(0);
    setView("builder");
  };

  const onEditTest = (testId) => {
    const test = mergedTests.find((t) => t.id === testId);
    if (!test) {
      showToast("Test not found.", "error");
      return;
    }
    setGfState({
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      passScore: test.passScore,
      createdAt: test.createdAt,
      questions:
        test.questions && test.questions.length
          ? test.questions.map(normalizeQuestion)
          : [makeBlankQuestion()]
    });
    setEditingTestId(testId);
    setFocusedQIdx(0);
    setView("builder");
  };

  const onDeleteTest = (testId) => setConfirmDelete(testId);

  const confirmDeleteTest = async () => {
    const id = confirmDelete;
    if (!id) return;
    if (!ORG_ID) {
      showToast("Missing organization context.", "error");
      return;
    }
    setDeleting(true);
    try {
      const res = await axios.post(`${BASE_URL}/delete-test`, {
        organisation_id: ORG_ID,
        test_id: id
      });
      if (res.data?.ok) {
        showToast("Test deleted successfully.");
        setConfirmDelete(null);
        await fetchTests();
      } else {
        showToast(res.data?.message || "Failed to delete test.", "error");
      }
    } catch (e) {
      console.error("delete error:", e);
      showToast("Something went wrong while deleting.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const onGoHome = () => {
    setView("home");
    setEditingTestId(null);
  };

  const onPreviewTest = (testId) => {
    const test = mergedTests.find((t) => t.id === testId);
    if (!test) {
      showToast("Test not found.", "error");
      return;
    }
    setPreviewData({
      title: test.title,
      description: test.description,
      duration: test.duration,
      passScore: test.passScore,
      questions: (test.questions || []).map(normalizeQuestion)
    });
    setPreviewAnswers({});
    setPreviewSubmitted(false);
    setPreviewSource(view);
    setView("preview");
  };

  const onPreviewCurrent = () => {
    setPreviewData({
      ...gfState,
      questions: gfState.questions.map(normalizeQuestion)
    });
    setPreviewAnswers({});
    setPreviewSubmitted(false);
    setPreviewSource("builder");
    setView("preview");
  };

  const onClosePreview = () => {
    setView(previewSource || "home");
    setPreviewData(null);
    setPreviewSubmitted(false);
  };

  // ============== Builder handlers ==============
  const onTitleChange = (v) => setGfState((s) => ({ ...s, title: v }));
  const onDescriptionChange = (v) =>
    setGfState((s) => ({ ...s, description: v }));
  const onDurationChange = (v) => setGfState((s) => ({ ...s, duration: v }));
  const onPassScoreChange = (v) => setGfState((s) => ({ ...s, passScore: v }));

  const onAddQuestion = () => {
    setGfState((s) => {
      const next = { ...s, questions: [...s.questions, makeBlankQuestion()] };
      setFocusedQIdx(next.questions.length - 1);
      return next;
    });
    setTimeout(() => {
      newQAnchorRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 60);
  };

  const onQuestionTextChange = (qIdx, v) =>
    setGfState((s) => {
      const qs = [...s.questions];
      qs[qIdx] = { ...qs[qIdx], question: v };
      return { ...s, questions: qs };
    });

  const onQuestionTypeChange = (qIdx, newType) =>
    setGfState((s) => {
      const qs = [...s.questions];
      const q = qs[qIdx];
      const updated = {
        ...q,
        type: newType,
        correctAnswers: [],
        correctText: ""
      };
      if (newType === "text") {
        updated.options = [];
      } else if (!q.options || q.options.length === 0) {
        updated.options = ["Option 1", "Option 2", "Option 3"];
      }
      qs[qIdx] = updated;
      return { ...s, questions: qs };
    });

  const onAddOption = (qIdx) =>
    setGfState((s) => {
      const qs = [...s.questions];
      qs[qIdx] = {
        ...qs[qIdx],
        options: [
          ...qs[qIdx].options,
          `Option ${qs[qIdx].options.length + 1}`
        ]
      };
      return { ...s, questions: qs };
    });

  const onOptionTextChange = (qIdx, optIdx, v) =>
    setGfState((s) => {
      const qs = [...s.questions];
      const opts = [...qs[qIdx].options];
      opts[optIdx] = v;
      qs[qIdx] = { ...qs[qIdx], options: opts };
      return { ...s, questions: qs };
    });

  const onDeleteOption = (qIdx, optIdx) =>
    setGfState((s) => {
      const qs = [...s.questions];
      const opts = [...qs[qIdx].options];
      opts.splice(optIdx, 1);
      const correctAnswers = (qs[qIdx].correctAnswers || [])
        .filter((i) => i !== optIdx)
        .map((i) => (i > optIdx ? i - 1 : i));
      qs[qIdx] = { ...qs[qIdx], options: opts, correctAnswers };
      return { ...s, questions: qs };
    });

  const onToggleCorrectSingle = (qIdx, optIdx) =>
    setGfState((s) => {
      const qs = [...s.questions];
      const cur = qs[qIdx].correctAnswers || [];
      const isAlready = cur.length === 1 && cur[0] === optIdx;
      qs[qIdx] = {
        ...qs[qIdx],
        correctAnswers: isAlready ? [] : [optIdx]
      };
      return { ...s, questions: qs };
    });

  const onToggleCorrectMultiple = (qIdx, optIdx) =>
    setGfState((s) => {
      const qs = [...s.questions];
      const cur = qs[qIdx].correctAnswers || [];
      const next = cur.includes(optIdx)
        ? cur.filter((i) => i !== optIdx)
        : [...cur, optIdx];
      qs[qIdx] = { ...qs[qIdx], correctAnswers: next };
      return { ...s, questions: qs };
    });

  const onCorrectTextChange = (qIdx, v) =>
    setGfState((s) => {
      const qs = [...s.questions];
      qs[qIdx] = { ...qs[qIdx], correctText: v };
      return { ...s, questions: qs };
    });

  const onToggleRequired = (qIdx) =>
    setGfState((s) => {
      const qs = [...s.questions];
      qs[qIdx] = { ...qs[qIdx], required: !qs[qIdx].required };
      return { ...s, questions: qs };
    });

  const swapQuestions = (a, b) =>
    setGfState((s) => {
      if (a < 0 || b < 0 || a >= s.questions.length || b >= s.questions.length)
        return s;
      const qs = [...s.questions];
      [qs[a], qs[b]] = [qs[b], qs[a]];
      return { ...s, questions: qs };
    });

  const onMoveUp = (qIdx) => {
    swapQuestions(qIdx, qIdx - 1);
    if (qIdx - 1 >= 0) setFocusedQIdx(qIdx - 1);
  };
  const onMoveDown = (qIdx) => {
    swapQuestions(qIdx, qIdx + 1);
    setFocusedQIdx((idx) =>
      qIdx + 1 < gfState.questions.length ? qIdx + 1 : idx
    );
  };

  const onDuplicateQuestion = (qIdx) => {
    setGfState((s) => {
      const qs = [...s.questions];
      const orig = qs[qIdx];
      const clone = {
        ...orig,
        id: newId("q"),
        options: [...orig.options],
        correctAnswers: [...(orig.correctAnswers || [])]
      };
      qs.splice(qIdx + 1, 0, clone);
      return { ...s, questions: qs };
    });
    setFocusedQIdx(qIdx + 1);
  };

  const onDeleteQuestion = (qIdx) =>
    setGfState((s) => {
      if (s.questions.length <= 1) {
        return { ...s, questions: [makeBlankQuestion()] };
      }
      const qs = [...s.questions];
      qs.splice(qIdx, 1);
      setFocusedQIdx((idx) => Math.max(0, Math.min(idx, qs.length - 1)));
      return { ...s, questions: qs };
    });

  // ============== Save ==============
  const onSaveTest = async () => {
    if (!gfState.title.trim()) {
      showToast("Please enter a test title.", "error");
      return;
    }
    for (let i = 0; i < gfState.questions.length; i++) {
      const q = gfState.questions[i];
      if (!q.question.trim()) {
        showToast(`Question ${i + 1} text is empty.`, "error");
        return;
      }
    }

    if (!adminEmail || !ORG_ID) {
      showToast(
        "Missing organization or admin context — cannot save.",
        "error"
      );
      return;
    }

    const payloadQuestions = gfState.questions.map(frontendQuestionToBackend);

    setSubmitting(true);
    try {
      const isEdit = !!editingTestId;
      const url = isEdit ? `${BASE_URL}/edit-test` : `${BASE_URL}/create-test`;
      const body = {
        organisation_id: ORG_ID,
        test_name: gfState.title,
        duration_minutes: Number(gfState.duration) || 30,
        passing_marks: Number(gfState.passScore) || 0,
        questions: payloadQuestions,
        admin_email: adminEmail
      };
      if (isEdit) body.test_id = editingTestId;

      const res = await axios.post(url, body);

      if (res.data?.ok) {
        showToast(
          isEdit ? "Test updated successfully!" : "Test saved successfully!"
        );
        await fetchTests();
        setView("home");
        setEditingTestId(null);
      } else {
        showToast(res.data?.message || "Failed to save test.", "error");
      }
    } catch (e) {
      console.error("save error:", e);
      showToast("Something went wrong while saving.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ============== Preview interactions ==============
  const onSelectPreviewOption = (qIdx, optIdx) => {
    if (previewSubmitted) return;
    const q = previewData.questions[qIdx];
    const type = q.type || "single";
    setPreviewAnswers((prev) => {
      const next = { ...prev };
      if (type === "multiple") {
        const cur = next[qIdx] || [];
        next[qIdx] = cur.includes(optIdx)
          ? cur.filter((i) => i !== optIdx)
          : [...cur, optIdx];
      } else {
        next[qIdx] = optIdx;
      }
      return next;
    });
  };

  const onChangePreviewText = (qIdx, v) => {
    if (previewSubmitted) return;
    setPreviewAnswers((prev) => ({ ...prev, [qIdx]: v }));
  };

  const onSubmitPreview = () => {
    setPreviewSubmitted(true);
    showToast("Preview submitted (this does not save responses).");
  };

  // ============== Renderers ==============
  const renderHome = () => (
    <>
      <div className="stc_header_box stc_fade_in">
        <div className="stc_header_left">
          <div className="stc_icon_box">
            <FiUsers />
          </div>
          <div>
            <h2 className="stc_main_heading">Screening Test Library</h2>
            <p className="stc_section_sub">
              Build, preview, and manage screening tests for candidates.
            </p>
          </div>
        </div>
        <button className="stc_save_btn" onClick={onCreateNewTest}>
          <FiPlus /> Create New Test
        </button>
      </div>

      <div className="stc_stats_bar stc_fade_in">
        <div className="stc_stat_card">
          <span className="stc_stat_num">{stats.total}</span>
          <span className="stc_stat_label">Total Tests</span>
        </div>
        <div className="stc_stat_card">
          <span className="stc_stat_num">{stats.totalQ}</span>
          <span className="stc_stat_label">Total Questions</span>
        </div>
        <div className="stc_stat_card">
          <span className="stc_stat_num">{stats.avg}</span>
          <span className="stc_stat_label">Avg Questions / Test</span>
        </div>
      </div>

      <div
        className="stc_candidate_section stc_fade_in"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="stc_section_head">
          <div>
            <h3>Saved Tests</h3>
            <p className="stc_section_sub">
              {mergedTests.length}{" "}
              {mergedTests.length === 1 ? "test" : "tests"} available
            </p>
          </div>
        </div>

        {loadingTests ? (
          <div className="stc_loading_box">
            <FiLoader className="stc_spin_icon" size={28} />
            <span>Fetching tests...</span>
          </div>
        ) : mergedTests.length === 0 ? (
          <div className="stc_empty_state">
            <div className="stc_empty_icon">
              <FiFileText />
            </div>
            <p>No screening tests have been created yet.</p>
            <button
              className="stc_save_btn"
              style={{ marginTop: 14 }}
              onClick={onCreateNewTest}
            >
              <FiPlus /> Create Your First Test
            </button>
          </div>
        ) : (
          <div className="stc_lib_grid">
            {mergedTests.map((test) => {
              const types = Array.from(
                new Set((test.questions || []).map((q) => q.type || "single"))
              );
              return (
                <div className="stc_lib_card" key={test.id}>
                  <div className="stc_lib_card_top">
                    <div className="stc_test_icon_wrap">
                      <FiFileText />
                    </div>
                    <div className="stc_lib_card_actions">
                      <button
                        title="Preview"
                        onClick={() => onPreviewTest(test.id)}
                        className="stc_action_icon_btn"
                      >
                        <FiEye />
                      </button>
                      <button
                        title="Edit"
                        onClick={() => onEditTest(test.id)}
                        className="stc_action_icon_btn"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => onDeleteTest(test.id)}
                        className="stc_action_icon_btn stc_action_icon_danger"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <h4 className="stc_lib_card_title" title={test.title}>
                    {test.title}
                  </h4>
                  <div className="stc_test_meta">
                    <span>
                      <FiAward /> {test.questionCount} Qs
                    </span>
                    <span>
                      <FiClock /> {test.duration} min
                    </span>
                    <span>
                      <FiCheckCircle /> {test.passScore}% pass
                    </span>
                  </div>
                  {types.length > 0 && (
                    <div className="stc_type_tags">
                      {types.map((t) => (
                        <span key={t} className="stc_type_tag">
                          {QTYPE_LABELS[t] || t}
                        </span>
                      ))}
                    </div>
                  )}
                  {test.createdAt && (
                    <div className="stc_lib_card_date">
                      Created{" "}
                      {new Date(test.createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );

  const renderBuilder = () => (
    <>
      <div className="stc_breadcrumb stc_fade_in">
        <button className="stc_breadcrumb_link" onClick={onGoHome}>
          Test Library
        </button>
        <FiChevronRight />
        <span>{editingTestId ? "Edit Test" : "New Test"}</span>
      </div>

      <div className="stc_top_action_bar stc_fade_in">
        <button className="stc_secondary_btn" onClick={onPreviewCurrent}>
          <FiEye /> Preview
        </button>
        <button
          className="stc_save_btn"
          onClick={onSaveTest}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <FiLoader className="stc_spin_icon" /> Saving...
            </>
          ) : (
            <>
              <FiSave /> Save Test
            </>
          )}
        </button>
      </div>

      <div
        className="stc_candidate_section stc_fade_in"
        style={{ animationDelay: "0.05s" }}
      >
        <div className="stc_input_group">
          <input
            type="text"
            className="stc_input_full stc_title_input"
            placeholder="Untitled Test"
            value={gfState.title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="stc_input_group">
          <textarea
            className="stc_input_full stc_desc_input"
            placeholder="Test description (optional)"
            value={gfState.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={2}
          />
        </div>
        <div className="stc_grid_two">
          <div className="stc_input_group">
            <label>Duration (Minutes)</label>
            <input
              type="number"
              min="1"
              className="stc_input_full"
              value={gfState.duration}
              onChange={(e) => onDurationChange(e.target.value)}
            />
          </div>
          <div className="stc_input_group">
            <label>Pass Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              className="stc_input_full"
              value={gfState.passScore}
              onChange={(e) => onPassScoreChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="stc_questions_container">
        {gfState.questions.map((q, qIdx) => {
          const isLast = qIdx === gfState.questions.length - 1;
          const isFocused = focusedQIdx === qIdx;
          return (
            <div
              key={q.id}
              className={`stc_question_card stc_gf_card${
                isFocused ? " stc_focused" : ""
              }`}
              ref={isLast ? newQAnchorRef : null}
              onClick={() => setFocusedQIdx(qIdx)}
            >
              <div className="stc_question_top">
                <div className="stc_question_top_left">
                  <h4>Question {qIdx + 1}</h4>
                  {q.required && (
                    <span className="stc_required_pill">Required</span>
                  )}
                </div>
                <select
                  className="stc_qtype_select"
                  value={q.type}
                  onChange={(e) =>
                    onQuestionTypeChange(qIdx, e.target.value)
                  }
                >
                  <option value="single">Multiple Choice (Single)</option>
                  <option value="multiple">Checkboxes (Multiple)</option>
                  <option value="text">Short Answer (Text)</option>
                </select>
              </div>

              <div className="stc_input_group">
                <input
                  type="text"
                  className="stc_input_full stc_q_input"
                  placeholder="Type your question here..."
                  value={q.question}
                  onChange={(e) =>
                    onQuestionTextChange(qIdx, e.target.value)
                  }
                />
              </div>

              {q.type === "text" ? (
                <div className="stc_text_placeholder">
                  <FiAlignLeft />
                  <span>Candidate will type their answer here...</span>
                </div>
              ) : (
                <div className="stc_options_list">
                  {q.options.map((opt, optIdx) => (
                    <div className="stc_option_row" key={optIdx}>
                      {q.type === "single" ? (
                        <FiCircle className="stc_option_icon" />
                      ) : (
                        <FiSquare className="stc_option_icon" />
                      )}
                      <input
                        type="text"
                        className="stc_input_full stc_option_input"
                        placeholder={`Option ${optIdx + 1}`}
                        value={opt}
                        onChange={(e) =>
                          onOptionTextChange(qIdx, optIdx, e.target.value)
                        }
                      />
                      {q.options.length > 1 && (
                        <button
                          type="button"
                          className="stc_option_delete_btn"
                          onClick={() => onDeleteOption(qIdx, optIdx)}
                          title="Remove option"
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="stc_add_option_btn"
                    onClick={() => onAddOption(qIdx)}
                  >
                    <FiPlus /> Add Option
                  </button>
                </div>
              )}

              <div className="stc_answer_key_section">
                <div className="stc_answer_key_head">
                  <span className="stc_answer_key_label">Answer Key</span>
                  <span className="stc_optional_badge">OPTIONAL</span>
                </div>
                {q.type === "text" ? (
                  <textarea
                    className="stc_input_full"
                    placeholder="Expected answer (optional)..."
                    value={q.correctText || ""}
                    onChange={(e) =>
                      onCorrectTextChange(qIdx, e.target.value)
                    }
                    rows={2}
                  />
                ) : (
                  <div className="stc_answer_options">
                    {q.options.length === 0 ? (
                      <span className="stc_answer_empty">
                        Add options to mark a correct answer.
                      </span>
                    ) : (
                      q.options.map((opt, optIdx) => {
                        const isCorrect = (q.correctAnswers || []).includes(
                          optIdx
                        );
                        const handler =
                          q.type === "single"
                            ? () => onToggleCorrectSingle(qIdx, optIdx)
                            : () => onToggleCorrectMultiple(qIdx, optIdx);
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            className={`stc_answer_opt${
                              isCorrect ? " stc_answer_correct" : ""
                            }`}
                            onClick={handler}
                          >
                            {isCorrect ? (
                              <FiCheckCircle />
                            ) : q.type === "single" ? (
                              <FiCircle />
                            ) : (
                              <FiSquare />
                            )}
                            <span>{opt || `Option ${optIdx + 1}`}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              <div className="stc_q_toolbar">
                <label className="stc_required_toggle">
                  <input
                    type="checkbox"
                    checked={!!q.required}
                    onChange={() => onToggleRequired(qIdx)}
                  />
                  <span>Required</span>
                </label>
                <div className="stc_q_toolbar_actions">
                  <button
                    title="Move Up"
                    disabled={qIdx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(qIdx);
                    }}
                  >
                    <FiArrowUp />
                  </button>
                  <button
                    title="Move Down"
                    disabled={qIdx === gfState.questions.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(qIdx);
                    }}
                  >
                    <FiArrowDown />
                  </button>
                  <button
                    title="Duplicate"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateQuestion(qIdx);
                    }}
                  >
                    <FiCopy />
                  </button>
                  <button
                    title="Delete"
                    className="stc_q_toolbar_danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteQuestion(qIdx);
                    }}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button className="stc_add_btn" onClick={onAddQuestion}>
          <FiPlus /> Add Question
        </button>
      </div>
    </>
  );

  const renderPreview = () => (
    <div className="stc_modal_overlay" onClick={onClosePreview}>
      <div
        className="stc_preview_modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="stc_preview_header">
          <span className="stc_preview_badge">Preview · Candidate View</span>
          <button
            className="stc_modal_close"
            onClick={onClosePreview}
            title="Close"
          >
            <FiX />
          </button>
        </div>
        <div className="stc_preview_body">
          <h2 className="stc_preview_title">
            {previewData.title || "Untitled Test"}
          </h2>
          {previewData.description && (
            <p className="stc_preview_desc">{previewData.description}</p>
          )}
          <div className="stc_preview_meta">
            <span>
              <FiClock /> {previewData.duration} min
            </span>
            <span>
              <FiAward /> {(previewData.questions || []).length} questions
            </span>
            <span>
              <FiCheckCircle /> {previewData.passScore}% pass
            </span>
          </div>

          {(previewData.questions || []).map((q, qIdx) => {
            const type = q.type || "single";
            return (
              <div className="stc_preview_qcard" key={q.id || qIdx}>
                <div className="stc_preview_qhead">
                  <span className="stc_preview_qnum">{qIdx + 1}.</span>
                  <span className="stc_preview_qtext">
                    {q.question || <em>Untitled question</em>}
                  </span>
                  {q.required && (
                    <span className="stc_required_star">*</span>
                  )}
                </div>

                {type === "text" ? (
                  <textarea
                    className="stc_input_full"
                    placeholder="Your answer..."
                    rows={3}
                    value={previewAnswers[qIdx] || ""}
                    onChange={(e) =>
                      onChangePreviewText(qIdx, e.target.value)
                    }
                    disabled={previewSubmitted}
                  />
                ) : (
                  <div
                    className={
                      type === "multiple"
                        ? "stc_checkbox_group"
                        : "stc_radio_group"
                    }
                  >
                    {(q.options || [])
                      .filter((o) => o && o.trim())
                      .map((opt, optIdx) => {
                        const isMulti = type === "multiple";
                        const sel = isMulti
                          ? (previewAnswers[qIdx] || []).includes(optIdx)
                          : previewAnswers[qIdx] === optIdx;
                        return (
                          <label
                            key={optIdx}
                            className={
                              isMulti
                                ? "stc_checkbox_label"
                                : "stc_radio_label"
                            }
                          >
                            <input
                              type={isMulti ? "checkbox" : "radio"}
                              name={`preview_q_${qIdx}`}
                              checked={!!sel}
                              onChange={() =>
                                onSelectPreviewOption(qIdx, optIdx)
                              }
                              disabled={previewSubmitted}
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="stc_preview_footer">
            <button
              className="stc_save_btn"
              onClick={onSubmitPreview}
              disabled={previewSubmitted}
            >
              {previewSubmitted ? (
                <>
                  <FiCheckCircle /> Submitted
                </>
              ) : (
                "Submit Test"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="stc_main_wrapper">
      <div className="stc_container">
        {view === "home" && renderHome()}
        {view === "builder" && renderBuilder()}
        {view === "preview" && previewData && renderPreview()}

        <ToastContainer position="top-right" autoClose={3500} />

        {confirmDelete && (
          <div
            className="stc_modal_overlay"
            onClick={() => setConfirmDelete(null)}
          >
            <div
              className="stc_confirm_modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Test?</h3>
              <p>This will permanently delete the test. This action cannot be undone.</p>
              <div className="stc_confirm_actions">
                <button
                  className="stc_secondary_btn"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
                <button
                  className="stc_danger_btn"
                  onClick={confirmDeleteTest}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <FiLoader className="stc_spin_icon" /> Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 /> Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScreeningTestCreation;
