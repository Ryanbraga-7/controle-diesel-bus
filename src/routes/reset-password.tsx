import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PasswordInput } from "@/components/PasswordInput";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { traduzirErroAuth } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Controle Diesel Bus" },
      { name: "description", content: "Crie uma nova senha para sua conta do Controle Diesel Bus." },
      { property: "og:title", content: "Redefinir senha — Controle Diesel Bus" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!pw.trim()) {
      return setMsg({ t: "Por favor, digite sua nova senha.", err: true });
    }
    if (pw.length < 6) {
      return setMsg({ t: "A senha deve ter no mínimo 6 caracteres.", err: true });
    }
    setBusy(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg({ t: traduzirErroAuth(error), err: true });
    nav({ to: "/" });
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} noValidate className="card-glass w-full max-w-md space-y-4 p-8">
        <h1 className="text-2xl font-bold">Nova senha</h1>
        <p className="text-sm text-muted-foreground">Escolha uma nova senha para acessar sua conta.</p>
        <PasswordInput minLength={6} required placeholder="Mínimo de 6 caracteres" value={pw} onChange={(e) => setPw(e.target.value)} />
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "Salvando..." : "Salvar nova senha"}</button>
        {msg && <p className={`text-sm ${msg.err ? "text-destructive" : "text-success"}`}>{msg.t}</p>}
      </form>
    </main>
  );
}

