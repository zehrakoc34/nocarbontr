/**
 * NOCARBONTR Ürün Atlası — 500 İhracat Ürünü
 * Her ürün → NACE kodu + formül tipi + zorunlu alt tedarikçi sektörleri
 */

import type { FormulaType } from "./emissionFactors";

export type ProductCategory =
  | "textile_apparel"
  | "food_beverage"
  | "metal_machinery"
  | "automotive"
  | "chemical_pharma"
  | "tech_electronics";

export interface Product {
  id:          string;
  name:        string;
  category:    ProductCategory;
  naceCode:    string;
  formulaType: FormulaType;
  mandatorySubSuppliers: string[];
  avgWeightKg?: number;
}

export const CATEGORY_LABELS: Record<ProductCategory, { label: string; icon: string; color: string }> = {
  textile_apparel:  { label: "Tekstil & Hazır Giyim",     icon: "👕", color: "#16A34A" },
  food_beverage:    { label: "Gıda & İçecek",             icon: "🍞", color: "#D97706" },
  metal_machinery:  { label: "Metal & Makine",            icon: "⚙️", color: "#64748B" },
  automotive:       { label: "Otomotiv & Ulaşım",         icon: "🚗", color: "#2563EB" },
  chemical_pharma:  { label: "Kimya, Plastik & Sağlık",   icon: "🧪", color: "#7C3AED" },
  tech_electronics: { label: "Teknoloji & Elektronik",    icon: "💻", color: "#0D9488" },
};

// ─── Alt Tedarikçi Sektörleri (ortak kütüphane) ────────────
export const SUB_SUPPLIERS = {
  // Tekstil
  YARN:           "İplik Üretimi",
  WEAVING:        "Kumaş Dokuma/Örme",
  DYEING:         "Boyahane (Terbiye)",
  TRIM:           "Aksesuar (Düğme/Fermuar)",
  LEATHER:        "Deri İşleme",
  // Gıda
  AGRI:           "Tarımsal Hammadde",
  COLD_CHAIN:     "Soğuk Zincir Lojistik",
  STEAM:          "Buhar/Enerji Üretimi",
  // Metal
  CASTING:        "Ana Metal (Döküm)",
  MACHINING:      "Talaşlı İmalat",
  HEAT_TREAT:     "Isıl İşlem",
  COATING:        "Kimyasal Kaplama",
  WELDING:        "Kaynak Hizmetleri",
  MOTOR:          "Elektrik Motoru",
  // Otomotiv
  PLASTIC_INJ:    "Plastik Enjeksiyon",
  RUBBER:         "Kauçuk İşleme",
  WIRING:         "Kablo/Harness",
  PAINT_SHOP:     "Boyahane (Araç)",
  // Kimya
  PETROCHEM:      "Petrokimya",
  GAS_PROD:       "Endüstriyel Gaz",
  STERILIZATION:  "Sterilizasyon",
  LAB:            "Laboratuvar Hizmetleri",
  // Elektronik
  PCB:            "PCB/Baskılı Devre",
  ELECTRONIC_COMP:"Elektronik Komponent",
  COMPRESSOR:     "Kompresör Üretimi",
  SOFTWARE:       "Yazılım/Firmware",
  // Ortak
  LOGISTICS:      "Lojistik",
  PACKAGING:      "Ambalaj (Karton/Plastik)",
  GLASS_PKG:      "Cam Ambalaj",
  METAL_PKG:      "Metal Ambalaj",
  ENERGY:         "Enerji Tedariki",
} as const;

const S = SUB_SUPPLIERS;

// ─── Yardımcı: ürün listesi jeneratör ─────────────────────
const mk = (
  prefix: string,
  names: string[],
  category: ProductCategory,
  naceCode: string,
  formulaType: FormulaType,
  subs: string[],
  avgWeight?: number,
): Product[] =>
  names.map((name, idx) => ({
    id: `${prefix}${String(idx + 1).padStart(3, "0")}`,
    name,
    category,
    naceCode,
    formulaType,
    mandatorySubSuppliers: subs,
    avgWeightKg: avgWeight,
  }));

// ─── 1. TEKSTİL & HAZIR GİYİM (100 ÜRÜN) ──────────────────
const TEXTILE_WOVEN = [
  "Pamuklu Gömlek", "Denim Pantolon", "Penye T-shirt", "Yünlü Palto", "Takım Elbise",
  "Abiye Elbise", "Kot Ceket", "Tayt", "Eşofman Takımı", "Polo Yaka T-shirt",
  "Gömlek (Keten)", "Kruvaze Ceket", "Etek", "Şort", "Trençkot",
  "Yağmurluk", "Rüzgarlık", "Blazer", "Bluz", "Tunik",
  "Kazak (Triko)", "Hırka", "Yelek (Yün)", "Pelerin", "Poncho",
];
const TEXTILE_ACCESSORIES = [
  "İpek Eşarp", "Kravat", "Fular", "Şal", "Kemer (Kumaş)",
  "Bere", "Atkı", "Eldiven (Örme)", "Şapka (Kumaş)", "Papyon",
  "Saç Bandı", "Kol Bandı", "Kumaş Çanta",
];
const TEXTILE_HOME = [
  "Nevresim Takımı", "Jakarlı Havlu", "Kadife Perde", "Masa Örtüsü", "Yatak Çarşafı",
  "Yastık Kılıfı", "Battaniye", "Yorgan", "Koltuk Örtüsü", "Banyo Havlusu",
  "Bornoz", "Paspas", "Halı (Makine)", "Kilim (El Dokuma)", "Seccade",
  "Salon Halısı", "Çocuk Halısı",
];
const TEXTILE_TECHNICAL = [
  "Teknik Dağcı Montu", "Mayo", "Spor Tayt", "Antrenman Tişörtü", "İş Güvenliği Yeleği",
  "Koruyucu Maske (Tekstil)", "Cerrahi Önlük", "Koruyucu Tulum", "Refleksiyonlu Mont",
  "Spor Ayakkabı", "Kayak Eldiveni", "Dalış Kıyafeti", "Balıkçı Yağmurluğu",
];
const TEXTILE_KIDS = [
  "Bebek Zıbını", "Bebek Tulumu", "Çocuk Pijaması", "Bebek Battaniyesi",
  "Okul Forması", "Çocuk Ayakkabısı", "Emzirme Önlüğü",
];
const TEXTILE_COMPONENTS = [
  "Tela", "Fermuar", "Düğme", "Nakış İpliği", "Dantel",
  "Dar Dokuma Şerit", "Cırt Bant", "Vatka", "Astar Kumaş", "Kapitone Kumaş",
  "Örme Çorap", "Parmaklı Çorap",
];
const LEATHER_GOODS = [
  "Deri Ceket", "Deri Ayakkabı", "Terlik", "Cüzdan", "Kemer (Deri)",
  "Valiz", "Okul Çantası", "El Çantası", "Postal", "Deri Eldiven",
  "Kartlık", "Saat Kayışı",
];

const TEXTILE_PRODUCTS: Product[] = [
  ...mk("TX", TEXTILE_WOVEN,       "textile_apparel", "14.13", "logistics",   [S.YARN, S.WEAVING, S.DYEING, S.TRIM, S.LOGISTICS, S.PACKAGING], 0.35),
  ...mk("TA", TEXTILE_ACCESSORIES, "textile_apparel", "14.19", "logistics",   [S.YARN, S.WEAVING, S.DYEING, S.LOGISTICS], 0.08),
  ...mk("TH", TEXTILE_HOME,        "textile_apparel", "13.92", "energy",      [S.YARN, S.WEAVING, S.DYEING, S.LOGISTICS, S.PACKAGING], 1.2),
  ...mk("TT", TEXTILE_TECHNICAL,   "textile_apparel", "14.12", "process",     [S.YARN, S.WEAVING, S.DYEING, S.COATING, S.TRIM, S.LOGISTICS], 0.6),
  ...mk("TK", TEXTILE_KIDS,        "textile_apparel", "14.19", "logistics",   [S.YARN, S.WEAVING, S.DYEING, S.TRIM, S.PACKAGING], 0.25),
  ...mk("TC", TEXTILE_COMPONENTS,  "textile_apparel", "13.96", "process",     [S.YARN, S.WEAVING, S.DYEING, S.LOGISTICS], 0.05),
  ...mk("LG", LEATHER_GOODS,       "textile_apparel", "15.12", "process",     [S.LEATHER, S.DYEING, S.TRIM, S.LOGISTICS, S.PACKAGING], 0.55),
];

// ─── 2. GIDA & İÇECEK (80 ÜRÜN) ───────────────────────────
const FOOD_OIL_DAIRY = [
  "Zeytinyağı (Sızma)", "Ayçiçek Yağı", "Mısır Yağı", "Margarin", "Tereyağı",
  "Beyaz Peynir", "Kaşar Peyniri", "Yoğurt", "Ayran", "Kefir",
  "Süt (UHT)", "Krema", "Labne", "Lor Peyniri",
];
const FOOD_BAKERY = [
  "Bisküvi", "Çubuk Kraker", "Glutensiz Ekmek", "Makarna",
  "Un", "Bulgur", "İrmik", "Hazır Pasta Karışımı",
];
const FOOD_SWEETS = [
  "Sütlü Çikolata", "Bitter Çikolata", "Helva", "Lokum", "Reçel",
  "Bal", "Pekmez", "Tahin", "Küp Şeker", "Toz Şeker",
  "Fındık Ezmesi", "Badem Ezmesi", "Jöle",
];
const FOOD_CONSERVE = [
  "Domates Salçası", "Biber Salçası", "Konserve Bezelye", "Konserve Mısır", "Konserve Fasulye",
  "Turşu", "Zeytin (Siyah)", "Zeytin (Yeşil)",
];
const FOOD_FROZEN = [
  "Dondurulmuş Parmak Patates", "Dondurulmuş Balık", "Dondurulmuş Hamur", "Dondurulmuş Sebze",
  "Dondurulmuş Pizza", "Dondurma",
];
const FOOD_BEVERAGES = [
  "Meyve Suyu (Vişne)", "Meyve Suyu (Portakal)", "Gazlı İçecek", "Maden Suyu", "Enerji İçeceği",
  "Siyah Çay", "Hazır Kahve", "Granül Kahve", "Soğuk Çay",
];
const FOOD_MEAT = [
  "Salam", "Sosis", "Pastırma", "Sucuk", "Jambon",
  "Tavuk Nugget", "Tavuk Döner",
];
const FOOD_READY_SPICE = [
  "Hazır Çorba", "Baharat Seti", "Bebek Maması", "Kuruyemiş Paketi",
  "Hazır Yemek", "Soya Sosu", "Ketçap", "Mayonez",
  "Soğan Tozu", "Bulyon", "Hazır Börek", "Hazır Mantı",
];

const FOOD_PRODUCTS: Product[] = [
  ...mk("FO", FOOD_OIL_DAIRY,   "food_beverage", "10.41", "agriculture", [S.AGRI, S.COLD_CHAIN, S.GLASS_PKG, S.STEAM, S.LOGISTICS], 1.0),
  ...mk("FB", FOOD_BAKERY,      "food_beverage", "10.72", "energy",      [S.AGRI, S.STEAM, S.PACKAGING, S.LOGISTICS], 0.5),
  ...mk("FS", FOOD_SWEETS,      "food_beverage", "10.82", "process",     [S.AGRI, S.STEAM, S.PACKAGING, S.LOGISTICS], 0.3),
  ...mk("FC", FOOD_CONSERVE,    "food_beverage", "10.39", "process",     [S.AGRI, S.STEAM, S.METAL_PKG, S.GLASS_PKG, S.LOGISTICS], 0.4),
  ...mk("FF", FOOD_FROZEN,      "food_beverage", "10.20", "energy",      [S.AGRI, S.COLD_CHAIN, S.STEAM, S.PACKAGING, S.LOGISTICS], 0.5),
  ...mk("FV", FOOD_BEVERAGES,   "food_beverage", "11.07", "process",     [S.AGRI, S.GLASS_PKG, S.METAL_PKG, S.STEAM, S.LOGISTICS], 0.5),
  ...mk("FM", FOOD_MEAT,        "food_beverage", "10.13", "agriculture", [S.AGRI, S.COLD_CHAIN, S.PACKAGING, S.LOGISTICS], 0.3),
  ...mk("FR", FOOD_READY_SPICE, "food_beverage", "10.89", "process",     [S.AGRI, S.STEAM, S.PACKAGING, S.LOGISTICS], 0.25),
];

// ─── 3. METAL & MAKİNE & SAVUNMA (100 ÜRÜN) ───────────────
const METAL_RAW = [
  "Demir Çubuk", "Çelik Boru", "Alüminyum Profil", "Bakır Tel", "Paslanmaz Sac",
  "Galvanizli Sac", "Çinko Levha", "Pirinç Çubuk", "Alüminyum Levha", "Çelik Sac",
];
const METAL_MACHINE = [
  "CNC Tezgahı", "Torna Tezgahı", "Pres Makinesi", "Dokuma Tezgahı", "Hava Kompresörü",
  "Kaynak Makinesi", "Sanayi Tipi Fırın", "Forklift Parçası", "Vinç Kancası", "Hidrolik Pompa",
  "Redüktör", "Vana (Sanayi)", "Rulman", "Motor Kaplini", "Konveyör Bandı",
  "Çimento Değirmeni", "Kırma Makinesi", "Karıştırıcı", "Dolum Makinesi", "Etiketleme Makinesi",
];
const METAL_ELECTRIC = [
  "Jeneratör", "Transformatör", "Elektrik Panosu", "Elektrik Motoru", "Alternatör",
  "Servo Motor", "DC Motor", "Step Motor", "Soft Starter", "Frekans Sürücüsü",
];
const METAL_COUNTERS = [
  "Su Sayacı", "Doğalgaz Sayacı", "Elektrik Sayacı", "Kalorimetre", "Debi Ölçer",
];
const METAL_BUILDING = [
  "Çelik Kapı", "Mutfak Evyesi", "Metal Tank", "Buhar Kazanı", "Isıtıcı Kazan",
  "Çelik Köprü Kirişi", "Sandviç Panel", "Trapez Sac", "Çatı Oluğu", "Alüminyum Doğrama",
  "PVC Doğrama", "Çelik Merdiven", "Korkuluk", "Otopark Bariyeri", "Metal Raf",
];
const METAL_DEFENSE = [
  "Silah Namlusu", "Mühimmat Kovası", "İHA Gövdesi", "SİHA Kanadı", "Roket Motoru Parçası",
  "Zırh Levhası", "Tanksavar Roketi", "Mermi Kovanı", "Radar Şasesi", "Savunma Kask",
];
const METAL_SMALL = [
  "Çivi", "Civata", "Somun", "Rondela", "Menteşe",
  "Kilit", "El Arabası", "Takım Çantası", "Metal Askılık", "Yaylı Halka",
  "Metal Klips", "Metal Kelepçe", "Saplama", "Dübel", "Pul",
];
const METAL_DOMESTIC = [
  "Tencere Seti", "Tava", "Mangal", "Odun Sobası", "Isıtıcı Soba",
  "Çelik Bardak",
];
const METAL_PROCESS = [
  "Torna Uç", "Matkap Ucu", "Freze Bıçağı", "Disk Testere", "Raspa",
  "Kaynak Elektrodu", "Taşlama Taşı", "Lastik Jant",
];

const METAL_PRODUCTS: Product[] = [
  ...mk("MR", METAL_RAW,       "metal_machinery", "24.10", "energy",    [S.CASTING, S.HEAT_TREAT, S.ENERGY, S.LOGISTICS], 50),
  ...mk("MM", METAL_MACHINE,   "metal_machinery", "28.99", "energy",    [S.CASTING, S.MACHINING, S.MOTOR, S.PAINT_SHOP, S.LOGISTICS], 800),
  ...mk("ME", METAL_ELECTRIC,  "metal_machinery", "27.11", "energy",    [S.CASTING, S.MACHINING, S.WIRING, S.COATING, S.LOGISTICS], 120),
  ...mk("MC", METAL_COUNTERS,  "metal_machinery", "26.51", "process",   [S.MACHINING, S.PCB, S.ELECTRONIC_COMP, S.LOGISTICS], 1.5),
  ...mk("MB", METAL_BUILDING,  "metal_machinery", "25.11", "energy",    [S.CASTING, S.WELDING, S.COATING, S.PAINT_SHOP, S.LOGISTICS], 35),
  ...mk("MD", METAL_DEFENSE,   "metal_machinery", "25.40", "process",   [S.CASTING, S.MACHINING, S.HEAT_TREAT, S.COATING, S.LOGISTICS], 15),
  ...mk("MS", METAL_SMALL,     "metal_machinery", "25.93", "energy",    [S.CASTING, S.HEAT_TREAT, S.COATING, S.PACKAGING, S.LOGISTICS], 0.05),
  ...mk("MH", METAL_DOMESTIC,  "metal_machinery", "25.71", "energy",    [S.CASTING, S.MACHINING, S.COATING, S.PACKAGING, S.LOGISTICS], 2.5),
  ...mk("MP", METAL_PROCESS,   "metal_machinery", "25.73", "process",   [S.CASTING, S.HEAT_TREAT, S.MACHINING, S.LOGISTICS], 0.4),
];

// ─── 4. OTOMOTİV & ULAŞIM (70 ÜRÜN) ───────────────────────
const AUTO_VEHICLES = [
  "Otomobil", "Elektrikli Otobüs", "Kamyon Şasisi", "Treyler", "Karavan",
  "Minibüs", "Ticari Van", "Elektrikli Scooter", "Bisiklet", "Motorlu Bisiklet",
];
const AUTO_BODY = [
  "Araç Koltuğu", "Direksiyon Simidi", "Far Grubu", "Dikiz Aynası", "Kapı Kolu",
  "İç Trim Paneli", "Araç Tavan Döşemesi", "Gösterge Paneli", "Tampon Kaplama", "Kapı Paneli",
  "Stop Lambası", "Sinyal Lambası",
];
const AUTO_WHEEL = [
  "Jant", "Araç Lastiği", "Lastik Hava Supabı", "Lastik Balans Ağırlığı",
];
const AUTO_BRAKE_SUSP = [
  "Fren Balatası", "Amortisör", "Salıncak", "Rotil", "Kardan Mili",
  "Fren Diski",
];
const AUTO_ENGINE_TRANS = [
  "Egzoz Borusu", "Piston", "Segman", "Krank Mili", "Külbütör",
  "Silindir Kapağı", "Silindir Bloğu", "Yakıt Pompası", "Debriyaj Seti", "Şanzıman Dişlisi",
  "Diferansiyel", "Volan", "Turbo Şarj",
];
const AUTO_FILTER_FLUID = [
  "Hava Filtresi", "Yağ Filtresi", "Yakıt Filtresi", "Polen Filtresi",
  "Motor Yağı", "Hidrolik Yağ", "Antifriz", "Fren Hidroliği",
];
const AUTO_ELECTRIC = [
  "Akü", "Silecek Motoru", "Cam Suyu Deposu", "Rölan Motor", "Marş Motoru",
  "Alternatör (Araç)", "Ateşleme Bobini",
];
const AUTO_SAFETY = [
  "Emniyet Kemeri", "Hava Yastığı (Airbag)", "Çocuk Oto Koltuğu", "Güvenlik Ağı",
];
const AUTO_OTHER = [
  "Radyatör", "Klima Kompresörü (Araç)", "Oto Kablo Harness", "Araç Camı", "Sunroof",
];

const AUTO_PRODUCTS: Product[] = [
  ...mk("AV", AUTO_VEHICLES,     "automotive", "29.10", "logistics", [S.CASTING, S.PLASTIC_INJ, S.RUBBER, S.WIRING, S.PAINT_SHOP, S.LOGISTICS, S.ELECTRONIC_COMP], 1500),
  ...mk("AB", AUTO_BODY,         "automotive", "29.32", "logistics", [S.PLASTIC_INJ, S.CASTING, S.PAINT_SHOP, S.LOGISTICS], 3),
  ...mk("AW", AUTO_WHEEL,        "automotive", "29.32", "energy",    [S.CASTING, S.RUBBER, S.COATING, S.LOGISTICS], 12),
  ...mk("AS", AUTO_BRAKE_SUSP,   "automotive", "29.32", "energy",    [S.CASTING, S.MACHINING, S.HEAT_TREAT, S.LOGISTICS], 8),
  ...mk("AE", AUTO_ENGINE_TRANS, "automotive", "29.10", "energy",    [S.CASTING, S.MACHINING, S.HEAT_TREAT, S.COATING, S.LOGISTICS], 15),
  ...mk("AF", AUTO_FILTER_FLUID, "automotive", "29.32", "process",   [S.PETROCHEM, S.PACKAGING, S.LOGISTICS], 1.5),
  ...mk("AC", AUTO_ELECTRIC,     "automotive", "29.31", "energy",    [S.WIRING, S.CASTING, S.ELECTRONIC_COMP, S.LOGISTICS], 10),
  ...mk("AY", AUTO_SAFETY,       "automotive", "29.32", "process",   [S.PLASTIC_INJ, S.YARN, S.WEAVING, S.LOGISTICS], 5),
  ...mk("AO", AUTO_OTHER,        "automotive", "29.32", "energy",    [S.CASTING, S.PLASTIC_INJ, S.WIRING, S.LOGISTICS], 8),
];

// ─── 5. KİMYA, PLASTİK & SAĞLIK (80 ÜRÜN) ─────────────────
const CHEM_CLEANING = [
  "Sıvı Deterjan", "Çamaşır Suyu", "El Sabunu", "Şampuan", "Bulaşık Deterjanı",
  "Genel Temizleyici", "Cam Temizleyici", "Çamaşır Yumuşatıcı", "Banyo Temizleyici", "Yüzey Dezenfektan",
];
const CHEM_COSMETIC = [
  "Diş Macunu", "Nemlendirici Krem", "Parfüm", "Saç Boyası", "Güneş Kremi",
  "Ruj", "Göz Kalemi", "Fondöten", "Kolonya", "Deodorant",
];
const CHEM_PLASTIC = [
  "Plastik Bidon", "PET Şişe", "PVC Boru", "Naylon Poşet", "Plastik Sandalye",
  "Plastik Masa", "Plastik Kova", "Plastik Kapak", "Plastik Kasa", "Plastik Film",
];
const CHEM_RUBBER = [
  "Kauçuk Hortum", "Oto Lastiği (Kamyon)", "Conta Seti", "Kauçuk Bant", "Silikon Sızdırmazlık",
];
const CHEM_INKS_PAINTS = [
  "Mürekkep (Ofset)", "Duvar Boyası", "Mobilya Verniği", "Epoksi Yapıştırıcı", "Sprey Boya",
  "Yol Çizgi Boyası", "Endüstriyel Boya", "Oto Boyası", "Toz Boya", "Yapıştırıcı",
];
const CHEM_AGRI = [
  "Gübre (Üre)", "Gübre (DAP)", "Amonyum Nitrat", "Pestisit", "Herbisit",
  "Fungisit", "Toprak Düzenleyici",
];
const PHARMA = [
  "İlaç Hammaddesi (API)", "Antibiyotik", "Vitamin Hapı", "Ağrı Kesici", "Aşı",
  "Serum Seti", "Test Kiti", "İnsülin", "İnhaler", "Damla",
];
const MEDICAL = [
  "Diyaliz Cihazı", "Tekerlekli Sandalye", "Diş İmplantı", "Cerrahi Maske", "Steril Eldiven",
  "Cerrahi Gömlek", "Otoskop", "Stetoskop", "Tansiyon Aleti", "Termometre",
  "Ortez", "Protez", "Cerrahi Alet Seti",
];

const CHEM_PRODUCTS: Product[] = [
  ...mk("CC", CHEM_CLEANING,    "chemical_pharma", "20.41", "process", [S.PETROCHEM, S.GAS_PROD, S.PACKAGING, S.LOGISTICS], 1.0),
  ...mk("CK", CHEM_COSMETIC,    "chemical_pharma", "20.42", "process", [S.PETROCHEM, S.GLASS_PKG, S.PACKAGING, S.LOGISTICS], 0.1),
  ...mk("CP", CHEM_PLASTIC,     "chemical_pharma", "22.21", "energy",  [S.PETROCHEM, S.ENERGY, S.LOGISTICS], 2.0),
  ...mk("CR", CHEM_RUBBER,      "chemical_pharma", "22.19", "energy",  [S.PETROCHEM, S.ENERGY, S.LOGISTICS], 3.0),
  ...mk("CI", CHEM_INKS_PAINTS, "chemical_pharma", "20.30", "process", [S.PETROCHEM, S.METAL_PKG, S.LOGISTICS], 2.5),
  ...mk("CA", CHEM_AGRI,        "chemical_pharma", "20.15", "process", [S.PETROCHEM, S.GAS_PROD, S.PACKAGING, S.LOGISTICS], 50),
  ...mk("PH", PHARMA,           "chemical_pharma", "21.10", "process", [S.LAB, S.STERILIZATION, S.GLASS_PKG, S.COLD_CHAIN, S.LOGISTICS], 0.02),
  ...mk("MD", MEDICAL,          "chemical_pharma", "32.50", "process", [S.PLASTIC_INJ, S.MACHINING, S.STERILIZATION, S.ELECTRONIC_COMP, S.LOGISTICS], 1.5),
];

// ─── 6. TEKNOLOJİ, ENERJİ & EV GEREÇLERİ (70 ÜRÜN) ───────
const TECH_ENERGY = [
  "Akıllı Sayaç", "LED Ampul", "Güneş Paneli", "İnverter", "Lityum Batarya",
  "Elektrik Kablosu", "Fiber Optik Kablo", "Sigorta Kutusu", "Şalter", "UPS Cihazı",
];
const TECH_HVAC = [
  "Kombi", "Klima", "Split Klima", "Merkezi Isı Pompası", "Şofben",
  "Termosifon", "Aspiratör", "Havalandırma Cihazı",
];
const TECH_WHITE = [
  "Buzdolabı", "Çamaşır Makinesi", "Bulaşık Makinesi", "Ankastre Ocak", "Davlumbaz",
  "Derin Dondurucu", "Mikrodalga Fırın", "Ankastre Fırın", "Kurutma Makinesi",
];
const TECH_BROWN = [
  "Televizyon", "Set Üstü Kutusu", "Modem", "Güvenlik Kamerası", "Projeksiyon Cihazı",
  "Ses Barı", "Bluetooth Hoparlör", "Kulaklık (Kablosuz)",
];
const TECH_COMP = [
  "PCB Kartı", "Sensör Modülü", "PLC Cihazı", "Mikrokontrolcü Kartı", "RFID Okuyucu",
  "Barkod Tarayıcı",
];
const TECH_SMALL = [
  "Elektrikli Isıtıcı", "Ütü", "Elektrikli Süpürge", "Saç Kurutma Makinesi", "Kahve Makinesi",
  "Tost Makinesi", "Blender", "Mikser", "Su Isıtıcı (Kettle)", "Ekmek Kızartma Makinesi",
];
const TECH_WEAR = [
  "Akıllı Saat", "Robot Süpürge", "Akıllı Termostat", "Bileklik (Fitness)", "VR Gözlük",
];
const TECH_OFFICE = [
  "Yazıcı", "Fotokopi Makinesi", "Dizüstü Bilgisayar", "Tablet", "Akıllı Telefon",
  "Bilgisayar Kasası",
];

const TECH_PRODUCTS: Product[] = [
  ...mk("TE", TECH_ENERGY, "tech_electronics", "27.12", "process",   [S.PCB, S.ELECTRONIC_COMP, S.WIRING, S.CASTING, S.LOGISTICS], 5),
  ...mk("TV", TECH_HVAC,   "tech_electronics", "28.25", "energy",    [S.CASTING, S.COMPRESSOR, S.PCB, S.WIRING, S.LOGISTICS], 40),
  ...mk("TW", TECH_WHITE,  "tech_electronics", "27.51", "energy",    [S.CASTING, S.COMPRESSOR, S.PCB, S.PLASTIC_INJ, S.WIRING, S.LOGISTICS], 60),
  ...mk("TB", TECH_BROWN,  "tech_electronics", "26.40", "logistics", [S.PCB, S.ELECTRONIC_COMP, S.PLASTIC_INJ, S.WIRING, S.LOGISTICS], 12),
  ...mk("TP", TECH_COMP,   "tech_electronics", "26.11", "logistics", [S.PCB, S.ELECTRONIC_COMP, S.SOFTWARE, S.LOGISTICS], 0.3),
  ...mk("TS", TECH_SMALL,  "tech_electronics", "27.51", "energy",    [S.CASTING, S.PLASTIC_INJ, S.PCB, S.WIRING, S.LOGISTICS], 3),
  ...mk("TR", TECH_WEAR,   "tech_electronics", "26.52", "logistics", [S.PCB, S.ELECTRONIC_COMP, S.SOFTWARE, S.LOGISTICS], 0.1),
  ...mk("TO", TECH_OFFICE, "tech_electronics", "26.20", "logistics", [S.PCB, S.ELECTRONIC_COMP, S.PLASTIC_INJ, S.SOFTWARE, S.LOGISTICS], 2.5),
];

// ─── Birleşik Atlas ────────────────────────────────────────
export const PRODUCT_ATLAS: Product[] = [
  ...TEXTILE_PRODUCTS,
  ...FOOD_PRODUCTS,
  ...METAL_PRODUCTS,
  ...AUTO_PRODUCTS,
  ...CHEM_PRODUCTS,
  ...TECH_PRODUCTS,
];

export const searchProducts = (query: string, limit = 15): Product[] => {
  const q = query.trim().toLocaleLowerCase("tr-TR");
  if (!q) return [];
  return PRODUCT_ATLAS
    .filter((p) => p.name.toLocaleLowerCase("tr-TR").includes(q))
    .slice(0, limit);
};

export const getProduct = (id: string): Product | undefined =>
  PRODUCT_ATLAS.find((p) => p.id === id);

export const getProductsByCategory = (cat: ProductCategory): Product[] =>
  PRODUCT_ATLAS.filter((p) => p.category === cat);

export const ATLAS_STATS = {
  total:       PRODUCT_ATLAS.length,
  categories:  Object.keys(CATEGORY_LABELS).length,
  subSuppliers: Object.keys(SUB_SUPPLIERS).length,
};
