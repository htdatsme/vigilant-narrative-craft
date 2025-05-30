
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, Filter, Shield, AlertTriangle } from 'lucide-react';
import { useProcessingLogs } from '@/hooks/use-processing-logs';
import { exportToCSV, exportToJSON, exportToXML } from '@/utils/exportUtils';
import { sanitizeForExport } from '@/utils/security';
import { format } from 'date-fns';

interface AuditTrailProps {
  documentId?: string;
}

export const AuditTrail = ({ documentId }: AuditTrailProps) => {
  const { logs, loading } = useProcessingLogs(documentId);
  const [filteredLogs, setFilteredLogs] = useState(logs);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let filtered = logs;

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action === actionFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, actionFilter, searchTerm]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes('error') || action.includes('failed')) return 'bg-red-500';
    if (action.includes('compliance')) return 'bg-purple-500';
    if (action.includes('security')) return 'bg-orange-500';
    if (action.includes('completed')) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('compliance') || action.includes('security')) {
      return <Shield className="w-3 h-3" />;
    }
    if (action.includes('error') || action.includes('failed')) {
      return <AlertTriangle className="w-3 h-3" />;
    }
    return null;
  };

  const handleExport = (exportFormat: 'csv' | 'json' | 'xml') => {
    const sanitizedLogs = sanitizeForExport(filteredLogs);
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
    const filename = `audit_trail_${timestamp}`;

    switch (exportFormat) {
      case 'csv':
        exportToCSV(sanitizedLogs, filename);
        break;
      case 'json':
        exportToJSON(sanitizedLogs, filename);
        break;
      case 'xml':
        exportToXML(sanitizedLogs, filename, 'audit_trail');
        break;
    }
  };

  const uniqueActions = [...new Set(logs.map(log => log.action))];

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Audit Trail</span>
            </CardTitle>
            <CardDescription>
              Complete activity log for compliance and monitoring
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
            >
              <Download className="w-4 h-4 mr-2" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xml')}
            >
              <Download className="w-4 h-4 mr-2" />
              XML
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {uniqueActions.map(action => (
                <SelectItem key={action} value={action}>
                  {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Logs List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getActionBadgeColor(log.action)} text-white`}>
                      {getActionIcon(log.action)}
                      <span className="ml-1">
                        {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                    </span>
                  </div>
                </div>
                
                {log.details && (
                  <div className="mt-2">
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium mb-2">
                        View Details
                      </summary>
                      <pre className="bg-white p-3 rounded border text-xs overflow-auto max-h-48">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
