import { Incident } from '@/types/incident';
import { NEWSAPI_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';
import { supabase } from '@/integrations/supabase/client';

export async function fetchNewsAPI(): Promise<Incident[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

  const allIncidents: Incident[] = [];

  for (const q of NEWSAPI_QUERIES) {
    const { data, error } = await supabase.functions.invoke('newsapi-proxy', {
      body: { query: q, from: fromDate, pageSize: 50 },
    });

    if (error) throw new Error(`NewsAPI proxy: ${error.message}`);
    if (data?.error) throw new Error(`NewsAPI: ${data.error}`);

    if (data?.articles) {
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
