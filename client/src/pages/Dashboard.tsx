import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Upload, Users, FileText, LogOut, TrendingUp, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import UploadPage from "./Upload";
import SuppliersPage from "./Suppliers";
import ReportsPage from "./Reports";
import { NoCarbonLogo } from "@/components/NoCarbonLogo";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const uploadsQuery = trpc.uploads.list.useQuery();
  const suppliersQuery = trpc.suppliers.list.useQuery();
  const reportsQuery = trpc.reports.list.useQuery();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  if (!user) return null;

  const uploadCount = uploadsQuery.data?.length ?? 0;
  const supplierCount = suppliersQuery.data?.length ?? 0;
  const reportCount = reportsQuery.data?.length ?? 0;

  // Latest score from last upload
  const latestUpload = uploadsQuery.data?.[0];

  // Supplier tier breakdown
  const tier1 = suppliersQuery.data?.filter((s) => s.tier === "1").length ?? 0;
  const tier2 = suppliersQuery.data?.filter((s) => s.tier === "2").length ?? 0;
  const tier3 = suppliersQuery.data?.filter((s) => s.tier === "3").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <NoCarbonLogo size={32} />
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-foreground">{user.name || user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.role === "admin" ? "Yönetici" : "Kullanıcı"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Yükle</span>
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Tedarikçiler</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Raporlar</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Toplam Yüklemeler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                    {uploadsQuery.isLoading ? "—" : uploadCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {latestUpload
                      ? `Son: ${new Date(latestUpload.createdAt).toLocaleDateString("tr-TR")}`
                      : "Henüz yükleme yok"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Aktif Tedarikçiler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                    {suppliersQuery.isLoading ? "—" : supplierCount}
                  </div>
                  {supplierCount > 0 ? (
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs px-1.5">T1: {tier1}</Badge>
                      <Badge variant="outline" className="text-xs px-1.5">T2: {tier2}</Badge>
                      <Badge variant="outline" className="text-xs px-1.5">T3: {tier3}</Badge>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Henüz tedarikçi yok</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Oluşturulan Raporlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold" style={{ color: "#10b981" }}>
                    {reportsQuery.isLoading ? "—" : reportCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">PDF / XML / JSON</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Uploads */}
            {uploadCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" style={{ color: "#10b981" }} />
                    Son Yüklemeler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {uploadsQuery.data?.slice(0, 5).map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{upload.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {upload.rowCount} satır ·{" "}
                            {new Date(upload.createdAt).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <Badge
                          className={
                            upload.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : upload.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {upload.status === "completed"
                            ? "Tamamlandı"
                            : upload.status === "failed"
                            ? "Hata"
                            : "İşleniyor"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Getting Started */}
            {uploadCount === 0 && supplierCount === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" style={{ color: "#10b981" }} />
                    Başlangıç Rehberi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Verilerinizi Yükleyin",
                      desc: "Tedarik zinciri verilerinizi Excel veya CSV dosyası olarak yükleyin",
                      tab: "upload",
                    },
                    {
                      step: "2",
                      title: "Tedarikçilerinizi Ekleyin",
                      desc: "Tedarikçilerinizi sektör ve tier'e göre ekleyin, davet e-postası gönderin",
                      tab: "suppliers",
                    },
                    {
                      step: "3",
                      title: "CBAM Raporu Oluşturun",
                      desc: "PDF veya XML formatında uyumlu raporu indirin",
                      tab: "reports",
                    },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setActiveTab(item.tab)}
                    >
                      <div
                        className="flex-shrink-0 w-9 h-9 rounded-full text-white flex items-center justify-center font-bold text-sm"
                        style={{ backgroundColor: "#10b981" }}
                      >
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <UploadPage />
          </TabsContent>

          <TabsContent value="suppliers">
            <SuppliersPage />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsPage />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
