import React, { useState, useEffect, useRef, useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  List,
  Edit3,
  Plus,
  BookOpen,
  RefreshCw,
  FileCheck,
  Trash2,
  Save,
  Zap,
  Paperclip,
  FolderOpen,
  X,
  Eye,
} from "lucide-react";
import { api } from "../../../services/api";
import type { EmailTemplate, TemplateVariable, AttachmentItem } from "../../../types/email";
import { MediaPickerModal } from "../modals/MediaPickerModal";

export interface TemplatesPanelProps {
  templates: EmailTemplate[];
  onTemplatesChange: () => void;
  onToast: (msg: string, type?: string) => void;
}

export function TemplatesPanel({
  templates,
  onTemplatesChange,
  onToast,
}: TemplatesPanelProps) {
  const [tplViewMode, setTplViewMode] = useState<"directory" | "creator">("directory");
  const [variables, setVariables] = useState<any[]>([]);

  // Form states
  const [tplId, setTplId] = useState("");
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [attachmentPath, setAttachmentPath] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaList, setMediaList] = useState<AttachmentItem[]>([]);

  // Live preview states
  const [previewSubject, setPreviewSubject] = useState("Subject will appear here");
  const [previewBody, setPreviewBody] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const quillRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadVariables = async () => {
    try {
      const res = await api.getEmailVariables();
      setVariables(res.data || []);
    } catch (e) {}
  };

  const loadMediaList = async () => {
    try {
      const res = await api.getAttachments();
      setMediaList(res.data || []);
    } catch (e) {}
  };

  useEffect(() => {
    loadVariables();
    loadMediaList();
  }, []);

  const cleanPreviewHtml = (raw: string) => {
    if (!raw) return "";
    let text = raw;
    const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) text = bodyMatch[1];
    text = text
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<html[^>]*>/gi, "")
      .replace(/<\/html>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "");

    const hasHtml = /<[a-z][\s\S]*>/i.test(text);
    if (hasHtml) return text.trim();
    return text.trim().replace(/\n/g, "<br/>");
  };

  const handleRefreshPreview = async (
    sub = tplSubject,
    body = tplBody,
    att = attachmentName
  ) => {
    if (!sub && !body) {
      onToast("Enter a subject or body first", "error");
      return;
    }
    setLoadingPreview(true);
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
    } finally {
      setLoadingPreview(false);
    }
  };

  const insertVariable = (variable: string) => {
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
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
      return;
    }

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

  const handlePdfFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const attName = attData.attachment_name || attData.display_name || file.name;
      const attPath = attData.attachment_path || attData.path || "";
      const attSize = attData.file_size_kb || attData.size_kb || (file.size / 1024).toFixed(1);
      setAttachmentName(attName);
      setAttachmentPath(attPath);
      onToast(`Attached ${attName} (${attSize} KB)`, "success");
      loadMediaList();
    } catch (err: any) {
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

  const editTemplate = (t: EmailTemplate) => {
    setTplId(t.id);
    setTplName(t.name);
    setTplSubject(t.subject);
    setTplBody(t.body);
    setAttachmentPath(t.attachment_path || "");
    setAttachmentName(t.attachment_name || "");
    handleRefreshPreview(t.subject, t.body, t.attachment_name || "");
    setTplViewMode("creator");
  };

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
      onTemplatesChange();
      setTplViewMode("directory");
    } catch (e: any) {
      onToast(e.message, "error");
    }
  };

  const deleteTemplate = async (t: EmailTemplate) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await api.deleteTemplate(t.id);
      onToast("Template deleted.", "success");
      onTemplatesChange();
      if (tplId === t.id) clearTemplateEditor();
    } catch (e: any) {
      onToast(e.message, "error");
    }
  };

  return (
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
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
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
              onClick={onTemplatesChange}
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
                  <Save style={{ width: "13px", height: "13px" }} />
                  <span>Save Template</span>
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
                  <Zap style={{ width: "12px", height: "12px" }} /> INSERT VARIABLE:
                </span>
                {variables.map((v) => {
                  const varText = typeof v === "string" ? v : v.variable;
                  const varDesc =
                    typeof v === "object" && v.description
                      ? v.description
                      : `Insert ${varText} at cursor`;
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
                  <Paperclip
                    style={{
                      width: "13px",
                      height: "13px",
                      color: "var(--accent-cyan)",
                    }}
                  />
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
                            ref={fileInputRef}
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
                                (m) => m.filename === e.target.value
                              );
                              if (selected) {
                                setAttachmentName(selected.display_name || selected.filename);
                                setAttachmentPath(selected.path);
                                onToast(`Attached ${selected.display_name || selected.filename}`, "success");
                              }
                            }}
                          >
                            <option value="" disabled>
                              -- Choose from {mediaList.length} uploaded PDFs --
                            </option>
                            {mediaList.map((m) => (
                              <option key={m.filename} value={m.filename}>
                                {m.display_name || m.filename} ({m.size_kb} KB)
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <label
                      htmlFor="tpl-body"
                      style={{ margin: 0, fontWeight: 600, fontSize: "0.88rem" }}
                    >
                      Email Body
                    </label>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--accent-cyan)",
                        background: "rgba(6,182,212,0.12)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontWeight: 500,
                      }}
                    >
                      HTML Output
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--bg-input)",
                      padding: "2px 3px",
                      borderRadius: "8px",
                      border: "1px solid var(--border-subtle)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setEditorMode("visual")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.74rem",
                        borderRadius: "6px",
                        border: "none",
                        background:
                          editorMode === "visual"
                            ? "var(--accent-cyan)"
                            : "transparent",
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
                        background:
                          editorMode === "html"
                            ? "var(--accent-cyan)"
                            : "transparent",
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
                      fontFamily:
                        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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

      {/* PDF Media Picker Modal */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(item) => {
          setAttachmentName(item.display_name || item.filename);
          setAttachmentPath(item.path);
          loadMediaList();
        }}
        onToast={onToast}
      />
    </div>
  );
}

export default TemplatesPanel;
