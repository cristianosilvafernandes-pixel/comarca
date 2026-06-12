"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/FormField";

/**
 * Seção opcional de divisão de honorário com um advogado parceiro.
 * Só registra/exibe: o parceiro entra com X%, o titular fica com (100 − X)%.
 * Aparece quando há ≥2 advogados ativos, ou quando já existe parceiro definido.
 */
export function DivisaoAdvogado({
  advogados,
  parceiroIdInicial = "",
  percentualInicial = "",
}: {
  advogados: { id: string; nome: string }[];
  parceiroIdInicial?: string | null;
  percentualInicial?: number | string | null;
}) {
  const [dividir, setDividir] = useState(Boolean(parceiroIdInicial));
  const [parceiro, setParceiro] = useState(String(parceiroIdInicial ?? ""));
  const [pct, setPct] = useState(
    percentualInicial == null ? "" : String(percentualInicial),
  );

  if (advogados.length < 2 && !parceiroIdInicial) return null;

  const p = Math.max(0, Math.min(100, Number(pct) || 0));
  const nomeParceiro = advogados.find((a) => a.id === parceiro)?.nome ?? "Parceiro";

  return (
    <fieldset className="tipo-fields">
      <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>Divisão entre advogados (opcional)</h3>

      <div className="checkbox-group" style={{ marginBottom: dividir ? 16 : 0 }}>
        <input
          id="dividir"
          type="checkbox"
          checked={dividir}
          onChange={(e) => setDividir(e.target.checked)}
        />
        <label htmlFor="dividir" style={{ margin: 0 }}>
          Dividir honorário com advogado parceiro
        </label>
      </div>

      {dividir && (
        <>
          <FormField label="Advogado parceiro" htmlFor="parceiro_id">
            <select
              id="parceiro_id"
              name="parceiro_id"
              className="form-control"
              value={parceiro}
              onChange={(e) => setParceiro(e.target.value)}
            >
              <option value="">Selecione…</option>
              {advogados.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Percentual do parceiro (%)" htmlFor="parceiro_percentual">
            <input
              id="parceiro_percentual"
              name="parceiro_percentual"
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="form-control"
              placeholder="Ex: 40"
              value={pct}
              onChange={(e) => setPct(e.target.value)}
            />
          </FormField>

          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>
            Titular: {100 - p}% · {nomeParceiro}: {p}%
          </p>
        </>
      )}
    </fieldset>
  );
}
