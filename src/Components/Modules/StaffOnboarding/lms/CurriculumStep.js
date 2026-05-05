import React, { useEffect, useState } from "react";
import LessonEditor from "./LessonEditor";
import ConfirmDialog from "./ConfirmDialog";
import { blankLesson } from "./lmsMockData";

const TYPE_ICONS = {
  video: "🎬",
  text: "📝",
  quiz: "❓",
  file: "📎",
};

const CurriculumStep = ({ course, onChange, organizationId }) => {
  const [activeKey, setActiveKey] = useState(null); // `${secId}::${lessonId}`
  const [openPicker, setOpenPicker] = useState(null); // sectionId
  const [pendingDeleteSecId, setPendingDeleteSecId] = useState(null);

  // pick first lesson by default
  useEffect(() => {
    if (activeKey) return;
    const firstSec = (course.sections || [])[0];
    const firstLesson = firstSec?.lessons?.[0];
    if (firstSec && firstLesson) {
      setActiveKey(`${firstSec.id}::${firstLesson.id}`);
    }
  }, [course, activeKey]);

  const findActive = () => {
    if (!activeKey) return null;
    const [secId, lessonId] = activeKey.split("::");
    const sec = (course.sections || []).find((s) => s.id === secId);
    if (!sec) return null;
    const les = (sec.lessons || []).find((l) => l.id === lessonId);
    if (!les) return null;
    return { section: sec, lesson: les };
  };

  const updateSections = (mutator) => {
    onChange((c) => ({ ...c, sections: mutator(c.sections || []) }));
  };

  const addSection = () => {
    const id = `s${Date.now()}`;
    updateSections((secs) => [
      ...secs,
      { id, title: `Section ${secs.length + 1}`, open: true, lessons: [] },
    ]);
  };

  const renameSection = (secId, title) => {
    updateSections((secs) =>
      secs.map((s) => (s.id === secId ? { ...s, title } : s))
    );
  };

  const toggleSection = (secId) => {
    updateSections((secs) =>
      secs.map((s) => (s.id === secId ? { ...s, open: !s.open } : s))
    );
  };

  const requestDeleteSection = (secId) => setPendingDeleteSecId(secId);
  const cancelDeleteSection = () => setPendingDeleteSecId(null);
  const confirmDeleteSection = () => {
    const secId = pendingDeleteSecId;
    if (!secId) return;
    updateSections((secs) => secs.filter((s) => s.id !== secId));
    if (activeKey?.startsWith(`${secId}::`)) setActiveKey(null);
    setPendingDeleteSecId(null);
  };

  const pendingDeleteSection = (course.sections || []).find(
    (s) => s.id === pendingDeleteSecId
  );

  const addLesson = (secId, type) => {
    const les = blankLesson(type);
    updateSections((secs) =>
      secs.map((s) =>
        s.id === secId ? { ...s, lessons: [...s.lessons, les] } : s
      )
    );
    setActiveKey(`${secId}::${les.id}`);
    setOpenPicker(null);
  };

  const deleteLesson = (secId, lesId) => {
    updateSections((secs) =>
      secs.map((s) =>
        s.id === secId
          ? { ...s, lessons: s.lessons.filter((l) => l.id !== lesId) }
          : s
      )
    );
    if (activeKey === `${secId}::${lesId}`) setActiveKey(null);
  };

  const updateLesson = (secId, lesId, updater) => {
    updateSections((secs) =>
      secs.map((s) =>
        s.id === secId
          ? {
              ...s,
              lessons: s.lessons.map((l) =>
                l.id === lesId ? (typeof updater === "function" ? updater(l) : updater) : l
              ),
            }
          : s
      )
    );
  };

  const active = findActive();

  return (
    <div className="ulms-step-content ulms-curric-step">
      <div className="ulms-curric-wrap">
        {/* Tree */}
        <div className="ulms-curric-tree">
          <div className="ulms-curric-tree-header">
            <span>Course Structure</span>
            <span className="ulms-curric-tree-count">
              {course.sections?.length || 0} sections
            </span>
          </div>

          {(course.sections || []).map((sec) => (
            <div key={sec.id} className="ulms-sec">
              <div className="ulms-sec-header" onClick={() => toggleSection(sec.id)}>
                <span className="ulms-sec-icon">{sec.open ? "📂" : "📁"}</span>
                <input
                  className="ulms-sec-name-input"
                  value={sec.title}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => renameSection(sec.id, e.target.value)}
                />
                <span className="ulms-sec-count">{sec.lessons.length}</span>
                <button
                  className="ulms-sec-del"
                  onClick={(e) => {
                    e.stopPropagation();
                    requestDeleteSection(sec.id);
                  }}
                  title="Delete section"
                >
                  ✕
                </button>
              </div>

              {sec.open && (
                <>
                  <div className="ulms-les-list">
                    {sec.lessons.map((l) => {
                      const k = `${sec.id}::${l.id}`;
                      return (
                        <div
                          key={l.id}
                          className={`ulms-les-row ${activeKey === k ? "active" : ""}`}
                          onClick={() => setActiveKey(k)}
                        >
                          <span className="ulms-les-icon">
                            {TYPE_ICONS[l.type] || "📄"}
                          </span>
                          <span className="ulms-les-name">{l.title}</span>
                          <span
                            className={`ulms-les-pub-dot ${l.published ? "pub" : ""}`}
                            title={l.published ? "Published" : "Draft"}
                          />
                          <button
                            className="ulms-les-del"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLesson(sec.id, l.id);
                            }}
                            title="Delete lesson"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="ulms-add-les-wrap">
                    {openPicker === sec.id ? (
                      <div className="ulms-les-type-picker open">
                        {Object.keys(TYPE_ICONS).map((t) => (
                          <button
                            key={t}
                            className="ulms-type-pick-btn"
                            onClick={() => addLesson(sec.id, t)}
                          >
                            {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        className="ulms-add-les-btn"
                        onClick={() => setOpenPicker(sec.id)}
                      >
                        + Add Lesson
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          <button className="ulms-add-sec-btn" onClick={addSection}>
            + Add Section
          </button>
        </div>

        {/* Editor panel */}
        <div className="ulms-curric-editor">
          {active ? (
            <LessonEditor
              key={active.lesson.id}
              section={active.section}
              lesson={active.lesson}
              onChange={(updater) => updateLesson(active.section.id, active.lesson.id, updater)}
              courseTitle={course.title}
              organizationId={organizationId}
              courseId={course.id}
            />
          ) : (
            <div className="ulms-empty-state">
              <div className="ulms-empty-icon">📚</div>
              <div className="ulms-empty-text">Select a lesson on the left to edit it</div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDeleteSection}
        title="Delete section?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDeleteSection}
        onCancel={cancelDeleteSection}
      >
        {`Are you sure you want to delete `}
        <strong>{pendingDeleteSection?.title || "this section"}</strong>
        {` and all its lessons? This action cannot be undone.`}
      </ConfirmDialog>
    </div>
  );
};

export default CurriculumStep;
