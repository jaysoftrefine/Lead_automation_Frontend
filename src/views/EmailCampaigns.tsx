import React, { useState, useEffect } from "react";
import {
  FileText,
  Users,
  Edit3,
  Rocket,
  Clock,
  Settings,
} from "lucide-react";
import { api } from "../services/api";
import type {
  EmailTemplate,
  Audience,
  Campaign,
  SmtpAccount,
  CampaignProgress,
} from "../types/email";
import { TemplatesPanel } from "../components/email/panels/TemplatesPanel";
import { AudiencesPanel } from "../components/email/panels/AudiencesPanel";
import { ReviewQueuePanel } from "../components/email/panels/ReviewQueuePanel";
import { CampaignCreatePanel } from "../components/email/panels/CampaignCreatePanel";
import { CampaignSendProgressPanel } from "../components/email/panels/CampaignSendProgressPanel";
import { CampaignHistoryPanel } from "../components/email/panels/CampaignHistoryPanel";
import { SmtpConfigModal } from "../components/email/modals/SmtpConfigModal";
import {
  GeneratedPreviewModal,
  type GeneratedEmailItem,
} from "../components/email/modals/GeneratedPreviewModal";
import { CampaignLogsModal } from "../components/email/modals/CampaignLogsModal";

export type EmailPanelTab =
  | "templates"
  | "audiences"
  | "review_send"
  | "create"
  | "send"
  | "history";

export interface EmailCampaignsProps {
  onToast: (msg: string, type?: "success" | "error" | "info" | string) => void;
  onUpdateBadge?: (cnt: number) => void;
  showSmtpModalDirect?: boolean;
  onCloseSmtpModalDirect?: () => void;
}

export function EmailCampaigns({
  onToast,
  onUpdateBadge,
  showSmtpModalDirect,
  onCloseSmtpModalDirect,
}: EmailCampaignsProps) {
  // Navigation
  const [activePanel, setActivePanel] = useState<EmailPanelTab>("templates");

  // Global Data
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);

  // Queue initial selectors (when navigating from Audiences)
  const [reviewInitialAudienceId, setReviewInitialAudienceId] = useState<string>("");

  // Campaign State
  const [campName, setCampName] = useState("");
  const [campTemplateId, setCampTemplateId] = useState("");
  const [campAudienceId, setCampAudienceId] = useState("");
  const [campSources, setCampSources] = useState<{
    sqlite: boolean;
    mongo: boolean;
    manual: boolean;
  }>({
    sqlite: false,
    mongo: false,
    manual: false,
  });
  const [campManualEmails, setCampManualEmails] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<any[]>([]);
  const [campCountry, setCampCountry] = useState("");
  const [campCategory, setCampCategory] = useState("");
  const [campDelay, setCampDelay] = useState<number>(0.8);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Active Campaign & Execution
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgress | null>(null);
  const [launching, setLaunching] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [selectedCampaignSmtpId, setSelectedCampaignSmtpId] = useState("");

  // Modals
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmailItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [logsModalCampaign, setLogsModalCampaign] = useState<Campaign | null>(null);

  // Initial Data Load
  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates();
      const list = res.data || [];
      setTemplates(list);
      if (onUpdateBadge) onUpdateBadge(list.length);
    } catch {
      // ignore
    }
  };

  const loadAudiences = async () => {
    try {
      const res = await api.getAudiences();
      setAudiences(res.data || []);
    } catch {
      // ignore
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.data || []);
    } catch {
      // ignore
    }
  };

  const loadSmtpAccounts = async () => {
    try {
      const res = await api.getSMTPAccounts();
      const accounts = res.data || [];
      setSmtpAccounts(accounts);
      const def = accounts.find((a: SmtpAccount) => a.is_default) || accounts[0];
      if (def && !selectedCampaignSmtpId) {
        setSelectedCampaignSmtpId(def.id);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTemplates();
    loadAudiences();
    loadCampaigns();
    loadSmtpAccounts();
  }, []);

  // Sync external SMTP modal trigger from App.tsx
  useEffect(() => {
    if (showSmtpModalDirect) {
      setShowSmtpModal(true);
      loadSmtpAccounts();
    }
  }, [showSmtpModalDirect]);

  // Poll Active Campaign Execution Progress
  useEffect(() => {
    if (!activeCampaignId) return;
    const poll = async () => {
      try {
        const res = await api.getCampaign(activeCampaignId);
        const c = res.data;
        setCampaignProgress(c);
        if (c.status === "completed" || c.status === "failed") {
          loadCampaigns();
        }
      } catch {
        // ignore
      }
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [activeCampaignId]);

  // Audience Handlers
  const handleAudienceSelected = (aud: Audience) => {
    setCampAudienceId(aud.id);
    const srcs = Array.isArray(aud.sources) ? aud.sources : [];
    setCampSources({
      sqlite: srcs.includes("sqlite"),
      mongo: srcs.includes("mongo"),
      manual: srcs.includes("manual"),
    });
    setCampCountry(aud.filters?.country || "");
    setCampCategory(aud.filters?.category || "");
    const manualArr = aud.manual_recipients || [];
    setCampManualEmails(
      manualArr
        .map((m: any) => (typeof m === "string" ? m : m.email || ""))
        .filter(Boolean)
        .join("\n")
    );
    if (aud.selected_recipients && aud.selected_recipients.length > 0) {
      setSelectedContacts(aud.selected_recipients);
    }
  };

  const handleClearAudienceSelection = () => {
    setCampAudienceId("");
    setCampSources({ sqlite: false, mongo: false, manual: false });
    setCampManualEmails("");
    setSelectedContacts([]);
    setCampCountry("");
    setCampCategory("");
  };

  const handleAudienceSelectForReview = (aud: Audience) => {
    setReviewInitialAudienceId(aud.id);
    setActivePanel("review_send");
  };

  const handleAudienceSelectForBulk = (aud: Audience) => {
    handleAudienceSelected(aud);
    setActivePanel("create");
  };

  // Campaign Draft / Save
  const handleSaveCampaignDraft = async () => {
    if (!campName.trim()) {
      onToast("Please enter a Campaign Name", "error");
      return;
    }
    if (!campTemplateId) {
      onToast("Please select an email template", "error");
      return;
    }

    const selectedSources: string[] = [];
    if (campSources.sqlite) selectedSources.push("sqlite");
    if (campSources.mongo) selectedSources.push("mongo");
    if (campSources.manual && campManualEmails.trim()) selectedSources.push("manual");
    if (selectedContacts.length > 0) selectedSources.push("selected");

    const manualEmails = campManualEmails
      ? campManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : [];

    setSavingDraft(true);
    try {
      const payload = {
        name: campName.trim(),
        template_id: campTemplateId,
        smtp_account_id: selectedCampaignSmtpId || undefined,
        audience_sources: selectedSources.length > 0 ? selectedSources : ["sqlite"],
        audience_filters: {
          country: campCountry.trim(),
          category: campCategory.trim(),
        },
        manual_emails: manualEmails,
        selected_recipients: selectedContacts.map((c: any) => ({
          person_name: c.name || "",
          role: c.role || "",
          email: c.email,
          company_name: c.company || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
        })),
        delay_seconds: parseFloat(String(campDelay)) || 0.8,
        draft: true,
      };

      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, payload);
        onToast("Campaign updated successfully", "success");
      } else {
        const res = await api.createCampaign(payload);
        setEditingCampaignId(res.data.id || res.data.campaign_id);
        onToast("Campaign draft saved successfully", "success");
      }
      loadCampaigns();
    } catch (e: any) {
      onToast(e.message || "Failed to save campaign draft", "error");
    } finally {
      setSavingDraft(false);
    }
  };

  // Launch Campaign
  const handleLaunchCampaign = async () => {
    if (!campName.trim()) {
      onToast("Please enter a Campaign Name", "error");
      return;
    }
    if (!campTemplateId) {
      onToast("Please select an email template", "error");
      return;
    }
    const hasDbSources = campSources.sqlite || campSources.mongo;
    const hasManual = campSources.manual && campManualEmails.trim();
    const hasSelected = selectedContacts.length > 0;

    if (!hasDbSources && !hasManual && !hasSelected) {
      onToast("Select at least one audience source or pick specific contacts", "error");
      return;
    }

    if (smtpAccounts.length === 0) {
      onToast("Please configure an SMTP outgoing mail account before launching", "error");
      setShowSmtpModal(true);
      return;
    }

    const selectedSources: string[] = [];
    if (campSources.sqlite) selectedSources.push("sqlite");
    if (campSources.mongo) selectedSources.push("mongo");
    if (campSources.manual && campManualEmails.trim()) selectedSources.push("manual");
    if (hasSelected) selectedSources.push("selected");

    const manualEmails = campManualEmails
      ? campManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : [];

    setLaunching(true);
    try {
      const payload = {
        name: campName.trim(),
        template_id: campTemplateId,
        smtp_account_id: selectedCampaignSmtpId || undefined,
        audience_sources: selectedSources,
        audience_filters: {
          country: campCountry.trim(),
          category: campCategory.trim(),
        },
        manual_emails: manualEmails,
        selected_recipients: selectedContacts.map((c: any) => ({
          person_name: c.name || "",
          role: c.role || "",
          email: c.email,
          company_name: c.company || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
        })),
        delay_seconds: parseFloat(String(campDelay)) || 0.8,
        draft: false,
      };

      let cid: string | null = null;
      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, payload);
        const res = await api.launchCampaignById(editingCampaignId);
        onToast(res.message, "success");
        cid = editingCampaignId;
      } else {
        const res = await api.createCampaign(payload);
        onToast(res.message, "success");
        cid = res.data.campaign_id || res.data.id || null;
      }

      setActiveCampaignId(cid);
      setEditingCampaignId(null);
      setActivePanel("send");
      loadCampaigns();
    } catch (e: any) {
      onToast(e.message || "Failed to launch campaign", "error");
    } finally {
      setLaunching(false);
    }
  };

  // Preview Generation
  const handleGeneratePreview = async () => {
    if (!campTemplateId) {
      onToast("Please select an email template first", "error");
      return;
    }

    const selectedSources: string[] = [];
    if (campSources.sqlite) selectedSources.push("sqlite");
    if (campSources.mongo) selectedSources.push("mongo");
    if (campSources.manual && campManualEmails.trim()) selectedSources.push("manual");
    if (selectedContacts.length > 0) selectedSources.push("selected");

    const manualEmails = campManualEmails
      ? campManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : [];

    setLoadingPreview(true);
    setShowPreviewModal(true);

    try {
      const res = await api.previewGeneratedCampaign({
        template_id: campTemplateId,
        audience_sources: selectedSources.length > 0 ? selectedSources : ["sqlite"],
        audience_filters: {
          country: campCountry.trim(),
          category: campCategory.trim(),
        },
        manual_emails: manualEmails,
        selected_recipients: selectedContacts.map((c: any) => ({
          person_name: c.name || "",
          role: c.role || "",
          email: c.email,
          company_name: c.company || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
        })),
        limit: 10,
      });

      setGeneratedEmails(res.data?.items || []);
    } catch (e: any) {
      onToast(e.message || "Failed to generate previews", "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Test Email
  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      onToast("Enter a recipient test email", "error");
      return;
    }
    if (!campTemplateId) {
      onToast("Select a template first", "error");
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.sendTestEmail({
        to_email: testEmail.trim(),
        template_id: campTemplateId,
        smtp_account_id: selectedCampaignSmtpId || undefined,
      });
      if (res.status === "success") {
        onToast(res.message, "success");
      } else {
        onToast(res.message, "error");
      }
    } catch (e: any) {
      onToast(e.message || "Failed to send test email", "error");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendPreviewSingleTest = async (targetEmail: string, currentItem: GeneratedEmailItem) => {
    try {
      const res = await api.sendTestEmail({
        to_email: targetEmail.trim(),
        subject: currentItem.rendered_subject,
        body: currentItem.rendered_body,
        attachment_path: templates.find((t) => t.id === campTemplateId)?.attachment_path,
        attachment_name: templates.find((t) => t.id === campTemplateId)?.attachment_name,
        smtp_account_id: selectedCampaignSmtpId || undefined,
      });
      if (res.status === "success") {
        onToast(res.message, "success");
      } else {
        onToast(res.message, "error");
      }
    } catch (e: any) {
      onToast(e.message || "Failed to send test email", "error");
    }
  };

  // Campaign History Actions
  const handleEditCampaign = (c: Campaign) => {
    setEditingCampaignId(c.id);
    setCampName(c.name || "");
    setCampTemplateId(c.template_id || "");
    if (c.smtp_account_id) {
      setSelectedCampaignSmtpId(c.smtp_account_id);
    }

    let config: any = {};
    try {
      if (c.audience_filter) config = JSON.parse(c.audience_filter);
    } catch {
      // ignore
    }

    const sources = config.audience_sources || ["sqlite"];
    setCampSources({
      sqlite: sources.includes("sqlite"),
      mongo: sources.includes("mongo"),
      manual: sources.includes("manual"),
    });

    const filters = config.audience_filters || {};
    setCampCountry(filters.country || "");
    setCampCategory(filters.category || "");

    if (config.manual_emails && Array.isArray(config.manual_emails)) {
      setCampManualEmails(config.manual_emails.join("\n"));
    } else {
      setCampManualEmails("");
    }

    if (config.selected_recipients && Array.isArray(config.selected_recipients)) {
      setSelectedContacts(config.selected_recipients);
    }

    if (config.delay_seconds) {
      setCampDelay(config.delay_seconds);
    }

    setActivePanel("create");
    onToast(`Loaded "${c.name}" for editing`, "info");
  };

  const handleCancelEdit = () => {
    setEditingCampaignId(null);
    setCampName("");
    setCampTemplateId("");
    setCampSources({ sqlite: false, mongo: false, manual: false });
    setCampManualEmails("");
    setSelectedContacts([]);
    setCampCountry("");
    setCampCategory("");
    const def = smtpAccounts.find((a) => a.is_default) || smtpAccounts[0];
    if (def) setSelectedCampaignSmtpId(def.id);
    onToast("Campaign edit cancelled. Form reset.", "info");
  };

  const handleLaunchSavedCampaign = async (c: Campaign) => {
    try {
      const res = await api.launchCampaignById(c.id);
      onToast(res.message, "success");
      setActiveCampaignId(c.id);
      setActivePanel("send");
      loadCampaigns();
    } catch (e: any) {
      onToast(e.message || "Failed to launch campaign", "error");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.deleteCampaign(id);
      onToast("Campaign deleted successfully", "success");
      if (editingCampaignId === id) handleCancelEdit();
      loadCampaigns();
    } catch (e: any) {
      onToast(e.message || "Failed to delete campaign", "error");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Inner Navigation Pills */}
      <div className="email-inner-nav">
        <button
          onClick={() => setActivePanel("templates")}
          className={`email-pill ${activePanel === "templates" ? "active" : ""}`}
        >
          <FileText style={{ width: "15px", height: "15px" }} />
          <span>Templates</span>
        </button>

        <button
          onClick={() => {
            setActivePanel("audiences");
            loadAudiences();
          }}
          className={`email-pill ${activePanel === "audiences" ? "active" : ""}`}
        >
          <Users style={{ width: "15px", height: "15px" }} />
          <span>Audiences</span>
          {audiences.length > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                background: "rgba(255,255,255,0.14)",
                padding: "1px 6px",
                borderRadius: "10px",
                marginLeft: "2px",
              }}
            >
              {audiences.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActivePanel("review_send");
            loadAudiences();
          }}
          className={`email-pill ${activePanel === "review_send" ? "active" : ""}`}
        >
          <Edit3 style={{ width: "15px", height: "15px" }} />
          <span>Review &amp; Send</span>
        </button>

        <button
          onClick={() => {
            setActivePanel("create");
            loadAudiences();
          }}
          className={`email-pill ${
            activePanel === "create" || activePanel === "send" ? "active" : ""
          }`}
        >
          <Rocket style={{ width: "15px", height: "15px" }} />
          <span>Bulk Send</span>
        </button>

        <button
          onClick={() => {
            setActivePanel("history");
            loadCampaigns();
          }}
          className={`email-pill ${activePanel === "history" ? "active" : ""}`}
        >
          <Clock style={{ width: "15px", height: "15px" }} />
          <span>Campaign History</span>
        </button>

        <button
          onClick={() => {
            setShowSmtpModal(true);
            loadSmtpAccounts();
          }}
          className="email-pill"
          style={{ marginLeft: "auto" }}
        >
          <Settings style={{ width: "15px", height: "15px" }} />
          <span>SMTP Config</span>
        </button>
      </div>

      {/* PANEL 1: Templates */}
      {activePanel === "templates" && (
        <TemplatesPanel
          templates={templates}
          onTemplatesChange={loadTemplates}
          onToast={(msg, type) => onToast(msg, type)}
        />
      )}

      {/* PANEL 2: Audiences */}
      {activePanel === "audiences" && (
        <AudiencesPanel
          audiences={audiences}
          onAudiencesChange={loadAudiences}
          onSelectForReview={handleAudienceSelectForReview}
          onSelectForBulk={handleAudienceSelectForBulk}
          onToast={(msg, type) => onToast(msg, type)}
        />
      )}

      {/* PANEL 3: 1-by-1 Review Queue */}
      {activePanel === "review_send" && (
        <ReviewQueuePanel
          templates={templates}
          audiences={audiences}
          smtpAccounts={smtpAccounts}
          initialAudienceId={reviewInitialAudienceId}
          onOpenSmtpModal={() => setShowSmtpModal(true)}
          onToast={(msg, type) => onToast(msg, type)}
        />
      )}

      {/* PANEL 4: Bulk Campaign Create / Configure */}
      {activePanel === "create" && (
        <CampaignCreatePanel
          campName={campName}
          setCampName={setCampName}
          campTemplateId={campTemplateId}
          setCampTemplateId={setCampTemplateId}
          campAudienceId={campAudienceId}
          setCampAudienceId={setCampAudienceId}
          campSources={campSources}
          selectedContacts={selectedContacts}
          templates={templates}
          audiences={audiences}
          editingCampaignId={editingCampaignId}
          onCancelEdit={handleCancelEdit}
          onNavigateToTemplates={() => setActivePanel("templates")}
          onNavigateToAudiences={() => setActivePanel("audiences")}
          onAudienceSelected={handleAudienceSelected}
          onClearAudienceSelection={handleClearAudienceSelection}
          onSaveDraft={handleSaveCampaignDraft}
          savingDraft={savingDraft}
          onGeneratePreview={handleGeneratePreview}
          loadingPreview={loadingPreview}
          onProceedToSend={() => setActivePanel("send")}
          onLaunchCampaign={handleLaunchCampaign}
          launching={launching}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          onSendTest={handleSendTest}
          sendingTest={sendingTest}
          onToast={(msg, type) => onToast(msg, type)}
        />
      )}

      {/* PANEL 5: Campaign Send Execution & Live Progress */}
      {activePanel === "send" && (
        <CampaignSendProgressPanel
          campName={campName}
          campTemplateId={campTemplateId}
          templates={templates}
          selectedContacts={selectedContacts}
          estimatedRecipients={selectedContacts.length || null}
          smtpAccounts={smtpAccounts}
          selectedCampaignSmtpId={selectedCampaignSmtpId}
          setSelectedCampaignSmtpId={setSelectedCampaignSmtpId}
          campDelay={campDelay}
          setCampDelay={setCampDelay}
          testEmail={testEmail}
          setTestEmail={setTestEmail}
          onSendTest={handleSendTest}
          sendingTest={sendingTest}
          onSaveDraft={handleSaveCampaignDraft}
          savingDraft={savingDraft}
          onGeneratePreview={handleGeneratePreview}
          loadingPreview={loadingPreview}
          onLaunchCampaign={handleLaunchCampaign}
          launching={launching}
          editingCampaignId={editingCampaignId}
          onNavigateToCreate={() => setActivePanel("create")}
          onOpenSmtpModal={() => setShowSmtpModal(true)}
          campaignProgress={campaignProgress}
        />
      )}

      {/* PANEL 6: Campaign History */}
      {activePanel === "history" && (
        <CampaignHistoryPanel
          campaigns={campaigns}
          onRefresh={loadCampaigns}
          onEditCampaign={handleEditCampaign}
          onLaunchDraft={handleLaunchSavedCampaign}
          onOpenLogs={(c) => setLogsModalCampaign(c)}
          onDeleteCampaign={handleDeleteCampaign}
        />
      )}

      {/* MODAL 1: SMTP Config Modal */}
      <SmtpConfigModal
        isOpen={showSmtpModal || !!showSmtpModalDirect}
        onClose={() => {
          setShowSmtpModal(false);
          if (onCloseSmtpModalDirect) onCloseSmtpModalDirect();
        }}
        onToast={(msg, type) => onToast(msg, type)}
        onAccountsUpdated={(accs) => setSmtpAccounts(accs)}
      />

      {/* MODAL 2: Generated Email Preview Modal */}
      <GeneratedPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        generatedEmails={generatedEmails}
        loadingPreview={loadingPreview}
        onSendTest={handleSendPreviewSingleTest}
        onProceedToLaunch={() => {
          setShowPreviewModal(false);
          setActivePanel("send");
        }}
        onToast={(msg, type) => onToast(msg, type)}
      />

      {/* MODAL 3: Realtime Campaign Logs Modal */}
      <CampaignLogsModal
        campaign={logsModalCampaign}
        onClose={() => setLogsModalCampaign(null)}
        onToast={(msg, type) => onToast(msg, type)}
      />
    </div>
  );
}
