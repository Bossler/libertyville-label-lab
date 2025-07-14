import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, request, currentContent, productInfo, labelData } = await req.json();

    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment variables');
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    
    if (type === 'name') {
      const productContext = productInfo ? `for ${productInfo.name} (${productInfo.type}, ${productInfo.grind}, ${productInfo.weight})` : 'for this coffee product';
      systemPrompt = `You are an expert coffee branding specialist. Help improve coffee names ${productContext}. Current name: "${currentContent}". User request: "${request}". IMPORTANT: The coffee name must be 45 characters or less. Provide only the improved name, nothing else.`;
    } else if (type === 'notes') {
      const productContext = productInfo ? `for ${productInfo.name} (${productInfo.type}, ${productInfo.grind}, ${productInfo.weight})` : 'for this coffee product';
      systemPrompt = `You are an expert coffee taster and copywriter. Help improve tasting notes ${productContext}. Current notes: "${currentContent}". User request: "${request}". IMPORTANT: The tasting notes must be 200 characters or less. Provide only the improved tasting notes, nothing else.`;
    } else if (type === 'preview') {
      systemPrompt = `You are a label design expert. Current style: ${currentContent}. User request: "${request}". Respond with ONLY a JSON object like {"fontFamily": "serif", "textColor": "#ffffff"} with improved values.`;
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type specified' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing AI request for type: ${type}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error: ${response.status} - ${errorText}`);
      return new Response(JSON.stringify({ error: `OpenAI API error: ${response.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const suggestion = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');

    console.log(`AI suggestion generated for type: ${type}`);

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-barista function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});