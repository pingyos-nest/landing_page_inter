/**
 * Safe analytics service wrapper.
 * Mirrors GA4 events previously tracked in the web application.
 * Guarded so analytics failures never interrupt calendar actions.
 */

export interface AnalyticsEventParams {
  [key: string]: any;
}

class AnalyticsService {
  /**
   * Dispatches an analytics event safely.
   */
  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    try {
      if (__DEV__) {
        // Log in development for testing & verification
        // eslint-disable-next-line no-console
        console.log(`[Analytics] Track Event: ${eventName}`, params);
      }

      // If Google Analytics (e.g., @react-native-firebase/analytics) or similar is added,
      // hook it in here:
      // analytics().logEvent(eventName, params);
    } catch (e) {
      // Analytics failure must never disrupt calendar actions
    }
  }
}

export const analyticsService = new AnalyticsService();
