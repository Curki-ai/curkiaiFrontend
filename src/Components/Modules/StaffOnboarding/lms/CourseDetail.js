import React from "react";

const TYPE_ICONS = { video: "🎬", text: "📝", quiz: "❓", file: "📎" };

const CourseDetail = ({ course, progress, onBack, onEnter }) => {
  const lessons = (course.sections || []).flatMap((s) => s.lessons || []);
  const total = lessons.length;
  const done = lessons.filter((l) => progress?.completed?.[l.id]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const ctaLabel =
    pct === 100 ? "Review Course" : pct > 0 ? "Continue Learning" : "Start Course";

  const objectives = (course.objectives || []).filter(Boolean);
  const requirements = (course.requirements || []).filter(Boolean);

  return (
    <div className="ulrn-detail">
      <button className="ulrn-back-btn ulrn-detail-back" onClick={onBack}>
        ← Back to Courses
      </button>

      <div className="ulrn-detail-hero" style={{ background: course.color }}>
        <div className="ulrn-detail-hero-emoji">{course.thumb}</div>
        <div className="ulrn-detail-hero-info">
          <span className="ulrn-detail-cat">{course.category}</span>
          <h1>{course.title}</h1>
          <p>{course.desc}</p>
          <div className="ulrn-detail-meta">
            <span>📚 {total} lessons</span>
            <span>⏱ {course.duration || "—"}</span>
            <span>👤 {course.level || "All staff"}</span>
          </div>
        </div>
      </div>

      <div className="ulrn-detail-grid">
        <div className="ulrn-detail-main">
          {objectives.length > 0 && (
            <section className="ulrn-detail-card">
              <h3>What you'll learn</h3>
              <ul className="ulrn-detail-list ulrn-objs">
                {objectives.map((o, i) => (
                  <li key={i}>
                    <span className="ulrn-detail-bullet ok">✓</span>
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {requirements.length > 0 && (
            <section className="ulrn-detail-card">
              <h3>Prerequisites</h3>
              <ul className="ulrn-detail-list">
                {requirements.map((r, i) => (
                  <li key={i}>
                    <span className="ulrn-detail-bullet">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="ulrn-detail-card">
            <h3>Curriculum</h3>
            {(course.sections || []).map((sec) => {
              const secLessons = sec.lessons || [];
              const secDone = secLessons.filter(
                (l) => progress?.completed?.[l.id]
              ).length;
              return (
                <div key={sec.id} className="ulrn-detail-sec">
                  <div className="ulrn-detail-sec-head">
                    <span className="ulrn-detail-sec-name">{sec.title}</span>
                    <span className="ulrn-detail-sec-count">
                      {secDone} / {secLessons.length} ·{" "}
                      {secLessons.length} lesson
                      {secLessons.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="ulrn-detail-sec-lessons">
                    {secLessons.length === 0 && (
                      <div className="ulrn-detail-les empty">No lessons in this section yet.</div>
                    )}
                    {secLessons.map((l) => {
                      const isDone = !!progress?.completed?.[l.id];
                      const locked = !l.published;
                      return (
                        <div
                          key={l.id}
                          className={`ulrn-detail-les ${locked ? "locked" : ""} ${isDone ? "done" : ""}`}
                        >
                          <span className="ulrn-detail-les-icon">
                            {locked ? "🔒" : isDone ? "✓" : TYPE_ICONS[l.type] || "📄"}
                          </span>
                          <span className="ulrn-detail-les-name">{l.title}</span>
                          <span className="ulrn-detail-les-dur">{l.duration}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </section>
        </div>

        <aside className="ulrn-detail-side">
          <div className="ulrn-detail-progress">
            <div className="ulrn-detail-progress-row">
              <span>Your progress</span>
              <strong>{pct}%</strong>
            </div>
            <div className="ulrn-detail-progress-bar">
              <div
                className="ulrn-detail-progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="ulrn-detail-progress-meta">
              {done} of {total} lessons completed
            </div>
          </div>

          <button className="ulrn-detail-cta" onClick={onEnter}>
            {ctaLabel} →
          </button>

          {(course.tags || []).length > 0 && (
            <div className="ulrn-detail-tags">
              {course.tags.map((t) => (
                <span key={t} className="ulrn-detail-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default CourseDetail;
