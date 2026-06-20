"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { createHonorario, type HonorarioState } from "./actions";
import { DivisaoAdvogado } from "./DivisaoAdvogado";
import { AREAS, TRIBUNAIS } from "@/lib/domain/honorario-constants";
import type { HonorarioTipo } from "@/lib/database.types";

const TIPOS: { value: HonorarioTipo; label: string; desc: string }[] = [
  { value: "fixo_parcelado", label: "Valor fixo (à vista ou parcelado)", desc: "Contrato fechado, à vista ou dividido em parcelas." },
  { value: "ad_exitum", label: "Percentual ad exitum", desc: "Recebe apenas no sucesso/sentença final." },
  { value: "recorrente", label: "Recorrente mensal", desc: "Mensalidade regular (assessoria contínua)." },
  { value: "fixo_exitum", label: "Fixo + Êxito", desc: "Entrada fixa agora + percentual sobre o resultado final." },
];

const PARCELAS_OPTIONS = [
  { value: 1, label: "1x (À vista)" },
  ...Array.from({ length: 11 }, (_, i) => ({ value: i + 2, label: `${i + 2}x` })),
];

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
  const [valorTotal, setValorTotal] = useState("");
  const [valorMensal, setValorMensal] = useState("");
  const [valorEntrada, setValorEntrada] = useState("");

  const aVista = numParcelas === 1;
  const frequenciaAuto = aVista ? "Única" : undefined;

  const valorPorParcela = (() => {
    if (tipo === "fixo_parcelado") {
      const v = parseFloat(valorTotal.replace(",", "."));
      if (v > 0 && numParcelas > 0) return v / numParcelas;
    }
    return null;
  })();

  // reset parcelas ao trocar tipo
  useEffect(() => { setNumParcelas(1); }, [tipo]);

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
          <option value="" disabled>Selecione…</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
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

      <div className="row">
        <div className="col-6">
          <FormField label="Área" htmlFor="area">
            <select id="area" name="area" className="form-control" defaultValue="">
              <option value="">—</option>
              {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Tribunal" htmlFor="tribunal">
            <select id="tribunal" name="tribunal" className="form-control" defaultValue="">
              <option value="">—</option>
              {TRIBUNAIS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <FormField label="Número do Processo (opcional)" htmlFor="processo">
            <input id="processo" name="processo" className="form-control" placeholder="0000000-00.0000.8.21.0000" />
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Parte Contrária (opcional)" htmlFor="parte_contraria">
            <input id="parte_contraria" name="parte_contraria" className="form-control" placeholder="Ex: Manserv S.A." />
          </FormField>
        </div>
      </div>

      {/* Tipo de honorário — radio cards */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 8 }}>
          Tipo de Honorário *
        </label>
        <input type="hidden" name="tipo" value={tipo} />
        <div className="radio-group">
          {TIPOS.map((t) => (
            <label
              key={t.value}
              className={`radio-option${tipo === t.value ? " selected" : ""}`}
              style={{ cursor: "pointer" }}
            >
              <input
                type="radio"
                name="_tipo_ui"
                value={t.value}
                checked={tipo === t.value}
                onChange={() => setTipo(t.value)}
              />
              <span>
                <span style={{ display: "block", fontWeight: 500, fontSize: 14 }}>{t.label}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--mute)", marginTop: 2 }}>{t.desc}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Campos condicionais por tipo */}
      {tipo === "fixo_parcelado" && (
        <fieldset className="tipo-fields">
          <FormField label="Valor Total *" htmlFor="valor_total">
            <input
              id="valor_total"
              name="valor_total"
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              required
              value={valorTotal}
              onChange={(e) => setValorTotal(e.target.value)}
              placeholder="R$ 0,00"
            />
          </FormField>

          <div className="row">
            <div className="col-6">
              <FormField label="Parcelas *" htmlFor="num_parcelas">
                <select
                  id="num_parcelas"
                  name="num_parcelas"
                  className="form-control"
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(Number(e.target.value))}
                >
                  {PARCELAS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="Frequência *" htmlFor="frequencia">
                {aVista ? (
                  <>
                    <input type="hidden" name="frequencia" value="Única" />
                    <select id="frequencia" className="form-control" value="Única" disabled>
                      <option>Única</option>
                    </select>
                  </>
                ) : (
                  <select id="frequencia" name="frequencia" className="form-control" defaultValue="Mensal">
                    <option>Mensal</option>
                    <option>Quinzenal</option>
                  </select>
                )}
              </FormField>
            </div>
          </div>

          {aVista && (
            <div className="checkbox-group" style={{ marginBottom: 12 }}>
              <input id="ja_pago_hoje" name="ja_pago_hoje" type="checkbox" />
              <label htmlFor="ja_pago_hoje" style={{ margin: 0, fontSize: 14 }}>
                Marcar como já pago (pagamento realizado hoje)
              </label>
            </div>
          )}

          {valorPorParcela !== null && (
            <div style={{
              background: "var(--canvas-soft)",
              border: "1px solid var(--hairline)",
              borderRadius: "var(--radius-sm)",
              padding: "12px 16px",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--mute)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 }}>
                Valor calculado por parcela:
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink)" }}>
                {formatBRL(valorPorParcela)}
              </div>
            </div>
          )}

          <FormField label="Data da 1ª Parcela *" htmlFor="data_primeira">
            <input id="data_primeira" name="data_primeira" type="date" className="form-control" required />
          </FormField>
        </fieldset>
      )}

      {tipo === "recorrente" && (
        <fieldset className="tipo-fields">
          <FormField label="Valor mensal (R$) *" htmlFor="valor_mensal">
            <input
              id="valor_mensal"
              name="valor_mensal"
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              required
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
              placeholder="R$ 0,00"
            />
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
          <p style={{ fontSize: 12, color: "var(--mute)" }}>Sem parcelas por data — a cobrança de êxito é lançada após a sentença.</p>
        </fieldset>
      )}

      {tipo === "fixo_exitum" && (
        <fieldset className="tipo-fields">
          <div className="row">
            <div className="col-6">
              <FormField label="Entrada (R$) *" htmlFor="valor_entrada">
                <input
                  id="valor_entrada"
                  name="valor_entrada"
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  required
                  value={valorEntrada}
                  onChange={(e) => setValorEntrada(e.target.value)}
                  placeholder="R$ 0,00"
                />
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
