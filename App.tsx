
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { SearchInterface } from './components/SearchInterface';
import { AddContentForm } from './components/AddContentForm';
import { AuthForm } from './components/AuthForm';
import { ProfilePage } from './components/ProfilePage';
import { Modal } from './components/Modal';
import { AppView, User, KnowledgeEntry } from './types';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('search');
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingQuery, setPendingQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);

  useEffect(() => {
    const sessionUser = storageService.getCurrentUser();
    if (sessionUser) {
      setUser(sessionUser);
    }
  }, []);

  const handleNotFound = (query: string) => {
    setPendingQuery(query);
    setIsModalOpen(true);
  };

  const handleModalConfirm = () => {
    setIsModalOpen(false);
    setView('add');
  };

  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
    setView('search');
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
    setView('search');
  };

  const handleSelectEntryFromProfile = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setView('search');
  };

  const handleAddSuccess = () => {
    setView('search');
    setPendingQuery('');
  };

  const renderContent = () => {
    switch (view) {
      case 'search':
        return (
          <SearchInterface 
            user={user} 
            onNotFound={handleNotFound} 
            selectedEntry={selectedEntry} 
          />
        );
      case 'add':
        return (
          <AddContentForm 
            initialTitle={pendingQuery} 
            onSuccess={handleAddSuccess}
            onCancel={() => setView('search')}
          />
        );
      case 'auth':
        return <AuthForm onSuccess={handleAuthSuccess} />;
      case 'profile':
        return user ? (
          <ProfilePage user={user} onSelectEntry={handleSelectEntryFromProfile} />
        ) : (
          <AuthForm onSuccess={handleAuthSuccess} />
        );
      default:
        return <SearchInterface user={user} onNotFound={handleNotFound} />;
    }
  };

  return (
    <Layout 
      currentView={view} 
      onViewChange={(v) => {
        setView(v);
        if (v !== 'search') setSelectedEntry(null);
      }} 
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalConfirm}
        title="Knowledge Gap Found"
        message={`We couldn't find any information for "${pendingQuery}". Would you like to be the first to contribute this definition to our engine?`}
      />
    </Layout>
  );
};

export default App;
