import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/api';
import { useAuth } from './AuthContext';

const FollowContext = createContext(null);

export function FollowProvider({ children }) {
  const { user: me } = useAuth();
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // Load fresh from server whenever the user changes
  const refresh = useCallback(async () => {
    if (!me?.id) { setFollowingIds(new Set()); setLoaded(true); return; }
    try {
      const ids = await api.getMyFollowingIds();
      setFollowingIds(new Set(ids || []));
    } catch { setFollowingIds(new Set()); }
    setLoaded(true);
  }, [me?.id]);

  useEffect(() => { setLoaded(false); refresh(); }, [refresh]);

  // Listen for cross-component follow events (so ProfilePage updates when
  // Sidebar's follow button is clicked, and vice versa).
  useEffect(() => {
    const handler = (e) => {
      const { userId, following } = e.detail || {};
      if (typeof userId !== 'number') return;
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (following) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };
    window.addEventListener('mimis:follow-changed', handler);
    return () => window.removeEventListener('mimis:follow-changed', handler);
  }, []);

  const setFollowing = useCallback(async (userId, isFollowing) => {
    // Optimistic update
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) next.add(userId);
      else next.delete(userId);
      return next;
    });
    // Persist to server via toggleFollow (so server state is the source of truth)
    try {
      const res = await api.toggleFollow(userId);
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (res.following) next.add(userId);
        else next.delete(userId);
        return next;
      });
      // Broadcast so any other mounted component updates too
      window.dispatchEvent(new CustomEvent('mimis:follow-changed', {
        detail: { userId, following: res.following }
      }));
      return res.following;
    } catch (err) {
      // Revert on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isFollowing) next.delete(userId);
        else next.add(userId);
        return next;
      });
      throw err;
    }
  }, []);

  return (
    <FollowContext.Provider value={{ followingIds, setFollowing, refresh, loaded }}>
      {children}
    </FollowContext.Provider>
  );
}

export function useFollow() {
  const ctx = useContext(FollowContext);
  if (!ctx) throw new Error('useFollow must be used within FollowProvider');
  return ctx;
}
