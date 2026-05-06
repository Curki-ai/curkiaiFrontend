import React, { useCallback, useEffect, useState } from "react";
import "./LMSLearner.css";
import LearnerCatalog from "./LearnerCatalog";
import CourseDetail from "./CourseDetail";
import CoursePlayer from "./CoursePlayer";
import {
  myCoursesApi,
  getLearnerCourseApi,
  updateLearnerProgressApi,
  submitQuizAttemptApi,
} from "./api";

// Convert the backend's enrollment.lessonStates shape into the local
// { completed: { [lessonId]: true }, quizScores: { [lessonId]: pct } } shape
// that the existing player + viewer components consume.
const lessonStatesToProgress = (lessonStates = {}) => {
  const completed = {};
  const quizScores = {};
  for (const [id, s] of Object.entries(lessonStates)) {
    if (s?.completed) completed[id] = true;
    if (s?.quizScore !== undefined) quizScores[id] = s.quizScore;
  }
  return { completed, quizScores };
};

const initials = (str = "") =>
  str
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || "?";

const LMSLearner = ({ user }) => {
  const email = user?.email || "";

  const [candidate, setCandidate] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [view, setView] = useState("catalog"); // 'catalog' | 'detail' | 'player'
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeProgress, setActiveProgress] = useState({
    completed: {},
    quizScores: {},
  });
  const [activeLoading, setActiveLoading] = useState(false);

  // ── Initial catalog load ───────────────────────────────────────────
  useEffect(() => {
    if (!email) {
      setLoading(false);
      setError("No email on session — please sign in again.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    myCoursesApi(email)
      .then((data) => {
        if (cancelled) return;
        setCandidate(data?.candidate || null);
        setCourses(data?.courses || []);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[LMS v2][LMSLearner] myCourses failed", err);
        setError(err.response?.data?.error || "Failed to load your courses.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [email]);

  const refreshCourseSummary = useCallback((courseId, progress, status) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, progress, status } : c))
    );
  }, []);

  const openDetail = async (id) => {
    setView("detail");
    setActiveLoading(true);
    setActiveCourse(null);
    setActiveProgress({ completed: {}, quizScores: {} });
    try {
      const data = await getLearnerCourseApi({ courseId: id, email });
      setActiveCourse(data.course);
      setActiveProgress(lessonStatesToProgress(data.enrollment?.lessonStates));
    } catch (err) {
      console.error("[LMS v2][LMSLearner] getLearnerCourse failed", err);
      setError(err.response?.data?.error || "Failed to open course.");
      setView("catalog");
    } finally {
      setActiveLoading(false);
    }
  };

  const enterPlayer = () => setView("player");
  const backToCatalog = () => {
    setView("catalog");
    setActiveCourse(null);
  };
  const backToDetail = () => setView("detail");

  // Fired by LessonViewer for both non-quiz "Mark Complete" and quiz submit.
  // For quizzes, `extra.quizAnswers` is set; we route to the quiz-attempt API
  // and return the server-graded result so the QuizView can render it.
  const markLessonComplete = async (lessonId, extra = {}) => {
    if (!activeCourse) return undefined;

    if (extra.quizAnswers) {
      try {
        const resp = await submitQuizAttemptApi({
          email,
          courseId: activeCourse.id,
          lessonId,
          answers: extra.quizAnswers,
        });
        const result = resp.result || {};
        setActiveProgress((p) => ({
          ...p,
          quizScores: { ...p.quizScores, [lessonId]: result.score },
          completed: result.passed
            ? { ...p.completed, [lessonId]: true }
            : p.completed,
        }));
        if (resp.enrollment) {
          refreshCourseSummary(
            activeCourse.id,
            resp.enrollment.progress,
            resp.enrollment.status
          );
        }
        return {
          score: result.score,
          passed: result.passed,
          breakdown: result.breakdown,
        };
      } catch (err) {
        console.error("[LMS v2][LMSLearner] submitQuizAttempt failed", err);
        setError(err.response?.data?.error || "Quiz submission failed.");
        return undefined;
      }
    }

    try {
      const enrollment = await updateLearnerProgressApi({
        email,
        courseId: activeCourse.id,
        lessonId,
        completed: true,
        viewed: true,
      });
      if (enrollment) {
        setActiveProgress(lessonStatesToProgress(enrollment.lessonStates));
        refreshCourseSummary(
          activeCourse.id,
          enrollment.progress,
          enrollment.status
        );
      }
      return undefined;
    } catch (err) {
      console.error("[LMS v2][LMSLearner] updateProgress failed", err);
      setError(err.response?.data?.error || "Could not save progress.");
      return undefined;
    }
  };

  const displayName = candidate?.candidateName || user?.displayName || email;
  const avatarText = initials(displayName);

  return (
    <div className="ulrn-page">
      <div className="ulrn-wrap">
        <div className="ulrn-topbar">
          <div className="ulrn-brand" onClick={backToCatalog}>
            <span className="ulrn-brand-mark">🎓</span>
            <span className="ulrn-brand-text">My Learning</span>
          </div>
          <div className="ulrn-topbar-right">
            <button className="ulrn-icon-btn" title="Notifications">🔔</button>
            <div className="ulrn-user">
              <div className="ulrn-avatar">{avatarText}</div>
              <div className="ulrn-user-meta">
                <span className="ulrn-user-name">{displayName}</span>
                <span className="ulrn-user-role">Learner</span>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "10px 16px",
              background: "#fff5f5",
              borderBottom: "1px solid #ffd0d0",
              color: "#c0392b",
              fontSize: 13,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              style={{ background: "none", border: 0, cursor: "pointer", color: "#c0392b" }}
            >
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="ulrn-empty">
            <span className="ulrn-empty-icon">⏳</span>
            <span>Loading your courses…</span>
          </div>
        ) : view === "catalog" ? (
          <LearnerCatalog
            courses={courses}
            displayName={displayName}
            onOpen={openDetail}
          />
        ) : activeLoading || !activeCourse ? (
          <div className="ulrn-empty">
            <span className="ulrn-empty-icon">⏳</span>
            <span>Loading course…</span>
          </div>
        ) : view === "detail" ? (
          <CourseDetail
            course={activeCourse}
            progress={activeProgress}
            onBack={backToCatalog}
            onEnter={enterPlayer}
          />
        ) : view === "player" ? (
          <CoursePlayer
            course={activeCourse}
            progress={activeProgress}
            onBack={backToDetail}
            onComplete={markLessonComplete}
          />
        ) : null}
      </div>
    </div>
  );
};

export default LMSLearner;
