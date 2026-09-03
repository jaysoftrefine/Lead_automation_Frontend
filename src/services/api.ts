const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function fetchJson<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export function getPipelineWsUrl(): string {
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (apiBase) {
    const wsProto = apiBase.startsWith("https") ? "wss:" : "ws:";
    const host = apiBase.replace(/^https?:\/\//, "");
    return `${wsProto}//${host}/api/pipeline/ws`;
  }
  const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProto}//${window.location.host}/api/pipeline/ws`;
}

// ─────────────────────────────────────────────
// Pipeline & Scraper API
// ─────────────────────────────────────────────

export const api = {
  // Health & System
  checkHealth: () => fetchJson<{ status: string; database: any }>("/api/health"),

  // Stats
  getStats: () => fetchJson("/api/stats"),

  // Pipeline
  startPipeline: (payload: any) =>
    fetchJson("/api/pipeline/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPipelineStatus: () => fetchJson("/api/pipeline/status"),
  getPipelineWsUrl,
  stopPipeline: () => fetchJson("/api/pipeline/stop", { method: "POST" }),

  // Leads
  getLeads: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/leads${q ? `?${q}` : ""}`);
  },
  createManualLead: (payload: any) =>
    fetchJson("/api/leads/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Instant Agent Lab
  runAgentResearch: (payload: any) =>
    fetchJson("/api/instant-research", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // EU Startups
  getEUStats: () => fetchJson("/api/eu-startups/stats"),
  getEUOptions: () => fetchJson("/api/eu-startups/options"),
  getEUStartups: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/eu-startups/startups${q ? `?${q}` : ""}`);
  },
  createManualStartup: (payload: any) =>
    fetchJson("/api/eu-startups/manual", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  discoverEUStartups: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/eu-startups/discover${q ? `?${q}` : ""}`, {
      method: "POST",
    });
  },
  enrichEUStartup: (startupId: string | number) =>
    fetchJson(`/api/eu-startups/startups/${startupId}/enrich`, {
      method: "POST",
    }),

  // Email Marketing & Campaigns
  getEmailVariables: () => fetchJson("/api/email/templates/variables"),
  getTemplates: () => fetchJson("/api/email/templates"),
  getTemplate: (id: string | number) => fetchJson(`/api/email/templates/${id}`),
  createTemplate: (payload: any) =>
    fetchJson("/api/email/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTemplate: (id: string | number, payload: any) =>
    fetchJson(`/api/email/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTemplate: (id: string | number) =>
    fetchJson(`/api/email/templates/${id}`, { method: "DELETE" }),
  previewTemplate: (id: string | number) =>
    fetchJson(`/api/email/templates/${id}/preview`, { method: "POST" }),
  previewRawTemplate: (payload: any) =>
    fetchJson("/api/email/templates/preview-raw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PDF Attachment Upload
  uploadAttachment: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    let res: Response;
    try {
      res = await fetch("/api/email/attachments/upload", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      const url = API_BASE ? `${API_BASE}/api/email/attachments/upload` : "/api/email/attachments/upload";
      res = await fetch(url, {
        method: "POST",
        body: formData,
      });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.message || "Failed to upload attachment.");
    }
    return data;
  },

  getAttachments: () => fetchJson("/api/email/attachments"),

  sendTestEmail: (payload: any) =>
    fetchJson("/api/email/send-test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // SMTP Configuration
  getSMTPConfig: () => fetchJson("/api/email/smtp/config"),
  saveSMTPConfig: (payload: any) =>
    fetchJson("/api/email/smtp/config", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  testSMTP: (payload?: any) =>
    fetchJson("/api/email/smtp/test", {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  // Bulk Campaigns
  getCampaigns: () => fetchJson("/api/email/campaigns"),
  createCampaign: (payload: any) =>
    fetchJson("/api/email/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCampaign: (id: string | number, payload: any) =>
    fetchJson(`/api/email/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  launchCampaignById: (id: string | number) =>
    fetchJson(`/api/email/campaigns/${id}/launch`, {
      method: "POST",
    }),
  deleteCampaign: (id: string | number) =>
    fetchJson(`/api/email/campaigns/${id}`, {
      method: "DELETE",
    }),
  previewGeneratedCampaign: (payload: any) =>
    fetchJson("/api/email/campaigns/preview-generated", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  estimateRecipients: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/campaigns/estimate${q ? `?${q}` : ""}`);
  },
  getCampaign: (id: string | number) => fetchJson(`/api/email/campaigns/${id}`),
  getCampaignLogs: (id: string | number, params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/campaigns/${id}/logs${q ? `?${q}` : ""}`);
  },

  // Audiences (Recipient Lists)
  getAudiences: () => fetchJson("/api/email/audiences"),
  createAudience: (payload: any) =>
    fetchJson("/api/email/audiences", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAudience: (id: string | number) => fetchJson(`/api/email/audiences/${id}`),
  updateAudience: (id: string | number, payload: any) =>
    fetchJson(`/api/email/audiences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAudience: (id: string | number) =>
    fetchJson(`/api/email/audiences/${id}`, {
      method: "DELETE",
    }),
  browseRecipients: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/recipients/browse${q ? `?${q}` : ""}`);
  },

  // 1-by-1 Review Queue
  generateQueue: (payload: any) =>
    fetchJson("/api/email/queue/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getQueue: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/queue${q ? `?${q}` : ""}`);
  },
  getQueueItem: (id: string | number) => fetchJson(`/api/email/queue/${id}`),
  updateQueueItem: (id: string | number, payload: any) =>
    fetchJson(`/api/email/queue/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  regenerateQueueItemAI: (id: string | number) =>
    fetchJson(`/api/email/queue/${id}/regenerate-ai`, {
      method: "POST",
    }),
  sendQueueItem: (id: string | number) =>
    fetchJson(`/api/email/queue/${id}/send`, {
      method: "POST",
    }),
  deleteQueueItem: (id: string | number) =>
    fetchJson(`/api/email/queue/${id}`, {
      method: "DELETE",
    }),
  clearQueue: (status = "all") =>
    fetchJson(`/api/email/queue/clear?status=${encodeURIComponent(status)}`, {
      method: "POST",
    }),
};
