import React, { useState } from "react";
import {
  Rocket,
  Save,
  Eye,
  ArrowRight,
  BookOpen,
  Users,
  Paperclip,
  Code,
  Send,
  FileText,
} from "lucide-react";
import type { EmailTemplate, Audience } from "../../../types/email";

export interface CampaignCreatePanelProps {
  campName: string;
  setCampName: (name: string) => void;
  campTemplateId: string;
  setCampTemplateId: (id: string) => void;
  campAudienceId: string;
  setCampAudienceId: (id: string) => void;
  campSources: { sqlite: boolean; mongo: boolean; manual: boolean };
  selectedContacts: any[];
  templates: EmailTemplate[];
  audiences: Audience[];
  editingCampaignId: string | null;
  onCancelEdit: () => void;
  onNavigateToTemplates: () => void;
  onNavigateToAudiences: () => void;
  onAudienceSelected: (aud: Audience) => void;
  onClearAudienceSelection: () => void;
  onSaveDraft: () => void;
  savingDraft: boolean;
  onGeneratePreview: () => void;
  loadingPreview: boolean;
  onProceedToSend: () => void;
  onLaunchCampaign: () => void;
  launching: boolean;
  testEmail: string;
  setTestEmail: (email: string) => void;
  onSendTest: () => void;
  sendingTest: boolean;
  onToast: (msg: string, type?: string) => void;
}

export function CampaignCreatePanel({
  campName,
  setCampName,
  campTemplateId,
  setCampTemplateId,
  campAudienceId,
  setCampAudienceId,
  campSources,
  selectedContacts,
  templates,
  audiences,
  editingCampaignId,
  onCancelEdit,
  onNavigateToTemplates,
  onNavigateToAudiences,
  onAudienceSelected,
  onClearAudienceSelection,
  onSaveDraft,
  savingDraft,
  onGeneratePreview,
  loadingPreview,
  onProceedToSend,
  onLaunchCampaign,
  launching,
  testEmail,
  setTestEmail,
  onSendTest,
  sendingTest,
  onToast,
}: CampaignCreatePanelProps) {
  const [bulkPreviewMode, setBulkPreviewMode] = useState<"rendered" | "source">("rendered");

  const selectedTemplate = templates.find((t) => t.id === campTemplateId);

  return (
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
              onClick={onCancelEdit}
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
            <span style={{ color: "var(--text-muted)", fontSize: "0.76rem" }}>
              ID: {editingCampaignId.slice(0, 8)}...
            </span>
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
                onClick={onNavigateToTemplates}
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
                  {t.attachment_name ? `(📎 with ${t.attachment_name})` : ""}
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
                onClick={onNavigateToAudiences}
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
                  onAudienceSelected(aud);
                } else {
                  onClearAudienceSelection();
                }
              }}
            >
              <option value="">— Select a saved audience —</option>
              {audiences.map((a: any) => (
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
                onClick={onSaveDraft}
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
                onClick={onGeneratePreview}
                className="btn btn-preview-email"
                style={{
                  height: "44px",
                  fontSize: "0.85rem",
                  borderRadius: "10px",
                }}
              >
                <Eye style={{ width: "16px", height: "16px" }} />
                <span>
                  {loadingPreview ? "Generating..." : "Preview Generated Emails"}
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
                  onProceedToSend();
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
              onClick={onLaunchCampaign}
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
            onClick={onGeneratePreview}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: "0.76rem" }}
            title="Preview real emails generated for audience"
          >
            <Eye
              style={{
                width: "12px",
                height: "12px",
                color: "var(--accent-cyan)",
              }}
            />
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
                border: `1px solid ${
                  campName.trim()
                    ? "rgba(16,185,129,0.3)"
                    : "var(--border-subtle)"
                }`,
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
                border: `1px solid ${
                  campTemplateId
                    ? "rgba(16,185,129,0.3)"
                    : "var(--border-subtle)"
                }`,
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
                border: `1px solid ${
                  campSources.sqlite ||
                  campSources.mongo ||
                  campSources.manual ||
                  selectedContacts.length > 0
                    ? "rgba(16,185,129,0.3)"
                    : "var(--border-subtle)"
                }`,
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
                    selectedContacts.length > 0 ||
                    campSources.sqlite ||
                    campSources.mongo ||
                    campSources.manual
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
                  {selectedTemplate?.name || "Template"}
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
                  {(selectedTemplate?.subject || "(No subject)")
                    .replace(/\{\{company_name\}\}/g, "StackShift")
                    .replace(/\{\{name\}\}/g, "John Doe")}
                </div>
              </div>

              {selectedTemplate?.attachment_name && (
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
                    Attachment: {selectedTemplate.attachment_name}
                  </span>
                </div>
              )}

              {/* Email Body: Real Mail Client Preview */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
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
                      className={`btn btn-sm ${
                        bulkPreviewMode === "rendered"
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
                      style={{ fontSize: "0.72rem", padding: "2px 8px" }}
                    >
                      <Eye style={{ width: "11px", height: "11px" }} />
                      <span>Email View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkPreviewMode("source")}
                      className={`btn btn-sm ${
                        bulkPreviewMode === "source"
                          ? "btn-primary"
                          : "btn-secondary"
                      }`}
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
                        selectedTemplate?.body || "<p>(Empty body)</p>"
                      )
                        .replace(/\{\{name\}\}/g, "John Doe")
                        .replace(/\{\{company_name\}\}/g, "StackShift")
                        .replace(/\{\{first_name\}\}/g, "John")
                        .replace(/\{\{email\}\}/g, "john@stackshift.com")
                        .replace(/\{\{website\}\}/g, "https://stackshift.com")
                        .replace(
                          /\{\{ai_company_hook\}\}/g,
                          "your engineering talent platform for tech leaders"
                        )
                        .replace(
                          /\{\{ai_value_pitch\}\}/g,
                          "scaling autonomous AI workflows and backend systems"
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
                    {selectedTemplate?.body || "(Empty body)"}
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
                  <span
                    style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}
                  >
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
                    onClick={onSendTest}
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
                  >
                    {sendingTest ? (
                      <>
                        <div
                          className="spinner"
                          style={{ width: "12px", height: "12px" }}
                        />
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
  );
}

export default CampaignCreatePanel;
