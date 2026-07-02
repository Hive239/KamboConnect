/**
 * KamboGuide built-in coursework. Two educational tracks (NOT a certification or
 * license to practice). Content is grounded in widely published safety guidance
 * (e.g. IAKP-style training topics) and framed as traditional/educational — it
 * makes no medical claims. Curriculum lives in code (version-controlled); a user's
 * enrollment + progress lives in the `coursework_enrollments` table.
 */

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number; // index of the correct option
}
export interface Lesson {
  id: string;
  title: string;
  body: string[];       // paragraphs
  quiz?: QuizQuestion[];
}
export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}
export interface Track {
  id: "practitioner" | "client";
  title: string;
  subtitle: string;
  price: number;
  image: string;
  audience: string;
  modules: Module[];
}

export const TRACKS: Track[] = [
  {
    id: "practitioner",
    title: "Practitioner Safety Foundations",
    subtitle: "The safety, ethics, and screening groundwork every serving requires.",
    price: 49,
    image: "/images/frog-bicolor-1.jpg",
    audience: "For prospective and practicing facilitators",
    modules: [
      {
        id: "p-tradition",
        title: "Tradition, Lineage & Ethics",
        lessons: [
          {
            id: "p-tradition-1",
            title: "Roots of the practice",
            body: [
              "Kambo is the secretion of the giant monkey tree frog, Phyllomedusa bicolor, native to the upper Amazon. It has been used for generations by the Matsés, Katukina, Yawanawá and neighboring peoples — traditionally to build stamina, to clear what is called 'panema' (heaviness or bad luck), and within their own ceremonial context.",
              "Serving Kambo carries a responsibility to honor this lineage: to represent the tradition accurately, to source ethically (the frog is never harmed and is returned to the forest), and to give back to the communities who are its stewards.",
              "This course is educational. It is not a certification, a license, or medical training, and completing it does not qualify anyone to serve Kambo. Formal, in-person, supervised training is essential before ever working with another person.",
            ],
            quiz: [
              { q: "What is the correct framing of Kambo on this platform?", options: ["A proven medical treatment", "A traditional practice, not medical treatment", "A prescription therapy"], answer: 1 },
              { q: "Does completing this course qualify someone to serve Kambo?", options: ["Yes, it is a certification", "No — it is educational only", "Only for clients"], answer: 1 },
            ],
          },
          {
            id: "p-tradition-2",
            title: "Code of practice & scope",
            body: [
              "A responsible facilitator works strictly within scope: they do not diagnose, treat, cure, or prescribe, and they never advise a client to stop prescribed medication or delay medical care. They refer to licensed professionals when health questions arise.",
              "Core ethics include honesty about training and experience, informed consent, confidentiality, clear boundaries, appropriate setting, and never serving someone who is intoxicated, coerced, or unable to consent.",
            ],
            quiz: [
              { q: "Which is inside a facilitator's scope?", options: ["Telling a client to stop their medication", "Diagnosing an illness", "Referring health questions to a licensed professional"], answer: 2 },
            ],
          },
        ],
      },
      {
        id: "p-screening",
        title: "Screening & Contraindications",
        lessons: [
          {
            id: "p-screening-1",
            title: "The health intake",
            body: [
              "Every client, every time, completes a thorough health intake before a session — and key contraindications are re-confirmed verbally on the day. Screening is the single most important safety step.",
              "Absolute contraindications (never serve) commonly include serious heart conditions, history of stroke or aneurysm, current pregnancy or breastfeeding, serious mental-health conditions such as psychosis, epilepsy/seizure disorders, organ failure or transplant, and being on certain medications. Relative cautions require extra care and, where appropriate, medical clearance.",
              "When in doubt, do not serve. A clear, documented 'no' is always safer than a risky 'yes'.",
            ],
            quiz: [
              { q: "How often should a client be screened?", options: ["Once, at first ever session", "Every client, every session", "Only if they look unwell"], answer: 1 },
              { q: "If screening is unclear or a serious condition is present, the facilitator should…", options: ["Serve a smaller amount", "Decline to serve", "Ask the client to sign a waiver and proceed"], answer: 1 },
            ],
          },
        ],
      },
      {
        id: "p-safety",
        title: "Safety & Emergency Response",
        lessons: [
          {
            id: "p-safety-1",
            title: "Hydration & hyponatremia",
            body: [
              "Water safety is critical. Drinking too much water around a ceremony can cause hyponatremia — dangerously low blood sodium — which can be severe and, in documented cases, fatal. Kambo's effects (purging and peptide activity) compound this risk.",
              "Published guidance advises not exceeding roughly two liters of water total during the ceremony, and avoiding forced or excessive drinking. Some facilitators offer electrolyte support. Watch for warning signs such as confusion, severe headache, or unusual drowsiness, and treat them as an emergency.",
            ],
            quiz: [
              { q: "Drinking far too much water around a ceremony can cause…", options: ["Dehydration only", "Hyponatremia (low blood sodium), which can be dangerous", "No effect"], answer: 1 },
              { q: "Warning signs like confusion or severe headache should be…", options: ["Ignored — they are normal", "Treated as an emergency", "Fixed with more water"], answer: 1 },
            ],
          },
          {
            id: "p-safety-2",
            title: "Emergency preparedness",
            body: [
              "A facilitator prepares for the rare emergency before it happens: a clear plan, a charged phone, the address ready to give to emergency services, first-aid readiness, and knowledge of when to call for professional help immediately.",
              "Never serve alone with a first-timer without a plan, never leave a client unattended during the acute phase, and always err toward calling emergency services when something is wrong.",
            ],
            quiz: [
              { q: "When something goes seriously wrong in a session, the facilitator should…", options: ["Wait to see if it passes", "Call emergency services without delay", "End the session and send the client home alone"], answer: 1 },
            ],
          },
        ],
      },
      {
        id: "p-craft",
        title: "Session Craft, Consent & Aftercare",
        lessons: [
          {
            id: "p-craft-1",
            title: "Consent, hygiene & aftercare",
            body: [
              "Informed consent and a signed waiver come before any application: the client understands the process, the risks, and what to expect. Hygiene is non-negotiable — clean tools, safe handling, and careful point placement.",
              "Aftercare matters as much as the session: rest, gentle nutrition, rehydration with electrolytes rather than excess plain water, and emotional integration support. Provide clear guidance on warning signs that warrant medical attention afterward.",
            ],
            quiz: [
              { q: "Informed consent and a signed waiver should happen…", options: ["After the session", "Before any application", "Only for new clients"], answer: 1 },
              { q: "Good aftercare rehydration favors…", options: ["As much plain water as possible", "Electrolyte support, not excess plain water", "No fluids at all"], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "client",
    title: "Preparing for Your Kambo Journey",
    subtitle: "How to approach a session safely, honestly, and well-supported.",
    price: 19,
    image: "/images/frog-bicolor-3.png",
    audience: "For anyone considering a session",
    modules: [
      {
        id: "c-understand",
        title: "Understanding Kambo",
        lessons: [
          {
            id: "c-understand-1",
            title: "What it is (and isn't)",
            body: [
              "Kambo is a traditional Amazonian practice using the secretion of the Phyllomedusa bicolor frog. On this platform it is presented as a cultural and traditional practice — not a medical treatment, and not a cure for any condition.",
              "The experience is typically short and physically intense, often including purging and a temporarily raised heart rate. These are traditional descriptions of the experience, not medical claims. Always consult your own doctor about your health.",
            ],
            quiz: [
              { q: "Kambo on this platform is presented as…", options: ["A medical cure", "A traditional practice, not medical treatment", "A prescription drug"], answer: 1 },
            ],
          },
        ],
      },
      {
        id: "c-candidate",
        title: "Are You a Good Candidate?",
        lessons: [
          {
            id: "c-candidate-1",
            title: "Honesty in screening",
            body: [
              "Your practitioner will ask detailed health questions. Answer them completely and honestly — screening exists to keep you safe. Conditions such as heart problems, stroke history, pregnancy or breastfeeding, epilepsy, serious mental-health conditions, and certain medications can make Kambo unsafe.",
              "If you have any health condition or take medication, talk to your doctor before considering a session. A responsible practitioner will decline to serve when it isn't safe — that is a sign of integrity, not rejection.",
            ],
            quiz: [
              { q: "Why does screening matter?", options: ["It's a formality", "It exists to keep you safe", "To sell you more sessions"], answer: 1 },
              { q: "If a practitioner declines to serve you for safety, that is…", options: ["A red flag", "A sign of integrity", "Illegal"], answer: 1 },
            ],
          },
        ],
      },
      {
        id: "c-prepare",
        title: "Preparing Safely",
        lessons: [
          {
            id: "c-prepare-1",
            title: "Hydration & the day itself",
            body: [
              "Follow your practitioner's guidance on preparation. A crucial safety point: do NOT drink excessive amounts of water. Drinking far too much can cause hyponatremia (dangerously low blood sodium), which can be serious.",
              "Come rested, follow any fasting guidance given, arrange safe transport home, and never attend under the influence of alcohol or drugs. Tell your practitioner immediately if you feel severe headache, confusion, or unusual drowsiness.",
            ],
            quiz: [
              { q: "Regarding water on the day, you should…", options: ["Drink as much as possible", "Avoid drinking excessive water — over-hydration is dangerous", "Not drink anything ever"], answer: 1 },
            ],
          },
        ],
      },
      {
        id: "c-integration",
        title: "Integration & Aftercare",
        lessons: [
          {
            id: "c-integration-1",
            title: "After your session",
            body: [
              "Give yourself time to rest and integrate. Rehydrate sensibly with electrolytes rather than large volumes of plain water, eat gently, and avoid strenuous activity for the rest of the day.",
              "Emotional integration is part of the process — journaling, rest, and support help. Seek medical attention promptly if you experience persistent vomiting, severe headache, confusion, fainting, or any symptom that worries you.",
            ],
            quiz: [
              { q: "After a session, if you have severe headache or confusion you should…", options: ["Sleep it off", "Seek medical attention promptly", "Drink more water"], answer: 1 },
            ],
          },
        ],
      },
    ],
  },
];

export const trackById = (id: string) => TRACKS.find((t) => t.id === id);
export const allLessons = (t: Track): Lesson[] => t.modules.flatMap((m) => m.lessons);
export const lessonCount = (t: Track) => allLessons(t).length;
