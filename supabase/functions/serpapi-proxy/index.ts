const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { apiKey, query } = await req.json();

    if (!apiKey || !query) {
      return new Response(JSON.stringify({ error: 'apiKey and query are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      engine: 'google_news',
      q: query,
      api_key: apiKey,
      gl: 'us',
      hl: 'en',
    });

    const res = await fetch(`https://serpapi.com/search?${params}`);
    const text = await res.text();

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `SerpAPI: ${res.status} ${res.statusText}` }), {
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
