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
    q: "Preciso cadastrar conta bancária ou enviar documentos?",
    a: "Não. Só nome, email, WhatsApp e sua chave PIX.",
  },
  {
    q: "E se eu já uso planilha ou agenda?",
    a: "Planilha não manda WhatsApp sozinha. Comarca lembra você 2 dias antes — e você decide se envia ou não.",
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
            <a href="#como-funciona" className="nav-link">Como funciona</a>
            <a href="#precos" className="nav-link">Preços</a>
            <a href="#faq" className="nav-link">FAQ</a>
          </nav>
          <div className="header-cta">
            <Link href={CTA} className="btn btn-primary">Testar grátis</Link>
          </div>
        </div>
      </header>

      {/* 2. HERO */}
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <h1 className="hero-headline">Nunca mais perca um honorário esquecido.</h1>
            <p className="hero-subheadline">
              Advogado não perde honorário por falta de cliente. Perde por falta de cobrança. Comarca
              resolve isso — lembretes automáticos via WhatsApp, sem taxas, você recebe 100% na sua conta.
            </p>

            <ul className="hero-bullets">
              <li className="bullet-item">
                <Check />
                <span><strong>Lembrete 2 dias antes do vencimento</strong> — você nunca esquece de cobrar</span>
              </li>
              <li className="bullet-item">
                <Check />
                <span><strong>Controle por cliente e processo</strong> — dashboard jurídico, não planilha genérica</span>
              </li>
              <li className="bullet-item">
                <Check />
                <span><strong>Mensagem pré-formatada editável</strong> — tom profissional, sem parecer cobrança agressiva</span>
              </li>
            </ul>

            <div className="hero-actions">
              <Link href={CTA} className="btn btn-primary" style={{ padding: "16px 32px", fontSize: 18 }}>
                Testar 7 dias grátis — sem cartão
              </Link>
              <span className="hero-cta-info">Cadastre 3 clientes e veja como funciona. Zero risco.</span>
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
            <h2 className="section-title">Por que advogados perdem honorários</h2>
          </div>

          <div className="dor-grid">
            {[
              "Esqueceu de cobrar a segunda parcela",
              'Cliente "esqueceu" e você ficou sem jeito de lembrar',
              "Estava focado em audiência e deixou vencer",
              "Usa planilha que ninguém olha",
              "Honorários parcelados que ninguém acompanha — a parcela 2 e 3 simplesmente somem",
              "Honorário de êxito que fica meses sem cobrança — você ganhou a causa mas não recebeu",
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
            financeira. A maioria perde dinheiro não por falta de cliente — mas por falta de cobrança.
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
              ["01", "Cadastre o cliente e o honorário", "Cliente, processo, valor, parcelas. Tudo configurado em apenas 30 segundos."],
              ["02", "Receba lembretes automáticos", "2 dias antes do vencimento direto no seu WhatsApp com todos os dados do processo cadastrado."],
              ["03", "Envie cobrança ao cliente", "Um toque abre a mensagem pré-formatada editável. Tom educado e profissional, sem parecer cobrador."],
              ["04", "Marque como pago", "Seu cliente realizou o pagamento? Um único clique e o registro sai da lista de pendentes."],
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

      {/* CADASTRO RAPIDO */}
      <section className="cadastro-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Cadastro em segundos, não em minutos.</h2>
          </div>
          <div className="cadastro-content">
            <p className="cadastro-text">
              Tem procuração, contrato ou declaração do cliente em PDF ou Word? Comarca lê o documento e
              preenche os dados automaticamente. Sem digitar nome, CPF, endereço, telefone.
            </p>
            <ul className="cadastro-bullets hero-bullets">
              <li className="bullet-item"><Check /><span>Importa PDF ou DOC do cliente — sistema extrai os dados</span></li>
              <li className="bullet-item"><Check /><span>Campos preenchidos automaticamente em segundos</span></li>
              <li className="bullet-item"><Check /><span>Você só confere e salva</span></li>
            </ul>
            <div className="cadastro-highlight">
              &quot;O cliente já assinou a procuração. Os dados já estão lá. Por que digitar de novo?&quot;
            </div>
          </div>
        </div>
      </section>

      {/* 5. DIFERENCIAL */}
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
                <tr><td><strong>Dashboard</strong></td><td>Cobranças pendentes</td><td className="highlight">Por cliente, processo e tribunal</td></tr>
                <tr><td><strong>Mensagem</strong></td><td>&quot;Lembrete de pagamento&quot;</td><td className="highlight">&quot;Honorário proc. 0032847-21 (Trabalhista - TJRS)&quot;</td></tr>
                <tr><td><strong>Preço</strong></td><td>A partir de R$15/mês (qualquer negócio)</td><td className="highlight">A partir de R$19/mês (só advogados)</td></tr>
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

      {/* 6. PROVA SOCIAL */}
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

      {/* CONTROLE */}
      <section className="controle-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Comarca controla o que você esquece.</h2>
          </div>
          <div className="controle-grid">
            <div className="controle-card">
              <span className="controle-icon">📋</span>
              <h3 className="controle-card-title">Parcelas no radar</h3>
              <p className="controle-card-text">Honorário parcelado? Comarca lembra cada vencimento. Você não precisa abrir planilha.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">⚖️</span>
              <h3 className="controle-card-title">Honorário de êxito</h3>
              <p className="controle-card-text">Cadastre o processo e o percentual combinado. Comarca avisa quando chegar a hora de cobrar.</p>
            </div>
            <div className="controle-card">
              <span className="controle-icon">📊</span>
              <h3 className="controle-card-title">Inadimplência zerada</h3>
              <p className="controle-card-text">Cliente lembrado 2 dias antes paga no prazo. Sem lembrete, ele esquece. Simples assim.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PREÇOS */}
      <section id="precos" className="precos-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Preços simples e transparentes</h2>
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
              <div className="preco-badge">Mais popular</div>
              <div className="preco-header">
                <h3 className="preco-title">Essencial</h3>
                <div className="preco-value">R$19<span className="preco-period">/mês</span></div>
              </div>
              <ul className="preco-features">
                <li className="preco-feature-item"><Check size={18} />10 clientes</li>
                <li className="preco-feature-item"><Check size={18} />20 honorários ativos</li>
                <li className="preco-feature-item"><Check size={18} />50 lembretes/mês</li>
              </ul>
              <Link href={CTA} className="btn btn-primary btn-block">Testar 7 dias grátis</Link>
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
              <Link href={CTA} className="btn btn-outline btn-block">Testar 7 dias grátis</Link>
            </div>
          </div>
          <div className="precos-footer">
            Sem taxa de transação. Sem intermediário. Você recebe 100% na sua conta.<br />
            Cancela quando quiser. Sem fidelidade.
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
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

      {/* 9. CTA FINAL */}
      <section className="cta-final-section">
        <div className="container">
          <h2 className="cta-final-title">Teste com seus próprios clientes.</h2>
          <p className="cta-final-sub">Cadastre 3 honorários reais. Receba os lembretes. Veja se funciona pra você.</p>
          <Link href={CTA} className="btn btn-white" style={{ padding: "16px 32px", fontSize: 18, fontWeight: 700 }}>
            Criar conta grátis
          </Link>
          <p className="cta-final-info">7 dias grátis. Sem cartão. Cancela quando quiser.</p>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-logo-col">
              <a href="#" className="logo">
                <Logo size={24} />
                Comarca
              </a>
              <p className="footer-tagline">Lembretes automáticos de honorários para advogados.</p>
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
