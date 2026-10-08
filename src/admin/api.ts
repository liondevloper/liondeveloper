export type EnquiryStatus = 'new' | 'contacted' | 'discussion' | 'won' | 'lost';

export type Enquiry = {
  id: number;
  name: string;
  business: string | null;
  whatsapp: string | null;
  email: string | null;
  website_type: string | null;
  budget: string | null;
  details: string | null;
  status: EnquiryStatus;
  notes: string;
  created_at: string;
};

export type DashboardData = {
  total: number;
  last_30_days: number;
  last_7_days: number;
  statusCounts: Record<EnquiryStatus, number>;
  topWebsiteType: string | null;
  recent: Enquiry[];
};

export const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  discussion: 'In discussion',
  won: 'Won',
  lost: 'Lost',
};

export const STATUS_ORDER: EnquiryStatus[] = ['new', 'contacted', 'discussion', 'won', 'lost'];

export class AuthError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (response.status === 401) throw new AuthError('Not signed in');

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error((body as { error?: string })?.error || 'Something went wrong');
  return body as T;
}

export const adminApi = {
  me: () => request<{ email: string }>('/auth/me'),
  login: (email: string, password: string) =>
    request<{ email: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  changePassword: (current: string, next: string) =>
    request<{ ok: true }>('/auth/password', { method: 'POST', body: JSON.stringify({ current, next }) }),
  dashboard: () => request<DashboardData>('/dashboard'),
  listEnquiries: (filters: { status?: EnquiryStatus | 'all'; q?: string }) => {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.q) params.set('q', filters.q);
    const query = params.toString();
    return request<Enquiry[]>(`/enquiries${query ? `?${query}` : ''}`);
  },
  updateEnquiry: (id: number, changes: { status?: EnquiryStatus; notes?: string }) =>
    request<Enquiry>(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(changes) }),
  deleteEnquiry: (id: number) => request<{ ok: true }>(`/enquiries/${id}`, { method: 'DELETE' }),
};

export function formatDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function whatsappLink(number: string | null) {
  if (!number) return null;
  const digits = number.replace(/\D/g, '');
  if (digits.length < 10) return null;
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}
