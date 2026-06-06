import type { Metadata } from "next";
import { ClienteForm } from "../ClienteForm";

export const metadata: Metadata = {
  title: "Novo cliente — Comarca Honorários",
};

export default function NovoClientePage() {
  return (
    <div>
      <div className="page-head">
        <h1>Novo cliente</h1>
      </div>
      <ClienteForm />
    </div>
  );
}
