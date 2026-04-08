import { Incident } from '@/types/incident';

export function deduplicateIncidents(incidents: Incident[]): Incident[] {
  // 1. Exact URL dedup
  const urlMap = new Map<string, Incident>();
  for (const inc of incidents) {
    const normalizedUrl = inc.url.toLowerCase().replace(/\/+$/, '');
    const existing = urlMap.get(normalizedUrl);
    if (!existing || inc.date > existing.date) {
      urlMap.set(normalizedUrl, inc);
    }
  }

  // 2. Near-duplicate title suppression (80%+ word overlap)
  const unique = Array.from(urlMap.values());
  const kept: Incident[] = [];

  for (const inc of unique) {
    const words = titleWords(inc.title);
    let isDup = false;
    for (let i = 0; i < kept.length; i++) {
      const existingWords = titleWords(kept[i].title);
      if (wordOverlap(words, existingWords) >= 0.8) {
        // Keep the more recent one
        if (inc.date > kept[i].date) {
          kept[i] = inc;
        }
        isDup = true;
        break;
      }
    }
    if (!isDup) kept.push(inc);
  }

  return kept;
}

function titleWords(title: string): Set<string> {
  return new Set(
    title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2)
  );
}

function wordOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) {
    if (b.has(word)) overlap++;
  }
  return overlap / Math.min(a.size, b.size);
}
