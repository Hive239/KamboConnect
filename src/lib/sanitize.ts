import DOMPurify from 'dompurify';

/**
 * Sanitize user-authored rich HTML (react-quill post/reply bodies) before rendering
 * via dangerouslySetInnerHTML. Prevents stored XSS — a malicious body written
 * directly through the API (bypassing the editor) can otherwise execute in viewers'
 * (and admins') browsers. Strips scripts, event handlers, and dangerous URIs.
 */
export function sanitizeHtml(html?: string): string {
  return DOMPurify.sanitize(html || '', {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onload'],
  });
}
