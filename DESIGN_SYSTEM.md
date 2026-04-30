# Nocarbontr Design System

## Renk Paleti

| Token                | Hex       | Kullanım                          |
|---------------------|-----------|-----------------------------------|
| `bg-base`           | `#0D0D0D` | Ana sayfa arkaplanı               |
| `bg-surface`        | `#111111` | Sidebar, layout arkaplanı         |
| `bg-card`           | `#1A1A1A` | Kart komponenti                   |
| `bg-elevated`       | `#1E1E1E` | Modal, dropdown                   |
| `bg-hover`          | `#242424` | Hover state                       |
| `primary-500`       | `#22C55E` | Marka rengi, aktif durum          |
| `primary-600`       | `#16A34A` | CTA buton                         |
| `border`            | `#2A2A2A` | Bölücü çizgiler, kart sınırları   |
| `text-primary`      | `#FFFFFF` | Başlık, önemli veri               |
| `text-muted`        | `#9CA3AF` | İkincil metin, label              |
| `danger`            | `#EF4444` | Risk uyarısı, hata                |
| `warning`           | `#F59E0B` | Orta risk, dikkat                 |

## Komponent Sınıfları (globals.css)

```
nctr-card          → Standart kart
nctr-card-elevated → Yükseltilmiş kart (modal)
btn-primary        → Ana CTA butonu
btn-secondary      → İkincil buton
btn-ghost          → Menü/nav butonu
nctr-input         → Form input
nav-item           → Sidebar nav link
nav-item-active    → Aktif sidebar nav link
badge-success/danger/warning/info → Durum etiketi
risk-dot-low/medium/high/critical → Risk göstergesi
stat-card          → KPI kart
trust-bar-track    → Trust Score progress bar
nctr-table         → Data tablosu
```

## Utility Sınıfları
- `glow-green` / `glow-green-lg` — yeşil ışıma efekti
- `text-gradient-green` — yeşil degrade metin
- `bg-grid` — arka plan grid pattern
