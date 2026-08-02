"use client";

import { useRouter } from "next/navigation";

const MESES = [
  { v: 0,  l: "Todos os meses" },
  { v: 1,  l: "Janeiro" },
  { v: 2,  l: "Fevereiro" },
  { v: 3,  l: "Março" },
  { v: 4,  l: "Abril" },
  { v: 5,  l: "Maio" },
  { v: 6,  l: "Junho" },
  { v: 7,  l: "Julho" },
  { v: 8,  l: "Agosto" },
  { v: 9,  l: "Setembro" },
  { v: 10, l: "Outubro" },
  { v: 11, l: "Novembro" },
  { v: 12, l: "Dezembro" },
];

export function YearSelect({
  anos,
  ano,
  mes,
  adv,
}: {
  anos: number[];
  ano: number;
  mes: number;
  adv?: string;
}) {
  const router = useRouter();

  function nav(novoAno: number, novoMes: number) {
    const params = new URLSearchParams({ ano: String(novoAno) });
    if (novoMes > 0) params.set("mes", String(novoMes));
    if (adv) params.set("adv", adv);
    router.push(`/relatorio-ir?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select
        className="form-control"
        style={{ width: "auto" }}
        value={ano}
        onChange={(e) => nav(Number(e.target.value), mes)}
      >
        {anos.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      <select
        className="form-control"
        style={{ width: "auto" }}
        value={mes}
        onChange={(e) => nav(ano, Number(e.target.value))}
      >
        {MESES.map((m) => (
          <option key={m.v} value={m.v}>{m.l}</option>
        ))}
      </select>
    </div>
  );
}
