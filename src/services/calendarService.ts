/**
 * Service for generating calendar provider URLs and launching calendar integrations.
 */

import { Linking, Alert, Platform } from 'react-native';
import {
  conferenceEvent,
  ConferenceEventConfig,
  buildConferenceDescription,
} from '../constants/conferenceEvent';
import { AppleCalendar } from '../native/AppleCalendar';
import { analyticsService } from './analyticsService';

/**
 * Strips hyphens from 'YYYY-MM-DD' to produce 'YYYYMMDD' for Google Calendar.
 */
export function formatDateForGoogle(dateStr: string): string {
  return dateStr.replace(/-/g, '');
}

/**
 * Builds dynamic Google Calendar template URL with proper parameter encoding.
 * All-day events in Google Calendar use dates=YYYYMMDD/YYYYMMDD (exclusive end date).
 * For Nov 11–12, 2027: dates=20271111/20271113
 */
export function buildGoogleCalendarUrl(
  event: ConferenceEventConfig = conferenceEvent
): string {
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const startCompact = formatDateForGoogle(event.startDate);
  const endExclusiveCompact = formatDateForGoogle(event.endDateExclusive);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${startCompact}/${endExclusiveCompact}`,
    location: event.location,
    details: buildConferenceDescription(event),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Builds dynamic Microsoft Outlook calendar compose deep-link URL.
 * Outlook all-day events use startdt=YYYY-MM-DDT00:00:00 & enddt=YYYY-MM-DDT00:00:00 (exclusive) & allday=true.
 * For Nov 11–12, 2027: startdt=2027-11-11T00:00:00 & enddt=2027-11-13T00:00:00
 */
export function buildOutlookCalendarUrl(
  event: ConferenceEventConfig = conferenceEvent
): string {
  const baseUrl = 'https://outlook.live.com/calendar/0/deeplink/compose';

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: `${event.startDate}T00:00:00`,
    enddt: `${event.endDateExclusive}T00:00:00`,
    allday: 'true',
    location: event.location,
    body: buildConferenceDescription(event),
  });

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Builds Android Calendar Intent URL or view URI as a fallback.
 */
export function buildAndroidCalendarIntentUrl(
  event: ConferenceEventConfig = conferenceEvent
): string {
  // Use Google Calendar web template as safe universal fallback or content URI intent
  return buildGoogleCalendarUrl(event);
}

/**
 * Safely opens an external URL using Linking, verifying canOpenURL first.
 */
export async function safeOpenUrl(url: string, errorFallbackMessage?: string): Promise<boolean> {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert(
        'Unable to Open Link',
        errorFallbackMessage || 'Your device does not have an app to handle this link.',
        [{ text: 'OK' }]
      );
      return false;
    }
  } catch (error) {
    Alert.alert(
      'Error',
      'An unexpected error occurred while opening the link. Please try again later.',
      [{ text: 'OK' }]
    );
    return false;
  }
}

/**
 * Calendar action handlers
 */
export const calendarService = {
  /**
   * Add to Google Calendar
   */
  async addToGoogleCalendar(event: ConferenceEventConfig = conferenceEvent): Promise<void> {
    analyticsService.trackEvent('calendar_google_click', {
      calendar_type: 'Google Calendar',
      event_category: 'Calendar',
      event_label: 'Google Calendar',
    });

    const url = buildGoogleCalendarUrl(event);
    await safeOpenUrl(url, 'Could not open Google Calendar. Please check your browser or network connection.');
  },

  /**
   * Add to Microsoft Outlook
   */
  async addToOutlookCalendar(event: ConferenceEventConfig = conferenceEvent): Promise<void> {
    analyticsService.trackEvent('calendar_outlook_click', {
      calendar_type: 'Microsoft Outlook',
      event_category: 'Calendar',
      event_label: 'Microsoft Outlook',
    });

    const url = buildOutlookCalendarUrl(event);
    await safeOpenUrl(url, 'Could not open Microsoft Outlook Calendar. Please check your browser or network connection.');
  },

  /**
   * Add to Apple Calendar on iOS using native EventKit / EventKitUI
   */
  async addToAppleCalendar(event: ConferenceEventConfig = conferenceEvent): Promise<void> {
    analyticsService.trackEvent('calendar_apple_click', {
      calendar_type: 'Apple Calendar Native',
      event_category: 'Calendar',
      event_label: 'Apple Calendar',
    });

    if (Platform.OS === 'ios') {
      try {
        await AppleCalendar.presentEventEditor({
          title: event.title,
          location: event.location,
          notes: buildConferenceDescription(event),
          startDate: event.startDate,
          endDate: event.endDateExclusive,
          allDay: event.allDay,
        });
      } catch (err: any) {
        const message = err?.message || 'Unable to open Apple Calendar. Please check your Calendar permissions.';
        Alert.alert('Apple Calendar', message, [{ text: 'OK' }]);
      }
    } else {
      // Android fallback: Open Google Calendar or device calendar
      Alert.alert(
        'Apple Calendar',
        'Apple Calendar is only supported on iOS devices. Opening calendar in browser instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Google Calendar',
            onPress: () => calendarService.addToGoogleCalendar(event),
          },
        ]
      );
    }
  },

  /**
   * Open the official conference website
   */
  async openConferenceWebsite(event: ConferenceEventConfig = conferenceEvent): Promise<void> {
    analyticsService.trackEvent('conference_website_click', {
      event_category: 'Outbound Link',
      event_label: 'CMU Nurse Website',
      destination_url: event.website,
    });

    await safeOpenUrl(event.website, 'Could not open conference website.');
  },
};
