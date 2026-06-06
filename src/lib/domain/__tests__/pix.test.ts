import { describe, it, expect } from "vitest";
import { crc16, montarPixCopiaECola, pixCrcValido } from "../pix";

describe("crc16", () => {
  it("check value padrão CRC16-CCITT-FALSE", () => {
    expect(crc16("123456789")).toBe("29B1");
  });
});

describe("montarPixCopiaECola", () => {
  const brcode = montarPixCopiaECola({
    chave: "034.994.430-07",
    nomeRecebedor: "Yago Caldeira",
    cidade: "Pelotas",
    valor: 1200,
  });

  it("começa com Payload Format Indicator 000201", () => {
    expect(brcode.startsWith("000201")).toBe(true);
  });
  it("contém GUI do PIX e a chave", () => {
    expect(brcode).toContain("br.gov.bcb.pix");
    expect(brcode).toContain("034.994.430-07");
  });
  it("inclui moeda BRL (5303986) e país (5802BR)", () => {
    expect(brcode).toContain("5303986");
    expect(brcode).toContain("5802BR");
  });
  it("inclui valor formatado quando informado", () => {
    expect(brcode).toContain("54071200.00");
  });
  it("CRC final íntegro", () => {
    expect(pixCrcValido(brcode)).toBe(true);
  });
  it("sem valor gera PIX estático válido", () => {
    const estatico = montarPixCopiaECola({ chave: "x@y.com", nomeRecebedor: "Fulano", cidade: "Sao Paulo" });
    expect(estatico).not.toContain("5404");
    expect(pixCrcValido(estatico)).toBe(true);
  });
  it("sanitiza nome/cidade (ASCII maiúsculo sem acento)", () => {
    const bc = montarPixCopiaECola({ chave: "k", nomeRecebedor: "José Ção", cidade: "Brasília" });
    expect(bc).toContain("JOSE CAO");
    expect(bc).toContain("BRASILIA");
  });
});
