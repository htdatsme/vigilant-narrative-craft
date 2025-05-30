
import { supabase } from '@/integrations/supabase/client';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context?: string
): Promise<T> => {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Log the error attempt
      await logError({
        error: lastError,
        attempt,
        maxAttempts: finalConfig.maxAttempts,
        context: context || 'Unknown operation'
      });

      if (attempt === finalConfig.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
        finalConfig.maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }

  throw lastError!;
};

export interface ErrorLogEntry {
  error: Error;
  attempt: number;
  maxAttempts: number;
  context: string;
  timestamp?: string;
  userId?: string;
}

export const logError = async (entry: ErrorLogEntry) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('processing_logs').insert({
      user_id: user?.id || 'anonymous',
      action: 'error_occurred',
      details: {
        error_message: entry.error.message,
        error_stack: entry.error.stack,
        attempt: entry.attempt,
        max_attempts: entry.maxAttempts,
        context: entry.context,
        timestamp: entry.timestamp || new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error('Failed to log error:', logError);
    console.error('Original error:', entry.error);
  }
};

export const createFallbackHandler = <T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  context: string
) => {
  return async (): Promise<T> => {
    try {
      return await primaryOperation();
    } catch (primaryError) {
      console.warn(`Primary operation failed for ${context}, trying fallback:`, primaryError);
      
      await logError({
        error: primaryError as Error,
        attempt: 1,
        maxAttempts: 1,
        context: `${context} - Primary operation failed, using fallback`
      });

      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        await logError({
          error: fallbackError as Error,
          attempt: 1,
          maxAttempts: 1,
          context: `${context} - Fallback operation also failed`
        });
        throw fallbackError;
      }
    }
  };
};

export const isRetryableError = (error: Error): boolean => {
  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /rate limit/i,
    /temporary/i,
    /502/,
    /503/,
    /504/
  ];

  return retryablePatterns.some(pattern => 
    pattern.test(error.message) || pattern.test(error.name)
  );
};
