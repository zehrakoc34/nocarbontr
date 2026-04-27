import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Download, AlertCircle, FileJson, FileCode, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScoreVisualization, ScoreGrid } from "@/components/ScoreVisualization";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const FORMAT_INFO = {
  pdf: { icon: <FileText className="w-6 h-6" />, label: "PDF Raporu", desc: "İnsan okunabilir, paylaşılabilir belge" },
  xml: { icon: <FileCode className="w-6 h-6" />, label: "XML Raporu", desc: "CBAM AB standardı uyumlu" },
  json: { icon: <FileJson className="w-6 h-6" />, label: "JSON Raporu", desc: "API entegrasyonu için" },
};

export default function ReportsPage() {
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "xml" | "json">("pdf");
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const reportsQuery = trpc.reports.list.useQuery();
  const uploadsQuery = trpc.uploads.list.useQuery();
  const generateMutation = trpc.reports.generate.useMutation();

  const completedUploads = uploadsQuery.data?.filter((u) => u.status === "completed") ?? [];

  const handleGenerate = async (uploadId: number) => {
    setGeneratingId(uploadId);
    try {
      const report = await generateMutation.mutateAsync({ uploadId, format: selectedFormat });
      toast.success(`${selectedFormat.toUpperCase()} raporu oluşturuldu`);

      if (report.fileUrl) {
        // Fetch content as blob for proper download
        const res = await fetch(report.fileUrl);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nocarbontr-cbam-${uploadId}.${selectedFormat}`;
        a.click();
        URL.revokeObjectURL(url);
      }

      reportsQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rapor oluşturulamadı");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDownload = async (fileUrl: string, title: string, format: string) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: direct link
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Format Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" style={{ color: "#10b981" }} />
            CBAM Raporu Oluştur
          </CardTitle>
          <CardDescription>Format seçin, ardından hangi yüklemeden rapor oluşturulacağını belirtin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Format picker */}
          <div className="grid grid-cols-3 gap-3">
            {(["pdf", "xml", "json"] as const).map((fmt) => {
              const info = FORMAT_INFO[fmt];
              return (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                    selectedFormat === fmt
                      ? "border-green-500 bg-green-50"
                      : "border-border hover:border-green-300 hover:bg-muted/50"
                  }`}
                >
                  <span className={selectedFormat === fmt ? "text-green-600" : "text-muted-foreground"}>
                    {info.icon}
                  </span>
                  <span className={`font-semibold text-sm ${selectedFormat === fmt ? "text-green-700" : "text-foreground"}`}>
                    {info.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{info.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Upload list to generate from */}
          {completedUploads.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Hangi yüklemeden rapor oluşturulsun?</p>
              {completedUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{upload.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {upload.rowCount} satır · {new Date(upload.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(upload.id)}
                    disabled={generatingId === upload.id}
                    className="gap-2"
                    style={{ backgroundColor: "#10b981" }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {generatingId === upload.id ? "Oluşturuluyor..." : `${selectedFormat.toUpperCase()} Oluştur`}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Rapor oluşturmak için önce <strong>Yükle</strong> sekmesinden bir dosya yükleyin.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Reports */}
      {reportsQuery.data && reportsQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Download className="w-5 h-5" style={{ color: "#10b981" }} />
                Oluşturulan Raporlar
              </span>
              <Badge variant="secondary">{reportsQuery.data.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reportsQuery.data.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">{report.format.toUpperCase()}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString("tr-TR")}
                      </span>
                    </div>
                  </div>
                  {report.fileUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report.fileUrl!, report.title, report.format)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      İndir
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score examples */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Skor Görselleştirme Örnekleri</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ScoreVisualization
            score={{ emissionScore: 85, responsibilityScore: 78, supplyChainScore: 82, compositeScore: 81.7, scoreRating: "green" }}
            title="Örnek: Mükemmel Performans"
          />
          <ScoreVisualization
            score={{ emissionScore: 45, responsibilityScore: 38, supplyChainScore: 52, compositeScore: 44.4, scoreRating: "yellow" }}
            title="Örnek: Orta Performans"
          />
        </div>
        <ScoreGrid
          scores={[
            { emissionScore: 85, responsibilityScore: 78, supplyChainScore: 82, compositeScore: 81.7, scoreRating: "green" },
            { emissionScore: 45, responsibilityScore: 38, supplyChainScore: 52, compositeScore: 44.4, scoreRating: "yellow" },
            { emissionScore: 22, responsibilityScore: 30, supplyChainScore: 25, compositeScore: 25.6, scoreRating: "red" },
          ]}
          title="Çok Sektörlü Karşılaştırma Örneği"
        />
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CBAM Rapor Formatları</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong className="text-foreground">PDF:</strong> Paydaşlarla paylaşmak, basmak için biçimlendirilmiş belge. Grafikler ve özet içerir.</p>
          <p><strong className="text-foreground">XML:</strong> AB CBAM sistemine iletim için standart format. Yasal başvurularda kullanılır.</p>
          <p><strong className="text-foreground">JSON:</strong> Veri analizi ve sistem entegrasyonları için. API ile kolayca işlenir.</p>
        </CardContent>
      </Card>
    </div>
  );
}
