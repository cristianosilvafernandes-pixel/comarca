"use client";

import { useRouter } from "next/navigation";
import type { PeriodoTipo } from "@/lib/domain/dashboard";

interface Props {
  periodo: PeriodoTipo;
  de: string;
  ate: string;
  status: string;
  adv: string;
  advogados: { id: string; nome: string }[];
}

export function DashboardFilters({ periodo, de, ate, status, adv, advogados }: Props) {
  const router = useRouter();

  function nav(next: { periodo?: string; de?: string; ate?: string; adv?: string }) {
    const p = new URLSearchParams();
    p.set("periodo", next.periodo ?? periodo);
    if (status && status !== "todos") p.set("status", status);
    const advVal = next.adv ?? adv;
    if (advVal && advVal !== "todos") p.set("adv", advVal);
    const d = next.de ?? de;
    const a = next.ate ?? ate;
    if ((next.periodo ?? periodo) === "customizado") {
      if (d) p.set("de", d);
      if (a) p.set("ate", a);
    }
    router.push(`/dashboard?${p.toString()}`);
  }

  return (
    <div className="card" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ marginBottom: 0, color: "var(--body)", fontSize: 13, whiteSpace: "nowrap" }}>
          Advogado:
        </label>
        <select
          className="form-control"
          style={{ width: "auto", minWidth: 180 }}
          value={adv}
          onChange={(e) => nav({ adv: e.target.value })}
        >
          <option value="todos">Todos os advogados</option>
          {advogados.map((a) => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <label style={{ marginBottom: 0, color: "var(--body)", fontSize: 13, whiteSpace: "nowrap" }}>
          Período:
        </label>
        <select
          className="form-control"
          style={{ width: "auto", minWidth: 160 }}
          value={periodo}
          onChange={(e) => nav({ periodo: e.target.value })}
        >
          <option value="este_mes">Este mês</option>
          <option value="este_ano">Este ano</option>
          <option value="todos">Todos</option>
          <option value="customizado">Período customizado</option>
        </select>
      </div>

      {periodo === "customizado" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="date"
            className="form-control"
            style={{ width: "auto" }}
            defaultValue={de}
            onChange={(e) => nav({ de: e.target.value })}
          />
          <span style={{ color: "var(--body)", fontSize: 13 }}>até</span>
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
