import { describe, it, expect } from "vitest";
import { computeLogoDims } from "../logo";

describe("computeLogoDims", () => {
  it("limita pela altura quando o logo é alto", () => {
    // 100x200 (retrato), maxW 170, maxH 18 -> h=18, w=9
    expect(computeLogoDims(100, 200, 170, 18)).toEqual({ w: 9, h: 18 });
  });

  it("limita pela largura quando o logo é largo", () => {
    // 400x100 (paisagem), maxW 170, maxH 18 -> h=18, w=72 (<=170)
    const r = computeLogoDims(400, 100, 170, 18);
    expect(r.h).toBe(18);
    expect(r.w).toBeCloseTo(72, 5);
  });

  it("reduz para caber na largura máxima", () => {
    // 1000x100, maxW 170, maxH 18 -> por altura w=180 > 170, então w=170, h=17
    const r = computeLogoDims(1000, 100, 170, 18);
    expect(r.w).toBe(170);
    expect(r.h).toBeCloseTo(17, 5);
  });

  it("retorna zero para dimensões inválidas", () => {
    expect(computeLogoDims(0, 0, 170, 18)).toEqual({ w: 0, h: 0 });
  });
});
