
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
      const progressData = {
        document_id: progress.documentId,
        user_id: 'anonymous', // No authentication required
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

      // Update local cache immediately
      this.progressCache.set(progress.id, {
        id: progress.id,
        documentId: progress.documentId,
        currentStep: progress.currentStep || '',
        totalSteps: progress.totalSteps || 0,
        completedSteps: progress.completedSteps || 0,
        status: progress.status || 'running',
        lastCheckpoint: progress.lastCheckpoint || '',
        metadata: progress.metadata,
        createdAt: progress.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      console.log('Progress saved:', progressData);
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

      // For now, return null if not in cache (no database dependency)
      return null;
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
