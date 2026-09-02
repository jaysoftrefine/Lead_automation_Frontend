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
  UserCheck,
  Mail,
  Plus,
  Filter,
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

  // Generated Email Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [generatedEmails, setGeneratedEmails] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Saved Audiences State
  const [audiences, setAudiences] = useState([]);
  const [loadingAudiences, setLoadingAudiences] = useState(false);
  const [editingAudienceId, setEditingAudienceId] = useState(null);
  const [audName, setAudName] = useState("");
  const [audDescription, setAudDescription] = useState("");
  const [audSources, setAudSources] = useState({ sqlite: true, mongo: false, manual: false });
  const [audCountry, setAudCountry] = useState("");
  const [audCategory, setAudCategory] = useState("");
  const [audManualEmails, setAudManualEmails] = useState("");
  const [audEstimatedCount, setAudEstimatedCount] = useState(null);
  const [savingAudience, setSavingAudience] = useState(false);

  // 1-by-1 Review Queue State
  const [queueItems, setQueueItems] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState(null);
  const [queueFilter, setQueueFilter] = useState("all"); // 'all' | 'draft' | 'sent' | 'failed'
  const [queueSearch, setQueueSearch] = useState("");
  const [queueTemplateId, setQueueTemplateId] = useState("");
  const [queueAudienceId, setQueueAudienceId] = useState("");
  const [generatingQueue, setGeneratingQueue] = useState(false);
  const [sendingSingleQueueId, setSendingSingleQueueId] = useState(null);
  const [queueEditSubject, setQueueEditSubject] = useState("");
  const [queueEditBody, setQueueEditBody] = useState("");
  const [queuePreviewMode, setQueuePreviewMode] = useState("preview"); // 'preview' | 'edit'
  const [savingQueueDraft, setSavingQueueDraft] = useState(false);

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

  const loadAudiences = async () => {
    setLoadingAudiences(true);
    try {
      const res = await api.getAudiences();
      setAudiences(res.data || []);
    } catch (e) {}
    finally {
      setLoadingAudiences(false);
    }
  };

  const loadQueue = async (overrideStatus, overrideQ) => {
    setLoadingQueue(true);
    try {
      const st = overrideStatus !== undefined ? overrideStatus : queueFilter;
      const q = overrideQ !== undefined ? overrideQ : queueSearch;
      const res = await api.getQueue({ status: st === "all" ? "" : st, q });
      const items = res.data || [];
      setQueueItems(items);
      setSelectedQueueItem((prev) => {
        if (prev) {
          const found = items.find((i) => i.id === prev.id);
          if (found) return found;
        }
        return items.length > 0 ? items[0] : null;
      });
    } catch (e) {}
    finally {
      setLoadingQueue(false);
    }
  };

  // Sync selected queue item into editor
  useEffect(() => {
    if (selectedQueueItem) {
      setQueueEditSubject(selectedQueueItem.subject || "");
      setQueueEditBody(selectedQueueItem.raw_body || selectedQueueItem.body || "");
    } else {
      setQueueEditSubject("");
      setQueueEditBody("");
    }
  }, [selectedQueueItem?.id]);

  useEffect(() => {
    loadTemplates();
    loadVariables();
    loadCampaigns();
    loadAudiences();
    loadQueue();
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

  // Generate and Preview Campaign Emails
  const handleGeneratePreview = async () => {
    if (!campTemplateId) {
      onToast("Please select an email template first", "error");
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

    setLoadingPreview(true);
    setShowPreviewModal(true);
    setPreviewIndex(0);

    try {
      const res = await api.previewGeneratedCampaign({
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
        limit: 10,
      });

      setGeneratedEmails(res.data?.items || []);
    } catch (e) {
      onToast(e.message || "Failed to generate previews", "error");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Send test of current previewed email
  const handleSendCurrentPreviewTest = async () => {
    const currentItem = generatedEmails[previewIndex] || generatedEmails[0];
    if (!currentItem) return;
    if (!testEmail || !testEmail.includes("@")) {
      onToast("Enter a valid test email address in the field below", "error");
      return;
    }
    setSendingTest(true);
    try {
      const res = await api.sendTestEmail({
        to_email: testEmail.trim(),
        subject: currentItem.rendered_subject,
        body: currentItem.raw_body,
        attachment_path: templates.find((t) => t.id === campTemplateId)?.attachment_path,
        attachment_name: templates.find((t) => t.id === campTemplateId)?.attachment_name,
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

  // ── Audience Handlers ───────────────────────
  const handleSaveAudience = async () => {
    if (!audName.trim()) {
      onToast("Please enter an Audience Name", "error");
      return;
    }
    const sources = [];
    if (audSources.sqlite) sources.push("sqlite");
    if (audSources.mongo) sources.push("mongo");
    if (audSources.manual && audManualEmails.trim()) sources.push("manual");

    if (sources.length === 0) {
      onToast("Select at least one audience source", "error");
      return;
    }

    const manualList = audManualEmails
      ? audManualEmails
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter((e) => e.length > 0)
      : [];

    setSavingAudience(true);
    try {
      const payload = {
        name: audName.trim(),
        description: audDescription.trim(),
        sources,
        filters: {
          country: audCountry.trim(),
          category: audCategory.trim(),
        },
        manual_recipients: manualList,
      };

      if (editingAudienceId) {
        await api.updateAudience(editingAudienceId, payload);
        onToast("Audience updated successfully!", "success");
      } else {
        await api.createAudience(payload);
        onToast("Audience saved successfully!", "success");
      }
      handleResetAudienceForm();
      loadAudiences();
    } catch (e) {
      onToast(e.message || "Failed to save audience", "error");
    } finally {
      setSavingAudience(false);
    }
  };

  const handleEditAudience = (aud) => {
    setEditingAudienceId(aud.id);
    setAudName(aud.name || "");
    setAudDescription(aud.description || "");
    const srcs = aud.sources || [];
    setAudSources({
      sqlite: srcs.includes("sqlite"),
      mongo: srcs.includes("mongo"),
      manual: srcs.includes("manual"),
    });
    setAudCountry(aud.filters?.country || "");
    setAudCategory(aud.filters?.category || "");
    const manualArr = aud.manual_recipients || [];
    setAudManualEmails(manualArr.map((m) => (typeof m === "string" ? m : m.email || "")).join("\n"));
  };

  const handleResetAudienceForm = () => {
    setEditingAudienceId(null);
    setAudName("");
    setAudDescription("");
    setAudSources({ sqlite: true, mongo: false, manual: false });
    setAudCountry("");
    setAudCategory("");
    setAudManualEmails("");
    setAudEstimatedCount(null);
  };

  const handleDeleteAudience = async (audId) => {
    if (!window.confirm("Are you sure you want to delete this saved audience?")) return;
    try {
      await api.deleteAudience(audId);
      onToast("Audience deleted", "info");
      loadAudiences();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const handleAudienceSelectForReview = (aud) => {
    setQueueAudienceId(aud.id);
    setActivePanel("review_send");
    loadQueue();
  };

  const handleAudienceSelectForBulk = (aud) => {
    const srcs = aud.sources || [];
    setCampSources({
      sqlite: srcs.includes("sqlite"),
      mongo: srcs.includes("mongo"),
      manual: srcs.includes("manual"),
    });
    setCampCountry(aud.filters?.country || "");
    setCampCategory(aud.filters?.category || "");
    const manualArr = aud.manual_recipients || [];
    setCampManualEmails(manualArr.map((m) => (typeof m === "string" ? m : m.email || "")).join("\n"));
    setActivePanel("send");
  };

  // ── 1-by-1 Queue Handlers ──────────────────
  const handleGenerateQueue = async () => {
    if (!queueTemplateId) {
      onToast("Please select an email template first", "error");
      return;
    }
    setGeneratingQueue(true);
    try {
      const payload = {
        template_id: queueTemplateId,
        limit: 50,
      };

      if (queueAudienceId && queueAudienceId !== "custom") {
        payload.audience_id = queueAudienceId;
      } else {
        const sources = [];
        if (campSources.sqlite) sources.push("sqlite");
        if (campSources.mongo) sources.push("mongo");
        if (campSources.manual && campManualEmails.trim()) sources.push("manual");
        payload.audience_sources = sources.length > 0 ? sources : ["sqlite"];
        payload.audience_filters = { country: campCountry.trim(), category: campCategory.trim() };
        payload.manual_emails = campManualEmails
          ? campManualEmails.split(/[\n,]/).map((e) => e.trim()).filter((e) => e.length > 0)
          : [];
      }

      const res = await api.generateQueue(payload);
      onToast(res.message || "Queue generated successfully!", "success");
      loadQueue();
    } catch (e) {
      onToast(e.message || "Failed to generate queue", "error");
    } finally {
      setGeneratingQueue(false);
    }
  };

  const handleSaveQueueDraft = async () => {
    if (!selectedQueueItem) return;
    setSavingQueueDraft(true);
    try {
      await api.updateQueueItem(selectedQueueItem.id, {
        subject: queueEditSubject,
        body: queueEditBody,
      });
      onToast("Email draft updated!", "success");
      loadQueue();
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setSavingQueueDraft(false);
    }
  };

  const handleSendQueueItem = async (item) => {
    if (!item) return;
    setSendingSingleQueueId(item.id);
    try {
      if (queueEditSubject !== item.subject || queueEditBody !== (item.raw_body || item.body)) {
        await api.updateQueueItem(item.id, {
          subject: queueEditSubject,
          body: queueEditBody,
        });
      }

      const res = await api.sendQueueItem(item.id);
      if (res.status === "success") {
        onToast(res.message || `Sent to ${item.recipient_email}!`, "success");
        loadQueue();
      } else {
        onToast(res.message, "error");
      }
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setSendingSingleQueueId(null);
    }
  };

  const handleDeleteQueueItem = async (itemId) => {
    try {
      await api.deleteQueueItem(itemId);
      onToast("Item removed from queue", "info");
      loadQueue();
    } catch (e) {
      onToast(e.message, "error");
    }
  };

  const handleClearQueue = async (status = "all") => {
    if (!window.confirm(`Are you sure you want to clear ${status === "sent" ? "sent" : "all"} queue items?`)) return;
    try {
      const res = await api.clearQueue(status);
      onToast(res.message, "info");
      loadQueue();
    } catch (e) {
      onToast(e.message, "error");
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
    } catch (e) {}

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
            loadQueue();
            loadAudiences();
          }}
          className={`email-pill ${activePanel === "review_send" ? "active" : ""}`}
        >
          <Edit3 style={{ width: "15px", height: "15px" }} />
          <span>Review &amp; Send</span>
          {queueItems.filter((i) => i.status === "draft").length > 0 && (
            <span
              style={{
                fontSize: "0.68rem",
                background: "var(--accent-cyan)",
                color: "#050914",
                fontWeight: 700,
                padding: "1px 6px",
                borderRadius: "10px",
                marginLeft: "2px",
              }}
            >
              {queueItems.filter((i) => i.status === "draft").length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActivePanel("create");
            loadAudiences();
          }}
          className={`email-pill ${activePanel === "create" || activePanel === "send" ? "active" : ""}`}
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
            loadSmtp();
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

      {/* PANEL: Target Audiences */}
      {activePanel === "audiences" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 1fr",
            gap: "1.25rem",
          }}
        >
          {/* Create / Edit Audience Form */}
          <div className="glass-card">
            <div className="card-header">
              <div className="card-title-group">
                <Users
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <h2>
                  {editingAudienceId
                    ? "Edit Saved Audience"
                    : "Create New Target Audience"}
                </h2>
              </div>
              {editingAudienceId && (
                <button
                  type="button"
                  onClick={handleResetAudienceForm}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: "0.78rem" }}
                >
                  ✕ Cancel Edit
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div className="form-group">
                <label>Audience Name *</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="e.g. UK AI Founders, German Biotech Executives"
                  value={audName}
                  onChange={(e) => setAudName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Description / Notes</label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="e.g. Seed and Series A startups extracted from EU Startups"
                  value={audDescription}
                  onChange={(e) => setAudDescription(e.target.value)}
                />
              </div>

              {/* Audience Source Checkboxes */}
              <div className="form-group">
                <label>Data Sources</label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "4px",
                  }}
                >
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={audSources.sqlite}
                      onChange={(e) =>
                        setAudSources((s) => ({
                          ...s,
                          sqlite: e.target.checked,
                        }))
                      }
                    />
                    <span className="chip-content">EU Startups (SQLite DB)</span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={audSources.mongo}
                      onChange={(e) =>
                        setAudSources((s) => ({
                          ...s,
                          mongo: e.target.checked,
                        }))
                      }
                    />
                    <span className="chip-content">LinkedIn Leads (MongoDB)</span>
                  </label>
                  <label className="checkbox-chip">
                    <input
                      type="checkbox"
                      checked={audSources.manual}
                      onChange={(e) =>
                        setAudSources((s) => ({
                          ...s,
                          manual: e.target.checked,
                        }))
                      }
                    />
                    <span className="chip-content">Manual / Direct Contacts</span>
                  </label>
                </div>
              </div>

              {/* Filters if SQLite or Mongo */}
              {(audSources.sqlite || audSources.mongo) && (
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label>Filter by Country</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. United Kingdom, Germany"
                      value={audCountry}
                      onChange={(e) => setAudCountry(e.target.value)}
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label>Filter by Category / Industry</label>
                    <input
                      type="text"
                      className="eu-input"
                      placeholder="e.g. Artificial Intelligence, SaaS"
                      value={audCategory}
                      onChange={(e) => setAudCategory(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Manual list if manual enabled */}
              {audSources.manual && (
                <div className="form-group">
                  <label>Manual Contacts (Comma, pipe, or newline delimited)</label>
                  <textarea
                    className="eu-textarea"
                    rows={4}
                    placeholder="Name, Company, email@domain.com, Role, Website&#10;or simple emails: founder@company.com"
                    value={audManualEmails}
                    onChange={(e) => setAudManualEmails(e.target.value)}
                    style={{ fontSize: "0.82rem", fontFamily: "monospace" }}
                  />
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "0.5rem",
                }}
              >
                {editingAudienceId && (
                  <button
                    type="button"
                    onClick={handleResetAudienceForm}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={savingAudience}
                  onClick={handleSaveAudience}
                  className="btn btn-primary"
                  style={{ minWidth: "160px" }}
                >
                  <Save style={{ width: "15px", height: "15px" }} />
                  <span>
                    {savingAudience
                      ? "Saving..."
                      : editingAudienceId
                        ? "Update Audience"
                        : "Save Audience"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Audiences List */}
          <div
            className="glass-card"
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div className="card-header">
              <div className="card-title-group">
                <List
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <h2>Saved Audiences ({audiences.length})</h2>
              </div>
              <button
                type="button"
                onClick={loadAudiences}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw style={{ width: "13px", height: "13px" }} />
                <span>Refresh</span>
              </button>
            </div>

            <div
              style={{
                marginTop: "1rem",
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {loadingAudiences ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="spinner" />
                </div>
              ) : audiences.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "10px",
                  }}
                >
                  <Users
                    style={{
                      width: "36px",
                      height: "36px",
                      margin: "0 auto 10px",
                      opacity: 0.4,
                    }}
                  />
                  <p>
                    No saved audiences yet. Create an audience on the left to
                    reuse across campaigns.
                  </p>
                </div>
              ) : (
                audiences.map((aud) => (
                  <div
                    key={aud.id}
                    style={{
                      background: "var(--bg-surface)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "10px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "0.98rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {aud.name}
                        </h3>
                        {aud.description && (
                          <p
                            style={{
                              margin: "3px 0 0",
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {aud.description}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "3px 9px",
                          borderRadius: "12px",
                          background: "rgba(6,182,212,0.15)",
                          color: "var(--accent-cyan)",
                          border: "1px solid rgba(6,182,212,0.3)",
                        }}
                      >
                        ~{aud.contact_count || 0} Contacts
                      </span>
                    </div>

                    {/* Tags */}
                    <div
                      style={{
                        display: "flex",
                        gap: "6px",
                        flexWrap: "wrap",
                        fontSize: "0.72rem",
                      }}
                    >
                      {(aud.sources || []).map((s) => (
                        <span
                          key={s}
                          style={{
                            background: "var(--chip-bg)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          Source: {s}
                        </span>
                      ))}
                      {aud.filters?.country && (
                        <span
                          style={{
                            background: "var(--chip-bg)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          Country: {aud.filters.country}
                        </span>
                      )}
                      {aud.filters?.category && (
                        <span
                          style={{
                            background: "var(--chip-bg)",
                            padding: "2px 7px",
                            borderRadius: "5px",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          Category: {aud.filters.category}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "8px",
                        borderTop: "1px solid var(--border-subtle)",
                        paddingTop: "8px",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => handleAudienceSelectForReview(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.76rem" }}
                        title="Generate personalized emails and review"
                      >
                        <Edit3
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "var(--accent-cyan)",
                          }}
                        />
                        <span>Review &amp; Send</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAudienceSelectForBulk(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.76rem" }}
                        title="Send bulk campaign to this audience"
                      >
                        <Rocket
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "var(--accent-amber)",
                          }}
                        />
                        <span>Bulk Send</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditAudience(aud)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.76rem" }}
                      >
                        <Edit3 style={{ width: "12px", height: "12px" }} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAudience(aud.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: "0.76rem", color: "#fb7185" }}
                      >
                        <Trash2 style={{ width: "12px", height: "12px" }} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL: Review & Send */}
      {activePanel === "review_send" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Top Control Bar: Select Template + Audience -> Generate Queue */}
          <div className="glass-card" style={{ padding: "1.1rem 1.4rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  flexWrap: "wrap",
                  flex: 1,
                }}
              >
                {/* Template Select */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "220px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    1. Select Email Template
                  </label>
                  <select
                    className="eu-input"
                    value={queueTemplateId}
                    onChange={(e) => setQueueTemplateId(e.target.value)}
                    style={{ padding: "7px 10px", fontSize: "0.85rem" }}
                  >
                    <option value="">-- Choose Template --</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audience Select */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    minWidth: "220px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    2. Select Target Audience
                  </label>
                  <select
                    className="eu-input"
                    value={queueAudienceId}
                    onChange={(e) => setQueueAudienceId(e.target.value)}
                    style={{ padding: "7px 10px", fontSize: "0.85rem" }}
                  >
                    <option value="">-- Choose Audience --</option>
                    {audiences.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (~{a.contact_count} contacts)
                      </option>
                    ))}
                    <option value="custom">Use Current Active Filters</option>
                  </select>
                </div>

                {/* Generate Queue Button */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-end",
                    marginTop: "18px",
                  }}
                >
                  <button
                    type="button"
                    disabled={generatingQueue || !queueTemplateId}
                    onClick={handleGenerateQueue}
                    className="btn btn-primary"
                    style={{ padding: "8px 16px", fontWeight: 700 }}
                    title="Generate personalized emails for this audience into review queue"
                  >
                    {generatingQueue ? (
                      <>
                        <div
                          className="spinner"
                          style={{ width: "14px", height: "14px" }}
                        />
                        <span>Generating Queue...</span>
                      </>
                    ) : (
                      <>
                        <Zap style={{ width: "15px", height: "15px" }} />
                        <span>Generate Outreach Queue</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Clear Queue Dropdown / Action */}
              {queueItems.length > 0 && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleClearQueue("sent")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.76rem" }}
                  >
                    Clear Sent
                  </button>
                  <button
                    type="button"
                    onClick={() => handleClearQueue("all")}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.76rem", color: "#fb7185" }}
                  >
                    Clear All ({queueItems.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Split Review Workspace */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "380px 1fr",
              gap: "1.25rem",
              minHeight: "560px",
            }}
          >
            {/* LEFT COLUMN: Queue List */}
            <div
              className="glass-card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1rem",
              }}
            >
              {/* Search & Status Filters */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Search
                    style={{
                      width: "14px",
                      height: "14px",
                      position: "absolute",
                      left: "10px",
                      top: "11px",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="Search recipient, company..."
                    value={queueSearch}
                    onChange={(e) => {
                      setQueueSearch(e.target.value);
                      loadQueue(queueFilter, e.target.value);
                    }}
                    style={{ paddingLeft: "32px", fontSize: "0.82rem" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  {["all", "draft", "sent"].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setQueueFilter(f);
                        loadQueue(f, queueSearch);
                      }}
                      className={`btn btn-sm ${queueFilter === f ? "btn-primary" : "btn-secondary"}`}
                      style={{
                        fontSize: "0.75rem",
                        padding: "4px 10px",
                        flex: 1,
                        textTransform: "capitalize",
                      }}
                    >
                      {f === "all"
                        ? `All (${queueItems.length})`
                        : f === "draft"
                          ? `Ready (${queueItems.filter((i) => i.status === "draft").length})`
                          : `Sent (${queueItems.filter((i) => i.status === "sent").length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Queue Cards */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {loadingQueue ? (
                  <div style={{ textAlign: "center", padding: "30px" }}>
                    <div className="spinner" />
                  </div>
                ) : queueItems.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Mail
                      style={{
                        width: "32px",
                        height: "32px",
                        margin: "0 auto 8px",
                        opacity: 0.4,
                      }}
                    />
                    <p style={{ fontSize: "0.85rem", margin: 0 }}>
                      Queue is empty.
                    </p>
                    <span style={{ fontSize: "0.76rem" }}>
                      Select a template &amp; audience above and click "Generate
                      Outreach Queue".
                    </span>
                  </div>
                ) : (
                  queueItems.map((item) => {
                    const isSelected = selectedQueueItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedQueueItem(item)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          background: isSelected
                            ? "rgba(6,182,212,0.12)"
                            : "var(--bg-surface)",
                          border: `1px solid ${isSelected ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <strong
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-primary)",
                            }}
                          >
                            {item.recipient_name || item.recipient_email}
                          </strong>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              padding: "2px 6px",
                              borderRadius: "8px",
                              fontWeight: 600,
                              background:
                                item.status === "sent"
                                  ? "rgba(16,185,129,0.2)"
                                  : item.status === "failed"
                                    ? "rgba(244,63,94,0.2)"
                                    : "rgba(245,158,11,0.2)",
                              color:
                                item.status === "sent"
                                  ? "#10b981"
                                  : item.status === "failed"
                                    ? "#fb7185"
                                    : "#f59e0b",
                            }}
                          >
                            {item.status === "sent"
                              ? "✓ Sent"
                              : item.status === "failed"
                                ? "⚠ Failed"
                                : "Draft / Ready"}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.76rem",
                            color: "var(--accent-cyan)",
                          }}
                        >
                          {item.company_name || "(No company)"} &bull;{" "}
                          <span style={{ color: "var(--text-muted)" }}>
                            {item.recipient_email}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-dim)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.subject}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Active Email Review, Edit & 1-by-1 Send */}
            <div
              className="glass-card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.2rem",
              }}
            >
              {!selectedQueueItem ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <Eye
                    style={{
                      width: "40px",
                      height: "40px",
                      marginBottom: "12px",
                      opacity: 0.3,
                    }}
                  />
                  <h3>No Email Selected</h3>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      maxWidth: "340px",
                      marginTop: "4px",
                    }}
                  >
                    Select any generated contact email from the list on the left
                    to review its content, edit sentences, and send.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    flex: 1,
                  }}
                >
                  {/* Recipient Profile Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "var(--bg-surface)",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      flexWrap: "wrap",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                        alignItems: "center",
                        fontSize: "0.8rem",
                      }}
                    >
                      <span>
                        👤{" "}
                        <strong>
                          {selectedQueueItem.recipient_name || "Recipient"}
                        </strong>
                      </span>
                      <span style={{ color: "var(--accent-cyan)" }}>
                        🏢{" "}
                        <strong>
                          {selectedQueueItem.company_name || "Company"}
                        </strong>
                      </span>
                      <span>✉️ {selectedQueueItem.recipient_email}</span>
                      {selectedQueueItem.role && (
                        <span style={{ color: "var(--text-muted)" }}>
                          💼 {selectedQueueItem.role}
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontWeight: 700,
                          background:
                            selectedQueueItem.status === "sent"
                              ? "rgba(16,185,129,0.2)"
                              : "rgba(245,158,11,0.2)",
                          color:
                            selectedQueueItem.status === "sent"
                              ? "#10b981"
                              : "#f59e0b",
                        }}
                      >
                        {selectedQueueItem.status === "sent"
                          ? `Sent on ${new Date(selectedQueueItem.sent_at).toLocaleTimeString()}`
                          : "Ready to Send"}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteQueueItem(selectedQueueItem.id)
                        }
                        className="btn btn-secondary btn-sm"
                        style={{ padding: "4px 8px", color: "#fb7185" }}
                        title="Remove from queue"
                      >
                        <Trash2 style={{ width: "13px", height: "13px" }} />
                      </button>
                    </div>
                  </div>

                  {/* Editable Subject Field */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: "0.78rem" }}>Subject Line</label>
                    <input
                      type="text"
                      className="eu-input"
                      value={queueEditSubject}
                      onChange={(e) => setQueueEditSubject(e.target.value)}
                      style={{ fontWeight: 600 }}
                    />
                  </div>

                  {/* Tab Toggle: Live Preview vs Edit Body */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "2px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      Email Content
                    </label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => setQueuePreviewMode("preview")}
                        className={`btn btn-sm ${queuePreviewMode === "preview" ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.74rem", padding: "3px 10px" }}
                      >
                        <Eye style={{ width: "12px", height: "12px" }} />
                        <span>Live Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQueuePreviewMode("edit")}
                        className={`btn btn-sm ${queuePreviewMode === "edit" ? "btn-primary" : "btn-secondary"}`}
                        style={{ fontSize: "0.74rem", padding: "3px 10px" }}
                      >
                        <Edit3 style={{ width: "12px", height: "12px" }} />
                        <span>Edit Content</span>
                      </button>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div style={{ flex: 1, minHeight: "260px" }}>
                    {queuePreviewMode === "preview" ? (
                      <div
                        style={{
                          background: "#ffffff",
                          color: "#222222",
                          padding: "18px 22px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          height: "100%",
                          maxHeight: "360px",
                          overflowY: "auto",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: selectedQueueItem.body,
                        }}
                      />
                    ) : (
                      <textarea
                        className="eu-textarea"
                        rows={12}
                        value={queueEditBody}
                        onChange={(e) => setQueueEditBody(e.target.value)}
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: "260px",
                          fontFamily: "monospace",
                          fontSize: "0.84rem",
                          lineHeight: 1.5,
                        }}
                      />
                    )}
                  </div>

                  {/* Action Bar: Save Draft & Send 1-by-1 */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <button
                      type="button"
                      disabled={savingQueueDraft}
                      onClick={handleSaveQueueDraft}
                      className="btn btn-secondary"
                    >
                      <Save style={{ width: "14px", height: "14px" }} />
                      <span>
                        {savingQueueDraft ? "Saving..." : "Save Draft Changes"}
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={
                        sendingSingleQueueId === selectedQueueItem.id
                      }
                      onClick={() => handleSendQueueItem(selectedQueueItem)}
                      className="btn btn-primary btn-large"
                      style={{
                        minWidth: "220px",
                        fontWeight: 700,
                        boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
                      }}
                    >
                      {sendingSingleQueueId === selectedQueueItem.id ? (
                        <>
                          <div
                            className="spinner"
                            style={{ width: "14px", height: "14px" }}
                          />
                          <span>
                            Sending to {selectedQueueItem.recipient_email}...
                          </span>
                        </>
                      ) : (
                        <>
                          <Send style={{ width: "16px", height: "16px" }} />
                          <span>
                            Send Email to{" "}
                            {selectedQueueItem.recipient_name ||
                              selectedQueueItem.company_name ||
                              "Contact"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL: Bulk Send Campaign (Configuration & Launch) */}
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

              {/* Quick Load Saved Audience */}
              {audiences.length > 0 && (
                <div
                  className="form-group"
                  style={{
                    background: "rgba(6,182,212,0.06)",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(6,182,212,0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <label
                      style={{
                        margin: 0,
                        color: "var(--accent-cyan)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      ⚡ Quick Load Saved Audience
                    </label>
                    <button
                      type="button"
                      onClick={() => setActivePanel("audiences")}
                      className="btn-icon-ghost"
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--accent-cyan)",
                        cursor: "pointer",
                      }}
                    >
                      Manage Audiences →
                    </button>
                  </div>
                  <select
                    className="eu-input"
                    defaultValue=""
                    onChange={(e) => {
                      const aud = audiences.find(
                        (a) => a.id === e.target.value,
                      );
                      if (aud) handleAudienceSelectForBulk(aud);
                    }}
                    style={{ fontSize: "0.82rem" }}
                  >
                    <option value="">
                      — Select a saved audience to auto-populate —
                    </option>
                    {audiences.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (~{a.contact_count} contacts)
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  style={{ flex: 1, minWidth: "150px" }}
                  title="Save campaign settings without sending"
                >
                  <Save style={{ width: "15px", height: "15px" }} />
                  <span>{savingDraft ? "Saving..." : editingCampaignId ? "Update Campaign" : "Save as Draft"}</span>
                </button>
                <button
                  type="button"
                  disabled={loadingPreview}
                  onClick={handleGeneratePreview}
                  className="btn btn-secondary btn-large"
                  style={{ flex: 1, minWidth: "180px" }}
                  title="Generate and preview exact emails for target audience"
                >
                  <Eye style={{ width: "15px", height: "15px", color: "var(--accent-cyan)" }} />
                  <span>{loadingPreview ? "Generating..." : "Preview Generated Emails"}</span>
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
                  style={{ flex: 1.2, minWidth: "180px" }}
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
              <button
                type="button"
                disabled={loadingPreview}
                onClick={handleGeneratePreview}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: "0.76rem" }}
                title="Preview real emails generated for audience"
              >
                <Eye style={{ width: "12px", height: "12px", color: "var(--accent-cyan)" }} />
                <span>Preview Real Emails</span>
              </button>
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
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={savingDraft}
                  onClick={handleSaveCampaignDraft}
                  className="btn btn-secondary btn-large"
                  style={{ flex: 0.6, minWidth: "140px" }}
                >
                  <Save style={{ width: "16px", height: "16px" }} />
                  <span>{savingDraft ? "Saving..." : editingCampaignId ? "Update Draft" : "Save Draft"}</span>
                </button>
                <button
                  type="button"
                  disabled={loadingPreview}
                  onClick={handleGeneratePreview}
                  className="btn btn-secondary btn-large"
                  style={{ flex: 0.8, minWidth: "170px" }}
                >
                  <Eye style={{ width: "16px", height: "16px", color: "var(--accent-cyan)" }} />
                  <span>{loadingPreview ? "Generating..." : "Preview Emails"}</span>
                </button>
                <button
                  type="button"
                  disabled={launching}
                  onClick={handleLaunchCampaign}
                  className="btn btn-primary btn-large"
                  style={{
                    flex: 1.4,
                    minWidth: "220px",
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
                          className={`camp-stat-pill ${
                            c.status === "completed"
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

      {/* Generated Emails Live Preview Modal */}
      {showPreviewModal && (
        <div className="modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div
            className="modal-dialog glass-card"
            style={{
              maxWidth: "880px",
              width: "95%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-header"
              style={{
                paddingBottom: "12px",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <div className="modal-title-group">
                <Eye
                  style={{
                    width: "20px",
                    height: "20px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <div>
                  <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
                    Generated Outreach Email Preview
                  </h2>
                  <div
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    Showing exactly what will be sent to your audience with
                    personalized AI variables &amp; company data
                  </div>
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setShowPreviewModal(false)}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px 0",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              {loadingPreview ? (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div
                    className="spinner"
                    style={{
                      margin: "0 auto 16px",
                      width: "30px",
                      height: "30px",
                    }}
                  />
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Generating personalized emails with AI &amp; template
                    variables...
                  </p>
                </div>
              ) : generatedEmails.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "50px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <p>
                    No recipients available for preview. Please select an
                    audience or enter manual contacts.
                  </p>
                </div>
              ) : (
                (() => {
                  const currentItem =
                    generatedEmails[previewIndex] || generatedEmails[0];
                  const rec = currentItem?.recipient || {};

                  return (
                    <>
                      {/* Recipient Navigator Bar */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "10px",
                          padding: "10px 14px",
                          flexWrap: "wrap",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.84rem",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            Recipient {previewIndex + 1} of{" "}
                            {generatedEmails.length}
                          </span>
                          {rec.is_sample && (
                            <span
                              style={{
                                fontSize: "0.7rem",
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "#f59e0b",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                border: "1px solid rgba(245, 158, 11, 0.3)",
                              }}
                            >
                              Sample Fallback Preview
                            </span>
                          )}
                        </div>

                        {/* Prev / Next buttons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <button
                            type="button"
                            disabled={previewIndex === 0}
                            onClick={() =>
                              setPreviewIndex((i) => Math.max(0, i - 1))
                            }
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                          >
                            ◀ Previous
                          </button>
                          <button
                            type="button"
                            disabled={
                              previewIndex >= generatedEmails.length - 1
                            }
                            onClick={() =>
                              setPreviewIndex((i) =>
                                Math.min(generatedEmails.length - 1, i + 1),
                              )
                            }
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                          >
                            Next ▶
                          </button>
                        </div>
                      </div>

                      {/* Recipient Information Metadata Chips */}
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                          fontSize: "0.78rem",
                        }}
                      >
                        <div
                          style={{
                            background: "var(--chip-bg)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <strong style={{ color: "var(--text-muted)" }}>
                            Name:
                          </strong>{" "}
                          <span style={{ color: "var(--text-primary)" }}>
                            {rec.person_name || "(None)"}
                          </span>
                        </div>
                        <div
                          style={{
                            background: "var(--chip-bg)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <strong style={{ color: "var(--text-muted)" }}>
                            Company:
                          </strong>{" "}
                          <span
                            style={{
                              color: "var(--accent-cyan)",
                              fontWeight: 600,
                            }}
                          >
                            {rec.company_name || "(None)"}
                          </span>
                        </div>
                        <div
                          style={{
                            background: "var(--chip-bg)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          <strong style={{ color: "var(--text-muted)" }}>
                            Email:
                          </strong>{" "}
                          <span style={{ color: "var(--text-primary)" }}>
                            {rec.email || "(None)"}
                          </span>
                        </div>
                        {rec.role && (
                          <div
                            style={{
                              background: "var(--chip-bg)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <strong style={{ color: "var(--text-muted)" }}>
                              Role:
                            </strong>{" "}
                            <span style={{ color: "var(--text-primary)" }}>
                              {rec.role}
                            </span>
                          </div>
                        )}
                        {rec.website && (
                          <div
                            style={{
                              background: "var(--chip-bg)",
                              padding: "4px 10px",
                              borderRadius: "6px",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            <strong style={{ color: "var(--text-muted)" }}>
                              Website:
                            </strong>{" "}
                            <span style={{ color: "#0066cc" }}>
                              {rec.website}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Email Mockup Client Box */}
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          overflow: "hidden",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
                        }}
                      >
                        {/* Email Header */}
                        <div
                          style={{
                            background: "#f8fafc",
                            borderBottom: "1px solid #e2e8f0",
                            padding: "12px 18px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            fontSize: "0.84rem",
                            color: "#334155",
                          }}
                        >
                          <div>
                            <strong
                              style={{
                                color: "#64748b",
                                display: "inline-block",
                                width: "70px",
                              }}
                            >
                              Subject:
                            </strong>
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#0f172a",
                                fontSize: "0.95rem",
                              }}
                            >
                              {currentItem.rendered_subject}
                            </span>
                          </div>
                          <div>
                            <strong
                              style={{
                                color: "#64748b",
                                display: "inline-block",
                                width: "70px",
                              }}
                            >
                              From:
                            </strong>
                            <span>
                              {smtpFromName || "Stephan Arnas"} &lt;
                              {smtpUser || "outreach@softrefine.com"}&gt;
                            </span>
                          </div>
                          <div>
                            <strong
                              style={{
                                color: "#64748b",
                                display: "inline-block",
                                width: "70px",
                              }}
                            >
                              To:
                            </strong>
                            <span>
                              {rec.person_name
                                ? `${rec.person_name} <${rec.email}>`
                                : rec.email}
                            </span>
                          </div>
                        </div>

                        {/* Rendered HTML Email Body */}
                        <div
                          style={{
                            padding: "24px 28px",
                            background: "#ffffff",
                            minHeight: "280px",
                            maxHeight: "460px",
                            overflowY: "auto",
                            color: "#222222",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: currentItem.rendered_body,
                          }}
                        />
                      </div>
                    </>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "12px",
                borderTop: "1px solid var(--border-subtle)",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="email"
                  className="eu-input"
                  style={{
                    width: "220px",
                    fontSize: "0.8rem",
                    padding: "6px 10px",
                  }}
                  placeholder="Send test to your email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  type="button"
                  disabled={sendingTest}
                  onClick={handleSendCurrentPreviewTest}
                  className="btn btn-secondary btn-sm"
                >
                  <Send style={{ width: "12px", height: "12px" }} />
                  <span>{sendingTest ? "Sending..." : "Send Test to Me"}</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  Close Preview
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setShowPreviewModal(false);
                    setActivePanel("send");
                  }}
                >
                  <span>Proceed to Launch</span>
                  <ArrowRight style={{ width: "13px", height: "13px" }} />
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
