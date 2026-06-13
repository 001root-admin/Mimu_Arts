import React, { useState, useEffect, useCallback } from 'react';
import './StoryViewer.css';
import { assets } from '../../assets/assets';
import { getServerUrl } from '../../api/api';

const API_BASE = getServerUrl();

const StoryViewer = ({ stories, initialStoryId, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!stories || stories.length === 0) return;
    const idx = stories.findIndex(s => s.id === initialStoryId);
    if (idx >= 0) setCurrentIndex(idx);
  }, [initialStoryId, stories]);

  const story = stories?.[currentIndex];
  const totalStories = stories?.length || 0;

  const goNext = useCallback(() => {
    if (currentIndex < totalStories - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, totalStories, onClose]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { goNext(); return 0; }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [goNext, currentIndex]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  if (!story) return null;

  const avatar = story.avatar && !story.avatar.includes('default')
    ? `${API_BASE}${story.avatar}` : assets.profilepic;
  const storyImage = `${API_BASE}${story.image}`;
  const timeAgo = story.created_at
    ? Math.round((Date.now() - new Date(story.created_at).getTime()) / 3600000) + 'h ago'
    : '';

  return (
    <div className='story-viewer-overlay' onClick={onClose}>
      <div className='story-viewer-modal' onClick={e => e.stopPropagation()}>
        {/* Progress bars */}
        <div className='story-progress-bars'>
          {stories.map((s, i) => (
            <div key={s.id || i} className='story-progress-bar'>
              <div
                className='story-progress-fill'
                style={{
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className='story-viewer-header'>
          <div className='story-viewer-user'>
            <img src={avatar} alt='' className='story-viewer-avatar' />
            <div className='story-viewer-username'>{story.username}</div>
            <div className='story-viewer-time'>{timeAgo}</div>
          </div>
          <button className='story-viewer-close' onClick={onClose}>✕</button>
        </div>

        {/* Image */}
        <div className='story-viewer-image'>
          <img src={storyImage} alt='' />
          {story.caption && (
            <div className='story-viewer-caption'>{story.caption}</div>
          )}
        </div>

        {/* Navigation zones */}
        <div className='story-nav-left' onClick={goPrev} />
        <div className='story-nav-right' onClick={goNext} />
      </div>
    </div>
  );
};

export default StoryViewer;