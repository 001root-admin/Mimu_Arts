// Detect if running in Capacitor (mobile) or browser
const isCapacitor = () => {
  try {
    return window.location.protocol === 'capacitor:';
  } catch {
    return false;
  }
};

// Configure API base URL:
// 1. Check localStorage for custom server URL (settable by admin)
// 2. Auto-detect when accessed from another device on LAN
// 3. Check window.__API_BASE__ (injected via env variable during build)
// 4. Default based on platform
const getApiBase = () => {
  const savedUrl = localStorage.getItem('mimis_server_url');
  if (savedUrl) return savedUrl;
  
  if (typeof window !== 'undefined' && window.__API_BASE__) {
    return window.__API_BASE__;
  }
  
  // Auto-detect: if accessed from a non-local IP, use the same host as the web page
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If on a real network IP (not localhost/127.0.0.1), connect to backend on same host
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '10.0.2.2') {
      return `http://${hostname}:5000`;
    }
  }
  
  // Default: Android emulator -> host machine's localhost
  if (isCapacitor()) {
    return 'http://10.0.2.2:5000';
  }
  // LAN: Use your computer's local IP for testing on real devices
  return 'https://mimu-arts-backend.onrender.com';
};

const API_URL = `${getApiBase()}/api`;

const getToken = () => localStorage.getItem('mimis_token');
const setToken = (token) => localStorage.setItem('mimis_token', token);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

// Utility to set custom server URL
export const setServerUrl = (url) => {
  localStorage.setItem('mimis_server_url', url);
  window.location.reload();
};

export const getServerUrl = () => getApiBase();

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    return data;
  },
  async register(username, email, password, display_name) {
    const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, email, password, display_name }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setToken(data.token);
    return data;
  },
  async getMe() {
    const res = await fetch(`${API_URL}/users/me`, { headers: authHeaders() });
    return res.json();
  },
  async updateProfile(data) {
    const res = await fetch(`${API_URL}/users/me`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    return res.json();
  },
  async uploadAvatar(formData) {
    const res = await fetch(`${API_URL}/users/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    return res.json();
  },
  async uploadBanner(formData) {
    const res = await fetch(`${API_URL}/users/banner`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Banner upload failed');
    return data;
  },
  async hasCustomTheme(userId) {
    try {
      const res = await fetch(`${API_URL}/users/${userId}/has-custom-theme`);
      const data = await res.json();
      return data.hasCustomTheme === true;
    } catch { return false; }
  },
  async getStories() {
    const res = await fetch(`${API_URL}/stories`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  async uploadStory(formData) {
    const res = await fetch(`${API_URL}/stories`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  async getSuggestedUsers() {
    try {
      const data = await this.getAllUsers();
      return data.users || [];
    } catch { return []; }
  },
  async getAllUsers(limit = 50, search = '') {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    if (search) params.set('search', search);
    const res = await fetch(`${API_URL}/users?${params.toString()}`);
    if (!res.ok) return { users: [], total: 0 };
    return res.json();
  },
  async setTheme(theme) {
    const res = await fetch(`${API_URL}/users/theme`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ theme }) });
    return res.json();
  },
  async getCustomTheme() {
    const res = await fetch(`${API_URL}/users/theme/custom`, { headers: authHeaders() });
    return res.json();
  },
  async saveCustomTheme(theme) {
    const res = await fetch(`${API_URL}/users/theme/custom`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(theme) });
    return res.json();
  },
  async getThemes() {
    const res = await fetch(`${API_URL}/themes`, { headers: authHeaders() });
    return res.json();
  },
  async getPosts(page = 1) {
    const res = await fetch(`${API_URL}/posts?page=${page}`, { headers: authHeaders() });
    return res.json();
  },
  async getUserPosts(userId) {
    const res = await fetch(`${API_URL}/posts/user/${userId}`, { headers: authHeaders() });
    return res.json();
  },
  async createPost(formData) {
    const res = await fetch(`${API_URL}/posts`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  async deletePost(postId) {
    const res = await fetch(`${API_URL}/posts/${postId}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },
  async toggleLike(postId, reaction = '') {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ reaction }) });
    return res.json();
  },
  async getReactions(postId) {
    const res = await fetch(`${API_URL}/posts/${postId}/reactions`, { headers: authHeaders() });
    if (!res.ok) return { reactions: [], total: 0, myReaction: '' };
    return res.json();
  },
  async getComments(postId) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, { headers: authHeaders() });
    return res.json();
  },
  async addComment(postId, text) {
    const res = await fetch(`${API_URL}/posts/${postId}/comments`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ text }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  },
  async getUser(userId) {
    const res = await fetch(`${API_URL}/users/${userId}`, { headers: authHeaders() });
    return res.json();
  },
  async toggleFollow(userId) {
    const res = await fetch(`${API_URL}/users/${userId}/follow`, { method: 'POST', headers: authHeaders() });
    return res.json();
  },
  async getMyFollowingIds() {
    try {
      const res = await fetch(`${API_URL}/users/me/following-ids`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.ids || [];
    } catch { return []; }
  },
  async getFollowing(userId) {
    const res = await fetch(`${API_URL}/users/${userId}/following`);
    if (!res.ok) return { users: [], total: 0 };
    return res.json();
  },
  async getFollowers(userId) {
    const res = await fetch(`${API_URL}/users/${userId}/followers`);
    if (!res.ok) return { users: [], total: 0 };
    return res.json();
  },
  async isFollowing(userId) {
    try {
      const ids = await this.getMyFollowingIds();
      return ids.includes(userId);
    } catch { return false; }
  },
  async getFriends(userId) {
    const res = await fetch(`${API_URL}/users/${userId}/friends`);
    if (!res.ok) return { users: [], total: 0 };
    return res.json();
  },
  async getFeaturedPhotos(userId) {
    const res = await fetch(`${API_URL}/users/${userId}/featured-photos`);
    if (!res.ok) return { photos: [], isAuto: true };
    return res.json();
  },
  async setFeaturedPhotos(photoIds) {
    const res = await fetch(`${API_URL}/users/me/featured-photos`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ photoIds })
    });
    return res.json();
  },
  async getLikedPosts() {
    try {
      const res = await fetch(`${API_URL}/users/me/liked-posts`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.likedPostIds || [];
    } catch { return []; }
  },
  async getGalleryPosts(sort = 'recent', page = 1) {
    const res = await fetch(`${API_URL}/posts/gallery?sort=${sort}&page=${page}`, { headers: authHeaders() });
    return res.json();
  },
  async getPeople(search = '', page = 1) {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    const res = await fetch(`${API_URL}/people?${params.toString()}`);
    if (!res.ok) return { users: [], total: 0, totalPages: 0 };
    return res.json();
  },
  async getMyFriendIds() {
    try {
      const res = await fetch(`${API_URL}/users/me/friend-ids`, { headers: authHeaders() });
      if (!res.ok) return [];
      const data = await res.json();
      return data.ids || [];
    } catch { return []; }
  },
  async getBannerTheme() {
    try {
      const res = await fetch(`${API_URL}/users/me/banner-theme`, { headers: authHeaders() });
      if (!res.ok) return true;
      const data = await res.json();
      return data.bannerThemeEnabled !== false;
    } catch { return true; }
  },
  async setBannerTheme(enabled) {
    const res = await fetch(`${API_URL}/users/me/banner-theme`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ enabled })
    });
    return res.json();
  },
  // Email verification
  async sendVerificationCode() {
    const res = await fetch(`${API_URL}/send-verification`, { method: 'POST', headers: authHeaders() });
    return res.json();
  },
  async verifyEmail(code) {
    const res = await fetch(`${API_URL}/verify-email`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ code }) });
    return res.json();
  },
  async getAuthSettings() {
    const res = await fetch(`${API_URL}/auth-settings`);
    return res.json();
  },
  // Admin
  async getAdminStats() {
    const res = await fetch(`${API_URL}/admin/stats`, { headers: authHeaders() });
    return res.json();
  },
  async getAdminUsers(page = 1, search = '') {
    const res = await fetch(`${API_URL}/admin/users?page=${page}&search=${search}`, { headers: authHeaders() });
    return res.json();
  },
  async updateUser(id, data) {
    const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(data) });
    return res.json();
  },
  async deleteUser(id) {
    const res = await fetch(`${API_URL}/admin/users/${id}`, { method: 'DELETE', headers: authHeaders() });
    return res.json();
  },
  async getAdminPosts(page = 1) {
    const res = await fetch(`${API_URL}/admin/posts?page=${page}`, { headers: authHeaders() });
    return res.json();
  },
  async hidePost(id, is_hidden) {
    const res = await fetch(`${API_URL}/admin/posts/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ is_hidden }) });
    return res.json();
  },
  async getSiteSettings() {
    const res = await fetch(`${API_URL}/admin/settings`, { headers: authHeaders() });
    return res.json();
  },
  async updateSiteSetting(key, value) {
    const res = await fetch(`${API_URL}/admin/settings`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ key, value }) });
    return res.json();
  },
  async getCustomThemes() {
    const res = await fetch(`${API_URL}/admin/custom-themes`, { headers: authHeaders() });
    return res.json();
  },
  logout() {
    localStorage.removeItem('mimis_token');
    localStorage.removeItem('mimis_user');
    localStorage.removeItem('mimis_custom_theme');
  },
  isAuthenticated() { return !!getToken(); }
};
