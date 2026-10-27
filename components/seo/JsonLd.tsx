// components/seo/JsonLd.tsx
// Renders one or more schema.org objects as JSON-LD <script> tags.

interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

export function JsonLd({ data, id }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  if (payload.length === 0) return null;

  return (
    <>
      {payload.map((item, index) => (
        <script
          key={`${id ?? 'jsonld'}-${index}`}
          id={id ? `${id}-${index}` : undefined}
          type="application/ld+json"
          // JSON.stringify output is escaped below to keep the tag well-formed.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
