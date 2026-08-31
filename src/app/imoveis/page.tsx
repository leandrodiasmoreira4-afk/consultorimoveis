import Link from "next/link";
import { getProperties } from "@/data/properties";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams: Promise<{ regiao?: string }>;
};

export default async function PropertiesPage({ searchParams }: Props) {
  const { regiao } = await searchParams;
  const properties = await getProperties(regiao ? { regionSlug: regiao } : {});
  const cities = Array.from(new Set(properties.map((property) => property.region?.city).filter(Boolean))) as string[];
  const types = Array.from(new Set(properties.map((property) => property.property_type).filter(Boolean))) as string[];

  return (
    <>
      <section className="page-hero">
        <div className="container-wide">
          <div className="eyebrow">Seleção de imóveis</div>
          <h1>Imóveis</h1>
          <form className="filters" action="/imoveis" method="get">
            <select className="filter" name="cidade" defaultValue="">
              <option value="">Cidade</option>
              {cities.map((city) => <option value={city.toLowerCase()} key={city}>{city}</option>)}
            </select>
            <select className="filter" name="tipo" defaultValue="">
              <option value="">Tipo do imóvel</option>
              {types.map((type) => <option value={type.toLowerCase()} key={type}>{type}</option>)}
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
          {regiao && (
            <div style={{ marginTop: 22 }}>
              <Link className="text-link" href="/imoveis">Ver todos os imóveis <span aria-hidden="true">↗</span></Link>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container-wide editorial-grid">
          {properties.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <h2>{regiao ? "Nenhum imóvel publicado nesta região." : "A carteira pública está em preparação."}</h2>
              <div>
                <p className="muted">Os imóveis aparecem aqui assim que forem publicados pelo painel administrativo.</p>
                <Link className="text-link" href="/contato">Pedir uma curadoria <span aria-hidden="true">↗</span></Link>
              </div>
            </div>
          ) : properties.map((property) => {
            const cover = property.media.find((media) => media.media_type === "image" && media.signed_url);
            return (
              <Link className="editorial-card" href={`/imoveis/${property.slug}`} key={property.id}>
                {cover?.signed_url ? (
                  <div style={{ aspectRatio: "4 / 3", backgroundImage: `url(${cover.signed_url})`, backgroundSize: "cover", backgroundPosition: "center", backgroundColor: "var(--ivory-deep)" }} />
                ) : (
                  <div className="media-placeholder" />
                )}
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
            );
          })}
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
