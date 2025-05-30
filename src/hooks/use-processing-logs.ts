
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type ProcessingLog = Tables<'processing_logs'>;
type ProcessingLogInsert = TablesInsert<'processing_logs'>;

export const useProcessingLogs = (documentId?: string) => {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('processing_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching processing logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch processing logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLog = async (log: Omit<ProcessingLogInsert, 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('processing_logs')
        .insert({ ...log, user_id: 'anonymous' })
        .select()
        .single();

      if (error) throw error;
      
      setLogs(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating processing log:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [documentId]);

  return {
    logs,
    loading,
    createLog,
    refetch: fetchLogs
  };
};
