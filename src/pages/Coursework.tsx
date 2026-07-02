import { useEffect, useMemo, useState } from "react";
import { CourseworkEnrollment, Payment, User } from "@/entities/all";
import { TRACKS, trackById, allLessons, lessonCount, type Track, type Lesson } from "@/data/coursework";
import { useSeo } from "@/lib/useSeo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GraduationCap, CheckCircle, Lock, ArrowLeft, ArrowRight, Trophy } from "@/lib/icons";
import { toast } from "sonner";

export default function Coursework() {
  useSeo({ title: "Coursework — KamboGuide", description: "Educational Kambo safety courses. Not a certification." });
  const [uid, setUid] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTrack, setOpenTrack] = useState<Track | null>(null);
  const [payFor, setPayFor] = useState<Track | null>(null);
  const [paying, setPaying] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const me = await User.me();
      setUid(me.id);
      setEnrollments((await CourseworkEnrollment.filter({ user_id: me.id })) as any[]);
    } catch { setEnrollments([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); }, []);

  const enrollmentFor = (trackId: string) => enrollments.find((e) => e.track === trackId);

  const enroll = async () => {
    if (!payFor || !uid) return;
    setPaying(true);
    try {
      // Mock payment (Stripe-ready): record the payment, then create the enrollment.
      await Payment.create({ user_id: uid, amount: payFor.price, currency: "USD", payment_type: "course", payment_status: "completed", payment_date: new Date().toISOString() } as any);
      const created = await CourseworkEnrollment.create({ user_id: uid, track: payFor.id, status: "active", price: payFor.price, paid_at: new Date().toISOString(), progress: {} } as any);
      toast.success("Enrolled — enjoy the course!");
      setEnrollments((prev) => [...prev.filter((e) => e.track !== payFor.id), created]);
      const t = payFor;
      setPayFor(null);
      setOpenTrack(t);
    } catch { toast.error("Could not complete enrollment."); }
    finally { setPaying(false); }
  };

  if (openTrack) {
    const enr = enrollmentFor(openTrack.id);
    if (!enr) { setOpenTrack(null); return null; }
    return <CoursePlayer track={openTrack} enrollment={enr} onBack={() => { setOpenTrack(null); refresh(); }} />;
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
          <GraduationCap className="h-7 w-7 text-primary" /> KamboGuide Coursework
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Self-paced educational courses on Kambo safety, tradition, and preparation. These are
          <strong> educational only — not a certification or license to practice</strong>, and make no medical claims.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {TRACKS.map((t) => {
            const enr = enrollmentFor(t.id);
            const total = lessonCount(t);
            const done = enr ? allLessons(t).filter((l) => enr.progress?.[l.id]?.completed).length : 0;
            const pct = total ? Math.round((done / total) * 100) : 0;
            const completed = enr?.completed_at || (total && done === total);
            return (
              <Card key={t.id} className="flex flex-col overflow-hidden">
                <img src={t.image} alt={t.title} className="h-44 w-full object-cover" loading="lazy" />
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{t.title}</h3>
                      <p className="text-xs text-muted-foreground">{t.audience}</p>
                    </div>
                    {completed && <Badge className="gap-1 bg-emerald-100 text-emerald-800"><Trophy className="h-3 w-3" /> Completed</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.subtitle}</p>
                  <div className="text-xs text-muted-foreground">{t.modules.length} modules · {total} lessons</div>
                  {enr ? (
                    <>
                      <Progress value={pct} className="h-2" />
                      <div className="text-xs text-muted-foreground">{done}/{total} lessons · {pct}%</div>
                      <Button className="mt-auto gap-2" onClick={() => setOpenTrack(t)}>
                        {done ? "Continue" : "Start"} <ArrowRight className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button className="mt-auto gap-2" onClick={() => setPayFor(t)} disabled={loading || !uid}>
                      <Lock className="h-4 w-4" /> Enroll · ${t.price}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Educational content only. Completing a course does not certify or license anyone to serve Kambo, and is not
          medical advice. Always consult a qualified healthcare provider. See our{" "}
          <a href="/Disclaimer" className="underline">disclaimer</a>.
        </p>
      </div>

      {/* Mock-payment enrollment dialog */}
      <Dialog open={!!payFor} onOpenChange={(o) => !o && setPayFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enroll in {payFor?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              One-time enrollment for lifetime access to this educational course.
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
              <span>{payFor?.title}</span>
              <span className="font-semibold">${payFor?.price}.00</span>
            </div>
            <p className="text-xs text-muted-foreground">Demo checkout (Stripe-ready). No real charge is made.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayFor(null)}>Cancel</Button>
            <Button onClick={enroll} disabled={paying}>{paying ? "Processing…" : `Pay $${payFor?.price} & enroll`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CoursePlayer({ track, enrollment, onBack }: { track: Track; enrollment: any; onBack: () => void }) {
  const lessons = useMemo(() => allLessons(track), [track]);
  const [progress, setProgress] = useState<Record<string, any>>(enrollment.progress || {});
  const [activeId, setActiveId] = useState<string>(() => {
    const firstIncomplete = lessons.find((l) => !enrollment.progress?.[l.id]?.completed);
    return (firstIncomplete || lessons[0]).id;
  });
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const active = lessons.find((l) => l.id === activeId)!;
  const idx = lessons.findIndex((l) => l.id === activeId);
  const doneCount = lessons.filter((l) => progress[l.id]?.completed).length;
  const pct = Math.round((doneCount / lessons.length) * 100);

  const persist = async (next: Record<string, any>, completedAll: boolean) => {
    setProgress(next);
    try {
      await CourseworkEnrollment.update(enrollment.id, {
        progress: next,
        ...(completedAll ? { completed_at: new Date().toISOString() } : {}),
      });
    } catch { /* non-blocking */ }
  };

  const completeLesson = async () => {
    const quiz = active.quiz || [];
    let score = 100;
    if (quiz.length) {
      const correct = quiz.filter((q, i) => answers[i] === q.answer).length;
      score = Math.round((correct / quiz.length) * 100);
      if (correct !== quiz.length) { setChecked(true); toast.error("Some answers are incorrect — review and try again."); return; }
    }
    const next = { ...progress, [active.id]: { completed: true, score } };
    const completedAll = lessons.every((l) => next[l.id]?.completed);
    await persist(next, completedAll);
    setAnswers({}); setChecked(false);
    if (completedAll) { toast.success("Course complete! 🎉"); }
    else {
      const nextLesson = lessons[idx + 1] || lessons.find((l) => !next[l.id]?.completed);
      if (nextLesson) setActiveId(nextLesson.id);
    }
  };

  const goto = (id: string) => { setActiveId(id); setAnswers({}); setChecked(false); };
  const allDone = doneCount === lessons.length;

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={onBack}><ArrowLeft className="h-4 w-4" /> All courses</Button>
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{track.title}</h1>
          <div className="mt-2 flex items-center gap-3">
            <Progress value={pct} className="h-2 max-w-xs" />
            <span className="text-sm text-muted-foreground">{doneCount}/{lessons.length} · {pct}%</span>
            {allDone && <Badge className="gap-1 bg-emerald-100 text-emerald-800"><Trophy className="h-3 w-3" /> Completed</Badge>}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Module / lesson nav */}
          <aside className="space-y-4">
            {track.modules.map((m) => (
              <div key={m.id}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.title}</p>
                <div className="space-y-1">
                  {m.lessons.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => goto(l.id)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors ${l.id === activeId ? "bg-primary/10 text-primary" : "hover:bg-accent"}`}
                    >
                      {progress[l.id]?.completed
                        ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" weight="fill" />
                        : <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />}
                      <span>{l.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </aside>

          {/* Lesson content */}
          <Card>
            <CardContent className="space-y-5 p-6">
              <h2 className="text-xl font-semibold">{active.title}</h2>
              <div className="space-y-3 leading-relaxed text-foreground">
                {active.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>

              {active.quiz && active.quiz.length > 0 && (
                <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
                  <p className="text-sm font-semibold">Knowledge check</p>
                  {active.quiz.map((q, qi) => (
                    <div key={qi} className="space-y-2">
                      <p className="text-sm font-medium">{q.q}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const selected = answers[qi] === oi;
                          const isWrong = checked && selected && oi !== q.answer;
                          const isRight = checked && oi === q.answer;
                          return (
                            <label key={oi} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${isRight ? "border-emerald-400 bg-emerald-50" : isWrong ? "border-red-400 bg-red-50" : selected ? "border-primary" : "border-border"}`}>
                              <input type="radio" name={`q-${active.id}-${qi}`} checked={selected} onChange={() => setAnswers((a) => ({ ...a, [qi]: oi }))} />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => goto(lessons[idx - 1].id)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                {progress[active.id]?.completed ? (
                  <Button size="sm" disabled={idx >= lessons.length - 1} onClick={() => goto(lessons[idx + 1].id)}>
                    Next <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={completeLesson}>
                    {active.quiz?.length ? "Submit & complete" : "Mark complete"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
