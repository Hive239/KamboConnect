import { useState } from "react";
import { screeningQuestions } from "@/data/contraindications";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ShieldCheck, ArrowLeft, ArrowRight } from "@/lib/icons";

export interface SafetyData {
  answers: { key: string; question: string; answer: boolean; flag?: boolean }[];
  flagged: boolean;
  consent: { agreed: boolean; signature_name: string; document_version: string; agreed_at: string };
}

const CONSENT_VERSION = "v1.0";

/**
 * Pre-session safety gate: a health-screening questionnaire (driven by the
 * shared contraindications data) followed by an informed-consent waiver.
 * Calls onComplete with the collected data; a "yes" on an absolute item flags
 * the booking for practitioner review (it does not hard-block — balanced posture).
 */
export default function SafetyGate({ onComplete, onBack, userName = "" }: { onComplete: (d: SafetyData) => void; onBack: () => void; userName?: string }) {
  const questions = screeningQuestions();
  const [phase, setPhase] = useState<"screening" | "consent">("screening");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState(userName);
  const [agreed, setAgreed] = useState(false);

  const flaggedItems = questions.filter((q) => answers[q.id] && q.level === "absolute");
  const anyFlag = questions.some((q) => answers[q.id] && (q.level === "absolute" || q.level === "relative"));

  const submit = () => {
    onComplete({
      answers: questions.map((q) => ({ key: q.id, question: q.label, answer: !!answers[q.id], flag: !!answers[q.id] && q.level !== "temporary" })),
      flagged: anyFlag,
      consent: { agreed, signature_name: signature, document_version: CONSENT_VERSION, agreed_at: new Date().toISOString() },
    });
  };

  if (phase === "screening") {
    return (
      <div className="pt-4">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" weight="duotone" />
          <h3 className="text-lg font-semibold">Health & safety screening</h3>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          For your safety, please tell us if any of the following apply. Your answers are shared only with your practitioner.
        </p>
        <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {questions.map((q) => (
            <label key={q.id} className="flex cursor-pointer items-start gap-3 rounded-md p-2.5 hover:bg-accent">
              <Checkbox checked={!!answers[q.id]} onCheckedChange={(v) => setAnswers((a) => ({ ...a, [q.id]: !!v }))} className="mt-0.5" />
              <span className="text-sm">
                {q.label}
                {q.detail && <span className="block text-xs text-muted-foreground">{q.detail}</span>}
              </span>
            </label>
          ))}
        </div>
        {flaggedItems.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You selected items that may be contraindications. You can still request the session — your practitioner will review your responses and follow up before confirming.
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-6 flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
          <Button onClick={() => setPhase("consent")} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" weight="duotone" />
        <h3 className="text-lg font-semibold">Informed consent</h3>
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>I understand that Kambo is a traditional practice and not a substitute for professional medical care. I confirm the health information I provided is accurate to the best of my knowledge.</p>
        <p>I understand the potential effects and risks, that I may stop at any time, and that my practitioner will screen me for contraindications. I participate of my own free will and release the practitioner from liability to the extent permitted by law.</p>
        <p>I consent to my screening responses being shared with my chosen practitioner for safety purposes.</p>
        <p className="text-xs">Consent document {CONSENT_VERSION}. This is educational content, not medical or legal advice.</p>
      </div>
      <div className="mt-4 space-y-3">
        <label className="flex items-start gap-3">
          <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} className="mt-0.5" />
          <span className="text-sm">I have read and agree to the informed-consent statement above.</span>
        </label>
        <div>
          <label className="mb-1 block text-sm font-medium">Type your full name to sign</label>
          <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Your full name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </div>
      </div>
      <div className="mt-6 flex justify-between border-t pt-4">
        <Button variant="outline" onClick={() => setPhase("screening")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={submit} disabled={!agreed || !signature.trim()} className="gap-2">Agree & continue <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
