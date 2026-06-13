import React, { useEffect, useState } from 'react';
import './Stories.css';
import { assets } from '../../assets/assets';
import { api, getServerUrl } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import StoryViewer from '../StoryViewer/StoryViewer';

const API_BASE = getServerUrl();
const VIEWED_STORIES_KEY = 'mimis_viewed_stories';

const loadViewedStories = () => {
  try { return JSON.parse(localStorage.getItem(VIEWED_STORIES_KEY) || '{}'); }
  catch { return {}; }
};

const markStoryViewed = (storyId) => {
  const viewed = loadViewedStories();
  viewed[storyId] = Date.now();
  localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify(viewed));
};

const Stories = ({ onViewProfile, refreshKey }) => {
  const { user: me } = useAuth();
  const [stories, setStories] = useState([]);
  const [meAvatar, setMeAvatar] = useState(assets.profilepic);
  const [meUsername, setMeUsername] = useState('Your Story');
  const [meId, setMeId] = useState(null);
  const [viewingStory, setViewingStory] = useState(null);

  const loadStories = () => {
    api.getStories()
      .then(list => setStories(Array.isArray(list) ? list : []))
      .catch(() => setStories([]));
  };
  useEffect(() => { loadStories(); }, []);
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) loadStories();
  }, [refreshKey]);

  useEffect(() => {
    if (!me?.id) return;
    setMeId(me.id);
    setMeUsername(me.username || 'Your Story');
    api.getUser(me.id).then(u => {
      if (u?.avatar && !u.avatar.includes('default')) setMeAvatar(`${API_BASE}${u.avatar}`);
    }).catch(() => {});
  }, [me?.id]);

  const handleStoryClick = (story) => {
    markStoryViewed(story.id);
    setViewingStory(story);
  };

  const closeStoryViewer = () => {
    setViewingStory(null);
    setStories(prev => [...prev]); // refresh viewed state
  };

  const hasUnviewedStories = stories.some(s => !loadViewedStories()[s.id]);

  return (
    <div className='stories-container'>
      <div className='stories-header'>
        <span className='stories-title'>Stories</span>
        <div className='stories-nav'>
          <button className='story-scroll-btn' onClick={() => { const el = document.getElementById('storyTrack'); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className='story-scroll-btn' onClick={() => { const el = document.getElementById('storyTrack'); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div className='stories-track' id='storyTrack'>
        {/* Current user tile */}
        <div className='story-item' onClick={() => meId && onViewProfile && onViewProfile(meId)}>
          <div className='story-avatar-wrapper'>
            <div className='story-avatar'>
              <img src={meAvatar} alt={meUsername} />
            </div>
            <div className='add-story-btn'>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg>
            </div>
          </div>
          <span className='story-name'>{meUsername}</span>
        </div>

        {stories.length === 0 ? (
          <div className='story-item story-empty' style={{ pointerEvents: 'none', opacity: 0.6 }}>
            <div className='story-avatar-wrapper'>
              <div className='story-avatar' style={{ background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✨</div>
            </div>
            <span className='story-name'>No stories yet</span>
          </div>
        ) : (
          stories.map((story) => {
            const avatar = story.avatar && !story.avatar.includes('default') ? `${API_BASE}${story.avatar}` : assets.profilepic;
            const isViewed = !!loadViewedStories()[story.id];
            return (
              <div key={story.id} className='story-item' onClick={() => handleStoryClick({ id: story.id, userId: story.user_id })}>
                <div className={`story-avatar-wrapper ${isViewed ? 'viewed' : 'unviewed'}`}>
                  <div className='story-avatar'>
                    <img src={avatar} alt={story.username} />
                  </div>
                </div>
                <span className='story-name'>{story.username}</span>
              </div>
            );
          })
        )}
      </div>
      {viewingStory && (
        <StoryViewer
          stories={stories}
          initialStoryId={viewingStory.id}
          onClose={closeStoryViewer}
        />
      )}
    </div>
  );
};

export default Stories;
