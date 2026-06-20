/**
 * Geração de contrato de honorários advocatícios (modelo Caldeira & Ferreira).
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

function qualificarSig(s: Signatario): string {
  const oab = s.oab?.trim();
  return oab ? `${s.nome}, advogado(a), inscrito(a) na ${oab}` : s.nome;
}

function blocoAssinaturas(clienteNome: string, sigs: Signatario[]): string {
  const linhaL = "_________________________________";
  const linhaR = "__________________________________";
  const col = "    ";

  // Primeiro CONTRATADO à esquerda, CONTRATANTE à direita
  const primeiro =
    `${linhaL}${col}${linhaR}\n` +
    `${sigs[0].nome}${col}${clienteNome}\n` +
    `CONTRATADO${col}CONTRATANTE`;

  const demais = sigs
    .slice(1)
    .map((s) => `${linhaL}\n${s.nome}\nCONTRATADO`)
    .join("\n\n\n");

  return demais ? `${primeiro}\n\n\n${demais}` : primeiro;
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

  const sigs = i.signatarios.length > 0 ? i.signatarios : [{ nome: "[ADVOGADO]", oab: null }];
  const multiplos = sigs.length > 1;
  const contratadoRef = multiplos ? "CONTRATADOS" : "CONTRATADO";
  const prep = multiplos ? "aos" : "ao";
  const pelos = multiplos ? "pelos" : "pelo";

  // Qualificação CONTRATANTE (PJ se CNPJ contém "/", PF caso contrário)
  const isPJ = clienteCpf.includes("/");
  const qualContratante = isPJ
    ? `1- ${clienteNome}, pessoa jurídica de direito privado, regularmente inscrita no Cadastro Nacional de Pessoas Jurídicas (CNPJ) sob o nº ${clienteCpf}, com sede situada junto à ${clienteEndereco}, doravante denominado CONTRATANTE;`
    : `1- ${clienteNome}, pessoa física, inscrita no CPF sob o nº ${clienteCpf}, residente e domiciliada à ${clienteEndereco}, doravante denominado CONTRATANTE;`;

  // Qualificação CONTRATADOS
  const sigsDesc = sigs.map(qualificarSig);
  const sigsDescStr =
    sigsDesc.length === 1
      ? sigsDesc[0]
      : sigsDesc.slice(0, -1).join("; ") + ", e " + sigsDesc[sigsDesc.length - 1];

  const qualContratados = `2- ${sigsDescStr}, os quais possuem endereço profissional situado à ${enderecoEscritorio}, doravante designados ${contratadoRef};`;

  // Parágrafo de mandato / objeto
  const demanda = i.descricaoDemanda?.trim();
  const paragMandato = demanda
    ? `Por este instrumento e mediante outorga do mandato respectivo, o CONTRATANTE infra-assinado autoriza ${prep} ${contratadoRef} a procederem com a respectiva defesa dos seus direitos e interesses em ${demanda}.`
    : `Por este instrumento e mediante outorga do mandato respectivo, o CONTRATANTE infra-assinado autoriza ${prep} ${contratadoRef} a procederem com a respectiva defesa dos seus direitos e interesses.`;

  // Forma de pagamento
  const formaTexto =
    i.formaPagamento === "Parcelado"
      ? "de forma parcelada conforme condições acordadas entre as partes"
      : "à vista no ato de assinatura do presente instrumento";

  return `CONTRATO DE HONORÁRIOS ADVOCATÍCIOS

Pelo presente instrumento e na melhor forma de direito, qualifica-se as partes:

${qualContratante}

${qualContratados}

${paragMandato}

Com a respectiva contratação dos serviços jurídicos, o CONTRATANTE compromete-se ao pagamento de honorários advocatícios ${prep} ${contratadoRef}, conforme as cláusulas a seguir expostas:

CLÁUSULA PRIMEIRA – DOS HONORÁRIOS ADVOCATÍCIOS
Em remuneração aos serviços jurídicos profissionais ora pactuados (honorários advocatícios), fica acordado entre as partes deste presente instrumento que o CONTRATANTE pagará ${prep} ${contratadoRef} a quantia de ${valor}, ${formaTexto}.

PARÁGRAFO PRIMEIRO: Os pagamentos serão efetivados diretamente ${prep} ${contratadoRef}, seja em espécie (moeda corrente nacional) ou transferência bancária através de PIX (Chave: ${chavePix}).

PARÁGRAFO SEGUNDO: Fica estabelecido que os valores fixados ou arbitrados judicialmente, a título de honorários de sucumbência porventura existentes, pertencerão, por direito, ${prep} ${contratadoRef}, de acordo com o estabelecido na Lei nº 8.906/1994, em seus artigos 22 e 23.

CLÁUSULA SEGUNDA – DESPESAS
Nos honorários advocatícios fixados não estão incluídas as despesas processuais de viagens, fotocópias, despesas para elaboração de conta de liquidação e outras, que deverão ser pagas a parte pelo CONTRATANTE, caso necessárias ao bom andamento do processo, das quais, todavia, serão prestadas contas ${pelos} ${contratadoRef} ao CONTRATANTE sempre que desejar.

CLÁUSULA TERCEIRA – DAS INFORMAÇÕES PROCESSUAIS
As informações processuais serão disponibilizadas ${pelos} ${contratadoRef} via internet, telefone ou atendimento pelo escritório, de segunda à sexta-feira, no horário das 09 às 18 horas.

CLÁUSULA QUARTA – DAS CUSTAS PROCESSUAIS
O CONTRATANTE tem ciência que poderá ter que arcar com as custas judiciais e todas as demais taxas cartorárias, em caso de insucesso na demanda e na hipótese de não ser beneficiado com a Gratuidade Judiciária.

CLÁUSULA QUINTA – DAS OBRIGAÇÕES DO CONTRATANTE
São OBRIGAÇÕES DO CONTRATANTE: Fornecer a documentação necessária à propositura e andamento da ação, pagar todas as despesas oriundas da causa quando cabíveis, tais como custas processuais judiciais, periciais e honorários advocatícios da parte contrária, em caso de eventual sucumbência; despesas com viagens, fotocópias, certidões, averbações, taxas cartorárias, tributos e outras, como honorários advocatícios contratuais.

O CONTRATANTE também fica obrigado a, sempre que houver mudança de endereço, telefone ou e-mail, comunicar imediatamente ${prep} ${contratadoRef}.

CLÁUSULA SEXTA – DAS OBRIGAÇÕES DOS ${contratadoRef}
São OBRIGAÇÕES DOS ${contratadoRef}: promover a defesa dos interesses do CONTRATANTE na ação já mencionada no preâmbulo deste instrumento particular, até a primeira instância, com diligência e dedicação.

CLÁUSULA SÉTIMA – DO FORO
Para dirimir eventuais dúvidas ou litígios oriundos do presente Contrato de Honorários Advocatícios, as partes contratantes elegem o foro da comarca de ${foro}, com a renúncia expressa de qualquer outro, por mais privilegiado que seja nos termos do artigo 64 do Código de Processo Civil de 2015.

E, por estarem justos e contratados, firmam o presente contrato, impresso em 2 (duas) vias de igual teor e forma, na presença de 2 (duas) testemunhas, para que produza seus jurídicos e legais efeitos.

${foro}, ${data}.


${blocoAssinaturas(clienteNome, sigs)}


Testemunhas:

1______________________________     CPF:
2______________________________     CPF:`;
}
