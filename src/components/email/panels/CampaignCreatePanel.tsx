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
  PlusCircle,
  Trash2,
  GitBranch,
  Bell,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import type { EmailTemplate, Audience } from "../../../types/email";

export interface SequenceStepDraft {
  template_id: string;
  days_after: number;
}

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
  onSaveDraft: (opts?: { sequenceMode: boolean; steps: SequenceStepDraft[]; reminderEmail: string; reminderHoursBefore: number }) => void;
  savingDraft: boolean;
  onGeneratePreview: () => void;
  loadingPreview: boolean;
  onProceedToSend: () => void;
  onLaunchCampaign: (opts?: { sequenceMode: boolean; steps: SequenceStepDraft[]; reminderEmail: string; reminderHoursBefore: number }) => void;
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

  // ── Sequence Campaign State ──────────────────────────────────
  const [sequenceMode, setSequenceMode] = useState(false);
  const [steps, setSteps] = useState<SequenceStepDraft[]>([
    { template_id: "", days_after: 0 },
    { template_id: "", days_after: 7 },
  ]);
  const [reminderEmail, setReminderEmail] = useState("");
  const [reminderHoursBefore, setReminderHoursBefore] = useState(24);

  const addStep = () => {
    const lastDays = steps.length > 0 ? steps[steps.length - 1].days_after : 0;
    setSteps([...steps, { template_id: "", days_after: lastDays + 7 }]);
  };

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== idx));
  };

  const updateStep = (idx: number, field: keyof SequenceStepDraft, value: string | number) => {
    setSteps(steps.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    if (idx === 0 && field === "template_id") {
      setCampTemplateId(value as string);
    }
  };

  const handleToggleSequence = () => {
    setSequenceMode((prev) => {
      const next = !prev;
      if (next) {
        // If enabling sequence mode and top-level template is selected, seed step 0
        if (campTemplateId && (!steps[0] || !steps[0].template_id)) {
          setSteps((prevSteps) => {
            const copy = [...prevSteps];
            if (copy[0]) {
              copy[0] = { ...copy[0], template_id: campTemplateId };
            }
            return copy;
          });
        } else if (steps[0]?.template_id) {
          setCampTemplateId(steps[0].template_id);
        }
      }
      return next;
    });
  };

  const seqOpts = { sequenceMode, steps, reminderEmail, reminderHoursBefore };
  // ────────────────────────────────────────────────────────────

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

          {/* Select Email Template (Disabled / grayed out in Sequence mode) */}
          <div
            className="form-group"
            style={{
              opacity: sequenceMode ? 0.45 : 1,
              transition: "opacity 0.2s ease",
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
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label
                  htmlFor="camp-template"
                  style={{
                    margin: 0,
                    color: sequenceMode ? "var(--text-muted)" : undefined,
                  }}
                >
                  Select Email Template
                </label>
                {sequenceMode && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      background: "rgba(99,102,241,0.15)",
                      color: "var(--accent-violet)",
                      fontWeight: 600,
                    }}
                  >
                    Disabled (Configured in sequence below)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onNavigateToTemplates}
                disabled={sequenceMode}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  background: sequenceMode ? "rgba(255, 255, 255, 0.04)" : "rgba(99, 102, 241, 0.1)",
                  border: `1px solid ${sequenceMode ? "rgba(255, 255, 255, 0.08)" : "rgba(99, 102, 241, 0.25)"}`,
                  borderRadius: "6px",
                  padding: "3px 8px",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: sequenceMode ? "var(--text-muted)" : "var(--accent-violet)",
                  cursor: sequenceMode ? "not-allowed" : "pointer",
                  transition: "all 0.15s ease",
                }}
                title={sequenceMode ? "Manage Templates disabled in single-template view (see Sequence below)" : "Go to Saved Templates Directory"}
              >
                <BookOpen style={{ width: "12px", height: "12px" }} />
                <span>Manage Templates →</span>
              </button>
            </div>
            <select
              id="camp-template"
              value={campTemplateId}
              disabled={sequenceMode}
              onChange={(e) => setCampTemplateId(e.target.value)}
              style={{
                cursor: sequenceMode ? "not-allowed" : "pointer",
                background: sequenceMode ? "rgba(255, 255, 255, 0.02)" : undefined,
                color: sequenceMode ? "var(--text-muted)" : undefined,
              }}
            >
              {sequenceMode ? (
                <option value="">— Configured per step in Sequence below —</option>
              ) : (
                <>
                  <option value="">— Choose a saved template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}{" "}
                      {t.attachment_name ? `(📎 with ${t.attachment_name})` : ""}
                    </option>
                  ))}
                </>
              )}
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

          {/* ── Sequence / Drip Campaign Toggle ─────────────────────── */}
          <div
            style={{
              margin: "1rem 0 0",
              padding: "14px 16px",
              borderRadius: "12px",
              background: sequenceMode
                ? "rgba(99,102,241,0.1)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${sequenceMode ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
              transition: "all 0.2s ease",
            }}
          >
            {/* Toggle row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
              }}
              onClick={handleToggleSequence}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <GitBranch
                  style={{
                    width: "15px",
                    height: "15px",
                    color: sequenceMode ? "var(--accent-violet)" : "var(--text-muted)",
                  }}
                />
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    color: sequenceMode ? "var(--accent-violet)" : "var(--text-secondary)",
                  }}
                >
                  Email Sequence (Drip Campaign)
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    padding: "2px 7px",
                    borderRadius: "99px",
                    background: "rgba(99,102,241,0.15)",
                    color: "var(--accent-violet)",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  NEW
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {sequenceMode && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToTemplates();
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(99, 102, 241, 0.3)",
                      borderRadius: "6px",
                      padding: "2px 7px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      color: "var(--accent-violet)",
                      cursor: "pointer",
                    }}
                    title="Go to Saved Templates Directory"
                  >
                    <BookOpen style={{ width: "11px", height: "11px" }} />
                    <span>Manage Templates →</span>
                  </button>
                )}
                {sequenceMode ? (
                  <ToggleRight style={{ width: "26px", height: "26px", color: "var(--accent-violet)" }} />
                ) : (
                  <ToggleLeft style={{ width: "26px", height: "26px", color: "var(--text-muted)" }} />
                )}
              </div>
            </div>

            {!sequenceMode && (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: "0.77rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                Enable to send multiple follow-up emails on different days with different templates.
              </p>
            )}

            {/* Step Builder — only shown when sequence mode is ON */}
            {sequenceMode && (
              <div style={{ marginTop: "14px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr 110px 32px",
                        gap: "8px",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      {/* Step badge */}
                      <div
                        style={{
                          width: "22px",
                          height: "22px",
                          borderRadius: "50%",
                          background: idx === 0 ? "var(--accent-violet)" : "rgba(99,102,241,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "#fff",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </div>

                      {/* Template picker */}
                      <select
                        value={step.template_id}
                        onChange={(e) => updateStep(idx, "template_id", e.target.value)}
                        style={{ fontSize: "0.82rem" }}
                      >
                        <option value="">— Template —</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>

                      {/* Day picker */}
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input
                          type="number"
                          min={0}
                          value={step.days_after}
                          onChange={(e) => updateStep(idx, "days_after", parseInt(e.target.value) || 0)}
                          style={{
                            width: "54px",
                            fontSize: "0.82rem",
                            textAlign: "center",
                            padding: "6px 4px",
                          }}
                        />
                        <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                          {idx === 0 ? "day 0" : `day${step.days_after !== 1 ? "s" : ""} after`}
                        </span>
                      </div>

                      {/* Remove step */}
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        disabled={steps.length <= 1}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: steps.length <= 1 ? "not-allowed" : "pointer",
                          color: steps.length <= 1 ? "var(--text-muted)" : "#f87171",
                          padding: "4px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="Remove this step"
                      >
                        <Trash2 style={{ width: "14px", height: "14px" }} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Step */}
                <button
                  type="button"
                  onClick={addStep}
                  style={{
                    marginTop: "10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "var(--accent-violet)",
                    background: "rgba(99,102,241,0.1)",
                    border: "1px dashed rgba(99,102,241,0.4)",
                    borderRadius: "8px",
                    padding: "7px 14px",
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  <PlusCircle style={{ width: "14px", height: "14px" }} />
                  Add Follow-up Step
                </button>

                {/* Reminder Email */}
                <div
                  style={{
                    marginTop: "14px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px" }}>
                    <Bell style={{ width: "13px", height: "13px", color: "var(--accent-amber)" }} />
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--accent-amber)" }}>
                      Reminder Notifications
                    </span>
                  </div>
                  <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.5 }}>
                    Get an email alert before each step fires — so you can review the audience and cancel if needed.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: "8px" }}>
                    <input
                      type="email"
                      className="eu-input"
                      placeholder="your@email.com"
                      value={reminderEmail}
                      onChange={(e) => setReminderEmail(e.target.value)}
                      style={{ fontSize: "0.83rem" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <input
                        type="number"
                        min={1}
                        max={168}
                        className="eu-input"
                        value={reminderHoursBefore}
                        onChange={(e) => setReminderHoursBefore(parseInt(e.target.value) || 24)}
                        style={{ fontSize: "0.83rem", textAlign: "center" }}
                      />
                      <span style={{ fontSize: "0.73rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>h before</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                onClick={() => onSaveDraft(seqOpts)}
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
                  if (sequenceMode) {
                    const missingStep = steps.findIndex((s) => !s.template_id);
                    if (missingStep !== -1) {
                      onToast(`Please select a template for Step ${missingStep + 1} in the sequence`, "error");
                      return;
                    }
                  } else {
                    if (!campTemplateId) {
                      onToast("Please select an email template", "error");
                      return;
                    }
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
              onClick={() => onLaunchCampaign(seqOpts)}
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
                background: sequenceMode
                  ? steps.every((s) => s.template_id)
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(245,158,11,0.1)"
                  : campTemplateId
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(255,255,255,0.04)",
                border: `1px solid ${
                  sequenceMode
                    ? steps.every((s) => s.template_id)
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(245,158,11,0.3)"
                    : campTemplateId
                      ? "rgba(16,185,129,0.3)"
                      : "var(--border-subtle)"
                }`,
                fontSize: "0.74rem",
              }}
            >
              <div
                style={{ color: "var(--text-muted)", fontSize: "0.68rem" }}
              >
                {sequenceMode ? "Sequence Steps" : "Email Template"}
              </div>
              <div
                style={{
                  fontWeight: 600,
                  color: sequenceMode
                    ? steps.every((s) => s.template_id)
                      ? "#10b981"
                      : "#f59e0b"
                    : campTemplateId
                      ? "#10b981"
                      : "var(--text-dim)",
                  marginTop: "2px",
                }}
              >
                {sequenceMode
                  ? steps.every((s) => s.template_id)
                    ? `✓ All ${steps.length} Steps Ready`
                    : `⚠ ${steps.filter((s) => s.template_id).length}/${steps.length} Steps Ready`
                  : campTemplateId
                    ? "✓ Selected"
                    : "⚠ Choose"}
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
                {campSources.sqlite ||
                campSources.mongo ||
                campSources.manual ||
                selectedContacts.length > 0
                  ? "✓ Sources Set"
                  : "⚠ Unselected"}
              </div>
            </div>
          </div>

          {/* Template Content Preview Box / Sequence Timeline Preview */}
          {!sequenceMode && campTemplateId ? (
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
                          /\{\{(ai_company_hook_temp1|temp1_ai_company_hook|ai_company_hook)\}\}/g,
                          "your engineering talent platform for tech leaders"
                        )
                        .replace(
                          /\{\{(ai_value_pitch_temp1|temp1_ai_value_pitch|ai_value_pitch)\}\}/g,
                          "scaling autonomous AI workflows and backend systems"
                        )
                        .replace(
                          /\{\{(ai_company_hook_temp2|temp2_ai_company_hook)\}\}/g,
                          "following up on how we can support your tech initiatives"
                        )
                        .replace(
                          /\{\{(ai_value_pitch_temp2|temp2_ai_value_pitch)\}\}/g,
                          "sharing case studies and exploring tailored engineering collaboration"
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
          ) : sequenceMode ? (
            /* ── Sequence Timeline Preview ──────────────────────────────── */
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                background: "rgba(99,102,241,0.04)",
                borderRadius: "var(--radius-md)",
                border: "1px solid rgba(99,102,241,0.2)",
                overflowY: "auto",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <GitBranch style={{ width: "16px", height: "16px", color: "var(--accent-violet)" }} />
                <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--accent-violet)" }}>
                  Sequence Timeline
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                  {steps.length} step{steps.length !== 1 ? "s" : ""} · {
                    steps.length > 0
                      ? `${steps[steps.length - 1].days_after} days total`
                      : "0 days"
                  }
                </span>
              </div>

              {/* Timeline items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {steps.map((step, idx) => {
                  const tpl = templates.find(t => t.id === step.template_id);
                  const today = new Date();
                  const fireDate = new Date(today);
                  fireDate.setDate(today.getDate() + step.days_after);
                  const dateLabel = step.days_after === 0
                    ? "Today · Fires immediately"
                    : fireDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  const reminderDate = new Date(fireDate);
                  reminderDate.setDate(fireDate.getDate() - 1);
                  const reminderLabel = reminderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " @ 4:00 PM";

                  const isFirst = idx === 0;
                  const isLast  = idx === steps.length - 1;

                  return (
                    <div key={idx}>
                      {/* Reminder row (skip for day 0) */}
                      {step.days_after > 0 && reminderEmail && (
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          {/* connector */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                            <div style={{ width: "2px", height: "18px", background: "rgba(251,191,36,0.3)" }} />
                            <div style={{
                              width: "22px", height: "22px", borderRadius: "50%",
                              background: "rgba(251,191,36,0.15)",
                              border: "1px solid rgba(251,191,36,0.4)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <Bell style={{ width: "10px", height: "10px", color: "var(--accent-amber)" }} />
                            </div>
                            <div style={{ width: "2px", height: "18px", background: "rgba(251,191,36,0.3)" }} />
                          </div>
                          {/* content */}
                          <div style={{ paddingBottom: "0", paddingTop: "18px" }}>
                            <div style={{ fontSize: "0.72rem", color: "var(--accent-amber)", fontWeight: 700 }}>
                              {reminderLabel}
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                              Reminder → {reminderEmail}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step row */}
                      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                        {/* connector + badge */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}>
                          {!isFirst && <div style={{ width: "2px", height: step.days_after > 0 ? "0" : "16px", background: "rgba(99,102,241,0.3)" }} />}
                          <div style={{
                            width: "28px", height: "28px", borderRadius: "50%",
                            background: isFirst ? "var(--accent-violet)" : "rgba(99,102,241,0.25)",
                            border: `2px solid ${isFirst ? "var(--accent-violet)" : "rgba(99,102,241,0.5)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.72rem", fontWeight: 700, color: "#fff",
                            flexShrink: 0,
                          }}>
                            {idx + 1}
                          </div>
                          {!isLast && <div style={{ width: "2px", flex: 1, minHeight: "20px", background: "rgba(99,102,241,0.3)" }} />}
                        </div>

                        {/* Step card */}
                        <div style={{
                          flex: 1,
                          marginBottom: "10px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          background: isFirst ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${isFirst ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-primary)" }}>
                              {tpl?.name || <span style={{ color: "var(--text-muted)", fontWeight: 400, fontStyle: "italic" }}>— No template selected —</span>}
                            </span>
                            {isFirst
                              ? <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: "99px", background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>Sends Now</span>
                              : <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: "99px", background: "rgba(99,102,241,0.15)", color: "var(--accent-violet)", fontWeight: 700 }}>{dateLabel}</span>
                            }
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            {isFirst ? "Day 0 · Fires immediately on launch" : `Day ${step.days_after} after launch · ${dateLabel}`}
                          </div>
                          {tpl?.subject && (
                            <div style={{ fontSize: "0.73rem", color: "var(--text-dim)", marginTop: "4px", opacity: 0.7 }}>
                              Subject: {tpl.subject}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary footer */}
              <div style={{
                marginTop: "auto",
                paddingTop: "16px",
                borderTop: "1px solid rgba(99,102,241,0.15)",
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}>
                <div>📬 Step 1 fires the moment you click <strong>Launch</strong></div>
                {reminderEmail && <div>🔔 Reminder emails → <strong style={{ color: "var(--accent-amber)" }}>{reminderEmail}</strong> at 4pm the day before each step</div>}
                {!reminderEmail && <div style={{ opacity: 0.6 }}>💡 Add a reminder email above to get notified before each step sends</div>}
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
