# Gerar Contrato — dados do cadastro travados (read-only)

Data: 2026-06-20
Status: implementado (Opção A)
Escopo: **somente a página `/gerar-contrato`** (mais o gerador `src/lib/domain/contrato.ts`, usado exclusivamente por ela).

## Problema

A tela de gerar contrato pedia para redigitar nome, CPF, telefone, e-mail e endereço do cliente — já cadastrados em Clientes — e tipo/valor do honorário — já cadastrados em Honorários. Retrabalho e risco de divergência entre o contrato e o cadastro.

## Regra de domínio (confirmada com o advogado)

- **Cada honorário = 1 contrato (1:1).** Um cliente tem N honorários (ex: "vendas", "aluguéis") e cada um gera seu próprio contrato.
- Sucumbencial não tem contrato (fora desta tela).
- Consultoria recorrente sem processo: ainda 1 honorário = 1 contrato, por cliente.

## Decisões

- (a) Âncora = honorário. Passo 1 em 2 níveis: **cliente → honorário** (cada linha = um contrato).
- (b) Campos sem fonte no cadastro (descrição da demanda, foro, signatários) ficam **prefilled-editáveis**, não travados.
- (c) Validação separa **gerar** (nome, CPF, endereço, valor) de **enviar** (WhatsApp).
- Trava anti-duplicata (2ª via por honorário) fica para depois — exige persistir contrato (tabela `contratos`), o que sairia do escopo "só a página".

## Comportamento

**Passo 1 — Cliente e Processo (2 níveis):** seleciona o cliente; aparece a lista de honorários dele (rótulo = área/parte contrária ou processo; resumo = tipo + valor). Selecionar um define o contrato.

**Passo 3 — Dados Complementares:**
- Contratante (nome, CPF/CNPJ, endereço, telefone/WhatsApp, e-mail) — **somente leitura**, do cadastro do cliente, com link "editar cadastro" → `/clientes/[id]/editar`.
- Honorários (tipo, valor, forma de pagamento quando fixo, chave PIX) — **somente leitura**, do cadastro do honorário, com link "editar honorário" → `/honorarios/[id]/editar`. Valor é apresentado conforme o tipo; forma de pagamento é derivada da frequência (`Única` → à vista, senão parcelado).
- Objeto: número do processo (travado) + descrição da demanda (editável, prefill de área + parte contrária).
- Foro (editável, default do perfil) e signatários (editável).

**Passo 4 — Preview:** se faltar dado obrigatório, botões "Gerar/Enviar" desabilitados + aviso listando o que falta + link para completar o cadastro correto (cliente ou honorário). Logo do escritório no PDF (feature já existente) preservada.

## Gerador (`montarContrato`)

A Cláusula Primeira passa a adaptar o texto ao tipo do honorário:
- `fixo_parcelado`: quantia única, à vista ou parcelada.
- `recorrente`: quantia mensal, assessoria continuada.
- `ad_exitum`: percentual de êxito sobre o proveito econômico (e valor da causa).
- `fixo_exitum`: entrada fixa + percentual de êxito.

Coberto por testes em `src/lib/domain/__tests__/contrato.test.ts`.

## Fora de escopo

- Tabela `contratos` / persistência / trava anti-duplicata (fase futura).
- Qualquer alteração nas telas de Clientes ou Honorários (links apenas navegam).
