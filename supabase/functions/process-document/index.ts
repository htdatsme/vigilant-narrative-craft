
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProcessDocumentRequest {
  documentId: string;
  filePath: string;
  filename: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, filePath, filename }: ProcessDocumentRequest = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const parseurApiKey = Deno.env.get('PARSEUR_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting document processing for: ${filename}`);

    // Create processing log
    await supabase.from('processing_logs').insert({
      document_id: documentId,
      action: 'processing_started',
      details: { filename, filePath }
    });

    // Update document status
    await supabase.from('documents').update({
      upload_status: 'processing'
    }).eq('id', documentId);

    let extractedData = null;
    let analysisResult = null;

    // Step 1: Extract with Parseur (if configured)
    if (parseurApiKey) {
      console.log('Processing with Parseur AI...');
      
      try {
        // Download file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(filePath);

        if (downloadError) {
          throw new Error(`Failed to download file: ${downloadError.message}`);
        }

        // Convert to FormData for Parseur AI
        const formData = new FormData();
        formData.append('file', fileData, filename);

        // Use Parseur's AI endpoint for automatic extraction
        const parseurResponse = await fetch('https://api.parseur.com/parser/ai/extract', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${parseurApiKey}`,
          },
          body: formData
        });

        if (parseurResponse.ok) {
          extractedData = await parseurResponse.json();
          console.log('Parseur AI extraction completed');
          
          await supabase.from('processing_logs').insert({
            document_id: documentId,
            action: 'parseur_extraction_completed',
            details: { extractedFields: Object.keys(extractedData || {}).length }
          });
        } else {
          const errorText = await parseurResponse.text();
          console.error('Parseur extraction failed:', errorText);
          await supabase.from('processing_logs').insert({
            document_id: documentId,
            action: 'parseur_extraction_failed',
            details: { error: `Parseur API error: ${errorText}` }
          });
        }
      } catch (error) {
        console.error('Parseur processing error:', error);
        await supabase.from('processing_logs').insert({
          document_id: documentId,
          action: 'parseur_extraction_failed',
          details: { error: error.message }
        });
      }
    }

    // Step 2: Analyze with OpenAI (if configured and data was extracted)
    if (openaiApiKey && extractedData) {
      console.log('Analyzing with OpenAI...');
      
      try {
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
                content: 'You are a medical data analyst specializing in adverse event reports. Analyze the extracted data and structure it according to E2B R3 format for ICSR submissions. Focus on identifying patient information, adverse events, suspect medications, and relevant medical history.'
              },
              {
                role: 'user',
                content: `Please analyze this Canada Vigilance adverse event data and structure it for E2B R3 format: ${JSON.stringify(extractedData)}`
              }
            ],
            temperature: 0.1,
            max_tokens: 2000
          })
        });

        if (openaiResponse.ok) {
          const openaiResult = await openaiResponse.json();
          analysisResult = openaiResult.choices[0].message.content;
          console.log('OpenAI analysis completed');
          
          await supabase.from('processing_logs').insert({
            document_id: documentId,
            action: 'openai_analysis_completed',
            details: { tokensUsed: openaiResult.usage?.total_tokens }
          });
        } else {
          const errorText = await openaiResponse.text();
          console.error('OpenAI analysis failed:', errorText);
          await supabase.from('processing_logs').insert({
            document_id: documentId,
            action: 'openai_analysis_failed',
            details: { error: `OpenAI API error: ${errorText}` }
          });
        }
      } catch (error) {
        console.error('OpenAI processing error:', error);
        await supabase.from('processing_logs').insert({
          document_id: documentId,
          action: 'openai_analysis_failed',
          details: { error: error.message }
        });
      }
    }

    // Create extraction record
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .insert({
        document_id: documentId,
        raw_data: extractedData,
        processed_data: analysisResult ? { analysis: analysisResult } : null,
        status: 'completed'
      })
      .select()
      .single();

    if (extractionError) {
      throw new Error(`Failed to create extraction: ${extractionError.message}`);
    }

    // Update document status
    await supabase.from('documents').update({
      upload_status: 'completed'
    }).eq('id', documentId);

    // Final processing log
    await supabase.from('processing_logs').insert({
      document_id: documentId,
      action: 'processing_completed',
      details: { 
        extractionId: extraction.id,
        hasRawData: !!extractedData,
        hasAnalysis: !!analysisResult
      }
    });

    return new Response(JSON.stringify({
      success: true,
      extractionId: extraction.id,
      message: 'Document processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Document processing error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
