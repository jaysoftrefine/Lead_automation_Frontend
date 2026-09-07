// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
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
  Sparkles,
  BookOpen,
  FolderOpen,
  Code,
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
  const [tplViewMode, setTplViewMode] = useState("directory"); // 'directory' | 'creator'
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Live Preview
  const [previewSubject, setPreviewSubject] = useState(
    "Subject will appear here",
  );
  const [previewBody, setPreviewBody] = useState("");

  // Campaign Form
  const [campName, setCampName] = useState("");
  const [campTemplateId, setCampTemplateId] = useState("");
  const [campAudienceId, setCampAudienceId] = useState("");
  const [bulkPreviewMode, setBulkPreviewMode] = useState("rendered");
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
  const [audLeadType, setAudLeadType] = useState("all"); // 'all' | 'company' | 'personal' | 'others'
  const [audManualEmails, setAudManualEmails] = useState("");
  const [audSelectedContacts, setAudSelectedContacts] = useState([]);
  const [audEstimatedCount, setAudEstimatedCount] = useState(null);
  const [savingAudience, setSavingAudience] = useState(false);
  const [pickerTarget, setPickerTarget] = useState("campaign"); // 'campaign' | 'audience'
  const [audViewMode, setAudViewMode] = useState("directory"); // 'directory' | 'builder'
  const [audBrowseContacts, setAudBrowseContacts] = useState([]);
  const [audBrowseTotal, setAudBrowseTotal] = useState(0);
  const [audBrowsePage, setAudBrowsePage] = useState(1);
  const [audBrowseTotalPages, setAudBrowseTotalPages] = useState(1);
  const [audBrowseSearch, setAudBrowseSearch] = useState("");
  const [loadingBrowseContacts, setLoadingBrowseContacts] = useState(false);
  const [audSelectedMap, setAudSelectedMap] = useState({});

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
  const [regeneratingAI, setRegeneratingAI] = useState(false);
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
  const [smtpFromName, setSmtpFromName] = useState("HirePilot AI");
  const [smtpUseSSL, setSmtpUseSSL] = useState(false);
  const [smtpUseTLS, setSmtpUseTLS] = useState(true);
  const [smtpTestResult, setSmtpTestResult] = useState(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const fileInputRef = useRef(null);
  const bodyTextareaRef = useRef(null);
  const quillRef = useRef(null);
  const [editorMode, setEditorMode] = useState("visual"); // 'visual' | 'html'

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link", "clean"],
      ],
    }),
    []
  );

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

  const loadMediaList = async () => {
    setLoadingMedia(true);
    try {
      const res = await api.getAttachments();
      setMediaList(res.data || []);
    } catch (e) {
      console.error("Failed to load attachments:", e);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleSelectFromMediaPicker = (item) => {
    setAttachmentName(item.display_name || item.filename);
    setAttachmentPath(item.path);
    setShowMediaPicker(false);
    onToast(`Attached ${item.display_name || item.filename}`, "success");
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
      setSmtpFromName(cfg.from_name || "HirePilot AI");
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
    loadMediaList();
  }, []);

  // Insert variable into template body or subject
  const insertVariable = (variable) => {
    if (editorMode === "html") {
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
      return;
    }

    // Visual WYSIWYG Mode (Quill)
    const editor = quillRef.current?.getEditor
      ? quillRef.current.getEditor()
      : quillRef.current;
    if (editor) {
      const range = editor.getSelection();
      const index = range ? range.index : Math.max(0, editor.getLength() - 1);
      editor.insertText(index, variable, "user");
      editor.setSelection(index + variable.length);
    } else {
      setTplBody((prev) => (prev ? prev + " " + variable : variable));
    }
  };

  // PDF Attachment Upload
  const handlePdfFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      onToast("Please select a valid PDF file (.pdf)", "error");
      return;
    }

    setUploadingPdf(true);
    try {
      const res = await api.uploadAttachment(file);
      const attData = res.data || res;
      const attName = attData.attachment_name || file.name;
      const attPath = attData.attachment_path || "";
      const attSize = attData.file_size_kb || (file.size / 1024).toFixed(1);
      setAttachmentName(attName);
      setAttachmentPath(attPath);
      onToast(
        `Attached ${attName} (${attSize} KB)`,
        "success",
      );
      loadMediaList();
    } catch (err) {
      console.error("PDF upload error:", err);
      onToast(err.message || "Failed to upload PDF attachment.", "error");
    } finally {
      setUploadingPdf(false);
      if (e.target) e.target.value = "";
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
      setTplViewMode("directory");
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
    setTplViewMode("creator");
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

  const cleanPreviewHtml = (raw: string) => {
    if (!raw) return "";
    let text = raw;

    // Extract content inside <body>...</body> if full HTML doc was returned
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      text = bodyMatch[1];
    }

    // Strip DOCTYPE and html/head tags if present
    text = text
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "");

    // If string already contains HTML tags, return directly without converting newlines to <br/>
    const hasHtml = /<[a-z][\s\S]*>/i.test(text);
    if (hasHtml) {
      return text.trim();
    }

    // Only for raw plain text, convert newlines to <br/>
    return text.trim().replace(/\n/g, "<br/>");
  };

  const loadRecipientPicker = async (target = "campaign") => {
    setPickerTarget(target);
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

      // Pre-select already picked contacts based on target
      const initialSelection = {};
      const activeSelected = target === "audience" ? audSelectedContacts : selectedContacts;
      activeSelected.forEach((c) => {
        const found = uniqueRecipients.find(
          (r) => r.email.toLowerCase() === (c.email || "").toLowerCase(),
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
    if (pickerTarget === "audience") {
      setAudSelectedContacts(selected);
      setShowRecipientPicker(false);
      onToast(
        `${selected.length} contact${selected.length === 1 ? "" : "s"} handpicked for audience`,
        "success",
      );
    } else {
      setSelectedContacts(selected);
      setShowRecipientPicker(false);
      setEstimatedRecipients(null);
      onToast(
        `${selected.length} contact${selected.length === 1 ? "" : "s"} selected for campaign`,
        "success",
      );
    }
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

  // ── ImHUB Lead Browser Handlers ──────────────
  const loadBrowseContacts = async (page = 1) => {
    setLoadingBrowseContacts(true);
    try {
      const srcs = [];
      if (audSources.sqlite) srcs.push("sqlite");
      if (audSources.mongo) srcs.push("mongo");
      if (srcs.length === 0) {
        setAudBrowseContacts([]);
        setAudBrowseTotal(0);
        setAudBrowseTotalPages(1);
        setLoadingBrowseContacts(false);
        return;
      }
      const res = await api.browseRecipients({
        sources: srcs.join(","),
        country: audCountry.trim(),
        category: audCategory.trim(),
        search: audBrowseSearch.trim(),
        lead_type: (audSources.mongo && audLeadType !== "all") ? audLeadType : "",
        page,
        per_page: 25,
      });
      if (res.status === "success" && res.data) {
        setAudBrowseContacts(res.data.items || []);
        setAudBrowseTotal(res.data.total || 0);
        setAudBrowsePage(res.data.page || 1);
        setAudBrowseTotalPages(res.data.total_pages || 1);
      }
    } catch (e) {
      console.error("Browse contacts error:", e);
    } finally {
      setLoadingBrowseContacts(false);
    }
  };

  useEffect(() => {
    if (activePanel !== "audiences") return;
    const timer = setTimeout(() => {
      loadBrowseContacts(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [activePanel, audSources.sqlite, audSources.mongo, audCountry, audCategory, audBrowseSearch, audLeadType]);

  const toggleSelectBrowseContact = (contact) => {
    const key = (contact.email || contact.id).toLowerCase();
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = {
          id: contact.id,
          name: contact.person_name || contact.name,
          person_name: contact.person_name || contact.name,
          company: contact.company_name || contact.company,
          company_name: contact.company_name || contact.company,
          email: contact.email,
          role: contact.role,
          website: contact.website,
          city: contact.city,
          country: contact.country,
          category: contact.category,
          source: contact.source,
        };
      }
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleSelectAllBrowsePage = () => {
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      audBrowseContacts.forEach((c) => {
        const key = (c.email || c.id).toLowerCase();
        next[key] = {
          id: c.id,
          name: c.person_name || c.name,
          person_name: c.person_name || c.name,
          company: c.company_name || c.company,
          company_name: c.company_name || c.company,
          email: c.email,
          role: c.role,
          website: c.website,
          city: c.city,
          country: c.country,
          category: c.category,
          source: c.source,
        };
      });
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleDeselectAllBrowsePage = () => {
    setAudSelectedMap((prev) => {
      const next = { ...prev };
      audBrowseContacts.forEach((c) => {
        const key = (c.email || c.id).toLowerCase();
        delete next[key];
      });
      setAudSelectedContacts(Object.values(next));
      return next;
    });
  };

  const handleClearAllSelectedContacts = () => {
    setAudSelectedMap({});
    setAudSelectedContacts([]);
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
    if (audSelectedContacts.length > 0) sources.push("selected");

    if (sources.length === 0 && audSelectedContacts.length === 0) {
      onToast("Select at least one audience source or handpick specific companies", "error");
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
          lead_type: audLeadType,
        },
        manual_recipients: manualList,
        selected_recipients: audSelectedContacts.map((c) => ({
          person_name: c.name || "",
          company_name: c.company || "",
          email: c.email || "",
          role: c.role || "",
          website: c.website || "",
          city: c.city || "",
          country: c.country || "",
          category: c.category || "",
          source: c.source || "eu",
        })),
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
      setAudViewMode("directory");
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
    setAudLeadType(aud.filters?.lead_type || "all");
    const manualArr = aud.manual_recipients || [];
    setAudManualEmails(manualArr.map((m) => (typeof m === "string" ? m : m.email || "")).join("\n"));
    const sel = aud.selected_recipients || [];
    setAudSelectedContacts(sel);
    const map = {};
    sel.forEach((c) => {
      const key = (c.email || c.id || "").toLowerCase();
      if (key) map[key] = c;
    });
    setAudSelectedMap(map);
    setAudViewMode("builder");
  };

  const handleResetAudienceForm = () => {
    setEditingAudienceId(null);
    setAudName("");
    setAudDescription("");
    setAudSources({ sqlite: true, mongo: false, manual: false });
    setAudCountry("");
    setAudCategory("");
    setAudLeadType("all");
    setAudManualEmails("");
    setAudSelectedContacts([]);
    setAudSelectedMap({});
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
    setCampAudienceId(aud.id);
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
    if (aud.selected_recipients && aud.selected_recipients.length > 0) {
      setSelectedContacts(aud.selected_recipients);
    }
    setActivePanel("create");
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

  const handleRegenerateAI = async () => {
    if (!selectedQueueItem?.id) return;
    setRegeneratingAI(true);
    try {
      const res = await api.regenerateQueueItemAI(selectedQueueItem.id);
      const updated = res.data;
      setSelectedQueueItem(updated);
      setQueueEditSubject(updated.subject);
      setQueueEditBody(updated.raw_body || updated.body);
      setQueueItems((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
      onToast(res.message || "Generated new AI hook & pitch!", "success");
    } catch (e) {
      onToast(e.message, "error");
    } finally {
      setRegeneratingAI(false);
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
        from_name: smtpFromName.trim() || "HirePilot AI",
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
        from_name: smtpFromName.trim() || "HirePilot AI",
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Sub-navigation: Saved Templates vs Template Creator */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "var(--bg-surface)",
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: "4px",
                background: "var(--bg-secondary)",
                padding: "4px",
                borderRadius: "9px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setTplViewMode("directory")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border:
                    tplViewMode === "directory"
                      ? "1px solid var(--border-subtle)"
                      : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                  background:
                    tplViewMode === "directory" ? "var(--bg-card)" : "transparent",
                  color:
                    tplViewMode === "directory"
                      ? "var(--accent-blue)"
                      : "var(--text-muted)",
                  boxShadow:
                    tplViewMode === "directory"
                      ? "0 2px 8px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <List style={{ width: "15px", height: "15px" }} />
                <span>Saved Templates ({templates.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setTplViewMode("creator")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border:
                    tplViewMode === "creator"
                      ? "1px solid var(--border-subtle)"
                      : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                  background:
                    tplViewMode === "creator" ? "var(--bg-card)" : "transparent",
                  color:
                    tplViewMode === "creator"
                      ? "var(--accent-violet)"
                      : "var(--text-muted)",
                  boxShadow:
                    tplViewMode === "creator"
                      ? "0 2px 8px rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <Edit3 style={{ width: "15px", height: "15px" }} />
                <span>{tplId ? "Edit Template" : "Template Creator"}</span>
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {tplViewMode === "directory" ? (
                <button
                  type="button"
                  onClick={() => {
                    clearTemplateEditor();
                    setTplViewMode("creator");
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 600,
                  }}
                >
                  <Plus style={{ width: "14px", height: "14px" }} />
                  <span>Create New Template</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTplViewMode("directory")}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Back to Saved Templates</span>
                </button>
              )}
            </div>
          </div>

          {/* SUB-VIEW 1: Saved Templates Directory */}
          {tplViewMode === "directory" && (
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div className="card-title-group">
                  <BookOpen
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "var(--accent-violet)",
                    }}
                  />
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Saved Templates ({templates.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={loadTemplates}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCw style={{ width: "13px", height: "13px" }} />
                  <span>Refresh</span>
                </button>
              </div>

              {templates.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "12px",
                  }}
                >
                  <BookOpen
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      opacity: 0.4,
                    }}
                  />
                  <p style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
                    No templates saved yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearTemplateEditor();
                      setTplViewMode("creator");
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Create Your First Template
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            fontSize: "1rem",
                          }}
                        >
                          {t.name}
                        </div>
                        {t.attachment_name && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.25)",
                              borderRadius: "6px",
                              padding: "2px 7px",
                            }}
                          >
                            <FileCheck style={{ width: "11px", height: "11px" }} />
                            <span>PDF</span>
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span style={{ color: "var(--accent-violet)" }}>✉</span>
                        <span style={{ fontWeight: 500 }}>{t.subject}</span>
                      </div>

                      {t.attachment_name && (
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          Attachment: {t.attachment_name}
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: "8px",
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "10px",
                          marginTop: "auto",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => editTemplate(t)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.77rem", fontWeight: 600 }}
                        >
                          <Edit3 style={{ width: "12px", height: "12px" }} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteTemplate(t)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: "0.77rem",
                            color: "#ef4444",
                            borderColor: "rgba(239, 68, 68, 0.2)",
                            padding: "5px 8px",
                          }}
                          title="Delete template"
                        >
                          <Trash2 style={{ width: "13px", height: "13px" }} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SUB-VIEW 2: Template Creation & Live Preview */}
          {tplViewMode === "creator" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.1fr 1fr",
                gap: "1.25rem",
              }}
            >
              {/* Template Editor */}
              <div className="glass-card" style={{ borderRadius: "14px" }}>
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

                  {/* Variables Helper */}
                  <div className="variables-chip-bar">
                    <span className="var-hint">
                      <Zap style={{ width: "12px", height: "12px" }} /> INSERT
                      VARIABLE:
                    </span>
                    {variables.map((v) => {
                      const varText = typeof v === "string" ? v : v.variable;
                      const varDesc = typeof v === "object" && v.description ? v.description : `Insert ${varText} at cursor`;
                      return (
                        <button
                          key={varText}
                          type="button"
                          onClick={() => insertVariable(varText)}
                          className="var-chip"
                          title={varDesc}
                        >
                          {varText}
                        </button>
                      );
                    })}
                  </div>

                  {/* PDF Attachment Upload */}
                  <div className="form-group">
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontWeight: 600,
                        fontSize: "0.83rem",
                        marginBottom: "6px",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Paperclip style={{ width: "13px", height: "13px", color: "var(--accent-cyan)" }} />
                      <span>Attach PDF Document</span>
                    </div>
                    <div
                      className="attachment-uploader-box"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        background: "var(--bg-secondary)",
                        border: "1px dashed var(--border-subtle)",
                      }}
                    >
                      {attachmentName ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "rgba(16, 185, 129, 0.12)",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              color: "#10b981",
                              fontSize: "0.84rem",
                              fontWeight: 600,
                            }}
                          >
                            <FileCheck style={{ width: "15px", height: "15px" }} />
                            <span>{attachmentName}</span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: "6px",
                              alignItems: "center",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setShowMediaPicker(true);
                                loadMediaList();
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.76rem" }}
                            >
                              <FolderOpen style={{ width: "12px", height: "12px" }} />
                              <span>Choose Different PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={removeAttachment}
                              className="btn btn-secondary btn-sm"
                              style={{
                                color: "var(--accent-rose)",
                                borderColor: "rgba(244, 63, 94, 0.3)",
                                fontSize: "0.76rem",
                              }}
                            >
                              <X style={{ width: "13px", height: "13px" }} />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "10px",
                          }}
                        >
                          {/* Row 1: Direct Native File Selector & Media Library Button */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              flexWrap: "wrap",
                              gap: "10px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <input
                                id="pdf-file-native-input"
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handlePdfFileSelect}
                                style={{
                                  fontSize: "0.82rem",
                                  color: "var(--text-secondary)",
                                  cursor: "pointer",
                                }}
                              />
                              {uploadingPdf && (
                                <span
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--accent-cyan)",
                                    fontWeight: 600,
                                  }}
                                >
                                  Uploading PDF...
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setShowMediaPicker(true);
                                loadMediaList();
                              }}
                              className="btn btn-secondary btn-sm"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontWeight: 600,
                                borderColor: "rgba(6, 182, 212, 0.4)",
                                color: "var(--accent-cyan)",
                              }}
                            >
                              <FolderOpen style={{ width: "13px", height: "13px" }} />
                              <span>Media Picker ({mediaList.length})</span>
                            </button>
                          </div>

                          {/* Row 2: Instant dropdown to pick existing file directly */}
                          {mediaList.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                borderTop: "1px solid var(--border-subtle)",
                                paddingTop: "8px",
                                fontSize: "0.78rem",
                              }}
                            >
                              <span
                                style={{
                                  color: "var(--text-muted)",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Or select existing:
                              </span>
                              <select
                                className="eu-input"
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.78rem",
                                  flex: 1,
                                  maxWidth: "360px",
                                }}
                                defaultValue=""
                                onChange={(e) => {
                                  const selected = mediaList.find(
                                    (m) => m.filename === e.target.value,
                                  );
                                  if (selected) {
                                    handleSelectFromMediaPicker(selected);
                                  }
                                }}
                              >
                                <option value="" disabled>
                                  -- Choose from {mediaList.length} uploaded PDFs --
                                </option>
                                {mediaList.map((m) => (
                                  <option key={m.filename} value={m.filename}>
                                    {m.display_name} ({m.size_kb} KB)
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <label htmlFor="tpl-body" style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}>
                          Email Body
                        </label>
                        <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)", background: "rgba(6,182,212,0.12)", padding: "2px 8px", borderRadius: "6px", fontWeight: 500 }}>
                          HTML Output
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-input)", padding: "2px 3px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                        <button
                          type="button"
                          onClick={() => setEditorMode("visual")}
                          style={{
                            padding: "4px 10px",
                            fontSize: "0.74rem",
                            borderRadius: "6px",
                            border: "none",
                            background: editorMode === "visual" ? "var(--accent-cyan)" : "transparent",
                            color: editorMode === "visual" ? "#fff" : "var(--text-muted)",
                            fontWeight: editorMode === "visual" ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          Visual Editor (Rich Text)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorMode("html")}
                          style={{
                            padding: "4px 10px",
                            fontSize: "0.74rem",
                            borderRadius: "6px",
                            border: "none",
                            background: editorMode === "html" ? "var(--accent-cyan)" : "transparent",
                            color: editorMode === "html" ? "#fff" : "var(--text-muted)",
                            fontWeight: editorMode === "html" ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          &lt;&gt; Raw HTML
                        </button>
                      </div>
                    </div>

                    {editorMode === "visual" ? (
                      <div className="hp-quill-wrapper">
                        <ReactQuill
                          ref={quillRef}
                          theme="snow"
                          value={tplBody}
                          onChange={(content) => setTplBody(content)}
                          modules={quillModules}
                          placeholder="Type your email message visually... No raw HTML tags needed! Dynamic variables like {{name}} will be preserved."
                        />
                      </div>
                    ) : (
                      <textarea
                        id="tpl-body"
                        ref={bodyTextareaRef}
                        className="eu-input"
                        placeholder="Hi {{name}},&#10;&#10;I came across {{company_name}} and wanted to reach out regarding our B2B solutions.&#10;&#10;Best regards,"
                        value={tplBody}
                        onChange={(e) => setTplBody(e.target.value)}
                        style={{
                          minHeight: "420px",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                          fontSize: "0.84rem",
                          lineHeight: "1.55",
                          resize: "vertical",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "14px",
                }}
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
                    <h2>Live Sample Preview</h2>
                  </div>
                  <button
                    onClick={() => handleRefreshPreview()}
                    disabled={loadingPreview}
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw
                      style={{
                        animation: loadingPreview ? "spin 1s linear infinite" : "none",
                      }}
                    />
                    <span>Refresh Preview</span>
                  </button>
                </div>

                <div className="preview-container" style={{ flex: 1, marginTop: "1rem" }}>
                  <div
                    className="preview-subject-bar"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: "var(--bg-secondary, rgba(255,255,255,0.04))",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      marginBottom: "0.85rem",
                    }}
                  >
                    <span
                      className="preview-label"
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Subject:
                    </span>
                    <span
                      className="preview-val"
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {previewSubject}
                    </span>
                  </div>

                  {attachmentName && (
                    <div
                      style={{
                        margin: "0.5rem 0 0.85rem 0",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.78rem",
                        color: "var(--accent-cyan)",
                      }}
                    >
                      <Paperclip style={{ width: "12px", height: "12px" }} />
                      <span>Attachment: {attachmentName}</span>
                    </div>
                  )}

                  <div
                    className="preview-body-content"
                    style={{
                      padding: "2px 0",
                      lineHeight: 1.6,
                    }}
                  >
                    {previewBody ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: cleanPreviewHtml(previewBody),
                        }}
                      />
                    ) : (
                      <div className="preview-placeholder">
                        Write your email template on the left and click{" "}
                        <strong>Refresh Preview</strong> to render with sample founder
                        and company data.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL: Target Audiences */}
      {activePanel === "audiences" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Sub-navigation: Studio vs Saved Audiences Directory */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              background: "var(--bg-surface)",
              padding: "8px 14px",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: "4px",
                background: "var(--bg-secondary)",
                padding: "4px",
                borderRadius: "9px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setAudViewMode("directory")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border: audViewMode === "directory" ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                  background: audViewMode === "directory" ? "var(--bg-card)" : "transparent",
                  color: audViewMode === "directory" ? "var(--accent-blue)" : "var(--text-muted)",
                  boxShadow: audViewMode === "directory" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <List style={{ width: "15px", height: "15px" }} />
                <span>Saved Audiences Directory ({audiences.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAudViewMode("builder")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 16px",
                  borderRadius: "7px",
                  border: audViewMode === "builder" ? "1px solid var(--border-subtle)" : "1px solid transparent",
                  cursor: "pointer",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  transition: "all 0.15s ease",
                  background: audViewMode === "builder" ? "var(--bg-card)" : "transparent",
                  color: audViewMode === "builder" ? "#ea580c" : "var(--text-muted)",
                  boxShadow: audViewMode === "builder" ? "0 2px 8px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <CheckSquare style={{ width: "15px", height: "15px" }} />
                <span>
                  {editingAudienceId
                    ? "Edit Audience in Studio"
                    : "Audience Selection Studio"}
                </span>
                {audSelectedContacts.length > 0 && (
                  <span
                    style={{
                      background: "#ea580c",
                      color: "#fff",
                      fontSize: "0.72rem",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      fontWeight: 700,
                    }}
                  >
                    {audSelectedContacts.length}
                  </span>
                )}
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {audViewMode === "directory" ? (
                <button
                  type="button"
                  onClick={() => {
                    handleResetAudienceForm();
                    setAudViewMode("builder");
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ea580c",
                    borderColor: "#ea580c",
                    padding: "7px 14px",
                    fontWeight: 600,
                  }}
                >
                  <Plus style={{ width: "14px", height: "14px" }} />
                  <span>Create New Audience</span>
                </button>
              ) : (
                audiences.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      Quick Load:
                    </span>
                    <select
                      className="eu-input"
                      style={{
                        padding: "6px 12px",
                        fontSize: "0.8rem",
                        width: "auto",
                        minWidth: "210px",
                        borderRadius: "8px",
                      }}
                      value={editingAudienceId || ""}
                      onChange={(e) => {
                        const found = audiences.find((a) => a.id === e.target.value);
                        if (found) handleEditAudience(found);
                      }}
                    >
                      <option value="">-- Choose saved audience to edit --</option>
                      {audiences.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.contact_count || 0} contacts)
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}
            </div>
          </div>

          {/* VIEW: Studio Builder Mode (ImHUB-Style Filter Sidebar + Lead Table) */}
          {audViewMode === "builder" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "330px 1fr",
                gap: "1.25rem",
                alignItems: "flex-start",
              }}
            >
              {/* Left Column: Filter Sidebar */}
              <div
                className="glass-card"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.1rem",
                  borderRadius: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.7rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 700,
                      fontSize: "0.95rem",
                    }}
                  >
                    <Filter
                      style={{
                        width: "16px",
                        height: "16px",
                        color: "#ea580c",
                      }}
                    />
                    <span>
                      {editingAudienceId
                        ? "Edit Target Audience"
                        : "Filter & Audience Setup"}
                    </span>
                  </div>
                  {editingAudienceId && (
                    <button
                      type="button"
                      onClick={handleResetAudienceForm}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--accent-rose)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      ✕ Cancel Edit
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Audience Name *</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. UK AI Founders, German Biotech"
                    value={audName}
                    onChange={(e) => setAudName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Description / Notes</label>
                  <input
                    type="text"
                    className="eu-input"
                    placeholder="e.g. Handpicked Series A AI founders"
                    value={audDescription}
                    onChange={(e) => setAudDescription(e.target.value)}
                  />
                </div>

                {/* Data Source Checkboxes (ImHUB Funnel Stage Style) */}
                <div className="form-group">
                  <label
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      marginBottom: "6px",
                    }}
                  >
                    <span>Data Sources</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                      (Updates directory live)
                    </span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <label
                      className="checkbox-chip"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: audSources.sqlite ? "1px solid rgba(6, 182, 212, 0.4)" : "1px solid var(--border-subtle)",
                        background: audSources.sqlite ? "rgba(6, 182, 212, 0.08)" : "transparent",
                      }}
                    >
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
                      <span className="chip-content" style={{ fontWeight: 500 }}>
                        EU Startups
                      </span>
                    </label>

                    <label
                      className="checkbox-chip"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: audSources.mongo ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border-subtle)",
                        background: audSources.mongo ? "rgba(16, 185, 129, 0.08)" : "transparent",
                      }}
                    >
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
                      <span className="chip-content" style={{ fontWeight: 500 }}>
                        LinkedIn Leads
                      </span>
                    </label>

                    {audSources.mongo && (
                      <div
                        style={{
                          marginTop: "-2px",
                          marginBottom: "4px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: "rgba(16, 185, 129, 0.05)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "6px",
                        }}
                      >
                        <span style={{ fontSize: "0.74rem", color: "var(--accent-emerald)", fontWeight: 700 }}>
                          LinkedIn Lead Type:
                        </span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                          {[
                            { key: "all", label: "All Leads" },
                            { key: "company", label: "🏢 Company" },
                            { key: "personal", label: "👤 Personal" },
                            { key: "others", label: "❓ Others" },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setAudLeadType(opt.key)}
                              style={{
                                padding: "6px 8px",
                                fontSize: "0.75rem",
                                borderRadius: "6px",
                                border: audLeadType === opt.key ? "1.5px solid var(--accent-emerald)" : "1px solid var(--border-subtle)",
                                background: audLeadType === opt.key ? "rgba(16, 185, 129, 0.18)" : "var(--chip-bg)",
                                color: audLeadType === opt.key ? "var(--accent-emerald)" : "var(--text-secondary)",
                                fontWeight: audLeadType === opt.key ? 700 : 500,
                                cursor: "pointer",
                                textAlign: "center",
                                transition: "all 0.15s ease",
                              }}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <label
                      className="checkbox-chip"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: audSources.manual ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid var(--border-subtle)",
                        background: audSources.manual ? "rgba(245, 158, 11, 0.08)" : "transparent",
                      }}
                    >
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
                      <span className="chip-content" style={{ fontWeight: 500 }}>
                        Manual / Direct Contacts
                      </span>
                    </label>
                  </div>
                </div>

                {/* Granular Filters */}
                {(audSources.sqlite || audSources.mongo) && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Filter by Country</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. United Kingdom, Germany"
                        value={audCountry}
                        onChange={(e) => setAudCountry(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Filter by Category / Industry</label>
                      <input
                        type="text"
                        className="eu-input"
                        placeholder="e.g. Artificial Intelligence, SaaS"
                        value={audCategory}
                        onChange={(e) => setAudCategory(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Search Contacts &amp; Companies</label>
                      <div style={{ position: "relative" }}>
                        <Search
                          style={{
                            position: "absolute",
                            left: "10px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "13px",
                            color: "var(--text-dim)",
                          }}
                        />
                        <input
                          type="text"
                          className="eu-input"
                          style={{ paddingLeft: "30px" }}
                          placeholder="Search name, company, email, role..."
                          value={audBrowseSearch}
                          onChange={(e) => setAudBrowseSearch(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Manual contacts list */}
                {audSources.manual && (
                  <div className="form-group">
                    <label style={{ fontWeight: 600, fontSize: "0.82rem" }}>Manual Contacts</label>
                    <textarea
                      className="eu-textarea"
                      rows={3}
                      placeholder="Name, Company, email@domain.com&#10;or founder@example.com"
                      value={audManualEmails}
                      onChange={(e) => setAudManualEmails(e.target.value)}
                      style={{ fontSize: "0.8rem", fontFamily: "monospace" }}
                    />
                  </div>
                )}

                {/* Selection Counter Card */}
                <div
                  style={{
                    background: "rgba(234, 88, 12, 0.06)",
                    border: "1px solid rgba(234, 88, 12, 0.25)",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "0.88rem",
                        color: "#ea580c",
                      }}
                    >
                      ✓ {audSelectedContacts.length} Contacts Selected
                    </span>
                    {audSelectedContacts.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllSelectedContacts}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--accent-rose)",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: "0.74rem",
                      color: "var(--text-muted)",
                      marginTop: "3px",
                    }}
                  >
                    Check or uncheck contacts in the table on the right to handpick companies.
                  </div>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  disabled={savingAudience}
                  onClick={handleSaveAudience}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "10px 16px",
                    fontWeight: 700,
                    background: "#ea580c",
                    borderColor: "#ea580c",
                    color: "#fff",
                    boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)",
                  }}
                >
                  <Save style={{ width: "15px", height: "15px" }} />
                  <span>
                    {savingAudience
                      ? "Saving..."
                      : editingAudienceId
                        ? `Update Audience (${audSelectedContacts.length})`
                        : `Save Target Audience (${audSelectedContacts.length})`}
                  </span>
                </button>
              </div>

              {/* Right Column: ImHUB Style Lead Table */}
              <div
                className="glass-card"
                style={{
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  minHeight: "680px",
                  borderRadius: "14px",
                }}
              >
                {/* Table Top Action Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    borderBottom: "1px solid var(--border-subtle)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "1.05rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <Users
                        style={{
                          width: "18px",
                          height: "18px",
                          color: "#ea580c",
                        }}
                      />
                      <span>Selected Audience / Directory</span>
                    </h3>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      Showing {audBrowseContacts.length} of {audBrowseTotal} available leads across selected sources. Check boxes to partially select companies.
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={handleSelectAllBrowsePage}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.77rem", fontWeight: 600 }}
                    >
                      <CheckSquare style={{ width: "13px", height: "13px" }} />
                      <span>Select All on Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllBrowsePage}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.77rem" }}
                    >
                      <span>Deselect Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadBrowseContacts(audBrowsePage)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.77rem" }}
                      title="Refresh Directory"
                    >
                      <RefreshCw
                        style={{
                          width: "13px",
                          height: "13px",
                          animation: loadingBrowseContacts
                            ? "spin 1s linear infinite"
                            : "none",
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* Lead Type Tabs Filter when LinkedIn Leads selected */}
                {audSources.mongo && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "2px",
                      marginBottom: "-4px",
                    }}
                  >
                    {[
                      { key: "all", label: "All Leads" },
                      { key: "company", label: "🏢 Company" },
                      { key: "personal", label: "👤 Personal" },
                      { key: "others", label: "❓ Others" },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setAudLeadType(tab.key);
                          setAudBrowsePage(1);
                        }}
                        style={{
                          padding: "0.42rem 0.85rem",
                          border: "none",
                          borderBottom:
                            audLeadType === tab.key
                              ? "2.5px solid var(--accent-emerald)"
                              : "2.5px solid transparent",
                          background:
                            audLeadType === tab.key
                              ? "rgba(16, 185, 129, 0.08)"
                              : "transparent",
                          color:
                            audLeadType === tab.key
                              ? "var(--accent-emerald)"
                              : "var(--text-muted)",
                          fontWeight: audLeadType === tab.key ? 700 : 500,
                          cursor: "pointer",
                          fontSize: "0.82rem",
                          borderRadius: "6px 6px 0 0",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ImHUB Style Table */}
                <div
                  style={{
                    overflowX: "auto",
                    borderRadius: "10px",
                    border: "1px solid var(--border-subtle)",
                    background: "var(--bg-surface)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.83rem",
                      textAlign: "left",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: "var(--table-header-bg)",
                          borderBottom: "1px solid var(--border-subtle)",
                        }}
                      >
                        <th style={{ width: "42px", padding: "11px 14px" }}>
                          <input
                            type="checkbox"
                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                            checked={
                              audBrowseContacts.length > 0 &&
                              audBrowseContacts.every(
                                (c) =>
                                  !!audSelectedMap[
                                    (c.email || c.id).toLowerCase()
                                  ],
                              )
                            }
                            onChange={(e) => {
                              if (e.target.checked) handleSelectAllBrowsePage();
                              else handleDeselectAllBrowsePage();
                            }}
                          />
                        </th>
                        <th style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          User Name
                        </th>
                        <th style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          Company
                        </th>
                        <th style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          Email
                        </th>
                        <th style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          Filter / Source
                        </th>
                        <th style={{ padding: "11px 14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingBrowseContacts ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "50px 20px" }}>
                            <div className="spinner" style={{ margin: "0 auto 12px" }} />
                            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                              Loading leads...
                            </span>
                          </td>
                        </tr>
                      ) : audBrowseContacts.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{
                              textAlign: "center",
                              padding: "60px 20px",
                              color: "var(--text-muted)",
                            }}
                          >
                            No contacts match the current data sources and filters.
                          </td>
                        </tr>
                      ) : (
                        audBrowseContacts.map((c) => {
                          const isChecked = !!audSelectedMap[
                            (c.email || c.id).toLowerCase()
                          ];
                          return (
                            <tr
                              key={c.id}
                              onClick={() => toggleSelectBrowseContact(c)}
                              style={{
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-subtle)",
                                background: isChecked
                                  ? "rgba(234, 88, 12, 0.08)"
                                  : "transparent",
                                borderLeft: isChecked
                                  ? "3px solid #ea580c"
                                  : "3px solid transparent",
                                transition: "background 0.12s ease",
                              }}
                            >
                              <td
                                style={{ padding: "11px 14px" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  style={{ cursor: "pointer", width: "16px", height: "16px" }}
                                  checked={isChecked}
                                  onChange={() => toggleSelectBrowseContact(c)}
                                />
                              </td>
                              <td style={{ padding: "11px 14px", fontWeight: 600, color: "var(--text-primary)" }}>
                                {c.person_name || "Leadership"}
                              </td>
                              <td style={{ padding: "11px 14px" }}>
                                {c.website ? (
                                  <a
                                    href={
                                      c.website.startsWith("http")
                                        ? c.website
                                        : `https://${c.website}`
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      color: "var(--accent-blue)",
                                      textDecoration: "underline",
                                      fontWeight: 600,
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {c.company_name}
                                  </a>
                                ) : (
                                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                                    {c.company_name}
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  padding: "11px 14px",
                                  fontFamily: "monospace",
                                  fontSize: "0.8rem",
                                  color: "var(--text-secondary)",
                                }}
                              >
                                {c.email}
                              </td>
                              <td style={{ padding: "11px 14px" }}>
                                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      padding: "2px 7px",
                                      borderRadius: "5px",
                                      background:
                                        c.source === "sqlite"
                                          ? "rgba(6, 182, 212, 0.15)"
                                          : "rgba(16, 185, 129, 0.15)",
                                      color:
                                        c.source === "sqlite"
                                          ? "var(--accent-cyan)"
                                          : "var(--accent-emerald)",
                                      border:
                                        c.source === "sqlite"
                                          ? "1px solid rgba(6, 182, 212, 0.3)"
                                          : "1px solid rgba(16, 185, 129, 0.3)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {c.source === "sqlite" ? "EU Startups" : "LinkedIn Leads"}
                                  </span>
                                  {c.source !== "sqlite" && c.lead_type && (
                                    <span
                                      style={{
                                        fontSize: "0.72rem",
                                        padding: "2px 7px",
                                        borderRadius: "5px",
                                        background:
                                          c.lead_type === "company"
                                            ? "rgba(59, 130, 246, 0.15)"
                                            : c.lead_type === "personal"
                                            ? "rgba(168, 85, 247, 0.15)"
                                            : "rgba(107, 114, 128, 0.15)",
                                        color:
                                          c.lead_type === "company"
                                            ? "#3b82f6"
                                            : c.lead_type === "personal"
                                            ? "#a855f7"
                                            : "var(--text-muted)",
                                        border:
                                          c.lead_type === "company"
                                            ? "1px solid rgba(59, 130, 246, 0.3)"
                                            : c.lead_type === "personal"
                                            ? "1px solid rgba(168, 85, 247, 0.3)"
                                            : "1px solid rgba(107, 114, 128, 0.3)",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {c.lead_type === "company"
                                        ? "🏢 Company"
                                        : c.lead_type === "personal"
                                        ? "👤 Personal"
                                        : "❓ Others"}
                                    </span>
                                  )}
                                  {c.country && (
                                    <span
                                      style={{
                                        fontSize: "0.72rem",
                                        padding: "2px 7px",
                                        borderRadius: "5px",
                                        background: "var(--chip-bg)",
                                        color: "var(--text-secondary)",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      {c.country}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "11px 14px",
                                  color: "var(--text-muted)",
                                  fontSize: "0.78rem",
                                }}
                              >
                                {c.role || "Executive"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* ImHUB Bottom Pagination Bar */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "10px",
                    marginTop: "auto",
                    paddingTop: "0.85rem",
                    borderTop: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Showing{" "}
                    <strong>
                      {audBrowseTotal > 0
                        ? (audBrowsePage - 1) * 25 + 1
                        : 0}{" "}
                      -{" "}
                      {Math.min(audBrowsePage * 25, audBrowseTotal)}
                    </strong>{" "}
                    of <strong>{audBrowseTotal}</strong> leads
                  </div>

                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                      type="button"
                      disabled={audBrowsePage <= 1}
                      onClick={() => {
                        const newP = Math.max(1, audBrowsePage - 1);
                        setAudBrowsePage(newP);
                        loadBrowseContacts(newP);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "4px 9px" }}
                    >
                      &lt;
                    </button>

                    {Array.from(
                      { length: Math.min(6, audBrowseTotalPages) },
                      (_, i) => {
                        const pageNum = i + 1;
                        const isActive = pageNum === audBrowsePage;
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => {
                              setAudBrowsePage(pageNum);
                              loadBrowseContacts(pageNum);
                            }}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "7px",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontWeight: isActive ? 700 : 500,
                              background: isActive
                                ? "#ea580c"
                                : "var(--bg-secondary)",
                              color: isActive ? "#ffffff" : "var(--text-secondary)",
                              boxShadow: isActive ? "0 2px 8px rgba(234, 88, 12, 0.3)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      },
                    )}

                    {audBrowseTotalPages > 6 && (
                      <span
                        style={{
                          padding: "0 4px",
                          color: "var(--text-dim)",
                          fontSize: "0.78rem",
                        }}
                      >
                        ... {audBrowseTotalPages}
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={audBrowsePage >= audBrowseTotalPages}
                      onClick={() => {
                        const newP = Math.min(
                          audBrowseTotalPages,
                          audBrowsePage + 1,
                        );
                        setAudBrowsePage(newP);
                        loadBrowseContacts(newP);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.78rem", padding: "4px 9px" }}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: Saved Audiences Directory (Fixed Overflow & Elegant Responsive Cards) */}
          {audViewMode === "directory" && (
            <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "14px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid var(--border-subtle)",
                  paddingBottom: "0.85rem",
                  marginBottom: "1.25rem",
                }}
              >
                <div className="card-title-group">
                  <List
                    style={{
                      width: "18px",
                      height: "18px",
                      color: "var(--accent-blue)",
                    }}
                  />
                  <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                    Saved Audiences Directory ({audiences.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={loadAudiences}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  <RefreshCw style={{ width: "13px", height: "13px" }} />
                  <span>Refresh</span>
                </button>
              </div>

              {loadingAudiences ? (
                <div style={{ textAlign: "center", padding: "50px" }}>
                  <div className="spinner" />
                </div>
              ) : audiences.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                    border: "1px dashed var(--border-subtle)",
                    borderRadius: "12px",
                  }}
                >
                  <Users
                    style={{
                      width: "40px",
                      height: "40px",
                      margin: "0 auto 12px",
                      opacity: 0.4,
                    }}
                  />
                  <p style={{ fontSize: "0.92rem", marginBottom: "12px" }}>
                    No saved audiences yet.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      handleResetAudienceForm();
                      setAudViewMode("builder");
                    }}
                    className="btn btn-primary btn-sm"
                    style={{ background: "#ea580c", borderColor: "#ea580c" }}
                  >
                    Create Your First Audience
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
                    gap: "1.25rem",
                  }}
                >
                  {audiences.map((aud) => (
                    <div
                      key={aud.id}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "12px",
                        padding: "16px 18px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "1.02rem",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            {aud.name}
                          </h3>
                          {aud.description ? (
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "0.82rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {aud.description}
                            </p>
                          ) : (
                            <p
                              style={{
                                margin: "4px 0 0",
                                fontSize: "0.78rem",
                                color: "var(--text-dim)",
                                fontStyle: "italic",
                              }}
                            >
                              No description
                            </p>
                          )}
                        </div>
                        <span
                          style={{
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: "14px",
                            background: "rgba(6, 182, 212, 0.12)",
                            color: "var(--accent-cyan)",
                            border: "1px solid rgba(6, 182, 212, 0.25)",
                            whiteSpace: "nowrap",
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
                          fontSize: "0.73rem",
                        }}
                      >
                        {aud.selected_recipients?.length > 0 && (
                          <span
                            style={{
                              background: "rgba(16, 185, 129, 0.15)",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              color: "#10b981",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                              fontWeight: 700,
                            }}
                          >
                            🎯 {aud.selected_recipients.length} Handpicked
                          </span>
                        )}
                        {(aud.sources || []).map((s) => (
                          <span
                            key={s}
                            style={{
                              background: "var(--chip-bg)",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                              fontWeight: 500,
                            }}
                          >
                            Source: {s}
                          </span>
                        ))}
                        {aud.filters?.country && (
                          <span
                            style={{
                              background: "var(--chip-bg)",
                              padding: "3px 8px",
                              borderRadius: "6px",
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
                              padding: "3px 8px",
                              borderRadius: "6px",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                            }}
                          >
                            Category: {aud.filters.category}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons Toolbar (No Clipping / Perfectly Aligned) */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: "8px",
                          borderTop: "1px solid var(--border-subtle)",
                          paddingTop: "10px",
                          marginTop: "auto",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleAudienceSelectForReview(aud)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: "0.77rem",
                              fontWeight: 600,
                              borderColor: "rgba(6, 182, 212, 0.4)",
                              color: "var(--accent-cyan)",
                            }}
                            title="Generate personalized emails and review 1-by-1"
                          >
                            <Edit3 style={{ width: "12px", height: "12px" }} />
                            <span>Review &amp; Send</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAudienceSelectForBulk(aud)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.77rem", fontWeight: 600 }}
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
                        </div>

                        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleEditAudience(aud)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.77rem" }}
                            title="Edit in Studio"
                          >
                            <Edit3 style={{ width: "12px", height: "12px" }} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAudience(aud.id)}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: "0.77rem",
                              color: "#ef4444",
                              borderColor: "rgba(239, 68, 68, 0.2)",
                              padding: "5px 8px",
                            }}
                            title="Delete audience"
                          >
                            <Trash2 style={{ width: "13px", height: "13px" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

                      {/* Direct Send Button in Header */}
                      <button
                        type="button"
                        disabled={sendingSingleQueueId === selectedQueueItem.id}
                        onClick={() => handleSendQueueItem(selectedQueueItem)}
                        className="btn btn-primary btn-sm"
                        style={{
                          fontWeight: 700,
                          fontSize: "0.76rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "5px 14px",
                          boxShadow: "0 0 12px rgba(99, 102, 241, 0.4)",
                        }}
                        title={`Directly send email to ${selectedQueueItem.recipient_email}`}
                      >
                        {sendingSingleQueueId === selectedQueueItem.id ? (
                          <>
                            <div className="spinner" style={{ width: "12px", height: "12px" }} />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send style={{ width: "13px", height: "13px" }} />
                            <span>Send Email Now</span>
                          </>
                        )}
                      </button>

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
                      <button
                        type="button"
                        disabled={regeneratingAI}
                        onClick={handleRegenerateAI}
                        className="btn btn-sm btn-secondary"
                        style={{
                          fontSize: "0.74rem",
                          padding: "3px 10px",
                          color: "var(--accent-cyan)",
                          borderColor: "rgba(6,182,212,0.3)",
                          background: "rgba(6,182,212,0.08)",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        title="Regenerate company hook and value pitch using Gemini AI"
                      >
                        {regeneratingAI ? (
                          <>
                            <div className="spinner" style={{ width: "11px", height: "11px" }} />
                            <span>AI Generating...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles style={{ width: "12px", height: "12px", color: "var(--accent-cyan)" }} />
                            <span>✨ Regenerate with AI</span>
                          </>
                        )}
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
                    onClick={() => {
                      setActivePanel("templates");
                      setTplViewMode("directory");
                      loadTemplates();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid rgba(99, 102, 241, 0.25)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: "var(--accent-violet)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    title="Go to Saved Templates Directory"
                  >
                    <BookOpen style={{ width: "12px", height: "12px" }} />
                    <span>Manage Templates →</span>
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

              {/* Select Target Audience */}
              <div className="form-group">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <label htmlFor="camp-audience" style={{ margin: 0 }}>
                    Select Target Audience
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePanel("audiences");
                      setAudViewMode("directory");
                      loadAudiences();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      background: "rgba(6, 182, 212, 0.1)",
                      border: "1px solid rgba(6, 182, 212, 0.25)",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      color: "var(--accent-cyan)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    title="Go to Saved Audiences Directory"
                  >
                    <Users style={{ width: "12px", height: "12px" }} />
                    <span>Manage Audiences →</span>
                  </button>
                </div>
                <select
                  id="camp-audience"
                  value={campAudienceId}
                  onChange={(e) => {
                    const audId = e.target.value;
                    setCampAudienceId(audId);
                    const aud = audiences.find((a) => a.id === audId);
                    if (aud) {
                      handleAudienceSelectForBulk(aud);
                    } else {
                      setCampSources({ sqlite: false, mongo: false, manual: false });
                      setSelectedContacts([]);
                      setEstimatedRecipients(null);
                    }
                  }}
                >
                  <option value="">— Select a saved audience —</option>
                  {audiences.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (~{a.contact_count || a.selected_recipients?.length || 0} contacts)
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginTop: "1.25rem",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1.3fr 1.15fr",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    disabled={savingDraft}
                    onClick={handleSaveCampaignDraft}
                    className="btn btn-secondary"
                    style={{
                      height: "44px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      borderRadius: "10px",
                    }}
                  >
                    <Save style={{ width: "15px", height: "15px" }} />
                    <span>
                      {savingDraft
                        ? "Saving..."
                        : editingCampaignId
                          ? "Update"
                          : "Save Draft"}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={loadingPreview}
                    onClick={handleGeneratePreview}
                    className="btn btn-preview-email"
                    style={{
                      height: "44px",
                      fontSize: "0.85rem",
                      borderRadius: "10px",
                    }}
                  >
                    <Eye style={{ width: "16px", height: "16px" }} />
                    <span>
                      {loadingPreview
                        ? "Generating..."
                        : "Preview Generated Emails"}
                    </span>
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
                    className="btn btn-primary"
                    style={{
                      height: "44px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                      fontSize: "0.86rem",
                      fontWeight: 700,
                      borderRadius: "10px",
                    }}
                  >
                    <span>Proceed to Send</span>
                    <ArrowRight style={{ width: "15px", height: "15px" }} />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={launching}
                  onClick={handleLaunchCampaign}
                  className="btn btn-secondary"
                  style={{
                    height: "42px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    borderRadius: "10px",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  {launching ? (
                    <div className="spinner" />
                  ) : (
                    <>
                      <Rocket
                        style={{
                          width: "15px",
                          height: "15px",
                          color: "#f59e0b",
                        }}
                      />
                      <span>⚡ Quick Launch Campaign</span>
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
                        padding: "7px 12px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.84rem",
                        color: "var(--accent-cyan)",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {(templates.find((t) => t.id === campTemplateId)?.subject || "(No subject)")
                        .replace(/\{\{company_name\}\}/g, "StackShift")
                        .replace(/\{\{name\}\}/g, "John Doe")}
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

                  {/* Email Body: Real Mail Client Preview */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                        }}
                      >
                        Email Body Preview:
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => setBulkPreviewMode("rendered")}
                          className={`btn btn-sm ${bulkPreviewMode === "rendered" ? "btn-primary" : "btn-secondary"}`}
                          style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                        >
                          <Eye style={{ width: "11px", height: "11px" }} />
                          <span>Email View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setBulkPreviewMode("source")}
                          className={`btn btn-sm ${bulkPreviewMode === "source" ? "btn-primary" : "btn-secondary"}`}
                          style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                        >
                          <Code style={{ width: "11px", height: "11px" }} />
                          <span>HTML Source</span>
                        </button>
                      </div>
                    </div>

                    {bulkPreviewMode === "rendered" ? (
                      <div
                        style={{
                          background: "#ffffff",
                          color: "#1e293b",
                          padding: "16px 20px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                          maxHeight: "260px",
                          overflowY: "auto",
                          fontSize: "0.86rem",
                          lineHeight: 1.6,
                        }}
                        dangerouslySetInnerHTML={{
                          __html: (
                            templates.find((t) => t.id === campTemplateId)?.body ||
                            "<p>(Empty body)</p>"
                          )
                            .replace(/\{\{name\}\}/g, "John Doe")
                            .replace(/\{\{company_name\}\}/g, "StackShift")
                            .replace(/\{\{first_name\}\}/g, "John")
                            .replace(/\{\{email\}\}/g, "john@stackshift.com")
                            .replace(/\{\{website\}\}/g, "https://stackshift.com")
                            .replace(
                              /\{\{ai_company_hook\}\}/g,
                              "your engineering talent platform for tech leaders",
                            )
                            .replace(
                              /\{\{ai_value_pitch\}\}/g,
                              "scaling autonomous AI workflows and backend systems",
                            ),
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          padding: "10px",
                          background: "var(--bg-surface)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          maxHeight: "260px",
                          overflowY: "auto",
                          fontFamily: "monospace",
                          lineHeight: 1.5,
                        }}
                      >
                        {templates.find((t) => t.id === campTemplateId)?.body ||
                          "(Empty body)"}
                      </div>
                    )}
                  </div>

                  {/* Test Email Dispatch Field */}
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "12px 14px",
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.28)",
                      borderRadius: "10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "4px",
                      }}
                    >
                      <label
                        style={{
                          margin: 0,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: "var(--accent-violet)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Send style={{ width: "13px", height: "13px" }} />
                        <span>Send Test Email</span>
                      </label>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                        Verify formatting &amp; attachment in your inbox
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        type="email"
                        className="eu-input"
                        placeholder="Enter your email to test (e.g. you@example.com)..."
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        style={{ flex: 1, fontSize: "0.82rem" }}
                      />
                      <button
                        type="button"
                        disabled={sendingTest || !testEmail.trim()}
                        onClick={handleSendTest}
                        className="btn btn-primary"
                        style={{
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          padding: "7px 16px",
                          whiteSpace: "nowrap",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 0 12px rgba(99, 102, 241, 0.35)",
                        }}
                        title="Send real test email to this inbox"
                      >
                        {sendingTest ? (
                          <>
                            <div className="spinner" style={{ width: "12px", height: "12px" }} />
                            <span>Sending Test...</span>
                          </>
                        ) : (
                          <>
                            <Send style={{ width: "13px", height: "13px" }} />
                            <span>Send Test Email</span>
                          </>
                        )}
                      </button>
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
                  <span>
                    {pickerTarget === "audience"
                      ? "Partially Select Audience Companies"
                      : "Partially Select Campaign Recipients"}
                  </span>
                </h3>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                  }}
                >
                  {pickerTarget === "audience"
                    ? "Handpick specific companies and contacts from EU Startups and LinkedIn Leads to add directly into this audience."
                    : "Choose exactly which contacts from EU Startups and LinkedIn Leads should receive this campaign."}
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
                  placeholder="HirePilot AI"
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
      {/* Modal: PDF Media Picker */}
      {showMediaPicker && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setShowMediaPicker(false)}
        >
          <div
            className="glass-card modal-dialog"
            style={{
              width: "min(680px, 95vw)",
              maxWidth: "680px",
              maxHeight: "80vh",
              display: "flex",
              flexDirection: "column",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FolderOpen
                  style={{
                    width: "18px",
                    height: "18px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
                    PDF Media Picker
                  </h3>
                  <div
                    style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}
                  >
                    Select a previously uploaded PDF or upload a new one
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMediaPicker(false)}
                className="btn-icon-ghost"
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>

            {/* Quick Upload inside Media Picker Modal */}
            <div
              style={{
                margin: "1rem 1.25rem 0.5rem",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px dashed var(--border-subtle)",
                background: "var(--bg-secondary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    color: "var(--text-primary)",
                  }}
                >
                  Upload New Document
                </span>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Supports .pdf pitch decks, one-pagers, brochures
                </div>
              </div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <button
                  type="button"
                  disabled={uploadingPdf}
                  className="btn btn-primary btn-sm"
                  style={{ pointerEvents: "none" }}
                >
                  <Paperclip style={{ width: "13px", height: "13px" }} />
                  <span>
                    {uploadingPdf ? "Uploading..." : "Browse Local Files"}
                  </span>
                </button>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={async (e) => {
                    await handlePdfFileSelect(e);
                    loadMediaList();
                    setShowMediaPicker(false);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                  }}
                />
              </div>
            </div>

            {/* List of existing PDFs */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
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
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Uploaded Documents ({mediaList.length})
                </span>
                <button
                  type="button"
                  onClick={loadMediaList}
                  className="btn-icon-ghost"
                  title="Refresh media list"
                  style={{ padding: "4px" }}
                >
                  <RefreshCw style={{ width: "12px", height: "12px" }} />
                </button>
              </div>

              {loadingMedia ? (
                <div style={{ textAlign: "center", padding: "30px" }}>
                  <RefreshCw
                    style={{
                      width: "18px",
                      height: "18px",
                      animation: "spin 1s linear infinite",
                      margin: "0 auto",
                    }}
                  />
                </div>
              ) : mediaList.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No uploaded PDFs found yet. Upload your first document above.
                </div>
              ) : (
                mediaList.map((item) => (
                  <div
                    key={item.filename}
                    onClick={() => handleSelectFromMediaPicker(item)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-surface)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-cyan)";
                      e.currentTarget.style.background =
                        "rgba(6, 182, 212, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--border-subtle)";
                      e.currentTarget.style.background = "var(--bg-surface)";
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <FileText
                        style={{
                          width: "18px",
                          height: "18px",
                          color: "var(--accent-cyan)",
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {item.display_name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {item.size_kb} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: "0.76rem" }}
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid var(--border-subtle)",
                padding: "10px 1.25rem",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                onClick={() => setShowMediaPicker(false)}
                className="btn btn-secondary btn-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
