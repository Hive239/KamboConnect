/**
 * Kambo Informed-Consent & Liability Waiver — versioned legal document.
 * Rendered in the SafetyGate consent step and embedded into the filed PDF.
 * Update WAIVER_VERSION whenever the text changes (old signatures keep their version).
 */
export const WAIVER_VERSION = 'v2.0-2026';

export const WAIVER_TITLE = 'Kambo Session — Informed Consent, Assumption of Risk & Release of Liability';

export interface WaiverSection { heading: string; body: string; }

export const WAIVER_SECTIONS: WaiverSection[] = [
  {
    heading: '1. Nature of the Practice',
    body:
      'Kambo is a traditional Amazonian practice in which the secretion of the giant monkey tree frog (Phyllomedusa bicolor) ' +
      'is applied to small superficial skin burns. It is offered here as a complementary wellness and ceremonial practice. ' +
      'It is NOT a medical treatment, is not approved by any medical regulatory body, and no medical or therapeutic outcome ' +
      'of any kind is promised, guaranteed, or implied.',
  },
  {
    heading: '2. Known Effects & Risks',
    body:
      'Kambo commonly causes an intense short-term physical reaction that may include facial and body swelling, flushing, ' +
      'increased heart rate, changes in blood pressure, dizziness, nausea, vomiting, diarrhea, sweating, chills, shaking, and ' +
      'temporary disorientation. Less common but serious risks include fainting, seizures, hyponatremia (dangerously low sodium ' +
      'from over-drinking water), dehydration, cardiac events, and, in rare cases, life-threatening complications. I understand ' +
      'these risks are real and that individual reactions cannot be fully predicted.',
  },
  {
    heading: '3. Contraindications & Honest Disclosure',
    body:
      'I have truthfully completed the health-screening questionnaire. I understand that Kambo is contraindicated for (among ' +
      'others): serious heart conditions, current or recent stroke, aneurysm/brain hemorrhage history, blood-pressure medication ' +
      'affecting heart function, active pregnancy or breastfeeding, epilepsy, severe mental-health conditions, current chemotherapy ' +
      'or organ transplant/Addison’s disease, and being under 18. I confirm I have disclosed all relevant conditions, medications, ' +
      'and substances, and I accept full responsibility for any information I withhold or misrepresent.',
  },
  {
    heading: '4. Voluntary Participation & Right to Stop',
    body:
      'My participation is entirely voluntary. I am not under the influence of alcohol or non-disclosed drugs. I may ask questions ' +
      'at any time and may decline or stop the session at any point. I understand the practitioner may also decline or stop the ' +
      'session at their discretion for safety reasons.',
  },
  {
    heading: '5. Not Medical Advice; Seek Professional Care',
    body:
      'I understand the practitioner is not acting as a physician and that nothing about this session substitutes for professional ' +
      'medical, psychiatric, or psychological care. I will consult a qualified healthcare provider for any medical condition and ' +
      'before discontinuing any prescribed treatment.',
  },
  {
    heading: '6. Assumption of Risk',
    body:
      'Knowing the risks described above, I voluntarily and knowingly assume all risks associated with the Kambo session, ' +
      'including risks that may arise from the ordinary negligence of the practitioner, and including risks not specifically ' +
      'listed here.',
  },
  {
    heading: '7. Release & Waiver of Liability',
    body:
      'To the fullest extent permitted by law, I release, waive, and hold harmless the practitioner, KamboGuide, and their ' +
      'respective affiliates, agents, and hosts from any and all claims, demands, liabilities, damages, or expenses arising out ' +
      'of or related to my participation, except for harm caused by gross negligence or willful misconduct. This release binds ' +
      'my heirs, executors, and assigns.',
  },
  {
    heading: '8. Medical Emergency Consent',
    body:
      'In the event of a medical emergency, I consent to reasonable first-aid measures and to the practitioner contacting ' +
      'emergency medical services on my behalf. I am responsible for the cost of any emergency medical care.',
  },
  {
    heading: '9. Privacy',
    body:
      'My health-screening answers and this signed waiver are stored securely and shared only with the practitioner delivering ' +
      'my session and, where required, platform administrators for safety and compliance. See the Privacy Policy for details.',
  },
  {
    heading: '10. Acknowledgement',
    body:
      'I have read (or had read to me) and understand this entire document. I am at least 18 years old and of sound mind. ' +
      'By typing my full legal name and signing below, I agree to all terms above and confirm my informed consent.',
  },
];

/** Plain-text version (used for the PDF body and any text rendering). */
export function waiverPlainText(): string {
  return [
    WAIVER_TITLE,
    `Version ${WAIVER_VERSION}`,
    '',
    ...WAIVER_SECTIONS.flatMap((s) => [s.heading, s.body, '']),
  ].join('\n');
}
