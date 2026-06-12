"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { createHonorario, type HonorarioState } from "./actions";
import { DivisaoAdvogado } from "./DivisaoAdvogado";
import { AREAS, TRIBUNAIS } from "@/lib/domain/honorario-constants";
import type { HonorarioTipo } from "@/lib/database.types";

const TIPOS: { value: HonorarioTipo; label: string; desc: string }[] = [
  { value: "fixo_parcelado", label: "Fixo parcelado", desc: "Valor total dividido em parcelas" },
  { value: "recorrente", label: "Recorrente", desc: "Mensalidade fixa" },
  { value: "ad_exitum", label: "Ad êxitum", desc: "% sobre o resultado, cobrado no fim" },
  { value: "fixo_exitum", label: "Fixo + êxito", desc: "Entrada + percentual no encerramento" },
];

export function HonorarioForm({
  clientes,
  advogados = [],
  clienteSelecionado,
}: {
  clientes: { id: string; nome: string }[];
  advogados?: { id: string; nome: string }[];
  clienteSelecionado?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<HonorarioState, FormData>(createHonorario, undefined);
  const [tipo, setTipo] = useState<HonorarioTipo>("fixo_parcelado");
  const [numParcelas, setNumParcelas] = useState(1);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 640 }}>
      {state?.error && <Alert>{state.error}</Alert>}

      <FormField label="Cliente *" htmlFor="cliente_id">
        <select
          id="cliente_id"
          name="cliente_id"
          className="form-control"
          required
          defaultValue={
            clienteSelecionado && clientes.some((c) => c.id === clienteSelecionado)
              ? clienteSelecionado
              : ""
          }
        >
          <option value="" disabled>
            Selecione…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </FormField>

      {advogados.length > 1 && (
        <FormField label="Advogado responsável" htmlFor="membro_id">
          <select id="membro_id" name="membro_id" className="form-control" defaultValue="">
            <option value="">Selecione…</option>
            {advogados.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Tipo de honorário *" htmlFor="tipo">
        <select
          id="tipo"
          name="tipo"
          className="form-control"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as HonorarioTipo)}
        >
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} — {t.desc}
            </option>
          ))}
        </select>
      </FormField>

      <div className="row">
        <div className="col-6">
          <FormField label="Área" htmlFor="area">
            <select id="area" name="area" className="form-control" defaultValue="">
              <option value="">—</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Tribunal" htmlFor="tribunal">
            <select id="tribunal" name="tribunal" className="form-control" defaultValue="">
              <option value="">—</option>
              {TRIBUNAIS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <FormField label="Processo" htmlFor="processo">
            <input id="processo" name="processo" className="form-control" placeholder="Nº ou descrição" />
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Parte contrária" htmlFor="parte_contraria">
            <input id="parte_contraria" name="parte_contraria" className="form-control" />
          </FormField>
        </div>
      </div>

      {/* Campos condicionais por tipo */}
      {tipo === "fixo_parcelado" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <FormField label="Valor total (R$) *" htmlFor="valor_total">
                <input id="valor_total" name="valor_total" type="number" step="0.01" min="0" className="form-control" required />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Frequência" htmlFor="frequencia">
                <select id="frequencia" name="frequencia" className="form-control" defaultValue="Mensal">
                  <option>Mensal</option>
                  <option>Quinzenal</option>
                  <option>Única</option>
                </select>
              </FormField>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <FormField label="Nº de parcelas (1–12)" htmlFor="num_parcelas">
                <input
                  id="num_parcelas"
                  name="num_parcelas"
                  type="number"
                  min="1"
                  max="12"
                  className="form-control"
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(Number(e.target.value))}
                />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="1º vencimento" htmlFor="data_primeira">
                <input id="data_primeira" name="data_primeira" type="date" className="form-control" />
              </FormField>
            </div>
          </div>
          {numParcelas === 1 && (
            <div className="checkbox-group" style={{ marginBottom: 16 }}>
              <input id="ja_pago_hoje" name="ja_pago_hoje" type="checkbox" />
              <label htmlFor="ja_pago_hoje" style={{ margin: 0 }}>
                Marcar como já pago hoje
              </label>
            </div>
          )}
        </fieldset>
      )}

      {tipo === "recorrente" && (
        <fieldset className="tipo-fields">
          <FormField label="Valor mensal (R$) *" htmlFor="valor_mensal">
            <input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" className="form-control" required />
          </FormField>
          <div className="row">
            <div className="col-6">
              <FormField label="Início" htmlFor="data_inicio">
                <input id="data_inicio" name="data_inicio" type="date" className="form-control" />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Fim (opcional)" htmlFor="data_fim">
                <input id="data_fim" name="data_fim" type="date" className="form-control" />
              </FormField>
            </div>
          </div>
        </fieldset>
      )}

      {tipo === "ad_exitum" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <FormField label="Valor da causa (R$) *" htmlFor="valor_causa">
                <input id="valor_causa" name="valor_causa" type="number" step="0.01" min="0" className="form-control" required />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="% de êxito *" htmlFor="percentual_exito">
                <input id="percentual_exito" name="percentual_exito" type="number" step="0.01" min="0" max="100" className="form-control" required />
              </FormField>
            </div>
          </div>
          <p style={{ fontSize: 12 }}>Sem parcelas por data — a cobrança de êxito é lançada após a sentença.</p>
        </fieldset>
      )}

      {tipo === "fixo_exitum" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <FormField label="Entrada (R$) *" htmlFor="valor_entrada">
                <input id="valor_entrada" name="valor_entrada" type="number" step="0.01" min="0" className="form-control" required />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Vencimento da entrada" htmlFor="data_primeira">
                <input id="data_primeira" name="data_primeira" type="date" className="form-control" />
              </FormField>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <FormField label="Valor da causa (R$)" htmlFor="valor_causa">
                <input id="valor_causa" name="valor_causa" type="number" step="0.01" min="0" className="form-control" />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="% de êxito" htmlFor="percentual_exito">
                <input id="percentual_exito" name="percentual_exito" type="number" step="0.01" min="0" max="100" className="form-control" />
              </FormField>
            </div>
          </div>
        </fieldset>
      )}

      <FormField label="Chave PIX (opcional — usa a do perfil se vazio)" htmlFor="chave_pix">
        <input id="chave_pix" name="chave_pix" className="form-control" />
      </FormField>

      <DivisaoAdvogado advogados={advogados} />

      <div className="fee-card-actions">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Criando…" : "Criar honorário"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/honorarios")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
