// Work videos are uploaded from the admin panel straight to Supabase Storage (bucket "template-videos").
// This key is Supabase's public "anon" key: it is meant to sit in website code. On its own it cannot
// upload anything; the storage rules only accept a file inside a short-lived ticket folder that the
// server hands out to a signed-in admin (POST /api/videos/ticket).
export const SUPABASE_URL = 'https://gsmsvofirbsibtydxjls.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzbXN2b2ZpcmJzaWJ0eWR4amxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMzk5NzAsImV4cCI6MjEwODcxNTk3MH0.rRKk4MnRZbud42XAY1xYIqpCMYizNnS4r4Mt7cXFe5k';
export const VIDEO_BUCKET = 'template-videos';

// Same limits as the bucket itself.
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
export const MAX_VIDEO_MB = 50;

export const publicVideoUrl = (path: string) => `${SUPABASE_URL}/storage/v1/object/public/${VIDEO_BUCKET}/${path}`;
