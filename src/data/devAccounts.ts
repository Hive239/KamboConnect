/**
 * DEV-ONLY demo accounts for the Role Switcher. These are real Supabase auth
 * users (seeded profiles + practitioner records + demo data live in the DB).
 * The switcher signs in as each via supabase.auth.signInWithPassword.
 *
 * NOTE: passwords live in code for local dev convenience only — this whole
 * surface is gated behind `import.meta.env.DEV` and never ships to production.
 * Rotate these before any public deployment.
 */
export interface DevAccount {
  email: string;
  password: string; // empty → switcher will prompt for it at click time
  label: string;
  role: "Admin" | "Practitioner" | "Client";
  description: string;
}

export const DEV_ACCOUNTS: DevAccount[] = [
  { email: "239hive@gmail.com", password: "", label: "Matthew", role: "Admin", description: "Full platform access · bookable practitioner" },
  { email: "omar@thequantumsoul.love", password: "Kambo1", label: "Omar", role: "Admin", description: "Full platform access · bookable practitioner" },
  { email: "testpracticioner@gmail.com", password: "Test1", label: "Maria Santos", role: "Practitioner", description: "Profile, events, shop, client bookings" },
  { email: "testclient@gmail.com", password: "Test1", label: "Jordan Rivera", role: "Client", description: "Books sessions & consultations" },
];
