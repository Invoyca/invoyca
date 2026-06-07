# Invoyca

Uluslararası faturalama platformu — 7 dil, 4 para birimi, 25 profesyonel şablon.

## Teknoloji
- Next.js 15 (App Router) + TypeScript + React 19
- Tailwind CSS
- Supabase (PostgreSQL + Auth)
- Prisma (ORM)
- Resend (e-posta)

## Yerel Çalıştırma
```bash
npm install
# .env.example'ı kopyalayıp .env yap, Supabase anahtarlarını gir
npm run db:push   # veritabanı tablolarını kur
npm run dev       # http://localhost:3000
```

## Kurulum Rehberleri (sırayla)
- `KURULUM.md` — temel kurulum (Node, VS Code, projeyi çalıştırma)
- `FAZ3-SUPABASE.md` — veritabanı + giriş kurulumu
- `FAZ5-PDF-EPOSTA.md` — PDF ve e-posta ayarları
- `FAZ8-CANLIYA-CIKIS.md` — GitHub + Vercel + domain ile yayına alma

## Proje Yapısı
```
src/
├── app/              sayfalar (App Router)
│   ├── page.tsx      landing (ana sayfa, 7 dil)
│   ├── login, signup auth sayfaları
│   └── app/          uygulama (dashboard, faturalar, şablonlar...)
├── components/        ortak bileşenler (Sidebar, Topbar, ...)
└── lib/
    ├── i18n*.ts       çok dil sistemi
    ├── templates/     25 şablon render motoru
    ├── supabase/      veritabanı bağlantısı
    ├── invoice-calc   fatura hesaplama
    └── billing.ts     2026 ücretsiz / 2027 abonelik mantığı
prisma/schema.prisma   12 tablolu veritabanı şeması
```

## Faturalama Modeli
2026 boyunca tüm özellikler ücretsiz ve sınırsız (lansman kampanyası).
Abonelik planları 2027'de başlar (`src/lib/billing.ts` → BILLING_START).
