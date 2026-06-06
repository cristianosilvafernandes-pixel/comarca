/**
 * Validação/máscara de CPF ou CNPJ — usado no doc_pagador (sucumbencial),
 * que pode ser pessoa física ou jurídica (spec F7/F10, INV-083/114).
 * Funções puras.
 */

import { onlyDigits, isValidCPF, maskCPF } from "./cpf";

/** Valida CNPJ pelos dígitos verificadores. */
export function isValidCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const calc = (len: number): number => {
    const pesos = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cnpj[i]) * pesos[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const d1 = calc(12);
  if (d1 !== Number(cnpj[12])) return false;
  const d2 = calc(13);
  return d2 === Number(cnpj[13]);
}

/** Máscara de CNPJ: 00.000.000/0000-00. */
export function maskCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  return d
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Máscara dinâmica: CPF até 11 dígitos, CNPJ a partir de 12 (INV-083). */
export function maskDoc(value: string): string {
  return onlyDigits(value).length <= 11 ? maskCPF(value) : maskCNPJ(value);
}

/** Valida CPF (11 díg.) ou CNPJ (14 díg.). */
export function isValidDoc(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length === 11) return isValidCPF(d);
  if (d.length === 14) return isValidCNPJ(d);
  return false;
}
