export type SubmissionStatus = 'on-time' | 'late';

export interface AttachmentMeta {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface SubmissionResponse {
  id: string;
  company: { id: string; tradeName: string; legalName: string; cnpj: string };
  referenceMonth: string; // YYYY-MM
  deliveryEmail: string;
  notes: string | null;
  submittedBy: { id: string; name: string };
  submittedAt: string;
  updatedAt: string;
  status: SubmissionStatus;
  attachments: AttachmentMeta[];
}

export interface ListSubmissionsParams {
  companyId?: string;
  status?: SubmissionStatus;
  from?: string;
  to?: string;
  search?: string;
  submittedById?: string;
  page?: number;
  limit?: number;
}

export interface CreateSubmissionPayload {
  companyId: string;
  referenceMonth: string;
  deliveryEmail: string;
  notes?: string;
}

export interface UpdateSubmissionPayload {
  referenceMonth?: string;
  deliveryEmail?: string;
  notes?: string | null;
}

// Analytics
export interface AnalyticsOverview {
  window: { from: string; to: string };
  kpis: {
    expected: number;
    onTime: number;
    late: number;
    missed: number;
    deltas?: { expected: number; onTime: number; late: number; missed: number };
  };
  monthly: Array<{
    month: string;
    expected: number;
    onTime: number;
    late: number;
    missed: number;
  }>;
}

export type ComplianceBand = 'green' | 'amber' | 'red';

export interface CompanyCompliance {
  companyId: string;
  tradeName: string;
  expected: number;
  onTime: number;
  late: number;
  missed: number;
  score: number;
  band: ComplianceBand;
}

export type HeatmapStatus = 'on-time' | 'late' | 'missed' | 'inactive';

export interface HeatmapResponse {
  months: string[];
  companies: Array<{
    companyId: string;
    tradeName: string;
    score: number;
    cells: Array<{ month: string; status: HeatmapStatus }>;
  }>;
}
