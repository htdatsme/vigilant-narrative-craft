
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/use-documents';
import { useDocumentStorage } from '@/hooks/use-document-storage';
import { useProcessingLogs } from '@/hooks/use-processing-logs';
import { supabase } from '@/integrations/supabase/client';

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
}

export const DocumentProcessor = ({ onBack }: DocumentProcessorProps) => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
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
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Step 1: Upload file to storage
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 20 } : f
      ));

      const uploadResult = await uploadDocument(file, user.id);
      console.log('File uploaded to storage:', uploadResult.path);

      // Step 2: Create document record
      const document = await createDocument({
        filename: file.name,
        file_path: uploadResult.path,
        file_size: file.size,
        mime_type: file.type,
        upload_status: 'pending'
      });

      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, documentId: document.id, progress: 40 } : f
      ));

      // Step 3: Process with edge function
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 60 } : f
      ));

      const { data, error } = await supabase.functions.invoke('process-document', {
        body: {
          documentId: document.id,
          filePath: uploadResult.path,
          filename: file.name
        }
      });

      if (error) {
        throw new Error(error.message || 'Processing failed');
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      // Step 4: Complete processing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          extractionId: data.extractionId
        } : f
      ));

      toast({
        title: "Document processed successfully",
        description: "PDF extraction and analysis completed using enhanced AI processing.",
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
    
    // Process each file with enhanced edge function processing
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
              Enhanced processing with Supabase Edge Functions, Parseur AI, and OpenAI integration
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
            <CardDescription>Track the progress of your document processing with advanced AI capabilities</CardDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">1</div>
              <div>
                <h4 className="font-medium text-medical-text">Upload & Store</h4>
                <p className="text-sm text-gray-600">Secure upload to Supabase Storage with metadata tracking</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">2</div>
              <div>
                <h4 className="font-medium text-medical-text">AI Extraction</h4>
                <p className="text-sm text-gray-600">Parseur AI extracts structured data from PDF documents</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">3</div>
              <div>
                <h4 className="font-medium text-medical-text">Smart Analysis</h4>
                <p className="text-sm text-gray-600">OpenAI analyzes and structures data for E2B R3 compliance</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">4</div>
              <div>
                <h4 className="font-medium text-medical-text">Generate Narratives</h4>
                <p className="text-sm text-gray-600">AI-powered case narrative generation for regulatory submission</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
