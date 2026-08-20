"use client";

import { useActionState, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { initials } from "@/lib/utils/initials";
import { saveAdvogado, type AdvogadoState } from "./actions";
import type { Advogado } from "@/lib/database.types";

export function AdvogadoForm({ advogado }: { advogado?: Advogado }) {
  const [state, formAction, pending] = useActionState<AdvogadoState, FormData>(
    saveAdvogado,
    undefined,
  );
  const [preview, setPreview] = useState<string | null>(advogado?.foto_url ?? null);
  const [nome, setNome] = useState(advogado?.nome ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={formAction} className="card" style={{ maxWidth: 480 }}>
      {advogado?.id && <input type="hidden" name="id" value={advogado.id} />}

      {state?.error && <Alert>{state.error}</Alert>}

      <FormField label="Foto" htmlFor="adv-foto">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {preview ? (
            <Image
              src={preview}
              alt="Foto do advogado"
              width={80}
              height={80}
              style={{
                objectFit: "cover",
                borderRadius: "9999px",
                border: "1px solid var(--hairline)",
              }}
              unoptimized
            />
          ) : (
            <div
              className="client-initials-avatar"
              style={{ width: 80, height: 80, fontSize: 24 }}
            >
              {nome.trim() ? initials(nome) : "?"}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <input
              ref={fileRef}
              id="adv-foto"
              name="foto"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? "Trocar foto" : "Escolher foto"}
            </Button>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              PNG, JPG ou WebP • Máx. 2 MB
            </p>
          </div>
        </div>
      </FormField>

      <FormField label="Nome completo *" htmlFor="adv-nome">
        <input
          id="adv-nome"
          name="nome"
          className="form-control"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </FormField>

      <FormField label="OAB" htmlFor="adv-oab">
        <input
          id="adv-oab"
          name="oab"
          className="form-control"
          defaultValue={advogado?.oab ?? ""}
          placeholder="Ex: OAB/RS 123.456"
        />
      </FormField>

      <Button type="submit" disabled={pending} style={{ marginTop: 8 }}>
        {pending ? "Salvando…" : advogado?.id ? "Salvar alterações" : "Cadastrar advogado"}
      </Button>
    </form>
  );
}
