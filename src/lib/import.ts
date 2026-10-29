import { brazilianToIso } from "./date";

export type ImportRow = {
  data: string; onibus: string; litros: number; preco_litro: number;
  odometro: number | null; observacao: string | null; motorista: string | null;
};

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");

const KEYS: Record<string, keyof ImportRow> = {
  data: "data", onibus: "onibus", placa: "onibus", onibusplaca: "onibus", litros: "litros",
  precol: "preco_litro", precolitro: "preco_litro", precoporlitro: "preco_litro", preco: "preco_litro",
  odometro: "odometro", odometrokm: "odometro", km: "odometro",
  observacao: "observacao", obs: "observacao", posto: "observacao", postoobs: "observacao", motorista: "motorista",
};

/** Aceita número ou texto brasileiro ("1.234,56") ou com ponto decimal ("6.15"). */
export function parseNumero(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  let s = String(v ?? "").trim().replace(/[R$\sL]/g, "");
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Aceita dd/mm/aaaa, aaaa-mm-dd ou número de data do Excel. */
export function parseData(v: unknown): string | null {
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? brazilianToIso(`${m[1]!.padStart(2, "0")}/${m[2]!.padStart(2, "0")}/${m[3]}`) : null;
}

export function parseImportRows(rows: Record<string, unknown>[]) {
  const ok: ImportRow[] = []; const erros: number[] = [];
  rows.forEach((raw, i) => {
    const r: Partial<Record<keyof ImportRow, unknown>> = {};
    for (const [k, v] of Object.entries(raw)) { const key = KEYS[norm(k)]; if (key && r[key] === undefined) r[key] = v; }
    const data = parseData(r.data), litros = parseNumero(r.litros), preco = parseNumero(r.preco_litro);
    const onibus = String(r.onibus ?? "").trim().slice(0, 40);
    if (!data || !onibus || !litros || litros <= 0 || preco == null || preco < 0) { erros.push(i + 2); return; }
    const odo = parseNumero(r.odometro);
    const txt = (v: unknown, n: number) => { const t = String(v ?? "").trim(); return t ? t.slice(0, n) : null; };
    ok.push({ data, onibus, litros, preco_litro: preco, odometro: odo != null && odo >= 0 ? Math.round(odo) : null, observacao: txt(r.observacao, 120), motorista: txt(r.motorista, 60) });
  });
  return { ok, erros };
}
