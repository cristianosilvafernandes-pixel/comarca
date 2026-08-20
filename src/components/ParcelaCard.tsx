import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { LembreteButton } from "@/app/(app)/honorarios/LembreteButton";
import type { FeeItem } from "@/lib/domain/lembrete-itens";

/** Card de parcela do dashboard/lista de honorários (cliente, processo, valor, ações). */
export function ParcelaCard({ item }: { item: FeeItem }) {
  const it = item;
  const processoLine = it.processo
    ? `Processo: ${it.processo}${it.area ? ` (${it.area}${it.tribunal ? ` · ${it.tribunal}` : ""})` : ""}`
    : it.area
      ? `${it.area}${it.tribunal ? ` · ${it.tribunal}` : ""}`
      : null;

  return (
    <div className={`card fee-card ${it.status}`}>
      <div className="fee-card-header">
        <div className="fee-card-title">{it.cliente}</div>
        <Badge status={it.status} />
      </div>
      {processoLine && <div className="fee-card-process">{processoLine}</div>}
      <div className="fee-card-middle">
        <span className="fee-card-meta">
          Parcela {it.numero}/{it.total} · <strong>{formatCurrency(it.valor)}</strong>
        </span>
        <span className="fee-card-date">🗓 Vence em {formatDate(it.vencimento)}</span>
      </div>
      <div className="fee-card-actions">
        <LembreteButton
          parcelaId={it.parcelaId}
          clienteNome={it.cliente}
          mensagem={it.mensagem}
          waUrl={it.waUrl}
          label="Enviar lembrete"
        />
        <Link href={`/honorarios/${it.honorarioId}`} className="btn btn-secondary">
          Ver detalhes
        </Link>
      </div>
    </div>
  );
}
