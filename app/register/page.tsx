// app/register/page.tsx
// No standalone registration page either — the global auth dialog handles both
// sign-in and account creation. Kept as a redirect for old links.

import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegisterRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams({ auth: 'register' });

  const redirectTo = first(params.redirect);
  if (redirectTo && redirectTo.startsWith('/')) query.set('redirect', redirectTo);

  redirect(`/?${query.toString()}`);
}
