import React, { useState, useMemo } from "react";
import ConfirmDialog from "./ConfirmDialog";

const CourseLibrary = ({ courses, onOpen, onCreate, onDelete, onPreview }) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | published | draft
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const requestDelete = (course) => {
    setDeleteError("");
    setDeleteTarget(course);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      await onDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError("Could not delete this course. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (filter !== "all" && c.status !== filter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [courses, search, filter]);

  const stats = useMemo(() => {
    const published = courses.filter((c) => c.status === "published").length;
    const draft = courses.length - published;
    const totalEnroll = courses.reduce((s, c) => s + (c.enrollments || 0), 0);
    const totalComplete = courses.reduce((s, c) => s + (c.completions || 0), 0);
    return { published, draft, totalEnroll, totalComplete };
  }, [courses]);

  return (
    <div className="ulms-library">
      <div className="ulms-lib-header">
        <div>
          <h2 className="ulms-lib-title">Training Courses</h2>
          <p className="ulms-lib-subtitle">
            Manage onboarding and compliance training for your staff
          </p>
        </div>
        <div className="ulms-lib-actions">
          <input
            className="ulms-lib-search"
            placeholder="Search courses, tags…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="ulms-lib-new-btn" onClick={onCreate}>
            + New Course
          </button>
        </div>
      </div>

      <div className="ulms-lib-stats">
        <div className="ulms-lib-stat-card">
          <span className="ulms-lib-stat-label">Total Courses</span>
          <span className="ulms-lib-stat-num">{courses.length}</span>
        </div>
        <div className="ulms-lib-stat-card">
          <span className="ulms-lib-stat-label">Published</span>
          <span className="ulms-lib-stat-num">{stats.published}</span>
        </div>
        <div className="ulms-lib-stat-card">
          <span className="ulms-lib-stat-label">Drafts</span>
          <span className="ulms-lib-stat-num">{stats.draft}</span>
        </div>
        <div className="ulms-lib-stat-card">
          <span className="ulms-lib-stat-label">Total Enrolled</span>
          <span className="ulms-lib-stat-num">{stats.totalEnroll}</span>
        </div>
        <div className="ulms-lib-stat-card">
          <span className="ulms-lib-stat-label">Completions</span>
          <span className="ulms-lib-stat-num">{stats.totalComplete}</span>
        </div>
      </div>

      <div className="ulms-lib-filterbar">
        {[
          { id: "all", label: "All" },
          { id: "published", label: "Published" },
          { id: "draft", label: "Drafts" },
        ].map((f) => (
          <button
            key={f.id}
            className={`ulms-lib-filter ${filter === f.id ? "active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="ulms-empty-state">
          <div className="ulms-empty-icon">📭</div>
          <div className="ulms-empty-text">No courses match your filters</div>
        </div>
      ) : (
        <div className="ulms-course-grid">
          {filtered.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              onOpen={onOpen}
              onDelete={requestDelete}
              onPreview={onPreview}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete course?"
        confirmLabel="Delete"
        busyLabel="Deleting..."
        cancelLabel="Cancel"
        danger
        busy={isDeleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
      >
        {`Are you sure you want to delete `}
        <strong>{deleteTarget?.title || "this course"}</strong>
        {`? This action cannot be undone.`}
      </ConfirmDialog>
    </div>
  );
};

const CourseCard = ({ course, onOpen, onDelete, onPreview }) => {
  const lessonCount = (course.sections || []).reduce(
    (s, sec) => s + (sec.lessons || []).length,
    0
  );

  return (
    <div className="ulms-course-card">
      <div className="ulms-card-banner" style={{ background: course.color }}>
        <span>{course.thumb}</span>
      </div>
      <div className="ulms-card-body">
        <span className={`ulms-card-status ${course.status}`}>
          {course.status === "published" ? "Published" : "Draft"}
        </span>
        <div className="ulms-card-title">{course.title}</div>
        {course.desc && <div className="ulms-card-meta">{course.desc}</div>}
        <div className="ulms-card-stats">
          <span>{course.sections?.length || 0} sections</span>
          <span>•</span>
          <span>{lessonCount} lessons</span>
          {course.duration ? (
            <>
              <span>•</span>
              <span>{course.duration}</span>
            </>
          ) : null}
        </div>
      </div>
      <div className="ulms-card-actions">
        <button className="ulms-card-edit-btn" onClick={() => onOpen(course.id)}>
          Edit
        </button>
        <button
          className="ulms-card-prev-btn"
          title="Preview"
          onClick={() => onPreview && onPreview(course.id)}
        >
          Preview
        </button>
        <button
          className="ulms-card-prev-btn ulms-danger"
          title="Delete"
          onClick={() => onDelete(course)}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default CourseLibrary;
