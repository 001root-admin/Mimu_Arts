import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import Feed from './components/Feed/Feed';
import Sidebar from './components/Sidebar/Sidebar';
import MobileNav from './components/MobileNav/MobileNav';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import CustomThemeEditor from './pages/CustomThemeEditor';
import ProfilePage from './pages/ProfilePage';
import UserSettings from './pages/UserSettings';
import GalleryPage from './pages/GalleryPage';
import PeoplePage from './pages/PeoplePage';
import LeftSidebar from './components/Sidebar/LeftSidebar';
import { useAuth } from './context/AuthContext';
import './App.css';

const App = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const [page, setPage] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash.startsWith('profile/')) {
      const id = parseInt(hash.split('/')[1]);
      if (!isNaN(id)) return 'profile';
    }
    return hash || 'feed';
  });
  const [viewProfileId, setViewProfileId] = useState(() => {
    const hash = window.location.hash.replace('#/', '');
    if (hash.startsWith('profile/')) {
      const id = parseInt(hash.split('/')[1]);
      if (!isNaN(id)) return id;
    }
    return null;
  });
  const [storiesKey, setStoriesKey] = useState(0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [peopleSearchQuery, setPeopleSearchQuery] = useState('');
  const refreshStories = () => setStoriesKey(k => k + 1);

  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash.replace('#/', '');
      if (hash.startsWith('profile/')) {
        const id = parseInt(hash.split('/')[1]);
        if (!isNaN(id)) { setViewProfileId(id); setPage('profile'); }
      } else if (hash) { setPage(hash); setViewProfileId(null); }
      else { setPage('feed'); setViewProfileId(null); }
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.location.hash) window.history.replaceState(null, '', '#/feed');
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (loading) return <div className='app-loading'><div className='loading-spinner'></div></div>;
  if (!isAuthenticated) return <LoginPage />;

  const navigateTo = (p) => {
    setPage(p);
    setViewProfileId(null);
    window.history.pushState(null, '', `#/${p}`);
  };

  const viewProfile = (userId) => {
    setViewProfileId(userId);
    setPage('profile');
    window.history.pushState(null, '', `#/profile/${userId}`);
  };

  const hasSidebar = !['admin', 'theme', 'settings', 'profile'].includes(page);

  const renderPageContent = () => {
    if (page === 'admin') return user?.role === 'admin' ? <AdminDashboard /> : <Feed onViewProfile={viewProfile} storiesKey={storiesKey} />;
    if (page === 'theme') return <CustomThemeEditor />;
    if (page === 'settings') return <UserSettings onBack={() => navigateTo('feed')} />;
    if (page === 'gallery') return <GalleryPage onViewProfile={viewProfile} />;
    if (page === 'people') return <PeoplePage onViewProfile={viewProfile} searchQuery={peopleSearchQuery} />;
    if (page === 'profile') return <ProfilePage userId={viewProfileId} onBack={() => navigateTo('feed')} onViewProfile={viewProfile} />;
    return <Feed onViewProfile={viewProfile} storiesKey={storiesKey} showCreatePost={showCreatePost} onCloseCreatePost={() => setShowCreatePost(false)} />;
  };

  // Pages that don't need the three-column layout
  const isFullWidth = ['admin', 'theme'].includes(page);
  const isProfile = page === 'profile';

  if (isFullWidth) {
    return (
      <div className='app'>
        <Navbar onNavigate={navigateTo} currentPage={page} user={user} onViewProfile={viewProfile} onSearch={(q) => setPeopleSearchQuery(q)} />
        {renderPageContent()}
        <MobileNav onNavigate={navigateTo} currentPage={page} onOpenCreatePost={() => { navigateTo('feed'); setShowCreatePost(true); }} />
      </div>
    );
  }

  return (
    <div className='app'>
      <Navbar onNavigate={navigateTo} currentPage={page} user={user} onViewProfile={viewProfile} onSearch={(q) => setPeopleSearchQuery(q)} />
      <div className='app-content'>
        <div className={`main-layout ${isProfile ? 'profile-layout' : ''}`}>
          {hasSidebar && <LeftSidebar onNavigate={navigateTo} currentPage={page} />}
          <div className={`main-content ${isProfile ? 'main-content-full' : ''}`}>
            {renderPageContent()}
          </div>
          {hasSidebar && (
            <Sidebar onNavigate={navigateTo} onViewProfile={viewProfile} onStoriesChanged={refreshStories} />
          )}
        </div>
      </div>
      <MobileNav onNavigate={navigateTo} currentPage={page} onOpenCreatePost={() => { navigateTo('feed'); setShowCreatePost(true); }} />
    </div>
  );
};

export default App;