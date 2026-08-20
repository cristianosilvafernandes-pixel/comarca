"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "@/app/auth/actions";

const MAIN_LINKS = [
  {
    href: "/dashboard",
    label: "Painel",
    icon: "M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z",
  },
  {
    href: "/honorarios",
    label: "Honorários",
    icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

const MORE_ITEMS = [
  {
    href: "/equipe",
    label: "Equipe",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 1-3-3.87M16 3.13a4 4 0 0 1 0 7.75M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
  {
    href: "/gerar-contrato",
    label: "Gerar Contrato",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6",
  },
  {
    href: "/relatorio-ir",
    label: "Relatório IR",
    icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8",
  },
  {
    href: "/perfil",
    label: "Perfil do Escritório",
    icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const moreActive = MORE_ITEMS.some((m) => pathname === m.href || pathname.startsWith(m.href + "/"));

  return (
    <>
      {open && <div className="mobile-nav-overlay" onClick={() => setOpen(false)} />}

      {open && (
        <div className="mobile-nav-sheet" ref={sheetRef}>
          <div className="mobile-nav-sheet-handle" />
          {MORE_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.href} href={item.href} className={`mobile-nav-sheet-item${active ? " active" : ""}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item.label}
              </Link>
            );
          })}
          <div className="mobile-nav-sheet-sep" />
          <form action={signOut} style={{ margin: 0 }}>
            <button type="submit" className="mobile-nav-sheet-item mobile-nav-sheet-signout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sair
            </button>
          </form>
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {MAIN_LINKS.map((l) => {
          const active = pathname === l.href || pathname.startsWith(l.href + "/");
          return (
            <Link key={l.href} href={l.href} className={`mobile-nav-item${active ? " active" : ""}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d={l.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{l.label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          className={`mobile-nav-item${moreActive || open ? " active" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Mais opções"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path
              d={open
                ? "M18 15l-6-6-6 6"
                : "M4 6h16M4 12h16M4 18h16"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
