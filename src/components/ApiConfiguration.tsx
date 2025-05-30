
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Key, TestTube, CheckCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApiConfigurationProps {
  onConfigured: () => void;
}

export const ApiConfiguration = ({ onConfigured }: ApiConfigurationProps) => {
  const [parseurApiKey, setParseurApiKey] = useState(localStorage.getItem('parseur_api_key') || '');
  const [openaiApiKey, setOpenaiApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const saveCredentials = () => {
    localStorage.setItem('parseur_api_key', parseurApiKey);
    localStorage.setItem('openai_api_key', openaiApiKey);
    
    toast({
      title: "Credentials saved",
      description: "API credentials have been securely stored.",
    });
    
    onConfigured();
  };

  const removeParseurKey = () => {
    setParseurApiKey('');
    localStorage.removeItem('parseur_api_key');
    setTestResults(prev => ({ ...prev, parseur: undefined }));
    
    toast({
      title: "Parseur API key removed",
      description: "The API key has been removed from storage.",
    });
  };

  const removeOpenaiKey = () => {
    setOpenaiApiKey('');
    localStorage.removeItem('openai_api_key');
    setTestResults(prev => ({ ...prev, openai: undefined }));
    
    toast({
      title: "OpenAI API key removed",
      description: "The API key has been removed from storage.",
    });
  };

  const testParseurConnection = async () => {
    setIsLoading(true);
    try {
      // Test Parseur API connection with correct endpoint
      const response = await fetch('https://api.parseur.com/parser', {
        headers: {
          'Authorization': `Token ${parseurApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, parseur: success }));
      
      toast({
        title: success ? "Parseur connection successful" : "Parseur connection failed",
        description: success ? "API key is valid" : "Please check your API key",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, parseur: false }));
      toast({
        title: "Connection error",
        description: "Failed to connect to Parseur API",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const testOpenAIConnection = async () => {
    setIsLoading(true);
    try {
      // Test OpenAI API connection
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const success = response.ok;
      setTestResults(prev => ({ ...prev, openai: success }));
      
      toast({
        title: success ? "OpenAI connection successful" : "OpenAI connection failed",
        description: success ? "API key is valid" : "Please check your API key",
        variant: success ? "default" : "destructive"
      });
    } catch (error) {
      setTestResults(prev => ({ ...prev, openai: false }));
      toast({
        title: "Connection error",
        description: "Failed to connect to OpenAI API",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const getTestIcon = (service: string) => {
    const result = testResults[service];
    if (result === undefined) return null;
    return result ? 
      <CheckCircle className="w-4 h-4 text-medical-success" /> : 
      <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const isConfigured = parseurApiKey && openaiApiKey;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <Settings className="w-12 h-12 text-medical-blue mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-medical-text">API Configuration</h2>
        <p className="text-muted-foreground">Configure your Parseur and OpenAI credentials to start processing documents</p>
      </div>

      <Tabs defaultValue="parseur" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="parseur">Parseur AI</TabsTrigger>
          <TabsTrigger value="openai">OpenAI</TabsTrigger>
        </TabsList>

        <TabsContent value="parseur">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Parseur Configuration</span>
                {getTestIcon('parseur')}
              </CardTitle>
              <CardDescription>
                Configure Parseur AI for PDF extraction. You'll need an API key from your Parseur account. Parseur's AI engine will automatically extract data from your documents without requiring templates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="parseur-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="parseur-key"
                    type="password"
                    value={parseurApiKey}
                    onChange={(e) => setParseurApiKey(e.target.value)}
                    placeholder="Enter your Parseur API key"
                    className="bg-white border-gray-300 flex-1"
                  />
                  {parseurApiKey && (
                    <Button 
                      onClick={removeParseurKey} 
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Button 
                onClick={testParseurConnection} 
                disabled={!parseurApiKey || isLoading}
                variant="outline"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>OpenAI Configuration</span>
                {getTestIcon('openai')}
              </CardTitle>
              <CardDescription>
                Configure OpenAI for JSON analysis and case narrative generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="openai-key">API Key</Label>
                <div className="flex space-x-2">
                  <Input
                    id="openai-key"
                    type="password"
                    value={openaiApiKey}
                    onChange={(e) => setOpenaiApiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    className="bg-white border-gray-300 flex-1"
                  />
                  {openaiApiKey && (
                    <Button 
                      onClick={removeOpenaiKey} 
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <Button 
                onClick={testOpenAIConnection} 
                disabled={!openaiApiKey || isLoading}
                variant="outline"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Setup Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant={isConfigured ? "default" : "secondary"}>
                {isConfigured ? "Configured" : "Incomplete"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {isConfigured ? "All APIs are configured" : "Please configure all required APIs"}
              </p>
            </div>
            <Button 
              onClick={saveCredentials} 
              disabled={!isConfigured}
              className="bg-medical-blue hover:bg-blue-700"
            >
              Save & Continue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
