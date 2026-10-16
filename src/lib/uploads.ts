/**
 * File uploads: the file goes to the API as the request body and comes back as a public URL
 * (stored on the server or S3). Used for profile photos, store logos/banners, product images
 * and admin news media. Reports progress for large files (videos).
 */
import { getAccessToken, refreshAccessToken } from '@/lib/apiClient';
import { getAdminToken } from '@/lib/adminApiClient';

const BASE_URL: string = import.meta.env.VITE_API_URL || 'https://badepay-backend.vercel.app/api/v1';

export type UploadKind = 'avatar' | 'product_image' | 'store_logo' | 'store_banner' | 'content_image' | 'content_video';

export interface UploadedFile { url: string; key: string; contentType: string; size: number }

const MB = 1024 * 1024;
/** Same limits as the API (services/publicFiles.ts), checked first so people don't wait for a refusal. */
export const UPLOAD_RULES: Record<UploadKind, { accept: string; maxBytes: number; label: string }> = {
  avatar: { accept: 'image/jpeg,image/png,image/webp', maxBytes: 2 * MB, label: 'JPG, PNG or WebP, up to 2 MB' },
  product_image: { accept: 'image/jpeg,image/png,image/webp', maxBytes: 5 * MB, label: 'JPG, PNG or WebP, up to 5 MB' },
  store_logo: { accept: 'image/jpeg,image/png,image/webp', maxBytes: 2 * MB, label: 'JPG, PNG or WebP, up to 2 MB' },
  store_banner: { accept: 'image/jpeg,image/png,image/webp', maxBytes: 5 * MB, label: 'JPG, PNG or WebP, up to 5 MB' },
  content_image: { accept: 'image/jpeg,image/png,image/webp', maxBytes: 5 * MB, label: 'JPG, PNG or WebP, up to 5 MB' },
  content_video: { accept: 'video/mp4,video/webm', maxBytes: 100 * MB, label: 'MP4 or WebM, up to 100 MB' },
};

const ADMIN_KINDS: UploadKind[] = ['content_image', 'content_video'];

/** Checks type and size in the browser; the API checks again from the file's content. */
export function checkFile(kind: UploadKind, file: File): string | null {
  const rule = UPLOAD_RULES[kind];
  if (!rule.accept.split(',').includes(file.type)) return `That file type isn't supported. Use ${rule.label}.`;
  if (file.size > rule.maxBytes) return `That file is ${(file.size / MB).toFixed(1)} MB. ${rule.label}.`;
  return null;
}

function send(kind: UploadKind, file: File, token: string | null, onProgress?: (pct: number) => void, signal?: AbortSignal) {
  const admin = ADMIN_KINDS.includes(kind);
  return new Promise<{ status: number; body: any }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${admin ? '/admin' : ''}/uploads/${kind}`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      let body: any = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* not JSON */ }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal?.addEventListener('abort', () => xhr.abort());
    xhr.send(file);
  });
}

/** Uploads a file and returns its public URL. Throws an Error with a readable message. */
export async function uploadFile(kind: UploadKind, file: File, opts: { onProgress?: (pct: number) => void; signal?: AbortSignal } = {}): Promise<UploadedFile> {
  const problem = checkFile(kind, file);
  if (problem) throw new Error(problem);
  const admin = ADMIN_KINDS.includes(kind);
  let res = await send(kind, file, admin ? getAdminToken() : getAccessToken(), opts.onProgress, opts.signal);
  if (res.status === 401 && !admin) {
    const fresh = await refreshAccessToken();
    if (fresh) res = await send(kind, file, fresh, opts.onProgress, opts.signal);
  }
  if (res.status === 413) throw new Error(`That file is too large. ${UPLOAD_RULES[kind].label}.`);
  if (res.status < 200 || res.status >= 300) throw new Error(res.body?.message || `Upload failed (${res.status})`);
  return res.body.data as UploadedFile;
}
