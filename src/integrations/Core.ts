/**
 * Mock of the Base44 `@/integrations/Core` module.
 * On migration: UploadFile/UploadPrivateFile → Supabase Storage,
 * SendEmail → a transactional email provider.
 */

/** Returns a usable object URL so uploaded images render immediately offline. */
export async function UploadFile({ file }: { file: File | Blob }): Promise<{ file_url: string }> {
  const file_url =
    typeof URL !== 'undefined' && 'createObjectURL' in URL
      ? URL.createObjectURL(file)
      : '';
  return { file_url };
}

/** Private upload returns `file_uri` (matches the original SDK contract). */
export async function UploadPrivateFile({ file }: { file: File | Blob }): Promise<{ file_uri: string }> {
  const file_uri =
    typeof URL !== 'undefined' && 'createObjectURL' in URL
      ? URL.createObjectURL(file)
      : '';
  return { file_uri };
}

export async function SendEmail(args: { to: string; subject: string; body: string }): Promise<{ success: true }> {
  // Non-critical in the app (every call site is wrapped in try/catch).
  // eslint-disable-next-line no-console
  console.info('[mock SendEmail]', { to: args.to, subject: args.subject });
  return { success: true };
}

export default { UploadFile, UploadPrivateFile, SendEmail };
