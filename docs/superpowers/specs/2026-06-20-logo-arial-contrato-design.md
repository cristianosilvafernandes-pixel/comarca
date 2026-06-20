# Logo do escritório + fonte Arial no contrato

**Data:** 2026-06-20
**Página:** `/gerar-contrato`
**Status:** aprovado para planejamento

## Objetivo

No PDF do contrato de honorários gerado em `/gerar-contrato`:

1. Exibir o **logo do escritório** no topo de **todas as páginas** (estilo papel timbrado), acima do nome do escritório.
2. Usar a fonte **Arial** no corpo do contrato (hoje usa Courier, monospace).

## Contexto existente (não recriar)

- O logo do escritório **já existe**: coluna `profiles.logo_url`, bucket público `logos`, upload feito na página `/perfil` (`uploadLogo` em `perfil/actions.ts`). Esta feature apenas **consome** `logo_url`.
- O PDF é gerado client-side com **jsPDF 4.2.1** dentro de `ContratoForm.gerarPdf()`.
- Hoje o cabeçalho do PDF já desenha o nome do escritório (`escritorioNome`) em Helvetica bold; o corpo usa `Courier` 10pt. Apenas a 1ª página recebe o cabeçalho.
- `montarContrato` (`src/lib/domain/contrato.ts`) é texto puro e **não** inclui o nome do escritório no corpo — sem duplicação. Não muda; seus testes não mudam.

## Decisões

- **Fonte:** Arial real, TTF embarcado (não Helvetica). Arquivos fornecidos pelo usuário (`Arial.ttf` + `Arial-Bold.ttf`), pois Arial é proprietária e não pode ser obtida/redistribuída livremente.
- **Logo:** topo, centralizado, acima do nome, **repetido em todas as páginas**. Aparece automaticamente quando há `logo_url`; pode ser desligado por contrato via checkbox.

## Fluxo de dados

- `gerar-contrato/page.tsx`: adicionar `logo_url` ao `select` de `profiles` e passar prop `logoUrl: string | null` ao `ContratoForm`.
- `ContratoForm`: novo prop `logoUrl`. Estado `incluirLogo` (boolean), default `true` quando `logoUrl` existe. Checkbox "Incluir logo do escritório no contrato" no Passo 4 (só renderiza quando há `logoUrl`).

## Fonte Arial (PDF)

- Arquivos de origem fornecidos pelo usuário em `vendor/fonts/Arial.ttf` e `vendor/fonts/Arial-Bold.ttf` (pasta fora do bundle).
- Gerar módulo `src/lib/fonts/arial.ts` exportando as strings base64 dos dois TTF (`arialRegularBase64`, `arialBoldBase64`).
- Em `gerarPdf`, **lazy import** desse módulo junto do `import("jspdf")` — carrega só na geração do PDF, zero impacto no carregamento inicial da página.
- Registrar no doc: `addFileToVFS("Arial.ttf", arialRegularBase64)` + `addFont("Arial.ttf", "Arial", "normal")`; idem para bold (`"Arial", "bold"`).
- Corpo do contrato: `doc.setFont("Arial", "normal")`, 10pt. Nome do escritório: `doc.setFont("Arial", "bold")`, 13pt.
- **Preview (textarea on-screen):** trocar `fontFamily` de `var(--font-mono, monospace)` para `"Arial, Helvetica, sans-serif"` (Arial é fonte de sistema no navegador — sem embed na preview).

## Logo em todas as páginas (timbrado)

- **Carregar 1×** antes do loop: `fetch(logoUrl)` → `Image`/canvas → `canvas.toDataURL("image/png")`. Normaliza qualquer formato aceito pelo bucket (jpeg/png/webp/gif) para PNG (formato seguro no `addImage`) e contorna CORS (bucket público devolve `Access-Control-Allow-Origin: *`; usar `img.crossOrigin = "anonymous"`). Guardar `dataUrl` + `naturalWidth/Height` para proporção.
- `drawHeader(doc): number` — desenha, a partir de `y = margin`:
  1. Logo centralizado: altura máx ~18mm, largura limitada a `usableWidth`, proporção preservada; `x = (pageWidth - displayW) / 2`.
  2. Nome do escritório (se houver) em Arial bold 13pt, centralizado, abaixo do logo.
  3. Linha divisória cinza.
  - Retorna o `y` onde o corpo deve começar.
- Chamar `drawHeader` na 1ª página e **após cada `addPage()`** dentro do loop de quebra de linha. O `y` retornado garante que o corpo começa abaixo do cabeçalho; a checagem de quebra (`y + lineH > pageHeight - margin`) continua válida.
- **Fallback:** se `incluirLogo` for false, ou `logoUrl` ausente, ou o carregamento/`addImage` falhar (`try/catch`) → cabeçalho só-texto (nome do escritório), como hoje. O contrato nunca deixa de ser gerado por causa do logo.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/app/(app)/gerar-contrato/page.tsx` | `logo_url` no select de profiles; prop `logoUrl` |
| `src/app/(app)/gerar-contrato/ContratoForm.tsx` | prop `logoUrl`; estado/checkbox `incluirLogo`; refactor `gerarPdf` (embed Arial + `drawHeader` por página + carregamento do logo); fonte da preview |
| `src/lib/fonts/arial.ts` (novo) | base64 de Arial regular + bold |
| `vendor/fonts/Arial.ttf`, `vendor/fonts/Arial-Bold.ttf` | fornecidos pelo usuário (origem do base64) |

## Casos de borda

- Sem `logo_url`: checkbox não aparece; header só-texto.
- `incluirLogo` desmarcado: header só-texto mesmo havendo logo.
- Logo muito largo/alto: limitado por altura máx e `usableWidth`, proporção preservada.
- Falha de rede/CORS no logo: `try/catch` → header só-texto; PDF gerado normalmente.
- Logo presente mas sem nome do escritório: desenha só o logo + divisória.

## Fora de escopo

- Editar `montarContrato` ou o texto do contrato.
- Configurar posição/tamanho do logo pela UI (fixo no código).
- Embarcar Arial na preview HTML (usa fonte de sistema).

## Dependência de implementação

O módulo `src/lib/fonts/arial.ts` só pode ser gerado depois que o usuário colocar `Arial.ttf` e `Arial-Bold.ttf` em `vendor/fonts/`. A geração do base64 é um passo mecânico (`base64` do arquivo → string no módulo TS).
