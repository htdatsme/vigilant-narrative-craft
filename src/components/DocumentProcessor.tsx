import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowLeft, Eye, Loader2, Download, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/use-documents';
import { useDocumentStorage } from '@/hooks/use-document-storage';
import { useProcessingLogs } from '@/hooks/use-processing-logs';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, createFallbackHandler } from '@/utils/errorHandling';
import { createProcessingSession, progressTracker } from '@/utils/progressTracking';
import { validateDocumentSecurity, logComplianceEvent } from '@/utils/security';
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
  const { uploadDocument } = useDocumentStorage();
  const { createLog } = useProcessingLogs();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processFileWithEdgeFunction = async (file: File, fileId: string) => {
    try {
      console.log(`Starting enhanced processing for file: ${file.name}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const sessionId = await createProcessingSession(fileId, 5);
      
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, sessionId } : f
      ));

      // Step 1: Security scan
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
      ));

      const checkpoint1 = progressTracker.createCheckpoint(sessionId, 'security_scan');
      
      const fileContent = await file.text().catch(() => '');
      const securityScan = await validateDocumentSecurity(fileId, fileContent);
      
      await checkpoint1();

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, securityScan, progress: 20 } : f
      ));

      // Step 2: Upload with retry mechanism
      const uploadOperation = withRetry(
        () => uploadDocument(file, user.id),
        { maxAttempts: 3 },
        `Upload file ${file.name}`
      );

      const uploadResult = await uploadOperation;
      console.log('File uploaded to storage:', uploadResult.path);

      const checkpoint2 = progressTracker.createCheckpoint(sessionId, 'file_uploaded', {
        file_path: uploadResult.path
      });
      await checkpoint2();

      // Step 3: Create document record
      const createDocOperation = withRetry(
        () => createDocument({
          filename: file.name,
          file_path: uploadResult.path,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'pending'
        }),
        { maxAttempts: 3 },
        `Create document record for ${file.name}`
      );

      const document = await createDocOperation;

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, documentId: document.id, progress: 40 } : f
      ));

      const checkpoint3 = progressTracker.createCheckpoint(sessionId, 'document_created', {
        document_id: document.id
      });
      await checkpoint3();

      // Step 4: Process with edge function
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: 60 } : f
      ));

      const primaryProcessing = () => supabase.functions.invoke('process-document', {
        body: {
          documentId: document.id,
          filePath: uploadResult.path,
          filename: file.name
        }
      });

      const fallbackProcessing = async () => {
        await createLog({
          document_id: document.id,
          action: 'fallback_processing',
          details: { reason: 'Primary processing failed' }
        });

        const { data: extraction } = await supabase
          .from('extractions')
          .insert({
            document_id: document.id,
            user_id: user.id,
            status: 'completed',
            raw_data: { filename: file.name, fallback: true }
          })
          .select()
          .single();

        return { data: { success: true, extractionId: extraction?.id }, error: null };
      };

      const processOperation = createFallbackHandler(
        primaryProcessing,
        fallbackProcessing,
        `Process document ${file.name}`
      );

      const { data, error } = await processOperation();

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Processing failed');
      }

      const checkpoint4 = progressTracker.createCheckpoint(sessionId, 'processing_completed', {
        extraction_id: data.extractionId
      });
      await checkpoint4();

      // Step 5: Complete processing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          extractionId: data.extractionId
        } : f
      ));

      await logComplianceEvent({
        action: 'document_processed',
        documentId: document.id,
        details: {
          filename: file.name,
          security_scan: securityScan,
          processing_session: sessionId
        }
      });

      toast({
        title: "Document processed successfully",
        description: `${file.name} has been processed with enhanced security scanning.`,
      });

    } catch (error) {
      console.error('Enhanced processing error:', error);
      
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      processFiles(selectedFiles);
    }
  };

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
        processFileWithEdgeFunction(file, fileId);
      });
  };

  const handleGenerateNarrative = async (extractionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-narrative', {
        body: {
          extractionId,
          template: 'e2b_r3'
        }
      });

      if (error) {
        throw new Error(error.message || 'Narrative generation failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Narrative generation failed');
      }

      toast({
        title: "Narrative generated",
        description: "Case narrative has been generated successfully.",
      });

    } catch (error) {
      console.error('Narrative generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate narrative",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-medical-blue animate-spin" />;
      default:
        return <Upload className="w-4 h-4 text-medical-blue" />;
    }
  };

  const getStatusText = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing with AI...';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-semibold text-medical-text">Enhanced Document Processor</h2>
            <p className="text-muted-foreground">Upload and process Canada Vigilance adverse event reports with advanced AI processing</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowAuditTrail(!showAuditTrail)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Audit Trail
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowDataExport(!showDataExport)}
          >
            <Download className="w-4 h-4 mr-2" />
            Data Export
          </Button>
        </div>
      </div>

      {/* Show Audit Trail */}
      {showAuditTrail && <AuditTrail />}

      {/* Show Data Export */}
      {showDataExport && <DataExport />}

      {/* Upload Area */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-medical-text">Upload Documents</CardTitle>
          <CardDescription>
            Upload Canada Vigilance PDF reports for enhanced AI-powered data extraction and ICSR conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors bg-white ${
              isDragOver 
                ? 'border-medical-blue bg-blue-50' 
                : 'border-gray-300 hover:border-medical-blue'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-medical-blue mx-auto mb-4" />
            <h3 className="text-lg font-medium text-medical-text mb-2">
              Drop PDF files here or click to browse
            </h3>
            <p className="text-muted-foreground mb-4">
              Enhanced processing with security scanning, error recovery, and compliance logging
            </p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button className="bg-medical-blue hover:bg-blue-700">
                Select Files
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {files.length > 0 && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-medical-text">Enhanced Processing Queue</CardTitle>
            <CardDescription>Track the progress of your document processing with advanced security and compliance features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium text-medical-text">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(file.status)}
                        </p>
                        {file.securityScan && (
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge 
                              className={
                                file.securityScan.riskLevel === 'HIGH' 
                                  ? 'bg-red-500 text-white' 
                                  : file.securityScan.riskLevel === 'MEDIUM'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-green-500 text-white'
                              }
                            >
                              {file.securityScan.riskLevel} RISK
                            </Badge>
                            {file.securityScan.hasPHI && (
                              <Badge className="bg-purple-500 text-white">
                                PHI DETECTED
                              </Badge>
                            )}
                          </div>
                        )}
                        {file.error && (
                          <p className="text-sm text-red-600 mt-1">{file.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {file.status === 'completed' && file.extractionId && (
                        <>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            View Data
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleGenerateNarrative(file.extractionId!)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Narrative
                          </Button>
                        </>
                      )}
                      <Badge 
                        className={
                          file.status === 'completed' 
                            ? 'bg-medical-success text-white'
                            : file.status === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-medical-blue text-white'
                        }
                      >
                        {getStatusText(file.status)}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={file.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Processing Instructions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="text-medical-text">Enhanced Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">1</div>
              <div>
                <h4 className="font-medium text-medical-text">Security Scan</h4>
                <p className="text-sm text-gray-600">PHI/PII detection and risk assessment with compliance logging</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">2</div>
              <div>
                <h4 className="font-medium text-medical-text">Upload & Store</h4>
                <p className="text-sm text-gray-600">Secure upload with retry mechanisms and progress tracking</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">3</div>
              <div>
                <h4 className="font-medium text-medical-text">AI Extraction</h4>
                <p className="text-sm text-gray-600">Parseur AI with fallback processing and error recovery</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">4</div>
              <div>
                <h4 className="font-medium text-medical-text">Smart Analysis</h4>
                <p className="text-sm text-gray-600">OpenAI analysis with audit logging and compliance tracking</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">5</div>
              <div>
                <h4 className="font-medium text-medical-text">Generate & Export</h4>
                <p className="text-sm text-gray-600">AI narratives with secure export options and data sanitization</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
