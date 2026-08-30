"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";

const AUTHORIZED_EMAIL = "Leandro.dias.moreira4@gmail.com";

const fieldStyle = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d7c8b5",
  background: "#fffdf8",
  borderRadius: 8,
} as const;

const buttonStyle = {
  border: 0,
  borderRadius: 999,
  padding: "12px 18px",
  cursor: "pointer",
  background: "#292620",
  color: "#f7f1e7",
} as const;

export default function PrimeiroAcessoPage() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function createAccount(event: FormEvent) {
    event.preventDefault();
    setMessage("");

    if (!supabase) {
      setMessage("Supabase não está configurado neste ambiente.");
      return;
    }
    if (password.length < 8) {
      setMessage("Crie uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: AUTHORIZED_EMAIL,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
      },
    });
    setLoading(false);

    if (error) {
      setMessage(error.message.includes("already registered")
        ? "Esta conta já foi criada. Volte ao login administrativo."
        : `Não foi possível criar o acesso: ${error.message}`);
      return;
    }

    setDone(true);
    setMessage(data.session
      ? "Acesso criado. Você já pode entrar no painel administrativo."
      : "Acesso criado. Confira seu e-mail para confirmar a conta e depois entre no painel.");
  }

  return (
    <section style={{ minHeight: "78svh", padding: "140px 6vw 90px", background: "#f7f1e7" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div className="eyebrow">Administração · Primeiro acesso</div>
        <h1 className="serif" style={{ fontSize: "clamp(42px,6vw,68px)", lineHeight: .95, fontWeight: 400, margin: "18px 0" }}>
          Crie sua senha de acesso
        </h1>
        <p className="muted" style={{ lineHeight: 1.7 }}>
          Este cadastro é restrito ao e-mail previamente autorizado. Sua senha é criada diretamente no Supabase e não é enviada para terceiros.
        </p>

        <form onSubmit={createAccount} style={{ display: "grid", gap: 12, marginTop: 28 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
            E-mail autorizado
            <input style={{ ...fieldStyle, color: "#71695d" }} value={AUTHORIZED_EMAIL} readOnly aria-readonly="true" />
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
            Nova senha
            <input style={fieldStyle} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required disabled={done} />
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 13 }}>
            Confirmar senha
            <input style={fieldStyle} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} minLength={8} required disabled={done} />
          </label>
          {!done && <button style={buttonStyle} disabled={loading}>{loading ? "Criando acesso…" : "Criar meu acesso"}</button>}
        </form>

        {message && <div style={{ marginTop: 18, padding: 14, border: "1px solid #d7c8b5", borderRadius: 10 }}>{message}</div>}
        <p style={{ marginTop: 24, fontSize: 13 }}><Link href="/admin" className="text-link">Voltar ao login</Link></p>
      </div>
    </section>
  );
}
