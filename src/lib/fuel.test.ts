import { describe, it, expect } from "vitest";
import { consumoPorOnibus, totalOf, metricasPorAbastecimento, ultimoOdometroPorOnibus } from "./fuel";

const r = (o: string, odo: number | null, l: number, data = "2026-01-01") => ({
  id: o + odo + data,
  data,
  onibus: o,
  litros: l,
  preco_litro: 6,
  odometro: odo,
  observacao: null,
});

describe("fuel", () => {
  it("total = litros × preço", () => expect(totalOf({ litros: 100, preco_litro: 6.15 })).toBe(615));
  it("km/L uses distance between odometers over litres refilled", () => {
    const c = consumoPorOnibus([r("A", 1000, 50), r("A", 1300, 100)]);
    expect(c[0]?.kmPorLitro).toBe(3);
  });
  it("ignores buses with a single reading", () => expect(consumoPorOnibus([r("B", 500, 40)])).toEqual([]));

  it("calcula metricas individuais por abastecimento", () => {
    const r1 = r("A", 1000, 50, "2026-01-01");
    const r2 = r("A", 1300, 100, "2026-01-05");
    const map = metricasPorAbastecimento([r1, r2]);
    expect(map.get(r1.id)?.kmTrecho).toBeNull();
    expect(map.get(r2.id)?.kmTrecho).toBe(300);
    expect(map.get(r2.id)?.kmPorLitro).toBe(3);
    expect(map.get(r2.id)?.odometroAnterior).toBe(1000);
  });

  it("retorna o ultimo odometro de cada onibus", () => {
    const r1 = r("Ônibus 01", 12000, 50);
    const r2 = r("Ônibus 01", 12500, 60);
    const r3 = r("Ônibus 02", 8000, 40);
    const ultimos = ultimoOdometroPorOnibus([r1, r2, r3]);
    expect(ultimos.get("Ônibus 01")).toBe(12500);
    expect(ultimos.get("Ônibus 02")).toBe(8000);
  });
});

