// Azure Neural Text-to-Speech for AskAI voice mode.
//
// Symmetric with AskAiSTT.js: the Azure Speech SDK is dynamic-imported on first
// use, and auth is token-based via /api/speech-token — no Azure key ever ships
// to the browser. Speaks the grounded answer returned by /careVoiceAskAI/query
// (called with style:"voice" so the text is already written in a warm, spoken
// style). This is the "voice" half of the STT -> answer -> TTS pipeline.

import { API_BASE } from "../../config/apiBase";

// en-AU neural voice by default (NDIS / Australian context). Swap via env.
const DEFAULT_VOICE = process.env.REACT_APP_ASKAI_TTS_VOICE || "en-AU-NatashaNeural";

// Strip markdown so the synthesizer doesn't literally read "asterisk asterisk"
// for **bold**, "hash" for headings, backticks, etc. The on-screen chat bubble
// keeps the real markdown; only the SPOKEN copy is cleaned here.
const stripMarkdownForSpeech = (raw) => {
  if (!raw) return "";
  let t = String(raw);
  t = t.replace(/```[\s\S]*?```/g, " ");          // fenced code blocks
  t = t.replace(/`([^`]+)`/g, "$1");               // inline code
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " ");      // images
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");    // links -> keep the text
  t = t.replace(/^\s{0,3}#{1,6}\s+/gm, "");         // headings (# ...)
  t = t.replace(/(\*\*\*|___)(.*?)\1/g, "$2");      // bold+italic
  t = t.replace(/(\*\*|__)(.*?)\1/g, "$2");         // bold
  t = t.replace(/(\*|_)(.*?)\1/g, "$2");            // italic
  t = t.replace(/~~(.*?)~~/g, "$1");                // strikethrough
  t = t.replace(/^\s{0,3}>\s?/gm, "");              // blockquotes
  t = t.replace(/^\s*([-*+]|\d+\.)\s+/gm, "");      // list bullets/numbers
  t = t.replace(/^\s*([-*_]\s*){3,}\s*$/gm, " ");   // horizontal rules
  t = t.replace(/\|/g, " ");                         // table pipes
  t = t.replace(/[ \t]{2,}/g, " ");                  // collapse runs of spaces
  return t.trim();
};

const logWithTime = (message, data = "") => {
  const time = new Date().toISOString();
  if (data) {
  } else {
  }
};

// Synthesize `text` and play it through the default speaker. Returns the
// synthesizer instance so the caller can stop it mid-sentence (barge-in).
export const speakText = async (text, { voiceName, onStart, onDone, onError } = {}) => {
  try {
    if (!text || !text.trim()) return null;

    // Speak a markdown-free version (the chat bubble still shows formatting).
    const spokenText = stripMarkdownForSpeech(text);
    if (!spokenText) return null;

    const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");

    const response = await fetch(`${API_BASE}/api/speech-token`);
    const data = await response.json();
    if (!data?.token || !data?.region) {
      throw new Error("Invalid speech token response");
    }
    logWithTime("TTS speech token received");

    const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
      data.token,
      data.region
    );
    speechConfig.speechSynthesisVoiceName = voiceName || DEFAULT_VOICE;

    // Explicit SpeakerAudioDestination (not fromDefaultSpeakerOutput) so barge-in
    // can hard-stop playback. synthesizer.close() alone does NOT halt audio that
    // has already been handed to the speaker — that's what made narrations overlap
    // when the user asked a second question mid-sentence.
    const player = new SpeechSDK.SpeakerAudioDestination();
    const audioConfig = SpeechSDK.AudioConfig.fromSpeakerOutput(player);
    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig, audioConfig);
    synthesizer.__cvPlayer = player;   // handle so stopSpeaking() can pause/close it

    onStart?.();

    synthesizer.speakTextAsync(
      spokenText,
      (result) => {
        try { synthesizer.close(); } catch (_) {}
        if (result?.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          logWithTime("TTS finished speaking");
          onDone?.(result);
        } else {
          logWithTime("TTS did not complete", result?.errorDetails);
          onError?.(result);
        }
      },
      (err) => {
        try { synthesizer.close(); } catch (_) {}
        logWithTime("TTS error", err?.message || err);
        onError?.(err);
      }
    );

    return synthesizer;
  } catch (error) {
    logWithTime("Error initializing speech synthesis", error?.message);
    onError?.(error);
    throw error;
  }
};

// Stop playback immediately (user starts talking again — barge-in).
// synthesizer.close() does NOT stop audio already buffered in the speaker, so we
// also stop the synthesis pipeline (stopSpeakingAsync) AND pause/close the
// SpeakerAudioDestination — that's what actually silences an in-progress narration.
export const stopSpeaking = (synthesizer) => {
  if (!synthesizer) return;
  try {
    synthesizer.stopSpeakingAsync(
      () => { try { synthesizer.close(); } catch (_) {} },
      () => { try { synthesizer.close(); } catch (_) {} }
    );
  } catch (error) {
    try { synthesizer.close(); } catch (_) {}
    logWithTime("Error stopping speech synthesis", error?.message);
  }
  // Hard-stop whatever is already playing through the speaker.
  try { synthesizer.__cvPlayer?.pause(); } catch (_) {}
  try { synthesizer.__cvPlayer?.close(); } catch (_) {}
};
