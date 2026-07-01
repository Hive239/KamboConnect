import { supabase } from '@/lib/supabase';

function safeName(name = 'file') {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
}

/**
 * Upload a file to a Supabase Storage bucket. Returns a public URL, or a
 * long-lived signed URL when `signed` (private buckets like `documents`).
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
  if (opts.signed) {
    const { data, error: e2 } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
    if (e2) throw e2;
    return data.signedUrl;
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
