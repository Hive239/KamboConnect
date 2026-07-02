import { useSeo } from "@/lib/useSeo";
import { PageHeader } from "@/components/ui/PageHeader";
import { Shield } from "@/lib/icons";

const UPDATED = "July 2026";

export default function Privacy() {
  useSeo({ title: "Privacy Policy — KamboGuide", description: "How KamboGuide collects, uses, and protects your data, including health-screening and consent information." });
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <PageHeader icon={Shield} kicker="Legal" title="Privacy Policy" subtitle={`Last updated: ${UPDATED}`} className="-mx-6 -mt-6 mb-8 sm:-mx-10 sm:-mt-10" />

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Who we are</h2>
          <p className="text-muted-foreground">KamboGuide ("we," "us") operates a marketplace connecting people with independent Kambo practitioners. This policy explains what we collect, why, and your choices. It is provided for transparency and is not legal advice; consult your own counsel for compliance in your jurisdiction.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. Information we collect</h2>
          <ul className="list-disc pl-5 text-muted-foreground">
            <li><strong>Account data:</strong> name, email, role (client/practitioner/admin), profile details and photo.</li>
            <li><strong>Practitioner data:</strong> bio, location, credentials, availability, and listing tier.</li>
            <li><strong>Sensitive health data:</strong> health-screening questionnaire answers and signed informed-consent waivers you complete before a session. We treat these as confidential.</li>
            <li><strong>Transactional data:</strong> consultations, bookings, messages, orders, and payment records.</li>
            <li><strong>Technical data:</strong> device/browser information and basic usage analytics.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. How we use it</h2>
          <p className="text-muted-foreground">To operate the marketplace: create accounts, enable discovery and booking, deliver messages and notifications, process the consent/waiver workflow, take payment, and maintain safety and moderation. We do not sell your personal data.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Health data & who can see it</h2>
          <p className="text-muted-foreground">Your health-screening answers and signed waiver are shared only with the specific practitioner delivering your session and, where necessary, platform administrators for safety and compliance. Access is restricted by role-based security. You may request a copy or deletion of these records (subject to legal retention requirements for signed waivers).</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Storage & security</h2>
          <p className="text-muted-foreground">Data is stored with our infrastructure provider (Supabase/Postgres) with access controls and row-level security. Documents (e.g., signed waiver PDFs, certifications) are held in access-restricted storage. No system is perfectly secure; we work to protect your data and notify you of material breaches as required by law.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Your rights</h2>
          <p className="text-muted-foreground">Depending on where you live, you may have rights to access, correct, export, or delete your personal data, and to object to certain processing. Manage your profile in your account, or contact us to exercise these rights.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">7. Retention</h2>
          <p className="text-muted-foreground">We keep account and transaction data while your account is active. Signed waivers and consent records may be retained longer where required to establish a legal record.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">8. Contact</h2>
          <p className="text-muted-foreground">Questions about this policy or your data: privacy@kamboguide.app.</p>
        </section>
      </div>
    </div>
  );
}
