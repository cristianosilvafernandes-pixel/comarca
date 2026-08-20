/**
 * Tipos do schema Postgres (Comarca Honorários).
 * Espelha supabase/migrations/0001_schema_inicial.sql.
 *
 * Escrito à mão com enums tipados + aliases de conveniência (mais rico que o
 * output cru de `generate_typescript_types`, que usa `string`).
 * Schema aplicado no projeto `enhiukvvxpzudujctljk` (migrations 0001–0004).
 * Para regenerar a versão crua de referência:
 *   supabase gen types typescript --project-id enhiukvvxpzudujctljk
 */

export type Plano = "free" | "essencial" | "profissional";
export type HonorarioTipo = "fixo_parcelado" | "ad_exitum" | "recorrente" | "fixo_exitum";
export type Frequencia = "Mensal" | "Quinzenal" | "Única";
export type Area =
  | "Trabalhista"
  | "Cível"
  | "Família"
  | "Criminal"
  | "Previdenciário"
  | "Tributário"
  | "Consumidor"
  | "Outro";
export type Tribunal = "TJRS" | "TJSP" | "TJRJ" | "TRF4" | "TRT4" | "TST" | "STJ" | "Outro";
export type StatusRegistrado = "em_aberto" | "pago" | "pago_verificacao";
export type OrigemPagamento = "contratual" | "sucumbencial";
export type StatusSucumbencial = "aguardando" | "recebido";
export type StatusExtracao = "pendente" | "processando" | "concluido" | "erro";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          cnpj: string | null;
          telefone: string | null;
          endereco: string | null;
          site: string | null;
          chave_pix: string | null;
          foro: string | null;
          plano: Plano;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          cnpj?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          site?: string | null;
          chave_pix?: string | null;
          foro?: string | null;
          plano?: Plano;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      advogados: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          oab: string | null;
          foto_url: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          nome: string;
          oab?: string | null;
          foto_url?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["advogados"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "advogados_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: {
          id: string;
          advogado_id: string;
          nome: string;
          tipo_pessoa: "PF" | "PJ";
          cpf: string | null;
          cnpj: string | null;
          responsavel_legal: string | null;
          whatsapp: string;
          email: string | null;
          endereco: string | null;
          created_at: string;
          updated_at: string;
          membro_id: string | null;
        };
        Insert: {
          id?: string;
          advogado_id?: string;
          nome: string;
          tipo_pessoa?: "PF" | "PJ";
          cpf?: string | null;
          cnpj?: string | null;
          responsavel_legal?: string | null;
          whatsapp: string;
          email?: string | null;
          endereco?: string | null;
          created_at?: string;
          updated_at?: string;
          membro_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "clientes_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      honorarios: {
        Row: {
          id: string;
          advogado_id: string;
          cliente_id: string;
          processo: string | null;
          area: Area | null;
          tribunal: Tribunal | null;
          parte_contraria: string | null;
          tipo: HonorarioTipo;
          frequencia: Frequencia | null;
          valor_total: number | null;
          valor_causa: number | null;
          percentual_exito: number | null;
          valor_entrada: number | null;
          valor_mensal: number | null;
          data_inicio: string | null;
          data_fim: string | null;
          chave_pix: string | null;
          link_publico_token: string;
          created_at: string;
          updated_at: string;
          membro_id: string | null;
          parceiro_id: string | null;
          parceiro_percentual: number | null;
        };
        Insert: {
          id?: string;
          advogado_id?: string;
          cliente_id: string;
          processo?: string | null;
          area?: Area | null;
          tribunal?: Tribunal | null;
          parte_contraria?: string | null;
          tipo: HonorarioTipo;
          frequencia?: Frequencia | null;
          valor_total?: number | null;
          valor_causa?: number | null;
          percentual_exito?: number | null;
          valor_entrada?: number | null;
          valor_mensal?: number | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          chave_pix?: string | null;
          link_publico_token?: string;
          created_at?: string;
          updated_at?: string;
          membro_id?: string | null;
          parceiro_id?: string | null;
          parceiro_percentual?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["honorarios"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "honorarios_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "honorarios_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "honorarios_parceiro_id_fkey";
            columns: ["parceiro_id"];
            isOneToOne: false;
            referencedRelation: "advogados";
            referencedColumns: ["id"];
          },
        ];
      };
      parcelas: {
        Row: {
          id: string;
          honorario_id: string;
          advogado_id: string;
          numero: number;
          valor: number;
          vencimento: string;
          status_registrado: StatusRegistrado;
          data_pagamento: string | null;
          origem_pagamento: OrigemPagamento | null;
          doc_pagador: string | null;
          confirmado_cliente: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          honorario_id: string;
          advogado_id?: string;
          numero: number;
          valor: number;
          vencimento: string;
          status_registrado?: StatusRegistrado;
          data_pagamento?: string | null;
          origem_pagamento?: OrigemPagamento | null;
          doc_pagador?: string | null;
          confirmado_cliente?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["parcelas"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "parcelas_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "parcelas_honorario_id_fkey";
            columns: ["honorario_id"];
            isOneToOne: false;
            referencedRelation: "honorarios";
            referencedColumns: ["id"];
          },
        ];
      };
      documentos: {
        Row: {
          id: string;
          advogado_id: string;
          storage_path: string;
          status_extracao: StatusExtracao;
          dados_extraidos: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          advogado_id?: string;
          storage_path: string;
          status_extracao?: StatusExtracao;
          dados_extraidos?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["documentos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "documentos_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lembretes: {
        Row: {
          id: string;
          advogado_id: string;
          parcela_id: string;
          canal: string;
          enviado_em: string;
        };
        Insert: {
          id?: string;
          advogado_id?: string;
          parcela_id: string;
          canal?: string;
          enviado_em?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lembretes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lembretes_advogado_id_fkey";
            columns: ["advogado_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lembretes_parcela_id_fkey";
            columns: ["parcela_id"];
            isOneToOne: false;
            referencedRelation: "parcelas";
            referencedColumns: ["id"];
          },
        ];
      };
      sucumbenciais: {
        Row: {
          id: string;
          honorario_id: string;
          advogado_id: string;
          valor: number;
          doc_adversario: string;
          status: StatusSucumbencial;
          data_recebimento: string | null;
          divisao_parceiro_id: string | null;
          divisao_parceiro_pct: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          honorario_id: string;
          advogado_id?: string;
          valor: number;
          doc_adversario: string;
          status?: StatusSucumbencial;
          data_recebimento?: string | null;
          divisao_parceiro_id?: string | null;
          divisao_parceiro_pct?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sucumbenciais"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      status_efetivo: {
        Args: { p: Database["public"]["Tables"]["parcelas"]["Row"] };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// Atalhos de conveniência
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Advogado = Database["public"]["Tables"]["advogados"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Honorario = Database["public"]["Tables"]["honorarios"]["Row"];
export type Parcela = Database["public"]["Tables"]["parcelas"]["Row"];
export type Documento = Database["public"]["Tables"]["documentos"]["Row"];
export type Lembrete = Database["public"]["Tables"]["lembretes"]["Row"];
export type Sucumbencial = Database["public"]["Tables"]["sucumbenciais"]["Row"];
