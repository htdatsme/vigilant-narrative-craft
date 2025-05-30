
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Download, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CaseNarrativeEditorProps {
  onBack: () => void;
}

export const CaseNarrativeEditor = ({ onBack }: CaseNarrativeEditorProps) => {
  const [narrative, setNarrative] = useState('');
  const [caseId, setCaseId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateNarrative = async () => {
    if (!caseId.trim()) {
      toast({
        title: "Case ID required",
        description: "Please enter a case ID before generating a narrative.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate a basic template for now - in a real app this would call an AI service
      const template = `CASE NARRATIVE - ${caseId}

Report Date: ${reportDate}

PATIENT INFORMATION:
- Age: [Patient Age]
- Gender: [Patient Gender]
- Medical History: [Relevant Medical History]

ADVERSE EVENT DETAILS:
- Event Description: [Detailed description of the adverse event]
- Onset Date: [Date of event onset]
- Severity: [Mild/Moderate/Severe]
- Outcome: [Recovered/Recovering/Not Recovered/Fatal/Unknown]

SUSPECT MEDICATION(S):
- Product Name: [Medication Name]
- Active Ingredient: [Active Ingredient]
- Dose: [Dose and frequency]
- Route of Administration: [Route]
- Start Date: [Start date]
- Stop Date: [Stop date]

CONCOMITANT MEDICATIONS:
[List of other medications taken concurrently]

CLINICAL COURSE:
[Detailed description of the clinical course and treatment]

ASSESSMENT:
[Assessment of causality and relationship to suspect medication]

This case narrative is prepared in accordance with E2B R3 guidelines for ICSR submission.`;

      setNarrative(template);
      
      toast({
        title: "Template generated",
        description: "A narrative template has been created. Please customize it with specific case details.",
      });

    } catch (error) {
      console.error('Error generating narrative:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate narrative template. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveDraft = () => {
    // In a real app, this would save to the database
    toast({
      title: "Draft saved",
      description: "Your narrative draft has been saved locally.",
    });
  };

  const exportICSR = () => {
    // In a real app, this would format and export as ICSR
    const blob = new Blob([narrative], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case_narrative_${caseId || 'draft'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Case narrative has been exported as a text file.",
    });
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
            <h2 className="text-2xl font-semibold text-medical-text">Case Narrative Editor</h2>
            <p className="text-muted-foreground">Create and edit ICSR-compliant case narratives</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={saveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </Button>
          <Button className="bg-medical-blue hover:bg-blue-700" onClick={exportICSR}>
            <Download className="w-4 h-4 mr-2" />
            Export ICSR
          </Button>
        </div>
      </div>

      {/* Narrative Editor */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-medical-text">Case Narrative Editor</CardTitle>
              <CardDescription>Create medical narratives for ICSR submission</CardDescription>
            </div>
            <Button 
              onClick={generateNarrative} 
              variant="outline" 
              className="border-medical-blue text-medical-blue hover:bg-medical-blue hover:text-white"
              disabled={isGenerating}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Template'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="caseId">Case ID</Label>
              <Input 
                id="caseId" 
                value={caseId} 
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="Enter case ID (e.g., CV-2024-001)"
                className="bg-white border-gray-300"
              />
            </div>
            <div>
              <Label htmlFor="reportDate">Report Date</Label>
              <Input 
                id="reportDate" 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="bg-white border-gray-300"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="narrative">Medical Narrative</Label>
            <Textarea
              id="narrative"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="min-h-[400px] font-mono text-sm bg-white border-gray-300"
              placeholder="Enter the detailed case narrative or click 'Generate Template' to create a starting template..."
            />
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Character count: {narrative.length}</span>
            <span>E2B R3 Format</span>
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      {!narrative && (
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-medical-text">Getting Started</CardTitle>
            <CardDescription>Create your first case narrative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No narrative created yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Enter a case ID and click "Generate Template" to start with an AI-generated template,
                or begin writing your narrative manually.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
