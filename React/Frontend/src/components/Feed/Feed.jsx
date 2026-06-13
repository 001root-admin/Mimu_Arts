import React, { useState, useEffect, useRef, useCallback } from 'react';
import './Feed.css';
import Stories from '../Stories/Stories';
import PostCard from '../PostCard/PostCard';
import { api, getServerUrl } from '../../api/api';
import { assets } from '../../assets/assets';
import { useAuth } from '../../context/AuthContext';

const Feed = ({ onViewProfile, storiesKey, showCreatePost, onCloseCreatePost }) => {
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reactionsList, setReactionsList] = useState(['❤️', '🔥', '😂', '😍', '👍', '😮']);
  const postInputRef = useRef();
  const observerRef = useRef();

  // Dynamically determine API base for image URLs (same host as page)
  const API_BASE = getServerUrl();
  // User's real avatar
  const userAvatar = authUser?.avatar && !authUser.avatar.includes('default')
    ? `${API_BASE}${authUser.avatar}` : assets.profilepic;

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getLikedPosts().then(ids => setLikedPostIds(new Set(ids.map(id => Number(id))))).catch(() => setLikedPostIds(new Set()));
    } else {
      setLikedPostIds(new Set());
    }
    // Load custom reactions from settings
    api.getSiteSettings().then(s => {
      if (s.default_reactions) {
        try { setReactionsList(JSON.parse(s.default_reactions)); } catch {}
      }
    }).catch(() => {});
  }, []);

  const loadPosts = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await api.getPosts(pageNum);
      if (pageNum === 1) setPosts(data.posts || []);
      else setPosts(prev => [...prev, ...(data.posts || [])]);
      setHasMore(pageNum < (data.totalPages || 1));
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally { setLoading(false); }
  }, [loading]);

  useEffect(() => {
    if (showCreatePost) { setShowPostModal(true); onCloseCreatePost && onCloseCreatePost(); }
  }, [showCreatePost, onCloseCreatePost]);

  useEffect(() => { loadPosts(1); }, []);

  useEffect(() => {
    if (!observerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => { const nextPage = prev + 1; loadPosts(nextPage); return nextPage; });
        }
      },
      { threshold: 0.1 }
    );
    const el = observerRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, loading, loadPosts]);

  useEffect(() => {
    const handleFocus = () => loadPosts(1);
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleCreatePost = async () => {
    if (!newPostImage && !newPostCaption.trim()) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (newPostImage) formData.append('image', newPostImage);
      formData.append('caption', newPostCaption);
      await api.createPost(formData);
      setShowPostModal(false);
      setNewPostCaption('');
      setNewPostImage(null);
      loadPosts(1);
      setPage(1);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUploading(false); }
  };

  return (
    <div className='feed'>
      <Stories onViewProfile={onViewProfile} refreshKey={storiesKey} />

      <div className='feed-create-post'>
        <div className='feed-create-post-inner' onClick={() => setShowPostModal(true)}>
          <div className='feed-create-avatar'>
            <img src={userAvatar} alt="" />
          </div>
          <div className='feed-create-input'>Write a post...</div>
        </div>
      </div>

      <div className='feed-posts'>
        {likedPostIds === null ? (
          <div className='feed-loader'>
            <div className='loading-spinner'></div>
            <span>Loading...</span>
          </div>
        ) : posts.map((post, idx) => (
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
              time: post.created_at ? new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'
            }}
            onViewProfile={onViewProfile}
            initialLiked={likedPostIds.has(Number(post.id))}
            reactionsList={reactionsList}
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

      {showPostModal && (
        <div className='modal-overlay' onClick={() => setShowPostModal(false)}>
          <div className='modal-content' onClick={e => e.stopPropagation()}>
            <div className='modal-header'>
              <h3>Create New Post</h3>
              <button className='modal-close' onClick={() => setShowPostModal(false)}>✕</button>
            </div>
            <div className='modal-body'>
              {newPostImage ? (
                <div className='post-preview'>
                  <img src={URL.createObjectURL(newPostImage)} alt="Preview" />
                  <button className='change-image-btn' onClick={() => setNewPostImage(null)}>Change</button>
                </div>
              ) : (
                <div className='upload-area' onClick={() => postInputRef.current?.click()}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>Click to upload a photo</p>
                </div>
              )}
              <input type="file" ref={postInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => setNewPostImage(e.target.files[0])} />
              <textarea className='caption-input' placeholder="Write a caption..." value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} rows={3} />
            </div>
            <div className='modal-footer'>
              <button className='cancel-btn' onClick={() => setShowPostModal(false)}>Cancel</button>
              <button className='submit-post-btn' onClick={handleCreatePost} disabled={(!newPostImage && !newPostCaption.trim()) || uploading}>
                {uploading ? 'Uploading...' : 'Share Post'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Feed;