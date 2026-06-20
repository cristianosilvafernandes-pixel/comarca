/**
 * Geração de contrato de honorários a partir de template (spec F9, INV-102, T-502).
 * Foro configurável via perfil (P-02). Signatários selecionáveis (1 ou mais advogados).
 * Função pura — espelha loadContratoTemplate do protótipo.
 */

import { formatDate } from "@/lib/utils/format";

export interface Signatario {
  nome: string;
  oab?: string | null;
}

export interface ContratoInput {
  clienteNome?: string | null;
  clienteCpf?: string | null;
  clienteEndereco?: string | null;
  signatarios: Signatario[];
  objeto?: string | null;
  valor?: string | null; // já formatado (ex.: "R$ 3.600,00")
  foro?: string | null; // ex.: "Pelotas/RS"
  dataHoje: string; // YYYY-MM-DD
}

const DISCLAIMER =
  "Observação: este modelo é um ponto de partida e não substitui a revisão jurídica do contrato pelo advogado responsável.";

function formatarNomesSignatarios(sigs: Signatario[]): string {
  const partes = sigs.map((s) => `${s.nome}, ${s.oab?.trim() || "[OAB]"}`);
  if (partes.length === 1) return partes[0];
  const ultimo = partes.pop()!;
  return partes.join("; ") + " e " + ultimo;
}

function blocoAssinaturas(sigs: Signatario[]): string {
  const linha = "_______________________________";
  if (sigs.length <= 1) {
    return `${linha}     ${linha}\nCONTRATANTE                          CONTRATADO`;
  }
  const contratante = `${linha}\nCONTRATANTE`;
  const contratados = sigs
    .map((s) => {
      const oab = s.oab?.trim() ? ` — ${s.oab.trim()}` : "";
      return `${linha}\nCONTRATADO\n${s.nome}${oab}`;
    })
    .join("\n\n");
  return `${contratante}\n\n${contratados}`;
}

/** Monta o texto editável do contrato com merge de campos. */
export function montarContrato(i: ContratoInput): string {
  const clienteNome = i.clienteNome?.trim() || "[NOME DO CLIENTE]";
  const clienteCpf = i.clienteCpf?.trim() || "[CPF DO CLIENTE]";
  const clienteEndereco = i.clienteEndereco?.trim() || "[ENDEREÇO DO CLIENTE]";
  const objeto = i.objeto?.trim() || "[descrever]";
  const valor = i.valor?.trim() || "[valor]";
  const foro = i.foro?.trim() || "[Comarca/UF]";
  const data = formatDate(i.dataHoje);

  const sigs = i.signatarios.length > 0 ? i.signatarios : [{ nome: "Advogado", oab: null }];
  const multiplos = sigs.length > 1;
  const artigo = multiplos ? "os advogados" : "o advogado";
  const denominacao = multiplos ? "denominados CONTRATADOS" : "denominado CONTRATADO";
  const contratadoRef = multiplos ? "CONTRATADOS" : "CONTRATADO";

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ADVOCATÍCIOS

Pelo presente instrumento, ${clienteNome}, CPF ${clienteCpf}, residente em ${clienteEndereco}, doravante denominado CONTRATANTE, e ${artigo} ${formatarNomesSignatarios(sigs)}, doravante ${denominacao}, têm entre si justo e contratado o seguinte:

1. OBJETO: Prestação de serviços advocatícios referentes a ${objeto}.
2. HONORÁRIOS: O CONTRATANTE pagará ao${multiplos ? "s" : ""} ${contratadoRef} o valor de ${valor}, nas condições acordadas.
3. PRAZO: O contrato vigorará pelo tempo necessário à conclusão dos serviços.
4. FORO: Fica eleito o foro da comarca de ${foro}.

${foro}, ${data}.

${blocoAssinaturas(sigs)}

${DISCLAIMER}`;
}
