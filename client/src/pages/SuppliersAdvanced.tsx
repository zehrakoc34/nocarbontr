import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Trash2, AlertCircle, ChevronRight, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SectorGroup {
  category: string;
  sectors: Array<{
    id: number;
    code: string;
    nameEn: string;
    nameTr: string;
    hsCodes: string | string[];
  }>;
}

export default function SuppliersAdvanced() {
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    email: "",
    tier: "1" as "1" | "2" | "3",
    hsCode: "",
    quantity: "",
    unit: "kg",
    co2eEmission: "",
  });

  const sectorsQuery = trpc.suppliers.getSectors.useQuery();
  const suppliersQuery = trpc.suppliers.list.useQuery();
  const createMutation = trpc.suppliers.create.useMutation();
  const deleteMutation = trpc.suppliers.delete.useMutation();
  const calculateScoreMutation = trpc.suppliers.calculateScore.useMutation();

  // Group sectors by category
  const groupedSectors: SectorGroup[] = [];
  if (sectorsQuery.data) {
    const categoryMap = new Map<string, SectorGroup>();
    sectorsQuery.data.forEach((sector) => {
      if (!categoryMap.has(sector.category)) {
        categoryMap.set(sector.category, {
          category: sector.category,
          sectors: [],
        });
      }
      categoryMap.get(sector.category)!.sectors.push(sector);
    });
    groupedSectors.push(...Array.from(categoryMap.values()));
  }

  const selectedSectorData = sectorsQuery.data?.find((s) => s.id === selectedSector);
  const filteredSuppliers = selectedSector
    ? suppliersQuery.data?.filter((s) => s.sectorId === selectedSector)
    : suppliersQuery.data;

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.hsCode || !newSupplier.quantity || !selectedSector) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: newSupplier.name,
        email: newSupplier.email || undefined,
        sectorId: selectedSector,
        tier: newSupplier.tier,
        hsCode: newSupplier.hsCode,
        quantity: parseFloat(newSupplier.quantity),
        unit: newSupplier.unit,
        co2eEmission: newSupplier.co2eEmission ? parseFloat(newSupplier.co2eEmission) : undefined,
      });

      toast.success("Supplier added successfully");
      setNewSupplier({
        name: "",
        email: "",
        tier: "1",
        hsCode: "",
        quantity: "",
        unit: "kg",
        co2eEmission: "",
      });
      suppliersQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add supplier");
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("Supplier deleted");
      suppliersQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete supplier");
    }
  };

  const handleCalculateScore = async (supplierId: number) => {
    try {
      const score = await calculateScoreMutation.mutateAsync({ supplierId });
      toast.success(`Score calculated: ${score.compositeScore}`);
      suppliersQuery.refetch();
    } catch (error) {
      toast.error("Failed to calculate score");
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "1":
        return "bg-blue-100 text-blue-800";
      case "2":
        return "bg-purple-100 text-purple-800";
      case "3":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (rating: string) => {
    switch (rating) {
      case "green":
        return "bg-green-100 text-green-800";
      case "yellow":
        return "bg-yellow-100 text-yellow-800";
      case "red":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar: Sector Selection */}
      <div className="lg:col-span-1">
        <Card className="sticky top-4">
          <CardHeader>
            <CardTitle className="text-lg">Sectors</CardTitle>
            <CardDescription>Select a sector to view suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible value={expandedCategory} onValueChange={setExpandedCategory}>
              {groupedSectors.map((group) => (
                <AccordionItem key={group.category} value={group.category}>
                  <AccordionTrigger className="text-sm font-medium">
                    {group.category}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2">
                      {group.sectors.map((sector) => (
                        <button
                          key={sector.id}
                          onClick={() => setSelectedSector(sector.id)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            selectedSector === sector.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">{sector.nameTr}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                          <p className="text-xs text-muted-foreground">{sector.code}</p>
                        </button>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Supplier Management */}
      <div className="lg:col-span-3 space-y-6">
        {/* Sector Info */}
        {selectedSectorData && (
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedSectorData.nameTr}</CardTitle>
                  <CardDescription>{selectedSectorData.nameEn}</CardDescription>
                </div>
                <Badge variant="outline">{selectedSectorData.code}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                HS Codes: {Array.isArray(selectedSectorData.hsCodes) ? selectedSectorData.hsCodes.join(", ") : selectedSectorData.hsCodes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Supplier Form */}
        {selectedSector && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Supplier
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Supplier Name *</label>
                  <Input
                    placeholder="Company name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="supplier@example.com"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Tier *</label>
                  <Select value={newSupplier.tier} onValueChange={(v) => setNewSupplier({ ...newSupplier, tier: v as "1" | "2" | "3" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1 (Direct)</SelectItem>
                      <SelectItem value="2">Tier 2 (Sub-supplier)</SelectItem>
                      <SelectItem value="3">Tier 3 (Raw Material)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">HS Code *</label>
                  <Input
                    placeholder="e.g., 8708"
                    value={newSupplier.hsCode}
                    onChange={(e) => setNewSupplier({ ...newSupplier, hsCode: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground">Quantity *</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newSupplier.quantity}
                      onChange={(e) => setNewSupplier({ ...newSupplier, quantity: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground">Unit</label>
                    <Select value={newSupplier.unit} onValueChange={(v) => setNewSupplier({ ...newSupplier, unit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="ton">ton</SelectItem>
                        <SelectItem value="pieces">pieces</SelectItem>
                        <SelectItem value="m">m</SelectItem>
                        <SelectItem value="m2">m²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">CO2e Emission (optional)</label>
                  <Input
                    type="number"
                    placeholder="kg CO2e"
                    value={newSupplier.co2eEmission}
                    onChange={(e) => setNewSupplier({ ...newSupplier, co2eEmission: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleAddSupplier} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Supplier"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Suppliers List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Suppliers
              </span>
              {filteredSuppliers && (
                <Badge variant="secondary">{filteredSuppliers.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSuppliers && filteredSuppliers.length > 0 ? (
              <div className="space-y-3">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {supplier.email && `${supplier.email} • `}
                          {supplier.hsCode} • {supplier.quantity} {supplier.unit}
                        </p>
                      </div>
                      <Badge className={getTierColor(supplier.tier)}>
                        Tier {supplier.tier}
                      </Badge>
                    </div>



                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCalculateScore(supplier.id)}
                        disabled={calculateScoreMutation.isPending}
                        className="flex-1 gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Calculate Score
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedSector
                    ? "No suppliers added for this sector yet."
                    : "Select a sector to add suppliers."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
