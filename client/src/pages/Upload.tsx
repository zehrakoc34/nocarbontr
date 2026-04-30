import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload as UploadIcon, CheckCircle, AlertCircle, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header respecting quoted fields
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseRow(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h.trim()] = values[i] ?? "";
      });
      return obj;
    });
}

const SAMPLE_CSV = `hsCode,quantity,unit,supplierId,tier,sectorId
8708,1000,kg,SUP001,1,1
7208,500,ton,SUP002,2,6
6101,2000,kg,SUP003,1,3`;

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{ rowCount: number; errorCount: number; scoreCount: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.uploads.create.useMutation();
  const processMutation = trpc.uploads.process.useMutation();
  const uploadsQuery = trpc.uploads.list.useQuery();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'dan az olmalıdır");
      return;
    }
    const allowed = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/csv", "text/plain"];
    if (!allowed.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error("Lütfen CSV veya Excel dosyası yükleyin (.csv, .xlsx, .xls)");
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string).split(",")[1];
          setProgress(25);

          const upload = await uploadMutation.mutateAsync({
            fileName: file.name,
            fileData: base64,
            fileSize: file.size,
          });

          setProgress(50);

          // Parse CSV content
          const text = await file.text();
          const rows = parseCSV(text);

          if (rows.length === 0) {
            toast.error("Dosya boş veya geçersiz format. CSV formatını kontrol edin.");
            setUploading(false);
            setProgress(0);
            return;
          }

          setProgress(70);

          const validRows = rows
            .filter((r) => r.hsCode && r.quantity && parseFloat(r.quantity) > 0)
            .map((r) => ({
              hsCode: r.hsCode || "",
              quantity: parseFloat(r.quantity) || 0,
              unit: r.unit || "kg",
              sectorId: parseInt(r.sectorId) || 1,
              supplierId: r.supplierId || undefined,
              tier: (r.tier as "1" | "2" | "3") || undefined,
            }));

          if (validRows.length === 0) {
            toast.error("Geçerli satır bulunamadı. hsCode ve quantity sütunlarının dolu olduğunu kontrol edin.");
            setUploading(false);
            setProgress(0);
            return;
          }

          const processResult = await processMutation.mutateAsync({
            uploadId: upload.id,
            data: validRows,
          });

          setProgress(100);
          setResult({
            rowCount: processResult.rowCount,
            errorCount: processResult.errorCount,
            scoreCount: processResult.scoreCount,
          });
          toast.success(`${processResult.rowCount} satır işlendi, ${processResult.scoreCount} skor hesaplandı`);
          uploadsQuery.refetch();

          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "İşleme hatası");
        } finally {
          setUploading(false);
          setTimeout(() => setProgress(0), 1000);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Yükleme başarısız");
      setUploading(false);
      setProgress(0);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nocarbontr-ornek-veri.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UploadIcon className="w-5 h-5" style={{ color: "#10b981" }} />
            Tedarik Zinciri Verisi Yükle
          </CardTitle>
          <CardDescription>Excel veya CSV dosyanızı yükleyin — sistem otomatik doğrular ve skor hesaplar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:bg-muted/40 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <UploadIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold text-foreground mb-1">
              {file ? file.name : "Tıklayın veya dosyayı buraya sürükleyin"}
            </h3>
            <p className="text-sm text-muted-foreground">CSV veya Excel · Maksimum 10MB</p>
            <Input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
          </div>

          {file && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle className="h-4 w-4" style={{ color: "#10b981" }} />
                <AlertDescription>
                  <strong>{file.name}</strong> — {(file.size / 1024).toFixed(1)} KB
                </AlertDescription>
              </Alert>

              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {progress < 50 ? "Yükleniyor..." : progress < 80 ? "Ayrıştırılıyor..." : "Skor hesaplanıyor..."}
                    </span>
                    <span className="text-muted-foreground font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {!uploading && (
                <div className="flex gap-2">
                  <Button onClick={handleUpload} className="flex-1 gap-2" style={{ backgroundColor: "#10b981" }}>
                    <UploadIcon className="w-4 h-4" />
                    Yükle ve Analiz Et
                  </Button>
                  <Button variant="outline" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    İptal
                  </Button>
                </div>
              )}
            </div>
          )}

          {result && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>{result.rowCount}</strong> satır işlendi · <strong>{result.scoreCount}</strong> skor oluşturuldu
                {result.errorCount > 0 && <span className="text-yellow-700"> · {result.errorCount} hata</span>}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Geçmiş yüklemeler */}
      {uploadsQuery.data && uploadsQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geçmiş Yüklemeler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadsQuery.data.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.rowCount} satır · {new Date(u.createdAt).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.status === "completed" ? "bg-green-100 text-green-800" :
                    u.status === "failed" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {u.status === "completed" ? "Tamamlandı" : u.status === "failed" ? "Hata" : "İşleniyor"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Format guide + sample download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Dosya Formatı</span>
            <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
              <Download className="w-4 h-4" />
              Örnek İndir
            </Button>
          </CardTitle>
          <CardDescription>CSV dosyanız aşağıdaki sütunları içermelidir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden text-sm">
            <div className="grid grid-cols-3 bg-muted px-4 py-2 font-semibold text-foreground">
              <span>Sütun</span>
              <span>Açıklama</span>
              <span>Örnek</span>
            </div>
            {[
              { col: "hsCode", desc: "HS Kodu (4 hane)", ex: "8708" },
              { col: "quantity", desc: "Miktar (sayı)", ex: "1000" },
              { col: "unit", desc: "Birim", ex: "kg / ton / adet" },
              { col: "sectorId", desc: "Sektör ID (1-20)", ex: "1" },
              { col: "supplierId", desc: "Tedarikçi Kodu (opsiyonel)", ex: "SUP001" },
              { col: "tier", desc: "Tier 1/2/3 (opsiyonel)", ex: "1" },
            ].map((row) => (
              <div key={row.col} className="grid grid-cols-3 px-4 py-2.5 border-t border-border hover:bg-muted/30">
                <span className="font-mono text-xs text-foreground">{row.col}</span>
                <span className="text-muted-foreground">{row.desc}</span>
                <span className="text-muted-foreground font-mono text-xs">{row.ex}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Sektör ID'leri:</strong> 1=Otomotiv, 2=Makine, 3=Tekstil, 4=Mineral Yakıt, 5=Elektronik, 6=Demir-Çelik,
              7=Plastik, 8=Kimya, 9=Mücevherat, 10=Gıda, 11=Mobilya, 12=İlaç, 13=Lastik, 14=Cam/Seramik,
              15=Alüminyum, 16=Ayakkabı, 17=Tarım Makineleri, 18=Savunma, 19=Oyuncak, 20=Kozmetik
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
