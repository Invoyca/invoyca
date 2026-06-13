"use server";

// Müşteri ve Ürün için CRUD işlemleri.
// GÜVENLİK: her sorgu oturum sahibinin company'siyle filtrelenir.

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { validateClientInput, validateProductInput, sanitizeImageDataUrl } from "@/lib/validation";

// Oturum sahibinin company'sini bul/oluştur (ilk kullanımda)
async function getCompany() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let company = await prisma.company.findUnique({ where: { userId: user.id } });
  if (!company) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { id: user.id, email: user.email ?? "", name: user.user_metadata?.name ?? null },
    });
    company = await prisma.company.create({ data: { userId: user.id, name: "Şirketim" } });
  }
  return company;
}

// ---------- MÜŞTERİLER ----------

export async function listClients() {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı.", clients: [] };
  const clients = await prisma.client.findMany({
    where: { companyId: company.id, isArchived: false } as any,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });
  return { ok: true, clients };
}

// Tek müşteri + o müşterinin faturaları (detay sayfası için, sahiplik kontrollü)
export async function getClientDetail(clientId: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı.", client: null, invoices: [] as any[] };
  // Müşteri SADECE bu şirkete aitse gelir (yatay yetki)
  const client = await prisma.client.findFirst({
    where: { id: clientId, companyId: company.id },
  });
  if (!client) return { ok: false, error: "Müşteri bulunamadı.", client: null, invoices: [] as any[] };
  const invoices = await prisma.invoice.findMany({
    where: { companyId: company.id, clientId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return { ok: true, client, invoices };
}

export async function createClientRecord(input: {
  name: string; email?: string; vatId?: string; address?: string; city?: string; country?: string; phone?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const cErr = validateClientInput(input); if (cErr) return { ok: false, error: cErr };

  try {
    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        name: input.name.trim(),
        email: input.email || null,
        vatId: input.vatId || null,
        address: input.address || null,
        city: input.city || null,
        country: input.country || null,
        phone: input.phone || null,
      },
    });
    return { ok: true, id: client.id, client };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kayıt başarısız." };
  }
}

export async function updateClient(id: string, input: {
  name: string; email?: string; vatId?: string; address?: string; city?: string; country?: string; phone?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const cErr = validateClientInput(input); if (cErr) return { ok: false, error: cErr };

  try {
    // Sadece kendi müşterisi mi doğrula (yatay yetki koruması)
    const existing = await prisma.client.findFirst({ where: { id, companyId: company.id } });
    if (!existing) return { ok: false, error: "Müşteri bulunamadı." };

    await prisma.client.update({
      where: { id },
      data: {
        name: input.name.trim(),
        email: input.email || null,
        vatId: input.vatId || null,
        address: input.address || null,
        city: input.city || null,
        country: input.country || null,
        phone: input.phone || null,
      },
    });
    return { ok: true, id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Güncelleme başarısız." };
  }
}

export async function deleteClient(id: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  try {
    // Müşteri bu şirkete mi ait + faturası var mı?
    const client = await prisma.client.findFirst({
      where: { id, companyId: company.id },
      include: { _count: { select: { invoices: true } } },
    });
    if (!client) return { ok: false, error: "Müşteri bulunamadı." };

    // Faturası varsa SİLME — arşivle (geçmiş faturalar korunmalı)
    if ((client as any)._count?.invoices > 0) {
      await prisma.client.update({ where: { id }, data: { isArchived: true } as any });
      return { ok: true, archived: true };
    }
    // Faturası yoksa gerçekten sil
    await prisma.client.delete({ where: { id } });
    return { ok: true, archived: false };
  } catch (e: any) {
    return { ok: false, error: "Müşteri silinemedi." };
  }
}

// ---------- ÜRÜNLER ----------

export async function listProducts() {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı.", products: [] };
  const products = await prisma.product.findMany({
    where: { companyId: company.id, isArchived: false } as any,
    orderBy: { createdAt: "desc" },
  });
  return { ok: true, products };
}

export async function createProduct(input: {
  name: string; description?: string; unit?: string; unitPrice: number; vatRate: number; currency?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const pErr = validateProductInput(input); if (pErr) return { ok: false, error: pErr };

  try {
    const product = await prisma.product.create({
      data: {
        companyId: company.id,
        name: input.name.trim(),
        description: input.description || null,
        unit: input.unit || "adet",
        unitPrice: input.unitPrice || 0,
        vatRate: input.vatRate ?? 20,
        currency: (input.currency as any) || "EUR",
      },
    });
    return { ok: true, id: product.id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kayıt başarısız." };
  }
}

export async function updateProduct(id: string, input: {
  name: string; description?: string; unit?: string; unitPrice: number; vatRate: number; currency?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const pErr = validateProductInput(input); if (pErr) return { ok: false, error: pErr };

  try {
    const existing = await prisma.product.findFirst({ where: { id, companyId: company.id } });
    if (!existing) return { ok: false, error: "Ürün bulunamadı." };

    await prisma.product.update({
      where: { id },
      data: {
        name: input.name.trim(),
        description: input.description || null,
        unit: input.unit || "adet",
        unitPrice: input.unitPrice || 0,
        vatRate: input.vatRate ?? 20,
        currency: (input.currency as any) || "EUR",
      },
    });
    return { ok: true, id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Güncelleme başarısız." };
  }
}

export async function deleteProduct(id: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  // Ürünü silmek yerine arşivle — geçmiş fatura kalemleri zaten snapshot, ama
  // kullanıcı yanlışlıkla silerse geri dönüşü olsun.
  const result = await prisma.product.updateMany({
    where: { id, companyId: company.id },
    data: { isArchived: true } as any,
  });
  if (result.count === 0) return { ok: false, error: "Ürün bulunamadı." };
  return { ok: true };
}

// ---------- HESAP / ŞİRKET AYARLARI ----------

// Mevcut kullanıcı + şirket bilgisini getir
export async function getAccountInfo() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };

  const company = await getCompany();
  return {
    ok: true,
    email: user.email || "",
    name: user.user_metadata?.name || "",
    phone: user.user_metadata?.phone || "",
    title: user.user_metadata?.title || "",
    company: company ? {
      name: company.name || "",
      email: company.email || "",
      address: company.address || "",
      city: company.city || "",
      country: company.country || "",
      taxId: company.taxId || "",
      vatId: company.vatId || "",
      defaultLanguage: company.defaultLanguage || "TR",
      defaultDueDays: (company as any).defaultDueDays ?? 15,
      logoUrl: (company as any).logoUrl || "",
      qrImage: company.qrImage || "",
      qrVerify: (company as any).qrVerify || "",
    } : null,
  };
}

// Kullanıcının adını güncelle (Supabase auth metadata)
export async function updateUserName(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  if (!name.trim()) return { ok: false, error: "İsim boş olamaz." };

  const { error } = await supabase.auth.updateUser({ data: { name: name.trim() } });
  if (error) return { ok: false, error: error.message };

  await prisma.user.upsert({
    where: { id: user.id },
    update: { name: name.trim() },
    create: { id: user.id, email: user.email ?? "", name: name.trim() },
  });
  return { ok: true };
}

// Kullanıcı profilini güncelle (ad, telefon, ünvan) — metadata'da saklanır
export async function updateProfile(input: { name: string; phone?: string; title?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  if (!input.name.trim()) return { ok: false, error: "İsim boş olamaz." };

  const { error } = await supabase.auth.updateUser({
    data: { name: input.name.trim(), phone: input.phone || "", title: input.title || "" },
  });
  if (error) return { ok: false, error: error.message };

  await prisma.user.upsert({
    where: { id: user.id },
    update: { name: input.name.trim() },
    create: { id: user.id, email: user.email ?? "", name: input.name.trim() },
  });
  return { ok: true };
}

// Şifre değiştir
export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Oturum bulunamadı." };
  if (newPassword.length < 6) return { ok: false, error: "Şifre en az 6 karakter olmalı." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// Şirket bilgilerini güncelle
export async function updateCompany(input: {
  name?: string; email?: string; address?: string; city?: string; country?: string; taxId?: string; vatId?: string; defaultLanguage?: string; qrImage?: string; qrVerify?: string; logoUrl?: string; defaultDueDays?: number;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };

  // QR resmi güvenliği: sadece güvenli base64 image (SVG/URL reddedilir → XSS koruması) + boyut
  const safeQrImage = input.qrImage !== undefined ? sanitizeImageDataUrl(input.qrImage) : undefined;
  const safeQrVerify = input.qrVerify !== undefined ? sanitizeImageDataUrl(input.qrVerify) : undefined;
  // Logo da güvenli base64 image olmalı (boş string = logoyu kaldır)
  const safeLogo = input.logoUrl !== undefined
    ? (input.logoUrl === "" ? null : sanitizeImageDataUrl(input.logoUrl))
    : undefined;
  if ((safeQrImage && safeQrImage.length > 720_000) || (safeQrVerify && safeQrVerify.length > 720_000)) {
    return { ok: false, error: "QR resmi çok büyük." };
  }
  if (safeLogo && safeLogo.length > 2_900_000) {
    return { ok: false, error: "Logo çok büyük." };
  }

  const validLangs = ["TR", "EN", "DE", "NL", "FR", "ES", "IT"];
  await prisma.company.update({
    where: { id: company.id },
    data: {
      name: input.name?.trim() || company.name,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      country: input.country || null,
      taxId: input.taxId || null,
      vatId: input.vatId || null,
      ...(input.qrImage !== undefined ? { qrImage: safeQrImage } : {}),
      ...(input.qrVerify !== undefined ? { qrVerify: safeQrVerify } as any : {}),
      ...(input.logoUrl !== undefined ? { logoUrl: safeLogo } : {}),
      ...(input.defaultLanguage && validLangs.includes(input.defaultLanguage)
        ? { defaultLanguage: input.defaultLanguage as any }
        : {}),
      ...(typeof input.defaultDueDays === "number" && input.defaultDueDays >= 0 && input.defaultDueDays <= 365
        ? { defaultDueDays: Math.round(input.defaultDueDays) }
        : {}),
    } as any,
  });
  return { ok: true };
}

// ---------- ŞABLON / VARSAYILAN AYARLAR ----------

// Varsayılan şablonu kaydet (örn. "classic-standard")
export async function setDefaultTemplate(template: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  await prisma.company.update({
    where: { id: company.id },
    data: { defaultTemplate: template },
  });
  return { ok: true };
}

// Varsayılan şablonu getir
export async function getDefaultTemplate() {
  const company = await getCompany();
  if (!company) return { ok: false, template: "classic-standard" };
  return { ok: true, template: company.defaultTemplate || "classic-standard" };
}

// ---------- BANKA HESAPLARI (çoklu IBAN) ----------

// Şirketin tüm banka hesaplarını listele
export async function listBankAccounts() {
  const company = await getCompany();
  if (!company) return { ok: false, accounts: [] as any[] };
  const accounts = await (prisma as any).bankAccount.findMany({
    where: { companyId: company.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return { ok: true, accounts };
}

// Banka hesabı ekle veya güncelle
export async function saveBankAccount(input: {
  id?: string; label: string; bankName?: string; iban: string; swift?: string; currency?: string; isDefault?: boolean;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };

  const iban = (input.iban || "").replace(/\s+/g, "").toUpperCase();
  if (iban.length < 5) return { ok: false, error: "Geçerli bir IBAN girin." };
  const label = (input.label || "").trim() || "Hesap";
  const validCur = ["EUR", "USD", "GBP", "TRY"];
  const currency = validCur.includes(input.currency || "") ? input.currency : "EUR";

  // Varsayılan yapılıyorsa AYNI PARA BİRİMİNDEKİ diğerlerinin varsayılanını kaldır
  if (input.isDefault) {
    await (prisma as any).bankAccount.updateMany({
      where: { companyId: company.id, currency: currency as any },
      data: { isDefault: false },
    });
  }

  if (input.id) {
    await (prisma as any).bankAccount.update({
      where: { id: input.id },
      data: { label, bankName: input.bankName || null, iban, swift: input.swift || null, currency: currency as any, isDefault: !!input.isDefault },
    });
  } else {
    // Bu para biriminde ilk hesapsa otomatik varsayılan olsun
    const count = await (prisma as any).bankAccount.count({ where: { companyId: company.id, currency: currency as any } });
    await (prisma as any).bankAccount.create({
      data: { companyId: company.id, label, bankName: input.bankName || null, iban, swift: input.swift || null, currency: currency as any, isDefault: input.isDefault || count === 0 },
    });
  }
  return { ok: true };
}

// Banka hesabı sil
export async function deleteBankAccount(id: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  await (prisma as any).bankAccount.deleteMany({ where: { id, companyId: company.id } });
  return { ok: true };
}
