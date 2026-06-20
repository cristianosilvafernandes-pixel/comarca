import { describe, it, expect } from "vitest";
import { montarContrato } from "../contrato";

describe("montarContrato", () => {
  const base = {
    clienteNome: "João da Silva",
    clienteCpf: "529.982.247-25",
    clienteEndereco: "Rua A, 100, Pelotas/RS",
    signatarios: [{ nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" }],
    descricaoDemanda: "Defesa em ação trabalhista",
    valor: "R$ 3.600,00",
    chavePix: "034.994.430-07",
    foro: "Pelotas/RS",
    dataHoje: "2026-06-05",
  };

  it("título e qualificação das partes", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("CONTRATO DE HONORÁRIOS ADVOCATÍCIOS");
    expect(txt).toContain("inscrita no CPF sob o nº 529.982.247-25");
    expect(txt).toContain("João da Silva, pessoa física");
    expect(txt).toContain("Dra. Ana Souza, inscrito na OAB/RS 123.456");
  });

  it("valor e PIX", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("R$ 3.600,00");
    expect(txt).toContain("PIX (Chave: 034.994.430-07)");
  });

  it("foro configurável", () => {
    const txt = montarContrato({ ...base, foro: "São Paulo/SP" });
    expect(txt).toContain("foro da comarca de São Paulo/SP");
    expect(txt).toContain("São Paulo/SP, 5 de junho de 2026.");
  });

  it("data por extenso", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("Pelotas/RS, 5 de junho de 2026.");
  });

  it("cláusula mandato trabalhista", () => {
    const txt = montarContrato({ ...base, tipoContrato: "trabalhista" });
    expect(txt).toContain("CLÁUSULA SÉTIMA – DO MANDATO");
    expect(txt).toContain("CLÁUSULA OITAVA – DO FORO");
    expect(txt).not.toContain("CLÁUSULA SÉTIMA – DO FORO");
  });

  it("cível sem cláusula de mandato", () => {
    const txt = montarContrato({ ...base, tipoContrato: "civel" });
    expect(txt).toContain("CLÁUSULA SÉTIMA – DO FORO");
    expect(txt).not.toContain("CLÁUSULA OITAVA");
  });

  it("placeholders quando faltam dados", () => {
    const txt = montarContrato({ signatarios: [{ nome: "Dr. X" }], dataHoje: "2026-06-05" });
    expect(txt).toContain("[NOME/RAZÃO SOCIAL DO CONTRATANTE]");
    expect(txt).toContain("[CPF/CNPJ]");
    expect(txt).toContain("[Comarca/UF]");
  });

  it("múltiplos signatários — plural e assinaturas separadas", () => {
    const txt = montarContrato({
      ...base,
      signatarios: [
        { nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" },
        { nome: "Dr. Carlos Lima", oab: "OAB/RS 654.321" },
      ],
    });
    expect(txt).toContain("os advogados");
    expect(txt).toContain("designados CONTRATADOS");
    expect(txt).toContain("pagará aos CONTRATADOS");
    expect(txt).toContain("diretamente aos CONTRATADOS");
    expect(txt).toContain("Dra. Ana Souza, inscrito na OAB/RS 123.456 e Dr. Carlos Lima, inscrito na OAB/RS 654.321");
    expect(txt).toContain("Dr. Carlos Lima\nCONTRATADO");
  });

  it("forma de pagamento parcelado", () => {
    const txt = montarContrato({ ...base, formaPagamento: "Parcelado" });
    expect(txt).toContain("de forma parcelada");
  });

  it("bloco testemunhas no final", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("Testemunhas:");
    expect(txt).toContain("1______________________________     CPF:");
  });
});
