// Voice-mode edge glow for CareVoice "talk to your document" mode.
//
// Instead of an orb that covers/blurs the transcript, this paints a reactive
// glow around the *edges and corners* of the Ask AI panel — fully see-through in
// the middle, so the conversation stays readable. A Web Audio analyser reads mic
// amplitude every frame into the `--cv-level` CSS variable, so the edges swell
// and brighten with your voice (and the assistant's, picked up from the speakers
// while it narrates). Colour is themed per phase:
//   listening (you) -> thinking -> speaking (TTS).
import React, { useEffect, useRef } from "react";
import "../../Styles/general-styles/VoicePulse.css";

const PHASE = {
  listening: { label: "Listening", color: "#6C4CDC" },
  thinking:  { label: "Thinking",  color: "#F0A500" },
  speaking:  { label: "Speaking",  color: "#16B187" },
};

export default function VoicePulse({ phase, onStop }) {
  const edgeRef = useRef(null);
  const active = !!phase && phase !== "idle";

  // Live amplitude → `--cv-level` (0..1). Best-effort: if mic/AudioContext isn't
  // available the glow just falls back to its ambient breathing.
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let ctx = null;
    let stream = null;
    let stopped = false;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (stopped) return;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") { try { await ctx.resume(); } catch (_) {} }

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const buf = new Uint8Array(analyser.fftSize);
        let smooth = 0;

        const tick = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);     // 0..~1
          const level = Math.min(1, rms * 3.4);         // boost quiet speech into range
          smooth = smooth * 0.78 + level * 0.22;        // ease so it glides, not jitters
          if (edgeRef.current) edgeRef.current.style.setProperty("--cv-level", smooth.toFixed(3));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (_) {
        /* visualization is optional — ignore */
      }
    })();

    return () => {
      stopped = true;
      if (raf) cancelAnimationFrame(raf);
      try { stream && stream.getTracks().forEach((t) => t.stop()); } catch (_) {}
      try { ctx && ctx.close(); } catch (_) {}
    };
  }, [active]);

  if (!active) return null;
  const meta = PHASE[phase] || PHASE.listening;

  return (
    <div
      ref={edgeRef}
      className={`cv-edge cv-edge--${phase}`}
      style={{ "--cv-color": meta.color }}
      role="status"
      aria-live="polite"
    >
      <span className="cv-edge-aurora" />
      <span className="cv-edge-glow" />

      {/* status indicator, top-left */}
      <div className="cv-edge-chip">
        <span className="cv-edge-dot" />
        {meta.label}
      </div>

      {/* primary stop control, bottom-centre (where the composer was) */}
      <button
        className="cv-edge-end"
        onClick={onStop}
        title="End voice chat"
        aria-label="End voice chat"
      >
        <span className="cv-edge-end-icon" />
        End voice chat
      </button>
    </div>
  );
}
