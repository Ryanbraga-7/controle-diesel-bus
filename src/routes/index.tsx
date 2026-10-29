import { createFileRoute, Link } from "@tanstack/react-router";
import { PasswordInput } from "@/components/PasswordInput";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Fuel, Bus, Receipt, TrendingUp, Gauge, LogOut, Download, Pencil, Trash2, Plus, Search, X, LoaderCircle, Sun, Moon, FileText, Upload, Camera, Users, AlertTriangle, ImageIcon, FileSpreadsheet, ChevronLeft, ChevronRight, RotateCcw, ExternalLink } from "lucide-react";
import { brl, num, totalOf, consumoPorOnibus, metricasPorAbastecimento, ultimoOdometroPorOnibus, type Abastecimento } from "@/lib/fuel";
import { brazilianToIso, isoToBrazilian, maskBrazilianDate, todayIso } from "@/lib/date";
import { exportarParaCsv, exportarParaExcel } from "@/lib/export";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { alertasConsumo } from "@/lib/fuel";
import { parseImportRows } from "@/lib/import";
import { setTema, useTema } from "@/lib/theme";
import { FleetCharts } from "@/components/FleetCharts";
import { CadastrosDialog, type Item } from "@/components/Cadastros";
import { traduzirErroAuth } from "@/lib/auth-errors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Controle Diesel Bus — Gestão de abastecimentos" },
      { name: "description", content: "Controle de abastecimentos, gastos e consumo de diesel da sua frota de ônibus." },
      { property: "og:title", content: "Controle Diesel Bus" },
      { property: "og:description", content: "Gastos, litros e consumo km/L da frota em um só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (!ready) return <div className="min-h-screen" />;
  return session ? <Dashboard email={session.user.email ?? ""} userId={session.user.id} /> : <Auth />;
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-10 place-items-center rounded-xl btn-primary"><Bus className="size-5" /></div>
      <div className="leading-tight">
        <div className="font-display text-base font-bold">Controle Diesel</div>
        <div className="text-xs text-muted-foreground">BUS · Gestão de abastecimentos</div>
      </div>
    </div>
  );
}

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);

    const emailLimpo = email.trim();
    if (!emailLimpo) {
      return setMsg({ t: "Por favor, preencha o seu e-mail.", err: true });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      return setMsg({ t: "Por favor, digite um endereço de e-mail válido (ex: seu.nome@empresa.com).", err: true });
    }
    if (!password) {
      return setMsg({ t: "Por favor, preencha a sua senha.", err: true });
    }
    if (password.length < 6) {
      return setMsg({ t: "A senha deve conter no mínimo 6 caracteres.", err: true });
    }

    setBusy(true);
    const { error, data } = mode === "in"
      ? await supabase.auth.signInWithPassword({ email: emailLimpo, password })
      : await supabase.auth.signUp({ email: emailLimpo, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) return setMsg({ t: traduzirErroAuth(error), err: true });
    if (mode === "up" && !data.session) setMsg({ t: "Conta criada com sucesso! Verifique o link de confirmação enviado para seu e-mail." });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) setMsg({ t: "Não foi possível entrar com Google no momento.", err: true });
  }

  async function forgot() {
    const emailLimpo = email.trim();
    if (!emailLimpo) return setMsg({ t: "Digite seu e-mail acima primeiro.", err: true });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      return setMsg({ t: "Digite um e-mail válido acima primeiro.", err: true });
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailLimpo, { redirectTo: window.location.origin + "/reset-password" });
    setBusy(false);
    if (error) return setMsg({ t: traduzirErroAuth(error), err: true });
    setMsg({ t: "Enviamos um link para redefinir sua senha para o seu e-mail." });
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Brand /></div>
        <div className="card-glass p-8">
          <h1 className="text-2xl font-bold">{mode === "in" ? "Bem-vindo de volta" : "Crie sua conta"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie os abastecimentos da sua frota.</p>
          <button onClick={google} className="btn btn-ghost mt-6 w-full">
            <svg className="size-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v2.9h5.35c-.25 1.5-1.7 4.3-5.35 4.3-3.2 0-5.85-2.65-5.85-5.9S8.8 6.5 12 6.5c1.85 0 3.05.8 3.75 1.45l2.55-2.45C16.7 4 14.6 3 12 3 7 3 3 7 3 12s4 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.3-1.1z"/></svg>
            Continuar com Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />ou<span className="h-px flex-1 bg-border" /></div>
          <form onSubmit={submit} noValidate className="space-y-3">
            <input
              className="field"
              type="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <PasswordInput
              placeholder="Senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button disabled={busy} className="btn btn-primary w-full">
              {busy ? "Carregando..." : mode === "in" ? "Entrar" : "Criar conta"}
            </button>
          </form>
          {msg && <p className={`mt-4 text-sm ${msg.err ? "text-destructive" : "text-success"}`}>{msg.t}</p>}
          <div className="mt-6 flex justify-between text-sm">
            <button className="text-muted-foreground hover:text-foreground" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
              {mode === "in" ? "Criar nova conta" : "Já tenho conta"}
            </button>
            {mode === "in" && <button className="text-muted-foreground hover:text-foreground" onClick={forgot}>Esqueci a senha</button>}
          </div>
        </div>
      </div>
    </main>
  );
}

const empty = () => ({ data: isoToBrazilian(todayIso()), onibus: "", litros: "", preco_litro: "", odometro: "", observacao: "", motorista: "" });

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (k: string) => {
  const [y = 2026, m = 1] = k.split("-").map(Number);
  const nome = MESES[m - 1] ?? "janeiro";
  return nome.charAt(0).toUpperCase() + nome.slice(1) + ` de ${y}`;
};

function Dashboard({ email, userId }: { email: string; userId: string }) {
  const tema = useTema();
  const [cadOnibus, setCadOnibus] = useState<Item[]>([]);
  const [cadMotoristas, setCadMotoristas] = useState<Item[]>([]);
  const [cadOpen, setCadOpen] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoKey, setFotoKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [cupomVisualizar, setCupomVisualizar] = useState<{ record: Abastecimento; url: string } | null>(null);
  const [carregandoFotoId, setCarregandoFotoId] = useState<string | null>(null);

  // Efeito para criar e limpar URL de preview do cupom no formulário
  useEffect(() => {
    if (!foto) {
      setFotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(foto);
    setFotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [foto]);

  async function loadCadastros() {
    const [a, b] = await Promise.all([supabase.from("onibus").select("id,nome").order("nome"), supabase.from("motoristas").select("id,nome").order("nome")]);
    setCadOnibus(a.data ?? []); setCadMotoristas(b.data ?? []);
  }
  useEffect(() => { loadCadastros(); }, []);
  const [records, setRecords] = useState<Abastecimento[]>([]);
  const [month, setMonth] = useState(todayIso().slice(0, 7));
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [q, setQ] = useState("");
  const [bus, setBus] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Abastecimento | null>(null);

  async function load() {
    const { data, error } = await supabase.from("abastecimentos").select("*").order("data", { ascending: false });
    if (error) { toast.error("Erro ao carregar registros."); return setMsg({ t: "Erro ao carregar registros.", err: true }); }
    setRecords((data ?? []).map((r) => ({ ...r, litros: Number(r.litros), preco_litro: Number(r.preco_litro), odometro: r.odometro == null ? null : Number(r.odometro) })));
  }
  useEffect(() => { load(); }, []);

  const metricas = useMemo(() => metricasPorAbastecimento(records), [records]);
  const ultimosOdometros = useMemo(() => ultimoOdometroPorOnibus(records), [records]);

  const monthRecs = records.filter((r) => r.data.startsWith(month));
  const spent = monthRecs.reduce((s, r) => s + totalOf(r), 0);
  const liters = monthRecs.reduce((s, r) => s + r.litros, 0);
  const consumo = useMemo(() => consumoPorOnibus(records), [records]);
  const frotaKm = consumo.reduce((s, c) => s + c.km, 0);
  const frotaKmL = consumo.length ? frotaKm / consumo.reduce((s, c) => s + c.km / c.kmPorLitro, 0) : 0;

  const chart = useMemo(() => {
    const [y = 2026, m = 1] = month.split("-").map(Number);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(y, m - 1 - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""), v: records.filter((r) => r.data.startsWith(key)).reduce((s, r) => s + totalOf(r), 0) };
    });
  }, [records, month]);

  const monthOptions = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 17, 1);
    const keys = new Set<string>([month, monthKey(now)]);
    for (const r of records) if (r.data?.slice(0, 7)) keys.add(r.data.slice(0, 7));
    for (let d = new Date(from); d <= now; d.setMonth(d.getMonth() + 1)) keys.add(monthKey(d));
    return [...keys].sort().reverse();
  }, [records, month]);

  const historyMonthOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const r of records) if (r.data?.slice(0, 7)) keys.add(r.data.slice(0, 7));
    return [...keys].sort().reverse();
  }, [records]);

  const alertas = useMemo(() => alertasConsumo(records), [records]);
  const max = Math.max(...chart.map((c) => c.v), 1);

  const buses = [...new Set([...records.map((r) => r.onibus), ...cadOnibus.map((o) => o.nome)])].sort();

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        const matchesBus = !bus || r.onibus === bus;
        const matchesMes = !filtroMes || r.data.startsWith(filtroMes);
        const searchTarget = `${r.onibus} ${r.motorista ?? ""} ${r.observacao ?? ""}`.toLowerCase();
        const matchesQ = !q || searchTarget.includes(q.toLowerCase());
        return matchesBus && matchesMes && matchesQ;
      })
      .sort((a, b) =>
        sort === "oldest"
          ? a.data.localeCompare(b.data)
          : sort === "highest"
          ? totalOf(b) - totalOf(a)
          : sort === "lowest"
          ? totalOf(a) - totalOf(b)
          : b.data.localeCompare(a.data)
      );
  }, [records, bus, filtroMes, q, sort]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, bus, filtroMes, sort, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    if (pageSize === -1) return filtered;
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const filteredSpent = useMemo(() => filtered.reduce((s, r) => s + totalOf(r), 0), [filtered]);
  const filteredLiters = useMemo(() => filtered.reduce((s, r) => s + r.litros, 0), [filtered]);
  const temFiltroAtivo = Boolean(q || bus || filtroMes || sort !== "newest");

  function limparFiltros() {
    setQ("");
    setBus("");
    setFiltroMes("");
    setSort("newest");
  }

  // Odometer helpers for current form
  const busSelecionado = form.onibus.trim();
  const ultimoOdoBus = busSelecionado ? ultimosOdometros.get(busSelecionado) : undefined;
  const odoDigitado = form.odometro ? Number(form.odometro) : null;
  const litrosDigitados = form.litros ? Number(form.litros) : null;

  async function save(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    if (saving) return;

    if (!form.data.trim()) {
      toast.error("Por favor, preencha a data do abastecimento.");
      return setMsg({ t: "Por favor, preencha a data do abastecimento.", err: true });
    }
    const data = brazilianToIso(form.data);
    if (!data) {
      toast.error("Digite uma data válida no formato dia/mês/ano (ex: 29/10/2026).");
      return setMsg({ t: "Digite uma data válida no formato dia/mês/ano (ex: 29/10/2026).", err: true });
    }
    if (!form.onibus.trim()) {
      toast.error("Por favor, escolha ou digite a identificação/placa do ônibus.");
      return setMsg({ t: "Por favor, escolha ou digite a identificação/placa do ônibus.", err: true });
    }
    const litrosNum = Number(form.litros);
    if (!form.litros || isNaN(litrosNum) || litrosNum <= 0) {
      toast.error("Por favor, informe a quantidade de litros abastecida.");
      return setMsg({ t: "Por favor, informe a quantidade de litros abastecida.", err: true });
    }
    const precoNum = Number(form.preco_litro);
    if (!form.preco_litro || isNaN(precoNum) || precoNum < 0) {
      toast.error("Por favor, informe o preço por litro do combustível.");
      return setMsg({ t: "Por favor, informe o preço por litro do combustível.", err: true });
    }

    const row = { data, onibus: form.onibus.trim(), litros: litrosNum, preco_litro: precoNum, odometro: form.odometro ? Number(form.odometro) : null, observacao: form.observacao.trim() || null, motorista: form.motorista.trim() || null } as Record<string, unknown>;
    const old = editing ? records.find((r) => r.id === editing) : null;
    setSaving(true);
    try {
      if (foto) {
        const ext = (foto.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from("cupons").upload(path, foto, { contentType: foto.type });
        if (up.error) throw up.error;
        row["foto_path"] = path;
      }
      const result = editing
        ? await supabase.from("abastecimentos").update(row as never).eq("id", editing).select("id").single()
        : await supabase.from("abastecimentos").insert(row as never).select("id").single();
      if (result.error) throw result.error;
      if (foto && old?.foto_path) await supabase.storage.from("cupons").remove([old.foto_path]);
      setFoto(null); setFotoKey((k) => k + 1);
      toast.success(editing ? "Registro atualizado." : "Abastecimento salvo!");
      setForm({ ...empty(), data: form.data }); setEditing(null); await load();
    } catch {
      toast.error("Não foi possível salvar. Tente novamente.");
      setMsg({ t: "Não foi possível salvar. Tente novamente.", err: true });
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!pendingDelete || deleting) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      const { error } = await supabase.from("abastecimentos").delete().eq("id", id).select("id").single();
      if (error) throw error;
      if (pendingDelete.foto_path) await supabase.storage.from("cupons").remove([pendingDelete.foto_path]);
      setRecords((current) => current.filter((r) => r.id !== id));
      if (editing === id) { setEditing(null); setForm(empty()); }
      setPendingDelete(null);
      toast.success("Abastecimento excluído.");
    } catch { toast.error("Não foi possível excluir. Tente novamente."); }
    finally { setDeleting(false); }
  }

  function edit(r: Abastecimento) {
    setEditing(r.id);
    setMsg(null);
    setForm({ data: isoToBrazilian(r.data), onibus: r.onibus, litros: String(r.litros), preco_litro: String(r.preco_litro), odometro: r.odometro?.toString() ?? "", observacao: r.observacao ?? "", motorista: r.motorista ?? "" });
    document.getElementById("fuel-form")?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  async function verFoto(r: Abastecimento) {
    if (!r.foto_path) return;
    setCarregandoFotoId(r.id);
    try {
      const { data, error } = await supabase.storage.from("cupons").createSignedUrl(r.foto_path, 600);
      if (error || !data) throw error;
      setCupomVisualizar({ record: r, url: data.signedUrl });
    } catch {
      toast.error("Não foi possível carregar a foto do cupom.");
    } finally {
      setCarregandoFotoId(null);
    }
  }

  async function importar(file: File) {
    setImporting(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false, raw: file.name.toLowerCase().endsWith(".csv") });
      const sheet = wb.Sheets[wb.SheetNames[0] ?? ""];
      const rows = sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" }) : [];
      const { ok, erros } = parseImportRows(rows);
      if (!ok.length) { toast.error("Nenhuma linha válida. Use as colunas Data, Ônibus, Litros e Preço/L."); return; }
      const { error, data } = await supabase.from("abastecimentos").insert(ok).select("id");
      if (error) throw error;
      toast.success(`${data?.length ?? ok.length} abastecimentos importados.` + (erros.length ? ` Linhas ignoradas: ${erros.slice(0, 8).join(", ")}${erros.length > 8 ? "…" : ""}.` : ""));
      await load();
    } catch { toast.error("Não foi possível importar essa planilha."); }
    finally { setImporting(false); }
  }

  function exportCsv() {
    exportarParaCsv(filtered, metricas, `abastecimentos-${filtroMes || month}.csv`);
    toast.success("Arquivo CSV exportado com sucesso.");
  }

  function exportExcel() {
    exportarParaExcel(filtered, metricas, `abastecimentos-${filtroMes || month}.xlsx`);
    toast.success("Planilha Excel exportada com sucesso.");
  }

  const stats = [
    { icon: Receipt, label: "Total gasto", value: brl(spent), note: "No mês selecionado", hi: true },
    { icon: Fuel, label: "Diesel abastecido", value: `${num(liters, 1)} L`, note: `${monthRecs.length} abastecimentos` },
    { icon: TrendingUp, label: "Preço médio/L", value: brl(liters ? spent / liters : 0), note: "Média ponderada" },
    { icon: Gauge, label: "Consumo da frota", value: frotaKmL ? `${num(frotaKmL, 2)} km/L` : "—", note: "Baseado no odômetro" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Brand />
          <div className="flex items-center gap-2">
            <Button variant="secondary" aria-label={tema === "dark" ? "Modo claro" : "Modo escuro"} title={tema === "dark" ? "Modo claro" : "Modo escuro"} onClick={() => setTema(tema === "dark" ? "light" : "dark")} className="btn btn-ghost px-3 py-2">{tema === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
            <span className="hidden min-w-0 items-center gap-2 text-sm text-muted-foreground sm:flex"><span className="size-2 shrink-0 rounded-full bg-success" /><span className="max-w-64 truncate">{email}</span></span>
            <Button variant="secondary" aria-label="Sair" title="Sair" onClick={() => supabase.auth.signOut()} className="btn btn-ghost px-3 py-2"><LogOut className="size-4" /><span className="hidden sm:inline">Sair</span></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary">PAINEL DE CONTROLE</p>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">Visão geral da <span className="text-gradient">frota</span></h1>
          </div>
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <Button variant="secondary" onClick={() => setCadOpen(true)} className="btn btn-ghost h-11"><Users className="size-4" />Ônibus e motoristas</Button>
            <Link to="/relatorio" search={{ mes: month }} className="btn btn-ghost h-11"><FileText className="size-4" />Relatório</Link>
            <label className="w-full text-sm text-muted-foreground sm:w-auto">Mês de referência
              <select className="field mt-1 sm:min-w-[190px]" value={month} onChange={(e) => setMonth(e.target.value)}>
                {monthOptions.map((k) => <option key={k} value={k}>{monthLabel(k)}</option>)}
              </select>
            </label>
          </div>
        </section>

        {alertas.length > 0 && (
          <section role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
            <div className="flex items-center gap-2 font-bold text-destructive"><AlertTriangle className="size-5" />Atenção ao consumo</div>
            <ul className="mt-2 space-y-1 text-sm">
              {alertas.map((a) => <li key={a.onibus}><b>{a.onibus}</b> fez {num(a.ultimo, 2)} km/L no último abastecimento, {num(a.queda * 100)}% abaixo da média dele ({num(a.media, 2)} km/L). Vale verificar o ônibus.</li>)}
            </ul>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`card-glass p-5 ${s.hi ? "ring-1 ring-primary/40" : ""}`}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`grid size-8 place-items-center rounded-lg ${s.hi ? "btn-primary" : "bg-secondary text-accent"}`}><s.icon className="size-4" /></span>{s.label}
              </div>
              <div className="mt-4 break-words font-display text-2xl font-bold">{s.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.note}</div>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <div className="min-w-0 p-0 sm:p-6 lg:col-span-3">
            <h2 className="text-lg font-bold">Gastos mensais</h2>
            <p className="text-sm text-muted-foreground">Últimos seis meses</p>
            <div className="mt-6 flex h-56 items-end gap-1 sm:gap-3">
              {chart.map((c) => (
                <div key={c.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span title={brl(c.v)} className="w-full break-words text-center text-[10px] text-muted-foreground sm:text-[11px]">{c.v ? brl(c.v).replace(",00", "") : ""}</span>
                  <div title={`${c.label}: ${brl(c.v)}`} className={`w-full shrink-0 rounded-t-lg transition-all ${c.key === month ? "btn-primary" : "bg-secondary"}`} style={{ height: `${Math.max((c.v / max) * 165, 5)}px` }} />
                  <span className="text-xs capitalize text-muted-foreground">{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          <form id="fuel-form" onSubmit={save} noValidate className="min-w-0 scroll-mt-24 space-y-3 border-t border-border pt-6 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? "Editar abastecimento" : "Novo abastecimento"}</h2>
              {editing && <Button type="button" size="icon" variant="ghost" aria-label="Cancelar edição" title="Cancelar edição" disabled={saving} onClick={() => { setEditing(null); setForm(empty()); setMsg(null); }}><X className="size-4" /></Button>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Data</span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, data: isoToBrazilian(todayIso()) }))} className="text-[11px] font-medium text-primary hover:underline">Hoje</button>
                </div>
                <input className="field" type="text" inputMode="numeric" placeholder="dd/mm/aaaa" required maxLength={10} value={form.data} onChange={(e) => setForm({ ...form, data: maskBrazilianDate(e.target.value) })} />
              </div>
              <L t="Ônibus / placa">{cadOnibus.length ? (
                <select className="field" required value={form.onibus} onChange={(e) => setForm({ ...form, onibus: e.target.value })}>
                  <option value="">Escolha…</option>
                  {[...new Set([...cadOnibus.map((o) => o.nome), ...(form.onibus ? [form.onibus] : [])])].map((n) => <option key={n}>{n}</option>)}
                </select>
              ) : <input className="field" required maxLength={40} list="buses" placeholder="Ônibus 01" value={form.onibus} onChange={(e) => setForm({ ...form, onibus: e.target.value })} />}</L>
              <L t="Litros"><input className="field" type="number" required min="0.001" step="0.001" placeholder="100" value={form.litros} onChange={(e) => setForm({ ...form, litros: e.target.value })} /></L>
              <L t="Preço por litro"><input className="field" type="number" required min="0" step="0.001" placeholder="6,15" value={form.preco_litro} onChange={(e) => setForm({ ...form, preco_litro: e.target.value })} /></L>
              <div className="space-y-1">
                <L t="Odômetro (km)"><input className="field" type="number" min="0" step="1" placeholder="Opcional" value={form.odometro} onChange={(e) => setForm({ ...form, odometro: e.target.value })} /></L>
                {ultimoOdoBus !== undefined && (
                  <div className="text-[11px] leading-tight">
                    {odoDigitado && odoDigitado > 0 ? (
                      odoDigitado < ultimoOdoBus ? (
                        <span className="font-semibold text-destructive">Atenção: menor que o anterior ({num(ultimoOdoBus)} km)</span>
                      ) : odoDigitado > ultimoOdoBus ? (
                        <span className="font-semibold text-emerald-500">
                          +{num(odoDigitado - ultimoOdoBus)} km {litrosDigitados && litrosDigitados > 0 ? `(~${num((odoDigitado - ultimoOdoBus) / litrosDigitados, 2)} km/L)` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Igual ao anterior</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">Último: {num(ultimoOdoBus)} km</span>
                    )}
                  </div>
                )}
              </div>
              <L t="Motorista">{cadMotoristas.length ? (
                <select className="field" value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })}>
                  <option value="">Opcional</option>
                  {[...new Set([...cadMotoristas.map((o) => o.nome), ...(form.motorista ? [form.motorista] : [])])].map((n) => <option key={n}>{n}</option>)}
                </select>
              ) : <input className="field" maxLength={60} placeholder="Opcional" value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} />}</L>
              <div className="col-span-2">
                <L t="Foto do cupom">
                  <label className="field flex cursor-pointer items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2 truncate">
                      <Camera className="size-4 shrink-0 text-primary" />
                      <span className="truncate">{foto ? foto.name : "Tirar foto ou escolher arquivo"}</span>
                    </span>
                    <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground">Procurar</span>
                    <input key={fotoKey} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const f = e.target.files?.[0] ?? null; if (f && f.size > 10 * 1024 * 1024) { toast.error("A foto deve ter até 10 MB."); return; } setFoto(f); }} />
                  </label>
                </L>
                {foto && fotoPreview && (
                  <div className="mt-2 flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-2">
                    <img src={fotoPreview} alt="Prévia do cupom" className="size-12 rounded border border-border object-cover" />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="truncate font-medium">{foto.name}</p>
                      <p className="text-muted-foreground">{(foto.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <Button type="button" size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10" title="Remover foto selecionada" onClick={() => { setFoto(null); setFotoKey((k) => k + 1); }}>
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="col-span-2">
                <L t="Posto / observação"><input className="field" maxLength={120} placeholder="Ex: Posto Ipiranga, abastecimento extra..." value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} /></L>
              </div>
            </div>
            <datalist id="buses">{buses.map((b) => <option key={b} value={b} />)}</datalist>
            {form.litros && form.preco_litro && <p className="text-sm text-muted-foreground">Total previsto: <b className="text-foreground">{brl(totalOf({ litros: +form.litros, preco_litro: +form.preco_litro }))}</b></p>}
            <Button type="submit" disabled={saving} className="btn btn-primary h-11 w-full">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{saving ? "Salvando..." : editing ? "Salvar alterações" : "Salvar abastecimento"}</Button>
            {msg && <p role="alert" className={`text-sm ${msg.err ? "text-destructive" : "text-success"}`}>{msg.t}</p>}
          </form>
        </section>

        <FleetCharts records={records} month={month} consumo={consumo} />

        <section className="min-w-0 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Histórico de abastecimentos</h2>
              <p className="text-sm text-muted-foreground">{filtered.length} registro(s) encontrado(s)</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className={`btn btn-ghost h-11 cursor-pointer ${importing ? "pointer-events-none opacity-50" : ""}`}>
                {importing ? <LoaderCircle className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {importing ? "Importando..." : "Importar planilha"}
                <input type="file" accept=".xlsx,.xls,.csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importar(f); }} />
              </label>
              <Button variant="secondary" onClick={exportExcel} className="btn btn-ghost h-11">
                <FileSpreadsheet className="size-4 text-emerald-500" />Exportar Excel
              </Button>
              <Button variant="secondary" onClick={exportCsv} className="btn btn-ghost h-11">
                <Download className="size-4" />Exportar CSV
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input className="field pl-9" placeholder="Buscar por ônibus, motorista ou posto..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="field" value={bus} onChange={(e) => setBus(e.target.value)}>
              <option value="">Todos os ônibus</option>
              {buses.map((b) => <option key={b}>{b}</option>)}
            </select>
            <select className="field" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="">Todos os meses</option>
              {historyMonthOptions.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <div className="flex gap-2">
              <select className="field flex-1" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="highest">Maior valor</option>
                <option value="lowest">Menor valor</option>
              </select>
              {temFiltroAtivo && (
                <Button variant="ghost" size="icon" onClick={limparFiltros} className="btn btn-ghost size-11 shrink-0" title="Limpar todos os filtros">
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {filtered.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-xs text-muted-foreground">
              <span>Exibindo <b>{filtered.length}</b> registros filtrados</span>
              <div className="flex flex-wrap items-center gap-4">
                <span>Total: <strong className="text-foreground">{brl(filteredSpent)}</strong></span>
                <span>Diesel: <strong className="text-foreground">{num(filteredLiters, 1)} L</strong></span>
                {filteredLiters > 0 && (
                  <span>Preço médio: <strong className="text-foreground">{brl(filteredSpent / filteredLiters)}</strong></span>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3 md:hidden">
            {paginated.map((r) => {
              const met = metricas.get(r.id);
              return (
                <article key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words font-semibold text-base">{r.onibus}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{isoToBrazilian(r.data)}</p>
                    </div>
                    <span className="shrink-0 font-bold text-primary text-base">{brl(totalOf(r))}</span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">Litros</dt>
                      <dd className="font-medium">{num(r.litros, 3)} L</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Preço/L</dt>
                      <dd className="font-medium">{brl(r.preco_litro)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Motorista</dt>
                      <dd className="break-words font-medium">{r.motorista ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Odômetro / Consumo</dt>
                      <dd className="font-medium">
                        {r.odometro != null ? `${num(r.odometro)} km` : "—"}
                        {met?.kmTrecho != null && (
                          <span className="block text-xs font-semibold text-emerald-500">
                            +{num(met.kmTrecho)} km ({num(met.kmPorLitro!, 2)} km/L)
                          </span>
                        )}
                      </dd>
                    </div>
                  </dl>
                  {r.observacao && <p className="mt-3 break-words rounded bg-secondary/50 p-2 text-xs text-muted-foreground">{r.observacao}</p>}
                  <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
                    {r.foto_path && (
                      <Button size="icon" variant="ghost" className="size-11 text-accent" aria-label="Ver foto do cupom" title="Ver foto do cupom" disabled={carregandoFotoId === r.id} onClick={() => verFoto(r)}>
                        {carregandoFotoId === r.id ? <LoaderCircle className="size-4 animate-spin" /> : <ImageIcon className="size-5" />}
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="size-11" aria-label="Editar abastecimento" title="Editar abastecimento" disabled={saving} onClick={() => edit(r)}><Pencil className="size-4" /></Button>
                    <Button size="icon" variant="ghost" className="size-11 text-destructive" aria-label="Excluir abastecimento" title="Excluir abastecimento" disabled={saving} onClick={() => setPendingDelete(r)}><Trash2 className="size-4" /></Button>
                  </div>
                </article>
              );
            })}
            {!filtered.length && <p className="py-10 text-center text-sm text-muted-foreground">Nenhum abastecimento encontrado.</p>}
          </div>

          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  {["Data", "Ônibus", "Motorista", "Litros", "Preço/L", "Total", "Odômetro / Trecho", "Observação", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => {
                  const met = metricas.get(r.id);
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                      <td className="px-3 py-3 whitespace-nowrap">{r.data.split("-").reverse().join("/")}</td>
                      <td className="px-3 py-3 font-semibold">{r.onibus}</td>
                      <td className="px-3 py-3">{r.motorista ?? "—"}</td>
                      <td className="px-3 py-3">{num(r.litros, 3)} L</td>
                      <td className="px-3 py-3">{brl(r.preco_litro)}</td>
                      <td className="px-3 py-3 font-bold text-primary">{brl(totalOf(r))}</td>
                      <td className="px-3 py-3">
                        <div>
                          <span>{r.odometro != null ? `${num(r.odometro)} km` : "—"}</span>
                          {met?.kmTrecho != null && (
                            <div className="text-[11px] text-muted-foreground leading-tight" title={`Odômetro anterior: ${num(met.odometroAnterior!)} km`}>
                              <span className="text-emerald-500 font-semibold">+{num(met.kmTrecho)} km</span> · <b>{num(met.kmPorLitro!, 2)} km/L</b>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-3 text-muted-foreground" title={r.observacao ?? ""}>{r.observacao ?? "—"}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          {r.foto_path && (
                            <Button size="icon" variant="ghost" aria-label="Ver foto do cupom" title="Ver foto do cupom" disabled={carregandoFotoId === r.id} onClick={() => verFoto(r)}>
                              {carregandoFotoId === r.id ? <LoaderCircle className="size-4 animate-spin" /> : <ImageIcon className="size-4 text-accent" />}
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" aria-label="Editar abastecimento" title="Editar abastecimento" disabled={saving} onClick={() => edit(r)}><Pencil className="size-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Excluir abastecimento" title="Excluir abastecimento" disabled={saving} onClick={() => setPendingDelete(r)} className="text-destructive"><Trash2 className="size-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={9} className="px-3 py-12 text-center text-muted-foreground">Nenhum abastecimento encontrado.</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>Itens por página:</span>
                <select className="field w-auto py-1 text-xs" value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))}>
                  <option value={15}>15</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={-1}>Todos</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span>Página {page} de {totalPages}</span>
                <Button variant="ghost" size="icon" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="size-9" title="Página anterior">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="size-9" title="Próxima página">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      <CadastrosDialog open={cadOpen} onOpenChange={setCadOpen} onibus={cadOnibus} motoristas={cadMotoristas} reload={loadCadastros} />

      {/* Visualizador Modal de Cupom Fiscal */}
      <Dialog open={!!cupomVisualizar} onOpenChange={(open) => { if (!open) setCupomVisualizar(null); }}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-xl sm:max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprovante / Cupom Fiscal</DialogTitle>
            <DialogDescription>
              {cupomVisualizar && `${cupomVisualizar.record.onibus} · ${isoToBrazilian(cupomVisualizar.record.data)} · ${brl(totalOf(cupomVisualizar.record))}`}
            </DialogDescription>
          </DialogHeader>
          {cupomVisualizar && (
            <div className="mt-3 space-y-4">
              <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-border bg-black/10 p-2">
                <img src={cupomVisualizar.url} alt="Comprovante de abastecimento" className="max-h-[62vh] w-auto max-w-full rounded object-contain shadow" />
              </div>
              <div className="flex justify-between items-center gap-2 pt-2 border-t border-border">
                <a href={cupomVisualizar.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost text-xs">
                  <ExternalLink className="size-4" />Abrir imagem original
                </a>
                <Button variant="secondary" onClick={() => setCupomVisualizar(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => { if (!open && !deleting) setPendingDelete(null); }}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-lg">
          <AlertDialogHeader><AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle><AlertDialogDescription className="break-words">{pendingDelete && `${pendingDelete.onibus} · ${isoToBrazilian(pendingDelete.data)} · ${brl(totalOf(pendingDelete))}. `}Esta exclusão é definitiva.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel><Button variant="destructive" disabled={deleting} onClick={remove}>{deleting ? <LoaderCircle className="animate-spin" /> : <Trash2 />}{deleting ? "Excluindo..." : "Excluir abastecimento"}</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function L({ t, children }: { t: string; children: React.ReactNode }) {
  return <label className="block space-y-1 text-xs font-semibold text-muted-foreground">{t}{children}</label>;
}
