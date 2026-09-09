"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * Hub de entrada da plataforma: escolhe entre os dois módulos.
 *
 * Segue o padrão editorial do DS: headline 300 grande com uma palavra em
 * coral, ar generoso, tudo em minúscula, e os módulos como blocos cinza de
 * raio grande em vez de cards com sombra.
 */

const modulos = [
  {
    href: "/painel",
    titulo: "reservatrack",
    subtitulo: "análise de campanhas e reservas.",
    numero: "01",
  },
  {
    href: "/gastos",
    titulo: "gastos",
    subtitulo: "controle de despesas do escritório.",
    numero: "02",
  },
];

export default function HubPage() {
  return (
    <div className="reveal flex min-h-[calc(100dvh-10.5rem)] flex-col justify-center">
      <p className="text-xs font-normal tracking-[0.18em] text-subtle-fg uppercase">
        growthdirect
      </p>
      <h1 className="mt-5 max-w-4xl font-brand text-[clamp(42px,6.2vw,100px)] leading-[0.9] font-light tracking-[-0.045em] text-carvao lowercase">
        o que você quer <span className="text-coral">abrir</span> hoje?
      </h1>

      <div className="mt-[clamp(36px,4.5vw,64px)] grid grid-cols-1 gap-[clamp(16px,1.8vw,28px)] md:grid-cols-2">
        {modulos.map(({ href, titulo, subtitulo, numero }) => (
          <Link
            key={href}
            href={href}
            className="group block rounded-[clamp(28px,3vw,44px)] bg-carvao-50 p-[clamp(32px,4vw,56px)] transition-colors duration-500 hover:bg-carvao"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="text-xs font-normal tracking-[0.18em] text-subtle-fg uppercase transition-colors duration-500 group-hover:text-branco/50">
                {numero}
              </span>
              {/* Seta padrão do DS (§7) dentro do badge circular do nav. */}
              <span className="flex size-11 items-center justify-center rounded-full bg-branco text-carvao transition-colors duration-500 group-hover:bg-coral group-hover:text-branco">
                <ArrowUpRight className="size-5 transition-transform duration-500 group-hover:rotate-45" />
              </span>
            </div>

            <h2 className="mt-[clamp(48px,7vw,110px)] font-brand text-[clamp(32px,4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase transition-colors duration-500 group-hover:text-branco">
              {titulo}
            </h2>
            <p className="mt-3 text-[clamp(15px,1.1vw,17px)] leading-relaxed font-normal text-muted-fg transition-colors duration-500 group-hover:text-branco/70">
              {subtitulo}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
