export default function ContactPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container-wide">
          <div className="eyebrow">Contato</div>
          <h1>Vamos conversar</h1>
        </div>
      </section>
      <section className="section">
        <div className="container-wide manifesto-grid">
          <div className="eyebrow">Atendimento</div>
          <div>
            <p className="manifesto-copy" style={{ marginTop: 0 }}>Os canais oficiais serão habilitados assim que forem confirmados.</p>
            <div className="footer-list" style={{ marginTop: 36 }}>
              <span>WhatsApp — pendente</span>
              <span>Telefone — pendente</span>
              <span>E-mail — pendente</span>
              <span>CRECI — pendente</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
