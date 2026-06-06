/**
 * Geração do payload PIX "copia e cola" / BR Code (EMV MPM) — spec F8, T-409.
 * Função pura e testável. O QR Code da página pública renderiza este payload.
 *
 * Referência: Manual do BR Code (Bacen) / EMV MPM. Campos TLV:
 *   ID + length(2 dígitos) + value. CRC16-CCITT (0x1021, init 0xFFFF) ao final.
 */

/** CRC16-CCITT-FALSE (poly 0x1021, init 0xFFFF). Check("123456789") = 0x29B1. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Monta um campo TLV: id + comprimento(2) + valor. */
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

/** Normaliza texto p/ ASCII maiúsculo sem acento, truncado. */
function sanitize(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase()
    .trim()
    .slice(0, max);
}

export interface PixInput {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  /** Valor em reais (opcional — PIX estático sem valor se omitido). */
  valor?: number | null;
  /** Identificador da transação (default "***"). */
  txid?: string | null;
  /** Descrição opcional no merchant account info. */
  descricao?: string | null;
}

/**
 * Gera o BR Code (string copia-e-cola) pronto para virar QR Code.
 */
export function montarPixCopiaECola(input: PixInput): string {
  const gui = tlv("00", "br.gov.bcb.pix");
  const chaveField = tlv("01", input.chave.trim());
  const descField = input.descricao ? tlv("02", sanitize(input.descricao, 72)) : "";
  const merchantAccount = tlv("26", gui + chaveField + descField);

  const txid = (input.txid && input.txid.trim()) || "***";
  const additionalData = tlv("62", tlv("05", txid));

  const valorField =
    input.valor && input.valor > 0 ? tlv("54", input.valor.toFixed(2)) : "";

  const semCRC =
    tlv("00", "01") + // Payload Format Indicator
    merchantAccount +
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Moeda: BRL
    valorField +
    tlv("58", "BR") + // País
    tlv("59", sanitize(input.nomeRecebedor, 25)) +
    tlv("60", sanitize(input.cidade, 15)) +
    additionalData +
    "6304"; // ID + len do CRC, valor calculado a seguir

  return semCRC + crc16(semCRC);
}

/** Valida que um BR Code tem CRC íntegro. */
export function pixCrcValido(brcode: string): boolean {
  if (brcode.length < 4) return false;
  const semCRC = brcode.slice(0, -4);
  const crc = brcode.slice(-4).toUpperCase();
  return crc16(semCRC) === crc;
}
