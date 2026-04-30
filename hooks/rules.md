# Nocarbontr — Hook & Compliance Rules
**Kaynak:** nctr_1.md §7 CTO Critical Checklist

---

## 1. GIT PUSH KURALLARI (pre-push.sh)

### 1.1 Build Zorunluluğu
- [ ] `npm run build` sıfır hata ile tamamlanmalı
- [ ] TypeScript derleme hatası olmamalı

### 1.2 Gizli Bilgi Yasağı
- [ ] `.env.local` asla commit edilmemeli
- [ ] `SUPABASE_SERVICE_ROLE_KEY` kaynak koda yazılmamalı
- [ ] Gerçek API anahtarı, şifre veya token commit içinde geçmemeli
- [ ] `eyJhbGci` ile başlayan JWT token'ları (Supabase key) kaynak kodda olmmalı

### 1.3 Tehlikeli Kod Kalıpları
- [ ] `supabase.auth.admin` istemci tarafı kodda kullanılmamalı
- [ ] `SERVICE_ROLE_KEY` Browser client'a aktarılmamalı
- [ ] `process.env.SUPABASE_SERVICE_ROLE_KEY` yalnızca server dosyalarında olmalı

---

## 2. KOMİT KURALLARI (pre-commit.sh)

### 2.1 Hızlı Kontroller
- [ ] `tsc --noEmit` geçmeli
- [ ] ESLint sıfır hata (uyarı kabul edilir)
- [ ] Büyük dosya (>500KB) commit edilmemeli
- [ ] `node_modules/` staged olmamalı

### 2.2 Veritabanı Güvenliği (nctr_1.md §7.1)
- [ ] `network_connections` tablosu üzerinde RLS bypass (`{ count: 'exact' }` + service role) olmamalı
- [ ] `createClient()` doğrudan table erişiminde kullanıcı doğrulaması yapılmalı

---

## 3. SÜREÇ İÇİ UYUMLULUK (check-compliance.sh)

### 3.1 CBAM Formül Versiyonlama (nctr_1.md §7.2)
- [ ] `emission_data` insert işlemlerinde `formula_version` alanı doldurulmalı
- [ ] `formula_version` her zaman `v1` veya daha yeni bir versiyon olmalı
- [ ] Sektörel formül değişikliğinde `v2`, `v3`... olarak artırılmalı

### 3.2 Kanıt Bütünlüğü (nctr_1.md §7.3)
- [ ] `evidence_vault` insert işlemlerinde `verification_hash` boş bırakılmamalı
- [ ] Hash değeri SHA-256 formatında (64 hex karakter) olmalı
- [ ] Dosya yükleme sonrası hash veritabanına kaydedilmeli

### 3.3 Veri Yılı Kısıtı
- [ ] `emission_data.year` değeri `2026` veya daha büyük olmalı
- [ ] Geçmiş yıl verisi girilmesine izin verilmemeli

### 3.4 Trust Score Bileşenleri
- [ ] `evidence_score` + `continuity_score` + `benchmark_score` ≤ 100 olmalı
- [ ] Her bileşen kendi maksimum değerini aşmamalı:
  - evidence_score ≤ 40
  - continuity_score ≤ 30
  - benchmark_score ≤ 30

### 3.5 RLS Politikaları (nctr_1.md §7.1)
- [ ] Tüm tablolarda RLS aktif olmalı
- [ ] `auth_org_id()` fonksiyonu tüm kritik politikalarda kullanılmalı
- [ ] `CORPORATE` organizasyonu başka bir şirketin tedarikçi verisine erişememeli

---

## 4. SÜREKLI İZLEME (watch.sh)

### 4.1 Dosya Değişiklik Tetikleyicileri
| Değişen Dosya | Tetiklenen Kontrol |
|---|---|
| `src/**/*.ts` | TypeScript check |
| `supabase/migrations/*.sql` | RLS policy check |
| `src/lib/supabase/**` | Secret leak check |
| `src/app/**/page.tsx` | Build check |

### 4.2 Test Kimlik Bilgileri
Test çalıştırmaları `.test-credentials.json` dosyasındaki verilerle otomatik yapılır.
Bu dosya `.gitignore`'da yer alır ve paylaşılmaz.

---

## 5. GITHUB PUSH ENGEL KOŞULLARI

Aşağıdaki durumlardan herhangi birinde push **REDDEDİLİR**:

| # | Koşul | Hata Kodu |
|---|---|---|
| 1 | Build başarısız | `ERR_BUILD` |
| 2 | TypeScript hatası | `ERR_TYPESCRIPT` |
| 3 | `.env.local` staged | `ERR_SECRET_ENV` |
| 4 | Service role key kaynak kodda | `ERR_SECRET_KEY` |
| 5 | JWT token kaynak kodda | `ERR_SECRET_JWT` |
| 6 | `formula_version` eksik insert | `ERR_FORMULA_VERSION` |
| 7 | `verification_hash` boş | `ERR_HASH_EMPTY` |
| 8 | `node_modules/` staged | `ERR_NODE_MODULES` |
