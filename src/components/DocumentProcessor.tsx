
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentProcessorProps {
  onBack: () => void;
}

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'parsing' | 'analyzing' | 'completed' | 'error';
  progress: number;
  extractedData?: any;
  error?: string;
}

export const DocumentProcessor = ({ onBack }: DocumentProcessorProps) => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const processWithParseur = async (file: File, fileId: string) => {
    const parseurApiKey = localStorage.getItem('parseur_api_key');
    const parseurTemplate = localStorage.getItem('parseur_template');

    if (!parseurApiKey || !parseurTemplate) {
      throw new Error('Parseur API credentials not configured');
    }

    // Update status to parsing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'parsing', progress: 25 } : f
    ));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('template_id', parseurTemplate);

    const response = await fetch('https://api.parseur.com/parser/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${parseurApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload to Parseur');
    }

    const result = await response.json();
    return result;
  };

  const analyzeWithOpenAI = async (extractedData: any, fileId: string) => {
    const openaiApiKey = localStorage.getItem('openai_api_key');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Update status to analyzing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'analyzing', progress: 75 } : f
    ));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a medical data analyst specializing in adverse event reports. Analyze the extracted data and structure it according to E2B R3 format for ICSR submissions.'
          },
          {
            role: 'user',
            content: `Please analyze this Canada Vigilance adverse event data and structure it for E2B R3 format: ${JSON.stringify(extractedData)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze with OpenAI');
    }

    const result = await response.json();
    return result.choices[0].message.content;
  };

  const processFile = async (file: File, fileId: string) => {
    try {
      console.log(`Starting processing for file: ${file.name}`);
      
      // Step 1: Extract with Parseur
      const extractedData = await processWithParseur(file, fileId);
      console.log('Parseur extraction completed:', extractedData);

      // Step 2: Analyze with OpenAI
      const analysis = await analyzeWithOpenAI(extractedData, fileId);
      console.log('OpenAI analysis completed');

      // Step 3: Complete processing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'completed', 
          progress: 100,
          extractedData: { raw: extractedData, analysis }
        } : f
      ));

      toast({
        title: "Document processed successfully",
        description: "PDF extraction and analysis completed.",
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
    
    // Process each file
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
        return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-medical-warning" />;
      case 'parsing':
      case 'analyzing':
        return <Loader2 className="w-4 h-4 text-medical-blue animate-spin" />;
      default:
        return <Upload className="w-4 h-4 text-medical-blue" />;
    }
  };

  const getStatusText = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'parsing': return 'Extracting with Parseur...';
      case 'analyzing': return 'Analyzing with AI...';
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
          <h2 className="text-2xl font-semibold text-medical-text">Document Processor</h2>
          <p className="text-muted-foreground">Upload and process Canada Vigilance adverse event reports</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-text">Upload Documents</CardTitle>
          <CardDescription>
            Upload Canada Vigilance PDF reports for AI-powered data extraction and ICSR conversion
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
              Supports Canada Vigilance adverse event reports in PDF format
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
        <Card>
          <CardHeader>
            <CardTitle className="text-medical-text">Processing Queue</CardTitle>
            <CardDescription>Track the progress of your document processing</CardDescription>
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
                      {file.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Data
                        </Button>
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

      {/* Processing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">1</div>
              <div>
                <h4 className="font-medium text-medical-blue">Upload PDF</h4>
                <p className="text-sm text-gray-600">Upload Canada Vigilance adverse event reports in PDF format</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">2</div>
              <div>
                <h4 className="font-medium text-medical-blue">AI Extraction</h4>
                <p className="text-sm text-gray-600">Parseur AI extracts structured data from the PDF documents</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">3</div>
              <div>
                <h4 className="font-medium text-medical-blue">ICSR Ready</h4>
                <p className="text-sm text-gray-600">Generate E2B R3 compliant case narratives for submission</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
