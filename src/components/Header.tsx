import React, { useState, useEffect } from "react";
import { Zap, Clock, Sun, Moon, Building2, Briefcase } from "lucide-react";

export interface HeaderProps {
  stats?: any;
  isPipelineRunning?: boolean;
  theme: string;
  onToggleTheme: () => void;
  onOpenSmtp?: () => void;
  workspaceMode?: "company" | "personal";
  onToggleWorkspaceMode?: (mode: "company" | "personal") => void;
}

export function Header({
  isPipelineRunning,
  theme,
  onToggleTheme,
  workspaceMode = "company",
  onToggleWorkspaceMode,
}: HeaderProps) {
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
  const isPersonal = workspaceMode === "personal";

  return (
    <header className="glass-card header-bar">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1.2rem" }}>
        
        {/* Left: Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.95rem" }}>
          <div
            className="brand-logo-icon"
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: isPersonal
                ? "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)"
                : "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isPersonal
                ? "0 4px 18px rgba(6, 182, 212, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)"
                : "0 4px 18px rgba(99, 102, 241, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {isPersonal ? (
              <Briefcase style={{ width: "22px", height: "22px", color: "#fff" }} />
            ) : (
              <Zap style={{ width: "22px", height: "22px", color: "#fff" }} />
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              <h1 style={{ fontSize: "1.28rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
                HirePilot <span style={{ color: "var(--accent-cyan)" }}>AI</span>
              </h1>
              <span
                className="platform-badge accent"
                style={{
                  fontSize: "0.68rem",
                  background: isPersonal ? "rgba(6, 182, 212, 0.16)" : undefined,
                  borderColor: isPersonal ? "rgba(6, 182, 212, 0.38)" : undefined,
                  color: isPersonal ? "var(--accent-cyan)" : undefined,
                }}
              >
                {isPersonal ? "Personal Career Hub" : "B2B Lead Engine"}
              </span>
            </div>
            <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "2px", fontWeight: 500 }}>
              {isPersonal
                ? "Personal Opportunity Finder • Tech Jobs, Freelance Contracts & Recruiters"
                : "Autonomous Scraping, AI Enrichment & Email Marketing"}
            </p>
          </div>
        </div>

        {/* Center: Workspace Mode Switcher Toggle */}
        <div className="workspace-toggle-wrapper" role="tablist" aria-label="Workspace Mode Switcher">
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "company"}
            onClick={() => onToggleWorkspaceMode?.("company")}
            className={`workspace-toggle-btn ${workspaceMode === "company" ? "active" : ""}`}
            title="Switch to Company B2B Lead Engine"
          >
            <Building2 style={{ width: "14px", height: "14px" }} />
            <span>Company Leads</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={workspaceMode === "personal"}
            onClick={() => onToggleWorkspaceMode?.("personal")}
            className={`workspace-toggle-btn personal ${workspaceMode === "personal" ? "active personal" : ""}`}
            title="Switch to Personal Career & Freelance Search"
          >
            <Briefcase style={{ width: "14px", height: "14px" }} />
            <span>Personal Search</span>
            <span className="workspace-badge-new">NEW</span>
          </button>
        </div>

        {/* Right: Clock, Status & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          {/* Status Indicator */}
          <div
            className="header-pill status-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "0.42rem 0.9rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
            }}
          >
            <span className={`pulse-dot ${isPipelineRunning ? "running" : ""}`} style={{ background: isPipelineRunning ? "var(--accent-emerald)" : "#10b981", boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)" }} />
            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
              {isPipelineRunning ? "Pipeline Running" : "Engine Ready"}
            </span>
          </div>

          {/* Clock */}
          <div
            className="header-pill clock-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              padding: "0.42rem 0.9rem",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Clock style={{ width: "13px", height: "13px", color: "var(--accent-cyan)" }} />
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{timeStr || "12:00:00"}</span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>• {dateStr}</span>
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
                <Sun className="theme-icon sun-icon" style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
              ) : (
                <Moon className="theme-icon moon-icon" style={{ width: "16px", height: "16px", color: "#818cf8" }} />
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
