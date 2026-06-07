# Invoyca — Proje Kurulum Rehberi

Bu klasör, Invoyca'nın çalışan başlangıç iskeletidir. Aşağıdaki adımları **sırayla** takip et.

---

## ÖN HAZIRLIK (bir kez yapılır)

Bilgisayarına şunları kur:

1. **Node.js** — https://nodejs.org → "LTS" sürümünü indir, kur.
   Kontrol: Komut İstemi'ne `node --version` yaz, numara çıkmalı.

2. **VS Code** — https://code.visualstudio.com → indir, kur. (Kod düzenleme programı.)

---

## PROJEYİ ÇALIŞTIRMA

### 1. Klasörü aç
Bu `invoyca` klasörünü bilgisayarında bir yere koy (örn. Masaüstü).

### 2. Komut İstemi'ni bu klasörde aç
- Klasöre gir
- Adres çubuğuna `cmd` yazıp Enter'a bas (Komut İstemi o klasörde açılır)
- VEYA VS Code'da klasörü aç → üstte Terminal → New Terminal

### 3. Paketleri kur (ilk seferde, internet gerekir)
Komut İstemi'ne şunu yaz, Enter:
```
npm install
```
1-2 dakika sürer. Bittiğinde bir sürü dosya iner (node_modules klasörü).

### 4. Veritabanı bağlantısı (Faz 3'te yapılacak — şimdilik atla)
Şimdilik veritabanı olmadan da arayüzü görebilirsin.

### 5. Projeyi başlat
```
npm run dev
```
Şunu görürsen başarılı:
```
✓ Ready in ...
- Local: http://localhost:3000
```

### 6. Tarayıcıda aç
http://localhost:3000 adresine git. "Invoyca — Proje iskeleti çalışıyor" yazısını görürsün.

**Durdurmak için:** Komut İstemi'nde `Ctrl + C`.

---

## KLASÖR YAPISI (ne nerede)

```
invoyca/
├── src/
│   ├── app/          → sayfalar (her klasör bir sayfa/rota)
│   ├── components/    → tekrar kullanılan parçalar (buton, sidebar...)
│   └── lib/           → yardımcı kodlar (veritabanı, hesaplama...)
├── prisma/
│   └── schema.prisma  → veritabanı yapısı (12 tablo)
├── public/            → resimler, statik dosyalar
├── package.json       → proje ayarları + komutlar
└── .env.example       → gizli anahtar şablonu (kopyalayıp .env yapacaksın)
```

---

## SONRAKI ADIMLAR (Claude ile birlikte)

- **Faz 2:** Tasarımları (landing + app sayfaları + 25 şablon) projeye taşıma
- **Faz 3:** Supabase (veritabanı + giriş) bağlama
- **Faz 4:** Fatura oluştur/kaydet/listele
- **Faz 5:** PDF + e-posta
- **Faz 6:** Ödeme (Stripe + iyzico)
- **Faz 7:** Çok dil
- **Faz 8:** Canlıya çıkış (Vercel + invoyca.com)

Her fazda Claude sana dosyaları verir, sen bu klasöre koyar ve `npm run dev` ile test edersin.

---

## TAKILIRSAN
Komut İstemi'nde kırmızı bir hata çıkarsa, hatanın tamamını kopyalayıp Claude'a yapıştır. Birlikte çözersiniz.
