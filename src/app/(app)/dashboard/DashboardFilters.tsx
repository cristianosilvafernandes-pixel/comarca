"use client";

import { useRouter } from "next/navigation";
import type { PeriodoTipo } from "@/lib/domain/dashboard";

interface Props {
  periodo: PeriodoTipo;
  de: string;
  ate: string;
  status: string;
}

/** Controle de filtro por período do dashboard (INV-062). */
export function DashboardFilters({ periodo, de, ate, status }: Props) {
  const router = useRouter();

  function nav(next: { periodo?: string; de?: string; ate?: string }) {
    const p = new URLSearchParams();
    p.set("periodo", next.periodo ?? periodo);
    if (status && status !== "todos") p.set("status", status);
    const d = next.de ?? de;
    const a = next.ate ?? ate;
    if ((next.periodo ?? periodo) === "customizado") {
      if (d) p.set("de", d);
      if (a) p.set("ate", a);
    }
    router.push(`/dashboard?${p.toString()}`);
  }

  return (
    <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
      <label style={{ marginBottom: 0 }}>Período:</label>
      <select
        className="form-control"
        style={{ width: "auto" }}
        value={periodo}
        onChange={(e) => nav({ periodo: e.target.value })}
      >
        <option value="este_mes">Este mês</option>
        <option value="este_ano">Este ano</option>
        <option value="todos">Todos</option>
        <option value="customizado">Período customizado</option>
      </select>

      {periodo === "customizado" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="date"
            className="form-control"
            style={{ width: "auto" }}
            defaultValue={de}
            onChange={(e) => nav({ de: e.target.value })}
          />
          <span style={{ color: "var(--text-muted)" }}>até</span>
          <input
            type="date"
            className="form-control"
            style={{ width: "auto" }}
            defaultValue={ate}
            onChange={(e) => nav({ ate: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}
