export type CbamSectorCode = 'steel' | 'aluminium' | 'cement' | 'fertilizer' | 'electricity' | 'hydrogen';

export type CbamMetricField = {
  key: string;
  labelTr: string;
  unit: string;
  type: 'number' | 'select';
  options?: string[];
  required: boolean;
  tooltip?: string;
};

export type CbamSectorDef = {
  code: CbamSectorCode;
  nameTr: string;
  nameEn: string;
  icon: string;
  color: string;
  defaultEmissionFactor: number;
  metrics: CbamMetricField[];
};

export const CBAM_SECTORS: CbamSectorDef[] = [
  {
    code: 'steel', nameTr: 'Demir-Çelik', nameEn: 'Iron & Steel', icon: '🏭',
    color: 'from-slate-600 to-slate-800',
    defaultEmissionFactor: 1.85,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Scope 1 — Tesis içi yakıt yanması' },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Scope 2 — Satın alınan elektrik' },
      { key: 'scrapInput', labelTr: 'Hurda Girdisi (%)', unit: '%', type: 'number', required: true },
      { key: 'precursorEmissions', labelTr: 'Öncül Emisyonlar (tCO2e/ton)', unit: 'tCO2e/t', type: 'number', required: false },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', unit: '', type: 'select', options: ['BF-BOF (Yüksek Fırın)', 'EAF (Elektrik Ark Ocağı)', 'DRI-EAF', 'Diğer'], required: true },
    ],
  },
  {
    code: 'aluminium', nameTr: 'Alüminyum', nameEn: 'Aluminium', icon: '⚗️',
    color: 'from-blue-600 to-blue-800',
    defaultEmissionFactor: 8.1,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'pfcEmissions', labelTr: 'PFC Emisyonları (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Perflorokarbon — anot etkisi' },
      { key: 'electricityConsumption', labelTr: 'Elektrik Tüketimi (MWh)', unit: 'MWh', type: 'number', required: true },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', unit: '', type: 'select', options: ['Primer (Elektroliz)', 'Sekonder (Geri Dönüşüm)', 'Karma'], required: true },
    ],
  },
  {
    code: 'cement', nameTr: 'Çimento', nameEn: 'Cement', icon: '🏗️',
    color: 'from-stone-500 to-stone-700',
    defaultEmissionFactor: 0.83,
    metrics: [
      { key: 'productionVolume', labelTr: 'Klinker Üretimi (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Proses Emisyonları (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'Kalsinasyon + yakıt' },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'clinkerRatio', labelTr: 'Klinker/Çimento Oranı', unit: '', type: 'number', required: true },
      { key: 'alternativeFuelShare', labelTr: 'Alternatif Yakıt Oranı (%)', unit: '%', type: 'number', required: false },
    ],
  },
  {
    code: 'fertilizer', nameTr: 'Gübre', nameEn: 'Fertilizers', icon: '🌱',
    color: 'from-green-600 to-green-800',
    defaultEmissionFactor: 3.2,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'ammoniaConsumption', labelTr: 'Amonyak Tüketimi (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'n2oEmissions', labelTr: 'N2O Emisyonları (tCO2e)', unit: 'tCO2e', type: 'number', required: true, tooltip: 'GWP100 = 273' },
      { key: 'fertilizerType', labelTr: 'Gübre Tipi', unit: '', type: 'select', options: ['Üre', 'Amonyum Nitrat', 'CAN', 'NPK', 'Diğer'], required: true },
    ],
  },
  {
    code: 'electricity', nameTr: 'Elektrik', nameEn: 'Electricity', icon: '⚡',
    color: 'from-yellow-500 to-yellow-700',
    defaultEmissionFactor: 0.42,
    metrics: [
      { key: 'productionVolume', labelTr: 'Elektrik Üretimi (MWh)', unit: 'MWh', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'gridEmissionFactor', labelTr: 'Şebeke Emisyon Faktörü (tCO2e/MWh)', unit: 'tCO2e/MWh', type: 'number', required: true },
      { key: 'fuelType', labelTr: 'Yakıt Tipi', unit: '', type: 'select', options: ['Doğalgaz', 'Kömür', 'Fuel Oil', 'Yenilenebilir', 'Nükleer', 'Karma'], required: true },
    ],
  },
  {
    code: 'hydrogen', nameTr: 'Hidrojen', nameEn: 'Hydrogen', icon: '💧',
    color: 'from-cyan-600 to-cyan-800',
    defaultEmissionFactor: 9.0,
    metrics: [
      { key: 'productionVolume', labelTr: 'Üretim Miktarı (ton)', unit: 'ton', type: 'number', required: true },
      { key: 'directEmissions', labelTr: 'Doğrudan Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'indirectEmissions', labelTr: 'Dolaylı Emisyonlar (tCO2e)', unit: 'tCO2e', type: 'number', required: true },
      { key: 'productionRoute', labelTr: 'Üretim Yöntemi', unit: '', type: 'select', options: ['SMR Gri', 'SMR + CCS Mavi', 'Elektroliz Yeşil', 'Elektroliz Şebeke', 'Diğer'], required: true },
      { key: 'electricityConsumption', labelTr: 'Elektrik Tüketimi (MWh/ton)', unit: 'MWh/t', type: 'number', required: false },
    ],
  },
];
