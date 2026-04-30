import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { CBAM_SECTORS } from "@shared/cbamSectors";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ── Sub-components ─────────────────────────────────────────────────────────

function SectorCard({ sector, selected, onClick }: {
  sector: typeof CBAM_SECTORS[0];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-emerald-500 bg-emerald-950/40'
          : 'border-slate-700 bg-slate-800/40 hover:border-slate-500'
      }`}
    >
      <div className="text-2xl mb-2">{sector.icon}</div>
      <div className="font-semibold text-white text-sm">{sector.nameTr}</div>
      <div className="text-xs text-slate-400 mt-1">{sector.nameEn}</div>
      <div className="text-xs text-emerald-400 mt-2">
        ~{sector.defaultEmissionFactor} tCO₂e/ton
      </div>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">✓</span>
        </div>
      )}
    </button>
  );
}

function MetricInput({ field, value, onChange }: {
  field: typeof CBAM_SECTORS[0]['metrics'][0];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {field.labelTr}
        {field.required && <span className="text-red-400 ml-1">*</span>}
        {field.tooltip && (
          <span className="ml-2 text-xs text-slate-500" title={field.tooltip}>ⓘ</span>
        )}
      </label>
      {field.type === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">Seçiniz...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : (
        <div className="relative">
          <input
            type="number"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 pr-16 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          {field.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              {field.unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CbamOperations() {
  const { user } = useAuth();
  const isSupplier = user?.role === 'supplier';

  const [step, setStep] = useState<'sector' | 'data' | 'review' | 'done'>('sector');
  const [selectedSector, setSelectedSector] = useState<string>('');
  const [reportingYear, setReportingYear] = useState(2024);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ totalCO2e: number; intensity: number; scoreId: number } | null>(null);

  const submitMutation = trpc.cbam.submitData.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
    },
  });

  const sector = CBAM_SECTORS.find(s => s.code === selectedSector);

  const handleSubmit = () => {
    if (!selectedSector) return;
    const numericData: Record<string, number | string> = {};
    Object.entries(formData).forEach(([k, v]) => {
      numericData[k] = isNaN(Number(v)) ? v : Number(v);
    });
    submitMutation.mutate({
      sectorCode: selectedSector as any,
      reportingYear,
      cbamData: numericData,
    });
  };

  const isFormValid = () => {
    if (!sector) return false;
    return sector.metrics.filter(m => m.required).every(m => formData[m.key]?.trim());
  };

  // Supplier: submit data view
  if (isSupplier) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">CBAM Emisyon Bildirimi</h1>
          <p className="text-slate-400 mb-8">Sektörünüze ait emisyon verilerini girin ve gönderin.</p>

          {/* Steps */}
          <div className="flex items-center gap-2 mb-8">
            {['Sektör Seç', 'Veri Gir', 'Gözden Geçir', 'Gönderildi'].map((s, i) => {
              const stepKeys = ['sector','data','review','done'] as const;
              const active = stepKeys[i] === step;
              const done = stepKeys.indexOf(step) > i;
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'bg-emerald-600' : active ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${active ? 'text-white' : 'text-slate-500'}`}>{s}</span>
                  {i < 3 && <div className="w-8 h-px bg-slate-700" />}
                </div>
              );
            })}
          </div>

          {step === 'sector' && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Sektörünüzü Seçin</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {CBAM_SECTORS.map(s => (
                  <SectorCard key={s.code} sector={s} selected={selectedSector === s.code}
                    onClick={() => setSelectedSector(s.code)} />
                ))}
              </div>
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm text-slate-300">Raporlama Yılı:</label>
                <select
                  value={reportingYear}
                  onChange={e => setReportingYear(Number(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                >
                  {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button
                disabled={!selectedSector}
                onClick={() => setStep('data')}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
              >
                Devam Et →
              </button>
            </div>
          )}

          {step === 'data' && sector && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{sector.icon}</span>
                <div>
                  <h2 className="text-lg font-semibold">{sector.nameTr} — Emisyon Verileri</h2>
                  <p className="text-sm text-slate-400">{reportingYear} yılı verileri</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {sector.metrics.map(field => (
                  <MetricInput
                    key={field.key}
                    field={field}
                    value={formData[field.key] ?? ''}
                    onChange={v => setFormData(prev => ({ ...prev, [field.key]: v }))}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('sector')} className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800">
                  ← Geri
                </button>
                <button
                  disabled={!isFormValid()}
                  onClick={() => setStep('review')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium"
                >
                  Gözden Geçir →
                </button>
              </div>
            </div>
          )}

          {step === 'review' && sector && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Veri Özeti</h2>
              <div className="bg-slate-800 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sektör</span>
                  <span className="font-medium">{sector.nameTr}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Raporlama Yılı</span>
                  <span className="font-medium">{reportingYear}</span>
                </div>
                <div className="border-t border-slate-700 pt-2 mt-2 space-y-1">
                  {sector.metrics.map(f => formData[f.key] && (
                    <div key={f.key} className="flex justify-between text-sm">
                      <span className="text-slate-400">{f.labelTr}</span>
                      <span>{formData[f.key]} {f.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('data')} className="px-4 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800">
                  ← Düzenle
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-lg font-medium"
                >
                  {submitMutation.isPending ? 'Gönderiliyor...' : '✓ Raporu Gönder'}
                </button>
              </div>
              {submitMutation.error && (
                <p className="text-red-400 text-sm mt-3">{submitMutation.error.message}</p>
              )}
            </div>
          )}

          {step === 'done' && result && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
              <h2 className="text-xl font-bold mb-2">Başarıyla Gönderildi!</h2>
              <p className="text-slate-400 mb-6">Verileriniz inceleme kuyruğuna alındı.</p>
              <div className="bg-slate-800 rounded-xl p-4 inline-block text-left">
                <div className="text-sm text-slate-400 mb-1">Toplam CO₂e Emisyon</div>
                <div className="text-2xl font-bold text-emerald-400">{result.totalCO2e.toFixed(2)} tCO₂e</div>
                <div className="text-sm text-slate-400 mt-2 mb-1">Emisyon Yoğunluğu</div>
                <div className="text-lg font-semibold">{result.intensity.toFixed(4)} tCO₂e/ton</div>
              </div>
              <div className="mt-6">
                <button onClick={() => { setStep('sector'); setFormData({}); setResult(null); }}
                  className="px-6 py-2 border border-slate-600 rounded-lg hover:bg-slate-800">
                  Yeni Bildirim
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Importer: overview
  return <ImporterDashboard />;
}

// ── Importer View ──────────────────────────────────────────────────────────

function ImporterDashboard() {
  const reviewQueue = trpc.cbam.getReviewQueue.useQuery();
  const annualReports = trpc.cbam.getAnnualReports.useQuery();
  const reviewMutation = trpc.cbam.reviewSubmission.useMutation({ onSuccess: () => reviewQueue.refetch() });
  const addToReportMutation = trpc.cbam.addToAnnualReport.useMutation({ onSuccess: () => annualReports.refetch() });

  const pending = reviewQueue.data ?? [];
  const reports = (annualReports.data ?? []) as Array<{ id: number; year: number; title: string; totalCO2e: number; status: string }>;

  const chartData = pending.map(p => ({
    name: p.supplierName.split(' ')[0],
    co2e: Number(p.totalCO2e.toFixed(2)),
  }));

  const RATING_COLOR: Record<string, string> = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">CBAM Operasyon Merkezi</h1>
        <p className="text-slate-400 mb-8">Tedarikçi emisyon verilerini yönetin ve yıllık rapora entegre edin.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Bekleyen İnceleme', value: pending.length, color: 'text-yellow-400' },
            { label: 'Toplam CO₂e', value: `${pending.reduce((s, p) => s + Number(p.totalCO2e), 0).toFixed(0)} t`, color: 'text-red-400' },
            { label: 'Yıllık Rapor', value: reports.length, color: 'text-emerald-400' },
            { label: 'CBAM Sektörü', value: 6, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="bg-slate-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-sm text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Review Queue */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              İnceleme Kuyruğu
              {pending.length > 0 && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
              )}
            </h2>
            {pending.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-500">
                Bekleyen veri yok
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map(item => (
                  <div key={item.scoreId} className="bg-slate-800 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-medium">{item.supplierName}</div>
                        <div className="text-sm text-slate-400">{item.supplierEmail}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                            {CBAM_SECTORS.find(s => s.code === item.sectorCode)?.nameTr ?? item.sectorCode}
                          </span>
                          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">{item.reportingYear}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold" style={{ color: RATING_COLOR[item.scoreRating] }}>
                          {Number(item.totalCO2e).toFixed(2)} tCO₂e
                        </div>
                        <div className="text-xs text-slate-400">
                          {Number(item.intensity).toFixed(4)} tCO₂e/ton
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => reviewMutation.mutate({ scoreId: item.scoreId, action: 'approved' })}
                        disabled={reviewMutation.isPending}
                        className="flex-1 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✓ Onayla
                      </button>
                      <button
                        onClick={() => reviewMutation.mutate({ scoreId: item.scoreId, action: 'rejected' })}
                        disabled={reviewMutation.isPending}
                        className="flex-1 py-1.5 bg-red-900 hover:bg-red-800 rounded-lg text-sm font-medium transition-colors"
                      >
                        ✗ Reddet
                      </button>
                      <button
                        onClick={() => addToReportMutation.mutate({ scoreId: item.scoreId, year: item.reportingYear })}
                        disabled={addToReportMutation.isPending}
                        className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 rounded-lg text-sm transition-colors"
                        title="Yıllık Rapora Ekle"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart + Annual Reports */}
          <div className="space-y-6">
            {chartData.length > 0 && (
              <div className="bg-slate-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold mb-3 text-slate-300">Tedarikçi CO₂e Dağılımı</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8 }} />
                    <Bar dataKey="co2e" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i % 2 === 0 ? '#10b981' : '#0891b2'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-slate-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold mb-3 text-slate-300">Yıllık CBAM Raporları</h3>
              {reports.length === 0 ? (
                <p className="text-sm text-slate-500">Henüz rapor yok</p>
              ) : (
                <div className="space-y-2">
                  {reports.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm p-2 bg-slate-700/50 rounded-lg">
                      <span>{r.year} Raporu</span>
                      <span className="text-emerald-400 font-medium">{Number(r.totalCO2e).toFixed(0)} tCO₂e</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
