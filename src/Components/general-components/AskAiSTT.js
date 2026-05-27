// Azure Speech SDK is dynamic-imported on first call to startSpeechRecognition
// so the ~1.5 MB SDK doesn't ship in HomePage's chunk. Users who never use
// voice input never download it.
import { API_BASE } from "../../config/apiBase";
import incrementCareVoiceAnalysisCount from "../Modules/SupportAtHomeModule/careVoiceCostAnalysis";

// Azure Speech SDK streams from the mic and does not return a cost/token
// field — we derive USD from session wall-clock seconds. Rate comes from
// REACT_APP_STT_USD_PER_HOUR (build-time env), defaulting to $1.00/hr —
// Azure's Standard-tier real-time STT flat rate (no volume discount).
const STT_USD_PER_HOUR = Number(process.env.REACT_APP_STT_USD_PER_HOUR) || 1.0;
const STT_USD_PER_SECOND = STT_USD_PER_HOUR / 3600;

const logWithTime = (message, data = "") => {
    const time = new Date().toISOString();

    if (data) {
        console.log(`[${time}] ${message}`, data);
    } else {
        console.log(`[${time}] ${message}`);
    }
};

export const startSpeechRecognition = async (setTextCallback, userEmail, moduleName, getCurrentText) => {
    try {
        logWithTime("Initializing Azure Speech Configuration");

        const SpeechSDK = await import("microsoft-cognitiveservices-speech-sdk");

        const response = await fetch(`${API_BASE}/api/speech-token`);

        const data = await response.json();
        // console.log("data", data)
        logWithTime("Speech token received");

        const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(
            data.token,
            data.region
        );

        speechConfig.speechRecognitionLanguage = "en-US";
        speechConfig.setProperty(
            SpeechSDK.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
            "5000"
        );
        logWithTime("Creating microphone audio configuration");

        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

        logWithTime("Creating speech recognizer instance");

        const recognizer = new SpeechSDK.SpeechRecognizer(
            speechConfig,
            audioConfig
        );

        logWithTime("Speech recognizer initialized successfully");
        // Track session wall-clock so we can bill Azure-equivalent STT cost on stop.
        let sessionStartMs = null;
        let incrementFired = false;

        // Phrase-base model:
        //  - phraseBase = textarea content as of the start of the CURRENT phrase
        //  - phraseInProgress flips false→true on first `recognizing` for a phrase,
        //    back to false on `recognized`.
        //  - At each phrase boundary we re-read the textarea via getCurrentText
        //    so any manual edits the user made between phrases become the new
        //    base. This is what fixes manual edits being overwritten.
        let phraseBase = (typeof getCurrentText === "function" ? getCurrentText() : "") || "";
        let phraseInProgress = false;

        const composeWithBase = (newPhrase) => {
            const base = (phraseBase || "").trim();
            return (base ? base + " " : "") + newPhrase;
        };

        recognizer.recognizing = (sender, event) => {
            if (!event.result.text) return;

            // On the first interim event of a new phrase, snapshot whatever
            // is currently in the textarea as the base. This captures any
            // edits the user made since the previous phrase committed.
            if (!phraseInProgress) {
                phraseBase = (typeof getCurrentText === "function" ? getCurrentText() : phraseBase) || "";
                phraseInProgress = true;
            }

            setTextCallback(composeWithBase(event.result.text).trim());
        };

        recognizer.recognized = (sender, event) => {
            // CRITICAL: Transcript update happens FIRST so nothing added below
            // (logging, cost tracking) can ever delay or interfere with the
            // user-visible text.
            if (event.result.text) {
                // Defensive: if recognized fires without a prior recognizing
                // (rare — e.g. very short utterance), sync the base now.
                if (!phraseInProgress) {
                    phraseBase = (typeof getCurrentText === "function" ? getCurrentText() : phraseBase) || "";
                }

                const committed = composeWithBase(event.result.text).trim();
                phraseBase = committed;       // The finalized phrase joins the base
                phraseInProgress = false;     // Phrase done — next recognizing will re-snapshot
                setTextCallback(committed);
            }

            // Diagnostic logging — fully isolated in its own try/catch so a
            // malformed event.result can't bubble up and break the callback.
            try {
                const rawJson = event?.result?.json ? JSON.parse(event.result.json) : null;
                logWithTime("[ASKAI-STT] recognized event raw JSON:", rawJson);
                logWithTime("[ASKAI-STT] recognized event summary:", {
                    text: event?.result?.text,
                    offsetTicks: event?.result?.offset,
                    durationTicks: event?.result?.duration,
                    reason: event?.result?.reason,
                    resultId: event?.result?.resultId
                });
            } catch (e) {
                logWithTime("[ASKAI-STT] recognized event logging failed (non-fatal)", e?.message);
            }
        };

        recognizer.canceled = (sender, event) => {
            logWithTime("Speech recognition canceled", event.errorDetails);
        };

        recognizer.sessionStarted = () => {
            sessionStartMs = Date.now();
            logWithTime("Speech recognition session started", { sessionStartMs });
        };

        recognizer.sessionStopped = async () => {
            logWithTime("Speech recognition session stopped");

            // Fire the STT cost increment exactly once per session, regardless
            // of whether the session ended via user stop, timeout, or cancel.
            if (incrementFired) return;
            incrementFired = true;

            if (!sessionStartMs) {
                logWithTime("[ASKAI-STT] No sessionStartMs — skipping increment");
                return;
            }
            if (!userEmail) {
                logWithTime("[ASKAI-STT] No userEmail passed — skipping increment");
                return;
            }
            // Skip when caller couldn't resolve an active module — billing this
            // under a fake bucket would corrupt per-module cost reports.
            if (!moduleName) {
                logWithTime("[ASKAI-STT] No moduleName passed — skipping increment (caller did not resolve active module)");
                return;
            }

            const sessionSeconds = (Date.now() - sessionStartMs) / 1000;
            const sttCostUsd = sessionSeconds * STT_USD_PER_SECOND;
            logWithTime("[ASKAI-STT] Session totals", {
                sessionSeconds: sessionSeconds.toFixed(2),
                sttCostUsd: sttCostUsd.toFixed(6),
                rate: `$${STT_USD_PER_HOUR}/hr`,
                userEmail,
                moduleName
            });

            try {
                const result = await incrementCareVoiceAnalysisCount(
                    userEmail,
                    "askai-stt",
                    sttCostUsd,
                    moduleName,
                    0
                );
                logWithTime("[ASKAI-STT] Increment API response:", result);
            } catch (err) {
                logWithTime("[ASKAI-STT] Increment failed (non-fatal):", err?.message);
            }
        };

        logWithTime("Starting continuous speech recognition");

        recognizer.startContinuousRecognitionAsync(
            () => {
                logWithTime("Continuous speech recognition started successfully");
            },
            (error) => {
                logWithTime("Error starting speech recognition", error);
            }
        );

        return recognizer;

    } catch (error) {
        logWithTime("Error initializing speech recognition", error);
        throw error;
    }
};

export const stopSpeechRecognition = (recognizer) => {
    try {
        if (!recognizer) {
            logWithTime("Stop requested but recognizer instance not found");
            return;
        }

        logWithTime("Stopping speech recognition");

        recognizer.stopContinuousRecognitionAsync(
            () => {
                logWithTime("Speech recognition stopped successfully");
            },
            (error) => {
                logWithTime("Error stopping speech recognition", error);
            }
        );

    } catch (error) {
        logWithTime("Unexpected error while stopping speech recognition", error);
    }
};