
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Extraction = Tables<'extractions'>;
type ExtractionInsert = TablesInsert<'extractions'>;
type ExtractionUpdate = TablesUpdate<'extractions'>;

export const useExtractions = (documentId?: string) => {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExtractions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('extractions')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExtractions(data || []);
    } catch (error) {
      console.error('Error fetching extractions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch extractions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createExtraction = async (extraction: Omit<ExtractionInsert, 'user_id'>) => {
    try {
      // Use anonymous user ID for demo purposes
      const { data, error } = await supabase
        .from('extractions')
        .insert({ ...extraction, user_id: 'anonymous' })
        .select()
        .single();

      if (error) throw error;
      
      setExtractions(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Extraction created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating extraction:', error);
      toast({
        title: "Error",
        description: "Failed to create extraction",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateExtraction = async (id: string, updates: ExtractionUpdate) => {
    try {
      const { data, error } = await supabase
        .from('extractions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setExtractions(prev => prev.map(ext => ext.id === id ? data : ext));
      return data;
    } catch (error) {
      console.error('Error updating extraction:', error);
      toast({
        title: "Error",
        description: "Failed to update extraction",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchExtractions();
  }, [documentId]);

  return {
    extractions,
    loading,
    createExtraction,
    updateExtraction,
    refetch: fetchExtractions
  };
};
