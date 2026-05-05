import React, { useMemo, useState } from "react";

const toEmbedUrl = (url) => {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return url;
};

const LessonViewer = ({
  section,
  lesson,
  isCompleted,
  quizScore,
  onComplete,
  onPrev,
  onNext,
}) => {
  console.log("LessonViewer props:", { section, lesson, isCompleted, quizScore });
  console.log("Rendering LessonViewer for lesson", lesson);
  if (!lesson.published) {
    return (
      <div className="ulrn-locked">
        <div className="ulrn-locked-icon">🔒</div>
        <h2>Coming soon</h2>
        <p>
          This lesson hasn't been released yet. Your trainer will let you
          know when it's available.
        </p>
        <div className="ulrn-viewer-nav">
          <button
            className="ulrn-nav-btn"
            onClick={onPrev}
            disabled={!onPrev}
          >
            ← Previous
          </button>
          <button
            className="ulrn-nav-btn ulrn-next-btn"
            onClick={onNext}
            disabled={!onNext}
          >
            Next →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ulrn-viewer">
      <div className="ulrn-viewer-crumb">
        {section.title} <span>›</span> {lesson.title}
      </div>
      <h1 className="ulrn-viewer-title">{lesson.title}</h1>
      <div className="ulrn-viewer-meta">
        <span>⏱ {lesson.duration}</span>
        <span>·</span>
        <span>
          {lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)} lesson
        </span>
        {isCompleted && <span className="ulrn-done-pill">✓ Completed</span>}
      </div>

      {lesson.type === "video" && <VideoView lesson={lesson} />}
      {lesson.type === "text" && <TextView lesson={lesson} />}
      {lesson.type === "quiz" && (
        <QuizView
          lesson={lesson}
          quizScore={quizScore}
          onSubmit={(answers) => onComplete({ quizAnswers: answers })}
        />
      )}
      {lesson.type === "file" && <FileView lesson={lesson} />}

      <div className="ulrn-viewer-nav">
        <button
          className="ulrn-nav-btn"
          onClick={onPrev}
          disabled={!onPrev}
        >
          ← Previous
        </button>
        {lesson.type !== "quiz" && (
          <button
            className={`ulrn-nav-btn ulrn-complete-btn ${
              isCompleted ? "done" : ""
            }`}
            onClick={() => onComplete()}
            disabled={isCompleted}
          >
            {isCompleted ? "✓ Marked Complete" : "Mark as Complete"}
          </button>
        )}
        <button
          className="ulrn-nav-btn ulrn-next-btn"
          onClick={onNext}
          disabled={!onNext}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const VideoView = ({ lesson }) => {
  const fileSrc = lesson.attachment?.sasUrl || lesson.attachment?.url || "";
  const isVideoFile =
    fileSrc &&
    (lesson.attachment?.mimetype?.startsWith("video/") ||
      /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(fileSrc));

  return (
    <div>
      <div className="ulrn-video-frame">
        {isVideoFile ? (
          <video
            src={fileSrc}
            controls
            controlsList="nodownload"
            style={{ width: "100%", height: "100%" }}
          />
        ) : lesson.videoUrl ? (
          <iframe
            title={lesson.title}
            src={toEmbedUrl(lesson.videoUrl)}
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="ulrn-video-empty">
            <span className="ulrn-video-play">▶</span>
            <p>Video preview placeholder</p>
            <span className="ulrn-video-hint">
              Your trainer hasn't attached a video yet — but the lesson is still
              marked as available so you can mark it complete after reading any
              transcript below.
            </span>
          </div>
        )}
      </div>
      {lesson.transcript && (
        <div className="ulrn-content-block">
          <h3>Transcript</h3>
          <p>{lesson.transcript}</p>
        </div>
      )}
    </div>
  );
};

const TextView = ({ lesson }) => (
  <div className="ulrn-content-block ulrn-text-content">
    {lesson.content ? (
      <p>{lesson.content}</p>
    ) : (
      <p className="ulrn-content-empty">
        No content has been added to this lesson yet.
      </p>
    )}
  </div>
);

const FileView = ({ lesson }) => (
  <div className="ulrn-file-card">
    <div className="ulrn-file-icon">📎</div>
    <div className="ulrn-file-info">
      <div className="ulrn-file-name">
        {lesson.fileName || "No file attached"}
      </div>
      {lesson.description && (
        <p className="ulrn-file-desc">{lesson.description}</p>
      )}
    </div>
    {lesson.fileName && (
      <button className="ulrn-file-dl">⬇ Download</button>
    )}
  </div>
);

// Server-graded quiz. We send the answer map up via `onSubmit` and trust the
// server's verdict — questions arrive without their `correct` field stripped.
const QuizView = ({ lesson, quizScore, onSubmit }) => {
  const cfg =
    lesson.quiz || {
      passScore: 80,
      maxAttempts: 3,
      shuffle: true,
      showResults: true,
    };

  const questions = useMemo(() => {
    const qs = [...(lesson.questions || [])];
    if (cfg.shuffle) qs.sort(() => Math.random() - 0.5);
    return qs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(quizScore !== undefined);
  const [score, setScore] = useState(quizScore);
  const [breakdown, setBreakdown] = useState(null);
  const [attempt, setAttempt] = useState(quizScore !== undefined ? 1 : 0);

  const breakdownByQ = useMemo(() => {
    if (!breakdown) return {};
    return Object.fromEntries(breakdown.map((b) => [b.questionId, b]));
  }, [breakdown]);

  if (!questions.length) {
    return (
      <div className="ulrn-content-block">
        <p className="ulrn-content-empty">
          No questions configured for this quiz yet.
        </p>
      </div>
    );
  }

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const result = await onSubmit(answers);
      if (!result) return; // parent handled the error
      setScore(result.score);
      setBreakdown(result.breakdown || null);
      setSubmitted(true);
      setAttempt((a) => a + 1);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(undefined);
    setBreakdown(null);
  };

  const passed = score !== undefined && score >= cfg.passScore;
  const allAnswered = questions.every((q) => answers[q.id] !== undefined);
  const canRetry = !passed && attempt < cfg.maxAttempts;

  return (
    <div className="ulrn-quiz">
      <div className="ulrn-quiz-cfg">
        <span>🎯 Pass score: {cfg.passScore}%</span>
        <span>
          🔁 Attempts: {attempt}/{cfg.maxAttempts}
        </span>
      </div>

      {questions.map((q, idx) => {
        const fb = breakdownByQ[q.id];
        const showResult = submitted && cfg.showResults && fb;
        return (
          <div key={q.id} className="ulrn-quiz-q">
            <div className="ulrn-quiz-q-num">Question {idx + 1}</div>
            <div className="ulrn-quiz-q-text">{q.question}</div>
            <div className="ulrn-quiz-opts">
              {q.options.map((opt, i) => {
                const picked = answers[q.id] === i;
                const wasRightPick = showResult && picked && fb.correct;
                const wasWrongPick = showResult && picked && !fb.correct;
                return (
                  <label
                    key={i}
                    className={`ulrn-quiz-opt ${picked ? "picked" : ""} ${
                      wasRightPick ? "correct" : ""
                    } ${wasWrongPick ? "wrong" : ""}`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      disabled={submitted || submitting}
                      checked={picked}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: i }))
                      }
                    />
                    <span className="ulrn-quiz-opt-text">{opt}</span>
                    {wasRightPick && (
                      <span className="ulrn-opt-tag">Correct</span>
                    )}
                    {wasWrongPick && (
                      <span className="ulrn-opt-tag wrong">Your answer</span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {!submitted ? (
        <button
          className="ulrn-quiz-submit"
          onClick={submit}
          disabled={!allAnswered || submitting}
        >
          {submitting ? "Grading…" : "Submit Quiz"}
        </button>
      ) : (
        <div className={`ulrn-quiz-result ${passed ? "pass" : "fail"}`}>
          <div className="ulrn-quiz-score">
            {passed ? "🎉 You passed!" : "Almost there"} — Your score:{" "}
            <strong>{score}%</strong>
          </div>
          {!passed && canRetry && (
            <button className="ulrn-quiz-submit" onClick={retry}>
              Retry Quiz
            </button>
          )}
          {!passed && !canRetry && (
            <div className="ulrn-quiz-locked">
              No attempts remaining. Reach out to your trainer for help.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
