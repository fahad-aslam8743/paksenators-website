import { useEffect } from 'react';

export interface SEOConfig {
  /** Page-specific title. The site name is appended automatically (unless this already IS the site name). */
  title: string;
  /** 1-2 sentence meta description shown in search results. */
  description: string;
  /** Optional comma-separated keywords. */
  keywords?: string;
  /** Set true for private/admin pages that should never be indexed by search engines. */
  noindex?: boolean;
}

const SITE_NAME = 'Youth Senate of Pakistan';
// Falls back gracefully if the site isn't running on this exact domain yet —
// Open Graph / canonical URLs are still built from window.location at runtime.
const DEFAULT_OG_IMAGE = '/android-chrome-512x512.png';

function setMetaByName(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLinkRel(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sets document.title, meta description, Open Graph, and Twitter Card tags
 * for the currently-rendered page. Call this once per top-level view
 * component (see src/data/seo.ts for the full per-page map, applied
 * centrally in App.tsx) so every page of the site has its own accurate
 * title and description instead of one generic tag for the whole app.
 */
export function useSEO({ title, description, keywords, noindex }: SEOConfig) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`;
    document.title = fullTitle;

    setMetaByName('description', description);
    if (keywords) setMetaByName('keywords', keywords);
    setMetaByName('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const originImage = typeof window !== 'undefined' ? `${window.location.origin}${DEFAULT_OG_IMAGE}` : DEFAULT_OG_IMAGE;

    setMetaByProperty('og:title', fullTitle);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:type', 'website');
    setMetaByProperty('og:site_name', SITE_NAME);
    setMetaByProperty('og:image', originImage);
    setMetaByProperty('og:url', currentUrl);

    setMetaByName('twitter:card', 'summary_large_image');
    setMetaByName('twitter:title', fullTitle);
    setMetaByName('twitter:description', description);
    setMetaByName('twitter:image', originImage);

    if (currentUrl) {
      setLinkRel('canonical', currentUrl.split('?')[0].split('#')[0]);
    }
  }, [title, description, keywords, noindex]);
}
