/**
 * Header editorial do dashboard, no padrão "nosso trabalho" do DS (§4):
 * título grande à esquerda, descrição curta embaixo à direita.
 * Sem emoji — o DS proíbe (§7).
 */
export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="mb-[clamp(36px,4.5vw,64px)] flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <p className="text-xs font-normal tracking-[0.18em] text-subtle-fg uppercase">
          reservatrack
        </p>
        <h1 className="mt-4 max-w-3xl font-brand text-[clamp(34px,4.4vw,58px)] leading-[0.95] font-light tracking-[-0.045em] text-carvao lowercase">
          controle suas reservas do <span className="text-coral">whatsapp</span>
        </h1>
        <p className="mt-3 max-w-xl text-[clamp(15px,1.1vw,17px)] leading-relaxed text-muted-fg">
          acompanhe quais campanhas geram reservas, receita e retorno — e
          decida, com dados, onde continuar investindo.
        </p>
      </div>
      {children}
    </section>
  );
}
