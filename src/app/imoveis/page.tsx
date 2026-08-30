import Link from "next/link";
import { getProperties } from "@/data/properties";

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <>
      <section className="page-hero">
        <div className="container-wide">
          <div className="eyebrow">Seleção de imóveis</div>
          <h1>Imóveis</h1>
          <form className="filters" action="/imoveis" method="get">
            <select className="filter" name="cidade" defaultValue="">
              <option value="">Cidade</option>
              <option value="petrolina">Petrolina</option>
            </select>
            <select className="filter" name="tipo" defaultValue="">
              <option value="">Tipo do imóvel</option>
              <option value="terreno">Terreno</option>
            </select>
            <select className="filter" name="finalidade" defaultValue="">
              <option value="">Finalidade</option>
              <option value="sale">Venda</option>
              <option value="rent">Aluguel</option>
            </select>
            <select className="filter" name="valor" defaultValue="">
              <option value="">Faixa de valor</option>
              <option value="ate-250">Até R$ 250 mil</option>
              <option value="250-500">R$ 250–500 mil</option>
              <option value="500+">Acima de R$ 500 mil</option>
            </select>
          </form>
        </div>
      </section>

      <section className="section">
        <div className="container-wide editorial-grid">
          {properties.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <h2>A carteira pública está em preparação.</h2>
              <div>
                <p className="muted">Os imóveis aparecem aqui somente depois de publicados no Supabase. Nenhum anúncio incompleto é exibido como se fosse definitivo.</p>
                <Link className="text-link" href="/contato">Pedir uma curadoria <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          ) : properties.map((property) => (
            <Link className="editorial-card" href={`/imoveis/${property.slug}`} key={property.id}>
              <div className="media-placeholder" />
              <div className="card-meta">
                <div>
                  <div className="card-title">{property.title ?? property.property_type ?? "Imóvel"}</div>
                  <div className="card-small">
                    {[property.region?.city, property.region?.state].filter(Boolean).join(" · ") || "Localização sob consulta"}
                  </div>
                </div>
                <div className="card-small">
                  {property.area_m2 ? `${property.area_m2} m²` : "Área sob consulta"}
                  <br />
                  {property.price ? property.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Valor sob consulta"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section section-line">
        <div className="container-wide manifesto-grid">
          <div className="eyebrow">Curadoria</div>
          <div>
            <h2 className="manifesto-copy" style={{ marginTop: 0 }}>Não encontrou o que procura?</h2>
            <p className="muted" style={{ maxWidth: 560 }}>Uma busca personalizada permite considerar oportunidades que ainda não aparecem no catálogo público.</p>
            <Link className="text-link" href="/contato">Pedir uma curadoria <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
