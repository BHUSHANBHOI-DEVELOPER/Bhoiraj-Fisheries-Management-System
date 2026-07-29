import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "mr";

type Dict = Record<string, { en: string; hi: string; mr: string }>;

export const dict: Dict = {
  "nav.home": { en: "Home", hi: "मुख्यपृष्ठ", mr: "मुख्यपृष्ठ" },
  "nav.about": { en: "About", hi: "हमारे बारे में", mr: "आमच्याविषयी" },
  "nav.schemes": { en: "Schemes", hi: "योजनाएं", mr: "योजना" },
  "nav.members": { en: "Members", hi: "सदस्य", mr: "सदस्य" },
  "nav.documents": { en: "Documents", hi: "दस्तावेज़", mr: "कागदपत्रे" },
  "nav.contact": { en: "Contact", hi: "संपर्क", mr: "संपर्क" },
  "nav.signin": { en: "Sign in", hi: "साइन इन", mr: "साइन इन" },
  "nav.signout": { en: "Sign out", hi: "साइन आउट", mr: "साइन आउट" },
  "nav.dashboard": { en: "Dashboard", hi: "डैशबोर्ड", mr: "डॅशबोर्ड" },
  "nav.chat": { en: "AI Assistant", hi: "AI सहायक", mr: "AI सहाय्यक" },
  "nav.admin": { en: "Admin", hi: "प्रशासन", mr: "प्रशासन" },

  "hero.badge": { en: "Registered Cooperative Society • Est. 2004", hi: "पंजीकृत सहकारी संस्था • स्था. 2004", mr: "नोंदणीकृत सहकारी संस्था • स्था. २००४" },
  "hero.title": {
    en: "Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk.",
    hi: "भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु.",
    mr: "भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु.",
  },
  "hero.subtitle": {
    en: "A secure digital platform for members, documents, audit reports and scheme benefits — one click access, anytime, anywhere.",
    hi: "सदस्यों, दस्तावेज़ों, ऑडिट रिपोर्ट और योजना लाभ के लिए एक सुरक्षित डिजिटल मंच — कहीं भी, कभी भी, एक क्लिक में।",
    mr: "सदस्य, कागदपत्रे, लेखापरीक्षण अहवाल आणि योजना लाभांसाठी सुरक्षित डिजिटल व्यासपीठ — कधीही, कुठेही, एका क्लिकवर.",
  },
  "hero.cta.member": { en: "Member Portal", hi: "सदस्य पोर्टल", mr: "सदस्य पोर्टल" },
  "hero.cta.learn": { en: "Learn more", hi: "और जानें", mr: "अधिक जाणून घ्या" },

  "features.title": { en: "Everything the society needs, in one portal", hi: "संस्था की सभी आवश्यकताएँ, एक ही पोर्टल पर", mr: "संस्थेच्या सर्व गरजा, एकाच पोर्टलवर" },
  "f1.title": { en: "Member Registry", hi: "सदस्य रजिस्ट्री", mr: "सदस्य नोंदणी" },
  "f1.body": { en: "Every member's records — ID, contact, family and role — kept safe and searchable.", hi: "प्रत्येक सदस्य के रिकॉर्ड — पहचान, संपर्क, परिवार और भूमिका — सुरक्षित और खोज योग्य।", mr: "प्रत्येक सदस्याची माहिती — ओळख, संपर्क, कुटुंब आणि भूमिका — सुरक्षित आणि शोधण्यायोग्य." },
  "f2.title": { en: "Document Vault", hi: "दस्तावेज़ वॉल्ट", mr: "कागदपत्र संग्रह" },
  "f2.body": { en: "Upload PDFs, Excel, photos and originals. Find any document in seconds.", hi: "PDF, Excel, फ़ोटो और मूल दस्तावेज़ अपलोड करें। कोई भी दस्तावेज़ सेकंडों में खोजें।", mr: "PDF, Excel, फोटो आणि मूळ कागदपत्रे अपलोड करा. कोणतेही कागदपत्र काही सेकंदात शोधा." },
  "f3.title": { en: "Dam Audit Reports", hi: "बांध ऑडिट रिपोर्ट", mr: "धरण लेखापरीक्षण अहवाल" },
  "f3.body": { en: "Complete audit history — costs, findings, and linked documents for every dam.", hi: "पूर्ण ऑडिट इतिहास — प्रत्येक बांध के लिए लागत, निष्कर्ष और संबंधित दस्तावेज़।", mr: "संपूर्ण लेखापरीक्षण इतिहास — प्रत्येक धरणासाठी खर्च, निष्कर्ष आणि संबंधित कागदपत्रे." },
  "f4.title": { en: "AI Assistant", hi: "AI सहायक", mr: "AI सहाय्यक" },
  "f4.body": { en: "Members ask questions in their language — the AI helps and forwards anything to admin.", hi: "सदस्य अपनी भाषा में प्रश्न पूछें — AI मदद करेगा और आवश्यक बातें प्रशासन को भेजेगा।", mr: "सदस्य त्यांच्या भाषेत प्रश्न विचारतात — AI मदत करते आणि आवश्यक ते प्रशासनाला पाठवते." },

  "society.title": { en: "About the Society", hi: "संस्था के बारे में", mr: "संस्थेविषयी" },
  "society.body": {
    en: "Bhoiraj Matsya Vyavsayik Sahakari Sanstha Maryadit, Pimpalgaon Bk. is a government-registered cooperative operating in the Pimpri–Dambhurni–Ghodasgaon area of Jalgaon district, Maharashtra. Since 2004, we have supported member livelihoods through pond and dam-based fisheries, credit facilitation, and government scheme benefits.",
    hi: "भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु., महाराष्ट्र के जलगाँव ज़िले के पिंपरी–डांभूर्णी–घोडासगाँव क्षेत्र में कार्यरत, एक सरकार-पंजीकृत सहकारी संस्था है। 2004 से हम तालाब और बांध आधारित मत्स्यपालन, ऋण सुविधा और सरकारी योजनाओं के माध्यम से सदस्यों की आजीविका को सहयोग दे रहे हैं।",
    mr: "भोईराज मत्स्य व्यवसायिक सहकारी संस्था मर्यादित, पिंपळगाव बु. ही जळगाव जिल्ह्यातील पिंपरी–डांभूर्णी–घोडासगाव भागात कार्यरत असलेली शासन-नोंदणीकृत सहकारी संस्था आहे. २००४ पासून आम्ही तलाव व धरण-आधारित मत्स्यव्यवसाय, कर्ज सुविधा आणि शासकीय योजनांच्या माध्यमातून सदस्यांच्या उपजीविकेस पाठिंबा देत आहोत.",
  },

  "auth.title": { en: "Sign in to your portal", hi: "अपने पोर्टल में साइन इन करें", mr: "आपल्या पोर्टलवर साइन इन करा" },
  "auth.email": { en: "Email", hi: "ईमेल", mr: "ईमेल" },
  "auth.password": { en: "Password", hi: "पासवर्ड", mr: "पासवर्ड" },
  "auth.name": { en: "Full name", hi: "पूरा नाम", mr: "पूर्ण नाव" },
  "auth.signin": { en: "Sign in", hi: "साइन इन", mr: "साइन इन" },
  "auth.signup": { en: "Create account", hi: "खाता बनाएँ", mr: "खाते तयार करा" },
  "auth.google": { en: "Continue with Google", hi: "Google से जारी रखें", mr: "Google द्वारे सुरू ठेवा" },
  "auth.or": { en: "or", hi: "या", mr: "किंवा" },
  "auth.switchSignup": { en: "New member? Create an account", hi: "नए सदस्य? खाता बनाएँ", mr: "नवीन सदस्य? खाते तयार करा" },
  "auth.switchSignin": { en: "Already registered? Sign in", hi: "पहले से पंजीकृत? साइन इन करें", mr: "आधीच नोंदणीकृत? साइन इन करा" },

  "footer.contact": { en: "Contact", hi: "संपर्क", mr: "संपर्क" },
  "footer.rights": { en: "All rights reserved.", hi: "सर्वाधिकार सुरक्षित।", mr: "सर्व हक्क राखीव." },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("lang") as Lang | null;
    if (saved === "en" || saved === "hi" || saved === "mr") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("lang", l);
  };

  const t = (k: keyof typeof dict) => dict[k]?.[lang] ?? String(k);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
