"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { maskCPF } from "@/lib/utils/cpf";
import { maskCNPJ } from "@/lib/utils/doc";
import { maskPhone } from "@/lib/utils/phone";
import { saveCliente, type ClienteState } from "./actions";
import type { Cliente } from "@/lib/database.types";

export function ClienteForm({
  cliente,
  advogados = [],
}: {
  cliente?: Cliente;
  advogados?: { id: string; nome: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ClienteState, FormData>(saveCliente, undefined);

  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">(cliente?.tipo_pessoa ?? "PF");
  const [cpf, setCpf] = useState(cliente?.cpf ? maskCPF(cliente.cpf) : "");
  const [cnpj, setCnpj] = useState(cliente?.cnpj ? maskCNPJ(cliente.cnpj) : "");
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ? maskPhone(cliente.whatsapp.replace(/^\+?55/, "")) : "");

  return (
    <form action={formAction} className="card" style={{ maxWidth: 560 }}>
      {cliente?.id && <input type="hidden" name="id" value={cliente.id} />}
      {state?.error && <Alert>{state.error}</Alert>}

      {!cliente && (
        <div style={{ marginBottom: 20 }}>
          <a href="/clientes/importar" className="btn btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
            📎 Importar de documento
          </a>
        </div>
      )}

      {/* Toggle PF / PJ */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {(["PF", "PJ"] as const).map((t) => (
          <label
            key={t}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontWeight: tipoPessoa === t ? 600 : 400,
            }}
          >
            <input
              type="radio"
              name="tipo_pessoa"
              value={t}
              checked={tipoPessoa === t}
              onChange={() => setTipoPessoa(t)}
            />
            {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
          </label>
        ))}
      </div>

      <FormField label="Nome *" htmlFor="nome">
        <input
          id="nome"
          name="nome"
          className="form-control"
          defaultValue={cliente?.nome ?? ""}
          placeholder={tipoPessoa === "PJ" ? "Razão social" : "Nome completo"}
          required
        />
      </FormField>

      {tipoPessoa === "PF" ? (
        <div className="row">
          <div className="col-6">
            <FormField label="CPF *" htmlFor="cpf">
              <input
                id="cpf"
                name="cpf"
                className="form-control"
                value={cpf}
                onChange={(e) => setCpf(maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
            </FormField>
          </div>
          <div className="col-6">
            <FormField label="WhatsApp *" htmlFor="whatsapp">
              <input
                id="whatsapp"
                name="whatsapp"
                className="form-control"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(53) 99999-8888"
                inputMode="tel"
                required
              />
            </FormField>
          </div>
        </div>
      ) : (
        <>
          <div className="row">
            <div className="col-6">
              <FormField label="CNPJ *" htmlFor="cnpj">
                <input
                  id="cnpj"
                  name="cnpj"
                  className="form-control"
                  value={cnpj}
                  onChange={(e) => setCnpj(maskCNPJ(e.target.value))}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  required
                />
              </FormField>
            </div>
            <div className="col-6">
              <FormField label="WhatsApp *" htmlFor="whatsapp">
                <input
                  id="whatsapp"
                  name="whatsapp"
                  className="form-control"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                  placeholder="(53) 99999-8888"
                  inputMode="tel"
                  required
                />
              </FormField>
            </div>
          </div>
          <FormField label="Responsável legal" htmlFor="responsavel_legal">
            <input
              id="responsavel_legal"
              name="responsavel_legal"
              className="form-control"
              defaultValue={cliente?.responsavel_legal ?? ""}
              placeholder="Nome do responsável"
            />
          </FormField>
        </>
      )}

      <FormField label="E-mail" htmlFor="email">
        <input id="email" name="email" type="email" className="form-control" defaultValue={cliente?.email ?? ""} />
      </FormField>

      <FormField label="Endereço" htmlFor="endereco">
        <input id="endereco" name="endereco" className="form-control" defaultValue={cliente?.endereco ?? ""} />
      </FormField>

      {advogados.length > 1 && (
        <FormField label="Advogado responsável" htmlFor="membro_id">
          <select
            id="membro_id"
            name="membro_id"
            className="form-control"
            defaultValue={cliente?.membro_id ?? ""}
          >
            <option value="">Selecione…</option>
            {advogados.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
        </FormField>
      )}

      <div className="fee-card-actions">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : cliente?.id ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/clientes")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
