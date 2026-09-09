import { GastosProviders } from "./providers";

/**
 * Fronteira do módulo de gastos.
 *
 * A navegação do módulo fica no `Header` (ele deriva o módulo do pathname).
 * O `GastosProviders` carrega os dados de gastos só quando alguém entra em
 * `/gastos/*` — de propósito fora do `app/providers.tsx` global, para os dois
 * módulos não esperarem um pelo outro. Ver `GASTOS.md`.
 */
export default function GastosLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <GastosProviders>{children}</GastosProviders>;
}
