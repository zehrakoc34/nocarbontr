import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CBAM_SECTORS } from "@shared/cbamSectors";
import { NoCarbonLogo } from "@/components/NoCarbonLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Users, Plus, CheckCircle, Clock, FileText, BarChart3, ChevronRight, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Tab = "overview" | "add_supplier" | "suppliers" | "operations";

type OnboardResult = { email: string; tempPassword: string; supplierId: number };

// ── Tedarikçi Ekle Tab ────────────────────────────────────────────────────────
function AddSupplierTab({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", sectorCode: "", tier: "1" as "1" | "2" | "3" });
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const onboardMutation = trpc.cbam.onboardSupplier.useMutation({
    onSuccess: (data) => {
      setResult(data);
      onSuccess();
    },
    onError: (e) => toast.error(e.message),
  });

  const copyCredentials = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `nocarbontr Tedarikçi Girişi\nE-posta: ${result.email}\nGeçici Şifre: ${result.tempPassword}\nURL: https://nocarbontr-1.onrender.com/login`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-8 space-y-5">
        <div className="flex items-center gap-3 text-emerald-600">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Tedarikçi hesabı oluşturuldu</p>
            <p className="text-xs text-muted-foreground">Mail gönderildi (Resend aktifse)</p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-4 font-mono text-sm space-y-2">
          <div><span className="text-muted-foreground text-xs">E-POSTA</span><br />{result.email}</div>
          <div><span className="text-muted-foreground text-xs">GEÇİCİ ŞİFRE</span><br /><span className="text-amber-600 font-bold text-base">{result.tempPassword}</span></div>
        </div>
        <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Bu şifreyi güvenli bir kanaldan tedarikçiye iletin. Tekrar görüntülenemez.
        </p>
        <div className="flex gap-3">
          <Button onClick={copyCredentials} variant="outline" className="flex-1 gap-2">
            {copied ? <><Check className="w-4 h-4 text-emerald-600" /> Kopyalandı</> : <><Copy className="w-4 h-4" /> Kopyala</>}
          </Button>
          <Button onClick={() => { setResult(null); setForm({ name: "", email: "", sectorCode: "", tier: "1" }); }} className="flex-1" style={{ backgroundColor: "#10b981" }}>
            + Yeni Ekle
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-8 space-y-5">
      <h2 className="text-lg font-semibold">Yeni Tedarikçi Ekle</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ad / Şirket Adı *</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          required
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          placeholder="Tedarikçi adı"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">E-posta *</label>
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          required
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          placeholder="tedarikci@firma.com"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">CBAM Sektörü *</label>
        <div className="grid grid-cols-2 gap-2">
          {CBAM_SECTORS.map(s => (
            <button
              key={s.code}
              type="button"
              onClick={() => setForm(p => ({ ...p, sectorCode: s.code }))}
              className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                form.sectorCode === s.code
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-border hover:border-emerald-300 bg-background"
              }`}
            >
              <span className="text-lg">{s.icon}</span>
              <div className="font-medium mt-1">{s.nameTr}</div>
              <div className="text-xs text-muted-foreground">{s.nameEn}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tedarik Zinciri Kademesi</label>
        <select
          value={form.tier}
          onChange={e => setForm(p => ({ ...p, tier: e.target.value as "1" | "2" | "3" }))}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="1">Tier 1 — Direkt Tedarikçi</option>
          <option value="2">Tier 2 — Alt Tedarikçi</option>
          <option value="3">Tier 3 — Ham Madde</option>
        </select>
      </div>
      <Button
        onClick={() => onboardMutation.mutate({ name: form.name, email: form.email, sectorCode: form.sectorCode as any, tier: form.tier })}
        disabled={!form.name || !form.email || !form.sectorCode || onboardMutation.isPending}
        className="w-full"
        style={{ backgroundColor: "#10b981" }}
      >
        {onboardMutation.isPending ? "Oluşturuluyor..." : "+ Tedarikçi Ekle & Hesap Oluştur"}
      </Button>
    </div>
  );
}

// ── Tedarikçiler Tab ──────────────────────────────────────────────────────────
function SuppliersTab() {
  const suppliers = trpc.cbam.getMySuppliers.useQuery();

  const STATUS: Record<string, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
    invited: { label: "Davet Gönderildi", className: "bg-amber-100 text-amber-700" },
    inactive: { label: "Pasif", className: "bg-muted text-muted-foreground" },
  };

  if (suppliers.isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}</div>;
  }

  if (!suppliers.data?.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">Henüz tedarikçi eklenmedi</p>
        <p className="text-sm mt-1">Sol menüden "Tedarikçi Ekle" sekmesine geçin</p>
      </div>
    );
  }

  const byTier = ["1", "2", "3"].map(t => ({
    tier: t,
    items: suppliers.data!.filter(s => s.tier === t),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {byTier.map(group => (
        <div key={group.tier}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: "#10b981" }}>
              T{group.tier}
            </span>
            <span className="font-semibold">Tier {group.tier} Tedarikçiler</span>
            <Badge variant="secondary">{group.items.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {group.items.map(s => {
              const sector = CBAM_SECTORS.find(sec => sec.code === s.sectorType);
              const status = STATUS[s.onboardingStatus] ?? { label: s.onboardingStatus, className: "bg-muted text-muted-foreground" };
              return (
                <div key={s.id} className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  {sector && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg px-2 py-1.5">
                      <span>{sector.icon}</span>
                      <span>{sector.nameTr}</span>
                      <span className="ml-auto text-emerald-600 font-medium">~{sector.defaultEmissionFactor} tCO₂e/t</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Operasyonlar Tab ──────────────────────────────────────────────────────────
function OperationsTab() {
  const queue = trpc.cbam.getReviewQueue.useQuery();
  const reports = trpc.cbam.getAnnualReports.useQuery();
  const reviewMutation = trpc.cbam.reviewSubmission.useMutation({ onSuccess: () => queue.refetch() });
  const addReportMutation = trpc.cbam.addToAnnualReport.useMutation({ onSuccess: () => { queue.refetch(); reports.refetch(); } });

  return (
    <div className="space-y-8">
      {/* Review Queue */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          İnceleme Kuyruğu
          {(queue.data?.length ?? 0) > 0 && (
            <Badge className="bg-amber-100 text-amber-700">{queue.data?.length}</Badge>
          )}
        </h3>
        {queue.isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !queue.data?.length ? (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground text-sm">Bekleyen gönderim yok</div>
        ) : (
          <div className="space-y-2">
            {queue.data.map(item => (
              <div key={item.scoreId} className="border border-border rounded-xl p-4 flex items-center justify-between gap-4 bg-card">
                <div>
                  <p className="font-medium">{item.supplierName}</p>
                  <p className="text-xs text-muted-foreground">{item.supplierEmail} · {item.reportingYear} · {item.sectorCode}</p>
                  <p className="text-sm font-semibold text-emerald-600 mt-1">{item.totalCO2e.toFixed(2)} tCO₂e</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => reviewMutation.mutate({ scoreId: item.scoreId, action: "approved" })}
                    disabled={reviewMutation.isPending}>Onayla</Button>
                  <Button size="sm" variant="outline" className="text-red-500 border-red-300 hover:bg-red-50"
                    onClick={() => reviewMutation.mutate({ scoreId: item.scoreId, action: "rejected" })}
                    disabled={reviewMutation.isPending}>Reddet</Button>
                  <Button size="sm" style={{ backgroundColor: "#10b981", color: "white" }}
                    onClick={() => addReportMutation.mutate({ scoreId: item.scoreId, year: item.reportingYear })}
                    disabled={addReportMutation.isPending}>Rapora Ekle</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Annual Reports */}
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Yıllık Raporlar
        </h3>
        {!reports.data?.length ? (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground text-sm">
            Henüz rapor oluşturulmadı. İnceleme kuyruğundan "Rapora Ekle" butonunu kullanın.
          </div>
        ) : (
          <div className="space-y-2">
            {reports.data.map(r => (
              <div key={r.id} className="border border-border rounded-xl p-4 flex items-center justify-between bg-card">
                <div>
                  <p className="font-semibold">{r.year} Yılı CBAM Raporu</p>
                  <p className="text-xs text-muted-foreground">Toplam {r.totalCO2e.toFixed(2)} tCO₂e</p>
                </div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Genel Bakış Tab ───────────────────────────────────────────────────────────
function OverviewTab({ setTab }: { setTab: (t: Tab) => void }) {
  const suppliers = trpc.cbam.getMySuppliers.useQuery();
  const queue = trpc.cbam.getReviewQueue.useQuery();
  const reports = trpc.cbam.getAnnualReports.useQuery();

  const total = suppliers.data?.length ?? 0;
  const active = suppliers.data?.filter(s => s.onboardingStatus === "active").length ?? 0;
  const pendingReview = queue.data?.length ?? 0;
  const reportCount = reports.data?.length ?? 0;

  const sectorBreakdown = CBAM_SECTORS.map(sec => ({
    ...sec,
    count: suppliers.data?.filter(s => s.sectorType === sec.code).length ?? 0,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6">
      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Tedarikçi", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Aktif", value: active, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "İncelenecek", value: pendingReview, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Raporlar", value: reportCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className={`w-9 h-9 ${kpi.bg} rounded-lg flex items-center justify-center mb-3`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-bold">{suppliers.isLoading ? "—" : kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Sector Breakdown */}
      {sectorBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "#10b981" }} />
            Sektör Dağılımı
          </h3>
          <div className="space-y-3">
            {sectorBreakdown.map(s => (
              <div key={s.code} className="flex items-center gap-3">
                <span className="text-lg w-6">{s.icon}</span>
                <span className="text-sm w-28 truncate">{s.nameTr}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(s.count / total) * 100}%`, backgroundColor: "#10b981" }}
                  />
                </div>
                <span className="text-xs font-medium w-4 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {total === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold">Başlangıç Rehberi</h3>
          {[
            { step: "1", title: "Tedarikçi Ekle", desc: "CBAM sektöründe faaliyet gösteren tedarikçilerinizi sisteme ekleyin", tab: "add_supplier" as Tab },
            { step: "2", title: "Emisyon Verisi Bekleyin", desc: "Tedarikçiler portaldan emisyon verilerini gönderir", tab: "suppliers" as Tab },
            { step: "3", title: "İnceleyin & Raporlayın", desc: "Gönderimler onaylandıktan sonra yıllık CBAM raporuna eklenir", tab: "operations" as Tab },
          ].map(item => (
            <div key={item.step} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setTab(item.tab)}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm" style={{ backgroundColor: "#10b981" }}>
                {item.step}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground self-center" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const suppliersQuery = trpc.cbam.getMySuppliers.useQuery();

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Genel Bakış", icon: BarChart3 },
    { id: "add_supplier", label: "Tedarikçi Ekle", icon: Plus },
    { id: "suppliers", label: `Tedarikçiler (${suppliersQuery.data?.length ?? 0})`, icon: Users },
    { id: "operations", label: "CBAM Operasyonlar", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NoCarbonLogo size={32} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">{user.role === "admin" ? "İthalatçı (Yönetici)" : "Tedarikçi"}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-emerald-500 text-emerald-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "overview" && <OverviewTab setTab={setActiveTab} />}
        {activeTab === "add_supplier" && <AddSupplierTab onSuccess={() => setActiveTab("suppliers")} />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "operations" && <OperationsTab />}
      </main>
    </div>
  );
}
