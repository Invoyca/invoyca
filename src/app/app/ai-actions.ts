"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

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

  // Son 24 saatteki AI istek sayısı — başarılı VE başarısız tüm denemeleri say
  // (kötüye kullanan biri sürekli başarısız istek atamasın).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const used = await (prisma as any).auditLog.count({
    where: { companyId: company.id, action: "ai.requested", createdAt: { gte: since } },
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

// AI kullanımını AuditLog'a yaz. status: "succeeded" | "failed" | "requested"
// (Ayrı AiUsage tablosu Tur 3'te eklenebilir; şimdilik AuditLog yeterli.)
async function logAi(companyId: string, feature: string, status: string, detail?: string) {
  await (prisma as any).auditLog.create({
    data: {
      companyId,
      action: status === "succeeded" ? "ai.used" : `ai.${status}`,
      entityId: null,
      detail: detail ? `${feature}:${detail}` : feature,
    },
  }).catch(() => {});
}

// AI e-posta taslağı girdisi — Zod ile doğrulanır (uzunluk + enum sınırları)
const EmailDraftSchema = z.object({
  clientName: z.string().max(150).optional(),
  invoiceNo: z.string().max(80).optional(),
  amount: z.string().max(50).optional(),
  currency: z.enum(["EUR", "USD", "GBP", "TRY"]).optional(),
  dueDate: z.string().max(80).optional(),
  companyName: z.string().max(150).optional(),
  lang: z.enum(["TR", "EN", "DE", "NL", "FR", "ES", "IT"]).optional(),
  isQuote: z.boolean().optional(),
  tone: z.enum(["professional", "friendly", "reminder"]).optional(),
});
type EmailDraftInput = z.input<typeof EmailDraftSchema>;

// AI ile müşteri e-postası taslağı üretir (kullanıcı sonra düzenler)
export async function generateEmailDraft(rawInput: EmailDraftInput) {
  const access = await checkAiAccess();
  if (!access.ok) return { ok: false, error: access.error };

  // Girdiyi doğrula (server input'a doğrudan güvenmez)
  const parsed = EmailDraftSchema.safeParse(rawInput);
  if (!parsed.success) {
    await logAi(access.companyId, "email_draft", "failed", "invalid_input");
    return { ok: false, error: "Geçersiz giriş." };
  }
  const input = parsed.data;

  // İsteği kaydet (limit bunu sayar — başarısız da olsa kota tüketir)
  await logAi(access.companyId, "email_draft", "requested");

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

  // Server input'a doğrudan güvenmez — prompt'a girmeden önce ekstra kes (savunma katmanı)
  const s = (v: string | undefined, n: number) => String(v || "").slice(0, n);
  const user = `Write a ${docType} email with these details:\n`
    + `Client: ${s(input.clientName, 150) || "the client"}\n`
    + `${docType === "quote" ? "Quote" : "Invoice"} number: ${s(input.invoiceNo, 80) || "(see attached)"}\n`
    + `Amount: ${s(input.amount, 50)} ${input.currency || ""}\n`
    + `Due date: ${s(input.dueDate, 80) || "(see invoice)"}\n`
    + `From company: ${s(input.companyName, 150) || "us"}\n`
    + `The PDF is attached. Mention that payment details are in the attached document.`;

  try {
    const text = await callClaude(system, user);
    await logAi(access.companyId, "email_draft", "succeeded");
    return { ok: true, text };
  } catch (e: any) {
    // Başarısız çağrıyı da kaydet (kötüye kullanım/hata takibi için)
    await logAi(access.companyId, "email_draft", "failed", String(e?.message || "").slice(0, 60));
    return { ok: false, error: e?.message || "AI metni üretilemedi." };
  }
}
