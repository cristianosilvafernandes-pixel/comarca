import { describe, it, expect } from "vitest";
import { normalizeWhatsApp, whatsappForWaMe, maskPhone } from "../phone";

describe("normalizeWhatsApp", () => {
  it("normaliza número com 11 dígitos (celular)", () => {
    expect(normalizeWhatsApp("(53) 99999-8888")).toBe("+5553999998888");
  });
  it("normaliza número com 10 dígitos (fixo)", () => {
    expect(normalizeWhatsApp("53 3222-1111")).toBe("+555332221111");
  });
  it("remove DDI 55 duplicado", () => {
    expect(normalizeWhatsApp("+55 53 99999-8888")).toBe("+5553999998888");
    expect(normalizeWhatsApp("5553999998888")).toBe("+5553999998888");
  });
  it("retorna null se inválido", () => {
    expect(normalizeWhatsApp("123")).toBeNull();
    expect(normalizeWhatsApp("")).toBeNull();
  });
});

describe("whatsappForWaMe", () => {
  it("gera dígitos com DDI para wa.me", () => {
    expect(whatsappForWaMe("(53) 99999-8888")).toBe("5553999998888");
  });
});

describe("maskPhone", () => {
  it("mascara celular e fixo", () => {
    expect(maskPhone("53999998888")).toBe("(53) 99999-8888");
    expect(maskPhone("5332221111")).toBe("(53) 3222-1111");
  });
});
