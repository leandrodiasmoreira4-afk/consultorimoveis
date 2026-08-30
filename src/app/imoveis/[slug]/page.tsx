import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropertyBySlug } from "@/data/properties";

type Props = { params: Promise<{ slug: string }> };

export default async function PropertyPage({ params }: Props) {
  const { slug } = await params;
  const property = await getPropertyBySlug(slug);
  if (!property) notFound();

  const location = [property.region?.city, property.region?.state].filter(Boolean).join(" · ") || "Localização sob consulta";
  const title = property.title ?? property.property_type ?? "Imóvel";

  return (
    <>
      <section className="property-hero">
        <div className="container-wide property-hero-inner">
          <div className="eyebrow">{location}</div>
          <h1 className="property-title">{title}</h1>
        </div>
      </section>

      <section className="section">
        <div className="container-wide property-info">
          <div>
            <div className="eyebrow">Visão geral</div>
            <div className="property-stats" style={{ marginTop: 24 }}>
              <div className="stat"><span className="card-small">Área</span><strong>{property.area_m2 ? `${property.area_m2} m²` : "—"}</strong></div>
              <div className="stat"><span className="card-small">Finalidade</span><strong>{property.transaction_type === "sale" ? "Venda" : property.transaction_type === "rent" ? "Aluguel" : "—"}</strong></div>
              <div className="stat"><span className="card-small">Valor</span><strong>{property.price ? property.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }) : "Sob consulta"}</strong></div>
            </div>
          </div>
          <div>
            <div className="eyebrow">Descrição</div>
            <p className="manifesto-copy" style={{ fontSize: "clamp(30px, 3vw, 48px)", marginTop: 24 }}>
              {property.description ?? "Descrição oficial pendente de confirmação."}
            </p>
          </div>
        </div>
      </section>

      <section className="section section-line">
        <div className="container-wide">
          <div className="eyebrow" style={{ marginBottom: 28 }}>Galeria</div>
          <div className="editorial-grid">
            {property.media.length > 0 ? property.media.slice(0, 4).map((media) => (
              <div className="editorial-card" key={media.id}>
                <div className="media-placeholder" aria-label={media.alt_text ?? "Mídia do imóvel"} />
              </div>
            )) : (
              <div className="editorial-card" style={{ gridColumn: "1 / -1" }}>
                <div className="media-placeholder" aria-label="Fotografias reais ainda pendentes" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section split-band">
        <div className="container-wide split-grid">
          <div>
            <div className="eyebrow">Atendimento</div>
            <h2 className="split-title">Solicite uma visita com acompanhamento pessoal.</h2>
          </div>
          <div>
            <p style={{ color: "rgba(244,240,232,.68)", maxWidth: 520 }}>O canal oficial será habilitado quando WhatsApp, telefone ou e-mail forem fornecidos e confirmados.</p>
            <Link className="text-link" href="/contato">Solicitar visita <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
