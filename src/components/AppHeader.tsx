import Image from "next/image";
import { signOut } from "@/app/auth/actions";
import { Logo } from "@/components/Logo";

function initials(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppHeader({ nome, logoUrl }: { nome: string; logoUrl?: string | null }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <a href="/dashboard" className="logo">
          <Logo size={24} />
          Comarca
        </a>

        <div className="user-profile">
          <a
            href="/perfil"
            title="Meu perfil"
            style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}
          >
            <div className="user-text">
              <div className="name">{nome}</div>
              </div>
            {logoUrl ? (
              <div className="avatar" aria-hidden="true" style={{ padding: 0, overflow: "hidden", background: "transparent" }}>
                <Image
                  src={logoUrl}
                  alt="Logo do escritório"
                  width={36}
                  height={36}
                  style={{ objectFit: "contain", width: "100%", height: "100%" }}
                  unoptimized
                />
              </div>
            ) : (
              <div className="avatar" aria-hidden="true">
                {initials(nome)}
              </div>
            )}
          </a>
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary" title="Sair">
              Sair
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
