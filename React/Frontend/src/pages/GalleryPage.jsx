import React, { useState, useEffect } from 'react';
import { api, getServerUrl } from '../api/api';
import PostCard from '../components/PostCard/PostCard';
import './GalleryPage.css';

const GalleryPage = ({ onViewProfile }) => {
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState('recent');
  const [loading, setLoading] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState(new Set());
  const API_BASE = getServerUrl();

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getLikedPosts().then(ids => setLikedPostIds(new Set(ids.map(id => Number(id))))).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getGalleryPosts(sort).then(data => {
      setPosts(data.posts || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sort]);

  return (
    <div className='gallery-page'>
      <div className='gallery-header'>
        <h2>Gallery</h2>
        <p>Discover recent, popular, and trending posts</p>
      </div>

      <div className='gallery-filters'>
        <button className={`gallery-filter-btn ${sort === 'recent' ? 'active' : ''}`} onClick={() => setSort('recent')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Recent
        </button>
        <button className={`gallery-filter-btn ${sort === 'popular' ? 'active' : ''}`} onClick={() => setSort('popular')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Popular
        </button>
        <button className={`gallery-filter-btn ${sort === 'trending' ? 'active' : ''}`} onClick={() => setSort('trending')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Trending
        </button>
      </div>

      <div className='gallery-posts'>
        {loading && (
          <div className='gallery-loader'>
            <div className='loading-spinner'></div>
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className='gallery-empty'>
            <div className='empty-icon'>📸</div>
            <h3>No posts yet</h3>
            <p>Be the first to share a photo!</p>
          </div>
        )}
        {posts.map((post, idx) => (
          <PostCard
            key={post.id || idx}
            post={{
              id: post.id,
              userId: post.user_id,
              user_id: post.user_id,
              username: post.username,
              location: post.location || 'Unknown',
              avatar: post.avatar ? `${API_BASE}${post.avatar}` : null,
              image: post.image ? `${API_BASE}${post.image}` : null,
              likes: post.likes_count || 0,
              caption: post.caption || '',
              comments: post.comments_count || 0,
              time: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'
            }}
            onViewProfile={onViewProfile}
            initialLiked={likedPostIds.has(Number(post.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;