# Logo + Arial no Contrato — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Exibir o logo do escritório no topo de todas as páginas do PDF do contrato e usar a fonte Arial no corpo.

**Architecture:** Embarcar Arial (TTF do sistema → base64) em módulo lazy-imported só na geração do PDF. Carregar o logo via canvas→PNG dataURL e redesenhar o cabeçalho (logo + nome) no início de cada página dentro do loop de quebra. Dimensão do logo via helper puro testado com vitest.

**Tech Stack:** Next.js (App Router), React client component, jsPDF 4.2.1, vitest, Supabase (profiles.logo_url já existe).

---

### Task 1: Módulo de fonte Arial (base64)

**Files:**
- Create: `vendor/fonts/Arial.ttf`, `vendor/fonts/Arial-Bold.ttf`
- Create: `src/lib/fonts/arial.ts`

- [ ] **Step 1: Copiar TTFs do sistema para o projeto**

```bash
mkdir -p vendor/fonts src/lib/fonts src/lib/pdf/__tests__
cp "/System/Library/Fonts/Supplemental/Arial.ttf" vendor/fonts/Arial.ttf
cp "/System/Library/Fonts/Supplemental/Arial Bold.ttf" vendor/fonts/Arial-Bold.ttf
```

- [ ] **Step 2: Gerar `src/lib/fonts/arial.ts` com base64**

```bash
node -e '
const fs=require("fs");
const reg=fs.readFileSync("vendor/fonts/Arial.ttf").toString("base64");
const bold=fs.readFileSync("vendor/fonts/Arial-Bold.ttf").toString("base64");
const out =
"/* eslint-disable */\n"+
"// Auto-gerado de vendor/fonts. Arial (proprietária) — uso sob licença do usuário.\n"+
"export const arialRegularBase64 = \""+reg+"\";\n"+
"export const arialBoldBase64 = \""+bold+"\";\n";
fs.writeFileSync("src/lib/fonts/arial.ts", out);
console.log("arial.ts:", (fs.statSync("src/lib/fonts/arial.ts").size/1024/1024).toFixed(2), "MB");
'
```

Expected: imprime tamanho (~2 MB).

- [ ] **Step 3: Excluir o .ts gigante do lint (evita lentidão/erros)**

Verificar config eslint. Se for `eslint.config.mjs` (flat), adicionar `"src/lib/fonts/arial.ts"` ao array `ignores`. Se houver `.eslintignore`, adicionar a linha `src/lib/fonts/arial.ts`. O `/* eslint-disable */` no topo já cobre a maioria dos casos.

- [ ] **Step 4: Commit**

```bash
git add vendor/fonts src/lib/fonts/arial.ts .eslintignore eslint.config.mjs 2>/dev/null; git add -A
git commit -m "feat(contrato): embarca fonte Arial (TTF base64) para o PDF"
```

---

### Task 2: Helper puro de dimensão do logo (TDD)

**Files:**
- Create: `src/lib/pdf/logo.ts`
- Test: `src/lib/pdf/__tests__/logo.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
// src/lib/pdf/__tests__/logo.test.ts
import { describe, it, expect } from "vitest";
import { computeLogoDims } from "../logo";

describe("computeLogoDims", () => {
  it("limita pela altura quando o logo é alto", () => {
    // 100x200 (retrato), maxW 170, maxH 18 -> h=18, w=9
    expect(computeLogoDims(100, 200, 170, 18)).toEqual({ w: 9, h: 18 });
  });

  it("limita pela largura quando o logo é largo", () => {
    // 400x100 (paisagem), maxW 170, maxH 18 -> w cairia em 72 (<=170) mantendo h=18
    const r = computeLogoDims(400, 100, 170, 18);
    expect(r.h).toBe(18);
    expect(r.w).toBeCloseTo(72, 5);
  });

  it("reduz para caber na largura máxima", () => {
    // 1000x100, maxW 170, maxH 18 -> por altura w=180 > 170, então w=170, h=17
    const r = computeLogoDims(1000, 100, 170, 18);
    expect(r.w).toBe(170);
    expect(r.h).toBeCloseTo(17, 5);
  });

  it("retorna zero para dimensões inválidas", () => {
    expect(computeLogoDims(0, 0, 170, 18)).toEqual({ w: 0, h: 0 });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm run test -- logo`
Expected: FAIL — `computeLogoDims` não existe / módulo não encontrado.

- [ ] **Step 3: Implementar o módulo**

```ts
// src/lib/pdf/logo.ts

/** Escala (mm) preservando proporção, limitada por largura e altura máximas. */
export function computeLogoDims(
  naturalW: number,
  naturalH: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  if (naturalW <= 0 || naturalH <= 0) return { w: 0, h: 0 };
  const ratio = naturalW / naturalH;
  let h = maxH;
  let w = h * ratio;
  if (w > maxW) {
    w = maxW;
    h = w / ratio;
  }
  return { w, h };
}

/**
 * Carrega uma imagem (URL pública) e devolve PNG dataURL + dimensões naturais.
 * Normaliza qualquer formato para PNG (seguro no jsPDF addImage) e contorna CORS
 * via canvas. Devolve null em qualquer falha (CORS, rede, canvas tainted).
 * Browser-only.
 */
export async function loadLogoPng(
  url: string,
): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("logo load failed"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return { dataUrl: canvas.toDataURL("image/png"), width: img.naturalWidth, height: img.naturalHeight };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm run test -- logo`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pdf/logo.ts src/lib/pdf/__tests__/logo.test.ts
git commit -m "feat(contrato): helper de dimensão e carregamento do logo"
```

---

### Task 3: Passar `logo_url` do perfil ao formulário

**Files:**
- Modify: `src/app/(app)/gerar-contrato/page.tsx`

- [ ] **Step 1: Incluir `logo_url` no select e na prop**

Em `src/app/(app)/gerar-contrato/page.tsx`, alterar o select de `profiles` e a renderização do `ContratoForm`:

```tsx
    supabase
      .from("profiles")
      .select("foro, nome, chave_pix, endereco, logo_url")
      .eq("id", userData.user?.id ?? "")
      .maybeSingle(),
```

```tsx
      <ContratoForm
        advogados={advogados ?? []}
        honorarios={honorarios ?? []}
        perfilForo={profile?.foro ?? null}
        perfilChavePix={profile?.chave_pix ?? null}
        perfilEndereco={profile?.endereco ?? null}
        escritorioNome={profile?.nome ?? null}
        logoUrl={profile?.logo_url ?? null}
        hoje={hoje}
      />
```

- [ ] **Step 2: Typecheck (vai falhar até a prop existir no componente — esperado)**

Run: `npm run typecheck`
Expected: erro indicando que `ContratoForm` não aceita `logoUrl`. Será resolvido na Task 4. (Não commitar ainda; seguir para Task 4 e commitar junto.)

---

### Task 4: Embarcar Arial + logo em todas as páginas no `ContratoForm`

**Files:**
- Modify: `src/app/(app)/gerar-contrato/ContratoForm.tsx`

- [ ] **Step 1: Adicionar prop `logoUrl` na interface e na assinatura**

Na `interface Props`, adicionar:

```tsx
  logoUrl: string | null;
```

Na desestruturação de `export function ContratoForm({ ... })`, adicionar `logoUrl,` junto dos outros props (ex.: depois de `escritorioNome,`).

- [ ] **Step 2: Adicionar estado `incluirLogo`**

Logo após `const [msg, setMsg] = useState<string | null>(null);`:

```tsx
  const [incluirLogo, setIncluirLogo] = useState(!!logoUrl);
```

- [ ] **Step 3: Reescrever `gerarPdf` com Arial + cabeçalho por página**

Substituir a função `gerarPdf` inteira (atualmente das linhas que vão de `async function gerarPdf() {` até o `return { doc, nome };` / `}`) por:

```tsx
  async function gerarPdf() {
    const [{ jsPDF }, { arialRegularBase64, arialBoldBase64 }, { computeLogoDims, loadLogoPng }] =
      await Promise.all([
        import("jspdf"),
        import("@/lib/fonts/arial"),
        import("@/lib/pdf/logo"),
      ]);

    const nome = (contratanteNome || "contrato").replace(/\s+/g, "_");
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    doc.addFileToVFS("Arial.ttf", arialRegularBase64);
    doc.addFont("Arial.ttf", "Arial", "normal");
    doc.addFileToVFS("Arial-Bold.ttf", arialBoldBase64);
    doc.addFont("Arial-Bold.ttf", "Arial", "bold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - margin * 2;
    const lineH = 5;
    const LOGO_MAX_H = 18; // mm

    let logo: { dataUrl: string; width: number; height: number } | null = null;
    if (incluirLogo && logoUrl) {
      logo = await loadLogoPng(logoUrl);
    }

    function drawHeader(): number {
      let hy = margin;
      if (logo) {
        const { w, h } = computeLogoDims(logo.width, logo.height, usableWidth, LOGO_MAX_H);
        doc.addImage(logo.dataUrl, "PNG", (pageWidth - w) / 2, hy, w, h);
        hy += h + 6;
      }
      if (escritorioNome) {
        doc.setFont("Arial", "bold");
        doc.setFontSize(13);
        doc.text(escritorioNome, pageWidth / 2, hy, { align: "center" });
        hy += 8;
      }
      if (logo || escritorioNome) {
        doc.setDrawColor(180, 180, 180);
        doc.line(margin, hy, pageWidth - margin, hy);
        hy += 8;
      }
      return hy;
    }

    let y = drawHeader();
    doc.setFont("Arial", "normal");
    doc.setFontSize(10);

    for (const line of doc.splitTextToSize(texto, usableWidth)) {
      if (y + lineH > pageHeight - margin) {
        doc.addPage();
        y = drawHeader();
        doc.setFont("Arial", "normal");
        doc.setFontSize(10);
      }
      doc.text(line as string, margin, y);
      y += lineH;
    }

    return { doc, nome };
  }
```

- [ ] **Step 4: Trocar a fonte da preview (textarea) para Arial**

No `<textarea id="contrato-texto" ...>`, no objeto `style`, trocar:

```tsx
              fontFamily: "var(--font-mono, monospace)",
```

por:

```tsx
              fontFamily: "Arial, Helvetica, sans-serif",
```

- [ ] **Step 5: Adicionar checkbox "Incluir logo" no Passo 4**

No Passo 4 (Card do "Preview do Contrato"), logo **antes** do `<FormField label="Texto do Contrato (Editável)" ...>`, inserir (só aparece quando há logo):

```tsx
        {logoUrl && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={incluirLogo}
              onChange={(e) => setIncluirLogo(e.target.checked)}
            />
            <span>Incluir logo do escritório no contrato</span>
          </label>
        )}
```

- [ ] **Step 6: Typecheck + lint + testes**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: tudo PASS (incluindo os testes de `montarContrato` e `computeLogoDims`, intactos).

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/gerar-contrato/page.tsx src/app/(app)/gerar-contrato/ContratoForm.tsx
git commit -m "feat(contrato): logo do escritório em todas as páginas e corpo em Arial"
```

---

### Task 5: Build de verificação

**Files:** nenhum (gate de qualidade)

- [ ] **Step 1: Build de produção local**

Run: `npm run build`
Expected: build conclui sem erros. O chunk da fonte só entra no bundle dinâmico de `gerar-contrato` (lazy import).

- [ ] **Step 2: Verificação no browser (preview)**

Subir o dev server (preview_start), abrir `/gerar-contrato`, conferir console sem erros e que a textarea renderiza em Arial. (Geração de PDF exige sessão logada com dados; verificar ao menos o carregamento da página e ausência de erros.)

---

### Task 6: Deploy para produção

**Files:** nenhum

- [ ] **Step 1: Garantir working tree commitado**

Run: `git status --short`
Expected: limpo (todas as Tasks commitadas).

- [ ] **Step 2: Deploy de produção na Vercel**

Usar a skill `vercel:deploy` com argumento `prod` (ou `vercel --prod`). Confirmar que o deploy referencia o projeto `comarca` (comarca-puce.vercel.app) e capturar a URL de produção.
Expected: deploy concluído, URL de produção retornada.

- [ ] **Step 3: Smoke check em produção**

Abrir a URL de produção em `/gerar-contrato`, confirmar carregamento sem erro de console.

---

## Self-Review

- **Spec coverage:** logo todas as páginas (Task 4 drawHeader por página) ✓; Arial corpo (Task 1+4) ✓; logo via profiles.logo_url (Task 3) ✓; checkbox desligar (Task 4 step 5) ✓; preview Arial (Task 4 step 4) ✓; fallback sem logo/erro (loadLogoPng→null + guard `logo`) ✓; montarContrato intacto ✓; deploy (Task 6) ✓.
- **Placeholders:** nenhum — todo passo tem código/comando concreto.
- **Consistência de tipos:** `computeLogoDims(naturalW, naturalH, maxW, maxH)` e `loadLogoPng` usados com a mesma assinatura na Task 4; prop `logoUrl: string | null` definida (Task 4 step 1) e passada (Task 3).
