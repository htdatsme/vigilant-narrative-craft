
import { Button } from '@/components/ui/button';
import { FileText, Upload, BarChart3, Settings } from 'lucide-react';
import type { AppView } from '@/pages/Index';

interface HeaderProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

export const Header = ({ currentView, onNavigate }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-medical-gray shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-medical-blue">Simplify Canvig</h1>
                <p className="text-sm text-gray-600">Adverse Event Processing</p>
              </div>
            </div>
          </div>
          
          <nav className="flex space-x-2">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center space-x-2 ${
                currentView === 'dashboard' 
                  ? 'bg-medical-blue text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-medical-blue hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={currentView === 'processor' ? 'default' : 'ghost'}
              onClick={() => onNavigate('processor')}
              className={`flex items-center space-x-2 ${
                currentView === 'processor' 
                  ? 'bg-medical-blue text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-medical-blue hover:bg-gray-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Process Documents</span>
            </Button>
            <Button
              variant={currentView === 'narrative' ? 'default' : 'ghost'}
              onClick={() => onNavigate('narrative')}
              className={`flex items-center space-x-2 ${
                currentView === 'narrative' 
                  ? 'bg-medical-blue text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-medical-blue hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Case Narratives</span>
            </Button>
            <Button
              variant={currentView === 'config' ? 'default' : 'ghost'}
              onClick={() => onNavigate('config')}
              className={`flex items-center space-x-2 ${
                currentView === 'config' 
                  ? 'bg-medical-blue text-white hover:bg-blue-700' 
                  : 'text-gray-600 hover:text-medical-blue hover:bg-gray-100'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>API Settings</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};
