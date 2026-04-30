import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CBAM_SECTORS } from "@shared/cbamSectors";
import DashboardLayout from "@/components/DashboardLayout";

type OnboardResult = { email: string; tempPassword: string; supplierId: number };

export default function SupplierOnboarding() {
  const [form, setForm] = useState({ name: '', email: '', sectorCode: '', tier: '1' as '1'|'2'|'3' });
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const suppliers = trpc.cbam.getMySuppliers.useQuery();
  const onboardMutation = trpc.cbam.onboardSupplier.useMutation({
    onSuccess: (data) => {
      setResult(data);
      suppliers.refetch();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onboardMutation.mutate({
      name: form.name,
      email: form.email,
      sectorCode: form.sectorCode as any,
      tier: form.tier,
    });
  };

  const copyCredentials = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `nocarbontr Tedarikçi Girişi\nE-posta: ${result.email}\nGeçici Şifre: ${result.tempPassword}\nURL: https://nocarbontr-1.onrender.com/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const STATUS_BADGE: Record<string, string> = {
    invited: 'bg-yellow-900 text-yellow-300',
    active: 'bg-emerald-900 text-emerald-300',
    inactive: 'bg-slate-700 text-slate-400',
  };

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">Tedarikçi Yönetimi</h1>
        <p className="text-slate-400 mb-8">Yeni tedarikçi ekleyin ve CBAM veri toplamayı başlatın.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Onboard Form */}
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-5">Yeni Tedarikçi Ekle</h2>

            {result ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400 mb-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">✓</div>
                  <span className="font-medium">Tedarikçi hesabı oluşturuldu</span>
                </div>
                <div className="bg-slate-700 rounded-xl p-4 font-mono text-sm space-y-1">
                  <div><span className="text-slate-400">E-posta: </span>{result.email}</div>
                  <div><span className="text-slate-400">Şifre: </span>
                    <span className="text-yellow-300 font-bold">{result.tempPassword}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  ⚠️ Bu şifreyi güvenli bir kanaldan tedarikçiye iletin. Tekrar görüntülenemez.
                </p>
                <div className="flex gap-3">
                  <button onClick={copyCredentials}
                    className="flex-1 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors">
                    {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
                  </button>
                  <button onClick={() => { setResult(null); setForm({ name:'', email:'', sectorCode:'', tier:'1' }); }}
                    className="flex-1 py-2 border border-slate-600 rounded-lg text-sm hover:bg-slate-700">
                    Yeni Ekle
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Ad Soyad / Şirket</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Tedarikçi adı"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="tedarikci@firma.com"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">CBAM Sektörü</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CBAM_SECTORS.map(s => (
                      <button
                        key={s.code}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, sectorCode: s.code }))}
                        className={`p-2 rounded-lg border text-left text-xs transition-all ${
                          form.sectorCode === s.code
                            ? 'border-emerald-500 bg-emerald-950/30'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <span className="mr-1">{s.icon}</span>{s.nameTr}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Tedarik Zinciri Kademesi</label>
                  <select
                    value={form.tier}
                    onChange={e => setForm(p => ({ ...p, tier: e.target.value as '1'|'2'|'3' }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="1">Tier 1 — Direkt Tedarikçi</option>
                    <option value="2">Tier 2 — Alt Tedarikçi</option>
                    <option value="3">Tier 3 — Ham Madde</option>
                  </select>
                </div>
                {onboardMutation.error && (
                  <p className="text-red-400 text-sm">{onboardMutation.error.message}</p>
                )}
                <button
                  type="submit"
                  disabled={!form.name || !form.email || !form.sectorCode || onboardMutation.isPending}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg font-medium transition-colors"
                >
                  {onboardMutation.isPending ? 'Oluşturuluyor...' : '+ Tedarikçi Ekle & Hesap Oluştur'}
                </button>
              </form>
            )}
          </div>

          {/* Supplier List */}
          <div>
            <h2 className="text-lg font-semibold mb-5">
              Tedarikçilerim
              <span className="ml-2 text-sm text-slate-400 font-normal">
                ({suppliers.data?.length ?? 0})
              </span>
            </h2>
            {suppliers.isLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : suppliers.data?.length === 0 ? (
              <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-500">
                Henüz tedarikçi yok
              </div>
            ) : (
              <div className="space-y-2">
                {suppliers.data?.map(s => {
                  const sector = CBAM_SECTORS.find(sec => sec.code === s.sectorType);
                  return (
                    <div key={s.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                        <div className="flex gap-2 mt-1">
                          {sector && (
                            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                              {sector.icon} {sector.nameTr}
                            </span>
                          )}
                          <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">T{s.tier}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_BADGE[s.onboardingStatus] ?? 'bg-slate-700'}`}>
                        {s.onboardingStatus === 'active' ? 'Aktif' : s.onboardingStatus === 'invited' ? 'Davet' : s.onboardingStatus}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
