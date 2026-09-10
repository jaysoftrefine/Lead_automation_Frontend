import React from "react";
import {
  Send,
  Mail,
  Settings,
  Rocket,
  Activity,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  Save,
} from "lucide-react";
import type {
  EmailTemplate,
  SmtpAccount,
  CampaignProgress,
} from "../../../types/email";

export interface CampaignSendProgressPanelProps {
  campName: string;
  campTemplateId: string;
  campCc?: string;
  templates: EmailTemplate[];
  selectedContacts: any[];
  estimatedRecipients: number | null;
  smtpAccounts: SmtpAccount[];
  selectedCampaignSmtpId: string;
  setSelectedCampaignSmtpId: (id: string) => void;
  campDelay: number;
  setCampDelay: (delay: number) => void;
  testEmail: string;
  setTestEmail: (email: string) => void;
  onSendTest: () => void;
  sendingTest: boolean;
  onSaveDraft: () => void;
  savingDraft: boolean;
  onGeneratePreview: () => void;
  loadingPreview: boolean;
  onLaunchCampaign: () => void;
  launching: boolean;
  editingCampaignId: string | null;
  onNavigateToCreate: () => void;
  onOpenSmtpModal: () => void;
  campaignProgress: CampaignProgress | null;
}

export function CampaignSendProgressPanel({
  campName,
  campTemplateId,
  campCc = "",
  templates,
  selectedContacts,
  estimatedRecipients,
  smtpAccounts,
  selectedCampaignSmtpId,
  setSelectedCampaignSmtpId,
  campDelay,
  setCampDelay,
  testEmail,
  setTestEmail,
  onSendTest,
  sendingTest,
  onSaveDraft,
  savingDraft,
  onGeneratePreview,
  loadingPreview,
  onLaunchCampaign,
  launching,
  editingCampaignId,
  onNavigateToCreate,
  onOpenSmtpModal,
  campaignProgress,
}: CampaignSendProgressPanelProps) {
  const selectedTemplate = templates.find((t) => t.id === campTemplateId);

  return (
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
            onClick={onNavigateToCreate}
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
                  {selectedTemplate?.name || "None selected"}
                </strong>
              </span>
              <span>
                👥 Target:{" "}
                <strong style={{ color: "var(--accent-emerald)" }}>
                  {selectedContacts.length > 0
                    ? `${selectedContacts.length} selected contacts`
                    : estimatedRecipients !== null
                    ? `~${estimatedRecipients} recipients`
                    : "Calculated at dispatch"}
                </strong>
              </span>
              {(campCc || selectedTemplate?.cc) && (
                <span>
                  ✉️ CC:{" "}
                  <strong style={{ color: "var(--accent-violet)" }}>
                    {campCc || selectedTemplate?.cc}
                  </strong>
                </span>
              )}
            </div>
          </div>

          {/* Outgoing Mail Account (Sender Selection) */}
          <div className="form-group">
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
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  margin: 0,
                }}
              >
                <Mail
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "var(--accent-cyan)",
                  }}
                />
                <span>Send From (Outgoing SMTP Account)</span>
              </label>
              <button
                type="button"
                onClick={onOpenSmtpModal}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--accent-cyan)",
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: 0,
                }}
              >
                <Settings style={{ width: "12px", height: "12px" }} />
                <span>Manage Accounts</span>
              </button>
            </div>
            {smtpAccounts.length > 0 ? (
              <select
                className="eu-input"
                value={
                  selectedCampaignSmtpId ||
                  smtpAccounts.find((a) => a.is_default)?.id ||
                  smtpAccounts[0]?.id ||
                  ""
                }
                onChange={(e) => setSelectedCampaignSmtpId(e.target.value)}
              >
                {smtpAccounts.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} — {acc.smtp_user}{" "}
                    {acc.is_default ? "★ (Default)" : ""} ({acc.smtp_host})
                  </option>
                ))}
              </select>
            ) : (
              <div
                onClick={onOpenSmtpModal}
                style={{
                  padding: "8px 12px",
                  borderRadius: "var(--radius-sm)",
                  background: "rgba(244, 63, 94, 0.1)",
                  border: "1px dashed rgba(244, 63, 94, 0.4)",
                  color: "#fb7185",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>⚠ No SMTP accounts configured. Click to add one.</span>
                <span style={{ fontWeight: 700 }}>+ Add SMTP</span>
              </div>
            )}
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-dim)",
                marginTop: "4px",
              }}
            >
              Campaign emails will be dispatched using this email account.
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
              <option value={3.0}>3.0s (Conservative — ~20 emails/min)</option>
            </select>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-dim)",
                marginTop: "4px",
              }}
            >
              Adjust spacing between consecutive emails to preserve high inbox
              deliverability.
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
                onClick={onSendTest}
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
              onClick={onSaveDraft}
              className="btn btn-secondary btn-large"
              style={{ flex: 0.6, minWidth: "140px" }}
            >
              <Save style={{ width: "16px", height: "16px" }} />
              <span>
                {savingDraft
                  ? "Saving..."
                  : editingCampaignId
                  ? "Update Draft"
                  : "Save Draft"}
              </span>
            </button>
            <button
              type="button"
              disabled={loadingPreview}
              onClick={onGeneratePreview}
              className="btn btn-secondary btn-large"
              style={{ flex: 0.8, minWidth: "170px" }}
            >
              <Eye
                style={{
                  width: "16px",
                  height: "16px",
                  color: "var(--accent-cyan)",
                }}
              />
              <span>{loadingPreview ? "Generating..." : "Preview Emails"}</span>
            </button>
            <button
              type="button"
              disabled={launching}
              onClick={onLaunchCampaign}
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
                  <span>
                    {editingCampaignId
                      ? "Update & Launch Campaign"
                      : "Launch Bulk Outreach Campaign"}
                  </span>
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
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              className={`pulse-dot ${
                campaignProgress && campaignProgress.status === "running"
                  ? "running"
                  : ""
              }`}
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
          {!campaignProgress ? (
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
                left. Progress and delivery status will animate here in real-time.
              </p>
            </div>
          ) : (
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
                  {(campaignProgress as any).name || campName}
                </h3>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Template: {(campaignProgress as any).template_name || selectedTemplate?.name}
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
                    {(campaignProgress.sent_count || (campaignProgress as any).sent || 0) +
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
                          (((campaignProgress.sent_count || (campaignProgress as any).sent || 0) +
                            (campaignProgress.failed_count || 0)) /
                            Math.max(campaignProgress.total || 1, 1)) *
                            100
                        )
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
                  <span>
                    {campaignProgress.sent_count || (campaignProgress as any).sent || 0} Sent
                  </span>
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
  );
}

export default CampaignSendProgressPanel;
