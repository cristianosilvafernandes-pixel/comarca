import { describe, it, expect } from "vitest";
import { montarContrato } from "../contrato";

describe("montarContrato", () => {
  const base = {
    clienteNome: "João da Silva",
    clienteCpf: "529.982.247-25",
    clienteEndereco: "Rua A, 100, Pelotas/RS",
    signatarios: [{ nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" }],
    objeto: "Defesa em ação trabalhista",
    valor: "R$ 3.600,00",
    foro: "Pelotas/RS",
    dataHoje: "2026-06-05",
  };

  it("faz merge dos campos", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS");
    expect(txt).toContain("João da Silva, CPF 529.982.247-25");
    expect(txt).toContain("Dra. Ana Souza, OAB/RS 123.456");
    expect(txt).toContain("Defesa em ação trabalhista");
    expect(txt).toContain("R$ 3.600,00");
    expect(txt).toContain("foro da comarca de Pelotas/RS");
    expect(txt).toContain("Pelotas/RS, 05/06/2026.");
  });

  it("foro configurável (P-02)", () => {
    const txt = montarContrato({ ...base, foro: "São Paulo/SP" });
    expect(txt).toContain("foro da comarca de São Paulo/SP");
    expect(txt).toContain("São Paulo/SP, 05/06/2026.");
  });

  it("placeholders quando faltam dados", () => {
    const txt = montarContrato({ signatarios: [{ nome: "Dr. X" }], dataHoje: "2026-06-05" });
    expect(txt).toContain("[NOME DO CLIENTE]");
    expect(txt).toContain("[CPF DO CLIENTE]");
    expect(txt).toContain("[Comarca/UF]");
  });

  it("múltiplos signatários — texto plural e blocos separados", () => {
    const txt = montarContrato({
      ...base,
      signatarios: [
        { nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" },
        { nome: "Dr. Carlos Lima", oab: "OAB/RS 654.321" },
      ],
    });
    expect(txt).toContain("os advogados");
    expect(txt).toContain("denominados CONTRATADOS");
    expect(txt).toContain("CONTRATADOS o valor");
    expect(txt).toContain("Dra. Ana Souza, OAB/RS 123.456 e Dr. Carlos Lima, OAB/RS 654.321");
    expect(txt).toContain("Dr. Carlos Lima — OAB/RS 654.321");
  });

  it("inclui disclaimer de revisão jurídica", () => {
    expect(montarContrato(base)).toContain("não substitui a revisão jurídica");
  });
});
