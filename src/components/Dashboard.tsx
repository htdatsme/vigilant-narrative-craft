
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import type { AppView } from '@/pages/Index';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const stats = {
    totalDocuments: 156,
    processed: 142,
    pending: 8,
    errors: 6,
    successRate: 91.0
  };

  const recentDocuments = [
    { id: 'CV-2024-001', name: 'Adverse_Event_Report_001.pdf', status: 'completed', date: '2024-01-15' },
    { id: 'CV-2024-002', name: 'Canada_Vigilance_002.pdf', status: 'processing', date: '2024-01-15' },
    { id: 'CV-2024-003', name: 'AE_Report_003.pdf', status: 'error', date: '2024-01-15' },
    { id: 'CV-2024-004', name: 'Vigilance_Report_004.pdf', status: 'pending', date: '2024-01-15' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-medical-success" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-medical-warning" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-medical-success text-white',
      processing: 'bg-yellow-500 text-white',
      error: 'bg-medical-warning text-white',
      pending: 'bg-gray-400 text-white'
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg p-6 border border-medical-gray">
        <h2 className="text-2xl font-semibold text-medical-blue mb-2">Welcome to HealthWatch Pro</h2>
        <p className="text-gray-600 mb-4">
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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-blue">{stats.totalDocuments}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-medical-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-success">{stats.processed}</div>
            <p className="text-xs text-muted-foreground">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">In queue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-medical-blue">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <CardDescription>Latest adverse event reports processed through the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(doc.status)}
                  <div>
                    <p className="font-medium text-medical-blue">{doc.name}</p>
                    <p className="text-sm text-gray-600">ID: {doc.id} • {doc.date}</p>
                  </div>
                </div>
                <Badge className={getStatusBadge(doc.status)}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
