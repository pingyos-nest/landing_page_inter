/**
 * Central configuration for the 2027 International Nursing Conference.
 * Single source of truth for all calendar integrations and UI presentation.
 */

export interface ConferenceEventConfig {
  title: string;
  theme: string;
  startDate: string;         // 'YYYY-MM-DD'
  displayEndDate: string;    // 'YYYY-MM-DD'
  endDateExclusive: string;  // 'YYYY-MM-DD' (midnight boundary for exclusive calendar models)
  allDay: boolean;
  location: string;
  organizer: string;
  organizerFull: string;
  details: string;
  website: string;
  formattedDateRange: string;
}

export const conferenceEvent: ConferenceEventConfig = {
  title: '2027 International Nursing Conference',

  theme:
    'Shared Vision, Shared Mission: Illuminating the Future of Nursing for a Sustainable World',

  startDate: '2027-11-11',

  displayEndDate: '2027-11-12',

  endDateExclusive: '2027-11-13',

  allDay: true,

  location: 'Chiang Mai, Thailand',

  organizer: 'Faculty of Nursing, Chiang Mai University',

  organizerFull: 'Faculty of Nursing, Chiang Mai University',

  details: 'Further details will be announced soon.',

  website: 'https://www.nurse.cmu.ac.th/',

  formattedDateRange: '11–12 November 2027',
};

/**
 * Builds the standard description/notes text used across all calendar providers.
 */
export function buildConferenceDescription(event: ConferenceEventConfig = conferenceEvent): string {
  return [
    event.theme,
    '',
    `Dates: ${event.formattedDateRange}`,
    `Location: ${event.location}`,
    '',
    `Organized by the ${event.organizer}`,
    '',
    event.details,
    event.website,
  ].join('\n');
}
