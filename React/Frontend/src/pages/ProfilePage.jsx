import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFollow } from '../context/FollowContext';
import { api, getServerUrl } from '../api/api';
import { assets } from '../assets/assets';
import PostCard from '../components/PostCard/PostCard';
import './ProfilePage.css';

const API_BASE = getServerUrl();

const UserCard = ({ user, onViewProfile }) => {
  const avatar = user.avatar && !user.avatar.includes('default')
    ? `${API_BASE}${user.avatar}` : assets.profilepic;
  return (
    <div className='user-list-card' onClick={() => onViewProfile && onViewProfile(user.id)}>
      <img src={avatar} alt={user.username} className='user-list-avatar' />
      <div className='user-list-info'>
        <div className='user-list-username username-link'>{user.username}</div>
        <div className='user-list-display'>{user.display_name || user.bio || ''}</div>
      </div>
    </div>
  );
};

const ProfilePage = ({ userId, onBack, onViewProfile }) => {
  const { user: me } = useAuth();
  const { followingIds, setFollowing } = useFollow();
  const fileInputRef = useRef();
  const bannerInputRef = useRef();
  const postInputRef = useRef();
  const storyInputRef = useRef();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryImage, setNewStoryImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingIntro, setEditingIntro] = useState(false);
  const [editBioText, setEditBioText] = useState('');
  const [editNameText, setEditNameText] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editWork, setEditWork] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editSocialLinks, setEditSocialLinks] = useState('{}');
  const [activeTab, setActiveTab] = useState('all');
  const [friends, setFriends] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [bannerThemeOn, setBannerThemeOn] = useState(true);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [isAutoPhotos, setIsAutoPhotos] = useState(true);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [bannerTs, setBannerTs] = useState(0);
  const moreMenuRef = useRef(null);
  const profileMenuRef = useRef(null);
  const isOwnProfile = !userId || userId === me?.id;

  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else if (onBack) onBack();
  };

  const loadProfile = useCallback(() => {
    const id = userId || me?.id;
    if (!id) return;
    api.getUser(id).then(u => {
      setProfile(u);
      setFollowersCount(u.followers_count);
      setFollowingCount(u.following_count);
      setEditBioText(u.bio || '');
      setEditNameText(u.display_name || u.username);
    });
    api.getUserPosts(id).then(setPosts);
    api.getFeaturedPhotos(id).then(d => {
      setFeaturedPhotos(d.photos || []);
      setIsAutoPhotos(d.isAuto !== false);
    });
  }, [userId, me]);

  const loadLists = useCallback(() => {
    const id = userId || me?.id;
    if (!id) return;
    api.getFriends(id).then(d => setFriends(d.users || [])).catch(() => setFriends([]));
    api.getFollowing(id).then(d => setFollowingList(d.users || [])).catch(() => setFollowingList([]));
    api.getFollowers(id).then(d => setFollowersList(d.users || [])).catch(() => setFollowersList([]));
  }, [userId, me]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { loadLists(); }, [loadLists]);

  useEffect(() => {
    const handleClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) setShowMoreMenu(false);
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setShowProfileMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isOwnProfile) return;
    api.getBannerTheme().then(on => {
      setBannerThemeOn(on);
      document.documentElement.classList.toggle('banner-theme-off', !on);
    }).catch(() => {});
  }, [isOwnProfile]);

  const handleToggleBannerTheme = async () => {
    const next = !bannerThemeOn;
    setBannerThemeOn(next);
    document.documentElement.classList.toggle('banner-theme-off', !next);
    try { await api.setBannerTheme(next); } catch {}
  };

  const isFollowing = !!profile && !isOwnProfile && followingIds.has(profile.id);

  const handleFollow = async () => {
    if (!profile || isOwnProfile) return;
    const wasFollowing = isFollowing;
    setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
    try { await setFollowing(profile.id, !wasFollowing); } catch {}
    loadLists();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    await api.uploadAvatar(formData);
    loadProfile();
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('banner', file);
      const res = await api.uploadBanner(formData);
      if (res?.banner) { setProfile(prev => prev ? { ...prev, banner: res.banner } : prev); setBannerTs(Date.now()); }
      loadProfile();
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert('Banner upload failed: ' + (err.message || 'unknown error'));
    } finally { setUploading(false); }
  };

  const handleSaveBio = async () => {
    await api.updateProfile({ display_name: editNameText, bio: editBioText });
    setEditingBio(false);
    loadProfile();
  };

  const handleCreatePost = async () => {
    if (!newPostCaption && !newPostImage) return alert('Add a caption or photo');
    setUploading(true);
    try {
      const formData = new FormData();
      if (newPostImage) formData.append('image', newPostImage);
      formData.append('caption', newPostCaption || '');
      await api.createPost(formData);
      setShowPostModal(false);
      setNewPostCaption('');
      setNewPostImage(null);
      loadProfile();
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleCreateStory = async () => {
    if (!newStoryImage) return alert('Select an image for your story');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', newStoryImage);
      formData.append('caption', newStoryCaption || '');
      await api.uploadStory(formData);
      setShowStoryModal(false);
      setNewStoryCaption('');
      setNewStoryImage(null);
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUploading(false); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    await api.deletePost(postId);
    loadProfile();
  };

  const openPhotoSelector = () => { setSelectedPhotoIds(featuredPhotos.map(p => p.id)); setShowPhotoSelector(true); };

  const togglePhotoSelection = (photoId) => {
    setSelectedPhotoIds(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  const saveFeaturedPhotos = async () => {
    await api.setFeaturedPhotos(selectedPhotoIds);
    setShowPhotoSelector(false);
    loadProfile();
  };

  const resetFeaturedPhotos = async () => {
    await api.setFeaturedPhotos([]);
    setShowPhotoSelector(false);
    loadProfile();
  };

  const handleShareProfile = () => {
    const url = window.location.origin + `#/profile/${userId || me?.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Profile link copied!')).catch(() => prompt('Copy this profile link:', url));
    setShowProfileMenu(false);
  };

  const handleReportProfile = () => { alert('Profile reported.'); setShowProfileMenu(false); };

  const handleBlockProfile = () => {
    if (window.confirm(`Block ${profile?.username}?`)) alert(`${profile?.username} has been blocked.`);
    setShowProfileMenu(false);
  };

  const handleDeactivate = () => {
    if (window.confirm('Deactivate your account?')) alert('Account deactivated.');
    setShowProfileMenu(false);
  };

  if (!profile) return <div className='profile-loading'><div className='loading-spinner'></div></div>;

  const avatarSrc = profile.avatar && !profile.avatar.includes('default') ? `${API_BASE}${profile.avatar}` : assets.profilepic;
  const bannerSrc = profile.banner && !profile.banner.includes('default') ? `${API_BASE}${profile.banner}${bannerTs ? '?t=' + bannerTs : ''}` : null;
  const joinDate = profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '';

  const renderAllTab = () => (
    <div className='profile-all-layout'>
      <div className='profile-sidebar'>
        <div className='sidebar-card'>
          <div className='sidebar-card-header'>
            <span>Intro</span>
            {isOwnProfile && !editingIntro && (
              <button className='sidebar-card-edit-btn' onClick={() => { 
                setEditingIntro(true); setEditBioText(profile.bio||''); setEditBirthday(profile.birthday||''); setEditSchool(profile.school||''); setEditWork(profile.work||''); setEditLocation(profile.location||''); setEditRelationship(profile.relationship_status||''); setEditWebsite(profile.website||''); 
                let sl = {}; try { sl = typeof profile.social_links === 'string' ? JSON.parse(profile.social_links||'{}') : (profile.social_links||{}); } catch {} 
                const slStr = Object.entries(sl).map(([k,v])=>`${k}:${v}`).join(','); setEditSocialLinks(slStr||'');
              }} title='Edit intro'>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              </button>
            )}
          </div>
          <div className='sidebar-card-body'>
            {editingIntro && isOwnProfile ? (
              <div className='intro-edit-form'>
                <textarea className='bio-textarea' value={editBioText} onChange={e => setEditBioText(e.target.value)} placeholder="Bio..." rows={2} maxLength={150} style={{marginBottom:'8px'}} />
                <input className='intro-edit-input' type="text" value={editBirthday} onChange={e => setEditBirthday(e.target.value)} placeholder="Birthday (e.g. Jan 15, 2000)" />
                <input className='intro-edit-input' type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="School / University" />
                <input className='intro-edit-input' type="text" value={editWork} onChange={e => setEditWork(e.target.value)} placeholder="Work / Company" />
                <input className='intro-edit-input' type="text" value={editLocation} onChange={e => setEditLocation(e.target.value)} placeholder="Location / City" />
                <select className='intro-edit-input' value={editRelationship} onChange={e => setEditRelationship(e.target.value)}>
                  <option value="">Relationship status...</option>
                  <option value="Single">Single</option>
                  <option value="In a relationship">In a relationship</option>
                  <option value="Engaged">Engaged</option>
                  <option value="Married">Married</option>
                  <option value="It's complicated">It's complicated</option>
                </select>
                <input className='intro-edit-input' type="url" value={editWebsite} onChange={e => setEditWebsite(e.target.value)} placeholder="Website URL (add as many as needed, separated by space)" />
                <input className='intro-edit-input' type="text" value={editSocialLinks} onChange={e => setEditSocialLinks(e.target.value)} placeholder='Social links (e.g. instagram:https://instagram.com, twitter:https://twitter.com)' />
                <small className='intro-edit-hint'>Social links format: platform:URL (comma separated for multiple)</small>
                <div className='intro-edit-social-chips'>
                  {['instagram','twitter','tiktok','youtube','github','facebook','discord','linkedin'].map(platform => (
                    <label key={platform} className='intro-social-chip'>
                      <input type='checkbox' checked={editSocialLinks.toLowerCase().includes(platform)} onChange={(e) => {
                        if (e.target.checked) {
                          const url = `https://${platform}.com`;
                          setEditSocialLinks(prev => prev ? prev + `,${platform}:${url}` : `${platform}:${url}`);
                        } else {
                          const entries = editSocialLinks.split(',').filter(e => !e.toLowerCase().startsWith(platform + ':'));
                          setEditSocialLinks(entries.join(','));
                        }
                      }} />
                      <span>{platform}</span>
                    </label>
                  ))}
                </div>
                <div className='bio-edit-actions'>
                  <button className='cancel-bio-btn' onClick={() => setEditingIntro(false)}>Cancel</button>
                  <button className='save-bio-btn' onClick={async () => {
                    const socialLinksObj = {};
                    editSocialLinks.split(',').filter(Boolean).forEach(entry => {
                      const [platform, url] = entry.split(':');
                      if (platform && url) socialLinksObj[platform.trim()] = url.trim();
                    });
                    await api.updateProfile({ bio: editBioText, birthday: editBirthday, school: editSchool, work: editWork, location: editLocation, relationship_status: editRelationship, website: editWebsite, social_links: socialLinksObj });
                    setEditingIntro(false); loadProfile();
                  }}>Save</button>
                </div>
              </div>
            ) : (
              <>
                {profile.bio ? <p className='sidebar-bio'>{profile.bio}</p> : <p className='sidebar-bio sidebar-bio-empty'>{isOwnProfile ? 'Add a bio to tell people about yourself.' : `${profile.username} hasn't added a bio yet.`}</p>}
                <div className='sidebar-info-list'>
                  <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><span>Joined {joinDate}</span></div>
                  <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>@{profile.username}</span></div>
                  {profile.birthday && <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M6 10h12M6 14h12M6 18h12M4 6h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/></svg><span>🎂 {profile.birthday}</span></div>}
                  {profile.school && <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5"/></svg><span>🎓 {profile.school}</span></div>}
                  {profile.work && <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg><span>💼 {profile.work}</span></div>}
                  {profile.location && <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg><span>📍 {profile.location}</span></div>}
                  {profile.relationship_status && <div className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>💕 {profile.relationship_status}</span></div>}
                  {profile.website && profile.website.split(' ').filter(Boolean).map((url, i) => (
                    <div key={i} className='sidebar-info-row'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg><span><a href={url} target="_blank" rel="noopener noreferrer">{url}</a></span></div>
                  ))}
                  {profile.social_links && (() => {
                    let links = {};
                    try { links = typeof profile.social_links === 'string' ? JSON.parse(profile.social_links) : profile.social_links; } catch {}
                    return Object.entries(links).map(([platform, url]) => (
                      <div key={platform} className='sidebar-info-row'>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span><a href={url} target="_blank" rel="noopener noreferrer">{platform}</a></span>
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
        <div className='sidebar-card'>
          <div className='sidebar-card-header'><span>Photos</span>{isOwnProfile && <button className='sidebar-card-edit-btn' onClick={openPhotoSelector} title='Edit featured photos'><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg></button>}</div>
          <div className='sidebar-photos-grid'>
            {featuredPhotos.length === 0 ? <div className='sidebar-photos-empty'>No photos yet</div> : featuredPhotos.slice(0, 9).map(photo => <div key={photo.id} className='sidebar-photo-cell'><img src={`${API_BASE}${photo.image}`} alt='' /></div>)}
          </div>
        </div>
      </div>
      <div className='profile-feed-main'>
        {isOwnProfile && (
          <div className='profile-create-post-bar'>
            <div className='profile-create-post-btn' onClick={() => setShowPostModal(true)}>
              <div className='profile-create-post-icon'>+</div>
              <span>Create a new post</span>
            </div>
            <div className='profile-create-post-btn profile-create-story-btn' onClick={() => setShowStoryModal(true)}>
              <div className='profile-create-post-icon story-icon'>📷</div>
              <span>Post a story</span>
            </div>
          </div>
        )}
        {posts.length === 0 ? (
          <div className='no-posts-feed'>
            <div className='no-posts-icon'>📸</div>
            <h3>No posts yet</h3>
            <p>{isOwnProfile ? 'Click "Create a new post" above to share!' : `${profile.username} hasn't posted yet.`}</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div key={post.id || idx} className='profile-post-wrapper'>
              {isOwnProfile && (
                <button className='profile-post-delete-btn' onClick={() => handleDeletePost(post.id)} title='Delete post'>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              )}
              <PostCard post={{
                id: post.id, userId: post.user_id, user_id: post.user_id, username: post.username,
                location: post.location || 'Unknown', avatar: post.avatar ? `${API_BASE}${post.avatar}` : null,
                image: post.image ? `${API_BASE}${post.image}` : null, likes: post.likes_count || 0,
                caption: post.caption || '', comments: post.comments_count || 0,
                time: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recently'
              }} onViewProfile={onViewProfile} currentUserId={me?.id} onDelete={handleDeletePost} />
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderGalleryTab = () => {
    if (posts.length === 0) return <div className='no-posts'><div className='no-posts-icon'>🖼️</div><h3>No media yet</h3><p>Photos and videos shared by {profile.username} will appear here.</p></div>;
    return <div className='profile-posts-grid'>{posts.map(post => <div key={post.id} className='grid-post'><img src={`${API_BASE}${post.image}`} alt={post.caption} /><div className='grid-post-overlay'><span>❤️ {post.likes_count}</span><span>💬 {post.comments_count}</span></div></div>)}</div>;
  };

  const renderAboutTab = () => (
    <div className='profile-about-section'>
      <div className='about-block'><h3 className='about-heading'>Bio</h3><p className='about-bio'>{profile.bio || (isOwnProfile ? "You haven't written a bio yet." : `${profile.username} hasn't added a bio yet.`)}</p>{isOwnProfile && !editingBio && <button className='about-edit-btn' onClick={() => setEditingBio(true)}>✏️ Edit Bio</button>}</div>
      <div className='about-block'>
        <h3 className='about-heading'>Account</h3>
        <div className='about-info-grid'>
          <div className='about-info-item'><span className='about-info-label'>Username</span><span className='about-info-value username-link'>@{profile.username}</span></div>
          <div className='about-info-item'><span className='about-info-label'>Role</span><span className='about-info-value'>{profile.role === 'admin' ? '🛡️ Admin' : '👤 User'}</span></div>
          <div className='about-info-item'><span className='about-info-label'>Member since</span><span className='about-info-value'>{joinDate || 'Unknown'}</span></div>
          <div className='about-info-item'><span className='about-info-label'>Posts</span><span className='about-info-value'>{posts.length}</span></div>
          <div className='about-info-item'><span className='about-info-label'>Followers</span><span className='about-info-value'>{followersCount}</span></div>
          <div className='about-info-item'><span className='about-info-label'>Following</span><span className='about-info-value'>{followingCount}</span></div>
        </div>
      </div>
      {isOwnProfile && editingBio && (
        <div className='about-block'><h3 className='about-heading'>Edit Bio</h3><textarea className='bio-textarea' value={editBioText} onChange={e => setEditBioText(e.target.value)} placeholder="Tell us about yourself..." rows={3} maxLength={150} /><div className='bio-edit-actions'><button className='cancel-bio-btn' onClick={() => setEditingBio(false)}>Cancel</button><button className='save-bio-btn' onClick={handleSaveBio}>Save</button></div></div>
      )}
    </div>
  );

  const renderListTab = (list, emptyIcon, emptyTitle, emptyMsg) => {
    if (list.length === 0) return <div className='no-posts'><div className='no-posts-icon'>{emptyIcon}</div><h3>{emptyTitle}</h3><p>{emptyMsg}</p></div>;
    return <div className='user-list-grid'>{list.map(u => <UserCard key={u.id} user={u} onViewProfile={onViewProfile} />)}</div>;
  };

  return (
    <div className='profile-page'>
      <div className='profile-cover-wrapper'>
        <div className={`profile-cover ${bannerThemeOn ? '' : 'no-theme'}`} style={bannerSrc ? { background: `url(${bannerSrc}) center/cover` } : {}} onClick={() => isOwnProfile && bannerInputRef.current?.click()}>
          <div className='profile-cover-gradient' style={bannerSrc ? { opacity: bannerThemeOn ? 0.25 : 0 } : {}}></div>
          {isOwnProfile && (
            <>
              <button type='button' className='change-banner-btn' title='Change banner' onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (bannerInputRef.current) bannerInputRef.current.click(); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span className='change-banner-label'>Edit cover photo</span>
              </button>
              <button type='button' className={`banner-theme-toggle ${bannerThemeOn ? 'on' : 'off'}`} title={bannerThemeOn ? 'Theme overlay is ON' : 'Theme overlay is OFF'} onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleToggleBannerTheme(); }}>
                {bannerThemeOn ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
                <span className='banner-theme-toggle-label'>{bannerThemeOn ? 'Theme overlay: ON' : 'Theme overlay: OFF'}</span>
              </button>
              <input type='file' ref={bannerInputRef} style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} accept='image/*' onChange={handleBannerChange} />
            </>
          )}
        </div>
        <div className='profile-avatar-overlap'>
          <div className='profile-avatar-large'><img src={avatarSrc} alt={profile.display_name} />{isOwnProfile && <button className='change-avatar-btn' onClick={() => fileInputRef.current?.click()} title='Change avatar'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></button>}</div>
          {isOwnProfile && <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />}
        </div>
        <div className='profile-identity'>
          <div className='profile-identity-top'>
            <div className='profile-identity-info'>
              <div className='profile-name-row'>
                {editingBio && isOwnProfile ? <input className='edit-name-input' value={editNameText} onChange={e => setEditNameText(e.target.value)} placeholder="Display name" /> : <h1 className='profile-display-name'>{profile.display_name || profile.username}</h1>}
                <span className='profile-username'>@{profile.username}</span>
              </div>
              {editingBio && isOwnProfile ? (
                <div className='bio-edit-area'><textarea className='bio-textarea' value={editBioText} onChange={e => setEditBioText(e.target.value)} placeholder="Tell us about yourself..." rows={3} maxLength={150} /><div className='bio-edit-actions'><button className='cancel-bio-btn' onClick={() => setEditingBio(false)}>Cancel</button><button className='save-bio-btn' onClick={handleSaveBio}>Save</button></div></div>
              ) : profile.bio && <p className='profile-bio'>{profile.bio}</p>}
              <div className='profile-stats'>
                <div className='stat-item stat-clickable' onClick={() => setActiveTab('all')} title="View posts"><span className='stat-number'>{posts.length}</span><span className='stat-label'>Posts</span></div>
                <div className='stat-item stat-clickable' onClick={() => setActiveTab('friends')} title="View friends"><span className='stat-number'>{friends.length}</span><span className='stat-label'>Friends</span></div>
                <div className='stat-item stat-clickable' onClick={() => setActiveTab('followers')} title="View followers"><span className='stat-number'>{followersCount}</span><span className='stat-label'>Followers</span></div>
                <div className='stat-item stat-clickable' onClick={() => setActiveTab('following')} title="View following"><span className='stat-number'>{followingCount}</span><span className='stat-label'>Following</span></div>
              </div>
            </div>
            <div className='profile-actions-right'>
              {!isOwnProfile && <button className={`follow-btn-large ${isFollowing ? 'following' : ''}`} onClick={handleFollow}>{isFollowing ? 'Following' : 'Follow'}</button>}
              {isOwnProfile && !editingBio && <button className='edit-bio-btn' onClick={() => setEditingBio(true)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>Edit Profile</button>}
            </div>
          </div>
        </div>
      </div>

      {/* TABS: All | Gallery | About | More */}
      <div className='profile-tabs'>
        <div className='profile-tabs-left'>
          <button className={`profile-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
          <button className={`profile-tab ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>Gallery</button>
          <button className={`profile-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</button>
          <div className='profile-more-wrapper' ref={moreMenuRef}>
            <button className={`profile-tab profile-more-trigger ${['friends','following','followers'].includes(activeTab) ? 'active' : ''}`} onClick={() => setShowMoreMenu(!showMoreMenu)}>
              More <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {showMoreMenu && (
              <div className='profile-dropdown'>
                <button className={`profile-dropdown-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => { setActiveTab('friends'); setShowMoreMenu(false); }}>Friends <span className='dropdown-count'>{friends.length}</span></button>
                <button className={`profile-dropdown-item ${activeTab === 'following' ? 'active' : ''}`} onClick={() => { setActiveTab('following'); setShowMoreMenu(false); }}>Following <span className='dropdown-count'>{followingList.length}</span></button>
                <button className={`profile-dropdown-item ${activeTab === 'followers' ? 'active' : ''}`} onClick={() => { setActiveTab('followers'); setShowMoreMenu(false); }}>Followers <span className='dropdown-count'>{followersList.length}</span></button>
                <div className='profile-dropdown-divider'></div>
                <button className='profile-dropdown-item' onClick={handleShareProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Share profile</button>
                {!isOwnProfile ? (
                  <>
                    <button className='profile-dropdown-item' onClick={handleReportProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Report profile</button>
                    <button className='profile-dropdown-item profile-dropdown-danger' onClick={handleBlockProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Block profile</button>
                  </>
                ) : (
                  <>
                    <button className='profile-dropdown-item' onClick={() => { window.location.hash = '#/settings'; setShowMoreMenu(false); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</button>
                    <button className='profile-dropdown-item profile-dropdown-danger' onClick={handleDeactivate}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Deactivate account</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className='profile-tabs-right' ref={profileMenuRef}>
          <button className='profile-dots-btn' onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
          </button>
          {showProfileMenu && (
            <div className='profile-dropdown profile-dropdown-right'>
              <button className='profile-dropdown-item' onClick={handleShareProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Share profile</button>
              {!isOwnProfile && (
                <>
                  <button className='profile-dropdown-item' onClick={handleReportProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>Report profile</button>
                  <button className='profile-dropdown-item profile-dropdown-danger' onClick={handleBlockProfile}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>Block profile</button>
                </>
              )}
              {isOwnProfile && (
                <>
                  <button className='profile-dropdown-item' onClick={() => { window.location.hash = '#/settings'; setShowProfileMenu(false); }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.32 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>Settings</button>
                  <button className='profile-dropdown-item profile-dropdown-danger' onClick={handleDeactivate}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Deactivate account</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='profile-tab-content'>
        {activeTab === 'all' && renderAllTab()}
        {activeTab === 'gallery' && renderGalleryTab()}
        {activeTab === 'about' && renderAboutTab()}
        {activeTab === 'friends' && renderListTab(friends, '🤝', 'No friends yet', isOwnProfile ? 'Follow someone and have them follow you back to become friends!' : `${profile.username} has no friends yet.`)}
        {activeTab === 'following' && renderListTab(followingList, '➡️', 'Not following anyone yet', isOwnProfile ? 'Find people to follow from the suggestions panel.' : `${profile.username} isn't following anyone yet.`)}
        {activeTab === 'followers' && renderListTab(followersList, '👥', 'No followers yet', isOwnProfile ? 'Share your profile to gain followers.' : `Be the first to follow ${profile.username}!`)}
      </div>

      {/* Create Post Modal */}
      {showPostModal && (
        <div className='modal-overlay' onClick={() => setShowPostModal(false)}>
          <div className='modal-content' onClick={e => e.stopPropagation()}>
            <div className='modal-header'><h3>Create New Post</h3><button className='modal-close' onClick={() => setShowPostModal(false)}>✕</button></div>
            <div className='modal-body'>
              {newPostImage ? <div className='post-preview'><img src={URL.createObjectURL(newPostImage)} alt="Preview" /><button className='change-image-btn' onClick={() => setNewPostImage(null)}>Change</button></div> : (
                <div className='upload-area' onClick={() => postInputRef.current?.click()}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>Click to upload a photo (optional)</p>
                </div>
              )}
              <input type="file" ref={postInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => setNewPostImage(e.target.files[0])} />
              <textarea className='caption-input' placeholder="What's on your mind?" value={newPostCaption} onChange={e => setNewPostCaption(e.target.value)} rows={3} />
            </div>
            <div className='modal-footer'>
              <button className='cancel-btn' onClick={() => setShowPostModal(false)}>Cancel</button>
              <button className='submit-post-btn' onClick={handleCreatePost} disabled={uploading}>
                {uploading ? 'Uploading...' : (newPostImage ? 'Share Post' : 'Publish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Story Modal */}
      {showStoryModal && (
        <div className='modal-overlay' onClick={() => setShowStoryModal(false)}>
          <div className='modal-content' onClick={e => e.stopPropagation()}>
            <div className='modal-header'><h3>Post a Story</h3><button className='modal-close' onClick={() => setShowStoryModal(false)}>✕</button></div>
            <div className='modal-body'>
              {newStoryImage ? <div className='post-preview'><img src={URL.createObjectURL(newStoryImage)} alt="Preview" /><button className='change-image-btn' onClick={() => setNewStoryImage(null)}>Change</button></div> : (
                <div className='upload-area' onClick={() => storyInputRef.current?.click()}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  <p>Click to upload a photo for your story</p>
                </div>
              )}
              <input type="file" ref={storyInputRef} style={{ display: 'none' }} accept="image/*" onChange={e => setNewStoryImage(e.target.files[0])} />
              <textarea className='caption-input' placeholder="Add a caption..." value={newStoryCaption} onChange={e => setNewStoryCaption(e.target.value)} rows={2} />
            </div>
            <div className='modal-footer'>
              <button className='cancel-btn' onClick={() => setShowStoryModal(false)}>Cancel</button>
              <button className='submit-post-btn' onClick={handleCreateStory} disabled={!newStoryImage || uploading}>
                {uploading ? 'Uploading...' : 'Post Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPhotoSelector && (
        <div className='modal-overlay' onClick={() => setShowPhotoSelector(false)}>
          <div className='modal-content photo-selector-modal' onClick={e => e.stopPropagation()}>
            <div className='modal-header'><h3>Edit Featured Photos</h3><button className='modal-close' onClick={() => setShowPhotoSelector(false)}>✕</button></div>
            <div className='modal-body'>
              <p className='photo-selector-hint'>Select up to 9 photos to feature on your profile. {isAutoPhotos ? 'Currently showing your most recent photos.' : 'Currently showing your selected photos.'}</p>
              <div className='photo-selector-grid'>
                {posts.map(post => (
                  <div key={post.id} className={`photo-selector-item ${selectedPhotoIds.includes(post.id) ? 'selected' : ''}`} onClick={() => togglePhotoSelection(post.id)}>
                    <img src={`${API_BASE}${post.image}`} alt='' />
                    <div className='photo-selector-check'>{selectedPhotoIds.includes(post.id) && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                  </div>
                ))}
                {posts.length === 0 && <div className='photo-selector-empty'>No posts to select from yet.</div>}
              </div>
            </div>
            <div className='modal-footer'>
              <button className='cancel-btn' onClick={resetFeaturedPhotos}>Reset to Recent</button>
              <button className='submit-post-btn' onClick={saveFeaturedPhotos}>Save Selection</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;