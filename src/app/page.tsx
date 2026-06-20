"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import "./marketing.css";

const CTA = "/login";

function Check({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="bullet-icon">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

const FAQS = [
  {
    q: "Comarca cobra taxa sobre o PIX que eu recebo?",
    a: "Não. Zero taxa. Você recebe 100% na sua conta, direto do cliente.",
  },
  {
    q: "Comarca gera o contrato de prestação de serviços?",
    a: "Sim. Você seleciona o honorário e o Comarca monta o contrato em PDF com seus dados, OAB, logo e cláusulas. Você baixa ou envia direto no WhatsApp.",
  },
  {
    q: "Ajuda na hora do imposto de renda?",
    a: "Sim. Cada honorário é categorizado (contratual, êxito, sucumbencial, recorrente) e você exporta tudo em CSV na hora da declaração.",
  },
  {
    q: "Preciso cadastrar conta bancária ou enviar documentos?",
    a: "Não. Só nome, email, WhatsApp e sua chave PIX.",
  },
  {
    q: "E se eu já uso planilha ou agenda?",
    a: "Planilha não monta contrato, não mostra o que vence nem prepara a cobrança. Comarca destaca cada parcela a vencer e já deixa a mensagem pronta — você decide se envia ou não.",
  },
  {
    q: "O Comarca acessa minha conta bancária?",
    a: "Não. Comarca não toca no dinheiro. O cliente paga direto na sua chave PIX. O status muda quando você ou o cliente confirma.",
  },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="landing-page">
      {/* 1. HEADER */}
      <header className="site-header">
        <div className="container header-container">
          <a href="#" className="logo">
            <Logo size={24} />
            Comarca
          </a>
          <nav className="nav-desktop">
            <a href="#recursos" className="nav-link">Recursos</a>
            <a href="#como-funciona" className="nav-link">Como funciona</a>
            <a href="#precos" className="nav-link">Preços</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          <div className="header-cta">
            <Link href={CTA} className="btn btn-primary">Começar grátis</Link>
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1 className="hero-headline">Do contrato ao recebimento, num só lugar.</h1>
            <p className="hero-subheadline">
              Comarca cuida do honorário do começo ao fim: gera o contrato em PDF, cobra pelo WhatsApp,
              recebe via PIX, divide entre os sócios e organiza tudo para o seu imposto de renda. Sem
              taxas — você recebe 100% na sua conta.
            </p>

            <ul className="hero-bullets">
              <li className="bullet-item">
                <Check />
                <span><strong>Contrato pronto em PDF</strong> — com sua OAB e logo, enviado no WhatsApp em um toque</span>
              </li>
              <li className="bullet-item">
                <Check />
                <span><strong>Cobrança que o cliente paga</strong> — lembrete no WhatsApp + página com QR Code PIX</span>
              </li>
              <li className="bullet-item">
                <Check />
                <span><strong>IR sem dor de cabeça</strong> — honorários categorizados e exportáveis na declaração</span>
              </li>
            </ul>

            <div className="hero-actions">
              <Link href={CTA} className="btn btn-primary" style={{ padding: "16px 32px", fontSize: 18 }}>
                Comece grátis — sem cartão
              </Link>
              <span className="hero-cta-info">Cadastre seus honorários e veja o ciclo completo. Zero risco.</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="whatsapp-card">
              <div style={{ fontSize: 12, opacity: 0.9, marginBottom: 4, display: "flex", justifyContent: "space-between" }}>
                <span>WhatsApp</span>
                <span>Agora</span>
              </div>
              <div className="wa-bubble">
                <div className="wa-bubble-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  Comarca Honorários
                </div>
                <div className="wa-bubble-field">Honorário vence em 2 dias.</div>
                <div className="wa-bubble-field"><strong>Cliente:</strong> João Silva</div>
                <div className="wa-bubble-field"><strong>Processo:</strong> 0032847-21 (Trabalhista - TJRS)</div>
                <div className="wa-bubble-field"><strong>Parcela:</strong> 2/3 — R$ 1.200</div>
                <div className="wa-bubble-field"><strong>PIX:</strong> 034.994.430-07</div>
                <div style={{ marginTop: 8, fontStyle: "italic", color: "#555", fontSize: 14 }}>
                  Este é um lembrete amigável do Dr. Yago. Não é cobrança formal.
                </div>
                <div className="wa-btn">
                  <Check size={14} />
                  Já paguei
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DOR */}
      <section className="dor-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Por que advogados perdem tempo e dinheiro</h2>
          </div>

          <div className="dor-grid">
            {[
              "Esqueceu de cobrar a segunda parcela",
              'Cliente "esqueceu" e você ficou sem jeito de lembrar',
              "Contrato montado às pressas no Word, cada um de um jeito",
              "Honorário dividido com o sócio e ninguém sabe quanto cabe a quem",
              "Honorários parcelados que ninguém acompanha — a parcela 2 e 3 simplesmente somem",
              "Na hora do IR, cata pagamento em extrato, e-mail e conversa de WhatsApp",
            ].map((titulo) => (
              <div className="dor-card" key={titulo}>
                <svg className="dor-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
                <div>
                  <h3 className="dor-card-title">{titulo}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="dor-highlight-box">
            Mais de 60% dos advogados autônomos no Brasil enfrentam dificuldades sérias com gestão
            financeira. A maioria perde dinheiro não por falta de cliente — mas por falta de controle.
          </div>

          <div className="impact-bar">
            &quot;Um honorário perdido de R$1.200 paga 3 anos de Comarca.&quot;
          </div>
        </div>
      </section>

      {/* 4. COMO FUNCIONA */}
      <section id="como-funciona" className="como-funciona-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Como funciona</h2>
          </div>
          <div className="como-grid">
            {[
              ["01", "Cadastre cliente e honorário", "Cliente, processo, valor, parcelas ou êxito. Tudo configurado em apenas 30 segundos."],
              ["02", "Gere o contrato em PDF", "Comarca monta o contrato com seus dados, OAB e logo. Você baixa ou envia direto no WhatsApp."],
              ["03", "Cobre pelo WhatsApp", "Um toque abre a mensagem pré-formatada com link de pagamento PIX. Tom educado, sem parecer cobrador."],
              ["04", "Receba e marque pago", "O cliente paga no PIX e confirma na página. Um clique e o registro sai da lista de pendentes."],
            ].map(([num, title, desc]) => (
              <div className="como-step" key={num}>
                <div className="como-num">{num}</div>
                <h3 className="como-title">{title}</h3>
                <p className="como-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. RECURSOS DO CICLO */}
      <section id="recursos" className="controle-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Tudo o que o honorário precisa, do início ao fim.</h2>
          </div>
          <div className="controle-grid">
            <div className="controle-card">
              <span className="controle-icon">📄</span>
              <h3 className="controle-card-title">Contrato em PDF</h3>
              <p className="controle-card-text">Gera o contrato de prestação com seus dados, OAB, logo e cláusulas. Baixa ou envia pelo WhatsApp em um clique.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">🔔</span>
              <h3 className="controle-card-title">Cobrança no WhatsApp</h3>
              <p className="controle-card-text">Mensagem pré-formatada e editável, com processo, parcela e PIX. Você revisa e envia — sem parecer cobrança agressiva.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">💸</span>
              <h3 className="controle-card-title">Página de pagamento PIX</h3>
              <p className="controle-card-text">O cliente abre um link, vê o QR Code e o copia-e-cola, paga e confirma. Você recebe 100%, sem intermediário.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">⚖️</span>
              <h3 className="controle-card-title">Êxito e sucumbência</h3>
              <p className="controle-card-text">Cadastre o percentual de êxito e o honorário sucumbencial. Comarca mantém cada um no radar até você receber.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">👥</span>
              <h3 className="controle-card-title">Equipe e divisão</h3>
              <p className="controle-card-text">Vários advogados no escritório? Defina a divisão de cada honorário e acompanhe quanto cabe a cada um.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">📊</span>
              <h3 className="controle-card-title">Relatório de IR</h3>
              <p className="controle-card-text">Honorários categorizados — contratual, êxito, sucumbencial e recorrente — e exportáveis em CSV na declaração.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CADASTRO RAPIDO */}
      <section className="cadastro-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Cadastro em segundos, não em minutos.</h2>
          </div>
          <div className="cadastro-content">
            <p className="cadastro-text">
              Tem procuração, contrato ou documento do cliente em PDF ou foto? Comarca lê o documento e
              preenche os dados automaticamente. Sem digitar nome, CPF, endereço, telefone.
            </p>
            <ul className="cadastro-bullets hero-bullets">
              <li className="bullet-item"><Check /><span>Importa PDF ou foto do documento — sistema extrai os dados</span></li>
              <li className="bullet-item"><Check /><span>Campos preenchidos automaticamente em segundos</span></li>
              <li className="bullet-item"><Check /><span>Você só confere e salva</span></li>
            </ul>
            <div className="cadastro-highlight">
              &quot;O cliente já assinou a procuração. Os dados já estão lá. Por que digitar de novo?&quot;
            </div>
          </div>
        </div>
      </section>

      {/* 6. DIFERENCIAL */}
      <section className="diferencial-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Feito para advogados, não para qualquer negócio.</h2>
          </div>
          <div className="table-container">
            <table className="diferencial-table">
              <thead>
                <tr>
                  <th>Funcionalidade</th>
                  <th>Apps genéricos</th>
                  <th className="highlight" style={{ color: "var(--primary)" }}>Comarca Honorários</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>Organização</strong></td><td>Lista de clientes</td><td className="highlight">Cliente + processo + área</td></tr>
                <tr><td><strong>Contrato</strong></td><td>Você monta no Word</td><td className="highlight">Gerado em PDF com sua OAB e logo</td></tr>
                <tr><td><strong>Cobrança</strong></td><td>&quot;Lembrete de pagamento&quot;</td><td className="highlight">Processo + parcela + link de pagamento PIX</td></tr>
                <tr><td><strong>Imposto de renda</strong></td><td>Por sua conta</td><td className="highlight">Honorários categorizados + CSV</td></tr>
                <tr><td><strong>Quem usa</strong></td><td>Personal, dentista, psicólogo</td><td className="highlight">Só advogados</td></tr>
              </tbody>
            </table>
          </div>
          <div
            className="table-sub-text"
            style={{ fontWeight: "normal", fontSize: 16, maxWidth: 800, margin: "32px auto 0 auto", textAlign: "center", color: "var(--text-muted)", lineHeight: 1.6 }}
          >
            &quot;Advogado não tem tempo pra aprender ferramenta genérica. Comarca já fala a sua língua —
            processo, vara, tribunal, OAB. Você abre e já sabe usar.&quot;
          </div>
        </div>
      </section>

      {/* 7. PROVA SOCIAL */}
      <section className="prova-social-section">
        <div className="container">
          <div className="testimonial-card">
            <div className="testimonial-quote-icon">&ldquo;</div>
            <p className="testimonial-text">
              &quot;Eu tinha R$3.600 espalhados em 3 clientes que nunca cobravam porque ficava chato. Comarca
              mandou lembrete, eu só encaminhei. Recebi tudo em 10 dias.&quot;
            </p>
            <div className="testimonial-author">
              <div className="avatar">YC</div>
              <div className="author-info">
                <h4 className="author-name">Dr. Yago Vaz Caldeira</h4>
                <span className="author-meta">OAB/RS 107.295 — Pelotas/RS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. PREÇOS */}
      <section id="precos" className="precos-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Comece grátis. Planos pagos em breve.</h2>
          </div>
          <div className="precos-grid">
            <div className="preco-card">
              <div className="preco-header">
                <h3 className="preco-title">Grátis</h3>
                <div className="preco-value">R$0<span className="preco-period">/mês</span></div>
              </div>
              <ul className="preco-features">
                <li className="preco-feature-item"><Check size={18} />3 clientes</li>
                <li className="preco-feature-item"><Check size={18} />5 honorários ativos</li>
                <li className="preco-feature-item"><Check size={18} />10 lembretes/mês</li>
              </ul>
              <Link href={CTA} className="btn btn-outline btn-block">Começar grátis</Link>
            </div>

            <div className="preco-card featured">
              <div className="preco-badge">Recomendado</div>
              <div className="preco-header">
                <h3 className="preco-title">Essencial</h3>
                <div className="preco-value">R$19<span className="preco-period">/mês</span></div>
              </div>
              <ul className="preco-features">
                <li className="preco-feature-item"><Check size={18} />10 clientes</li>
                <li className="preco-feature-item"><Check size={18} />20 honorários ativos</li>
                <li className="preco-feature-item"><Check size={18} />50 lembretes/mês</li>
              </ul>
              <Link href={CTA} className="btn btn-primary btn-block">Começar grátis</Link>
            </div>

            <div className="preco-card">
              <div className="preco-header">
                <h3 className="preco-title">Profissional</h3>
                <div className="preco-value">R$37<span className="preco-period">/mês</span></div>
              </div>
              <ul className="preco-features">
                <li className="preco-feature-item"><Check size={18} />Clientes ilimitados</li>
                <li className="preco-feature-item"><Check size={18} />Honorários ilimitados</li>
                <li className="preco-feature-item"><Check size={18} />Lembretes ilimitados</li>
              </ul>
              <Link href={CTA} className="btn btn-outline btn-block">Começar grátis</Link>
            </div>
          </div>
          <div className="precos-footer">
            Pagamento em breve — por enquanto, comece sem cartão e teste com seus próprios clientes.<br />
            Sem taxa de transação, sem intermediário: você recebe 100% na sua conta. Cancela quando quiser.
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Perguntas Frequentes</h2>
          </div>
          <div className="faq-container">
            {FAQS.map((item, i) => (
              <div className="faq-item" key={item.q}>
                <button className="faq-trigger" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span>{item.q}</span>
                  <span className="faq-icon">{openFaq === i ? "−" : "+"}</span>
                </button>
                <div className={`faq-answer${openFaq === i ? " open" : ""}`}>
                  <div className="faq-answer-inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. CTA FINAL */}
      <section className="cta-final-section">
        <div className="container">
          <h2 className="cta-final-title">Teste com seus próprios clientes.</h2>
          <p className="cta-final-sub">Cadastre um honorário real. Gere o contrato, cobre e receba. Veja se funciona pra você.</p>
          <Link href={CTA} className="btn btn-white" style={{ padding: "16px 32px", fontSize: 18, fontWeight: 600 }}>
            Criar conta grátis
          </Link>
          <p className="cta-final-info">Sem cartão. Cancela quando quiser.</p>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-logo-col">
              <a href="#" className="logo">
                <Logo size={24} />
                Comarca
              </a>
              <p className="footer-tagline">Do contrato ao recebimento: gestão de honorários para advogados.</p>
            </div>
            <div className="footer-meta-col">
              <span className="footer-right-text">Feito por advogados, para advogados.</span>
              <div className="footer-contact">
                <span>Contato: <a href="mailto:suporte@comarca.com.br">suporte@comarca.com.br</a></span>
                <span>WhatsApp: (53) 99999-9999</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">© 2026 Comarca Honorários</div>
        </div>
      </footer>
    </div>
  );
}
