export type OlxMedia = {
  media_type: "image" | "video";
  storage_path: string;
  position: number;
};

export type OlxRegion = {
  city: string;
  state: string;
  neighborhood: string | null;
};

export type OlxProperty = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  status: "draft" | "published" | "archived";
  price: number | string | null;
  condo_fee: number | string | null;
  iptu: number | string | null;
  transaction_type: "sale" | "rent" | null;
  property_type: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spaces: number | null;
  area_m2: number | string | null;
  lot_area_m2: number | string | null;
  address_line1: string | null;
  address_number: string | null;
  postal_code: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  region: OlxRegion | null;
  media: OlxMedia[];
};

export type OlxProfile = {
  display_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const PROPERTY_TYPE_MAP: Record<string, string> = {
  apartamento: "Residential / Apartment",
  casa: "Residential / Home",
  "casa de condominio": "Residential / Condo",
  "casa em condominio": "Residential / Condo",
  "casa de vila": "Residential / Village House",
  chacara: "Residential / Farm Ranch",
  cobertura: "Residential / Penthouse",
  consultorio: "Commercial / Consultorio",
  "edificio residencial": "Commercial / Edificio Residencial",
  fazenda: "Residential / Agricultural",
  sitio: "Residential / Agricultural",
  flat: "Residential / Flat",
  galpao: "Commercial / Industrial",
  deposito: "Commercial / Industrial",
  armazem: "Commercial / Industrial",
  garagem: "Commercial / Garage",
  hotel: "Commercial / Hotel",
  motel: "Commercial / Hotel",
  pousada: "Commercial / Hotel",
  "imovel comercial": "Commercial / Building",
  kitnet: "Residential / Kitnet",
  conjugado: "Residential / Kitnet",
  studio: "Residential / Studio",
  loft: "Residential / Loft",
  "andar corporativo": "Commercial / Corporate Floor",
  "laje corporativa": "Commercial / Corporate Floor",
  lote: "Residential / Land Lot",
  terreno: "Residential / Land Lot",
  "lote/terreno": "Residential / Land Lot",
  "terreno/lote/condominio": "Residential / Land Lot",
  "ponto comercial": "Commercial / Business",
  loja: "Commercial / Business",
  box: "Commercial / Business",
  predio: "Commercial / Edificio Comercial",
  "predio inteiro": "Commercial / Edificio Comercial",
  sala: "Commercial / Office",
  "sala comercial": "Commercial / Office",
  conjunto: "Commercial / Office",
  sobrado: "Residential / Sobrado",
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function mapOlxPropertyType(value: string | null): string | null {
  if (!value) return null;
  const normalized = normalize(value);
  if (PROPERTY_TYPE_MAP[normalized]) return PROPERTY_TYPE_MAP[normalized];

  for (const [key, mapped] of Object.entries(PROPERTY_TYPE_MAP)) {
    if (normalized.includes(key)) return mapped;
  }

  return null;
}

export function stableOlxExternalId(propertyId: string): string {
  return `olx-${propertyId}`;
}

export function validateOlxProperty(property: OlxProperty, profile?: OlxProfile | null): string[] {
  const errors: string[] = [];
  const images = property.media?.filter((item) => item.media_type === "image") ?? [];
  const title = property.title?.trim() ?? "";
  const description = property.description?.trim() ?? "";
  const price = Number(property.price);
  const area = Number(property.area_m2 ?? property.lot_area_m2);

  if (property.status !== "published") errors.push("O imóvel precisa estar publicado no site.");
  if (!title || title.length < 10 || title.length > 100) errors.push("O título deve ter entre 10 e 100 caracteres.");
  if (!description || description.length < 50 || description.length > 3000) errors.push("A descrição deve ter entre 50 e 3.000 caracteres.");
  if (!Number.isFinite(price) || price <= 0) errors.push("Preço ausente ou inválido.");
  if (!property.transaction_type || !["sale", "rent"].includes(property.transaction_type)) errors.push("Tipo de transação inválido.");
  if (!mapOlxPropertyType(property.property_type)) errors.push("Tipo de imóvel não reconhecido pelo padrão VRSync.");
  if (!property.region?.city || !property.region?.state || !property.region?.neighborhood) errors.push("Localização incompleta: cidade, UF e bairro são obrigatórios.");
  if (!Number.isFinite(area) || area <= 0) errors.push("Área do imóvel ausente ou inválida.");
  if (images.length === 0) errors.push("Nenhuma fotografia cadastrada.");
  if (profile && (!profile.display_name?.trim() || !profile.email?.trim())) errors.push("Nome e e-mail do consultor são obrigatórios para o feed.");

  return errors;
}

function xml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function integer(value: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function buildVrsyncXml(args: {
  origin: string;
  profile: OlxProfile;
  listings: Array<{ property: OlxProperty; externalId: string }>;
  publishDate?: Date;
}): string {
  const { origin, profile, listings } = args;
  const publishDate = (args.publishDate ?? new Date()).toISOString();
  const contactPhone = profile.phone?.trim() || profile.whatsapp?.trim() || "";
  const headerPhone = contactPhone ? `<Telephone>${xml(contactPhone)}</Telephone>` : "";

  const listingXml = listings.map(({ property, externalId }) => {
    const mappedType = mapOlxPropertyType(property.property_type)!;
    const transaction = property.transaction_type === "rent" ? "For Rent" : "For Sale";
    const priceElement = property.transaction_type === "rent"
      ? `<RentalPrice currency="BRL" period="Monthly">${integer(property.price)}</RentalPrice>`
      : `<ListPrice currency="BRL">${integer(property.price)}</ListPrice>`;
    const isLotArea = /Land Lot|Industrial|Agricultural|Farm Ranch/.test(mappedType);
    const areaValue = integer(isLotArea ? (property.lot_area_m2 ?? property.area_m2) : property.area_m2);
    const areaElement = isLotArea
      ? `<LotArea unit="square metres">${areaValue}</LotArea>`
      : `<LivingArea unit="square metres">${areaValue}</LivingArea>`;
    const condo = integer(property.condo_fee);
    const iptu = integer(property.iptu);
    const coordinates = property.latitude != null && property.longitude != null
      ? `<Latitude>${xml(property.latitude)}</Latitude><Longitude>${xml(property.longitude)}</Longitude>`
      : "";
    const address = property.address_line1 ? `<Address>${xml(property.address_line1)}</Address>` : "";
    const number = property.address_number ? `<StreetNumber>${xml(property.address_number)}</StreetNumber>` : "";
    const postalCode = property.postal_code ? `<PostalCode>${xml(property.postal_code)}</PostalCode>` : "";
    const detailUrl = `${origin}/imoveis/${encodeURIComponent(property.slug)}`;

    const images = [...property.media]
      .filter((item) => item.media_type === "image")
      .sort((a, b) => a.position - b.position)
      .map((item, index) => {
        const mediaUrl = `${origin}/api/feed/olx/media/${item.storage_path.split("/").map(encodeURIComponent).join("/")}`;
        return `<Item medium="image" caption="img${index + 1}"${index === 0 ? ' primary="true"' : ""}>${xml(mediaUrl)}</Item>`;
      })
      .join("");

    return `<Listing>
      <ListingID>${xml(externalId)}</ListingID>
      <Title>${cdata(property.title!.trim())}</Title>
      <TransactionType>${transaction}</TransactionType>
      <PublicationType>STANDARD</PublicationType>
      <DetailViewUrl>${xml(detailUrl)}</DetailViewUrl>
      <Location displayAddress="Neighborhood">
        <Country abbreviation="BR">Brasil</Country>
        <State abbreviation="${xml(property.region!.state.toUpperCase())}">${xml(property.region!.state.toUpperCase())}</State>
        <City>${xml(property.region!.city)}</City>
        <Neighborhood>${xml(property.region!.neighborhood!)}</Neighborhood>
        ${address}${number}${postalCode}${coordinates}
      </Location>
      <Details>
        <PropertyType>${xml(mappedType)}</PropertyType>
        <Description>${cdata(property.description!.trim())}</Description>
        ${priceElement}
        ${areaElement}
        ${condo !== null ? `<PropertyAdministrationFee currency="BRL">${condo}</PropertyAdministrationFee>` : ""}
        ${iptu !== null ? `<Iptu currency="BRL" period="Yearly">${iptu}</Iptu>` : ""}
        ${property.bedrooms != null ? `<Bedrooms>${property.bedrooms}</Bedrooms>` : ""}
        ${property.bathrooms != null ? `<Bathrooms>${property.bathrooms}</Bathrooms>` : ""}
        ${property.suites != null ? `<Suites>${property.suites}</Suites>` : ""}
        ${property.parking_spaces != null ? `<Garage type="Parking Space">${property.parking_spaces}</Garage>` : ""}
      </Details>
      <Media>${images}</Media>
      <ContactInfo>
        <Name>${xml(profile.display_name)}</Name>
        <Email>${xml(profile.email)}</Email>
        ${contactPhone ? `<Telephone>${xml(contactPhone)}</Telephone>` : ""}
      </ContactInfo>
    </Listing>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<ListingDataFeed xmlns="http://www.vivareal.com/schemas/1.0/VRSync" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.vivareal.com/schemas/1.0/VRSync http://xml.vivareal.com/vrsync.xsd">
  <Header>
    <Provider>${xml(profile.display_name || "Feed imobiliário")}</Provider>
    <Email>${xml(profile.email || "")}</Email>
    <ContactName>${xml(profile.display_name || "")}</ContactName>
    <PublishDate>${xml(publishDate)}</PublishDate>
    ${headerPhone}
  </Header>
  <Listings>${listingXml ? `\n${listingXml}\n  ` : ""}</Listings>
</ListingDataFeed>`;
}
