/**
 * Kambo contraindications — single source of truth.
 * Used by the Education page (display) and the pre-session health screening
 * (questionnaire). `screening:true` items become yes/no questions; a "yes" on an
 * `absolute` item hard-flags the booking for practitioner review.
 *
 * Educational content only — not medical advice.
 */
export type ContraLevel = 'absolute' | 'relative' | 'temporary';

export interface Contraindication {
  id: string;
  level: ContraLevel;
  label: string;
  detail?: string;
  screening?: boolean;
}

export const CONTRAINDICATIONS: Contraindication[] = [
  // Absolute — should not receive Kambo
  { id: 'heart', level: 'absolute', label: 'Serious heart conditions', detail: 'History of heart attack, stroke, aneurysm, or congenital heart disease.', screening: true },
  { id: 'pregnancy', level: 'absolute', label: 'Pregnant or breastfeeding', screening: true },
  { id: 'brain', level: 'absolute', label: 'Brain hemorrhage or recent brain trauma', screening: true },
  { id: 'major-organs', level: 'absolute', label: 'Serious liver, kidney, or pancreas conditions', screening: true },
  { id: 'mental-health', level: 'absolute', label: 'Serious mental health conditions', detail: 'Schizophrenia, psychosis, or epilepsy.', screening: true },
  { id: 'addisons', level: 'absolute', label: "Addison's disease or current chemotherapy", screening: true },
  { id: 'surgery-major', level: 'absolute', label: 'Major surgery within the last 3 months', screening: true },

  // Relative — proceed only with caution and practitioner clearance
  { id: 'blood-pressure', level: 'relative', label: 'High or low blood pressure', screening: true },
  { id: 'medications', level: 'relative', label: 'Taking prescription medication', detail: 'Especially heart, blood-pressure, or psychiatric medication.', screening: true },
  { id: 'low-weight', level: 'relative', label: 'Significantly underweight', screening: true },
  { id: 'elderly', level: 'relative', label: 'Over 70 years of age', screening: true },
  { id: 'recent-substances', level: 'relative', label: 'Recent use of other plant medicines or substances', screening: true },

  // Temporary — wait until resolved
  { id: 'fasting', level: 'temporary', label: 'Unable to fast before the session', detail: 'A pre-session fast is typically required.', screening: true },
  { id: 'menstruation', level: 'temporary', label: 'Currently menstruating', screening: true },
  { id: 'acute-illness', level: 'temporary', label: 'Currently ill (fever, infection)', screening: true },
  { id: 'recent-fast', level: 'temporary', label: 'Recent extended fasting or dehydration', screening: true },
];

export const LEVEL_META: Record<ContraLevel, { title: string; blurb: string; tone: 'destructive' | 'warning' | 'info' }> = {
  absolute: { title: 'Absolute Contraindications', blurb: 'Kambo should not be administered in these cases.', tone: 'destructive' },
  relative: { title: 'Relative Contraindications', blurb: 'Use with caution — requires practitioner clearance.', tone: 'warning' },
  temporary: { title: 'Temporary Contraindications', blurb: 'Wait until these are resolved before a session.', tone: 'info' },
};

export const byLevel = (level: ContraLevel) => CONTRAINDICATIONS.filter((c) => c.level === level);
export const screeningQuestions = () => CONTRAINDICATIONS.filter((c) => c.screening);
