import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useSeo } from "@/lib/useSeo";

const UPDATED = "July 2026";

export default function Terms() {
  useSeo({ title: "Terms of Service — KamboGuide", description: "The terms governing use of the KamboGuide marketplace." });
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <h1 className="font-display text-3xl font-semibold">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: {UPDATED}</p>

      <div className="prose prose-sm mt-8 max-w-none space-y-6 text-foreground">
        <section>
          <h2 className="text-lg font-semibold">1. Acceptance</h2>
          <p className="text-muted-foreground">By creating an account or using KamboGuide you agree to these Terms and to our <Link to={createPageUrl("Privacy")} className="text-primary hover:underline">Privacy Policy</Link>. If you do not agree, do not use the service. These terms are provided for transparency and are not legal advice.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">2. What KamboGuide is (and isn't)</h2>
          <p className="text-muted-foreground">KamboGuide is a <strong>marketplace and directory</strong> that helps you find independent Kambo practitioners. We are <strong>not</strong> a medical provider, do not employ practitioners, and do not provide medical advice or treatment. Practitioners are independent third parties solely responsible for their services. Nothing here is a substitute for professional medical care.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">3. Eligibility</h2>
          <p className="text-muted-foreground">You must be at least 18 years old and able to form a binding contract. Kambo carries real physical risks; you are responsible for completing the health screening truthfully and reading the informed-consent waiver before any session.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">4. Bookings, consultations & waivers</h2>
          <p className="text-muted-foreground">Consultations and bookings are agreements between you and the practitioner. A booking cannot be confirmed until the required health screening and informed-consent waiver are completed and signed. Cancellation, rescheduling, and refund terms may be set by each practitioner.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">5. Practitioner obligations</h2>
          <p className="text-muted-foreground">Practitioners represent that their credentials are accurate, that they operate lawfully in their jurisdiction, maintain appropriate safety practices, and honor the consent/screening process. KamboGuide may verify, suspend, or remove listings for safety or policy reasons.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">6. Payments</h2>
          <p className="text-muted-foreground">Payments made through the platform are processed by our payment provider. Fees, subscriptions (practitioner tiers), and marketplace purchases are described at the point of sale.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">7. Conduct & content</h2>
          <p className="text-muted-foreground">You agree not to misuse the platform, post unlawful or harmful content, or misrepresent yourself. Community posts, reviews, and messages are subject to moderation. Reviews must reflect genuine experiences.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">8. Assumption of risk & disclaimer</h2>
          <p className="text-muted-foreground">You acknowledge Kambo involves inherent risks and that you participate voluntarily and at your own risk. The platform and its content are provided "as is" without warranties of any kind. See the practitioner's waiver and our <Link to={createPageUrl("Disclaimer")} className="text-primary hover:underline">Disclaimer</Link>.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">9. Limitation of liability</h2>
          <p className="text-muted-foreground">To the fullest extent permitted by law, KamboGuide is not liable for the acts, omissions, or services of practitioners, or for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
        </section>
        <section>
          <h2 className="text-lg font-semibold">10. Changes & contact</h2>
          <p className="text-muted-foreground">We may update these Terms; material changes will be posted here. Questions: support@kamboguide.app.</p>
        </section>
      </div>
    </div>
  );
}
