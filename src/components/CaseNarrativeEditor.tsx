
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Download, CheckCircle, AlertTriangle } from 'lucide-react';

interface CaseNarrativeEditorProps {
  onBack: () => void;
}

export const CaseNarrativeEditor = ({ onBack }: CaseNarrativeEditorProps) => {
  const [selectedCase, setSelectedCase] = useState('CV-2024-001');
  const [narrative, setNarrative] = useState(`A 45-year-old female patient with a history of hypertension reported onset of severe headache and dizziness approximately 2 hours after taking the first dose of [Product Name]. The patient had no known allergies and was concomitantly taking lisinopril 10mg daily for blood pressure management.

Patient Information:
- Age: 45 years
- Gender: Female  
- Weight: 68 kg
- Medical History: Hypertension (diagnosed 2019)

Adverse Event Details:
- Event: Severe headache, dizziness
- Onset: 2 hours post-dose
- Severity: Moderate to severe
- Outcome: Recovering

The patient discontinued the suspected medication and symptoms began to improve within 6 hours. No other concomitant medications were started during this period. The temporal relationship between drug administration and symptom onset suggests a possible causal relationship.`);

  const cases = [
    { id: 'CV-2024-001', patient: 'Patient A', status: 'draft', priority: 'high' },
    { id: 'CV-2024-002', patient: 'Patient B', status: 'review', priority: 'medium' },
    { id: 'CV-2024-003', patient: 'Patient C', status: 'completed', priority: 'low' },
  ];

  const complianceChecks = [
    { check: 'Patient Demographics', status: 'passed' },
    { check: 'Medical History', status: 'passed' },
    { check: 'Adverse Event Description', status: 'passed' },
    { check: 'Concomitant Medications', status: 'warning' },
    { check: 'Dosage Information', status: 'failed' },
    { check: 'E2B R3 Format', status: 'passed' },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'bg-orange-500 text-white',
      review: 'bg-blue-500 text-white',
      completed: 'bg-medical-success text-white'
    };
    return variants[status as keyof typeof variants] || variants.draft;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'bg-medical-warning text-white',
      medium: 'bg-orange-500 text-white',
      low: 'bg-gray-400 text-white'
    };
    return variants[priority as keyof typeof variants] || variants.low;
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-medical-warning" />;
      default:
        return null;
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
            <h2 className="text-2xl font-semibold text-medical-blue">Case Narrative Editor</h2>
            <p className="text-gray-600">Create and edit ICSR-compliant case narratives</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button className="bg-medical-blue hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export ICSR
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case List */}
        <Card>
          <CardHeader>
            <CardTitle>Active Cases</CardTitle>
            <CardDescription>Select a case to edit its narrative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cases.map((caseItem) => (
                <div
                  key={caseItem.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedCase === caseItem.id 
                      ? 'border-medical-blue bg-blue-50' 
                      : 'border-gray-200 hover:border-medical-blue'
                  }`}
                  onClick={() => setSelectedCase(caseItem.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-medical-blue">{caseItem.id}</p>
                    <Badge className={getPriorityBadge(caseItem.priority)}>
                      {caseItem.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{caseItem.patient}</p>
                  <Badge className={getStatusBadge(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Narrative Editor */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Case Narrative - {selectedCase}</CardTitle>
                <CardDescription>Edit the medical narrative for ICSR submission</CardDescription>
              </div>
              <Badge className="bg-medical-blue text-white">E2B R3 Format</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="caseId">Case ID</Label>
                <Input id="caseId" value={selectedCase} readOnly />
              </div>
              <div>
                <Label htmlFor="reportDate">Report Date</Label>
                <Input id="reportDate" type="date" defaultValue="2024-01-15" />
              </div>
            </div>
            
            <div>
              <Label htmlFor="narrative">Medical Narrative</Label>
              <Textarea
                id="narrative"
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Enter the detailed case narrative..."
              />
            </div>

            <div className="flex justify-between text-sm text-gray-600">
              <span>Character count: {narrative.length}</span>
              <span>Last saved: 2 minutes ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Check */}
      <Card>
        <CardHeader>
          <CardTitle>ICSR Compliance Check</CardTitle>
          <CardDescription>Validation against E2B R3 requirements and regulatory standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {complianceChecks.map((check, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getComplianceIcon(check.status)}
                <div>
                  <p className="font-medium text-sm">{check.check}</p>
                  <p className="text-xs text-gray-600 capitalize">{check.status}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
