export interface DashboardSummary {
  pending: number;
  approved_this_month: number;
  denied: number;
  appeals_in_progress: number;
  urgent: number;
}

export interface Patient {
  id: string;
  name: string;
  member_id: string;
}

export interface TimelineItem {
  date: string;
  status: string;
  note: string;
}

export interface AuthorizationRequest {
  id: string;
  patient: Patient;
  health_plan: string;
  request_type: string;
  visits_requested: number;
  visits_used: number;
  visits_remaining: number;
  submitted_date: string | null;
  days_pending: number | null;
  status: string;
  appeal_deadline: string | null;
  denial_reason?: string;
  approved_visits?: number;
  doula: string;
  submission_method: string | null;
  confirmation_number: string | null;
  clinical_justification: string;
  timeline: TimelineItem[];
}

export interface DashboardData {
  summary: DashboardSummary;
  requests: AuthorizationRequest[];
  health_plans: string[];
}

// ─── Status Constants ───
export const REQUEST_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  APPEAL_SUBMITTED: 'appeal_submitted',
  APPEAL_APPROVED: 'appeal_approved',
  APPEAL_DENIED: 'appeal_denied',
} as const;

export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS];

// ─── Threshold Constants ───
export const URGENT_DAYS_THRESHOLD = 7;
export const WARNING_DAYS_THRESHOLD = 4;
export const APPEAL_DEADLINE_DAYS = 3;
export const MS_PER_DAY = 86_400_000;
export const MAX_PENDING_DAYS = 14;
