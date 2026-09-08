import React, { useState, useRef } from "react";
import api from "../api";
import jsPDF from "jspdf";

function QuizGenerator() {
  const [lessonText, setLessonText] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileInfo, setFileInfo] = useState("");
  const fileInputRef = useRef(null);

  // Mode: "test" (Interactive Quiz Taking) or "edit" (Teacher Editing)
  const [activeTab, setActiveTab] = useState("test");

  // User answers state for test mode: { questionIndex: selectedAnswer }
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [testScore, setTestScore] = useState(0);
  const [savedScoreMsg, setSavedScoreMsg] = useState("");

  const roundVal = (v) => Math.round((v || 0) * 100) / 100;
  const sampleLessonText = "Photosynthesis is the process used by plants, algae, and certain bacteria to harness energy from sunlight and turn it into chemical energy. Oxygen gas is released as a byproduct of this process. Chlorophyll is the green pigment responsible for absorbing sunlight in plant cells.";

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setError("");
    setFileInfo("");

    try {
      // Local fast parse for plain text files
      if (file.name.endsWith(".txt") || file.name.endsWith(".md")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const txt = event.target.result || "";
          setLessonText(txt);
          setFileInfo(`✅ Loaded ${file.name} (${txt.split(/\s+/).length} words)`);
          setUploadingFile(false);
        };
        reader.readAsText(file);
        return;
      }

      // Server parsing for Images (.png, .jpg), PDFs, DOCX
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/quiz/parse-file", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success && res.data.extracted_text) {
        setLessonText(res.data.extracted_text);
        setFileInfo(`✅ Extracted content from ${res.data.filename || file.name} (${res.data.word_count || res.data.extracted_text.split(/\s+/).length} words)`);
      } else {
        setError(res.data.error || "File parsing failed.");
      }
    } catch (err) {
      console.error("File Upload Error:", err);
      setError(err.response?.data?.detail || err.response?.data?.error || "Could not process uploaded file.");
    } finally {
      setUploadingFile(false);
      if (e.target) e.target.value = "";
    }
  };

  // Safe text helper
  const safeText = (val) => {
    if (val === null || val === undefined) return "";
    if (typeof val === "string") return val;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) return val.map((v) => safeText(v)).join(", ");
    if (typeof val === "object") return val.text || val.content || val.answer || JSON.stringify(val);
    return String(val);
  };

  const normalizeQuiz = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => {
      const type = safeText(item?.type).toLowerCase();
      let options = [];
      if (Array.isArray(item?.options)) {
        options = item.options.map((opt) => safeText(opt));
      }
      return {
        type: type || "mcq",
        question: safeText(item?.question),
        options,
        answer: safeText(item?.answer),
      };
    });
  };

  const handleGenerate = async () => {
    if (!lessonText.trim()) {
      setError("Please enter or paste lesson content first.");
      return;
    }

    setLoading(true);
    setError("");
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setSavedScoreMsg("");

    try {
      const res = await api.post("/quiz/generate", {
        lesson_text: lessonText.trim(),
        num_questions: Number(numQuestions),
      });

      let quizData = res.data?.quiz;
      if (typeof quizData === "string") {
        quizData = quizData.replace(/```json/gi, "").replace(/```/g, "").trim();
        try {
          quizData = JSON.parse(quizData);
        } catch {
          throw new Error("AI returned unparseable quiz JSON.");
        }
      }

      if (!Array.isArray(quizData)) {
        throw new Error(res.data?.error || "Invalid quiz structure received.");
      }

      const normalized = normalizeQuiz(quizData);
      if (normalized.length === 0) {
        throw new Error("No valid questions generated.");
      }

      setQuiz(normalized);
      setActiveTab("test");
    } catch (err) {
      console.error("Quiz Error:", err);
      const backendErr = err.response?.data?.detail || err.response?.data?.error;
      setError(safeText(backendErr) || err.message || "Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  // Answer selection handler
  const handleSelectAnswer = (qIndex, ans) => {
    if (quizSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: ans
    }));
  };

  // Submit test handler
  const handleSubmitQuiz = async () => {
    let correctCount = 0;
    quiz.forEach((q, idx) => {
      const userAns = safeText(userAnswers[idx]).trim().toLowerCase();
      const actualAns = safeText(q.answer).trim().toLowerCase();

      if (userAns && (userAns === actualAns || actualAns.includes(userAns) || userAns.includes(actualAns))) {
        correctCount += 1;
      }
    });

    setTestScore(correctCount);
    setQuizSubmitted(true);

    // Automatically save quiz score to Neon database analytics
    try {
      const scoreOutOf10 = roundVal((correctCount / quiz.length) * 10);
      const parsedStudentId = parseInt(studentId, 10) || 1;
      await api.post("/analytics/save-score", null, {
        params: {
          student_id: parsedStudentId,
          student_name: studentName.trim() || "Student",
          roll_no: rollNo.trim() || String(parsedStudentId),
          topic: lessonText.trim().slice(0, 35) || "General Quiz",
          score: scoreOutOf10
        }
      });
      setSavedScoreMsg(`✅ Quiz score saved for ${studentName.trim() || "Student"} (Roll No: ${rollNo.trim() || parsedStudentId})!`);
    } catch (err) {
      console.error("Auto-save quiz score notice:", err);
      setSavedScoreMsg("✅ Quiz score computed!");
    }
  };

  // Save score to analytics database
  const handleSaveScoreToDB = async () => {
    try {
      const scoreOutOf10 = (testScore / quiz.length) * 10;
      await api.post("/analytics/save-score", null, {
        params: {
          student_id: 1,
          topic: lessonText.slice(0, 30) + "...",
          score: scoreOutOf10
        }
      });
      setSavedScoreMsg("✅ Quiz score saved to Progress Analytics!");
    } catch (err) {
      console.error("Score save error:", err);
      setSavedScoreMsg("⚠️ Could not save score to DB automatically.");
    }
  };

  // PDF Export (mode: 'worksheet' = Blank Student Test, 'answers' = Answer Key, 'graded' = Student Given Answers vs Correct Answers)
  const handleDownloadPDF = (mode = "worksheet") => {
    if (!quiz.length) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    let headerTitle = "AI LMS Student Quiz Worksheet";
    if (mode === "answers") headerTitle = "AI LMS Quiz — Answer Key & Solutions";
    if (mode === "graded") headerTitle = "AI LMS Graded Quiz Report — Student & Correct Answers";

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(headerTitle, pageWidth / 2, y, { align: "center" });

    y += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Student Name: _______________________", 15, y);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 70, y);
    y += 8;

    if (mode === "graded" && quizSubmitted) {
      let correctCount = 0;
      quiz.forEach((q, idx) => {
        if (safeText(userAnswers[idx]).trim().toLowerCase() === safeText(q.answer).trim().toLowerCase()) {
          correctCount++;
        }
      });
      const scorePct = Math.round((correctCount / quiz.length) * 100);
      doc.setFont("helvetica", "bold");
      doc.text(`Score Summary: ${correctCount} / ${quiz.length} Correct (${scorePct}%)`, 15, y);
      doc.setFont("helvetica", "normal");
      y += 10;
    } else {
      doc.text(`Total Questions: ${quiz.length}   |   Mode: ${mode.toUpperCase()}`, 15, y);
      y += 10;
    }

    quiz.forEach((item, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const questionLines = doc.splitTextToSize(`${i + 1}. ${safeText(item.question)}`, pageWidth - 30);
      
      if (y + (questionLines.length * 5) > 270) {
        doc.addPage();
        y = 20;
      }

      doc.text(questionLines, 15, y);
      y += (questionLines.length * 5) + 2;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      if (item.type === "mcq" && Array.isArray(item.options)) {
        item.options.forEach((opt, optIdx) => {
          const letter = String.fromCharCode(65 + optIdx);
          const isUserSel = mode === "graded" && safeText(userAnswers[i]).trim().toLowerCase() === safeText(opt).trim().toLowerCase();
          const isCorrect = (mode === "answers" || mode === "graded") && safeText(item.answer).trim().toLowerCase() === safeText(opt).trim().toLowerCase();
          
          let optPrefix = `   [  ] ${letter}. `;
          if (isUserSel && isCorrect) optPrefix = `   [✓ CORRECT] ${letter}. `;
          else if (isUserSel) optPrefix = `   [✕ STUDENT] ${letter}. `;
          else if (isCorrect) optPrefix = `   [✓ KEY] ${letter}. `;

          const fullOptText = optPrefix + safeText(opt);
          const optLines = doc.splitTextToSize(fullOptText, pageWidth - 35);

          if (y + (optLines.length * 5) > 270) {
            doc.addPage();
            y = 20;
          }

          if (isCorrect || isUserSel) doc.setFont("helvetica", "bold");
          doc.text(optLines, 20, y);
          if (isCorrect || isUserSel) doc.setFont("helvetica", "normal");
          y += (optLines.length * 5) + 1;
        });
      } else {
        if (y + 10 > 270) {
          doc.addPage();
          y = 20;
        }

        if (mode === "graded") {
          const userAnsStr = safeText(userAnswers[i]) || "No Answer Entered";
          const isRight = userAnsStr.trim().toLowerCase() === safeText(item.answer).trim().toLowerCase();

          doc.setFont("helvetica", "bold");
          doc.text(`   Student Answer: "${userAnsStr}"  [${isRight ? "✓ Correct" : "✕ Incorrect"}]`, 20, y);
          y += 5;
          doc.text(`   Correct Answer: "${safeText(item.answer)}"`, 20, y);
          doc.setFont("helvetica", "normal");
          y += 6;
        } else if (mode === "answers") {
          doc.setFont("helvetica", "bold");
          doc.text(`   Correct Answer: "${safeText(item.answer)}"`, 20, y);
          doc.setFont("helvetica", "normal");
          y += 6;
        } else {
          doc.text("   Answer: _________________________________", 20, y);
          y += 6;
        }
      }

      y += 4;
    });

    let filename = "ai_lms_quiz_STUDENT_WORKSHEET.pdf";
    if (mode === "answers") filename = "ai_lms_quiz_ANSWER_KEY.pdf";
    if (mode === "graded") filename = "ai_lms_quiz_GRADED_STUDENT_REPORT.pdf";
    doc.save(filename);
  };

  return (
    <div className="card hud-corner" style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            <span style={{ color: "var(--accent-cyan)" }}>📝</span> Interactive Quiz Creator
          </h2>
          <p className="page-subtitle">
            Synthesize lesson notes into interactive tests with automated grading and print-ready PDF export.
          </p>
        </div>
        <span style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "6px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          SYS_TEST_EVALUATION
        </span>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt,.md"
        onChange={handleFileUpload}
      />

      {/* Input Section */}
      <div className="form-group">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
          <label style={{ margin: 0 }}>Lesson Source Material</label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="chip-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadingFile}
              style={{ background: "rgba(0, 212, 255, 0.1)", borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)", fontWeight: "600" }}
            >
              {uploadingFile ? "⏳ Extracting Content..." : "📁 Upload File (.png, .pdf, .docx, .txt)"}
            </button>

            <button
              type="button"
              className="chip-btn"
              onClick={() => {
                setLessonText(sampleLessonText);
                setFileInfo("");
              }}
              style={{ fontSize: "11px", padding: "4px 10px" }}
            >
              + Sample Passage
            </button>
          </div>
        </div>

        {fileInfo && (
          <div style={{ fontSize: "12px", color: "#34d399", fontFamily: "var(--font-heading)", marginBottom: "8px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>{fileInfo}</span>
            <span style={{ fontSize: "11px", color: "var(--accent-cyan)" }}>📄 EXTRACTED_CONTENT_PREVIEW</span>
          </div>
        )}

        <textarea
          rows={6}
          value={lessonText}
          onChange={(e) => setLessonText(e.target.value)}
          placeholder="Paste textbook passage or upload a file (.png image, .pdf, .docx, .txt) above..."
          disabled={loading || uploadingFile}
          style={{
            background: "#040711",
            border: lessonText ? "1px solid var(--accent-cyan)" : "1px solid var(--border-cyan)",
            boxShadow: lessonText ? "0 0 15px rgba(0, 212, 255, 0.15)" : "inset 0 2px 6px rgba(0,0,0,0.5)",
            fontFamily: "'Fira Code', 'Inter', monospace",
            fontSize: "13px",
            lineHeight: "1.6"
          }}
        />

        {lessonText.trim() && (
          <div style={{ marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-heading)" }}>
              📊 Content Size: <strong style={{ color: "var(--accent-cyan)" }}>{lessonText.trim().split(/\s+/).length} words</strong> ({lessonText.length} characters)
            </span>
            <button
              type="button"
              className="chip-btn"
              onClick={() => { setLessonText(""); setFileInfo(""); }}
              style={{ fontSize: "11px", padding: "4px 10px", color: "#fca5a5", borderColor: "rgba(244,63,94,0.4)" }}
            >
              🗑️ Clear Content
            </button>
          </div>
        )}
      </div>

      {/* Student Identification Details Form */}
      <div style={{ background: "rgba(0, 212, 255, 0.05)", border: "1px solid var(--border-cyan)", borderRadius: "var(--radius-md)", padding: "16px", marginBottom: "20px" }}>
        <div style={{ fontSize: "13px", fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>👤</span> Student Examination Profile (Fill Details Before Taking Quiz)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Student Full Name <span style={{ color: "#f43f5e" }}>*</span></label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              disabled={loading}
              placeholder="e.g. Rahul Sharma"
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Roll Number <span style={{ color: "#f43f5e" }}>*</span></label>
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              disabled={loading}
              placeholder="e.g. 101, A-12..."
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Student ID <span style={{ color: "#f43f5e" }}>*</span></label>
            <input
              type="number"
              min="1"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loading}
              placeholder="e.g. 1, 2, 10..."
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label>Questions Count</label>
            <input
              type="number"
              min="1"
              max="100"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, Number(e.target.value)))}
              disabled={loading}
              placeholder="e.g. 5, 20..."
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={() => {
            if (!lessonText.trim()) {
              setError("Please paste a textbook passage or upload a document (.pdf, .png, .txt, .docx) in the Lesson Source Material box above!");
              return;
            }
            if (!studentName.trim() || !rollNo.trim() || !studentId.toString().trim()) {
              setError("Please fill all mandatory Student Profile fields (Full Name, Roll Number, and Student ID)!");
              return;
            }
            setError("");
            handleGenerate();
          }}
          disabled={loading}
          style={{ minWidth: "180px" }}
        >
          {loading ? "⏳ Generating..." : "✨ Generate Quiz"}
        </button>

        {!lessonText.trim() && (
          <span style={{ fontSize: "12px", color: "#fca5a5", fontFamily: "var(--font-heading)", fontWeight: "600" }}>
            👈 Paste lesson text or upload a file above to generate quiz.
          </span>
        )}

        {quiz.length > 0 && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="btn-secondary"
              onClick={() => handleDownloadPDF("worksheet")}
              title="Download Blank Quiz Worksheet for Students"
            >
              📄 PDF (Worksheet)
            </button>

            <button
              className="btn-primary"
              onClick={() => handleDownloadPDF("answers")}
              style={{ background: "var(--violet-gradient)" }}
              title="Download Quiz with Complete Answer Key"
            >
              🔑 PDF (Answer Key)
            </button>

            {quizSubmitted && (
              <button
                className="btn-primary"
                onClick={() => handleDownloadPDF("graded")}
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                title="Download Graded Report showing student answers and correct answers"
              >
                📊 PDF (Student & Correct Answers)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && <div className="alert-error">⚠️ {error}</div>}

      {/* Loading Indicator */}
      {loading && (
        <div className="alert-loading">
          <div className="pulse-dot"></div>
          🤖 AI is analyzing lesson text and generating high-quality questions...
        </div>
      )}

      {/* Quiz Output Section */}
      {quiz.length > 0 && !loading && (
        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
          {/* Mode Switcher Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={`chip-btn ${activeTab === "test" ? "active" : ""}`}
                onClick={() => setActiveTab("test")}
                style={{ padding: "8px 18px", fontSize: "14px" }}
              >
                🎮 Interactive Test Mode
              </button>
              <button
                className={`chip-btn ${activeTab === "edit" ? "active" : ""}`}
                onClick={() => setActiveTab("edit")}
                style={{ padding: "8px 18px", fontSize: "14px" }}
              >
                ✏️ Edit & Manage Questions
              </button>
            </div>

            <div style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
              Total Questions: <strong>{quiz.length}</strong>
            </div>
          </div>

          {/* Test Submission Score Banner */}
          {quizSubmitted && activeTab === "test" && (
            <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <h3 style={{ fontSize: "20px", color: "#34d399", fontWeight: "800" }}>
                  🎉 Quiz Completed! Score: {testScore} / {quiz.length} ({Math.round((testScore / quiz.length) * 100)}%)
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
                  {testScore === quiz.length ? "Outstanding performance! Perfect score." : "Good effort! Review the detailed answers below."}
                </p>
                {savedScoreMsg && <div style={{ color: "#38bdf8", fontSize: "13px", marginTop: "6px", fontWeight: "600" }}>{savedScoreMsg}</div>}
              </div>
              <button className="btn-primary" onClick={handleSaveScoreToDB} style={{ background: "var(--emerald-gradient)" }}>
                💾 Save Score to Analytics
              </button>
            </div>
          )}

          {/* Question Cards Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {quiz.map((q, qIndex) => {
              const isCorrect = quizSubmitted && safeText(userAnswers[qIndex]).trim().toLowerCase() === safeText(q.answer).trim().toLowerCase();

              return (
                <div
                  key={qIndex}
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: quizSubmitted ? (isCorrect ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(244, 63, 94, 0.4)") : "1px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    padding: "20px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ fontSize: "16px", fontWeight: "700", color: "var(--text-main)" }}>
                      <span style={{ color: "var(--accent-primary)", marginRight: "8px" }}>Q{qIndex + 1}.</span>
                      {q.question}
                    </div>

                    {quizSubmitted && (
                      <span style={{ fontSize: "12px", fontWeight: "700", padding: "4px 10px", borderRadius: "12px", background: isCorrect ? "rgba(16, 185, 129, 0.2)" : "rgba(244, 63, 94, 0.2)", color: isCorrect ? "#34d399" : "#fca5a5" }}>
                        {isCorrect ? "✓ Correct" : "✕ Incorrect"}
                      </span>
                    )}
                  </div>

                  {/* MCQ Options */}
                  {q.type === "mcq" && Array.isArray(q.options) && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "12px" }}>
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userAnswers[qIndex] === opt;
                        const isActualAns = quizSubmitted && opt === q.answer;

                        let optBg = "rgba(255, 255, 255, 0.04)";
                        let optBorder = "var(--border-color)";

                        if (isSelected) {
                          optBg = "rgba(99, 102, 241, 0.2)";
                          optBorder = "var(--accent-primary)";
                        }
                        if (quizSubmitted && isActualAns) {
                          optBg = "rgba(16, 185, 129, 0.25)";
                          optBorder = "#10b981";
                        }

                        return (
                          <div
                            key={optIdx}
                            onClick={() => handleSelectAnswer(qIndex, opt)}
                            style={{
                              padding: "12px 16px",
                              borderRadius: "var(--radius-md)",
                              background: optBg,
                              border: `1px solid ${optBorder}`,
                              cursor: quizSubmitted ? "default" : "pointer",
                              fontSize: "14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ fontWeight: "700", color: "var(--text-muted)" }}>
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* True / False Options */}
                  {q.type === "true_false" && (
                    <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                      {["True", "False"].map((option) => {
                        const isSelected = userAnswers[qIndex] === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            className={`chip-btn ${isSelected ? "active" : ""}`}
                            onClick={() => handleSelectAnswer(qIndex, option)}
                            disabled={quizSubmitted}
                            style={{ padding: "10px 24px" }}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Fill in Blank / One Word / Short Answer Input Row */}
                  {(q.type === "fill_blank" || q.type === "one_mark" || q.type === "full_form" || !q.options || q.options.length === 0) && q.type !== "true_false" && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--accent-cyan)", flexShrink: 0 }}>
                        ✍️ Your Answer (1 Word / Short Answer):
                      </span>
                      <input
                        type="text"
                        placeholder="Type single word / short answer without spaces..."
                        value={userAnswers[qIndex] || ""}
                        onChange={(e) => handleSelectAnswer(qIndex, e.target.value)}
                        disabled={quizSubmitted}
                        style={{ maxWidth: "400px", padding: "8px 14px", fontSize: "14px" }}
                      />
                    </div>
                  )}

                  {/* Reveal Correct Answer on Submission */}
                  {quizSubmitted && (
                    <div style={{ marginTop: "12px", fontSize: "13px", color: "var(--text-secondary)", background: "rgba(0, 0, 0, 0.2)", padding: "8px 12px", borderRadius: "var(--radius-sm)" }}>
                      💡 <strong>Correct Answer:</strong> {safeText(q.answer)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Test Submission Button */}
          {activeTab === "test" && !quizSubmitted && (
            <div style={{ marginTop: "24px", textAlign: "center" }}>
              <button className="btn-primary" onClick={handleSubmitQuiz} style={{ padding: "14px 36px", fontSize: "16px" }}>
                ✅ Submit Test & View Score
              </button>
            </div>
          )}

          {/* Graded PDF Download Button after submission */}
          {quizSubmitted && (
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(16, 185, 129, 0.15)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#34d399" }}>
                  🎉 Test Submitted Successfully!
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Download a PDF report containing student selected answers alongside correct answer keys.
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={() => handleDownloadPDF("graded")}
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", padding: "10px 22px" }}
              >
                📊 Download Graded Student Report (PDF)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default QuizGenerator;