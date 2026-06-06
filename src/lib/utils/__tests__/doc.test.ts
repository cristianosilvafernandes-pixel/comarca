import { describe, it, expect } from "vitest";
import { isValidCNPJ, maskCNPJ, maskDoc, isValidDoc } from "../doc";

describe("isValidCNPJ", () => {
  it("aceita CNPJ válido", () => {
    expect(isValidCNPJ("11.444.777/0001-61")).toBe(true);
    expect(isValidCNPJ("11444777000161")).toBe(true);
  });
  it("rejeita inválidos", () => {
    expect(isValidCNPJ("11.444.777/0001-60")).toBe(false);
    expect(isValidCNPJ("00000000000000")).toBe(false);
    expect(isValidCNPJ("123")).toBe(false);
  });
});

describe("maskCNPJ", () => {
  it("aplica máscara", () => {
    expect(maskCNPJ("11444777000161")).toBe("11.444.777/0001-61");
  });
});

describe("maskDoc", () => {
  it("CPF até 11 dígitos, CNPJ acima", () => {
    expect(maskDoc("52998224725")).toBe("529.982.247-25");
    expect(maskDoc("11444777000161")).toBe("11.444.777/0001-61");
  });
});

describe("isValidDoc", () => {
  it("valida CPF ou CNPJ", () => {
    expect(isValidDoc("529.982.247-25")).toBe(true);
    expect(isValidDoc("11.444.777/0001-61")).toBe(true);
    expect(isValidDoc("123")).toBe(false);
  });
});
