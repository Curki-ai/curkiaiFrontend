import React, { useMemo, useState } from "react";
import LessonViewer from "./LessonViewer";

const TYPE_ICONS = { video: "🎬", text: "📝", quiz: "❓", file: "📎" };

const CoursePlayer = ({ course, progress, onBack, onComplete }) => {
  const flatLessons = useMemo(() => {
    const list = [];
    (course.sections || []).forEach((sec) => {
      (sec.lessons || []).forEach((les) => {
        list.push({ section: sec, lesson: les });
      });
    });
    return list;
  }, [course]);

  const completed = progress?.completed || {};

  const [activeIdx, setActiveIdx] = useState(() => {
    const firstUnlockedIncomplete = flatLessons.findIndex(
      ({ lesson }) => lesson.published && !completed[lesson.id]
    );
    if (firstUnlockedIncomplete >= 0) return firstUnlockedIncomplete;
    const firstUnlocked = flatLessons.findIndex(({ lesson }) => lesson.published);
    return firstUnlocked >= 0 ? firstUnlocked : 0;
  });

  const [openSections, setOpenSections] = useState(() => {
    const o = {};
    (course.sections || []).forEach((s) => {
      o[s.id] = true;
    });
    return o;
  });

  const active = flatLessons[activeIdx] || null;
  const totalLessons = flatLessons.length;
  const completedCount = flatLessons.filter(
    ({ lesson }) => completed[lesson.id]
  ).length;
  const pct = totalLessons
    ? Math.round((completedCount / totalLessons) * 100)
    : 0;

  const goPrev = () => setActiveIdx((i) => Math.max(0, i - 1));
  const goNext = () =>
    setActiveIdx((i) => Math.min(flatLessons.length - 1, i + 1));

  const handleComplete = (extra) => {
    if (!active) return undefined;
    // Return the promise so the quiz view can await the server-graded result.
    return onComplete(active.lesson.id, extra || {});
  };

  const toggleSection = (sid) => {
    setOpenSections((o) => ({ ...o, [sid]: !o[sid] }));
  };

  const isFullyComplete = totalLessons > 0 && completedCount === totalLessons;

  return (
    <div className="ulrn-player">
      <div className="ulrn-player-topbar">
        <button className="ulrn-back-btn" onClick={onBack}>
          ← Course Overview
        </button>
        <div className="ulrn-player-title">{course.title}</div>
        <div className="ulrn-player-prog">
          <div className="ulrn-player-prog-text">{pct}% complete</div>
          <div className="ulrn-player-prog-bar">
            <div
              className="ulrn-player-prog-fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {isFullyComplete && (
        <div className="ulrn-completion-banner">
          🎉 You've finished this course! Feel free to revisit any lesson.
        </div>
      )}

      <div className="ulrn-player-body">
        <aside className="ulrn-player-side">
          <div className="ulrn-side-header">
            <span>Curriculum</span>
            <span className="ulrn-side-meta">
              {completedCount}/{totalLessons}
            </span>
          </div>
          {(course.sections || []).map((sec) => {
            const secLessons = sec.lessons || [];
            const secDone = secLessons.filter((l) => completed[l.id]).length;
            return (
              <div key={sec.id} className="ulrn-side-sec">
                <div
                  className="ulrn-side-sec-hdr"
                  onClick={() => toggleSection(sec.id)}
                >
                  <span className="ulrn-side-sec-caret">
                    {openSections[sec.id] ? "▾" : "▸"}
                  </span>
                  <span className="ulrn-side-sec-title">{sec.title}</span>
                  <span className="ulrn-side-sec-count">
                    {secDone}/{secLessons.length}
                  </span>
                </div>
                {openSections[sec.id] && (
                  <div className="ulrn-side-lessons">
                    {secLessons.map((l) => {
                      const flatIdx = flatLessons.findIndex(
                        ({ lesson }) => lesson.id === l.id
                      );
                      const isActive = flatIdx === activeIdx;
                      const isDone = !!completed[l.id];
                      const locked = !l.published;
                      return (
                        <div
                          key={l.id}
                          className={`ulrn-side-les ${isActive ? "active" : ""} ${
                            isDone ? "done" : ""
                          } ${locked ? "locked" : ""}`}
                          onClick={() => !locked && setActiveIdx(flatIdx)}
                          title={locked ? "Coming soon" : ""}
                        >
                          <span className="ulrn-side-les-icon">
                            {locked
                              ? "🔒"
                              : isDone
                              ? "✓"
                              : TYPE_ICONS[l.type] || "📄"}
                          </span>
                          <div className="ulrn-side-les-text">
                            <span className="ulrn-side-les-name">{l.title}</span>
                            <span className="ulrn-side-les-dur">
                              {l.type} · {l.duration}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        <main className="ulrn-player-main">
          {active ? (
            <LessonViewer
              key={active.lesson.id}
              section={active.section}
              lesson={active.lesson}
              isCompleted={!!completed[active.lesson.id]}
              quizScore={progress?.quizScores?.[active.lesson.id]}
              onComplete={handleComplete}
              onPrev={activeIdx > 0 ? goPrev : null}
              onNext={
                activeIdx < flatLessons.length - 1 ? goNext : null
              }
            />
          ) : (
            <div className="ulrn-empty">
              <span className="ulrn-empty-icon">📚</span>
              <span>No lessons available yet.</span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CoursePlayer;
