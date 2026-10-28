import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { confirmEmailLink } from '@/actions/AuthActions';
import { redirect } from '@/libs/I18nNavigation';
import { EmailLinkValidation } from '@/validations/AuthValidation';

type ConfirmPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: ConfirmPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ConfirmPage' });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
    robots: { index: false, follow: false },
  };
}

// Opening the link only renders this page; the token is verified when the user submits the form.
export default async function ConfirmPage(props: ConfirmPageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const link = EmailLinkValidation.safeParse(await props.searchParams);

  if (!link.success) {
    return redirect({ href: { pathname: '/sign-in', query: { error: 'link_invalid' } }, locale });
  }

  const t = await getTranslations({ locale, namespace: 'ConfirmPage' });

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">{t('heading')}</h1>
      <p className="mb-6 text-base">{t('intro')}</p>
      <form action={confirmEmailLink}>
        <input type="hidden" name="token_hash" value={link.data.token_hash} />
        <input type="hidden" name="type" value={link.data.type} />
        <button
          type="submit"
          className="rounded-sm bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800"
        >
          {t('submit')}
        </button>
      </form>
    </>
  );
}
