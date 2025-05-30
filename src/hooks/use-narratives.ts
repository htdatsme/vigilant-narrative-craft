
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Narrative = Tables<'narratives'>;
type NarrativeInsert = TablesInsert<'narratives'>;
type NarrativeUpdate = TablesUpdate<'narratives'>;

export const useNarratives = (extractionId?: string) => {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNarratives = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('narratives')
        .select('*')
        .order('created_at', { ascending: false });

      if (extractionId) {
        query = query.eq('extraction_id', extractionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNarratives(data || []);
    } catch (error) {
      console.error('Error fetching narratives:', error);
      toast({
        title: "Error",
        description: "Failed to fetch narratives",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNarrative = async (narrative: Omit<NarrativeInsert, 'user_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('narratives')
        .insert({ ...narrative, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      
      setNarratives(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Narrative created successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating narrative:', error);
      toast({
        title: "Error",
        description: "Failed to create narrative",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateNarrative = async (id: string, updates: NarrativeUpdate) => {
    try {
      const { data, error } = await supabase
        .from('narratives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setNarratives(prev => prev.map(nar => nar.id === id ? data : nar));
      toast({
        title: "Success",
        description: "Narrative updated successfully"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating narrative:', error);
      toast({
        title: "Error",
        description: "Failed to update narrative",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteNarrative = async (id: string) => {
    try {
      const { error } = await supabase
        .from('narratives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setNarratives(prev => prev.filter(nar => nar.id !== id));
      toast({
        title: "Success",
        description: "Narrative deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting narrative:', error);
      toast({
        title: "Error",
        description: "Failed to delete narrative",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchNarratives();
  }, [extractionId]);

  return {
    narratives,
    loading,
    createNarrative,
    updateNarrative,
    deleteNarrative,
    refetch: fetchNarratives
  };
};
