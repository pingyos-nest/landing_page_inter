const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 80;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin1234';

// Directories setup
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const CONTENT_FILE = path.join(DATA_DIR, 'content.json');

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
        subtitle: "Choose your preferred calendar service"
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

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        // Sanitize and create unique timestamped name
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}_${cleanName}`);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50 MB limit
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Auth Middleware
function requireAdmin(req, res, next) {
    const authHeader = req.headers['x-admin-password'] || req.headers['authorization'];
    if (authHeader === ADMIN_PASSWORD || authHeader === `Bearer ${ADMIN_PASSWORD}`) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'Invalid or missing admin password' });
}

// Static Files
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname));

// ================= API ENDPOINTS =================

// Check / Verify Admin Password
app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, message: 'Authenticated successfully' });
    }
    return res.status(401).json({ success: false, message: 'Incorrect admin password' });
});

// GET Content
app.get('/api/content', (req, res) => {
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
app.post('/api/content', requireAdmin, (req, res) => {
    try {
        const { calendarHeaderData, customSections } = req.body;
        if (!calendarHeaderData || !Array.isArray(customSections)) {
            return res.status(400).json({ success: false, message: 'Invalid data format' });
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
app.post('/api/reset', requireAdmin, (req, res) => {
    try {
        fs.writeFileSync(CONTENT_FILE, JSON.stringify(defaultContent, null, 2), 'utf-8');
        return res.json({ success: true, message: 'Content reset to default', data: defaultContent });
    } catch (err) {
        console.error('Error resetting content:', err);
        return res.status(500).json({ success: false, message: 'Failed to reset content' });
    }
});

// POST File Upload
app.post('/api/upload', requireAdmin, upload.single('file'), (req, res) => {
    try {
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
    } catch (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ success: false, message: 'File upload failed' });
    }
});

// Catch-all route to serve index.html (Express 5 compatibility)
app.get('/{0,}', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`CMU Conference Landing server running on http://localhost:${PORT}`);
});
