import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Clock,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Zap,
  Calendar,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Mail,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { api } from "../../../services/api";
import { Modal } from "../../common/Modal";
import type { Campaign, SequenceStepItem, EmailTemplate } from "../../../types/email";

export interface SequenceScheduleModalProps {
  campaign: Campaign | null;
  templates: EmailTemplate[];
  onClose: () => void;
  onToast?: (msg: string, type?: string) => void;
  onCampaignUpdated?: () => void;
}

export function SequenceScheduleModal({
  campaign,
  templates,
  onClose,
  onToast,
  onCampaignUpdated,
}: SequenceScheduleModalProps) {
  const [steps, setSteps] = useState<SequenceStepItem[]>([]);
  const [campaignData, setCampaignData] = useState<Campaign | null>(campaign);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Inline editing state for a step
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>("");
  const [editDaysAfter, setEditDaysAfter] = useState<number>(0);
  const [editTemplateId, setEditTemplateId] = useState<string>("");
  const [editSubject, setEditSubject] = useState<string>("");

  const loadSteps = async () => {
    if (!campaign) return;
    setLoading(true);
    try {
      const res = await api.getCampaignSteps(campaign.id);
      setSteps(res.data || []);
      if (res.campaign) {
        setCampaignData(res.campaign);
      }
    } catch (e: any) {
      if (onToast) onToast(e.message || "Failed to load sequence steps", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCampaignData(campaign);
    if (campaign) {
      loadSteps();
    }
  }, [campaign]);

  if (!campaign) return null;

  // Format date helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Relative time helper
  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const target = new Date(isoString).getTime();
      const now = Date.now();
      const diffMs = target - now;

      if (isNaN(target)) return "";

      if (diffMs < -60000) {
        const minsAgo = Math.floor(Math.abs(diffMs) / 60000);
        if (minsAgo < 60) return `${minsAgo}m ago`;
        const hoursAgo = Math.floor(minsAgo / 60);
        if (hoursAgo < 24) return `${hoursAgo}h ago`;
        return `${Math.floor(hoursAgo / 24)}d ago`;
      }

      if (diffMs <= 60000 && diffMs >= -60000) {
        return "Due now";
      }

      const totalMins = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMins / (24 * 60));
      const hours = Math.floor((totalMins % (24 * 60)) / 60);
      const mins = totalMins % 60;

      if (days > 0) {
        return hours > 0 ? `in ${days}d ${hours}h` : `in ${days}d`;
      }
      if (hours > 0) {
        return mins > 0 ? `in ${hours}h ${mins}m` : `in ${hours}h`;
      }
      return `in ${mins}m`;
    } catch {
      return "";
    }
  };

  // Convert ISO string to input datetime-local string (YYYY-MM-DDTHH:mm)
  const toLocalInputFormat = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  };

  // Toggle step status (pause / resume / skip / restore)
  const handleSetStepStatus = async (stepId: string, newStatus: string) => {
    setActionLoading(stepId);
    try {
      await api.updateCampaignStep(campaign.id, stepId, { status: newStatus });
      if (onToast) {
        const label =
          newStatus === "paused"
            ? "Step paused. This email will NOT be sent."
            : newStatus === "pending"
            ? "Step resumed. Email will send on schedule."
            : newStatus === "skipped"
            ? "Step marked as skipped."
            : "Step updated.";
        onToast(label, "success");
      }
      await loadSteps();
      if (onCampaignUpdated) onCampaignUpdated();
    } catch (e: any) {
      if (onToast) onToast(e.message || "Failed to update step", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Fire step immediately
  const handleFireNow = async (step: SequenceStepItem) => {
    const confirm = window.confirm(
      `Send Step #${step.step_number} ("${step.template_name || "Template"}") immediately right now to all campaign recipients?`
    );
    if (!confirm) return;

    setActionLoading(`fire_${step.id}`);
    try {
      await api.fireSequenceStepNow(campaign.id, step.id);
      if (onToast) onToast(`Step #${step.step_number} triggered! Dispatching emails now.`, "success");
      await loadSteps();
      if (onCampaignUpdated) onCampaignUpdated();
    } catch (e: any) {
      if (onToast) onToast(e.message || "Failed to trigger step", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Start inline editing
  const startEditing = (step: SequenceStepItem) => {
    setEditingStepId(step.id);
    setEditDate(toLocalInputFormat(step.scheduled_at));
    setEditDaysAfter(step.days_after || 0);
    setEditTemplateId(step.template_id);
    setEditSubject(step.subject || "");
  };

  const cancelEditing = () => {
    setEditingStepId(null);
  };

  // Save inline edits
  const saveStepEdit = async (stepId: string) => {
    setActionLoading(`save_${stepId}`);
    try {
      const payload: any = {
        days_after: editDaysAfter,
        template_id: editTemplateId,
        subject: editSubject,
      };
      if (editDate) {
        payload.scheduled_at = new Date(editDate).toISOString();
      }

      await api.updateCampaignStep(campaign.id, stepId, payload);
      if (onToast) onToast("Step schedule and template updated successfully!", "success");
      setEditingStepId(null);
      await loadSteps();
      if (onCampaignUpdated) onCampaignUpdated();
    } catch (e: any) {
      if (onToast) onToast(e.message || "Failed to save step changes", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle Campaign Global Pause
  const handleToggleCampaignPause = async () => {
    if (!campaignData) return;
    setActionLoading("global_pause");
    try {
      const res = await api.toggleCampaignPause(campaignData.id);
      setCampaignData(res.data);
      if (onToast) onToast(res.message || "Campaign pause state updated", "success");
      await loadSteps();
      if (onCampaignUpdated) onCampaignUpdated();
    } catch (e: any) {
      if (onToast) onToast(e.message || "Failed to toggle pause", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const isCampaignPaused = campaignData?.status === "paused";
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const pendingSteps = steps.filter((s) => s.status === "pending" || s.status === "paused");
  const nextStep = pendingSteps.length > 0 ? pendingSteps[0] : null;

  return (
    <Modal
      isOpen={!!campaign}
      onClose={onClose}
      maxWidth="860px"
      maxHeight="88vh"
      title={campaignData?.name || campaign.name}
      subtitle="Email Sequence (Drip Campaign) — Fire Schedule & Step Controls"
      icon={<span className="platform-badge"><GitBranch style={{ width: "12px", height: "12px", display: "inline-block", marginRight: "4px" }} /> Drip Manager</span>}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>Auto-checked by sequence scheduler</span>
            <button
              onClick={loadSteps}
              disabled={loading}
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", fontSize: "0.74rem" }}
              title="Refresh sequence state"
            >
              <RefreshCw style={{ width: "11px", height: "11px" }} className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
          >
            Done
          </button>
        </div>
      }
    >
      <div style={{ padding: "0 1.25rem 1.25rem" }}>
        {/* Top Status & Overview Banner */}
        <div
          style={{
            background: "rgba(99, 102, 241, 0.05)",
            border: "1px solid rgba(99, 102, 241, 0.18)",
            borderRadius: "10px",
            padding: "14px 18px",
            marginBottom: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  padding: "3px 9px",
                  borderRadius: "99px",
                  background: isCampaignPaused
                    ? "rgba(245, 158, 11, 0.15)"
                    : campaignData?.status === "completed"
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(99, 102, 241, 0.15)",
                  color: isCampaignPaused
                    ? "var(--accent-amber)"
                    : campaignData?.status === "completed"
                    ? "#10b981"
                    : "var(--accent-violet)",
                  border: `1px solid ${
                    isCampaignPaused
                      ? "rgba(245, 158, 11, 0.3)"
                      : campaignData?.status === "completed"
                      ? "rgba(16, 185, 129, 0.3)"
                      : "rgba(99, 102, 241, 0.3)"
                  }`,
                }}
              >
                {isCampaignPaused ? "⏸️ Sequence Paused" : `● ${campaignData?.status || "Scheduled"}`}
              </span>
              <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-primary)" }}>
                {completedCount} of {steps.length} Steps Dispatched
              </span>
            </div>

            <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock style={{ width: "13px", height: "13px", color: "var(--accent-primary)" }} />
              {nextStep ? (
                <span>
                  Next Mail: <strong>Step #{nextStep.step_number}</strong>{" "}
                  {nextStep.status === "paused" ? (
                    <span style={{ color: "var(--accent-amber)", fontWeight: 600 }}>(Currently Paused)</span>
                  ) : (
                    <span>
                      fires <strong>{formatRelativeTime(nextStep.scheduled_at)}</strong> ({formatDateTime(nextStep.scheduled_at)})
                    </span>
                  )}
                </span>
              ) : (
                <span style={{ color: "#10b981", fontWeight: 600 }}>
                  ✓ All sequence emails have finished sending.
                </span>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={handleToggleCampaignPause}
              disabled={actionLoading === "global_pause"}
              className={`btn btn-sm ${isCampaignPaused ? "btn-primary" : "btn-secondary"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.78rem",
              }}
              title={isCampaignPaused ? "Resume this entire sequence" : "Pause this entire sequence"}
            >
              {isCampaignPaused ? (
                <>
                  <Play style={{ width: "12px", height: "12px" }} /> Resume Sequence
                </>
              ) : (
                <>
                  <Pause style={{ width: "12px", height: "12px" }} /> Pause Sequence
                </>
              )}
            </button>
          </div>
        </div>

        {/* Steps List / Timeline */}
        {loading && steps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div className="spinner" style={{ margin: "0 auto 10px" }} />
            <span style={{ color: "var(--text-muted)" }}>Loading sequence schedule...</span>
          </div>
        ) : steps.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)" }}>
            <p>No sequence steps configured for this campaign.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {steps.map((step) => {
              const isEditing = editingStepId === step.id;
              const isStepPaused = step.status === "paused";
              const isStepCompleted = step.status === "completed";
              const isStepRunning = step.status === "running";
              const isStepSkipped = step.status === "skipped";
              const isStepPending = step.status === "pending";

              return (
                <div
                  key={step.id}
                  style={{
                    background: isStepCompleted
                      ? "rgba(16, 185, 129, 0.03)"
                      : isStepPaused
                      ? "rgba(245, 158, 11, 0.04)"
                      : isStepRunning
                      ? "rgba(59, 130, 246, 0.05)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: `1px solid ${
                      isStepCompleted
                        ? "rgba(16, 185, 129, 0.2)"
                        : isStepPaused
                        ? "rgba(245, 158, 11, 0.3)"
                        : isStepRunning
                        ? "rgba(59, 130, 246, 0.3)"
                        : "rgba(255, 255, 255, 0.09)"
                    }`,
                    borderRadius: "10px",
                    padding: "14px 16px",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Left: Step Badge, Status, Delay */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "0.84rem",
                          color: "var(--text-primary)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        Step {step.step_number}
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {step.days_after === 0 ? "Immediate (Launch)" : `+${step.days_after} day(s) after start`}
                        </span>
                      </span>

                      {/* Status Pill */}
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "99px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: isStepCompleted
                            ? "rgba(16, 185, 129, 0.15)"
                            : isStepRunning
                            ? "rgba(59, 130, 246, 0.15)"
                            : isStepPaused
                            ? "rgba(245, 158, 11, 0.15)"
                            : isStepSkipped
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(99, 102, 241, 0.15)",
                          color: isStepCompleted
                            ? "#10b981"
                            : isStepRunning
                            ? "#3b82f6"
                            : isStepPaused
                            ? "var(--accent-amber)"
                            : isStepSkipped
                            ? "var(--text-muted)"
                            : "var(--accent-violet)",
                          border: `1px solid ${
                            isStepCompleted
                              ? "rgba(16, 185, 129, 0.3)"
                              : isStepRunning
                              ? "rgba(59, 130, 246, 0.3)"
                              : isStepPaused
                              ? "rgba(245, 158, 11, 0.3)"
                              : "rgba(99, 102, 241, 0.3)"
                          }`,
                        }}
                      >
                        {isStepCompleted && <CheckCircle2 style={{ width: "11px", height: "11px" }} />}
                        {isStepRunning && <Zap style={{ width: "11px", height: "11px" }} />}
                        {isStepPaused && <Pause style={{ width: "11px", height: "11px" }} />}
                        {isStepSkipped && <SkipForward style={{ width: "11px", height: "11px" }} />}
                        {isStepPending && <Clock style={{ width: "11px", height: "11px" }} />}
                        {isStepPaused
                          ? "⏸️ Paused (Will NOT Send)"
                          : isStepCompleted
                          ? `✓ Completed (${step.sent_count || 0} sent)`
                          : isStepRunning
                          ? "⚡ Sending Now"
                          : isStepSkipped
                          ? "Skipped"
                          : "Scheduled"}
                      </span>
                    </div>

                    {/* Right: Actions Bar for Step */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      {!isStepCompleted && !isStepRunning && (
                        <>
                          {/* Option to send next mail or not: Toggle Pause/Resume */}
                          {isStepPaused ? (
                            <button
                              onClick={() => handleSetStepStatus(step.id, "pending")}
                              disabled={actionLoading === step.id}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "0.74rem", padding: "4px 9px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              title="Resume sending: this email will fire as scheduled"
                            >
                              <Play style={{ width: "11px", height: "11px" }} /> Enable / Send
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStepStatus(step.id, "paused")}
                              disabled={actionLoading === step.id}
                              className="btn btn-secondary btn-sm"
                              style={{
                                fontSize: "0.74rem",
                                padding: "4px 9px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "var(--accent-amber)",
                                borderColor: "rgba(245, 158, 11, 0.4)",
                              }}
                              title="Do not send: Pause this email step so it won't fire"
                            >
                              <Pause style={{ width: "11px", height: "11px" }} /> Don't Send (Pause)
                            </button>
                          )}

                          {/* Skip Step */}
                          {!isStepSkipped ? (
                            <button
                              onClick={() => handleSetStepStatus(step.id, "skipped")}
                              disabled={actionLoading === step.id}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.74rem", padding: "4px 8px", color: "var(--text-muted)" }}
                              title="Skip this step entirely"
                            >
                              <SkipForward style={{ width: "11px", height: "11px" }} /> Skip
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSetStepStatus(step.id, "pending")}
                              disabled={actionLoading === step.id}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: "0.74rem", padding: "4px 8px" }}
                              title="Restore this skipped step"
                            >
                              <RotateCcw style={{ width: "11px", height: "11px" }} /> Restore
                            </button>
                          )}

                          {/* Fire Step Immediately (Send Now) */}
                          <button
                            onClick={() => handleFireNow(step)}
                            disabled={actionLoading === `fire_${step.id}`}
                            className="btn btn-secondary btn-sm"
                            style={{
                              fontSize: "0.74rem",
                              padding: "4px 9px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              color: "var(--accent-violet)",
                              borderColor: "rgba(99, 102, 241, 0.4)",
                            }}
                            title="Send this step right now without waiting for scheduled time"
                          >
                            <Zap style={{ width: "11px", height: "11px" }} /> Send Now
                          </button>

                          {/* Edit Schedule / Template Toggle */}
                          <button
                            onClick={() => (isEditing ? cancelEditing() : startEditing(step))}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: "0.74rem", padding: "4px 8px" }}
                            title="Edit fire schedule or email template"
                          >
                            <Edit3 style={{ width: "11px", height: "11px" }} /> {isEditing ? "Cancel" : "Edit"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Normal Info View */}
                  {!isEditing ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", marginTop: "6px" }}>
                      <div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "2px" }}>Template & Subject:</div>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Mail style={{ width: "12px", height: "12px", color: "var(--accent-violet)" }} />
                          {step.template_name || "Custom / Untitled Template"}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Subject: {step.subject || "—"}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginBottom: "2px" }}>
                          {isStepCompleted ? "Fired At:" : "Scheduled Fire Time:"}
                        </div>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600, color: isStepPaused ? "var(--accent-amber)" : "var(--text-primary)" }}>
                          {isStepCompleted ? (
                            <span>{formatDateTime(step.fired_at || step.updated_at)}</span>
                          ) : (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <span>{formatDateTime(step.scheduled_at)}</span>
                              {!isStepPaused && !isStepSkipped && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    background: "rgba(99, 102, 241, 0.12)",
                                    color: "var(--accent-violet)",
                                    fontWeight: 700,
                                  }}
                                >
                                  {formatRelativeTime(step.scheduled_at)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {isStepPaused && (
                          <div style={{ fontSize: "0.72rem", color: "var(--accent-amber)", marginTop: "2px" }}>
                            Sending is currently PAUSED. Click "Enable / Send" when ready to fire.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Inline Edit View */
                    <div
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        background: "rgba(0, 0, 0, 0.2)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    >
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--accent-violet)", marginBottom: "8px" }}>
                        Edit Step #{step.step_number} Schedule & Template
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "8px" }}>
                        <div>
                          <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                            Specific Fire Date & Time:
                          </label>
                          <input
                            type="datetime-local"
                            className="input-field"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            style={{ fontSize: "0.8rem", padding: "5px 8px", width: "100%" }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                            Delay in Days from Campaign Start:
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={365}
                            className="input-field"
                            value={editDaysAfter}
                            onChange={(e) => setEditDaysAfter(parseInt(e.target.value) || 0)}
                            style={{ fontSize: "0.8rem", padding: "5px 8px", width: "100%" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                            Select Email Template:
                          </label>
                          <select
                            className="input-field"
                            value={editTemplateId}
                            onChange={(e) => {
                              setEditTemplateId(e.target.value);
                              const tpl = templates.find((t) => t.id === e.target.value);
                              if (tpl) setEditSubject(tpl.subject);
                            }}
                            style={{ fontSize: "0.8rem", padding: "5px 8px", width: "100%" }}
                          >
                            {templates.map((tpl) => (
                              <option key={tpl.id} value={tpl.id}>
                                {tpl.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "block", marginBottom: "3px" }}>
                            Subject Line:
                          </label>
                          <input
                            type="text"
                            className="input-field"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            placeholder="Email subject..."
                            style={{ fontSize: "0.8rem", padding: "5px 8px", width: "100%" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: "0.74rem", padding: "4px 10px" }}
                        >
                          <X style={{ width: "11px", height: "11px" }} /> Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => saveStepEdit(step.id)}
                          disabled={actionLoading === `save_${step.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "0.74rem", padding: "4px 12px" }}
                        >
                          <Check style={{ width: "11px", height: "11px" }} /> Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default SequenceScheduleModal;
