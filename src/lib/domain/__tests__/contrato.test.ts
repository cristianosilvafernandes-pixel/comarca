import { describe, it, expect } from "vitest";
import { montarContrato } from "../contrato";

describe("montarContrato", () => {
  const base = {
    clienteNome: "João da Silva",
    clienteCpf: "529.982.247-25",
    clienteEndereco: "Rua A, 100, Pelotas/RS",
    signatarios: [{ nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" }],
    descricaoDemanda: "Reclamatória Trabalhista nº 0001234-56.2025.5.04.0104",
    valor: "R$ 3.600,00",
    chavePix: "034.994.430-07",
    foro: "Pelotas – Rio Grande do Sul",
    dataHoje: "2026-06-05",
  };

  it("título e qualificação PF", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("CONTRATO DE HONORÁRIOS ADVOCATÍCIOS");
    expect(txt).toContain("pessoa física, inscrita no CPF sob o nº 529.982.247-25");
    expect(txt).toContain("1- João da Silva");
    expect(txt).toContain("Dra. Ana Souza, advogado(a), inscrito(a) na OAB/RS 123.456");
  });

  it("qualificação PJ quando CNPJ contém /", () => {
    const txt = montarContrato({ ...base, clienteCpf: "44.625.916/0001-02" });
    expect(txt).toContain("pessoa jurídica de direito privado");
    expect(txt).toContain("Cadastro Nacional de Pessoas Jurídicas (CNPJ)");
    expect(txt).toContain("44.625.916/0001-02");
  });

  it("parágrafo de mandato com demanda", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("mediante outorga do mandato respectivo");
    expect(txt).toContain("Reclamatória Trabalhista nº 0001234-56.2025.5.04.0104");
  });

  it("valor e PIX", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("R$ 3.600,00");
    expect(txt).toContain("PIX (Chave: 034.994.430-07)");
    expect(txt).toContain("seja em espécie (moeda corrente nacional) ou transferência bancária");
  });

  it("foro configurável com texto completo", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("foro da comarca de Pelotas – Rio Grande do Sul");
    expect(txt).toContain("artigo 64 do Código de Processo Civil de 2015");
  });

  it("data por extenso", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("Pelotas – Rio Grande do Sul, 5 de junho de 2026.");
  });

  it("cláusula quarta com Gratuidade Judiciária", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("Gratuidade Judiciária");
  });

  it("cláusula sexta até primeira instância", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("até a primeira instância");
  });

  it("placeholders quando faltam dados", () => {
    const txt = montarContrato({ signatarios: [{ nome: "Dr. X" }], dataHoje: "2026-06-05" });
    expect(txt).toContain("[NOME/RAZÃO SOCIAL DO CONTRATANTE]");
    expect(txt).toContain("[CPF/CNPJ]");
    expect(txt).toContain("[Comarca/UF]");
  });

  it("múltiplos signatários — plural e assinaturas", () => {
    const txt = montarContrato({
      ...base,
      signatarios: [
        { nome: "Dra. Ana Souza", oab: "OAB/RS 123.456" },
        { nome: "Dr. Carlos Lima", oab: "OAB/RS 654.321" },
      ],
    });
    expect(txt).toContain("pagará aos CONTRATADOS");
    expect(txt).toContain("São OBRIGAÇÕES DOS CONTRATADOS");
    expect(txt).toContain("Dra. Ana Souza, advogado(a), inscrito(a) na OAB/RS 123.456, e Dr. Carlos Lima");
    expect(txt).toContain("Dr. Carlos Lima\nCONTRATADO");
  });

  it("forma de pagamento parcelado", () => {
    const txt = montarContrato({ ...base, formaPagamento: "Parcelado" });
    expect(txt).toContain("de forma parcelada");
  });

  it("bloco de assinaturas e testemunhas", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("João da Silva");
    expect(txt).toContain("CONTRATANTE");
    expect(txt).toContain("Testemunhas:");
    expect(txt).toContain("1______________________________     CPF:");
  });

  it("parágrafo 'justos e contratados' e duas vias", () => {
    const txt = montarContrato(base);
    expect(txt).toContain("justos e contratados");
    expect(txt).toContain("2 (duas) vias de igual teor");
  });

  it("honorário fixo/parcelado — usa o valor informado", () => {
    const txt = montarContrato({ ...base, tipoHonorario: "fixo_parcelado" });
    expect(txt).toContain("a quantia de R$ 3.600,00");
  });

  it("honorário recorrente — quantia mensal e assessoria continuada", () => {
    const txt = montarContrato({ ...base, tipoHonorario: "recorrente", valorMensal: 800 });
    expect(txt).toContain("quantia mensal de");
    expect(txt).toContain("800,00");
    expect(txt).toContain("assessoria jurídica");
  });

  it("honorário ad exitum — percentual sobre proveito econômico", () => {
    const txt = montarContrato({
      ...base,
      tipoHonorario: "ad_exitum",
      valorCausa: 50000,
      percentualExito: 20,
    });
    expect(txt).toContain("honorários de êxito equivalentes a 20%");
    expect(txt).toContain("proveito econômico");
    expect(txt).toContain("50.000,00");
  });

  it("honorário fixo + êxito — entrada fixa mais percentual", () => {
    const txt = montarContrato({
      ...base,
      tipoHonorario: "fixo_exitum",
      valorEntrada: 2000,
      valorCausa: 50000,
      percentualExito: 30,
    });
    expect(txt).toContain("quantia fixa de");
    expect(txt).toContain("2.000,00");
    expect(txt).toContain("êxito equivalentes a 30%");
  });
});
