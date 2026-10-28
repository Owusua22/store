// lib/skin-types.ts
// Shared vocabulary for skin types + concerns across the admin and storefront.

export const SKIN_TYPES = [
  { value: 'normal', label: 'Normal', emoji: '🌿' },
  { value: 'dry', label: 'Dry', emoji: '🏜️' },
  { value: 'oily', label: 'Oily', emoji: '💧' },
  { value: 'combination', label: 'Combination', emoji: '⚖️' },
  { value: 'sensitive', label: 'Sensitive', emoji: '🌸' },
  { value: 'acne-prone', label: 'Acne-prone', emoji: '🩹' },
] as const;

export const SKIN_CONCERNS = [
  { value: 'dryness', label: 'Dryness' },
  { value: 'acne', label: 'Acne & breakouts' },
  { value: 'dark-spots', label: 'Dark spots' },
  { value: 'dullness', label: 'Dullness' },
  { value: 'uneven-tone', label: 'Uneven tone' },
  { value: 'sensitivity', label: 'Sensitivity' },
  { value: 'ageing', label: 'Fine lines & ageing' },
  { value: 'sun-protection', label: 'Sun protection' },
] as const;

export const BLOG_CATEGORIES = [
  'Skin care tips',
  'Routine',
  'Ingredients',
  'Baby care',
  'Product guides',
  'News',
] as const;

export function skinTypeLabel(value: string): string {
  return SKIN_TYPES.find((type) => type.value === value)?.label ?? value;
}

export function skinTypeEmoji(value: string): string {
  return SKIN_TYPES.find((type) => type.value === value)?.emoji ?? '✨';
}

export function concernLabel(value: string): string {
  return SKIN_CONCERNS.find((concern) => concern.value === value)?.label ?? value;
}

/** Article body is stored as lightweight markdown; render safe HTML blocks. */
export function renderBlogHtml(markdown: string): string {
  const escape = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const inline = (value: string) =>
    escape(value)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">$1</code>')
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a class="font-semibold text-brand underline" href="$2" rel="noopener noreferrer">$1</a>'
      );

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let list: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (list) {
      html.push(`</${list}>`);
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      closeList();
      continue;
    }

    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h2>${inline(line.slice(2))}</h2>`);
      continue;
    }
    if (line.startsWith('> ')) {
      closeList();
      html.push(
        `<blockquote class="border-l-4 border-brand/40 pl-3 italic text-gray-600">${inline(
          line.slice(2)
        )}</blockquote>`
      );
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      if (list !== 'ul') {
        closeList();
        html.push('<ul>');
        list = 'ul';
      }
      html.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      if (list !== 'ol') {
        closeList();
        html.push('<ol>');
        list = 'ol';
      }
      html.push(`<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  return html.join('\n');
}

export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}
