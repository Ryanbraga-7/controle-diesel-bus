import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput({
  onInvalid,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);

  function handleInvalid(e: React.InvalidEvent<HTMLInputElement>) {
    const t = e.currentTarget;
    if (t.validity.valueMissing) {
      t.setCustomValidity("Por favor, preencha a sua senha.");
    } else if (t.validity.tooShort) {
      t.setCustomValidity(`A senha deve ter no mínimo ${t.minLength} caracteres.`);
    } else {
      t.setCustomValidity("Preencha a senha corretamente.");
    }
    if (onInvalid) onInvalid(e);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.currentTarget.setCustomValidity("");
    if (onChange) onChange(e);
  }

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        onInvalid={handleInvalid}
        onChange={handleChange}
        className={`field pr-11 ${props.className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Esconder senha" : "Mostrar senha"}
        title={show ? "Esconder senha" : "Mostrar senha"}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

