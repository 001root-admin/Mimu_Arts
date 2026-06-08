const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('mimis_token');
const setToken = (token) => localStorage.setItem('mimis_token', token);

const authHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {})
});

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
  async toggleLike(postId) {
    const res = await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST', headers: authHeaders() });
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