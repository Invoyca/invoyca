"use server";

// Fatura kaydetme — gerçek Prisma kaydı.
// GÜVENLİK: Prisma service-role ile çalışır (RLS bypass). Bu yüzden HER sorguda
// kaydın oturum açan kullanıcıya ait olduğunu companyId/userId ile doğruluyoruz.

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export type SaveInvoiceInput = {
  number: string;
  clientName: string;
  clientVat: string;
  clientAddr: string;
  clientEmail?: string;
  currency: string;
  taxMode: string;        // "normal" | "reverse" | "exempt"
  qrMode?: string;
  template: string;
  themeColor: string;
  issueDate?: string;     // "GG.AA.YYYY" (tr-TR) veya boş
  dueDate?: string;
  items: { description: string; unit: string; quantity: number; unitPrice: number; vatRate: number }[];
  subtotal: number;
  vatTotal: number;
  total: number;
  notes?: string;
  docType?: "INVOICE" | "QUOTE";   // teklif mi fatura mı
};

// "07.06.2026" / "2026-06-07" / boş → Date
function parseDate(s?: string): Date {
  if (!s) return new Date();
  const tr = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/); // GG.AA.YYYY
  if (tr) return new Date(Number(tr[3]), Number(tr[2]) - 1, Number(tr[1]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? new Date() : d;
}

const TAX_MAP: Record<string, "NORMAL" | "REVERSE" | "EXEMPT"> = {
  normal: "NORMAL", reverse: "REVERSE", exempt: "EXEMPT",
};
const QR_MAP: Record<string, "VERIFY" | "PAY" | "OFF"> = {
  verify: "VERIFY", pay: "PAY", off: "OFF",
};

export async function saveInvoice(input: SaveInvoiceInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  try {
    // 1) Kullanıcının User + Company kaydını bul/oluştur (ilk kullanımda yoksa).
    let company = await prisma.company.findUnique({ where: { userId: user.id } });
    if (!company) {
      // User yoksa önce onu oluştur (Supabase auth ile aynı id).
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: { id: user.id, email: user.email ?? "", name: user.user_metadata?.name ?? null },
      });
      company = await prisma.company.create({
        data: { userId: user.id, name: "Şirketim" },
      });
    }

    // 2) Müşteriyi bul/oluştur (aynı isimde varsa tekrar kullan).
    let client = null;
    if (input.clientName) {
      client = await prisma.client.findFirst({
        where: { companyId: company.id, name: input.clientName },
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            companyId: company.id,
            name: input.clientName,
            vatId: input.clientVat || null,
            address: input.clientAddr || null,
            email: input.clientEmail || null,
          },
        });
      }
    }

    // 3) Faturayı oluştur (kalemlerle birlikte). companyId daima oturum sahibinin.
    const invoice = await prisma.invoice.create({
      data: {
        companyId: company.id,
        clientId: client?.id ?? null,
        number: input.number,
        type: (input.docType ?? "INVOICE") as any,
        currency: (input.currency as any) ?? "EUR",
        taxMode: TAX_MAP[input.taxMode] ?? "NORMAL",
        qrMode: QR_MAP[input.qrMode ?? "verify"] ?? "VERIFY",
        template: input.template,
        themeColor: input.themeColor,
        issueDate: parseDate(input.issueDate),
        dueDate: input.dueDate ? parseDate(input.dueDate) : null,
        subtotal: input.subtotal,
        vatTotal: input.vatTotal,
        total: input.total,
        notes: input.notes ?? null,
        items: {
          create: input.items.map((it, i) => ({
            description: it.description,
            unit: it.unit,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            vatRate: it.vatRate,
            amount: it.quantity * it.unitPrice,
            order: i,
          })),
        },
      },
    });

    return { ok: true, id: invoice.id };
  } catch (err: any) {
    // number+companyId benzersiz; aynı no tekrar girilirse anlamlı mesaj
    if (err?.code === "P2002") return { ok: false, error: "Bu fatura numarası zaten kullanılmış." };
    return { ok: false, error: err?.message || "Kayıt başarısız." };
  }
}

// Oturum sahibinin faturalarını listeler — GÜVENLİK: sadece kendi company'si.
export async function listInvoices(docType: "INVOICE" | "QUOTE" = "INVOICE") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı.", invoices: [] };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: true, invoices: [] };

  // INVOICE türü için QUOTE dışındaki hepsi (INVOICE/PROFORMA/COMMERCIAL), QUOTE için sadece teklifler
  const typeFilter = docType === "QUOTE"
    ? { type: "QUOTE" as any }
    : { type: { not: "QUOTE" as any } };

  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id, ...typeFilter },  // <-- yatay yetki + tür filtresi
    orderBy: { createdAt: "desc" },
    include: { client: true },
    take: 100,
  });
  return { ok: true, invoices };
}

// Teklifi faturaya dönüştür (type: QUOTE → INVOICE)
export async function convertQuoteToInvoice(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  const result = await prisma.invoice.updateMany({
    where: { id, companyId: company.id, type: "QUOTE" as any },
    data: { type: "INVOICE" as any, status: "DRAFT" as any },
  });
  if (result.count === 0) return { ok: false, error: "Teklif bulunamadı." };
  return { ok: true };
}

// Fatura durumunu değiştirir (Ödendi/Bekliyor vb.) — sadece kendi faturası.
export async function updateInvoiceStatus(invoiceId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  const valid = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
  if (!valid.includes(status)) return { ok: false, error: "Geçersiz durum." };

  // GÜVENLİK: updateMany + companyId filtresi → başkasının faturasını değiştiremez
  const result = await prisma.invoice.updateMany({
    where: { id: invoiceId, companyId: company.id },
    data: { status: status as any },
  });
  if (result.count === 0) return { ok: false, error: "Fatura bulunamadı." };
  return { ok: true };
}

// Fatura siler — sadece kendi faturası.
export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  const result = await prisma.invoice.deleteMany({
    where: { id: invoiceId, companyId: company.id },
  });
  if (result.count === 0) return { ok: false, error: "Fatura bulunamadı." };
  return { ok: true };
}
