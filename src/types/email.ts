export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TemplateVariable {
  key: string;
  label: string;
  example: string;
  category?: string;
}

export interface AttachmentItem {
  filename: string;
  display_name?: string;
  path: string;
  size_kb?: number;
  uploaded_at?: string;
  [key: string]: any;
}

export interface SmtpAccount {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  is_default: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface SmtpTestResult {
  connected: boolean;
  message: string;
}

export interface AudienceSources {
  sqlite: boolean;
  mongo: boolean;
  manual: boolean;
}

export interface Audience {
  id: string;
  name: string;
  description?: string;
  sources?: string[];
  filters?: {
    country?: string;
    category?: string;
    lead_type?: "all" | "company" | "personal" | "others" | string;
    [key: string]: any;
  };
  manual_recipients?: any[];
  selected_recipients?: any[];
  contact_count?: number;
  estimated_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface QueueItem {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  company_name?: string;
  subject: string;
  body: string;
  raw_body?: string;
  status: "draft" | "sent" | "failed" | string;
  error_message?: string;
  sent_at?: string;
  created_at?: string;
  template_id?: string;
  audience_id?: string;
  smtp_account_id?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface Campaign {
  id: string;
  name: string;
  status: "draft" | "running" | "completed" | "failed" | "stopped" | string;
  template_id?: string;
  audience_id?: string;
  audience_filter?: string;
  audience_sources?: string[];
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
  delay_seconds?: number;
  smtp_account_id?: string;
  created_at?: string;
  completed_at?: string;
  template_name?: string;
  audience_name?: string;
  [key: string]: any;
}

export interface CampaignProgress {
  campaign_id: string;
  status: string;
  progress_pct: number;
  sent_count: number;
  failed_count: number;
  total: number;
  current_recipient?: string;
  message?: string;
  [key: string]: any;
}

export interface CampaignLog {
  id: string;
  timestamp: string;
  level: "info" | "success" | "warn" | "error" | string;
  message: string;
}
