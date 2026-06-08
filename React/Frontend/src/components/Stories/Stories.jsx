import React from 'react';
import './Stories.css';
import { assets } from '../../assets/assets';

const stories = [
  { id: 1, name: 'Your Story', avatar: assets.profilepic, isUser: true },
  { id: 2, name: 'sarah', avatar: assets.mascot },
  { id: 3, name: 'alex', avatar: assets.Ellipse },
  { id: 4, name: 'emma', avatar: assets.mascot },
  { id: 5, name: 'jake', avatar: assets.Ellipse },
  { id: 6, name: 'luna', avatar: assets.mascot },
  { id: 7, name: 'max', avatar: assets.Ellipse },
];

const Stories = ({ onViewProfile }) => {
  const handleStoryClick = (story) => {
    if (onViewProfile && story.userId) {
      onViewProfile(story.userId);
    }
  };

  return (
    <div className='stories-container'>
      <div className='stories-header'>
        <span className='stories-title'>Stories</span>
        <div className='stories-nav'>
          <button className='story-scroll-btn' id='storyScrollLeft' onClick={() => { const el = document.getElementById('storyTrack'); if (el) el.scrollBy({ left: -200, behavior: 'smooth' }); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className='story-scroll-btn' onClick={() => { const el = document.getElementById('storyTrack'); if (el) el.scrollBy({ left: 200, behavior: 'smooth' }); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>
      <div className='stories-track' id='storyTrack'>
        {stories.map((story) => (
          <div key={story.id} className='story-item' onClick={() => handleStoryClick(story)}>
            <div className='story-avatar-wrapper'>
              <div className='story-avatar'>
                <img src={story.avatar} alt={story.name} />
              </div>
              {story.isUser && (
                <div className='add-story-btn'>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                </div>
              )}
            </div>
            <span className='story-name'>{story.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;