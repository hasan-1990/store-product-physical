/** Normalize hostname for routing (strip www, port). */
export function normalizeHost(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/:\d+$/, '');
}

export function parseHubDomains(raw?: string): Set<string> {
  const value =
    raw ||
    process.env.HUB_DOMAINS ||
    'localhost,127.0.0.1,fathemes.com,www.fathemes.com';
  return new Set(
    value
      .split(',')
      .map((d) => normalizeHost(d))
      .filter(Boolean),
  );
}

export function isHubHost(host: string, hubDomains?: Set<string>): boolean {
  const normalized = normalizeHost(host);
  const domains = hubDomains ?? parseHubDomains();
  return domains.has(normalized) || domains.has(`www.${normalized}`);
}
