"use server";

// Müşteri ve Ürün için CRUD işlemleri.
// GÜVENLİK: her sorgu oturum sahibinin company'siyle filtrelenir.

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { invoices: true } } },
  });
  return { ok: true, clients };
}

export async function createClientRecord(input: {
  name: string; email?: string; vatId?: string; address?: string; city?: string; country?: string; phone?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  if (!input.name?.trim()) return { ok: false, error: "Müşteri adı gerekli." };

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
    return { ok: true, id: client.id };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Kayıt başarısız." };
  }
}

export async function deleteClient(id: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const result = await prisma.client.deleteMany({ where: { id, companyId: company.id } });
  if (result.count === 0) return { ok: false, error: "Müşteri bulunamadı." };
  return { ok: true };
}

// ---------- ÜRÜNLER ----------

export async function listProducts() {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı.", products: [] };
  const products = await prisma.product.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "desc" },
  });
  return { ok: true, products };
}

export async function createProduct(input: {
  name: string; description?: string; unit?: string; unitPrice: number; vatRate: number; currency?: string;
}) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  if (!input.name?.trim()) return { ok: false, error: "Ürün adı gerekli." };

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

export async function deleteProduct(id: string) {
  const company = await getCompany();
  if (!company) return { ok: false, error: "Oturum bulunamadı." };
  const result = await prisma.product.deleteMany({ where: { id, companyId: company.id } });
  if (result.count === 0) return { ok: false, error: "Ürün bulunamadı." };
  return { ok: true };
}
