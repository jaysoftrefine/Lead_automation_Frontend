import React from "react";
import { PlayCircle, Database, Bot, Building2, Mail, Zap, Briefcase } from "lucide-react";

export interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  leadsCount?: number;
  euCount?: number;
  templatesCount?: number;
  automationsUpcomingCount?: number;
  applicationsCount?: number;
  isRunning?: boolean;
}

export function Navigation({
  activeTab,
  setActiveTab,
  leadsCount,
  euCount,
  templatesCount,
  automationsUpcomingCount,
  applicationsCount,
  isRunning,
}: NavigationProps) {
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
      badgeType: null,
    },
    {
      id: "instant-research",
      label: "Instant Agent Lab",
      icon: Bot,
      badge: null,
      badgeType: null,
    },
    {
      id: "eu-startups",
      label: "EU Startups Explorer",
      icon: Building2,
      badge: euCount !== undefined ? euCount : null,
      badgeType: null,
    },
    {
      id: "email",
      label: "Email Campaigns",
      icon: Mail,
      badge: templatesCount !== undefined ? templatesCount : null,
      badgeType: null,
      badgeGradient: true,
    },
    {
      id: "automations",
      label: "Automation Hub",
      icon: Zap,
      badge: automationsUpcomingCount !== undefined && automationsUpcomingCount > 0 ? automationsUpcomingCount : null,
      badgeType: null,
    },
    {
      id: "personal-jobs",
      label: "My Job Applications",
      icon: Briefcase,
      badge: applicationsCount !== undefined ? `${applicationsCount} Sent` : "46 Sent",
      badgeType: null,
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
