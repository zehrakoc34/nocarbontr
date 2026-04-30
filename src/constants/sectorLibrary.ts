// NOCARBONTR Omni-Sector Library — Single Source of Truth
// Manifest: gemini-code-1777058810550.md → 10 grup, 20 sektör

export interface EmissionParameter {
  id: string;
  name: string;
  unit: string;
  emissionFactor: number;   // tCO₂ / birim
  description?: string;
}

export interface Industry {
  id: string;
  naceCode: string;
  name: string;
  parameters: EmissionParameter[];
}

export interface SectorGroup {
  id: string;
  code: string;
  name: string;
  industries: Industry[];
}

export const SECTOR_LIBRARY: SectorGroup[] = [
  {
    id: "g01", code: "01", name: "Madencilik ve Hammadde",
    industries: [
      {
        id: "i0510", naceCode: "05.10", name: "Enerji Madenciliği",
        parameters: [
          { id: "p001", name: "Taş Kömürü",          unit: "ton",   emissionFactor: 2.4200, description: "Taş kömürü yakımı tCO₂/ton" },
          { id: "p002", name: "Linyit",               unit: "ton",   emissionFactor: 1.0100, description: "Linyit yakımı tCO₂/ton" },
          { id: "p003", name: "Ham Petrol",            unit: "ton",   emissionFactor: 3.0700, description: "Ham petrol çıkarım tCO₂/ton" },
          { id: "p004", name: "Doğalgaz Çıkarımı",    unit: "Mm³",   emissionFactor: 2.0200, description: "tCO₂/Mm³" },
          { id: "p005", name: "Ekskavatör Yakıtı",    unit: "litre", emissionFactor: 0.0027, description: "Dizel tCO₂/litre" },
        ],
      },
      {
        id: "i0710", naceCode: "07.10", name: "Metal ve Değerli Metaller",
        parameters: [
          { id: "p006", name: "Demir Cevheri",        unit: "ton",   emissionFactor: 0.0700 },
          { id: "p007", name: "Bakır",                unit: "ton",   emissionFactor: 3.1500 },
          { id: "p008", name: "Nikel",                unit: "ton",   emissionFactor: 13.300 },
          { id: "p009", name: "Alüminyum",            unit: "ton",   emissionFactor: 8.1400, description: "Primer alüminyum tCO₂/ton" },
          { id: "p010", name: "Patlayıcı Madde",      unit: "kg",    emissionFactor: 0.0035 },
        ],
      },
      {
        id: "i0811", naceCode: "08.11", name: "Taş Ocakçılığı ve Mineraller",
        parameters: [
          { id: "p011", name: "Mermer/Traverten",     unit: "ton",   emissionFactor: 0.0420 },
          { id: "p012", name: "Kireçtaşı",            unit: "ton",   emissionFactor: 0.5250, description: "Kalsinasyon tCO₂/ton" },
          { id: "p013", name: "Kum/Kil",              unit: "ton",   emissionFactor: 0.0280 },
          { id: "p014", name: "Bor",                  unit: "ton",   emissionFactor: 0.3800 },
        ],
      },
    ],
  },
  {
    id: "g02", code: "02", name: "Gıda ve Tarımsal Üretim",
    industries: [
      {
        id: "i1011", naceCode: "10.11", name: "Hayvansal İşleme",
        parameters: [
          { id: "p015", name: "Et Kesimi",            unit: "ton",   emissionFactor: 2.8500 },
          { id: "p016", name: "Su Ürünleri",          unit: "ton",   emissionFactor: 1.9200 },
          { id: "p017", name: "Süt İşleme",           unit: "ton",   emissionFactor: 0.9800 },
          { id: "p018", name: "Soğutucu Gaz (R404A)", unit: "kg",    emissionFactor: 3.9220, description: "HFC kaçak tCO₂e/kg" },
        ],
      },
      {
        id: "i1032", naceCode: "10.32", name: "Bitkisel ve Unlu Mamuller",
        parameters: [
          { id: "p019", name: "Meyve Konserve",       unit: "ton",   emissionFactor: 0.6500 },
          { id: "p020", name: "Dondurulmuş Gıda",     unit: "ton",   emissionFactor: 1.1200 },
          { id: "p021", name: "Bitkisel Yağ",         unit: "ton",   emissionFactor: 0.8300 },
          { id: "p022", name: "Tahıl Değirmenciliği", unit: "ton",   emissionFactor: 0.1900 },
        ],
      },
      {
        id: "i1082", naceCode: "10.82", name: "Şekerleme ve Hazır Gıda",
        parameters: [
          { id: "p023", name: "Fırıncılık",           unit: "ton",   emissionFactor: 0.5500 },
          { id: "p024", name: "Çikolata/Şekerleme",   unit: "ton",   emissionFactor: 1.8700 },
          { id: "p025", name: "Buhar Tüketimi",       unit: "GJ",    emissionFactor: 0.0670 },
        ],
      },
    ],
  },
  {
    id: "g03", code: "03", name: "Sağlık Ürünleri ve İlaç",
    industries: [
      {
        id: "i2110", naceCode: "21.10", name: "Eczacılık ve Müstahzarlar",
        parameters: [
          { id: "p026", name: "İlaç Hammaddesi",      unit: "ton",   emissionFactor: 6.1500, description: "API üretim tCO₂/ton" },
          { id: "p027", name: "Solvent Kullanımı",    unit: "ton",   emissionFactor: 2.9500 },
          { id: "p028", name: "Otoklav Enerji",       unit: "MWh",   emissionFactor: 0.4500 },
        ],
      },
      {
        id: "i2660", naceCode: "26.60", name: "Tıbbi Cihaz ve Sarf",
        parameters: [
          { id: "p029", name: "MR/Tomografi Enerji",  unit: "MWh",   emissionFactor: 0.4500 },
          { id: "p030", name: "Tek Kullanım Sarf",    unit: "ton",   emissionFactor: 3.4200 },
          { id: "p031", name: "Steril Paket",         unit: "ton",   emissionFactor: 2.1000 },
        ],
      },
    ],
  },
  {
    id: "g04", code: "04", name: "Tekstil, Deri ve Moda",
    industries: [
      {
        id: "i1310", naceCode: "13.10", name: "Elyaf, İplik ve Dokuma",
        parameters: [
          { id: "p032", name: "Pamuklu İplik",        unit: "ton",   emissionFactor: 5.8900 },
          { id: "p033", name: "Sentetik İplik",       unit: "ton",   emissionFactor: 7.2100 },
          { id: "p034", name: "Dokuma Kumaş",         unit: "ton",   emissionFactor: 3.6500 },
        ],
      },
      {
        id: "i1330", naceCode: "13.30", name: "Bitirme ve Teknik Tekstil",
        parameters: [
          { id: "p035", name: "Boyama İşlemi",        unit: "ton",   emissionFactor: 4.1200 },
          { id: "p036", name: "Ram Makinesi Gazı",    unit: "Nm³",   emissionFactor: 0.0020 },
          { id: "p037", name: "Halı Dokuma",          unit: "ton",   emissionFactor: 3.8800 },
        ],
      },
      {
        id: "i1511", naceCode: "15.11", name: "Deri ve Ayakkabı",
        parameters: [
          { id: "p038", name: "Deri Tabaklama",       unit: "ton",   emissionFactor: 8.4500 },
          { id: "p039", name: "Ayakkabı Üretimi",     unit: "çift",  emissionFactor: 0.0145 },
          { id: "p040", name: "Krom Kullanımı",       unit: "kg",    emissionFactor: 0.0220 },
        ],
      },
    ],
  },
  {
    id: "g05", code: "05", name: "Kimya, Plastik ve Kauçuk",
    industries: [
      {
        id: "i2011", naceCode: "20.11", name: "Temel Kimya ve Gübre",
        parameters: [
          { id: "p041", name: "Azotlu Gübre (NH₃)",  unit: "ton",   emissionFactor: 1.9300, description: "Haber-Bosch tCO₂/ton" },
          { id: "p042", name: "Endüstriyel Gaz",     unit: "ton",   emissionFactor: 0.6800 },
          { id: "p043", name: "Pestisit",             unit: "ton",   emissionFactor: 5.2100 },
          { id: "p044", name: "Reaksiyon Isısı",     unit: "GJ",    emissionFactor: 0.0560 },
        ],
      },
      {
        id: "i2030", naceCode: "20.30", name: "Tüketici Kimyası ve Polimer",
        parameters: [
          { id: "p045", name: "Plastik Hammadde",    unit: "ton",   emissionFactor: 2.5300 },
          { id: "p046", name: "Deterjan/Sabun",      unit: "ton",   emissionFactor: 1.1800 },
          { id: "p047", name: "Boya/Vernik",         unit: "ton",   emissionFactor: 2.3400 },
        ],
      },
    ],
  },
  {
    id: "g06", code: "06", name: "Metal ve Makine Sanayii",
    industries: [
      {
        id: "i2410", naceCode: "24.10", name: "Ana Metal ve Döküm",
        parameters: [
          { id: "p048", name: "Demir-Çelik (BOF)",   unit: "ton",   emissionFactor: 1.8500, description: "Yüksek fırın tCO₂/ton" },
          { id: "p049", name: "Çelik (EAF)",         unit: "ton",   emissionFactor: 0.4200, description: "Elektrik ark ocağı" },
          { id: "p050", name: "Ferro-alaşım",        unit: "ton",   emissionFactor: 3.7800 },
          { id: "p051", name: "Ark Ocağı Enerjisi",  unit: "MWh",   emissionFactor: 0.4500 },
        ],
      },
      {
        id: "i2511", naceCode: "25.11", name: "Metal Ürünler ve Savunma",
        parameters: [
          { id: "p052", name: "Köprü/Kule Parçası",  unit: "ton",   emissionFactor: 1.2100 },
          { id: "p053", name: "Kaynak Gazı",         unit: "Nm³",   emissionFactor: 0.0020 },
          { id: "p054", name: "Tank/Rezervuar",      unit: "ton",   emissionFactor: 1.4500 },
        ],
      },
      {
        id: "i2811", naceCode: "28.11", name: "Genel Makine",
        parameters: [
          { id: "p055", name: "Motor Üretimi",       unit: "adet",  emissionFactor: 0.3800 },
          { id: "p056", name: "Metal Dövme",         unit: "ton",   emissionFactor: 0.9200 },
          { id: "p057", name: "Toz Metalürjisi",     unit: "ton",   emissionFactor: 1.8800 },
        ],
      },
    ],
  },
  {
    id: "g07", code: "07", name: "Ulaşım ve Taşıt İmalatı",
    industries: [
      {
        id: "i2910", naceCode: "29.10", name: "Kara Taşıtları",
        parameters: [
          { id: "p058", name: "Otomobil Üretimi",    unit: "adet",  emissionFactor: 0.5500 },
          { id: "p059", name: "Kamyon/Otobüs",       unit: "adet",  emissionFactor: 2.8500 },
          { id: "p060", name: "Boyahane Enerjisi",   unit: "MWh",   emissionFactor: 0.4500 },
        ],
      },
      {
        id: "i3011", naceCode: "30.11", name: "Deniz, Raylı ve Hava",
        parameters: [
          { id: "p061", name: "Gemi İnşası",         unit: "ton",   emissionFactor: 0.7200 },
          { id: "p062", name: "Lokomotif/Vagon",     unit: "adet",  emissionFactor: 8.5000 },
          { id: "p063", name: "Kompozit Atık",       unit: "ton",   emissionFactor: 2.1500 },
        ],
      },
    ],
  },
  {
    id: "g08", code: "08", name: "Taşımacılık ve Lojistik",
    industries: [
      {
        id: "i4941", naceCode: "49.41", name: "Yük Taşımacılığı",
        parameters: [
          { id: "p064", name: "Karayolu Ağır Yük",   unit: "ton-km", emissionFactor: 0.000110 },
          { id: "p065", name: "Demiryolu Kargo",     unit: "ton-km", emissionFactor: 0.0000280 },
          { id: "p066", name: "Deniz Dökme Yük",     unit: "ton-km", emissionFactor: 0.0000110 },
          { id: "p067", name: "Havayolu Kargo",      unit: "ton-km", emissionFactor: 0.000800 },
        ],
      },
      {
        id: "i5210", naceCode: "52.10", name: "Depolama ve İletim",
        parameters: [
          { id: "p068", name: "Soğuk Hava Deposu",   unit: "palet-gün", emissionFactor: 0.0028 },
          { id: "p069", name: "Boru Hattı İletimi",  unit: "ton-km", emissionFactor: 0.0000040 },
          { id: "p070", name: "Liman Hizmeti",       unit: "TEU",   emissionFactor: 0.0120 },
        ],
      },
    ],
  },
  {
    id: "g09", code: "09", name: "Teknoloji ve Otomasyon",
    industries: [
      {
        id: "i2611", naceCode: "26.11", name: "Donanım ve Elektronik",
        parameters: [
          { id: "p071", name: "Bilgisayar/Sunucu",   unit: "adet",  emissionFactor: 0.1500 },
          { id: "p072", name: "Baz İstasyonu",       unit: "adet",  emissionFactor: 2.8000 },
          { id: "p073", name: "Tüketici Elektroniği",unit: "adet",  emissionFactor: 0.0550 },
        ],
      },
      {
        id: "i6201", naceCode: "62.01", name: "Yazılım ve Otomasyon",
        parameters: [
          { id: "p074", name: "ERP/CRM Sunucu",      unit: "MWh",   emissionFactor: 0.4500 },
          { id: "p075", name: "Endüstriyel Robot",   unit: "adet",  emissionFactor: 1.2000 },
          { id: "p076", name: "PLC/Sensör",          unit: "adet",  emissionFactor: 0.0180 },
        ],
      },
    ],
  },
  {
    id: "g10", code: "10", name: "Enerji ve Çevre Yönetimi",
    industries: [
      {
        id: "i3511", naceCode: "35.11", name: "Enerji Üretimi",
        parameters: [
          { id: "p077", name: "Termik (Kömür)",      unit: "MWh",   emissionFactor: 0.8200 },
          { id: "p078", name: "Doğalgaz CCGT",       unit: "MWh",   emissionFactor: 0.3700 },
          { id: "p079", name: "HES",                 unit: "MWh",   emissionFactor: 0.0040 },
          { id: "p080", name: "RES",                 unit: "MWh",   emissionFactor: 0.0110 },
          { id: "p081", name: "GES (Solar)",         unit: "MWh",   emissionFactor: 0.0450 },
        ],
      },
      {
        id: "i3832", naceCode: "38.32", name: "Su ve Atık Yönetimi",
        parameters: [
          { id: "p082", name: "Su Arıtma",           unit: "MWh",   emissionFactor: 0.4500 },
          { id: "p083", name: "Tehlikeli Atık",      unit: "ton",   emissionFactor: 0.8800 },
          { id: "p084", name: "Metal Geri Kazanım",  unit: "ton",   emissionFactor: 0.3500 },
        ],
      },
    ],
  },
];

// Helpers
export const getGroup = (groupId: string) =>
  SECTOR_LIBRARY.find((g) => g.id === groupId);

export const getIndustry = (groupId: string, industryId: string) =>
  getGroup(groupId)?.industries.find((i) => i.id === industryId);
