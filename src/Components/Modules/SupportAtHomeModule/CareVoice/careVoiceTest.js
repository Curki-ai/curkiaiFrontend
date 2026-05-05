// Add this new state near your other useState declarations
const [preventAutoPlay, setPreventAutoPlay] = useState(false);

// Modify your useEffect for audio time updates to handle auto-play prevention
useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateTime = () => {
        setPlayTime(audio.currentTime);
    };

    // Prevent auto-play when document generation starts
    if (preventAutoPlay) {
        audio.pause();
        setIsPlaying(false);
    }

    audio.addEventListener("timeupdate", updateTime);

    return () => {
        audio.removeEventListener("timeupdate", updateTime);
    };
}, [audioURL, preventAutoPlay]);

// Modify your submitMultipleTranscripts function
const submitMultipleTranscripts = async () => {
    if (
        !selectedTemplate ||
        !selectedTemplate.isMulti ||
        selectedTemplate.templates.length === 0 ||
        uploadedTranscriptFiles.length === 0
    ) return;

    // Prevent audio from playing during document generation
    setPreventAutoPlay(true);
    
    // Pause any playing audio
    if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
    }

    setIsGeneratingFile(true);
    setFileStage("generating");
    animateProgress(fileProgress, setFileProgress, 40, 700);
    const docsToSend = [];

    const tasks = [];

    for (const tpl of selectedTemplate.templates) {
        for (const file of uploadedTranscriptFiles) {
            tasks.push(
                (async () => {
                    let transcriptText = null;

                    if (isVideoFile(file)) {
                        const audioBlob = await extractAudioFromVideo(file);
                        transcriptText = await getTranscriptTextFromAudioBlob(audioBlob);
                    }
                    else if (isAudioFile(file)) {
                        transcriptText = await getTranscriptTextFromAudioBlob(file);
                    }

                    if (transcriptText) {
                        const doc = await processSingleTranscriptWithTemplateText(
                            tpl,
                            transcriptText
                        );
                        if (doc) docsToSend.push(doc);
                    } else {
                        // fallback: existing doc/pdf/txt flow
                        const doc = await processSingleTranscriptWithTemplate(tpl, file);
                        if (doc) docsToSend.push(doc);
                    }
                })()
            );
        }
    }

    await Promise.all(tasks);
    animateProgress(fileProgress, setFileProgress, 75, 600);
    setFileStage("emailing");
    animateProgress(fileProgress, setFileProgress, 90, 500);
    await sendGeneratedDocsEmail(docsToSend);
    animateProgress(fileProgress, setFileProgress, 100, 400);
    emailSentRef.current = false;
    setIsGeneratingFile(false);
    setFileStage(null);
    resetStaffUI();
    setCurrentTask("");
    
    // Re-enable audio after generation completes
    setPreventAutoPlay(false);
};

// Similarly modify submitToDocumentFiller function
const submitToDocumentFiller = async () => {
    if (
        !selectedTemplate ||
        (selectedTemplate.isMulti && selectedTemplate.templates.length === 0)
    ) {
        alert("please select atleast one template")
        return;
    }

    // Prevent audio from playing during document generation
    setPreventAutoPlay(true);
    
    // Pause any playing audio
    if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
    }

    try {
        setIsGeneratingFile(true);

        const formData = new FormData();
        // TEMPLATE FROM BLOB METADATA
        formData.append("templateBlobName", selectedTemplate.templateBlobName);
        formData.append("templateMimeType", selectedTemplate.templateMimeType);
        formData.append("templateOriginalName", selectedTemplate.templateOriginalName);

        // SAMPLE BLOBS (ARRAY OR EMPTY)
        formData.append(
            "sampleBlobs",
            JSON.stringify(selectedTemplate.sampleBlobs || [])
        );
        // console.log("[STAFF][DOC] Using RAW prompt:", selectedTemplate.prompt);
        // console.log("[STAFF][DOC] Using RAW mapper:", selectedTemplate.mappings);

        formData.append("prompt", selectedTemplate.prompt);
        const parsedJson = JSON.parse(selectedTemplate.mappings);
        // console.log("parsedJson (raw)", parsedJson);

        // normalize mapper here
        const normalizedMapper = {
            ...parsedJson,
            mapper: parsedJson?.mapper?.mapper ?? parsedJson?.mapper
        };

        // console.log("parsedJson (normalized)", normalizedMapper);

        formData.append(
            "mapper",
            JSON.stringify(normalizedMapper)
        );

        if (transcriptData?.text) {
            formData.append("transcript_data", transcriptData.text);
        } else if (uploadedTranscriptFile) {
            // ✅ NEW (FORCE FILE MODE)
            formData.append(
                "transcript_data",
                uploadedTranscriptFile,
                uploadedTranscriptFile.name
            );

        }

        const res = await fetch(`${API_BASE}/api/document-filler`, {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        if (userEmail) {
            await incrementAnalysisCount(
                userEmail,
                "care-voice-document-generation",
                data?.llm_cost?.total_usd
            )
        }
        if (data.success && data.filled_document) {
            const filename = "Generated_Document.docx";

            const docs = [{ filename, base64: data.filled_document }];

            setGeneratedDocs(docs);
            downloadBase64File(data.filled_document, filename);

            await sendGeneratedDocsEmail(docs);
            resetStaffUI();
        }

        setGeneratedDocs([]);
        emailSentRef.current = false;

    } catch (err) {
        console.error("Document generation failed", err);
        alert("Failed to generate document");
    } finally {
        setIsGeneratingFile(false);
        setTranscribing(false);
        // Re-enable audio after generation completes
        setPreventAutoPlay(false);
    }
};

// Also modify acceptRecording function if needed
const acceptRecording = async () => {
    if (!audioBlob) return;
    if (recordTime < 10) {
        alert("Audio must be at least 10 seconds long.");
        return;
    }
    
    // Prevent audio from playing during processing
    setPreventAutoPlay(true);
    
    // Pause any playing audio
    if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
    }
    
    try {
        if (platformType !== "windows" || platformType !== "mac") {
            console.log("ANDROID detected, using backend voice pipeline");
            setGenerationStage("generating");
            await processVoiceRecordingAndroid();
            setGenerationStage(null);
            resetStaffUI();
            return;
        }
        setGenerationStage("transcribing");
        animateProgress(audioProgress, setAudioProgress, 20, 600);
        setTranscribing(true);
        setTranscriptSource("audio");
        const uploadUrl = await uploadAudioToAssemblyAI();
        const transcriptId = await createTranscript(uploadUrl);
        pollTranscript(transcriptId);
    } catch (err) {
        console.error("AssemblyAI failed", err);
    } finally {
        // Re-enable audio after processing completes
        setPreventAutoPlay(false);
    }
};