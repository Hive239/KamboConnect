import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { uploadToBucket } from '@/lib/storage';
import { WAIVER_TITLE, WAIVER_VERSION, WAIVER_SECTIONS } from '@/data/waiver';

export interface WaiverSigner {
  signerName: string;
  clientEmail?: string;
  practitionerName?: string;
  agreedAt: string; // ISO
  screeningSummary?: string; // e.g. "No contraindications reported" or list of flags
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
  draw('This electronic signature constitutes a legally binding acceptance of the terms above.', font, 9, rgb(0.4, 0.4, 0.4));

  return doc.save();
}

/**
 * Build + file the waiver PDF into Supabase Storage (private `documents` bucket).
 * Returns the (signed) URL, or an object-URL fallback when Storage is unavailable.
 */
export async function generateAndFileWaiverPdf(s: WaiverSigner): Promise<string> {
  const bytes = await buildWaiverPdf(s);
  const file = new File([bytes], `waiver-${s.signerName.replace(/\W+/g, '_')}.pdf`, { type: 'application/pdf' });
  try {
    return await uploadToBucket('documents', file, { signed: true });
  } catch (e) {
    console.warn('Waiver PDF upload failed, using local URL:', e);
    return URL.createObjectURL(file);
  }
}
