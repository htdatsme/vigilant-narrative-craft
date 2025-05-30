
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Download } from 'lucide-react';

interface DocumentProcessorHeaderProps {
  onBack: () => void;
  onToggleAuditTrail: () => void;
  onToggleDataExport: () => void;
}

export const DocumentProcessorHeader = ({
  onBack,
  onToggleAuditTrail,
  onToggleDataExport
}: DocumentProcessorHeaderProps) => {
  return (
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
        <Button variant="outline" onClick={onToggleAuditTrail}>
          <Shield className="w-4 h-4 mr-2" />
          Audit Trail
        </Button>
        <Button variant="outline" onClick={onToggleDataExport}>
          <Download className="w-4 h-4 mr-2" />
          Data Export
        </Button>
      </div>
    </div>
  );
};
