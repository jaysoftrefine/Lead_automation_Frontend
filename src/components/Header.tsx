import React, { useState, useEffect } from "react";
import { Zap, Clock, Sun, Moon } from "lucide-react";

export interface HeaderProps {
  stats?: any;
  isPipelineRunning?: boolean;
  theme: string;
  onToggleTheme: () => void;
  onOpenSmtp?: () => void;
}

export function Header({ isPipelineRunning, theme, onToggleTheme }: HeaderProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString());
      setDateStr(
        now.toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const isLight = theme === "light";

  return (
    <header className="glass-card header-bar" style={{ padding: "0.9rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
        
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            className="brand-logo-icon"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Zap style={{ width: "20px", height: "20px", color: "#fff" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1 style={{ fontSize: "1.2rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                HirePilot <span style={{ color: "var(--accent-cyan)" }}>AI</span>
              </h1>
              <span className="platform-badge accent" style={{ fontSize: "0.68rem" }}>
                B2B Lead Engine
              </span>
            </div>
            <p style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Autonomous Scraping, AI Enrichment &amp; Email Marketing
            </p>
          </div>
        </div>

        {/* Right: Clock, Status & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          {/* Status Indicator */}
          <div
            className="header-pill status-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
            }}
          >
            <span className={`pulse-dot ${isPipelineRunning ? "running" : ""}`} />
            <span style={{ color: isPipelineRunning ? "var(--accent-emerald)" : "var(--text-muted)", fontWeight: 600 }}>
              {isPipelineRunning ? "Pipeline Running" : "Engine Ready"}
            </span>
          </div>

          {/* Clock */}
          <div
            className="header-pill clock-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "0.35rem 0.75rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
              color: "var(--text-secondary)",
            }}
          >
            <Clock style={{ width: "13px", height: "13px", color: "var(--accent-cyan)" }} />
            <span>{timeStr || "12:00:00"}</span>
            <span style={{ color: "var(--text-dim)", fontSize: "0.72rem" }}>• {dateStr}</span>
          </div>

          {/* Theme Switcher Toggle */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            title={`Switch to ${isLight ? "Dark" : "Light"} Theme`}
            aria-label="Toggle Theme"
          >
            <div className="theme-toggle-icon-wrap">
              {isLight ? (
                <Sun className="theme-icon sun-icon" style={{ width: "15px", height: "15px", color: "#f59e0b" }} />
              ) : (
                <Moon className="theme-icon moon-icon" style={{ width: "15px", height: "15px", color: "#818cf8" }} />
              )}
            </div>
            <span className="theme-toggle-label">
              {isLight ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
