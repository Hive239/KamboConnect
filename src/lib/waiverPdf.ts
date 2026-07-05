import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { uploadToBucket } from '@/lib/storage';
import { WAIVER_TITLE, WAIVER_VERSION, WAIVER_SECTIONS } from '@/data/waiver';

export interface WaiverSigner {
  signerName: string;
  clientEmail?: string;
  practitionerName?: string;
  agreedAt: string; // ISO
  screeningSummary?: string; // e.g. "No contraindications reported" or list of flags
  signatureImage?: string;   // drawn-signature PNG data URL
  auditId?: string;          // correlates the filed PDF to its signature_audits row
  ip?: string;               // signer IP (captured server-side; best-effort)
  userAgent?: string;        // signer device/browser
}

/** data: URL → bytes (for embedding the drawn signature). */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const b64 = dataUrl.split(',')[1] || '';
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Build the signed-waiver PDF bytes (self-contained; no network). */
export async function buildWaiverPdf(s: WaiverSigner): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const size = 10.5, lh = 14, margin = 54, width = 612, height = 792, maxW = width - margin * 2;

  let page = doc.addPage([width, height]);
  let y = height - margin;
  const draw = (text: string, f = font, fs = size, color = rgb(0.1, 0.12, 0.1)) => {
    const words = text.split(/\s+/);
    let line = '';
    const flush = () => {
      if (y < margin + lh) { page = doc.addPage([width, height]); y = height - margin; }
      page.drawText(line, { x: margin, y, size: fs, font: f, color });
      y -= lh; line = '';
    };
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (f.widthOfTextAtSize(test, fs) > maxW) flush(), (line = w);
      else line = test;
    }
    if (line) flush();
  };

  draw(WAIVER_TITLE, bold, 14);
  draw(`Version ${WAIVER_VERSION}`, font, 9, rgb(0.4, 0.4, 0.4));
  y -= 6;
  for (const sec of WAIVER_SECTIONS) { draw(sec.heading, bold, 11); draw(sec.body); y -= 4; }

  y -= 10;
  draw('SIGNATURE', bold, 12);
  draw(`Signed by (typed legal name): ${s.signerName}`, bold);
  if (s.clientEmail) draw(`Client email: ${s.clientEmail}`);
  if (s.practitionerName) draw(`Practitioner: ${s.practitionerName}`);
  draw(`Date signed: ${new Date(s.agreedAt).toLocaleString()}`);
  draw(`Health screening: ${s.screeningSummary || 'Completed'}`);

  // Embed the drawn signature image, if provided.
  if (s.signatureImage?.startsWith('data:image')) {
    try {
      const png = await doc.embedPng(dataUrlToBytes(s.signatureImage));
      const dims = png.scale(120 / png.width);
      if (y < margin + dims.height + lh) { page = doc.addPage([width, height]); y = height - margin; }
      y -= 6;
      page.drawImage(png, { x: margin, y: y - dims.height, width: dims.width, height: dims.height });
      y -= dims.height + lh;
    } catch { /* non-image data — skip */ }
  }

  // Audit trail block (ESIGN/UETA record of the signing event).
  y -= 6;
  draw('AUDIT TRAIL', bold, 11);
  if (s.auditId) draw(`Audit ID: ${s.auditId}`, font, 9, rgb(0.4, 0.4, 0.4));
  if (s.ip) draw(`Signer IP: ${s.ip}`, font, 9, rgb(0.4, 0.4, 0.4));
  if (s.userAgent) draw(`Device: ${s.userAgent}`, font, 9, rgb(0.4, 0.4, 0.4));
  draw('This electronic signature constitutes a legally binding acceptance of the terms above (ESIGN Act / UETA).', font, 9, rgb(0.4, 0.4, 0.4));

  return doc.save();
}

/** SHA-256 hex of the PDF bytes — a tamper-evidence fingerprint of the exact filed document. */
async function sha256Hex(bytes: Uint8Array): Promise<string> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}

export interface FiledWaiver { url: string; hash: string; auditId: string }

/**
 * Build + file the waiver PDF into Supabase Storage (private `documents` bucket).
 * Returns the (signed) URL plus the document SHA-256 hash + audit id for the
 * signature_audits record. Falls back to an object URL when Storage is unavailable.
 */
export async function generateAndFileWaiverPdf(s: WaiverSigner): Promise<FiledWaiver> {
  const auditId = s.auditId || (crypto.randomUUID?.() ?? `aud_${Date.now().toString(36)}`);
  const bytes = await buildWaiverPdf({ ...s, auditId });
  const hash = await sha256Hex(bytes);
  const file = new File([bytes], `waiver-${s.signerName.replace(/\W+/g, '_')}.pdf`, { type: 'application/pdf' });
  try {
    const url = await uploadToBucket('documents', file, { signed: true });
    return { url, hash, auditId };
  } catch (e) {
    console.warn('Waiver PDF upload failed, using local URL:', e);
    return { url: URL.createObjectURL(file), hash, auditId };
  }
}
