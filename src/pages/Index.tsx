
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { DocumentProcessor } from '@/components/DocumentProcessor';
import { CaseNarrativeEditor } from '@/components/CaseNarrativeEditor';

export type AppView = 'dashboard' | 'processor' | 'narrative';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppView>('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'processor':
        return <DocumentProcessor onBack={() => setCurrentView('dashboard')} />;
      case 'narrative':
        return <CaseNarrativeEditor onBack={() => setCurrentView('dashboard')} />;
      default:
        return <Dashboard onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-medical-background">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      <main className="container mx-auto px-4 py-6">
        {renderView()}
      </main>
    </div>
  );
};

export default Index;
