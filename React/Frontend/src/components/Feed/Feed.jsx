import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Feed.css';
import Stories from '../Stories/Stories';
import PostCard from '../PostCard/PostCard';
import { api } from '../../api/api';

const Feed = ({ onViewProfile }) => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();

  const loadPosts = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await api.getPosts(pageNum);
      if (pageNum === 1) {
        setPosts(data.posts || []);
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])]);
      }
      setHasMore(pageNum < (data.totalPages || 1));
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    loadPosts(1);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => {
            const nextPage = prev + 1;
            loadPosts(nextPage);
            return nextPage;
          });
        }
      },
      { threshold: 0.1 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadPosts]);

  // Refresh when returning to feed
  useEffect(() => {
    const handleFocus = () => loadPosts(1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className='feed'>
      <Stories onViewProfile={onViewProfile} />
      <div className='feed-posts'>
        {posts.map((post, idx) => (
          <PostCard 
            key={post.id || idx} 
            post={{
              id: post.id,
              userId: post.user_id,
              user_id: post.user_id,
              username: post.username,
              location: post.location || 'Unknown',
              avatar: post.avatar ? `http://localhost:5000${post.avatar}` : null,
              image: post.image ? `http://localhost:5000${post.image}` : null,
              likes: post.likes_count || 0,
              caption: post.caption || '',
              comments: post.comments_count || 0,
              time: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'
            }}
            onViewProfile={onViewProfile}
          />
        ))}
        {loading && (
          <div className='feed-loader'>
            <div className='loading-spinner'></div>
            <span>Loading more posts...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <div className='feed-end'>
            <span>You're all caught up! ✨</span>
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className='feed-empty'>
            <div className='empty-icon'>📸</div>
            <h3>No posts yet</h3>
            <p>Be the first to share a photo! Go to your profile and click "New Post".</p>
          </div>
        )}
        <div ref={observerRef} style={{ height: 1 }} />
      </div>
    </div>
  );
};

export default Feed;