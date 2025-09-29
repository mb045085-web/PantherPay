require('dotenv').config();
const path = require('path');
const express = require('express');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
const helmet = require('helmet');
const csrf = require('csurf');
const morgan = require('morgan');
const cors = require('cors');

const { initDb, getSettings, runAsync } = require('./src/db/db');
require('./src/auth/passport');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const adminRoutes = require('./src/routes/admin');
const apiAdminRoutes = require('./src/routes/apiAdmin');

const app = express();

// Initialize DB
initDb();
// Ensure admin_seen exists (tracks which pending items were viewed by admin)
(async () => {
  try {
    await runAsync(`CREATE TABLE IF NOT EXISTS admin_seen (
      type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      seen_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (type, item_id)
    )`);
  } catch (e) {
    console.error('Failed to ensure admin_seen table:', e.message);
  }
})();

// View engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Security
app.use(helmet({
  contentSecurityPolicy: false
}));

// Logging
app.use(morgan('dev'));

// Static assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));
// PWA assets at root scope
app.get('/manifest.webmanifest', (req, res) => {
  res.type('application/manifest+json');
  res.sendFile(path.join(__dirname, 'manifest.webmanifest'));
});
app.get('/sw.js', (req, res) => {
  res.type('application/javascript');
  res.sendFile(path.join(__dirname, 'sw.js'));
});

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Method override
app.use(methodOverride('_method'));

// Sessions
app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: path.join(__dirname, 'data') }),
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Mount API (no CSRF, CORS enabled)
app.use('/api', cors({ origin: true, credentials: true }), (req, res, next) => {
  // API will use JSON only
  next();
});
app.use('/api/admin', apiAdminRoutes);

// CSRF for web routes
app.use(csrf());

// Inject common locals
app.use(async (req, res, next) => {
  try {
    const settings = await getSettings();
    res.locals.csrfToken = req.csrfToken();
    res.locals.user = req.user || null;
    res.locals.flash = {
      error: req.flash('error'),
      success: req.flash('success'),
      info: req.flash('info')
    };
    res.locals.brand = {
      name: 'Panther Pay',
      logoUrl: settings.logo_url,
      headerImageUrl: settings.header_image_url,
      currencySymbol: settings.currency_symbol || '৳',
      currencyRate: Number(settings.currency_rate || 1),
      step1Title: settings.step1_title || 'Free Fire TopUp',
      step1Image: settings.step1_image || 'https://short-url.org/1gcBY',
      step2Title: settings.step2_title || 'Level Up Pass',
      step2Image: settings.step2_image || 'https://short-url.org/1gcD0',
      step3Title: settings.step3_title || 'Weekly & Monthly',
      step3Image: settings.step3_image || 'https://short-url.org/1gcDf',
      step4Title: settings.step4_title || 'Weekly Lite',
      step4Image: settings.step4_image || 'https://short-url.org/1gcDw'
    };
    // Default UI flags so EJS includes never ReferenceError
    if (typeof res.locals.forceDark === 'undefined') res.locals.forceDark = false;
    if (typeof res.locals.hideThemeToggle === 'undefined') res.locals.hideThemeToggle = false;
    res.locals.isUserArea = req.path && req.path.startsWith('/user');
    next();
  } catch (e) {
    next(e);
  }
});

// Routes
app.use('/', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  if (req.user) return res.redirect('/user/dashboard');
  res.redirect('/login');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  req.flash('error', err.message || 'Something went wrong');
  res.status(500).render('pages/error', { title: 'Error', message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Panther Pay running on http://localhost:${PORT}`));
