const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function fetchJson(url, options = {}) {
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

// ─────────────────────────────────────────────
// Pipeline & Scraper API
// ─────────────────────────────────────────────

export const api = {
  // Stats
  getStats: () => fetchJson("/api/stats"),

  // Pipeline
  startPipeline: (payload) =>
    fetchJson("/api/pipeline/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getPipelineStatus: () => fetchJson("/api/pipeline/status"),
  stopPipeline: () => fetchJson("/api/pipeline/stop", { method: "POST" }),

  // Leads (MongoDB)
  getLeads: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/leads${q ? `?${q}` : ""}`);
  },

  // Instant Agent Lab
  runAgentResearch: (payload) =>
    fetchJson("/api/instant-research", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // EU Startups
  getEUStats: () => fetchJson("/api/eu-startups/stats"),
  getEUOptions: () => fetchJson("/api/eu-startups/options"),
  getEUStartups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/eu-startups/startups${q ? `?${q}` : ""}`);
  },
  discoverEUStartups: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/eu-startups/discover${q ? `?${q}` : ""}`, {
      method: "POST",
    });
  },
  enrichEUStartup: (startupId) =>
    fetchJson(`/api/eu-startups/startups/${startupId}/enrich`, {
      method: "POST",
    }),

  // Email Marketing & Campaigns
  getEmailVariables: () => fetchJson("/api/email/templates/variables"),
  getTemplates: () => fetchJson("/api/email/templates"),
  getTemplate: (id) => fetchJson(`/api/email/templates/${id}`),
  createTemplate: (payload) =>
    fetchJson("/api/email/templates", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTemplate: (id, payload) =>
    fetchJson(`/api/email/templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteTemplate: (id) =>
    fetchJson(`/api/email/templates/${id}`, { method: "DELETE" }),
  previewTemplate: (id) =>
    fetchJson(`/api/email/templates/${id}/preview`, { method: "POST" }),
  previewRawTemplate: (payload) =>
    fetchJson("/api/email/templates/preview-raw", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // PDF Attachment Upload
  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/email/attachments/upload`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.message || "Failed to upload attachment.");
    }
    return data;
  },

  sendTestEmail: (payload) =>
    fetchJson("/api/email/send-test", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // SMTP Configuration
  getSMTPConfig: () => fetchJson("/api/email/smtp/config"),
  saveSMTPConfig: (payload) =>
    fetchJson("/api/email/smtp/config", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  testSMTP: (payload) =>
    fetchJson("/api/email/smtp/test", {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    }),

  // Bulk Campaigns
  getCampaigns: () => fetchJson("/api/email/campaigns"),
  createCampaign: (payload) =>
    fetchJson("/api/email/campaigns", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateCampaign: (id, payload) =>
    fetchJson(`/api/email/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  launchCampaignById: (id) =>
    fetchJson(`/api/email/campaigns/${id}/launch`, {
      method: "POST",
    }),
  deleteCampaign: (id) =>
    fetchJson(`/api/email/campaigns/${id}`, {
      method: "DELETE",
    }),
  previewGeneratedCampaign: (payload) =>
    fetchJson("/api/email/campaigns/preview-generated", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  estimateRecipients: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/campaigns/estimate${q ? `?${q}` : ""}`);
  },
  getCampaign: (id) => fetchJson(`/api/email/campaigns/${id}`),
  getCampaignLogs: (id, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/campaigns/${id}/logs${q ? `?${q}` : ""}`);
  },

  // Audiences (Recipient Lists)
  getAudiences: () => fetchJson("/api/email/audiences"),
  createAudience: (payload) =>
    fetchJson("/api/email/audiences", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAudience: (id) => fetchJson(`/api/email/audiences/${id}`),
  updateAudience: (id, payload) =>
    fetchJson(`/api/email/audiences/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteAudience: (id) =>
    fetchJson(`/api/email/audiences/${id}`, {
      method: "DELETE",
    }),

  // 1-by-1 Review Queue
  generateQueue: (payload) =>
    fetchJson("/api/email/queue/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getQueue: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return fetchJson(`/api/email/queue${q ? `?${q}` : ""}`);
  },
  getQueueItem: (id) => fetchJson(`/api/email/queue/${id}`),
  updateQueueItem: (id, payload) =>
    fetchJson(`/api/email/queue/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  sendQueueItem: (id) =>
    fetchJson(`/api/email/queue/${id}/send`, {
      method: "POST",
    }),
  deleteQueueItem: (id) =>
    fetchJson(`/api/email/queue/${id}`, {
      method: "DELETE",
    }),
  clearQueue: (status = "all") =>
    fetchJson(`/api/email/queue/clear?status=${encodeURIComponent(status)}`, {
      method: "POST",
    }),
};
