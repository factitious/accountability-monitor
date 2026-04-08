const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, from, pageSize } = await req.json();

    const apiKey = Deno.env.get('NEWSAPI_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'NEWSAPI_KEY secret is not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      apiKey,
      pageSize: String(pageSize || 50),
    });
    if (from) params.set('from', from);

    const res = await fetch(`https://newsapi.org/v2/everything?${params}`);
    const text = await res.text();

    if (!res.ok) {
      let errorMsg = text;
      try {
        const parsed = JSON.parse(text);
        errorMsg = parsed.message || text;
      } catch {}
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: res.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(text, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
