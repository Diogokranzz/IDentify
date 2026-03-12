"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type AdminProfile = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  totpEnabled: boolean;
};

export default function SegurancaPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [otpAuth, setOtpAuth] = useState<string | null>(null);
  const [totpInput, setTotpInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("identifyToken");
    if (!stored) {
      router.replace("/admin/login");
      return;
    }
    setToken(stored);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    loadProfile();
  }, [token]);

  async function loadProfile() {
    try {
      const response = await fetch(`${API_URL}/admin/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        localStorage.removeItem("identifyToken");
        router.replace("/admin/login");
        return;
      }
      const data = await response.json();
      setAdmin(data.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar perfil");
    }
  }

  async function setup2fa() {
    if (!token) return;
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/auth/2fa/setup`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar QR");
      }
      setQr(data.qr || null);
      setOtpAuth(data.otpauth || null);
      setMessage("QR gerado. Valide o código para ativar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function verifyTotp() {
    if (!token) return;
    setLoading(true);
    setError("");
    setMessage("");
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
      await loadProfile();
      setMessage("2FA ativado.");
      setTotpInput("");
      setQr(null);
      setOtpAuth(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card mx-auto flex w-full max-w-4xl flex-col gap-8 p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Segurança
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Políticas de acesso</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Configure o 2FA e monitore o status de segurança.
            </p>
          </div>
          <Link
            href="/admin/painel"
            className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
          >
            Voltar
          </Link>
        </header>

        <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
          <p className="text-sm font-semibold">Status atual</p>
          <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
            2FA: {admin?.totpEnabled ? "Ativo" : "Pendente"}
          </p>
        </div>

        <div className="grid gap-4 rounded-3xl border border-white/60 bg-white/60 p-6">
          <div>
            <p className="text-sm font-semibold">Configurar 2FA</p>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Gere um novo QR e valide o código do Authenticator.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={setup2fa}
              className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-xs font-semibold text-white"
              disabled={loading}
            >
              {loading ? "Gerando..." : "Gerar QR"}
            </button>
          </div>

          {qr ? (
            <div className="grid gap-3">
              <img
                src={qr}
                alt="QR code 2FA"
                className="h-44 w-44 rounded-3xl border border-white/70 bg-white/80 p-3"
              />
              {otpAuth ? (
                <p className="break-all rounded-2xl border border-white/70 bg-white/70 p-3 text-[11px] text-[color:var(--ink-soft)]">
                  {otpAuth}
                </p>
              ) : null}
              <div className="grid gap-2">
                <input
                  className="rounded-2xl border border-white/70 bg-white/70 px-4 py-2 text-sm"
                  placeholder="Código 6 dígitos"
                  value={totpInput}
                  onChange={(event) => setTotpInput(event.target.value)}
                />
                <button
                  type="button"
                  onClick={verifyTotp}
                  className="rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                  disabled={loading}
                >
                  Validar 2FA
                </button>
              </div>
            </div>
          ) : null}

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </section>
    </main>
  );
}
