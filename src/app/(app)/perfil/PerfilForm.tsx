"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { updateProfile, uploadLogo, type PerfilState } from "./actions";
import type { Plano } from "@/lib/database.types";

interface Props {
  nome: string;
  cnpj: string | null;
  telefone: string | null;
  endereco: string | null;
  site: string | null;
  chavePix: string | null;
  foro: string | null;
  plano: Plano;
  logoUrl: string | null;
}

const PLANO_LABEL: Record<Plano, string> = {
  free: "Grátis",
  essencial: "Essencial",
  profissional: "Profissional",
};

export function PerfilForm({ nome, cnpj, telefone, endereco, site, chavePix, foro, plano, logoUrl }: Props) {
  const [state, formAction, pending] = useActionState<PerfilState, FormData>(updateProfile, undefined);
  const [logoState, logoFormAction, logoPending] = useActionState<PerfilState, FormData>(uploadLogo, undefined);
  const [preview, setPreview] = useState<string | null>(logoUrl);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {/* Logo */}
      <form action={logoFormAction} className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Logo do escritório</h3>
        {logoState?.error && <Alert>{logoState.error}</Alert>}
        {logoState?.success && <Alert variant="success">Logo atualizada.</Alert>}

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
          {preview ? (
            <Image
              src={preview}
              alt="Logo do escritório"
              width={80}
              height={80}
              style={{ objectFit: "contain", borderRadius: 8, border: "1px solid var(--border)" }}
              unoptimized
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                border: "2px dashed var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                fontSize: 28,
              }}
            >
              🏛️
            </div>
          )}
          <div style={{ flex: 1 }}>
            <input
              ref={fileRef}
              id="logo"
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              Escolher imagem
            </Button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              PNG, JPG ou WebP • Máx. 1 MB
            </p>
          </div>
        </div>

        <Button type="submit" variant="primary" disabled={logoPending}>
          {logoPending ? "Enviando…" : "Salvar logo"}
        </Button>
      </form>

      {/* Dados do escritório */}
      <form action={formAction} className="card" style={{ maxWidth: 560 }}>
        <h3 style={{ marginBottom: 16 }}>Dados do escritório</h3>
        {state?.error && <Alert>{state.error}</Alert>}
        {state?.success && <Alert variant="success">Perfil atualizado.</Alert>}

        <FormField label="Nome do escritório *" htmlFor="nome">
          <input
            id="nome"
            name="nome"
            className="form-control"
            required
            defaultValue={nome}
            placeholder="Escritório de Advocacia Silva & Associados"
          />
        </FormField>

        <div className="row">
          <div className="col-6">
            <FormField label="CNPJ" htmlFor="cnpj">
              <input
                id="cnpj"
                name="cnpj"
                className="form-control"
                defaultValue={cnpj ?? ""}
                placeholder="00.000.000/0000-00"
              />
            </FormField>
          </div>
          <div className="col-6">
            <FormField label="Telefone" htmlFor="telefone">
              <input
                id="telefone"
                name="telefone"
                className="form-control"
                defaultValue={telefone ?? ""}
                placeholder="(53) 99999-0000"
              />
            </FormField>
          </div>
        </div>

        <FormField label="Endereço" htmlFor="endereco">
          <input
            id="endereco"
            name="endereco"
            className="form-control"
            defaultValue={endereco ?? ""}
            placeholder="Rua Example, 123 — Centro, Pelotas/RS"
          />
        </FormField>

        <FormField label="Site" htmlFor="site">
          <input
            id="site"
            name="site"
            className="form-control"
            defaultValue={site ?? ""}
            placeholder="https://escritorio.adv.br"
            type="url"
          />
        </FormField>

        <FormField label="Foro (comarca/UF)" htmlFor="foro" help="Usado no contrato de honorários.">
          <input
            id="foro"
            name="foro"
            className="form-control"
            defaultValue={foro ?? ""}
            placeholder="Pelotas/RS"
          />
        </FormField>

        <FormField
          label="Chave PIX"
          htmlFor="chave_pix"
          help="Usada na página pública de pagamento e nos lembretes."
        >
          <input
            id="chave_pix"
            name="chave_pix"
            className="form-control"
            defaultValue={chavePix ?? ""}
            placeholder="CPF, e-mail, telefone ou aleatória"
          />
        </FormField>

        <FormField label="Plano atual">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600 }}>{PLANO_LABEL[plano]}</span>
            <a href="/planos" style={{ fontSize: 14, color: "var(--link)" }}>
              Gerenciar plano →
            </a>
          </div>
        </FormField>

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Salvando…" : "Salvar perfil"}
        </Button>
      </form>
    </div>
  );
}
