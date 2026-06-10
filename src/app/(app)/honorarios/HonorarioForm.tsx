"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createHonorario, type HonorarioState } from "./actions";
import type { HonorarioTipo } from "@/lib/database.types";

const AREAS = ["Trabalhista", "Cível", "Família", "Criminal", "Previdenciário", "Tributário", "Consumidor", "Outro"];
const TRIBUNAIS = ["TJRS", "TJSP", "TJRJ", "TRF4", "TST", "STJ", "Outro"];
const TIPOS: { value: HonorarioTipo; label: string; desc: string }[] = [
  { value: "fixo_parcelado", label: "Fixo parcelado", desc: "Valor total dividido em parcelas" },
  { value: "recorrente", label: "Recorrente", desc: "Mensalidade fixa" },
  { value: "ad_exitum", label: "Ad êxitum", desc: "% sobre o resultado, cobrado no fim" },
  { value: "fixo_exitum", label: "Fixo + êxito", desc: "Entrada + percentual no encerramento" },
];

export function HonorarioForm({
  clientes,
  advogados = [],
}: {
  clientes: { id: string; nome: string }[];
  advogados?: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<HonorarioState, FormData>(createHonorario, undefined);
  const [tipo, setTipo] = useState<HonorarioTipo>("fixo_parcelado");
  const [numParcelas, setNumParcelas] = useState(1);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 640 }}>
      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <div className="form-group">
        <label htmlFor="cliente_id">Cliente *</label>
        <select id="cliente_id" name="cliente_id" className="form-control" required defaultValue="">
          <option value="" disabled>
            Selecione…
          </option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>

      {advogados.length > 1 && (
        <div className="form-group">
          <label htmlFor="membro_id">Advogado responsável</label>
          <select id="membro_id" name="membro_id" className="form-control" defaultValue="">
            <option value="">Selecione…</option>
            {advogados.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="tipo">Tipo de honorário *</label>
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
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="area">Área</label>
            <select id="area" name="area" className="form-control" defaultValue="">
              <option value="">—</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="tribunal">Tribunal</label>
            <select id="tribunal" name="tribunal" className="form-control" defaultValue="">
              <option value="">—</option>
              {TRIBUNAIS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="processo">Processo</label>
            <input id="processo" name="processo" className="form-control" placeholder="Nº ou descrição" />
          </div>
        </div>
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="parte_contraria">Parte contrária</label>
            <input id="parte_contraria" name="parte_contraria" className="form-control" />
          </div>
        </div>
      </div>

      {/* Campos condicionais por tipo */}
      {tipo === "fixo_parcelado" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="valor_total">Valor total (R$) *</label>
                <input id="valor_total" name="valor_total" type="number" step="0.01" min="0" className="form-control" required />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="frequencia">Frequência</label>
                <select id="frequencia" name="frequencia" className="form-control" defaultValue="Mensal">
                  <option>Mensal</option>
                  <option>Quinzenal</option>
                  <option>Única</option>
                </select>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="num_parcelas">Nº de parcelas (1–12)</label>
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
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="data_primeira">1º vencimento</label>
                <input id="data_primeira" name="data_primeira" type="date" className="form-control" />
              </div>
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
          <div className="form-group">
            <label htmlFor="valor_mensal">Valor mensal (R$) *</label>
            <input id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0" className="form-control" required />
          </div>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="data_inicio">Início</label>
                <input id="data_inicio" name="data_inicio" type="date" className="form-control" />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="data_fim">Fim (opcional)</label>
                <input id="data_fim" name="data_fim" type="date" className="form-control" />
              </div>
            </div>
          </div>
        </fieldset>
      )}

      {tipo === "ad_exitum" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="valor_causa">Valor da causa (R$) *</label>
                <input id="valor_causa" name="valor_causa" type="number" step="0.01" min="0" className="form-control" required />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="percentual_exito">% de êxito *</label>
                <input id="percentual_exito" name="percentual_exito" type="number" step="0.01" min="0" max="100" className="form-control" required />
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12 }}>Sem parcelas por data — a cobrança de êxito é lançada após a sentença.</p>
        </fieldset>
      )}

      {tipo === "fixo_exitum" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="valor_entrada">Entrada (R$) *</label>
                <input id="valor_entrada" name="valor_entrada" type="number" step="0.01" min="0" className="form-control" required />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="data_primeira">Vencimento da entrada</label>
                <input id="data_primeira" name="data_primeira" type="date" className="form-control" />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="valor_causa">Valor da causa (R$)</label>
                <input id="valor_causa" name="valor_causa" type="number" step="0.01" min="0" className="form-control" />
              </div>
            </div>
            <div className="col-6">
              <div className="form-group">
                <label htmlFor="percentual_exito">% de êxito</label>
                <input id="percentual_exito" name="percentual_exito" type="number" step="0.01" min="0" max="100" className="form-control" />
              </div>
            </div>
          </div>
        </fieldset>
      )}

      <div className="form-group">
        <label htmlFor="chave_pix">Chave PIX (opcional — usa a do perfil se vazio)</label>
        <input id="chave_pix" name="chave_pix" className="form-control" />
      </div>

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
