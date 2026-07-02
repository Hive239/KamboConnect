/**
 * Shared, dependency-free form validators. Client-side UX guards — the server
 * (Supabase Auth / RLS) remains the source of truth, but these give users
 * immediate, consistent feedback instead of silent failures or bad records.
 */

// Pragmatic email check (not RFC-perfect, but catches the real mistakes).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(v: string | undefined | null): boolean {
  return !!v && EMAIL_RE.test(v.trim());
}

// Accepts +, spaces, dashes, parens; requires 7–15 digits.
export function isValidPhone(v: string | undefined | null): boolean {
  if (!v) return false;
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidUrl(v: string | undefined | null): boolean {
  if (!v) return false;
  try {
    const u = new URL(v.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export interface PasswordStrength {
  ok: boolean;
  reason?: string;
}

/** Minimum viable password policy: ≥8 chars with at least one letter and one number. */
export function checkPassword(v: string | undefined | null): PasswordStrength {
  if (!v || v.length < 8) return { ok: false, reason: "Password must be at least 8 characters." };
  if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return { ok: false, reason: "Include at least one letter and one number." };
  return { ok: true };
}

/** Trim + collapse whitespace; enforce a max length. Returns the cleaned string. */
export function cleanText(v: string, max = 500): string {
  return v.replace(/\s+/g, " ").trim().slice(0, max);
}
