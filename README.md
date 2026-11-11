# 2027 International Nursing Conference — Landing Page

Landing page and admin panel for the **2027 International Nursing Conference** "Add to Calendar" experience (Google Calendar, Microsoft Outlook and Apple Calendar via `.ics`).

- **Dates:** 11–12 November 2027 (all-day)
- **Venue:** The Empress Hotel, Chiang Mai, Thailand
- **Organizer:** Faculty of Nursing, Chiang Mai University — [https://www.nurse.cmu.ac.th/](https://www.nurse.cmu.ac.th/)

## Project structure

```text
├── server.js           # Express server: pages, admin API, uploads, .ics routes
├── index.html          # Public landing page
├── admin.html          # Admin panel (edit sections, upload files)
├── calendar-data.js    # Conference and key dates (shared by page and server)
├── logo.png
├── data/
│   ├── content.json    # Editable page content (saved from admin)
│   └── uploads/        # Files uploaded from admin
├── Dockerfile
└── docker-compose.yml
```

## Running

```bash
npm install
npm start               # http://localhost:80 (set PORT to change)

# or with Docker
docker compose up -d --build   # http://localhost:4401
```

## Admin credentials

Admin login reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from the environment only.
Copy `.env.example` to `.env` and set a strong password (`.env` is git-ignored and
loaded automatically by `server.js` and by `docker-compose`). If they are not set,
admin login is disabled.

## Calendar dates

All conference and key dates live in `calendar-data.js`. Both the landing page and
the `.ics` routes (`/event.ics`, `/key-date.ics?d=YYYYMMDD`, `/all-events.ics`) read
from it, so a date change only needs to be made there.
