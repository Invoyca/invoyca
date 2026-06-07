# FAZ 8 — Canlıya Çıkış Rehberi

Bu faz, projeyi internete açar. invoyca.com (landing) ve app.invoyca.com (uygulama) yayına girer.
Tamamı senin bilgisayarında, hesap açarak yapılır. Acele etme, her adımı sırayla yap.

**Ön koşul:** Faz 3'teki Supabase kurulumunu tamamlamış olman gerekir (veritabanı + giriş çalışıyor olmalı). Lokalde `npm run dev` ile test ettiysen, hazırsın.

---

## GENEL MANTIK

3 parça birbirine bağlanacak:
1. **GitHub** — kodun bulutta saklandığı yer (kod deposu)
2. **Vercel** — kodu alıp internette yayınlayan servis (her `git push`'ta otomatik günceller)
3. **Domain (invoyca.com)** — Vercel'e yönlendirilir

```
Senin PC → GitHub (kod) → Vercel (yayın) → invoyca.com (adres)
```

---

## ADIM 1 — Git kurulumu (bir kez)

1. https://git-scm.com/download/win → indir, kur (hep "Next", varsayılanlar yeterli).
2. Kontrol: Komut İstemi'nde `git --version` → numara çıkmalı.
3. Kim olduğunu Git'e tanıt (Komut İstemi'nde):
   ```
   git config --global user.name "Adın Soyadın"
   git config --global user.email "senin@email.com"
   ```

---

## ADIM 2 — GitHub hesabı + depo

1. https://github.com → kayıt ol (ücretsiz).
2. Sağ üstte **+** → **New repository**:
   - **Repository name:** invoyca
   - **Private** seç (kodun gizli kalsın)
   - "Create repository" (README/gitignore EKLEME, bizde zaten var)
3. Açılan sayfada komutlar görünür; bunları birazdan kullanacağız.

---

## ADIM 3 — Kodu GitHub'a yükle

Proje klasöründe (Komut İstemi), sırayla:

```
git init
git add .
git commit -m "Invoyca ilk surum"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/invoyca.git
git push -u origin main
```

(`KULLANICI_ADIN` yerine kendi GitHub kullanıcı adını yaz. İlk push'ta GitHub
giriş/şifre veya tarayıcı doğrulaması isteyebilir.)

**Önemli:** `.env` dosyan yüklenMEZ (gizli anahtarların güvende). `.gitignore` bunu otomatik halleder.

Tamamlandığında GitHub'daki depoda tüm dosyalarını görürsün.

---

## ADIM 4 — Vercel'e bağla ve yayınla

1. https://vercel.com → **GitHub ile giriş yap** (en kolayı).
2. "Add New..." → **Project** → GitHub'daki **invoyca** deposunu seç → **Import**.
3. **Environment Variables** (Ortam Değişkenleri) bölümüne, `.env` dosyandaki
   anahtarları tek tek ekle:
   ```
   NEXT_PUBLIC_SUPABASE_URL      → değerini yapıştır
   NEXT_PUBLIC_SUPABASE_ANON_KEY → değerini yapıştır
   DATABASE_URL                  → değerini yapıştır
   RESEND_API_KEY                → (e-posta kullanacaksan)
   ```
4. **Deploy** tıkla. 1-2 dakika sürer.
5. Bitince Vercel sana bir adres verir (örn. `invoyca.vercel.app`). Tıkla — siten yayında! 🎯

Bundan sonra her `git push` yaptığında Vercel otomatik günceller.

---

## ADIM 5 — invoyca.com'u bağla

1. Vercel'de projende **Settings → Domains**.
2. `invoyca.com` yaz → **Add**.
3. Vercel sana DNS kayıtları verir (örn. bir A kaydı veya CNAME).
4. Domain'i aldığın yere git (GoDaddy, Namecheap, vb.) → DNS ayarları → Vercel'in
   verdiği kayıtları gir.
5. **app.invoyca.com** için: Vercel'de tekrar Domains → `app.invoyca.com` ekle,
   yine verilen CNAME kaydını domain sağlayıcına gir.
6. DNS yayılması birkaç dakika–birkaç saat sürebilir. Sonra invoyca.com yayında.

**Not:** Landing (invoyca.com) ve uygulama (app.invoyca.com) aynı projede.
Yönlendirmeyi kod hallediyor (landing → app butonları app.invoyca.com'a gider).

---

## ADIM 6 — Supabase'i canlıya hazırla

1. Supabase panelinde **Authentication → URL Configuration**:
   - **Site URL:** `https://app.invoyca.com`
   - **Redirect URLs:** `https://app.invoyca.com/**` ekle
2. (E-posta için) Resend'de **Domains → invoyca.com** ekle, DNS kayıtlarını gir,
   doğrulanınca faturalar `invoices@invoyca.com`'dan gider.

---

## YAYIN SONRASI

- **Güncelleme:** Kodda değişiklik → `git add .` → `git commit -m "aciklama"` → `git push`
  → Vercel otomatik yayınlar.
- **Hata olursa:** Vercel panelinde **Deployments → (son deploy) → Logs** hatayı gösterir.
  Hatayı Claude'a yapıştır, çözelim.

---

## MALİYET (başlangıç)
- GitHub: ücretsiz (private repo dahil)
- Vercel: ücretsiz (Hobby plan — başlangıç için fazlasıyla yeterli)
- Supabase: ücretsiz (büyüyünce ~25$/ay)
- Resend: ücretsiz (ayda 3.000 e-posta)
- Domain: zaten aldın

Yani **lansman tamamen ücretsiz** başlar. Büyüdükçe ücretli planlara geçersin.

---

## SIRALI ÖZET (kontrol listesi)
- [ ] Git kuruldu
- [ ] GitHub hesabı + invoyca deposu açıldı
- [ ] Kod GitHub'a yüklendi (git push)
- [ ] Vercel'e bağlandı, env değişkenleri girildi, deploy edildi
- [ ] invoyca.com + app.invoyca.com DNS bağlandı
- [ ] Supabase canlı URL'leri ayarlandı
- [ ] Test: kayıt ol, giriş yap, fatura oluştur, PDF indir

Her adımda takılırsan dur, Claude'a sor. Acele yok.
