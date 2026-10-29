export type Abastecimento = {
  id: string;
  data: string;
  onibus: string;
  litros: number;
  preco_litro: number;
  odometro: number | null;
  observacao: string | null;
  motorista?: string | null;
  foto_path?: string | null;
};

export const totalOf = (r: Pick<Abastecimento, "litros" | "preco_litro">) =>
  Math.round(r.litros * r.preco_litro * 100) / 100;

/** Trechos (km/L) de cada ônibus, em ordem de odômetro. */
function trechosPorOnibus(records: Abastecimento[]) {
  const byBus = new Map<string, Abastecimento[]>();
  for (const r of records) {
    if (r.odometro == null) continue;
    const k = r.onibus.trim();
    byBus.set(k, [...(byBus.get(k) ?? []), r]);
  }
  const out = new Map<string, { km: number; litros: number }[]>();
  for (const [onibus, list] of byBus) {
    const s = [...list].sort((a, b) => a.odometro! - b.odometro!);
    const t: { km: number; litros: number }[] = [];
    for (let i = 1; i < s.length; i++) {
      const d = s[i]!.odometro! - s[i - 1]!.odometro!;
      if (d > 0 && s[i]!.litros > 0) t.push({ km: d, litros: s[i]!.litros });
    }
    out.set(onibus, t);
  }
  return out;
}

/** km/L por ônibus: distância entre odômetros consecutivos ÷ litros do abastecimento seguinte. */
export function consumoPorOnibus(records: Abastecimento[]) {
  const out: { onibus: string; kmPorLitro: number; km: number }[] = [];
  for (const [onibus, t] of trechosPorOnibus(records)) {
    const km = t.reduce((s, x) => s + x.km, 0), litros = t.reduce((s, x) => s + x.litros, 0);
    if (litros > 0) out.push({ onibus, km, kmPorLitro: km / litros });
  }
  return out.sort((a, b) => a.onibus.localeCompare(b.onibus));
}

/** Alerta quando o último trecho fica mais de 15% abaixo da média dos trechos anteriores do ônibus. */
export const LIMITE_QUEDA = 0.15;
export function alertasConsumo(records: Abastecimento[]) {
  const out: { onibus: string; ultimo: number; media: number; queda: number }[] = [];
  for (const [onibus, t] of trechosPorOnibus(records)) {
    if (t.length < 2) continue;
    const ant = t.slice(0, -1), last = t[t.length - 1]!;
    const media = ant.reduce((s, x) => s + x.km, 0) / ant.reduce((s, x) => s + x.litros, 0);
    const ultimo = last.km / last.litros;
    const queda = 1 - ultimo / media;
    if (queda > LIMITE_QUEDA) out.push({ onibus, ultimo, media, queda });
  }
  return out.sort((a, b) => b.queda - a.queda);
}

/** Preço médio ponderado do litro por mês (yyyy-MM). */
export function precoMedioPorMes(records: Abastecimento[], meses: string[]) {
  return meses.map((m) => {
    const rs = records.filter((r) => r.data.startsWith(m));
    const l = rs.reduce((s, r) => s + r.litros, 0);
    return { mes: m, preco: l ? rs.reduce((s, r) => s + totalOf(r), 0) / l : null };
  });
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const num = (n: number, d = 0) => n.toLocaleString("pt-BR", { maximumFractionDigits: d });

export type MetricaAbastecimento = {
  kmTrecho: number | null;
  kmPorLitro: number | null;
  odometroAnterior: number | null;
};

/** Calcula km rodados e km/L individuais para cada abastecimento com odômetro. */
export function metricasPorAbastecimento(records: Abastecimento[]): Map<string, MetricaAbastecimento> {
  const byBus = new Map<string, Abastecimento[]>();
  for (const r of records) {
    if (r.odometro == null) continue;
    const k = r.onibus.trim().toLowerCase();
    byBus.set(k, [...(byBus.get(k) ?? []), r]);
  }
  const map = new Map<string, MetricaAbastecimento>();
  for (const [, list] of byBus) {
    // Ordena por data e depois odômetro
    const sorted = [...list].sort((a, b) => {
      const cmpData = a.data.localeCompare(b.data);
      if (cmpData !== 0) return cmpData;
      return (a.odometro ?? 0) - (b.odometro ?? 0);
    });
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]!;
      if (i === 0) {
        map.set(cur.id, { kmTrecho: null, kmPorLitro: null, odometroAnterior: null });
      } else {
        const prev = sorted[i - 1]!;
        const km = (cur.odometro ?? 0) - (prev.odometro ?? 0);
        if (km > 0 && cur.litros > 0) {
          map.set(cur.id, {
            kmTrecho: km,
            kmPorLitro: km / cur.litros,
            odometroAnterior: prev.odometro,
          });
        } else {
          map.set(cur.id, { kmTrecho: null, kmPorLitro: null, odometroAnterior: prev.odometro });
        }
      }
    }
  }
  return map;
}

/** Retorna o último (maior) odômetro registrado para cada ônibus. */
export function ultimoOdometroPorOnibus(records: Abastecimento[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of records) {
    if (r.odometro == null) continue;
    const k = r.onibus.trim();
    const cur = out.get(k);
    if (cur === undefined || r.odometro > cur) {
      out.set(k, r.odometro);
    }
  }
  return out;
}

