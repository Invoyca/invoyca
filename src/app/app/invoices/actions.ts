"use server";

// Fatura kaydetme — gerçek Prisma kaydı.
// GÜVENLİK: Prisma service-role ile çalışır (RLS bypass). Bu yüzden HER sorguda
// kaydın oturum açan kullanıcıya ait olduğunu companyId/userId ile doğruluyoruz.

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeImageDataUrl } from "@/lib/validation";
import { canTransition, shouldCancelInsteadOfDelete } from "@/lib/invoice-status";
import { audit } from "@/lib/audit";

// Sunucu tarafı doğrulama şeması — client'tan gelen veriye GÜVENMEYİZ.
const itemSchema = z.object({
  description: z.string().min(1).max(500),
  unit: z.string().max(50).optional().default(""),
  quantity: z.number().finite().min(0).max(1_000_000),
  unitPrice: z.number().finite().min(0).max(100_000_000),
  vatRate: z.number().finite().min(0).max(100),
});
const saveSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1).max(50),
  clientName: z.string().max(200).optional().default(""),
  clientVat: z.string().max(100).optional().default(""),
  clientAddr: z.string().max(500).optional().default(""),
  clientEmail: z.string().max(200).optional().default("").refine(
    (e) => !e || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    { message: "Geçerli bir e-posta girin" }
  ),
  currency: z.enum(["EUR", "USD", "GBP", "TRY"]).optional().default("EUR"),
  taxMode: z.enum(["normal", "reverse", "exempt"]).optional().default("normal"),
  qrMode: z.string().optional(),
  qrImage: z.string().optional(),
  bankName: z.string().optional(),
  bankIban: z.string().optional(),
  bankSwift: z.string().optional(),
  template: z.string().max(50),
  themeColor: z.string().max(50),
  issueDate: z.string().max(40),
  dueDate: z.string().max(40).optional().default(""),
  items: z.array(itemSchema).min(1).max(200),
  docType: z.enum(["INVOICE", "QUOTE"]).optional().default("INVOICE"),
  language: z.enum(["TR", "EN", "DE", "NL", "FR", "ES", "IT"]).optional().default("TR"),
  notes: z.string().max(2000).optional(),
  terms: z.string().max(2000).optional(),
  subtitle: z.string().max(200).optional(),
}).refine(
  (d) => {
    // Vade tarihi, düzenleme tarihinden önce olamaz
    if (!d.dueDate || !d.issueDate) return true;
    const issue = new Date(d.issueDate);
    const due = new Date(d.dueDate);
    if (isNaN(issue.getTime()) || isNaN(due.getTime())) return true; // tarih parse edilemezse atla
    return due >= issue;
  },
  { message: "Vade tarihi, fatura tarihinden önce olamaz", path: ["dueDate"] }
);

// Sıradaki fatura numarasını üret (şirket bazlı). Format: 2026-0001
// Fatura numarası ÖNİZLEMESİ (tahmin). Kesin numara kayıt anında saveInvoice
// içinde transaction ile atomik atanır; bu sadece kullanıcıya gösterilecek tahmindir.
export async function getNextInvoiceNumber() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, number: "" };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  const year = new Date().getFullYear();
  if (!company) return { ok: true, number: `${year}-0001` };

  // Sayaçtan oku (varsa). Yoksa ilk numara.
  const seq = await prisma.invoiceSequence.findUnique({
    where: { companyId_year: { companyId: company.id, year } },
  });
  const next = (seq?.lastNumber ?? 0) + 1;
  return { ok: true, number: `${year}-${String(next).padStart(4, "0")}` };
}


export type SaveInvoiceInput = {
  id?: string;
  number: string;
  clientName: string;
  clientVat: string;
  clientAddr: string;
  clientEmail?: string;
  currency: string;
  taxMode: string;        // "normal" | "reverse" | "exempt"
  qrMode?: string;
  qrImage?: string;
  bankName?: string;
  bankIban?: string;
  bankSwift?: string;
  template: string;
  themeColor: string;
  issueDate?: string;     // "GG.AA.YYYY" (tr-TR) veya boş
  dueDate?: string;
  items: { description: string; unit: string; quantity: number; unitPrice: number; vatRate: number }[];
  subtotal: number;
  vatTotal: number;
  total: number;
  notes?: string;
  terms?: string;
  subtitle?: string;
  docType?: "INVOICE" | "QUOTE";   // teklif mi fatura mı
  language?: string;
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

  // 0) GÜVENLİK: Gelen veriyi doğrula. Geçersizse reddet.
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".") || "";
    // Teknik Zod mesajı yerine, alana göre anlamlı bir kod döndür.
    // Frontend bunu kendi diline çevirir.
    let code = "invalid";
    if (path.includes("description")) code = "item_description";
    else if (path.includes("quantity")) code = "item_quantity";
    else if (path.includes("unitPrice")) code = "item_price";
    else if (path.includes("vatRate")) code = "item_vat";
    else if (path.includes("clientEmail")) code = "client_email";
    else if (path.includes("dueDate")) code = "due_date";
    else if (path.includes("items")) code = "items_empty";
    else if (path.includes("number")) code = "number";
    return { ok: false, errorCode: code };
  }
  const v = parsed.data;

  // 0b) GÜVENLİK: Toplamları SUNUCU hesaplar. Client'ın gönderdiği toplama GÜVENMEYİZ.
  let calcSubtotal = 0, calcVat = 0;
  for (const it of v.items) {
    const line = it.quantity * it.unitPrice;
    calcSubtotal += line;
    // Tevkifat/muaf modunda KDV 0; normalde satır KDV'si
    if (v.taxMode === "normal") calcVat += line * (it.vatRate / 100);
  }
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const serverSubtotal = round2(calcSubtotal);
  const serverVat = round2(calcVat);
  const serverTotal = round2(calcSubtotal + calcVat);

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
    if (v.clientName) {
      client = await prisma.client.findFirst({
        where: { companyId: company.id, name: v.clientName },
      });
      if (!client) {
        client = await prisma.client.create({
          data: {
            companyId: company.id,
            name: v.clientName,
            vatId: v.clientVat || null,
            address: v.clientAddr || null,
            email: v.clientEmail || null,
            preferredLanguage: (v.language as any) || null,
          },
        });
      } else {
        // Mevcut müşteriye bu fatura dilini hatırlat (sonraki faturalar bu dilde gelsin)
        await prisma.client.update({
          where: { id: client.id },
          data: { preferredLanguage: (v.language as any) || null },
        });
      }
    }

    // 3) Faturayı oluştur VEYA güncelle (id varsa düzenleme).
    const invoiceData = {
      clientId: client?.id ?? null,
      number: v.number,
      type: (v.docType ?? "INVOICE") as any,
      currency: (v.currency as any) ?? "EUR",
      taxMode: TAX_MAP[v.taxMode] ?? "NORMAL",
      qrMode: QR_MAP[v.qrMode ?? "verify"] ?? "VERIFY",
      qrImage: sanitizeImageDataUrl(v.qrImage),
      bankName: v.bankName || null,
      bankIban: v.bankIban || null,
      bankSwift: v.bankSwift || null,
      template: v.template,
      themeColor: v.themeColor,
      language: (v.language as any) || "TR",
      issueDate: parseDate(v.issueDate),
      dueDate: v.dueDate ? parseDate(v.dueDate) : null,
      subtotal: serverSubtotal,
      vatTotal: serverVat,
      total: serverTotal,
      notes: v.notes ?? null,
      terms: (v as any).terms ?? null,
      subtitle: (v as any).subtitle ?? null,
      // GÖNDEREN snapshot'ı — fatura kesildiği andaki şirket bilgisi (sonra değişse bile sabit kalır)
      senderName: company.name || null,
      senderAddress: [company.address, company.city, company.country].filter(Boolean).join("\n") || null,
      senderTaxId: company.taxId || null,
      senderVatId: company.vatId || null,
      senderEmail: company.email || null,
      // MÜŞTERİ snapshot'ı — fatura kesildiği andaki müşteri bilgisi (sonra değişse/silinse bile sabit kalır)
      clientNameSnap: v.clientName || null,
      clientAddressSnap: v.clientAddr || null,
      clientCountrySnap: null,
      clientVatIdSnap: v.clientVat || null,
      clientEmailSnap: v.clientEmail || null,
    };
    const itemsCreate = v.items.map((it, i) => ({
      description: it.description, unit: it.unit, quantity: it.quantity,
      unitPrice: it.unitPrice, vatRate: it.vatRate,
      amount: round2(it.quantity * it.unitPrice), order: i,
    }));

    let invoice;
    if (v.id) {
      // DÜZENLEME: sadece kendi faturası mı doğrula, sonra güncelle.
      const existing = await prisma.invoice.findFirst({ where: { id: v.id, companyId: company.id } });
      if (!existing) return { ok: false, error: "Fatura bulunamadı." };
      // Eski kalemleri sil, yenilerini yaz (en temiz yöntem)
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: v.id } });
      invoice = await prisma.invoice.update({
        where: { id: v.id },
        data: { ...invoiceData, items: { create: itemsCreate } },
      });
    } else {
      // YENİ KAYIT — fatura numarasını transaction içinde ATOMİK üret (çakışma önleme).
      // İki kullanıcı/sekme aynı anda kaydetse bile sayaç atomik arttığı için numara çakışmaz.
      const companyId = company.id;
      const year = new Date().getFullYear();
      invoice = await prisma.$transaction(async (tx: any) => {
        // Sayacı atomik artır (yoksa oluştur)
        const seq = await tx.invoiceSequence.upsert({
          where: { companyId_year: { companyId, year } },
          update: { lastNumber: { increment: 1 } },
          create: { companyId, year, lastNumber: 1 },
        });
        const number = `${year}-${String(seq.lastNumber).padStart(4, "0")}`;
        return tx.invoice.create({
          data: { companyId, ...invoiceData, number, items: { create: itemsCreate } },
        });
      });
    }

    // Denetim kaydı (yeni fatura veya güncelleme)
    await audit(company.id, v.id ? "invoice.updated" : "invoice.created", invoice.id, invoice.number);

    return { ok: true, id: invoice.id, number: invoice.number };
  } catch (err: any) {
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
// Faturayı kopyala — kalemleriyle birlikte yeni bir TASLAK oluşturur (yeni numara, bugünün tarihi)
export async function duplicateInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  // Kaynak fatura SADECE bu şirkete aitse gelir (yatay yetki)
  const src = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!src) return { ok: false, error: "Fatura bulunamadı." };

  const year = new Date().getFullYear();
  try {
    const newId = await prisma.$transaction(async (tx: any) => {
      // Yeni numara üret (atomik)
      const seq = await tx.invoiceSequence.upsert({
        where: { companyId_year: { companyId: company.id, year } },
        update: { lastNumber: { increment: 1 } },
        create: { companyId: company.id, year, lastNumber: 1 },
      });
      const number = `${year}-${String(seq.lastNumber).padStart(4, "0")}`;

      const created = await tx.invoice.create({
        data: {
          companyId: company.id,
          clientId: src.clientId,
          number,
          type: src.type,
          status: "DRAFT" as any,
          issueDate: new Date(),
          dueDate: null,
          paidAt: null,
          currency: src.currency,
          taxMode: (src as any).taxMode,
          subtotal: src.subtotal,
          discount: src.discount,
          vatTotal: src.vatTotal,
          total: src.total,
          notes: (src as any).notes,
          terms: (src as any).terms,
          subtitle: (src as any).subtitle,
          bankName: (src as any).bankName,
          bankIban: (src as any).bankIban,
          bankSwift: (src as any).bankSwift,
          senderName: (src as any).senderName,
          senderAddress: (src as any).senderAddress,
          senderTaxId: (src as any).senderTaxId,
          senderVatId: (src as any).senderVatId,
          senderEmail: (src as any).senderEmail,
          clientNameSnap: (src as any).clientNameSnap,
          clientAddressSnap: (src as any).clientAddressSnap,
          clientCountrySnap: (src as any).clientCountrySnap,
          clientVatIdSnap: (src as any).clientVatIdSnap,
          clientEmailSnap: (src as any).clientEmailSnap,
          qrMode: (src as any).qrMode,
          qrImage: (src as any).qrImage,
          template: (src as any).template,
          themeColor: (src as any).themeColor,
          language: (src as any).language,
          items: {
            create: src.items.map((it: any) => ({
              description: it.description, unit: it.unit, quantity: it.quantity,
              unitPrice: it.unitPrice, vatRate: it.vatRate, amount: it.amount, order: it.order,
            })),
          },
        },
      });
      return created.id;
    });
    await audit(company.id, "invoice.created", newId, `duplicated from ${src.number}`);
    return { ok: true, id: newId };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kopyalanamadı." };
  }
}

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
export async function updateInvoiceStatus(invoiceId: string, status: string, paidAt?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  const valid = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
  if (!valid.includes(status)) return { ok: false, error: "Geçersiz durum." };

  // Mevcut durumu çek (yatay yetki + geçiş kontrolü için)
  const current = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    select: { status: true },
  });
  if (!current) return { ok: false, error: "Fatura bulunamadı." };

  // Durum geçişi kurallı mı? (örn. PAID → DRAFT yasak)
  if (!canTransition(current.status, status)) {
    return { ok: false, error: `Bu geçiş yapılamaz: ${current.status} → ${status}` };
  }

  // PAID ise ödeme tarihini ayarla (verilmemişse bugün); PAID değilse temizle
  let paidDate: Date | null = null;
  if (status === "PAID") {
    paidDate = paidAt ? new Date(paidAt) : new Date();
    if (isNaN(paidDate.getTime())) paidDate = new Date();
  }

  const result = await prisma.invoice.updateMany({
    where: { id: invoiceId, companyId: company.id },
    data: { status: status as any, paidAt: paidDate } as any,
  });
  if (result.count === 0) return { ok: false, error: "Fatura bulunamadı." };
  await audit(company.id, "invoice.status_changed", invoiceId, `${current.status} -> ${status}${paidDate ? ` (${paidDate.toISOString().slice(0,10)})` : ""}`);
  return { ok: true };
}
// Tek faturayı kalemleriyle getir (detay + düzenleme için)
export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı.", invoice: null };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı.", invoice: null };

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },   // yatay yetki koruması
    include: { client: true, items: { orderBy: { order: "asc" } } },
  });
  if (!invoice) return { ok: false, error: "Fatura bulunamadı.", invoice: null };
  return { ok: true, invoice };
}

// Bir faturanın işlem geçmişi (AuditLog'dan, en yeni üstte)
export async function getInvoiceHistory(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, events: [] as any[] };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, events: [] as any[] };

  // Sadece bu şirkete ait ve bu faturayla ilgili kayıtlar (yatay yetki)
  const events = await (prisma as any).auditLog.findMany({
    where: { companyId: company.id, entityId: invoiceId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return { ok: true, events };
}

export async function deleteInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) return { ok: false, error: "Şirket bulunamadı." };

  // Mevcut durumu çek — silme kuralı duruma bağlı
  const current = await prisma.invoice.findFirst({
    where: { id: invoiceId, companyId: company.id },
    select: { status: true },
  });
  if (!current) return { ok: false, error: "Fatura bulunamadı." };

  // PAID fatura silinemez (muhasebe kaydı) ve iptal de edilemez
  if (String(current.status).toUpperCase() === "PAID") {
    return { ok: false, error: "Ödenmiş fatura silinemez. Önce durumunu değiştirin." };
  }

  // SENT/OVERDUE: silmek yerine İPTAL et (kayıt korunur)
  if (shouldCancelInsteadOfDelete(current.status)) {
    await prisma.invoice.updateMany({
      where: { id: invoiceId, companyId: company.id },
      data: { status: "CANCELLED" as any },
    });
    await audit(company.id, "invoice.cancelled", invoiceId, `${current.status} -> CANCELLED`);
    return { ok: true, cancelled: true };
  }

  // DRAFT (veya CANCELLED): gerçekten sil
  const result = await prisma.invoice.deleteMany({
    where: { id: invoiceId, companyId: company.id },
  });
  if (result.count === 0) return { ok: false, error: "Fatura bulunamadı." };
  await audit(company.id, "invoice.deleted", invoiceId, null);
  return { ok: true, deleted: true };
}
