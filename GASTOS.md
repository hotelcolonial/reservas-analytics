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
   despesaRecorrenteId, propriedadeId }` + auditoria (`criadoPor`, `criadoEm`,
   `atualizadoEm`, preenchidos por trigger — o app nunca os envia)
- `formaPagamento`: cartao_credito | pix | boleto | debito | dinheiro
- `cartaoId`: solo cuando `formaPagamento === "cartao_credito"`, si no `null`.
- `competencia`: `yyyy-mm`, el mes al que pertenece el gasto.
- `status`: pendente | pago | cancelado
- `dataPagamento`: nullable. Si tiene fecha, `status` debe ser `pago`.
- `despesaRecorrenteId`: nullable. Null = gasto suelto.
- `propriedadeId`: nullable, FK a `propriedades` (migração 007). **Null es el default**
  y significa gasto de escritório (aluguel, contador) o compartido entre propriedades:
  no se atribuye a una por conveniencia. Es la **única** relación de este módulo con el
  ReservaTrack, y es solo de referencia: el filtro de propriedade en
  `/gastos/lancamentos` es propio (default "todas") y **no sigue** la propriedade ativa
  del header. Cambiar de propriedade en el ReservaTrack nunca esconde lançamentos.
- `descricao`: texto libre. El formulario sugiere las descripciones ya usadas (sin
  repetidas, por frecuencia, desde el store en memoria — `lib/sugestoesGastos.ts`), pero
  nunca bloquea una nueva. No hay catálogo de descripciones. **Al escoger** una sugerencia
  (nunca al tipear), el formulario rellena natureza, fornecedor, propriedade y forma de
  pagamento (+ cartão si es crédito) con el valor **más frecuente** entre los lançamentos
  con esa descripción (empate → el más reciente); campos sin histórico quedan como están,
  todo sigue editable, y un aviso discreto dice qué se rellenó. Valor, competência,
  vencimento y status **nunca** se rellenan solos (`perfilDaDescricao`).
- `dataVencimento` **siempre** significa vencimiento: `atrasado` y "contas a pagar"
  dependen de eso. Para "paguei hoje, sem vencimento prévio" el formulario tiene el atajo
  **paguei hoje**, que pone `status = pago` y las dos fechas en hoy. No existe (ni debe
  existir) un selector de "tipo de data".

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

## Relação com o ReservaTrack (gastos ≠ lancamentos)

Os dois módulos registram **fatos diferentes** sobre dinheiro em mídia, e os números
**não devem bater**:

| | `lancamentos` (Gastos) | `gastos` (ReservaTrack) |
|---|---|---|
| O que é | O **desembolso**: a recarga de saldo na plataforma (ex.: R$ 2.000 no Meta Ads em 03/09) | O **consumo diário** por campanha (ex.: R$ 87,30 na campanha "Junino" em 05/09) |
| Granularidade | Um pagamento | Um dia × uma campanha |
| Quem carrega | Quem paga a conta do escritório | Quem acompanha a campanha |
| Serve para | Fluxo de caixa, contas a pagar, por cartão / natureza | ROI, ROAS, custo por reserva |

Sempre existe saldo carregado e ainda não consumido, e uma recarga cobre várias
campanhas e vários dias. Somar os `gastos` de uma propriedade e esperar que dê igual à
soma dos `lancamentos` daquela propriedade **é um erro de leitura**, não um bug. Se um
dia se quiser cruzar os dois (saldo restante = recargas − consumo), isso é uma métrica
nova e explícita, não uma reconciliação.

## Rutas
| Ruta | Qué hace |
|---|---|
| `/gastos` | Dashboard: cards, gráfico mensual, comparativo, por natureza y por cartão. Filtro de propriedade **propio** (todas / cada una / Escritório-Geral), **estricto** (una propriedade no suma los gastos generales) y que afecta todos los números de la página |
| `/gastos/lancamentos` | Tabla paginada con filtros (incluido propriedade, default "todas", con estado independiente del dashboard) y alta/edición en Sheet |
| `/gastos/recorrentes` | Plantillas de gastos recurrentes + generación de lançamentos |
| `/gastos/cartoes` | ABM de tarjetas |
| `/gastos/naturezas` | ABM de naturezas |
