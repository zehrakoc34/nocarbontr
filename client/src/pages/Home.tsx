import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Users, FileText, CheckCircle, ArrowRight, Leaf, BarChart3, ShieldCheck } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { NoCarbonLogo } from "@/components/NoCarbonLogo";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <NoCarbonLogo size={48} showText={false} className="justify-center mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <NoCarbonLogo size={36} />
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">Türk ihracatçıları için CBAM çözümü</span>
            <Button asChild>
              <a href={getLoginUrl()}>Giriş Yap / Kayıt Ol</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-1.5 text-sm text-green-700 font-medium">
            <Leaf className="w-4 h-4" />
            CBAM Uyumluluğu — AB Karbon Sınır Düzenlemesi
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Karbon ayak izinizi{" "}
            <span style={{ color: "#10b981" }}>otomatikleştirin</span>,{" "}
            ihracatınızı koruyun
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tedarik zinciri emisyon verilerinizi yükleyin, Score3 analizi alın ve dakikalar içinde
            CBAM uyumlu raporlar oluşturun. 20+ Türk ihracat sektörü için özelleştirildi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild className="gap-2 text-base px-8">
              <a href={getLoginUrl()}>
                Ücretsiz Başlayın
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8">
              Demo İzle
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Kredi kartı gerekmez · 14 gün ücretsiz deneme
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/30">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "20+", label: "İhracat Sektörü" },
              { value: "GHG", label: "Kapsam 1-2-3 Takibi" },
              { value: "XML/PDF", label: "CBAM Uyumlu Rapor" },
              { value: "AI", label: "Akıllı Veri Doğrulama" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold" style={{ color: "#10b981" }}>{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Eksiksiz CBAM Yönetimi
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            QuickCarbon'dan daha güçlü, Türk ihracatçılarına özel tasarlanmış
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: <Upload className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "Toplu Veri Yükleme",
              desc: "Excel/CSV dosyanızı yükleyin, sistem otomatik ayrıştırır ve doğrular. Hata tespiti için AI destekli validasyon.",
            },
            {
              icon: <BarChart3 className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "Score3 Hesaplama",
              desc: "Emisyon Skoru, Sorumluluk Skoru ve Tedarik Zinciri Skoru — GHG Protokolü Kapsam 1-2-3 bazlı otomatik hesaplama.",
            },
            {
              icon: <Users className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "Tier 1-2-3 Tedarikçi Yönetimi",
              desc: "Tedarikçilerinizi sektör ve tier'e göre organize edin. E-posta daveti ile tedarikçilerin kendi verilerini girmesini sağlayın.",
            },
            {
              icon: <FileText className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "CBAM Uyumlu Raporlar",
              desc: "PDF, XML ve JSON formatlarında AB standartlarına uygun raporlar. Yasal başvuru için hazır çıktılar.",
            },
            {
              icon: <ShieldCheck className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "Senaryo Analizi",
              desc: "Farklı emisyon faktörleri ile \"ne olursa\" senaryoları çalıştırın. Risk analizi ve hedef belirleme araçları.",
            },
            {
              icon: <Leaf className="w-7 h-7" style={{ color: "#10b981" }} />,
              title: "Karbon Ofsetleme",
              desc: "Karbon ofset sertifikalarınızı yükleyin, net emisyon pozisyonunuzu takip edin ve hedeflerinizi belgeleyin.",
            },
          ].map((f) => (
            <Card key={f.title} className="border hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="mb-2">{f.icon}</div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">{f.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 border-y border-border">
        <div className="container mx-auto px-4 py-20">
          <h3 className="text-3xl font-bold text-foreground text-center mb-14">Nasıl Çalışır?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Veri Yükle", desc: "Tedarik zinciri verilerinizi Excel/CSV ile yükleyin" },
              { step: "2", title: "AI Doğrula", desc: "Yapay zeka eksik ve hatalı verileri tespit eder" },
              { step: "3", title: "Score3 Al", desc: "Emisyon, sorumluluk ve tedarik zinciri puanları hesaplanır" },
              { step: "4", title: "Rapor Al", desc: "CBAM uyumlu PDF/XML raporu indirin" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-4"
                  style={{ backgroundColor: "#10b981" }}
                >
                  {s.step}
                </div>
                <h4 className="font-bold text-foreground mb-2">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-foreground text-center mb-12">
          20 Desteklenen Türk İhracat Sektörü
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[
            "Otomotiv / Yedek Parça",
            "Makine",
            "Tekstil / Giyim",
            "Mineral Yakıt",
            "Elektrikli / Elektronik",
            "Demir-Çelik",
            "Plastik",
            "Kimyasal",
            "Mücevherat",
            "Gıda (Fındık vb.)",
            "Mobilya",
            "İlaç",
            "Lastik / Kauçuk",
            "Cam / Seramik",
            "Alüminyum",
            "Ayakkabı / Deri",
            "Tarım Makineleri",
            "Savunma / Havacılık",
            "Oyuncak / Spor",
            "Temizlik / Kozmetik",
          ].map((sector) => (
            <div key={sector} className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg hover:border-green-300 transition-colors">
              <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
              <span className="text-xs font-medium text-foreground">{sector}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div
          className="rounded-2xl p-12 text-center text-white"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            CBAM'a hazır olun
          </h3>
          <p className="text-green-100 text-lg mb-8 max-w-xl mx-auto">
            Türkiye'nin lider CBAM yazılımı ile ihracatınızı güvence altına alın.
            Şimdi ücretsiz başlayın.
          </p>
          <Button size="lg" variant="secondary" asChild className="gap-2 text-base px-10">
            <a href={getLoginUrl()}>
              Hemen Başlayın
              <ArrowRight className="w-5 h-5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <NoCarbonLogo size={28} />
          <p className="text-sm text-muted-foreground">
            &copy; 2026 nocarbontr. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Gizlilik</a>
            <a href="#" className="hover:text-foreground transition-colors">Kullanım Şartları</a>
            <a href="#" className="hover:text-foreground transition-colors">İletişim</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
