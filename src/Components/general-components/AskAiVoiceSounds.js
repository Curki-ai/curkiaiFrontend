// Curki voice-agent UX cues (Web Audio — no asset files).
//
// Chosen in the Sound Lab:
//   start    -> "Warm swell"        (voice mode turns on)
//   listening-> "L1 Tiny up-blip"   (ready for the user)
//   thinking -> "T4 Lo-fi beat"     (loops while the agent thinks)
//   answer   -> "A2 Single warm"    (just before the spoken reply)
//   end      -> "Gentle goodbye"    (voice mode turns off)
//
// Everything is synthesized live, so there's nothing to host/load. The
// AudioContext is created lazily on first call — which always happens after a
// user gesture (clicking the mic), satisfying the browser autoplay policy.

let ctx, master, reverb;
let thinkingStop = null;       // handle for the looping thinking groove
let MASTER_VOL = 0.55;

function ensure() {
  if (ctx) {
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (_) {} }
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = MASTER_VOL;
  master.connect(ctx.destination);
  // simple synthesized reverb for warmth
  reverb = ctx.createConvolver();
  const len = ctx.sampleRate * 1.6;
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
  }
  reverb.buffer = buf;
  const rg = ctx.createGain();
  rg.gain.value = 0.22;
  reverb.connect(rg);
  rg.connect(master);
}

export function setVoiceSoundVolume(v) {
  MASTER_VOL = Math.max(0, Math.min(1, v));
  if (master) master.gain.value = MASTER_VOL;
}

// warm bell/marimba-ish struck note
function tone(freq, t0, dur, { decay = 7, gain = 0.9, attack = 0.005, wet = 0.5 } = {}) {
  const parts = [[1, 1], [2, 0.32], [3, 0.12]]; // warm timbre
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, t0);
  env.gain.linearRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  env.connect(master);
  const wetg = ctx.createGain(); wetg.gain.value = wet; env.connect(wetg); wetg.connect(reverb);
  parts.forEach(([mult, amp]) => {
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = freq * mult;
    const g = ctx.createGain(); g.gain.value = amp;
    o.connect(g); g.connect(env);
    o.start(t0); o.stop(t0 + dur + 0.05);
  });
}

function glide(f1, f2, t0, dur, { gain = 0.5, wet = 0.4 } = {}) {
  const o = ctx.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(f1, t0);
  o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(gain, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g); g.connect(master);
  const wetg = ctx.createGain(); wetg.gain.value = wet; g.connect(wetg); wetg.connect(reverb);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

// ---- mini drum kit + groove scheduler (for the lo-fi thinking loop) ----
let NOISE;
function noise() {
  if (!NOISE) {
    const n = ctx.sampleRate; NOISE = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = NOISE.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  }
  return NOISE;
}
function kick(t, { gain = 0.9, f0 = 150, f1 = 48 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.12);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.22);
}
function hat(t, { gain = 0.25, dur = 0.04, hp = 7000 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noise();
  const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0006, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + dur + 0.03);
}
function snare(t, { gain = 0.5 } = {}) {
  const s = ctx.createBufferSource(); s.buffer = noise();
  const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
  const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
  s.connect(bp); bp.connect(g); g.connect(master); s.start(t); s.stop(t + 0.16);
  const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = 180;
  const og = ctx.createGain(); og.gain.setValueAtTime(gain * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
  o.connect(og); og.connect(master); o.start(t); o.stop(t + 0.12);
}
function bassNote(freq, t, dur, { gain = 0.45 } = {}) {
  const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = freq;
  const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.03);
}
function startGroove(bpm, stepsPerBar, swing, onStep) {
  let step = 0, stopped = false, timer;
  const beat = 60 / bpm, stepDur = beat * 4 / stepsPerBar;
  let next = ctx.currentTime + 0.08;
  function sched() {
    if (stopped) return;
    while (next < ctx.currentTime + 0.13) {
      const sw = (step % 2 === 1) ? stepDur * swing : 0;
      try { onStep(step, next + sw); } catch (e) {}
      step = (step + 1) % stepsPerBar; next += stepDur;
    }
    timer = setTimeout(sched, 25);
  }
  sched();
  return () => { stopped = true; clearTimeout(timer); };
}

// notes
const N = { C5: 523.25, D5: 587.33, E5: 659.25, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
            G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5, E6: 1318.5 };

// ---------------- public cues ----------------

// Start / Activate — "Warm swell"
export function playStart() {
  ensure();
  const t = ctx.currentTime;
  glide(N.E5, N.B5, t, 0.55, { gain: 0.45 });
  tone(N.B5, t + 0.42, 0.4, { decay: 6, gain: 0.5 });
}

// Listening (ready) — "L1 Tiny up-blip"
export function playListening() {
  ensure();
  const t = ctx.currentTime;
  tone(N.A5, t, 0.1, { decay: 14, gain: 0.7, wet: 0.3 });
  tone(N.E6, t + 0.06, 0.18, { decay: 10, wet: 0.3 });
}

// Answer ready — "A2 Single warm"
export function playAnswer() {
  ensure();
  tone(N.A5, ctx.currentTime, 0.32, { decay: 7, gain: 0.5, wet: 0.45 });
}

// End / Stop session — "Gentle goodbye"
export function playEnd() {
  ensure();
  glide(N.A5, N.D5, ctx.currentTime, 0.5, { gain: 0.45 });
}

// Thinking / Processing — "T3 Rising dots": playful ascending blips, loops
// until stopThinking().
export function startThinking() {
  ensure();
  if (thinkingStop) return;            // already running
  let alive = true;
  const seq = [N.E5, N.G5, N.A5, N.C6];
  let i = 0;
  const step = () => {
    if (!alive) return;
    tone(seq[i % seq.length], ctx.currentTime, 0.22, { decay: 11, gain: 0.28, wet: 0.4 });
    i++;
    setTimeout(step, 320);
  };
  step();
  thinkingStop = () => { alive = false; };
}

export function stopThinking() {
  if (thinkingStop) { try { thinkingStop(); } catch (_) {} thinkingStop = null; }
}
