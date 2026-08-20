import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { maskCPF } from "@/lib/utils/cpf";
import { maskCNPJ } from "@/lib/utils/doc";
import { maskPhone } from "@/lib/utils/phone";
import { formatCurrency } from "@/lib/utils/format";
import { resolveStatus } from "@/lib/utils/status";
import { parseAdv } from "@/lib/utils/adv-filter";
import { AdvogadoFilter } from "@/components/AdvogadoFilter";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = {
  title: "Clientes — Comarca Honorários",
};

function initials(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

type Parcela = {
  valor: number;
  vencimento: string;
  status_registrado: "em_aberto" | "pago" | "pago_verificacao";
};

type Honorario = {
  id: string;
  processo: string | null;
  area: string | null;
  parcelas: Parcela[];
};

type Cliente = {
  id: string;
  nome: string;
  tipo_pessoa: "PF" | "PJ";
  cpf: string | null;
  cnpj: string | null;
  responsavel_legal: string | null;
  whatsapp: string;
  email: string | null;
  honorarios: Honorario[];
};

function clienteStats(honorarios: Honorario[]) {
  const count = honorarios.length;
  const abertas = honorarios.flatMap((h) =>
    h.parcelas
      .filter((p) => p.status_registrado === "em_aberto")
      .map((p) => ({ ...p, st: resolveStatus(p.status_registrado, p.vencimento) })),
  );
  const totalAberto = abertas.reduce((s, p) => s + p.valor, 0);

  let statusLabel = "";
  let statusCor = "var(--ink)";
  if (abertas.some((p) => p.st === "atrasado")) {
    statusLabel = "Atrasado";
    statusCor = "var(--error)";
  } else if (abertas.some((p) => p.st === "vencendo")) {
    statusLabel = "Vencendo";
    statusCor = "var(--warning-deep)";
  } else if (abertas.length > 0) {
    statusLabel = "Pendente";
  }

  const processoAtivo =
    honorarios.find((h) => h.processo && h.parcelas.some((p) => p.status_registrado === "em_aberto")) ??
    honorarios.find((h) => h.processo);

  return { count, statusLabel, statusCor, totalAberto, processoAtivo };
}

const ERROS: Record<string, string> = {
  tem_honorarios: "Não é possível excluir: este cliente possui honorários. Encerre-os antes.",
  falha_excluir: "Não foi possível excluir o cliente.",
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; adv?: string }>;
}) {
  const sp = await searchParams;
  const { error } = sp;
  const advIds = parseAdv(sp.adv);
  const supabase = await createClient();

  const [clientesResult, advogadosResult] = await Promise.all([
    (() => {
      let q = supabase
        .from("clientes")
        .select(
          "id, nome, tipo_pessoa, cpf, cnpj, responsavel_legal, whatsapp, email, honorarios(id, processo, area, parcelas(valor, vencimento, status_registrado))",
        )
        .order("nome");
      if (advIds.length > 0) q = q.in("membro_id", advIds);
      return q;
    })(),
    supabase.from("advogados").select("id, nome").eq("ativo", true).order("nome"),
  ]);

  const clientes = (clientesResult.data ?? []) as unknown as Cliente[];
  const advogados = advogadosResult.data ?? [];

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/clientes/novo" className="btn btn-primary">
            + Novo cliente
          </Link>
        }
      />

      {error && ERROS[error] && <Alert>{ERROS[error]}</Alert>}

      <AdvogadoFilter advogados={advogados} selected={advIds} />

      {clientes.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Nenhum cliente cadastrado"
          description="Cadastre seu primeiro cliente para criar honorários."
          action={
            <Link href="/clientes/novo" className="btn btn-primary">
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clientes.map((c) => {
            const stats = clienteStats(c.honorarios ?? []);
            const fone = maskPhone(c.whatsapp.replace(/^\+55/, ""));

            return (
              <div key={c.id} className="card cliente-card">
                <div className="client-profile-row">
                  <div className="client-initials-avatar">{initials(c.nome)}</div>
                  <div>
                    <div className="cliente-nome">{c.nome}</div>
                    <div className="cliente-meta">
                      {c.tipo_pessoa === "PJ"
                        ? <>CNPJ: {maskCNPJ(c.cnpj ?? "")}{c.responsavel_legal ? ` · Resp.: ${c.responsavel_legal}` : ""}</>
                        : <>CPF: {maskCPF(c.cpf ?? "")}</>
                      } · WhatsApp: {fone}
                    </div>
                  </div>
                </div>

                <div className="cliente-stats">
                  <span>
                    <strong>{stats.count} honorário(s) cadastrado(s)</strong>
                  </span>
                  {stats.statusLabel && (
                    <>
                      {" "}·{" "}
                      <span style={{ color: stats.statusCor, fontWeight: 500 }}>
                        {stats.statusLabel}: {formatCurrency(stats.totalAberto)}
                      </span>
                    </>
                  )}
                </div>

                {stats.processoAtivo?.processo && (
                  <div className="cliente-processo">
                    Processo Ativo: {stats.processoAtivo.processo}
                    {stats.processoAtivo.area ? ` (${stats.processoAtivo.area})` : ""}
                  </div>
                )}

                <div className="fee-card-actions">
                  <Link href={`/honorarios?cliente=${c.id}`} className="btn btn-secondary">
                    Ver honorários
                  </Link>
                  <Link href={`/honorarios/novo?cliente=${c.id}`} className="btn btn-primary">
                    + Novo honorário
                  </Link>
                  <Link href={`/clientes/${c.id}/editar`} className="btn btn-secondary">
                    Editar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
