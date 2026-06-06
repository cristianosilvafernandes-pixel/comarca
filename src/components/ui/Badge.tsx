import type { StatusEfetivo } from "@/lib/utils/status";
import { statusLabel } from "@/lib/utils/status";

export function Badge({ status }: { status: StatusEfetivo }) {
  return <span className={`badge badge-${status}`}>{statusLabel(status)}</span>;
}
