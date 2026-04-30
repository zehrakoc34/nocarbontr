import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CBAM_SECTORS } from "@shared/cbamSectors";
import { NoCarbonLogo } from "@/components/NoCarbonLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LogOut, Users, Plus, CheckCircle, Clock, FileText, BarChart3,
  ChevronRight, Copy, Check, Eye, EyeOff, ShieldAlert,
  Send, History, Factory
} from "lucide-react";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Force Change Password (shown when mustChangePassword = true)
// ─────────────────────────────────────────────────────────────────────────────
function ForceChangePassword() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const utils = trpc.useUtils();
  const changeMutation = trpc.cbam.changePassword.useMutation({
    onSuccess: () => {
      toast.success("Şifreniz güncellendi");
      utils.auth.me.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error("Şifreler eşleşmiyor"); return; }
    if (form.next.length < 8) { toast.error("Şifre en az 8 karakter olmalı"); return; }
    changeMutation.mutate({ currentPassword: form.current, newPassword: form.next });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-xl space-y-5">
        <div className="flex items-center gap-3 text-amber-600">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold">Geçici Şifrenizi Değiştirin</p>
            <p className="text-xs text-muted-foreground">Devam etmek için kalıcı şifre belirleyin</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {[
            { label: "Mevcut (Geçici) Şifre", key: "current" },
            { label: "Yeni Şifre (min. 8 karakter)", key: "next" },
            { label: "Yeni Şifre (tekrar)", key: "confirm" },
          ].map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              <input
                type="password"
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                required
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
          <Button type="submit" disabled={changeMutation.isPending} className="w-full" style={{ backgroundColor: "#10b981" }}>
            {changeMutation.isPending ? "Güncelleniyor..." : "Şifremi Güncelle"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER VIEW
// ─────────────────────────────────────────────────────────────────────────────
type SupplierStep = "sector" | "data" | "review" | "done";

function SupplierDashboard({ user }: { user: { name: string | null; email: string | null; mustChangePassword: boolean } }) {
  const profile = trpc.cbam.getMySupplierProfile.useQuery();
  const submissions = trpc.cbam.getMySubmissions.useQuery();
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [step, setStep] = useState<SupplierStep>("sector");
  const [selectedSector, setSelectedSector] = useState("");
  const [reportingYear, setReportingYear] = useState(2025);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ totalCO2e: number; intensity: number; scoreId: number } | null>(null);

  const submitMutation = trpc.cbam.submitData.useMutation({
    onSuccess: (data) => { setResult(data); setStep("done"); submissions.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const sectorDef = profile.data?.sectorDef ?? CBAM_SECTORS.find(s => s.code === selectedSector);
  const effectiveSector = profile.data?.sectorCode ?? selectedSector;

  const handleSubmit = () => {
    const sector = profile.data?.sectorCode ?? selectedSector;
    const processed: Record<string, string | number> = {};
    Object.entries(formData).forEach(([k, v]) => {
      processed[k] = isNaN(Number(v)) ? v : Number(v);
    });
    submitMutation.mutate({ sectorCode: sector as any, reportingYear, cbamData: processed });
  };

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pending_review: { label: "İnceleme Bekliyor", color: "bg-amber-100 text-amber-700" },
    approved: { label: "Onaylandı", color: "bg-emerald-100 text-emerald-700" },
    rejected: { label: "Reddedildi", color: "bg-red-100 text-red-700" },
  };

  return (
    <div className="min-h-screen bg-background">
      {user.mustChangePassword && <ForceChangePassword />}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NoCarbonLogo size={32} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">Tedarikçi</p>
            </div>
            <LogoutBtn />
          </div>
        </div>
      </header>

      {/* Supplier info banner */}
      {profile.data && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="container mx-auto px-4 py-2 flex items-center gap-3 text-sm">
            <Factory className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-800 font-medium">
              {profile.data.sectorDef?.icon} {profile.data.sectorDef?.nameTr} — Tier {profile.data.tier}
            </span>
            <span className="text-emerald-600 text-xs">CBAM Tedarikçi Portalı</span>
          </div>
        </div>
      )}

      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 flex gap-1">
          {[
            { id: "submit" as const, label: "Emisyon Verisi Gönder", icon: Send },
            { id: "history" as const, label: `Gönderimlerim (${submissions.data?.length ?? 0})`, icon: History },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "submit" && (
          <div className="max-w-2xl mx-auto">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              {(["sector", "data", "review", "done"] as SupplierStep[]).map((s, i) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s ? "text-white" : ["sector","data","review","done"].indexOf(step) > i ? "text-white" : "bg-muted text-muted-foreground"
                  }`} style={step === s || ["sector","data","review","done"].indexOf(step) > i ? { backgroundColor: "#10b981" } : {}}>
                    {["sector","data","review","done"].indexOf(step) > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  {i < 3 && <div className={`flex-1 h-0.5 w-8 ${["sector","data","review","done"].indexOf(step) > i ? "bg-emerald-400" : "bg-muted"}`} />}
                </div>
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {step === "sector" ? "Sektör" : step === "data" ? "Veri Girişi" : step === "review" ? "Özet" : "Tamamlandı"}
              </span>
            </div>

            {/* Step: Sector (only if not locked to a sector) */}
            {step === "sector" && !profile.data?.sectorCode && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">CBAM Sektörünü Seçin</h2>
                <div className="grid grid-cols-2 gap-3">
                  {CBAM_SECTORS.map(s => (
                    <button key={s.code} onClick={() => { setSelectedSector(s.code); setStep("data"); }}
                      className="p-4 rounded-xl border-2 border-border hover:border-emerald-400 bg-card text-left transition-all">
                      <span className="text-2xl">{s.icon}</span>
                      <p className="font-semibold mt-2">{s.nameTr}</p>
                      <p className="text-xs text-muted-foreground">{s.nameEn}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-advance if profile has sector */}
            {step === "sector" && profile.data?.sectorCode && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Sektörünüz: <span className="font-semibold">{profile.data.sectorDef?.nameTr}</span></p>
                <Button onClick={() => setStep("data")} style={{ backgroundColor: "#10b981" }}>Veri Girişine Geç →</Button>
              </div>
            )}

            {/* Step: Data Entry */}
            {step === "data" && sectorDef && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">{sectorDef.icon} {sectorDef.nameTr} — Emisyon Verileri</h2>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Raporlama Yılı</label>
                    <select value={reportingYear} onChange={e => setReportingYear(Number(e.target.value))}
                      className="border border-border rounded-lg px-2 py-1 text-sm bg-background outline-none">
                      {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  {sectorDef.metrics.map(m => (
                    <div key={m.key} className="space-y-1">
                      <label className="text-sm font-medium flex items-center gap-1">
                        {m.labelTr}
                        {m.required && <span className="text-red-500">*</span>}
                        {m.tooltip && <span className="text-xs text-muted-foreground ml-1">({m.tooltip})</span>}
                      </label>
                      {m.type === "select" ? (
                        <select value={formData[m.key] ?? ""} onChange={e => setFormData(p => ({ ...p, [m.key]: e.target.value }))}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500">
                          <option value="">Seçin...</option>
                          {m.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <div className="relative">
                          <input type="number" value={formData[m.key] ?? ""} onChange={e => setFormData(p => ({ ...p, [m.key]: e.target.value }))}
                            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500 pr-14"
                            placeholder="0" min="0" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{m.unit}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("sector")}>← Geri</Button>
                  <Button className="flex-1" style={{ backgroundColor: "#10b981" }}
                    disabled={sectorDef.metrics.filter(m => m.required).some(m => !formData[m.key])}
                    onClick={() => setStep("review")}>
                    Özeti Gör →
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Review */}
            {step === "review" && sectorDef && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold">Veri Özeti — Onaylıyor musunuz?</h2>
                <div className="bg-muted rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sektör</span><span className="font-medium">{sectorDef.icon} {sectorDef.nameTr}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Raporlama Yılı</span><span className="font-medium">{reportingYear}</span></div>
                  {sectorDef.metrics.filter(m => formData[m.key]).map(m => (
                    <div key={m.key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{m.labelTr}</span>
                      <span className="font-medium">{formData[m.key]} {m.unit}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  ℹ️ Gönderilen veriler ithalatçınızın incelemesine sunulacak ve onaylandıktan sonra CBAM raporuna eklenecektir.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep("data")}>← Düzenle</Button>
                  <Button className="flex-1" style={{ backgroundColor: "#10b981" }}
                    disabled={submitMutation.isPending} onClick={handleSubmit}>
                    {submitMutation.isPending ? "Gönderiliyor..." : <><Send className="w-4 h-4 mr-2" />Raporu Gönder</>}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Done */}
            {step === "done" && result && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Veriler Gönderildi!</h2>
                  <p className="text-muted-foreground text-sm mt-1">İthalatçınız inceledikten sonra onaylayacaktır.</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                  <p className="text-2xl font-bold text-emerald-700">{result.totalCO2e.toFixed(3)} tCO₂e</p>
                  <p className="text-sm text-emerald-600">Hesaplanan toplam emisyon</p>
                  <p className="text-xs text-muted-foreground">Yoğunluk: {result.intensity.toFixed(4)} tCO₂e/ton</p>
                </div>
                <Button onClick={() => { setStep("sector"); setFormData({}); setResult(null); }} variant="outline">
                  Yeni Veri Gönder
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="max-w-2xl mx-auto space-y-3">
            {submissions.isLoading ? (
              [1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)
            ) : !submissions.data?.length ? (
              <div className="text-center py-16 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Henüz gönderim yok</p>
              </div>
            ) : submissions.data.map(s => {
              const status = STATUS_MAP[s.submissionStatus] ?? { label: s.submissionStatus, color: "bg-muted text-muted-foreground" };
              const sector = CBAM_SECTORS.find(sec => sec.code === s.sectorCode);
              return (
                <div key={s.id} className="border border-border rounded-xl p-4 bg-card flex items-center justify-between">
                  <div>
                    <p className="font-medium">{sector?.icon} {sector?.nameTr ?? s.sectorCode} — {s.reportingYear}</p>
                    <p className="text-sm text-emerald-600 font-semibold">{Number(s.totalCO2e).toFixed(3)} tCO₂e</p>
                    {s.reviewNote && <p className="text-xs text-muted-foreground mt-1">Not: {s.reviewNote}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>{status.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTER VIEW TABS
// ─────────────────────────────────────────────────────────────────────────────
type ImporterTab = "overview" | "add_supplier" | "suppliers" | "operations";

// -- Add Supplier Tab
function AddSupplierTab({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", sectorCode: "", tier: "1" as "1"|"2"|"3" });
  const [result, setResult] = useState<{ email: string; tempPassword: string; supplierId: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const mutation = trpc.cbam.onboardSupplier.useMutation({
    onSuccess: (data) => { setResult(data); onSuccess(); },
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
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="font-semibold">Tedarikçi hesabı oluşturuldu</p>
            <p className="text-xs text-muted-foreground">Giriş bilgileri aşağıda — tedarikçiye iletin</p>
          </div>
        </div>
        <div className="bg-muted rounded-xl p-4 font-mono text-sm space-y-2">
          <div><span className="text-muted-foreground text-xs uppercase tracking-wide">E-posta</span><br />{result.email}</div>
          <div><span className="text-muted-foreground text-xs uppercase tracking-wide">Geçici Şifre</span><br />
            <span className="text-amber-600 font-bold text-base">{result.tempPassword}</span>
          </div>
        </div>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Bu şifreyi güvenli bir kanaldan tedarikçiye iletin. İlk girişte değiştirmesi zorunludur.
        </p>
        <div className="flex gap-3">
          <Button onClick={copyCredentials} variant="outline" className="flex-1 gap-2">
            {copied ? <><Check className="w-4 h-4 text-emerald-600"/>Kopyalandı</> : <><Copy className="w-4 h-4"/>Kopyala</>}
          </Button>
          <Button onClick={() => { setResult(null); setForm({ name:"", email:"", sectorCode:"", tier:"1" }); }}
            className="flex-1" style={{ backgroundColor: "#10b981" }}>
            + Yeni Ekle
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-8 space-y-5">
      <h2 className="text-lg font-semibold">Yeni CBAM Tedarikçisi Ekle</h2>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Ad / Şirket Adı *</label>
        <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Tedarikçi adı" />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">E-posta *</label>
        <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="tedarikci@firma.com" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">CBAM Regülasyon Sektörü *</label>
        <div className="grid grid-cols-2 gap-2">
          {CBAM_SECTORS.map(s => (
            <button key={s.code} type="button" onClick={() => setForm(p => ({ ...p, sectorCode: s.code }))}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                form.sectorCode === s.code ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"
              }`}>
              <span className="text-xl">{s.icon}</span>
              <div className="font-medium text-sm mt-1">{s.nameTr}</div>
              <div className="text-xs text-muted-foreground">{s.nameEn}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tedarik Zinciri Kademesi</label>
        <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value as "1"|"2"|"3" }))}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="1">Tier 1 — Direkt Tedarikçi</option>
          <option value="2">Tier 2 — Alt Tedarikçi</option>
          <option value="3">Tier 3 — Ham Madde Tedarikçisi</option>
        </select>
      </div>
      <Button onClick={() => mutation.mutate({ name: form.name, email: form.email, sectorCode: form.sectorCode as any, tier: form.tier })}
        disabled={!form.name || !form.email || !form.sectorCode || mutation.isPending}
        className="w-full" style={{ backgroundColor: "#10b981" }}>
        {mutation.isPending ? "Oluşturuluyor..." : "+ Tedarikçi Ekle & Hesap Oluştur"}
      </Button>
    </div>
  );
}

// -- Suppliers List Tab (with password show/hide)
function SuppliersTab() {
  const suppliers = trpc.cbam.getMySuppliers.useQuery();
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const STATUS: Record<string, { label: string; className: string }> = {
    active: { label: "Aktif", className: "bg-emerald-100 text-emerald-700" },
    invited: { label: "Davet Gönderildi", className: "bg-amber-100 text-amber-700" },
    inactive: { label: "Pasif", className: "bg-muted text-muted-foreground" },
  };

  if (suppliers.isLoading) return (
    <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
  );

  if (!suppliers.data?.length) return (
    <div className="text-center py-20 text-muted-foreground">
      <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p className="font-medium">Henüz tedarikçi eklenmedi</p>
      <p className="text-sm mt-1">"Tedarikçi Ekle" sekmesinden başlayın</p>
    </div>
  );

  const byTier = ["1","2","3"].map(t => ({
    tier: t,
    items: suppliers.data!.filter(s => s.tier === t),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6">
      {byTier.map(group => (
        <div key={group.tier}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold"
              style={{ backgroundColor: "#10b981" }}>T{group.tier}</span>
            <span className="font-semibold">Tier {group.tier} Tedarikçiler</span>
            <Badge variant="secondary">{group.items.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.items.map(s => {
              const sector = CBAM_SECTORS.find(sec => sec.code === s.sectorType);
              const status = STATUS[s.onboardingStatus] ?? { label: s.onboardingStatus, className: "bg-muted text-muted-foreground" };
              const pwVisible = visiblePasswords.has(s.id);
              return (
                <div key={s.id} className="border border-border rounded-xl p-4 bg-card space-y-3">
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
                    <div className="flex items-center gap-2 text-xs bg-muted rounded-lg px-2 py-1.5">
                      <span>{sector.icon}</span>
                      <span className="text-muted-foreground">{sector.nameTr}</span>
                      <span className="ml-auto text-emerald-600 font-medium">~{sector.defaultEmissionFactor} tCO₂e/t</span>
                    </div>
                  )}
                  {/* Password show/hide */}
                  {s.tempPassword && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-amber-700 font-medium">Geçici Şifre</p>
                        <p className="font-mono text-sm text-amber-900">
                          {pwVisible ? s.tempPassword : "•".repeat(s.tempPassword.length)}
                        </p>
                      </div>
                      <button onClick={() => togglePassword(s.id)}
                        className="text-amber-600 hover:text-amber-800 transition-colors flex-shrink-0"
                        title={pwVisible ? "Gizle" : "Göster"}>
                        {pwVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
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

// -- Operations Tab
function OperationsTab() {
  const queue = trpc.cbam.getReviewQueue.useQuery();
  const reports = trpc.cbam.getAnnualReports.useQuery();
  const reviewMutation = trpc.cbam.reviewSubmission.useMutation({ onSuccess: () => queue.refetch() });
  const addReportMutation = trpc.cbam.addToAnnualReport.useMutation({ onSuccess: () => { queue.refetch(); reports.refetch(); } });

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          İnceleme Kuyruğu
          {(queue.data?.length ?? 0) > 0 && <Badge className="bg-amber-100 text-amber-700">{queue.data?.length}</Badge>}
        </h3>
        {queue.isLoading ? (
          <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
        ) : !queue.data?.length ? (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground text-sm">Bekleyen gönderim yok</div>
        ) : queue.data.map(item => (
          <div key={item.scoreId} className="border border-border rounded-xl p-4 bg-card mb-2">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium">{item.supplierName}</p>
                <p className="text-xs text-muted-foreground">{item.supplierEmail} · {item.reportingYear} · {item.sectorCode}</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{Number(item.totalCO2e).toFixed(3)} tCO₂e</p>
              </div>
              <div className="flex gap-2 flex-wrap">
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
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          Yıllık CBAM Raporları
        </h3>
        {!reports.data?.length ? (
          <div className="bg-muted rounded-xl p-6 text-center text-muted-foreground text-sm">
            Henüz rapor yok. İnceleme kuyruğundan "Rapora Ekle" butonu ile başlayın.
          </div>
        ) : reports.data.map(r => (
          <div key={r.id} className="border border-border rounded-xl p-4 flex items-center justify-between bg-card mb-2">
            <div>
              <p className="font-semibold">{r.year} Yılı CBAM Raporu</p>
              <p className="text-xs text-muted-foreground">Toplam {Number(r.totalCO2e).toFixed(3)} tCO₂e</p>
            </div>
            <Badge variant="outline">{r.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// -- Overview Tab
function OverviewTab({ setTab }: { setTab: (t: ImporterTab) => void }) {
  const suppliers = trpc.cbam.getMySuppliers.useQuery();
  const queue = trpc.cbam.getReviewQueue.useQuery();
  const reports = trpc.cbam.getAnnualReports.useQuery();

  const total = suppliers.data?.length ?? 0;
  const pending = queue.data?.length ?? 0;
  const reportCount = reports.data?.length ?? 0;

  const sectorBreakdown = CBAM_SECTORS.map(sec => ({
    ...sec,
    count: suppliers.data?.filter(s => s.sectorType === sec.code).length ?? 0,
  })).filter(s => s.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Toplam Tedarikçi", value: total, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "İncelenecek Veri", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Yıllık Raporlar", value: reportCount, icon: FileText, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "CBAM Sektörü", value: sectorBreakdown.length, icon: Factory, color: "text-emerald-600", bg: "bg-emerald-50" },
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

      {sectorBreakdown.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" style={{ color: "#10b981" }} />
            Sektör Dağılımı
          </h3>
          <div className="space-y-3">
            {sectorBreakdown.map(s => (
              <div key={s.code} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{s.icon}</span>
                <span className="text-sm w-28 truncate">{s.nameTr}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full" style={{ width: `${(s.count / total) * 100}%`, backgroundColor: "#10b981" }} />
                </div>
                <span className="text-xs font-medium w-4 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3">
          <h3 className="font-semibold">Başlangıç Rehberi</h3>
          {[
            { step:"1", title:"CBAM Tedarikçisi Ekle", desc:"6 regülasyon sektöründen birinde faaliyet gösteren tedarikçilerinizi ekleyin, sistem otomatik giriş bilgisi oluşturur", tab:"add_supplier" as ImporterTab },
            { step:"2", title:"Tedarikçi Veri Gönderir", desc:"Tedarikçi kendi portalından emisyon verilerini girer ve incelemenize sunar", tab:"suppliers" as ImporterTab },
            { step:"3", title:"Onaylayın & Raporlayın", desc:"Verileri inceleyin, onaylayın ve yıllık CBAM raporuna ekleyin", tab:"operations" as ImporterTab },
          ].map(item => (
            <div key={item.step} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setTab(item.tab)}>
              <div className="flex-shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: "#10b981" }}>{item.step}</div>
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

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Logout Button
// ─────────────────────────────────────────────────────────────────────────────
function LogoutBtn() {
  const { logout } = useAuth();
  return (
    <Button variant="outline" size="sm" onClick={logout} className="gap-2">
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Çıkış</span>
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN DASHBOARD — routes by role
// ─────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ImporterTab>("overview");
  const suppliersQuery = trpc.cbam.getMySuppliers.useQuery(
    undefined,
    { enabled: user?.role !== "supplier" }
  );

  if (!user) return null;

  // Supplier gets their own simplified portal
  if (user.role === "supplier") {
    return <SupplierDashboard user={user} />;
  }

  // Importer (admin/user) gets full management dashboard
  const tabs: { id: ImporterTab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "Genel Bakış", icon: BarChart3 },
    { id: "add_supplier", label: "Tedarikçi Ekle", icon: Plus },
    { id: "suppliers", label: `Tedarikçilerim (${suppliersQuery.data?.length ?? 0})`, icon: Users },
    { id: "operations", label: "CBAM Operasyonlar", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NoCarbonLogo size={32} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">İthalatçı (Yönetici)</p>
            </div>
            <LogoutBtn />
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id ? "border-emerald-500 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "overview" && <OverviewTab setTab={setActiveTab} />}
        {activeTab === "add_supplier" && <AddSupplierTab onSuccess={() => setActiveTab("suppliers")} />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "operations" && <OperationsTab />}
      </main>
    </div>
  );
}
