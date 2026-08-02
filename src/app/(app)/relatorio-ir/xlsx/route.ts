import { type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { fetchParcelasIR, fetchSucumbenciaisIR } from "../data";
import { parseAdv } from "@/lib/utils/adv-filter";
import { agregarRelatorioIR } from "@/lib/domain/ir";
import { formatDate } from "@/lib/utils/format";

/** Exporta relatório de IR como .xlsx formatado (colunas ajustadas, moeda). */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ano = params.get("ano") ? Number(params.get("ano")) : new Date().getUTCFullYear();
  const mes = params.get("mes") ? Number(params.get("mes")) : undefined;
  const advIds = parseAdv(params.get("adv"));

  const [parcelasContrato, sucumbenciais] = await Promise.all([
    fetchParcelasIR(advIds),
    fetchSucumbenciaisIR(advIds),
  ]);
  const rel = agregarRelatorioIR([...parcelasContrato, ...sucumbenciais], ano, mes);

  const linhas = rel.grupos.flatMap((g) => g.linhas);

  // Cabeçalho
  const header = ["Cliente", "CPF/CNPJ", "Tipo de Honorário", "Origem", "Valor Recebido (R$)", "Data Recebimento"];

  // Dados
  const rows = linhas.map((l) => [
    l.cliente,
    l.doc,
    l.categoria,
    l.origem === "sucumbencial" ? "Sucumbencial" : "Contratual",
    l.valor,
    formatDate(l.data),
  ]);

  // Linha de total
  rows.push(["", "", "", "TOTAL GERAL", rel.totalGeral, ""]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

  // Largura das colunas
  ws["!cols"] = [
    { wch: 32 }, // Cliente
    { wch: 18 }, // CPF/CNPJ
    { wch: 18 }, // Tipo
    { wch: 16 }, // Origem
    { wch: 20 }, // Valor
    { wch: 18 }, // Data
  ];

  // Formato moeda nas células da coluna Valor (col E, índice 4)
  const fmtMoeda = '"R$"#,##0.00';
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let r = 1; r <= range.e.r; r++) {
    const cell = ws[XLSX.utils.encode_cell({ r, c: 4 })];
    if (cell && typeof cell.v === "number") {
      cell.t = "n";
      cell.z = fmtMoeda;
    }
  }

  const wb = XLSX.utils.book_new();
  const periodo = mes ? `${String(mes).padStart(2, "0")}_${ano}` : String(ano);
  XLSX.utils.book_append_sheet(wb, ws, `IR_${periodo}`);

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const nomeArquivo = `Apuracao_IR_Comarca_${periodo}.xlsx`;

  return new Response(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}
