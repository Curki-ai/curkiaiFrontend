// ===============================
// Extract audio from video (SILENT)
// ===============================
export const extractAudioFromVideo = async (videoFile) => {
  return new Promise((resolve, reject) => {
    const videoURL = URL.createObjectURL(videoFile);
    const video = document.createElement("video");

    // 🔇 HARD MUTE — no sound allowed
    video.src = videoURL;
    video.muted = true;
    video.volume = 0;
    video.playsInline = true;
    video.preload = "metadata";

    const audioContext = new AudioContext();

    // ⛔ prevent audio output completely
    audioContext.suspend();

    const source = audioContext.createMediaElementSource(video);
    const destination = audioContext.createMediaStreamDestination();

    // ✅ route ONLY to recorder
    source.connect(destination);

    const mediaRecorder = new MediaRecorder(destination.stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      URL.revokeObjectURL(videoURL);
      resolve(new Blob(chunks, { type: "audio/webm" }));
    };

    video.onloadedmetadata = async () => {
      try {
        mediaRecorder.start();

        // ❌ NEVER play video
        video.currentTime = 0;

        // Let decoding happen silently
        setTimeout(() => {
          mediaRecorder.stop();
        }, video.duration * 1000);
      } catch (err) {
        reject(err);
      }
    };

    video.onerror = reject;
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
