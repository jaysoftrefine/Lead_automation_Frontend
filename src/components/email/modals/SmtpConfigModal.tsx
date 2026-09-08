import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Mail,
  Star,
  Edit3,
  Trash2,
  Zap,
  CheckCircle2,
  XCircle,
  Save,
  X,
} from "lucide-react";
import { api } from "../../../services/api";
import type { SmtpAccount, SmtpTestResult } from "../../../types/email";
import { Modal } from "../../common/Modal";

export interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
  onAccountsUpdated?: (accounts: SmtpAccount[]) => void;
}

export function SmtpConfigModal({
  isOpen,
  onClose,
  onToast,
  onAccountsUpdated,
}: SmtpConfigModalProps) {
  const [smtpModalMode, setSmtpModalMode] = useState<"list" | "add" | "edit">("list");
  const [smtpAccounts, setSmtpAccounts] = useState<SmtpAccount[]>([]);
  const [loadingSmtpAccounts, setLoadingSmtpAccounts] = useState(false);
  const [editingSmtpAccountId, setEditingSmtpAccountId] = useState<string | null>(null);

  // Form Fields
  const [smtpAccountName, setSmtpAccountName] = useState("");
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState<number | string>(587);
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("HirePilot AI");
  const [smtpUseSSL, setSmtpUseSSL] = useState(false);
  const [smtpUseTLS, setSmtpUseTLS] = useState(true);
  const [smtpIsDefault, setSmtpIsDefault] = useState(false);

  // Testing States
  const [smtpTestResult, setSmtpTestResult] = useState<SmtpTestResult | null>(null);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingAccountId, setTestingAccountId] = useState<string | null>(null);
  const [accountTestResults, setAccountTestResults] = useState<
    Record<string, { ok: boolean; msg: string }>
  >({});

  const resetSmtpForm = () => {
    setEditingSmtpAccountId(null);
    setSmtpAccountName("");
    setSmtpHost("smtp.gmail.com");
    setSmtpPort(587);
    setSmtpUser("");
    setSmtpPass("");
    setSmtpFromName("HirePilot AI");
    setSmtpUseSSL(false);
    setSmtpUseTLS(true);
    setSmtpIsDefault(false);
    setSmtpTestResult(null);
  };

  const loadSmtpAccounts = async () => {
    setLoadingSmtpAccounts(true);
    try {
      const res = await api.getSMTPAccounts();
      const list = res.data || [];
      setSmtpAccounts(list);
      if (onAccountsUpdated) onAccountsUpdated(list);
    } catch (e) {
      console.error("Failed to load SMTP accounts:", e);
    } finally {
      setLoadingSmtpAccounts(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSmtpModalMode("list");
      resetSmtpForm();
      loadSmtpAccounts();
    }
  }, [isOpen]);

  const handleEditSmtpAccount = (acc: SmtpAccount) => {
    setEditingSmtpAccountId(acc.id);
    setSmtpAccountName(acc.name || "");
    setSmtpHost(acc.host || (acc as any).smtp_host || "smtp.gmail.com");
    setSmtpPort(acc.port || (acc as any).smtp_port || 587);
    setSmtpUser(acc.user || (acc as any).smtp_user || "");
    setSmtpPass(""); // empty keeps existing password
    setSmtpFromName(acc.from_name || "HirePilot AI");
    setSmtpUseSSL(!!acc.use_ssl);
    setSmtpUseTLS(!!acc.use_tls);
    setSmtpIsDefault(!!acc.is_default);
    setSmtpTestResult(null);
    setSmtpModalMode("edit");
  };

  const handleApplyProviderPreset = (provider: string) => {
    if (provider === "gmail") {
      setSmtpHost("smtp.gmail.com");
      setSmtpPort(587);
      setSmtpUseSSL(false);
      setSmtpUseTLS(true);
    } else if (provider === "outlook") {
      setSmtpHost("smtp.office365.com");
      setSmtpPort(587);
      setSmtpUseSSL(false);
      setSmtpUseTLS(true);
    } else if (provider === "sendgrid") {
      setSmtpHost("smtp.sendgrid.net");
      setSmtpPort(587);
      setSmtpUseSSL(false);
      setSmtpUseTLS(true);
    } else if (provider === "ses") {
      setSmtpHost("email-smtp.us-east-1.amazonaws.com");
      setSmtpPort(587);
      setSmtpUseSSL(false);
      setSmtpUseTLS(true);
    }
  };

  const handleSaveSmtpAccount = async () => {
    if (!smtpHost.trim() || !smtpUser.trim()) {
      if (onToast) onToast("SMTP Host and Email Address are required", "error");
      return;
    }
    if (!editingSmtpAccountId && !smtpPass.trim()) {
      if (onToast) onToast("SMTP App Password is required for new accounts", "error");
      return;
    }

    try {
      const payload = {
        name: smtpAccountName.trim() || smtpUser.trim(),
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(String(smtpPort), 10) || 587,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        from_name: smtpFromName.trim() || "HirePilot AI",
        use_ssl: smtpUseSSL,
        use_tls: smtpUseTLS,
        is_default: smtpIsDefault,
      };

      if (editingSmtpAccountId) {
        await api.updateSMTPAccount(editingSmtpAccountId, payload);
        if (onToast) onToast("SMTP account updated successfully!", "success");
      } else {
        await api.createSMTPAccount(payload);
        if (onToast) onToast("New SMTP account added successfully!", "success");
      }

      await loadSmtpAccounts();
      setSmtpModalMode("list");
      resetSmtpForm();
    } catch (e: any) {
      if (onToast) onToast(e.message, "error");
    }
  };

  const handleDeleteSmtpAccount = async (accId: string) => {
    if (!window.confirm("Are you sure you want to remove this SMTP account?")) return;
    try {
      await api.deleteSMTPAccount(accId);
      if (onToast) onToast("SMTP account removed.", "info");
      await loadSmtpAccounts();
    } catch (e: any) {
      if (onToast) onToast(e.message, "error");
    }
  };

  const handleSetDefaultSmtpAccount = async (accId: string) => {
    try {
      await api.setDefaultSMTPAccount(accId);
      if (onToast) onToast("Default outgoing SMTP account updated!", "success");
      await loadSmtpAccounts();
    } catch (e: any) {
      if (onToast) onToast(e.message, "error");
    }
  };

  const handleTestSpecificAccount = async (accId: string) => {
    setTestingAccountId(accId);
    try {
      const res = await api.testSMTPAccount(accId);
      setAccountTestResults((prev) => ({
        ...prev,
        [accId]: { ok: res.connected, msg: res.message },
      }));
      if (res.connected) {
        if (onToast) onToast(`Connection verified for ${res.smtp_user}!`, "success");
      } else {
        if (onToast) onToast(`Connection failed: ${res.message}`, "error");
      }
    } catch (e: any) {
      setAccountTestResults((prev) => ({
        ...prev,
        [accId]: { ok: false, msg: e.message },
      }));
      if (onToast) onToast(e.message, "error");
    } finally {
      setTestingAccountId(null);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSMTP({
        smtp_host: smtpHost.trim(),
        smtp_port: parseInt(String(smtpPort), 10) || 587,
        smtp_user: smtpUser.trim(),
        smtp_pass: smtpPass,
        from_name: smtpFromName.trim() || "HirePilot AI",
        use_ssl: smtpUseSSL,
        use_tls: smtpUseTLS,
      });
      setSmtpTestResult(res);
    } catch (e: any) {
      setSmtpTestResult({
        message: e.message || "Failed to test credentials",
        connected: false,
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={smtpModalMode === "list" ? "680px" : "580px"}
      maxHeight="90vh"
      title={
        smtpModalMode === "list"
          ? "Outgoing SMTP Accounts"
          : smtpModalMode === "edit"
          ? "Edit SMTP Account"
          : "Connect New SMTP Account"
      }
      subtitle={
        smtpModalMode === "list"
          ? "Manage email senders for bulk campaigns and manual 1-by-1 review queue"
          : "Configure sender credentials (e.g. Gmail App Password, Outlook, or Custom SMTP)"
      }
      icon={
        smtpModalMode !== "list" ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: "4px 8px" }}
            onClick={() => {
              setSmtpModalMode("list");
              resetSmtpForm();
            }}
            title="Back to Accounts List"
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} />
          </button>
        ) : (
          <span
            className="platform-badge"
            style={{ color: "#f59e0b", borderColor: "#f59e0b" }}
          >
            ⚙ Outgoing Mail
          </span>
        )
      }
    >
      <div
        style={{
          overflowY: "auto",
          padding: "1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        {smtpModalMode === "list" ? (
          /* --- LIST VIEW --- */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                Configured Accounts ({smtpAccounts.length})
              </span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  resetSmtpForm();
                  setSmtpModalMode("add");
                }}
                style={{ gap: "4px" }}
              >
                <Plus style={{ width: "14px", height: "14px" }} />
                <span>Add Sender Account</span>
              </button>
            </div>

            {loadingSmtpAccounts ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "var(--text-muted)",
                }}
              >
                <RefreshCw
                  style={{
                    width: "20px",
                    height: "20px",
                    margin: "0 auto 8px",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <p style={{ fontSize: "0.85rem" }}>Loading SMTP accounts...</p>
              </div>
            ) : smtpAccounts.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  border: "1px dashed var(--border-color)",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Mail
                  style={{
                    width: "32px",
                    height: "32px",
                    color: "var(--text-muted)",
                    margin: "0 auto 8px",
                  }}
                />
                <h4
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    marginBottom: "4px",
                  }}
                >
                  No Outgoing Accounts Configured
                </h4>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    marginBottom: "1rem",
                  }}
                >
                  Add an email address and SMTP server to start sending cold outreach campaigns.
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    resetSmtpForm();
                    setSmtpModalMode("add");
                  }}
                >
                  <Plus style={{ width: "14px", height: "14px" }} />
                  <span>Add First Account</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {smtpAccounts.map((acc: any) => {
                  const isTestingThis = testingAccountId === acc.id;
                  const testRes = accountTestResults[acc.id];
                  const userStr = acc.smtp_user || acc.user || "";
                  const hostStr = acc.smtp_host || acc.host || "";
                  const portNum = acc.smtp_port || acc.port || 587;
                  return (
                    <div
                      key={acc.id}
                      style={{
                        padding: "0.85rem 1rem",
                        borderRadius: "8px",
                        border: `1px solid ${
                          acc.is_default
                            ? "rgba(99,102,241,0.5)"
                            : "var(--border-color)"
                        }`,
                        background: acc.is_default
                          ? "rgba(99,102,241,0.06)"
                          : "rgba(255,255,255,0.02)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.6rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: acc.is_default
                                ? "rgba(99,102,241,0.2)"
                                : "rgba(255,255,255,0.06)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: acc.is_default ? "#818cf8" : "var(--text-muted)",
                              fontWeight: 700,
                              fontSize: "0.85rem",
                              flexShrink: 0,
                            }}
                          >
                            {acc.from_name
                              ? acc.from_name.charAt(0).toUpperCase()
                              : userStr
                              ? userStr.charAt(0).toUpperCase()
                              : "M"}
                          </div>
                          <div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: "0.92rem",
                                  color: "var(--text-main)",
                                }}
                              >
                                {acc.name || userStr}
                              </span>
                              {acc.is_default && (
                                <span
                                  style={{
                                    fontSize: "0.68rem",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(99,102,241,0.25)",
                                    color: "#818cf8",
                                    fontWeight: 600,
                                    border: "1px solid rgba(99,102,241,0.4)",
                                  }}
                                >
                                  DEFAULT SENDER
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.82rem",
                                color: "var(--text-muted)",
                                marginTop: "2px",
                              }}
                            >
                              <span>{userStr}</span>
                              {acc.from_name && (
                                <span style={{ opacity: 0.75 }}>
                                  {" "}
                                  &bull; &ldquo;{acc.from_name}&rdquo;
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                                marginTop: "3px",
                                opacity: 0.7,
                              }}
                            >
                              {hostStr}:{portNum} &bull;{" "}
                              {acc.use_ssl
                                ? "SSL"
                                : acc.use_tls
                                ? "STARTTLS"
                                : "Plain"}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {!acc.is_default && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                              onClick={() => handleSetDefaultSmtpAccount(acc.id)}
                              title="Make this the default sender account"
                            >
                              <Star
                                style={{
                                  width: "11px",
                                  height: "11px",
                                  marginRight: "3px",
                                }}
                              />
                              Make Default
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: "4px 8px" }}
                            onClick={() => handleEditSmtpAccount(acc)}
                            title="Edit settings"
                          >
                            <Edit3 style={{ width: "13px", height: "13px" }} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: "4px 8px",
                              color: "var(--color-danger, #ef4444)",
                            }}
                            onClick={() => handleDeleteSmtpAccount(acc.id)}
                            title="Remove account"
                          >
                            <Trash2 style={{ width: "13px", height: "13px" }} />
                          </button>
                        </div>
                      </div>

                      {/* Test Row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: "4px",
                          borderTop: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            fontSize: "0.74rem",
                            padding: "2px 8px",
                            gap: "4px",
                          }}
                          disabled={isTestingThis}
                          onClick={() => handleTestSpecificAccount(acc.id)}
                        >
                          <Zap style={{ width: "11px", height: "11px" }} />
                          <span>{isTestingThis ? "Testing..." : "Test Connection"}</span>
                        </button>

                        {testRes && (
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              color: testRes.ok ? "#10b981" : "#fb7185",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {testRes.ok ? (
                              <CheckCircle2
                                style={{ width: "12px", height: "12px" }}
                              />
                            ) : (
                              <XCircle style={{ width: "12px", height: "12px" }} />
                            )}
                            <span>{testRes.ok ? "Verified" : testRes.msg}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* --- ADD / EDIT VIEW --- */
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {/* Provider Presets */}
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "6px",
                }}
              >
                Quick Provider Presets:
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[
                  { key: "gmail", label: "Gmail (App Password)" },
                  { key: "outlook", label: "Outlook / 365" },
                  { key: "sendgrid", label: "SendGrid" },
                  { key: "ses", label: "Amazon SES" },
                ].map((prov) => (
                  <button
                    key={prov.key}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                    onClick={() => handleApplyProviderPreset(prov.key)}
                  >
                    {prov.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Account Label / Friendly Name</label>
              <input
                type="text"
                className="eu-input"
                placeholder="e.g., Outreach Inbox, Sales Primary, Info"
                value={smtpAccountName}
                onChange={(e) => setSmtpAccountName(e.target.value)}
              />
            </div>

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
              <label>
                App Password / SMTP Password{" "}
                {editingSmtpAccountId && (
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    (leave blank to keep current password)
                  </span>
                )}
              </label>
              <input
                type="password"
                className="eu-input"
                placeholder={
                  editingSmtpAccountId
                    ? "•••••••••••• (unchanged)"
                    : "Enter app password"
                }
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>From Display Name (Seen by Recipients)</label>
              <input
                type="text"
                className="eu-input"
                placeholder="HirePilot AI or Your Name"
                value={smtpFromName}
                onChange={(e) => setSmtpFromName(e.target.value)}
              />
            </div>

            <div className="form-row">
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={smtpUseSSL}
                  onChange={(e) => {
                    setSmtpUseSSL(e.target.checked);
                    if (e.target.checked) setSmtpUseTLS(false);
                  }}
                />
                <span className="chip-content">SSL (Port 465)</span>
              </label>
              <label className="checkbox-chip">
                <input
                  type="checkbox"
                  checked={smtpUseTLS}
                  onChange={(e) => {
                    setSmtpUseTLS(e.target.checked);
                    if (e.target.checked) setSmtpUseSSL(false);
                  }}
                />
                <span className="chip-content">STARTTLS (Port 587)</span>
              </label>
            </div>

            <div style={{ marginTop: "4px" }}>
              <label className="checkbox-chip" style={{ display: "inline-flex" }}>
                <input
                  type="checkbox"
                  checked={smtpIsDefault}
                  onChange={(e) => setSmtpIsDefault(e.target.checked)}
                />
                <span className="chip-content">Set as Primary Default Sender</span>
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
                  border: `1px solid ${
                    smtpTestResult.connected
                      ? "rgba(16,185,129,0.3)"
                      : "rgba(244,63,94,0.3)"
                  }`,
                }}
              >
                {smtpTestResult.message}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                <span>{testingSmtp ? "Testing..." : "Test Credentials"}</span>
              </button>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setSmtpModalMode("list");
                    resetSmtpForm();
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSmtpAccount}
                  className="btn btn-primary btn-sm"
                >
                  <Save style={{ width: "13px", height: "13px" }} />
                  <span>
                    {editingSmtpAccountId ? "Update Account" : "Save Account"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SmtpConfigModal;
