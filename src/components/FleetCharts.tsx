import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { brl, num, precoMedioPorMes, type Abastecimento } from "@/lib/fuel";

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--foreground)" }, labelStyle: { color: "var(--muted-foreground)" } };
const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false } as const;

export function FleetCharts({ records, month, consumo }: { records: Abastecimento[]; month: string; consumo: { onibus: string; kmPorLitro: number }[] }) {
  const precos = useMemo(() => {
    const [y = 2026, m = 1] = month.split("-").map(Number);
    const meses = Array.from({ length: 12 }, (_, i) => { const d = new Date(y, m - 12 + i, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; });
    return precoMedioPorMes(records, meses).map((p) => ({ ...p, label: MES_CURTO[Number(p.mes.slice(5)) - 1] }));
  }, [records, month]);
  const temPreco = precos.some((p) => p.preco != null);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="card-glass min-w-0 p-5">
        <h2 className="text-lg font-bold">Preço do litro</h2>
        <p className="text-sm text-muted-foreground">Média dos últimos 12 meses</p>
        <div className="mt-4 h-56">
          {temPreco ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={precos} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" {...axis} />
                <YAxis {...axis} domain={["auto", "auto"]} tickFormatter={(v: number) => num(v, 2)} />
                <Tooltip {...tip} formatter={(v: number) => [brl(v), "Preço/L"]} />
                <Line type="monotone" dataKey="preco" stroke="var(--primary)" strokeWidth={3} dot={{ r: 3, fill: "var(--primary)" }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="grid h-full place-items-center text-sm text-muted-foreground">Sem abastecimentos no período.</p>}
        </div>
      </div>
      <div className="card-glass min-w-0 p-5">
        <h2 className="text-lg font-bold">Consumo por ônibus</h2>
        <p className="text-sm text-muted-foreground">km/L, calculado pelo odômetro</p>
        <div className="mt-4 h-56">
          {consumo.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consumo} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="onibus" {...axis} />
                <YAxis {...axis} tickFormatter={(v: number) => num(v, 1)} />
                <Tooltip {...tip} cursor={{ fill: "var(--secondary)" }} formatter={(v: number) => [`${num(v, 2)} km/L`, "Consumo"]} />
                <Bar dataKey="kmPorLitro" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">Registre o odômetro em pelo menos dois abastecimentos do mesmo ônibus.</p>}
        </div>
      </div>
    </section>
  );
}
