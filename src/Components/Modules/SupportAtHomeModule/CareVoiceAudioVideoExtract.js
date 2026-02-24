// ===============================
// Extract audio from video (SILENT)
// ===============================
export const extractAudioFromVideo = async (videoFile) => {
  return new Promise((resolve, reject) => {
    const videoURL = URL.createObjectURL(videoFile);
    const video = document.createElement("video");

    // Don't mute the video - we need the audio track
    video.muted = false;
    video.crossOrigin = "anonymous";
    video.src = videoURL;
    video.preload = "auto";

    // Create audio context and resume it
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // We need to wait for user interaction to resume AudioContext in some browsers
    // But since this is triggered by user click, we can resume it
    audioContext.resume().catch(err => {
      console.warn("AudioContext resume failed:", err);
    });

    const processVideo = async () => {
      try {
        // Create source from video element
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        // Also connect to speakers so video plays (optional, but helps with some browsers)
        source.connect(audioContext.destination);

        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(videoURL);
          audioContext.close();
          const audioBlob = new Blob(chunks, { type: "audio/webm" });

          // Check if we actually captured any audio
          if (chunks.length === 0 || audioBlob.size === 0) {
            reject(new Error("No audio data captured from video"));
          } else {
            resolve(audioBlob);
          }
        };

        // Start recording
        mediaRecorder.start();

        // Play the video to extract audio
        video.play().catch(err => {
          reject(new Error(`Failed to play video: ${err.message}`));
        });

        // Wait for video to end or timeout after duration + buffer
        const duration = video.duration || 30; // fallback to 30 seconds if duration unknown
        const timeout = setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, (duration * 1000) + 1000);

        video.onended = () => {
          clearTimeout(timeout);
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        };

      } catch (err) {
        reject(err);
      }
    };

    video.onloadedmetadata = () => {
      processVideo().catch(reject);
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(videoURL);
      audioContext?.close();
      reject(new Error(`Video loading failed: ${video.error?.message || 'Unknown error'}`));
    };
  });
};

// =================================
// Upload audio → get transcript text
// =================================
export const getTranscriptTextFromAudioBlob = async (audioBlob) => {
  // 1️⃣ Upload audio
  const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
    method: "POST",
    headers: {
      authorization: "f42a91a8cca04f3cb1667edcc30cd120",
    },
    body: audioBlob,
  });

  const { upload_url } = await uploadRes.json();

  // 2️⃣ Create transcript
  const transcriptRes = await fetch(
    "https://api.assemblyai.com/v2/transcript",
    {
      method: "POST",
      headers: {
        authorization: "f42a91a8cca04f3cb1667edcc30cd120",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        audio_url: upload_url,
        punctuate: true,
        format_text: true,
      }),
    }
  );

  const { id } = await transcriptRes.json();

  // 3️⃣ Poll until completed
  while (true) {
    const pollRes = await fetch(
      `https://api.assemblyai.com/v2/transcript/${id}`,
      {
        headers: {
          authorization: "f42a91a8cca04f3cb1667edcc30cd120",
        },
      }
    );

    const data = await pollRes.json();

    if (data.status === "completed") {
      return data.text;
    }

    if (data.status === "error") {
      throw new Error("Transcription failed");
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
};
