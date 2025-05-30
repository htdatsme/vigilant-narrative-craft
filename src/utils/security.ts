
import { supabase } from '@/integrations/supabase/client';

export interface PHIField {
  field: string;
  value: any;
  isEncrypted: boolean;
  classification: 'PII' | 'PHI' | 'SENSITIVE' | 'PUBLIC';
}

export const PHI_PATTERNS = {
  SSN: /\b\d{3}-?\d{2}-?\d{4}\b/g,
  PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  DATE_OF_BIRTH: /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g,
  MEDICAL_RECORD: /\b(MR|MRN|MEDICAL[\s\-]?RECORD)[\s\-]?#?[\s\-]?(\d{6,})\b/gi,
  HEALTH_CARD: /\b(HC|HEALTH[\s\-]?CARD)[\s\-]?#?[\s\-]?(\d{8,})\b/gi
};

export const detectPHI = (text: string): PHIField[] => {
  const detectedFields: PHIField[] = [];

  Object.entries(PHI_PATTERNS).forEach(([fieldType, pattern]) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        detectedFields.push({
          field: fieldType,
          value: match,
          isEncrypted: false,
          classification: fieldType === 'EMAIL' ? 'PII' : 'PHI'
        });
      });
    }
  });

  return detectedFields;
};

export const sanitizeForExport = (data: any): any => {
  if (typeof data === 'string') {
    let sanitized = data;
    
    // Replace PHI with redacted versions
    Object.entries(PHI_PATTERNS).forEach(([fieldType, pattern]) => {
      sanitized = sanitized.replace(pattern, `[REDACTED_${fieldType}]`);
    });
    
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForExport);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    Object.entries(data).forEach(([key, value]) => {
      sanitized[key] = sanitizeForExport(value);
    });
    return sanitized;
  }

  return data;
};

export const logComplianceEvent = async (event: {
  action: string;
  documentId?: string;
  phiFields?: PHIField[];
  userId?: string;
  details?: Record<string, any>;
}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase.from('processing_logs').insert({
      document_id: event.documentId || null,
      user_id: event.userId || user?.id || 'system',
      action: `compliance_${event.action}`,
      details: {
        phi_fields_count: event.phiFields?.length || 0,
        phi_classifications: event.phiFields?.map(f => f.classification) || [],
        compliance_timestamp: new Date().toISOString(),
        ...event.details
      }
    });
  } catch (error) {
    console.error('Failed to log compliance event:', error);
  }
};

export const encryptSensitiveData = (data: string, key?: string): string => {
  // Note: In production, use proper encryption libraries like crypto-js
  // This is a simple base64 encoding for demonstration
  return btoa(data);
};

export const decryptSensitiveData = (encryptedData: string, key?: string): string => {
  try {
    return atob(encryptedData);
  } catch {
    return '[DECRYPTION_FAILED]';
  }
};

export const validateDocumentSecurity = async (documentId: string, content: string) => {
  const phiFields = detectPHI(content);
  
  await logComplianceEvent({
    action: 'phi_detection',
    documentId,
    phiFields,
    details: {
      document_scan_timestamp: new Date().toISOString(),
      phi_detected: phiFields.length > 0
    }
  });

  return {
    hasPHI: phiFields.length > 0,
    phiFields,
    riskLevel: phiFields.length > 5 ? 'HIGH' : phiFields.length > 0 ? 'MEDIUM' : 'LOW'
  };
};
