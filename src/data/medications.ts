/**
 * Medication → Kambo interaction rules. Educational safety screening only —
 * NOT medical advice. `absolute` hard-blocks the booking; `caution` flags it for
 * practitioner + medical clearance. Mirrors the tone of contraindications.ts.
 */
import type { InteractionFlag } from '@/types/entities';

export interface MedicationOption {
  key: string;
  label: string;
  severity: 'absolute' | 'caution';
  note: string;
}

export const MEDICATIONS: MedicationOption[] = [
  { key: 'maoi', label: 'MAO inhibitors (MAOIs)', severity: 'absolute', note: 'MAOIs can interact dangerously with plant medicines — Kambo should not be administered.' },
  { key: 'lithium', label: 'Lithium', severity: 'absolute', note: 'Lithium substantially raises seizure risk with purgative practices — not safe.' },
  { key: 'heart_meds', label: 'Heart / cardiac medication', severity: 'absolute', note: 'Indicates an underlying cardiac condition — an absolute contraindication for Kambo.' },
  { key: 'ssri_snri', label: 'Antidepressants (SSRIs / SNRIs)', severity: 'caution', note: 'Possible cardiovascular / serotonergic risk — practitioner and doctor clearance required.' },
  { key: 'antipsychotic', label: 'Antipsychotics', severity: 'caution', note: 'Requires psychiatric clearance before a session.' },
  { key: 'stimulants', label: 'Stimulants (e.g. ADHD medication)', severity: 'caution', note: 'Added cardiovascular strain — requires clearance.' },
  { key: 'blood_pressure', label: 'Blood-pressure medication', severity: 'caution', note: 'Kambo affects heart rate and blood pressure — requires clearance.' },
  { key: 'anticoagulant', label: 'Blood thinners (anticoagulants)', severity: 'caution', note: 'Bleeding / bruising risk at application points — requires clearance.' },
  { key: 'diuretics', label: 'Diuretics', severity: 'caution', note: 'Dehydration / electrolyte risk with purging — requires clearance and a hydration plan.' },
  { key: 'immunosuppressant', label: 'Immunosuppressants', severity: 'caution', note: 'Immune modulation — requires medical clearance.' },
  { key: 'other_rx', label: 'Other prescription medication', severity: 'caution', note: 'Please disclose to your practitioner for review.' },
];

/** Return interaction flags for the selected medication keys. */
export function checkInteractions(keys: string[]): InteractionFlag[] {
  const set = new Set(keys);
  return MEDICATIONS.filter((m) => set.has(m.key)).map((m) => ({
    medication: m.label,
    severity: m.severity,
    note: m.note,
  }));
}

export const hasAbsoluteInteraction = (flags: InteractionFlag[]) =>
  flags.some((f) => f.severity === 'absolute');
