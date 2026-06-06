import { describe, it, expect } from "vitest";
import { limiteDoPlano, podeAdicionar, atingiuLimite, mensagemLimite } from "../planos";

describe("limiteDoPlano", () => {
  it("free", () => {
    expect(limiteDoPlano("free", "clientes")).toBe(3);
    expect(limiteDoPlano("free", "honorarios")).toBe(5);
    expect(limiteDoPlano("free", "lembretes")).toBe(10);
  });
  it("essencial", () => {
    expect(limiteDoPlano("essencial", "clientes")).toBe(10);
    expect(limiteDoPlano("essencial", "honorarios")).toBe(20);
    expect(limiteDoPlano("essencial", "lembretes")).toBe(50);
  });
  it("profissional ilimitado", () => {
    expect(limiteDoPlano("profissional", "clientes")).toBe(Infinity);
  });
});

describe("podeAdicionar / atingiuLimite", () => {
  it("free clientes", () => {
    expect(podeAdicionar("free", "clientes", 2)).toBe(true);
    expect(podeAdicionar("free", "clientes", 3)).toBe(false);
    expect(atingiuLimite("free", "clientes", 3)).toBe(true);
  });
  it("profissional nunca bloqueia", () => {
    expect(podeAdicionar("profissional", "clientes", 9999)).toBe(true);
  });
});

describe("mensagemLimite", () => {
  it("inclui sugestão de upgrade", () => {
    expect(mensagemLimite("free", "clientes")).toContain("Essencial");
    expect(mensagemLimite("essencial", "honorarios")).toContain("Profissional");
  });
});
