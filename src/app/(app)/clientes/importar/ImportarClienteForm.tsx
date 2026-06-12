"use client";

import { useActionState, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { saveCliente, type ClienteState } from "../actions";
import { maskCPF } from "@/lib/utils/cpf";
import { maskPhone } from "@/lib/utils/phone";

type UploadState = "idle" | "loading" | "success" | "manual" | "error";

interface Dados {
  nome?: string;
  cpf?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
}

export function ImportarClienteForm({ userId }: { userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [up, setUp] = useState<UploadState>("idle");
  const [aviso, setAviso] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [state, formAction, pending] = useActionState<ClienteState, FormData>(saveCliente, undefined);

  function aplicar(d: Dados) {
    if (d.nome) setNome(d.nome);
    if (d.cpf) setCpf(maskCPF(d.cpf));
    if (d.whatsapp) setWhatsapp(maskPhone(d.whatsapp));
    if (d.email) setEmail(d.email);
    if (d.endereco) setEndereco(d.endereco);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUp("loading");
    setAviso(null);

    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage.from("documentos").upload(path, file, {
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) {
        setUp("error");
        setAviso("Falha ao enviar o arquivo. Tente novamente.");
        return;
      }

      const res = await fetch("/clientes/importar/extrair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_path: path }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.dados_extraidos) {
        aplicar(data.dados_extraidos as Dados);
        setUp("success");
      } else {
        // OCR ainda não configurado / falhou → seguir no preenchimento manual.
        setUp("manual");
        setAviso("Documento enviado, mas a extração automática não está disponível agora. Preencha os dados manualmente.");
      }
    } catch {
      setUp("error");
      setAviso("Erro inesperado no envio.");
    }
  }

  return (
    <>
      <div
        className="upload-zone"
        onClick={() => fileRef.current?.click()}
        style={{ cursor: "pointer" }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          style={{ display: "none" }}
          onChange={onFile}
        />
        {up === "loading" ? (
          <div className="upload-zone-content">
            <span className="upload-spinner" />
            <span>Lendo documento…</span>
          </div>
        ) : up === "success" ? (
          <div className="upload-zone-content">
            <span className="badge badge-pago">✓ Dados extraídos do documento</span>
            <span style={{ fontSize: 12 }}>Confira abaixo e salve.</span>
          </div>
        ) : (
          <div className="upload-zone-content">
            <span className="upload-zone-icon">📄</span>
            <span>Importar dados do documento (procuração, contrato…)</span>
          </div>
        )}
      </div>

      {aviso && (
        <Alert variant="info" style={{ marginBottom: 16, color: "var(--body)" }}>
          {aviso}
        </Alert>
      )}

      <form action={formAction} className="card" style={{ maxWidth: 560 }}>
        {state?.error && <Alert>{state.error}</Alert>}

        <FormField label="Nome completo *" htmlFor="nome">
          <input id="nome" name="nome" className="form-control" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João da Silva" />
        </FormField>
        <FormField label="CPF *" htmlFor="cpf">
          <input id="cpf" name="cpf" className="form-control" required value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" />
        </FormField>
        <FormField label="WhatsApp *" htmlFor="whatsapp">
          <input id="whatsapp" name="whatsapp" className="form-control" required value={whatsapp} onChange={(e) => setWhatsapp(maskPhone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" />
        </FormField>
        <FormField label="E-mail (opcional)" htmlFor="email">
          <input id="email" name="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@email.com" />
        </FormField>
        <FormField label="Endereço (opcional)" htmlFor="endereco">
          <input id="endereco" name="endereco" className="form-control" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, cidade/UF" />
        </FormField>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar cliente"}
        </Button>
      </form>
    </>
  );
}
