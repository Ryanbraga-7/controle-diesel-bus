import { useState, type FormEvent } from "react";
import { Plus, Trash2, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type Item = { id: string; nome: string };

function Lista({ tabela, titulo, placeholder, itens, max, onChange }: { tabela: "onibus" | "motoristas"; titulo: string; placeholder: string; itens: Item[]; max: number; onChange: () => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [busca, setBusca] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletandoId, setDeletandoId] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const n = nome.trim();
    if (!n) {
      toast.error(`Por favor, digite o nome para o cadastro de ${titulo.toLowerCase()}.`);
      return;
    }
    if (busy) return;
    if (itens.some((i) => i.nome.trim().toLowerCase() === n.toLowerCase())) {
      toast.error(`"${n}" já está cadastrado.`);
      return;
    }
    setBusy(true);
    const { error } = await supabase.from(tabela).insert({ nome: n }).select("id").single();
    setBusy(false);
    if (error) { toast.error(error.code === "23505" ? `"${n}" já está cadastrado.` : "Não foi possível cadastrar."); return; }
    setNome(""); toast.success(`${n} cadastrado.`); await onChange();
  }
  async function del(i: Item) {
    if (deletandoId) return;
    setDeletandoId(i.id);
    try {
      const { error } = await supabase.from(tabela).delete().eq("id", i.id).select("id").single();
      if (error) throw error;
      toast.success(`${i.nome} removido.`); await onChange();
    } catch {
      toast.error("Não foi possível remover.");
    } finally {
      setDeletandoId(null);
    }
  }

  const filtrados = itens.filter((i) => !busca || i.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-w-0 flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm">{titulo} <span className="text-xs font-normal text-muted-foreground">({itens.length})</span></h3>
      </div>
      <form onSubmit={add} noValidate className="mt-2 flex gap-2">
        <input className="field" maxLength={max} placeholder={placeholder} value={nome} onChange={(e) => setNome(e.target.value)} />
        <Button type="submit" size="icon" className="btn btn-primary size-11 shrink-0" aria-label={`Adicionar ${titulo.toLowerCase()}`} disabled={busy}>{busy ? <LoaderCircle className="animate-spin" /> : <Plus />}</Button>
      </form>
      {itens.length > 5 && (
        <input
          type="text"
          className="field mt-2 py-1 text-xs"
          placeholder={`Filtrar ${titulo.toLowerCase()}...`}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      )}
      <ul className="mt-2 max-h-52 space-y-1 overflow-y-auto">
        {filtrados.map((i) => (
          <li key={i.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-1.5 text-sm">
            <span className="min-w-0 break-words">{i.nome}</span>
            <Button size="icon" variant="ghost" className="size-8 text-destructive hover:bg-destructive/10" aria-label={`Remover ${i.nome}`} disabled={deletandoId === i.id} onClick={() => del(i)}>
              {deletandoId === i.id ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            </Button>
          </li>
        ))}
        {!filtrados.length && <li className="py-3 text-center text-xs text-muted-foreground">{itens.length ? "Nenhum resultado para a busca." : "Nenhum cadastrado ainda."}</li>}
      </ul>
    </div>
  );
}

export function CadastrosDialog({ open, onOpenChange, onibus, motoristas, reload }: { open: boolean; onOpenChange: (o: boolean) => void; onibus: Item[]; motoristas: Item[]; reload: () => Promise<void> }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-lg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ônibus e motoristas</DialogTitle>
          <DialogDescription>Cadastre uma vez e depois é só escolher na lista ao registrar um abastecimento.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <Lista tabela="onibus" titulo="Ônibus" placeholder="Ônibus 01 / ABC-1234" itens={onibus} max={40} onChange={reload} />
          <Lista tabela="motoristas" titulo="Motoristas" placeholder="Nome do motorista" itens={motoristas} max={60} onChange={reload} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
