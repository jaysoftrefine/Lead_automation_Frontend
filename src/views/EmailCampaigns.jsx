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
  Search,
  CheckSquare,
  ArrowRight,
} from "lucide-react";
import { api } from "../services/api";

export function EmailCampaigns({
  onToast,
  onUpdateBadge,
  showSmtpModalDirect,
  onCloseSmtpModalDirect,
}) {
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
  const [previewSubject, setPreviewSubject] = useState(
    "Subject will appear here",
  );
  const [previewBody, setPreviewBody] = useState("");

  // Campaign Form
  const [campName, setCampName] = useState("");
  const [campTemplateId, setCampTemplateId] = useState("");
  const [campSources, setCampSources] = useState({
    sqlite: false,
    mongo: false,
    manual: false,
  });
  const [campManualEmails, setCampManualEmails] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [showRecipientPicker, setShowRecipientPicker] = useState(false);
  const [pickerRecipients, setPickerRecipients] = useState([]);
  const [pickerSelection, setPickerSelection] = useState({});
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSource, setPickerSource] = useState("all");
  const [loadingRecipients, setLoadingRecipients] = useState(false);
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
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);

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
    } catch (e) { }
  };

  const loadVariables = async () => {
    try {
      const res = await api.getEmailVariables();
      setVariables(res.data || []);
    } catch (e) { }
  };

  const loadCampaigns = async () => {
    try {
      const res = await api.getCampaigns();
      setCampaigns(res.data || []);
    } catch (e) { }
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
    } catch (e) { }
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
      textarea.setSelectionRange(
        start + variable.length,
        start + variable.length,
      );
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
      onToast(
        `Attached ${res.data.attachment_name} (${res.data.file_size_kb} KB)`,
        "success",
      );
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
  const handleRefreshPreview = async (
    sub = tplSubject,
    body = tplBody,
    att = attachmentName,
  ) => {
    if (!sub && !body) {
      onToast("Enter a subject or body first", "error");
      return;
    }
    try {
      const res = await api.previewRawTemplate({
        subject: sub,
        body: body,
        attachment_name: att,
      });
      setPreviewSubject(res.data.rendered_subject || sub);
      setPreviewBody(res.data.rendered_body || body);
    } catch (e) {
      setPreviewSubject(sub);
      setPreviewBody(body);
    }
  };

  const loadRecipientPicker = async () => {
    setShowRecipientPicker(true);
    setLoadingRecipients(true);
    try {
      const [euResponse, leadResponse] = await Promise.all([
        api.getEUStartups({ page: 1, per_page: 500, has_email: "true" }),
        api.getLeads(),
      ]);
      const euRecipients = (euResponse.data || []).flatMap((startup) =>
        (startup.people || [])
          .filter((person) => person.email)
          .map((person, index) => ({
            id: `eu-${startup.id}-${person.email}-${index}`,
            email: person.email.trim(),
            name: person.name || "Founder / Leadership",
            company: startup.company_name || "Unnamed startup",
            role: person.role || "Leadership",
            website: startup.website || "",
            city: startup.city || "",
            country: startup.country || "",
            category: startup.category || "",
            source: "eu",
          })),
      );
      const leadRecipients = (
        leadResponse.leads ||
        leadResponse.data ||
        []
      ).flatMap((lead, leadIndex) =>
        (lead.contacts || [])
          .filter((contact) => contact.email)
          .map((contact, index) => ({
            id: `linkedin-${lead._id || leadIndex}-${contact.email}-${index}`,
            email: contact.email.trim(),
            name: contact.name || "Contact",
            company: lead.company || "Unnamed company",
            role: contact.role || "Professional",
            website: lead.company_domain
              ? `https://${lead.company_domain}`
              : "",
            city: "",
            country: lead.location || "",
            category: "",
            source: "linkedin",
          })),
      );
      const uniqueRecipients = Array.from(
        new Map(
          [...euRecipients, ...leadRecipients].map((recipient) => [
            recipient.email.toLowerCase(),
            recipient,
          ]),
        ).values(),
      );
      setPickerRecipients(uniqueRecipients);

      // Pre-select already picked contacts
      const initialSelection = {};
      selectedContacts.forEach((c) => {
        const found = uniqueRecipients.find(
          (r) => r.email.toLowerCase() === c.email.toLowerCase(),
        );
        if (found) initialSelection[found.id] = true;
      });
      setPickerSelection(initialSelection);
    } catch (e) {
      onToast(e.message || "Could not load recipient emails", "error");
    } finally {
      setLoadingRecipients(false);
    }
  };

  const addSelectedRecipients = () => {
    const selected = pickerRecipients.filter(
      (recipient) => pickerSelection[recipient.id],
    );
    setSelectedContacts(selected);
    setShowRecipientPicker(false);
    setEstimatedRecipients(null);
    onToast(
      `${selected.length} contact${selected.length === 1 ? "" : "s"} selected for campaign`,
      "success",
    );
  };

  const filteredPickerRecipients = pickerRecipients.filter((recipient) => {
    const matchesSource =
      pickerSource === "all" || recipient.source === pickerSource;
    const term = pickerSearch.trim().toLowerCase();
    const matchesSearch =
      !term ||
      [
        recipient.name,
        recipient.company,
        recipient.email,
        recipient.country,
        recipient.role,
      ].some((value) => (value || "").toLowerCase().includes(term));
    return matchesSource && matchesSearch;
  });

  // Estimate Recipients
  const handleEstimate = async () => {
    const selectedSources = Object.keys(campSources).filter(
      (k) => campSources[k],
    );
    if (selectedSources.length === 0 && selectedContacts.length === 0) {
      onToast(
        "Select at least one audience source or pick specific contacts",
        "error",
      );
      return;
    }
    setEstimating(true);
    try {
      let dbEstimate = 0;
      if (selectedSources.length > 0) {
        const res = await api.estimateRecipients({
          sources: selectedSources.join(","),
          country: campCountry.trim(),
          category: campCategory.trim(),
          manual_emails: campManualEmails.trim(),
        });
        dbEstimate = res.data?.estimated_recipients || 0;
      }
      const totalEst =
        dbEstimate +
        (selectedSources.length === 0 ? selectedContacts.length : 0);
      setEstimatedRecipients(totalEst);
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

  // Save Campaign (Draft or Update)
  const handleSaveCampaignDraft = async () => {
    if (!campName.trim()) {
      onToast("Please enter a Campaign Name", "error");
      return;
    }
    if (!campTemplateId) {
      onToast("Please select an email template", "error");
      return;
    }

    const selectedSources = [];
    if (campSources.sqlite) selectedSources.push("sqlite");
    if (campSources.mongo) selectedSources.push("mongo");
    if (campSources.manual && campManualEmails.trim())
      selectedSources.push("manual");
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
        audience_sources: selectedSources.length > 0 ? selectedSources : ["sqlite"],
        audience_filters: {
          country: campCountry.trim(),
          category: campCategory.trim(),
        },
        manual_emails: manualEmails,
        selected_recipients: selectedContacts.map((c) => ({
          person_name: c.name || "",
          role: c.role || "",
          email: c.email,
          company_name: c.company || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
        })),
        delay_seconds: parseFloat(campDelay) || 0.8,
        draft: true,
      };

      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, payload);
        onToast("Campaign updated successfully", "success");
      } else {
        const res = await api.createCampaign(payload);
        setEditingCampaignId(res.data.id);
        onToast("Campaign draft saved successfully", "success");
      }
      loadCampaigns();
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setSavingDraft(false);
    }
  };

  // Edit an existing campaign
  const handleEditCampaign = (c) => {
    setEditingCampaignId(c.id);
    setCampName(c.name || "");
    setCampTemplateId(c.template_id || "");

    let config = {};
    try {
      if (c.audience_filter) config = JSON.parse(c.audience_filter);
    } catch (e) { }

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

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingCampaignId(null);
    setCampName("");
    setCampTemplateId("");
    setCampSources({ sqlite: false, mongo: false, manual: false });
    setCampManualEmails("");
    setSelectedContacts([]);
    setCampCountry("");
    setCampCategory("");
    onToast("Campaign edit cancelled. Form reset.", "info");
  };

  // Launch saved / draft campaign directly from table
  const handleLaunchSavedCampaign = async (c) => {
    try {
      const res = await api.launchCampaignById(c.id);
      onToast(res.message, "success");
      setActiveCampaignId(c.id);
      setActivePanel("send");
      loadCampaigns();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  // Delete campaign
  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;
    try {
      await api.deleteCampaign(id);
      onToast("Campaign deleted successfully", "success");
      if (editingCampaignId === id) handleCancelEdit();
      loadCampaigns();
    } catch (e) {
      onToast(e.message, "error");
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
    const hasDbSources = campSources.sqlite || campSources.mongo;
    const hasManual = campSources.manual && campManualEmails.trim();
    const hasSelected = selectedContacts.length > 0;

    if (!hasDbSources && !hasManual && !hasSelected) {
      onToast(
        "Select at least one audience source or pick specific contacts",
        "error",
      );
      return;
    }

    const selectedSources = [];
    if (campSources.sqlite) selectedSources.push("sqlite");
    if (campSources.mongo) selectedSources.push("mongo");
    if (campSources.manual && campManualEmails.trim())
      selectedSources.push("manual");
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
        audience_sources: selectedSources,
        audience_filters: {
          country: campCountry.trim(),
          category: campCategory.trim(),
        },
        manual_emails: manualEmails,
        selected_recipients: selectedContacts.map((c) => ({
          person_name: c.name || "",
          role: c.role || "",
          email: c.email,
          company_name: c.company || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
        })),
        delay_seconds: parseFloat(campDelay) || 0.8,
        draft: false,
      };

      let cid = null;
      if (editingCampaignId) {
        await api.updateCampaign(editingCampaignId, payload);
        const res = await api.launchCampaignById(editingCampaignId);
        onToast(res.message, "success");
        cid = editingCampaignId;
      } else {
        const res = await api.createCampaign(payload);
        onToast(res.message, "success");
        cid = res.data.campaign_id;
      }

      setActiveCampaignId(cid);
      setEditingCampaignId(null);
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
      } catch (e) { }
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
      setSmtpTestResult({
        status: "failed",
        message: e.message,
        connected: false,
      });
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
          onClick={() => setActivePanel("create")}
          className={`email-pill ${activePanel === "create" ? "active" : ""}`}
        >
          <Rocket />
          <span>Create Campaign</span>
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
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Editor & Preview Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr 1fr",
              gap: "1.25rem",
            }}
          >
            {/* Template Editor */}
            <div className="glass-card">
              <div className="card-header">
                <div className="card-title-group">
                  <Edit3
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "var(--accent-violet)",
                    }}
                  />
                  <h2>{tplId ? "Edit Template" : "New Email Template"}</h2>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={clearTemplateEditor}
                    className="btn btn-secondary btn-sm"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="btn btn-primary btn-sm"
                  >
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
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}
                  >
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
                    <Paperclip /> Attach PDF Document (Pitch Deck, One-Pager,
                    Brochure)
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
                        <span>
                          {uploadingPdf
                            ? "Uploading..."
                            : "Upload PDF Attachment"}
                        </span>
                      </button>
                    )}
                    <span
                      style={{ fontSize: "0.74rem", color: "var(--text-dim)" }}
                    >
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
                    placeholder="Hi {{name}},&#10;&#10;I came across {{company_name}} and wanted to reach out regarding our B2B solutions.&#10;&#10;Best regards,"
                    value={tplBody}
                    onChange={(e) => setTplBody(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div
              className="glass-card"
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div className="card-header">
                <div className="card-title-group">
                  <Eye
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "var(--accent-emerald)",
                    }}
                  />
                  <h2>Live Sample Preview</h2>
                </div>
                <button
                  onClick={() => handleRefreshPreview()}
                  className="btn btn-secondary btn-sm"
                >
                  <RefreshCw style={{ width: "12px", height: "12px" }} />
                  <span>Refresh Preview</span>
                </button>
              </div>

              <div
                style={{
                  marginTop: "1rem",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="preview-subject-line">
                  <strong>Subject:</strong> {previewSubject}
                </div>

                {attachmentName && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <span
                      className="attachment-file-badge"
                      style={{ fontSize: "0.74rem" }}
                    >
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
                <FileText
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <h2>Saved Templates ({templates.length})</h2>
              </div>
              <button
                onClick={loadTemplates}
                className="btn-icon-ghost"
                title="Reload templates"
              >
                <RefreshCw style={{ width: "14px", height: "14px" }} />
              </button>
            </div>

            {templates.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "var(--text-muted)",
                }}
              >
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
                      background: "var(--chip-bg)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        fontSize: "0.92rem",
                      }}
                    >
                      {t.name}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      ✉ {t.subject}
                    </div>

                    {t.attachment_name && (
                      <div
                        className="attachment-file-badge"
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          alignSelf: "flex-start",
                        }}
                      >
                        <FileCheck style={{ width: "11px", height: "11px" }} />
                        <span>{t.attachment_name}</span>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        marginTop: "0.5rem",
                      }}
                    >
                      <button
                        onClick={() => editTemplate(t)}
                        className="btn btn-secondary btn-sm"
                      >
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

      {/* PANEL 2: Create Campaign */}
      {activePanel === "create" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 1fr",
            gap: "1.25rem",
          }}
        >
          {/* Campaign Configuration Form */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title-group">
                <Rocket
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-amber)",
                  }}
                />
                <h2>{editingCampaignId ? "Edit Campaign" : "Create & Configure Campaign"}</h2>
              </div>
              {editingCampaignId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.78rem" }}
                >
                  ✕ Cancel Editing
                </button>
              )}
            </div>

            {editingCampaignId && (
              <div
                style={{
                  margin: "1rem 1rem 0",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  color: "var(--accent-cyan)",
                }}
              >
                <span>✏️ Currently Editing Campaign Draft</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>ID: {editingCampaignId.slice(0, 8)}...</span>
              </div>
            )}

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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <label htmlFor="camp-template" style={{ margin: 0 }}>
                    Select Email Template
                  </label>
                  <button
                    type="button"
                    onClick={() => setActivePanel("templates")}
                    className="btn-icon-ghost"
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--accent-cyan)",
                      padding: "2px 6px",
                    }}
                  >
                    + Manage templates
                  </button>
                </div>
                <select
                  id="camp-template"
                  value={campTemplateId}
                  onChange={(e) => setCampTemplateId(e.target.value)}
                >
                  <option value="">— Choose a saved template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{" "}
                      {t.attachment_name
                        ? `(📎 with ${t.attachment_name})`
                        : ""}
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
                      onChange={() =>
                        setCampSources((p) => ({ ...p, sqlite: !p.sqlite }))
                      }
                    />
                    <span className="chip-content">EU Startups DB (All)</span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={campSources.mongo}
                      onChange={() =>
                        setCampSources((p) => ({ ...p, mongo: !p.mongo }))
                      }
                    />
                    <span className="chip-content">
                      LinkedIn Leads DB (All)
                    </span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={campSources.manual}
                      onChange={() =>
                        setCampSources((p) => ({ ...p, manual: !p.manual }))
                      }
                    />
                    <span className="chip-content">Manual Emails</span>
                  </label>
                </div>

                {/* Partial selection from Sources */}
                <div
                  style={{
                    marginTop: "0.85rem",
                    padding: "0.85rem 1rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.86rem",
                          color: "var(--text-primary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Users
                          style={{
                            width: "15px",
                            height: "15px",
                            color: "var(--accent-cyan)",
                          }}
                        />
                        <span>Partially Select Specific Emails / Contacts</span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        Handpick specific contacts from EU Startups &amp;
                        LinkedIn Leads
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={loadRecipientPicker}
                      className="btn btn-secondary btn-sm"
                    >
                      <CheckSquare style={{ width: "13px", height: "13px" }} />
                      <span>
                        {selectedContacts.length > 0
                          ? `Edit Selected (${selectedContacts.length})`
                          : "Pick Specific Contacts"}
                      </span>
                    </button>
                  </div>

                  {selectedContacts.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.25rem",
                        paddingTop: "0.6rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontSize: "0.76rem",
                        }}
                      >
                        <span
                          style={{
                            color: "var(--accent-cyan)",
                            fontWeight: 600,
                          }}
                        >
                          ✓ {selectedContacts.length} recipient
                          {selectedContacts.length === 1 ? "" : "s"} selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedContacts([])}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--accent-rose)",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Clear selection
                        </button>
                      </div>

                      {/* Selected contacts preview chips */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "5px",
                          maxHeight: "95px",
                          overflowY: "auto",
                        }}
                      >
                        {selectedContacts.map((contact) => (
                          <span
                            key={contact.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.71rem",
                              background: "rgba(255, 255, 255, 0.07)",
                              border: "1px solid rgba(255, 255, 255, 0.12)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: 500,
                              }}
                            >
                              {contact.name || contact.company}
                            </span>
                            <span
                              style={{
                                color: "var(--accent-cyan)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.68rem",
                              }}
                            >
                              ({contact.email})
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedContacts((prev) =>
                                  prev.filter((c) => c.id !== contact.id),
                                )
                              }
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-dim)",
                                cursor: "pointer",
                                padding: 0,
                                display: "flex",
                              }}
                            >
                              <X style={{ width: "11px", height: "11px" }} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
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
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
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

              {/* Action Buttons */}
              <div
                style={{ display: "flex", gap: "10px", marginTop: "1.25rem", flexWrap: "wrap" }}
              >
                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveCampaignDraft}
                  className="btn btn-secondary btn-large"
                  style={{ flex: 1, minWidth: "160px" }}
                  title="Save campaign settings without sending"
                >
                  <Save style={{ width: "15px", height: "15px" }} />
                  <span>{savingDraft ? "Saving..." : editingCampaignId ? "Update Campaign" : "Save as Draft"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!campName.trim()) {
                      onToast("Please enter a Campaign Name", "error");
                      return;
                    }
                    if (!campTemplateId) {
                      onToast("Please select an email template", "error");
                      return;
                    }
                    setActivePanel("send");
                  }}
                  className="btn btn-primary btn-large"
                  style={{ flex: 1.2, minWidth: "200px" }}
                >
                  <span>Proceed to Send</span>
                  <ArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
                <button
                  type="button"
                  disabled={launching}
                  onClick={handleLaunchCampaign}
                  className="btn btn-secondary btn-large"
                  title="Directly launch without previewing"
                >
                  {launching ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Rocket style={{ width: "15px", height: "15px" }} />
                      <span>⚡ Quick Launch</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Campaign Live Preview & Summary Card */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="card-header">
              <div className="card-title-group">
                <Eye
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <h2>Campaign Preview &amp; Readiness</h2>
              </div>
            </div>

            <div
              style={{
                marginTop: "1rem",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Readiness Checklist */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "8px",
                }}
              >
                <div
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "var(--radius-sm)",
                    background: campName.trim()
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${campName.trim() ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                    fontSize: "0.74rem",
                  }}
                >
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
                  >
                    Campaign Name
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: campName.trim() ? "#10b981" : "var(--text-dim)",
                      marginTop: "2px",
                    }}
                  >
                    {campName.trim() ? "✓ Named" : "⚠ Missing"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "var(--radius-sm)",
                    background: campTemplateId
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${campTemplateId ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                    fontSize: "0.74rem",
                  }}
                >
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
                  >
                    Email Template
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: campTemplateId ? "#10b981" : "var(--text-dim)",
                      marginTop: "2px",
                    }}
                  >
                    {campTemplateId ? "✓ Selected" : "⚠ Choose"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.6rem 0.8rem",
                    borderRadius: "var(--radius-sm)",
                    background:
                      campSources.sqlite ||
                        campSources.mongo ||
                        campSources.manual ||
                        selectedContacts.length > 0
                        ? "rgba(16,185,129,0.1)"
                        : "rgba(255,255,255,0.04)",
                    border: `1px solid ${campSources.sqlite || campSources.mongo || campSources.manual || selectedContacts.length > 0 ? "rgba(16,185,129,0.3)" : "var(--border-subtle)"}`,
                    fontSize: "0.74rem",
                  }}
                >
                  <div
                    style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
                  >
                    Audience
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color:
                        campSources.sqlite ||
                          campSources.mongo ||
                          campSources.manual ||
                          selectedContacts.length > 0
                          ? "#10b981"
                          : "var(--text-dim)",
                      marginTop: "2px",
                    }}
                  >
                    {selectedContacts.length > 0
                      ? `✓ ${selectedContacts.length} Contacts`
                      : campSources.sqlite ||
                        campSources.mongo ||
                        campSources.manual
                        ? "✓ Sources Set"
                        : "⚠ Unselected"}
                  </div>
                </div>
              </div>

              {/* Template Content Preview Box */}
              {campTemplateId ? (
                <div
                  style={{
                    background: "var(--chip-bg)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "1rem",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.8rem",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Selected Template:
                    </span>
                    <h4
                      style={{
                        color: "var(--text-primary)",
                        margin: "2px 0 0",
                      }}
                    >
                      {templates.find((t) => t.id === campTemplateId)?.name ||
                        "Template"}
                    </h4>
                  </div>

                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Subject:
                    </span>
                    <div
                      style={{
                        padding: "6px 10px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.82rem",
                        color: "var(--accent-cyan)",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {templates.find((t) => t.id === campTemplateId)
                        ?.subject || "(No subject)"}
                    </div>
                  </div>

                  {templates.find((t) => t.id === campTemplateId)
                    ?.attachment_name && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(139,92,246,0.12)",
                          border: "1px solid rgba(139,92,246,0.3)",
                          fontSize: "0.75rem",
                          color: "var(--accent-violet)",
                          width: "fit-content",
                        }}
                      >
                        <Paperclip style={{ width: "12px", height: "12px" }} />
                        <span>
                          Attachment:{" "}
                          {
                            templates.find((t) => t.id === campTemplateId)
                              ?.attachment_name
                          }
                        </span>
                      </div>
                    )}

                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Body Preview:
                    </span>
                    <div
                      style={{
                        padding: "10px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.8rem",
                        color: "var(--text-secondary)",
                        whiteSpace: "pre-wrap",
                        maxHeight: "180px",
                        overflowY: "auto",
                        marginTop: "2px",
                        lineHeight: 1.5,
                      }}
                    >
                      {templates.find((t) => t.id === campTemplateId)?.body ||
                        "(Empty body)"}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    padding: "40px 20px",
                    color: "var(--text-dim)",
                    background: "var(--chip-bg)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  <FileText
                    style={{
                      width: "36px",
                      height: "36px",
                      marginBottom: "10px",
                      opacity: 0.5,
                    }}
                  />
                  <p style={{ fontSize: "0.85rem", margin: 0 }}>
                    Select an email template from the left to preview it here
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: Send Campaign */}
      {activePanel === "send" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 1fr",
            gap: "1.25rem",
          }}
        >
          {/* Campaign Dispatch Control */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title-group">
                <Send
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <h2>Launch &amp; Dispatch Outreach</h2>
              </div>
              <button
                type="button"
                onClick={() => setActivePanel("create")}
                className="btn btn-secondary btn-sm"
              >
                ← Edit Setup
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
              }}
            >
              {/* Campaign Summary Card */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Ready to Launch:
                </div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "var(--text-primary)",
                    margin: "4px 0",
                  }}
                >
                  {campName.trim() || "Untitled Campaign"}
                </h3>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    marginTop: "6px",
                  }}
                >
                  <span>
                    📄 Template:{" "}
                    <strong style={{ color: "var(--accent-cyan)" }}>
                      {templates.find((t) => t.id === campTemplateId)?.name ||
                        "None selected"}
                    </strong>
                  </span>
                  <span>
                    👥 Target:{" "}
                    <strong style={{ color: "var(--accent-emerald)" }}>
                      {selectedContacts.length > 0
                        ? `${selectedContacts.length} handpicked contacts`
                        : estimatedRecipients !== null
                          ? `~${estimatedRecipients} recipients`
                          : "Calculated at dispatch"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Dispatch Delay Selector */}
              <div className="form-group">
                <label>Dispatch Delay (Rate Limiting)</label>
                <select
                  value={campDelay}
                  onChange={(e) => setCampDelay(parseFloat(e.target.value))}
                >
                  <option value={0.5}>0.5s (Fast — ~120 emails/min)</option>
                  <option value={0.8}>0.8s (Standard — ~75 emails/min)</option>
                  <option value={1.5}>1.5s (Safe — ~40 emails/min)</option>
                  <option value={3.0}>
                    3.0s (Conservative — ~20 emails/min)
                  </option>
                </select>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--text-dim)",
                    marginTop: "4px",
                  }}
                >
                  Adjust spacing between consecutive emails to preserve high
                  inbox deliverability.
                </div>
              </div>

              {/* Pre-Flight Test Email */}
              <div
                style={{
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    marginBottom: "6px",
                    display: "block",
                  }}
                >
                  Send a Verification Test Email First
                </label>
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

              {/* Launch & Save Buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveCampaignDraft}
                  className="btn btn-secondary btn-large"
                  style={{ flex: 0.6 }}
                >
                  <Save style={{ width: "16px", height: "16px" }} />
                  <span>{savingDraft ? "Saving..." : editingCampaignId ? "Update Draft" : "Save Draft"}</span>
                </button>
                <button
                  type="button"
                  disabled={launching}
                  onClick={handleLaunchCampaign}
                  className="btn btn-primary btn-large"
                  style={{
                    flex: 1.4,
                    padding: "0.9rem 1.5rem",
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {launching ? (
                    <>
                      <div className="spinner" />
                      <span>Queueing &amp; Dispatching Campaign...</span>
                    </>
                  ) : (
                    <>
                      <Rocket style={{ width: "18px", height: "18px" }} />
                      <span>{editingCampaignId ? "Update & Launch Campaign" : "Launch Bulk Outreach Campaign"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Campaign Live Progress Box */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="card-header">
              <div className="card-title-group">
                <Activity
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-emerald)",
                  }}
                />
                <h2>Real-Time Progress</h2>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  className={`pulse-dot ${campaignProgress && campaignProgress.status === "running" ? "running" : ""}`}
                />
                <span
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--text-secondary)",
                    textTransform: "capitalize",
                  }}
                >
                  {campaignProgress?.status || "Idle"}
                </span>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", flex: 1 }}>
              {!campaignProgress && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <Send
                    style={{
                      width: "36px",
                      height: "36px",
                      margin: "0 auto 12px",
                      color: "var(--text-dim)",
                    }}
                  />
                  <p>
                    Click <strong>Launch Bulk Outreach Campaign</strong> on the
                    left. Progress and delivery status will animate here in
                    real-time.
                  </p>
                </div>
              )}

              {campaignProgress && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        fontSize: "1.05rem",
                        color: "var(--text-primary)",
                        marginBottom: "4px",
                      }}
                    >
                      {campaignProgress.name}
                    </h3>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Template: {campaignProgress.template_name}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                      >
                        {campaignProgress.status === "completed"
                          ? "✅ Dispatch Finished"
                          : "Sending Emails..."}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-primary)",
                        }}
                      >
                        {(campaignProgress.sent || 0) +
                          (campaignProgress.failed_count || 0)}{" "}
                        / {campaignProgress.total || 0}
                      </span>
                    </div>

                    <div className="progress-bar-bg">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (((campaignProgress.sent || 0) +
                                (campaignProgress.failed_count || 0)) /
                                Math.max(campaignProgress.total || 1, 1)) *
                              100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Stat Pills */}
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      flexWrap: "wrap",
                    }}
                  >
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
              <Clock
                style={{
                  width: "18px",
                  height: "18px",
                  color: "var(--accent-violet)",
                }}
              />
              <h2>Historical Campaigns ({campaigns.length})</h2>
            </div>
            <button
              onClick={loadCampaigns}
              className="btn-icon-ghost"
              title="Refresh history"
            >
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
                    <td
                      colSpan="8"
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--text-muted)",
                      }}
                    >
                      No campaigns found. Launch a campaign from the Send
                      Campaign tab.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text-primary)",
                          }}
                        >
                          {c.name}
                        </div>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {c.template_name || "—"}
                      </td>
                      <td>
                        <span
                          className={`camp-stat-pill ${c.status === "completed"
                              ? "success"
                              : c.status === "running"
                                ? "info"
                                : c.status === "failed"
                                  ? "error"
                                  : ""
                            }`}
                          style={{
                            fontSize: "0.72rem",
                            textTransform: "capitalize",
                          }}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td style={{ color: "#10b981", fontWeight: 700 }}>
                        {c.sent || 0}
                      </td>
                      <td style={{ color: "#fb7185", fontWeight: 700 }}>
                        {c.failed_count || 0}
                      </td>
                      <td>{c.total || 0}</td>
                      <td
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {c.created_at
                          ? new Date(c.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => handleEditCampaign(c)}
                            className="btn btn-secondary btn-sm"
                            title="Edit campaign settings"
                          >
                            <Edit3 style={{ width: "12px", height: "12px" }} /> Edit
                          </button>
                          {c.status === "draft" && (
                            <button
                              onClick={() => handleLaunchSavedCampaign(c)}
                              className="btn btn-primary btn-sm"
                              title="Launch this draft campaign"
                              style={{ background: "var(--accent-primary)", color: "#fff" }}
                            >
                              <Rocket style={{ width: "12px", height: "12px" }} /> Launch
                            </button>
                          )}
                          <button
                            onClick={() => openLogsModal(c)}
                            className="btn btn-secondary btn-sm"
                            title="View delivery logs"
                          >
                            <List style={{ width: "12px", height: "12px" }} /> Logs
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="btn-icon-ghost"
                            style={{ color: "#fb7185", padding: "4px" }}
                            title="Delete campaign"
                          >
                            <Trash2 style={{ width: "13px", height: "13px" }} />
                          </button>
                        </div>
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
        <div
          className="modal-backdrop"
          onClick={() => setLogsModalCampaign(null)}
        >
          <div
            className="modal-dialog glass-card"
            style={{ maxWidth: "780px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="platform-badge">Delivery Logs</span>
                <h2>{logsModalCampaign.name}</h2>
              </div>
              <button
                className="btn-close"
                onClick={() => setLogsModalCampaign(null)}
              >
                &times;
              </button>
            </div>

            {loadingLogs ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div className="spinner" style={{ margin: "0 auto 10px" }} />
                <span>Loading logs...</span>
              </div>
            ) : campaignLogs.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  padding: "30px",
                  color: "var(--text-muted)",
                }}
              >
                No delivery logs recorded for this campaign.
              </p>
            ) : (
              <div
                className="eu-table-wrapper"
                style={{ maxHeight: "420px", overflowY: "auto" }}
              >
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
                        <td style={{ fontWeight: 600 }}>
                          {l.recipient_name || "—"}
                        </td>
                        <td
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.76rem",
                          }}
                        >
                          {l.recipient_email}
                        </td>
                        <td style={{ color: "var(--text-muted)" }}>
                          {l.company_name || "—"}
                        </td>
                        <td>
                          {l.status === "sent" ? (
                            <span
                              style={{
                                color: "#10b981",
                                fontWeight: 700,
                                fontSize: "0.76rem",
                              }}
                            >
                              ✓ Sent
                            </span>
                          ) : (
                            <span
                              style={{
                                color: "#fb7185",
                                fontWeight: 700,
                                fontSize: "0.76rem",
                              }}
                            >
                              ✗ Failed
                            </span>
                          )}
                        </td>
                        <td style={{ color: "#fb7185", fontSize: "0.72rem" }}>
                          {l.error_message || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {showRecipientPicker && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowRecipientPicker(false)}
        >
          <div
            className="glass-card modal-dialog"
            style={{
              width: "min(920px, 95vw)",
              maxWidth: "920px",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3
                  style={{
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Users
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "var(--accent-cyan)",
                    }}
                  />
                  <span>Partially Select Campaign Recipients</span>
                </h3>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  Choose exactly which contacts from EU Startups and LinkedIn
                  Leads should receive this campaign.
                </div>
              </div>
              <button
                className="btn-icon-ghost"
                onClick={() => setShowRecipientPicker(false)}
                aria-label="Close recipient picker"
              >
                <X style={{ width: "18px", height: "18px" }} />
              </button>
            </div>

            {/* Filter Controls & Quick Selection Bar */}
            <div
              style={{
                display: "flex",
                gap: "0.7rem",
                flexWrap: "wrap",
                alignItems: "center",
                margin: "1rem 0 0.6rem",
              }}
            >
              <div style={{ position: "relative", flex: "1 1 240px" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "14px",
                    color: "var(--text-dim)",
                  }}
                />
                <input
                  className="eu-input"
                  style={{ paddingLeft: "32px" }}
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder="Search name, company, email, country or role..."
                />
              </div>

              <select
                value={pickerSource}
                onChange={(e) => setPickerSource(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="all">
                  All Sources ({pickerRecipients.length})
                </option>
                <option value="eu">
                  EU Startups (
                  {pickerRecipients.filter((r) => r.source === "eu").length})
                </option>
                <option value="linkedin">
                  LinkedIn Leads (
                  {
                    pickerRecipients.filter((r) => r.source === "linkedin")
                      .length
                  }
                  )
                </option>
              </select>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                  onClick={() => {
                    const next = { ...pickerSelection };
                    filteredPickerRecipients.forEach((r) => {
                      next[r.id] = true;
                    });
                    setPickerSelection(next);
                  }}
                >
                  Select Visible ({filteredPickerRecipients.length})
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                  onClick={() => {
                    const next = { ...pickerSelection };
                    filteredPickerRecipients.slice(0, 10).forEach((r) => {
                      next[r.id] = true;
                    });
                    setPickerSelection(next);
                  }}
                >
                  +10
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                  onClick={() => {
                    const next = { ...pickerSelection };
                    filteredPickerRecipients.slice(0, 25).forEach((r) => {
                      next[r.id] = true;
                    });
                    setPickerSelection(next);
                  }}
                >
                  +25
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.72rem", padding: "0.25rem 0.6rem" }}
                  onClick={() => {
                    const next = { ...pickerSelection };
                    filteredPickerRecipients.slice(0, 50).forEach((r) => {
                      next[r.id] = true;
                    });
                    setPickerSelection(next);
                  }}
                >
                  +50
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: "0.72rem",
                    padding: "0.25rem 0.6rem",
                    color: "var(--accent-rose)",
                  }}
                  onClick={() => setPickerSelection({})}
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Table of contacts */}
            <div
              className="eu-table-wrapper"
              style={{ flex: 1, overflow: "auto", minHeight: "280px" }}
            >
              <table className="eu-startups-table">
                <thead>
                  <tr>
                    <th style={{ width: "44px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={
                          filteredPickerRecipients.length > 0 &&
                          filteredPickerRecipients.every(
                            (r) => !!pickerSelection[r.id],
                          )
                        }
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const next = { ...pickerSelection };
                          filteredPickerRecipients.forEach((r) => {
                            next[r.id] = checked;
                          });
                          setPickerSelection(next);
                        }}
                      />
                    </th>
                    <th>Contact &amp; Role</th>
                    <th>Company</th>
                    <th>Location / Country</th>
                    <th>Email Address</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRecipients ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ textAlign: "center", padding: "48px" }}
                      >
                        <div className="spinner" style={{ margin: "auto" }} />
                        <div
                          style={{
                            marginTop: "10px",
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Loading contacts from EU Startups and LinkedIn DB...
                        </div>
                      </td>
                    </tr>
                  ) : filteredPickerRecipients.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          textAlign: "center",
                          padding: "48px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No email contacts found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPickerRecipients.map((recipient) => {
                      const isSelected = !!pickerSelection[recipient.id];
                      return (
                        <tr
                          key={recipient.id}
                          style={{
                            background: isSelected
                              ? "rgba(99, 102, 241, 0.08)"
                              : undefined,
                            cursor: "pointer",
                          }}
                          onClick={() =>
                            setPickerSelection((selected) => ({
                              ...selected,
                              [recipient.id]: !selected[recipient.id],
                            }))
                          }
                        >
                          <td
                            style={{ textAlign: "center" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                setPickerSelection((selected) => ({
                                  ...selected,
                                  [recipient.id]: !selected[recipient.id],
                                }))
                              }
                            />
                          </td>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              {recipient.name}
                            </div>
                            {recipient.role && (
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-dim)",
                                }}
                              >
                                {recipient.role}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 500 }}>
                              {recipient.company}
                            </div>
                            {recipient.category && (
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {recipient.category}
                              </div>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.78rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {recipient.country || recipient.city || "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                color: "var(--accent-cyan)",
                                fontFamily: "var(--font-mono)",
                                fontSize: "0.78rem",
                              }}
                            >
                              {recipient.email}
                            </span>
                          </td>
                          <td>
                            <span
                              className="platform-badge"
                              style={{
                                fontSize: "0.68rem",
                                background:
                                  recipient.source === "eu"
                                    ? "rgba(139, 92, 246, 0.15)"
                                    : "rgba(59, 130, 246, 0.15)",
                                borderColor:
                                  recipient.source === "eu"
                                    ? "rgba(139, 92, 246, 0.35)"
                                    : "rgba(59, 130, 246, 0.35)",
                                color:
                                  recipient.source === "eu"
                                    ? "#c084fc"
                                    : "#60a5fa",
                              }}
                            >
                              {recipient.source === "eu"
                                ? "EU Startups"
                                : "LinkedIn"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "1rem",
                marginTop: "1rem",
                paddingTop: "0.8rem",
                borderTop: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--accent-cyan)",
                  }}
                >
                  {Object.values(pickerSelection).filter(Boolean).length}{" "}
                  contacts selected
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                  (out of {pickerRecipients.length} available)
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRecipientPicker(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={addSelectedRecipients}
                >
                  <CheckSquare style={{ width: "13px", height: "13px" }} />
                  <span>
                    Apply Selection (
                    {Object.values(pickerSelection).filter(Boolean).length})
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="modal-backdrop" onClick={() => setShowSmtpModal(false)}>
          <div
            className="modal-dialog glass-card"
            style={{ maxWidth: "540px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <span
                  className="platform-badge"
                  style={{ color: "#f59e0b", borderColor: "#f59e0b" }}
                >
                  ⚙ SMTP
                </span>
                <h2>Outgoing Mail Server Settings</h2>
              </div>
              <button
                className="btn-close"
                onClick={() => setShowSmtpModal(false)}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
              }}
            >
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Configure SMTP for dispatching campaign emails. For Gmail,
                generate an App Password from your Google Account security
                settings.
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
                    background: smtpTestResult.connected
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(244,63,94,0.15)",
                    color: smtpTestResult.connected ? "#10b981" : "#fb7185",
                    border: `1px solid ${smtpTestResult.connected ? "rgba(16,185,129,0.3)" : "rgba(244,63,94,0.3)"}`,
                  }}
                >
                  {smtpTestResult.message}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  disabled={testingSmtp}
                  onClick={handleTestSmtp}
                  className="btn btn-secondary btn-sm"
                >
                  <Zap style={{ width: "13px", height: "13px" }} />
                  <span>{testingSmtp ? "Testing..." : "Test Connection"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSmtp}
                  className="btn btn-primary btn-sm"
                >
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
