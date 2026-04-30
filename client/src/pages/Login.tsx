import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { NoCarbonLogo } from "@/components/NoCarbonLogo";
import { trpc } from "@/lib/trpc";

async function apiPost(path: string, body: object): Promise<{ ok: boolean; data: any }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { ok, data } = await apiPost("/api/auth/login", { email: loginEmail, password: loginPassword });
      if (!ok) { setError(data?.error ?? "Giriş başarısız"); return; }
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (regPassword !== regPassword2) { setError("Şifreler eşleşmiyor"); return; }
    if (regPassword.length < 6) { setError("Şifre en az 6 karakter olmalıdır"); return; }
    setLoading(true);
    try {
      const { ok, data } = await apiPost("/api/auth/register", { email: regEmail, password: regPassword, name: regName });
      if (!ok) { setError(data?.error ?? "Kayıt başarısız"); return; }
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <NoCarbonLogo size={40} />
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle>Hesabınıza Giriş Yapın</CardTitle>
            <CardDescription>CBAM raporlama platformunuza hoş geldiniz</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setError(""); }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
              </TabsList>

              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              {/* Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>E-posta</Label>
                    <Input
                      type="email"
                      placeholder="ornek@firma.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Şifre</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading} style={{ backgroundColor: "#10b981" }}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </TabsContent>

              {/* Register */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Ad Soyad</Label>
                    <Input
                      placeholder="Zehra Koç"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>E-posta</Label>
                    <Input
                      type="email"
                      placeholder="ornek@firma.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Şifre</Label>
                    <Input
                      type="password"
                      placeholder="En az 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Şifre Tekrar</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={regPassword2}
                      onChange={(e) => setRegPassword2(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading} style={{ backgroundColor: "#10b981" }}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {loading ? "Kaydediliyor..." : "Hesap Oluştur"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Giriş yaparak{" "}
          <a href="#" className="underline hover:text-foreground">Kullanım Şartları</a>
          {" "}ve{" "}
          <a href="#" className="underline hover:text-foreground">Gizlilik Politikası</a>
          {" "}kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
}
