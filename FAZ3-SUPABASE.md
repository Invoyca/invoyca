# FAZ 3 — Supabase Kurulum Rehberi (Veritabanı + Giriş)

Bu faz, projeye **gerçek veritabanı ve kullanıcı girişi** ekler. Kod hazır; senin yapman gereken: Supabase hesabı açmak ve 3 anahtarı projeye girmek.

---

## 1. Supabase hesabı aç (ücretsiz)

1. https://supabase.com adresine git → "Start your project" → GitHub veya e-posta ile kayıt ol.
2. "New Project" tıkla:
   - **Name:** invoyca
   - **Database Password:** güçlü bir şifre belirle ve **bir yere kaydet** (lazım olacak)
   - **Region:** Sana en yakın (Avrupa için "Frankfurt" veya "London")
   - "Create new project" → 1-2 dakika kurulum bekler.

---

## 2. Anahtarları al

Proje açılınca sol menüden **Settings (dişli) → API**:

- **Project URL** → kopyala (örn. `https://xxxx.supabase.co`)
- **anon public** anahtarı → kopyala (uzun bir metin)

Sonra **Settings → Database → Connection string → URI** sekmesinden:
- **Connection string**'i kopyala (içinde `[YOUR-PASSWORD]` yazan yere, 1. adımdaki şifreni koy)

---

## 3. Anahtarları projeye gir

Proje klasöründe `.env.example` dosyasını **kopyala**, adını `.env` yap. İçini şöyle doldur:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=buraya_anon_public_anahtari
DATABASE_URL=postgresql://postgres:[ŞİFREN]@db.xxxx.supabase.co:5432/postgres
```

(NOT: `.env` dosyası gizlidir, GitHub'a yüklenmez — bu güvenlik için doğru.)

---

## 4. Veritabanı tablolarını kur

Komut İstemi'nde, proje klasöründe:

```
npm install
npm run db:push
```

`db:push` komutu, `prisma/schema.prisma`'daki 12 tabloyu Supabase'e kurar. "Your database is now in sync" görürsen başarılı.

---

## 5. Test et

```
npm run dev
```

Tarayıcıda:
- http://localhost:3000 → landing açılır
- http://localhost:3000/signup → kayıt ol (e-posta + şifre)
- Kayıt sonrası giriş yap → otomatik dashboard'a yönlenirsin
- Giriş yapmadan http://localhost:3000/app/dashboard açmaya çalış → login'e atar (koruma çalışıyor demektir)
- Sağ üstte avatar → "Çıkış Yap" → login'e döner

---

## Bu fazda eklenenler (kod, hazır)

- `src/lib/supabase/` — veritabanı bağlantısı (tarayıcı + sunucu)
- `src/middleware.ts` — rota koruma (giriş yapmadan app'e girilemez)
- `src/app/login/` ve `src/app/signup/` — giriş/kayıt sayfaları
- `src/app/auth/signout/` — çıkış
- Topbar'da kullanıcı menüsü (ayarlar + çıkış)

---

## Takılırsan
Hata çıkarsa tamamını Claude'a yapıştır. En sık sorun: `.env` dosyasındaki anahtarların yanlış kopyalanması veya `[ŞİFREN]` kısmının değiştirilmemesi.
