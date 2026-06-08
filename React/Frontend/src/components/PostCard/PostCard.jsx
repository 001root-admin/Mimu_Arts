import React, { useState, useRef } from 'react';
import { api } from '../../api/api';
import { assets } from '../../assets/assets';
import './PostCard.css';

const REACTIONS = ['❤️', '🔥', '😂', '😍', '👍', '😮'];

const PostCard = ({ post, onViewProfile }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState('');
  const commentInputRef = useRef(null);

  const handleLike = async () => {
    if (post.id) {
      try {
        const res = await api.toggleLike(post.id);
        setLiked(res.liked);
        setLikes(prev => res.liked ? prev + 1 : prev - 1);
        return;
      } catch {}
    }
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post.id) return;
    setCommenting(true);
    try {
      await api.addComment(post.id, commentText);
      setCommentText('');
      const updatedComments = await api.getComments(post.id);
      setComments(updatedComments);
      setShowComments(true);
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setCommenting(false);
    }
  };

  const loadComments = async () => {
    if (!post.id) return;
    try {
      const data = await api.getComments(post.id);
      setComments(data);
      setShowComments(!showComments);
    } catch {}
  };

  const handleReaction = (emoji) => {
    setReaction(emoji === reaction ? '' : emoji);
    setShowReactions(false);
    if (emoji !== reaction && post.id) {
      handleLike();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleComment();
      if (commentInputRef.current) commentInputRef.current.focus();
    }
  };

  return (
    <div className='post-card'>
      <div className='post-header'>
        <div className='post-user'>
          <div className='post-avatar' onClick={() => onViewProfile && onViewProfile(post.userId)} style={{ cursor: 'pointer' }}>
            <img src={post.avatar} alt={post.username} />
          </div>
          <div className='post-user-info'>
            <span className='post-username' onClick={() => onViewProfile && onViewProfile(post.userId)} style={{ cursor: 'pointer' }}>
              {post.username}
            </span>
            <span className='post-location'>{post.location}</span>
          </div>
        </div>
        <button className='post-options'>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
          </svg>
        </button>
      </div>

      <div className='post-image'>
        <img src={post.image} alt={post.caption} />
      </div>

      <div className='post-actions'>
        <div className='actions-left'>
          <div className='like-container'>
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </button>
            <div className='reaction-picker' onClick={() => setShowReactions(!showReactions)}>
              {reaction || <span className='reaction-trigger'>😊</span>}
              {showReactions && (
                <div className='reaction-popup'>
                  {REACTIONS.map(emoji => (
                    <button key={emoji} className={`reaction-btn ${reaction === emoji ? 'active' : ''}`} onClick={() => handleReaction(emoji)}>
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className='action-btn' onClick={loadComments}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className='action-btn'>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </button>
        </div>
        <div className='actions-right'>
          <button className={`action-btn ${saved ? 'saved' : ''}`} onClick={() => setSaved(!saved)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {reaction && <div className='post-reaction'>Reacted with {reaction}</div>}

      <div className='post-likes'>
        <span>{likes.toLocaleString()} likes</span>
      </div>

      <div className='post-caption'>
        <span className='caption-username' onClick={() => onViewProfile && onViewProfile(post.userId)} style={{ cursor: 'pointer' }}>{post.username}</span>
        <span className='caption-text'>{post.caption}</span>
      </div>

      <div className='post-comments' onClick={loadComments} style={{ cursor: 'pointer' }}>
        <span>View all {post.comments} comments</span>
      </div>

      {showComments && (
        <div className='comments-section'>
          {comments.length === 0 ? (
            <div className='no-comments'>No comments yet. Be the first!</div>
          ) : (
            comments.map((c, i) => (
              <div key={c.id || i} className='comment-item'>
                <img 
                  src={c.avatar && !c.avatar.includes('default') ? `http://localhost:5000${c.avatar}` : assets.profilepic} 
                  alt={c.username} 
                  className='comment-avatar'
                  onClick={() => onViewProfile && onViewProfile(c.user_id)}
                  style={{ cursor: 'pointer' }}
                />
                <div className='comment-body'>
                  <span className='comment-username' onClick={() => onViewProfile && onViewProfile(c.user_id)} style={{ cursor: 'pointer' }}>
                    {c.username}
                  </span>
                  <span className='comment-text'>{c.text}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className='post-time'>
        <span>{post.time}</span>
      </div>

      <div className='add-comment'>
        <img src={post.avatar} alt="" className='comment-input-avatar' />
        <input 
          ref={commentInputRef}
          type="text" 
          placeholder="Add a comment..." 
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className='post-btn' onClick={handleComment} disabled={!commentText.trim() || commenting}>
          {commenting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default PostCard;