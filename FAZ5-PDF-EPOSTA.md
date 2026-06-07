# FAZ 5 — PDF + E-posta

## PDF (kurulum gerekmez, hazır)
Editörde **PDF** butonuna basınca, fatura yeni sekmede açılır ve tarayıcının yazdırma
diyaloğu gelir. "Hedef: PDF olarak kaydet" seçip indirirsin. Chromium/sunucu gerekmez,
her tarayıcıda çalışır, şablonla birebir aynı görünür.

## E-posta (Resend anahtarı gerekir)
Müşteriye fatura e-postası göndermek için ücretsiz Resend hesabı:

1. https://resend.com → kayıt ol (ücretsiz: ayda 3.000 e-posta).
2. **API Keys** → "Create API Key" → kopyala.
3. `.env` dosyasına ekle:
   ```
   RESEND_API_KEY=re_xxxxxxxxx
   ```
4. (Canlıda) Kendi domaininden göndermek için Resend'de **Domains** → invoyca.com ekle,
   DNS kayıtlarını gir. Test için Resend'in verdiği adresi kullanabilirsin.

Editörde **Gönder** butonu → müşteri e-postasını sorar → faturayı gönderir.

## Not
Şu an e-posta, faturayı HTML gövde olarak gönderir. Canlıda PDF ekini de eklemek için
sunucu-tabanlı PDF servisi (örn. ayrı bir microservice veya Vercel uyumlu PDF API)
eklenebilir — bunu Faz 8'de (canlıya çıkış) değerlendiririz.
