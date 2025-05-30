
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Download, FileText } from 'lucide-react';

interface CaseNarrativeEditorProps {
  onBack: () => void;
}

export const CaseNarrativeEditor = ({ onBack }: CaseNarrativeEditorProps) => {
  const [narrative, setNarrative] = useState('');
  const [caseId, setCaseId] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);

  const generateNarrative = async () => {
    const openaiApiKey = localStorage.getItem('openai_api_key');
    
    if (!openaiApiKey) {
      alert('Please configure OpenAI API key in settings');
      return;
    }

    try {
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
              content: 'You are a medical writer specializing in adverse event case narratives for ICSR submissions. Generate a professional, E2B R3 compliant case narrative template.'
            },
            {
              role: 'user',
              content: `Generate a case narrative template for case ID: ${caseId}. Include sections for patient information, medical history, adverse event details, concomitant medications, and outcome.`
            }
          ],
          temperature: 0.1,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate narrative');
      }

      const result = await response.json();
      setNarrative(result.choices[0].message.content);
    } catch (error) {
      console.error('Error generating narrative:', error);
      alert('Failed to generate narrative. Please check your API configuration.');
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
            <h2 className="text-2xl font-semibold text-medical-text">Case Narrative Editor</h2>
            <p className="text-muted-foreground">Create and edit ICSR-compliant case narratives</p>
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

      {/* Narrative Editor */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-medical-text">Case Narrative Editor</CardTitle>
              <CardDescription>Create medical narratives for ICSR submission</CardDescription>
            </div>
            <Button onClick={generateNarrative} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Generate Template
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
              />
            </div>
            <div>
              <Label htmlFor="reportDate">Report Date</Label>
              <Input 
                id="reportDate" 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="narrative">Medical Narrative</Label>
            <Textarea
              id="narrative"
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="min-h-[400px] font-mono text-sm bg-white"
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
