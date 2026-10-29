import { describe, it, expect } from "vitest";
import { parseImportRows, parseNumero, parseData } from "./import";
import { alertasConsumo } from "./fuel";

describe("importar planilha", () => {
  it("lê números brasileiros", () => expect(parseNumero("1.234,56")).toBe(1234.56));
  it("lê data dd/mm/aaaa e do Excel", () => {
    expect(parseData("05/03/2026")).toBe("2026-03-05");
    expect(parseData(46086)).toBe("2026-03-05");
  });
  it("aceita colunas do CSV exportado e aponta linhas inválidas", () => {
    const { ok, erros } = parseImportRows([
      { Data: "2026-01-02", "Ônibus": "Bus 1", Litros: "100", "Preço/L": "6,15", "Odômetro": "1000", "Observação": "" },
      { Data: "31/02/2026", "Ônibus": "Bus 1", Litros: "10", "Preço/L": "6" },
    ]);
    expect(ok[0]).toMatchObject({ onibus: "Bus 1", litros: 100, preco_litro: 6.15, odometro: 1000 });
    expect(erros).toEqual([3]);
  });
});

const r = (odo: number, l: number) => ({ id: String(odo), data: "2026-01-01", onibus: "A", litros: l, preco_litro: 6, odometro: odo, observacao: null });
describe("alerta de consumo", () => {
  it("avisa quando o último trecho cai mais de 15%", () => {
    // média 3 km/L, último 2 km/L
    expect(alertasConsumo([r(0, 50), r(300, 100), r(600, 100), r(800, 100)])[0]?.onibus).toBe("A");
  });
  it("não avisa com queda pequena", () => {
    expect(alertasConsumo([r(0, 50), r(300, 100), r(580, 100)])).toEqual([]);
  });
});
