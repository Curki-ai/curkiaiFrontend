// LiquidOrb — the CareVoice recording orb.
//
// A canvas-rendered "liquid" voice animation that reacts to the live mic level.
// It does NOT open its own microphone: it reads the already-computed amplitude
// from `levelRef.current` (0..1), which VoiceModule's runVoiceMeter writes every
// frame while recording.
//
// IMPORTANT: this renders with NORMAL ("source-over") blending in brand-purple
// tones that fade to transparent — so it sits directly on the (light lavender)
// record card with NO dark/black disc behind it. Soft drifting blobs + a
// violet core that swells with the voice.
import React, { useEffect, useRef } from "react";

export default function LiquidOrb({ levelRef, className, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let raf = 0;
    let running = true;
    let t = 0;
    let W = 0, H = 0, CX = 0, CY = 0, BASE = 0, DPR = 1;
    let pulse = 0, lastOnset = 0;
    const lerp = (a, b, k) => a + (b - a) * k;

    // CareVoice brand palette (violet → blue → magenta → lavender), each blob
    // drifts on its own slow orbit and fades to transparent at its edge.
    const blobs = [
      { h: 258, s: 92, l: 55, rr: 1.25, sp: 0.40, ph: 0.0, a: 0.58 }, // brand violet
      { h: 218, s: 94, l: 54, rr: 1.05, sp: -0.33, ph: 2.1, a: 0.50 }, // blue accent
      { h: 292, s: 90, l: 57, rr: 0.95, sp: 0.52, ph: 4.0, a: 0.46 }, // magenta
      { h: 250, s: 88, l: 64, rr: 0.80, sp: -0.60, ph: 1.0, a: 0.40 }, // lavender
    ];

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (!W || !H) return;
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      CX = W / 2; CY = H / 2;
      BASE = Math.min(W, H) * 0.24;
    }
    resize();

    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resize);
      ro.observe(canvas);
    } else {
      window.addEventListener("resize", resize);
    }

    function frame() {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!W || !H) { resize(); return; }
      t += 0.016;

      const lvl = Math.min(1, Math.max(0, (levelRef && levelRef.current) || 0));
      const breathe = Math.sin(t * 0.9) * 0.5 + 0.5;
      const energy = Math.max(lvl, breathe * 0.12);

      const now = performance.now();
      if (lvl > 0.45 && now - lastOnset > 240) {
        pulse = Math.min(1.4, pulse + 0.5);
        lastOnset = now;
      }
      pulse = lerp(pulse, lvl * 0.9, 0.08);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";

      const orbR = BASE * (1.25 + energy * 0.5);
      const spread = orbR * 0.34 * (0.6 + energy * 0.6);

      // drifting brand-colour blobs — soft, semi-transparent, blend on any bg
      for (const b of blobs) {
        const ang = t * b.sp + b.ph;
        const cx = CX + Math.cos(ang) * spread;
        const cy = CY + Math.sin(ang * 1.13) * spread;
        const r = orbR * b.rr;
        const a = b.a * (0.7 + energy * 0.6);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `hsla(${b.h},${b.s}%,${b.l}%,${a})`);
        g.addColorStop(1, `hsla(${b.h},${b.s}%,${b.l}%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      }

      // violet core that swells with the voice (the pulse)
      const coreR = BASE * (0.5 + pulse * 0.7);
      const ca = 0.30 + pulse * 0.45;
      const c = ctx.createRadialGradient(CX, CY, 0, CX, CY, coreR);
      c.addColorStop(0, `hsla(258,92%,60%,${ca})`);
      c.addColorStop(0.6, `hsla(266,88%,56%,${ca * 0.45})`);
      c.addColorStop(1, "hsla(266,88%,56%,0)");
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(CX, CY, coreR, 0, Math.PI * 2); ctx.fill();
    }
    frame();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
    };
  }, [levelRef]);

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "clamp(190px, 19vw, 300px)",
        height: "clamp(190px, 19vw, 300px)",
        borderRadius: "50%",
        overflow: "hidden",
        background: "transparent", // no disc — the orb floats on the card
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </div>
  );
}
