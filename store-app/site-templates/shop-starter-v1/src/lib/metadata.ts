import type { Metadata } from 'next';
import { getSiteContent } from '@/lib/db/site-content';

export async function sitePageMetadata(
  title: string,
  description?: string,
  options?: { robots?: Metadata['robots'] },
): Promise<Metadata> {
  const { site } = await getSiteContent();
  return {
    title,
    description: description ?? `${title} | ${site.name}`,
    robots: options?.robots ?? { index: false, follow: false },
  };
}
