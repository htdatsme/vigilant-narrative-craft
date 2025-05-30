
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Settings, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { AppView } from '@/pages/Index';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-wrap gap-4">
        <Button 
          onClick={() => onNavigate('processor')} 
          className="flex items-center space-x-2 bg-medical-blue hover:bg-blue-700 text-white"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Document</span>
        </Button>
        <Button 
          onClick={() => onNavigate('narrative')} 
          className="flex items-center space-x-2 bg-medical-warning hover:bg-teal-600 text-white"
        >
          <FileText className="w-4 h-4" />
          <span>Create Case Narrative</span>
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center space-x-2 border-medical-gray hover:bg-medical-gray"
        >
          <Settings className="w-4 h-4" />
          <span>API Settings</span>
        </Button>
      </div>

      {/* Getting Started Section */}
      <Card className="bg-white border-medical-gray">
        <CardHeader className="bg-medical-background border-b border-medical-gray">
          <CardTitle className="text-medical-blue">Getting Started</CardTitle>
          <CardDescription className="text-medical-text">
            Follow these steps to process your first document
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <h3 className="font-semibold text-medical-blue">Upload PDF</h3>
              </div>
              <p className="text-sm text-medical-text">
                Upload Canada Vigilance adverse event reports in PDF format
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-medical-success text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <h3 className="font-semibold text-medical-blue">AI Extraction</h3>
              </div>
              <p className="text-sm text-medical-text">
                Parseur AI extracts structured data from the PDF documents
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-medical-warning text-white">
                <Clock className="w-3 h-3 mr-1" />
                Ready
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-medical-blue text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <h3 className="font-semibold text-medical-blue">Generate Narratives</h3>
              </div>
              <p className="text-sm text-medical-text">
                Create E2B R3 compliant case narratives for submission
              </p>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-medical-warning text-white">
                <Clock className="w-3 h-3 mr-1" />
                Ready
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Section */}
      <Card className="bg-white border-medical-gray">
        <CardHeader className="bg-medical-background border-b border-medical-gray">
          <CardTitle className="text-medical-blue">Recent Activity</CardTitle>
          <CardDescription className="text-medical-text">
            Your document processing activity will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="p-12 bg-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-medical-gray rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-medical-text" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-medical-text mb-2">No documents processed yet</h3>
              <p className="text-medical-text">
                Upload your first Canada Vigilance report to get started
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
