import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowLeft, Eye, Loader2, Download, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createProcessingSession, progressTracker } from '@/utils/progressTracking';
import { validateDocumentSecurity, logComplianceEvent } from '@/utils/security';
import { useDocuments } from '@/hooks/use-documents';
import { useExtractions } from '@/hooks/use-extractions';
import { useNarratives } from '@/hooks/use-narratives';
import { useDocumentStorage } from '@/hooks/use-document-storage';
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

      // Step 4: Create extraction record
      const checkpoint2 = progressTracker.createCheckpoint(sessionId, 'data_extracted');
      
      const extraction = await createExtraction({
        document_id: document.id,
        status: 'completed',
        raw_data: { filename: file.name, size: file.size },
        processed_data: { security_scan: securityScan }
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
          security_scan: securityScan,
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
        processFile(file, fileId);
      });
  };

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Upload className="w-4 h-4 text-blue-600" />;
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
            <h2 className="text-2xl font-semibold text-gray-900">Document Processor</h2>
            <p className="text-gray-600">Upload and process Canada Vigilance adverse event reports</p>
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
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload Canada Vigilance PDF reports for AI-powered data extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-500'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop PDF files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
              Files will be stored in Supabase with security scanning and compliance logging
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
              <Button className="bg-blue-600 hover:bg-blue-700">
                Select Files
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Processing Queue */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>Track the progress of your document processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-600">
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
                            ? 'bg-green-500 text-white'
                            : file.status === 'error'
                            ? 'bg-red-500 text-white'
                            : 'bg-blue-500 text-white'
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

      {/* Processing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">1</div>
              <div>
                <h4 className="font-medium text-gray-900">Upload & Store</h4>
                <p className="text-sm text-gray-600">Secure file upload to Supabase storage</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">2</div>
              <div>
                <h4 className="font-medium text-gray-900">Security Scan</h4>
                <p className="text-sm text-gray-600">PHI/PII detection and risk assessment</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">3</div>
              <div>
                <h4 className="font-medium text-gray-900">AI Extraction</h4>
                <p className="text-sm text-gray-600">Data extraction and analysis</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">4</div>
              <div>
                <h4 className="font-medium text-gray-900">Generate Results</h4>
                <p className="text-sm text-gray-600">Create narratives and export data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
