const SAFE_HREF = /^(https?:|mailto:|\/|#)/i;
const SAFE_IMG = /^(https?:|\/)/i;

export function safeHref(href: unknown): string | undefined {
  if (typeof href !== "string" || href.length === 0) return undefined;
  return SAFE_HREF.test(href) ? href : undefined;
}

export function safeImageSrc(src: unknown): string | undefined {
  if (typeof src !== "string" || src.length === 0) return undefined;
  return SAFE_IMG.test(src) ? src : undefined;
}
