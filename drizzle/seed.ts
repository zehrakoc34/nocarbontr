import { getDb } from "../server/db";
import {
  sectors,
  sectorInputs,
  emissionFactors,
} from "./schema";

/**
 * Seed data for 20 Turkish export sectors with HS codes and emission factors
 */

const sectorsData = [
  {
    code: "AUTO",
    nameEn: "Automotive & Spare Parts",
    nameTr: "Otomotiv ve Yedek Parçalar",
    category: "Manufacturing",
    hsCodes: ["8708", "8704", "8705", "8706", "8707"],
    description: "Motor vehicles, parts and accessories",
  },
  {
    code: "MACH",
    nameEn: "Machinery & Mechanical Equipment",
    nameTr: "Makine ve Mekanik Cihazlar",
    category: "Manufacturing",
    hsCodes: ["8401", "8402", "8403", "8404", "8405"],
    description: "Industrial machinery and equipment",
  },
  {
    code: "TEXT",
    nameEn: "Textiles & Apparel",
    nameTr: "Tekstil ve Hazır Giyim",
    category: "Manufacturing",
    hsCodes: ["6101", "6102", "6103", "6104", "6105"],
    description: "Textiles, clothing and accessories",
  },
  {
    code: "ELEC",
    nameEn: "Electrical & Electronics",
    nameTr: "Elektrikli Eşya ve Elektronik",
    category: "Manufacturing",
    hsCodes: ["8501", "8502", "8503", "8504", "8505"],
    description: "Electrical machinery and equipment",
  },
  {
    code: "STEEL",
    nameEn: "Iron & Steel Products",
    nameTr: "Demir-Çelik ve Metal Ürünleri",
    category: "Manufacturing",
    hsCodes: ["7201", "7202", "7203", "7204", "7205"],
    description: "Iron and steel products",
  },
  {
    code: "PLAST",
    nameEn: "Plastics & Plastic Products",
    nameTr: "Plastik ve Plastik Mamuller",
    category: "Manufacturing",
    hsCodes: ["3901", "3902", "3903", "3904", "3905"],
    description: "Plastic materials and products",
  },
  {
    code: "CHEM",
    nameEn: "Chemical Substances",
    nameTr: "Kimyasal Maddeler",
    category: "Manufacturing",
    hsCodes: ["2801", "2802", "2803", "2804", "2805"],
    description: "Chemical products and compounds",
  },
  {
    code: "JEWEL",
    nameEn: "Precious Metals & Jewelry",
    nameTr: "Mücevherat ve Kıymetli Metaller",
    category: "Manufacturing",
    hsCodes: ["7101", "7102", "7103", "7104", "7105"],
    description: "Precious metals and jewelry",
  },
  {
    code: "FOOD",
    nameEn: "Food Products",
    nameTr: "Gıda Ürünleri",
    category: "Food & Agriculture",
    hsCodes: ["0801", "0802", "0803", "0804", "0805"],
    description: "Food products including nuts and fruits",
  },
  {
    code: "FURN",
    nameEn: "Furniture & Home Textiles",
    nameTr: "Mobilya ve Ev Tekstili",
    category: "Manufacturing",
    hsCodes: ["9401", "9402", "9403", "9404", "9405"],
    description: "Furniture and home furnishings",
  },
  {
    code: "PHARM",
    nameEn: "Pharmaceutical Products",
    nameTr: "İlaç ve Eczacılık Ürünleri",
    category: "Manufacturing",
    hsCodes: ["3001", "3002", "3003", "3004", "3005"],
    description: "Pharmaceutical and medical products",
  },
  {
    code: "RUBBER",
    nameEn: "Rubber & Rubber Products",
    nameTr: "Lastik ve Kauçuk Ürünleri",
    category: "Manufacturing",
    hsCodes: ["4001", "4002", "4003", "4004", "4005"],
    description: "Rubber and rubber products",
  },
  {
    code: "GLASS",
    nameEn: "Glass & Ceramics",
    nameTr: "Cam ve Seramik",
    category: "Manufacturing",
    hsCodes: ["7001", "7002", "7003", "7004", "7005"],
    description: "Glass and ceramic products",
  },
  {
    code: "ALUM",
    nameEn: "Aluminum & Non-Ferrous Metals",
    nameTr: "Alüminyum ve Demir Dışı Metaller",
    category: "Manufacturing",
    hsCodes: ["7601", "7602", "7603", "7604", "7605"],
    description: "Aluminum and non-ferrous metal products",
  },
  {
    code: "SHOES",
    nameEn: "Footwear & Leather Products",
    nameTr: "Ayakkabı ve Deri Ürünleri",
    category: "Manufacturing",
    hsCodes: ["6401", "6402", "6403", "6404", "6405"],
    description: "Footwear and leather goods",
  },
  {
    code: "AGMACH",
    nameEn: "Agricultural Machinery",
    nameTr: "Tarım Makineleri ve Traktör",
    category: "Manufacturing",
    hsCodes: ["8701", "8702", "8703", "8704", "8705"],
    description: "Agricultural machinery and tractors",
  },
  {
    code: "AERO",
    nameEn: "Aerospace & Defense",
    nameTr: "Savunma ve Havacılık Parçaları",
    category: "Manufacturing",
    hsCodes: ["8801", "8802", "8803", "8804", "8805"],
    description: "Aerospace and defense components",
  },
  {
    code: "TOYS",
    nameEn: "Toys & Sports Equipment",
    nameTr: "Oyuncak ve Spor Malzemeleri",
    category: "Manufacturing",
    hsCodes: ["9501", "9502", "9503", "9504", "9505"],
    description: "Toys and sports equipment",
  },
  {
    code: "COSMET",
    nameEn: "Cleaning & Cosmetic Products",
    nameTr: "Temizlik ve Kozmetik Ürünleri",
    category: "Manufacturing",
    hsCodes: ["3401", "3402", "3403", "3404", "3405"],
    description: "Cleaning and cosmetic products",
  },
  {
    code: "PROCESSED",
    nameEn: "Processed Food & Vegetables",
    nameTr: "Meyve Sebze Mamulleri ve İşlenmiş Gıda",
    category: "Food & Agriculture",
    hsCodes: ["0701", "0702", "0703", "0704", "0705"],
    description: "Processed fruits, vegetables and food products",
  },
];

const sectorInputsData: Array<{
  sectorCode: string;
  inputs: Array<{ nameEn: string; nameTr: string; hsCode: string }>;
}> = [
  {
    sectorCode: "AUTO",
    inputs: [
      {
        nameEn: "Steel Components",
        nameTr: "Çelik Bileşenler",
        hsCode: "7325",
      },
      {
        nameEn: "Aluminum Parts",
        nameTr: "Alüminyum Parçalar",
        hsCode: "7616",
      },
      {
        nameEn: "Plastic Components",
        nameTr: "Plastik Bileşenler",
        hsCode: "3916",
      },
      {
        nameEn: "Rubber Seals",
        nameTr: "Kauçuk Contalar",
        hsCode: "4016",
      },
      {
        nameEn: "Electronic Components",
        nameTr: "Elektronik Bileşenler",
        hsCode: "8542",
      },
    ],
  },
  {
    sectorCode: "MACH",
    inputs: [
      {
        nameEn: "Cast Iron",
        nameTr: "Dökme Demir",
        hsCode: "7325",
      },
      {
        nameEn: "Stainless Steel",
        nameTr: "Paslanmaz Çelik",
        hsCode: "7326",
      },
      {
        nameEn: "Bearings",
        nameTr: "Rulmanlar",
        hsCode: "8482",
      },
      {
        nameEn: "Motors",
        nameTr: "Motorlar",
        hsCode: "8501",
      },
      {
        nameEn: "Hydraulic Components",
        nameTr: "Hidrolik Bileşenler",
        hsCode: "8481",
      },
    ],
  },
  {
    sectorCode: "TEXT",
    inputs: [
      {
        nameEn: "Cotton Yarn",
        nameTr: "Pamuk İpliği",
        hsCode: "5204",
      },
      {
        nameEn: "Polyester Fiber",
        nameTr: "Polyester Elyaf",
        hsCode: "5503",
      },
      {
        nameEn: "Dyes",
        nameTr: "Boyalar",
        hsCode: "3204",
      },
      {
        nameEn: "Chemicals",
        nameTr: "Kimyasallar",
        hsCode: "3809",
      },
      {
        nameEn: "Buttons",
        nameTr: "Düğmeler",
        hsCode: "6217",
      },
    ],
  },
  {
    sectorCode: "ELEC",
    inputs: [
      {
        nameEn: "Copper Wire",
        nameTr: "Bakır Tel",
        hsCode: "7408",
      },
      {
        nameEn: "Silicon Wafers",
        nameTr: "Silikon Waferler",
        hsCode: "3818",
      },
      {
        nameEn: "Transformers",
        nameTr: "Transformatörler",
        hsCode: "8504",
      },
      {
        nameEn: "Capacitors",
        nameTr: "Kapasitörler",
        hsCode: "8532",
      },
      {
        nameEn: "Resistors",
        nameTr: "Dirençler",
        hsCode: "8533",
      },
    ],
  },
  {
    sectorCode: "STEEL",
    inputs: [
      {
        nameEn: "Iron Ore",
        nameTr: "Demir Cevheri",
        hsCode: "2601",
      },
      {
        nameEn: "Scrap Steel",
        nameTr: "Çelik Hurda",
        hsCode: "7204",
      },
      {
        nameEn: "Limestone",
        nameTr: "Kireçtaşı",
        hsCode: "2521",
      },
      {
        nameEn: "Coke",
        nameTr: "Koks",
        hsCode: "2704",
      },
      {
        nameEn: "Alloys",
        nameTr: "Alaşımlar",
        hsCode: "7207",
      },
    ],
  },
  {
    sectorCode: "PLAST",
    inputs: [
      {
        nameEn: "Polyethylene Resin",
        nameTr: "Polietilen Reçine",
        hsCode: "3901",
      },
      {
        nameEn: "Polypropylene Resin",
        nameTr: "Polipropilen Reçine",
        hsCode: "3902",
      },
      {
        nameEn: "PVC Resin",
        nameTr: "PVC Reçine",
        hsCode: "3904",
      },
      {
        nameEn: "Plasticizers",
        nameTr: "Plastikleştiriciler",
        hsCode: "3812",
      },
      {
        nameEn: "Colorants",
        nameTr: "Renklendiriciler",
        hsCode: "3206",
      },
    ],
  },
  {
    sectorCode: "CHEM",
    inputs: [
      {
        nameEn: "Sulfuric Acid",
        nameTr: "Sülfürik Asit",
        hsCode: "2807",
      },
      {
        nameEn: "Caustic Soda",
        nameTr: "Kostik Soda",
        hsCode: "2815",
      },
      {
        nameEn: "Ammonia",
        nameTr: "Amonyak",
        hsCode: "2811",
      },
      {
        nameEn: "Chlorine",
        nameTr: "Klor",
        hsCode: "2801",
      },
      {
        nameEn: "Hydrogen",
        nameTr: "Hidrojen",
        hsCode: "2802",
      },
    ],
  },
  {
    sectorCode: "JEWEL",
    inputs: [
      {
        nameEn: "Gold Bullion",
        nameTr: "Altın Külçe",
        hsCode: "7108",
      },
      {
        nameEn: "Silver Bullion",
        nameTr: "Gümüş Külçe",
        hsCode: "7106",
      },
      {
        nameEn: "Gemstones",
        nameTr: "Taşlar",
        hsCode: "7102",
      },
      {
        nameEn: "Pearls",
        nameTr: "İnci",
        hsCode: "7101",
      },
      {
        nameEn: "Alloy Materials",
        nameTr: "Alaşım Malzemeleri",
        hsCode: "7104",
      },
    ],
  },
  {
    sectorCode: "FOOD",
    inputs: [
      {
        nameEn: "Hazelnuts",
        nameTr: "Fındık",
        hsCode: "0802",
      },
      {
        nameEn: "Almonds",
        nameTr: "Badem",
        hsCode: "0801",
      },
      {
        nameEn: "Walnuts",
        nameTr: "Ceviz",
        hsCode: "0802",
      },
      {
        nameEn: "Pistachios",
        nameTr: "Antep Fıstığı",
        hsCode: "0802",
      },
      {
        nameEn: "Dried Fruits",
        nameTr: "Kuru Meyveler",
        hsCode: "0804",
      },
    ],
  },
  {
    sectorCode: "FURN",
    inputs: [
      {
        nameEn: "Solid Wood",
        nameTr: "Masif Ağaç",
        hsCode: "4407",
      },
      {
        nameEn: "Plywood",
        nameTr: "Kontraplak",
        hsCode: "4412",
      },
      {
        nameEn: "Upholstery Fabric",
        nameTr: "Döşeme Kumaşı",
        hsCode: "5407",
      },
      {
        nameEn: "Foam",
        nameTr: "Köpük",
        hsCode: "3906",
      },
      {
        nameEn: "Hardware",
        nameTr: "Aksesuar",
        hsCode: "7326",
      },
    ],
  },
  {
    sectorCode: "PHARM",
    inputs: [
      {
        nameEn: "Active Pharmaceutical Ingredients",
        nameTr: "Aktif İlaç Maddesi",
        hsCode: "2941",
      },
      {
        nameEn: "Excipients",
        nameTr: "Yardımcı Maddeler",
        hsCode: "3002",
      },
      {
        nameEn: "Capsules",
        nameTr: "Kapsüller",
        hsCode: "3004",
      },
      {
        nameEn: "Tablets",
        nameTr: "Tabletler",
        hsCode: "3004",
      },
      {
        nameEn: "Packaging Materials",
        nameTr: "Ambalaj Malzemeleri",
        hsCode: "4819",
      },
    ],
  },
  {
    sectorCode: "RUBBER",
    inputs: [
      {
        nameEn: "Natural Rubber",
        nameTr: "Doğal Kauçuk",
        hsCode: "4001",
      },
      {
        nameEn: "Synthetic Rubber",
        nameTr: "Sentetik Kauçuk",
        hsCode: "4002",
      },
      {
        nameEn: "Carbon Black",
        nameTr: "Karbon Siyahı",
        hsCode: "2803",
      },
      {
        nameEn: "Vulcanizing Agents",
        nameTr: "Vulkanizasyon Ajanları",
        hsCode: "2852",
      },
      {
        nameEn: "Oils",
        nameTr: "Yağlar",
        hsCode: "2710",
      },
    ],
  },
  {
    sectorCode: "GLASS",
    inputs: [
      {
        nameEn: "Silica Sand",
        nameTr: "Silika Kumu",
        hsCode: "2505",
      },
      {
        nameEn: "Soda Ash",
        nameTr: "Soda Külü",
        hsCode: "2836",
      },
      {
        nameEn: "Limestone",
        nameTr: "Kireçtaşı",
        hsCode: "2521",
      },
      {
        nameEn: "Feldspar",
        nameTr: "Feldspat",
        hsCode: "2530",
      },
      {
        nameEn: "Pigments",
        nameTr: "Pigmentler",
        hsCode: "3206",
      },
    ],
  },
  {
    sectorCode: "ALUM",
    inputs: [
      {
        nameEn: "Bauxite",
        nameTr: "Boksit",
        hsCode: "2606",
      },
      {
        nameEn: "Aluminum Scrap",
        nameTr: "Alüminyum Hurda",
        hsCode: "7602",
      },
      {
        nameEn: "Caustic Soda",
        nameTr: "Kostik Soda",
        hsCode: "2815",
      },
      {
        nameEn: "Cryolite",
        nameTr: "Kriyolit",
        hsCode: "2530",
      },
      {
        nameEn: "Aluminum Fluoride",
        nameTr: "Alüminyum Florür",
        hsCode: "2818",
      },
    ],
  },
  {
    sectorCode: "SHOES",
    inputs: [
      {
        nameEn: "Leather",
        nameTr: "Deri",
        hsCode: "4104",
      },
      {
        nameEn: "Synthetic Leather",
        nameTr: "Sentetik Deri",
        hsCode: "5903",
      },
      {
        nameEn: "Rubber Soles",
        nameTr: "Kauçuk Tabanlar",
        hsCode: "4015",
      },
      {
        nameEn: "Textiles",
        nameTr: "Tekstiller",
        hsCode: "5407",
      },
      {
        nameEn: "Adhesives",
        nameTr: "Yapıştırıcılar",
        hsCode: "3506",
      },
    ],
  },
  {
    sectorCode: "AGMACH",
    inputs: [
      {
        nameEn: "Cast Iron",
        nameTr: "Dökme Demir",
        hsCode: "7325",
      },
      {
        nameEn: "Steel Plates",
        nameTr: "Çelik Levhalar",
        hsCode: "7208",
      },
      {
        nameEn: "Engines",
        nameTr: "Motorlar",
        hsCode: "8408",
      },
      {
        nameEn: "Hydraulic Systems",
        nameTr: "Hidrolik Sistemler",
        hsCode: "8481",
      },
      {
        nameEn: "Tires",
        nameTr: "Lastikler",
        hsCode: "4011",
      },
    ],
  },
  {
    sectorCode: "AERO",
    inputs: [
      {
        nameEn: "Aluminum Alloys",
        nameTr: "Alüminyum Alaşımları",
        hsCode: "7616",
      },
      {
        nameEn: "Titanium Alloys",
        nameTr: "Titanyum Alaşımları",
        hsCode: "8108",
      },
      {
        nameEn: "Composite Materials",
        nameTr: "Kompozit Malzemeler",
        hsCode: "3916",
      },
      {
        nameEn: "Fasteners",
        nameTr: "Bağlantı Elemanları",
        hsCode: "7318",
      },
      {
        nameEn: "Electronics",
        nameTr: "Elektronikler",
        hsCode: "8542",
      },
    ],
  },
  {
    sectorCode: "TOYS",
    inputs: [
      {
        nameEn: "Plastic Resin",
        nameTr: "Plastik Reçine",
        hsCode: "3902",
      },
      {
        nameEn: "Rubber",
        nameTr: "Kauçuk",
        hsCode: "4001",
      },
      {
        nameEn: "Paint",
        nameTr: "Boya",
        hsCode: "3208",
      },
      {
        nameEn: "Textiles",
        nameTr: "Tekstiller",
        hsCode: "5407",
      },
      {
        nameEn: "Batteries",
        nameTr: "Piller",
        hsCode: "8506",
      },
    ],
  },
  {
    sectorCode: "COSMET",
    inputs: [
      {
        nameEn: "Surfactants",
        nameTr: "Yüzey Aktif Maddeler",
        hsCode: "3402",
      },
      {
        nameEn: "Fragrances",
        nameTr: "Kokular",
        hsCode: "3302",
      },
      {
        nameEn: "Essential Oils",
        nameTr: "Uçucu Yağlar",
        hsCode: "3301",
      },
      {
        nameEn: "Preservatives",
        nameTr: "Koruyucular",
        hsCode: "3812",
      },
      {
        nameEn: "Packaging",
        nameTr: "Ambalaj",
        hsCode: "3923",
      },
    ],
  },
  {
    sectorCode: "PROCESSED",
    inputs: [
      {
        nameEn: "Fresh Vegetables",
        nameTr: "Taze Sebzeler",
        hsCode: "0701",
      },
      {
        nameEn: "Fresh Fruits",
        nameTr: "Taze Meyveler",
        hsCode: "0804",
      },
      {
        nameEn: "Preservatives",
        nameTr: "Koruyucular",
        hsCode: "3812",
      },
      {
        nameEn: "Packaging Materials",
        nameTr: "Ambalaj Malzemeleri",
        hsCode: "4819",
      },
      {
        nameEn: "Spices",
        nameTr: "Baharatlar",
        hsCode: "0904",
      },
    ],
  },
];

const emissionFactorsData = [
  // Automotive
  {
    hsCode: "8708",
    sectorCode: "AUTO",
    scope1: 2.5,
    scope2: 1.8,
    scope3: 4.2,
    unit: "kg",
    source: "CBAM",
  },
  // Textiles
  {
    hsCode: "6101",
    sectorCode: "TEXT",
    scope1: 1.2,
    scope2: 0.8,
    scope3: 2.1,
    unit: "kg",
    source: "CBAM",
  },
  // Steel
  {
    hsCode: "7201",
    sectorCode: "STEEL",
    scope1: 3.8,
    scope2: 2.5,
    scope3: 5.2,
    unit: "kg",
    source: "CBAM",
  },
  // Plastics
  {
    hsCode: "3901",
    sectorCode: "PLAST",
    scope1: 2.1,
    scope2: 1.4,
    scope3: 3.5,
    unit: "kg",
    source: "CBAM",
  },
  // Food
  {
    hsCode: "0802",
    sectorCode: "FOOD",
    scope1: 0.8,
    scope2: 0.5,
    scope3: 1.3,
    unit: "kg",
    source: "CBAM",
  },
  // Electrical
  {
    hsCode: "8501",
    sectorCode: "ELEC",
    scope1: 1.9,
    scope2: 1.3,
    scope3: 3.2,
    unit: "kg",
    source: "CBAM",
  },
  // Machinery
  {
    hsCode: "8401",
    sectorCode: "MACH",
    scope1: 2.7,
    scope2: 1.9,
    scope3: 4.1,
    unit: "kg",
    source: "CBAM",
  },
  // Chemicals
  {
    hsCode: "2801",
    sectorCode: "CHEM",
    scope1: 3.2,
    scope2: 2.1,
    scope3: 4.8,
    unit: "kg",
    source: "CBAM",
  },
  // Aluminum
  {
    hsCode: "7601",
    sectorCode: "ALUM",
    scope1: 3.5,
    scope2: 2.8,
    scope3: 5.1,
    unit: "kg",
    source: "CBAM",
  },
  // Rubber
  {
    hsCode: "4001",
    sectorCode: "RUBBER",
    scope1: 1.6,
    scope2: 1.1,
    scope3: 2.7,
    unit: "kg",
    source: "CBAM",
  },
];

export async function seedDatabase() {
  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    return;
  }

  try {
    console.log("🌱 Starting database seeding...");

    // Seed sectors
    console.log("📍 Seeding sectors...");
    for (const sector of sectorsData) {
      await db.insert(sectors).values({
        code: sector.code,
        nameEn: sector.nameEn,
        nameTr: sector.nameTr,
        category: sector.category,
        hsCodes: sector.hsCodes,
        description: sector.description,
      });
    }
    console.log(`✓ Seeded ${sectorsData.length} sectors`);

    // Get sector IDs
    const sectorMap = new Map<string, number>();
    const allSectors = await db.select().from(sectors);
    for (const sector of allSectors) {
      sectorMap.set(sector.code, sector.id);
    }

    // Seed sector inputs
    console.log("📍 Seeding sector inputs...");
    let inputCount = 0;
    for (const sectorData of sectorInputsData) {
      const sectorId = sectorMap.get(sectorData.sectorCode);
      if (!sectorId) continue;

      for (const input of sectorData.inputs) {
        await db.insert(sectorInputs).values({
          sectorId,
          nameEn: input.nameEn,
          nameTr: input.nameTr,
          hsCode: input.hsCode,
        });
        inputCount++;
      }
    }
    console.log(`✓ Seeded ${inputCount} sector inputs`);

    // Seed emission factors
    console.log("📍 Seeding emission factors...");
    for (const factor of emissionFactorsData) {
      const sectorId = sectorMap.get(factor.sectorCode);
      if (!sectorId) continue;

      await db.insert(emissionFactors).values({
        hsCode: factor.hsCode,
        sectorId,
        scope1Factor: factor.scope1,
        scope2Factor: factor.scope2,
        scope3Factor: factor.scope3,
        unit: factor.unit,
        source: factor.source,
      });
    }
    console.log(`✓ Seeded ${emissionFactorsData.length} emission factors`);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(console.error);
}
