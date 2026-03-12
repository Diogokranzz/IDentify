import Link from "next/link";
import AdminLoginForm from "./AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-20">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <section className="glass-card grid w-full max-w-5xl gap-10 p-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between gap-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              IDentify Admin
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight">
              Controle total com autenticação forte, antifraude e auditoria.
            </h1>
            <p className="mt-4 text-base text-[color:var(--ink-soft)]">
              Painel dedicado para administradores com acesso por SSO e 2FA. Todas as ações
              ficam registradas para compliance e segurança operacional.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-[color:var(--ink-soft)]">
            <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/40 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-xs font-semibold">
                01
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink)]">SSO corporativo</p>
                <p>Login integrado com provedor de identidade e tokens validados.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/40 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-xs font-semibold">
                02
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink)]">2FA obrigatório</p>
                <p>Código TOTP para reforçar acesso e reduzir risco.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-white/60 bg-white/40 p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/70 text-xs font-semibold">
                03
              </span>
              <div>
                <p className="font-semibold text-[color:var(--ink)]">Auditoria completa</p>
                <p>Logs por administrador para rastreio de alterações.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="self-end rounded-full border border-white/60 px-4 py-2 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-white/50"
          >
            Voltar para a página inicial
          </Link>
          <div className="rounded-[28px] border border-white/60 bg-white/50 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">
              Login
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Entrar como admin</h2>
            <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
              Use credenciais com 2FA ou autentique via SSO.
            </p>

            <div className="mt-6">
              <AdminLoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
