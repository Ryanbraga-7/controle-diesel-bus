import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Download, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { alertasConsumo, brl, consumoPorOnibus, metricasPorAbastecimento, num, totalOf, type Abastecimento } from "@/lib/fuel";
import { isoToBrazilian, todayIso } from "@/lib/date";
import { exportarParaCsv, exportarParaExcel } from "@/lib/export";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const Route = createFileRoute("/relatorio")({
  validateSearch: (s: Record<string, unknown>) => ({ mes: typeof s["mes"] === "string" && /^\d{4}-\d{2}$/.test(s["mes"]) ? s["mes"] : todayIso().slice(0, 7) }),
  head: () => ({
    meta: [
      { title: "Relatório mensal — Controle Diesel Bus" },
      { name: "description", content: "Resumo mensal de gastos, litros e consumo de diesel da frota, pronto para imprimir." },
      { property: "og:title", content: "Relatório mensal — Controle Diesel Bus" },
      { property: "og:description", content: "Resumo mensal de diesel da frota pronto para imprimir ou salvar em PDF." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Relatorio,
});

function Relatorio() {
  const { mes } = Route.useSearch();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Abastecimento[] | null>(null);
  const [semLogin, setSemLogin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) return setSemLogin(true);
      const { data } = await supabase.from("abastecimentos").select("*").order("data");
      setRecords((data ?? []).map((r) => ({ ...r, litros: Number(r.litros), preco_litro: Number(r.preco_litro), odometro: r.odometro == null ? null : Number(r.odometro) })));
    })();
  }, []);

  const metricas = useMemo(() => (records ? metricasPorAbastecimento(records) : new Map()), [records]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    const keys = new Set<string>([mes, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`]);
    if (records) {
      for (const r of records) if (r.data?.slice(0, 7)) keys.add(r.data.slice(0, 7));
    }
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return [...keys].sort().reverse();
  }, [records, mes]);

  const rep = useMemo(() => {
    if (!records) return null;
    const doMes = records.filter((r) => r.data.startsWith(mes));
    const gasto = doMes.reduce((s, r) => s + totalOf(r), 0);
    const litros = doMes.reduce((s, r) => s + r.litros, 0);
    const ate = records.filter((r) => r.data <= `${mes}-31`);
    const consumo = consumoPorOnibus(ate);
    const porOnibus = [...new Set(doMes.map((r) => r.onibus))].sort().map((o) => {
      const rs = doMes.filter((r) => r.onibus === o);
      return { o, n: rs.length, l: rs.reduce((s, r) => s + r.litros, 0), g: rs.reduce((s, r) => s + totalOf(r), 0), kml: consumo.find((c) => c.onibus === o)?.kmPorLitro };
    });
    const frotaKm = consumo.reduce((s, c) => s + c.km, 0);
    const frotaLitros = consumo.reduce((s, c) => s + c.km / c.kmPorLitro, 0);
    const frotaKmL = frotaLitros > 0 ? frotaKm / frotaLitros : null;

    return { doMes, gasto, litros, porOnibus, frotaKmL, alertas: alertasConsumo(ate) };
  }, [records, mes]);

  const [y, m] = mes.split("-");
  const titulo = `${MESES[Number(m) - 1] ?? ""} de ${y}`;

  if (semLogin) return <main className="grid min-h-screen place-items-center p-6 text-center"><div><p>Entre na sua conta para ver o relatório.</p><Link to="/" className="btn btn-primary mt-4">Ir para o login</Link></div></main>;

  return (
    <div className="theme-light min-h-screen bg-background text-foreground">
      <div className="no-print mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-6 pt-6">
        <Link to="/" className="btn btn-ghost"><ArrowLeft className="size-4" />Voltar ao Painel</Link>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="field w-auto min-w-[170px] py-1.5 text-sm"
            value={mes}
            onChange={(e) => navigate({ to: "/relatorio", search: { mes: e.target.value } })}
          >
            {monthOptions.map((k) => {
              const [ano, mesNum] = k.split("-");
              const nome = MESES[Number(mesNum) - 1] ?? "";
              return <option key={k} value={k}>{nome.charAt(0).toUpperCase() + nome.slice(1)} de {ano}</option>;
            })}
          </select>
          {rep && rep.doMes.length > 0 && (
            <>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                title="Baixar planilha Excel do mês"
                onClick={() => exportarParaExcel(rep.doMes, metricas, `relatorio-${mes}.xlsx`)}
              >
                <FileSpreadsheet className="size-4 text-emerald-600" />Excel
              </button>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                title="Baixar arquivo CSV do mês"
                onClick={() => exportarParaCsv(rep.doMes, metricas, `relatorio-${mes}.csv`)}
              >
                <Download className="size-4" />CSV
              </button>
            </>
          )}
          <button className="btn btn-primary" onClick={() => window.print()} disabled={!rep}><Printer className="size-4" />Imprimir / Salvar PDF</button>
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <header className="flex items-end justify-between border-b-2 border-primary pb-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary">CONTROLE DIESEL BUS</p>
            <h1 className="mt-1 text-3xl font-bold">Relatório de <span className="capitalize">{titulo}</span></h1>
          </div>
          <p className="text-xs text-muted-foreground">Gerado em {isoToBrazilian(todayIso())}</p>
        </header>
        {!rep ? <p className="py-20 text-center text-muted-foreground">Carregando…</p> : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Total gasto</p>
                <p className="mt-1 font-display text-xl font-bold">{brl(rep.gasto)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Diesel abastecido</p>
                <p className="mt-1 font-display text-xl font-bold">{num(rep.litros, 1)} L</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Preço médio/L</p>
                <p className="mt-1 font-display text-xl font-bold">{brl(rep.litros ? rep.gasto / rep.litros : 0)}</p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">Consumo frota</p>
                <p className="mt-1 font-display text-xl font-bold">{rep.frotaKmL ? `${num(rep.frotaKmL, 2)} km/L` : "—"}</p>
              </div>
            </section>
            {rep.alertas.length > 0 && (
              <section className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                <h2 className="font-bold text-destructive">Atenção ao consumo</h2>
                <ul className="mt-1 text-sm">{rep.alertas.map((a) => <li key={a.onibus}><b>{a.onibus}</b>: {num(a.ultimo, 2)} km/L no último trecho, {num(a.queda * 100)}% abaixo da média ({num(a.media, 2)} km/L).</li>)}</ul>
              </section>
            )}
            <h2 className="mt-8 text-lg font-bold">Desempenho por ônibus</h2>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">Ônibus</th><th>Abast.</th><th>Litros</th><th>Gasto</th><th>km/L</th></tr></thead>
              <tbody>{rep.porOnibus.map((p) => <tr key={p.o} className="border-b border-border"><td className="py-2 font-semibold">{p.o}</td><td>{p.n}</td><td>{num(p.l, 1)} L</td><td>{brl(p.g)}</td><td>{p.kml ? `${num(p.kml, 2)} km/L` : "—"}</td></tr>)}</tbody>
            </table>
            <h2 className="mt-8 text-lg font-bold">Histórico de abastecimentos ({rep.doMes.length})</h2>
            <table className="mt-2 w-full text-sm">
              <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">Data</th><th>Ônibus</th><th>Motorista</th><th>Litros</th><th>Preço/L</th><th>Total</th><th>Odômetro</th><th>km/L</th></tr></thead>
              <tbody>{rep.doMes.map((r) => {
                const met = metricas.get(r.id);
                return (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-1.5">{isoToBrazilian(r.data)}</td>
                    <td>{r.onibus}</td>
                    <td>{r.motorista ?? "—"}</td>
                    <td>{num(r.litros, 1)} L</td>
                    <td>{brl(r.preco_litro)}</td>
                    <td className="font-semibold">{brl(totalOf(r))}</td>
                    <td>{r.odometro != null ? `${num(r.odometro)} km` : "—"}</td>
                    <td>{met?.kmPorLitro ? `${num(met.kmPorLitro, 2)}` : "—"}</td>
                  </tr>
                );
              })}</tbody>
            </table>
            {!rep.doMes.length && <p className="py-8 text-center text-muted-foreground">Nenhum abastecimento neste mês.</p>}
          </>
        )}
      </main>
    </div>
  );
}

