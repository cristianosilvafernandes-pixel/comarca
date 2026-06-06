import { describe, it, expect } from "vitest";
import { addDays, addMonths, lastDayOfMonth, monthsBetween, todayISO } from "../dates";

describe("addDays", () => {
  it("soma dias com virada de mês", () => {
    expect(addDays("2026-01-30", 15)).toBe("2026-02-14");
    expect(addDays("2026-06-05", 0)).toBe("2026-06-05");
  });
});

describe("addMonths", () => {
  it("soma meses preservando o dia", () => {
    expect(addMonths("2026-06-05", 1)).toBe("2026-07-05");
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
  });
  it("ajusta para o último dia quando não existe", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29"); // bissexto
  });
});

describe("lastDayOfMonth", () => {
  it("retorna o último dia", () => {
    expect(lastDayOfMonth(2026, 2)).toBe(28);
    expect(lastDayOfMonth(2024, 2)).toBe(29);
    expect(lastDayOfMonth(2026, 4)).toBe(30);
  });
});

describe("monthsBetween", () => {
  it("conta meses de calendário", () => {
    expect(monthsBetween("2026-01-10", "2026-04-02")).toBe(3);
    expect(monthsBetween("2026-06-05", "2026-06-25")).toBe(0);
  });
});

describe("todayISO", () => {
  it("formata data UTC", () => {
    expect(todayISO(new Date("2026-06-05T10:00:00Z"))).toBe("2026-06-05");
  });
});
