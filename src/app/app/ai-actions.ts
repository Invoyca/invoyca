"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// Günlük AI kullanım limiti (kötüye kullanım koruması). 2026 erken erişim için makul.
const DAILY_AI_LIMIT = 30;

// AI çağrılarının ortak güvenlik + limit kontrolü
async function checkAiAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false as const, error: "Şirket bulunamadı." };

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false as const, error: "AI servisi şu an kullanılamıyor." };
  }

  // Son 24 saatteki AI çağrı sayısı (AuditLog'dan)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await (prisma as any).auditLog.count({
    where: { companyId: company.id, action: "ai.used", createdAt: { gte: since } },
  });
  if (used >= DAILY_AI_LIMIT) {
    return { ok: false as const, error: "Günlük AI kullanım limitine ulaştın. Yarın tekrar deneyebilirsin." };
  }

  return { ok: true as const, companyId: company.id };
}

// Anthropic API'ye istek atar, üretilen metni döndürür
async function callClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY as string,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI yanıt vermedi (${res.status}). ${txt.slice(0, 120)}`);
  }
  const data = await res.json();
  const text = (data?.content || [])
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("AI boş yanıt verdi.");
  return text;
}

// Dil kodunu insan-okunur dile çevir (prompt için)
const LANG_NAME: Record<string, string> = {
  TR: "Turkish", EN: "English", DE: "German", NL: "Dutch", FR: "French", ES: "Spanish", IT: "Italian",
};

type EmailDraftInput = {
  clientName?: string;
  invoiceNo?: string;
  amount?: string;
  currency?: string;
  dueDate?: string;
  companyName?: string;
  lang?: string;
  isQuote?: boolean;
  tone?: "professional" | "friendly" | "reminder";
};

// AI ile müşteri e-postası taslağı üretir (kullanıcı sonra düzenler)
export async function generateEmailDraft(input: EmailDraftInput) {
  const access = await checkAiAccess();
  if (!access.ok) return { ok: false, error: access.error };

  const langName = LANG_NAME[String(input.lang || "EN").toUpperCase()] || "English";
  const docType = input.isQuote ? "quote" : "invoice";
  const toneDesc = input.tone === "reminder"
    ? "a polite payment reminder"
    : input.tone === "friendly"
      ? "warm but professional"
      : "professional and concise";

  const system = `You write short, professional business emails that accompany an invoice or quote sent to a client. `
    + `Write ONLY the email body text — no subject line, no markdown, no placeholders in brackets, no explanations. `
    + `Use real values provided. Keep it to 3-5 short sentences. Sign off with the company name. `
    + `Write entirely in ${langName}. Tone: ${toneDesc}.`;

  const user = `Write a ${docType} email with these details:\n`
    + `Client: ${input.clientName || "the client"}\n`
    + `${docType === "quote" ? "Quote" : "Invoice"} number: ${input.invoiceNo || "(see attached)"}\n`
    + `Amount: ${input.amount || ""} ${input.currency || ""}\n`
    + `Due date: ${input.dueDate || "(see invoice)"}\n`
    + `From company: ${input.companyName || "us"}\n`
    + `The PDF is attached. Mention that payment details are in the attached document.`;

  try {
    const text = await callClaude(system, user);
    // Kullanımı kaydet (limit sayacı için)
    await (prisma as any).auditLog.create({
      data: { companyId: access.companyId, action: "ai.used", entityId: null, detail: "email_draft" },
    }).catch(() => {});
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, error: e?.message || "AI metni üretilemedi." };
  }
}
