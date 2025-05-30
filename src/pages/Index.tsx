
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { CaseNarrativeEditor } from '@/components/CaseNarrativeEditor';
import { ApiConfiguration } from '@/components/ApiConfiguration';

export type AppView = 'dashboard' | 'processor' | 'narrative' | 'config';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'processor':
        return <DocumentProcessor onBack={() => setCurrentView('dashboard')} />;
      case 'narrative':
        return <CaseNarrativeEditor onBack={() => setCurrentView('dashboard')} />;
      case 'config':
        return <ApiConfiguration onConfigured={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      <main className="container mx-auto px-4 py-6">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
