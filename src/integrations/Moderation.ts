import type { Report } from '@/types/entities';

/**
 * Mock content moderation + report triage ("practical AI"). Heuristic keyword
 * scoring today; the async signatures match a future LLM-moderation call.
 */
export interface ModerationResult {
  flagged: boolean;
  score: number; // 0–1 risk
  reasons: string[];
}

const RISK_TERMS: { term: RegExp; reason: string; weight: number }[] = [
  { term: /\b(scam|fraud|fake|stole|ripoff)\b/i, reason: 'fraud language', weight: 0.5 },
  { term: /\b(idiot|stupid|hate|trash|garbage)\b/i, reason: 'harassment/abuse', weight: 0.4 },
  { term: /\b(buy now|click here|free money|http:\/\/|https:\/\/)\b/i, reason: 'spam/links', weight: 0.35 },
  { term: /\b(cure|guaranteed|miracle|heal cancer)\b/i, reason: 'unsafe medical claim', weight: 0.45 },
];

export async function moderateContent(text: string): Promise<ModerationResult> {
  const reasons: string[] = [];
  let score = 0;
  const t = text || '';
  for (const { term, reason, weight } of RISK_TERMS) {
    if (term.test(t)) { reasons.push(reason); score += weight; }
  }
  score = Math.min(1, score);
  return { flagged: score >= 0.4, score: Math.round(score * 100) / 100, reasons };
}

/** Suggest a priority for an incoming report based on its reason. */
export async function triageReport(report: Partial<Report>): Promise<{ priority: Report['priority']; rationale: string }> {
  const high = ['safety_concern', 'fraud', 'harassment'];
  const reason = report.reason || 'other';
  if (high.includes(reason)) return { priority: 'high', rationale: `"${reason}" reports are auto-escalated` };
  if (reason === 'inappropriate_content') return { priority: 'medium', rationale: 'content review needed' };
  return { priority: 'low', rationale: 'standard queue' };
}

export default { moderateContent, triageReport };
