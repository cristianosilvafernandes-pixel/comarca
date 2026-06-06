"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { maskCPF } from "@/lib/utils/cpf";
import { maskPhone } from "@/lib/utils/phone";
import { saveCliente, type ClienteState } from "./actions";
import type { Cliente } from "@/lib/database.types";

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ClienteState, FormData>(saveCliente, undefined);

  const [cpf, setCpf] = useState(cliente?.cpf ? maskCPF(cliente.cpf) : "");
  const [whatsapp, setWhatsapp] = useState(cliente?.whatsapp ? maskPhone(cliente.whatsapp) : "");

  return (
    <form action={formAction} className="card" style={{ maxWidth: 560 }}>
      {cliente?.id && <input type="hidden" name="id" value={cliente.id} />}
      {state?.error && <div className="auth-alert error">{state.error}</div>}

      <div className="form-group">
        <label htmlFor="nome">Nome *</label>
        <input id="nome" name="nome" className="form-control" defaultValue={cliente?.nome ?? ""} required />
      </div>

      <div className="row">
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="cpf">CPF *</label>
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
          </div>
        </div>
        <div className="col-6">
          <div className="form-group">
            <label htmlFor="whatsapp">WhatsApp *</label>
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
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="form-control" defaultValue={cliente?.email ?? ""} />
      </div>

      <div className="form-group">
        <label htmlFor="endereco">Endereço</label>
        <input id="endereco" name="endereco" className="form-control" defaultValue={cliente?.endereco ?? ""} />
      </div>

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
