import { type NextRequest } from "next/server";
import { fetchParcelasIR } from "../data";
import { agregarRelatorioIR, gerarCSV, nomeArquivoCSV } from "@/lib/domain/ir";

/** Download do CSV de apuração do IR (spec F10, INV-116). RLS aplica pelo usuário. */
export async function GET(request: NextRequest) {
  const anoParam = request.nextUrl.searchParams.get("ano");
  const advParam = request.nextUrl.searchParams.get("adv");
  const ano = anoParam ? Number(anoParam) : new Date().getUTCFullYear();

  const parcelas = await fetchParcelasIR(advParam ?? undefined);
  const rel = agregarRelatorioIR(parcelas, ano);
  const csv = gerarCSV(rel);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivoCSV(ano)}"`,
      "Cache-Control": "no-store",
    },
  });
}
