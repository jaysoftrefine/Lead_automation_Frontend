import React from "react";
import { PlayCircle, Database, Bot, Building2, Mail } from "lucide-react";

export function Navigation({ activeTab, setActiveTab, leadsCount, euCount, templatesCount, isRunning }) {
  const tabs = [
    {
      id: "pipeline",
      label: "Pipeline Runner",
      icon: PlayCircle,
      badge: isRunning ? "Running" : null,
      badgeType: isRunning ? "running" : null,
    },
    {
      id: "leads",
      label: "Leads Explorer",
      icon: Database,
      badge: leadsCount !== undefined ? leadsCount : null,
    },
    {
      id: "instant-research",
      label: "Instant Agent Lab",
      icon: Bot,
    },
    {
      id: "eu-startups",
      label: "EU Startups Explorer",
      icon: Building2,
      badge: euCount !== undefined ? euCount : null,
    },
    {
      id: "email",
      label: "Email Campaigns",
      icon: Mail,
      badge: templatesCount !== undefined ? templatesCount : null,
      badgeGradient: true,
    },
  ];

  return (
    <nav className="nav-tabs-wrapper">
      <div className="nav-tabs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`tab-btn ${isActive ? "active" : ""}`}
            >
              <Icon />
              <span>{t.label}</span>
              {t.badge !== null && t.badge !== undefined && (
                <span
                  className="tab-badge"
                  style={
                    t.badgeGradient
                      ? { background: "linear-gradient(135deg, #10b981, #06b6d4)" }
                      : t.badgeType === "running"
                      ? { background: "#10b981", fontSize: "0.65rem", textTransform: "uppercase" }
                      : {}
                  }
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
