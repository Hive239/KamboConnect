import { useState } from "react";
import { screeningQuestions } from "@/data/contraindications";
import { WAIVER_TITLE, WAIVER_VERSION, WAIVER_SECTIONS } from "@/data/waiver";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ShieldCheck, ArrowLeft, ArrowRight } from "@/lib/icons";

export interface SafetyData {
  answers: { key: string; question: string; answer: boolean; flag?: boolean }[];
  flagged: boolean;
  screeningSummary: string;
  consent: { agreed: boolean; signature_name: string; document_version: string; agreed_at: string };
}

/**
 * Pre-session safety gate: a health-screening questionnaire (driven by the
 * shared contraindications data) followed by the real informed-consent waiver.
 * An ABSOLUTE contraindication hard-blocks; relative/temporary items flag for review.
 */
export default function SafetyGate({ onComplete, onBack, userName = "" }: { onComplete: (d: SafetyData) => void; onBack: () => void; userName?: string }) {
  const questions = screeningQuestions();
  const [phase, setPhase] = useState<"screening" | "consent">("screening");
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState(userName);
  const [agreed, setAgreed] = useState(false);

  const absoluteItems = questions.filter((q) => answers[q.id] && q.level === "absolute");
  const relativeItems = questions.filter((q) => answers[q.id] && q.level === "relative");
  const hasAbsolute = absoluteItems.length > 0;
  const anyFlag = absoluteItems.length + relativeItems.length > 0;

  const submit = () => {
    const flags = [...absoluteItems, ...relativeItems].map((q) => q.label);
    onComplete({
      answers: questions.map((q) => ({ key: q.id, question: q.label, answer: !!answers[q.id], flag: !!answers[q.id] && q.level !== "temporary" })),
      flagged: anyFlag,
      screeningSummary: flags.length ? `Flagged: ${flags.join("; ")}` : "No contraindications reported",
      consent: { agreed, signature_name: signature, document_version: WAIVER_VERSION, agreed_at: new Date().toISOString() },
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
        {hasAbsolute && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              One or more of your answers is an <strong>absolute contraindication</strong> for Kambo. For your safety this session
              cannot be booked. Please consult your practitioner or a medical professional.
            </AlertDescription>
          </Alert>
        )}
        {!hasAbsolute && relativeItems.length > 0 && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You selected items that may require caution. You can continue — your practitioner will review your responses before confirming.
            </AlertDescription>
          </Alert>
        )}
        <div className="mt-6 flex justify-between border-t pt-4">
          <Button variant="outline" onClick={onBack} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
          <Button onClick={() => setPhase("consent")} disabled={hasAbsolute} className="gap-2">Continue <ArrowRight className="h-4 w-4" /></Button>
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
      <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">{WAIVER_TITLE}</p>
        <p className="text-xs">Version {WAIVER_VERSION}</p>
        {WAIVER_SECTIONS.map((s) => (
          <div key={s.heading}>
            <p className="font-medium text-foreground">{s.heading}</p>
            <p>{s.body}</p>
          </div>
        ))}
        <p className="text-xs">A signed PDF copy will be filed to your records and shared with your practitioner.</p>
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
