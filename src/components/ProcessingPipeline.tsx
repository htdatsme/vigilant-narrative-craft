
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ProcessingPipeline = () => {
  return (
    <Card className="bg-white">
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
  );
};
