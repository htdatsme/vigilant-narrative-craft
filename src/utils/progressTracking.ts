
import { supabase } from '@/integrations/supabase/client';

export interface ProcessingProgress {
  id: string;
  documentId: string;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
  lastCheckpoint: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class ProgressTracker {
  private progressCache: Map<string, ProcessingProgress> = new Map();

  async saveProgress(progress: Partial<ProcessingProgress> & { id: string; documentId: string }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const progressData = {
        document_id: progress.documentId,
        user_id: user.id,
        action: 'progress_update',
        details: {
          id: progress.id,
          current_step: progress.currentStep,
          total_steps: progress.totalSteps,
          completed_steps: progress.completedSteps,
          status: progress.status,
          last_checkpoint: progress.lastCheckpoint,
          metadata: progress.metadata
        }
      };

      await supabase.from('processing_logs').insert(progressData);
      
      // Update local cache
      this.progressCache.set(progress.id, {
        ...progress,
        createdAt: progress.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ProcessingProgress);

    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  }

  async loadProgress(progressId: string): Promise<ProcessingProgress | null> {
    try {
      // Check cache first
      if (this.progressCache.has(progressId)) {
        return this.progressCache.get(progressId)!;
      }

      // Query database
      const { data, error } = await supabase
        .from('processing_logs')
        .select('*')
        .eq('action', 'progress_update')
        .eq('details->id', progressId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data || !data.details) return null;

      // Safely extract details with proper type checking
      const rawDetails = data.details;
      
      // Basic type checking to ensure we have the required fields
      if (typeof rawDetails !== 'object' || rawDetails === null ||
          typeof rawDetails.id !== 'string' ||
          typeof rawDetails.current_step !== 'string' ||
          typeof rawDetails.total_steps !== 'number' ||
          typeof rawDetails.completed_steps !== 'number' ||
          typeof rawDetails.status !== 'string' ||
          typeof rawDetails.last_checkpoint !== 'string') {
        console.error('Invalid progress details format:', rawDetails);
        return null;
      }

      const progress: ProcessingProgress = {
        id: rawDetails.id,
        documentId: data.document_id!,
        currentStep: rawDetails.current_step,
        totalSteps: rawDetails.total_steps,
        completedSteps: rawDetails.completed_steps,
        status: rawDetails.status as ProcessingProgress['status'],
        lastCheckpoint: rawDetails.last_checkpoint,
        metadata: rawDetails.metadata as Record<string, any>,
        createdAt: data.timestamp,
        updatedAt: data.timestamp
      };

      this.progressCache.set(progressId, progress);
      return progress;

    } catch (error) {
      console.error('Failed to load progress:', error);
      return null;
    }
  }

  async resumeProcessing(progressId: string): Promise<boolean> {
    const progress = await this.loadProgress(progressId);
    if (!progress || progress.status === 'completed') {
      return false;
    }

    console.log(`Resuming processing from checkpoint: ${progress.lastCheckpoint}`);
    
    // Update status to running
    await this.saveProgress({
      ...progress,
      status: 'running',
      updatedAt: new Date().toISOString()
    });

    return true;
  }

  createCheckpoint(progressId: string, stepName: string, metadata?: Record<string, any>) {
    return async () => {
      const progress = await this.loadProgress(progressId);
      if (progress) {
        await this.saveProgress({
          ...progress,
          currentStep: stepName,
          completedSteps: progress.completedSteps + 1,
          lastCheckpoint: stepName,
          metadata: { ...progress.metadata, ...metadata }
        });
      }
    };
  }
}

export const progressTracker = new ProgressTracker();

export const createProcessingSession = async (documentId: string, totalSteps: number) => {
  const sessionId = `processing_${documentId}_${Date.now()}`;
  
  await progressTracker.saveProgress({
    id: sessionId,
    documentId,
    currentStep: 'initialized',
    totalSteps,
    completedSteps: 0,
    status: 'running',
    lastCheckpoint: 'initialized',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  return sessionId;
};
