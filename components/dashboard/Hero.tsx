export function Hero({ children }: { children?: React.ReactNode }) {
  return (
    <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-colonial/50">Olá, equipe 👋</p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-colonial sm:text-3xl">
          Controle suas reservas do WhatsApp
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-colonial/55">
          Acompanhe quais campanhas geram reservas, receita e retorno — e decida,
          com dados, onde continuar investindo.
        </p>
      </div>
      {children}
    </section>
  );
}
