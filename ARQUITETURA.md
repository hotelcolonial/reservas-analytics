# ReservaTrack — Análisis de arquitectura (base para modificaciones)

> Documento de contexto. Describe **cómo funciona hoy** la app y **qué reglas hay que
> respetar** al agregar features. Escrito el 2026-09-09 sobre el commit `c9e8239`.
> El `README.md` está **desactualizado** (describe la etapa de `localStorage` y un
> `lib/storage.ts` que ya no existe) — este archivo manda.

---

## 1. Qué es

Panel interno (sin login) para medir el retorno de campañas de marketing que generan
reservas de hotel. El equipo carga a mano: campañas, verba gastada por día, y reservas.
La app cruza esos tres datos y calcula ROI / ROAS / ticket medio / costo por reserva,
por campaña y por plataforma, con filtro de período.

Idioma de dominio y de la UI: **portugués (pt-BR)**. Los identificadores en el código
están en portugués (`campanha`, `reserva`, `gasto`, `propriedade`). Mantener esa
convención en todo lo nuevo.

## 2. Stack real

| Pieza | Versión / detalle |
|---|---|
| Next.js | **16.2.6**, App Router. `AGENTS.md` avisa: hay breaking changes vs. versiones previas — leer `node_modules/next/dist/docs/` antes de escribir código de framework |
| React | 19.2.4 |
| TypeScript | strict, alias `@/*` → raíz. `npx tsc --noEmit` pasa limpio hoy |
| Tailwind | **v4** (sin `tailwind.config`; los tokens viven en `app/globals.css` con `@theme`) |
| UI | **shadcn/ui oficial**, estilo `new-york`, sobre Radix. `components.json` presente |
| Iconos | `lucide-react` |
| Estado | **Zustand** (store único, sin middleware `persist`) |
| Gráficos | **Recharts 3** |
| Drag & drop | `@dnd-kit` (reordenar campañas) |
| Backend | **Supabase** (PostgREST) llamado **directo desde el navegador** con la anon key |
| Tests / CI | **no hay** |

## 3. Restricción arquitectónica #1 (la más importante)

**Toda la app es cliente.** Cada `page.tsx` empieza con `"use client"`. No hay Server
Components con datos, no hay Route Handlers (`app/api/**`), no hay Server Actions, no hay
sesión ni middleware. El navegador habla con Supabase usando `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Consecuencias para cualquier feature nueva:

- No existe lugar para secretos (API keys de terceros, webhooks, envío de mail). Si una
  modificación los necesita → hay que **crear** la capa de servidor (Route Handler o
  Server Action) que hoy no existe, y decidirlo explícitamente con la usuaria.
- No hay autenticación: quien tenga la URL ve y edita todo. Las políticas RLS reales del
  proyecto son permisivas (ver §7).
- Los datos se cargan **completos** al arrancar (las 4 tablas enteras) y todo el filtrado,
  ordenamiento, paginación y agregación ocurre en memoria. Escala bien hasta unos pocos
  miles de filas; más allá hay que mover el trabajo al servidor.

## 4. Modelo de datos

Cuatro entidades, en `lib/types.ts`. En Postgres las tablas son homónimas y en
`snake_case`; el mapeo ida/vuelta vive **entero** en `lib/supabase.ts`
(`rowToCampanha` / `campanhaToRow`, etc.).

```
propriedades ─┬─< campanhas ─┬─< gastos      (ON DELETE CASCADE)
              │              └─< reservas    (campanha_id ON DELETE SET NULL)
              ├─< reservas
              └─< gastos
```

- **Propriedade** — un hotel/pousada. `{ id, nome, ordem }`. Multipropiedad: todo el panel
  se recorta por la propiedad activa.
- **Campanha** — `{ id, propriedadeId, nome, plataforma, tipo, status, ordem }`.
  **No tiene presupuesto propio**: el investimento sale de la suma de `gastos`.
- **GastoDiario** — `{ id, propriedadeId, campanhaId, data, valor }`. La verba es variable
  y se carga día por día en `/verba`.
- **Reserva** — `{ id, propriedadeId, codigo, dataReserva, checkIn, checkOut, campanhaId,
  plataforma, valor, pax, noites, veioDaCampanha, status }`.

Enums (strings, no tipos SQL): `Plataforma` (google_ads | meta_ads | organico |
whatsapp_direto | outro), `TipoCampanha` (7 valores), `StatusCampanha` (ativa | pausada |
finalizada), `StatusReserva` (confirmada | pendente | cancelada).

**Detalles que hay que saber antes de tocar nada:**

1. **Las fechas son `text` en Postgres**, no `date`. Todo se guarda como ISO `yyyy-mm-dd` y
   se compara **lexicográficamente** (`a.data.localeCompare(b.data)`, `d < periodo.de`).
   Funciona, pero no hay validación en la base. `formatDate()` parte el string a mano
   justamente para no pasar por `new Date()` y evitar corrimientos de zona horaria — no
   reemplazarlo por `toLocaleDateString` sobre un `Date`.
2. **Los `id` son `text` y se generan en el cliente** con `crypto.randomUUID()` (`novoId()`
   en el store). No hay secuencias ni defaults en la base.
3. `codigo` de la reserva lo escribe la persona (ej. `RES-0001`) y **no tiene constraint de
   unicidad**: se pueden duplicar.
4. `noites` se calcula desde check-in/check-out pero es **editable**; una vez que la persona
   la toca, el auto-cálculo se apaga para esa edición (`noitesAuto` en `ReservationForm`).
5. `ordem` es un entero manual (drag & drop). No se expone en el formulario; el store asigna
   `max(ordem)+1` al crear y `setCampanhasOrdem` reescribe toda la lista al reordenar.

## 5. El store (`lib/store.ts`) — el corazón, y sus dos trampas

Store Zustand único, sin persist. Mantiene los datos **dos veces**:

- `campanhasAll` / `reservasAll` / `gastosAll` → todas las propiedades.
- `campanhas` / `reservas` / `gastos` → **solo la propiedad activa**. Es lo que leen las
  páginas. Se derivan con el helper `escopar()`.

### Trampa 1 — cada mutación debe re-ejecutar `escopar()`

Un `set()` que actualice `reservasAll` pero no vuelva a llamar `escopar(...)` deja la UI
congelada, sin error visible. Copiar siempre el patrón existente:

```ts
set((s) => {
  const reservasAll = /* nueva lista */;
  return {
    reservasAll,
    ...escopar(s.campanhasAll, reservasAll, s.gastosAll, s.propriedadeAtivaId),
  };
});
```

### Trampa 2 — la escritura a Supabase es optimista y "fire-and-forget"

Toda acción CRUD sigue exactamente esta forma: **primero** actualiza el estado local,
**después** dispara la llamada a Supabase sin `await`, y si falla solo hace
`console.error`. No hay rollback, ni reintento, ni toast, ni estado de "guardando".

Si la escritura falla, la pantalla muestra el dato como guardado hasta que se recargue la
página. **Es una decisión deliberada del diseño actual, no un bug pendiente.** Cualquier
feature nueva o mantiene ese patrón, o introduce manejo de errores de forma consciente y
consistente (esto sería una mejora legítima y bien acotada: centralizar el error en un
helper y mostrar un toast).

### Carga inicial

`app/providers.tsx` llama `loadData()` una vez y bloquea la app con un spinner hasta
`hydrated: true`. `loadData` trae las 4 tablas en paralelo con `fetchAll()`, que **pagina de
a 1000 filas** (PostgREST corta silenciosamente en 1000 con un `select` plano — no volver a
un `.select("*")` suelto).

### Modo mock

Si faltan las env vars, `supabaseConfigured` es `false` y la app corre con
`data/mockData.ts` en memoria, sin persistencia. Ojo: en modo mock **todos** los datos se
sellan como `propriedadeId: "colonial"`, así que la segunda propiedad aparece vacía.

### Propiedad activa

Se guarda en `localStorage` bajo `reservatrack:propriedade-ativa`. Es el **único** uso real
de localStorage junto con `campanhas-view` (grid/lista en `/campanhas`).

## 6. Cálculo de métricas (`lib/calculations.ts`)

Funciones puras, sin estado. Las páginas filtran por período **antes** de llamarlas.

```
receita         = Σ valor de reservas con status "confirmada"
investimento    = Σ valor de gastos
roi             = ((receita − investimento) / investimento) × 100
roas            = receita / investimento
ticketMedio     = receita / nº reservas confirmadas
custoPorReserva = investimento / nº reservas confirmadas
```

Toda división por cero devuelve `null`, y la capa de formato (`formatPercent`,
`formatMultiplier`, `formatNumber`) lo imprime como `"N/A"`. **Mantener ese contrato**:
nunca devolver `0` ni `Infinity` desde una métrica nueva.

### Reglas de negocio implícitas que conviene tener presentes

- **`veioDaCampanha` no se usa en ningún cálculo.** Es un campo puramente informativo
  ("¿la fecha de la reserva coincide con la campaña?"). La atribución real es solo
  `reserva.campanhaId`. Si se quiere que ese flag filtre la receita atribuida, hay que
  cambiar `calculations.ts` explícitamente.
- **`status` de reserva no se puede editar desde la UI.** Toda reserva nueva nace
  `"confirmada"`; el formulario no expone el campo (aunque el filtro de `/reservas` sí
  ofrece los tres valores). En la práctica hoy `receita` ≈ suma de todas las reservas.
  Si se quiere flujo de pendiente/cancelada, hay que agregar el control al formulario.
- **`totalReservas` cuenta todos los status; `receita` solo las confirmadas.** La tasa de
  confirmación del dashboard depende de eso.
- **Investimento por plataforma sale de `campanha.plataforma`, pero la receita por
  plataforma sale de `reserva.plataforma`**, que es un campo independiente y editable.
  Una reserva puede quedar en Meta Ads mientras su campaña es Google Ads, y entonces el ROI
  por plataforma se desalinea. El formulario hereda la plataforma al elegir campaña, pero
  se puede sobreescribir.
- **La tabla "Resumo de campanhas" del dashboard oculta las pausadas** (commit `c9e8239`),
  pero los cards de arriba **sí** incluyen su receita e investimento. Los totales no cierran
  con la suma de las filas visibles, a propósito.
- Los selectores de campaña usan `porOrdemSelecionaveis()`: esconden las pausadas, pero
  conservan la que ya está vinculada al registro que se edita, para no cambiarla en silencio.

## 7. Base de datos y seguridad

`supabase/schema.sql` crea las tablas; `supabase/migration-multipropriedade.sql` fue el paso
que agregó `propriedades` y la columna `propriedade_id` a las otras tres.

⚠️ **Inconsistencia real a tener en cuenta:** las políticas RLS que escribe `schema.sql`
exigen `auth.role() = 'authenticated'`, pero la app **no autentica** — usa la anon key. Si
esas políticas estuvieran activas tal cual, la app no leería nada. La migración de
propiedades, en cambio, usa `using (true)`. O sea: las políticas vivas en el proyecto real
son permisivas y **los datos son accesibles para cualquiera que tenga la anon key**. Es
aceptable para una herramienta interna, pero es la razón por la que no se debe cargar en
esta app ningún dato personal de huésped (de hecho `cliente` y `telefone` fueron removidos
de `reservas` en el commit `35c5e62`). Cualquier feature que reintroduzca datos personales
requiere resolver auth primero.

Los `.env*` están gitignoreados. La anon key es publicable, pero igual no conviene pegarla
en archivos versionados.

## 8. Mapa de pantallas

| Ruta | Archivo | Qué hace |
|---|---|---|
| `/` | `app/page.tsx` | Dashboard: filtro de período, 8 métricas, gráfico receita×investimento mensual, reservas por plataforma, gauge de confirmación, ranking, últimas reservas, tabla resumen |
| `/campanhas` | `app/campanhas/page.tsx` | Grid o lista (toggle persistido), agrupadas en **Ativas / Pausadas**, drag & drop dentro de cada grupo, alta/edición en `Sheet`, borrado con confirmación |
| `/campanhas/[id]` | `app/campanhas/[id]/page.tsx` | Detalle: métricas de esa campaña, gráficos, sus gastos y sus reservas paginadas (8/pág) |
| `/reservas` | `app/reservas/page.tsx` | Tabla paginada (8/pág) + filtros ricos: búsqueda por código, campaña ("sem" = sin campaña), plataforma, status y **tres rangos de fecha** (reserva, check-in, check-out) |
| `/verba` | `app/verba/page.tsx` | Alta/edición inline de gasto diario (campaña + fecha + valor), gráfico por fecha, lista paginada (10/pág) |
| `/plataformas` | `app/plataformas/page.tsx` | Comparativo por plataforma |
| `/propriedades` | `app/propriedades/page.tsx` | ABM de propiedades. Borrar está **bloqueado** si la propiedad tiene datos vinculados |

Layout: `app/layout.tsx` → `Providers` (carga) → `Header` (logo, selector de propiedad,
botones "Nova Campanha"/"Nova Reserva", `NavTabs`) → `main` con `max-w-7xl`.

**Nota sobre el filtro de período:** el componente `PeriodFilter` (presets Tudo / Hoje /
Ontem / 7 dias / Este mês / Este ano + rango manual) filtra las reservas por
**`dataReserva`**, no por check-in. La página `/reservas` es la excepción: tiene su propio
set de filtros y no usa `PeriodFilter`.

## 9. Convenciones de UI

- **Formularios de alta/edición → `Sheet` lateral** (`side="right"`, `sm:max-w-lg`), no
  modal. `CampaignForm` y `ReservationForm` son el molde a copiar.
- **Los formularios se resetean por `key`**, no por `useEffect`: el padre pasa
  `key={`res-${formOpen}-${editando?.id ?? "nova"}`}` para forzar el remonte. Si se agrega
  un formulario, seguir el mismo truco.
- **Confirmación de borrado → `ConfirmDialog`** (`components/ui/ConfirmDialog.tsx`), siempre.
- **Vacío → `EmptyState`**, con título, descripción y acción opcional.
- **Cabecera de card de sección → `SectionCardHeader`** (título, subtítulo y link opcional
  "ver todo").
- **Radix `Select` no acepta `value=""`.** El código usa centinelas: `"sem"` para "sin
  campaña", `"__todas__"` / `"__todos__"` para "todas". Respetarlo o el select se rompe.
- **Formato siempre vía `lib/utils.ts`**: `formatBRL`, `formatBRLCompact`, `formatDate`,
  `formatPercent`, `formatMultiplier`, `formatNumber`. Nunca `toFixed` suelto.
- Los inputs numéricos muestran `""` cuando el valor es `0`, para que se pueda borrar el
  cero; al vaciarlos vuelven a `0`.
- Paginación cliente con `components/ui/Pagination.tsx`.

### Marca y tokens (`app/globals.css`) — ⚠️ DESACTUALIZADO, ver `DESIGN.md`

Dos capas conviven:

1. **Tokens de marca** en `@theme`: `colonial` `#122b1c` (verde principal),
   `colonial-50/100/700`, `natural` `#233d20`, `laranja`/`brand` `#f3a42c`, `laranja-dark`,
   `neutro`, `branco`. Generan `text-colonial`, `bg-laranja`, etc. — se usan mucho.
2. **Tokens shadcn** (`--background`, `--primary`, `--border`, `--radius`…) mapeados a esa
   paleta. Generan `bg-primary`, `border-border`, `text-muted-foreground`.

Ambos estilos aparecen mezclados en el código (herencia de la migración a shadcn del commit
`5a4e683`). **No hay dark mode**: solo está definido `:root`. Si se pide, hay que agregar el
bloque `.dark` completo.

Fuentes: Geist Sans / Geist Mono vía el paquete `geist`. `font-display` == `font-sans`.

Paleta de gráficos por plataforma: `PLATAFORMA_CORES` en `lib/utils.ts`.

## 10. Deuda técnica conocida (contexto, no tareas)

- `README.md` describe la arquitectura vieja (localStorage, `lib/storage.ts` inexistente).
- `resetarDadosExemplo()` existe en el store pero **ningún componente la llama**: es código
  muerto, y es destructivo (borra y reinserta los datos de la propiedad activa).
- `CampaignCard` y `CampaignRow` duplican bastante lógica (vista grid vs. lista).
- Sin tests, sin CI, sin manejo de errores visible para el usuario.
- Las propiedades sembradas usan ids-slug (`colonial`, `posada-cataratas`) pero las creadas
  desde la UI reciben un UUID. Conviven sin problema, pero conviene saberlo.
- Sin `loading.tsx` / `error.tsx` por ruta: la carga es un spinner global de `Providers`.

## 11. Checklist para agregar una feature

1. ¿Necesita un campo nuevo? → `lib/types.ts` **+** los dos mappers en `lib/supabase.ts`
   **+** `ALTER TABLE` en `supabase/schema.sql` (y correrlo a mano en el SQL Editor;
   **no hay migraciones automáticas**) **+** el formulario correspondiente.
2. ¿Necesita una acción nueva? → agregarla a la interfaz `AppState` y a la implementación,
   copiando el patrón: `set()` con `escopar()` + escritura optimista a Supabase.
3. ¿Necesita una métrica nueva? → función pura en `lib/calculations.ts`, con `safeDiv` y
   `null` para divisiones por cero.
4. ¿Es una entidad nueva? → tabla con `propriedade_id`, incluirla en `loadData`,
   en `escopar()` y en el filtro por propiedad. **Nada puede vivir fuera del scope de
   propiedad.**
5. Verificar con `npx tsc --noEmit` y `npm run lint` (ambos limpios hoy).
6. Leer `node_modules/next/dist/docs/` antes de usar APIs de Next 16.
