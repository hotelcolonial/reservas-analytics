# Módulo Gastos — GrowthDirect

## Qué es
Segundo módulo de la app, independiente de ReservaTrack. Controla los gastos de la oficina
de GrowthDirect: gastos internos (material de escritorio, limpieza, etc.) y gastos en
plataformas (tráfego pago, email marketing, dominios, softwares).

## Excepción arquitectónica declarada
Este módulo vive FUERA del escopo de propriedade. Los gastos son de la empresa, no de un
hotel. No usa `escopar()`, no tiene `propriedade_id`, no aparece en el selector de
propiedad del header. Es la única excepción a la regla 4 del checklist de `ARQUITETURA.md`
y es deliberada.

## Reglas heredadas de ARQUITETURA.md que SÍ aplican
- Todo cliente (`"use client"`). No hay servidor, no hay secretos, no hay auth.
- Fechas: `text` en Postgres, ISO `yyyy-mm-dd`, comparación lexicográfica. Mostrar siempre
  con `formatDate()` de `lib/utils.ts`. Prohibido `new Date()` para formatear.
- Ids: `text`, generados en el cliente con `crypto.randomUUID()`.
- Escritura optimista fire-and-forget: primero el estado local, después Supabase sin
  `await`, error solo a `console.error`. Sin rollback ni toast.
- Métricas: funciones puras, división por cero devuelve `null`, nunca `0` ni `Infinity`.
- Formato solo vía `lib/utils.ts` (`formatBRL`, `formatDate`, `formatPercent`,
  `formatNumber`). Nunca `toFixed` suelto.
- Formularios de alta/edición en `Sheet` lateral (`side="right"`, `sm:max-w-lg`), reseteo
  por `key`, no por `useEffect`.
- Borrado siempre con `ConfirmDialog`. Vacíos con `EmptyState`.
- Radix `Select` no acepta `value=""`: usar centinelas `"__todas__"` / `"__todos__"`.
- Identificadores en portugués.

## Entidades

### Cartao
`{ id, nome, bandeira, final, titular, ativo, ordem }`
- `bandeira`: visa | mastercard | elo | amex | outro
- `final`: exactamente 4 dígitos. NUNCA guardar el número completo de la tarjeta.

### Natureza
`{ id, nome, grupo, cor, ordem }`
- `grupo`: interno | plataformas | outro
- `cor`: hex, para los gráficos.

### DespesaRecorrente
`{ id, nome, descricao, naturezaId, fornecedor, formaPagamento, cartaoId, valorPrevisto,
   periodicidade, diaVencimento, mesVencimento, ativa, inicio, fim }`
- `periodicidade`: semanal | mensal | anual
- `diaVencimento`: para semanal es día de la semana 0-6 (0 = domingo); para mensal y anual
  es día del mes 1-31.
- `mesVencimento`: 1-12, solo para anual.
- `inicio` / `fim`: ISO `yyyy-mm-dd`. `fim` nullable.

### Lancamento
`{ id, descricao, naturezaId, fornecedor, formaPagamento, cartaoId, valor, competencia,
   dataVencimento, dataPagamento, status, comprovanteUrl, observacoes,
   despesaRecorrenteId, criadoEm }`
- `formaPagamento`: cartao_credito | pix | boleto | debito | dinheiro
- `cartaoId`: solo cuando `formaPagamento === "cartao_credito"`, si no `null`.
- `competencia`: `yyyy-mm`, el mes al que pertenece el gasto.
- `status`: pendente | pago | cancelado
- `dataPagamento`: nullable. Si tiene fecha, `status` debe ser `pago`.
- `despesaRecorrenteId`: nullable. Null = gasto suelto.

## Estados derivados (no se guardan)
- **atrasado**: `status === "pendente"` y `dataVencimento < hoje` (comparación de strings).

## Métricas (`lib/calculationsGastos.ts`)

```
totalPeriodo    = Σ valor de lançamentos con status != "cancelado"
totalPago       = Σ valor donde status === "pago"
totalPendente   = Σ valor donde status === "pendente"
totalAtrasado   = Σ valor donde status === "pendente" y dataVencimento < hoje
porNatureza     = agrupado por naturezaId
porCartao       = agrupado por cartaoId
porFormaPagamento
porMes          = agrupado por competencia
variacaoMensal  = ((mesAtual − mesAnterior) / mesAnterior) × 100, null si mesAnterior = 0
```

Los cancelados quedan fuera de todos los totales.

## Rutas
| Ruta | Qué hace |
|---|---|
| `/gastos` | Dashboard: cards, gráfico mensual, comparativo, por natureza y por cartão |
| `/gastos/lancamentos` | Tabla paginada con filtros y alta/edición en Sheet |
| `/gastos/recorrentes` | Plantillas de gastos recurrentes + generación de lançamentos |
| `/gastos/cartoes` | ABM de tarjetas |
| `/gastos/naturezas` | ABM de naturezas |
