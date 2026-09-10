import React, { useState, useEffect } from "react";
import {
  Zap,
  Search,
  Mail,
  Eye,
  Settings,
  Send,
  Trash2,
  Edit3,
  Sparkles,
  Save,
} from "lucide-react";
import { api } from "../../../services/api";
import type {
  EmailTemplate,
  Audience,
  QueueItem,
  SmtpAccount,
} from "../../../types/email";

export interface ReviewQueuePanelProps {
  templates: EmailTemplate[];
  audiences: Audience[];
  smtpAccounts: SmtpAccount[];
  initialTemplateId?: string;
  initialAudienceId?: string;
  onOpenSmtpModal: () => void;
  onToast: (msg: string, type?: string) => void;
}

export function ReviewQueuePanel({
  templates,
  audiences,
  smtpAccounts,
  initialTemplateId = "",
  initialAudienceId = "",
  onOpenSmtpModal,
  onToast,
}: ReviewQueuePanelProps) {
  const [queueTemplateId, setQueueTemplateId] = useState(initialTemplateId);
  const [queueAudienceId, setQueueAudienceId] = useState(initialAudienceId);
  const [queueItemSmtpId, setQueueItemSmtpId] = useState("");
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [selectedQueueItem, setSelectedQueueItem] = useState<any | null>(null);
  const [queueFilter, setQueueFilter] = useState("all");
  const [queueSearch, setQueueSearch] = useState("");

  const [generatingQueue, setGeneratingQueue] = useState(false);
  const [sendingSingleQueueId, setSendingSingleQueueId] = useState<string | null>(null);
  const [queueEditSubject, setQueueEditSubject] = useState("");
  const [queueEditCc, setQueueEditCc] = useState("");
  const [queueEditBody, setQueueEditBody] = useState("");
  const [queuePreviewMode, setQueuePreviewMode] = useState<"preview" | "edit">("preview");
  const [regeneratingAI, setRegeneratingAI] = useState(false);
  const [savingQueueDraft, setSavingQueueDraft] = useState(false);

  useEffect(() => {
    if (initialTemplateId) setQueueTemplateId(initialTemplateId);
  }, [initialTemplateId]);

  useEffect(() => {
    if (initialAudienceId) setQueueAudienceId(initialAudienceId);
  }, [initialAudienceId]);

  const loadQueue = async (status = queueFilter, search = queueSearch) => {
    setLoadingQueue(true);
    try {
      const res = await api.getQueue({ status, search });
      const items = res.data || [];
      setQueueItems(items);
      if (selectedQueueItem) {
        const updated = items.find((i: QueueItem) => i.id === selectedQueueItem.id);
        if (updated) {
          setSelectedQueueItem(updated);
          setQueueEditSubject(updated.subject);
          setQueueEditCc(updated.cc || "");
          setQueueEditBody(updated.body);
        } else if (items.length > 0) {
          setSelectedQueueItem(items[0]);
          setQueueEditSubject(items[0].subject);
          setQueueEditCc(items[0].cc || "");
          setQueueEditBody(items[0].body);
        } else {
          setSelectedQueueItem(null);
        }
      } else if (items.length > 0) {
        setSelectedQueueItem(items[0]);
        setQueueEditSubject(items[0].subject);
        setQueueEditCc(items[0].cc || "");
        setQueueEditBody(items[0].body);
      }
    } catch (e) {
      console.error("Failed to load queue:", e);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (selectedQueueItem) {
      setQueueEditSubject(selectedQueueItem.subject || "");
      setQueueEditCc(selectedQueueItem.cc || "");
      setQueueEditBody(selectedQueueItem.body || "");
      setQueueItemSmtpId(
        selectedQueueItem.smtp_account_id ||
          smtpAccounts.find((a) => a.is_default)?.id ||
          smtpAccounts[0]?.id ||
          ""
      );
    }
  }, [selectedQueueItem, smtpAccounts]);

  const handleGenerateQueue = async () => {
    if (!queueTemplateId) {
      onToast("Please select an email template first", "error");
      return;
    }
    setGeneratingQueue(true);
    try {
      const payload: any = {
        template_id: queueTemplateId,
        smtp_account_id: queueItemSmtpId || undefined,
        limit: 50,
      };

      if (queueAudienceId && queueAudienceId !== "custom") {
        payload.audience_id = queueAudienceId;
      }

      const res = await api.generateQueue(payload);
      onToast(res.message || "Queue generated successfully!", "success");
      loadQueue();
    } catch (e: any) {
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
        cc: queueEditCc.trim() || null,
        smtp_account_id: queueItemSmtpId || undefined,
      });
      onToast("Email draft updated!", "success");
      loadQueue();
    } catch (e: any) {
      onToast(e.message || "Failed to update draft", "error");
    } finally {
      setSavingQueueDraft(false);
    }
  };

  const handleSendQueueItem = async (item: any) => {
    if (!item) return;
    setSendingSingleQueueId(item.id);
    const useSmtpId = queueItemSmtpId || item.smtp_account_id;
    try {
      if (
        queueEditSubject !== item.subject ||
        queueEditBody !== (item.raw_body || item.body) ||
        queueEditCc !== (item.cc || "") ||
        (queueItemSmtpId && queueItemSmtpId !== item.smtp_account_id)
      ) {
        await api.updateQueueItem(item.id, {
          subject: queueEditSubject,
          body: queueEditBody,
          cc: queueEditCc.trim() || null,
          smtp_account_id: useSmtpId || undefined,
        });
      }

      const res = await api.sendQueueItem(item.id, {
        smtp_account_id: useSmtpId || undefined,
        cc: queueEditCc.trim() || undefined,
      });
      if (res.status === "success") {
        onToast(res.message || `Sent to ${item.recipient_email}!`, "success");
        loadQueue();
      } else {
        onToast(res.message, "error");
      }
    } catch (e: any) {
      onToast(e.message || "Failed to send email", "error");
    } finally {
      setSendingSingleQueueId(null);
    }
  };

  const handleDeleteQueueItem = async (itemId: string) => {
    try {
      await api.deleteQueueItem(itemId);
      onToast("Item removed from queue", "info");
      loadQueue();
    } catch (e: any) {
      onToast(e.message || "Failed to delete item", "error");
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
    } catch (e: any) {
      onToast(e.message || "Failed to regenerate AI", "error");
    } finally {
      setRegeneratingAI(false);
    }
  };

  const handleClearQueue = async (status = "all") => {
    if (
      !window.confirm(
        `Are you sure you want to clear ${status === "sent" ? "sent" : "all"} queue items?`
      )
    )
      return;
    try {
      const res = await api.clearQueue(status);
      onToast(res.message || "Queue cleared", "info");
      loadQueue();
    } catch (e: any) {
      onToast(e.message || "Failed to clear queue", "error");
    }
  };

  return (
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
                {audiences.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (~{a.contact_count || 0} contacts)
                  </option>
                ))}
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
                  className={`btn btn-sm ${
                    queueFilter === f ? "btn-primary" : "btn-secondary"
                  }`}
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
              queueItems.map((item: any) => {
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
                      border: `1px solid ${
                        isSelected ? "var(--accent-cyan)" : "var(--border-subtle)"
                      }`,
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
                    flexWrap: "wrap",
                  }}
                >
                  {/* Sender Account Pill Selector */}
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      background: "var(--bg-card, #ffffff)",
                      border:
                        "1px solid var(--border-color, rgba(226, 232, 240, 0.8))",
                      borderRadius: "20px",
                      padding: "2px 8px 2px 6px",
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "var(--primary-color, #6366f1)",
                        background: "rgba(99, 102, 241, 0.1)",
                        padding: "2px 8px",
                        borderRadius: "12px",
                      }}
                    >
                      <Mail style={{ width: "11px", height: "11px" }} />
                      From:
                    </span>

                    <select
                      style={{
                        border: "none",
                        background: "transparent",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-main, #0f172a)",
                        cursor: "pointer",
                        outline: "none",
                        padding: "2px 4px",
                        maxWidth: "190px",
                      }}
                      value={
                        queueItemSmtpId ||
                        smtpAccounts.find((a) => a.is_default)?.id ||
                        smtpAccounts[0]?.id ||
                        ""
                      }
                      onChange={(e) => setQueueItemSmtpId(e.target.value)}
                    >
                      {smtpAccounts.map((acc: any) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name || acc.smtp_user} ({acc.smtp_user}){" "}
                          {acc.is_default ? "★" : ""}
                        </option>
                      ))}
                      {smtpAccounts.length === 0 && (
                        <option value="">No SMTP configured</option>
                      )}
                    </select>

                    <button
                      type="button"
                      onClick={onOpenSmtpModal}
                      title="Manage SMTP Accounts"
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Settings style={{ width: "12px", height: "12px" }} />
                    </button>
                  </div>

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
                      ? selectedQueueItem.sent_at
                        ? `Sent on ${new Date(selectedQueueItem.sent_at).toLocaleTimeString()}`
                        : "Sent"
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
                  >
                    {sendingSingleQueueId === selectedQueueItem.id ? (
                      <>
                        <div
                          className="spinner"
                          style={{ width: "12px", height: "12px" }}
                        />
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
                    onClick={() => handleDeleteQueueItem(selectedQueueItem.id)}
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

              {/* Editable CC Field */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "0.78rem" }}>
                  CC Recipients{" "}
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 400 }}>
                    (optional — comma-separated)
                  </span>
                </label>
                <input
                  type="text"
                  className="eu-input"
                  placeholder="e.g. colleague@company.com, manager@company.com"
                  value={queueEditCc}
                  onChange={(e) => setQueueEditCc(e.target.value)}
                  style={{ fontSize: "0.82rem" }}
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
                    className={`btn btn-sm ${
                      queuePreviewMode === "preview"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
                    style={{ fontSize: "0.74rem", padding: "3px 10px" }}
                  >
                    <Eye style={{ width: "12px", height: "12px" }} />
                    <span>Live Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueuePreviewMode("edit")}
                    className={`btn btn-sm ${
                      queuePreviewMode === "edit"
                        ? "btn-primary"
                        : "btn-secondary"
                    }`}
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
                        <div
                          className="spinner"
                          style={{ width: "11px", height: "11px" }}
                        />
                        <span>AI Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles
                          style={{
                            width: "12px",
                            height: "12px",
                            color: "var(--accent-cyan)",
                          }}
                        />
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
                  flexWrap: "wrap",
                  gap: "10px",
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

                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    disabled={sendingSingleQueueId === selectedQueueItem.id}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewQueuePanel;
