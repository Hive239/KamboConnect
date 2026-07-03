import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** Build an educational "Course Completed" certificate PDF (self-contained; no network). */
export async function buildCertificatePdf(opts: {
  name: string;
  courseTitle: string;
  completedAt: string; // ISO
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.TimesRoman);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const width = 792, height = 612; // landscape
  const page = doc.addPage([width, height]);
  const green = rgb(0.043, 0.227, 0.165);
  const gold = rgb(0.72, 0.55, 0.2);
  const gray = rgb(0.3, 0.32, 0.3);

  // Border
  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: gold, borderWidth: 2 });
  page.drawRectangle({ x: 32, y: 32, width: width - 64, height: height - 64, borderColor: green, borderWidth: 1 });

  const center = (text: string, y: number, f = font, size = 14, color = gray) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color });
  };

  center('KamboGuide', height - 90, bold, 20, green);
  center('CERTIFICATE OF COMPLETION', height - 130, bold, 26, green);
  center('This certifies that', height - 185, italic, 14, gray);
  center(opts.name || 'Participant', height - 225, bold, 30, rgb(0.1, 0.12, 0.1));
  center('has completed the educational course', height - 262, italic, 14, gray);
  center(opts.courseTitle, height - 298, bold, 20, green);

  const dateStr = new Date(opts.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  center(`Completed on ${dateStr}`, height - 340, font, 13, gray);

  // Disclaimer footer
  const disclaimer = [
    'This certificate recognizes completion of educational study only. It is NOT a certification, license, or',
    'qualification to serve Kambo, and it is not medical advice. Kambo is a traditional practice, not a medical',
    'treatment. Always consult a qualified healthcare provider and comply with the laws in your location.',
  ];
  let dy = 120;
  for (const line of disclaimer) {
    const w = italic.widthOfTextAtSize(line, 9);
    page.drawText(line, { x: (width - w) / 2, y: dy, size: 9, font: italic, color: gray });
    dy -= 13;
  }

  return await doc.save();
}

/** Trigger a browser download of the certificate. */
export async function downloadCertificate(opts: { name: string; courseTitle: string; completedAt: string }) {
  const bytes = await buildCertificatePdf(opts);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KamboGuide-Certificate-${opts.courseTitle.replace(/\s+/g, '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
