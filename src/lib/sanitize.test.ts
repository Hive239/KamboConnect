import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('keeps safe formatting markup', () => {
    const out = sanitizeHtml('<p>Hello <strong>world</strong> <a href="/x">link</a></p>');
    expect(out).toContain('<strong>world</strong>');
    expect(out).toContain('Hello');
  });

  it('strips <script> tags', () => {
    const out = sanitizeHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
  });

  it('strips inline event handlers (onerror/onload)', () => {
    const out = sanitizeHtml('<img src=x onerror="alert(1)">');
    expect(out.toLowerCase()).not.toContain('onerror');
  });

  it('strips javascript: URIs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out.toLowerCase()).not.toContain('javascript:');
  });

  it('handles empty/undefined input', () => {
    expect(sanitizeHtml()).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });
});
