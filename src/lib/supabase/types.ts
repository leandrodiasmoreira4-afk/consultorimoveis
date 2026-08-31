export type PropertyRow = {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  transaction_type: 'sale' | 'rent' | null;
  property_type: string | null;
  status: 'draft' | 'published' | 'archived';
  price: number | null;
  condo_fee: number | null;
  iptu: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  suites: number | null;
  parking_spaces: number | null;
  area_m2: number | null;
  lot_area_m2: number | null;
  region_id: string | null;
  address_line1: string | null;
  address_number: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RegionRow = {
  id: string;
  city: string;
  state: string;
  neighborhood: string | null;
  slug: string;
  cover_image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type PropertyMediaRow = {
  id: string;
  property_id: string;
  storage_path: string;
  media_type: 'image' | 'video';
  alt_text: string | null;
  position: number;
  created_at: string;
  signed_url?: string | null;
};

export type PropertyFeatureRow = {
  id: string;
  property_id: string;
  name: string;
  value: string | null;
  position: number;
  created_at: string;
};

export type PropertyWithRelations = PropertyRow & {
  region: RegionRow | null;
  media: PropertyMediaRow[];
  features: PropertyFeatureRow[];
};
