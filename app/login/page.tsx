// app/login/page.tsx
// There is no standalone sign-in page: auth happens in the global dialog.
// Old links, bookmarks and emails still work — they redirect to the storefront
// with the sign-in dialog open.

import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams({ auth: 'login' });

  const redirectTo = first(params.redirect);
  if (redirectTo && redirectTo.startsWith('/')) query.set('redirect', redirectTo);

  const email = first(params.email);
  if (email) query.set('email', email);

  if (first(params.registered) === '1') query.set('registered', '1');
  if (first(params.confirm) === '1') query.set('confirm', '1');

  redirect(`/?${query.toString()}`);
}
