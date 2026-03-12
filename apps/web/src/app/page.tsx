"use client";

import { useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";

export default function Home() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(".js-hero-card", {
        opacity: 0,
        y: 18,
        scale: 0.985,
        filter: "blur(16px)",
      });
      gsap.set(".js-hero-item", {
        opacity: 0,
        y: 14,
        filter: "blur(12px)",
      });
      gsap.set(".js-orb", { opacity: 0, scale: 0.92 });

      gsap.to(".js-orb", {
        opacity: 1,
        scale: 1,
        duration: 1.2,
        ease: "power2.out",
        stagger: 0.1,
      });
      gsap.to(".js-hero-card", {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1.1,
        ease: "power3.out",
        delay: 0.1,
      });
      gsap.to(".js-hero-item", {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.85,
        ease: "power2.out",
        stagger: 0.08,
        delay: 0.25,
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-24">
      <div className="absolute inset-0 -z-10">
        <span className="orb orb-a js-orb" />
        <span className="orb orb-b js-orb" />
        <span className="orb orb-c js-orb" />
      </div>

      <section className="glass-card js-hero-card w-full max-w-3xl p-10">
        <div className="js-hero-item flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src="/brand/identify-logo.svg"
              alt="Logo IDentify"
              className="h-14 w-14"
            />
            <div>
              <p className="text-2xl font-semibold">IDentify</p>
              <p className="text-sm text-[color:var(--ink-soft)]">
                Reconhecimento facial com segurança e controle administrativo.
              </p>
            </div>
          </div>
          <span className="glass-chip rounded-full px-3 py-1 text-xs">Status online</span>
        </div>

        <div className="js-hero-item mt-10 grid gap-6 text-base text-[color:var(--ink-soft)]">
          <p>
            Plataforma pronta para integrar com catracas e controlar acessos em tempo real,
            com auditoria, antifraude e fluxo admin dedicado.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/50 bg-white/40 p-4">
              <p className="text-lg font-semibold text-[color:var(--ink)]">0.9s</p>
              <p className="text-xs">Tempo médio</p>
            </div>
            <div className="rounded-3xl border border-white/50 bg-white/40 p-4">
              <p className="text-lg font-semibold text-[color:var(--ink)]">99.1%</p>
              <p className="text-xs">Liveness</p>
            </div>
            <div className="rounded-3xl border border-white/50 bg-white/40 p-4">
              <p className="text-lg font-semibold text-[color:var(--ink)]">24/7</p>
              <p className="text-xs">Operação</p>
            </div>
          </div>
        </div>

        <div className="js-hero-item mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/admin/login"
            className="rounded-full bg-[color:var(--accent)] px-6 py-3 text-center text-sm font-semibold text-white shadow-[0_18px_32px_rgba(22,151,166,0.28)] transition hover:-translate-y-0.5"
          >
            Entrar no painel admin
          </Link>
          <Link
            href="/terminal"
            className="rounded-full border border-white/70 px-6 py-3 text-center text-sm font-semibold text-[color:var(--ink)] transition hover:bg-white/50"
          >
            Abrir terminal
          </Link>
          <Link
            href="/roadmap"
            className="rounded-full border border-white/60 px-6 py-3 text-center text-sm font-semibold text-[color:var(--ink)] transition hover:bg-white/50"
          >
            Ver roadmap do sistema
          </Link>
        </div>
      </section>
    </main>
  );
}
