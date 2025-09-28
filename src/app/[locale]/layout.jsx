// import { NextIntlProvider } from 'next-intl';
// import { notFound } from 'next/navigation';
// import { ReactNode } from 'react';

// export async function generateStaticParams() {
//   return [
//     { locale: 'en' },
//     { locale: 'hi' },
//     { locale: 'bn' },
//     { locale: 'hoc' },
//     { locale: 'kru' },
//     { locale: 'mag' },
//     { locale: 'mai' },
//     { locale: 'or' },
//     { locale: 'sat' },
//     { locale: 'unr' }
//   ];
// }

// export default async function LocaleLayout({ children, params: { locale } }) {
//   let messages;
//   try {
//     messages = (await import(`../../messages/${locale}.json`)).default;
//   } catch (error) {
//     notFound();
//   }

//   const dir = LTR;
//   // handle RTL if you ever add Arabic/Hebrew:
//   //const dir = locale === 'ar' || locale === 'he' ? 'rtl' : 'ltr';

//   return (
//     <html lang={locale} dir={dir}>
//       <body>
//         <NextIntlProvider locale={locale} messages={messages}>
//           {children}
//         </NextIntlProvider>
//       </body>
//     </html>
//   );
// }
