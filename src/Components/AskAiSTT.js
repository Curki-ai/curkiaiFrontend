import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";

const logWithTime = (message, data = "") => {
    const time = new Date().toISOString();

    if (data) {
        console.log(`[${time}] ${message}`, data);
    } else {
        console.log(`[${time}] ${message}`);
    }
};

export const startSpeechRecognition = async (setTextCallback) => {
    try {
        logWithTime("Initializing Azure Speech Configuration");

        const response = await fetch("https://curki-test-prod-auhyhehcbvdmh3ef.canadacentral-01.azurewebsites.net/api/speech-token");

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
        let finalTranscript = "";
        recognizer.recognizing = (sender, event) => {
            if (event.result.text) {
                const combined = finalTranscript + " " + event.result.text;
                setTextCallback(combined.trim());
            }
        };

        recognizer.recognized = (sender, event) => {
            if (event.result.text) {

                finalTranscript += " " + event.result.text;

                setTextCallback(finalTranscript.trim());
            }
        };

        recognizer.canceled = (sender, event) => {
            logWithTime("Speech recognition canceled", event.errorDetails);
        };

        recognizer.sessionStarted = () => {
            logWithTime("Speech recognition session started");
        };

        recognizer.sessionStopped = () => {
            logWithTime("Speech recognition session stopped");
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