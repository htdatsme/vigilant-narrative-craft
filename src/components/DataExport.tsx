
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Database, Shield, AlertTriangle } from 'lucide-react';
import { useDocuments } from '@/hooks/use-documents';
import { useExtractions } from '@/hooks/use-extractions';
import { useNarratives } from '@/hooks/use-narratives';
import { useProcessingLogs } from '@/hooks/use-processing-logs';
import { exportToCSV, exportToJSON, exportToXML, exportDocumentsData } from '@/utils/exportUtils';
import { sanitizeForExport, detectPHI, logComplianceEvent } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

export const DataExport = () => {
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['documents']);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xml'>('json');
  const [includePHI, setIncludePHI] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const { documents } = useDocuments();
  const { extractions } = useExtractions();
  const { narratives } = useNarratives();
  const { logs } = useProcessingLogs();
  const { toast } = useToast();

  const dataTypes = [
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'extractions', label: 'Extractions', icon: Database, count: extractions.length },
    { id: 'narratives', label: 'Narratives', icon: FileText, count: narratives.length },
    { id: 'logs', label: 'Processing Logs', icon: Database, count: logs.length }
  ];

  const handleDataTypeChange = (dataType: string, checked: boolean) => {
    if (checked) {
      setSelectedDataTypes([...selectedDataTypes, dataType]);
    } else {
      setSelectedDataTypes(selectedDataTypes.filter(type => type !== dataType));
    }
  };

  const handleExport = async () => {
    if (selectedDataTypes.length === 0) {
      toast({
        title: "No data selected",
        description: "Please select at least one data type to export.",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      let exportData: any = {};
      let phiDetected = false;

      // Collect selected data
      if (selectedDataTypes.includes('documents')) {
        const enrichedDocuments = await exportDocumentsData(documents, extractions, narratives);
        exportData.documents = enrichedDocuments;
      }

      if (selectedDataTypes.includes('extractions')) {
        exportData.extractions = extractions;
      }

      if (selectedDataTypes.includes('narratives')) {
        exportData.narratives = narratives;
      }

      if (selectedDataTypes.includes('logs')) {
        exportData.processing_logs = logs;
      }

      // Check for PHI in the export data
      const dataString = JSON.stringify(exportData);
      const phiFields = detectPHI(dataString);
      phiDetected = phiFields.length > 0;

      // Log compliance event
      await logComplianceEvent({
        action: 'data_export',
        details: {
          data_types: selectedDataTypes,
          export_format: exportFormat,
          phi_detected: phiDetected,
          phi_included: includePHI,
          record_count: Object.values(exportData).reduce((sum: number, arr: any) => 
            sum + (Array.isArray(arr) ? arr.length : 0), 0
          )
        }
      });

      // Sanitize data if PHI should not be included
      let finalData = exportData;
      if (phiDetected && !includePHI) {
        finalData = sanitizeForExport(exportData);
        toast({
          title: "PHI detected and redacted",
          description: "Sensitive information has been automatically redacted from the export.",
        });
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `export_${selectedDataTypes.join('_')}_${timestamp}`;

      // Export in selected format
      switch (exportFormat) {
        case 'csv':
          // For CSV, flatten the data structure
          const flatData = Object.entries(finalData).flatMap(([type, data]) => 
            Array.isArray(data) ? data.map(item => ({ data_type: type, ...item })) : []
          );
          exportToCSV(flatData, filename);
          break;
        case 'json':
          exportToJSON(finalData, filename);
          break;
        case 'xml':
          exportToXML([finalData], filename, 'export');
          break;
      }

      toast({
        title: "Export completed",
        description: `Data exported successfully in ${exportFormat.toUpperCase()} format.`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting data.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="w-5 h-5" />
          <span>Data Export</span>
        </CardTitle>
        <CardDescription>
          Export your data for integration with other systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Type Selection */}
        <div>
          <h3 className="font-medium mb-3">Select Data Types</h3>
          <div className="grid grid-cols-2 gap-4">
            {dataTypes.map((dataType) => (
              <div key={dataType.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={dataType.id}
                  checked={selectedDataTypes.includes(dataType.id)}
                  onCheckedChange={(checked) => handleDataTypeChange(dataType.id, checked as boolean)}
                />
                <label htmlFor={dataType.id} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <dataType.icon className="w-4 h-4" />
                      <span>{dataType.label}</span>
                    </div>
                    <Badge variant="secondary">{dataType.count}</Badge>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Export Format */}
        <div>
          <h3 className="font-medium mb-3">Export Format</h3>
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'xml') => setExportFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON - Structured data format</SelectItem>
              <SelectItem value="csv">CSV - Spreadsheet compatible</SelectItem>
              <SelectItem value="xml">XML - Legacy system integration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* PHI Handling */}
        <div className="p-4 border rounded-lg bg-orange-50">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-orange-800">PHI/PII Handling</h4>
              <p className="text-sm text-orange-700 mb-3">
                Personal Health Information (PHI) and Personally Identifiable Information (PII) 
                will be automatically detected and handled according to your selection.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-phi"
                  checked={includePHI}
                  onCheckedChange={setIncludePHI}
                />
                <label htmlFor="include-phi" className="text-sm text-orange-800">
                  Include PHI/PII in export (requires special authorization)
                </label>
              </div>
              {!includePHI && (
                <p className="text-xs text-orange-600 mt-2 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Sensitive data will be automatically redacted
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button 
          onClick={handleExport} 
          disabled={isExporting || selectedDataTypes.length === 0}
          className="w-full"
        >
          {isExporting ? (
            <span>Exporting...</span>
          ) : (
            <span className="flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export Selected Data
            </span>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
