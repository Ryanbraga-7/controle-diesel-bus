import { useSyncExternalStore } from "react";

export type Tema = "dark" | "light";
const KEY = "tema";
const listeners = new Set<() => void>();

function read(): Tema {
  try { return localStorage.getItem(KEY) === "light" ? "light" : "dark"; } catch { return "dark"; }
}
export function applyTema(t: Tema = read()) {
  document.documentElement.classList.toggle("light", t === "light");
}
export function setTema(t: Tema) {
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  applyTema(t);
  listeners.forEach((l) => l());
}
export function useTema() {
  return useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, read, () => "dark" as Tema);
}
