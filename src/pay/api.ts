export type PaymentMode = 'mock' | 'hyperswitch_sandbox' | 'hyperswitch_live';

export type ModeInfo = {
  mode: PaymentMode;
  available: boolean;
  reason: string;
  movesRealMoney: boolean;
};

export type PayConfig = {
  modes: ModeInfo[];
  defaultMode: PaymentMode;
  accountsEnabled: boolean;
};

export type Merchant = {
  id: string;
  email: string;
  businessName: string;
  contactPhone: string;
  liveAccess: boolean;
  status: string;
  createdAt: string;
};

export const MODE_LABELS: Record<PaymentMode, string> = {
  mock: 'Mock',
  hyperswitch_sandbox: 'Sandbox',
  hyperswitch_live: 'Live',
};

export const MODE_MEANING: Record<PaymentMode, string> = {
  mock: 'Nothing leaves this server. No bank, no UPI app, no money.',
  hyperswitch_sandbox: 'Real Hyperswitch API, test credentials. No money moves.',
  hyperswitch_live: 'Real money moves out of a real customer account.',
};

export class AuthError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/pay${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (response.status === 401) throw new AuthError('Not signed in');

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error((body as { error?: string })?.error || 'Something went wrong');
  return body as T;
}

export type RegisterInput = {
  email: string;
  password: string;
  businessName: string;
  contactPhone: string;
};

export const payApi = {
  config: () => request<PayConfig>('/config'),
  me: () => request<{ merchant: Merchant }>('/merchants/me'),
  register: (input: RegisterInput) =>
    request<{ merchant: Merchant }>('/merchants/register', { method: 'POST', body: JSON.stringify(input) }),
  login: (email: string, password: string) =>
    request<{ merchant: Merchant }>('/merchants/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>('/merchants/logout', { method: 'POST' }),
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
