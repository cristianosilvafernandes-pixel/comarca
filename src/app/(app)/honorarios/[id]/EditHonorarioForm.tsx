"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { updateHonorario, type UpdateHonorarioState } from "../actions";
import { DivisaoAdvogado } from "../DivisaoAdvogado";
import { AREAS, TRIBUNAIS, TIPO_LABEL } from "@/lib/domain/honorario-constants";
import type { HonorarioTipo } from "@/lib/database.types";

interface Props {
  id: string;
  tipo: HonorarioTipo;
  processo: string | null;
  area: string | null;
  tribunal: string | null;
  parteContraria: string | null;
  chavePix: string | null;
  valorTotal: number | null;
  valorMensal: number | null;
  valorEntrada: number | null;
  valorCausa: number | null;
  percentualExito: number | null;
  advogados: { id: string; nome: string }[];
  parceiroId: string | null;
  parceiroPercentual: number | null;
  cancelHref: string;
}

export function EditHonorarioForm({
  id, tipo, processo, area, tribunal, parteContraria,
  chavePix, valorTotal, valorMensal, valorEntrada, valorCausa,
  percentualExito, advogados, parceiroId, parceiroPercentual, cancelHref,
}: Props) {
  const [state, formAction, pending] = useActionState<UpdateHonorarioState, FormData>(
    updateHonorario,
    undefined,
  );

  return (
    <form action={formAction} className="card" style={{ maxWidth: 640 }}>
      {state?.error && <Alert>{state.error}</Alert>}

      <input type="hidden" name="id" value={id} />

      <FormField label="Tipo de honorário" help="O tipo não pode ser alterado após a criação.">
        <input className="form-control" value={TIPO_LABEL[tipo]} disabled readOnly />
      </FormField>

      <div className="row">
        <div className="col-6">
          <FormField label="Área" htmlFor="area">
            <select id="area" name="area" className="form-control" defaultValue={area ?? ""}>
              <option value="">—</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Tribunal" htmlFor="tribunal">
            <select id="tribunal" name="tribunal" className="form-control" defaultValue={tribunal ?? ""}>
              <option value="">—</option>
              {TRIBUNAIS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </FormField>
        </div>
      </div>

      <div className="row">
        <div className="col-6">
          <FormField label="Processo" htmlFor="processo">
            <input
              id="processo" name="processo" className="form-control"
              placeholder="Nº ou descrição" defaultValue={processo ?? ""}
            />
          </FormField>
        </div>
        <div className="col-6">
          <FormField label="Parte contrária" htmlFor="parte_contraria">
            <input
              id="parte_contraria" name="parte_contraria" className="form-control"
              defaultValue={parteContraria ?? ""}
            />
          </FormField>
        </div>
      </div>

      {(tipo === "fixo_parcelado") && (
        <FormField label="Valor total (R$)" htmlFor="valor_total">
          <input
            id="valor_total" name="valor_total" type="number" step="0.01" min="0"
            className="form-control" defaultValue={valorTotal ?? ""}
          />
        </FormField>
      )}

      {tipo === "recorrente" && (
        <FormField label="Valor mensal (R$)" htmlFor="valor_mensal">
          <input
            id="valor_mensal" name="valor_mensal" type="number" step="0.01" min="0"
            className="form-control" defaultValue={valorMensal ?? ""}
          />
        </FormField>
      )}

      {(tipo === "ad_exitum" || tipo === "fixo_exitum") && (
        <div className="row">
          <div className="col-6">
            <FormField label="Valor da causa (R$)" htmlFor="valor_causa">
              <input
                id="valor_causa" name="valor_causa" type="number" step="0.01" min="0"
                className="form-control" defaultValue={valorCausa ?? ""}
              />
            </FormField>
          </div>
          <div className="col-6">
            <FormField label="% de êxito" htmlFor="percentual_exito">
              <input
                id="percentual_exito" name="percentual_exito" type="number" step="0.01" min="0" max="100"
                className="form-control" defaultValue={percentualExito ?? ""}
              />
            </FormField>
          </div>
        </div>
      )}

      {tipo === "fixo_exitum" && (
        <FormField label="Entrada (R$)" htmlFor="valor_entrada">
          <input
            id="valor_entrada" name="valor_entrada" type="number" step="0.01" min="0"
            className="form-control" defaultValue={valorEntrada ?? ""}
          />
        </FormField>
      )}

      <FormField label="Chave PIX" htmlFor="chave_pix">
        <input
          id="chave_pix" name="chave_pix" className="form-control"
          placeholder="Deixe vazio para usar a do perfil"
          defaultValue={chavePix ?? ""}
        />
      </FormField>

      <DivisaoAdvogado
        advogados={advogados}
        parceiroIdInicial={parceiroId}
        percentualInicial={parceiroPercentual}
      />

      <div className="fee-card-actions">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <a href={cancelHref} className="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  );
}
