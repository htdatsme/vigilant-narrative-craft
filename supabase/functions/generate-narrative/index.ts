
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateNarrativeRequest {
  extractionId: string;
  template?: string;
  customInstructions?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { extractionId, template, customInstructions }: GenerateNarrativeRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Generating narrative for extraction: ${extractionId}`);

    // Get extraction data
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .select('*, documents(*)')
      .eq('id', extractionId)
      .single();

    if (extractionError || !extraction) {
      throw new Error('Extraction not found');
    }

    // Prepare narrative generation prompt
    const basePrompt = `You are a medical writer specializing in ICSR (Individual Case Safety Report) narratives for regulatory submissions. Generate a professional case narrative based on the provided adverse event data.

The narrative should follow E2B R3 standards and include:
1. Patient demographics and medical history
2. Suspect medication details (dose, indication, dates)
3. Adverse event description and timeline
4. Concomitant medications
5. Relevant laboratory values
6. Clinical outcome and follow-up

Use clear, concise medical language appropriate for regulatory authorities.`;

    const dataContext = extraction.processed_data || extraction.raw_data;
    const promptContent = customInstructions 
      ? `${basePrompt}\n\nSpecial Instructions: ${customInstructions}\n\nData to analyze: ${JSON.stringify(dataContext)}`
      : `${basePrompt}\n\nData to analyze: ${JSON.stringify(dataContext)}`;

    // Generate narrative with OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: basePrompt
          },
          {
            role: 'user',
            content: promptContent
          }
        ],
        temperature: 0.2,
        max_tokens: 1500
      })
    });

    if (!openaiResponse.ok) {
      throw new Error('Failed to generate narrative with OpenAI');
    }

    const openaiResult = await openaiResponse.json();
    const narrativeContent = openaiResult.choices[0].message.content;

    // Create narrative record
    const { data: narrative, error: narrativeError } = await supabase
      .from('narratives')
      .insert({
        extraction_id: extractionId,
        title: `Case Narrative - ${extraction.documents?.filename || 'Unknown'}`,
        content: narrativeContent,
        template_used: template || 'default',
        status: 'draft'
      })
      .select()
      .single();

    if (narrativeError) {
      throw new Error(`Failed to create narrative: ${narrativeError.message}`);
    }

    // Log the generation
    await supabase.from('processing_logs').insert({
      document_id: extraction.document_id,
      action: 'narrative_generated',
      details: { 
        narrativeId: narrative.id,
        template: template || 'default',
        tokensUsed: openaiResult.usage?.total_tokens
      }
    });

    return new Response(JSON.stringify({
      success: true,
      narrative,
      message: 'Narrative generated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Narrative generation error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
