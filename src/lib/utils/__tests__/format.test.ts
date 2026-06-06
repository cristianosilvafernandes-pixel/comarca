import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  parseCurrencyToFloat,
  calculateDaysDifference,
} from "../format";

describe("formatCurrency", () => {
  it("formata em BRL", () => {
    expect(formatCurrency(1200)).toBe("R$ 1.200,00");
    expect(formatCurrency(1200.5)).toBe("R$ 1.200,50");
    expect(formatCurrency(0)).toBe("R$ 0,00");
  });
});

describe("formatDate", () => {
  it("converte ISO civil para dd/mm/aaaa sem deslocamento", () => {
    expect(formatDate("2026-06-05")).toBe("05/06/2026");
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
  });
});

describe("parseCurrencyToFloat", () => {
  it("faz parse de string pt-BR", () => {
    expect(parseCurrencyToFloat("R$ 1.200,50")).toBe(1200.5);
    expect(parseCurrencyToFloat("1.200,00")).toBe(1200);
    expect(parseCurrencyToFloat("350,90")).toBe(350.9);
    expect(parseCurrencyToFloat("")).toBe(0);
  });
});

describe("calculateDaysDifference", () => {
  it("conta dias civis", () => {
    expect(calculateDaysDifference("2026-06-05", "2026-06-07")).toBe(2);
    expect(calculateDaysDifference("2026-06-07", "2026-06-05")).toBe(-2);
    expect(calculateDaysDifference("2026-06-05", "2026-06-05")).toBe(0);
  });
});
