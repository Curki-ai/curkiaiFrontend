import React, { useState } from "react";
import "../../../../Styles/SupportAtHomeModule/CareVoice/GeneratingDocument.css";

/**
 * GeneratingDocument — polished edition
 * A faithful, lightweight rebuild of the "Mapping Conversations → Generating Document"
 * loading animation, dressed up with depth and silky motion.
 * Pure CSS + inline SVG. No video, no GIF, no external libraries.
 *
 * Props (all optional):
 *   title      — heading text that types out   (default "Mapping Conversations")
 *   status     — looping status label          (default "Generating Document")
 *   showReplay — show a small Replay button     (default false)
 */
export default function GeneratingDocument({
  title = "Mapping Conversations",
  status = "Generating Document",
  showReplay = false,
}) {
  const [runId, setRunId] = useState(0);

  const badges = [
    { label: "MP3", color: "#db238d" },
    { label: "DOC", color: "#125bed" },
    { label: "PDF", color: "#d72a1e" },
    { label: "WAV", color: "#1f1f1f" },
  ];

  return (
    <div className="gd-root">
      {/* atmospheric background */}
      <div className="gd-aurora" aria-hidden="true">
        <span className="gd-blob gd-blob-1" />
        <span className="gd-blob gd-blob-2" />
        <span className="gd-blob gd-blob-3" />
      </div>

      {/* key={runId} remounts the stage so all CSS animations restart on replay */}
      <Stage key={runId} title={title} status={status} badges={badges} />

      {showReplay && (
        <button className="gd-replay" onClick={() => setRunId((r) => r + 1)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Replay
        </button>
      )}
    </div>
  );
}

function Stage({ title, status, badges }) {
  const lines1 = [
    "Speaker A: Let's map the rollout",
    "Speaker B: We can ship by Friday",
    "Decision: confirm staffing plan",
    "Topic: onboarding flow",
    "Note: follow up next week",
  ];
  const lines2 = [
    "reviewing the transcript",
    "tagging key moments",
    "extracting decisions",
    "summarising themes",
    "linking related notes",
  ];

  return (
    <div className="gd-stage">
      {/* Heading — wraps to fit any container width */}
      <h1 className="gd-title">{title}</h1>

      {/* Two cards with scrolling transcript text */}
      <div className="gd-cards">
        <span className="gd-card gd-card-1">
          <span className="gd-card-scroll">
            {[...lines1, ...lines1].map((t, i) => (
              <em key={i}>{t}</em>
            ))}
          </span>
        </span>
        <span className="gd-card gd-card-2">
          <span className="gd-card-scroll">
            {[...lines2, ...lines2].map((t, i) => (
              <em key={i}>{t}</em>
            ))}
          </span>
        </span>
      </div>

      {/* File-type badges */}
      <div className="gd-badges">
        {badges.map((b) => (
          <span className="gd-badge" key={b.label}>
            <span className="gd-badge-float">
              <FileIcon label={b.label} color={b.color} />
            </span>
          </span>
        ))}
      </div>

      {/* Connector line with flowing energy particles */}
      <div className="gd-connector">
        <span className="gd-flow" />
        <span className="gd-flow" />
        <span className="gd-flow" />
      </div>

      {/* Central core with layered energy field */}
      <div className="gd-core-wrap">
        <span className="gd-glow" />
        <span className="gd-ping" />
        <span className="gd-ping gd-ping-2" />
        <span className="gd-scan" />
        <span className="gd-core-icon">
          <LogoIcon />
        </span>
      </div>

      {/* Looping status label with animated dots */}
      <div className="gd-status">
        <span className="gd-status-text">{status}</span>
        <span className="gd-dots">
          <i /> <i /> <i />
        </span>
      </div>
    </div>
  );
}

/* ---- Inline SVG: folded-corner file badge ---- */
function FileIcon({ label, color }) {
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-label={label}>
      <path
        d="M11 6 h17 l7 7 v27 a3 3 0 0 1 -3 3 H11 a3 3 0 0 1 -3 -3 V9 a3 3 0 0 1 3 -3 z"
        fill={color}
      />
      <path d="M28 6 v7 h7 z" fill="#ffffff" opacity="0.35" />
      <text
        x="21.5"
        y="32"
        textAnchor="middle"
        fontSize="9"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Poppins, sans-serif"
        letterSpacing="0.3"
      >
        {label}
      </text>
    </svg>
  );
}

/* ---- Inline SVG: the brand logo (animated soundwave mark) ---- */
function LogoIcon() {
  return (
    <svg
      className="gd-logo"
      width="90"
      height="79"
      viewBox="0 0 115 101"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="gdLogoA"
          x1="57.05" y1="58.06" x2="20.9" y2="21.71"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.08" stopColor="#5B36E1" />
          <stop offset="1" stopColor="#9479F4" />
        </linearGradient>
        <linearGradient
          id="gdLogoB"
          x1="40.44" y1="38.56" x2="74.49" y2="77.02"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9C86ED" />
          <stop offset="1" stopColor="#5B36E1" />
        </linearGradient>
      </defs>
      {/* outer right arc */}
      <path
        className="gd-logo-arc gd-logo-arc-2"
        d="M104.557 77.6361C101.972 83.8379 98.1847 89.4734 93.4099 94.2202L75.23 76.1471C77.6175 73.7736 79.5113 70.956 80.8032 67.8549C82.0954 64.754 82.7604 61.4304 82.7604 58.0739C82.7604 54.7175 82.0954 51.3939 80.8032 48.293C79.5113 45.1918 77.6175 42.3743 75.23 40.0008L93.4099 21.9277C98.1847 26.6744 101.972 32.3099 104.557 38.5118C107.141 44.7139 108.471 51.3609 108.471 58.0739C108.471 64.787 107.141 71.434 104.557 77.6361Z"
        fill="#5B36E1"
      />
      {/* main arc */}
      <path
        className="gd-logo-arc gd-logo-arc-1"
        d="M93.4084 21.9177C88.6336 17.171 82.9648 13.4056 76.7263 10.8365C70.4876 8.26764 63.8013 6.94552 57.0486 6.94531C50.2958 6.94552 43.6096 8.26764 37.3709 10.8365C31.1324 13.4056 25.4636 17.171 20.6888 21.9177C15.914 26.6644 12.1264 32.2999 9.54211 38.5018C6.95807 44.7039 5.62814 51.3508 5.62793 58.0639C5.62814 64.777 6.95807 71.424 9.54211 77.626C12.1264 83.8279 15.914 89.4634 20.6888 94.2101L38.8687 76.137C36.4812 73.7636 34.5874 70.946 33.2955 67.8449C32.0033 64.7439 31.3383 61.4203 31.3383 58.0639C31.3383 54.7075 32.0033 51.3839 33.2955 48.283C34.5874 45.1818 36.4812 42.3643 38.8687 39.9908C41.2562 37.6173 44.0904 35.7346 47.2098 34.4503C50.3291 33.1658 53.6723 32.5046 57.0486 32.5046C60.4249 32.5046 63.7681 33.1658 66.8873 34.4503C70.0068 35.7346 72.841 37.6173 75.2285 39.9908L93.4084 21.9177Z"
        fill="url(#gdLogoA)"
      />
      {/* center dot */}
      <path
        className="gd-logo-dot"
        d="M76.696 57.7881C76.696 68.4084 68.0866 77.0178 57.4663 77.0178C46.846 77.0178 38.2365 68.4084 38.2365 57.7881C38.2365 47.1678 46.846 38.5583 57.4663 38.5583C68.0866 38.5583 76.696 47.1678 76.696 57.7881Z"
        fill="url(#gdLogoB)"
      />
    </svg>
  );
}
