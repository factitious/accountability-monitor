import { Incident } from '@/types/incident';
import { SERPAPI_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';
import { supabase } from '@/integrations/supabase/client';

export async function fetchSerpAPI(apiKey: string): Promise<Incident[]> {
  const allIncidents: Incident[] = [];

  for (const q of SERPAPI_QUERIES) {
    const { data, error } = await supabase.functions.invoke('serpapi-proxy', {
      body: { apiKey, query: q },
    });

    if (error) throw new Error(`SerpAPI proxy: ${error.message}`);
    if (data?.error) throw new Error(`SerpAPI: ${data.error}`);

    const results = data?.news_results || data?.organic_results || [];
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
