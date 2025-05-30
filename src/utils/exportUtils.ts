
import { Tables } from '@/integrations/supabase/types';

type Document = Tables<'documents'>;
type Extraction = Tables<'extractions'>;
type Narrative = Tables<'narratives'>;
type ProcessingLog = Tables<'processing_logs'>;

export const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle JSON objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Escape quotes in strings
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
};

export const exportToJSON = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, `${filename}.json`, 'application/json');
};

export const exportToXML = (data: any[], filename: string, rootElement = 'data') => {
  const xmlContent = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<${rootElement}>`,
    ...data.map(item => objectToXML(item, 'item')),
    `</${rootElement}>`
  ].join('\n');

  downloadFile(xmlContent, `${filename}.xml`, 'application/xml');
};

const objectToXML = (obj: any, elementName: string): string => {
  const entries = Object.entries(obj);
  if (entries.length === 0) return `<${elementName}></${elementName}>`;
  
  const content = entries.map(([key, value]) => {
    if (value === null || value === undefined) {
      return `<${key}></${key}>`;
    }
    if (typeof value === 'object') {
      return `<${key}>${JSON.stringify(value)}</${key}>`;
    }
    return `<${key}>${escapeXML(String(value))}</${key}>`;
  }).join('');
  
  return `<${elementName}>${content}</${elementName}>`;
};

const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportDocumentsData = async (documents: Document[], extractions: Extraction[], narratives: Narrative[]) => {
  const enrichedData = documents.map(doc => {
    const docExtractions = extractions.filter(ext => ext.document_id === doc.id);
    const docNarratives = narratives.filter(nar => 
      docExtractions.some(ext => ext.id === nar.extraction_id)
    );
    
    return {
      ...doc,
      extractions: docExtractions,
      narratives: docNarratives
    };
  });

  return enrichedData;
};
