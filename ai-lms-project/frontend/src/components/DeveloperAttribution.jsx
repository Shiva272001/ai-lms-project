/**
 * =========================================================================================
 *  COPYRIGHT & INTELLECTUAL PROPERTY NOTICE
 * =========================================================================================
 *  © 2026 Shiva Singh. All Rights Reserved.
 *  Developer & Architect: Shiva Singh (AI Developer)
 *  Project: AI LMS - Next-Generation AI Intelligence Platform
 *  Module: DeveloperAttribution.jsx (Branding, Text Logo & Footer Components)
 * 
 *  Unauthorized copying, reproduction, or distribution of this code without express written
 *  permission from Shiva Singh is strictly prohibited.
 * =========================================================================================
 */

import React from "react";
import { Link } from "react-router-dom";

/**
 * Modern AI / Technology Text Logo: "SHIVA"
 * Engineered with cyber electric gradients, glowing neural nexus, and educational AI accents.
 */
export function ShivaTextLogo({ size = "default", showIcon = true }) {
  const isLarge = size === "large";
  const isSmall = size === "small";

  const fontSize = isLarge ? "32px" : isSmall ? "18px" : "22px";
  const iconSize = isLarge ? 34 : isSmall ? 20 : 26;

  return (
    <div className="shiva-text-logo-wrapper">
      {showIcon && (
        <div className="shiva-neural-icon">
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="shiva-icon-svg"
          >
            <defs>
              <linearGradient id="shivaHexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
              <linearGradient id="shivaCoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
            {/* Tech Diamond Shield */}
            <polygon
              points="20,2 37,11 37,29 20,38 3,29 3,11"
              fill="rgba(10, 16, 31, 0.9)"
              stroke="url(#shivaHexGrad)"
              strokeWidth="2"
            />
            {/* Inner Neural Node Grid */}
            <circle cx="20" cy="20" r="4.5" fill="url(#shivaCoreGrad)">
              <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite" />
            </circle>
            <line x1="20" y1="2" x2="20" y2="15.5" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="20" y1="24.5" x2="20" y2="38" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="3" y1="20" x2="15.5" y2="20" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="2 2" />
            <line x1="24.5" y1="20" x2="37" y2="20" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="2 2" />
          </svg>
        </div>
      )}

      {/* Main Text Logo: "SHIVA" */}
      <span
        className="shiva-logo-text"
        style={{
          fontSize,
          fontFamily: "var(--font-heading)",
          fontWeight: "800",
          letterSpacing: "2.5px",
          background: "linear-gradient(135deg, #ffffff 0%, #00d4ff 45%, #c084fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 20px rgba(0, 212, 255, 0.4)",
          display: "inline-flex",
          alignItems: "center"
        }}
      >
        SHIVA
        <span
          className="shiva-ai-pill"
          style={{
            fontSize: isLarge ? "12px" : "9px",
            letterSpacing: "1px",
            fontFamily: "var(--font-heading)",
            fontWeight: "700",
            background: "rgba(0, 212, 255, 0.15)",
            border: "1px solid var(--border-cyan-bright)",
            borderRadius: "12px",
            padding: "1px 6px",
            marginLeft: "6px",
            color: "var(--accent-cyan)",
            WebkitTextFillColor: "var(--accent-cyan)",
            textTransform: "uppercase"
          }}
        >
          AI
        </span>
      </span>
    </div>
  );
}

/**
 * Navbar Branding Component:
 * - Logo: SHIVA
 * - Name/Tagline: Shiva Singh | AI Developer
 */
export function ShivaNavbarBrand() {
  return (
    <Link to="/" className="shiva-navbar-brand-link" title="AI LMS — Engineered by Shiva Singh">
      <ShivaTextLogo size="default" showIcon={true} />
      <div className="shiva-navbar-tagline-container">
        <span className="shiva-tagline-name">Shiva Singh</span>
        <span className="shiva-tagline-separator">|</span>
        <span className="shiva-tagline-title">AI Developer</span>
      </div>
    </Link>
  );
}

/**
 * Professional Footer Component:
 * - Designed & Developed by Shiva Singh
 * - AI Developer
 * - © 2026 Shiva Singh. All Rights Reserved.
 * - Matches the website's dark cyber educational design.
 */
export function ShivaProfessionalFooter() {
  return (
    <div className="shiva-professional-footer">
      <div className="shiva-footer-inner">
        {/* Top Section: Brand & Developer Showcase */}
        <div className="shiva-footer-top">
          <div className="shiva-footer-brand-block">
            <ShivaTextLogo size="large" showIcon={true} />
            <div className="shiva-footer-developer-info">
              <div className="shiva-dev-line">
                <span className="shiva-dev-highlight">Designed & Developed by Shiva Singh</span>
              </div>
              <div className="shiva-dev-role-badge">
                <span className="pulse-dot" style={{ width: "6px", height: "6px" }}></span>
                <span>AI Developer</span>
                <span className="shiva-badge-dot">•</span>
                <span>Educational AI Architect</span>
              </div>
            </div>
          </div>

          {/* Educational AI System Status & Security Badges */}
          <div className="shiva-footer-badges">
            <div className="shiva-telemetry-badge">
              <span className="shiva-status-indicator"></span>
              <span>AI LMS INTELLIGENCE ENGINE</span>
            </div>
            <div className="shiva-cert-tags">
              <span>ISO 27001</span>
              <span>SOC 2 TYPE II</span>
              <span>GDPR PRIVACY</span>
              <span>SYS_V4.2</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="shiva-footer-divider"></div>

        {/* Bottom Section: Copyright Notice */}
        <div className="shiva-footer-bottom">
          <div className="shiva-copyright-text">
            © 2026 <strong style={{ color: "#ffffff" }}>Shiva Singh</strong>. All Rights Reserved.
          </div>
          <div className="shiva-footer-caption">
            AI-Powered Learning Management System • Engineered for Academic Excellence & Next-Gen Intelligence
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Watermark for component views
 */
export function DeveloperWatermark({ moduleName = "" }) {
  return (
    <div className="developer-module-watermark">
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <ShivaTextLogo size="small" showIcon={false} />
        <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
          Designed & Developed by <span style={{ color: "var(--accent-cyan)", fontWeight: "700" }}>Shiva Singh</span> | AI Developer
        </span>
        {moduleName && (
          <span
            style={{
              background: "rgba(0, 212, 255, 0.08)",
              border: "1px solid rgba(0, 212, 255, 0.25)",
              color: "var(--accent-cyan)",
              padding: "2px 8px",
              borderRadius: "10px",
              fontSize: "10px"
            }}
          >
            {moduleName}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
        <span>© 2026 Shiva Singh</span>
        <span>•</span>
        <span>All Rights Reserved</span>
      </div>
    </div>
  );
}

/**
 * Developer Badge for quick status/watermark
 */
export function DeveloperBadge({ compact = false }) {
  return (
    <div className="developer-hud-badge">
      <ShivaTextLogo size="small" showIcon={false} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.15" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: compact ? "11px" : "12px",
              fontWeight: "700",
              color: "#ffffff",
              letterSpacing: "0.5px"
            }}
          >
            Shiva Singh
          </span>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "var(--accent-cyan)",
              boxShadow: "0 0 8px var(--accent-cyan)",
              display: "inline-block"
            }}
          ></span>
        </div>
        <span
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "9px",
            fontWeight: "700",
            color: "var(--accent-cyan)",
            letterSpacing: "1px",
            textTransform: "uppercase"
          }}
        >
          AI Developer
        </span>
      </div>
    </div>
  );
}

/**
 * Dedicated Profile Section: Shiva Singh is an AI Developer
 */
export function DeveloperProfileCard() {
  const skills = [
    "Generative AI & LLMs",
    "Educational AI Architectures",
    "Autonomous Agents & Workflows",
    "FastAPI & Python",
    "React & Modern UI Systems",
    "Multimodal Audio & Video AI",
    "Computer Vision & Document OCR",
    "Adaptive Learning Roadmaps"
  ];

  return (
    <div
      className="card hud-corner"
      style={{
        background: "linear-gradient(135deg, rgba(10, 16, 31, 0.95) 0%, rgba(14, 23, 47, 0.92) 100%)",
        border: "1px solid var(--border-cyan-bright)",
        position: "relative",
        overflow: "hidden",
        marginTop: "36px",
        boxShadow: "0 0 35px rgba(0, 212, 255, 0.12)"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "200px",
          height: "200px",
          background: "radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none"
        }}
      ></div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "24px",
          position: "relative",
          zIndex: 2
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div
            style={{
              position: "relative",
              padding: "4px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #00d4ff, #a855f7)",
              boxShadow: "0 0 24px rgba(0, 212, 255, 0.5)"
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#050814",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ShivaTextLogo size="small" showIcon={true} />
            </div>
            <span
              style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#10b981",
                border: "2px solid #050814",
                boxShadow: "0 0 8px #10b981"
              }}
              title="Verified Active AI Developer"
            ></span>
          </div>

          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(0, 212, 255, 0.1)", border: "1px solid var(--border-cyan)", color: "var(--accent-cyan)", padding: "3px 12px", borderRadius: "16px", fontFamily: "var(--font-heading)", fontSize: "10px", fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: "6px" }}>
              ⭐ LEAD SYSTEM ARCHITECT & CREATOR
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "26px",
                fontWeight: "700",
                color: "#ffffff",
                letterSpacing: "-0.5px",
                margin: 0
              }}
            >
              Shiva Singh <span style={{ color: "var(--accent-cyan)", textShadow: "0 0 12px rgba(0, 212, 255, 0.5)" }}>| AI Developer</span>
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "6px", maxWidth: "620px", lineHeight: "1.6" }}>
              Architect & Lead Developer of this <strong>AI-Powered Learning Management System</strong>, delivering state-of-the-art AI lesson synthesis, intelligent doubt resolution, automated rubrics grading, and adaptive 14-day mastery roadmaps.
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "rgba(5, 7, 15, 0.8)",
            border: "1px solid var(--border-cyan)",
            padding: "14px 20px",
            borderRadius: "var(--radius-md)",
            minWidth: "220px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Lead Developer:</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: "700", fontFamily: "var(--font-heading)" }}>Shiva Singh</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Specialization:</span>
            <span style={{ color: "#ffffff", fontWeight: "600" }}>AI Developer</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Platform Status:</span>
            <span style={{ color: "#34d399", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="pulse-dot" style={{ width: "6px", height: "6px" }}></span> ONLINE & VERIFIED
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(0, 212, 255, 0.15)" }}>
        <div style={{ fontSize: "11px", fontFamily: "var(--font-heading)", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>
          Core AI Competencies & Stack:
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {skills.map((skill, idx) => (
            <span
              key={idx}
              style={{
                fontSize: "12px",
                fontFamily: "var(--font-heading)",
                fontWeight: "600",
                background: "rgba(0, 212, 255, 0.06)",
                border: "1px solid rgba(0, 212, 255, 0.25)",
                color: "#e2e8f0",
                padding: "4px 12px",
                borderRadius: "14px",
                letterSpacing: "0.5px"
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShivaNavbarBrand;
