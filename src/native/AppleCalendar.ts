/**
 * TypeScript interface and React Native bridge for the native Apple Calendar module.
 * Communicates with AppleCalendarModule (iOS EventKit / EventKitUI).
 */

import { NativeModules, Platform } from 'react-native';

export interface AppleCalendarEvent {
  title: string;
  location?: string;
  notes?: string;
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  allDay: boolean;
}

export interface AppleCalendarModuleInterface {
  presentEventEditor(event: AppleCalendarEvent): Promise<boolean>;
}

const { AppleCalendarModule } = NativeModules;

export const AppleCalendar: AppleCalendarModuleInterface = {
  async presentEventEditor(event: AppleCalendarEvent): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      throw new Error('AppleCalendar is only supported on iOS.');
    }

    if (!AppleCalendarModule || !AppleCalendarModule.presentEventEditor) {
      throw new Error(
        'AppleCalendarModule is not linked or unavailable. Ensure the native iOS bridge is compiled.'
      );
    }

    try {
      return await AppleCalendarModule.presentEventEditor(event);
    } catch (error: any) {
      // Re-throw with descriptive message
      const code = error?.code || 'UNKNOWN_ERROR';
      const message = error?.message || 'Unable to open Apple Calendar.';
      const customError: any = new Error(message);
      customError.code = code;
      throw customError;
    }
  },
};
