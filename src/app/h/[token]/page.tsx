import type { Metadata } from "next";
import QRCode from "qrcode";
import { getPublicHonorario } from "@/lib/public-api";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { montarPixCopiaECola, pixCrcValido } from "@/lib/domain/pix";
import { PublicActions } from "./PublicActions";
import styles from "./public.module.css";

export const metadata: Metadata = {
  title: "Pagamento de Honorário — Comarca",
  robots: { index: false, follow: false },
};

export default async function PublicPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const dados = await getPublicHonorario(token);

  if (!dados) {
    return (
      <div className={styles.page}>
        <div className={styles.box}>
          <div className={styles.errorBox}>
            <div className={styles.errorIcon}>🔍</div>
            <h2>Lembrete não encontrado</h2>
            <p>Este link expirou ou é inválido. Consulte seu advogado.</p>
          </div>
        </div>
      </div>
    );
  }

  const pago = dados.status === "pago";
  const emAnalise = dados.status === "pago_verificacao";
  const podeConfirmar = !pago && !emAnalise;

  // PIX copia-e-cola + QR (gerado no servidor) quando ainda há cobrança.
  let copiaCola: string | null = null;
  let qrDataUrl: string | null = null;
  if (dados.chave_pix && !pago) {
    copiaCola = montarPixCopiaECola({
      chave: dados.chave_pix,
      nomeRecebedor: dados.advogado.nome ?? "Advogado",
      cidade: "BRASIL",
      valor: dados.valor,
    });
    if (pixCrcValido(copiaCola)) {
      qrDataUrl = await QRCode.toDataURL(copiaCola, { margin: 1, width: 360 });
    }
  }

  const advLinha = dados.advogado.oab
    ? `${dados.advogado.nome} (${dados.advogado.oab})`
    : dados.advogado.nome ?? "Advogado";

  return (
    <div className={styles.page}>
      <div className={styles.box}>
        <div className={styles.header}>
          <div className={styles.brand}>Comarca</div>
          <div className={styles.brandSub}>Lembrete de Honorários</div>
        </div>

        <div className={styles.body}>
          <div className={styles.badgeArea}>
            {pago && <span className={`${styles.badge} ${styles.badgePaid}`}>✓ Pagamento confirmado</span>}
            {emAnalise && <span className={`${styles.badge} ${styles.badgeAnalysis}`}>⌛ Em análise</span>}
            {podeConfirmar && <span className={`${styles.badge} ${styles.badgeWaiting}`}>Aguardando pagamento</span>}
          </div>

          <div className={styles.dados}>
            <div><strong>Advogado:</strong> {advLinha}</div>
            <div><strong>Cliente:</strong> {dados.cliente ?? "—"}</div>
            <div><strong>Processo:</strong> {dados.processo}</div>
            <div><strong>Parcela:</strong> {dados.parcela.numero}/{dados.parcela.total}</div>
            <div><strong>Valor:</strong> <span className={styles.valor}>{formatCurrency(dados.valor)}</span></div>
            <div><strong>Vencimento:</strong> {formatDate(dados.vencimento)}</div>
          </div>

          {dados.chave_pix && !pago && (
            <>
              <hr className={styles.hr} />
              <div className={styles.pixBlock}>
                <span className={styles.pixLabel}>Chave PIX para pagamento</span>
                <div className={styles.pixKey}>{dados.chave_pix}</div>
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR Code PIX" className={styles.qr} />
                )}
                {copiaCola && <div className={styles.copiaCola}>{copiaCola}</div>}
                <PublicActions
                  token={token}
                  numeroParcela={dados.parcela.numero}
                  chavePix={dados.chave_pix}
                  copiaCola={copiaCola}
                  podeConfirmar={podeConfirmar}
                />
              </div>
            </>
          )}

          {emAnalise && (
            <p className={styles.actionText} style={{ marginTop: 16 }}>
              Você confirmou o pagamento. O advogado vai validar o recebimento.
            </p>
          )}
        </div>

        <div className={styles.footer}>
          Este é um lembrete amigável. Não é cobrança formal.<br />
          Dúvidas? Fale com seu advogado.<br />
          <strong>Comarca Honorários © 2026</strong>
        </div>
      </div>
    </div>
  );
}
