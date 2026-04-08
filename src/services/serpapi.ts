import { Incident } from '@/types/incident';
import { SERPAPI_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';

export async function fetchSerpAPI(apiKey: string): Promise<Incident[]> {
  const allIncidents: Incident[] = [];

  for (const q of SERPAPI_QUERIES) {
    const params = new URLSearchParams({
      engine: 'google_news',
      q,
      api_key: apiKey,
      gl: 'us',
      hl: 'en',
    });

    const res = await fetch(`https://serpapi.com/search?${params}`);
    if (!res.ok) throw new Error(`SerpAPI: ${res.status} ${res.statusText}`);
    const data = await res.json();

    const results = data.news_results || data.organic_results || [];
    for (const a of results) {
      const entities = extractEntities(a.title || '', a.snippet || '');
      allIncidents.push({
        id: `serpapi-${allIncidents.length}-${Date.now()}`,
        title: a.title || '',
        description: a.snippet || null,
        url: a.link || a.url || '',
        date: a.date ? new Date(a.date) : new Date(),
        sourceName: a.source?.name || a.source || 'Google News',
        dataSource: 'SerpAPI',
        category: inferCategory(a.title || '', a.snippet || ''),
        ...entities,
      });
    }
  }

  return allIncidents;
}
