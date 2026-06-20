/**
 * Geração de contrato de honorários advocatícios (formato cláusulas).
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
  tipoContrato?: "civel" | "trabalhista";
  descricaoDemanda?: string | null;
  valor?: string | null;
  formaPagamento?: string | null;
  chavePix?: string | null;
  foro?: string | null;
  enderecoEscritorio?: string | null;
  dataHoje: string;
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatarDataExtenso(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

function descreverSignatarios(sigs: Signatario[]): string {
  const partes = sigs.map((s) => {
    const oab = s.oab?.trim();
    return oab ? `${s.nome}, inscrito na ${oab}` : s.nome;
  });
  if (partes.length === 1) return partes[0];
  return partes.slice(0, -1).join(", ") + " e " + partes[partes.length - 1];
}

function blocoAssinaturas(clienteNome: string, sigs: Signatario[]): string {
  const linha = "_____________________________________________";
  const contratante = `${linha}\n${clienteNome}\nCONTRATANTE`;
  const contratados = sigs
    .map((s) => `${linha}\n${s.nome}\nCONTRATADO`)
    .join("\n\n\n");
  return `${contratante}\n\n\n${contratados}`;
}

export function montarContrato(i: ContratoInput): string {
  const clienteNome = i.clienteNome?.trim() || "[NOME/RAZÃO SOCIAL DO CONTRATANTE]";
  const clienteCpf = i.clienteCpf?.trim() || "[CPF/CNPJ]";
  const clienteEndereco = i.clienteEndereco?.trim() || "[endereço completo]";
  const valor = i.valor?.trim() || "R$ 0,00";
  const foro = i.foro?.trim() || "[Comarca/UF]";
  const chavePix = i.chavePix?.trim() || "[chave PIX]";
  const enderecoEscritorio = i.enderecoEscritorio?.trim() || "[endereço profissional]";
  const data = formatarDataExtenso(i.dataHoje);
  const trabalhista = i.tipoContrato === "trabalhista";

  const sigs = i.signatarios.length > 0 ? i.signatarios : [{ nome: "[ADVOGADO]", oab: null }];
  const multiplos = sigs.length > 1;
  const artigo = multiplos ? "os advogados" : "o advogado";
  const denominacao = multiplos ? "designados CONTRATADOS" : "denominado CONTRATADO";
  const contratadoRef = multiplos ? "CONTRATADOS" : "CONTRATADO";
  const prep = multiplos ? "aos" : "ao";
  const pelos = multiplos ? "pelos" : "pelo";

  const formaTexto =
    i.formaPagamento === "Parcelado"
      ? "a ser quitada de forma parcelada conforme condições acordadas entre as partes"
      : "a ser quitada integralmente à vista mediante assinatura do presente instrumento";

  const descricaoParag =
    i.descricaoDemanda?.trim()
      ? `\n\nOBJETO: ${i.descricaoDemanda.trim()}.`
      : "";

  const clausulaMandato = trabalhista
    ? `\nCLÁUSULA SÉTIMA – DO MANDATO\nFica o(a) ${contratadoRef} autorizado(a) a representar o CONTRATANTE em todas as instâncias administrativas e judiciais pertinentes ao objeto deste contrato, com poderes de mandato ad judicia e ad negotia.\n`
    : "";
  const numForo = trabalhista ? "OITAVA" : "SÉTIMA";

  return `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

Pelo presente instrumento e na melhor forma de direito, qualifica-se as partes:

1 – ${clienteNome}, pessoa física, inscrita no CPF sob o nº ${clienteCpf}, com endereço no local ${clienteEndereco}, doravante denominado CONTRATANTE;

2 – ${artigo} ${descreverSignatarios(sigs)}; com endereço profissional situado à ${enderecoEscritorio}, doravante ${denominacao};${descricaoParag}

CLÁUSULA PRIMEIRA – DOS HONORÁRIOS ADVOCATÍCIOS
O CONTRATANTE pagará ${prep} ${contratadoRef} a quantia de ${valor}, ${formaTexto}.

PARÁGRAFO PRIMEIRO: Os pagamentos serão efetivados diretamente ${prep} ${contratadoRef} via PIX (Chave: ${chavePix}).

PARÁGRAFO SEGUNDO: Fica estabelecido que os honorários de sucumbência porventura existentes pertencerão ${prep} ${contratadoRef}, conforme Lei nº 8.906/1994, arts. 22 e 23.

CLÁUSULA SEGUNDA – DESPESAS
Nos honorários não estão incluídas despesas processuais de viagens, fotocópias, certidões e outras, que serão pagas à parte pelo CONTRATANTE.

CLÁUSULA TERCEIRA – DAS INFORMAÇÕES PROCESSUAIS
As informações processuais serão disponibilizadas ${pelos} ${contratadoRef} via internet, telefone ou atendimento no escritório, de segunda à sexta-feira, das 09 às 18h.

CLÁUSULA QUARTA – DAS CUSTAS PROCESSUAIS
O CONTRATANTE tem ciência de que poderá arcar com custas judiciais em caso de insucesso na demanda.

CLÁUSULA QUINTA – DAS OBRIGAÇÕES DO CONTRATANTE
Fornecer documentação necessária ao andamento da ação, pagar custas processuais cabíveis e comunicar imediatamente qualquer mudança de endereço, telefone ou e-mail.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DOS ${contratadoRef}
Promover a defesa dos interesses do CONTRATANTE na ação mencionada, com diligência e dedicação.
${clausulaMandato}
CLÁUSULA ${numForo} – DO FORO
Fica eleito o foro da comarca de ${foro}, com renúncia a qualquer outro, nos termos do art. 64 do CPC/2015.

${foro}, ${data}.


${blocoAssinaturas(clienteNome, sigs)}


Testemunhas:
1______________________________     CPF:
2______________________________     CPF:`;
}
