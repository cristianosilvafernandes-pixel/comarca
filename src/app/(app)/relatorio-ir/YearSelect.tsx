"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ anos, ano }: { anos: number[]; ano: number }) {
  const router = useRouter();
  return (
    <select
      className="form-control"
      style={{ width: "auto" }}
      value={ano}
      onChange={(e) => router.push(`/relatorio-ir?ano=${e.target.value}`)}
    >
      {anos.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}
