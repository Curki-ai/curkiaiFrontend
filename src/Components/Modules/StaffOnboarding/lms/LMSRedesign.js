import React, { useEffect, useRef, useState } from "react";
import "./LMSRedesign.css";
// CoursePlayer markup uses .ulrn-* classes defined in LMSLearner.css; we
// reuse the learner player for the admin's "Preview" flow.
import "./LMSLearner.css";
import { blankCourse } from "./lmsMockData";
import CourseLibrary from "./CourseLibrary";
import CourseEditor from "./CourseEditor";
import CoursePlayer from "./CoursePlayer";
import {
  listCoursesApi,
  createCourseApi,
  updateCourseApi,
  deleteCourseApi,
  setAdminEmail,
  subscribeToCourseChanges,
} from "./api";

// Auto-save debounce (ms) — long enough to avoid hammering Cosmos on every
// keystroke, short enough that the admin doesn't have to wait.
const SAVE_DEBOUNCE_MS = 800;

const LMSRedesign = ({ user, organizationId }) => {
  const [courses, setCourses] = useState([]);
  const [view, setView] = useState("library");
  const [editingId, setEditingId] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [previewProgress, setPreviewProgress] = useState({
    completed: {},
    quizScores: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error

  // Map of pending debounced saves, keyed by courseId.
  const saveTimers = useRef({});
  // Latest course payloads we want to PUT, keyed by courseId.
  const pendingPayloads = useRef({});
  // Mirror of courses so the debounced timer can read the freshest etag
  // without waiting for a re-render. Without this, two edits while a save
  // is in-flight would reuse the etag captured at edit time and 412.
  const coursesRef = useRef([]);

  useEffect(() => {
    coursesRef.current = courses;
  }, [courses]);

  const adminEmail = user?.email || "";

  // Make the admin email available to the api.js axios interceptor so every
  // LMS v2 call carries it as `x-user-email`. The backend requireOrgAccess
  // middleware checks this against the org's admins[].
  useEffect(() => {
    setAdminEmail(adminEmail);
  }, [adminEmail]);

  const cancelPendingSave = (courseId) => {
    if (saveTimers.current[courseId]) {
      clearTimeout(saveTimers.current[courseId]);
      delete saveTimers.current[courseId];
    }
    delete pendingPayloads.current[courseId];
  };

  // ── Load courses for the org ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!organizationId) {
      console.warn("[LMS v2][LMSRedesign] no organizationId — skipping list load");
      setLoading(false);
      return;
    }
    console.log("[LMS v2][LMSRedesign] loading courses for org", organizationId);
    setLoading(true);
    setError("");
    listCoursesApi(organizationId)
      .then((list) => {
        if (cancelled) return;
        console.log(`[LMS v2][LMSRedesign] loaded ${list.length} courses`);
        setCourses(list);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[LMS v2][LMSRedesign] listCourses failed", err);
        setError("Failed to load courses. Please refresh.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  // ── Real-time sync ──────────────────────────────────────────────────
  // Listen for course events broadcast by other admins of the same org.
  // Merge incoming changes into the local courses list by id so any open
  // tab updates without a refresh. The merge is idempotent: receiving
  // your own broadcast is a no-op since the data already matches.
  useEffect(() => {
    if (!organizationId) return undefined;
    const unsubscribe = subscribeToCourseChanges(organizationId, {
      onUpserted: (incoming) => {
        if (!incoming?.id) return;
        console.log("[LMS v2][sync] course upserted", incoming.id);
        setCourses((prev) => {
          const idx = prev.findIndex((c) => c.id === incoming.id);
          if (idx === -1) return [incoming, ...prev];
          // Don't overwrite a course the local user is actively editing —
          // the in-flight debounced save would lose their changes. The
          // backend etag will catch any real conflict on save.
          if (
            editingId === incoming.id &&
            saveStatus === "saving"
          ) {
            return prev;
          }
          const next = prev.slice();
          next[idx] = incoming;
          return next;
        });
      },
      onDeleted: (deletedId) => {
        console.log("[LMS v2][sync] course deleted", deletedId);
        setCourses((prev) => prev.filter((c) => c.id !== deletedId));
        if (editingId === deletedId) {
          setEditingId(null);
          setView("library");
        }
        if (previewId === deletedId) {
          setPreviewId(null);
          setView("library");
        }
      },
    });
    return unsubscribe;
  }, [organizationId, editingId, previewId, saveStatus]);

  // ── Debounced auto-save ─────────────────────────────────────────────
  const scheduleSave = (courseId, payload) => {
    pendingPayloads.current[courseId] = payload;
    setSaveStatus("saving");
    if (saveTimers.current[courseId]) clearTimeout(saveTimers.current[courseId]);
    saveTimers.current[courseId] = setTimeout(async () => {
      const body = pendingPayloads.current[courseId];
      // Always use the freshest etag we know about — the one currently in
      // state, not the one captured when the edit happened. This avoids
      // 412s when two edits straddle an in-flight PUT.
      const liveEtag =
        coursesRef.current.find((c) => c.id === courseId)?._etag || body._etag;
      console.log("[LMS v2][scheduleSave] PUT", { courseId, etag: liveEtag });
      try {
        const updated = await updateCourseApi({
          organizationId,
          courseId,
          course: body,
          etag: liveEtag,
        });
        setCourses((prev) => prev.map((c) => (c.id === courseId ? updated : c)));
        cancelPendingSave(courseId);
        setSaveStatus("saved");
        setError((e) =>
          e === "Save failed. Your changes are still in memory." ||
          e === "Someone else just saved this course — refresh to see latest."
            ? ""
            : e
        );
        setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (err) {
        console.error("[LMS v2][scheduleSave] PUT failed", {
          courseId,
          status: err.response?.status,
          data: err.response?.data,
        });
        setSaveStatus("error");
        if (err.response?.status === 412) {
          setError("Someone else just saved this course — refresh to see latest.");
        } else {
          setError("Save failed. Your changes are still in memory.");
        }
      }
    }, SAVE_DEBOUNCE_MS);
  };

  // ── Mutations ──────────────────────────────────────────────────────
  const openEditor = (id) => {
    setEditingId(id);
    setView("editor");
  };

  const backToLibrary = () => {
    setView("library");
    setEditingId(null);
  };

  const openPreview = (id) => {
    setPreviewId(id);
    setPreviewProgress({ completed: {}, quizScores: {} });
    setView("preview");
  };

  const closePreview = () => {
    setPreviewId(null);
    setView("library");
  };

  // Local-only completion handler for the admin preview. We never write to
  // enrollment APIs here — admins aren't enrolled, and a preview shouldn't
  // mutate any learner's progress. Quizzes are graded locally because the
  // admin payload still carries the `correct` index on each question.
  const previewLessonComplete = (lessonId, extra) => {
    const course = courses.find((c) => c.id === previewId);
    if (!course) return undefined;

    if (extra?.quizAnswers) {
      let lesson;
      for (const sec of course.sections || []) {
        lesson = (sec.lessons || []).find((l) => l.id === lessonId);
        if (lesson) break;
      }
      if (!lesson) return undefined;
      const questions = lesson.questions || [];
      const breakdown = questions.map((q) => ({
        questionId: q.id,
        correct: extra.quizAnswers[q.id] === q.correct,
      }));
      const correctCount = breakdown.filter((b) => b.correct).length;
      const score = questions.length
        ? Math.round((correctCount / questions.length) * 100)
        : 0;
      const passed = score >= (lesson.quiz?.passScore ?? 80);
      setPreviewProgress((p) => ({
        ...p,
        quizScores: { ...p.quizScores, [lessonId]: score },
        completed: passed
          ? { ...p.completed, [lessonId]: true }
          : p.completed,
      }));
      return { score, passed, breakdown };
    }

    setPreviewProgress((p) => ({
      ...p,
      completed: { ...p.completed, [lessonId]: true },
    }));
    return undefined;
  };

  const createCourse = async () => {
    if (!organizationId) {
      setError("Organisation not resolved yet — please wait a moment.");
      return;
    }
    try {
      // Drop the client-side id so the server assigns its own.
      const { id: _ignore, ...draft } = blankCourse();
      const created = await createCourseApi({
        organizationId,
        adminEmail,
        course: draft,
      });
      setCourses((prev) => [created, ...prev]);
      openEditor(created.id);
    } catch (err) {
      console.error("[LMS v2][createCourse] failed", err);
      setError("Failed to create course.");
    }
  };

  const updateCourse = (id, updater) => {
    setCourses((prev) => {
      const next = prev.map((c) =>
        c.id === id ? (typeof updater === "function" ? updater(c) : updater) : c
      );
      const updated = next.find((c) => c.id === id);
      if (updated) scheduleSave(id, updated);
      return next;
    });
  };

  const deleteCourse = async (id) => {
    // Don't let a queued PUT race the DELETE.
    cancelPendingSave(id);
    try {
      await deleteCourseApi({ organizationId, courseId: id });
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("[LMS v2][deleteCourse] failed", err);
      setError("Failed to delete course.");
    }
  };

  const editingCourse = courses.find((c) => c.id === editingId) || null;
  const previewCourse = courses.find((c) => c.id === previewId) || null;

  // ── Render ─────────────────────────────────────────────────────────
  if (!organizationId) {
    return (
      <div className="ulms-page">
        <div className="ulms-wrap">
          <div className="ulms-empty-state">
            <div className="ulms-empty-icon">⏳</div>
            <div className="ulms-empty-text">Resolving your organisation…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ulms-page">
      <div className="ulms-wrap">
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
          <div className="ulms-empty-state">
            <div className="ulms-empty-icon">⏳</div>
            <div className="ulms-empty-text">Loading courses…</div>
          </div>
        ) : view === "library" ? (
          <CourseLibrary
            courses={courses}
            onOpen={openEditor}
            onCreate={createCourse}
            onDelete={deleteCourse}
            onPreview={openPreview}
          />
        ) : view === "editor" && editingCourse ? (
          <CourseEditor
            course={editingCourse}
            onChange={(updater) => updateCourse(editingCourse.id, updater)}
            onBack={backToLibrary}
            saveStatus={saveStatus}
            organizationId={organizationId}
          />
        ) : view === "preview" && previewCourse ? (
          <CoursePlayer
            course={previewCourse}
            progress={previewProgress}
            onBack={closePreview}
            onComplete={previewLessonComplete}
          />
        ) : null}
      </div>
    </div>
  );
};

export default LMSRedesign;
