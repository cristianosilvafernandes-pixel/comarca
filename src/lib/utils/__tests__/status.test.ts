import { describe, it, expect } from "vitest";
import { resolveStatus } from "../status";

const HOJE = "2026-06-05";

describe("resolveStatus", () => {
  it("respeita fatos registrados", () => {
    expect(resolveStatus("pago", "2026-06-01", HOJE)).toBe("pago");
    expect(resolveStatus("pago_verificacao", "2026-06-01", HOJE)).toBe("pago_verificacao");
  });
  it("atrasado quando vencimento < hoje", () => {
    expect(resolveStatus("em_aberto", "2026-06-04", HOJE)).toBe("atrasado");
  });
  it("vencendo de 0 a 2 dias", () => {
    expect(resolveStatus("em_aberto", "2026-06-05", HOJE)).toBe("vencendo");
    expect(resolveStatus("em_aberto", "2026-06-07", HOJE)).toBe("vencendo");
  });
  it("pendente acima de 2 dias", () => {
    expect(resolveStatus("em_aberto", "2026-06-08", HOJE)).toBe("pendente");
  });
});
