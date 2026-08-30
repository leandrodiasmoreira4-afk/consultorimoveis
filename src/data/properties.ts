import { getSupabaseClient } from '../lib/supabase/client';
import type { PropertyWithRelations } from '../lib/supabase/types';
import { mockProperties } from './mock-properties';

export type PropertyFilters = {
  search?: string;
  transactionType?: 'sale' | 'rent';
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  regionSlug?: string;
  featured?: boolean;
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('pt-BR');
}

export function filterProperties(
  properties: PropertyWithRelations[],
  filters: PropertyFilters = {},
): PropertyWithRelations[] {
  const search = filters.search ? normalize(filters.search) : null;

  return properties.filter((property) => {
    if (filters.transactionType && property.transaction_type !== filters.transactionType) return false;
    if (filters.propertyType && property.property_type !== filters.propertyType) return false;
    if (filters.featured !== undefined && property.featured !== filters.featured) return false;
    if (filters.minPrice !== undefined && (property.price === null || property.price < filters.minPrice)) return false;
    if (filters.maxPrice !== undefined && (property.price === null || property.price > filters.maxPrice)) return false;
    if (filters.bedrooms !== undefined && (property.bedrooms === null || property.bedrooms < filters.bedrooms)) return false;
    if (filters.regionSlug && property.region?.slug !== filters.regionSlug) return false;

    if (search) {
      const haystack = [
        property.title,
        property.description,
        property.property_type,
        property.region?.city,
        property.region?.neighborhood,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      if (!haystack.includes(search)) return false;
    }

    return true;
  });
}

async function fetchPublishedProperties(): Promise<PropertyWithRelations[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return mockProperties;

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      region:regions(*),
      media:property_media(*),
      features:property_features(*)
    `)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false });

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[properties] Supabase unavailable; using safe development fallback.', error.message);
      return mockProperties;
    }

    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return (data ?? []).map((property) => ({
    ...property,
    media: [...(property.media ?? [])].sort((a, b) => a.position - b.position),
    features: [...(property.features ?? [])].sort((a, b) => a.position - b.position),
  })) as PropertyWithRelations[];
}

export async function getProperties(
  filters: PropertyFilters = {},
): Promise<PropertyWithRelations[]> {
  const properties = await fetchPublishedProperties();
  return filterProperties(properties, filters);
}

export async function getPropertyBySlug(
  slug: string,
): Promise<PropertyWithRelations | null> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return mockProperties.find((property) => property.slug === slug) ?? null;
  }

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      region:regions(*),
      media:property_media(*),
      features:property_features(*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[properties] Could not load property; using safe development fallback.', error.message);
      return mockProperties.find((property) => property.slug === slug) ?? null;
    }

    throw new Error(`Failed to load property: ${error.message}`);
  }

  if (!data) return null;

  return {
    ...data,
    media: [...(data.media ?? [])].sort((a, b) => a.position - b.position),
    features: [...(data.features ?? [])].sort((a, b) => a.position - b.position),
  } as PropertyWithRelations;
}
