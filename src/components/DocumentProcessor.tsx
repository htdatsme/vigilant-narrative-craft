
import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentProcessorProps {
  onBack: () => void;
}

interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'processing' | 'extracting' | 'completed' | 'error';
  progress: number;
  extractedData?: any;
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

  const simulateProcessing = (fileId: string) => {
    const updateProgress = (progress: number, status: ProcessingFile['status']) => {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress, status } : f
      ));
    };

    // Simulate processing stages
    setTimeout(() => updateProgress(25, 'processing'), 500);
    setTimeout(() => updateProgress(50, 'extracting'), 1500);
    setTimeout(() => updateProgress(75, 'extracting'), 2500);
    setTimeout(() => {
      updateProgress(100, 'completed');
      toast({
        title: "Document processed successfully",
        description: "PDF extraction completed and data validated.",
      });
    }, 3500);
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
    
    newFiles.forEach(file => {
      simulateProcessing(file.id);
    });
  };

  const getStatusIcon = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-medical-warning" />;
      default:
        return <Upload className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusText = (status: ProcessingFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading...';
      case 'processing': return 'Processing PDF...';
      case 'extracting': return 'Extracting data...';
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
          <h2 className="text-2xl font-semibold text-medical-blue">Document Processor</h2>
          <p className="text-gray-600">Upload and process Canada Vigilance adverse event reports</p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload Canada Vigilance PDF reports for AI-powered data extraction and ICSR conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-medical-blue bg-blue-50' 
                : 'border-medical-gray hover:border-medical-blue'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-medical-blue mx-auto mb-4" />
            <h3 className="text-lg font-medium text-medical-blue mb-2">
              Drop PDF files here or click to browse
            </h3>
            <p className="text-gray-600 mb-4">
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
            <CardTitle>Processing Queue</CardTitle>
            <CardDescription>Track the progress of your document processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <div>
                        <p className="font-medium text-medical-blue">{file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(file.status)}
                        </p>
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
                            ? 'bg-medical-warning text-white'
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
