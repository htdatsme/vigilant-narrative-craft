
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Settings, AlertTriangle } from 'lucide-react';
import { ApiConfiguration } from './ApiConfiguration';
import type { AppView } from '@/pages/Index';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Check if APIs are configured
    const parseurKey = localStorage.getItem('parseur_api_key');
    const parseurTemplate = localStorage.getItem('parseur_template');
    const openaiKey = localStorage.getItem('openai_api_key');
    
    setIsConfigured(!!(parseurKey && parseurTemplate && openaiKey));
  }, []);

  const handleConfigured = () => {
    setIsConfigured(true);
    setShowConfig(false);
  };

  if (showConfig) {
    return <ApiConfiguration onConfigured={handleConfigured} />;
  }

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card className="border-medical-teal/20">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-medical-teal" />
              <div>
                <CardTitle className="text-medical-text">Setup Required</CardTitle>
                <CardDescription>
                  Configure your API credentials to start processing documents
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              You need to configure Parseur AI and OpenAI API credentials before you can process Canada Vigilance reports.
            </p>
            <Button 
              onClick={() => setShowConfig(true)}
              className="bg-medical-blue hover:bg-blue-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure APIs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-semibold text-medical-text mb-2">Welcome to HealthWatch Pro</h2>
        <p className="text-muted-foreground mb-4">
          Process Canada Vigilance adverse event reports with AI-powered extraction and ICSR compliance.
        </p>
        <div className="flex space-x-3">
          <Button onClick={() => onNavigate('processor')} className="bg-medical-blue hover:bg-blue-700">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Document
          </Button>
          <Button variant="outline" onClick={() => onNavigate('narrative')}>
            <FileText className="w-4 h-4 mr-2" />
            Create Case Narrative
          </Button>
          <Button variant="outline" onClick={() => setShowConfig(true)}>
            <Settings className="w-4 h-4 mr-2" />
            API Settings
          </Button>
        </div>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-text">Getting Started</CardTitle>
          <CardDescription>Follow these steps to process your first document</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">1</div>
              <div>
                <h4 className="font-medium text-medical-text">Upload PDF</h4>
                <p className="text-sm text-muted-foreground">Upload Canada Vigilance adverse event reports in PDF format</p>
                <Badge className="mt-2 bg-medical-success text-white">Configured</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">2</div>
              <div>
                <h4 className="font-medium text-medical-text">AI Extraction</h4>
                <p className="text-sm text-muted-foreground">Parseur AI extracts structured data from the PDF documents</p>
                <Badge className="mt-2 bg-medical-success text-white">Ready</Badge>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-medical-blue rounded-full flex items-center justify-center text-white font-medium">3</div>
              <div>
                <h4 className="font-medium text-medical-text">Generate Narratives</h4>
                <p className="text-sm text-muted-foreground">Create E2B R3 compliant case narratives for submission</p>
                <Badge className="mt-2 bg-medical-success text-white">Ready</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-medical-text">Recent Activity</CardTitle>
          <CardDescription>Your document processing activity will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents processed yet</p>
            <p className="text-sm text-muted-foreground mt-2">Upload your first Canada Vigilance report to get started</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
