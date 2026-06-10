"use client";

import { useRouter } from "next/navigation";

export function YearSelect({ anos, ano, adv }: { anos: number[]; ano: number; adv?: string }) {
  const router = useRouter();
  return (
    <select
      className="form-control"
      style={{ width: "auto" }}
      value={ano}
      onChange={(e) => {
        const params = new URLSearchParams({ ano: e.target.value });
        if (adv) params.set("adv", adv);
        router.push(`/relatorio-ir?${params.toString()}`);
      }}
    >
      {anos.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}
