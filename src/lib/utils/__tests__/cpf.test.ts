import { describe, it, expect } from "vitest";
import { isValidCPF, maskCPF, onlyDigits } from "../cpf";

describe("isValidCPF", () => {
  it("aceita CPFs válidos", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true);
  });
  it("rejeita inválidos", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("")).toBe(false);
  });
});

describe("maskCPF", () => {
  it("aplica máscara progressiva", () => {
    expect(maskCPF("52998224725")).toBe("529.982.247-25");
    expect(maskCPF("529982")).toBe("529.982");
  });
});

describe("onlyDigits", () => {
  it("remove não-dígitos", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
  });
});
