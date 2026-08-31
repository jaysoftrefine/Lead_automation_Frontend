import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Send,
  Clock,
  Settings,
  Zap,
  Save,
  Trash2,
  Edit3,
  Eye,
  RefreshCw,
  Paperclip,
  X,
  FileCheck,
  CheckCircle2,
  XCircle,
  Users,
  Rocket,
  Activity,
  List,
} from "lucide-react";
import { api } from "../services/api";

export function EmailCampaigns({ onToast, onUpdateBadge, showSmtpModalDirect, onCloseSmtpModalDirect }) {
  const [activePanel, setActivePanel] = useState("templates"); // 'templates' | 'send' | 'history'
  const [templates, setTemplates] = useState([]);
  const [variables, setVariables] = useState([]);

  // Template Form
  const [tplId, setTplId] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [attachmentPath, setAttachmentPath] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Live Preview
  const [previewSubject, setPreviewSubject] = useState("Subject will appear here");
  const [previewBody, setPreviewBody] = useState("");

  // Campaign Form
  const [campName, setCampName] = useState("");
  const [campTemplateId, setCampTemplateId] = useState("");
  const [campSources, setCampSources] = useState({ sqlite: true, mongo: false, manual: false });
  const [campManualEmails, setCampManualEmails] = useState("");
  const [campCountry, setCampCountry] = useState("");
  const [campCategory, setCampCategory] = useState("");
  const [campDelay, setCampDelay] = useState(0.8);
  const [estimatedRecipients, setEstimatedRecipients] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  // Campaign Running Progress
  const [activeCampaignId, setActiveCampaignId] = useState(null);
  const [campaignProgress, setCampaignProgress] = useState(null);
  const [launching, setLaunching] = useState(false);

  // History & Logs Modal
  const [campaigns, setCampaigns] = useState([]);
  const [logsModalCampaign, setLogsModalCampaign] = useState(null);
  const [campaignLogs, setCampaignLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // SMTP Modal
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("LeadPulse AI");
  const [smtpUseSSL, setSmtpUseSSL] = useState(false);
  const [smtpUseTLS, setSmtpUseTLS] = useState(true);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const fileInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);

  // Sync external SMTP modal trigger
  useEffect(() => {
    if (showSmtpModalDirect) {
      setShowSmtpModal(true);
      loadSmtp();
    }
  }, [showSmtpModalDirect]);

  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates();
      setTemplates(res.data || []);
      if (onUpdateBadge) onUpdateBadge((res.data || []).length);
    } catch (e) {}
  };

  const loadVariables = async () => {
    try {
      const res = await api.getEmailVariables();
      setVariables(res.data || []);
    } catch (e) {}
  };

  const loadCampaigns = async () => {
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.data || []);
    } catch (e) {}
  };

  const loadSmtp = async () => {
    try {
      const res = await api.getSMTPConfig();
      const cfg = res.data || {};
      setSmtpHost(cfg.smtp_host || "");
      setSmtpPort(cfg.smtp_port || 587);
      setSmtpUser(cfg.smtp_user || "");
      setSmtpPass("");
      setSmtpFromName(cfg.from_name || "LeadPulse AI");
      setSmtpUseSSL(!!cfg.use_ssl);
      setSmtpUseTLS(!!cfg.use_tls);
    } catch (e) {}
  };

  useEffect(() => {
    loadTemplates();
    loadVariables();
    loadCampaigns();
  }, []);

  // Insert variable into template body or subject
  const insertVariable = (variable) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = tplBody;
    const next = val.slice(0, start) + variable + val.slice(end);
    setTplBody(next);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  // PDF Attachment Upload
  const handlePdfFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      onToast("Please select a PDF file (.pdf)", "error");
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await api.uploadAttachment(file);
      setAttachmentName(res.data.attachment_name);
      setAttachmentPath(res.data.attachment_path);
      onToast(`Attached ${res.data.attachment_name} (${res.data.file_size_kb} KB)`, "success");
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = () => {
    setAttachmentName("");
    setAttachmentPath("");
  };

  // Save Template (Create or Update)
  const handleSaveTemplate = async () => {
    if (!tplName.trim() || !tplSubject.trim() || !tplBody.trim()) {
      onToast("Please fill in Template Name, Subject, and Body", "error");
      return;
    }

    try {
      const payload = {
        name: tplName.trim(),
        subject: tplSubject.trim(),
        body: tplBody,
        attachment_path: attachmentPath || null,
        attachment_name: attachmentName || null,
      };

      if (tplId) {
        await api.updateTemplate(tplId, payload);
        onToast("Template updated successfully!", "success");
      } else {
        await api.createTemplate(payload);
        onToast("Template created successfully!", "success");
      }

      clearTemplateEditor();
      loadTemplates();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const clearTemplateEditor = () => {
    setTplId("");
    setTplName("");
    setTplSubject("");
    setTplBody("");
    setAttachmentPath("");
    setAttachmentName("");
    setPreviewSubject("Subject will appear here");
    setPreviewBody("");
  };

  const editTemplate = (t) => {
    setTplId(t.id);
    setTplName(t.name);
    setTplSubject(t.subject);
    setTplBody(t.body);
    setAttachmentPath(t.attachment_path || "");
    setAttachmentName(t.attachment_name || "");
    handleRefreshPreview(t.subject, t.body, t.attachment_name);
    setActivePanel("templates");
  };

  const deleteTemplate = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await api.deleteTemplate(t.id);
      onToast("Template deleted.", "success");
      loadTemplates();
      if (tplId === t.id) clearTemplateEditor();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  // Live Preview
  const handleRefreshPreview = async (sub = tplSubject, body = tplBody, att = attachmentName) => {
    if (!sub && !body) {
      onToast("Enter a subject or body first", "error");
      return;
    }
    try {
      const res = await api.previewRawTemplate({ subject: sub, body: body, attachment_name: att });
      setPreviewSubject(res.data.rendered_subject || sub);
      setPreviewBody(res.data.rendered_body || body);
    } catch (e) {
      setPreviewSubject(sub);
      setPreviewBody(body);
    }
  };

  // Estimate Recipients
  const handleEstimate = async () => {
    const selectedSources = Object.keys(campSources).filter((k) => campSources[k]);
    if (selectedSources.length === 0) {
      onToast("Select at least one audience source", "error");
      return;
    }
    setEstimating(true);
    try {
      const res = await api.estimateRecipients({
        sources: selectedSources.join(","),
        country: campCountry.trim(),
        category: campCategory.trim(),
        manual_emails: campManualEmails.trim(),
      });
      setEstimatedRecipients(res.data?.estimated_recipients || 0);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setEstimating(false);
    }
  };

  // Send Test Email
  const handleSendTest = async () => {
    if (!testEmail.trim()) {
      onToast("Enter a recipient test email", "error");
      return;
    }
    if (!campTemplateId && (!tplSubject || !tplBody)) {
      onToast("Select a template or compose one on the left", "error");
      return;
    }

    setSendingTest(true);
    try {
      const res = await api.sendTestEmail({
        to_email: testEmail.trim(),
        template_id: campTemplateId || undefined,
        subject: !campTemplateId ? tplSubject : undefined,
        body: !campTemplateId ? tplBody : undefined,
        attachment_path: !campTemplateId ? attachmentPath : undefined,
        attachment_name: !campTemplateId ? attachmentName : undefined,
      });
      if (res.status === "success") {
        onToast(res.message, "success");
      } else {
        onToast(res.message, "error");
      }
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setSendingTest(false);
    }
  };

  // Launch Bulk Campaign
  const handleLaunchCampaign = async () => {
    if (!campName.trim()) {
      onToast("Please enter a Campaign Name", "error");
      return;
    }
    if (!campTemplateId) {
      onToast("Please select an email template", "error");
      return;
    }
    const selectedSources = Object.keys(campSources).filter((k) => campSources[k]);
    if (selectedSources.length === 0) {
      onToast("Select at least one audience source", "error");
      return;
    }

    const manualEmails = campManualEmails
      ? campManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.includes("@"))
      : [];

    setLaunching(true);
    try {
      const res = await api.createCampaign({
        name: campName.trim(),
        template_id: campTemplateId,
        audience_sources: selectedSources,
        audience_filters: { country: campCountry.trim(), category: campCategory.trim() },
        manual_emails: manualEmails,
        delay_seconds: parseFloat(campDelay) || 0.8,
      });

      onToast(res.message, "success");
      setActiveCampaignId(res.data.campaign_id);
      loadCampaigns();
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setLaunching(false);
    }
  };

  // Poll Active Campaign Progress
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
      } catch (e) {}
    };

    poll();
    const timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [activeCampaignId]);

  // Delivery Logs
  const openLogsModal = async (campaign) => {
    setLogsModalCampaign(campaign);
    setLoadingLogs(true);
    try {
      const res = await api.getCampaignLogs(campaign.id, { per_page: 200 });
      setCampaignLogs(res.data || []);
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setLoadingLogs(false);
    }
  };

  // SMTP Save & Test
  const handleSaveSmtp = async () => {
    try {
      await api.saveSMTPConfig({
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort, 10) || 587,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        from_name: smtpFromName.trim() || "LeadPulse AI",
        use_ssl: smtpUseSSL,
        use_tls: smtpUseTLS,
      });
      onToast("SMTP configuration saved!", "success");
      setShowSmtpModal(false);
      if (onCloseSmtpModalDirect) onCloseSmtpModalDirect();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSMTP({
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(smtpPort, 10) || 587,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        from_name: smtpFromName.trim() || "LeadPulse AI",
        use_ssl: smtpUseSSL,
        use_tls: smtpUseTLS,
      });
      setSmtpTestResult(res);
    } catch (e) {
      setSmtpTestResult({ status: "failed", message: e.message, connected: false });
    } finally {
      setTestingSmtp(false);
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
          <FileText />
          <span>Templates</span>
        </button>
        <button
          onClick={() => setActivePanel("send")}
          className={`email-pill ${activePanel === "send" ? "active" : ""}`}
        >
          <Send />
          <span>Send Campaign</span>
        </button>
        <button
          onClick={() => {
            setActivePanel("history");
            loadCampaigns();
          }}
          className={`email-pill ${activePanel === "history" ? "active" : ""}`}
        >
          <Clock />
          <span>Campaign History</span>
        </button>
        <button
          onClick={() => {
            setShowSmtpModal(true);
            loadSmtp();
          }}
          className="email-pill"
          style={{ marginLeft: "auto" }}
        >
          <Settings />
          <span>SMTP Config</span>
        </button>
      </div>

      {/* PANEL 1: Templates */}
      {activePanel === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Editor & Preview Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.25rem" }}>
            
            {/* Template Editor */}
            <div className="glass-card">
              <div className="card-header">
                <div className="card-title-group">
                  <Edit3 style={{ width: "18px", height: "18px", color: "var(--accent-violet)" }} />
                  <h2>{tplId ? "Edit Template" : "New Email Template"}</h2>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button onClick={clearTemplateEditor} className="btn btn-secondary btn-sm">
                    Clear
                  </button>
                  <button onClick={handleSaveTemplate} className="btn btn-primary btn-sm">
                    <Save /> <span>Save Template</span>
                  </button>
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <div className="form-group">
                  <label htmlFor="tpl-name">Template Name</label>
                  <input
                    id="tpl-name"
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Cold Intro - EU Founders"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tpl-subject">Email Subject Line</label>
                  <input
                    id="tpl-subject"
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Quick question regarding {{company_name}}"
                    value={tplSubject}
                    onChange={(e) => setTplSubject(e.target.value)}
                  />
                </div>

                {/* Variable Chips Toolbar */}
                <div className="var-chips-toolbar">
                  <span className="var-chips-label">
                    <Zap /> Insert Variable:
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {variables.map((v) => (
                      <button
                        key={v.variable}
                        type="button"
                        className="var-chip"
                        title={v.description}
                        onClick={() => insertVariable(v.variable)}
                      >
                        {v.variable}
                      </button>
                    ))}
                  </div>
                </div>

                {/* PDF Attachment Uploader */}
                <div className="form-group">
                  <label>
                    <Paperclip /> Attach PDF Document (Pitch Deck, One-Pager, Brochure)
                  </label>
                  <div className="attachment-uploader-box">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf"
                      style={{ display: "none" }}
                      onChange={handlePdfFileSelect}
                    />

                    {attachmentName ? (
                      <div className="attachment-file-badge">
                        <FileCheck />
                        <span>{attachmentName}</span>
                        <button
                          type="button"
                          onClick={removeAttachment}
                          className="btn-remove-attachment"
                          title="Remove attachment"
                        >
                          <X style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingPdf}
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary btn-sm"
                      >
                        <Paperclip style={{ width: "13px", height: "13px" }} />
                        <span>{uploadingPdf ? "Uploading..." : "Upload PDF Attachment"}</span>
                      </button>
                    )}
                    <span style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}>
                      Saved locally in <code>uploads/attachments/</code>
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="tpl-body">Email Body (HTML supported)</label>
                  <textarea
                    id="tpl-body"
                    ref={bodyTextareaRef}
                    rows="10"
                    className="eu-input"
                    placeholder="Hi {{first_name}},&#10;&#10;I came across {{company_name}} and was impressed by what you're building in {{city}}...&#10;&#10;Best,&#10;{{sender_name}}"
                    value={tplBody}
                    onChange={(e) => setTplBody(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-header">
                <div className="card-title-group">
                  <Eye style={{ width: "18px", height: "18px", color: "var(--accent-emerald)" }} />
                  <h2>Live Sample Preview</h2>
                </div>
                <button onClick={() => handleRefreshPreview()} className="btn btn-secondary btn-sm">
                  <RefreshCw style={{ width: "12px", height: "12px" }} />
                  <span>Refresh Preview</span>
                </button>
              </div>

              <div style={{ marginTop: "1rem", flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="preview-subject-line">
                  <strong>Subject:</strong> {previewSubject}
                </div>

                {attachmentName && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span className="attachment-file-badge" style={{ fontSize: "0.74rem" }}>
                      <FileCheck style={{ width: "12px", height: "12px" }} />
                      <span>Attached: {attachmentName}</span>
                    </span>
                  </div>
                )}

                <div
                  className="preview-email-frame"
                  dangerouslySetInnerHTML={{
                    __html:
                      previewBody ||
                      `<span style="color:#6b7280;font-size:0.85rem;">Write your email template on the left and click <strong>Refresh Preview</strong> to render with sample founder and company data.</span>`,
                  }}
                />
              </div>
            </div>

          </div>

          {/* Saved Templates Grid */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title-group">
                <FileText style={{ width: "18px", height: "18px", color: "var(--accent-cyan)" }} />
                <h2>Saved Templates ({templates.length})</h2>
              </div>
              <button onClick={loadTemplates} className="btn-icon-ghost" title="Reload templates">
                <RefreshCw style={{ width: "14px", height: "14px" }} />
              </button>
            </div>

            {templates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                No templates saved yet. Create your first template above.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                {templates.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.92rem" }}>{t.name}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      ✉ {t.subject}
                    </div>

                    {t.attachment_name && (
                      <div className="attachment-file-badge" style={{ fontSize: "0.7rem", padding: "2px 6px", alignSelf: "flex-start" }}>
                        <FileCheck style={{ width: "11px", height: "11px" }} />
                        <span>{t.attachment_name}</span>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "6px", marginTop: "0.5rem" }}>
                      <button onClick={() => editTemplate(t)} className="btn btn-secondary btn-sm">
                        <Edit3 style={{ width: "12px", height: "12px" }} /> Edit
                      </button>
                      <button
                        onClick={() => deleteTemplate(t)}
                        className="btn btn-danger btn-sm"
                        title="Delete template"
                      >
                        <Trash2 style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* PANEL 2: Send Campaign */}
      {activePanel === "send" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.25rem" }}>
          
          {/* Campaign Form */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title-group">
                <Rocket style={{ width: "18px", height: "18px", color: "var(--accent-amber)" }} />
                <h2>Configure &amp; Launch Campaign</h2>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <div className="form-group">
                <label htmlFor="camp-name">Campaign Name</label>
                <input
                  id="camp-name"
                  type="text"
                  className="eu-input"
                  placeholder="e.g. EU AI Founders Outreach — Q3"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="camp-template">Select Email Template</label>
                <select
                  id="camp-template"
                  value={campTemplateId}
                  onChange={(e) => setCampTemplateId(e.target.value)}
                >
                  <option value="">— Choose a saved template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.attachment_name ? `(📎 with ${t.attachment_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Audience Sources */}
              <div className="form-group">
                <label>Audience Sources</label>
                <div className="platforms-selector">
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={campSources.sqlite}
                      onChange={() => setCampSources((p) => ({ ...p, sqlite: !p.sqlite }))}
                    />
                    <span className="chip-content">EU Startups DB</span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={campSources.mongo}
                      onChange={() => setCampSources((p) => ({ ...p, mongo: !p.mongo }))}
                    />
                    <span className="chip-content">LinkedIn Leads DB</span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={campSources.manual}
                      onChange={() => setCampSources((p) => ({ ...p, manual: !p.manual }))}
                    />
                    <span className="chip-content">Manual Emails</span>
                  </label>
                </div>
              </div>

              {campSources.manual && (
                <div className="form-group">
                  <label>Manual Email Addresses</label>
                  <textarea
                    rows="3"
                    className="eu-input"
                    placeholder="Enter emails separated by comma or new lines:&#10;founder@startup.com, ceo@company.io"
                    value={campManualEmails}
                    onChange={(e) => setCampManualEmails(e.target.value)}
                  />
                </div>
              )}

              {/* Audience Filters */}
              <div className="form-row">
                <div className="form-group flex-1">
                  <label>Filter Country (optional)</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Germany"
                    value={campCountry}
                    onChange={(e) => setCampCountry(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Filter Category (optional)</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. AI & SaaS"
                    value={campCategory}
                    onChange={(e) => setCampCategory(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Dispatch Delay</label>
                  <select value={campDelay} onChange={(e) => setCampDelay(parseFloat(e.target.value))}>
                    <option value={0.5}>0.5s (Fast)</option>
                    <option value={0.8}>0.8s (Standard)</option>
                    <option value={1.5}>1.5s (Safe)</option>
                    <option value={3.0}>3.0s (Conservative)</option>
                  </select>
                </div>
              </div>

              {/* Recipient Estimation Box */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.75rem 1rem",
                  background: "rgba(16,185,129,0.08)",
                  border: "1px solid rgba(16,185,129,0.25)",
                  borderRadius: "var(--radius-md)",
                  margin: "1rem 0",
                  fontSize: "0.85rem",
                  color: "var(--accent-emerald)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users style={{ width: "16px", height: "16px" }} />
                  <span>
                    {estimatedRecipients !== null
                      ? `~${estimatedRecipients} recipient${estimatedRecipients === 1 ? "" : "s"} ready for dispatch`
                      : "Click Estimate to calculate target audience size"}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={estimating}
                  onClick={handleEstimate}
                  className="btn btn-secondary btn-sm"
                >
                  {estimating ? "Calculating..." : "Estimate"}
                </button>
              </div>

              {/* Test Email Send */}
              <div className="form-group">
                <label>Send a Verification Test Email First</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    className="eu-input"
                    placeholder="your-email@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={sendingTest}
                    onClick={handleSendTest}
                    className="btn btn-secondary btn-sm"
                  >
                    <Send style={{ width: "13px", height: "13px" }} />
                    <span>{sendingTest ? "Sending..." : "Test Send"}</span>
                  </button>
                </div>
              </div>

              {/* Launch Campaign */}
              <button
                type="button"
                disabled={launching}
                onClick={handleLaunchCampaign}
                className="btn btn-primary btn-large"
                style={{ marginTop: "1rem" }}
              >
                {launching ? (
                  <>
                    <div className="spinner" />
                    <span>Queueing Campaign...</span>
                  </>
                ) : (
                  <>
                    <Rocket />
                    <span>Launch Bulk Outreach Campaign</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Campaign Live Progress Box */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <div className="card-header">
              <div className="card-title-group">
                <Activity style={{ width: "18px", height: "18px", color: "var(--accent-emerald)" }} />
                <h2>Real-Time Progress</h2>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className={`pulse-dot ${campaignProgress && campaignProgress.status === "running" ? "running" : ""}`} />
                <span style={{ fontSize: "0.76rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>
                  {campaignProgress?.status || "Idle"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", flex: 1 }}>
              {!campaignProgress && (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                  <Send style={{ width: "36px", height: "36px", margin: "0 auto 12px", color: "var(--text-dim)" }} />
                  <p>Configure a campaign and click Launch. Progress will animate here in real-time.</p>
                </div>
              )}

              {campaignProgress && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", color: "#fff", marginBottom: "4px" }}>
                      {campaignProgress.name}
                    </h3>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Template: {campaignProgress.template_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "6px" }}>
                      <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                        {campaignProgress.status === "completed"
                          ? "✅ Dispatch Finished"
                          : "Sending Emails..."}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>
                        {(campaignProgress.sent || 0) + (campaignProgress.failed_count || 0)} / {campaignProgress.total || 0}
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (((campaignProgress.sent || 0) + (campaignProgress.failed_count || 0)) /
                                Math.max(campaignProgress.total || 1, 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stat Pills */}
                  <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div className="camp-stat-pill success">
                      <CheckCircle2 style={{ width: "13px", height: "13px" }} />
                      <span>{campaignProgress.sent || 0} Sent</span>
                    </div>
                    <div className="camp-stat-pill error">
                      <XCircle style={{ width: "13px", height: "13px" }} />
                      <span>{campaignProgress.failed_count || 0} Failed</span>
                    </div>
                    <div className="camp-stat-pill info">
                      <Users style={{ width: "13px", height: "13px" }} />
                      <span>{campaignProgress.total || 0} Total</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* PANEL 3: Campaign History */}
      {activePanel === "history" && (
        <div className="glass-card">
          <div className="card-header">
            <div className="card-title-group">
              <Clock style={{ width: "18px", height: "18px", color: "var(--accent-violet)" }} />
              <h2>Historical Campaigns ({campaigns.length})</h2>
            </div>
            <button onClick={loadCampaigns} className="btn-icon-ghost" title="Refresh history">
              <RefreshCw style={{ width: "14px", height: "14px" }} />
            </button>
          </div>

          <div className="eu-table-wrapper" style={{ marginTop: "1rem" }}>
            <table className="eu-startups-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Total</th>
                  <th>Launched</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No campaigns found. Launch a campaign from the Send Campaign tab.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{c.name}</div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{c.template_name || "—"}</td>
                      <td>
                        <span
                          className={`camp-stat-pill ${
                            c.status === "completed"
                              ? "success"
                              : c.status === "running"
                              ? "info"
                              : c.status === "failed"
                              ? "error"
                              : ""
                          }`}
                          style={{ fontSize: "0.72rem", textTransform: "capitalize" }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>{c.sent || 0}</td>
                      <td style={{ color: "#fb7185", fontWeight: 700 }}>{c.failed_count || 0}</td>
                      <td>{c.total || 0}</td>
                      <td style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td>
                        <button
                          onClick={() => openLogsModal(c)}
                          className="btn btn-secondary btn-sm"
                        >
                          <List style={{ width: "12px", height: "12px" }} /> Logs
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delivery Logs Modal */}
      {logsModalCampaign && (
        <div className="modal-backdrop" onClick={() => setLogsModalCampaign(null)}>
          <div className="modal-dialog glass-card" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="platform-badge">Delivery Logs</span>
                <h2>{logsModalCampaign.name}</h2>
              </div>
              <button className="btn-close" onClick={() => setLogsModalCampaign(null)}>
                &times;
              </button>
            </div>

            {loadingLogs ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner" style={{ margin: "0 auto 10px" }} />
                <span>Loading logs...</span>
              </div>
            ) : campaignLogs.length === 0 ? (
              <p style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
                No delivery logs recorded for this campaign.
              </p>
            ) : (
              <div className="eu-table-wrapper" style={{ maxHeight: "420px", overflowY: "auto" }}>
                <table className="eu-startups-table">
                  <thead>
                    <tr>
                      <th>Recipient</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Error Info</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignLogs.map((l) => (
                      <tr key={l.id}>
                        <td style={{ fontWeight: 600 }}>{l.recipient_name || "—"}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.76rem" }}>{l.recipient_email}</td>
                        <td style={{ color: "var(--text-muted)" }}>{l.company_name || "—"}</td>
                        <td>
                          {l.status === "sent" ? (
                            <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.76rem" }}>✓ Sent</span>
                          ) : (
                            <span style={{ color: "#fb7185", fontWeight: 700, fontSize: "0.76rem" }}>✗ Failed</span>
                          )}
                        </td>
                        <td style={{ color: "#fb7185", fontSize: "0.72rem" }}>{l.error_message || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="modal-backdrop" onClick={() => setShowSmtpModal(false)}>
          <div className="modal-dialog glass-card" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="platform-badge" style={{ color: "#f59e0b", borderColor: "#f59e0b" }}>
                  ⚙ SMTP
                </span>
                <h2>Outgoing Mail Server Settings</h2>
              </div>
              <button className="btn-close" onClick={() => setShowSmtpModal(false)}>
                &times;
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Configure SMTP for dispatching campaign emails. For Gmail, generate an App Password from your Google Account security settings.
              </p>

              <div className="form-row">
                <div className="form-group flex-2">
                  <label>SMTP Host</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="smtp.gmail.com"
                    value={smtpHost}
                    onChange={(e) => setSmtpHost(e.target.value)}
                  />
                </div>
                <div className="form-group flex-1">
                  <label>Port</label>
                  <input
                    type="number"
                    className="eu-input"
                    value={smtpPort}
                    onChange={(e) => setSmtpPort(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email Username / Address</label>
                <input
                  type="email"
                  className="eu-input"
                  placeholder="your-email@gmail.com"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>App Password / SMTP Password</label>
                <input
                  type="password"
                  className="eu-input"
                  placeholder="Enter app password"
                  value={smtpPass}
                  onChange={(e) => setSmtpPass(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>From Name (Recipient Display Name)</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="LeadPulse AI"
                  value={smtpFromName}
                  onChange={(e) => setSmtpFromName(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={smtpUseSSL}
                    onChange={(e) => setSmtpUseSSL(e.target.checked)}
                  />
                  <span className="chip-content">SSL (Port 465)</span>
                </label>
                <label className="checkbox-chip">
                  <input
                    type="checkbox"
                    checked={smtpUseTLS}
                    onChange={(e) => setSmtpUseTLS(e.target.checked)}
                  />
                  <span className="chip-content">STARTTLS (Port 587)</span>
                </label>
              </div>

              {smtpTestResult && (
                <div
                  style={{
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    background: smtpTestResult.connected ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)",
                    color: smtpTestResult.connected ? "#10b981" : "#fb7185",
                    border: `1px solid ${smtpTestResult.connected ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
                  }}
                >
                  {smtpTestResult.message}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  disabled={testingSmtp}
                  onClick={handleTestSmtp}
                  className="btn btn-secondary btn-sm"
                >
                  <Zap style={{ width: "13px", height: "13px" }} />
                  <span>{testingSmtp ? "Testing..." : "Test Connection"}</span>
                </button>
                <button type="button" onClick={handleSaveSmtp} className="btn btn-primary btn-sm">
                  <Save style={{ width: "13px", height: "13px" }} />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
