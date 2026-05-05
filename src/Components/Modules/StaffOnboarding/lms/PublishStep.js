import React, { useMemo } from "react";

const truncate = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const PublishStep = ({ course, completion, onPublishToggle }) => {
  const stats = useMemo(() => {
    const sections = course.sections || [];
    const lessons = sections.flatMap((s) => s.lessons || []);
    const published = lessons.filter((l) => l.published).length;
    const quizzes = lessons.filter((l) => l.type === "quiz").length;
    const videos = lessons.filter((l) => l.type === "video").length;
    return {
      sections: sections.length,
      lessons: lessons.length,
      published,
      videos,
      quizzes,
    };
  }, [course]);

  const checks = [
    { id: "info", ok: completion.info, label: "Course info filled out" },
    { id: "curriculum", ok: completion.curriculum, label: "At least one lesson added" },
    { id: "thumb", ok: !!course.thumb, label: "Thumbnail icon picked" },
    {
      id: "objectives",
      ok: (course.objectives || []).filter((o) => o && o.trim()).length >= 1,
      label: "At least one learning objective",
    },
    {
      id: "lessons-published",
      ok: stats.published >= 1,
      label: "At least one lesson is published",
    },
  ];

  const allReady = checks.every((c) => c.ok);

  return (
    <div className="ulms-step-content ulms-publish-wrap">
      <div className="ulms-pub-grid">
        <div className="ulms-pub-card">
          <h3>✅ Readiness</h3>
          <div className="ulms-readiness-list">
            {checks.map((c) => (
              <div className="ulms-check-row" key={c.id}>
                <span className={c.ok ? "ulms-check-ok" : "ulms-check-warn"}>
                  {c.ok ? "✓" : "!"}
                </span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
          <div className={`ulms-ready-banner ${allReady ? "" : "warn"}`}>
            {allReady ? "🎉 Ready to publish!" : "⚠️  Resolve the warnings above before publishing."}
          </div>
        </div>

        <div className="ulms-pub-card">
          <h3>📋 Course Card Preview</h3>
          <div className="ulms-course-preview-card" style={{ background: course.color || "#7c5cbf" }}>
            <div className="ulms-cpc-banner">
              <div className="ulms-cpc-emoji">{course.thumb || "📚"}</div>
              <div className="ulms-cpc-info">
                <h4>{course.title || "Untitled Course"}</h4>
                <p>{course.desc ? truncate(course.desc, 90) : "Add a description to preview here."}</p>
              </div>
            </div>
            <div className="ulms-cpc-meta">
              <span className="ulms-cpc-meta-item">📚 {stats.lessons} lessons</span>
              <span className="ulms-cpc-meta-item">⏱ {course.duration || "—"}</span>
              <span className="ulms-cpc-meta-item">❓ {stats.quizzes} quizzes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ulms-pub-card">
        <h3>📊 Summary</h3>
        <div className="ulms-summary-grid">
          <div className="ulms-sum-card">
            <span className="ulms-sum-num">{stats.sections}</span>
            <span className="ulms-sum-label">Sections</span>
          </div>
          <div className="ulms-sum-card">
            <span className="ulms-sum-num">{stats.lessons}</span>
            <span className="ulms-sum-label">Lessons</span>
          </div>
          <div className="ulms-sum-card">
            <span className="ulms-sum-num">{stats.videos}</span>
            <span className="ulms-sum-label">Videos</span>
          </div>
          <div className="ulms-sum-card">
            <span className="ulms-sum-num">{stats.quizzes}</span>
            <span className="ulms-sum-label">Quizzes</span>
          </div>
          <div className="ulms-sum-card">
            <span className="ulms-sum-num">{stats.published}</span>
            <span className="ulms-sum-label">Published</span>
          </div>
        </div>
      </div>

      <div className="ulms-pub-card">
        <h3>📚 Curriculum Overview</h3>
        {(course.sections || []).map((sec) => (
          <div className="ulms-ov-sec" key={sec.id}>
            <div className="ulms-ov-sec-name">
              {sec.title} <span className="ulms-ov-sec-count">· {sec.lessons.length} lessons</span>
            </div>
            <div className="ulms-ov-les-list">
              {sec.lessons.length === 0 ? (
                <span className="ulms-ov-empty">No lessons yet</span>
              ) : (
                sec.lessons.map((l) => (
                  <span
                    key={l.id}
                    className={`ulms-ov-les-chip ${l.published ? "pub" : "draft"}`}
                  >
                    {l.title}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="ulms-pub-actions">
        <button className="ulms-save-draft-btn">Save as Draft</button>
        <button
          className="ulms-big-pub-btn"
          disabled={!allReady && course.status !== "published"}
          onClick={onPublishToggle}
        >
          {course.status === "published" ? "Unpublish Course" : "Publish Course"}
        </button>
      </div>
    </div>
  );
};

export default PublishStep;
