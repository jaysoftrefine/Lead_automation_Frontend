import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { PipelineRunner } from "./views/PipelineRunner";
import { LeadsExplorer } from "./views/LeadsExplorer";
import { InstantAgentLab } from "./views/InstantAgentLab";
import { EUStartupsExplorer } from "./views/EUStartupsExplorer";
import { EmailCampaigns } from "./views/EmailCampaigns";
import { AutomationHub } from "./views/AutomationHub";
import { PersonalWorkspace } from "./views/PersonalWorkspace";
import { api } from "./services/api";

export interface ToastItem {
  id: number;
  message: string;
  type: string;
}

export function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("hirepilot_theme") || localStorage.getItem("leadpulse_theme") || "light";
  });
  const [workspaceMode, setWorkspaceMode] = useState<"company" | "personal">(() => {
    return (localStorage.getItem("hirepilot_workspace_mode") as "company" | "personal") || "company";
  });
  const [activeTab, setActiveTab] = useState("pipeline");
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [euCount, setEuCount] = useState(0);
  const [templatesCount, setTemplatesCount] = useState(0);
  const [automationsUpcomingCount, setAutomationsUpcomingCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showSmtpModal, setShowSmtpModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hirepilot_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleToggleWorkspaceMode = (mode: "company" | "personal") => {
    setWorkspaceMode(mode);
    localStorage.setItem("hirepilot_workspace_mode", mode);
    showToast(
      mode === "personal"
        ? "Switched to Personal Career & Freelance Hub"
        : "Switched to Company B2B Lead Engine",
      "info"
    );
  };

  const showToast = (message: string, type: string = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadGlobalStats = async () => {
    try {
      const stats = await api.getStats();
      if (stats?.leads_count !== undefined) setLeadsCount(stats.leads_count);
    } catch (e) {}

    try {
      const euStats = await api.getEUStats();
      if (euStats?.total !== undefined) setEuCount(euStats.total);
    } catch (e) {}

    try {
      const tpls = await api.getTemplates();
      if (tpls?.data) setTemplatesCount(tpls.data.length);
    } catch (e) {}

    try {
      const autoData = await api.getAutomationsOverview();
      if (autoData?.counts?.total_upcoming !== undefined) {
        setAutomationsUpcomingCount(autoData.counts.total_upcoming);
      }
    } catch (e) {}
  };

  // Load global stats once on mount only
  useEffect(() => {
    loadGlobalStats();
  }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenSmtp={() => setShowSmtpModal(true)}
        isPipelineRunning={isPipelineRunning}
        theme={theme}
        onToggleTheme={toggleTheme}
        workspaceMode={workspaceMode}
        onToggleWorkspaceMode={handleToggleWorkspaceMode}
      />

      {/* When in Personal Workspace Mode */}
      {workspaceMode === "personal" ? (
        <main style={{ marginTop: "1rem" }}>
          <PersonalWorkspace onToast={showToast} />
        </main>
      ) : (
        /* When in Company Mode */
        <>
          {/* Main Tab Navigation */}
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            leadsCount={leadsCount}
            euCount={euCount}
            templatesCount={templatesCount}
            automationsUpcomingCount={automationsUpcomingCount}
            isRunning={isPipelineRunning}
          />

          {/* Active Tab View */}
          <main style={{ marginTop: "0.25rem" }}>
            <div style={{ display: activeTab === "pipeline" ? "block" : "none" }}>
              <PipelineRunner
                onToast={showToast}
                onStatusChange={(running) => {
                  setIsPipelineRunning(running);
                  // Refresh badge counts when pipeline finishes
                  if (!running) loadGlobalStats();
                }}
              />
            </div>

            {activeTab === "leads" && <LeadsExplorer onToast={showToast} />}

            {activeTab === "instant-research" && (
              <InstantAgentLab onToast={showToast} onRefreshStats={loadGlobalStats} />
            )}

            {activeTab === "eu-startups" && <EUStartupsExplorer onToast={showToast} />}

            {activeTab === "email" && (
              <EmailCampaigns
                onToast={showToast}
                onUpdateBadge={(cnt: number) => setTemplatesCount(cnt)}
                showSmtpModalDirect={showSmtpModal}
                onCloseSmtpModalDirect={() => setShowSmtpModal(false)}
              />
            )}

            {activeTab === "automations" && (
              <AutomationHub
                onToast={showToast}
                onUpdateBadge={(cnt: number) => setAutomationsUpcomingCount(cnt)}
              />
            )}
          </main>
        </>
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

