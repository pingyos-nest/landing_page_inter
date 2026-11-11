/**
 * Single source of truth for the conference and key dates.
 * Loaded by index.html (<script src="calendar-data.js">) and by server.js (require).
 */
(function (root) {
    const CALENDAR_DATA = {
        website: 'https://www.nurse.cmu.ac.th/',
        conference: {
            title: '2027 SVSM Nursing Conference',
            fullTitle: '2027 SVSM Nursing Conference, Chiang Mai, Thailand, Organized by Faculty of Nursing, Chiang Mai University',
            theme: 'Shared Vision, Shared Mission: Illuminating the Future of Nursing for a Sustainable World',
            startDate: '2027-11-11',
            endDateExclusive: '2027-11-13',
            displayDate: '11–12 November 2027',
            location: 'The Empress Hotel, Chiang Mai, Thailand'
        },
        keyDates: [
            { title: 'Abstract Submission Opens', date: '2026-11-15', displayDate: '15 November 2026' },
            { title: 'Abstract Submission Deadline', date: '2027-02-28', displayDate: '28 February 2027' },
            { title: 'Early Bird Registration Deadline', date: '2027-04-30', displayDate: '30 April 2027' },
            { title: 'Regular Registration Deadline', date: '2027-07-31', displayDate: '31 July 2027' }
        ]
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = CALENDAR_DATA;
    } else {
        root.CALENDAR_DATA = CALENDAR_DATA;
    }
})(this);
