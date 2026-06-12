import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { LOCALES } from "@/lib/landing-seo";

// Kök sayfa: tarayıcı diline göre uygun locale'e yönlendirir (SEO + UX)
export default async function RootPage() {
  const h = await headers();
  const accept = (h.get("accept-language") || "").toLowerCase();
  // accept-language'tan ilk desteklenen dili bul; bulunamazsa TR
  let target = "tr";
  for (const part of accept.split(",")) {
    const code = part.trim().slice(0, 2);
    if ((LOCALES as readonly string[]).includes(code)) { target = code; break; }
  }
  redirect(`/${target}`);
}
