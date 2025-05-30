
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProcessingLog {
  id: string;
  document_id?: string;
  user_id: string;
  action: string;
  details?: Record<string, any>;
  timestamp: string;
}

export const useProcessingLogs = (documentId?: string) => {
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Return empty array for now
      setLogs([]);
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

  const createLog = async (log: Omit<ProcessingLog, 'id' | 'user_id' | 'timestamp'>) => {
    try {
      const newLog: ProcessingLog = {
        ...log,
        id: `log_${Date.now()}`,
        user_id: 'anonymous',
        timestamp: new Date().toISOString()
      };
      
      setLogs(prev => [newLog, ...prev]);
      return newLog;
    } catch (error) {
      console.error('Error creating processing log:', error);
      throw error;
    }
  };

  return {
    logs,
    loading,
    createLog,
    refetch: fetchLogs
  };
};
