import React from "react";

const InfoStep = ({ course, onChange }) => {
  const set = (key) => (e) =>
    onChange((c) => ({ ...c, [key]: e.target.value }));

  return (
    <div className="ulms-step-content">
      <div className="ulms-info-grid">
        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">
            Course Title <span className="ulms-req">*</span>
          </label>
          <input
            className="ulms-input"
            placeholder="e.g. Staff Onboarding Program"
            value={course.title}
            onChange={set("title")}
          />
        </div>

        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">Estimated Duration</label>
          <input
            className="ulms-input"
            placeholder="e.g. 4.5 hrs"
            value={course.duration}
            onChange={set("duration")}
          />
        </div>

        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">
            Description <span className="ulms-req">*</span>
          </label>
          <textarea
            className="ulms-textarea"
            rows={3}
            placeholder="What will learners get out of this course?"
            value={course.desc}
            onChange={set("desc")}
          />
        </div>

        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">Course Thumbnail</label>
          <ThumbnailZone course={course} onChange={onChange} />
        </div>

        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">Learning Objectives</label>
          <ListField
            items={course.objectives || []}
            placeholder="e.g. Understand company values…"
            bullet="✓"
            onChange={(objectives) => onChange((c) => ({ ...c, objectives }))}
            addLabel="+ Add objective"
          />
        </div>

        <div className="ulms-field-group ulms-full">
          <label className="ulms-label">Prerequisites</label>
          <ListField
            items={course.requirements || []}
            placeholder="e.g. Signed employment contract"
            bullet="•"
            onChange={(requirements) => onChange((c) => ({ ...c, requirements }))}
            addLabel="+ Add prerequisite"
          />
        </div>
      </div>
    </div>
  );
};

const ThumbnailZone = ({ course, onChange }) => {
  const presets = ["📋", "⛑️", "💊", "📚", "🎯", "🏥", "🤝", "🧑‍💼", "🛡️"];
  return (
    <div className="ulms-thumb-zone">
      <div
        className="ulms-thumb-preview"
        style={{ background: course.color || "#7c5cbf" }}
      >
        <span>{course.thumb || "📚"}</span>
      </div>
      <div className="ulms-thumb-presets">
        <div className="ulms-thumb-presets-label">Pick an icon</div>
        <div className="ulms-thumb-presets-row">
          {presets.map((p) => (
            <button
              key={p}
              className={`ulms-thumb-preset ${course.thumb === p ? "active" : ""}`}
              onClick={() => onChange((c) => ({ ...c, thumb: p }))}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ListField = ({ items, onChange, placeholder, bullet, addLabel }) => {
  const update = (i, v) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);
  return (
    <div className="ulms-obj-list">
      {items.length === 0 && (
        <div className="ulms-obj-empty">No items yet.</div>
      )}
      {items.map((it, i) => (
        <div key={i} className="ulms-obj-row">
          <span className="ulms-obj-bullet">{bullet}</span>
          <input
            className="ulms-obj-input"
            placeholder={placeholder}
            value={it}
            onChange={(e) => update(i, e.target.value)}
          />
          <button className="ulms-obj-del" onClick={() => remove(i)} title="Remove">
            ✕
          </button>
        </div>
      ))}
      <button className="ulms-obj-add" onClick={add}>
        {addLabel}
      </button>
    </div>
  );
};

export default InfoStep;
