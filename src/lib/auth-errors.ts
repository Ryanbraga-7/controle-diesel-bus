export function traduzirErroAuth(erro: unknown): string {
  if (!erro) return "Ocorreu um erro inesperado.";
  const msg = typeof erro === "string" ? erro : (erro as { message?: string }).message || "";
  const m = msg.toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "Este e-mail já possui uma conta cadastrada. Tente entrar.";
  }
  if (m.includes("password should be at least 6 characters") || m.includes("at least 6 characters")) {
    return "A senha deve ter no mínimo 6 caracteres.";
  }
  if (m.includes("email not confirmed")) {
    return "E-mail ainda não confirmado. Verifique o link enviado para sua caixa de entrada.";
  }
  if (m.includes("rate limit") || m.includes("over_email_send_rate_limit")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.";
  }
  if (m.includes("invalid format") || m.includes("unable to validate email")) {
    return "Formato de e-mail inválido. Verifique o endereço digitado.";
  }
  if (m.includes("new password should be different")) {
    return "A nova senha deve ser diferente da anterior.";
  }
  if (m.includes("token has expired") || m.includes("invalid token")) {
    return "O link de recuperação expirou ou é inválido. Solicite um novo link.";
  }
  if (m.includes("once every 60 seconds")) {
    return "Por segurança, aguarde 1 minuto para solicitar um novo link de redefinição.";
  }
  if (m.includes("signup requires a valid password")) {
    return "Por favor, digite uma senha válida.";
  }
  if (m.includes("session missing") || m.includes("jwt")) {
    return "Sessão expirada. Por favor, entre novamente.";
  }

  return msg || "Não foi possível completar a solicitação. Tente novamente.";
}

