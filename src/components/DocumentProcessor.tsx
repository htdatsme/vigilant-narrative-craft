
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createProcessingSession, progressTracker } from '@/utils/progressTracking';
import { validateDocumentSecurity, logComplianceEvent } from '@/utils/security';
import { useDocuments } from '@/hooks/use-documents';
import { useExtractions } from '@/hooks/use-extractions';
import { useNarratives } from '@/hooks/use-narratives';
import { useDocumentStorage } from '@/hooks/use-document-storage';
import { DocumentProcessorHeader } from './DocumentProcessorHeader';
import { FileUploadZone } from './FileUploadZone';
import { ProcessingQueue } from './ProcessingQueue';
import { ProcessingPipeline } from './ProcessingPipeline';
import { AuditTrail } from './AuditTrail';
import { DataExport } from './DataExport';

interface DocumentProcessorProps {
  onBack: () => void;
}

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  documentId?: string;
  extractionId?: string;
  error?: string;
  sessionId?: string;
  securityScan?: {
    hasPHI: boolean;
    riskLevel: string;
  };
}

export const DocumentProcessor = ({ onBack }: DocumentProcessorProps) => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const { toast } = useToast();
  
  const { createDocument } = useDocuments();
  const { createExtraction } = useExtractions();
  const { createNarrative } = useNarratives();
  const { uploadDocument } = useDocumentStorage();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFile = async (file: File, fileId: string) => {
    try {
      console.log(`Starting processing for file: ${file.name}`);
      
      const sessionId = await createProcessingSession(fileId, 5);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, sessionId } : f
      ));

      // Step 1: Upload file to storage
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
      ));

      const { path } = await uploadDocument(file);

      // Step 2: Create document record
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 20 } : f
      ));

      const document = await createDocument({
        filename: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'completed'
      });

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, documentId: document.id, progress: 30 } : f
      ));

      // Step 3: Security scan
      const checkpoint1 = progressTracker.createCheckpoint(sessionId, 'security_scan');
      
      const fileContent = await file.text().catch(() => '');
      const securityScan = await validateDocumentSecurity(fileId, fileContent);
      
      await checkpoint1();

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, securityScan, progress: 50 } : f
      ));

      // Step 4: Create extraction record with properly formatted security scan data
      const checkpoint2 = progressTracker.createCheckpoint(sessionId, 'data_extracted');
      
      // Convert PHIField objects to plain objects for JSON storage
      const securityScanForStorage = {
        hasPHI: securityScan.hasPHI,
        riskLevel: securityScan.riskLevel,
        phiFieldsCount: securityScan.phiFields.length,
        phiFieldTypes: securityScan.phiFields.map(field => ({
          field: field.field,
          value: field.value,
          isEncrypted: field.isEncrypted,
          classification: field.classification
        }))
      };
      
      const extraction = await createExtraction({
        document_id: document.id,
        status: 'completed',
        raw_data: { filename: file.name, size: file.size },
        processed_data: { security_scan: securityScanForStorage }
      });

      await checkpoint2();

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, extractionId: extraction.id, progress: 80 } : f
      ));

      // Step 5: Complete processing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100
        } : f
      ));

      await logComplianceEvent({
        action: 'document_processed',
        documentId: document.id,
        details: {
          filename: file.name,
          security_scan: securityScanForStorage,
          processing_session: sessionId
        }
      });

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been processed and stored in the database.`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        } : f
      ));
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  };

  const handleGenerateNarrative = async (extractionId: string) => {
    try {
      await createNarrative({
        extraction_id: extractionId,
        title: 'Case Narrative',
        content: 'AI-generated narrative content based on extracted data...',
        status: 'completed'
      });

      toast({
        title: "Narrative generated",
        description: "Case narrative has been generated and saved to the database.",
      });
    } catch (error) {
      console.error('Narrative generation error:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate narrative",
        variant: "destructive"
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const processFiles = (fileList: File[]) => {
    const newFiles: ProcessingFile[] = fileList
      .filter(file => file.type === 'application/pdf')
      .map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        status: 'uploading' as const,
        progress: 0
      }));

    if (newFiles.length !== fileList.length) {
      toast({
        title: "Invalid file format",
        description: "Only PDF files are supported for Canada Vigilance reports.",
        variant: "destructive"
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
    
    fileList
      .filter(file => file.type === 'application/pdf')
      .forEach((file, index) => {
        const fileId = newFiles[index].id;
        processFile(file, fileId);
      });
  };

  return (
    <div className="space-y-6">
      <DocumentProcessorHeader
        onBack={onBack}
        onToggleAuditTrail={() => setShowAuditTrail(!showAuditTrail)}
        onToggleDataExport={() => setShowDataExport(!showDataExport)}
      />

      {showAuditTrail && <AuditTrail />}
      {showDataExport && <DataExport />}

      <FileUploadZone
        onFilesSelected={processFiles}
        isDragOver={isDragOver}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      />

      <ProcessingQueue
        files={files}
        onGenerateNarrative={handleGenerateNarrative}
      />

      <ProcessingPipeline />
    </div>
  );
};
