export const SITE = {
  name: "Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk.",
  shortName: "Bhoiraj Matsya Sanstha",
  regNo: "JGA/AGR/PCR OD/530",
  establishedOn: "22/06/2004",
  chairman: "Shri Bhika Shankar Bhoi",
  chairmanPhone: "+91 94215 17012",
  chairmanEmail: "bhikabhoi0@gmail.com",
  address: "Pimpalgaon Bk., Taluka Pachora, District Jalgaon, Maharashtra",
  area: "Pimpri – Dambhurni – Ghodasgaon",
  tagline: {
    en: "Empowering fisheries. Preserving trust. Since 2004.",
    hi: "मत्स्यपालन का सशक्तिकरण। विश्वास का संरक्षण। 2004 से।",
    mr: "मत्स्यव्यवसायाचे सक्षमीकरण. विश्वासाची जपणूक. २००४ पासून.",
  },
} as const;

/** Rotating slogans shown in the notice / hero strip. */
export const SLOGANS = [
  "जल हे जीवन — मत्स्यव्यवसाय हे उपजीविका.",
  "Every fisherman counted. Every record protected.",
  "स्वच्छ पाणी, समृद्ध मत्स्यशेती, सशक्त सहकार.",
  "One society. One digital record. Zero paperwork.",
  "मच्छीमारांचा सन्मान — सहकाराची ताकद.",
] as const;

/** The Aim of the society. */
export const AIM =
  "To organise the fishermen families of Pimpri, Dambhurni and Ghodasgaon into a single, transparent and digitally-managed cooperative — so that every member receives a fair share of the water resources, government scheme benefits and market value that their labour earns.";

/** Objectives, presented in the same numbered style as the national platform. */
export const OBJECTIVES = [
  {
    title: "Complete member registry",
    body: "Maintain a verified digital record of every fisherman family — identity, village, family details and membership number — with nothing kept on loose paper.",
  },
  {
    title: "Transparent dam & water management",
    body: "Publish water area, stocking, capacity and yearly dam audit reports so members can see exactly how the society's water bodies are managed.",
  },
  {
    title: "Access to government schemes",
    body: "Bring PMMSY, PM-MKSSY, insurance and credit schemes to members' fingertips with plain-language guidance in Marathi, Hindi and English.",
  },
  {
    title: "Financial accountability",
    body: "Record every audit, expenditure and society document in one vault, downloadable by the Chairman for inspection at any time.",
  },
  {
    title: "Skill & awareness building",
    body: "Share training material, notices and best practices for scientific fish farming, safety at water and post-harvest handling.",
  },
  {
    title: "Grievance redressal",
    body: "Give every member a direct, recorded channel to raise a complaint or request, with the Chairman answering from the portal itself.",
  },
] as const;

/** "How to Register?" roadmap for new members. */
export const ROADMAP = [
  { step: 1, title: "Open Registration", body: "Tap the New Member Registration button on this page." },
  { step: 2, title: "Enter your name", body: "Full name, father's or husband's name and surname, exactly as on your Aadhaar." },
  { step: 3, title: "Mobile number", body: "A 10-digit mobile number, unique to you. This becomes your login ID." },
  { step: 4, title: "Aadhaar & documents", body: "12-digit Aadhaar number is mandatory; PAN and e-Shram numbers are optional." },
  { step: 5, title: "Age check", body: "The portal accepts applicants aged 20 years and above." },
  { step: 6, title: "Create a password", body: "Use the strong password suggestion so your browser can save it safely." },
  { step: 7, title: "Chairman verification", body: "The Chairman reviews your application and approves genuine applicants." },
  { step: 8, title: "You are live", body: "Your membership number is issued and your name appears in Registered Members instantly." },
] as const;

/** Frequently asked questions shown at the end of the homepage. */
export const FAQS = [
  {
    q: "Who can become a member of the society?",
    a: "Any fisherman or fisherman-family member aged 20 years or above, residing in the Pimpri – Dambhurni – Ghodasgaon area, may apply. The Chairman verifies every application before approval.",
  },
  {
    q: "Which documents do I need for registration?",
    a: "A 12-digit Aadhaar number and a working 10-digit mobile number are mandatory. PAN and e-Shram card numbers are optional but recommended for scheme benefits.",
  },
  {
    q: "Can two members register with the same mobile number?",
    a: "No. Each mobile number can be linked to only one membership. The portal blocks duplicate numbers automatically.",
  },
  {
    q: "How long does approval take?",
    a: "Applications are usually reviewed by the Chairman within a few working days. As soon as it is approved, your name and membership number appear in the Registered Members list.",
  },
  {
    q: "What is my login ID?",
    a: "You can sign in with your registered mobile number, your Aadhaar number or your email address — whichever you remember — along with your password. Continue with Google also works.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: "Open Forgot Password, enter your mobile number, Aadhaar number or email, verify the one-time code and set a new password on the spot. No waiting for an email link.",
  },
  {
    q: "Are my Aadhaar and PAN numbers visible to the public?",
    a: "Never. Identity numbers and uploaded documents are visible only to you and to the Chairman/Admin. The public list shows only name, village and membership number.",
  },
  {
    q: "Who can see my mobile number?",
    a: "Only signed-in members of the society and the Chairman. Visitors to the public website cannot see contact numbers.",
  },
  {
    q: "Where can I read the dam audit reports?",
    a: "Sign in and open Dam Audits. Every report uploaded by the Chairman — with cost, findings and attached PDF — is listed there.",
  },
  {
    q: "Which government schemes are covered?",
    a: "PMMSY, PM-MKSSY, group accident insurance, aquaculture insurance and credit facilitation, among others. Open the Schemes page for the current list.",
  },
  {
    q: "In which languages does the portal work?",
    a: "English, हिंदी and मराठी. Use the language switch in the header; the AI assistant also answers in your chosen language.",
  },
  {
    q: "How do I raise a complaint?",
    a: "Use the Grievance Form at the bottom of this page. Your complaint reaches the Chairman directly and is recorded with a timestamp.",
  },
] as const;

/** Scheme cards shown on the homepage. */
export const SCHEME_CARDS = [
  { title: "PMMSY", desc: "Pradhan Mantri Matsya Sampada Yojana — infrastructure, ponds, cages and post-harvest support.", tone: "primary" },
  { title: "PM-MKSSY", desc: "Formalisation of the fisheries sector, work-based identity and micro-enterprise support.", tone: "saffron" },
  { title: "Group Accident Insurance", desc: "Accident cover for active fishers registered with the society.", tone: "teal" },
  { title: "Aquaculture Insurance", desc: "Protection against stock loss from disease, flood and natural calamity.", tone: "accent" },
  { title: "Credit Facilitation", desc: "Kisan Credit Card and working-capital linkage for fish farming.", tone: "primary" },
  { title: "Training & Skilling", desc: "Scientific fish farming, seed handling and safety-at-water training.", tone: "teal" },
] as const;
