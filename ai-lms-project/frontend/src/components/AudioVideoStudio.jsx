import React, { useState, useRef, useEffect } from "react";
import api from "../api";

function AudioVideoStudio() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState(5);
  const [language, setLanguage] = useState("English");
  const [mediaType, setMediaType] = useState("Audio & Video Overview");

  const [loading, setLoading] = useState(false);
  const [extractedContent, setExtractedContent] = useState("");
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDownloadUrl, setAudioDownloadUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDownloadUrl, setVideoDownloadUrl] = useState("");
  const [pptUrl, setPptUrl] = useState("");
  const [pptDownloadUrl, setPptDownloadUrl] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [videoNotesActivity, setVideoNotesActivity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Interactive Metadata States
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [isFullscreenPPT, setIsFullscreenPPT] = useState(false);

  const [audioSegments, setAudioSegments] = useState([]);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);

  // Storyboard Interactive Video Simulation States
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);

  const [videoQuizzes, setVideoQuizzes] = useState([]);
  const [activeQuizOverlay, setActiveQuizOverlay] = useState(null);
  const [completedQuizIds, setCompletedQuizIds] = useState([]);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState(null);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const pptContainerRef = useRef(null);
  const videoTimerRef = useRef(null);

  const languagesList = [
    { label: "🇬🇧 English", value: "English" },
    { label: "🇮🇳 Hinglish", value: "Hinglish" },
    { label: "🇮🇳 Hindi", value: "Hindi" },
    { label: "🇮🇳 Punjabi", value: "Punjabi" },
    { label: "🇮🇳 Tamil", value: "Tamil" },
    { label: "🇮🇳 Telugu", value: "Telugu" },
    { label: "🇮🇳 Marathi", value: "Marathi" },
    { label: "🇮🇳 Gujarati", value: "Gujarati" },
    { label: "🇪🇸 Spanish", value: "Spanish" },
    { label: "🇫🇷 French", value: "French" },
    { label: "🇩🇪 German", value: "German" }
  ];

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await api.post("/quiz/parse-file", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setExtractedContent(response.data.extracted_text);
        if (!topicTitle) {
          setTopicTitle(uploadedFile.name.replace(/\.[^/.]+$/, ""));
        }
      } else {
        setErrorMessage(response.data.error || "File parsing failed.");
      }
    } catch (err) {
      console.error("File parse error:", err);
      setErrorMessage("Failed to extract content from file.");
    } finally {
      setLoading(false);
    }
  };

  const resolveUrl = (rawUrl) => {
    if (!rawUrl) return "";
    let cleanUrl = rawUrl;
    if (cleanUrl.includes("127.0.0.1:8000") || cleanUrl.includes("localhost:8000")) {
      const idx = cleanUrl.search(/\/(audios|videos|ppts|images|lesson|converter)\//);
      if (idx !== -1) cleanUrl = cleanUrl.substring(idx);
    }
    if (cleanUrl.startsWith("/")) {
      const base = (api.defaults.baseURL || "").replace(/\/+$/, "");
      return `${base}${cleanUrl}`;
    }
    return cleanUrl;
  };

  const buildFallbackSlides = (topicName, scriptText, storyboardText) => {
    const fallbackList = [
      {
        slide_number: 1,
        title: topicName || "Master Lesson Overview",
        subtitle: `Class ${gradeLevel} Level • Interactive Presentation (${language})`,
        bullets: [
          `Subject Topic: ${topicName || "Study Material"}`,
          `Target Grade Level: Class ${gradeLevel}`,
          `Language Mode: ${language}`,
          "AI LMS Interactive Multimedia Studio"
        ],
        visual_cue: "💡 Key Overview & Learning Objectives",
        speaker_notes: `Welcome to this interactive presentation on '${topicName}'. Today we will cover key concepts, practical examples, and summary activities.`
      }
    ];

    const source = storyboardText || scriptText || "";
    const rawScenes = source.split("\n\n").filter((s) => s.trim() && !s.startsWith("#")).slice(0, 5);
    rawScenes.forEach((sceneText, idx) => {
      const clean = sceneText.replace(/[*#_~`\[\]]/g, "").trim();
      const parts = clean.split(".").filter((p) => p.trim());
      const slideTitle = parts[0] ? parts[0].substring(0, 50) : `Concept Section ${idx + 1}`;
      const bullets = parts.length > 1 ? parts.slice(1, 5) : [clean.substring(0, 140)];

      fallbackList.push({
        slide_number: idx + 2,
        title: `Slide ${idx + 2}: ${slideTitle}`,
        subtitle: `Section ${idx + 1} of ${rawScenes.length}`,
        bullets: bullets,
        visual_cue: `⚡ Interactive Diagram #${idx + 1}`,
        speaker_notes: `Teacher Note for Slide ${idx + 2}: Emphasize ${slideTitle} and ask students how it relates to real-world experiences.`
      });
    });

    return fallbackList;
  };

  const buildFallbackAudioSegments = (scriptText) => {
    const paras = scriptText.split("\n\n").filter((p) => p.trim());
    let curr = 0;
    return paras.map((p, idx) => {
      const clean = p.replace(/[*#_~`\[\]]/g, "").trim();
      const dur = Math.max(8, Math.min(25, Math.floor(clean.length / 12)));
      const segment = {
        id: idx + 1,
        start_time: curr,
        end_time: curr + dur,
        time_label: `${String(Math.floor(curr / 60)).padStart(2, "0")}:${String(Math.floor(curr % 60)).padStart(2, "0")}`,
        text: clean
      };
      curr += dur;
      return segment;
    });
  };

  const buildFallbackVideoQuizzes = (topicName) => [
    {
      id: 1,
      timestamp: 10,
      time_label: "00:10",
      chapter_title: "1. Introduction & Overview",
      question: `What is the primary topic covered in this lesson?`,
      options: [
        topicName || "Core Topic",
        "Ancient World History",
        "Advanced Astrophysics",
        "General Unrelated Science"
      ],
      correct_index: 0,
      explanation: `Correct! Today's lesson is specifically focused on ${topicName || "the assigned topic"}.`
    },
    {
      id: 2,
      timestamp: 25,
      time_label: "00:25",
      chapter_title: "2. Main Concept Checkpoint",
      question: `Which grade level is this lesson material calibrated for?`,
      options: [
        "Primary School",
        `Class ${gradeLevel} Level`,
        "University Post-Doc",
        "Nursery"
      ],
      correct_index: 1,
      explanation: `Spot on! The lesson explanation and tone are tuned for Class ${gradeLevel}.`
    },
    {
      id: 3,
      timestamp: 45,
      time_label: "00:45",
      chapter_title: "3. Interactive Reflection",
      question: "What is the best way to consolidate learning after this lesson?",
      options: [
        "Forget the material immediately",
        "Complete the hands-on activity and check questions",
        "Skip all exercises",
        "Close without reviewing"
      ],
      correct_index: 1,
      explanation: "Excellent! Completing hands-on reflection activities boosts retention."
    }
  ];

  const handleGenerateMedia = async () => {
    const finalSource = extractedContent || textInput;
    if (!finalSource.trim() && !topicTitle.trim()) {
      alert("Please upload a file, paste text, or enter a topic title.");
      return;
    }

    setLoading(true);
    setScript("");
    setAudioUrl("");
    setAudioDownloadUrl("");
    setVideoUrl("");
    setVideoDownloadUrl("");
    setPptUrl("");
    setPptDownloadUrl("");
    setVideoScript("");
    setVideoNotesActivity("");
    setErrorMessage("");

    setSlides([]);
    setCurrentSlideIndex(0);
    setAudioSegments([]);
    setVideoQuizzes([]);
    setCompletedQuizIds([]);
    setActiveQuizOverlay(null);
    setIsVideoPlaying(false);
    setCurrentVideoTime(0);

    // Stop any ongoing speech
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await api.post("/lesson/generate-audio-video-studio", {
        topic: topicTitle || "Uploaded Study Material",
        class_name: Number(gradeLevel),
        language: language,
        media_type: "video",
        source_content: finalSource
      });

      if (response.data.success) {
        const genScript = response.data.script || "";
        const genVideoScript = response.data.video_script || "";
        setScript(genScript);
        setVideoScript(genVideoScript);
        setVideoNotesActivity(response.data.video_notes_activity || "");

        if (response.data.audio_url) setAudioUrl(resolveUrl(response.data.audio_url));
        if (response.data.audio_download_url) setAudioDownloadUrl(resolveUrl(response.data.audio_download_url));
        if (response.data.video_url) setVideoUrl(resolveUrl(response.data.video_url));
        if (response.data.video_download_url) setVideoDownloadUrl(resolveUrl(response.data.video_download_url));
        if (response.data.ppt_url) setPptUrl(resolveUrl(response.data.ppt_url));
        if (response.data.ppt_download_url) setPptDownloadUrl(resolveUrl(response.data.ppt_download_url));

        // Interactive Metadata
        const returnedSlides = response.data.slides && response.data.slides.length > 0
          ? response.data.slides
          : buildFallbackSlides(topicTitle || "Study Lesson", genScript, genVideoScript);
        setSlides(returnedSlides);

        const returnedSegments = response.data.audio_segments && response.data.audio_segments.length > 0
          ? response.data.audio_segments
          : buildFallbackAudioSegments(genScript);
        setAudioSegments(returnedSegments);

        const returnedQuizzes = response.data.video_quizzes && response.data.video_quizzes.length > 0
          ? response.data.video_quizzes
          : buildFallbackVideoQuizzes(topicTitle);
        setVideoQuizzes(returnedQuizzes);

      } else {
        setErrorMessage(response.data.error || "Media generation failed.");
      }
    } catch (err) {
      console.error("Studio error:", err);
      setErrorMessage(err.response?.data?.detail || "Media synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech Synthesis Engine (Native AI Voice Fallback)
  const speakBrowserSpeech = (text, rate = 1.0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_~`\[\]]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = rate;

    const langMap = {
      English: "en-US",
      Hindi: "hi-IN",
      Hinglish: "hi-IN",
      Punjabi: "pa-IN",
      Tamil: "ta-IN",
      Telugu: "te-IN",
      Marathi: "mr-IN",
      Gujarati: "gu-IN",
      Spanish: "es-ES",
      French: "fr-FR",
      German: "de-DE"
    };
    utterance.lang = langMap[language] || "en-US";

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    } else {
      // Browser Speech Synthesis
      if (isPlayingAudio) {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        speakBrowserSpeech(script, audioPlaybackSpeed);
      }
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setAudioPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    if (isPlayingAudio && !audioUrl) {
      speakBrowserSpeech(script, newSpeed);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentAudioTime(audioRef.current.currentTime);
    }
  };

  const handleSeekAudio = (seg) => {
    if (audioUrl && audioRef.current) {
      audioRef.current.currentTime = seg.start_time;
      audioRef.current.play();
      setIsPlayingAudio(true);
    } else {
      speakBrowserSpeech(seg.text, audioPlaybackSpeed);
      setCurrentAudioTime(seg.start_time);
    }
  };

  // Video Time Update & In-Video Quiz Checkpoints
  const handleVideoTimeUpdate = () => {
    if (!videoRef.current || activeQuizOverlay) return;
    const time = videoRef.current.currentTime;
    setCurrentVideoTime(time);

    videoQuizzes.forEach((quiz) => {
      if (!completedQuizIds.includes(quiz.id) && Math.abs(time - quiz.timestamp) <= 0.8) {
        videoRef.current.pause();
        setActiveQuizOverlay(quiz);
        setSelectedOptionIndex(null);
        setQuizFeedback(null);
      }
    });
  };

  // Simulated Storyboard Video Timer (When no videoUrl file is present)
  useEffect(() => {
    if (isVideoPlaying && !videoUrl) {
      videoTimerRef.current = setInterval(() => {
        setCurrentVideoTime((prev) => {
          const nextTime = prev + 1;
          const totalScenes = Math.max(1, slides.length);
          const sceneIndex = Math.floor(nextTime / 15) % totalScenes;
          setCurrentSceneIndex(sceneIndex);

          // Check Quiz Checkpoints in simulated video
          videoQuizzes.forEach((quiz) => {
            if (!completedQuizIds.includes(quiz.id) && Math.abs(nextTime - quiz.timestamp) <= 0.5) {
              setIsVideoPlaying(false);
              setActiveQuizOverlay(quiz);
              setSelectedOptionIndex(null);
              setQuizFeedback(null);
            }
          });

          return nextTime;
        });
      }, 1000);
    } else {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    }
    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, [isVideoPlaying, videoUrl, videoQuizzes, completedQuizIds, slides.length]);

  const handleToggleVideo = () => {
    if (videoUrl && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    } else {
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleSeekVideoChapter = (timestamp) => {
    setCurrentVideoTime(timestamp);
    if (videoUrl && videoRef.current) {
      videoRef.current.currentTime = timestamp;
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      const sceneIdx = Math.min(slides.length - 1, Math.floor(timestamp / 15));
      setCurrentSceneIndex(sceneIdx);
      setIsVideoPlaying(true);
    }
  };

  const handleAnswerQuiz = () => {
    if (selectedOptionIndex === null || !activeQuizOverlay) return;
    const isCorrect = selectedOptionIndex === activeQuizOverlay.correct_index;
    setQuizFeedback({
      isCorrect,
      explanation: activeQuizOverlay.explanation
    });
  };

  const handleResumeVideoAfterQuiz = () => {
    if (activeQuizOverlay) {
      setCompletedQuizIds((prev) => [...prev, activeQuizOverlay.id]);
    }
    setActiveQuizOverlay(null);
    setSelectedOptionIndex(null);
    setQuizFeedback(null);

    if (videoUrl && videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    } else {
      setIsVideoPlaying(true);
    }
  };

  // PPT Fullscreen
  const toggleFullscreenPPT = () => {
    if (!pptContainerRef.current) return;
    if (!document.fullscreenElement) {
      pptContainerRef.current.requestFullscreen().then(() => setIsFullscreenPPT(true)).catch((e) => console.log(e));
    } else {
      document.exitFullscreen().then(() => setIsFullscreenPPT(false)).catch((e) => console.log(e));
    }
  };

  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreenPPT(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFSChange);
    return () => document.removeEventListener("fullscreenchange", handleFSChange);
  }, []);

  const activeSlide = slides[currentSlideIndex] || (slides.length > 0 ? slides[0] : null);
  const activeVideoScene = slides[currentSceneIndex] || activeSlide;

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>🎙️🎬 AI LMS</span> Interactive Audio, Video & PPT Studio
          </h2>
          <p className="page-subtitle">
            Interactive Slide Presenter, Voice-Synced Audio Player, and In-Video Quiz Checkpoints for Multilingual Learning.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          MULTIMEDIA_STUDIO_ACTIVE
        </span>
      </div>

      {/* Input Controls */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left Side: Upload & Input */}
        <div>
          <div className="form-group">
            <label>1. Upload Study Source (PPT, PDF, Image, DOCX, TXT)</label>
            <div style={{ position: "relative" }}>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt,.ppt,.pptx"
                onChange={handleFileUpload}
                disabled={loading}
                style={{ padding: "10px" }}
              />
            </div>
            {file && (
              <p style={{ fontSize: "12px", color: "var(--accent-turquoise)", marginTop: "6px" }}>
                📁 Loaded: <strong>{file.name}</strong> ({extractedContent.length} chars extracted)
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Or Paste Raw Study Passage / Lesson Notes</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste any textbook passage or topic notes here..."
              disabled={loading}
              rows={4}
            />
          </div>
        </div>

        {/* Right Side: Options & Preferences */}
        <div>
          <div className="form-group">
            <label>2. Topic / Chapter Title</label>
            <input
              type="text"
              value={topicTitle}
              onChange={(e) => setTopicTitle(e.target.value)}
              placeholder="e.g. Machine Learning, Photosynthesis, Newton's Laws..."
              disabled={loading}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="form-group">
              <label>Target Class / Grade</label>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} disabled={loading}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((c) => (
                  <option key={c} value={c}>Class {c} Level</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Narration Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} disabled={loading}>
                {languagesList.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Output Media Generation Mode</label>
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} disabled={loading}>
              <option value="Audio & Video Overview">🎙️🎬 Interactive Audio, Video & PPT Deck</option>
              <option value="Audio Voice Narration">🎙️ Audio Voice Narration (.mp3)</option>
              <option value="Video Storyboard Script">🎬 Video Storyboard & Presentation Script</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generate Action Button */}
      <div style={{ marginTop: "12px" }}>
        <button
          className="btn-primary"
          onClick={handleGenerateMedia}
          disabled={loading}
          style={{ padding: "14px 28px", width: "100%", fontSize: "14px" }}
        >
          {loading ? "⏳ Synthesizing Interactive Audio, Video & PPT Studio..." : "✨ Synthesize Audio & Video Lesson"}
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="alert-error" style={{ marginTop: "16px" }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="alert-loading" style={{ marginTop: "20px" }}>
          <div className="pulse-dot"></div>
          🎙️ AI LMS Master Teacher is synthesizing interactive PowerPoint deck, voice sync narration, and educational video checkpoints in {language}...
        </div>
      )}

      {/* Studio Action & Export Bar */}
      {(script || videoScript) && !loading && (
        <div style={{ background: "rgba(0, 212, 255, 0.06)", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "16px 20px", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-cyan)", letterSpacing: "1px", textTransform: "uppercase" }}>
              ⚡ AI LMS Studio Export Controls ({language})
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Download or export generated PowerPoint deck (.pptx), audio narration (.mp3), and educational video clip (.mp4)
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {pptDownloadUrl ? (
              <a
                href={pptDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
              >
                📊 Download PPT Presentation (.pptx)
              </a>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const blob = new Blob([
                    `AI LMS PRESENTATION DECK - ${topicTitle || "Lesson"}\nGrade: Class ${gradeLevel} | Language: ${language}\n\n` +
                    slides.map((s, i) => `SLIDE ${i + 1}: ${s.title}\n${s.bullets.map(b => " - " + b).join("\n")}\nNotes: ${s.speaker_notes || ""}\n\n`).join("---\n\n")
                  ], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `AI_LMS_${topicTitle || "Lesson"}_Presentation.txt`;
                  a.click();
                }}
                style={{ padding: "10px 18px", fontSize: "12px", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
              >
                📊 Export PPT Slide Deck
              </button>
            )}

            {audioDownloadUrl ? (
              <a
                href={audioDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none" }}
              >
                ⬇️ Download MP3 Audio
              </a>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleToggleAudio}
                style={{ padding: "10px 18px", fontSize: "12px" }}
              >
                {isPlayingAudio ? "⏸ Pause Narration" : "🎙️ Play / Listen Voice Narration"}
              </button>
            )}

            {videoDownloadUrl ? (
              <a
                href={videoDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none", background: "var(--amber-gradient)" }}
              >
                ⬇️ Download MP4 Video
              </a>
            ) : (
              <button
                type="button"
                className="btn-primary"
                onClick={handleToggleVideo}
                style={{ padding: "10px 18px", fontSize: "12px", background: "var(--amber-gradient)" }}
              >
                {isVideoPlaying ? "⏸ Pause Video" : "🎬 Play Interactive Video"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: INTERACTIVE SLIDE-BY-SLIDE PPT VIEWER     */}
      {/* ---------------------------------------------------- */}
      {(slides.length > 0 || script) && !loading && (
        <div style={{ marginTop: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "700", color: "var(--accent-violet)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                📊 Interactive Slide-by-Slide PPT Viewer & Presenter
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Navigate through interactive slides, review speaker notes, or enter fullscreen presenter mode.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSpeakerNotes(!showSpeakerNotes)}
                style={{ padding: "6px 12px", fontSize: "12px" }}
              >
                💬 {showSpeakerNotes ? "Hide Speaker Notes" : "Show Speaker Notes"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={toggleFullscreenPPT}
                style={{ padding: "6px 12px", fontSize: "12px", border: "1px solid var(--accent-cyan)", color: "var(--accent-cyan)" }}
              >
                🖥️ {isFullscreenPPT ? "Exit Fullscreen" : "Presenter Fullscreen"}
              </button>
            </div>
          </div>

          {/* PPT Presentation Canvas */}
          <div
            ref={pptContainerRef}
            className="hud-corner"
            style={{
              background: "#070b19",
              border: "2px solid var(--accent-violet)",
              borderRadius: "var(--radius-lg)",
              padding: isFullscreenPPT ? "40px" : "24px",
              minHeight: "360px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              position: "relative"
            }}
          >
            {/* Top Slide Header Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(168, 85, 247, 0.3)", paddingBottom: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ background: "var(--accent-violet)", color: "#fff", padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                  SLIDE {currentSlideIndex + 1} OF {Math.max(1, slides.length)}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  {activeSlide?.subtitle || topicTitle || "Lesson Deck"}
                </span>
              </div>
              <span style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "600" }}>
                AI LMS PRESENTATION DECK ({language})
              </span>
            </div>

            {/* Slide Body Content */}
            {activeSlide && (
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "22px", color: "var(--accent-cyan)", marginBottom: "16px", textShadow: "0 0 10px rgba(0,212,255,0.3)" }}>
                    {activeSlide.title}
                  </h2>
                  <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
                    {activeSlide.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} style={{ fontSize: "14px", color: "#f1f5f9", marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <span style={{ color: "var(--accent-turquoise)", fontSize: "16px" }}>▶</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Slide Graphic Card */}
                <div style={{ background: "rgba(16, 25, 48, 0.8)", border: "1px solid var(--accent-violet)", borderRadius: "12px", padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "42px", marginBottom: "8px" }}>👩‍🏫</div>
                  <h4 style={{ fontSize: "13px", color: "var(--accent-violet)", fontWeight: "700" }}>
                    {activeSlide.visual_cue || "Interactive Visual"}
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                    Master Teacher Graphic • Class {gradeLevel}
                  </p>
                </div>
              </div>
            )}

            {/* Speaker Notes Drawer (Collapsible) */}
            {showSpeakerNotes && activeSlide?.speaker_notes && (
              <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.6)", border: "1px dashed var(--accent-cyan)", padding: "12px", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  🗣️ Teacher Speaker Notes & Script Prompt:
                </p>
                <p style={{ fontSize: "12px", color: "#cbd5e1", fontStyle: "italic" }}>
                  "{activeSlide.speaker_notes}"
                </p>
              </div>
            )}

            {/* Slide Navigation Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                ⬅️ Previous Slide
              </button>

              <div style={{ display: "flex", gap: "6px" }}>
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlideIndex(idx)}
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: "none",
                      background: idx === currentSlideIndex ? "var(--accent-cyan)" : "rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                className="btn-primary"
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                style={{ padding: "8px 16px", fontSize: "12px" }}
              >
                Next Slide ➡️
              </button>
            </div>
          </div>

          {/* Interactive Slide Thumbnail Strip */}
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", overflowX: "auto", paddingBottom: "6px" }}>
            {slides.map((slide, sIdx) => (
              <div
                key={sIdx}
                onClick={() => setCurrentSlideIndex(sIdx)}
                style={{
                  minWidth: "140px",
                  background: sIdx === currentSlideIndex ? "rgba(0, 212, 255, 0.15)" : "#060914",
                  border: sIdx === currentSlideIndex ? "2px solid var(--accent-cyan)" : "1px solid var(--border-cyan)",
                  borderRadius: "8px",
                  padding: "10px",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: "10px", color: "var(--accent-cyan)", fontWeight: "700" }}>
                  SLIDE {sIdx + 1}
                </div>
                <div style={{ fontSize: "11px", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px" }}>
                  {slide.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: INTERACTIVE AUDIO PLAYER & TRANSCRIPT     */}
      {/* ---------------------------------------------------- */}
      {(audioUrl || script) && !loading && (
        <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "20px", marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-cyan)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                🔊 Interactive Audio Voice Player & Transcript Sync ({language})
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Listen to the voice narration. Click any line in the transcript to jump audio playback directly to that sentence!
              </p>
            </div>

            {/* Audio Speed Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Playback Speed:</span>
              <select
                value={audioPlaybackSpeed}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                style={{ padding: "4px 8px", fontSize: "12px", width: "80px" }}
              >
                <option value={0.75}>0.75x</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2.0}>2.0x</option>
              </select>
            </div>
          </div>

          {/* Equalizer Visualizer & Player Box */}
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid var(--border-cyan)", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleToggleAudio}
                  style={{ padding: "8px 18px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {isPlayingAudio ? "⏸ Pause Narration" : "▶ Play Voice Narration"}
                </button>

                {/* Dynamic Soundwave Animated Equalizer */}
                <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "24px" }}>
                  {[12, 22, 16, 28, 10, 24, 18, 30, 14, 20].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: "4px",
                        height: isPlayingAudio ? `${h}px` : "6px",
                        background: "var(--accent-cyan)",
                        borderRadius: "2px",
                        transition: "height 0.2s ease",
                        animation: isPlayingAudio ? `pulse 0.6s infinite alternate ${i * 0.1}s` : "none"
                      }}
                    />
                  ))}
                </div>
              </div>

              <span style={{ fontSize: "12px", color: "var(--accent-cyan)", fontWeight: "600" }}>
                {isPlayingAudio ? "🎙️ Playing Multilingual Voiceover..." : "⏸ Voiceover Ready"}
              </span>
            </div>

            {audioUrl ? (
              <audio
                ref={audioRef}
                controls
                src={audioUrl}
                onTimeUpdate={handleAudioTimeUpdate}
                onPlay={() => setIsPlayingAudio(true)}
                onPause={() => setIsPlayingAudio(false)}
                style={{ width: "100%", marginTop: "6px" }}
              >
                Your browser does not support HTML5 audio.
              </audio>
            ) : (
              <p style={{ fontSize: "11px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                ⚡ Using Browser Neural Speech Synthesis for Instant Zero-Latency Voice Playback in {language}
              </p>
            )}
          </div>

          {/* Interactive Line-by-Line Synchronized Transcript */}
          {audioSegments.length > 0 && (
            <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
              {audioSegments.map((seg) => {
                const isActive = currentAudioTime >= seg.start_time && currentAudioTime < seg.end_time;
                return (
                  <div
                    key={seg.id}
                    onClick={() => handleSeekAudio(seg)}
                    style={{
                      background: isActive ? "rgba(0, 212, 255, 0.15)" : "rgba(10, 15, 30, 0.6)",
                      border: isActive ? "1px solid var(--accent-cyan)" : "1px solid transparent",
                      borderRadius: "6px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start"
                    }}
                  >
                    <span style={{ background: isActive ? "var(--accent-cyan)" : "rgba(255,255,255,0.1)", color: isActive ? "#000" : "var(--accent-cyan)", padding: "2px 6px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" }}>
                      ⏱️ {seg.time_label}
                    </span>
                    <p style={{ fontSize: "13px", color: isActive ? "#ffffff" : "#cbd5e1", margin: 0, lineHeight: "1.5" }}>
                      {seg.text}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: INTERACTIVE VIDEO WITH CHECKPOINT QUIZZES */}
      {/* ---------------------------------------------------- */}
      {(videoUrl || videoScript || script) && !loading && (
        <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-turquoise)", borderRadius: "var(--radius-lg)", padding: "20px", marginTop: "24px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                🎬 Interactive Educational Video & In-Video Checkpoint Quizzes
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Watch the video lesson. The player pauses at key moments to prompt interactive check-for-understanding quizzes!
              </p>
            </div>
          </div>

          {/* Chapter Bookmarks Strip */}
          {videoQuizzes.length > 0 && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", overflowX: "auto", paddingBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--accent-turquoise)", fontWeight: "700", display: "flex", alignItems: "center" }}>
                📌 CHAPTERS:
              </span>
              {videoQuizzes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSeekVideoChapter(q.timestamp)}
                  style={{
                    background: completedQuizIds.includes(q.id) ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 212, 255, 0.1)",
                    border: completedQuizIds.includes(q.id) ? "1px solid #10b981" : "1px solid var(--border-cyan)",
                    color: completedQuizIds.includes(q.id) ? "#10b981" : "var(--accent-cyan)",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    fontSize: "11px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {completedQuizIds.includes(q.id) ? "✅" : "📍"} {q.time_label} {q.chapter_title}
                </button>
              ))}
            </div>
          )}

          {/* Video Player Box with In-Video Quiz Overlay */}
          <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-cyan)" }}>
            {videoUrl ? (
              <video
                ref={videoRef}
                controls
                src={videoUrl}
                onTimeUpdate={handleVideoTimeUpdate}
                style={{ width: "100%", maxHeight: "380px", display: "block", background: "#000" }}
              >
                Your browser does not support HTML5 video.
              </video>
            ) : (
              /* Interactive Storyboard Cinema Canvas Player */
              <div style={{ background: "linear-gradient(135deg, #070e24 0%, #030611 100%)", minHeight: "340px", padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
                {/* Top Video Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ background: "rgba(0, 212, 255, 0.2)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "4px 10px", borderRadius: "10px", fontSize: "11px", fontWeight: "700" }}>
                    🎬 SCENE {currentSceneIndex + 1} OF {Math.max(1, slides.length)}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--accent-turquoise)", fontWeight: "600" }}>
                    ⏱️ {String(Math.floor(currentVideoTime / 60)).padStart(2, "0")}:{String(Math.floor(currentVideoTime % 60)).padStart(2, "0")} / 01:15
                  </span>
                </div>

                {/* Animated Cinema Stage */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: "20px", alignItems: "center", margin: "20px 0" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", color: "var(--accent-cyan)", marginBottom: "10px" }}>
                      {activeVideoScene?.title || topicTitle || "Lesson Scene"}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#f8fafc", lineHeight: "1.6" }}>
                      {activeVideoScene?.bullets ? activeVideoScene.bullets.join(". ") : (script.substring(0, 200) + "...")}
                    </p>
                  </div>

                  <div style={{ background: "rgba(16, 25, 48, 0.9)", border: "1px solid var(--accent-turquoise)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                    <div style={{ fontSize: "44px", animation: isVideoPlaying ? "pulse 1.5s infinite alternate" : "none" }}>
                      👩‍🏫
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--accent-turquoise)", fontWeight: "700", marginTop: "6px" }}>
                      AI MASTER TEACHER
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                      Class {gradeLevel} ({language})
                    </div>
                  </div>
                </div>

                {/* Video Play Controls Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleToggleVideo}
                    style={{ padding: "8px 18px", fontSize: "12px" }}
                  >
                    {isVideoPlaying ? "⏸ Pause Video" : "▶ Play Lesson Video"}
                  </button>

                  <div style={{ flex: 1, margin: "0 16px", height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${Math.min(100, (currentVideoTime / 75) * 100)}%`, height: "100%", background: "var(--accent-turquoise)", transition: "width 0.3s" }} />
                  </div>

                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    {completedQuizIds.length} / {videoQuizzes.length} Checkpoints Cleared
                  </span>
                </div>
              </div>
            )}

            {/* In-Video Interactive Quiz Popup Overlay */}
            {activeQuizOverlay && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(5, 8, 20, 0.92)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "24px",
                  zIndex: 10,
                  animation: "fadeIn 0.3s ease-out"
                }}
              >
                <div style={{ maxWidth: "520px", width: "100%", background: "#0b1226", border: "2px solid var(--accent-cyan)", borderRadius: "12px", padding: "20px", boxShadow: "0 0 25px rgba(0,212,255,0.4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span style={{ background: "var(--accent-cyan)", color: "#000", padding: "2px 8px", borderRadius: "10px", fontSize: "10px", fontWeight: "800", textTransform: "uppercase" }}>
                      ⚡ IN-VIDEO QUIZ CHECKPOINT ({activeQuizOverlay.time_label})
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      Class {gradeLevel} Level
                    </span>
                  </div>

                  <h4 style={{ fontSize: "15px", color: "#fff", marginBottom: "14px", fontWeight: "600" }}>
                    {activeQuizOverlay.question}
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {activeQuizOverlay.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => setSelectedOptionIndex(oIdx)}
                        style={{
                          textAlign: "left",
                          padding: "10px 14px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          border: selectedOptionIndex === oIdx ? "2px solid var(--accent-cyan)" : "1px solid var(--border-cyan)",
                          background: selectedOptionIndex === oIdx ? "rgba(0, 212, 255, 0.2)" : "#060914",
                          color: selectedOptionIndex === oIdx ? "var(--accent-cyan)" : "#e2e8f0",
                          cursor: "pointer",
                          transition: "all 0.2s"
                        }}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt}
                      </button>
                    ))}
                  </div>

                  {/* Feedback Box */}
                  {quizFeedback ? (
                    <div style={{ background: quizFeedback.isCorrect ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", border: quizFeedback.isCorrect ? "1px solid #10b981" : "1px solid #ef4444", padding: "12px", borderRadius: "6px", marginBottom: "14px" }}>
                      <p style={{ fontSize: "13px", fontWeight: "700", color: quizFeedback.isCorrect ? "#10b981" : "#ef4444", margin: "0 0 4px 0" }}>
                        {quizFeedback.isCorrect ? "🎉 Correct Answer!" : "❌ Not quite right!"}
                      </p>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", margin: 0 }}>
                        {quizFeedback.explanation}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={selectedOptionIndex === null}
                      onClick={handleAnswerQuiz}
                      style={{ width: "100%", padding: "10px", fontSize: "13px", marginBottom: "8px" }}
                    >
                      Check Answer
                    </button>
                  )}

                  {quizFeedback && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleResumeVideoAfterQuiz}
                      style={{ width: "100%", padding: "10px", fontSize: "13px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                    >
                      ▶ Resume Video Playback
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results View Panels for Raw Text Scripts */}
      {(script || videoScript) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Audio Overview Script */}
          {script && (
            <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase" }}>
                  🎙️ Voice Narration Script ({language})
                </h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(script);
                    alert("Audio script copied!");
                  }}
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  📋 Copy Script
                </button>
              </div>
              <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#e2e8f0" }}>
                {script}
              </div>
            </div>
          )}

          {/* Video Visual Storyboard */}
          {videoScript && (
            <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-violet)", textTransform: "uppercase" }}>
                  🎬 Video Visual Scene Storyboard ({language})
                </h3>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(videoScript);
                    alert("Video storyboard copied!");
                  }}
                  style={{ padding: "4px 10px", fontSize: "11px" }}
                >
                  📋 Copy Plan
                </button>
              </div>
              <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "300px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#e2e8f0" }}>
                {videoScript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Interactive Video Activity & Teacher Notes Card */}
      {videoNotesActivity && !loading && (
        <div className="hud-corner" style={{ background: "rgba(10, 20, 38, 0.9)", border: "1px solid var(--accent-turquoise)", borderRadius: "var(--radius-lg)", padding: "20px", marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
              💡 Video Notes, Student Hands-on Activity & Reflection ({language})
            </h3>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                navigator.clipboard.writeText(videoNotesActivity);
                alert("Activity & Teacher Notes copied!");
              }}
              style={{ padding: "4px 10px", fontSize: "11px" }}
            >
              📋 Copy Activity Notes
            </button>
          </div>
          <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "18px", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#f8fafc" }}>
            {videoNotesActivity}
          </div>
        </div>
      )}
    </div>
  );
}

export default AudioVideoStudio;
