import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type DataSource = 'NewsAPI' | 'GDELT' | 'SerpAPI';
type Category = 'Teacher' | 'Doctor' | 'Religious' | 'Other';

interface Incident {
  id: string;
  title: string;
  description: string | null;
  url: string;
  date: Date;
  sourceName: string;
  dataSource: DataSource;
  category: Category;
  perpetratorName: string | null;
  institutionName: string | null;
  perpetratorRole: string | null;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

const NEWSAPI_QUERIES = [
  'teacher sexual abuse accused lawsuit "United States"',
  'doctor sexual abuse accused charged "United States"',
  'priest OR pastor OR rabbi sexual abuse accused "United States"',
];

const SERPAPI_QUERIES = [
  'teacher sexual abuse accused lawsuit',
  'doctor sexual abuse accused charged',
  'priest OR pastor sexual abuse accused',
];

const GDELT_QUERIES = [
  'teacher sexual abuse accused lawsuit',
  'doctor sexual abuse accused',
  'priest OR pastor sexual abuse accused',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inferCategory(title: string, description: string | null): Category {
  const text = `${title} ${description || ''}`.toLowerCase();
  if (/teacher|professor|coach|instructor|school|student|classroom/i.test(text)) return 'Teacher';
  if (/doctor|physician|surgeon|nurse|hospital|clinic|medical|patient/i.test(text)) return 'Doctor';
  if (/priest|pastor|rabbi|imam|minister|church|diocese|parish|religious|bishop|deacon|reverend|seminary|congregation/i.test(text)) return 'Religious';
  return 'Other';
}

function extractPerpetratorName(text: string): string | null {
  const patterns = [
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\s*,?\s*(?:a\s+)?(?:former\s+)?(?:teacher|professor|instructor|coach|doctor|physician|surgeon|nurse|priest|pastor|rabbi|imam|minister|deacon|bishop)/i,
    /([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)\s+(?:accused|charged|arrested|convicted|indicted|sued|faces|facing|identified)/i,
    /(?:accused|charged|arrested|convicted|indicted|identified)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:\s+[A-Z][a-z]+)+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const name = match[1].trim();
      if (name.split(/\s+/).length >= 2 && name.length <= 50) return name;
    }
  }
  return null;
}

function extractInstitutionName(text: string): string | null {
  const patterns = [
    /(?:at|from|of)\s+((?:[A-Z][a-zA-Z'.-]*\s+)*(?:School|Academy|University|College|High|Elementary|Middle|District|Hospital|Medical Center|Clinic|Health|Church|Cathedral|Diocese|Parish|Synagogue|Mosque|Temple|Seminary)(?:\s+(?:of|in)\s+[A-Z][a-zA-Z\s]+)?)/i,
    /((?:[A-Z][a-zA-Z'.-]*\s+)+(?:School District|Unified School District|Independent School District|Public Schools|Catholic Diocese|Archdiocese|Medical Center|Health System))/i,
    /((?:[A-Z][a-zA-Z'.-]*\s+)+(?:Church|Cathedral|Diocese|Parish|Synagogue|Mosque|Temple))/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const inst = match[1].trim();
      if (inst.length >= 5 && inst.length <= 100) return inst;
    }
  }
  return null;
}

function extractRole(text: string): string | null {
  const rolePatterns = [
    /(?:former\s+)?((?:\w+\s+)?(?:grade\s+)?teacher)/i,
    /(?:former\s+)?((?:\w+\s+)?professor)/i,
    /(?:former\s+)?((?:\w+\s+)?(?:coach|instructor))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:doctor|physician|surgeon|pediatrician|gynecologist|psychiatrist|therapist))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:nurse|nurse practitioner))/i,
    /(?:former\s+)?((?:\w+\s+)?(?:priest|pastor|rabbi|imam|minister|deacon|bishop|monsignor|reverend|chaplain))/i,
  ];
  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const role = match[1].trim();
      if (role.length <= 40) return role;
    }
  }
  return null;
}

function extractEntities(title: string, description: string | null) {
  const text = `${title} ${description || ''}`;
  return {
    perpetratorName: extractPerpetratorName(text),
    institutionName: extractInstitutionName(text),
    perpetratorRole: extractRole(text),
  };
}

function deduplicateIncidents(incidents: Incident[]): Incident[] {
  // 1. Exact URL dedup
  const urlMap = new Map<string, Incident>();
  for (const inc of incidents) {
    const normalizedUrl = inc.url.toLowerCase().replace(/\/+$/, '');
    const existing = urlMap.get(normalizedUrl);
    if (!existing || inc.date > existing.date) urlMap.set(normalizedUrl, inc);
  }

  // 2. Near-duplicate title suppression (80%+ word overlap)
  const unique = Array.from(urlMap.values());
  const kept: Incident[] = [];
  for (const inc of unique) {
    const words = titleWords(inc.title);
    let isDup = false;
    for (let i = 0; i < kept.length; i++) {
      if (wordOverlap(words, titleWords(kept[i].title)) >= 0.8) {
        if (inc.date > kept[i].date) kept[i] = inc;
        isDup = true;
        break;
      }
    }
    if (!isDup) kept.push(inc);
  }
  return kept;
}

function titleWords(title: string): Set<string> {
  return new Set(title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2));
}

function wordOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  for (const word of a) { if (b.has(word)) overlap++; }
  return overlap / Math.min(a.size, b.size);
}

function parseGdeltDate(value: unknown): Date {
  if (typeof value !== 'string') return new Date();
  const normalized = value.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z');
  const date = new Date(normalized);
  return isNaN(date.getTime()) ? new Date() : date;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchFromNewsAPI(baseUrl: string): Promise<Incident[]> {
  const apiKey = Deno.env.get('NEWSAPI_KEY');
  if (!apiKey) { console.warn('NEWSAPI_KEY not set, skipping'); return []; }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

  const results = await Promise.allSettled(NEWSAPI_QUERIES.map(async (q) => {
    const params = new URLSearchParams({ q, language: 'en', sortBy: 'publishedAt', apiKey, pageSize: '50', from: fromDate });
    const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
    const data = await res.json();
    return (data.articles ?? []).map((a: any) => ({
      id: `newsapi-${btoa(unescape(encodeURIComponent(a.url))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
      title: a.title || '',
      description: a.description || null,
      url: a.url,
      date: new Date(a.publishedAt),
      sourceName: a.source?.name || 'Unknown',
      dataSource: 'NewsAPI' as DataSource,
      category: inferCategory(a.title || '', a.description || ''),
      ...extractEntities(a.title || '', a.description || ''),
    }));
  }));

  return results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
}

async function fetchFromSerpAPI(): Promise<Incident[]> {
  const apiKey = Deno.env.get('SERPAPI_KEY');
  if (!apiKey) { console.warn('SERPAPI_KEY not set, skipping'); return []; }

  const results = await Promise.allSettled(SERPAPI_QUERIES.map(async (q) => {
    const params = new URLSearchParams({ engine: 'google_news', q, api_key: apiKey, gl: 'us', hl: 'en' });
    const res = await fetch(`https://serpapi.com/search?${params}`);
    const data = await res.json();
    return (data?.news_results || data?.organic_results || []).map((a: any) => ({
      id: `serpapi-${btoa(unescape(encodeURIComponent(a.link || a.url || q))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
      title: a.title || '',
      description: a.snippet || null,
      url: a.link || a.url || '',
      date: a.date ? new Date(a.date) : new Date(),
      sourceName: a.source?.name || a.source || 'Google News',
      dataSource: 'SerpAPI' as DataSource,
      category: inferCategory(a.title || '', a.snippet || ''),
      ...extractEntities(a.title || '', a.snippet || ''),
    }));
  }));

  return results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
}

async function fetchFromGDELT(): Promise<Incident[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const startdatetime = sixtyDaysAgo.toISOString().replace(/[-:T]/g, '').slice(0, 14);

  const results = await Promise.allSettled(GDELT_QUERIES.map(async (q) => {
    const params = new URLSearchParams({ query: q, mode: 'artlist', maxrecords: '50', format: 'json', sourcelang: 'English', sourcecountry: 'US', startdatetime });
    const res = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params}`);
    if (res.status === 429) { console.warn('GDELT rate limited'); return []; }
    const data = await res.json();
    return (data?.articles ?? []).map((a: any) => ({
      id: `gdelt-${btoa(unescape(encodeURIComponent(a.url || a.title || q))).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)}`,
      title: a.title || '',
      description: null,
      url: a.url,
      date: parseGdeltDate(a.seendate),
      sourceName: a.domain || 'GDELT',
      dataSource: 'GDELT' as DataSource,
      category: inferCategory(a.title || '', null),
      ...extractEntities(a.title || '', null),
    }));
  }));

  return results.flatMap((r) => r.status === 'fulfilled' ? r.value : []);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceRoleKey);

    // Fetch from all 3 sources in parallel — each source also fetches its queries in parallel
    const [newsapiResults, serpapiResults, gdeltResults] = await Promise.all([
      fetchFromNewsAPI(supabaseUrl),
      fetchFromSerpAPI(),
      fetchFromGDELT(),
    ]);

    const all = deduplicateIncidents([...newsapiResults, ...serpapiResults, ...gdeltResults]);

    // Upsert — on conflict (same URL) update the record with fresher data
    const rows = all.map((inc) => ({
      title: inc.title,
      description: inc.description,
      url: inc.url,
      date: inc.date.toISOString(),
      source_name: inc.sourceName,
      data_source: inc.dataSource,
      category: inc.category,
      perpetrator_name: inc.perpetratorName,
      institution_name: inc.institutionName,
      perpetrator_role: inc.perpetratorRole,
      fetched_at: new Date().toISOString(),
    }));

    // Deduplicate by URL before upserting (prevents PK conflicts from hash collisions)
    const seenUrls = new Map<string, typeof rows[0]>();
    for (const row of rows) {
      const key = row.url.toLowerCase().replace(/\/+$/, '');
      if (!seenUrls.has(key)) seenUrls.set(key, row);
    }
    const dedupedRows = Array.from(seenUrls.values());

    const { error: upsertError } = await db.from('incidents').upsert(dedupedRows, { onConflict: 'url', ignoreDuplicates: false });
    if (upsertError) {
      console.error('Upsert failed:', JSON.stringify(upsertError));
      throw new Error(`DB upsert failed: ${upsertError.message}`);
    }

    return new Response(JSON.stringify({ inserted: dedupedRows.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('fetch-incidents failed:', message, stack);
    return new Response(JSON.stringify({ error: message, stack }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
