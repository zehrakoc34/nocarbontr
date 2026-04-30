import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/supabase/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const orgType = user.user_metadata?.org_type ?? "SUPPLIER";
  const orgName = user.user_metadata?.org_name ?? user.email;

  const navItems =
    orgType === "CORPORATE"
      ? [
          { href: "/dashboard", label: "Genel Bakış" },
          { href: "/dashboard/company/suppliers", label: "Tedarikçi Ağı" },
          { href: "/dashboard/company/reports", label: "CBAM Raporları" },
          { href: "/dashboard/company/risk", label: "Risk Analizi" },
        ]
      : [
          { href: "/dashboard",                           label: "Genel Bakış"       },
          { href: "/dashboard/supplier/emissions",    label: "Emisyon Girişi"    },
          { href: "/dashboard/supplier/installations",label: "Tesislerim"        },
          { href: "/dashboard/supplier/calculator",   label: "CBAM Hesaplayıcı"  },
          { href: "/dashboard/supplier/evidence",     label: "Kanıt Yükle"       },
          { href: "/dashboard/supplier/trust",        label: "Güven Skorum"      },
        ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-bg-base)" }}>
      {/* Sidebar */}
      <aside
        className="w-60 flex-shrink-0 flex flex-col"
        style={{ backgroundColor: "var(--color-bg-surface)", borderRight: "1px solid var(--color-border)" }}
      >
        {/* Brand */}
        <div className="px-4 py-5 flex items-center gap-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--color-primary-600)" }}>
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>nocarbontr</p>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
              {orgType === "CORPORATE" ? "Kurumsal" : "Tedarikçi"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="nav-item">
              {item.label}
            </a>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          <div className="px-3 py-2">
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)", fontWeight: 500 }} className="truncate">
              {orgName}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-disabled)" }} className="truncate">
              {user.email}
            </p>
          </div>
          <form action={signOut}>
            <button type="submit" className="btn-ghost w-full justify-start" style={{ fontSize: "0.8125rem" }}>
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
