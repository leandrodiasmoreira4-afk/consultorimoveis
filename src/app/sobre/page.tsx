import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container-wide">
          <div className="eyebrow">Consultoria imobiliária</div>
          <h1>Sobre</h1>
        </div>
      </section>
      <section className="section">
        <div className="container-wide manifesto-grid">
          <div className="eyebrow">Cristian Oliveira</div>
          <div>
            <h2 className="manifesto-copy" style={{ marginTop: 0 }}>Uma presença próxima para decisões que pedem mais do que uma busca comum.</h2>
            <p className="muted" style={{ maxWidth: 620 }}>A apresentação profissional oficial, foto, CRECI e canais de contato permanecem pendentes até serem fornecidos e confirmados.</p>
            <Link className="text-link" href="/contato">Entrar em contato <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
