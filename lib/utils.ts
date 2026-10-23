// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(price);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function extractR2KeyFromUrl(url: string): string {
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
  return url.replace(`${publicUrl}/`, '');
}
/** Compact Ghana cedi formatting used across the storefront: GH₵1,299 */
export function formatCedis(price: number): string {
  const amount = Number.isFinite(price) ? price : 0;
  return `GH₵${new Intl.NumberFormat('en-GH', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/** Pull a numeric value out of the product.metadata JSON column */
export function metaNumber(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
  fallback = 0
): number {
  const value = metadata?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function metaString(
  metadata: Record<string, unknown> | null | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
