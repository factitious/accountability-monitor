import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Strip HTML tags and collapse whitespace to get plain text
function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000); // Gemini context limit safety
}

async function fetchArticleText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; AccountabilityFeed/1.0)',
      'Accept': 'text/html',
    },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Failed to fetch article: ${res.status}`);
  const html = await res.text();
  return extractText(html);
}

async function callGemini(apiKey: string, articleText: string, title: string): Promise<{
  summary: string;
  perpetrator_name: string | null;
  perpetrator_role: string | null;
  institution_name: string | null;
  location: string | null;
}> {
  const prompt = `You are an assistant that extracts structured information from news articles about sexual abuse accusations.

Article title: ${title}

Article text:
${articleText}

Extract the following and respond with ONLY valid JSON, no markdown:
{
  "summary": "A 2-3 sentence factual summary of the accusation, naming the accused, their role, the institution, and the nature of the allegations.",
  "perpetrator_name": "Full name of the accused person, or null if not found",
  "perpetrator_role": "Their professional role (e.g. 'high school teacher', 'Catholic priest'), or null",
  "institution_name": "Name of the school, hospital, church, or organization involved, or null",
  "location": "City and state where this occurred (e.g. 'Austin, Texas'), or null"
}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    }
  );

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, title } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not set' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch article text
    let articleText: string;
    try {
      articleText = await fetchArticleText(url);
    } catch (err) {
      // Fall back to just using the title if the article can't be fetched (paywall etc.)
      console.warn('Could not fetch article, falling back to title only:', err);
      articleText = `[Full article unavailable] ${title}`;
    }

    // Call Gemini
    const enriched = await callGemini(geminiKey, articleText, title ?? '');

    // Save back to DB
    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await db
      .from('incidents')
      .update({
        summary: enriched.summary,
        location: enriched.location,
        perpetrator_name: enriched.perpetrator_name,
        perpetrator_role: enriched.perpetrator_role,
        institution_name: enriched.institution_name,
        ai_enriched: true,
      })
      .eq('url', url);

    if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

    return new Response(JSON.stringify(enriched), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error('summarise-incident failed:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
