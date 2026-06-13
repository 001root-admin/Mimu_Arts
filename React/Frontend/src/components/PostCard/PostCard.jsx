import React, { useState, useRef, useEffect, useCallback } from 'react';
import { api, getServerUrl } from '../../api/api';
import { assets } from '../../assets/assets';
import './PostCard.css';

const REACTIONS = ['\u2764\uFE0F', '\uD83D\uDD25', '\uD83D\uDE02', '\uD83D\uDE0D', '\uD83D\uDC4D', '\uD83D\uDE2E'];
const API_BASE = getServerUrl();

const PostCard = ({ post, onViewProfile, initialLiked = false, currentUserId, onDelete, reactionsList }) => {
  const customReactions = reactionsList || REACTIONS;

  const [liked, setLiked] = useState(initialLiked);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(post.likes_count || post.likes || 0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [selectedReaction, setSelectedReaction] = useState('');
  const [showReactionsDropdown, setShowReactionsDropdown] = useState(false);
  const [reactionsData, setReactionsData] = useState({ reactions: [], total: 0, myReaction: '' });
  const optionsRef = useRef(null);
  const commentInputRef = useRef(null);
  const likeContainerRef = useRef(null);
  const reactionBarRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Load reactions from server on mount
  useEffect(() => {
    const loadReactions = async () => {
      try {
        const data = await api.getReactions(post.id);
        setReactionsData(data);
        if (data.myReaction) {
          setReaction(data.myReaction);
          setLiked(true);
        }
      } catch {}
    };
    loadReactions();
  }, [post.id]);

  useEffect(() => {
    const handleClick = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) setShowOptions(false);
      if (likeContainerRef.current && !likeContainerRef.current.contains(e.target)) setShowReactions(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, []);

  useEffect(() => {
    return () => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); };
  }, []);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => alert('Link copied!')).catch(() => {});
    setShowOptions(false);
  };

  const handleReport = () => {
    alert('Post reported. Thank you for your feedback.');
    setShowOptions(false);
  };

  const handleSave = () => {
    alert('Post saved!');
    setShowOptions(false);
  };

  const handleDelete = () => {
    if (window.confirm('Delete this post?')) {
      if (onDelete) onDelete(post.id);
      setShowOptions(false);
    }
  };

  const isOwnPost = currentUserId && post.userId === currentUserId;
  const hasImage = post.image && !post.image.includes('null') && post.image !== API_BASE + '/uploads/undefined' && post.image !== '/uploads/undefined';

  const doLike = useCallback(async (emoji) => {
    if (post.id) {
      try {
        const res = await api.toggleLike(post.id, emoji);
        setLiked(res.liked);
        setLikes(prev => res.liked ? prev + 1 : prev - 1);
        setReaction(res.reaction || '');
        const data = await api.getReactions(post.id);
        setReactionsData(data);
      } catch {}
    }
  }, [post.id]);

  const handleReactionSelect = (emoji) => {
    setShowReactions(false);
    if (emoji === reaction) {
      doLike('');
    } else {
      setReaction(emoji);
      if (!liked) doLike(emoji);
      else {
        (async () => {
          try {
            await api.toggleLike(post.id, emoji);
            const data = await api.getReactions(post.id);
            setReactionsData(data);
          } catch {}
        })();
      }
    }
  };

  const handleLikeClick = () => {
    doLike('');
  };

  const showReactionsWithDelay = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setShowReactions(true);
  };

  const hideReactionsWithDelay = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      if (!isDragging) setShowReactions(false);
    }, 400);
  };

  // Mobile: long press + drag
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    const timer = setTimeout(() => {
      setShowReactions(true);
      setIsDragging(true);
      setDragX(0);
      setSelectedReaction('');
      // Lock scroll without jumping to top
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }, 300);
    setLongPressTimer(timer);
  };

  const handleTouchMove = (e) => {
    if (!isDragging && !showReactions) {
      const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dx > 10 || dy > 10) {
        if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
      }
      return;
    }
    // Prevent page scroll while selecting reaction
    e.preventDefault();
    e.stopPropagation();
    if (isDragging || showReactions) {
      const dx = e.touches[0].clientX - touchStartX.current;
      setDragX(dx);
      const emojiWidth = 44;
      const index = Math.round(dx / emojiWidth);
      const clampedIndex = Math.max(0, Math.min(customReactions.length - 1, index));
      setSelectedReaction(customReactions[clampedIndex]);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
    // Unlock scroll
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
    if (isDragging || showReactions) {
      if (selectedReaction) {
        handleReactionSelect(selectedReaction);
      }
      setIsDragging(false);
      setDragX(0);
      setSelectedReaction('');
      setShowReactions(false);
    }
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
    } catch (err) { console.error('Comment failed:', err); }
    finally { setCommenting(false); }
  };

  const loadComments = async () => {
    if (!post.id) return;
    try { const data = await api.getComments(post.id); setComments(data); setShowComments(!showComments); } catch {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); if (commentInputRef.current) commentInputRef.current.focus(); }
  };

  const loadReactionsDropdown = async () => {
    if (showReactionsDropdown) { setShowReactionsDropdown(false); return; }
    try {
      const data = await api.getReactions(post.id);
      setReactionsData(data);
      setShowReactionsDropdown(true);
    } catch {}
  };

  return (
    <div className='post-card'>
      <div className='post-header'>
        <div className='post-user'>
          <div className='post-avatar' onClick={() => onViewProfile && onViewProfile(post.userId)} style={{ cursor: 'pointer' }}>
            <img src={post.avatar && !post.avatar.includes('default') ? post.avatar : assets.profilepic} alt={post.username} />
          </div>
          <div className='post-user-info'>
            <span className='post-username username-link' onClick={() => onViewProfile && onViewProfile(post.userId)}>
              {post.username}
            </span>
            <span className='post-date-sub'>{post.time}</span>
          </div>
        </div>
        <div className='post-options-wrapper' ref={optionsRef}>
          <button className='post-options' onClick={() => setShowOptions(!showOptions)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
            </svg>
          </button>
          {showOptions && (
            <div className='post-options-dropdown'>
              {isOwnPost && (
                <button className='post-option-item post-option-danger' onClick={handleDelete}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete post
                </button>
              )}
              <button className='post-option-item' onClick={handleSave}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                Save post
              </button>
              <button className='post-option-item' onClick={handleShare}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                Share post
              </button>
              <button className='post-option-item' onClick={handleReport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                Report post
              </button>
            </div>
          )}
        </div>
      </div>

      {post.caption && (
        <div className='post-caption-top'>
          <span className='caption-text'>{post.caption}</span>
        </div>
      )}

      {hasImage && (
        <div className='post-image'>
          <img src={post.image} alt={post.caption} />
        </div>
      )}

      <div className='post-actions'>
        <div className='actions-left'>
          <div className='like-container'
            ref={likeContainerRef}
            onMouseEnter={showReactionsWithDelay}
            onMouseLeave={hideReactionsWithDelay}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <button className={'action-btn like-btn' + (liked ? ' liked' : '')} onClick={handleLikeClick}>
              {liked && reaction ? (
                <span className='reaction-emoji'>{reaction}</span>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              )}
            </button>
            {showReactions && (
              <>
                <div className='reaction-backdrop' onClick={() => setShowReactions(false)} />
                <div className='reaction-popup'
                  ref={reactionBarRef}
                  onMouseEnter={showReactionsWithDelay}
                  onMouseLeave={hideReactionsWithDelay}
                >
                  {customReactions.map(emoji => (
                    <button key={emoji}
                      className={'reaction-btn' + (reaction === emoji ? ' active' : '') + (selectedReaction === emoji && isDragging ? ' dragging' : '')}
                      onClick={(e) => { e.stopPropagation(); handleReactionSelect(emoji); }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </>
            )}
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
          <button className={'action-btn' + (saved ? ' saved' : '')} onClick={() => setSaved(!saved)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      {reactionsData.total > 0 && (
        <div className='post-reactions-summary' onClick={loadReactionsDropdown} style={{ cursor: 'pointer' }}>
          <span className='reactions-summary-emojis'>
            {reactionsData.reactions.slice(0, 3).map(r => r.emoji).join('')}
          </span>
          <span className='reactions-summary-count'>{reactionsData.total}</span>
        </div>
      )}

      {showReactionsDropdown && (
        <div className='reactions-dropdown'>
          <div className='reactions-dropdown-header'>
            <span>Reactions</span>
            <button className='reactions-dropdown-close' onClick={() => setShowReactionsDropdown(false)}>{'\u2715'}</button>
          </div>
          <div className='reactions-dropdown-tabs'>
            <button className='reactions-tab active'>All ({reactionsData.total})</button>
          </div>
          <div className='reactions-dropdown-list'>
            {reactionsData.reactions.map(group => (
              <div key={group.emoji} className='reactions-dropdown-group'>
                <div className='reactions-group-header'>
                  <span className='reactions-group-emoji'>{group.emoji}</span>
                  <span className='reactions-group-count'>{group.count}</span>
                </div>
                <div className='reactions-group-users'>
                  {group.users.map(u => (
                    <div key={u.id} className='reactions-user-item' onClick={() => { setShowReactionsDropdown(false); onViewProfile && onViewProfile(u.id); }}>
                      <img src={u.avatar && !u.avatar.includes('default') ? API_BASE + u.avatar : assets.profilepic} alt={u.username} className='reactions-user-avatar' />
                      <span className='reactions-user-name'>{u.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='post-comments' onClick={loadComments} style={{ cursor: 'pointer' }}>
        <span>View all {post.comments_count || post.comments || 0} comments</span>
      </div>

      {showComments && (
        <div className='comments-section'>
          {comments.length === 0 ? (
            <div className='no-comments'>No comments yet. Be the first!</div>
          ) : (
            comments.map((c, i) => (
              <div key={c.id || i} className='comment-item'>
                <img src={c.avatar && !c.avatar.includes('default') ? API_BASE + c.avatar : assets.profilepic} alt={c.username} className='comment-avatar'
                  onClick={() => onViewProfile && onViewProfile(c.user_id)} style={{ cursor: 'pointer' }} />
                <div className='comment-body'>
                  <span className='comment-username username-link' onClick={() => onViewProfile && onViewProfile(c.user_id)}>{c.username}</span>
                  <span className='comment-text'>{c.text}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <div className='add-comment'>
        <img src={post.avatar && !post.avatar.includes('default') ? post.avatar : assets.profilepic} alt="" className='comment-input-avatar' />
        <input ref={commentInputRef} type="text" placeholder="Add a comment..." value={commentText}
          onChange={e => setCommentText(e.target.value)} onKeyDown={handleKeyDown} />
        <button className='post-btn' onClick={handleComment} disabled={!commentText.trim() || commenting}>
          {commenting ? '...' : 'Post'}
        </button>
      </div>
    </div>
  );
};

export default PostCard;