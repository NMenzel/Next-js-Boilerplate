import { useTranslations } from 'next-intl';
import { AppConfig } from '@/utils/AppConfig';

export const BaseTemplate = (props: {
  leftNav: React.ReactNode;
  rightNav?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BaseTemplate');

  return (
    <div className="w-full px-4 text-gray-800 antialiased">
      <div className="mx-auto max-w-3xl">
        <a
          href="#main"
          className="sr-only rounded-sm bg-white p-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        >
          {t('skip_link')}
        </a>

        <header className="border-b border-gray-300">
          <div className="pt-12 pb-6">
            <p className="text-2xl font-bold text-gray-900">{AppConfig.name}</p>
            <p className="text-base">{t('description')}</p>
          </div>

          <div className="flex flex-wrap justify-between gap-4 pb-4">
            <nav aria-label={t('main_navigation_label')}>
              <ul className="flex flex-wrap gap-x-5 text-lg">{props.leftNav}</ul>
            </nav>

            {props.rightNav && (
              <nav aria-label={t('account_navigation_label')}>
                <ul className="flex flex-wrap items-center gap-x-5 text-lg">{props.rightNav}</ul>
              </nav>
            )}
          </div>
        </header>

        <main id="main" className="py-8">
          {props.children}
        </main>

        <footer className="border-t border-gray-300 py-8 text-center text-sm">
          {t('footer_text', {
            year: new Date().getFullYear(),
            name: AppConfig.name,
          })}
        </footer>
      </div>
    </div>
  );
};
