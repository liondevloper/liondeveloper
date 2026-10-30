import type { SiteContent } from '../data/site';
import { MAX_VIDEO_MB, publicVideoUrl, SUPABASE_ANON_KEY, SUPABASE_URL, VIDEO_BUCKET, VIDEO_TYPES } from '../data/storage';

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

// Fired when the server says the session is gone (expired, or signed out after a password change elsewhere).
export const SIGNED_OUT_EVENT = 'admin:signed-out';

// These answer 401 for a wrong password, which must not sign the admin out.
const PASSWORD_CHECK_PATHS = ['/auth/login', '/auth/password'];

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  const serverError = (body as { error?: string } | null)?.error;

  if (response.status === 401) {
    if (!PASSWORD_CHECK_PATHS.includes(path)) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    throw new AuthError(serverError || 'Not signed in');
  }

  if (!response.ok) throw new Error(serverError || 'Something went wrong');
  return body as T;
}

// Phone photos are often 5 MB+, so images are scaled to 1400px wide and re-encoded as JPEG before upload.
const MAX_IMAGE_WIDTH = 1400;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file'));
      return;
    }
    const source = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext('2d');
      if (context) {
        // JPEG has no transparency; without a fill, see-through PNG areas would turn solid black.
        context.fillStyle = '#121210';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      }
      URL.revokeObjectURL(source);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error('That image could not be read'));
    };
    image.src = source;
  });
}

const VIDEO_EXTENSIONS: Record<string, string> = { 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };

// Sends the file straight from the browser to Supabase Storage (videos are too big for the API server).
// XMLHttpRequest instead of fetch, because only it reports upload progress.
function putVideo(path: string, file: File, onProgress: (percent: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${VIDEO_BUCKET}/${path}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('Cache-Control', 'max-age=31536000');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let message = 'Video upload failed';
      try {
        message = (JSON.parse(xhr.responseText) as { message?: string }).message || message;
      } catch {
        // Keep the generic message.
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Network error while uploading the video'));
    xhr.send(file);
  });
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
  getContent: () => request<Partial<SiteContent>>('/content'),
  saveContent: (content: SiteContent) => request<{ ok: true }>('/content', { method: 'PUT', body: JSON.stringify(content) }),
  uploadImage: async (file: File) => {
    const dataUrl = await compressImage(file);
    const { url } = await request<{ url: string }>('/images', { method: 'POST', body: JSON.stringify({ dataUrl }) });
    return url;
  },
  // The server checks the admin login and hands out a 30-minute ticket; the file then goes into that ticket's folder.
  uploadVideo: async (file: File, onProgress: (percent: number) => void) => {
    if (!VIDEO_TYPES.includes(file.type)) throw new Error('Choose an MP4, WebM or MOV video');
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) throw new Error(`Video is too large (max ${MAX_VIDEO_MB} MB)`);
    const { ticket } = await request<{ ticket: string }>('/videos/ticket', { method: 'POST', body: '{}' });
    const path = `${ticket}/${Date.now()}.${VIDEO_EXTENSIONS[file.type] ?? 'mp4'}`;
    await putVideo(path, file, onProgress);
    return publicVideoUrl(path);
  },
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
