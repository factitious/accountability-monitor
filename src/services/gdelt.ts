import { Incident } from '@/types/incident';
import { GDELT_QUERIES, inferCategory } from '@/utils/queries';
import { extractEntities } from '@/utils/entities';
import { supabase } from '@/integrations/supabase/client';

const GDELT_MIN_INTERVAL_MS = 6000;
let gdeltRequestQueue: Promise<void> = Promise.resolve();
let lastGdeltRequestStartedAt = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function invokeGdeltProxy(query: string, startdatetime: string) {
  const run = async () => {
    const waitMs = Math.max(0, lastGdeltRequestStartedAt + GDELT_MIN_INTERVAL_MS - Date.now());
    if (waitMs > 0) {
      await sleep(waitMs);
    }

    lastGdeltRequestStartedAt = Date.now();

    return supabase.functions.invoke('gdelt-proxy', {
      body: {
        query,
        startdatetime,
      },
    });
  };

  const next = gdeltRequestQueue.then(run, run);
  gdeltRequestQueue = next.then(() => undefined, () => undefined);
  return next;
}

function parseGdeltDate(value: unknown) {
  if (typeof value !== 'string') return new Date();

  const normalized = value.replace(
    /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/,
    '$1-$2-$3T$4:$5:$6Z'
  );
  const date = new Date(normalized);

  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function fetchGDELT(): Promise<Incident[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const startDate = sixtyDaysAgo.toISOString().replace(/[-:T]/g, '').slice(0, 14);

  const allIncidents: Incident[] = [];

  for (const q of GDELT_QUERIES) {
    try {
      const { data, error } = await invokeGdeltProxy(q, startDate);

      if (error) throw error;

      const articles = Array.isArray(data?.articles) ? data.articles : [];
      for (const a of articles) {
        const entities = extractEntities(a.title || '', '');
        allIncidents.push({
          id: `gdelt-${allIncidents.length}-${Date.now()}`,
          title: a.title || '',
          description: null,
          url: a.url,
          date: parseGdeltDate(a.seendate),
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
