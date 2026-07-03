import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui/PageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { BookOpen, GraduationCap, BookMarked } from "@/lib/icons";
import { useSeo } from "@/lib/useSeo";
import Education from "./Education";
import Coursework from "./Coursework";
import Courses from "./Courses";

const TABS = [
  { value: "guides", label: "Guides", icon: BookOpen },
  { value: "courses", label: "Courses", icon: GraduationCap },
  { value: "programs", label: "Training Programs", icon: BookMarked },
];

/**
 * Learn — one hub for the three former learning pages:
 *   Guides           → Education (free reading)
 *   Courses          → Coursework (on-platform self-paced LMS)
 *   Training Programs → Courses (external practitioner-training directory)
 * Deep-linkable via ?tab=.
 */
export default function Learn() {
  useSeo({ title: "Learn — KamboGuide", description: "Guides, self-paced courses, and practitioner training programs." });
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "guides";

  return (
    <div className="min-h-[100dvh] bg-muted">
      <PageHeader icon={BookOpen} kicker="Learn" title="Learn" subtitle="Guides, self-paced courses, and practitioner training programs." />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <SegmentedControl value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={TABS} />
        </div>
        {tab === "guides" && <Education embedded />}
        {tab === "courses" && <Coursework embedded />}
        {tab === "programs" && <Courses embedded />}
      </div>
    </div>
  );
}
