"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Mode = "password" | "sso";
type AdminProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  totpEnabled: boolean;
};

export default function AdminLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [setupQr, setSetupQr] = useState<string | null>(null);
  const [setupOtpAuth, setSetupOtpAuth] = useState<string | null>(null);
  const [totpInput, setTotpInput] = useState("");

  const needs2fa = useMemo(() => {
    return Boolean(token && admin && !admin.totpEnabled);
  }, [token, admin]);

  function redirectToPanel() {
    setTimeout(() => {
      router.push("/admin/painel");
    }, 400);
  }

  async function callApi(endpoint: string, payload: Record<string, string>) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao autenticar");
      }

      if (data.token) {
        localStorage.setItem("identifyToken", data.token);
        setToken(data.token);
        const profile = await fetchProfile(data.token);
        setAdmin(profile);
        if (profile && !profile.totpEnabled) {
          await autoSetup2fa(data.token);
          setSuccess("2FA pendente. Escaneie o QR e valide o código.");
        } else {
          setSuccess("Autenticado com sucesso.");
          redirectToPanel();
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha inesperada";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(activeToken: string): Promise<AdminProfile | null> {
    const response = await fetch(`${API_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${activeToken}` },
    });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data.admin as AdminProfile;
  }

  async function autoSetup2fa(activeToken: string) {
    const response = await fetch(`${API_URL}/auth/2fa/setup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeToken}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Falha ao configurar 2FA");
    }
    setSetupQr(data.qr || null);
    setSetupOtpAuth(data.otpauth || null);
  }

  async function verifyTotp() {
    if (!token) {
      setError("Token ausente. Faça login novamente.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_URL}/auth/2fa/verify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ totp: totpInput }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao validar 2FA");
      }
      const profile = await fetchProfile(token);
      setAdmin(profile);
      setSuccess("2FA ativado com sucesso.");
      setTotpInput("");
      redirectToPanel();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha inesperada";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const totp = String(formData.get("totp") || "").trim();
    const payload: Record<string, string> = { email, password };
    if (totp.length === 6) {
      payload.totp = totp;
    }
    await callApi("/auth/login", payload);
  }

  async function onSsoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const idToken = String(formData.get("idToken") || "");
    await callApi("/auth/sso", { idToken });
  }

  return (
    <div className="grid gap-6">
      <div className="flex gap-3 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-full px-4 py-2 transition ${
            mode === "password"
              ? "bg-[color:var(--accent)] text-white shadow-[0_12px_24px_rgba(22,151,166,0.3)]"
              : "border border-white/70 text-[color:var(--ink)]"
          }`}
        >
          Credenciais
        </button>
        <button
          type="button"
          onClick={() => setMode("sso")}
          className={`rounded-full px-4 py-2 transition ${
            mode === "sso"
              ? "bg-[color:var(--accent)] text-white shadow-[0_12px_24px_rgba(22,151,166,0.3)]"
              : "border border-white/70 text-[color:var(--ink)]"
          }`}
        >
          SSO
        </button>
      </div>

      {mode === "password" ? (
        <form className="grid gap-4" onSubmit={onPasswordSubmit}>
          <label className="grid gap-2 text-xs font-semibold text-[color:var(--ink-soft)]">
            Email admin
            <input
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]"
              name="email"
              type="email"
              placeholder="admin@identify.local"
              required
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold text-[color:var(--ink-soft)]">
            Senha
            <input
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]"
              name="password"
              type="password"
              placeholder="********"
              required
            />
          </label>
          <label className="grid gap-2 text-xs font-semibold text-[color:var(--ink-soft)]">
            Código 2FA (TOTP)
            <input
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]"
              name="totp"
              type="text"
              placeholder="123456"
            />
          </label>

          <button
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(22,151,166,0.28)] transition hover:-translate-y-0.5"
            type="submit"
            disabled={loading}
          >
            {loading ? "Autenticando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form className="grid gap-4" onSubmit={onSsoSubmit}>
          <label className="grid gap-2 text-xs font-semibold text-[color:var(--ink-soft)]">
            ID Token do provedor
            <input
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]"
              name="idToken"
              type="text"
              placeholder="cole o id_token"
              required
            />
          </label>
          <button
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(22,151,166,0.28)] transition hover:-translate-y-0.5"
            type="submit"
            disabled={loading}
          >
            {loading ? "Validando..." : "Entrar via SSO"}
          </button>
        </form>
      )}

      {needs2fa ? (
        <div className="grid gap-4 rounded-3xl border border-white/60 bg-white/60 p-4">
          <div className="grid gap-1">
            <p className="text-sm font-semibold">Ativar 2FA</p>
            <p className="text-xs text-[color:var(--ink-soft)]">
              Escaneie o QR no Authenticator e valide o código de 6 dígitos.
            </p>
          </div>
          {setupQr ? (
            <img
              src={setupQr}
              alt="QR code 2FA"
              className="h-40 w-40 rounded-3xl border border-white/70 bg-white/80 p-3"
            />
          ) : (
            <button
              type="button"
              className="rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
              onClick={() => token && autoSetup2fa(token)}
            >
              Gerar QR
            </button>
          )}

          {setupOtpAuth ? (
            <p className="break-all rounded-2xl border border-white/70 bg-white/70 p-3 text-[11px] text-[color:var(--ink-soft)]">
              {setupOtpAuth}
            </p>
          ) : null}

          <div className="grid gap-2">
            <input
              className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-[color:var(--ink)]"
              placeholder="Digite o código de 6 dígitos"
              value={totpInput}
              onChange={(event) => setTotpInput(event.target.value)}
            />
            <button
              type="button"
              onClick={verifyTotp}
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_32px_rgba(22,151,166,0.28)] transition hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? "Validando..." : "Validar 2FA"}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-emerald-700">{success}</p> : null}
    </div>
  );
}
