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

export default function AdminPanelPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("identifyToken");
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    async function loadProfile() {
      try {
        const response = await fetch(`${API_URL}/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Sessão expirada");
        }
        const data = await response.json();
        setAdmin(data.admin as AdminProfile);
      } catch (err) {
        localStorage.removeItem("identifyToken");
        setError(err instanceof Error ? err.message : "Falha ao carregar perfil");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("identifyToken");
    router.push("/admin/login");
  }

  return (
    <main className="relative min-h-screen px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card mx-auto flex w-full max-w-5xl flex-col gap-8 p-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Painel Admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Bem-vindo ao IDentify</h1>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Controle central de cadastros e auditoria.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
            >
              Início
            </Link>
            <Link
              href="/admin/login"
              className="rounded-full border border-white/60 px-4 py-2 text-xs font-semibold"
            >
              Voltar
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(22,151,166,0.3)]"
            >
              Sair
            </button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-[color:var(--ink-soft)]">
            Carregando sessão...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-white/60 bg-white/50 p-6 text-sm text-red-600">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/60 bg-white/60 p-4">
                <p className="text-xs text-[color:var(--ink-soft)]">Admin logado</p>
                <p className="mt-2 text-lg font-semibold">{admin?.name}</p>
                <p className="text-xs text-[color:var(--ink-soft)]">{admin?.email}</p>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/60 p-4">
                <p className="text-xs text-[color:var(--ink-soft)]">Perfil</p>
                <p className="mt-2 text-lg font-semibold">{admin?.role}</p>
                <p className="text-xs text-[color:var(--ink-soft)]">
                  2FA {admin?.totpEnabled ? "Ativo" : "Pendente"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/60 p-4">
                <p className="text-xs text-[color:var(--ink-soft)]">Status</p>
                <p className="mt-2 text-lg font-semibold">{admin?.status}</p>
                <p className="text-xs text-[color:var(--ink-soft)]">Última atividade agora</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
                <p className="text-sm font-semibold">Cadastros</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Gerencie pessoas, blocos e áreas.
                </p>
                <Link
                  href="/admin/pessoas"
                  className="mt-4 inline-flex rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                >
                  Abrir registros
                </Link>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
                <p className="text-sm font-semibold">Cadastro facial</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Capture e vincule rostos aos registros.
                </p>
                <Link
                  href="/admin/faces"
                  className="mt-4 inline-flex rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                >
                  Abrir captura
                </Link>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
                <p className="text-sm font-semibold">Auditoria</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Acompanhe logins, alterações e bloqueios.
                </p>
                <Link
                  href="/admin/auditoria"
                  className="mt-4 inline-flex rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                >
                  Ver logs
                </Link>
              </div>
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6">
                <p className="text-sm font-semibold">Segurança</p>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Configurações de acesso e 2FA.
                </p>
                <Link
                  href="/admin/seguranca"
                  className="mt-4 inline-flex rounded-full border border-white/70 px-4 py-2 text-xs font-semibold"
                >
                  Ajustar políticas
                </Link>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
