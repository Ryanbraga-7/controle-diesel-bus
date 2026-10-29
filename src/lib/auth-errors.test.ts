import { describe, it, expect } from "vitest";
import { traduzirErroAuth } from "./auth-errors";

describe("auth-errors", () => {
  it("traduz credenciais invalidas", () => {
    expect(traduzirErroAuth("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
  });

  it("traduz usuario ja registrado", () => {
    expect(traduzirErroAuth({ message: "User already registered" })).toBe("Este e-mail já possui uma conta cadastrada. Tente entrar.");
  });

  it("traduz tamanho minimo de senha", () => {
    expect(traduzirErroAuth("Password should be at least 6 characters.")).toBe("A senha deve ter no mínimo 6 caracteres.");
  });

  it("traduz rate limit", () => {
    expect(traduzirErroAuth("Email rate limit exceeded")).toBe("Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.");
  });

  it("retorna fallback se erro vazio", () => {
    expect(traduzirErroAuth(null)).toBe("Ocorreu um erro inesperado.");
  });
});

