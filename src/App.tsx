import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Navigation } from "./components/Navigation";
import { PipelineRunner } from "./views/PipelineRunner";
import { LeadsExplorer } from "./views/LeadsExplorer";
import { InstantAgentLab } from "./views/InstantAgentLab";
import { EUStartupsExplorer } from "./views/EUStartupsExplorer";
import { EmailCampaigns } from "./views/EmailCampaigns";
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
  const [activeTab, setActiveTab] = useState("pipeline");
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [leadsCount, setLeadsCount] = useState(0);
  const [euCount, setEuCount] = useState(0);
  const [templatesCount, setTemplatesCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [showSmtpModal, setShowSmtpModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("hirepilot_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
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
      if (stats?.total_leads !== undefined) setLeadsCount(stats.total_leads);
    } catch (e) {}

    try {
      const euStats = await api.getEUStats();
      if (euStats?.total !== undefined) setEuCount(euStats.total);
    } catch (e) {}

    try {
      const tpls = await api.getTemplates();
      if (tpls?.data) setTemplatesCount(tpls.data.length);
    } catch (e) {}
  };

  // Global stats polling commented out to avoid repeated network calls
  // useEffect(() => {
  //   loadGlobalStats();
  // }, []);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header
        onOpenSmtp={() => setShowSmtpModal(true)}
        isPipelineRunning={isPipelineRunning}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Tab Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leadsCount={leadsCount}
        euCount={euCount}
        templatesCount={templatesCount}
        isRunning={isPipelineRunning}
      />

      {/* Active Tab View */}
      <main style={{ marginTop: "0.25rem" }}>
        {activeTab === "pipeline" && (
          <PipelineRunner
            onToast={showToast}
            onStatusChange={(running) => setIsPipelineRunning(running)}
          />
        )}

        {activeTab === "leads" && <LeadsExplorer onToast={showToast} />}

        {activeTab === "instant-research" && <InstantAgentLab onToast={showToast} />}

        {activeTab === "eu-startups" && <EUStartupsExplorer onToast={showToast} />}

        {activeTab === "email" && (
          <EmailCampaigns
            onToast={showToast}
            onUpdateBadge={(cnt: number) => setTemplatesCount(cnt)}
            showSmtpModalDirect={showSmtpModal}
            onCloseSmtpModalDirect={() => setShowSmtpModal(false)}
          />
        )}
      </main>

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
