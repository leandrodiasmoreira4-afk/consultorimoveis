import Link from "next/link";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container-wide footer-grid">
        <div>
          <div className="footer-title">Cristian Oliveira</div>
          <p className="muted">Consultoria imobiliária com atendimento pessoal e seleção cuidadosa de oportunidades.</p>
        </div>
        <div className="footer-list">
          <strong className="eyebrow">Navegação</strong>
          <Link href="/imoveis">Imóveis</Link>
          <Link href="/regioes">Regiões</Link>
          <Link href="/sobre">Sobre</Link>
          <Link href="/contato">Contato</Link>
        </div>
        <div className="footer-list">
          <strong className="eyebrow">Atendimento</strong>
          <span>WhatsApp — pendente</span>
          <span>E-mail — pendente</span>
          <span>CRECI — pendente</span>
        </div>
      </div>
    </footer>
  );
}
