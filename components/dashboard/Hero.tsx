export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-colonial to-natural px-6 py-8 text-branco sm:px-10 sm:py-10">
      <p className="font-display text-2xl font-medium text-laranja sm:text-3xl">
        Olá, equipe 👋
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">
        Controle suas reservas do WhatsApp
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-branco/70 sm:text-base">
        Acompanhe quais campanhas geram reservas, receita e retorno — e decida,
        com dados, onde continuar investindo.
      </p>
      {children && <div className="mt-6">{children}</div>}
    </section>
  );
}
