-- nocarbontr — Supabase Migration
-- Supabase Dashboard → SQL Editor → Bu dosyayı yapıştır ve RUN et

-- Enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE upload_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE supplier_tier AS ENUM ('1', '2', '3');
CREATE TYPE score_rating AS ENUM ('red', 'yellow', 'green');
CREATE TYPE report_format AS ENUM ('pdf', 'xml', 'json');
CREATE TYPE report_status AS ENUM ('pending', 'completed', 'failed');

-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "passwordHash" VARCHAR(255),
  "loginMethod" VARCHAR(64),
  role user_role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Sectors
CREATE TABLE IF NOT EXISTS sectors (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) NOT NULL UNIQUE,
  "nameEn" VARCHAR(255) NOT NULL,
  "nameTr" VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  "hsCodes" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Emission Factors
CREATE TABLE IF NOT EXISTS "emissionFactors" (
  id SERIAL PRIMARY KEY,
  "hsCode" VARCHAR(10) NOT NULL,
  "sectorId" INTEGER NOT NULL,
  "scope1Factor" NUMERIC(10,6) NOT NULL,
  "scope2Factor" NUMERIC(10,6) NOT NULL,
  "scope3Factor" NUMERIC(10,6) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  source VARCHAR(100),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "emissionFactors_sectorId_idx" ON "emissionFactors"("sectorId");
CREATE INDEX IF NOT EXISTS "emissionFactors_hsCode_idx" ON "emissionFactors"("hsCode");

-- Sector Inputs
CREATE TABLE IF NOT EXISTS "sectorInputs" (
  id SERIAL PRIMARY KEY,
  "sectorId" INTEGER NOT NULL,
  "nameEn" VARCHAR(255) NOT NULL,
  "nameTr" VARCHAR(255) NOT NULL,
  "hsCode" VARCHAR(10) NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "sectorInputs_sectorId_idx" ON "sectorInputs"("sectorId");

-- Uploads
CREATE TABLE IF NOT EXISTS uploads (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "fileKey" VARCHAR(255) NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  status upload_status NOT NULL DEFAULT 'pending',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "uploads_userId_idx" ON uploads("userId");

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320),
  "sectorId" INTEGER NOT NULL,
  tier supplier_tier NOT NULL,
  "hsCode" VARCHAR(10) NOT NULL,
  quantity VARCHAR(20) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  "co2eEmission" VARCHAR(20),
  "invitationToken" VARCHAR(255),
  "invitationSentAt" TIMESTAMP,
  "invitationAcceptedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "suppliers_userId_idx" ON suppliers("userId");
CREATE INDEX IF NOT EXISTS "suppliers_sectorId_idx" ON suppliers("sectorId");

-- Scores
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "uploadId" INTEGER,
  "supplierId" INTEGER,
  "sectorId" INTEGER NOT NULL,
  "emissionScore" VARCHAR(10) NOT NULL,
  "responsibilityScore" VARCHAR(10) NOT NULL,
  "supplyChainScore" VARCHAR(10) NOT NULL,
  "compositeScore" VARCHAR(10) NOT NULL,
  "scoreRating" score_rating NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "scores_userId_idx" ON scores("userId");
CREATE INDEX IF NOT EXISTS "scores_uploadId_idx" ON scores("uploadId");
CREATE INDEX IF NOT EXISTS "scores_supplierId_idx" ON scores("supplierId");

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "uploadId" INTEGER,
  title VARCHAR(255) NOT NULL,
  format report_format NOT NULL,
  "fileKey" VARCHAR(255) NOT NULL,
  "fileUrl" VARCHAR(500),
  status report_status NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "reports_userId_idx" ON reports("userId");
CREATE INDEX IF NOT EXISTS "reports_uploadId_idx" ON reports("uploadId");

-- Validation Logs
CREATE TABLE IF NOT EXISTS "validationLogs" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "uploadId" INTEGER,
  "rowIndex" INTEGER,
  "errorType" VARCHAR(100) NOT NULL,
  "errorMessage" TEXT NOT NULL,
  "suggestedFix" TEXT,
  "isResolved" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "validationLogs_userId_idx" ON "validationLogs"("userId");
CREATE INDEX IF NOT EXISTS "validationLogs_uploadId_idx" ON "validationLogs"("uploadId");

-- Seed: 20 Türk ihracat sektörü
INSERT INTO sectors (code, "nameEn", "nameTr", category, "hsCodes") VALUES
  ('AUTO',   'Automotive & Spare Parts',          'Otomotiv ve Yedek Parçalar',          'Manufacturing', '["8708","8704","8705","8706","8707"]'),
  ('MACH',   'Machinery & Mechanical Equipment',  'Makine ve Mekanik Cihazlar',           'Manufacturing', '["8401","8402","8403","8404","8405"]'),
  ('TEXT',   'Textiles & Apparel',                'Tekstil ve Hazır Giyim',               'Manufacturing', '["6101","6102","6103","6104","6201"]'),
  ('FUEL',   'Mineral Fuels & Products',          'Mineral Yakıt ve Ürünleri',            'Energy',        '["2701","2702","2703","2710","2711"]'),
  ('ELEC',   'Electrical & Electronics',          'Elektrikli Eşya ve Elektronik',        'Manufacturing', '["8501","8502","8503","8504","8517"]'),
  ('STEEL',  'Iron & Steel Products',             'Demir-Çelik ve Metal Ürünleri',        'Manufacturing', '["7201","7202","7203","7204","7208"]'),
  ('PLAST',  'Plastics & Plastic Products',       'Plastik ve Plastik Mamuller',          'Manufacturing', '["3901","3902","3903","3904","3920"]'),
  ('CHEM',   'Chemical Substances',               'Kimyasal Maddeler',                    'Manufacturing', '["2801","2802","2803","2804","2901"]'),
  ('JEWEL',  'Precious Metals & Jewelry',         'Mücevherat ve Kıymetli Metaller',      'Manufacturing', '["7101","7102","7103","7104","7113"]'),
  ('FOOD',   'Food Products',                     'Gıda Ürünleri',                        'Food',          '["0801","0802","0806","1001","1701"]'),
  ('FURN',   'Furniture & Home Textiles',         'Mobilya ve Ev Tekstili',               'Manufacturing', '["9401","9402","9403","9404","9405"]'),
  ('PHARMA', 'Pharmaceuticals',                   'İlaç ve Eczacılık Ürünleri',           'Healthcare',    '["3001","3002","3003","3004","3005"]'),
  ('RUBB',   'Rubber & Rubber Products',          'Lastik ve Kauçuk Ürünleri',            'Manufacturing', '["4001","4002","4011","4012","4013"]'),
  ('GLASS',  'Glass & Ceramics',                  'Cam ve Seramik',                       'Manufacturing', '["6901","6902","6903","7003","7004"]'),
  ('ALUM',   'Aluminium & Non-Ferrous Metals',    'Alüminyum ve Demir Dışı Metaller',     'Manufacturing', '["7601","7602","7604","7606","7607"]'),
  ('SHOE',   'Footwear & Leather Products',       'Ayakkabı ve Deri Ürünleri',            'Manufacturing', '["6401","6402","6403","6404","4101"]'),
  ('AGRI',   'Agricultural Machinery & Tractors', 'Tarım Makineleri ve Traktör',          'Agriculture',   '["8701","8432","8433","8434","8435"]'),
  ('DEF',    'Defense & Aviation Parts',          'Savunma ve Havacılık Parçaları',       'Defense',       '["8802","8803","8805","8906","8710"]'),
  ('TOY',    'Toys & Sports Equipment',           'Oyuncak ve Spor Malzemeleri',          'Consumer',      '["9501","9502","9503","9506","9507"]'),
  ('COSM',   'Cleaning & Cosmetic Products',      'Temizlik ve Kozmetik Ürünleri',        'Manufacturing', '["3301","3302","3303","3304","3401"]')
ON CONFLICT (code) DO NOTHING;

-- Seed: Emisyon faktörleri (CBAM baseline değerleri, kg CO2e/ton)
INSERT INTO "emissionFactors" ("hsCode", "sectorId", "scope1Factor", "scope2Factor", "scope3Factor", unit, source) VALUES
  ('8708', 1, 2.100000, 0.800000, 1.200000, 'ton', 'CBAM'),
  ('7208', 6, 1.850000, 0.650000, 0.900000, 'ton', 'CBAM'),
  ('6101', 3, 5.200000, 1.800000, 2.100000, 'ton', 'CBAM'),
  ('3901', 7, 3.400000, 1.200000, 1.500000, 'ton', 'CBAM'),
  ('7601', 15,8.100000, 2.400000, 1.800000, 'ton', 'CBAM'),
  ('2710', 4, 0.425000, 0.150000, 0.320000, 'ton', 'CBAM'),
  ('8501', 5, 1.950000, 0.720000, 1.100000, 'ton', 'CBAM'),
  ('0801', 10,0.850000, 0.280000, 0.420000, 'ton', 'CBAM'),
  ('3004', 12,12.50000, 4.200000, 6.800000, 'ton', 'CBAM'),
  ('4011', 13,4.600000, 1.500000, 2.200000, 'ton', 'CBAM')
ON CONFLICT DO NOTHING;

SELECT 'nocarbontr schema created successfully!' as result;
