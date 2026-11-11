const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const CALENDAR_DATA = require('./calendar-data');

const app = express();
const PORT = process.env.PORT || 80;

// Load a local .env file (KEY=VALUE per line) when present, without overriding real env vars.
const ENV_FILE = path.join(__dirname, '.env');
if (fs.existsSync(ENV_FILE)) {
    fs.readFileSync(ENV_FILE, 'utf-8').split(/\r?\n/).forEach((line) => {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (match && process.env[match[1]] === undefined) {
            process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
        }
    });
}

// Administrative credentials come only from the environment (.env / docker-compose env_file).
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Microsoft Entra ID (Azure AD) single sign-on — enabled when all three values are set.
const AZURE_CLIENT_ID = (process.env.AZURE_CLIENT_ID || '').trim();
const AZURE_TENANT_ID = (process.env.AZURE_TENANT_ID || '').trim();
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET || '';
const AZURE_REDIRECT_URI = (process.env.AZURE_REDIRECT_URI || '').trim();
const AZURE_ENABLED = Boolean(AZURE_CLIENT_ID && AZURE_TENANT_ID && AZURE_CLIENT_SECRET);
// Always-registered admins; more users are managed from the admin panel (data/users.json).
const SEED_ADMIN_EMAILS = Array.from(new Set((process.env.ADMIN_EMAILS || '').split(',')
    .concat(ADMIN_EMAIL).map((e) => e.trim().toLowerCase()).filter(Boolean)));

const PASSWORD_LOGIN_ENABLED = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
if (!PASSWORD_LOGIN_ENABLED && !AZURE_ENABLED) {
    console.warn('[security] Neither ADMIN_EMAIL / ADMIN_PASSWORD nor AZURE_* are set — admin login is disabled.');
}

// Origins allowed to call the API cross-origin (same-origin requests are always allowed).
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://www.nurse.cmu.ac.th,https://nurse.cmu.ac.th')
    .split(',').map((o) => o.trim()).filter(Boolean);

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Default initial content
const defaultContent = {
    calendarHeaderData: {
        title: "Add to Calendar",
        subtitle: "Choose your preferred calendar service."
    },
    customSections: [
        {
            id: "section_poster",
            title: "POSTER & DOWNLOADS",
            subtitle: "Official conference posters & documents",
            collapsed: false,
            buttons: [
                {
                    id: "btn_poster_en",
                    title: "Download Conference Poster (English)",
                    subtitle: "PDF file / High resolution",
                    url: "https://www.nurse.cmu.ac.th/"
                }
            ]
        }
    ]
};

// Initialize content.json if not present
if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf-8');
}

// ---------- Admin users (Microsoft accounts allowed to sign in) ----------
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readUsers() {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
        return Array.isArray(users) ? users : [];
    } catch (err) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function isRegisteredUser(email) {
    return readUsers().some((u) => u.email === email);
}

// Emails from .env (ADMIN_EMAIL / ADMIN_EMAILS) are always registered on startup.
(function syncEnvUsers() {
    const users = readUsers();
    const missing = SEED_ADMIN_EMAILS.filter((email) => !users.some((u) => u.email === email));
    if (missing.length || !fs.existsSync(USERS_FILE)) {
        writeUsers(users.concat(missing.map((email) => ({ email, addedAt: new Date().toISOString(), addedBy: 'system' }))));
    }
})();

// Multer Storage Configuration (Cryptographically Secure UUID Filename)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Generate secure random UUID to prevent predictable resource enumeration
        const ext = path.extname(file.originalname).toLowerCase();
        const secureRandomName = `${crypto.randomUUID()}${ext}`;
        cb(null, secureRandomName);
    }
});
const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'];
const upload = multer({
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(new Error('Invalid file type. Only .png, .jpg, .jpeg, .pdf, and .docx files are allowed.'));
        }
        cb(null, true);
    }
});

// Middleware
app.disable('x-powered-by');

// ---------- Reverse-proxy path repair ----------
// The upstream nginx for service.nurse.cmu.ac.th is outside our control. Some proxy setups
// (e.g. `proxy_pass http://app:4401/inter2027;` with no trailing slash) turn
// "/inter2027/logo.png" into "/inter2027logo.png". Put the missing slash back so every
// route still matches. Proxies that forward the original URI in a header are honoured too.
const BASE_PREFIX = '/inter2027';
let loggedRequests = 0;
app.use((req, res, next) => {
    const original = req.url;
    const forwarded = req.headers['x-original-uri'] || req.headers['x-forwarded-uri'];
    if (typeof forwarded === 'string' && forwarded.startsWith(BASE_PREFIX)) {
        req.url = forwarded;
    } else if (req.url.startsWith(BASE_PREFIX) && !/^\/inter2027(\/|\?|$)/.test(req.url)) {
        req.url = BASE_PREFIX + '/' + req.url.slice(BASE_PREFIX.length);
    }
    // Log the first requests after start-up so the proxy's path format shows in the deploy logs.
    if (loggedRequests < 30) {
        loggedRequests += 1;
        console.log(`[path] ${req.method} received="${original}"${req.url !== original ? ` -> "${req.url}"` : ''}`);
    }
    next();
});
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ---------- Admin sessions ----------
// Random, expiring tokens kept in memory; the password itself is never sent back to the browser.
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const sessions = new Map(); // token -> expiresAt

function createSession(email) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS, email: email || ADMIN_EMAIL });
    return token;
}

function readToken(req) {
    const raw = (req.headers['x-admin-password'] || req.headers['authorization'] || '').trim();
    return raw.replace(/^Bearer\s+/i, '');
}

function isValidSession(token) {
    if (!token) return false;
    const session = sessions.get(token);
    if (!session) return false;
    if (session.expiresAt < Date.now()) {
        sessions.delete(token);
        return false;
    }
    return true;
}

function safeEqual(a, b) {
    const bufA = crypto.createHash('sha256').update(String(a)).digest();
    const bufB = crypto.createHash('sha256').update(String(b)).digest();
    return crypto.timingSafeEqual(bufA, bufB);
}

// ---------- Login rate limiting ----------
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const loginFailures = new Map(); // ip -> { count, firstAt }

function isLoginBlocked(ip) {
    const entry = loginFailures.get(ip);
    if (!entry) return false;
    if (Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
        loginFailures.delete(ip);
        return false;
    }
    return entry.count >= LOGIN_MAX_FAILURES;
}

function recordLoginFailure(ip) {
    const entry = loginFailures.get(ip);
    if (!entry || Date.now() - entry.firstAt > LOGIN_WINDOW_MS) {
        loginFailures.set(ip, { count: 1, firstAt: Date.now() });
    } else {
        entry.count += 1;
    }
}

// Auth Middleware
function requireAdmin(req, res, next) {
    if (isValidSession(readToken(req))) return next();
    return res.status(401).json({ success: false, message: 'Invalid or expired admin session' });
}

// ---------- Content validation ----------
// Button links may only be https/http, mailto/tel, or files uploaded to this server.
function isSafeUrl(url) {
    if (typeof url !== 'string') return false;
    const value = url.trim();
    if (!value) return true;
    if (/^(\/|\.\/)?uploads\/[\w.-]+$/i.test(value)) return true;
    return /^(https?:\/\/|mailto:|tel:)/i.test(value);
}

// Static Files — only the public assets, never the project source or data files.
const PUBLIC_FILES = ['index.html', 'logo.png', 'favicon.png', 'apple-touch-icon.png', 'calendar-data.js'];
app.use(['/uploads', '/inter2027/uploads'], express.static(UPLOADS_DIR, {
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff')
}));
PUBLIC_FILES.forEach((file) => {
    app.get([`/${file}`, `/inter2027/${file}`], (req, res) => {
        res.sendFile(path.join(__dirname, file));
    });
});

// ================= API ENDPOINTS =================

// Log in with email + password, or re-validate an existing session token
app.post(['/api/auth', '/inter2027/api/auth'], (req, res) => {
    const { email, password, token } = req.body || {};

    if (token) {
        if (isValidSession(String(token))) {
            return res.json({ success: true, message: 'Session valid', token, email: sessions.get(String(token)).email });
        }
        return res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }

    if (!PASSWORD_LOGIN_ENABLED) {
        return res.status(503).json({ success: false, message: 'Admin login is not configured on this server' });
    }

    const ip = req.ip;
    if (isLoginBlocked(ip)) {
        return res.status(429).json({ success: false, message: 'Too many failed attempts. Please try again in 15 minutes.' });
    }

    const inputEmail = String(email || '').trim().toLowerCase();
    const emailOk = safeEqual(inputEmail, ADMIN_EMAIL);
    const passwordOk = safeEqual(String(password || ''), ADMIN_PASSWORD);
    if (emailOk && passwordOk) {
        loginFailures.delete(ip);
        return res.json({ success: true, message: 'Authenticated successfully', token: createSession(ADMIN_EMAIL), email: ADMIN_EMAIL });
    }

    recordLoginFailure(ip);
    return res.status(401).json({ success: false, message: 'Incorrect email or password' });
});

// Which sign-in methods the admin page should offer
app.get(['/api/auth-config', '/inter2027/api/auth-config'], (req, res) => {
    res.json({ microsoft: AZURE_ENABLED, password: PASSWORD_LOGIN_ENABLED });
});

// ---------- Microsoft Entra ID sign-in (OpenID Connect authorization code flow + PKCE) ----------
const OIDC_STATE_TTL_MS = 10 * 60 * 1000;
const pendingLogins = new Map(); // state -> { verifier, nonce, redirectUri, adminUrl, expiresAt }

function base64Url(buffer) {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Public base path ('' or '/inter2027'). A reverse proxy may strip the prefix before it reaches us,
// so prefer the path of the configured redirect URI.
function requestBasePath(req) {
    if (AZURE_REDIRECT_URI) {
        try {
            return new URL(AZURE_REDIRECT_URI).pathname.replace(/\/auth\/microsoft\/callback\/?$/, '');
        } catch (err) { /* fall through */ }
    }
    return req.originalUrl.startsWith('/inter2027/') ? '/inter2027' : '';
}

function microsoftRedirectUri(req) {
    if (AZURE_REDIRECT_URI) return AZURE_REDIRECT_URI;
    const proto = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${proto}://${host}${requestBasePath(req)}/auth/microsoft/callback`;
}

function adminRedirect(res, adminUrl, params) {
    res.redirect(`${adminUrl}#${new URLSearchParams(params).toString()}`);
}

app.get(['/auth/microsoft', '/inter2027/auth/microsoft'], (req, res) => {
    if (!AZURE_ENABLED) return res.status(503).send('Microsoft sign-in is not configured on this server');

    const now = Date.now();
    pendingLogins.forEach((value, key) => { if (value.expiresAt < now) pendingLogins.delete(key); });

    const state = base64Url(crypto.randomBytes(24));
    const nonce = base64Url(crypto.randomBytes(24));
    const verifier = base64Url(crypto.randomBytes(48));
    const redirectUri = microsoftRedirectUri(req);
    pendingLogins.set(state, {
        verifier, nonce, redirectUri,
        adminUrl: `${requestBasePath(req)}/admin`,
        expiresAt: now + OIDC_STATE_TTL_MS
    });

    const params = new URLSearchParams({
        client_id: AZURE_CLIENT_ID,
        response_type: 'code',
        redirect_uri: redirectUri,
        response_mode: 'query',
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: base64Url(crypto.createHash('sha256').update(verifier).digest()),
        code_challenge_method: 'S256',
        prompt: 'select_account'
    });
    res.redirect(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/authorize?${params}`);
});

app.get(['/auth/microsoft/callback', '/inter2027/auth/microsoft/callback'], async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;
    const pending = pendingLogins.get(String(state || ''));
    pendingLogins.delete(String(state || ''));
    const adminUrl = pending ? pending.adminUrl : `${requestBasePath(req)}/admin`;

    if (error) return adminRedirect(res, adminUrl, { error: String(errorDescription || error).split('\n')[0] });
    if (!pending || pending.expiresAt < Date.now() || !code) {
        return adminRedirect(res, adminUrl, { error: 'Sign-in request expired. Please try again.' });
    }

    try {
        const tokenRes = await fetch(`https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: AZURE_CLIENT_ID,
                client_secret: AZURE_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: String(code),
                redirect_uri: pending.redirectUri,
                code_verifier: pending.verifier,
                scope: 'openid profile email'
            })
        });
        const tokens = await tokenRes.json();
        if (!tokenRes.ok || !tokens.id_token) {
            console.warn('[auth] Microsoft token exchange failed:', tokens.error, tokens.error_description);
            return adminRedirect(res, adminUrl, { error: 'Microsoft sign-in failed. Please try again.' });
        }

        // The ID token came straight from Microsoft's token endpoint over TLS, so its claims are trusted;
        // still check it was issued for this app, this tenant and this login attempt.
        const claims = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString('utf-8'));
        if (claims.aud !== AZURE_CLIENT_ID || claims.tid !== AZURE_TENANT_ID || claims.nonce !== pending.nonce
            || (claims.exp * 1000) < Date.now()) {
            return adminRedirect(res, adminUrl, { error: 'Microsoft sign-in could not be verified.' });
        }

        const email = String(claims.preferred_username || claims.email || claims.upn || '').trim().toLowerCase();
        if (!isRegisteredUser(email)) {
            console.warn(`[auth] Microsoft account not allowed into admin: ${email}`);
            return adminRedirect(res, adminUrl, { error: `${email || 'This account'} is not registered. Ask an administrator to add this email under Users.` });
        }

        return adminRedirect(res, adminUrl, { token: createSession(email), email });
    } catch (err) {
        console.error('[auth] Microsoft sign-in error:', err);
        return adminRedirect(res, adminUrl, { error: 'Microsoft sign-in failed. Please try again.' });
    }
});

// ---------- Admin user management ----------
function sessionEmail(req) {
    const session = sessions.get(readToken(req));
    return session ? session.email : '';
}

app.get(['/api/users', '/inter2027/api/users'], requireAdmin, (req, res) => {
    res.json({ success: true, users: readUsers(), currentEmail: sessionEmail(req) });
});

app.post(['/api/users', '/inter2027/api/users'], requireAdmin, (req, res) => {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    const users = readUsers();
    if (users.some((u) => u.email === email)) {
        return res.status(409).json({ success: false, message: `${email} is already registered.` });
    }
    users.push({ email, addedAt: new Date().toISOString(), addedBy: sessionEmail(req) });
    writeUsers(users);
    return res.json({ success: true, users });
});

app.post(['/api/users/update', '/inter2027/api/users/update'], requireAdmin, (req, res) => {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    const newEmail = String((req.body || {}).newEmail || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(newEmail) || newEmail.length > 254) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (email === sessionEmail(req)) {
        return res.status(400).json({ success: false, message: 'You cannot change your own account.' });
    }
    const users = readUsers();
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (newEmail !== email && users.some((u) => u.email === newEmail)) {
        return res.status(409).json({ success: false, message: `${newEmail} is already registered.` });
    }
    user.email = newEmail;
    writeUsers(users);
    // The old address can no longer be used to stay signed in.
    sessions.forEach((session, token) => { if (session.email === email) sessions.delete(token); });
    return res.json({ success: true, users });
});

app.post(['/api/users/delete', '/inter2027/api/users/delete'], requireAdmin, (req, res) => {
    const email = String((req.body || {}).email || '').trim().toLowerCase();
    if (email === sessionEmail(req)) {
        return res.status(400).json({ success: false, message: 'You cannot remove your own account.' });
    }
    const users = readUsers();
    const remaining = users.filter((u) => u.email !== email);
    if (remaining.length === users.length) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }
    writeUsers(remaining);
    // Sign the removed user out everywhere.
    sessions.forEach((session, token) => { if (session.email === email) sessions.delete(token); });
    return res.json({ success: true, users: remaining });
});

// Log out (invalidate the current session token)
app.post(['/api/logout', '/inter2027/api/logout'], (req, res) => {
    sessions.delete(readToken(req));
    return res.json({ success: true });
});

// GET Content
app.get(['/api/content', '/inter2027/api/content'], (req, res) => {
    try {
        if (!fs.existsSync(CONTENT_FILE)) {
            return res.json(defaultContent);
        }
        const data = fs.readFileSync(CONTENT_FILE, 'utf-8');
        return res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading content:', err);
        return res.status(500).json({ success: false, message: 'Failed to read content' });
    }
});

// POST Update Content
app.post(['/api/content', '/inter2027/api/content'], requireAdmin, (req, res) => {
    try {
        const { calendarHeaderData, customSections } = req.body;
        if (!calendarHeaderData || !Array.isArray(customSections)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        const unsafe = customSections.some((sec) =>
            Array.isArray(sec && sec.buttons) && sec.buttons.some((b) => !isSafeUrl(b && b.url))
        );
        if (unsafe) {
            return res.status(400).json({ success: false, message: 'Button links must start with https://, http://, mailto:, tel: or be an uploaded file' });
        }

        const dataToSave = {
            calendarHeaderData,
            customSections
        };

        fs.writeFileSync(CONTENT_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
        return res.json({ success: true, message: 'Content saved successfully', data: dataToSave });
    } catch (err) {
        console.error('Error writing content:', err);
        return res.status(500).json({ success: false, message: 'Failed to save content' });
    }
});

// POST Reset Content to Default
app.post(['/api/reset', '/inter2027/api/reset'], requireAdmin, (req, res) => {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf-8');
        return res.json({ success: true, message: 'Content reset to default', data: defaultContent });
    } catch (err) {
        console.error('Error resetting content:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset content' });
    }
});

// POST File Upload
app.post(['/api/upload', '/inter2027/api/upload'], requireAdmin, (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File size exceeds 20MB limit' });
            }
            return res.status(400).json({ success: false, message: err.message });
        } else if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        return res.json({
            success: true,
            url: fileUrl,
            filename: req.file.originalname,
            size: req.file.size
        });
    });
});

// POST Delete File
app.post(['/api/delete-file', '/inter2027/api/delete-file'], requireAdmin, (req, res) => {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string' || !url.includes('/uploads/')) {
            return res.status(400).json({ success: false, message: 'Invalid file path' });
        }
        const filename = path.basename(url.split('?')[0]);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return res.json({ success: true, message: 'File deleted successfully' });
    } catch (err) {
        console.error('Error deleting file:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete file' });
    }
});

// Admin Portal Route
app.get(['/admin', '/inter2027/admin'], (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ---------- Calendar (.ics) routes, built from calendar-data.js ----------
const ICS_TIMESTAMP = '20261001T000000Z';

function escapeIcsText(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/\r?\n/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
}

const compactDate = (dateString) => dateString.replace(/-/g, '');

function nextDate(dateString) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

function icsHeader(calendarName, extra = []) {
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Faculty of Nursing Chiang Mai University//SVSM Nursing Conference 2027//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:${escapeIcsText(calendarName)}`,
        ...extra
    ];
}

function conferenceEventLines() {
    const c = CALENDAR_DATA.conference;
    const description = [
        c.title,
        `"${c.theme}"`,
        '',
        `Dates: ${c.displayDate}`,
        `Venue: ${c.location}`,
        '',
        'Organized by the Faculty of Nursing, Chiang Mai University',
        '',
        CALENDAR_DATA.website
    ].join('\n');
    return [
        'BEGIN:VEVENT',
        'UID:svsm-nursing-conference-2027@nurse.cmu.ac.th',
        `DTSTAMP:${ICS_TIMESTAMP}`,
        `DTSTART;VALUE=DATE:${compactDate(c.startDate)}`,
        `DTEND;VALUE=DATE:${compactDate(c.endDateExclusive)}`,
        `SUMMARY:${escapeIcsText(c.fullTitle)}`,
        `LOCATION:${escapeIcsText(c.location)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        `URL:${CALENDAR_DATA.website}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
    ];
}

function keyDateEventLines(keyDate) {
    const slug = keyDate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const title = CALENDAR_DATA.conference.title;
    return [
        'BEGIN:VEVENT',
        `UID:${slug}-${compactDate(keyDate.date)}@nurse.cmu.ac.th`,
        `DTSTAMP:${ICS_TIMESTAMP}`,
        `DTSTART;VALUE=DATE:${compactDate(keyDate.date)}`,
        `DTEND;VALUE=DATE:${compactDate(nextDate(keyDate.date))}`,
        `SUMMARY:${escapeIcsText(`${keyDate.title} — ${title}`)}`,
        `DESCRIPTION:${escapeIcsText(`${keyDate.title} for the ${title}. Visit ${CALENDAR_DATA.website} for further details.`)}`,
        `URL:${CALENDAR_DATA.website}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
    ];
}

function sendIcs(res, lines, filename) {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(lines.join('\r\n'));
}

// Main conference event (Apple Calendar opens this directly)
app.get(['/event.ics', '/inter2027/event.ics'], (req, res) => {
    sendIcs(res, [...icsHeader(CALENDAR_DATA.conference.title), ...conferenceEventLines(), 'END:VCALENDAR'],
        '2027-svsm-nursing-conference.ics');
});

// Single key date, e.g. /key-date.ics?d=20261115
app.get(['/key-date.ics', '/inter2027/key-date.ics'], (req, res) => {
    const keyDate = CALENDAR_DATA.keyDates.find((k) => compactDate(k.date) === String(req.query.d || ''));
    if (!keyDate) return res.status(404).send('Unknown key date');
    sendIcs(res, [...icsHeader(CALENDAR_DATA.conference.title), ...keyDateEventLines(keyDate), 'END:VCALENDAR'],
        `2027-svsm-${compactDate(keyDate.date)}.ics`);
});

// Complete feed: conference plus all key dates (importable / subscribable)
app.get(['/all-events.ics', '/inter2027/all-events.ics'], (req, res) => {
    const lines = icsHeader(`${CALENDAR_DATA.conference.title} — Complete Calendar`, ['X-PUBLISHED-TTL:PT6H']);
    CALENDAR_DATA.keyDates.forEach((k) => lines.push(...keyDateEventLines(k)));
    lines.push(...conferenceEventLines(), 'END:VCALENDAR');
    sendIcs(res, lines, '2027-svsm-complete-calendar.ics');
});

// Catch-all: every other path (/, /inter2027, /inter2027/, ...) serves the landing page.
// Express 5 needs a named wildcard; the braces make it match "/" as well.
app.get('/{*path}', (req, res) => {
    // Missing uploads and unknown API routes are real 404s, not the landing page.
    if (/^\/(inter2027\/)?(api|uploads)(\/|$)/.test(req.path)) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`CMU Conference Landing server running on http://localhost:${PORT}`);
});
