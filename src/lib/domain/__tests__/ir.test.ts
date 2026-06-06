import { describe, it, expect } from "vitest";
import {
  categoriaFiscal,
  grupoExibicao,
  anoApuracao,
  agregarRelatorioIR,
  gerarCSV,
  nomeArquivoCSV,
  type ParcelaIR,
} from "../ir";

describe("categoriaFiscal", () => {
  it("mapeia tipo → categoria", () => {
    expect(categoriaFiscal("fixo_parcelado", 1)).toBe("Contratual");
    expect(categoriaFiscal("ad_exitum", 1)).toBe("Êxito");
    expect(categoriaFiscal("recorrente", 1)).toBe("Recorrente");
    expect(categoriaFiscal("fixo_exitum", 1)).toBe("Contratual");
    expect(categoriaFiscal("fixo_exitum", 2)).toBe("Êxito");
  });
});

describe("grupoExibicao", () => {
  it("sucumbencial sempre vai p/ Sucumbencial", () => {
    expect(grupoExibicao({ tipo: "fixo_parcelado", numero: 1, origem: "sucumbencial" })).toBe("Sucumbencial");
    expect(grupoExibicao({ tipo: "fixo_parcelado", numero: 1, origem: "contratual" })).toBe("Contratual");
  });
});

describe("anoApuracao", () => {
  it("usa dataPagamento, fallback vencimento", () => {
    expect(anoApuracao({ dataPagamento: "2025-12-31", vencimento: "2026-01-01" } as ParcelaIR)).toBe(2025);
    expect(anoApuracao({ dataPagamento: null, vencimento: "2026-01-01" } as ParcelaIR)).toBe(2026);
  });
});

const parcelas: ParcelaIR[] = [
  { clienteNome: "João", clienteCpf: "111", tipo: "fixo_parcelado", numero: 1, origem: "contratual", valor: 400, dataPagamento: "2026-02-10", vencimento: "2026-02-05" },
  { clienteNome: "Maria", clienteCpf: "222", tipo: "ad_exitum", numero: 1, origem: "contratual", valor: 5000, dataPagamento: "2026-05-01", vencimento: "2026-05-01" },
  { clienteNome: "ACME", clienteCpf: "333", tipo: "fixo_parcelado", numero: 2, origem: "sucumbencial", docPagador: "99.999.999/0001-99", valor: 800, dataPagamento: "2026-03-15", vencimento: "2026-03-10" },
  { clienteNome: "Léo", clienteCpf: "444", tipo: "recorrente", numero: 4, origem: "contratual", valor: 200, dataPagamento: "2025-12-01", vencimento: "2025-12-01" }, // ano anterior
];

describe("agregarRelatorioIR", () => {
  const rel = agregarRelatorioIR(parcelas, 2026);

  it("agrupa nos 4 grupos fixos", () => {
    expect(rel.grupos.map((g) => g.categoria)).toEqual(["Contratual", "Êxito", "Sucumbencial", "Recorrente"]);
  });
  it("filtra pelo ano", () => {
    expect(rel.totalGeral).toBe(400 + 5000 + 800); // exclui a recorrente de 2025
  });
  it("sucumbencial usa docPagador", () => {
    const suc = rel.grupos.find((g) => g.categoria === "Sucumbencial")!;
    expect(suc.linhas[0].doc).toBe("99.999.999/0001-99");
    expect(suc.total).toBe(800);
  });
  it("total por origem separado", () => {
    expect(rel.totalPorOrigem.contratual).toBe(400 + 5000);
    expect(rel.totalPorOrigem.sucumbencial).toBe(800);
  });
});

describe("gerarCSV", () => {
  const rel = agregarRelatorioIR(parcelas, 2026);
  const csv = gerarCSV(rel);

  it("tem BOM, header e separador ;", () => {
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Cliente;CPF/CNPJ;Tipo de Honorario;Origem;Valor Recebido;Data Recebimento");
  });
  it("valor com vírgula decimal e data dd/mm/aaaa", () => {
    expect(csv).toContain("400,00");
    expect(csv).toContain("10/02/2026");
  });
  it("nome de arquivo", () => {
    expect(nomeArquivoCSV(2026)).toBe("Apuracao_IR_Comarca_2026.csv");
  });
});
