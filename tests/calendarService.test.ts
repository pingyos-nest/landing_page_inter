import {
  conferenceEvent,
  buildConferenceDescription,
} from '../src/constants/conferenceEvent';
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  formatDateForGoogle,
} from '../src/services/calendarService';

describe('2027 International Nursing Conference Calendar Service', () => {
  test('Conference Event constants maintain single source of truth and correct dates', () => {
    expect(conferenceEvent.title).toBe('2027 International Nursing Conference');
    expect(conferenceEvent.startDate).toBe('2027-11-11');
    expect(conferenceEvent.displayEndDate).toBe('2027-11-12');
    expect(conferenceEvent.endDateExclusive).toBe('2027-11-13');
    expect(conferenceEvent.allDay).toBe(true);
    expect(conferenceEvent.location).toBe('Chiang Mai, Thailand');
    expect(conferenceEvent.formattedDateRange).toBe('11–12 November 2027');
  });

  test('formatDateForGoogle converts YYYY-MM-DD to YYYYMMDD', () => {
    expect(formatDateForGoogle('2027-11-11')).toBe('20271111');
    expect(formatDateForGoogle('2027-11-13')).toBe('20271113');
  });

  test('Google Calendar URL format adheres to exclusive end date 20271111/20271113', () => {
    const url = buildGoogleCalendarUrl(conferenceEvent);
    const parsedUrl = new URL(url);

    expect(parsedUrl.origin).toBe('https://calendar.google.com');
    expect(parsedUrl.pathname).toBe('/calendar/render');
    expect(parsedUrl.searchParams.get('action')).toBe('TEMPLATE');
    expect(parsedUrl.searchParams.get('text')).toBe('2027 International Nursing Conference');
    // Critical: dates must be 20271111/20271113 so Google shows Nov 11–12
    expect(parsedUrl.searchParams.get('dates')).toBe('20271111/20271113');
    expect(parsedUrl.searchParams.get('location')).toBe('Chiang Mai, Thailand');

    const details = parsedUrl.searchParams.get('details');
    expect(details).toContain(conferenceEvent.theme);
    expect(details).toContain('Faculty of Nursing, Chiang Mai University');
    expect(details).toContain('https://www.nurse.cmu.ac.th/');
  });

  test('Microsoft Outlook URL format uses ISO timestamps and exclusive midnight boundary', () => {
    const url = buildOutlookCalendarUrl(conferenceEvent);
    const parsedUrl = new URL(url);

    expect(parsedUrl.origin).toBe('https://outlook.live.com');
    expect(parsedUrl.pathname).toBe('/calendar/0/deeplink/compose');
    expect(parsedUrl.searchParams.get('path')).toBe('/calendar/action/compose');
    expect(parsedUrl.searchParams.get('rru')).toBe('addevent');
    expect(parsedUrl.searchParams.get('subject')).toBe('2027 International Nursing Conference');
    expect(parsedUrl.searchParams.get('startdt')).toBe('2027-11-11T00:00:00');
    expect(parsedUrl.searchParams.get('enddt')).toBe('2027-11-13T00:00:00');
    expect(parsedUrl.searchParams.get('allday')).toBe('true');
    expect(parsedUrl.searchParams.get('location')).toBe('Chiang Mai, Thailand');

    const body = parsedUrl.searchParams.get('body');
    expect(body).toContain(conferenceEvent.theme);
    expect(body).toContain('https://www.nurse.cmu.ac.th/');
  });

  test('Conference description builder formats consistent multi-line text', () => {
    const description = buildConferenceDescription(conferenceEvent);
    expect(description).toContain('Shared Vision, Shared Mission');
    expect(description).toContain('Dates: 11–12 November 2027');
    expect(description).toContain('Location: Chiang Mai, Thailand');
    expect(description).toContain('Faculty of Nursing, Chiang Mai University');
    expect(description).toContain('https://www.nurse.cmu.ac.th/');
  });
});
