import React, { useState, useEffect } from 'react';
import { User, DriveSubmission, SubmissionStatus } from './types';
import { MockService } from './services/mockService';
import { Auth, AgreementWall } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { DriveForm } from './components/DriveForm';
import { AdminPortal } from './components/AdminPortal';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'form' | 'admin'>('dashboard');
  const [submissions, setSubmissions] = useState<DriveSubmission[]>([]);

  useEffect(() => {
    const savedUser = MockService.getUser();
    if (savedUser) setUser(savedUser);
    
    // Initial data load
    setSubmissions(MockService.getSubmissions());
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    setSubmissions(MockService.getSubmissions());
  };

  const handleLogout = () => {
    MockService.logout();
    setUser(null);
    setActiveTab('dashboard');
  };

  const handleReportDrive = async (data: any) => {
    const newSub = await MockService.submitDrive(data);
    setSubmissions(prev => [newSub, ...prev]);
  };

  const handleUpdateStatus = async (id: string, status: SubmissionStatus) => {
    await MockService.updateStatus(id, status);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  if (!user.agreementSigned) {
    return <AgreementWall onSign={(updatedUser) => setUser(updatedUser)} />;
  }

  return (
    <Layout 
      user={user} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      onLogout={handleLogout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard user={user} submissions={submissions} />
      )}
      
      {activeTab === 'form' && (
        <DriveForm user={user} onSubmit={handleReportDrive} />
      )}
      
      {activeTab === 'admin' && user.role === 'ADMIN' && (
        <AdminPortal 
          submissions={submissions} 
          onUpdateStatus={handleUpdateStatus} 
        />
      )}
    </Layout>
  );
};

export default App;