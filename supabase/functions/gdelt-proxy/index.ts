const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchGdeltWithRetry(url: string) {
  let lastStatus = 500;
  let lastText = 'Unknown GDELT error';

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    const text = await res.text();

    lastStatus = res.status;
    lastText = text;

    if (res.status !== 429) {
      return {
        ok: res.ok,
        status: res.status,
        text,
      };
    }

    if (attempt < 2) {
      await sleep(6000);
    }
  }

  return {
    ok: false,
    status: lastStatus,
    text: lastText,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, startdatetime } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const params = new URLSearchParams({
      query,
      mode: 'artlist',
      maxrecords: '50',
      format: 'json',
      sourcelang: 'English',
      sourcecountry: 'US',
    });

    if (startdatetime) params.set('startdatetime', startdatetime);

    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?${params}`;
    const result = await fetchGdeltWithRetry(gdeltUrl);

    if (!result.ok) {
      if (result.status === 429) {
        return new Response(JSON.stringify({
          articles: [],
          warning: 'GDELT rate limit reached for this refresh.',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: result.text }), {
        status: result.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let data;
    try {
      data = JSON.parse(result.text);
    } catch {
      return new Response(JSON.stringify({ articles: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
