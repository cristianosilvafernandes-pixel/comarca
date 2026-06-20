"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { maskCPF } from "@/lib/utils/cpf";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  registrarSucumbencial,
  marcarSucumbencialRecebido,
  deleteSucumbencial,
  type SucumbencialState,
} from "../sucumbenciais";
import type { StatusSucumbencial } from "@/lib/database.types";

export interface SucumbencialRow {
  id: string;
  valor: number;
  doc_adversario: string;
  status: StatusSucumbencial;
  data_recebimento: string | null;
  divisao_parceiro_pct: number | null;
  parceiro: { nome: string } | null;
}

interface Props {
  honorarioId: string;
  sucumbenciais: SucumbencialRow[];
  advogados: { id: string; nome: string }[];
}

function StatusBadge({ status }: { status: StatusSucumbencial }) {
  return status === "recebido" ? (
    <span className="badge badge-pago">Recebido</span>
  ) : (
    <span className="badge badge-vencendo">Aguardando</span>
  );
}

function SucumbencialItem({
  suc,
  honorarioId,
}: {
  suc: SucumbencialRow;
  honorarioId: string;
}) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div
      style={{
        background: "var(--gray-bg)",
        borderRadius: 8,
        padding: "12px 16px",
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700 }}>{formatCurrency(suc.valor)}</div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
          Parte adversária: {suc.doc_adversario}
        </div>
        {suc.data_recebimento && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Recebido em: {formatDate(suc.data_recebimento)}
          </div>
        )}
        {suc.parceiro && suc.divisao_parceiro_pct != null && (
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Divisão: {suc.parceiro.nome} {suc.divisao_parceiro_pct}% · Titular{" "}
            {100 - suc.divisao_parceiro_pct}%
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
        <StatusBadge status={suc.status} />
        <div style={{ display: "flex", gap: 6 }}>
          {suc.status === "aguardando" && (
            <Button
              type="button"
              variant="success"
              disabled={isPending}
              onClick={() =>
                startTransition(() => void marcarSucumbencialRecebido(suc.id, honorarioId))
              }
            >
              {isPending ? "Salvando…" : "Marcar recebido"}
            </Button>
          )}
          {!confirm ? (
            <Button type="button" variant="secondary" onClick={() => setConfirm(true)}>
              Excluir
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="danger"
                disabled={isPending}
                onClick={() =>
                  startTransition(() => void deleteSucumbencial(suc.id, honorarioId))
                }
              >
                Confirmar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function RegistrarForm({
  honorarioId,
  advogados,
  onClose,
}: {
  honorarioId: string;
  advogados: { id: string; nome: string }[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<SucumbencialState, FormData>(
    registrarSucumbencial,
    undefined,
  );
  const [status, setStatus] = useState<StatusSucumbencial>("aguardando");
  const [dividir, setDividir] = useState(false);
  const [doc, setDoc] = useState("");

  useEffect(() => {
    if (state !== undefined && !state?.error) {
      onClose();
    }
  }, [state, onClose]);

  return (
    <form
      action={formAction}
      style={{
        background: "var(--primary-light)",
        border: "1px solid var(--gray-border)",
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <input type="hidden" name="honorario_id" value={honorarioId} />

      {state?.error && <Alert style={{ marginBottom: 8 }}>{state.error}</Alert>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Valor (R$) *
          </label>
          <input
            name="valor"
            type="number"
            step="0.01"
            min="0.01"
            className="form-control"
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            CPF/CNPJ da parte adversária *
          </label>
          <input
            name="doc_adversario"
            className="form-control"
            value={doc}
            onChange={(e) => setDoc(maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            required
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
            Status *
          </label>
          <select
            name="status"
            className="form-control"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusSucumbencial)}
          >
            <option value="aguardando">Aguardando pagamento</option>
            <option value="recebido">Já recebido</option>
          </select>
        </div>
        {status === "recebido" && (
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
              Data do recebimento *
            </label>
            <input
              name="data_recebimento"
              type="date"
              className="form-control"
              defaultValue={new Date().toISOString().split("T")[0]}
              required
            />
          </div>
        )}
      </div>

      {advogados.length > 1 && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              name="dividir_parceiro"
              checked={dividir}
              onChange={(e) => setDividir(e.target.checked)}
            />
            <span style={{ fontSize: 13 }}>Dividir com advogado parceiro</span>
          </label>
          {dividir && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginTop: 8,
              }}
            >
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  Advogado parceiro
                </label>
                <select name="divisao_parceiro_id" className="form-control">
                  {advogados.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  % do parceiro
                </label>
                <input
                  name="divisao_parceiro_pct"
                  type="number"
                  min="1"
                  max="99"
                  className="form-control"
                  placeholder="Ex: 40"
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Registrar sucumbencial"}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function SucumbenciaisSection({ honorarioId, sucumbenciais, advogados }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0 }}>⚖️ Sucumbencial ({sucumbenciais.length})</h3>
        {!showForm && (
          <Button type="button" variant="secondary" onClick={() => setShowForm(true)}>
            + Registrar sucumbencial
          </Button>
        )}
      </div>

      {showForm && (
        <RegistrarForm
          honorarioId={honorarioId}
          advogados={advogados}
          onClose={() => setShowForm(false)}
        />
      )}

      {sucumbenciais.length === 0 && !showForm && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Nenhum honorário sucumbencial registrado.
        </p>
      )}

      {sucumbenciais.map((suc) => (
        <SucumbencialItem key={suc.id} suc={suc} honorarioId={honorarioId} />
      ))}
    </div>
  );
}
