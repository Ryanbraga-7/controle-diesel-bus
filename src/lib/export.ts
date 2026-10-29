import * as XLSX from "xlsx";
import { brl, num, totalOf, type Abastecimento, type MetricaAbastecimento } from "./fuel";
import { isoToBrazilian } from "./date";

export function exportarParaExcel(
  records: Abastecimento[],
  metricas?: Map<string, MetricaAbastecimento>,
  nomeArquivo = "abastecimentos.xlsx"
) {
  const dados = records.map((r) => {
    const metrica = metricas?.get(r.id);
    return {
      "Data": isoToBrazilian(r.data),
      "Ônibus": r.onibus,
      "Motorista": r.motorista || "—",
      "Litros": r.litros,
      "Preço/Litro (R$)": r.preco_litro,
      "Total (R$)": totalOf(r),
      "Odômetro (km)": r.odometro ?? "—",
      "Km Rodados": metrica?.kmTrecho ? metrica.kmTrecho : "—",
      "Consumo (km/L)": metrica?.kmPorLitro ? Number(metrica.kmPorLitro.toFixed(2)) : "—",
      "Observação": r.observacao || "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(dados);

  // Ajusta largura estimada das colunas
  const colWidths = [
    { wch: 12 }, // Data
    { wch: 18 }, // Ônibus
    { wch: 20 }, // Motorista
    { wch: 12 }, // Litros
    { wch: 16 }, // Preço/L
    { wch: 14 }, // Total
    { wch: 15 }, // Odômetro
    { wch: 14 }, // Km Rodados
    { wch: 16 }, // Consumo
    { wch: 25 }, // Observação
  ];
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Abastecimentos");
  XLSX.writeFile(wb, nomeArquivo);
}

export function exportarParaCsv(
  records: Abastecimento[],
  metricas?: Map<string, MetricaAbastecimento>,
  nomeArquivo = "abastecimentos.csv"
) {
  const cabecalho = "Data;Ônibus;Motorista;Litros;Preço/L;Total;Odômetro;Km Rodados;Consumo (km/L);Observação";
  const linhas = records.map((r) => {
    const metrica = metricas?.get(r.id);
    return [
      r.data,
      r.onibus,
      r.motorista ?? "",
      num(r.litros, 3),
      num(r.preco_litro, 3),
      num(totalOf(r), 2),
      r.odometro ?? "",
      metrica?.kmTrecho ? num(metrica.kmTrecho) : "",
      metrica?.kmPorLitro ? num(metrica.kmPorLitro, 2) : "",
      (r.observacao ?? "").replace(/;/g, ","),
    ].join(";");
  });

  const blob = new Blob(["\ufeff" + [cabecalho, ...linhas].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}

