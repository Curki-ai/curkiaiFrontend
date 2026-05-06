import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { blankQuestion } from "./lmsMockData";
import { uploadLessonFileApi } from "./api";

const TYPES = [
  { id: "video", label: "Video", icon: "🎬" },
  { id: "text", label: "Text", icon: "📝" },
  { id: "quiz", label: "Quiz", icon: "❓" },
  { id: "file", label: "File", icon: "📎" },
];

const LessonEditor = ({ section, lesson, onChange, courseTitle, organizationId, courseId }) => {
  const [pendingTypeSwitch, setPendingTypeSwitch] = useState(null);

  const setField = (key) => (e) => {
    const v = e?.target?.value !== undefined ? e.target.value : e;
    onChange((l) => ({ ...l, [key]: v }));
  };

  const requestSwitchType = (type) => {
    if (lesson.type === type) return;
    setPendingTypeSwitch(type);
  };

  const cancelSwitchType = () => setPendingTypeSwitch(null);

  const confirmSwitchType = () => {
    const type = pendingTypeSwitch;
    if (!type) return;
    onChange((l) => {
      const base = { id: l.id, title: l.title, duration: l.duration, published: l.published, type };
      if (type === "video") return { ...base, videoUrl: "", transcript: "" };
      if (type === "text") return { ...base, content: "" };
      if (type === "quiz") {
        return {
          ...base,
          quiz: { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true },
          questions: [],
        };
      }
      if (type === "file") return { ...base, fileName: "" };
      return base;
    });
    setPendingTypeSwitch(null);
  };

  const togglePublished = () => onChange((l) => ({ ...l, published: !l.published }));

  return (
    <div className="ulms-les-editor">
      <div className="ulms-les-editor-hdr">
        <input
          className="ulms-les-title-input"
          value={lesson.title}
          onChange={setField("title")}
          placeholder="Lesson title…"
        />
        <button
          className={`ulms-pub-toggle-btn ${lesson.published ? "pub" : "draft"}`}
          onClick={togglePublished}
        >
          {lesson.published ? "● Published" : "○ Draft"}
        </button>
      </div>

      <div className="ulms-breadcrumb">
        {courseTitle || "Course"} <span>›</span> {section.title} <span>›</span> {lesson.title}
      </div>

      <div className="ulms-les-meta-bar">
        <div className="ulms-dur-field">
          <span>Duration</span>
          <input
            className="ulms-dur-input"
            value={lesson.duration}
            onChange={setField("duration")}
            placeholder="e.g. 10 min"
          />
        </div>
        <div className="ulms-type-tabs">
          {TYPES.map((t) => (
            <button
              key={t.id}
              className={`ulms-type-tab ${lesson.type === t.id ? "active" : ""}`}
              onClick={() => requestSwitchType(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ulms-les-body">
        {lesson.type === "video" && (
          <VideoBody
            lesson={lesson}
            onChange={onChange}
            organizationId={organizationId}
            courseId={courseId}
            sectionId={section.id}
          />
        )}
        {lesson.type === "text" && <TextBody lesson={lesson} onChange={onChange} />}
        {lesson.type === "quiz" && <QuizBody lesson={lesson} onChange={onChange} />}
        {lesson.type === "file" && (
          <FileBody
            lesson={lesson}
            onChange={onChange}
            organizationId={organizationId}
            courseId={courseId}
            sectionId={section.id}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!pendingTypeSwitch}
        title="Switch lesson type?"
        confirmLabel="Switch"
        cancelLabel="Cancel"
        onConfirm={confirmSwitchType}
        onCancel={cancelSwitchType}
      >
        {`Switching this lesson to `}
        <strong>{pendingTypeSwitch}</strong>
        {` will clear the existing type-specific content. Continue?`}
      </ConfirmDialog>
    </div>
  );
};

const VideoBody = ({ lesson, onChange, organizationId, courseId, sectionId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!organizationId || !courseId) {
      setUploadErr("Course not saved yet — please wait a moment and try again.");
      return;
    }
    setUploading(true);
    setUploadErr("");
    setUploadPct(0);
    try {
      const attachment = await uploadLessonFileApi({
        organizationId,
        courseId,
        sectionId,
        lessonId: lesson.id,
        file,
        onProgress: (evt) => {
          if (evt.total) setUploadPct(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      // Clear any external URL — uploaded blob takes precedence.
      onChange((l) => ({ ...l, attachment, videoUrl: "" }));
    } catch (err) {
      console.error("[LMS v2] video upload failed", err);
      setUploadErr(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const requestRemoveUploaded = () => setConfirmRemove(true);
  const cancelRemoveUploaded = () => setConfirmRemove(false);
  const confirmRemoveUploaded = () => {
    onChange((l) => ({ ...l, attachment: null }));
    setConfirmRemove(false);
  };

  const previewSrc = lesson.attachment?.sasUrl || (lesson.videoUrl ? toEmbedUrl(lesson.videoUrl) : "");

  return (
    <>
      <div className="ulms-video-preview">
        {lesson.attachment?.sasUrl ? (
          <video src={lesson.attachment.sasUrl} controls style={{ width: "100%", height: "100%" }} />
        ) : lesson.videoUrl ? (
          <iframe
            title="video preview"
            src={previewSrc}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="ulms-video-placeholder">
            <span className="ulms-video-play">▶</span>
            <p>No video attached yet</p>
          </div>
        )}
      </div>

      <div className="ulms-embed-row" style={{ flexWrap: "wrap", gap: 10 }}>
        <input
          className="ulms-embed-input"
          placeholder="Paste a YouTube / Vimeo URL or hosted video link"
          value={lesson.videoUrl || ""}
          disabled={!!lesson.attachment}
          onChange={(e) => onChange((l) => ({ ...l, videoUrl: e.target.value }))}
        />
        <label className="ulms-embed-btn" style={{ cursor: "pointer", display: "inline-block" }}>
          {uploading ? `Uploading ${uploadPct}%…` : lesson.attachment ? "Replace" : "Upload video"}
          <input type="file" accept="video/*" style={{ display: "none" }} onChange={handleFile} disabled={uploading} />
        </label>
        {lesson.attachment && (
          <button
            className="ulms-embed-btn"
            style={{ background: "#fff", color: "#c0392b", border: "1px solid #ffc6c6" }}
            onClick={requestRemoveUploaded}
            disabled={uploading}
          >
            Remove
          </button>
        )}
      </div>

      {lesson.attachment?.name && (
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>📎 {lesson.attachment.name}</div>
      )}
      {uploadErr && <div style={{ color: "#c0392b", fontSize: 12, marginBottom: 12 }}>{uploadErr}</div>}

      <div className="ulms-transcript-label">Transcript / Notes</div>
      <textarea
        className="ulms-transcript-ta"
        placeholder="Optional — add a transcript or speaker notes here…"
        value={lesson.transcript || ""}
        onChange={(e) => onChange((l) => ({ ...l, transcript: e.target.value }))}
      />

      <ConfirmDialog
        open={confirmRemove}
        title="Remove video?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmRemoveUploaded}
        onCancel={cancelRemoveUploaded}
      >
        This will detach the uploaded video from this lesson. You can upload
        a new one afterwards.
      </ConfirmDialog>
    </>
  );
};

const toEmbedUrl = (url) => {
  if (!url) return "";
  // YouTube watch -> embed
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  // Vimeo
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
};

const TextBody = ({ lesson, onChange }) => {
  const apply = (cmd) => {
    document.execCommand(cmd, false, null);
  };
  return (
    <>
      <div className="ulms-text-toolbar">
        <button className="ulms-tb-btn" onClick={() => apply("bold")}><b>B</b></button>
        <button className="ulms-tb-btn" onClick={() => apply("italic")}><i>I</i></button>
        <button className="ulms-tb-btn" onClick={() => apply("underline")}><u>U</u></button>
        <button className="ulms-tb-btn" onClick={() => apply("insertUnorderedList")}>• List</button>
        <button className="ulms-tb-btn" onClick={() => apply("insertOrderedList")}>1. List</button>
      </div>
      <textarea
        className="ulms-text-area"
        placeholder="Write your lesson content here…"
        value={lesson.content || ""}
        onChange={(e) => onChange((l) => ({ ...l, content: e.target.value }))}
      />
    </>
  );
};

const QuizBody = ({ lesson, onChange }) => {
  const cfg = lesson.quiz || { passScore: 80, maxAttempts: 3, shuffle: true, showResults: true };
  const questions = lesson.questions || [];

  const setCfg = (key, val) =>
    onChange((l) => ({ ...l, quiz: { ...(l.quiz || {}), [key]: val } }));

  const updateQuestion = (qid, mutator) =>
    onChange((l) => ({
      ...l,
      questions: l.questions.map((q) =>
        q.id === qid ? (typeof mutator === "function" ? mutator(q) : mutator) : q
      ),
    }));

  const addQuestion = () =>
    onChange((l) => ({ ...l, questions: [...(l.questions || []), blankQuestion()] }));

  const deleteQuestion = (qid) =>
    onChange((l) => ({ ...l, questions: l.questions.filter((q) => q.id !== qid) }));

  return (
    <>
      <div className="ulms-quiz-cfg">
        <div className="ulms-quiz-cfg-item">
          <span className="ulms-quiz-cfg-label">Pass Score (%)</span>
          <input
            type="number"
            className="ulms-quiz-cfg-input"
            value={cfg.passScore}
            onChange={(e) => setCfg("passScore", Number(e.target.value) || 0)}
          />
        </div>
        <div className="ulms-quiz-cfg-item">
          <span className="ulms-quiz-cfg-label">Max Attempts</span>
          <input
            type="number"
            className="ulms-quiz-cfg-input"
            value={cfg.maxAttempts}
            onChange={(e) => setCfg("maxAttempts", Number(e.target.value) || 0)}
          />
        </div>
        <div className="ulms-quiz-toggle-item">
          <span className="ulms-quiz-cfg-label">Shuffle</span>
          <label className="ulms-toggle-lbl">
            <input
              type="checkbox"
              checked={!!cfg.shuffle}
              onChange={(e) => setCfg("shuffle", e.target.checked)}
            />
            <span className="ulms-tog-sl" />
          </label>
        </div>
        <div className="ulms-quiz-toggle-item">
          <span className="ulms-quiz-cfg-label">Show Results</span>
          <label className="ulms-toggle-lbl">
            <input
              type="checkbox"
              checked={!!cfg.showResults}
              onChange={(e) => setCfg("showResults", e.target.checked)}
            />
            <span className="ulms-tog-sl" />
          </label>
        </div>
      </div>

      <div className="ulms-q-list">
        {questions.length === 0 && (
          <div className="ulms-empty-state ulms-empty-inline">
            <div className="ulms-empty-icon">❓</div>
            <div className="ulms-empty-text">No questions yet — add your first one below.</div>
          </div>
        )}
        {questions.map((q, idx) => (
          <div key={q.id} className="ulms-q-card">
            <div className="ulms-q-num">Question {idx + 1}</div>
            <input
              className="ulms-q-input"
              value={q.question}
              onChange={(e) =>
                updateQuestion(q.id, (qq) => ({ ...qq, question: e.target.value }))
              }
            />
            <div className="ulms-q-opts">
              {q.options.map((opt, i) => (
                <div
                  key={i}
                  className={`ulms-q-opt ${q.correct === i ? "correct" : ""}`}
                  onClick={() => updateQuestion(q.id, (qq) => ({ ...qq, correct: i }))}
                >
                  <span className="ulms-q-opt-radio" />
                  <input
                    className="ulms-q-opt-input"
                    value={opt}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateQuestion(q.id, (qq) => {
                        const opts = [...qq.options];
                        opts[i] = v;
                        return { ...qq, options: opts };
                      });
                    }}
                  />
                  <span className="ulms-q-opt-check">CORRECT</span>
                </div>
              ))}
            </div>
            <button className="ulms-q-del" onClick={() => deleteQuestion(q.id)} title="Delete">
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="ulms-add-q-btn" onClick={addQuestion}>
        + Add Question
      </button>
    </>
  );
};

const FileBody = ({ lesson, onChange, organizationId, courseId, sectionId }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState("");

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!organizationId || !courseId) {
      setUploadErr("Course not saved yet — please wait and retry.");
      return;
    }
    setUploading(true);
    setUploadErr("");
    setUploadPct(0);
    try {
      const attachment = await uploadLessonFileApi({
        organizationId,
        courseId,
        sectionId,
        lessonId: lesson.id,
        file: f,
        onProgress: (evt) => {
          if (evt.total) setUploadPct(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      onChange((l) => ({ ...l, attachment, fileName: attachment.name }));
    } catch (err) {
      console.error("[LMS v2] file upload failed", err);
      setUploadErr(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const inputId = `ulms-file-input-${lesson.id}`;
  const label = uploading
    ? `Uploading ${uploadPct}%…`
    : lesson.attachment?.name || lesson.fileName || "Drop a file here or click to upload";

  return (
    <>
      <label className="ulms-upload-zone" htmlFor={inputId}>
        <div className="ulms-upload-icon">📎</div>
        <div className="ulms-upload-text">{label}</div>
        <div className="ulms-upload-hint">PDF, DOCX, slides, images — max 50MB</div>
        <input
          id={inputId}
          type="file"
          style={{ display: "none" }}
          onChange={onPick}
          disabled={uploading}
        />
      </label>
      {uploadErr && <div style={{ color: "#c0392b", fontSize: 12, marginTop: 8 }}>{uploadErr}</div>}
      {lesson.attachment?.sasUrl && (
        <div style={{ fontSize: 12, marginTop: 8 }}>
          <a href={lesson.attachment.sasUrl} target="_blank" rel="noreferrer" style={{ color: "#7c5cbf" }}>
            Open attachment →
          </a>
        </div>
      )}
      <div className="ulms-transcript-label" style={{ marginTop: 16 }}>
        Description / Instructions
      </div>
      <textarea
        className="ulms-transcript-ta"
        placeholder="Tell learners what's in this file or how to use it…"
        value={lesson.description || ""}
        onChange={(e) => onChange((l) => ({ ...l, description: e.target.value }))}
      />
    </>
  );
};

export default LessonEditor;
