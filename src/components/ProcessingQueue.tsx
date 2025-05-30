
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Upload, Loader2, FileText, Eye } from 'lucide-react';

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

interface ProcessingQueueProps {
  files: ProcessingFile[];
  onGenerateNarrative: (extractionId: string) => void;
}

export const ProcessingQueue = ({ files, onGenerateNarrative }: ProcessingQueueProps) => {
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

  if (files.length === 0) {
    return null;
  }

  return (
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
                        onClick={() => onGenerateNarrative(file.extractionId!)}
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
  );
};
