-- NOCARBONTR Sector Library — nctr_1.md §4 Omni-Sector
-- 10 grup, 20 alt sektör (NACE kodlu), parametreler

CREATE TABLE IF NOT EXISTS public.sector_groups (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,   -- "01", "02" …
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.industries (
  id          SERIAL PRIMARY KEY,
  group_id    INTEGER NOT NULL REFERENCES public.sector_groups(id),
  nace_code   TEXT NOT NULL,          -- "05.10"
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.emission_parameters (
  id              SERIAL PRIMARY KEY,
  industry_id     INTEGER NOT NULL REFERENCES public.industries(id),
  name            TEXT NOT NULL,
  unit            TEXT NOT NULL DEFAULT 'ton',
  emission_factor NUMERIC(10,4) NOT NULL DEFAULT 0,  -- tCO₂/birim
  description     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (read-only for authenticated)
ALTER TABLE public.sector_groups     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sector_groups"     ON public.sector_groups     FOR SELECT USING (true);
CREATE POLICY "Public read industries"        ON public.industries        FOR SELECT USING (true);
CREATE POLICY "Public read emission_params"   ON public.emission_parameters FOR SELECT USING (true);

-- ─────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────

INSERT INTO public.sector_groups (code, name) VALUES
  ('01', 'Madencilik ve Hammadde'),
  ('02', 'Gıda ve Tarımsal Üretim'),
  ('03', 'Sağlık Ürünleri ve İlaç'),
  ('04', 'Tekstil, Deri ve Moda'),
  ('05', 'Kimya, Plastik ve Kauçuk'),
  ('06', 'Metal ve Makine Sanayii'),
  ('07', 'Ulaşım ve Taşıt İmalatı'),
  ('08', 'Taşımacılık ve Lojistik'),
  ('09', 'Teknoloji ve Otomasyon'),
  ('10', 'Enerji ve Çevre Yönetimi');

-- GROUP 01
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='01'), '05.10', 'Enerji Madenciliği'),
  ((SELECT id FROM sector_groups WHERE code='01'), '07.10', 'Metal ve Değerli Metaller'),
  ((SELECT id FROM sector_groups WHERE code='01'), '08.11', 'Taş Ocakçılığı ve Mineraller');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='05.10'), 'Taş Kömürü',         'ton',  2.4200, 'Taş kömürü yakımı tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='05.10'), 'Linyit',             'ton',  1.0100, 'Linyit yakımı tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='05.10'), 'Ham Petrol',         'ton',  3.0700, 'Ham petrol çıkarım+yakım tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='05.10'), 'Doğalgaz Çıkarımı', 'Mm³',  2.0200, 'Doğalgaz tCO₂/Mm³'),
  ((SELECT id FROM industries WHERE nace_code='05.10'), 'Ekskavatör Yakıtı', 'litre',0.0027, 'Dizel yakıt tCO₂/litre'),

  ((SELECT id FROM industries WHERE nace_code='07.10'), 'Demir Cevheri',      'ton',  0.0700, 'Cevher işleme tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='07.10'), 'Bakır',              'ton',  3.1500, 'Bakır üretim tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='07.10'), 'Nikel',              'ton', 13.3000, 'Nikel rafineri tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='07.10'), 'Alüminyum',          'ton',  8.1400, 'Primer alüminyum tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='07.10'), 'Patlayıcı Madde',   'kg',   0.0035, 'ANFO tip patlayıcı tCO₂/kg'),

  ((SELECT id FROM industries WHERE nace_code='08.11'), 'Mermer/Traverten',   'ton',  0.0420, 'Taş ocak işleme tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='08.11'), 'Kireçtaşı',         'ton',  0.5250, 'Kalsinasyon tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='08.11'), 'Kum/Kil',           'ton',  0.0280, 'Kazı+taşıma tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='08.11'), 'Bor',               'ton',  0.3800, 'Bor rafine tCO₂/ton');

-- GROUP 02
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='02'), '10.11', 'Hayvansal İşleme'),
  ((SELECT id FROM sector_groups WHERE code='02'), '10.32', 'Bitkisel ve Unlu Mamuller'),
  ((SELECT id FROM sector_groups WHERE code='02'), '10.82', 'Şekerleme ve Hazır Gıda');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='10.11'), 'Et Kesimi',          'ton',  2.8500, 'Mezbaha enerji+soğutma tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.11'), 'Su Ürünleri',        'ton',  1.9200, 'Balık işleme tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.11'), 'Süt İşleme',         'ton',  0.9800, 'Süt ürünleri tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.11'), 'Soğutucu Gaz (R404A)','kg', 3.9220, 'HFC kaçak tCO₂e/kg'),

  ((SELECT id FROM industries WHERE nace_code='10.32'), 'Meyve Konserve',     'ton',  0.6500, 'tCO₂/ton ürün'),
  ((SELECT id FROM industries WHERE nace_code='10.32'), 'Dondurulmuş Gıda',   'ton',  1.1200, 'Soğutma dahil tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.32'), 'Bitkisel Yağ',       'ton',  0.8300, 'tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.32'), 'Tahıl Değirmenciliği','ton', 0.1900, 'tCO₂/ton'),

  ((SELECT id FROM industries WHERE nace_code='10.82'), 'Fırıncılık',         'ton',  0.5500, 'Fırın enerji tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.82'), 'Çikolata/Şekerleme', 'ton',  1.8700, 'tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='10.82'), 'Buhar Tüketimi',     'GJ',   0.0670, 'tCO₂/GJ buhar');

-- GROUP 03
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='03'), '21.10', 'Eczacılık ve Müstahzarlar'),
  ((SELECT id FROM sector_groups WHERE code='03'), '26.60', 'Tıbbi Cihaz ve Sarf');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='21.10'), 'İlaç Hammaddesi',    'ton',  6.1500, 'API üretim tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='21.10'), 'Solvent Kullanımı',  'ton',  2.9500, 'Solvent VOC tCO₂e/ton'),
  ((SELECT id FROM industries WHERE nace_code='21.10'), 'Otoklav Enerji',     'MWh',  0.4500, 'Sterilizasyon tCO₂/MWh'),

  ((SELECT id FROM industries WHERE nace_code='26.60'), 'MR/Tomografi Enerji','MWh',  0.4500, 'tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='26.60'), 'Tek Kullanım Sarf',  'ton',  3.4200, 'Plastik sarf tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='26.60'), 'Steril Paket',       'ton',  2.1000, 'Ambalaj tCO₂/ton');

-- GROUP 04
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='04'), '13.10', 'Elyaf, İplik ve Dokuma'),
  ((SELECT id FROM sector_groups WHERE code='04'), '13.30', 'Bitirme ve Teknik Tekstil'),
  ((SELECT id FROM sector_groups WHERE code='04'), '15.11', 'Deri ve Ayakkabı');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='13.10'), 'Pamuklu İplik',      'ton',  5.8900, 'Ham pamuk → iplik tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='13.10'), 'Sentetik İplik',     'ton',  7.2100, 'Poliester vb. tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='13.10'), 'Dokuma Kumaş',       'ton',  3.6500, 'tCO₂/ton kumaş'),

  ((SELECT id FROM industries WHERE nace_code='13.30'), 'Boyama İşlemi',      'ton',  4.1200, 'Boya+ısı tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='13.30'), 'Ram Makinesi Gazı',  'Nm³',  0.0020, 'Doğalgaz tCO₂/Nm³'),
  ((SELECT id FROM industries WHERE nace_code='13.30'), 'Halı Dokuma',        'ton',  3.8800, 'tCO₂/ton'),

  ((SELECT id FROM industries WHERE nace_code='15.11'), 'Deri Tabaklama',     'ton',  8.4500, 'Krom işlemi dahil tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='15.11'), 'Ayakkabı Üretimi',   'çift', 0.0145, 'tCO₂/çift ayakkabı'),
  ((SELECT id FROM industries WHERE nace_code='15.11'), 'Krom Kullanımı',     'kg',   0.0220, 'Krom III/VI tCO₂e/kg');

-- GROUP 05
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='05'), '20.11', 'Temel Kimya ve Gübre'),
  ((SELECT id FROM sector_groups WHERE code='05'), '20.30', 'Tüketici Kimyası ve Polimer');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='20.11'), 'Azotlu Gübre (NH₃)',  'ton',  1.9300, 'Haber-Bosch tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='20.11'), 'Endüstriyel Gaz',    'ton',  0.6800, 'N₂O dahil tCO₂e/ton'),
  ((SELECT id FROM industries WHERE nace_code='20.11'), 'Pestisit',           'ton',  5.2100, 'Sentetik pestisit tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='20.11'), 'Reaksiyon Isısı',    'GJ',   0.0560, 'tCO₂/GJ'),

  ((SELECT id FROM industries WHERE nace_code='20.30'), 'Plastik Hammadde',   'ton',  2.5300, 'PE/PP/PVC tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='20.30'), 'Deterjan/Sabun',     'ton',  1.1800, 'tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='20.30'), 'Boya/Vernik',        'ton',  2.3400, 'Solvent içerikli tCO₂/ton');

-- GROUP 06
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='06'), '24.10', 'Ana Metal ve Döküm'),
  ((SELECT id FROM sector_groups WHERE code='06'), '25.11', 'Metal Ürünler ve Savunma'),
  ((SELECT id FROM sector_groups WHERE code='06'), '28.11', 'Genel Makine');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='24.10'), 'Demir-Çelik (BOF)',  'ton',  1.8500, 'Yüksek fırın tCO₂/ton çelik'),
  ((SELECT id FROM industries WHERE nace_code='24.10'), 'Çelik (EAF)',        'ton',  0.4200, 'Elektrik ark ocağı tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='24.10'), 'Ferro-alaşım',       'ton',  3.7800, 'tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='24.10'), 'Ark Ocağı Enerjisi', 'MWh',  0.4500, 'tCO₂/MWh'),

  ((SELECT id FROM industries WHERE nace_code='25.11'), 'Köprü/Kule Parçası', 'ton',  1.2100, 'Çelik yapı tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='25.11'), 'Kaynak Gazı',        'Nm³',  0.0020, 'Asetilen/Argon tCO₂/Nm³'),
  ((SELECT id FROM industries WHERE nace_code='25.11'), 'Tank/Rezervuar',     'ton',  1.4500, 'tCO₂/ton'),

  ((SELECT id FROM industries WHERE nace_code='28.11'), 'Motor Üretimi',      'adet', 0.3800, 'tCO₂/motor'),
  ((SELECT id FROM industries WHERE nace_code='28.11'), 'Metal Dövme',        'ton',  0.9200, 'tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='28.11'), 'Toz Metalürjisi',    'ton',  1.8800, 'tCO₂/ton');

-- GROUP 07
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='07'), '29.10', 'Kara Taşıtları'),
  ((SELECT id FROM sector_groups WHERE code='07'), '30.11', 'Deniz, Raylı ve Hava');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='29.10'), 'Otomobil Üretimi',   'adet', 0.5500, 'tCO₂/otomobil'),
  ((SELECT id FROM industries WHERE nace_code='29.10'), 'Kamyon/Otobüs',      'adet', 2.8500, 'tCO₂/araç'),
  ((SELECT id FROM industries WHERE nace_code='29.10'), 'Boyahane Enerjisi',  'MWh',  0.4500, 'tCO₂/MWh'),

  ((SELECT id FROM industries WHERE nace_code='30.11'), 'Gemi İnşası',        'ton',  0.7200, 'Çelik/kaynak tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='30.11'), 'Lokomotif/Vagon',    'adet', 8.5000, 'tCO₂/araç'),
  ((SELECT id FROM industries WHERE nace_code='30.11'), 'Kompozit Atık',      'ton',  2.1500, 'CFRP yakım tCO₂/ton');

-- GROUP 08
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='08'), '49.41', 'Yük Taşımacılığı'),
  ((SELECT id FROM sector_groups WHERE code='08'), '52.10', 'Depolama ve İletim');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='49.41'), 'Karayolu Ağır Yük', 'ton-km',0.0001100, 'tCO₂/ton-km TIR'),
  ((SELECT id FROM industries WHERE nace_code='49.41'), 'Demiryolu Kargo',   'ton-km',0.0000280, 'tCO₂/ton-km elektrikli'),
  ((SELECT id FROM industries WHERE nace_code='49.41'), 'Deniz Dökme Yük',   'ton-km',0.0000110, 'tCO₂/ton-km bulk carrier'),
  ((SELECT id FROM industries WHERE nace_code='49.41'), 'Havayolu Kargo',    'ton-km',0.0008000, 'tCO₂/ton-km'),

  ((SELECT id FROM industries WHERE nace_code='52.10'), 'Soğuk Hava Deposu', 'palet-gün',0.0028, 'tCO₂/palet-gün'),
  ((SELECT id FROM industries WHERE nace_code='52.10'), 'Boru Hattı İletimi','ton-km',0.0000040, 'tCO₂/ton-km'),
  ((SELECT id FROM industries WHERE nace_code='52.10'), 'Liman Hizmeti',     'TEU',   0.0120, 'tCO₂/TEU');

-- GROUP 09
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='09'), '26.11', 'Donanım ve Elektronik'),
  ((SELECT id FROM sector_groups WHERE code='09'), '62.01', 'Yazılım ve Otomasyon');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='26.11'), 'Bilgisayar/Sunucu',  'adet', 0.1500, 'Üretim tCO₂/adet'),
  ((SELECT id FROM industries WHERE nace_code='26.11'), 'Baz İstasyonu',      'adet', 2.8000, 'tCO₂/baz istasyonu'),
  ((SELECT id FROM industries WHERE nace_code='26.11'), 'Tüketici Elektroniği','adet',0.0550, 'Ortalama tCO₂/ürün'),

  ((SELECT id FROM industries WHERE nace_code='62.01'), 'ERP/CRM Sunucu',     'MWh',  0.4500, 'Veri merkezi tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='62.01'), 'Endüstriyel Robot',  'adet', 1.2000, 'Üretim tCO₂/robot'),
  ((SELECT id FROM industries WHERE nace_code='62.01'), 'PLC/Sensör',         'adet', 0.0180, 'tCO₂/adet');

-- GROUP 10
INSERT INTO public.industries (group_id, nace_code, name) VALUES
  ((SELECT id FROM sector_groups WHERE code='10'), '35.11', 'Enerji Üretimi'),
  ((SELECT id FROM sector_groups WHERE code='10'), '38.32', 'Su ve Atık Yönetimi');

INSERT INTO public.emission_parameters (industry_id, name, unit, emission_factor, description) VALUES
  ((SELECT id FROM industries WHERE nace_code='35.11'), 'Termik Santral (Kömür)','MWh',0.8200, 'tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='35.11'), 'Doğalgaz CCGT',      'MWh',  0.3700, 'tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='35.11'), 'HES',                'MWh',  0.0040, 'tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='35.11'), 'RES',                'MWh',  0.0110, 'tCO₂/MWh'),
  ((SELECT id FROM industries WHERE nace_code='35.11'), 'GES (Solar)',        'MWh',  0.0450, 'tCO₂/MWh'),

  ((SELECT id FROM industries WHERE nace_code='38.32'), 'Su Arıtma',          'MWh',  0.4500, 'tCO₂/MWh pompa'),
  ((SELECT id FROM industries WHERE nace_code='38.32'), 'Tehlikeli Atık',     'ton',  0.8800, 'Yakma/bertaraf tCO₂/ton'),
  ((SELECT id FROM industries WHERE nace_code='38.32'), 'Metal Geri Kazanım', 'ton',  0.3500, 'tCO₂/ton');
