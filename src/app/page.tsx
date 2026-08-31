import Link from "next/link";
import { getProperties } from "@/data/properties";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const properties = await getProperties();

  return (
    <>
      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src="/hero-real-estate.mp4" type="video/mp4" />
        </video>
        <div className="hero-overlay" aria-hidden="true" />
        <div className="container-wide hero-content">
          <div className="hero-kicker eyebrow">
            <span>Cristian Oliveira · Private Real Estate</span>
            <span>Brasil</span>
          </div>
          <h1>Imóveis extraordinários. Escolhas excepcionais.</h1>
          <div className="hero-actions">
            <Link className="text-link" href="/imoveis">Explorar imóveis <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-wide manifesto-grid">
          <div className="eyebrow">Consultoria privada</div>
          <div className="manifesto-copy">Uma curadoria imobiliária feita com contexto, discrição e atenção às escolhas que realmente importam.</div>
        </div>
      </section>

      <section className="section section-line">
        <div className="container-wide">
          <div className="eyebrow" style={{ marginBottom: 30 }}>Imóveis em destaque</div>
          <div className="editorial-grid">
            {properties.length === 0 ? (
              <article className="editorial-card">
                <div className="media-placeholder" aria-label="Fotografia real do imóvel ainda pendente" />
                <div className="card-meta">
                  <div>
                    <div className="card-title">Carteira em preparação</div>
                    <div className="card-small">Somente imóveis publicados aparecem aqui</div>
                  </div>
                </div>
              </article>
            ) : properties.slice(0, 2).map((property) => {
              const cover = property.media.find((media) => media.media_type === "image" && media.signed_url);
              return (
                <Link href={`/imoveis/${property.slug}`} className="editorial-card" key={property.id}>
                  {cover?.signed_url ? (
                    <div style={{ aspectRatio: "4 / 3", backgroundImage: `url(${cover.signed_url})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--ivory-deep)" }} />
                  ) : (
                    <div className="media-placeholder" />
                  )}
                  <div className="card-meta">
                    <div>
                      <div className="card-title">{property.title ?? property.property_type ?? "Imóvel"}</div>
                      <div className="card-small">{property.area_m2 ? `${property.area_m2} m²` : "Área sob consulta"}</div>
                    </div>
                    <div className="card-small">{property.price ? property.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor sob consulta"}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section split-band">
        <div className="container-wide split-grid">
          <div>
            <div className="eyebrow">Busca personalizada</div>
            <h2 className="split-title">Nem toda boa oportunidade está em uma vitrine.</h2>
          </div>
          <div>
            <p className="muted" style={{ color: "rgba(244,240,232,.68)", maxWidth: 520 }}>A plataforma organiza a busca. A consultoria ajuda a filtrar contexto, localização, momento e objetivo de cada decisão.</p>
            <Link className="text-link" href="/imoveis">Ver catálogo <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-wide manifesto-grid">
          <div className="eyebrow">Cristian Oliveira</div>
          <div>
            <h2 className="manifesto-copy" style={{ marginTop: 0 }}>Atendimento pessoal antes, durante e depois da escolha.</h2>
            <p className="muted" style={{ maxWidth: 620 }}>Retrato profissional, canais oficiais de contato e CRECI serão publicados somente quando fornecidos e confirmados.</p>
            <Link className="text-link" href="/sobre">Conhecer a consultoria <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
