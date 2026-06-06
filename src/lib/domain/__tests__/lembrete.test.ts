import { describe, it, expect } from "vitest";
import { montarMensagemLembrete, montarLinkPublico, montarUrlWaMe } from "../lembrete";

const base = {
  clienteNome: "João Silva",
  processo: "0032847-21",
  area: "Trabalhista",
  tribunal: "TJRS",
  numero: 2,
  totalParcelas: 3,
  valor: 1200,
  vencimento: "2026-06-07",
  chavePix: "034.994.430-07",
  linkPublico: "https://comarca.app/h/abc123",
  advogadoNome: "Dr. Yago Caldeira",
  advogadoOab: "OAB/RS 107.295",
};

describe("montarMensagemLembrete", () => {
  it("inclui campos-chave", () => {
    const msg = montarMensagemLembrete(base).replace(/ /g, " ");
    expect(msg).toContain("Olá João Silva!");
    expect(msg).toContain("Parcela 2/3");
    expect(msg).toContain("R$ 1.200,00");
    expect(msg).toContain("Vence: 07/06/2026");
    expect(msg).toContain("(Trabalhista - TJRS)");
    expect(msg).toContain("034.994.430-07");
    expect(msg).toContain("https://comarca.app/h/abc123");
    expect(msg).toContain("Dr. Yago Caldeira - OAB/RS 107.295");
  });

  it("adiciona linha de boleto quando presente", () => {
    const msg = montarMensagemLembrete({ ...base, boleto: "34191790010104351004791020150008" });
    expect(msg).toContain("💳 Boleto: 34191790010104351004791020150008");
  });

  it("sem boleto não inclui a linha", () => {
    const msg = montarMensagemLembrete({ ...base, boleto: "" });
    expect(msg).not.toContain("💳 Boleto");
  });

  it("processo ausente vira 'Não informado'", () => {
    const msg = montarMensagemLembrete({ ...base, processo: null });
    expect(msg).toContain("Processo: Não informado");
  });
});

describe("montarLinkPublico", () => {
  it("monta /h/:token", () => {
    expect(montarLinkPublico("https://comarca.app", "abc")).toBe("https://comarca.app/h/abc");
    expect(montarLinkPublico("https://comarca.app/", "abc")).toBe("https://comarca.app/h/abc");
  });
});

describe("montarUrlWaMe", () => {
  it("monta url wa.me com DDI 55", () => {
    const url = montarUrlWaMe("(53) 99999-8888", "oi");
    expect(url).toBe("https://wa.me/5553999998888?text=oi");
  });
  it("null se telefone inválido", () => {
    expect(montarUrlWaMe("123", "oi")).toBeNull();
  });
});
