import { describe, it, expect } from "vitest";
import {
  resumoDashboard,
  filtrarPorPeriodo,
  filtrarPorStatus,
  ordenarPorVencimento,
  type ParcelaDashboard,
} from "../dashboard";

const HOJE = "2026-06-05";

const parcelas: ParcelaDashboard[] = [
  { status_registrado: "em_aberto", vencimento: "2026-06-04", valor: 100 }, // atrasado
  { status_registrado: "em_aberto", vencimento: "2026-06-06", valor: 200 }, // vencendo
  { status_registrado: "em_aberto", vencimento: "2026-06-20", valor: 300 }, // pendente
  { status_registrado: "pago", vencimento: "2026-06-01", valor: 400 }, // confirmado
  { status_registrado: "pago_verificacao", vencimento: "2026-06-02", valor: 500 }, // confirmado
];

describe("resumoDashboard", () => {
  const r = resumoDashboard(parcelas, HOJE);
  it("confirmados = pago + pago_verificacao", () => {
    expect(r.confirmados.valor).toBe(900);
    expect(r.confirmados.count).toBe(2);
  });
  it("urgentes = vencendo + atrasado", () => {
    expect(r.urgentes.valor).toBe(300);
    expect(r.urgentes.count).toBe(2);
  });
  it("pendentes = restante", () => {
    expect(r.pendentes.valor).toBe(300);
    expect(r.pendentes.count).toBe(1);
  });
  it("badges", () => {
    expect(r.badges.vencendo).toBe(1);
    expect(r.badges.atrasado).toBe(1);
  });
});

describe("filtrarPorPeriodo", () => {
  const itens = [
    { vencimento: "2026-06-10" },
    { vencimento: "2026-07-10" },
    { vencimento: "2025-06-10" },
  ];
  it("este_mes", () => {
    expect(filtrarPorPeriodo(itens, { tipo: "este_mes" }, HOJE)).toHaveLength(1);
  });
  it("este_ano", () => {
    expect(filtrarPorPeriodo(itens, { tipo: "este_ano" }, HOJE)).toHaveLength(2);
  });
  it("todos", () => {
    expect(filtrarPorPeriodo(itens, { tipo: "todos" }, HOJE)).toHaveLength(3);
  });
  it("customizado de/ate inclusivo", () => {
    const res = filtrarPorPeriodo(itens, { tipo: "customizado", de: "2026-06-01", ate: "2026-06-30" }, HOJE);
    expect(res).toHaveLength(1);
    expect(res[0].vencimento).toBe("2026-06-10");
  });
});

describe("filtrarPorStatus / ordenar", () => {
  const itens = [
    { status: "atrasado" as const, vencimento: "2026-06-04" },
    { status: "pago" as const, vencimento: "2026-06-01" },
  ];
  it("filtra por status", () => {
    expect(filtrarPorStatus(itens, "pago")).toHaveLength(1);
    expect(filtrarPorStatus(itens, "todos")).toHaveLength(2);
  });
  it("ordena por vencimento", () => {
    expect(ordenarPorVencimento(itens).map((i) => i.vencimento)).toEqual(["2026-06-01", "2026-06-04"]);
  });
});
