import Link from "next/link";
import { getProperties } from "@/data/properties";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegionSummary = {
  slug: string;
  city: string;
  state: string;
  count: number;
};

export default async function RegionsPage() {
  const properties = await getProperties();

  const regions = Array.from(
    properties.reduce((map, property) => {
      const region = property.region;
      if (!region) return map;

      const current = map.get(region.slug);
      if (current) {
        current.count += 1;
      } else {
        map.set(region.slug, {
          slug: region.slug,
          city: region.city,
          state: region.state,
          count: 1,
        });
      }

      return map;
    }, new Map<string, RegionSummary>()).values(),
  ).sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));

  return (
    <>
      <section className="page-hero">
        <div className="container-wide">
          <div className="eyebrow">Territórios</div>
          <h1>Regiões</h1>
        </div>
      </section>

      <section className="section">
        <div className="container-wide">
          {regions.length === 0 ? (
            <div className="manifesto-grid">
              <div className="eyebrow">Em preparação</div>
              <p className="manifesto-copy" style={{ margin: 0 }}>
                As regiões aparecerão aqui conforme os imóveis forem publicados.
              </p>
            </div>
          ) : (
            <div className="editorial-grid">
              {regions.map((region) => (
                <Link
                  key={region.slug}
                  href={`/imoveis?regiao=${encodeURIComponent(region.slug)}`}
                  className="editorial-card"
                >
                  <div
                    style={{
                      aspectRatio: "16 / 10",
                      background:
                        "linear-gradient(145deg, var(--sand), var(--ivory-deep) 56%, var(--sage))",
                      display: "flex",
                      alignItems: "end",
                      padding: 24,
                    }}
                  >
                    <span className="eyebrow">{region.state}</span>
                  </div>
                  <div className="card-meta">
                    <div>
                      <div className="card-title">{region.city}</div>
                      <div className="card-small">
                        {region.count} {region.count === 1 ? "imóvel disponível" : "imóveis disponíveis"}
                      </div>
                    </div>
                    <div className="card-small">Ver seleção ↗</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
