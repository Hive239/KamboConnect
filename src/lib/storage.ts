import { supabase } from '@/lib/supabase';

function safeName(name = 'file') {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

const REF_PREFIX = 'storage://';

/**
 * Upload a file to a Supabase Storage bucket. For public buckets returns a
 * public URL. For private buckets (`signed`) returns a durable *reference*
 * (`storage://<bucket>/<path>`) rather than a signed URL — signed URLs expire,
 * and persisting them means the stored link eventually 404s. Resolve the
 * reference to a short-lived signed URL on read via `resolveDocUrl`/`openDoc`.
 */
export async function uploadToBucket(
  bucket: 'uploads' | 'documents',
  file: File | Blob,
  opts: { signed?: boolean } = {},
): Promise<string> {
  if (!supabase) throw new Error('Supabase not configured');
  const name = (file as File).name || 'file';
  const path = `${crypto.randomUUID()}-${safeName(name)}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, contentType: (file as File).type || undefined });
  if (error) throw error;
  if (opts.signed) return `${REF_PREFIX}${bucket}/${path}`;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Resolve a stored document value to an openable URL. Handles three cases:
 *  - `storage://<bucket>/<path>` refs → a fresh short-lived signed URL.
 *  - already-absolute http(s)/blob URLs (legacy rows, object-URL fallback) → passthrough.
 *  - empty/`#` → ''.
 */
export async function resolveDocUrl(value?: string, expiresIn = 60 * 60): Promise<string> {
  if (!value || value === '#') return '';
  if (!value.startsWith(REF_PREFIX)) return value; // legacy signed URL / public URL / blob:
  const rest = value.slice(REF_PREFIX.length);
  const slash = rest.indexOf('/');
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!supabase) return '';
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) return '';
  return data.signedUrl;
}

/** Resolve a stored document reference and open it in a new tab. */
export async function openDoc(value?: string): Promise<void> {
  const url = await resolveDocUrl(value);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
