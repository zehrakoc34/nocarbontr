import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Mail, Users, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SECTORS = [
  { id: 1, nameTr: "Otomotiv ve Yedek Parçalar", category: "Otomotiv", hsCodes: ["8708", "8704", "8705", "8706", "8707"] },
  { id: 2, nameTr: "Makine ve Mekanik Cihazlar", category: "Makine", hsCodes: ["8401", "8402", "8403", "8404", "8405"] },
  { id: 3, nameTr: "Tekstil ve Hazır Giyim", category: "Tekstil", hsCodes: ["6101", "6102", "6103", "6104", "6201"] },
  { id: 4, nameTr: "Mineral Yakıt ve Ürünleri", category: "Enerji", hsCodes: ["2701", "2702", "2703", "2710", "2711"] },
  { id: 5, nameTr: "Elektrikli Eşya ve Elektronik", category: "Elektronik", hsCodes: ["8501", "8502", "8503", "8504", "8517"] },
  { id: 6, nameTr: "Demir-Çelik ve Metal Ürünleri", category: "Metal", hsCodes: ["7201", "7202", "7203", "7204", "7208"] },
  { id: 7, nameTr: "Plastik ve Plastik Mamuller", category: "Kimya", hsCodes: ["3901", "3902", "3903", "3904", "3920"] },
  { id: 8, nameTr: "Kimyasal Maddeler", category: "Kimya", hsCodes: ["2801", "2802", "2803", "2804", "2901"] },
  { id: 9, nameTr: "Mücevherat ve Kıymetli Metaller", category: "Lüks", hsCodes: ["7101", "7102", "7103", "7104", "7113"] },
  { id: 10, nameTr: "Gıda Ürünleri", category: "Gıda", hsCodes: ["0801", "0802", "0806", "1001", "1701"] },
  { id: 11, nameTr: "Mobilya ve Ev Tekstili", category: "Mobilya", hsCodes: ["9401", "9402", "9403", "9404", "9405"] },
  { id: 12, nameTr: "İlaç ve Eczacılık Ürünleri", category: "Sağlık", hsCodes: ["3001", "3002", "3003", "3004", "3005"] },
  { id: 13, nameTr: "Lastik ve Kauçuk Ürünleri", category: "Kimya", hsCodes: ["4001", "4002", "4011", "4012", "4013"] },
  { id: 14, nameTr: "Cam ve Seramik", category: "İnşaat", hsCodes: ["6901", "6902", "6903", "7003", "7004"] },
  { id: 15, nameTr: "Alüminyum ve Demir Dışı Metaller", category: "Metal", hsCodes: ["7601", "7602", "7604", "7606", "7607"] },
  { id: 16, nameTr: "Ayakkabı ve Deri Ürünleri", category: "Tekstil", hsCodes: ["6401", "6402", "6403", "6404", "4101"] },
  { id: 17, nameTr: "Tarım Makineleri ve Traktör", category: "Makine", hsCodes: ["8701", "8432", "8433", "8434", "8435"] },
  { id: 18, nameTr: "Savunma ve Havacılık Parçaları", category: "Savunma", hsCodes: ["8802", "8803", "8805", "8906", "8710"] },
  { id: 19, nameTr: "Oyuncak ve Spor Malzemeleri", category: "Tüketim", hsCodes: ["9501", "9502", "9503", "9506", "9507"] },
  { id: 20, nameTr: "Temizlik ve Kozmetik Ürünleri", category: "Kimya", hsCodes: ["3301", "3302", "3303", "3304", "3401"] },
];

const CATEGORIES = [...new Set(SECTORS.map((s) => s.category))];

export default function SuppliersPage() {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [selectedHsCode, setSelectedHsCode] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierTier, setSupplierTier] = useState<"1" | "2" | "3">("1");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [co2e, setCo2e] = useState("");

  const suppliersQuery = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();
  const deleteMutation = trpc.suppliers.delete.useMutation();
  const calculateMutation = trpc.suppliers.calculateScore.useMutation();
  const inviteMutation = trpc.suppliers.invite.useMutation();

  const selectedSectorData = SECTORS.find((s) => s.id === selectedSector);

  const handleSectorSelect = (id: number) => {
    setSelectedSector(id);
    const sector = SECTORS.find((s) => s.id === id);
    if (sector) setSelectedHsCode(sector.hsCodes[0]);
  };

  const handleAddSupplier = async () => {
    if (!supplierName || !selectedSector || !quantity || !selectedHsCode) {
      toast.error("Lütfen zorunlu alanları doldurun (Ad, Sektör, HS Kodu, Miktar)");
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: supplierName,
        email: supplierEmail || undefined,
        sectorId: selectedSector,
        tier: supplierTier,
        hsCode: selectedHsCode,
        quantity: parseFloat(quantity),
        unit,
        co2eEmission: co2e ? parseFloat(co2e) : undefined,
      });
      toast.success("Tedarikçi başarıyla eklendi");
      setSupplierName("");
      setSupplierEmail("");
      setQuantity("");
      setCo2e("");
      setSelectedSector(null);
      setSelectedHsCode("");
      suppliersQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tedarikçi eklenemedi");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Tedarikçi silindi");
      suppliersQuery.refetch();
    } catch (error) {
      toast.error("Silinemedi");
    }
  };

  const handleCalculateScore = async (supplierId: number) => {
    try {
      await calculateMutation.mutateAsync({ supplierId });
      toast.success("Skor hesaplandı");
      suppliersQuery.refetch();
    } catch (error) {
      toast.error("Skor hesaplanamadı");
    }
  };

  const handleInvite = async (supplierId: number) => {
    try {
      await inviteMutation.mutateAsync({ supplierId });
      toast.success("Davet e-postası gönderildi");
    } catch (error) {
      toast.error("Davet gönderilemedi — e-posta adresi gerekli");
    }
  };

  const byTier = {
    "1": suppliersQuery.data?.filter((s) => s.tier === "1") ?? [],
    "2": suppliersQuery.data?.filter((s) => s.tier === "2") ?? [],
    "3": suppliersQuery.data?.filter((s) => s.tier === "3") ?? [],
  };
  const totalSuppliers = suppliersQuery.data?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" style={{ color: "#10b981" }} />
            Yeni Tedarikçi Ekle
          </CardTitle>
          <CardDescription>Sektör seçin, ardından tedarikçi bilgilerini girin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector accordion */}
            <div className="space-y-2">
              <Label>Sektör *</Label>
              <div className="border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                <Accordion type="single" collapsible>
                  {CATEGORIES.map((cat) => (
                    <AccordionItem key={cat} value={cat} className="border-b last:border-b-0">
                      <AccordionTrigger className="px-3 py-2 text-sm hover:no-underline hover:bg-muted/50">
                        <span className="font-medium">{cat}</span>
                        <span className="ml-auto mr-2 text-xs text-muted-foreground">
                          {SECTORS.filter((s) => s.category === cat).length}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-2 pb-2">
                        {SECTORS.filter((s) => s.category === cat).map((s) => (
                          <div
                            key={s.id}
                            onClick={() => handleSectorSelect(s.id)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                              selectedSector === s.id
                                ? "bg-green-100 text-green-800 font-medium"
                                : "hover:bg-muted"
                            }`}
                          >
                            <ChevronRight className="w-3 h-3 flex-shrink-0" />
                            {s.nameTr}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              {selectedSectorData && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                  ✓ {selectedSectorData.nameTr}
                </p>
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Tedarikçi Adı *</Label>
                <Input placeholder="Örn. ABC Otomotiv A.Ş." value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>E-posta (davet için)</Label>
                <Input type="email" placeholder="tedarikci@firma.com" value={supplierEmail} onChange={(e) => setSupplierEmail(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Tier *</Label>
                  <Select value={supplierTier} onValueChange={(v) => setSupplierTier(v as "1" | "2" | "3")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1 — Doğrudan</SelectItem>
                      <SelectItem value="2">Tier 2 — Ara</SelectItem>
                      <SelectItem value="3">Tier 3 — Alt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>HS Kodu *</Label>
                  <Select value={selectedHsCode} onValueChange={setSelectedHsCode} disabled={!selectedSectorData}>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedSectorData ? "Seçin" : "Önce sektör"} />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedSectorData?.hsCodes.map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Miktar *</Label>
                  <Input type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Birim</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ton">ton</SelectItem>
                      <SelectItem value="adet">adet</SelectItem>
                      <SelectItem value="m2">m²</SelectItem>
                      <SelectItem value="lt">litre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>CO₂e (kg) — opsiyonel</Label>
                <Input type="number" placeholder="Bilinmiyorsa boş bırakın" value={co2e} onChange={(e) => setCo2e(e.target.value)} />
              </div>
              <Button
                onClick={handleAddSupplier}
                disabled={createMutation.isPending}
                className="w-full gap-2"
                style={{ backgroundColor: "#10b981" }}
              >
                <Plus className="w-4 h-4" />
                {createMutation.isPending ? "Ekleniyor..." : "Tedarikçi Ekle"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Grid by Tier */}
      {totalSuppliers > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" style={{ color: "#10b981" }} />
              Tedarikçi Listesi ({totalSuppliers})
            </h3>
            <div className="flex gap-2">
              <Badge variant="outline">T1: {byTier["1"].length}</Badge>
              <Badge variant="outline">T2: {byTier["2"].length}</Badge>
              <Badge variant="outline">T3: {byTier["3"].length}</Badge>
            </div>
          </div>

          {(["1", "2", "3"] as const).map((tier) =>
            byTier[tier].length > 0 ? (
              <Card key={tier}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ backgroundColor: "#10b981" }}>
                      T{tier}
                    </span>
                    Tier {tier} Tedarikçiler
                    <Badge variant="secondary">{byTier[tier].length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {byTier[tier].map((supplier) => {
                      const sectorName = SECTORS.find((s) => s.id === supplier.sectorId)?.nameTr;
                      const co2Val = supplier.co2eEmission ? parseFloat(supplier.co2eEmission) : null;
                      const scoreColor = co2Val ? (co2Val < 100 ? "green" : co2Val < 500 ? "yellow" : "red") : null;
                      const colorMap = { green: { bg: "bg-green-100", text: "text-green-800", label: "İyi" }, yellow: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Orta" }, red: { bg: "bg-red-100", text: "text-red-800", label: "Yüksek" } };

                      return (
                        <div key={supplier.id} className="border border-border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow bg-card">
                          <div className="flex items-start justify-between">
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <p className="font-semibold text-foreground truncate">{supplier.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{sectorName}</p>
                              <p className="text-xs text-muted-foreground">
                                HS: <span className="font-mono">{supplier.hsCode}</span> · {supplier.quantity} {supplier.unit}
                              </p>
                            </div>
                            {scoreColor && (
                              <Badge className={`${colorMap[scoreColor].bg} ${colorMap[scoreColor].text} ml-2 flex-shrink-0`}>
                                {colorMap[scoreColor].label}
                              </Badge>
                            )}
                          </div>

                          {co2Val && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>CO₂e: {co2Val} kg</span>
                              </div>
                              <Progress value={Math.min(100, (co2Val / 1000) * 100)} className="h-1.5" />
                            </div>
                          )}

                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => handleCalculateScore(supplier.id)} disabled={calculateMutation.isPending}>
                              Skor
                            </Button>
                            {supplier.email && (
                              <Button size="sm" variant="outline" className="gap-1 text-xs h-7 px-2" onClick={() => handleInvite(supplier.id)} disabled={inviteMutation.isPending}>
                                <Mail className="w-3 h-3" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-7 px-2" onClick={() => handleDelete(supplier.id)} disabled={deleteMutation.isPending}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : null
          )}
        </div>
      )}

      {totalSuppliers === 0 && !suppliersQuery.isLoading && (
        <Card>
          <CardContent className="py-14 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">Henüz tedarikçi eklenmedi</p>
            <p className="text-sm text-muted-foreground mt-1">Yukarıdaki formu kullanarak Tier 1-2-3 tedarikçilerinizi ekleyin</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
