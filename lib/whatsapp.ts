// lib/whatsapp.ts
// Pre-filled WhatsApp links for ordering, stock checks and delivery questions.
// Manual MoMo verification over WhatsApp is the launch payment flow.

import { site } from '@/lib/site';

/** Digits only, international format (no +) — what wa.me expects. */
const WA_NUMBER = site.whatsapp.replace(/\D/g, '');

export function whatsappLink(message: string) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppOrderItem {
  name: string;
  price: number;
  size?: string | null;
  quantity?: number;
  url?: string;
}

function cedis(amount: number) {
  return `GH₵${amount.toFixed(2).replace(/\.00$/, '')}`;
}

/** Most product names already carry the size ("… 400ml") — do not repeat it. */
function sizeSuffix(name: string, size?: string | null) {
  if (!size) return '';
  const compact = size.replace(/\s+/g, '').toLowerCase();
  const flatName = name.replace(/\s+/g, '').toLowerCase();
  return flatName.includes(compact) ? '' : ` (${size})`;
}

/** The exact template the shop asked for. */
export function buildOrderMessage(item: WhatsAppOrderItem) {
  const size = sizeSuffix(item.name, item.size);
  const quantity = item.quantity && item.quantity > 1 ? ` x${item.quantity}` : '';

  return [
    `Hello! I want to order ${item.name}${size}${quantity} - ${cedis(item.price)} from your website.`,
    'My location is: ',
    '',
    item.url ? `Link: ${item.url}` : '',
  ]
    .filter((line, index) => line !== '' || index === 2)
    .join('\n');
}

export function orderOnWhatsApp(item: WhatsAppOrderItem) {
  return whatsappLink(buildOrderMessage(item));
}

/** Cart-level order: one line per item plus the total. */
export function cartOrderMessage(
  items: Array<{ name: string; price: number; quantity: number; size?: string | null }>
) {
  const lines = items.map(
    (item) =>
      `• ${item.name}${sizeSuffix(item.name, item.size)} x${item.quantity} — ${cedis(
        item.price * item.quantity
      )}`
  );
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return [
    'Hello! I want to order these items from your website:',
    ...lines,
    '',
    `Total: ${cedis(total)}`,
    'My location is: ',
  ].join('\n');
}

export function generalWhatsAppMessage() {
  return `Hello ${site.name}! I found you online (beside ${site.landmark}, ${site.town}) and I would like to ask about: `;
}

export function restockMessage(productName: string) {
  return `Hello! Please let me know when ${productName} is back in stock. My location is: `;
}
