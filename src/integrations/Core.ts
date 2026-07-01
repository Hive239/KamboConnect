/**
 * Mock of the Base44 `@/integrations/Core` module.
 * On migration: UploadFile/UploadPrivateFile → Supabase Storage,
 * SendEmail → a transactional email provider.
 */

import { isSupabaseConfigured } from '@/lib/supabase';
import { uploadToBucket } from '@/lib/storage';

function objectUrl(file: File | Blob) {
  return typeof URL !== 'undefined' && 'createObjectURL' in URL ? URL.createObjectURL(file) : '';
}

/** Uploads to Supabase Storage (public 'uploads' bucket) when configured; else a local object URL. */
export async function UploadFile({ file }: { file: File | Blob }): Promise<{ file_url: string }> {
  if (isSupabaseConfigured) {
    try { return { file_url: await uploadToBucket('uploads', file) }; }
    catch (e) { console.warn('UploadFile → Storage failed, falling back:', e); }
  }
  return { file_url: objectUrl(file) };
}

/** Private upload → Supabase 'documents' bucket (signed URL); else object URL. Returns `file_uri`. */
export async function UploadPrivateFile({ file }: { file: File | Blob }): Promise<{ file_uri: string }> {
  if (isSupabaseConfigured) {
    try { return { file_uri: await uploadToBucket('documents', file, { signed: true }) }; }
    catch (e) { console.warn('UploadPrivateFile → Storage failed, falling back:', e); }
  }
  return { file_uri: objectUrl(file) };
}

/**
 * Sends email via the /api/send-email serverless function (Resend).
 * No-ops safely when the endpoint/RESEND_API_KEY isn't available (e.g. local dev),
 * so every call site (already try/catch-wrapped) stays non-blocking.
 */
export async function SendEmail(args: { to: string; subject: string; body: string }): Promise<{ success: true }> {
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
  } catch (e) {
    console.warn('SendEmail failed (non-fatal):', e);
  }
  return { success: true };
}

export default { UploadFile, UploadPrivateFile, SendEmail };
