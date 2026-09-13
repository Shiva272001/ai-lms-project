/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: AudioVideoStudio.jsx (Multilingual Audio & Video Synthesis Studio)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { DeveloperWatermark } from "./DeveloperAttribution";

function AudioVideoStudio() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState(5);
  const [language, setLanguage] = useState("English");
  const [mediaType, setMediaType] = useState("Audio & Video Overview");

  const [loading, setLoading] = useState(false);
  const [generationStatus, setGenerationStatus] = useState("idle"); // idle, synthesizing, completed, error
  const [extractedContent, setExtractedContent] = useState("");
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDownloadUrl, setAudioDownloadUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDownloadUrl, setVideoDownloadUrl] = useState("");
  const [pptDownloadUrl, setPptDownloadUrl] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [videoNotesActivity, setVideoNotesActivity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [providerErrors, setProviderErrors] = useState([]);

  // Providers Info
  const [audioProvider, setAudioProvider] = useState("ElevenLabs");
  const [videoProvider, setVideoProvider] = useState("Hugging Face");
  const [pptProvider, setPptProvider] = useState("Google Gemini");

  // Storyboard & Slides Data
  const [storyboard, setStoryboard] = useState([]);
  const [slides, setSlides] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [isFullscreenPPT, setIsFullscreenPPT] = useState(false);

  // Audio Player State
  const [audioSegments, setAudioSegments] = useState([]);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState(1.0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentAudioTime, setCurrentAudioTime] = useState(0);

  // Video Storyboard Cinema Player State
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

  const buildFallbackSlides = (topicName, scriptText) => {
    const fallbackList = [
      {
        slide_number: 1,
        title: topicName || "Lesson Title",
        subtitle: `Class ${gradeLevel} • Interactive Presentation Deck (${language})`,
        bullet_points: [
          `Subject Topic: ${topicName || "Study Material"}`,
          `Target Grade Level: Class ${gradeLevel}`,
          `Narration Language: ${language}`,
          "AI LMS Multimedia Studio Master Curriculum"
        ],
        speaker_notes: `Welcome students! Today we are learning '${topicName}'. Follow along with the slides and note the key takeaways.`,
        visual_description: "Hero card with glowing cyan border and lesson title banner",
        image_prompt: `Hero title slide for ${topicName}, modern tech aesthetic, 16:9`,
        layout: "Title Hero",
        design_notes: "Gamma dark theme with vibrant cyan accent"
      },
      {
        slide_number: 2,
        title: "🎯 Learning Objectives",
        subtitle: "What we will achieve by the end of this lesson",
        bullet_points: [
          `Understand the foundational definition and principles of ${topicName}`,
          `Analyze key mechanisms and practical real-world applications`,
          "Complete interactive check-for-understanding activities with confidence"
        ],
        speaker_notes: `Let's review our learning objectives for ${topicName} so we know exactly what to focus on.`,
        visual_description: "Target icon with 3 objective cards",
        image_prompt: "Target with arrows representing educational goals, 16:9",
        layout: "Objectives Checklist",
        design_notes: "Checkmark badges in emerald green"
      },
      {
        slide_number: 3,
        title: "🔍 Introduction & Prior Knowledge",
        subtitle: "Connecting what we already know",
        bullet_points: [
          `Have you ever wondered how ${topicName} works in daily life?`,
          `Today we connect our observations with clear scientific principles`,
          "No prior advanced experience needed—we build step by step!"
        ],
        speaker_notes: "Think about where you have observed this before in your everyday surroundings.",
        visual_description: "Magnifying glass examining concept connections",
        image_prompt: "Curious students observing science phenomenon, 16:9",
        layout: "Concept Introduction",
        design_notes: "Split layout: Text on left, teacher card on right"
      },
      {
        slide_number: 4,
        title: `💡 Core Concept 1: What is ${topicName}?`,
        subtitle: "Fundamental Definition & Principles",
        bullet_points: [
          `${topicName} is an essential concept calibrated for Class ${gradeLevel}`,
          "It operates according to predictable and verifiable natural rules",
          "Breaking it down into smaller parts makes it easy to master"
        ],
        speaker_notes: "Pay close attention to this definition, as it forms the cornerstone of our lesson.",
        visual_description: "Central glowing bulb diagram with explanatory arrows",
        image_prompt: "Glowing lightbulb surrounded by concept nodes, 16:9",
        layout: "Definition Card",
        design_notes: "High contrast cyan text with card borders"
      },
      {
        slide_number: 5,
        title: "⚡ Core Concept 2: How It Works",
        subtitle: "Mechanisms & Step-by-Step Flow",
        bullet_points: [
          "Step 1: Input and initial condition setup",
          "Step 2: Processing and core transformation phase",
          "Step 3: Observable results and physical impact"
        ],
        speaker_notes: "Notice how each step logically triggers the next stage in the process.",
        visual_description: "3-stage sequence flowchart with arrows",
        image_prompt: "3-step flowchart diagram showing educational process, 16:9",
        layout: "Sequence Flow",
        design_notes: "Numbered step pill badges"
      },
      {
        slide_number: 6,
        title: "🔬 Core Concept 3: Key Properties",
        subtitle: "Essential Characteristics to Remember",
        bullet_points: [
          "Property A: Consistency and reliability under standard conditions",
          "Property B: Measurable effects in controlled environments",
          "Property C: Interdependence with related school subjects"
        ],
        speaker_notes: "These properties allow scientists and engineers to apply this knowledge reliably.",
        visual_description: "Microscope inspection graphic with property cards",
        image_prompt: "Scientific properties visual comparison matrix, 16:9",
        layout: "Properties Grid",
        design_notes: "Two-column feature comparison"
      },
      {
        slide_number: 7,
        title: "🌍 Real-Life Demonstration",
        subtitle: "Everyday Examples in Our World",
        bullet_points: [
          `Example 1: How ${topicName} powers modern everyday technologies`,
          `Example 2: Natural occurrences in the environment and biology`,
          "Example 3: Easy classroom observation you can do at home"
        ],
        speaker_notes: "Look at these real-world examples—science is always happening all around us!",
        visual_description: "Globe graphic showing practical applications",
        image_prompt: "Students observing real world application of science, 16:9",
        layout: "Case Study Card",
        design_notes: "Accent cards with illustrative icons"
      },
      {
        slide_number: 8,
        title: "✍️ Hands-on Classroom Activity",
        subtitle: "5-Minute Think & Do Challenge",
        bullet_points: [
          "Task: Pair up with a classmate or write in your notebook",
          `Question: How would you explain ${topicName} to a friend in 2 sentences?`,
          "Bonus: Draw a quick diagram illustrating the key mechanism"
        ],
        speaker_notes: "Take 5 minutes now to write down your explanation and compare with your partner.",
        visual_description: "Pencil and student notebook activity icon",
        image_prompt: "Student writing in colorful workbook, classroom desk, 16:9",
        layout: "Interactive Activity",
        design_notes: "Warm amber gradient border for action"
      },
      {
        slide_number: 9,
        title: "📌 Key Points & Recap",
        subtitle: "Summary of What We Learned Today",
        bullet_points: [
          `${topicName} is structured and easy to understand when broken down`,
          "Mechanisms follow predictable steps that can be observed directly",
          "Reviewing teacher notes ensures top exam readiness and retention"
        ],
        speaker_notes: "Let's review these 3 points together as our final recap before the quiz.",
        visual_description: "Pinboard graphic with 3 sticky note cards",
        image_prompt: "Summary checklist with glowing checkmarks, 16:9",
        layout: "Summary Checklist",
        design_notes: "Clean emerald green highlights"
      },
      {
        slide_number: 10,
        title: "❓ Quick Check-for-Understanding Quiz",
        subtitle: "Test Your Knowledge!",
        bullet_points: [
          `Q1: What is the main subject we explored today? (A) ${topicName} (B) History`,
          `Q2: Is ${topicName} applicable in real life? (A) Yes (B) No`,
          "Q3: What boosts long-term memory? (A) Active practice (B) Ignoring notes"
        ],
        speaker_notes: "Read each question carefully and write down your answers before flipping to the next slide.",
        visual_description: "Quiz question mark graphic with multiple choice options",
        image_prompt: "Quiz cards with A and B options, clean graphic design, 16:9",
        layout: "Quiz Card",
        design_notes: "Vibrant question callout boxes"
      },
      {
        slide_number: 11,
        title: "✅ Quiz Answers & Explanations",
        subtitle: "How did you do?",
        bullet_points: [
          `A1: (A) ${topicName} — This was our primary focus today!`,
          "A2: (A) Yes — It powers real-world systems and observations.",
          "A3: (A) Active practice — Completing exercises boosts memory retention."
        ],
        speaker_notes: "Great job if you scored 3 out of 3! Review any question you missed.",
        visual_description: "Checkmark shield graphic with answer keys",
        image_prompt: "Shield with golden checkmark, 16:9",
        layout: "Answer Key",
        design_notes: "Success green color badges"
      },
      {
        slide_number: 12,
        title: "🌟 Thank You & Great Work!",
        subtitle: "Keep Learning & Exploring",
        bullet_points: [
          `You have successfully mastered the basics of ${topicName}!`,
          "Download the PowerPoint deck and MP3 audio for offline revision.",
          "See you in the next AI LMS Master Teacher lesson!"
        ],
        speaker_notes: "Thank you students for your active participation! Keep exploring and keep learning.",
        visual_description: "Smiling AI teacher avatar waving goodbye with stars",
        image_prompt: "Friendly teacher waving goodbye, cheerful students, confetti, 16:9",
        layout: "Closing Card",
        design_notes: "Warm violet and cyan celebratory glow"
      }
    ];
    return fallbackList;
  };

  const handleGenerateMedia = async () => {
    const finalSource = extractedContent || textInput;
    if (!finalSource.trim() && !topicTitle.trim()) {
      alert("Please upload a file, paste text, or enter a topic title.");
      return;
    }

    setLoading(true);
    setGenerationStatus("synthesizing");
    setScript("");
    setAudioUrl("");
    setAudioDownloadUrl("");
    setVideoUrl("");
    setVideoDownloadUrl("");
    setPptDownloadUrl("");
    setVideoScript("");
    setVideoNotesActivity("");
    setErrorMessage("");
    setProviderErrors([]);

    setSlides([]);
    setCurrentSlideIndex(0);
    setAudioSegments([]);
    setVideoQuizzes([]);
    setCompletedQuizIds([]);
    setActiveQuizOverlay(null);
    setIsVideoPlaying(false);
    setCurrentVideoTime(0);

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

      if (response.data.success || response.data.status === "completed") {
        setGenerationStatus("completed");
        const genScript = response.data.script || response.data.audio?.narration_script || "";
        const genVideoScript = response.data.video_script || "";
        setScript(genScript);
        setVideoScript(genVideoScript);
        setVideoNotesActivity(response.data.video_notes_activity || "");

        // Providers
        if (response.data.audio?.provider) setAudioProvider(response.data.audio.provider);
        if (response.data.video?.provider) setVideoProvider(response.data.video.provider);
        if (response.data.presentation?.provider) setPptProvider(response.data.presentation.provider);
        if (response.data.errors) setProviderErrors(response.data.errors);

        // URLs
        const audUrl = response.data.audio?.url || response.data.audio_url;
        const audDUrl = response.data.audio?.download_url || response.data.audio_download_url;
        const vidUrl = response.data.video?.url || response.data.video_url;
        const vidDUrl = response.data.video?.download_url || response.data.video_download_url;
        const pDUrl = response.data.presentation?.download_url || response.data.ppt_download_url;

        if (audUrl) setAudioUrl(resolveUrl(audUrl));
        if (audDUrl) setAudioDownloadUrl(resolveUrl(audDUrl));
        if (vidUrl) setVideoUrl(resolveUrl(vidUrl));
        if (vidDUrl) setVideoDownloadUrl(resolveUrl(vidDUrl));
        if (pDUrl) setPptDownloadUrl(resolveUrl(pDUrl));

        // Storyboard
        if (response.data.video?.storyboard) {
          setStoryboard(response.data.video.storyboard);
        }

        // Slides
        const returnedSlides = response.data.presentation?.slides || response.data.slides;
        setSlides(returnedSlides && returnedSlides.length > 0 ? returnedSlides : buildFallbackSlides(topicTitle || "Lesson", genScript));

        // Audio segments
        if (response.data.audio_segments && response.data.audio_segments.length > 0) {
          setAudioSegments(response.data.audio_segments);
        } else {
          const rawParas = genScript.split(".").filter((p) => p.trim());
          let curr = 0;
          setAudioSegments(rawParas.slice(0, 8).map((p, i) => {
            const dur = Math.max(6, Math.min(20, Math.floor(p.length / 10)));
            const seg = {
              id: i + 1,
              start_time: curr,
              end_time: curr + dur,
              time_label: `${String(Math.floor(curr / 60)).padStart(2, "0")}:${String(Math.floor(curr % 60)).padStart(2, "0")}`,
              text: p.trim()
            };
            curr += dur;
            return seg;
          }));
        }

        // Video quizzes
        if (response.data.video_quizzes && response.data.video_quizzes.length > 0) {
          setVideoQuizzes(response.data.video_quizzes);
        }

      } else {
        setGenerationStatus("error");
        setErrorMessage(response.data.error || "Multimedia synthesis failed.");
      }
    } catch (err) {
      console.error("Studio error:", err);
      setGenerationStatus("error");
      setErrorMessage(err.response?.data?.detail || "Media synthesis failed.");
    } finally {
      setLoading(false);
    }
  };

  // Browser Speech Synthesis Engine (Native AI Voice Fallback)
  const speakBrowserSpeech = (text, rate = 1.0) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*#_~`[\]]/g, "").trim();
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

  // Storyboard Cinema Video Timer
  useEffect(() => {
    if (isVideoPlaying && !videoUrl) {
      videoTimerRef.current = setInterval(() => {
        setCurrentVideoTime((prev) => {
          const nextTime = prev + 1;
          const totalScenes = Math.max(1, slides.length);
          const sceneIndex = Math.floor(nextTime / 15) % totalScenes;
          setCurrentSceneIndex(sceneIndex);

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

  // PPT Fullscreen Toggle
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
            <span style={{ color: "var(--accent-cyan)" }}>🎙️🎬 AI LMS</span> Multimedia Engine Studio
          </h2>
          <p className="page-subtitle">
            Synchronized Audio Narration (ElevenLabs), Educational Video (Hugging Face), and PowerPoint Deck (Google Gemini).
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ background: generationStatus === "completed" ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 212, 255, 0.1)", border: generationStatus === "completed" ? "1px solid #10b981" : "1px solid var(--border-cyan)", color: generationStatus === "completed" ? "#10b981" : "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
            {generationStatus === "completed" ? "✓ ENGINE_COMPLETED" : "TRIPLE_PROVIDER_ACTIVE"}
          </span>
        </div>
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
              placeholder="e.g. Artificial Intelligence, Photosynthesis, Newton's Laws..."
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
            <label>Output Multimedia Mode</label>
            <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} disabled={loading}>
              <option value="Audio & Video Overview">🎙️🎬📊 Complete Triple Engine: Audio (ElevenLabs) + Video (HF) + PPT (Gemini)</option>
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
          {loading ? "⏳ Generating Multimedia Engine (ElevenLabs + Hugging Face + Gemini)..." : "✨ Build Complete Multimedia Lesson"}
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="alert-error" style={{ marginTop: "16px" }}>
          ⚠️ {errorMessage}
          <button
            type="button"
            className="btn-secondary"
            onClick={handleGenerateMedia}
            style={{ marginLeft: "12px", padding: "4px 10px", fontSize: "11px" }}
          >
            🔄 Retry Generation
          </button>
        </div>
      )}

      {/* Non-fatal provider warnings */}
      {providerErrors.length > 0 && (
        <div style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid #f59e0b", color: "#f59e0b", padding: "10px 14px", borderRadius: "8px", marginTop: "12px", fontSize: "12px" }}>
          🔔 Provider status notices: {providerErrors.join(" | ")}
        </div>
      )}

      {/* Loading Progress State */}
      {loading && (
        <div className="alert-loading" style={{ marginTop: "20px" }}>
          <div className="pulse-dot"></div>
          <div>
            <p style={{ margin: 0, fontWeight: "700" }}>
              ⏳ AI LMS Engine is generating synchronized outputs for "{topicTitle || "Lesson"}":
            </p>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
              🎙️ ElevenLabs Voice Synthesis • 🎬 Hugging Face Video Storyboard • 📊 Google Gemini 12-Slide PowerPoint Deck
            </p>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3 OUTPUT CARDS REQUIRED BY LMS SPECIFICATION          */}
      {/* ==================================================== */}
      {(script || videoScript || slides.length > 0) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "24px" }}>
          {/* Output Card 1: Audio Lesson */}
          <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: "700", background: "rgba(0, 212, 255, 0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                  PROVIDER: {audioProvider.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>✓ READY</span>
              </div>
              <h3 style={{ fontSize: "15px", color: "#fff", margin: "0 0 6px 0", fontWeight: "700" }}>
                🎙️ AUDIO LESSON (.mp3)
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
                Professional teacher voice narration structured into Intro, Main Lesson, Recap & Closing.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleToggleAudio}
                style={{ width: "100%", padding: "8px", fontSize: "12px" }}
              >
                {isPlayingAudio ? "⏸ Pause Narration" : "▶ Play Voice Audio"}
              </button>

              {audioDownloadUrl ? (
                <a
                  href={audioDownloadUrl}
                  download
                  className="btn-secondary"
                  style={{ textAlign: "center", textDecoration: "none", padding: "8px", fontSize: "12px", border: "1px solid var(--accent-cyan)", color: "var(--accent-cyan)" }}
                >
                  ⬇️ Download MP3 Audio
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const blob = new Blob([script], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `AI_LMS_${topicTitle || "Lesson"}_Audio_Script.txt`;
                    a.click();
                  }}
                  style={{ padding: "8px", fontSize: "12px" }}
                >
                  ⬇️ Export Audio Script
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={handleGenerateMedia}
                style={{ padding: "6px", fontSize: "11px", color: "var(--text-secondary)" }}
              >
                🔄 Regenerate Audio
              </button>
            </div>
          </div>

          {/* Output Card 2: Educational Video */}
          <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-turquoise)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-turquoise)", fontWeight: "700", background: "rgba(20, 184, 166, 0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                  PROVIDER: {videoProvider.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>✓ READY</span>
              </div>
              <h3 style={{ fontSize: "15px", color: "#fff", margin: "0 0 6px 0", fontWeight: "700" }}>
                🎬 EDUCATIONAL VIDEO (.mp4)
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
                16:9 widescreen educational video with visual storyboard, on-screen text & checkpoint quizzes.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={handleToggleVideo}
                style={{ width: "100%", padding: "8px", fontSize: "12px", background: "var(--amber-gradient)" }}
              >
                {isVideoPlaying ? "⏸ Pause Video" : "🎬 Play Video Preview"}
              </button>

              {videoDownloadUrl ? (
                <a
                  href={videoDownloadUrl}
                  download
                  className="btn-secondary"
                  style={{ textAlign: "center", textDecoration: "none", padding: "8px", fontSize: "12px", border: "1px solid #f59e0b", color: "#f59e0b" }}
                >
                  ⬇️ Download MP4 Video
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const blob = new Blob([videoScript || JSON.stringify(storyboard, null, 2)], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `AI_LMS_${topicTitle || "Lesson"}_Storyboard.txt`;
                    a.click();
                  }}
                  style={{ padding: "8px", fontSize: "12px" }}
                >
                  ⬇️ Export Storyboard Plan
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={handleGenerateMedia}
                style={{ padding: "6px", fontSize: "11px", color: "var(--text-secondary)" }}
              >
                🔄 Regenerate Video
              </button>
            </div>
          </div>

          {/* Output Card 3: PowerPoint Presentation */}
          <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-violet)", borderRadius: "var(--radius-lg)", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-violet)", fontWeight: "700", background: "rgba(168, 85, 247, 0.1)", padding: "2px 8px", borderRadius: "10px" }}>
                  PROVIDER: {pptProvider.toUpperCase()}
                </span>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "700" }}>✓ READY</span>
              </div>
              <h3 style={{ fontSize: "15px", color: "#fff", margin: "0 0 6px 0", fontWeight: "700" }}>
                📊 POWERPOINT DECK (.pptx)
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>
                12-slide comprehensive curriculum deck with native speaker notes, activities & quiz keys.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  const el = document.getElementById("ppt-viewer-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ width: "100%", padding: "8px", fontSize: "12px", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
              >
                📊 View Slides ({slides.length} Slides)
              </button>

              {pptDownloadUrl ? (
                <a
                  href={pptDownloadUrl}
                  download
                  className="btn-secondary"
                  style={{ textAlign: "center", textDecoration: "none", padding: "8px", fontSize: "12px", border: "1px solid var(--accent-violet)", color: "var(--accent-violet)" }}
                >
                  ⬇️ Download PPTX Presentation
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    const blob = new Blob([
                      `AI LMS PRESENTATION DECK - ${topicTitle || "Lesson"}\nGrade: Class ${gradeLevel} | Language: ${language}\n\n` +
                      slides.map((s, i) => `SLIDE ${i + 1}: ${s.title}\n${(s.bullet_points || []).map(b => " - " + b).join("\n")}\nNotes: ${s.speaker_notes || ""}\n\n`).join("---\n\n")
                    ], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `AI_LMS_${topicTitle || "Lesson"}_Slides.txt`;
                    a.click();
                  }}
                  style={{ padding: "8px", fontSize: "12px" }}
                >
                  ⬇️ Export Slide Deck
                </button>
              )}

              <button
                type="button"
                className="btn-secondary"
                onClick={handleGenerateMedia}
                style={{ padding: "6px", fontSize: "11px", color: "var(--text-secondary)" }}
              >
                🔄 Regenerate PPT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: INTERACTIVE SLIDE-BY-SLIDE PPT VIEWER     */}
      {/* ---------------------------------------------------- */}
      {(slides.length > 0 || script) && !loading && (
        <div id="ppt-viewer-section" style={{ marginTop: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "700", color: "var(--accent-violet)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                📊 Google Gemini PowerPoint Slide-by-Slide Presenter
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Navigate 8–12 structured educational slides, review native speaker notes, or enter fullscreen mode.
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
              minHeight: "380px",
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
                GOOGLE GEMINI PPT • CLASS {gradeLevel} ({language})
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
                    {(activeSlide.bullet_points || activeSlide.bullets || []).map((bullet, bIdx) => (
                      <li key={bIdx} style={{ fontSize: "14px", color: "#f1f5f9", marginBottom: "12px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <span style={{ color: "var(--accent-turquoise)", fontSize: "16px" }}>▶</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right Slide Graphic Card */}
                <div style={{ background: "rgba(16, 25, 48, 0.8)", border: "1px solid var(--accent-violet)", borderRadius: "12px", padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "8px" }}>👩‍🏫</div>
                  <h4 style={{ fontSize: "13px", color: "var(--accent-violet)", fontWeight: "700" }}>
                    {activeSlide.layout || "Concept Visual"}
                  </h4>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                    {activeSlide.visual_description || `Master Teacher Graphic • Class ${gradeLevel}`}
                  </p>
                </div>
              </div>
            )}

            {/* Speaker Notes Drawer (Collapsible) */}
            {showSpeakerNotes && activeSlide?.speaker_notes && (
              <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.6)", border: "1px dashed var(--accent-cyan)", padding: "12px", borderRadius: "8px" }}>
                <p style={{ fontSize: "11px", color: "var(--accent-cyan)", fontWeight: "700", textTransform: "uppercase", marginBottom: "4px" }}>
                  🗣️ Google Gemini Native Speaker Notes & Teacher Prompt:
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
      {/* SECTION 2: INTERACTIVE AUDIO PLAYER (ELEVENLABS)     */}
      {/* ---------------------------------------------------- */}
      {(audioUrl || script) && !loading && (
        <div style={{ marginTop: "28px" }}>
          <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-cyan)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                  🔊 ElevenLabs Voice Narration & Synchronized Transcript ({language})
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Natural teacher-style narration with clear pronunciation. Click any sentence to jump audio directly!
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
                    {isPlayingAudio ? "⏸ Pause Narration" : "▶ Play ElevenLabs Narration"}
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
                  {isPlayingAudio ? "🎙️ Playing Voiceover Narration..." : "⏸ Narration Ready"}
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
                  ⚡ Using Zero-Latency Speech Synthesis Engine for Instant Voice Playback in {language}
                </p>
              )}
            </div>

            {/* Interactive Line-by-Line Synchronized Transcript */}
            {audioSegments.length > 0 && (
              <div style={{ maxHeight: "260px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
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
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: INTERACTIVE VIDEO (HUGGING FACE)          */}
      {/* ---------------------------------------------------- */}
      {(videoUrl || videoScript || script) && !loading && (
        <div style={{ marginTop: "28px" }}>
          <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-turquoise)", borderRadius: "var(--radius-lg)", padding: "20px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px" }}>
                  🎬 Hugging Face Educational Video & Checkpoint Quizzes
                </h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  16:9 educational presentation video. Pauses automatically at key timestamps for interactive multiple-choice checkpoints!
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
                        {activeVideoScene?.bullet_points ? activeVideoScene.bullet_points.join(". ") : (script.substring(0, 200) + "...")}
                      </p>
                    </div>

                    <div style={{ background: "rgba(16, 25, 48, 0.9)", border: "1px solid var(--accent-turquoise)", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "44px", animation: isVideoPlaying ? "pulse 1.5s infinite alternate" : "none" }}>
                        👩‍🏫
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--accent-turquoise)", fontWeight: "700", marginTop: "6px" }}>
                        HUGGING FACE ANIMATION
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
                      style={{ padding: "8px 18px", fontSize: "12px", background: "var(--amber-gradient)" }}
                    >
                      {isVideoPlaying ? "⏸ Pause Video" : "🎬 Play Lesson Video"}
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
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: STORYBOARD & TEACHER NOTES                */}
      {/* ---------------------------------------------------- */}
      {(script || videoScript) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "28px" }}>
          {/* Audio Overview Script */}
          {script && (
            <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase" }}>
                  🎙️ ElevenLabs Narration Script ({language})
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
                  🎬 Hugging Face Scene Storyboard ({language})
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
                  📋 Copy Storyboard
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
              💡 Video Teacher Notes, Student Hands-on Activity & Reflection ({language})
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
              📋 Copy Notes
            </button>
          </div>
          <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "18px", borderRadius: "6px", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#f8fafc" }}>
            {videoNotesActivity}
          </div>
        </div>
      )}

      {/* Shiva Singh AI Developer Attribution & Copyright Watermark */}
      <DeveloperWatermark moduleName="Audio & Video Studio" />
    </div>
  );
}

export default AudioVideoStudio;
