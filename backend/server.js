import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const JWT_SECRET = 'mimis-secret-key-2026';

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + uuidv4() + path.extname(file.originalname))
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Database
const db = new Database('mimis.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    display_name TEXT,
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '/uploads/default-avatar.png',
    banner TEXT DEFAULT '/uploads/default-banner.png',
    role TEXT DEFAULT 'user',
    theme TEXT DEFAULT 'dark-gold',
    custom_theme TEXT DEFAULT NULL,
    is_banned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image TEXT NOT NULL,
    caption TEXT DEFAULT '',
    location TEXT DEFAULT '',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image TEXT NOT NULL,
    caption TEXT DEFAULT '',
    expires_at DATETIME DEFAULT (datetime('now', '+24 hours')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS custom_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    name TEXT DEFAULT 'My Custom Theme',
    primary_bg TEXT DEFAULT '#1E1A1C',
    secondary_bg TEXT DEFAULT '#2A2528',
    card_bg TEXT DEFAULT '#342E31',
    accent1 TEXT DEFAULT '#BB8A5E',
    accent2 TEXT DEFAULT '#A7807D',
    accent3 TEXT DEFAULT '#4977AB',
    text_color TEXT DEFAULT '#CFD4DA',
    text_secondary TEXT DEFAULT '#8A8F96',
    border_color TEXT DEFAULT '#3A3437',
    light_primary TEXT DEFAULT '#FFF8F5',
    light_secondary TEXT DEFAULT '#FFFFFF',
    light_card TEXT DEFAULT '#F5EDE8',
    light_text TEXT DEFAULT '#2A2528',
    light_text_sec TEXT DEFAULT '#8A7D7A',
    light_border TEXT DEFAULT '#E8DDD8',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default site settings
const defaultSettings = {
  'site_name': "Mimi's",
  'site_description': 'Share your moments',
  'allow_registration': 'true',
  'require_approval': 'false',
  'max_upload_size': '10',
  'default_theme': 'dark-gold'
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
Object.entries(defaultSettings).forEach(([k, v]) => insertSetting.run(k, v));

// Seed data
function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (count.count === 0) {
    const hashedPass = bcrypt.hashSync('password123', 10);
    const adminPass = bcrypt.hashSync('admin123', 10);
    
    // Create admin
    db.prepare('INSERT INTO users (username, email, password, display_name, bio, role) VALUES (?, ?, ?, ?, ?, ?)')
      .run('admin', 'admin@mimis.com', adminPass, 'Admin', 'Site administrator', 'admin');
    
    const users = [
      ['mimi_creative', 'mimi@example.com', hashedPass, "Mimi's Creative", 'Capturing moments ✨ Amsterdam'],
      ['koffie', 'koffie@example.com', hashedPass, 'Koffie', 'Coffee lover ☕'],
      ['aro_cafe', 'aro@example.com', hashedPass, 'Aro Cafe', 'Best coffee in town'],
      ['luna_art', 'luna@example.com', hashedPass, 'Luna Art', 'Digital artist 🎨'],
      ['sarah_vibes', 'sarah@example.com', hashedPass, 'Sarah Vibes', 'Good vibes only ✌️'],
      ['alex_photo', 'alex@example.com', hashedPass, 'Alex Photo', 'Photography is life 📷'],
      ['jake_adventures', 'jake@example.com', hashedPass, 'Jake Adventures', 'Travel explorer 🌍'],
      ['emma_styles', 'emma@example.com', hashedPass, 'Emma Styles', 'Fashion & lifestyle 👗'],
      ['max_fitness', 'max@example.com', hashedPass, 'Max Fitness', 'Gym & fitness 💪'],
      ['lily_nature', 'lily@example.com', hashedPass, 'Lily Nature', 'Nature lover 🌿'],
      ['noah_tech', 'noah@example.com', hashedPass, 'Noah Tech', 'Tech enthusiast 💻'],
      ['mia_art', 'mia@example.com', hashedPass, 'Mia Art', 'Watercolor artist 🎨']
    ];
    const insertUser = db.prepare('INSERT INTO users (username, email, password, display_name, bio) VALUES (?, ?, ?, ?, ?)');
    for (const u of users) insertUser.run(...u);

    const insertFollow = db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?, ?)');
    insertFollow.run(2, 1); insertFollow.run(3, 1); insertFollow.run(4, 1);
    insertFollow.run(5, 1); insertFollow.run(1, 2); insertFollow.run(1, 3);

    console.log('✅ Database seeded with admin + sample users');
  }
}
seedDatabase();

// ====================== AUTH ======================

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
    
    const reg = db.prepare('SELECT value FROM site_settings WHERE key = ?').get('allow_registration');
    if (reg && reg.value === 'false') return res.status(403).json({ error: 'Registration is closed' });
    
    const hashed = await bcrypt.hash(password, 10);
    const result = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)').run(username, email, hashed, display_name || username);
    
    const token = jwt.sign({ userId: result.lastInsertRowid, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: result.lastInsertRowid, username, email, display_name: display_name || username, role: 'user' } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.is_banned) return res.status(403).json({ error: 'Account has been banned' });
  
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  delete user.password;
  res.json({ token, user });
});

// ====================== MIDDLEWARE ======================

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function adminOnly(req, res, next) {
  if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

// ====================== USER ROUTES ======================

app.get('/api/users/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, username, email, display_name, bio, avatar, role, theme, custom_theme, created_at FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

app.put('/api/users/me', auth, (req, res) => {
  const { display_name, bio } = req.body;
  db.prepare('UPDATE users SET display_name = COALESCE(?, display_name), bio = COALESCE(?, bio), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(display_name || null, bio || null, req.userId);
  res.json({ message: 'Updated' });
});

app.post('/api/users/avatar', auth, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const avatar = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.userId);
  res.json({ avatar });
});

app.put('/api/users/theme', auth, (req, res) => {
  const { theme } = req.body;
  const validThemes = ['dark-gold', 'pink-aesthetic', 'rose-blush', 'ocean-blue', 'forest-green', 'lavender', 'sunset-orange', 'monochrome', 'pink-blue', 'light-mode', 'custom'];
  if (!validThemes.includes(theme)) return res.status(400).json({ error: 'Invalid theme' });
  db.prepare('UPDATE users SET theme = ? WHERE id = ?').run(theme, req.userId);
  res.json({ theme });
});

app.put('/api/users/theme/custom', auth, (req, res) => {
  const theme = req.body;
  const existing = db.prepare('SELECT id FROM custom_themes WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare(`UPDATE custom_themes SET 
      primary_bg=?, secondary_bg=?, card_bg=?, accent1=?, accent2=?, accent3=?,
      text_color=?, text_secondary=?, border_color=?,
      light_primary=?, light_secondary=?, light_card=?, light_text=?, light_text_sec=?, light_border=?,
      updated_at=CURRENT_TIMESTAMP WHERE user_id=?`)
      .run(
        theme.primary_bg, theme.secondary_bg, theme.card_bg,
        theme.accent1, theme.accent2, theme.accent3,
        theme.text_color, theme.text_secondary, theme.border_color,
        theme.light_primary, theme.light_secondary, theme.light_card,
        theme.light_text, theme.light_text_sec, theme.light_border,
        req.userId
      );
  } else {
    db.prepare(`INSERT INTO custom_themes (user_id, primary_bg, secondary_bg, card_bg, accent1, accent2, accent3,
      text_color, text_secondary, border_color, light_primary, light_secondary, light_card, light_text, light_text_sec, light_border) 
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      req.userId, theme.primary_bg, theme.secondary_bg, theme.card_bg,
      theme.accent1, theme.accent2, theme.accent3,
      theme.text_color, theme.text_secondary, theme.border_color,
      theme.light_primary, theme.light_secondary, theme.light_card,
      theme.light_text, theme.light_text_sec, theme.light_border
    );
  }
  db.prepare('UPDATE users SET theme = ?, custom_theme = ? WHERE id = ?').run('custom', 'yes', req.userId);
  res.json({ theme: 'custom', saved: true });
});

// ====================== BANNER UPLOAD ======================

app.post('/api/users/banner', auth, upload.single('banner'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const banner = '/uploads/' + req.file.filename;
  db.prepare('UPDATE users SET banner = ? WHERE id = ?').run(banner, req.userId);
  res.json({ banner });
});

// ====================== STORIES ======================

app.post('/api/stories', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image required' });
  const image = '/uploads/' + req.file.filename;
  const { caption } = req.body;
  const result = db.prepare('INSERT INTO stories (user_id, image, caption) VALUES (?,?,?)').run(req.userId, image, caption||'');
  const story = db.prepare(`
    SELECT s.*, u.username, u.display_name, u.avatar 
    FROM stories s JOIN users u ON s.user_id=u.id WHERE s.id=?
  `).get(result.lastInsertRowid);
  res.status(201).json(story);
});

app.get('/api/stories', auth, (req, res) => {
  // Get stories from users the current user follows + their own
  const stories = db.prepare(`
    SELECT s.*, u.username, u.display_name, u.avatar
    FROM stories s JOIN users u ON s.user_id=u.id
    WHERE s.expires_at > datetime('now')
    AND (s.user_id = ? OR s.user_id IN (
      SELECT following_id FROM follows WHERE follower_id = ?
    ))
    ORDER BY s.created_at DESC
  `).all(req.userId, req.userId);
  res.json(stories);
});

app.delete('/api/stories/:id', auth, (req, res) => {
  db.prepare('DELETE FROM stories WHERE id=? AND user_id=?').run(req.params.id, req.userId);
  res.json({ message: 'Deleted' });
});

app.get('/api/users/theme/custom', auth, (req, res) => {
  const theme = db.prepare('SELECT * FROM custom_themes WHERE user_id = ?').get(req.userId);
  res.json(theme || null);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, username, display_name, bio, avatar, role, theme, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.posts_count = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ? AND is_hidden=0').get(user.id).c;
  user.followers_count = db.prepare('SELECT COUNT(*) as c FROM follows WHERE following_id = ?').get(user.id).c;
  user.following_count = db.prepare('SELECT COUNT(*) as c FROM follows WHERE follower_id = ?').get(user.id).c;
  res.json(user);
});

app.post('/api/users/:id/follow', auth, (req, res) => {
  const followingId = parseInt(req.params.id);
  if (req.userId === followingId) return res.status(400).json({ error: 'Cannot follow yourself' });
  const existing = db.prepare('SELECT * FROM follows WHERE follower_id=? AND following_id=?').get(req.userId, followingId);
  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.userId, followingId);
    res.json({ following: false });
  } else {
    db.prepare('INSERT INTO follows (follower_id, following_id) VALUES (?,?)').run(req.userId, followingId);
    res.json({ following: true });
  }
});

// ====================== POSTS ======================

app.post('/api/posts', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  const { caption, location } = req.body;
  const image = '/uploads/' + req.file.filename;
  const result = db.prepare('INSERT INTO posts (user_id, image, caption, location) VALUES (?,?,?,?)').run(req.userId, image, caption||'', location||'');
  const post = db.prepare('SELECT * FROM posts WHERE id=?').get(result.lastInsertRowid);
  const user = db.prepare('SELECT id, username, display_name, avatar FROM users WHERE id=?').get(req.userId);
  res.status(201).json({ ...post, user });
});

app.get('/api/posts', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.is_hidden = 0
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM posts WHERE is_hidden=0').get().c;
  res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
});

app.get('/api/posts/user/:userId', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name, u.avatar
    FROM posts p JOIN users u ON p.user_id = u.id
    WHERE p.user_id = ? AND p.is_hidden = 0
    ORDER BY p.created_at DESC
  `).all(req.params.userId);
  res.json(posts);
});

app.delete('/api/posts/:id', auth, (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id=? AND user_id=?').get(req.params.id, req.userId);
  if (!post && req.userRole !== 'admin') return res.status(404).json({ error: 'Not found or unauthorized' });
  const imgPath = path.join(__dirname, post?.image || '');
  if (post && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

app.post('/api/posts/:id/like', auth, (req, res) => {
  const existing = db.prepare('SELECT * FROM likes WHERE user_id=? AND post_id=?').get(req.userId, req.params.id);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id=? AND post_id=?').run(req.userId, req.params.id);
    db.prepare('UPDATE posts SET likes_count = likes_count - 1 WHERE id=?').run(req.params.id);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?,?)').run(req.userId, req.params.id);
    db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id=?').run(req.params.id);
    res.json({ liked: true });
  }
});

app.post('/api/posts/:id/comments', auth, (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text required' });
  const result = db.prepare('INSERT INTO comments (user_id, post_id, text) VALUES (?,?,?)').run(req.userId, req.params.id, text);
  db.prepare('UPDATE posts SET comments_count = comments_count + 1 WHERE id=?').run(req.params.id);
  const comment = db.prepare('SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?').get(result.lastInsertRowid);
  res.status(201).json(comment);
});

app.get('/api/posts/:id/comments', (req, res) => {
  const comments = db.prepare('SELECT c.*, u.username, u.avatar FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at DESC').all(req.params.id);
  res.json(comments);
});

// ====================== THEMES ======================

const themes = {
  'dark-gold': { name: 'Dark Gold', primary: '#1E1A1C', secondary: '#2A2528', card: '#342E31', accent1: '#BB8A5E', accent2: '#A7807D', accent3: '#4977AB', text: '#CFD4DA', textSecondary: '#8A8F96', border: '#3A3437', light_primary: '#FFF8F5', light_secondary: '#FFFFFF', light_card: '#F5EDE8', light_text: '#2A2528', light_text_sec: '#8A7D7A', light_border: '#E8DDD8' },
  'pink-aesthetic': { name: 'Pink Aesthetic', primary: '#1A1418', secondary: '#2A1E24', card: '#3A2830', accent1: '#FF69B4', accent2: '#FFB6C1', accent3: '#DB7093', text: '#F5E6ED', textSecondary: '#C4A3B4', border: '#4A3040', light_primary: '#FFF5F8', light_secondary: '#FFFFFF', light_card: '#FFE8F0', light_text: '#2A1E24', light_text_sec: '#A88A98', light_border: '#F0D5E0' },
  'rose-blush': { name: 'Rose Blush', primary: '#1C1517', secondary: '#2C1F22', card: '#3C292D', accent1: '#E8A0B4', accent2: '#C88A9C', accent3: '#A86A7C', text: '#F0E0E4', textSecondary: '#C0A8B0', border: '#4C353A', light_primary: '#FEF5F7', light_secondary: '#FFFFFF', light_card: '#FCE8ED', light_text: '#2C1F22', light_text_sec: '#A89096', light_border: '#E8D5DA' },
  'ocean-blue': { name: 'Ocean Blue', primary: '#0D1B2A', secondary: '#1B2838', card: '#243447', accent1: '#4A90D9', accent2: '#5BA3E6', accent3: '#7BB8F0', text: '#E0EAF5', textSecondary: '#A0B8CC', border: '#2A3F52', light_primary: '#F0F6FF', light_secondary: '#FFFFFF', light_card: '#E0ECFA', light_text: '#0D1B2A', light_text_sec: '#5A7A96', light_border: '#C8D8E8' },
  'forest-green': { name: 'Forest Green', primary: '#0F1F14', secondary: '#1A2E20', card: '#253D2C', accent1: '#4CAF50', accent2: '#66BB6A', accent3: '#81C784', text: '#E0F0E2', textSecondary: '#A0C0A8', border: '#2D4534', light_primary: '#F0FAF2', light_secondary: '#FFFFFF', light_card: '#E0F2E4', light_text: '#0F1F14', light_text_sec: '#5A8A64', light_border: '#C0D8C4' },
  'lavender': { name: 'Lavender Dreams', primary: '#18142A', secondary: '#261E3E', card: '#342852', accent1: '#B39DDB', accent2: '#CE93D8', accent3: '#E1BEE7', text: '#EDE7F6', textSecondary: '#BDB3CC', border: '#3D2E5A', light_primary: '#F5F0FF', light_secondary: '#FFFFFF', light_card: '#EDE4FA', light_text: '#18142A', light_text_sec: '#7A6A96', light_border: '#D8CCE8' },
  'sunset-orange': { name: 'Sunset Orange', primary: '#1E1410', secondary: '#2E1E18', card: '#3E2820', accent1: '#FF7043', accent2: '#FF8A65', accent3: '#FFAB91', text: '#F5EAE6', textSecondary: '#CCB0A8', border: '#4E3028', light_primary: '#FFF8F5', light_secondary: '#FFFFFF', light_card: '#FFECE5', light_text: '#1E1410', light_text_sec: '#A0867E', light_border: '#E8D0C8' },
  'monochrome': { name: 'Monochrome', primary: '#0D0D0D', secondary: '#1A1A1A', card: '#262626', accent1: '#E0E0E0', accent2: '#BDBDBD', accent3: '#9E9E9E', text: '#F5F5F5', textSecondary: '#B0B0B0', border: '#333333', light_primary: '#F5F5F5', light_secondary: '#FFFFFF', light_card: '#EBEBEB', light_text: '#1A1A1A', light_text_sec: '#666666', light_border: '#D4D4D4' },
  'pink-blue': { name: 'Pink & Blue', primary: '#0D1117', secondary: '#161B22', card: '#21262D', accent1: '#FF69B4', accent2: '#58A6FF', accent3: '#79C0FF', text: '#F0E6F0', textSecondary: '#8B949E', border: '#30363D', light_primary: '#F5F8FF', light_secondary: '#FFFFFF', light_card: '#E8EEFA', light_text: '#0D1117', light_text_sec: '#586078', light_border: '#C8D0DE' },
};

app.get('/api/themes', (req, res) => res.json(themes));
app.get('/api/themes/:name', (req, res) => {
  const t = themes[req.params.name];
  if (!t) return res.status(404).json({ error: 'Not found' });
  res.json(t);
});

// ====================== ADMIN ROUTES ======================

// Dashboard stats
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const totalPosts = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  const totalComments = db.prepare('SELECT COUNT(*) as c FROM comments').get().c;
  const totalLikes = db.prepare('SELECT COUNT(*) as c FROM likes').get().c;
  const totalReports = 0;
  const bannedUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_banned=1').get().c;
  const admins = db.prepare('SELECT COUNT(*) as c FROM users WHERE role=?').get('admin').c;
  const newToday = db.prepare("SELECT COUNT(*) as c FROM users WHERE date(created_at)=date('now')").get().c;
  const postsToday = db.prepare("SELECT COUNT(*) as c FROM posts WHERE date(created_at)=date('now')").get().c;
  
  res.json({ totalUsers, totalPosts, totalComments, totalLikes, totalReports, bannedUsers, admins, newToday, postsToday });
});

// List all users (admin)
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  
  let query = 'SELECT id, username, email, display_name, role, is_banned, created_at FROM users WHERE 1=1';
  let countQuery = 'SELECT COUNT(*) as c FROM users WHERE 1=1';
  const params = [];
  
  if (search) {
    query += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)';
    countQuery += ' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const total = db.prepare(countQuery).get(...params)?.c || 0;
  const users = db.prepare(query).all(...params, limit, offset);
  
  res.json({ users, total, page, totalPages: Math.ceil(total / limit) });
});

// Update user (admin)
app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const { role, is_banned, display_name } = req.body;
  const id = req.params.id;
  if (parseInt(id) === req.userId && role === 'user') return res.status(400).json({ error: 'Cannot demote yourself' });
  
  const updates = [];
  const params = [];
  if (role !== undefined) { updates.push('role=?'); params.push(role); }
  if (is_banned !== undefined) { updates.push('is_banned=?'); params.push(is_banned ? 1 : 0); }
  if (display_name !== undefined) { updates.push('display_name=?'); params.push(display_name); }
  
  if (updates.length > 0) {
    updates.push("updated_at=CURRENT_TIMESTAMP");
    db.prepare(`UPDATE users SET ${updates.join(',')} WHERE id=?`).run(...params, id);
  }
  res.json({ message: 'Updated' });
});

// Delete user (admin)
app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  const id = parseInt(req.params.id);
  if (id === req.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
  db.prepare('DELETE FROM users WHERE id=?').run(id);
  res.json({ message: 'User deleted' });
});

// Get all posts (admin, includes hidden)
app.get('/api/admin/posts', auth, adminOnly, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const posts = db.prepare(`
    SELECT p.*, u.username, u.display_name FROM posts p 
    JOIN users u ON p.user_id = u.id 
    ORDER BY p.created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM posts').get().c;
  res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
});

// Hide/show post (admin)
app.put('/api/admin/posts/:id', auth, adminOnly, (req, res) => {
  const { is_hidden } = req.body;
  db.prepare('UPDATE posts SET is_hidden=? WHERE id=?').run(is_hidden ? 1 : 0, req.params.id);
  res.json({ message: 'Updated' });
});

// Get site settings
app.get('/api/admin/settings', auth, adminOnly, (req, res) => {
  const settings = db.prepare('SELECT * FROM site_settings').all();
  const obj = {};
  settings.forEach(s => obj[s.key] = s.value);
  res.json(obj);
});

// Update site settings
app.put('/api/admin/settings', auth, adminOnly, (req, res) => {
  const { key, value } = req.body;
  db.prepare('UPDATE site_settings SET value=?, updated_at=CURRENT_TIMESTAMP WHERE key=?').run(value, key);
  res.json({ message: 'Updated' });
});

// Get custom themes for admin
app.get('/api/admin/custom-themes', auth, adminOnly, (req, res) => {
  const themes = db.prepare('SELECT ct.*, u.username FROM custom_themes ct JOIN users u ON ct.user_id=u.id').all();
  res.json(themes);
});

// ====================== START ======================

app.listen(PORT, () => {
  console.log(`🚀 Mimi's CMS Backend running on http://localhost:${PORT}`);
  console.log(`📊 Admin: admin@mimis.com / admin123`);
  console.log(`📸 User: mimi@example.com / password123`);
  console.log(`🎨 ${Object.keys(themes).length} themes available`);
});