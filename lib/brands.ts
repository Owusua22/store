// lib/brands.ts
// Pure brand helpers — safe to import from client components (no Supabase).

/** URL-safe slug for a brand name ("Johnson's Baby" → "johnsons-baby"). */
export function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Storefront link for a brand name, or null when there is no brand. */
export function brandHref(name: string | null | undefined): string | null {
  if (!name) return null;
  const slug = brandSlug(name);
  return slug ? `/products?brand=${encodeURIComponent(slug)}` : null;
}
