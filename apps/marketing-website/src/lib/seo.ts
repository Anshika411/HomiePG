import { Metadata } from 'next';
import { SITE_CONFIG } from '@/constants/site';

type SEOProps = {
  title: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  canonical?: string;
};

export function generateMetadata({
  title,
  description = SITE_CONFIG.description,
  image = SITE_CONFIG.ogImage,
  noIndex = false,
  canonical,
}: SEOProps): Metadata {
  const fullTitle = title === SITE_CONFIG.name ? title : `${title} | ${SITE_CONFIG.name}`;

  return {
    title: fullTitle,
    description,
    ...(noIndex && { robots: { index: false, follow: false } }),
    openGraph: {
      title: fullTitle,
      description,
      url: canonical ?? SITE_CONFIG.url,
      siteName: SITE_CONFIG.name,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: SITE_CONFIG.social.twitter,
    },
    alternates: canonical ? { canonical } : undefined,
  };
}
