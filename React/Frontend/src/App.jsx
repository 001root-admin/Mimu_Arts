import React, { useState } from 'react';
import Navbar from './components/Navbar/Navbar';
import Feed from './components/Feed/Feed';
import Sidebar from './components/Sidebar/Sidebar';
import MobileNav from './components/MobileNav/MobileNav';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomThemeEditor from './pages/CustomThemeEditor';
import ProfilePage from './pages/ProfilePage';
import UserSettings from './pages/UserSettings';
import { useAuth } from './context/AuthContext';
import './App.css';

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [page, setPage] = useState('feed');
  const [viewProfileId, setViewProfileId] = useState(null);

  if (loading) {
    return (
      <div className='app-loading'>
        <div className='loading-spinner'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const navigateTo = (p) => {
    setPage(p);
    setViewProfileId(null);
  };

  const viewProfile = (userId) => {
    setViewProfileId(userId);
    setPage('profile');
  };

  const renderPage = () => {
    switch (page) {
      case 'admin':
        return user?.role === 'admin' ? <AdminDashboard /> : <Feed />;
      case 'theme':
        return <CustomThemeEditor />;
      case 'profile':
        return <ProfilePage userId={viewProfileId} onBack={() => navigateTo('feed')} onViewProfile={viewProfile} />;
      case 'settings':
        return <UserSettings onBack={() => navigateTo('feed')} />;
      default:
        return (
          <div className='app-content'>
            <div className='main-layout'>
              <Feed onViewProfile={viewProfile} />
              <Sidebar onNavigate={navigateTo} onViewProfile={viewProfile} />
            </div>
          </div>
        );
    }
  };

  return (
    <div className='app'>
      <Navbar onNavigate={navigateTo} currentPage={page} user={user} onViewProfile={viewProfile} />
      {renderPage()}
      <MobileNav onNavigate={navigateTo} currentPage={page} />
    </div>
  );
};

export default App;