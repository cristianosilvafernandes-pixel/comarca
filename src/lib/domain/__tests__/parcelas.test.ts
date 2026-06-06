import { describe, it, expect } from "vitest";
import {
  dividirValor,
  gerarParcelasFixoParcelado,
  gerarParcelasRecorrente,
  gerarParcelasAdExitum,
  gerarParcelasFixoExitum,
  calcularValorExito,
} from "../parcelas";

describe("dividirValor", () => {
  it("ajusta centavos na última parcela", () => {
    expect(dividirValor(100, 3)).toEqual([33.33, 33.33, 33.34]);
    expect(dividirValor(1200, 3)).toEqual([400, 400, 400]);
  });
});

describe("gerarParcelasFixoParcelado", () => {
  it("mensal: 3 parcelas com vencimentos mensais", () => {
    const ps = gerarParcelasFixoParcelado({
      valorTotal: 1200,
      numParcelas: 3,
      frequencia: "Mensal",
      dataPrimeira: "2026-06-05",
    });
    expect(ps.map((p) => p.vencimento)).toEqual(["2026-06-05", "2026-07-05", "2026-08-05"]);
    expect(ps.every((p) => p.status_registrado === "em_aberto")).toBe(true);
    expect(ps[0].numero).toBe(1);
  });

  it("quinzenal: vencimentos a cada 15 dias", () => {
    const ps = gerarParcelasFixoParcelado({
      valorTotal: 300,
      numParcelas: 3,
      frequencia: "Quinzenal",
      dataPrimeira: "2026-06-05",
    });
    expect(ps.map((p) => p.vencimento)).toEqual(["2026-06-05", "2026-06-20", "2026-07-05"]);
  });

  it("única: 1 parcela", () => {
    const ps = gerarParcelasFixoParcelado({
      valorTotal: 500,
      numParcelas: 5,
      frequencia: "Única",
      dataPrimeira: "2026-06-05",
    });
    expect(ps).toHaveLength(1);
    expect(ps[0].valor).toBe(500);
  });

  it("à vista marcável como já pago hoje", () => {
    const ps = gerarParcelasFixoParcelado({
      valorTotal: 500,
      numParcelas: 1,
      frequencia: "Única",
      dataPrimeira: "2026-06-05",
      jaPagoHoje: true,
      hoje: "2026-06-05",
    });
    expect(ps[0].status_registrado).toBe("pago");
    expect(ps[0].data_pagamento).toBe("2026-06-05");
  });
});

describe("gerarParcelasRecorrente", () => {
  it("entre início e fim, inclusivo", () => {
    const ps = gerarParcelasRecorrente({
      valorMensal: 200,
      dataInicio: "2026-06-05",
      dataFim: "2026-09-05",
    });
    expect(ps).toHaveLength(4);
    expect(ps.map((p) => p.vencimento)).toEqual([
      "2026-06-05",
      "2026-07-05",
      "2026-08-05",
      "2026-09-05",
    ]);
  });

  it("sem data fim: mês corrente + meses adiante", () => {
    const ps = gerarParcelasRecorrente({
      valorMensal: 200,
      dataInicio: "2026-06-05",
      hoje: "2026-06-20",
      mesesAdiante: 1,
    });
    expect(ps).toHaveLength(2);
    expect(ps[1].vencimento).toBe("2026-07-05");
  });
});

describe("ad_exitum / fixo_exitum", () => {
  it("ad_exitum não gera parcelas por data", () => {
    expect(gerarParcelasAdExitum()).toEqual([]);
  });
  it("fixo_exitum gera a entrada como 1ª parcela", () => {
    const ps = gerarParcelasFixoExitum({ valorEntrada: 1000, dataEntrada: "2026-06-05" });
    expect(ps).toHaveLength(1);
    expect(ps[0].valor).toBe(1000);
  });
  it("calcula valor de êxito", () => {
    expect(calcularValorExito(100000, 20)).toBe(20000);
  });
});
