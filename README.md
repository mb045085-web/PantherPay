# Panther Pay — Free Fire Topup Website

Panther Pay is a full-stack Node.js application for handling Free Fire diamond topups with user and admin panels.

## Features
- Email/password login with secure hashing (bcrypt)
- Google OAuth login
- Dynamic branding (logo and header image) via admin settings
- Topup products management (add/edit/delete)
- User dashboard with balance and transactions
- Admin transactions moderation (approve/reject)
- Responsive UI with Tailwind CSS and custom styles
- CSRF protection, Helmet security headers, sessions persisted in SQLite

## Tech Stack
- Express, EJS
- Passport (local + Google)
- SQLite3 + connect-sqlite3 for sessions
- Tailwind via CDN

## Getting Started

1. Install dependencies
```
npm install
```

2. Create environment file
```
cp .env.example .env
```
Fill in values for `SESSION_SECRET` and Google OAuth keys if you plan to enable Google login.

3. Run the app
```
npm run dev
```
Open http://localhost:3000

Default admin account:
- Email: admin@pantherpay.local
- Password: admin123

## Project Structure
```
assets/
  css/main.css
  js/main.js
src/
  auth/passport.js
  db/db.js
  middleware/auth.js
  routes/{auth.js,user.js,admin.js}
  views/
    layout.ejs
    partials/{header.ejs,footer.ejs}
    pages/{login.ejs,register.ejs,dashboard.ejs,topup.ejs,error.ejs}
    admin/{dashboard.ejs,users.ejs,products.ejs,transactions.ejs,settings.ejs}
```

## Security Notes
- Passwords are hashed using bcrypt.
- CSRF token is included in all forms via middleware.
- Use strong `SESSION_SECRET` in production.

## Customization
- Update branding in Admin > Settings.
- Edit packs in Admin > Products.

## License
MIT
