import { useEffect } from 'react';

/**
 * Client-side SEO/meta manager. Sets document title, meta description, Open
 * Graph + Twitter tags, canonical URL, and optional JSON-LD structured data.
 *
 * NOTE: true crawler-grade SEO needs SSR/prerendering (see POTENTIAL_FUTURE_UPGRADES.md).
 * This gives correct tags for link-sharing/social cards and SPA navigation today.
 */
export interface SeoOptions {
  title?: string;
  description?: string;
  image?: string;
  type?: string; // og:type
  jsonLd?: Record<string, any>;
}

function setMeta(attr: 'name' | 'property', key: string, content?: string) {
  if (!content) return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSeo({ title, description, image, type = 'website', jsonLd }: SeoOptions) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:url', window.location.href);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    // canonical
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = window.location.href.split('?')[0];

    // JSON-LD structured data
    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(jsonLd);
      script.setAttribute('data-seo', 'true');
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      if (script) script.remove();
    };
  }, [title, description, image, type, JSON.stringify(jsonLd)]);
}

export default useSeo;
