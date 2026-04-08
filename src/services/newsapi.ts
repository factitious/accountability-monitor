import { Incident } from '@/types/incident';
import { NEWSAPI_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';

export async function fetchNewsAPI(apiKey: string): Promise<Incident[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const fromDate = sixtyDaysAgo.toISOString().split('T')[0];

  const allIncidents: Incident[] = [];

  for (const q of NEWSAPI_QUERIES) {
    const params = new URLSearchParams({
      q,
      language: 'en',
      from: fromDate,
      sortBy: 'publishedAt',
      apiKey,
      pageSize: '50',
    });

    const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
    if (!res.ok) throw new Error(`NewsAPI: ${res.status} ${res.statusText}`);
    const data = await res.json();

    if (data.articles) {
      for (const a of data.articles) {
        const entities = extractEntities(a.title || '', a.description || '');
        allIncidents.push({
          id: `newsapi-${allIncidents.length}-${Date.now()}`,
          title: a.title || '',
          description: a.description || null,
          url: a.url,
          date: new Date(a.publishedAt),
          sourceName: a.source?.name || 'Unknown',
          dataSource: 'NewsAPI',
          category: inferCategory(a.title || '', a.description || ''),
          ...entities,
        });
      }
    }
  }

  return allIncidents;
}
