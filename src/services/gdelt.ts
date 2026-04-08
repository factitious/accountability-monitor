import { Incident } from '@/types/incident';
import { GDELT_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';
import { supabase } from '@/integrations/supabase/client';

export async function fetchGDELT(): Promise<Incident[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const startDate = sixtyDaysAgo.toISOString().replace(/[-:T]/g, '').slice(0, 14);

  const allIncidents: Incident[] = [];

  for (let i = 0; i < GDELT_QUERIES.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 6000));
    const q = GDELT_QUERIES[i];
    try {
      const { data, error } = await supabase.functions.invoke('gdelt-proxy', {
        body: {
          query: q,
          startdatetime: startDate,
        },
      });

      if (error) throw error;

      const articles = data?.articles || [];
      for (const a of articles) {
        const entities = extractEntities(a.title || '', '');
        allIncidents.push({
          id: `gdelt-${allIncidents.length}-${Date.now()}`,
          title: a.title || '',
          description: null,
          url: a.url,
          date: (() => { try { const d = a.seendate ? new Date(a.seendate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6Z')) : new Date(); return isNaN(d.getTime()) ? new Date() : d; } catch { return new Date(); } })(),
          sourceName: a.domain || 'GDELT',
          dataSource: 'GDELT',
          category: inferCategory(a.title || '', ''),
          ...entities,
        });
      }
    } catch (err) {
      console.error('GDELT query failed:', q, err);
    }
  }

  return allIncidents;
}
