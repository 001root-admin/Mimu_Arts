import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import AppleStrategy from 'passport-apple';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '5000');

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? crypto.randomBytes(64).toString('hex') : 'mimis-dev-secret-change-in-production-2026');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true, methods: ['GET','POST','PUT','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));

const limiter = rateLimit({ windowMs: 15*60*1000, max: 200 });
app.use('/api/', limiter);
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 });
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadsDir), filename: (req, file, cb) => { cb(null, Date.now()+'-'+uuidv4()+path.extname(file.originalname.replace(/[^a-zA-Z0-9._-]/g,'_')).toLowerCase()); } });
const upload = multer({ storage, limits: { fileSize: 10*1024*1024 }, fileFilter: (req, file, cb) => { cb(null, /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())); } });

const db = new Database('mimis.db');
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const addCol = (t, c, d) => { try { if (!db.prepare(`SELECT ${c} FROM ${t} LIMIT 0`).all()) return; } catch { try { db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${d}`); } catch {} } };

db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, display_name TEXT, bio TEXT DEFAULT '', avatar TEXT DEFAULT '/uploads/default-avatar.svg', banner TEXT DEFAULT '/uploads/default-banner.png', featured_photos TEXT DEFAULT '[]', role TEXT DEFAULT 'user', theme TEXT DEFAULT 'dark-gold', custom_theme TEXT DEFAULT NULL, is_banned INTEGER DEFAULT 0, auth_provider TEXT DEFAULT 'email', auth_provider_id TEXT DEFAULT NULL, reset_token TEXT DEFAULT NULL, reset_token_expires DATETIME DEFAULT NULL, email_verified INTEGER DEFAULT 0, birthday TEXT DEFAULT '', school TEXT DEFAULT '', work TEXT DEFAULT '', location TEXT DEFAULT '', relationship_status TEXT DEFAULT '', website TEXT DEFAULT '', social_links TEXT DEFAULT '{}', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, image TEXT NOT NULL, caption TEXT DEFAULT '', location TEXT DEFAULT '', likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, is_hidden INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS likes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, reaction TEXT DEFAULT '', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id,post_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, post_id INTEGER NOT NULL, text TEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS follows (id INTEGER PRIMARY KEY AUTOINCREMENT, follower_id INTEGER NOT NULL, following_id INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(follower_id,following_id), FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS stories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, image TEXT NOT NULL, caption TEXT DEFAULT '', expires_at DATETIME DEFAULT (datetime('now','+24 hours')), created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS custom_themes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL UNIQUE, name TEXT DEFAULT 'My Custom Theme', primary_bg TEXT DEFAULT '#1E1A1C', secondary_bg TEXT DEFAULT '#2A2528', card_bg TEXT DEFAULT '#342E31', accent1 TEXT DEFAULT '#BB8A5E', accent2 TEXT DEFAULT '#A7807D', accent3 TEXT DEFAULT '#4977AB', text_color TEXT DEFAULT '#CFD4DA', text_secondary TEXT DEFAULT '#8A8F96', border_color TEXT DEFAULT '#3A3437', light_primary TEXT DEFAULT '#FFF8F5', light_secondary TEXT DEFAULT '#FFFFFF', light_card TEXT DEFAULT '#F5EDE8', light_text TEXT DEFAULT '#2A2528', light_text_sec TEXT DEFAULT '#8A7D7A', light_border TEXT DEFAULT '#E8DDD8', link_color TEXT DEFAULT '#BB8A5E', light_link_color TEXT DEFAULT '#BB8A5E', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);
db.exec(`CREATE TABLE IF NOT EXISTS site_settings (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
db.exec(`CREATE TABLE IF NOT EXISTS verification_codes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, code TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'email', expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

addCol('users', 'social_links', "TEXT DEFAULT '{}'");

const defaultSettings = {
  'site_name': "Mimu Arts", 'site_description': 'Share your moments',
  'allow_registration': 'true', 'require_approval': 'false', 'max_upload_size': '10', 'default_theme': 'pink-blue',
  'default_avatar': '/uploads/default-avatar.svg', 'allow_google_login': 'false', 'allow_facebook_login': 'false',
  'allow_x_login': 'false', 'allow_apple_login': 'false', 'allow_github_login': 'false',
  'allow_discord_login': 'false', 'allow_linkedin_login': 'false', 'require_email_verification': 'false',
  'google_client_id': '', 'google_client_secret': '', 'facebook_app_id': '', 'facebook_app_secret': '',
  'x_client_id': '', 'x_client_secret': '', 'apple_client_id': '', 'apple_team_id': '',
  'github_client_id': '', 'github_client_secret': '', 'discord_client_id': '', 'discord_client_secret': '',
  'linkedin_client_id': '', 'linkedin_client_secret': '', 'smtp_host': '', 'smtp_port': '587', 'smtp_user': '', 'smtp_pass': '', 'smtp_from': '',
  'default_reactions': '["❤️","🔥","😂","😍","👍","😮"]', 'require_post_image': 'false'
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO site_settings (key, value) VALUES (?, ?)');
Object.entries(defaultSettings).forEach(([k, v]) => insertSetting.run(k, v));

function seedDatabase() {
  const count = db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)'];
  if (count === 0) {
    const hp = bcrypt.hashSync('password123', 10);
    const ap = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username,email,password,display_name,bio,role) VALUES (?,?,?,?,?,?)').run('admin','admin@mimu.com',ap,'Admin','Site administrator','admin');
    for (const u of [['mimu_creative','mimi@example.com',hp,"Mimu Creative",'Capturing moments ✨'],['koffie','koffie@example.com',hp,'Koffie','Coffee lover ☕']]) db.prepare('INSERT INTO users (username,email,password,display_name,bio) VALUES (?,?,?,?,?)').run(...u);
  }
}
seedDatabase();

// ====================== OAUTH ======================
app.use(session({ secret: JWT_SECRET, resave: false, saveUninitialized: false, cookie: { secure: false, maxAge: 24*60*60*1000 } }));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((u, d) => d(null, u.id));
passport.deserializeUser((id, d) => { d(null, db.prepare('SELECT id,username,email,display_name,avatar,role FROM users WHERE id=?').get(id)); });

function findOrCreateUser(prov, profile, email, displayName, done) {
  let user = db.prepare('SELECT * FROM users WHERE auth_provider=? AND auth_provider_id=?').get(prov, profile.id);
  if (!user && email) { user = db.prepare('SELECT * FROM users WHERE email=?').get(email); if (user) db.prepare('UPDATE users SET auth_provider=?,auth_provider_id=? WHERE id=?').run(prov, profile.id, user.id); }
  if (!user) { const r = db.prepare('INSERT INTO users (username,email,password,display_name,auth_provider,auth_provider_id) VALUES (?,?,?,?,?,?)').run(`user_${profile.id.slice(-12)}`, email||`${profile.id}@${prov}.local`,bcrypt.hashSync(crypto.randomBytes(16).toString('hex'),12),(displayName||profile.username||prov+'_user').replace(/[<>]/g,''),prov,profile.id); user = db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid); }
  if (user?.is_banned) return done(null, false, { message: 'Banned' }); delete user.password; done(null, user);
}

const gs = (k) => { const r = db.prepare('SELECT value FROM site_settings WHERE key=?').get(k); return r?.value; };
const CB = `http://192.168.0.241:${PORT}`;
const REDIR = 'http://192.168.0.241:5173/login?oauth_success=1';

const oauthProviders = [
  ['google', GoogleStrategy, () => ({ clientID: gs('google_client_id'), clientSecret: gs('google_client_secret'), callbackURL: `${CB}/api/auth/google/callback` })],
  ['facebook', FacebookStrategy, () => ({ clientID: gs('facebook_app_id'), clientSecret: gs('facebook_app_secret'), callbackURL: `${CB}/api/auth/facebook/callback`, profileFields: ['id','displayName','emails'] })],
  ['x', TwitterStrategy, () => ({ consumerKey: gs('x_client_id'), consumerSecret: gs('x_client_secret'), callbackURL: `${CB}/api/auth/x/callback`, includeEmail: true })],
  ['github', GitHubStrategy, () => ({ clientID: gs('github_client_id'), clientSecret: gs('github_client_secret'), callbackURL: `${CB}/api/auth/github/callback`, scope: ['user:email'] })],
  ['discord', DiscordStrategy, () => ({ clientID: gs('discord_client_id'), clientSecret: gs('discord_client_secret'), callbackURL: `${CB}/api/auth/discord/callback`, scope: ['identify','email'] })],
  ['linkedin', LinkedInStrategy, () => ({ clientID: gs('linkedin_client_id'), clientSecret: gs('linkedin_client_secret'), callbackURL: `${CB}/api/auth/linkedin/callback`, scope: ['r_emailaddress','r_liteprofile'] })],
  ['apple', AppleStrategy, () => ({ clientID: gs('apple_client_id'), teamID: gs('apple_team_id')||'', keyID: '', privateKeyString: '', callbackURL: `${CB}/api/auth/apple/callback` })],
];
for (const [name, Strat, conf] of oauthProviders) {
  if (gs(`${name}_client_id`) || (name==='apple' && gs('apple_client_id'))) { try { passport.use(name, new Strat(conf(), (a,r,p,d) => findOrCreateUser(name,p,p.emails?.[0]?.value,p.displayName||p.username,d))); } catch {} }
}

app.get('/api/auth/:provider', (req, res, next) => {
  if (gs(`allow_${req.params.provider}_login`) === 'false') return res.redirect(REDIR.replace('?oauth_success=1','?oauth_error=disabled'));
  passport.authenticate(req.params.provider, { scope: ['email','profile'] })(req, res, next);
});
app.get('/api/auth/:provider/callback', (req, res, next) => {
  passport.authenticate(req.params.provider, { failureRedirect: REDIR.replace('?oauth_success=1','?oauth_error=failed') }, (err, user) => {
    if (err||!user) return res.redirect(REDIR.replace('?oauth_success=1','?oauth_error=no_user'));
    res.redirect(REDIR+'&token='+jwt.sign({userId:user.id,role:user.role},JWT_SECRET,{expiresIn:'7d'})+'&user='+encodeURIComponent(JSON.stringify(user)));
  })(req, res, next);
});

// ====================== AUTH ======================
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, display_name } = req.body;
    if (!username||!email||!password) return res.status(400).json({ error: 'Missing fields' });
    if (gs('allow_registration') === 'false') return res.status(403).json({ error: 'Registration closed' });
    const r = db.prepare('INSERT INTO users (username,email,password,display_name) VALUES (?,?,?,?)').run(username.trim(), email, await bcrypt.hash(password,12), display_name||username);
    res.status(201).json({ token: jwt.sign({userId:r.lastInsertRowid,role:'user'},JWT_SECRET,{expiresIn:'7d'}), user: {id:r.lastInsertRowid,username,email,display_name:display_name||username,role:'user'} });
  } catch (err) { if (err.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username or email exists' }); res.status(500).json({ error: 'Registration failed' }); }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user||!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.is_banned) return res.status(403).json({ error: 'Banned' });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  delete user.password; res.json({ token, user });
});

// ====================== PASSWORD RESET ======================
const smtpHost = process.env.SMTP_HOST || gs('smtp_host');
const smtpPort = parseInt(process.env.SMTP_PORT || gs('smtp_port') || '587');
const smtpUser = process.env.SMTP_USER || gs('smtp_user');
const smtpPass = process.env.SMTP_PASS || gs('smtp_pass');
const smtpFrom = process.env.SMTP_FROM || gs('smtp_from') || 'Mimu Arts <noreply@mimuarts.com>';

const transporter = (smtpHost && smtpUser && smtpPass) ? nodemailer.createTransport({
  host: smtpHost, port: smtpPort, secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass }
}) : null;

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (!user) return res.status(404).json({ error: 'No account' });
  const t = crypto.randomBytes(32).toString('hex');
  db.prepare('UPDATE users SET reset_token=?,reset_token_expires=datetime("now","+1 hour") WHERE id=?').run(t, user.id);
  console.log(`🔑 Reset ${email}: ${t}`);
  if (transporter) {
    transporter.sendMail({
      from: smtpFrom, to: email,
      subject: 'Mimu Arts - Password Reset',
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#1E1A1C;color:#CFD4DA;border-radius:12px;">
        <h2 style="color:#BB8A5E;">Mimu Arts</h2>
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${t}" style="display:inline-block;padding:12px 24px;background:#BB8A5E;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
        <p style="margin-top:16px;font-size:12px;color:#8A8F96;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>`
    }).catch(err => console.error('Email send failed:', err.message));
  }
  res.json({ message: 'Sent', resetToken: process.env.NODE_ENV==='production'?undefined:t });
});

app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  const user = db.prepare('SELECT id FROM users WHERE reset_token=? AND reset_token_expires>datetime("now")').get(token);
  if (!user) return res.status(400).json({ error: 'Invalid token' });
  db.prepare('UPDATE users SET password=?,reset_token=NULL,reset_token_expires=NULL WHERE id=?').run(bcrypt.hashSync(newPassword,12), user.id);
  res.json({ message: 'Password reset' });
});

// ====================== EMAIL VERIFICATION ======================
app.post('/api/send-verification', auth, (req, res) => {
  const u = db.prepare('SELECT id,email,email_verified FROM users WHERE id=?').get(req.userId);
  if (!u||u.email_verified) return res.status(400).json({ error: u?.email_verified?'Already verified':'Not found' });
  const code = Math.floor(100000+Math.random()*900000).toString();
  db.prepare('DELETE FROM verification_codes WHERE user_id=? AND type=?').run(req.userId,'email');
  db.prepare('INSERT INTO verification_codes (user_id,code,type,expires_at) VALUES (?,?,?,datetime("now","+15 minutes"))').run(req.userId,code,'email');
  console.log(`📧 Code for ${u.email}: ${code}`);
  if (transporter) {
    transporter.sendMail({
      from: smtpFrom, to: u.email,
      subject: 'Mimu Arts - Email Verification',
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;background:#1E1A1C;color:#CFD4DA;border-radius:12px;">
        <h2 style="color:#BB8A5E;">Mimu Arts</h2>
        <p>Your verification code is:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#2A2528;border-radius:8px;color:#BB8A5E;">${code}</div>
        <p style="margin-top:16px;font-size:12px;color:#8A8F96;">This code expires in 15 minutes.</p>
      </div>`
    }).catch(err => console.error('Verification email failed:', err.message));
  }
  res.json({ message: 'Sent', code: process.env.NODE_ENV==='production'?undefined:code });
});

app.post('/api/verify-email', auth, (req, res) => {
  const { code } = req.body;
  const v = db.prepare('SELECT id FROM verification_codes WHERE user_id=? AND code=? AND type=? AND used=0 AND expires_at>datetime("now")').get(req.userId,code,'email');
  if (!v) return res.status(400).json({ error: 'Invalid code' });
  db.prepare('UPDATE verification_codes SET used=1 WHERE id=?').run(v.id);
  db.prepare('UPDATE users SET email_verified=1 WHERE id=?').run(req.userId);
  res.json({ message: 'Verified' });
});

app.get('/api/auth-settings', (req, res) => {
  const s = {}; db.prepare('SELECT key,value FROM site_settings WHERE key LIKE ?').all('allow_%_login').forEach(r => s[r.key.replace('allow_','').replace('_login','')] = r.value==='true');
  const rv = db.prepare('SELECT value FROM site_settings WHERE key=?').get('require_email_verification');
  res.json({ providers: s, requireEmailVerification: rv?.value==='true' });
});

// ====================== SOCIAL LOGIN ======================
app.post('/api/social-login', (req, res) => {
  const { provider, providerId, email, displayName } = req.body;
  if (gs(`allow_${provider}_login`) === 'false') return res.status(403).json({ error: 'Disabled' });
  let user = db.prepare('SELECT * FROM users WHERE auth_provider=? AND auth_provider_id=?').get(provider, providerId);
  if (!user && email) {
    user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (user) db.prepare('UPDATE users SET auth_provider=?,auth_provider_id=? WHERE id=?').run(provider,providerId,user.id);
    else { const r = db.prepare('INSERT INTO users (username,email,password,display_name,auth_provider,auth_provider_id) VALUES (?,?,?,?,?,?)').run(providerId.slice(-15),email||`${providerId}@${provider}.com`,bcrypt.hashSync(crypto.randomBytes(16).toString('hex'),12),displayName||`${provider}_user`,provider,providerId); user = db.prepare('SELECT * FROM users WHERE id=?').get(r.lastInsertRowid); }
  }
  if (!user||user.is_banned) return res.status(400).json({ error: 'Auth failed' });
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  delete user.password; res.json({ token, user });
});

// ====================== MIDDLEWARE ======================
function auth(req, res, next) {
  try { const t = req.headers.authorization?.split(' ')[1]; if (!t) return res.status(401).json({ error: 'No token' }); const d = jwt.verify(t, JWT_SECRET); req.userId = d.userId; req.userRole = d.role; next(); } catch { res.status(401).json({ error: 'Invalid token' }); }
}
function adminOnly(req, res, next) { if (req.userRole !== 'admin') return res.status(403).json({ error: 'Admin only' }); next(); }

// ====================== USER ROUTES ======================
app.get('/api/users/me', auth, (req, res) => {
  res.json(db.prepare('SELECT id,username,email,display_name,bio,avatar,role,theme,custom_theme,created_at,birthday,school,work,location,relationship_status,website,social_links FROM users WHERE id=?').get(req.userId));
});

app.put('/api/users/me', auth, (req, res) => {
  const { display_name, bio, birthday, school, work, location, relationship_status, website, social_links } = req.body;
  const s = (v) => v!==undefined&&v!==null ? String(v).trim().replace(/[<>]/g,'') : null;
  const sl = social_links ? (typeof social_links === 'string' ? social_links : JSON.stringify(social_links)) : null;
  db.prepare('UPDATE users SET display_name=COALESCE(?,display_name),bio=COALESCE(?,bio),birthday=COALESCE(?,birthday),school=COALESCE(?,school),work=COALESCE(?,work),location=COALESCE(?,location),relationship_status=COALESCE(?,relationship_status),website=COALESCE(?,website),social_links=COALESCE(?,social_links),updated_at=CURRENT_TIMESTAMP WHERE id=?').run(s(display_name),s(bio),s(birthday),s(school),s(work),s(location),s(relationship_status),s(website),sl,req.userId);
  res.json({ message: 'Updated' });
});

app.post('/api/users/avatar', auth, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err||!req.file) return res.status(400).json({ error: err?.message||'No file' });
    db.prepare('UPDATE users SET avatar=? WHERE id=?').run('/uploads/'+req.file.filename, req.userId);
    res.json({ avatar: '/uploads/'+req.file.filename });
  });
});

app.put('/api/users/theme', auth, (req, res) => {
  const { theme } = req.body;
  if (!['dark-gold','pink-aesthetic','rose-blush','ocean-blue','forest-green','lavender','sunset-orange','monochrome','pink-blue','light-mode','custom'].includes(theme)) return res.status(400).json({ error: 'Invalid theme' });
  db.prepare('UPDATE users SET theme=? WHERE id=?').run(theme, req.userId);
  res.json({ theme });
});

app.put('/api/users/theme/custom', auth, (req, res) => {
  const t = req.body;
  const v = [t.primary_bg||'#1E1A1C',t.secondary_bg||'#2A2528',t.card_bg||'#342E31',t.accent1||'#BB8A5E',t.accent2||'#A7807D',t.accent3||'#4977AB',t.text_color||'#CFD4DA',t.text_secondary||'#8A8F96',t.border_color||'#3A3437',t.light_primary||'#FFF8F5',t.light_secondary||'#FFFFFF',t.light_card||'#F5EDE8',t.light_text||'#2A2528',t.light_text_sec||'#8A7D7A',t.light_border||'#E8DDD8',t.link_color||'#BB8A5E',t.light_link_color||'#BB8A5E'];
  const e = db.prepare('SELECT id FROM custom_themes WHERE user_id=?').get(req.userId);
  if (e) db.prepare('UPDATE custom_themes SET primary_bg=?,secondary_bg=?,card_bg=?,accent1=?,accent2=?,accent3=?,text_color=?,text_secondary=?,border_color=?,light_primary=?,light_secondary=?,light_card=?,light_text=?,light_text_sec=?,light_border=?,link_color=?,light_link_color=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?').run(...v,req.userId);
  else db.prepare('INSERT INTO custom_themes (user_id,primary_bg,secondary_bg,card_bg,accent1,accent2,accent3,text_color,text_secondary,border_color,light_primary,light_secondary,light_card,light_text,light_text_sec,light_border,link_color,light_link_color) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(req.userId,...v);
  db.prepare('UPDATE users SET theme=?,custom_theme=? WHERE id=?').run('custom','yes',req.userId);
  res.json({ theme:'custom', saved:true });
});

app.get('/api/users/:id/featured-photos', (req, res) => {
  let ids = []; try { ids = JSON.parse(db.prepare('SELECT featured_photos FROM users WHERE id=?').get(req.params.id)?.featured_photos||'[]'); } catch {}
  if (ids.length===0) return res.json({ photos: db.prepare('SELECT p.id,p.image FROM posts p WHERE p.user_id=? AND p.is_hidden=0 ORDER BY p.created_at DESC LIMIT 9').all(req.params.id), isAuto:true });
  res.json({ photos: db.prepare(`SELECT p.id,p.image FROM posts p WHERE p.id IN (${ids.map(()=>'?').join(',')}) AND p.is_hidden=0`).all(...ids), isAuto:false });
});

app.put('/api/users/me/featured-photos', auth, (req, res) => {
  const ids = (req.body.photoIds||[]).filter(id=>Number.isInteger(Number(id))).map(Number).slice(0,9);
  db.prepare('UPDATE users SET featured_photos=? WHERE id=?').run(JSON.stringify(ids),req.userId);
  res.json({ photoIds:ids });
});

app.post('/api/users/banner', auth, (req, res, next) => {
  upload.single('banner')(req, res, (err) => {
    if (err||!req.file) return res.status(400).json({ error: err?.message||'No file' });
    db.prepare('UPDATE users SET banner=? WHERE id=?').run('/uploads/'+req.file.filename,req.userId);
    res.json({ banner:'/uploads/'+req.file.filename });
  });
});

// Stories
app.post('/api/stories', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err||!req.file) return res.status(400).json({ error: 'Image required' });
    res.status(201).json(db.prepare('SELECT s.*,u.username,u.display_name,u.avatar FROM stories s JOIN users u ON s.user_id=u.id WHERE s.id=?').get(db.prepare('INSERT INTO stories (user_id,image,caption) VALUES (?,?,?)').run(req.userId,'/uploads/'+req.file.filename,(req.body.caption||'').trim()).lastInsertRowid));
  });
});

app.get('/api/stories', auth, (req, res) => {
  res.json(db.prepare(`SELECT s.*,u.username,u.display_name,u.avatar FROM stories s JOIN users u ON s.user_id=u.id WHERE s.expires_at>datetime('now') AND (s.user_id=? OR s.user_id IN (SELECT following_id FROM follows WHERE follower_id=?)) ORDER BY s.created_at DESC`).all(req.userId,req.userId));
});

app.delete('/api/stories/:id', auth, (req, res) => {
  db.prepare('DELETE FROM stories WHERE id=? AND user_id=?').run(req.params.id,req.userId);
  res.json({ message:'Deleted' });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT id,username,display_name,bio,avatar,banner,role,theme,created_at,birthday,school,work,location,relationship_status,website,social_links FROM users WHERE id=?').get(req.params.id);
  if (!user) return res.status(404).json({ error:'Not found' });
  user.posts_count = db.prepare('SELECT COUNT(*) FROM posts WHERE user_id=? AND is_hidden=0').get(user.id)['COUNT(*)'];
  user.followers_count = db.prepare('SELECT COUNT(*) FROM follows WHERE following_id=?').get(user.id)['COUNT(*)'];
  user.following_count = db.prepare('SELECT COUNT(*) FROM follows WHERE follower_id=?').get(user.id)['COUNT(*)'];
  res.json(user);
});

app.post('/api/users/:id/follow', auth, (req, res) => {
  const fid = parseInt(req.params.id);
  if (req.userId===fid) return res.status(400).json({ error:'Cannot follow yourself' });
  if (db.prepare('SELECT * FROM follows WHERE follower_id=? AND following_id=?').get(req.userId,fid)) { db.prepare('DELETE FROM follows WHERE follower_id=? AND following_id=?').run(req.userId,fid); res.json({ following:false }); }
  else { db.prepare('INSERT INTO follows (follower_id,following_id) VALUES (?,?)').run(req.userId,fid); res.json({ following:true }); }
});

app.get('/api/users/me/following-ids', auth, (req, res) => {
  res.json({ ids: db.prepare('SELECT following_id FROM follows WHERE follower_id=?').all(req.userId).map(r=>r.following_id) });
});

app.get('/api/users/:id/following', (req, res) => {
  res.json(db.prepare('SELECT u.id,u.username,u.display_name,u.avatar,u.bio FROM follows f JOIN users u ON f.following_id=u.id WHERE f.follower_id=? AND u.is_banned=0 ORDER BY f.created_at DESC').all(req.params.id));
});

app.get('/api/users/:id/followers', (req, res) => {
  res.json(db.prepare('SELECT u.id,u.username,u.display_name,u.avatar,u.bio FROM follows f JOIN users u ON f.follower_id=u.id WHERE f.following_id=? AND u.is_banned=0 ORDER BY f.created_at DESC').all(req.params.id));
});

// Posts
app.post('/api/posts', auth, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error:'File too large' });
    const image = req.file?'/uploads/'+req.file.filename:'';
    if (!image&&!req.body.caption) return res.status(400).json({ error:'Need image or caption' });
    const r = db.prepare('INSERT INTO posts (user_id,image,caption,location) VALUES (?,?,?,?)').run(req.userId,image,(req.body.caption||'').trim(),(req.body.location||'').trim());
    res.status(201).json({ ...db.prepare('SELECT * FROM posts WHERE id=?').get(r.lastInsertRowid), user: db.prepare('SELECT id,username,display_name,avatar FROM users WHERE id=?').get(req.userId) });
  });
});

app.get('/api/posts', (req, res) => {
  const p = Math.max(1,parseInt(req.query.page)||1), l = Math.min(Math.max(1,parseInt(req.query.limit)||10),50);
  res.json({ posts: db.prepare('SELECT p.*,u.username,u.display_name,u.avatar FROM posts p JOIN users u ON p.user_id=u.id WHERE p.is_hidden=0 ORDER BY p.created_at DESC LIMIT ? OFFSET ?').all(l,(p-1)*l), total: db.prepare('SELECT COUNT(*) FROM posts WHERE is_hidden=0').get()['COUNT(*)'], page:p, totalPages:Math.ceil(db.prepare('SELECT COUNT(*) FROM posts WHERE is_hidden=0').get()['COUNT(*)']/l) });
});

app.get('/api/posts/user/:userId', (req, res) => {
  res.json(db.prepare('SELECT p.*,u.username,u.display_name,u.avatar FROM posts p JOIN users u ON p.user_id=u.id WHERE p.user_id=? AND p.is_hidden=0 ORDER BY p.created_at DESC').all(req.params.userId));
});

app.delete('/api/posts/:id', auth, (req, res) => {
  if (!db.prepare('SELECT * FROM posts WHERE id=? AND (user_id=? OR (SELECT role FROM users WHERE id=?)=?)').get(req.params.id,req.userId,req.userId,'admin')) return res.status(404).json({ error:'Not found' });
  db.prepare('DELETE FROM posts WHERE id=?').run(req.params.id);
  res.json({ message:'Deleted' });
});

app.post('/api/posts/:id/like', auth, (req, res) => {
  const { reaction } = req.body||{};
  const ex = db.prepare('SELECT * FROM likes WHERE user_id=? AND post_id=?').get(req.userId,req.params.id);
  if (ex) {
    if (reaction&&ex.reaction===reaction) { db.prepare('DELETE FROM likes WHERE user_id=? AND post_id=?').run(req.userId,req.params.id); db.prepare('UPDATE posts SET likes_count=likes_count-1 WHERE id=?').run(req.params.id); res.json({ liked:false, reaction:'' }); }
    else if (reaction) { db.prepare('UPDATE likes SET reaction=? WHERE user_id=? AND post_id=?').run(reaction,req.userId,req.params.id); res.json({ liked:true, reaction }); }
    else { db.prepare('DELETE FROM likes WHERE user_id=? AND post_id=?').run(req.userId,req.params.id); db.prepare('UPDATE posts SET likes_count=likes_count-1 WHERE id=?').run(req.params.id); res.json({ liked:false, reaction:'' }); }
  } else {
    db.prepare('INSERT INTO likes (user_id,post_id,reaction) VALUES (?,?,?)').run(req.userId,req.params.id,reaction||'');
    db.prepare('UPDATE posts SET likes_count=likes_count+1 WHERE id=?').run(req.params.id);
    res.json({ liked:true, reaction:reaction||'' });
  }
});

app.get('/api/posts/:id/reactions', auth, (req, res) => {
  const rows = db.prepare('SELECT l.user_id,l.reaction,u.username,u.avatar FROM likes l JOIN users u ON l.user_id=u.id WHERE l.post_id=?').all(req.params.id);
  const g = {}; rows.forEach(r=>{const e=r.reaction||'❤️'; if(!g[e])g[e]={emoji:e,count:0,users:[]}; g[e].count++; g[e].users.push({id:r.user_id,username:r.username,avatar:r.avatar});});
  res.json({ reactions:Object.values(g), total:rows.length, myReaction:rows.find(r=>r.user_id===req.userId)?.reaction||'' });
});

app.post('/api/posts/:id/comments', auth, (req, res) => {
  if (!req.body.text) return res.status(400).json({ error:'Text required' });
  const r = db.prepare('INSERT INTO comments (user_id,post_id,text) VALUES (?,?,?)').run(req.userId,req.params.id,req.body.text.trim());
  db.prepare('UPDATE posts SET comments_count=comments_count+1 WHERE id=?').run(req.params.id);
  res.status(201).json(db.prepare('SELECT c.*,u.username,u.avatar FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?').get(r.lastInsertRowid));
});

app.get('/api/posts/:id/comments', (req, res) => {
  res.json(db.prepare('SELECT c.*,u.username,u.avatar FROM comments c JOIN users u ON c.user_id=u.id WHERE c.post_id=? ORDER BY c.created_at DESC').all(req.params.id));
});

app.get('/api/users/me/liked-posts', auth, (req, res) => {
  res.json({ likedPostIds: db.prepare('SELECT post_id FROM likes WHERE user_id=?').all(req.userId).map(r=>r.post_id) });
});

app.get('/api/posts/gallery', (req, res) => {
  const sort = req.query.sort||'recent';
  let o = 'p.created_at DESC';
  if (sort==='popular') o = 'p.likes_count DESC,p.comments_count DESC';
  if (sort==='trending') o = '(p.likes_count+p.comments_count*2) DESC';
  res.json(db.prepare(`SELECT p.*,u.username,u.display_name,u.avatar FROM posts p JOIN users u ON p.user_id=u.id WHERE p.is_hidden=0 ORDER BY ${o}`).all());
});

app.get('/api/people', (req, res) => {
  const s = req.query.search||'';
  res.json(s ? db.prepare('SELECT id,username,display_name,bio,avatar,role,theme,created_at FROM users WHERE is_banned=0 AND (username LIKE ? OR display_name LIKE ? OR bio LIKE ?) ORDER BY created_at DESC').all(`%${s}%`,`%${s}%`,`%${s}%`) : db.prepare('SELECT id,username,display_name,bio,avatar,role,theme,created_at FROM users WHERE is_banned=0 ORDER BY created_at DESC').all());
});

const themes = {
  'dark-gold':{name:'Dark Gold',primary:'#1E1A1C',secondary:'#2A2528',card:'#342E31',accent1:'#BB8A5E',accent2:'#A7807D',accent3:'#4977AB',text:'#CFD4DA',textSecondary:'#8A8F96',border:'#3A3437',light_primary:'#FFF8F5',light_secondary:'#FFFFFF',light_card:'#F5EDE8',light_text:'#2A2528',light_text_sec:'#8A7D7A',light_border:'#E8DDD8',link_color:'#BB8A5E',light_link_color:'#BB8A5E'},
  'pink-aesthetic':{name:'Pink Aesthetic',primary:'#1A1418',secondary:'#2A1E24',card:'#3A2830',accent1:'#FF69B4',accent2:'#FFB6C1',accent3:'#DB7093',text:'#F5E6ED',textSecondary:'#C4A3B4',border:'#4A3040',light_primary:'#FFF5F8',light_secondary:'#FFFFFF',light_card:'#FFE8F0',light_text:'#2A1E24',light_text_sec:'#A88A98',light_border:'#F0D5E0',link_color:'#FF69B4',light_link_color:'#FF1493'},
  'pink-blue':{name:'Pink & Blue',primary:'#0D1117',secondary:'#161B22',card:'#21262D',accent1:'#FF69B4',accent2:'#58A6FF',accent3:'#79C0FF',text:'#F0E6F0',textSecondary:'#8B949E',border:'#30363D',light_primary:'#F5F8FF',light_secondary:'#FFFFFF',light_card:'#E8EEFA',light_text:'#0D1117',light_text_sec:'#586078',light_border:'#C8D0DE',link_color:'#FF69B4',light_link_color:'#58A6FF'}
};
app.get('/api/themes', (req, res) => res.json(themes));

// ====================== ADMIN ======================
app.get('/api/admin/stats', auth, adminOnly, (req, res) => {
  res.json({ totalUsers: db.prepare('SELECT COUNT(*) FROM users').get()['COUNT(*)'], totalPosts: db.prepare('SELECT COUNT(*) FROM posts').get()['COUNT(*)'], totalComments: db.prepare('SELECT COUNT(*) FROM comments').get()['COUNT(*)'], totalLikes: db.prepare('SELECT COUNT(*) FROM likes').get()['COUNT(*)'], bannedUsers: db.prepare('SELECT COUNT(*) FROM users WHERE is_banned=1').get()['COUNT(*)'], admins: db.prepare('SELECT COUNT(*) FROM users WHERE role=?').get('admin')['COUNT(*)'], newToday: db.prepare("SELECT COUNT(*) FROM users WHERE date(created_at)=date('now')").get()['COUNT(*)'], postsToday: db.prepare("SELECT COUNT(*) FROM posts WHERE date(created_at)=date('now')").get()['COUNT(*)'] });
});
app.get('/api/admin/users', auth, adminOnly, (req, res) => {
  const p = parseInt(req.query.page)||1, s = req.query.search||'', params=[]; let q='SELECT id,username,email,display_name,role,is_banned,auth_provider,created_at FROM users WHERE 1=1';
  if (s) { q+=' AND (username LIKE ? OR email LIKE ? OR display_name LIKE ?)'; params.push(`%${s}%`,`%${s}%`,`%${s}%`); }
  const total = db.prepare(q.replace(/SELECT.*?FROM/,'SELECT COUNT(*) as c FROM')).get(...params)?.c||0;
  res.json({ users: db.prepare(q+' ORDER BY created_at DESC LIMIT 20 OFFSET ?').all(...params,(p-1)*20), total, page:p, totalPages:Math.ceil(total/20) });
});
app.put('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  if (req.body.role==='user'&&parseInt(req.params.id)===req.userId) return res.status(400).json({error:'Cannot demote yourself'});
  const u=[],p=[]; if(req.body.role!==undefined){u.push('role=?');p.push(req.body.role);} if(req.body.is_banned!==undefined){u.push('is_banned=?');p.push(req.body.is_banned?1:0);}
  if(u.length){u.push("updated_at=CURRENT_TIMESTAMP"); db.prepare(`UPDATE users SET ${u.join(',')} WHERE id=?`).run(...p,req.params.id);}
  res.json({message:'Updated'});
});
app.delete('/api/admin/users/:id', auth, adminOnly, (req, res) => {
  if(parseInt(req.params.id)===req.userId) return res.status(400).json({error:'Cannot delete yourself'});
  db.prepare('DELETE FROM users WHERE id=?').run(req.params.id); res.json({message:'Deleted'});
});
app.get('/api/admin/posts', auth, adminOnly, (req, res) => {
  const p=parseInt(req.query.page)||1; res.json({posts:db.prepare('SELECT p.*,u.username,u.display_name FROM posts p JOIN users u ON p.user_id=u.id ORDER BY p.created_at DESC LIMIT 20 OFFSET ?').all((p-1)*20)});
});
app.put('/api/admin/posts/:id', auth, adminOnly, (req, res) => { db.prepare('UPDATE posts SET is_hidden=? WHERE id=?').run(req.body.is_hidden?1:0,req.params.id); res.json({message:'Updated'}); });
app.get('/api/admin/settings', auth, adminOnly, (req, res) => { const s={}; db.prepare('SELECT * FROM site_settings').all().forEach(r=>s[r.key]=r.value); res.json(s); });
app.put('/api/admin/settings', auth, adminOnly, (req, res) => { const{key,value}=req.body; if(!db.prepare('SELECT id FROM site_settings WHERE key=?').get(key)) return res.status(400).json({error:'Invalid key'}); db.prepare('UPDATE site_settings SET value=?,updated_at=CURRENT_TIMESTAMP WHERE key=?').run(String(value).replace(/[<>]/g,''),key); res.json({message:'Updated'}); });

app.use((err, req, res, next) => { console.error(err.message); res.status(500).json({ error:'Internal error' }); });

app.listen(PORT, () => {
  console.log(`🚀 Mimu CMS Backend on port ${PORT}`);
  console.log(`📊 LAN: http://192.168.0.241:${PORT}`);
  console.log(`📧 Login: mimi@example.com / password123`);
  console.log(`🔑 Admin: admin@mimu.com / admin123`);
});