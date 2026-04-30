export type CbamSectorCode = 'steel' | 'aluminium' | 'cement' | 'fertilizer' | 'electricity' | 'hydrogen';

export type CbamMetricField = {
  key: string;
  labelTr: string;
  labelEn: string;
  unit: string;
  type: 'number' | 'select';
  options?: string[];
  required: boolean;
  tooltip?: string;
};

export type CbamSector = {
  code: CbamSectorCode;
  nameTr: string;
  nameEn: string;
  icon: string;
  cnCodes: string[];
  defaultEmissionFactor: number; // tCO2e/ton
  metrics: CbamMetricField[];
};

export const CBAM_SECTORS: CbamSector[] = [
  {
    code: 'steel',
    nameTr: 'Demir-Çelik',
    nameEn: 'Iron & Steel',
    icon: '🏭',
    cnCodes: ['7201','7202','7203','7204','7206','7207','7208','7209','7210','7211','7212','7213','7214','7215','7216','7217','7218','7219','7220','7221','7222','7223','7224','7225','7226','7227','7228','7229'],
    defaultEmissionFactor: 1.85,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', labelEn: 'Production Volume (t)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', labelEn: 'Direct Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Scope 1 - Tesis içi yakıt yanması' },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', labelEn: 'Indirect Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Scope 2 - Satın alınan elektrik' },
      { key: 'scrapInput', labelTr: 'Hurda Girdisi (%)', labelEn: 'Scrap Input (%)', unit: '%', type: 'number', required: true, tooltip: 'Toplam üretimde kullanılan hurda oranı' },
      { key: 'precursorEmissions', labelTr: 'Öncül Emisyonlar (tCO2e/ton)', labelEn: 'Precursor Emissions (tCO2e/t)', unit: 'tCO2e/t', type: 'number', required: false },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', labelEn: 'Production Route', unit: '', type: 'select', options: ['BF-BOF (Yüksek Fırın)', 'EAF (Elektrik Ark Ocağı)', 'DRI-EAF', 'Diğer'], required: true },
    ],
  },
  {
    code: 'aluminium',
    nameTr: 'Alüminyum',
    nameEn: 'Aluminium',
    icon: '⚡',
    cnCodes: ['7601','7602','7603','7604','7605','7606','7607','7608','7609'],
    defaultEmissionFactor: 8.1,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', labelEn: 'Production Volume (t)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', labelEn: 'Direct Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', labelEn: 'Indirect Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'pfcEmissions', labelTr: 'PFC Emisyonları (tCO2e)', labelEn: 'PFC Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Perflorokarbon - anot etkisi sırasında oluşur' },
      { key: 'electricityConsumption', labelTr: 'Elektrik Tüketimi (MWh)', labelEn: 'Electricity Consumption (MWh)', unit: 'MWh', type: 'number', required: true },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', labelEn: 'Production Route', unit: '', type: 'select', options: ['Primer (Elektroliz)', 'Sekonder (Geri Dönüşüm)', 'Karma'], required: true },
    ],
  },
  {
    code: 'cement',
    nameTr: 'Çimento',
    nameEn: 'Cement',
    icon: '🏗️',
    cnCodes: ['2523','6810','6811'],
    defaultEmissionFactor: 0.83,
    metrics: [
      { key: 'productionVolume', labelTr: 'Klinker Üretimi (ton)', labelEn: 'Clinker Production (t)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Proses Emisyonları (tCO2e)', labelEn: 'Process Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Kalsinasyon + yakıt yanması' },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', labelEn: 'Indirect Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'clinkerRatio', labelTr: 'Klinker/Çimento Oranı', labelEn: 'Clinker-to-Cement Ratio', unit: '', type: 'number', required: true },
      { key: 'alternativeFuelShare', labelTr: 'Alternatif Yakıt Oranı (%)', labelEn: 'Alternative Fuel Share (%)', unit: '%', type: 'number', required: false },
    ],
  },
  {
    code: 'fertilizer',
    nameTr: 'Gübre',
    nameEn: 'Fertilizers',
    icon: '🌱',
    cnCodes: ['3102','3103','3104','3105','2814','2834'],
    defaultEmissionFactor: 3.2,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', labelEn: 'Production Volume (t)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', labelEn: 'Direct Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', labelEn: 'Indirect Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'ammoniaConsumption', labelTr: 'Amonyak Tüketimi (ton)', labelEn: 'Ammonia Consumption (t)', unit: 'ton', type: 'number', required: true, tooltip: 'N2O emisyonlarının temel kaynağı' },
      { key: 'nitricAcidConsumption', labelTr: 'Nitrik Asit Tüketimi (ton)', labelEn: 'Nitric Acid Consumption (t)', unit: 'ton', type: 'number', required: false },
      { key: 'n2oEmissions', labelTr: 'N2O Emisyonları (tCO2e)', labelEn: 'N2O Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'GWP100 = 273 CO2e' },
      { key: 'fertilizerType', labelTr: 'Gübre Tipi', labelEn: 'Fertilizer Type', unit: '', type: 'select', options: ['Üre', 'Amonyum Nitrat', 'CAN', 'NPK', 'Diğer'], required: true },
    ],
  },
  {
    code: 'electricity',
    nameTr: 'Elektrik',
    nameEn: 'Electricity',
    icon: '⚡',
    cnCodes: ['2716'],
    defaultEmissionFactor: 0.42,
    metrics: [
      { key: 'productionVolume', labelTr: 'Elektrik Üretimi (MWh)', labelEn: 'Electricity Production (MWh)', unit: 'MWh', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', labelEn: 'Direct Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'fuelType', labelTr: 'Yakıt Tipi', labelEn: 'Fuel Type', unit: '', type: 'select', options: ['Doğalgaz', 'Kömür', 'Fuel Oil', 'Yenilenebilir', 'Nükleer', 'Karma'], required: true },
      { key: 'gridEmissionFactor', labelTr: 'Şebeke Emisyon Faktörü (tCO2e/MWh)', labelEn: 'Grid Emission Factor', unit: 'tCO2e/MWh', type: 'number', required: true },
    ],
  },
  {
    code: 'hydrogen',
    nameTr: 'Hidrojen',
    nameEn: 'Hydrogen',
    icon: '💧',
    cnCodes: ['2804'],
    defaultEmissionFactor: 9.0,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', labelEn: 'Production Volume (t)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', labelEn: 'Direct Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', labelEn: 'Indirect Emissions (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', labelEn: 'Production Route', unit: '', type: 'select', options: ['SMR (Gri)', 'SMR + CCS (Mavi)', 'Elektroliz-Yenilenebilir (Yeşil)', 'Elektroliz-Şebeke', 'Diğer'], required: true },
      { key: 'electricityConsumption', labelTr: 'Elektrik Tüketimi (MWh/ton)', labelEn: 'Electricity Consumption (MWh/t)', unit: 'MWh/t', type: 'number', required: false },
    ],
  },
];

export function getCbamSector(code: CbamSectorCode): CbamSector | undefined {
  return CBAM_SECTORS.find(s => s.code === code);
}

export function calculateCbamEmissions(sectorCode: CbamSectorCode, data: Record<string, number | string>): {
  totalCO2e: number;
  intensity: number;
  breakdown: Record<string, number>;
} {
  const sector = getCbamSector(sectorCode);
  if (!sector) throw new Error(`Unknown CBAM sector: ${sectorCode}`);

  const production = Number(data.productionVolume) || 0;
  const direct = Number(data.directEmissions) || 0;
  const indirect = Number(data.indirectEmissions) || 0;
  const extra = sectorCode === 'aluminium' ? Number(data.pfcEmissions) || 0
    : sectorCode === 'fertilizer' ? Number(data.n2oEmissions) || 0
    : 0;

  const totalCO2e = direct + indirect + extra;
  const intensity = production > 0 ? totalCO2e / production : sector.defaultEmissionFactor;

  return {
    totalCO2e,
    intensity,
    breakdown: { direct, indirect, extra },
  };
}
