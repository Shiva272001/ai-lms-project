import React, { useState } from "react";
import api from "../api";

function AudioVideoStudio() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState(5);
  const [language, setLanguage] = useState("English");
  const [mediaType, setMediaType] = useState("Audio & Video Overview"); // Audio, Video, or Audio & Video

  const [loading, setLoading] = useState(false);
  const [extractedContent, setExtractedContent] = useState("");
  const [script, setScript] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [audioDownloadUrl, setAudioDownloadUrl] = useState("");
  const [videoScript, setVideoScript] = useState("");
  const [videoNotesActivity, setVideoNotesActivity] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  const [videoUrl, setVideoUrl] = useState("");
  const [videoDownloadUrl, setVideoDownloadUrl] = useState("");
  // eslint-disable-next-line
  const [pptUrl, setPptUrl] = useState("");
  const [pptDownloadUrl, setPptDownloadUrl] = useState("");

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

    try {
      const response = await api.post("/lesson/generate-audio-video-studio", {
        topic: topicTitle || "Uploaded Study Material",
        class_name: Number(gradeLevel),
        language: language,
        media_type: "video",
        source_content: finalSource
      });

      if (response.data.success) {
        setScript(response.data.script || "");
        setVideoScript(response.data.video_script || "");
        setVideoNotesActivity(response.data.video_notes_activity || "");
        if (response.data.audio_url) {
          setAudioUrl(resolveUrl(response.data.audio_url));
        }
        if (response.data.audio_download_url) {
          setAudioDownloadUrl(resolveUrl(response.data.audio_download_url));
        }
        if (response.data.video_url) {
          setVideoUrl(resolveUrl(response.data.video_url));
        }
        if (response.data.video_download_url) {
          setVideoDownloadUrl(resolveUrl(response.data.video_download_url));
        }
        if (response.data.ppt_url) {
          setPptUrl(resolveUrl(response.data.ppt_url));
        }
        if (response.data.ppt_download_url) {
          setPptDownloadUrl(resolveUrl(response.data.ppt_download_url));
        }
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

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header Banner */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>🎙️🎬 AI LMS</span> Audio & Video Studio
          </h2>
          <p className="page-subtitle">
            NotebookLM style multi-language Audio Overviews & Video Storyboard Generator from PPT, PDF, Image, or Raw Notes.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          MULTILINGUAL_NOTEBOOKLM_STUDIO
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
              placeholder="e.g. Photosynthesis, Newton's Laws..."
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
              <option value="Audio & Video Overview">🎙️🎬 Audio & Video Overview</option>
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
          {loading ? "⏳ Synthesizing Audio & Video Studio Content..." : "✨ Synthesize Audio & Video Lesson"}
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
          🎙️ AI LMS Master Teacher is synthesizing NotebookLM {language} Audio Voice and Video Storyboard...
        </div>
      )}

      {/* Persistent Download & Action Bar */}
      {(script || videoScript) && !loading && (
        <div style={{ background: "rgba(0, 212, 255, 0.06)", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "16px 20px", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-cyan)", letterSpacing: "1px", textTransform: "uppercase" }}>
              ⚡ AI LMS Studio Export Controls ({language})
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
              Download generated audio narration (.mp3) & educational video clip (.mp4) in {language}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {audioDownloadUrl && (
              <a
                href={audioDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none" }}
              >
                ⬇️ Download MP3 Audio ({language})
              </a>
            )}

            {videoDownloadUrl && (
              <a
                href={videoDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none", background: "var(--amber-gradient)" }}
              >
                ⬇️ Download MP4 Video ({language})
              </a>
            )}

            {pptDownloadUrl && (
              <a
                href={pptDownloadUrl}
                download
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: "12px", textDecoration: "none", background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
              >
                📊 Download PPT Presentation (.pptx)
              </a>
            )}
          </div>
        </div>
      )}

      {/* Media Players Panel: Audio & Video Player Preview */}
      {(audioUrl || videoUrl) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: videoUrl && audioUrl ? "1fr 1fr" : "1fr", gap: "20px", marginTop: "20px" }}>
          {/* Audio Player Card */}
          {audioUrl && (
            <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-cyan)" }}>
                  🔊 Audio Narration ({language})
                </h3>
              </div>
              <audio controls src={audioUrl} style={{ width: "100%" }}>
                Your browser does not support the audio player.
              </audio>
            </div>
          )}

          {/* Video Player Preview Card */}
          {videoUrl && (
            <div className="hud-corner" style={{ background: "#060914", border: "1px solid var(--accent-cyan)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-turquoise)" }}>
                  🎬 AI Educational Video Preview (.mp4)
                </h3>
              </div>
              <video controls src={videoUrl} style={{ width: "100%", maxHeight: "320px", borderRadius: "8px", border: "1px solid var(--border-cyan)" }}>
                Your browser does not support HTML5 video preview.
              </video>
            </div>
          )}
        </div>
      )}

      {/* Results View Panels */}
      {(script || videoScript) && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
          {/* Audio Overview Script */}
          {script && (
            <div className="hud-corner" style={{ background: "rgba(7, 10, 20, 0.8)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "700", color: "var(--accent-turquoise)", textTransform: "uppercase" }}>
                  🎙️ NotebookLM Voice Script ({language})
                </h3>
                <div style={{ display: "flex", gap: "6px" }}>
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
                  {audioDownloadUrl && (
                    <a
                      href={audioDownloadUrl}
                      download
                      className="btn-primary"
                      style={{ padding: "4px 10px", fontSize: "11px", textDecoration: "none" }}
                    >
                      ⬇️ Download MP3 Audio
                    </a>
                  )}
                </div>
              </div>
              <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#e2e8f0" }}>
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
                <div style={{ display: "flex", gap: "6px" }}>
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
                  {videoDownloadUrl && (
                    <a
                      href={videoDownloadUrl}
                      download
                      className="btn-primary"
                      style={{ padding: "4px 10px", fontSize: "11px", textDecoration: "none", background: "var(--amber-gradient)" }}
                    >
                      ⬇️ Download MP4 Video
                    </a>
                  )}
                </div>
              </div>
              <div style={{ background: "#04060c", border: "1px solid var(--border-cyan)", padding: "16px", borderRadius: "4px", maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap", fontSize: "13px", lineHeight: "1.6", color: "#e2e8f0" }}>
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
              💡 Video Notes, Student Hands-on Activity & Check Question ({language})
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
