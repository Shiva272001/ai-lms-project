import React from "react";
import { BrowserRouter, Routes, Route, NavLink, Link, useNavigate, useLocation } from "react-router-dom";

import LessonGenerator from "./components/LessonGenerator";
import AudioVideoStudio from "./components/AudioVideoStudio";
import HomeworkConverter from "./components/HomeworkConverter";
import QuizGenerator from "./components/QuizGenerator";
import Chatbot from "./components/Chatbot";
import AssignmentEvaluator from "./components/AssignmentEvaluator";
import LearningPath from "./components/LearningPath";
import ProgressChart from "./components/ProgressChart";
import StudyPlanner from "./components/StudyPlanner";

function Home() {
  const navigate = useNavigate();

  const features = [
    {
      title: "AI Lesson Generator",
      desc: "Generate grade-tailored educational lessons complete with AI visual diagrams and downloadable PDF notes.",
      icon: "📘",
      color: "rgba(0, 212, 255, 0.15)",
      borderColor: "rgba(0, 212, 255, 0.3)",
      path: "/lesson",
      badge: "Visual & PDF"
    },
    {
      title: "Audio & Video Studio",
      desc: "NotebookLM style Multilingual Audio Overviews (.mp3) and Video Storyboards from PPT, PDF, Image, or Notes in English, Hinglish, Hindi, & Punjabi.",
      icon: "🎙️🎬",
      color: "rgba(255, 107, 53, 0.15)",
      borderColor: "rgba(255, 107, 53, 0.3)",
      path: "/studio",
      badge: "Multilingual Studio"
    },
    {
      title: "AI Homework & PDF Converter",
      desc: "Convert handwritten notebook photos or scanned homework PDFs into structured digital lesson notes with instant PDF export.",
      icon: "📄✨",
      color: "rgba(16, 185, 129, 0.15)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      path: "/converter",
      badge: "OCR & PDF Export"
    },
    {
      title: "Interactive Quiz Creator",
      desc: "Convert lesson passages into interactive quizzes with automated grading, instant score breakdown, and printable PDFs.",
      icon: "📝",
      color: "rgba(168, 85, 247, 0.15)",
      borderColor: "rgba(168, 85, 247, 0.3)",
      path: "/quiz",
      badge: "Interactive & PDF"
    },
    {
      title: "Student Doubt Chatbot",
      desc: "Ask any academic doubt and receive clear, step-by-step explanations from your 24/7 conversational AI tutor.",
      icon: "💬",
      color: "rgba(77, 242, 255, 0.15)",
      borderColor: "rgba(77, 242, 255, 0.3)",
      path: "/chatbot",
      badge: "Memory Aware"
    },
    {
      title: "Assignment Evaluator",
      desc: "Grade student written answers automatically against model rubrics with numeric scores and constructive feedback.",
      icon: "✅",
      color: "rgba(16, 185, 129, 0.15)",
      borderColor: "rgba(16, 185, 129, 0.3)",
      path: "/evaluate",
      badge: "Auto Scoring"
    },
    {
      title: "Learning Path Roadmap",
      desc: "Generate personalized 14-day study roadmaps targeted at reinforcing weak topics and strengthening proficient skills.",
      icon: "🎯",
      color: "rgba(255, 107, 53, 0.15)",
      borderColor: "rgba(255, 107, 53, 0.3)",
      path: "/learning-path",
      badge: "Adaptive"
    },
    {
      title: "Progress Analytics",
      desc: "Track quiz scores, average subject metrics, and student growth over time with interactive Recharts bar charts.",
      icon: "📊",
      color: "rgba(244, 63, 94, 0.15)",
      borderColor: "rgba(244, 63, 94, 0.3)",
      path: "/progress",
      badge: "Live Telemetry"
    },
    {
      title: "AI Study Planner",
      desc: "Build daily revision timetables customized to your subjects, available daily study hours, and target exam deadlines.",
      icon: "🗓️",
      color: "rgba(0, 212, 255, 0.15)",
      borderColor: "rgba(0, 212, 255, 0.3)",
      path: "/study-planner",
      badge: "Timetable Grid"
    }
  ];

  return (
    <div style={{ animation: "fadeIn 0.4s ease-out" }}>
      {/* GuardianEye Cyber Hero Banner */}
      <div className="card hud-corner" style={{ background: "rgba(10, 16, 31, 0.85)", borderColor: "var(--border-cyan-bright)", position: "relative", overflow: "hidden" }}>
        {/* Radial Spotlight Light */}
        <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "250px", height: "250px", background: "radial-gradient(circle, rgba(0, 212, 255, 0.25) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}></div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "24px", position: "relative", zIndex: 10 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "4px 14px", borderRadius: "20px", fontFamily: "var(--font-heading)", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "14px" }}>
              <span className="pulse-dot"></span> AI INTELLIGENCE PLATFORM V4.2
            </div>

            <h1 style={{ fontFamily: "var(--font-heading)", fontSize: "36px", fontWeight: "700", color: "#ffffff", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
              See Everything. <span style={{ color: "var(--accent-cyan)", textShadow: "0 0 15px rgba(0, 212, 255, 0.5)" }}>Learn Anything.</span>
            </h1>

            <p style={{ color: "var(--text-secondary)", fontSize: "15px", marginTop: "10px", maxWidth: "680px", lineHeight: "1.7" }}>
              Next-generation AI education ecosystem engineered for modern learning. AI lesson synthesis, dynamic test creation, intelligent grading, and adaptive roadmaps.
            </p>
          </div>

          <button className="btn-primary" onClick={() => navigate("/lesson")} style={{ padding: "14px 28px", fontSize: "14px" }}>
            🚀 Launch Network
          </button>
        </div>

        {/* Live Metrics Grid */}
        <div className="stats-grid" style={{ marginTop: "32px" }}>
          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(0, 212, 255, 0.1)", color: "var(--accent-cyan)" }}>⚡</div>
            <div>
              <div className="stat-value">9 Modules</div>
              <div className="stat-label">AI Intelligence Tools</div>
            </div>
          </div>

          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(168, 85, 247, 0.1)", color: "var(--accent-violet)" }}>🤖</div>
            <div>
              <div className="stat-value">Multi-LLM</div>
              <div className="stat-label">Groq • OpenAI • Gemini</div>
            </div>
          </div>

          <div className="stat-card hud-corner">
            <div className="stat-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#34d399" }}>📄</div>
            <div>
              <div className="stat-value">PDF & Chart</div>
              <div className="stat-label">Export & Real-Time Telemetry</div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Divider */}
      <div className="telemetry-divider">
        <span>SEC_01</span>
        <div className="telemetry-line"></div>
        <span>GPS: 28.6139° N 77.2090° E</span>
        <div className="telemetry-line"></div>
        <span>AI_LMS_SYSTEM_ONLINE</span>
      </div>

      {/* Feature Showcase Grid */}
      <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "700", marginBottom: "20px", letterSpacing: "1px", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ color: "var(--accent-cyan)" }}>⚡</span> AI Intelligence Modules
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {features.map((item, index) => (
          <div
            key={index}
            className="card hud-corner"
            onClick={() => navigate(item.path)}
            style={{
              cursor: "pointer",
              margin: 0,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              background: "rgba(10, 16, 31, 0.75)"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "var(--radius-sm)", background: item.color, border: `1px solid ${item.borderColor}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>
                  {item.icon}
                </div>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", background: "rgba(0, 212, 255, 0.05)", border: "1px solid var(--border-cyan)", padding: "4px 10px", borderRadius: "12px", color: "var(--accent-cyan)" }}>
                  {item.badge}
                </span>
              </div>

              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "700", color: "var(--text-main)", marginBottom: "8px", letterSpacing: "0.5px" }}>
                {item.title}
              </h3>

              <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", flex: 1 }}>
                {item.desc}
              </p>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "14px", borderTop: "1px solid var(--border-cyan)", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--accent-cyan)", fontFamily: "var(--font-heading)", fontWeight: "700", fontSize: "12px", letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Launch Module</span>
              <span>→</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageTransitionWrapper({ children }) {
  const location = useLocation();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 240);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div style={{ position: "relative", minHeight: "60vh", perspective: "1200px" }}>
      {loading && (
        <div className="cyber-privacy-shield">
          <div className="privacy-scanline"></div>
          <div className="privacy-badge" style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
            <img
              src="/ai_3d_avatar.jpg"
              alt="3D AI Avatar"
              className="ai-study-badge"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                border: "2px solid var(--accent-cyan)",
                boxShadow: "0 0 20px rgba(0, 212, 255, 0.7)",
                objectFit: "cover"
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span className="privacy-text" style={{ fontSize: "11px" }}>3D AI STUDY ENGINE</span>
              <span style={{ fontSize: "9px", color: "var(--accent-cyan)", letterSpacing: "1px", fontFamily: "var(--font-heading)" }}>INITIALIZING PAGE HYPERSPACE...</span>
            </div>
            <div className="privacy-pulse"></div>
          </div>
        </div>
      )}
      <div
        key={location.pathname}
        className="page-transition-container animate-3d-entry"
        style={{
          opacity: loading ? 0 : 1,
          filter: loading ? "blur(6px) brightness(0.6)" : "blur(0px) brightness(1)",
          transform: loading
            ? "perspective(1200px) rotateX(-8deg) scale(0.96) translateY(18px)"
            : "perspective(1200px) rotateX(0deg) scale(1) translateY(0)",
          transition: "all 0.38s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {children}
      </div>
    </div>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      {/* HUD Navigation Header */}
      <header className="navbar">
        <div className="nav-container">
          {/* GuardianEye Diamond Badge Logo */}
          <Link to="/" className="brand-logo">
            <div className="diamond-badge">
              <div className="diamond-outer"></div>
              <div className="diamond-inner"></div>
              <div className="diamond-core"></div>
            </div>
            <div className="brand-title">AI <span>LMS</span></div>
          </Link>

          <nav>
            <ul className="nav-links">
              <li><NavLink to="/" end className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>🏠 Home</NavLink></li>
              <li><NavLink to="/lesson" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>📘 Lesson</NavLink></li>
              <li><NavLink to="/studio" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>🎙️ Studio</NavLink></li>
              <li><NavLink to="/converter" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>📄 Converter</NavLink></li>
              <li><NavLink to="/quiz" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>📝 Quiz</NavLink></li>
              <li><NavLink to="/chatbot" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>💬 Chatbot</NavLink></li>
              <li><NavLink to="/evaluate" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>✅ Evaluate</NavLink></li>
              <li><NavLink to="/learning-path" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>🎯 Roadmap</NavLink></li>
              <li><NavLink to="/progress" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>📊 Progress</NavLink></li>
              <li><NavLink to="/study-planner" className={({ isActive }) => "nav-item-link" + (isActive ? " active" : "")}>🗓️ Planner</NavLink></li>
            </ul>
          </nav>

          <div className="ai-status-badge">
            <div className="pulse-dot"></div>
            <span>AI_NETWORK_ONLINE</span>
          </div>
        </div>
      </header>

      {/* Main Content View with Page Transition */}
      <main className="main-content">
        <PageTransitionWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lesson" element={<LessonGenerator />} />
            <Route path="/studio" element={<AudioVideoStudio />} />
            <Route path="/converter" element={<HomeworkConverter />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/evaluate" element={<AssignmentEvaluator />} />
            <Route path="/learning-path" element={<LearningPath />} />
            <Route path="/progress" element={<ProgressChart />} />
            <Route path="/study-planner" element={<StudyPlanner />} />
          </Routes>
        </PageTransitionWrapper>
      </main>

      {/* Telemetry Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span>© 2026 AI LMS INTELLIGENCE PLATFORM • ALL RIGHTS RESERVED</span>
          <div style={{ display: "flex", gap: "16px", color: "var(--accent-cyan)" }}>
            <span>ISO 27001</span>
            <span>SOC 2</span>
            <span>GDPR</span>
            <span>SYS_V4.2</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
