import React, { useMemo, useState } from "react";

// Stats are sourced from the catalog summary the backend returns
// (lessonCount + progress% + status). The legacy mock-data shape is supported
// as a fallback so this component still works if someone passes full courses.
const calcStats = (course) => {
  if (course.lessonCount !== undefined && course.progress !== undefined) {
    const total = course.lessonCount || 0;
    const pct = course.progress || 0;
    const done = Math.round((pct / 100) * total);
    const started =
      pct > 0 ||
      course.status === "in_progress" ||
      course.status === "completed";
    return { total, done, pct, started };
  }
  const lessons = (course.sections || []).flatMap((s) => s.lessons || []);
  const total = lessons.length;
  const pct = 0;
  return { total, done: 0, pct, started: false };
};

const LearnerCatalog = ({ courses, displayName, onOpen }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const enriched = useMemo(
    () => courses.map((c) => ({ course: c, stats: calcStats(c) })),
    [courses]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enriched.filter(({ course, stats }) => {
      if (filter === "notstarted" && stats.started) return false;
      if (filter === "inprogress" && !(stats.started && stats.pct < 100))
        return false;
      if (filter === "completed" && stats.pct !== 100) return false;
      if (!q) return true;
      return (
        course.title.toLowerCase().includes(q) ||
        (course.category || "").toLowerCase().includes(q) ||
        (course.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [enriched, search, filter]);

  const aggregate = useMemo(() => {
    let inprog = 0;
    let completed = 0;
    let lessonsDone = 0;
    enriched.forEach(({ stats }) => {
      if (stats.pct === 100) completed += 1;
      else if (stats.started) inprog += 1;
      lessonsDone += stats.done;
    });
    return { total: enriched.length, inprog, completed, lessonsDone };
  }, [enriched]);

  const continueCard = useMemo(() => {
    const inProgress = enriched
      .filter(({ stats }) => stats.started && stats.pct < 100)
      .sort((a, b) => b.stats.pct - a.stats.pct)[0];
    return inProgress || null;
  }, [enriched]);

  return (
    <div className="ulrn-cat">
      <div className="ulrn-cat-hero">
        <div>
          <h1>
            Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""} 👋
          </h1>
          <p>Pick up where you left off or explore something new today.</p>
        </div>
        <div className="ulrn-cat-search-wrap">
          <span className="ulrn-cat-search-icon">🔍</span>
          <input
            className="ulrn-cat-search"
            placeholder="Search courses, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="ulrn-cat-stats">
        <div className="ulrn-stat-tile">
          <span className="ulrn-stat-label">Available</span>
          <span className="ulrn-stat-num">{aggregate.total}</span>
        </div>
        <div className="ulrn-stat-tile">
          <span className="ulrn-stat-label">In Progress</span>
          <span className="ulrn-stat-num">{aggregate.inprog}</span>
        </div>
        <div className="ulrn-stat-tile">
          <span className="ulrn-stat-label">Completed</span>
          <span className="ulrn-stat-num">{aggregate.completed}</span>
        </div>
        <div className="ulrn-stat-tile">
          <span className="ulrn-stat-label">Lessons Done</span>
          <span className="ulrn-stat-num">{aggregate.lessonsDone}</span>
        </div>
      </div>

      {continueCard && (
        <div
          className="ulrn-continue-card"
          onClick={() => onOpen(continueCard.course.id)}
        >
          <div
            className="ulrn-continue-emoji"
            style={{ background: continueCard.course.color }}
          >
            {continueCard.course.thumb}
          </div>
          <div className="ulrn-continue-info">
            <span className="ulrn-continue-eyebrow">Continue learning</span>
            <h3>{continueCard.course.title}</h3>
            <div className="ulrn-continue-prog">
              <div className="ulrn-continue-prog-bar">
                <div
                  className="ulrn-continue-prog-fill"
                  style={{ width: `${continueCard.stats.pct}%` }}
                />
              </div>
              <span>
                {continueCard.stats.done} / {continueCard.stats.total} lessons ·{" "}
                {continueCard.stats.pct}%
              </span>
            </div>
          </div>
          <button className="ulrn-continue-cta">Resume →</button>
        </div>
      )}

      <div className="ulrn-cat-tabs">
        {[
          { id: "all", label: "All Courses" },
          { id: "notstarted", label: "Not Started" },
          { id: "inprogress", label: "In Progress" },
          { id: "completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.id}
            className={`ulrn-cat-tab ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ulrn-empty">
          <span className="ulrn-empty-icon">📭</span>
          <span>No courses match your filters.</span>
        </div>
      ) : (
        <div className="ulrn-cat-grid">
          {filtered.map(({ course, stats }) => (
            <CourseTile
              key={course.id}
              course={course}
              stats={stats}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CourseTile = ({ course, stats, onOpen }) => {
  const ctaLabel =
    stats.pct === 100 ? "Review" : stats.started ? "Continue" : "Start Course";

  return (
    <div className="ulrn-tile" onClick={() => onOpen(course.id)}>
      <div className="ulrn-tile-banner" style={{ background: course.color }}>
        <span className="ulrn-tile-emoji">{course.thumb}</span>
        {stats.pct === 100 && (
          <span className="ulrn-tile-badge">✓ Completed</span>
        )}
      </div>
      <div className="ulrn-tile-body">
        <span className="ulrn-tile-cat">{course.category || "General"}</span>
        <h3 className="ulrn-tile-title">{course.title}</h3>
        <p className="ulrn-tile-desc">{course.desc}</p>
        <div className="ulrn-tile-meta">
          <span>📚 {stats.total} lessons</span>
          {course.duration && <span>⏱ {course.duration}</span>}
        </div>
        <div className="ulrn-tile-prog">
          <div className="ulrn-tile-prog-row">
            <span>
              {stats.done} / {stats.total} lessons
            </span>
            <span>{stats.pct}%</span>
          </div>
          <div className="ulrn-tile-prog-bar">
            <div
              className="ulrn-tile-prog-fill"
              style={{ width: `${stats.pct}%` }}
            />
          </div>
        </div>
        <button
          className="ulrn-tile-cta"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(course.id);
          }}
        >
          {ctaLabel} →
        </button>
      </div>
    </div>
  );
};

export default LearnerCatalog;
