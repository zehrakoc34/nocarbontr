# Score3 CBAM - Proje TODO

## Veritabanı Şeması ve Seed Verisi
- [x] Veritabanı şeması tasarımı (sectors, emission_factors, suppliers, uploads, scores)
- [x] Seed script: 20 sektör verisi
- [x] Seed script: Her sektöre ait örnek hammadde/girdi listesi
- [x] Seed script: HS kodu ve emisyon faktörü eşleştirmesi
- [x] Migration SQL dosyası oluşturma ve uygulama

## Backend - tRPC Prosedürleri ve Auth
- [x] tRPC prosedürleri: upload.create, upload.list, upload.getById
- [x] Excel/CSV parse ve validasyon
- [x] Auth: protectedProcedure ile korumalı rotalar
- [x] JWT tabanlı oturum yönetimi

## Backend - Score3 Hesaplama Motoru
- [x] Emisyon Skoru hesaplama (Scope 1-3, CBAM/PCAF faktörleri)
- [x] Sorumluluk Skoru hesaplama
- [x] Tedarik Skoru hesaplama
- [x] Composite Score3 hesaplama
- [ ] Skor cache ve optimizasyon

## Backend - CBAM Rapor ve AI Doğrulama
- [x] CBAM PDF rapor üretimi
- [x] CBAM XML rapor üretimi
- [x] LLM ile veri hatası tespiti
- [x] Eksik tedarikçi verisi için emisyon tahmini
- [x] tRPC prosedürleri: report.generate, report.export

## Backend - Tedarikçi Yönetimi
- [x] tRPC prosedürleri: supplier.create, supplier.list, supplier.update, supplier.delete
- [x] Tier 1-3 tedarikçi yönetimi
- [ ] E-posta daveti sistemi
- [ ] Self-servis portal token yönetimi

## Frontend - Auth ve Dashboard
- [x] Manus OAuth entegrasyonu
- [x] Login/Logout sayfaları
- [x] Dashboard layout (sidebar + main content)
- [x] Dashboard home sayfası

## Frontend - Upload Akışı
- [x] Excel/CSV dosya yükleme UI
- [x] Dosya preview ve validasyon
- [x] Upload progress göstergesi
- [x] Upload sonucu gösterimi

## Frontend - Tedarikçi Modülü
- [x] 20 sektör accordion/dropdown listesi
- [x] Tier 1-3 tedarikçi ekleme formu
- [x] Tedarikçi listesi ve yönetimi
- [ ] E-posta daveti gönderme

## Frontend - Skor Görselleştirme
- [x] Renk kodlu progress bar (kırmızı → sarı → yeşil)
- [x] Skor kartları (Emisyon, Sorumluluk, Tedarik)
- [x] Tedarikçi skor grid gösterimi
- [x] Sektör bazlı skor karşılaştırması

## Frontend - CBAM Rapor Export
- [x] PDF rapor indirme
- [x] XML rapor indirme
- [ ] Rapor preview
- [ ] Rapor paylaşma (email)

## Styling ve Responsive Tasarım
- [x] Global CSS: Renk paleti (#10b981, #6b7280, #f8f9fa)
- [x] Neumorphic buton stilleri
- [x] Mobile-first responsive tasarım
- [ ] Dark/Light tema desteği (isteğe bağlı)

## Test ve Deployment
- [x] Vitest unit testleri yazma
- [ ] E2E test senaryoları
- [x] Docker Dockerfile hazırlama
- [x] docker-compose.yml hazırlama
- [ ] Vercel/Netlify deployment config
- [x] Environment variables dokümantasyonu

## Dokümantasyon
- [x] README.md güncelleme
- [ ] API dokümantasyonu
- [x] Deployment rehberi
- [ ] Kullanıcı rehberi


## Türkçeye Çeviri
- [ ] Frontend: Tüm sayfaları Türkçeye çevir (Home, Dashboard, Upload, Suppliers, Reports)
- [ ] Backend: Hata mesajlarını ve API yanıtlarını Türkçeye çevir
- [ ] UI: Butonlar, etiketler, placeholder'ları Türkçeye çevir


## Pricing & Features Comparison Table
- [ ] Pricing page oluşturma (Temel, Premium, Kurumsal planları)
- [ ] Features comparison table (HS kategorileri, Tier desteği, Raporlama, vb.)
- [ ] Plan özellikleri ve sınırlamalarını tanımlama
- [ ] Pricing table'ı Home sayfasına entegre etme
